/**
 * Enterprise Security Manager & Policy Enforcement Engine
 * Centralized RBAC, Resource Scope Verification, and Field-Level Security (FLS) DTO shaping.
 */
import { ATS_ROLES, PERMISSIONS } from '../../components/recruitment/candidates/candidateTypes.js';


// Complete Enterprise RBAC Permission Matrix
const ROLE_PERMISSIONS = {
  [ATS_ROLES.ATS_ADMIN]: Object.values(PERMISSIONS),
  [ATS_ROLES.HR_ADMIN]: [
    PERMISSIONS.CANDIDATE_READ,
    PERMISSIONS.CANDIDATE_CREATE,
    PERMISSIONS.CANDIDATE_UPDATE,
    PERMISSIONS.CANDIDATE_ARCHIVE,
    PERMISSIONS.CANDIDATE_RESTORE,
    PERMISSIONS.CANDIDATE_EXPORT,
    PERMISSIONS.CANDIDATE_HISTORY_READ,
    PERMISSIONS.CANDIDATE_DOCUMENTS_READ,
    PERMISSIONS.CANDIDATE_DOCUMENTS_MANAGE,
    PERMISSIONS.CANDIDATE_APPLICATION_CREATE,
    PERMISSIONS.CANDIDATE_APPLICATION_MOVE,
    PERMISSIONS.CANDIDATE_OVERRIDE,
    PERMISSIONS.CANDIDATE_ASSIGN,
    PERMISSIONS.CANDIDATE_NOTES_READ,
    PERMISSIONS.CANDIDATE_NOTES_MANAGE
  ],
  [ATS_ROLES.RECRUITER]: [
    PERMISSIONS.CANDIDATE_READ,
    PERMISSIONS.CANDIDATE_CREATE,
    PERMISSIONS.CANDIDATE_UPDATE,
    PERMISSIONS.CANDIDATE_EXPORT,
    PERMISSIONS.CANDIDATE_HISTORY_READ,
    PERMISSIONS.CANDIDATE_DOCUMENTS_READ,
    PERMISSIONS.CANDIDATE_DOCUMENTS_MANAGE,
    PERMISSIONS.CANDIDATE_APPLICATION_CREATE,
    PERMISSIONS.CANDIDATE_APPLICATION_MOVE,
    PERMISSIONS.CANDIDATE_ASSIGN,
    PERMISSIONS.CANDIDATE_NOTES_READ,
    PERMISSIONS.CANDIDATE_NOTES_MANAGE
  ],
  [ATS_ROLES.HIRING_MANAGER]: [
    PERMISSIONS.CANDIDATE_READ,
    PERMISSIONS.CANDIDATE_HISTORY_READ,
    PERMISSIONS.CANDIDATE_DOCUMENTS_READ,
    PERMISSIONS.CANDIDATE_NOTES_READ,
    PERMISSIONS.CANDIDATE_NOTES_MANAGE
  ],
  [ATS_ROLES.EMPLOYEE]: [
    PERMISSIONS.CANDIDATE_HISTORY_READ
  ]
};

export const SecurityManager = {
  /**
   * Evaluates whether the user context holds the requested permission.
   * Fails closed: returns false if userContext is missing or invalid.
   */
  hasPermission: (userContext, permission) => {
    if (!userContext || !userContext.role) return false;
    const role = userContext.role;
    if (role === ATS_ROLES.ATS_ADMIN || role === 'super_admin' || role === 'admin') return true;

    const granted = ROLE_PERMISSIONS[role] || [];
    return granted.includes(permission);
  },

  /**
   * Field-Level Security: shapes candidate record to strip sensitive data for unauthorized roles.
   * Fails closed: returns null if userContext is unauthenticated.
   */
  applyCandidateFLS: (candidate, userContext) => {
    if (!candidate) return null;
    if (!userContext || !userContext.role) return null; // Fail closed for unauthenticated callers

    const role = userContext.role;

    // Deep clone to prevent mutating in-memory cache directly
    const safeCand = JSON.parse(JSON.stringify(candidate));

    // 1. Strip Salary / CTC fields for Hiring Managers, Employees, Interviewers
    if (role === ATS_ROLES.HIRING_MANAGER || role === ATS_ROLES.EMPLOYEE || role === 'interviewer') {
      delete safeCand.expectedSalary;
      delete safeCand.currentSalary;
      delete safeCand.compensation;
      delete safeCand.compensationDetails;
      delete safeCand.salaryNotes;

      // Filter out private recruiter notes
      if (Array.isArray(safeCand.notes)) {
        safeCand.notes = safeCand.notes.filter(n => !n.isPrivate);
      }

      // Filter out internal sensitive documents (e.g. background check, salary slips)
      if (Array.isArray(safeCand.documents)) {
        safeCand.documents = safeCand.documents.filter(d => 
          d.type === 'resume' || d.type === 'portfolio' || d.type === 'certificate'
        );
      }
    }

    // 2. Employees cannot see internal screening match scores or recruiter assignments
    if (role === ATS_ROLES.EMPLOYEE) {
      delete safeCand.screeningScore;
      delete safeCand.screeningBreakdown;
      delete safeCand.screeningOutcome;
      delete safeCand.assignedRecruiter;
    }

    return safeCand;
  },

  /**
   * Field-Level Security for Requisitions: protect confidential budget numbers.
   * Fails closed: returns null if unauthenticated.
   */
  applyRequisitionFLS: (requisition, userContext) => {
    if (!requisition) return null;
    if (!userContext || !userContext.role) return null;

    const role = userContext.role;
    const safeReq = { ...requisition };

    if (role === ATS_ROLES.EMPLOYEE) {
      delete safeReq.budgetMin;
      delete safeReq.budgetMax;
      delete safeReq.approvedBudget;
      delete safeReq.targetCompensation;
    }

    return safeReq;
  },

  /**
   * Field-Level Security for Interview Sessions: blind scorecard protection.
   * Fails closed: returns null if unauthenticated.
   */
  applyInterviewFLS: (session, userContext) => {
    if (!session) return null;
    if (!userContext || !userContext.role) return null;

    const role = userContext.role;
    const userEmail = userContext.email?.toLowerCase();
    const safeSession = JSON.parse(JSON.stringify(session));

    // Interviewer blind review: cannot see other interviewers' ratings until they submit their own
    if (role === 'interviewer' && userEmail) {
      const myScorecard = (safeSession.scorecards || []).find(
        sc => sc.interviewerEmail?.toLowerCase() === userEmail || sc.interviewerId === userContext.userId
      );
      const hasSubmitted = myScorecard?.status === 'SUBMITTED';

      if (!hasSubmitted && safeSession.scorecards) {
        safeSession.scorecards = safeSession.scorecards.map(sc => {
          if (sc.interviewerEmail?.toLowerCase() === userEmail || sc.interviewerId === userContext.userId) {
            return sc;
          }
          // Mask scores and comments from other panelists to prevent bias
          return {
            ...sc,
            overallRating: null,
            ratings: {},
            comments: '[Hidden until your scorecard is submitted]',
            recommendation: null
          };
        });
      }
    }

    return safeSession;
  },

  /**
   * Verifies resource ownership and assignment scope.
   * Fails closed: returns false if userContext is missing.
   */
  verifyScope: (resourceType, resource, userContext) => {
    if (!userContext || !userContext.role) return false;
    const role = userContext.role;

    // Super Admin & ATS Admin have global scope
    if (role === ATS_ROLES.ATS_ADMIN || role === 'super_admin' || role === 'admin') return true;

    // Hiring Manager scope verification
    if (role === ATS_ROLES.HIRING_MANAGER) {
      const allowedReqs = userContext.userRequisitions || [];
      if (resourceType === 'requisition') {
        return allowedReqs.includes(resource.id);
      }
      if (resourceType === 'application') {
        return allowedReqs.includes(resource.requisitionId);
      }
      if (resourceType === 'interview') {
        return allowedReqs.includes(resource.requisitionId);
      }
    }

    // Interviewer scope verification
    if (role === 'interviewer') {
      if (resourceType === 'interview') {
        return (resource.interviewers || []).some(
          i => i.email?.toLowerCase() === userContext.email?.toLowerCase() || i.id === userContext.userId
        );
      }
    }

    return true;
  },

  /**
   * Action authorization gate throwing explicit errors on violation.
   * Fails closed: requires authenticated userContext.
   */
  verifyAction: (action, userContext, resource = null) => {
    if (!userContext || !userContext.role) {
      const err = new Error('401 Unauthorized: Valid authentication is required to perform this action.');
      err.statusCode = 401;
      throw err;
    }

    const role = userContext.role;

    if (action === 'APPROVE_REQUISITION') {
      if (role !== ATS_ROLES.ATS_ADMIN && role !== ATS_ROLES.HIRING_MANAGER && role !== ATS_ROLES.HR_ADMIN && role !== 'dept_head') {
        const err = new Error('403 Forbidden: You are not authorized to approve this requisition.');
        err.statusCode = 403;
        throw err;
      }
    }

    if (action === 'SCHEDULE_INTERVIEW') {
      if (role === ATS_ROLES.EMPLOYEE) {
        const err = new Error('403 Forbidden: Employees are not authorized to schedule interview sessions.');
        err.statusCode = 403;
        throw err;
      }
    }

    if (action === 'SUBMIT_SCORECARD') {
      if (role === ATS_ROLES.EMPLOYEE) {
        const err = new Error('403 Forbidden: You are not an authorized interviewer on this panel.');
        err.statusCode = 403;
        throw err;
      }
    }

    if (action === 'VIEW_COMPENSATION') {
      if (role === ATS_ROLES.EMPLOYEE || role === ATS_ROLES.HIRING_MANAGER) {
        const err = new Error('403 Forbidden: Viewing sensitive compensation data is restricted.');
        err.statusCode = 403;
        throw err;
      }
    }

    return true;
  }
};
