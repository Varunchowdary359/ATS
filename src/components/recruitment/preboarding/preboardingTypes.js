/**
 * Enterprise Preboarding Management Types, Constants & RBAC Definitions
 * PeopleWorks ATS SaaS
 */

export const PREBOARDING_STATUS = {
  INITIATED: 'Initiated',
  IN_PROGRESS: 'In Progress',
  READY_TO_JOIN: 'Ready to Join',
  HANDOFF_PENDING: 'Handoff Pending',
  EMPLOYEE_CREATED: 'Employee Created',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
  WITHDRAWN: 'Candidate Withdrawn',
  HANDOFF_FAILED: 'Handoff Failed'
};

export const ACTION_STATUS = {
  ACTION_REQUIRED: 'Action Required',
  ON_TRACK: 'On Track',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  PENDING_REVIEW: 'Pending Review'
};

export const DOCUMENT_CATEGORY = {
  IDENTITY: 'Identity',
  EDUCATION: 'Education',
  EMPLOYMENT: 'Employment',
  ADDRESS: 'Address',
  PAYROLL_BANK: 'Payroll/Bank',
  CUSTOM: 'Custom'
};

export const DOCUMENT_STATUS = {
  NOT_REQUESTED: 'Not Requested',
  REQUESTED: 'Requested',
  UPLOADED: 'Uploaded',
  UNDER_REVIEW: 'Under Review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  REUPLOAD_REQUIRED: 'Re-upload Required',
  WAIVED: 'Waived',
  EXPIRED: 'Expired'
};

export const BGV_CHECK_TYPE = {
  IDENTITY: 'Identity',
  ADDRESS: 'Address',
  EMPLOYMENT: 'Employment',
  EDUCATION: 'Education',
  REFERENCE: 'Reference',
  CRIMINAL: 'Criminal Background',
  CUSTOM: 'Custom'
};

export const BGV_STATUS = {
  NOT_STARTED: 'Not Started',
  INITIATED: 'Initiated',
  IN_PROGRESS: 'In Progress',
  PENDING_INFO: 'Pending Information',
  COMPLETED: 'Completed',
  CLEAR: 'Clear',
  DISCREPANCY: 'Discrepancy',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled'
};

export const BGV_PROVIDERS = [
  { id: 'authbridge', name: 'AuthBridge Identity & Background Verification' },
  { id: 'first_advantage', name: 'First Advantage Global Verification' },
  { id: 'sterling', name: 'Sterling Talent Solutions' },
  { id: 'springverify', name: 'SpringVerify Digital Background Check' },
  { id: 'internal', name: 'Internal HR Verification Team' }
];

export const TASK_ASSIGNEE_ROLE = {
  HR: 'HR',
  RECRUITER: 'Recruiter',
  HIRING_MANAGER: 'Hiring Manager',
  IT_ADMIN: 'IT/Admin',
  FINANCE: 'Finance',
  CANDIDATE: 'Candidate'
};

export const TASK_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  SKIPPED: 'Skipped',
  OVERDUE: 'Overdue'
};

export const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

export const HANDOFF_STATUS = {
  READY: 'Ready',
  PENDING: 'Pending',
  SENT: 'Sent',
  CREATED: 'Created',
  FAILED: 'Failed'
};

export const PREBOARDING_PERMISSIONS = {
  READ: 'preboarding.read',
  CREATE: 'preboarding.create',
  UPDATE: 'preboarding.update',
  CANCEL: 'preboarding.cancel',
  ASSIGN: 'preboarding.assign',
  DOCUMENTS_READ: 'preboarding.documents.read',
  DOCUMENTS_UPLOAD: 'preboarding.documents.upload',
  DOCUMENTS_VERIFY: 'preboarding.documents.verify',
  DOCUMENTS_REJECT: 'preboarding.documents.reject',
  BGV_READ: 'preboarding.bgv.read',
  BGV_MANAGE: 'preboarding.bgv.manage',
  TASKS_READ: 'preboarding.tasks.read',
  TASKS_CREATE: 'preboarding.tasks.create',
  TASKS_ASSIGN: 'preboarding.tasks.assign',
  TASKS_COMPLETE: 'preboarding.tasks.complete',
  READINESS_REVIEW: 'preboarding.readiness.review',
  READINESS_APPROVE: 'preboarding.readiness.approve',
  HANDOFF: 'preboarding.handoff',
  AUDIT_READ: 'preboarding.audit.read',
  EXPORT: 'preboarding.export'
};

export const ROLE_PREBOARDING_PERMISSIONS = {
  ats_admin: Object.values(PREBOARDING_PERMISSIONS),
  super_admin: Object.values(PREBOARDING_PERMISSIONS),
  hr_admin: Object.values(PREBOARDING_PERMISSIONS),
  hr_manager: [
    PREBOARDING_PERMISSIONS.READ,
    PREBOARDING_PERMISSIONS.CREATE,
    PREBOARDING_PERMISSIONS.UPDATE,
    PREBOARDING_PERMISSIONS.ASSIGN,
    PREBOARDING_PERMISSIONS.DOCUMENTS_READ,
    PREBOARDING_PERMISSIONS.DOCUMENTS_UPLOAD,
    PREBOARDING_PERMISSIONS.DOCUMENTS_VERIFY,
    PREBOARDING_PERMISSIONS.DOCUMENTS_REJECT,
    PREBOARDING_PERMISSIONS.BGV_READ,
    PREBOARDING_PERMISSIONS.BGV_MANAGE,
    PREBOARDING_PERMISSIONS.TASKS_READ,
    PREBOARDING_PERMISSIONS.TASKS_CREATE,
    PREBOARDING_PERMISSIONS.TASKS_ASSIGN,
    PREBOARDING_PERMISSIONS.TASKS_COMPLETE,
    PREBOARDING_PERMISSIONS.READINESS_REVIEW,
    PREBOARDING_PERMISSIONS.READINESS_APPROVE,
    PREBOARDING_PERMISSIONS.HANDOFF,
    PREBOARDING_PERMISSIONS.AUDIT_READ,
    PREBOARDING_PERMISSIONS.EXPORT
  ],
  recruiter: [
    PREBOARDING_PERMISSIONS.READ,
    PREBOARDING_PERMISSIONS.CREATE,
    PREBOARDING_PERMISSIONS.UPDATE,
    PREBOARDING_PERMISSIONS.DOCUMENTS_READ,
    PREBOARDING_PERMISSIONS.DOCUMENTS_UPLOAD,
    PREBOARDING_PERMISSIONS.BGV_READ,
    PREBOARDING_PERMISSIONS.TASKS_READ,
    PREBOARDING_PERMISSIONS.TASKS_CREATE,
    PREBOARDING_PERMISSIONS.TASKS_COMPLETE,
    PREBOARDING_PERMISSIONS.READINESS_REVIEW,
    PREBOARDING_PERMISSIONS.AUDIT_READ,
    PREBOARDING_PERMISSIONS.EXPORT
  ],
  hiring_manager: [
    PREBOARDING_PERMISSIONS.READ,
    PREBOARDING_PERMISSIONS.TASKS_READ,
    PREBOARDING_PERMISSIONS.TASKS_COMPLETE,
    PREBOARDING_PERMISSIONS.READINESS_REVIEW
  ],
  it_admin: [
    PREBOARDING_PERMISSIONS.READ,
    PREBOARDING_PERMISSIONS.TASKS_READ,
    PREBOARDING_PERMISSIONS.TASKS_COMPLETE
  ],
  finance: [
    PREBOARDING_PERMISSIONS.READ,
    PREBOARDING_PERMISSIONS.DOCUMENTS_READ,
    PREBOARDING_PERMISSIONS.DOCUMENTS_VERIFY,
    PREBOARDING_PERMISSIONS.TASKS_READ,
    PREBOARDING_PERMISSIONS.TASKS_COMPLETE
  ],
  candidate: [
    PREBOARDING_PERMISSIONS.READ,
    PREBOARDING_PERMISSIONS.DOCUMENTS_READ,
    PREBOARDING_PERMISSIONS.DOCUMENTS_UPLOAD,
    PREBOARDING_PERMISSIONS.TASKS_READ,
    PREBOARDING_PERMISSIONS.TASKS_COMPLETE
  ]
};

export const WORK_ARRANGEMENT = {
  ON_SITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote'
};

export const EMPLOYMENT_TYPE = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship'
};
