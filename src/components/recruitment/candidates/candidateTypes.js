/**
 * Candidate & Application Domain Types, Enums & Configurations
 * Enterprise ATS Architecture - PeopleWorks SaaS
 */

export const CANDIDATE_STATUS = {
  ACTIVE: 'Active',
  HIRED: 'Hired',
  ARCHIVED: 'Archived'
};

export const APPLICATION_STAGE = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  HIRED: 'Hired'
};

export const EXCEPTION_STATUS = {
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  ON_HOLD: 'On Hold'
};

export const APPLICATION_STATUS = {
  ACTIVE: 'Active',
  ...EXCEPTION_STATUS,
  HIRED: 'Hired'
};

export const PIPELINE_STAGES = [
  { 
    id: APPLICATION_STAGE.APPLIED, 
    label: 'Applied', 
    order: 1, 
    color: '#64748b', 
    bgColor: '#f1f5f9',
    darkBg: 'rgba(100, 116, 139, 0.15)',
    description: 'Fresh application received and awaiting initial review'
  },
  { 
    id: APPLICATION_STAGE.SCREENING, 
    label: 'Screening', 
    order: 2, 
    color: '#0284c7', 
    bgColor: '#e0f2fe',
    darkBg: 'rgba(2, 132, 199, 0.15)',
    description: 'Resume parsing, automated requirements match & recruiter screening'
  },
  { 
    id: APPLICATION_STAGE.SHORTLISTED, 
    label: 'Shortlisted', 
    order: 3, 
    color: '#8b5cf6', 
    bgColor: '#f3e8ff',
    darkBg: 'rgba(139, 92, 246, 0.15)',
    description: 'Approved by recruiter and submitted to hiring manager review'
  },
  { 
    id: APPLICATION_STAGE.INTERVIEW, 
    label: 'Interview', 
    order: 4, 
    color: '#f59e0b', 
    bgColor: '#fef3c7',
    darkBg: 'rgba(245, 158, 11, 0.15)',
    description: 'Technical, domain, or behavioral assessment in progress'
  },
  { 
    id: APPLICATION_STAGE.OFFER, 
    label: 'Offer', 
    order: 5, 
    color: '#06b6d4', 
    bgColor: '#cffafe',
    darkBg: 'rgba(6, 182, 212, 0.15)',
    description: 'Compensation proposal, approval routing, and formal offer extended'
  },
  { 
    id: APPLICATION_STAGE.HIRED, 
    label: 'Hired', 
    order: 6, 
    color: '#10b981', 
    bgColor: '#d1fae5',
    darkBg: 'rgba(16, 185, 129, 0.15)',
    description: 'Offer accepted and candidate scheduled for onboarding'
  }
];

export const CANDIDATE_SOURCES = [
  { id: 'careers_portal', name: 'Careers Portal Direct', category: 'Inbound' },
  { id: 'linkedin', name: 'LinkedIn Recruiter', category: 'Sourcing' },
  { id: 'naukri', name: 'Naukri.com Sync', category: 'Job Board' },
  { id: 'indeed', name: 'Indeed Apply', category: 'Job Board' },
  { id: 'referral', name: 'Employee Referral', category: 'Referral' },
  { id: 'agency', name: 'Agency Partner', category: 'External' },
  { id: 'resume_upload', name: 'Resume Upload', category: 'Direct' },
  { id: 'bulk_import', name: 'Bulk Import', category: 'System' },
  { id: 'email_import', name: 'Email Parser', category: 'System' },
  { id: 'direct_sourcing', name: 'Direct Sourcing', category: 'Sourcing' }
];

export const SKILL_SOURCES = {
  RESUME: 'Resume',
  RECRUITER: 'Recruiter',
  CANDIDATE: 'Candidate',
  VERIFIED: 'Verified'
};

export const SKILL_PROFICIENCIES = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const DOCUMENT_TYPES = [
  { id: 'resume', label: 'Resume / CV', isPrimary: true },
  { id: 'cover_letter', label: 'Cover Letter', isPrimary: false },
  { id: 'certificate', label: 'Professional Certificate', isPrimary: false },
  { id: 'portfolio', label: 'Portfolio / Work Sample', isPrimary: false },
  { id: 'id_proof', label: 'Identification / Work Auth', isPrimary: false },
  { id: 'other', label: 'Other Document', isPrimary: false }
];

export const REJECTION_REASONS = [
  'Technical assessment score below threshold',
  'Salary expectation outside budget range',
  'Notice period longer than business requirement',
  'Lacks mandatory domain / cloud architecture experience',
  'Candidate accepted another offer',
  'Location mismatch / unwilling to relocate',
  'Failed background verification',
  'Requisition placed on hold / cancelled'
];

// RBAC Permissions map
export const PERMISSIONS = {
  CANDIDATE_READ: 'candidate.read',
  CANDIDATE_CREATE: 'candidate.create',
  CANDIDATE_UPDATE: 'candidate.update',
  CANDIDATE_ARCHIVE: 'candidate.archive',
  CANDIDATE_RESTORE: 'candidate.restore',
  CANDIDATE_EXPORT: 'candidate.export',
  CANDIDATE_HISTORY_READ: 'candidate.history.read',
  CANDIDATE_DOCUMENTS_READ: 'candidate.documents.read',
  CANDIDATE_DOCUMENTS_MANAGE: 'candidate.documents.manage',
  CANDIDATE_APPLICATION_CREATE: 'candidate.application.create',
  CANDIDATE_APPLICATION_MOVE: 'candidate.application.move',
  CANDIDATE_OVERRIDE: 'candidate.override',
  CANDIDATE_ASSIGN: 'candidate.assign',
  CANDIDATE_NOTES_READ: 'candidate.notes.read',
  CANDIDATE_NOTES_MANAGE: 'candidate.notes.manage'
};

// Enterprise ATS Roles
export const ATS_ROLES = {
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring_manager',
  HR_ADMIN: 'hr_admin',
  ATS_ADMIN: 'ats_admin',
  EMPLOYEE: 'employee'
};

// Enterprise Access Scopes
export const ACCESS_SCOPES = {
  ASSIGNED_CANDIDATES: 'assigned_candidates',
  ASSIGNED_REQUISITIONS: 'assigned_requisitions',
  DEPARTMENT: 'department',
  ORGANIZATION: 'organization',
  NONE: 'none'
};

export const ROLE_CONFIGS = {
  [ATS_ROLES.RECRUITER]: {
    id: ATS_ROLES.RECRUITER,
    label: 'Recruiter',
    badgeColor: '#3b82f6',
    defaultScope: ACCESS_SCOPES.ASSIGNED_CANDIDATES,
    description: 'Full day-to-day candidate operations scoped to assigned talent and requisitions.',
    permissions: [
      PERMISSIONS.CANDIDATE_READ,
      PERMISSIONS.CANDIDATE_CREATE,
      PERMISSIONS.CANDIDATE_UPDATE,
      PERMISSIONS.CANDIDATE_DOCUMENTS_READ,
      PERMISSIONS.CANDIDATE_DOCUMENTS_MANAGE,
      PERMISSIONS.CANDIDATE_APPLICATION_CREATE,
      PERMISSIONS.CANDIDATE_APPLICATION_MOVE,
      PERMISSIONS.CANDIDATE_ASSIGN,
      PERMISSIONS.CANDIDATE_NOTES_READ,
      PERMISSIONS.CANDIDATE_NOTES_MANAGE,
      PERMISSIONS.CANDIDATE_EXPORT
    ]
  },
  [ATS_ROLES.HIRING_MANAGER]: {
    id: ATS_ROLES.HIRING_MANAGER,
    label: 'Hiring Manager',
    badgeColor: '#8b5cf6',
    defaultScope: ACCESS_SCOPES.ASSIGNED_REQUISITIONS,
    description: 'Scoped to assigned requisitions: review shortlisted candidates, resumes & feedback.',
    permissions: [
      PERMISSIONS.CANDIDATE_READ,
      PERMISSIONS.CANDIDATE_DOCUMENTS_READ,
      PERMISSIONS.CANDIDATE_NOTES_READ,
      PERMISSIONS.CANDIDATE_NOTES_MANAGE
    ]
  },
  [ATS_ROLES.HR_ADMIN]: {
    id: ATS_ROLES.HR_ADMIN,
    label: 'HR Admin',
    badgeColor: '#10b981',
    defaultScope: ACCESS_SCOPES.ORGANIZATION,
    description: 'Broad organization-wide candidate access, audit history, archival & sensitive data.',
    permissions: [
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
    ]
  },
  [ATS_ROLES.ATS_ADMIN]: {
    id: ATS_ROLES.ATS_ADMIN,
    label: 'Recruitment / ATS Admin',
    badgeColor: '#f59e0b',
    defaultScope: ACCESS_SCOPES.ORGANIZATION,
    description: 'Unrestricted operational access, managerial overrides, pipeline configuration & audit.',
    permissions: Object.values(PERMISSIONS)
  },
  [ATS_ROLES.EMPLOYEE]: {
    id: ATS_ROLES.EMPLOYEE,
    label: 'Employee / Referrer',
    badgeColor: '#64748b',
    defaultScope: ACCESS_SCOPES.NONE,
    description: 'Referral submission only; no access to candidate repository.',
    permissions: []
  }
};

/**
 * Checks if a user has a specific permission taking scope and context into account.
 */
export const hasPermission = (roleId, permissionKey, context = {}) => {
  const config = ROLE_CONFIGS[roleId] || ROLE_CONFIGS[ATS_ROLES.RECRUITER];
  if (!config.permissions.includes(permissionKey)) {
    return false;
  }

  // Scope check
  const scope = context.scope || config.defaultScope;
  if (scope === ACCESS_SCOPES.ORGANIZATION) {
    return true;
  }

  if (scope === ACCESS_SCOPES.NONE) {
    return false;
  }

  if (scope === ACCESS_SCOPES.ASSIGNED_REQUISITIONS) {
    const userReqs = context.userRequisitions || [];
    if (context.application?.requisitionId) {
      return userReqs.includes(context.application.requisitionId);
    }
    if (context.candidate?.applications) {
      return context.candidate.applications.some(app => userReqs.includes(app.requisitionId));
    }
    return false;
  }

  if (scope === ACCESS_SCOPES.ASSIGNED_CANDIDATES) {
    if (!context.userId) return true;
    if (context.candidate) {
      return (
        context.candidate.assignedRecruiter === context.userId ||
        !context.candidate.assignedRecruiter ||
        context.candidate.assignedRecruiter === 'Current User'
      );
    }
    return true;
  }

  return true;
};

/**
 * Normalizes any module-specific stage alias to official canonical APPLICATION_STAGE.
 */
export const normalizeCanonicalStage = (stage) => {
  if (!stage) return APPLICATION_STAGE.SCREENING;
  const s = String(stage).trim().toLowerCase();
  if (s === 'interview' || s.includes('interview') || s.includes('round') || s === 'interview scheduled') {
    return APPLICATION_STAGE.INTERVIEW;
  }
  if (s === 'shortlisted' || s === 'shortlist' || s.includes('shortlist') || s.includes('recommend') || s.includes('hm recommended')) {
    return APPLICATION_STAGE.SHORTLISTED;
  }
  if (s === 'screening' || s === 'screened' || s.includes('screen')) {
    return APPLICATION_STAGE.SCREENING;
  }
  if (s === 'offer' || s.includes('offer')) {
    return APPLICATION_STAGE.OFFER;
  }
  if (s === 'hired' || s.includes('hire')) {
    return APPLICATION_STAGE.HIRED;
  }
  if (s === 'applied' || s === 'ingested' || s.includes('ingest') || s.includes('appl')) {
    return APPLICATION_STAGE.APPLIED;
  }
  return stage;
};

/**
 * Validates allowed sequential pipeline stage movements.
 * Returns { valid: boolean, requiresOverride: boolean, message: string }
 */
export const validateStageTransition = (currentStage, targetStage) => {
  const normCurrent = normalizeCanonicalStage(currentStage);
  const normTarget = normalizeCanonicalStage(targetStage);

  if (normCurrent === normTarget) {
    return { valid: true, requiresOverride: false, message: 'Current stage' };
  }

  // If moving into an exception status (Rejected, Withdrawn, On Hold)
  if (Object.values(EXCEPTION_STATUS).includes(targetStage)) {
    return { valid: true, requiresOverride: false, message: `Transitioning to ${targetStage}` };
  }

  const stageOrder = {
    [APPLICATION_STAGE.APPLIED]: 1,
    [APPLICATION_STAGE.SCREENING]: 2,
    [APPLICATION_STAGE.SHORTLISTED]: 3,
    [APPLICATION_STAGE.INTERVIEW]: 4,
    [APPLICATION_STAGE.OFFER]: 5,
    [APPLICATION_STAGE.HIRED]: 6
  };

  const currentOrder = stageOrder[normCurrent] || 1;
  const targetOrder = stageOrder[normTarget] || 1;

  // Normal forward step (e.g. Applied -> Screening, Shortlisted -> Interview, Interview -> Offer)
  if (targetOrder === currentOrder + 1) {
    return { valid: true, requiresOverride: false, message: `Valid sequential progression (${normCurrent} ➔ ${normTarget})` };
  }

  // Previous stage rollback (e.g. Shortlisted -> Screening)
  if (targetOrder > 0 && targetOrder < currentOrder) {
    return { 
      valid: true, 
      requiresOverride: true, 
      message: `Moving backward from ${normCurrent} to ${normTarget} requires confirmation note.` 
    };
  }

  // Stage skip (e.g. Applied directly to Offer or Hired)
  if (targetOrder > currentOrder + 1) {
    return { 
      valid: false, 
      requiresOverride: true, 
      message: `Stage skipping detected: Moving directly from ${normCurrent} to ${normTarget} bypasses intermediate stages. Managerial override authorization is required.` 
    };
  }

  return { valid: true, requiresOverride: false, message: 'Transition permitted' };
};
