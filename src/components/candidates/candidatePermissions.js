/**
 * Candidate Module Role-Based Access Control & Permission Helper
 * 
 * Supported Persona Roles:
 * - 'super_admin' / 'admin': Full administrative control
 * - 'recruiter' / 'workspace': Complete candidate management & operational actions
 * - 'hiring_manager': Profile review, skills, screening, interview feedback. Restricted salary & deletion.
 * - 'dept_head': Executive pipeline review, departmental budget overview, stage approvals.
 */

export const normalizeRole = (role) => {
  if (!role) return 'recruiter';
  if (typeof role === 'object') return role.id || 'recruiter';
  return String(role).toLowerCase();
};

export const canViewCompensation = (role) => {
  const r = normalizeRole(role);
  // Hiring Managers cannot view compensation/salary details
  if (r === 'hiring_manager') return false;
  return true;
};

export const canEditCandidate = (role) => {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin' || r === 'recruiter' || r === 'workspace';
};

export const canDeleteCandidate = (role) => {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin';
};

export const canMergeDuplicates = (role) => {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin' || r === 'recruiter';
};

export const canChangeStage = (role) => {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin' || r === 'recruiter' || r === 'workspace' || r === 'dept_head';
};

export const canScheduleInterview = (role) => {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin' || r === 'recruiter' || r === 'workspace' || r === 'hiring_manager';
};

export const canSendEmail = (role) => {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin' || r === 'recruiter' || r === 'workspace';
};

export const canAddNote = (role) => {
  return true; // All authenticated roles can add evaluation notes
};

export const canManageDocuments = (role) => {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin' || r === 'recruiter' || r === 'workspace';
};
