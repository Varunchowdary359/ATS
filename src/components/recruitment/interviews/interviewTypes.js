/**
 * Enterprise ATS Interview Domain Types, Enums & Configurations
 * PeopleWorks SaaS - Interview Module Centralized Permission & Role Governance Engine
 */

export const INTERVIEW_ROLES = {
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring_manager',
  INTERVIEWER: 'interviewer',
  HR_ADMIN: 'hr_admin',
  ATS_ADMIN: 'super_admin'
};

/**
 * Safely formats any Date, ISO string, or timestamp into local 'YYYY-MM-DD' without UTC timezone corruption.
 */
export const toLocalDateString = (d = new Date()) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const MOCK_PERSONAS = {
  [INTERVIEW_ROLES.RECRUITER]: {
    role: INTERVIEW_ROLES.RECRUITER,
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@peopleworks.internal',
    title: 'Lead Technical Recruiter',
    department: 'Talent Acquisition',
    id: 'INT-02',
    avatar: 'SJ',
    avatarBg: '#0284c7',
    label: 'Recruiter (Sarah Jenkins)'
  },
  [INTERVIEW_ROLES.HIRING_MANAGER]: {
    role: INTERVIEW_ROLES.HIRING_MANAGER,
    name: 'Alex Chen',
    email: 'alex.chen@peopleworks.internal',
    title: 'Engineering Director',
    department: 'Engineering',
    id: 'INT-01',
    avatar: 'AC',
    avatarBg: '#6366f1',
    userRequisitions: ['REQ-2026-001', 'REQ-2026-002'],
    label: 'Hiring Manager (Alex Chen)'
  },
  [INTERVIEW_ROLES.INTERVIEWER]: {
    role: INTERVIEW_ROLES.INTERVIEWER,
    name: 'Elena Rostova',
    email: 'elena.rostova@peopleworks.internal',
    title: 'Staff Frontend Engineer',
    department: 'Engineering',
    id: 'INT-04',
    avatar: 'ER',
    avatarBg: '#ec4899',
    label: 'Interviewer (Elena Rostova)'
  },
  [INTERVIEW_ROLES.HR_ADMIN]: {
    role: INTERVIEW_ROLES.HR_ADMIN,
    name: 'Priya Sharma',
    email: 'priya.sharma@peopleworks.internal',
    title: 'Senior HR Business Partner',
    department: 'People Operations',
    id: 'INT-06',
    avatar: 'PS',
    avatarBg: '#f59e0b',
    label: 'HR / HRBP (Priya Sharma)'
  },
  [INTERVIEW_ROLES.ATS_ADMIN]: {
    role: INTERVIEW_ROLES.ATS_ADMIN,
    name: 'ATS Admin',
    email: 'admin@peopleworks.internal',
    title: 'Super Admin',
    department: 'Governance & ATS Administration',
    id: 'ADMIN-01',
    avatar: 'SA',
    avatarBg: '#1e293b',
    label: 'Super Admin (ATS Admin)'
  }
};

export const ROUND_CATEGORY = {
  ASSESSMENT: 'Assessment',
  INTERVIEW: 'Interview',
  PANEL: 'Panel',
  TAKE_HOME: 'Take-Home Assignment',
  HR_CULTURE: 'HR & Culture'
};

export const ROUND_SUBTYPES = {
  // Assessment Subtypes
  APTITUDE_TEST: 'Aptitude Test',
  LOGICAL_REASONING: 'Logical Reasoning',
  QUANTITATIVE_ABILITY: 'Quantitative Ability',
  VERBAL_ABILITY: 'Verbal Ability',
  CODING_ASSESSMENT: 'Coding Assessment',
  MCQ_ASSESSMENT: 'MCQ Assessment',
  TECHNICAL_TEST: 'Technical Test',
  ASSIGNMENT: 'Assignment',
  CASE_STUDY: 'Case Study',
  TAKE_HOME_ASSIGNMENT: 'Take-Home Assignment',
  LANGUAGE_ASSESSMENT: 'Language Assessment',
  CUSTOM_ASSESSMENT: 'Custom Assessment',

  // Interview Subtypes
  RECRUITER_SCREENING: 'Recruiter Screening',
  TECHNICAL_INTERVIEW: 'Technical Interview',
  CODING_INTERVIEW: 'Coding Interview',
  SYSTEM_DESIGN: 'System Design',
  BEHAVIORAL_INTERVIEW: 'Behavioral Interview',
  FUNCTIONAL_INTERVIEW: 'Functional Interview',
  MANAGERIAL_INTERVIEW: 'Managerial Interview',
  LEADERSHIP_INTERVIEW: 'Leadership Interview',
  HR_INTERVIEW: 'HR Interview',
  CUSTOM_INTERVIEW: 'Custom Interview',

  // Panel Subtypes
  TECHNICAL_PANEL: 'Technical Panel',
  MANAGERIAL_PANEL: 'Managerial Panel',
  LEADERSHIP_PANEL: 'Leadership Panel',
  CROSS_FUNCTIONAL_PANEL: 'Cross-Functional Panel',
  CUSTOM_PANEL: 'Custom Panel'
};

export const INTERVIEW_TYPE = {
  VIDEO: 'Video',
  PHONE: 'Phone',
  IN_PERSON: 'In Person'
};

export const MEETING_PROVIDERS = {
  TEAMS: 'Microsoft Teams',
  GOOGLE_MEET: 'Google Meet',
  ZOOM: 'Zoom',
  CUSTOM: 'Custom Link',
  NONE: 'None / In-Person'
};

export const SESSION_STATUS = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  RESCHEDULED: 'Rescheduled',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show'
};

export const NO_SHOW_PARTY = {
  CANDIDATE: 'Candidate',
  INTERVIEWER: 'Interviewer',
  BOTH: 'Both'
};

export const FEEDBACK_STATUS = {
  NOT_STARTED: 'Not Started',
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  RETURNED: 'Returned',
  LOCKED: 'Locked'
};

export const SCORECARD_RECOMMENDATION = {
  STRONG_YES: 'Strong Yes',
  YES: 'Yes',
  NEUTRAL: 'Neutral',
  NO: 'No',
  STRONG_NO: 'Strong No'
};

export const ROUND_OUTCOME_DECISION = {
  PASS: 'Pass',
  FAIL: 'Fail',
  HOLD: 'Hold',
  CONTINUE: 'Continue',
  NOT_EVALUATED: 'Not Evaluated'
};

/**
 * Enterprise 2-Tier Final Candidate Decision Lifecycle
 * Tier 1: Hiring Manager submits Final Selection Recommendation
 * Tier 2: HR / HRBP validates compliance gate & releases to Offer Module
 */
export const FINAL_SELECTION_STATUS = {
  NOT_APPLICABLE: 'Not Applicable',
  PENDING_HM_RECOMMENDATION: 'Pending HM Recommendation',
  RECOMMENDED_BY_HM: 'Recommended by Hiring Manager',
  HR_APPROVED_READY_FOR_OFFER: 'HR Approved • Ready for Offer',
  HOLD: 'On Hold',
  REJECTED: 'Rejected'
};

export const FINAL_SELECTION_DECISION = {
  APPROVE: 'Recommend for Offer',
  HOLD: 'Place on Hold',
  REJECT: 'Reject Candidate'
};

export const EVALUATION_METHOD = {
  SCORECARD: 'Scorecard Rubric',
  RUBRIC_SCORED: 'Scorecard Rubric',
  PASS_FAIL_SCORE: 'Pass/Fail Score Threshold',
  QUALITATIVE_REVIEW: 'Qualitative Assessment',
  HYBRID: 'Scorecard + Automated Score'
};

// ============================================================================
// CENTRALIZED FINE-GRAINED ACTION PERMISSIONS
// ============================================================================
export const INTERVIEW_PERMISSIONS = {
  // Plan & Template Configuration
  PLAN_CREATE: 'interview.plan.create',
  PLAN_UPDATE_DELETE: 'interview.plan.update_delete',
  SCORECARD_TEMPLATE_MANAGE: 'interview.scorecard_template.manage',

  // Session Visibility Scope
  SESSION_VIEW_ALL: 'interview.session.view_all',
  SESSION_VIEW_DEPT: 'interview.session.view_dept',
  SESSION_VIEW_ASSIGNED: 'interview.session.view_assigned',

  // Scheduling Operations
  SESSION_SCHEDULE: 'interview.session.schedule',
  SESSION_RESCHEDULE: 'interview.session.reschedule',
  SESSION_CANCEL: 'interview.session.cancel',
  SESSION_NO_SHOW: 'interview.session.no_show',

  // Interview Kit & Scorecard
  KIT_ACCESS: 'interview.kit.access',
  SCORECARD_SUBMIT: 'interview.scorecard.submit',
  PANEL_FEEDBACK_VIEW: 'interview.panel_feedback.view',

  // Outcomes & 2-Tier Decisions
  ROUND_OUTCOME_DECIDE: 'interview.round_outcome.decide',
  FINAL_SELECTION_RECOMMEND: 'interview.final_selection.recommend',
  HR_FINAL_VALIDATION_GATE: 'interview.hr_final.validation_gate',

  // Overrides & Audit
  PREREQUISITE_CONFLICT_OVERRIDE: 'interview.override.conflict_prereq',
  AUDIT_VIEW: 'interview.audit.view'
};

// ============================================================================
// EXACT ROLE PERMISSIONS MAP
// ============================================================================
export const ROLE_PERMISSIONS_MAP = {
  // 1. Super Admin: Full Master Access & Governance Overrides
  [INTERVIEW_ROLES.ATS_ADMIN]: [
    INTERVIEW_PERMISSIONS.SESSION_VIEW_ALL,
    INTERVIEW_PERMISSIONS.PLAN_CREATE,
    INTERVIEW_PERMISSIONS.PLAN_UPDATE_DELETE,
    INTERVIEW_PERMISSIONS.SCORECARD_TEMPLATE_MANAGE,
    INTERVIEW_PERMISSIONS.SESSION_SCHEDULE,
    INTERVIEW_PERMISSIONS.SESSION_RESCHEDULE,
    INTERVIEW_PERMISSIONS.SESSION_CANCEL,
    INTERVIEW_PERMISSIONS.SESSION_NO_SHOW,
    INTERVIEW_PERMISSIONS.KIT_ACCESS,
    INTERVIEW_PERMISSIONS.SCORECARD_SUBMIT,
    INTERVIEW_PERMISSIONS.PANEL_FEEDBACK_VIEW,
    INTERVIEW_PERMISSIONS.ROUND_OUTCOME_DECIDE,
    INTERVIEW_PERMISSIONS.FINAL_SELECTION_RECOMMEND,
    INTERVIEW_PERMISSIONS.HR_FINAL_VALIDATION_GATE,
    INTERVIEW_PERMISSIONS.PREREQUISITE_CONFLICT_OVERRIDE,
    INTERVIEW_PERMISSIONS.AUDIT_VIEW
  ],

  // 2. HR / HRBP: All Interviews, HR Validation Gate, Plan Config, Schedule/Reschedule
  [INTERVIEW_ROLES.HR_ADMIN]: [
    INTERVIEW_PERMISSIONS.SESSION_VIEW_ALL,
    INTERVIEW_PERMISSIONS.PLAN_CREATE,
    INTERVIEW_PERMISSIONS.PLAN_UPDATE_DELETE,
    INTERVIEW_PERMISSIONS.SCORECARD_TEMPLATE_MANAGE,
    INTERVIEW_PERMISSIONS.SESSION_SCHEDULE,
    INTERVIEW_PERMISSIONS.SESSION_RESCHEDULE,
    INTERVIEW_PERMISSIONS.SESSION_CANCEL,
    INTERVIEW_PERMISSIONS.SESSION_NO_SHOW,
    INTERVIEW_PERMISSIONS.KIT_ACCESS,
    INTERVIEW_PERMISSIONS.PANEL_FEEDBACK_VIEW,
    INTERVIEW_PERMISSIONS.ROUND_OUTCOME_DECIDE,
    INTERVIEW_PERMISSIONS.HR_FINAL_VALIDATION_GATE,
    INTERVIEW_PERMISSIONS.PREREQUISITE_CONFLICT_OVERRIDE,
    INTERVIEW_PERMISSIONS.AUDIT_VIEW
  ],

  // 3. Recruiter / Coordinator: Operations Lead (Schedule, Reschedule, Cancel, No-Show, Plans & Templates)
  [INTERVIEW_ROLES.RECRUITER]: [
    INTERVIEW_PERMISSIONS.SESSION_VIEW_ALL,
    INTERVIEW_PERMISSIONS.PLAN_CREATE,
    INTERVIEW_PERMISSIONS.PLAN_UPDATE_DELETE,
    INTERVIEW_PERMISSIONS.SCORECARD_TEMPLATE_MANAGE,
    INTERVIEW_PERMISSIONS.SESSION_SCHEDULE,
    INTERVIEW_PERMISSIONS.SESSION_RESCHEDULE,
    INTERVIEW_PERMISSIONS.SESSION_CANCEL,
    INTERVIEW_PERMISSIONS.SESSION_NO_SHOW,
    INTERVIEW_PERMISSIONS.PANEL_FEEDBACK_VIEW,
    INTERVIEW_PERMISSIONS.AUDIT_VIEW
  ],

  // 4. Hiring Manager: Department Scope, Conduct, Schedule, Plans, Scorecard, Round Outcomes, Final Recommendation
  [INTERVIEW_ROLES.HIRING_MANAGER]: [
    INTERVIEW_PERMISSIONS.SESSION_VIEW_DEPT,
    INTERVIEW_PERMISSIONS.PLAN_CREATE,
    INTERVIEW_PERMISSIONS.SESSION_SCHEDULE,
    INTERVIEW_PERMISSIONS.SESSION_RESCHEDULE,
    INTERVIEW_PERMISSIONS.SESSION_CANCEL,
    INTERVIEW_PERMISSIONS.KIT_ACCESS,
    INTERVIEW_PERMISSIONS.SCORECARD_SUBMIT,
    INTERVIEW_PERMISSIONS.PANEL_FEEDBACK_VIEW,
    INTERVIEW_PERMISSIONS.ROUND_OUTCOME_DECIDE,
    INTERVIEW_PERMISSIONS.FINAL_SELECTION_RECOMMEND,
    INTERVIEW_PERMISSIONS.AUDIT_VIEW
  ],

  // 5. Interviewer / Panelist: Assigned Scope, Interview Kit, Scorecard Submission
  [INTERVIEW_ROLES.INTERVIEWER]: [
    INTERVIEW_PERMISSIONS.SESSION_VIEW_ASSIGNED,
    INTERVIEW_PERMISSIONS.KIT_ACCESS,
    INTERVIEW_PERMISSIONS.SCORECARD_SUBMIT,
    INTERVIEW_PERMISSIONS.AUDIT_VIEW
  ]
};

// ============================================================================
// CENTRALIZED ACCESS CONTROL HELPERS
// ============================================================================

/**
 * Checks if a given role has a global action permission.
 */
export const hasInterviewPermission = (userRole, permission) => {
  if (!userRole) return false;
  const perms = ROLE_PERMISSIONS_MAP[userRole] || [];
  return perms.includes(permission);
};

/**
 * Determines whether a user with given role and context can view a specific session.
 */
export const canViewSession = (userRole, userContext = {}, session) => {
  if (!session) return false;
  if (userRole === INTERVIEW_ROLES.ATS_ADMIN || userRole === INTERVIEW_ROLES.HR_ADMIN || userRole === INTERVIEW_ROLES.RECRUITER) {
    return true;
  }
  if (userRole === INTERVIEW_ROLES.HIRING_MANAGER) {
    const userReqs = userContext.userRequisitions || [];
    const userDept = userContext.department || '';
    return (
      (userReqs.length > 0 && userReqs.includes(session.requisitionId)) ||
      (userDept && session.department?.toLowerCase() === userDept.toLowerCase())
    );
  }
  if (userRole === INTERVIEW_ROLES.INTERVIEWER) {
    const userId = userContext.id || '';
    const userEmail = (userContext.email || '').toLowerCase();
    return (session.interviewers || []).some(
      i => i.id === userId || (i.email && i.email.toLowerCase() === userEmail)
    );
  }
  return false;
};

/**
 * Determines whether a user can perform an action on a specific session.
 */
export const canPerformSessionAction = (userRole, userContext = {}, action, session) => {
  if (!hasInterviewPermission(userRole, action)) return false;
  if (!session) return true;

  // Session-specific authorization checks
  switch (action) {
    case INTERVIEW_PERMISSIONS.SCORECARD_SUBMIT:
      if (userRole === INTERVIEW_ROLES.ATS_ADMIN) return true;
      const isAssigned = (session.interviewers || []).some(
        i => i.id === userContext.id || (i.email && i.email.toLowerCase() === (userContext.email || '').toLowerCase())
      );
      return isAssigned || userRole === INTERVIEW_ROLES.HIRING_MANAGER;

    case INTERVIEW_PERMISSIONS.ROUND_OUTCOME_DECIDE:
    case INTERVIEW_PERMISSIONS.FINAL_SELECTION_RECOMMEND:
      return (
        userRole === INTERVIEW_ROLES.ATS_ADMIN ||
        userRole === INTERVIEW_ROLES.HR_ADMIN ||
        (userRole === INTERVIEW_ROLES.HIRING_MANAGER && canViewSession(userRole, userContext, session))
      );

    case INTERVIEW_PERMISSIONS.HR_FINAL_VALIDATION_GATE:
      return userRole === INTERVIEW_ROLES.HR_ADMIN || userRole === INTERVIEW_ROLES.ATS_ADMIN;

    case INTERVIEW_PERMISSIONS.SESSION_RESCHEDULE:
    case INTERVIEW_PERMISSIONS.SESSION_CANCEL:
    case INTERVIEW_PERMISSIONS.SESSION_NO_SHOW:
      return (
        userRole === INTERVIEW_ROLES.RECRUITER ||
        userRole === INTERVIEW_ROLES.HR_ADMIN ||
        userRole === INTERVIEW_ROLES.ATS_ADMIN
      );

    default:
      return true;
  }
};
