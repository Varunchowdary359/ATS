/**
 * Enterprise Offer Management Domain Types, Enums & Governance Rules
 * PeopleWorks ATS SaaS
 */

export const OFFER_STATUS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  GENERATED: 'Letter Generated',
  SENT: 'Sent to Candidate',
  VIEWED: 'Viewed by Candidate',
  NEGOTIATION: 'In Negotiation',
  REVISED: 'Revised',
  PENDING_REAPPROVAL: 'Pending Re-Approval',
  PENDING_SIGNATURE: 'Pending Signature',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
  WITHDRAWN: 'Withdrawn',
  SUPERSEDED: 'Superseded'
};

export const APPROVAL_STATUS = {
  NOT_SUBMITTED: 'Not Submitted',
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RETURNED: 'Returned for Revision'
};

export const APPROVAL_DECISION = {
  APPROVE: 'Approved',
  REJECT: 'Rejected',
  RETURN: 'Returned'
};

export const SIGNATURE_STATUS = {
  NOT_INITIATED: 'Not Initiated',
  ENVELOPE_CREATED: 'Envelope Created',
  SENT: 'Sent for Signature',
  VIEWED: 'Viewed by Signer',
  SIGNED: 'Signed & Certified',
  DECLINED: 'Signature Declined',
  VOIDED: 'Voided'
};

export const SIGNATURE_PROVIDERS = {
  DOCUSIGN: 'DocuSign',
  ADOBE_SIGN: 'Adobe Acrobat Sign',
  INTERNAL_ESIGN: 'PeopleWorks SecureSign'
};

export const EMPLOYMENT_TYPE = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  TEMPORARY: 'Temporary',
  INTERN: 'Intern',
  APPRENTICE: 'Apprentice'
};

export const WORK_ARRANGEMENT = {
  ON_SITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote'
};

export const PAY_FREQUENCY = {
  ANNUAL: 'Annual',
  MONTHLY: 'Monthly',
  BIWEEKLY: 'Bi-weekly',
  WEEKLY: 'Weekly',
  HOURLY: 'Hourly',
  ONE_TIME: 'One Time'
};

export const COMPENSATION_TYPE = {
  BASE_SALARY: 'Base Salary',
  VARIABLE_PAY: 'Variable / Performance Bonus',
  JOINING_BONUS: 'Joining / Sign-on Bonus',
  RETENTION_BONUS: 'Retention Bonus',
  RELOCATION: 'Relocation Allowance',
  STOCK_OPTIONS: 'Stock Options / RSUs',
  CUSTOM: 'Custom Allowance'
};

export const BENEFIT_CATEGORIES = {
  HEALTH: 'Health & Medical',
  LIFE_DISABILITY: 'Life & Disability',
  WELLNESS: 'Wellness & Fitness',
  RETIREMENT: 'Retirement & Savings',
  ALLOWANCES: 'Allowances & Perks',
  TIME_OFF: 'Paid Time Off',
  EQUITY: 'Equity & Ownership',
  CUSTOM: 'Custom'
};

export const PRE_EMPLOYMENT_CONDITIONS = [
  { id: 'bgv', label: 'Background Verification (BGV) Clearance', required: true, category: 'Compliance' },
  { id: 'right_to_work', label: 'Right-to-Work / Identity Verification', required: true, category: 'Legal' },
  { id: 'references', label: 'Professional Reference Checks (2 References)', required: true, category: 'HR' },
  { id: 'medical', label: 'Pre-Employment Medical / Drug Screening', required: false, category: 'Health' },
  { id: 'education', label: 'Original Degree / Educational Verification', required: true, category: 'Verification' },
  { id: 'nda_ip', label: 'Signed Non-Disclosure & IP Assignment Agreement', required: true, category: 'Legal' },
  { id: 'relieving_letter', label: 'Relieving Letter & Service Certificate from Previous Employer', required: true, category: 'HR' }
];

export const OFFER_ROLES = {
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring_manager',
  HR_BP: 'hr_bp',
  FINANCE: 'finance',
  HR_ADMIN: 'hr_admin',
  ATS_ADMIN: 'ats_admin',
  CANDIDATE: 'candidate'
};

export const OFFER_PERMISSIONS = {
  READ: 'offer.read',
  CREATE: 'offer.create',
  UPDATE: 'offer.update',
  SUBMIT: 'offer.submit',
  APPROVE: 'offer.approve',
  REJECT: 'offer.reject',
  RETURN: 'offer.return',
  GENERATE_LETTER: 'offer.generate_letter',
  SEND: 'offer.send',
  NEGOTIATE: 'offer.negotiate',
  RESEND: 'offer.resend',
  WITHDRAW: 'offer.withdraw',
  EXTEND_EXPIRY: 'offer.extend_expiry',
  REISSUE: 'offer.reissue',
  INITIATE_ESIGN: 'offer.initiate_esign',
  PREBOARDING_HANDOFF: 'offer.preboarding_handoff',
  MANAGE_TEMPLATES: 'offer.manage_templates',
  MANAGE_POLICIES: 'offer.manage_policies',
  VIEW_AUDIT: 'offer.view_audit',
  VIEW_SENSITIVE_COMP: 'offer.view_sensitive_comp'
};

export const ROLE_OFFER_PERMISSIONS = {
  [OFFER_ROLES.RECRUITER]: [
    OFFER_PERMISSIONS.READ,
    OFFER_PERMISSIONS.CREATE,
    OFFER_PERMISSIONS.UPDATE,
    OFFER_PERMISSIONS.SUBMIT,
    OFFER_PERMISSIONS.GENERATE_LETTER,
    OFFER_PERMISSIONS.SEND,
    OFFER_PERMISSIONS.NEGOTIATE,
    OFFER_PERMISSIONS.RESEND,
    OFFER_PERMISSIONS.WITHDRAW,
    OFFER_PERMISSIONS.EXTEND_EXPIRY,
    OFFER_PERMISSIONS.INITIATE_ESIGN,
    OFFER_PERMISSIONS.PREBOARDING_HANDOFF,
    OFFER_PERMISSIONS.VIEW_AUDIT,
    OFFER_PERMISSIONS.VIEW_SENSITIVE_COMP
  ],
  [OFFER_ROLES.HIRING_MANAGER]: [
    OFFER_PERMISSIONS.READ,
    OFFER_PERMISSIONS.APPROVE,
    OFFER_PERMISSIONS.REJECT,
    OFFER_PERMISSIONS.RETURN,
    OFFER_PERMISSIONS.VIEW_AUDIT
  ],
  [OFFER_ROLES.HR_BP]: [
    OFFER_PERMISSIONS.READ,
    OFFER_PERMISSIONS.APPROVE,
    OFFER_PERMISSIONS.REJECT,
    OFFER_PERMISSIONS.RETURN,
    OFFER_PERMISSIONS.GENERATE_LETTER,
    OFFER_PERMISSIONS.WITHDRAW,
    OFFER_PERMISSIONS.PREBOARDING_HANDOFF,
    OFFER_PERMISSIONS.VIEW_AUDIT,
    OFFER_PERMISSIONS.VIEW_SENSITIVE_COMP
  ],
  [OFFER_ROLES.FINANCE]: [
    OFFER_PERMISSIONS.READ,
    OFFER_PERMISSIONS.APPROVE,
    OFFER_PERMISSIONS.REJECT,
    OFFER_PERMISSIONS.RETURN,
    OFFER_PERMISSIONS.VIEW_SENSITIVE_COMP
  ],
  [OFFER_ROLES.HR_ADMIN]: [
    ...Object.values(OFFER_PERMISSIONS)
  ],
  [OFFER_ROLES.ATS_ADMIN]: [
    ...Object.values(OFFER_PERMISSIONS)
  ],
  [OFFER_ROLES.CANDIDATE]: [
    OFFER_PERMISSIONS.READ
  ]
};

export const hasOfferPermission = (role, permission) => {
  const permissions = ROLE_OFFER_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const OFFER_PRESETS = [
  { id: 'all', label: 'All Offers', description: 'Comprehensive view of all created offers' },
  { id: 'active', label: 'Active Pipeline', description: 'Offers currently in draft, approval, or negotiation' },
  { id: 'pending_approval', label: 'Pending Approval', description: 'Offers awaiting internal sign-offs' },
  { id: 'sent', label: 'Sent & Awaiting', description: 'Offers extended to candidate awaiting response' },
  { id: 'negotiation', label: 'In Negotiation', description: 'Offers with counter requests' },
  { id: 'accepted', label: 'Accepted & Ready', description: 'Signed offers ready for preboarding' },
  { id: 'archived', label: 'Archived / Expired', description: 'Declined, withdrawn, or expired records' }
];

export const MOCK_OFFER_PERSONAS = {
  [OFFER_ROLES.RECRUITER]: {
    id: 'USR-REC-01',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@peopleworks.ai',
    role: OFFER_ROLES.RECRUITER,
    title: 'Senior Technical Recruiter',
    department: 'Talent Acquisition',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    userRequisitions: ['REQ-2026-001', 'REQ-2026-002', 'REQ-2026-003', 'REQ-2026-004']
  },
  [OFFER_ROLES.HIRING_MANAGER]: {
    id: 'USR-HM-01',
    name: 'Alex Chen',
    email: 'alex.chen@peopleworks.ai',
    role: OFFER_ROLES.HIRING_MANAGER,
    title: 'Director of Engineering',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    userRequisitions: ['REQ-2026-001', 'REQ-2026-002']
  },
  [OFFER_ROLES.HR_BP]: {
    id: 'USR-HRBP-01',
    name: 'Marcus Vance',
    email: 'marcus.vance@peopleworks.ai',
    role: OFFER_ROLES.HR_BP,
    title: 'Senior HR Business Partner',
    department: 'Human Resources',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    userRequisitions: ['REQ-2026-001', 'REQ-2026-002', 'REQ-2026-003', 'REQ-2026-004', 'REQ-2026-005']
  },
  [OFFER_ROLES.FINANCE]: {
    id: 'USR-FIN-01',
    name: 'Elena Rostova',
    email: 'elena.rostova@peopleworks.ai',
    role: OFFER_ROLES.FINANCE,
    title: 'Head of FP&A & Compensation',
    department: 'Finance',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    userRequisitions: ['REQ-2026-001', 'REQ-2026-002', 'REQ-2026-003', 'REQ-2026-004', 'REQ-2026-005']
  },
  [OFFER_ROLES.ATS_ADMIN]: {
    id: 'USR-ADMIN-01',
    name: 'PeopleWorks Admin',
    email: 'admin@peopleworks.ai',
    role: OFFER_ROLES.ATS_ADMIN,
    title: 'Head of Global Talent Operations',
    department: 'Human Resources',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    userRequisitions: ['REQ-2026-001', 'REQ-2026-002', 'REQ-2026-003', 'REQ-2026-004', 'REQ-2026-005']
  }
};
