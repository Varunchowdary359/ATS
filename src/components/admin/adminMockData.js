// ══════════════════════════════════════════════════════════════════════════════
// ADMIN MOCK DATA — Used across all 7 admin management pages
// ══════════════════════════════════════════════════════════════════════════════

// ── Users ─────────────────────────────────────────────────────────────────────
export const MOCK_USERS = [
  { id: 1, empId: 'EMP-001', name: 'Arun Kumar',      email: 'arun.kumar@peopleworks.in',    role: 'CEO',             roleColor: 'rose',   status: 'Active',    lastLogin: '2026-07-24 09:12', lastActive: '2 mins ago', mfaEnabled: true,  avatar: 'AK', department: 'Executive',   designation: 'Chief Executive Officer', manager: 'Board',        authMethod: 'SAML (Okta)', riskLevel: 'Low' },
  { id: 2, empId: 'EMP-014', name: 'Priya Sharma',    email: 'priya.sharma@peopleworks.in',  role: 'HR Admin',        roleColor: 'blue',   status: 'Active',    lastLogin: '2026-07-24 08:45', lastActive: '1 hr ago',   mfaEnabled: true,  avatar: 'PS', department: 'HR',          designation: 'VP of HR',                manager: 'Arun Kumar',   authMethod: 'SAML (Okta)', riskLevel: 'Low' },
  { id: 3, empId: 'EMP-042', name: 'Vikram Nair',     email: 'vikram.nair@peopleworks.in',   role: 'Hiring Manager',  roleColor: 'indigo', status: 'Active',    lastLogin: '2026-07-23 17:30', lastActive: 'Yesterday',  mfaEnabled: false, avatar: 'VN', department: 'Engineering', designation: 'Engineering Manager',     manager: 'CTO',          authMethod: 'Local',       riskLevel: 'Medium' },
  { id: 4, empId: 'EMP-088', name: 'Sneha Reddy',     email: 'sneha.reddy@peopleworks.in',   role: 'Recruiter',       roleColor: 'purple', status: 'Active',    lastLogin: '2026-07-24 10:05', lastActive: '5 mins ago', mfaEnabled: true,  avatar: 'SR', department: 'HR',          designation: 'Senior Recruiter',        manager: 'Priya Sharma', authMethod: 'SAML (Okta)', riskLevel: 'Low' },
  { id: 5, empId: 'EMP-092', name: 'Rahul Mehta',     email: 'rahul.mehta@peopleworks.in',   role: 'HR Admin',        roleColor: 'blue',   status: 'Inactive',  lastLogin: '2026-07-18 14:20', lastActive: '1 week ago', mfaEnabled: true,  avatar: 'RM', department: 'HR',          designation: 'HR Coordinator',          manager: 'Priya Sharma', authMethod: 'OIDC (Azure)',riskLevel: 'Low' },
  { id: 6, empId: 'EMP-110', name: 'Kavitha Iyer',    email: 'kavitha.iyer@peopleworks.in',  role: 'Recruiter',       roleColor: 'purple', status: 'Active',    lastLogin: '2026-07-24 07:55', lastActive: '3 hrs ago',  mfaEnabled: true,  avatar: 'KI', department: 'Talent Acq.', designation: 'Tech Recruiter',          manager: 'Sneha Reddy',  authMethod: 'SAML (Okta)', riskLevel: 'Low' },
  { id: 7, empId: 'EMP-156', name: 'Deepak Joshi',    email: 'deepak.joshi@peopleworks.in',  role: 'Hiring Manager',  roleColor: 'indigo', status: 'Locked',    lastLogin: '2026-07-23 16:10', lastActive: '2 days ago', mfaEnabled: false, avatar: 'DJ', department: 'Finance',     designation: 'Finance Director',        manager: 'CFO',          authMethod: 'Local',       riskLevel: 'High' },
  { id: 8, empId: 'EMP-201', name: 'Ananya Das',      email: 'ananya.das@peopleworks.in',    role: 'Viewer',          roleColor: 'slate',  status: 'Active',    lastLogin: '2026-07-22 11:30', lastActive: '3 days ago', mfaEnabled: true,  avatar: 'AD', department: 'Operations',  designation: 'Operations Analyst',      manager: 'COO',          authMethod: 'SAML (Okta)', riskLevel: 'Low' },
  { id: 9, empId: 'EMP-244', name: 'Suresh Pillai',   email: 'suresh.pillai@peopleworks.in', role: 'Recruiter',       roleColor: 'purple', status: 'Suspended', lastLogin: '2026-07-10 09:00', lastActive: '2 weeks ago',mfaEnabled: false, avatar: 'SP', department: 'HR',          designation: 'Recruiting Coordinator',  manager: 'Sneha Reddy',  authMethod: 'Local',       riskLevel: 'High' },
  { id: 10,empId: 'EMP-305', name: 'Meera Nambiar',  email: 'meera.nambiar@peopleworks.in', role: 'HR Admin',        roleColor: 'blue',   status: 'Active',    lastLogin: '2026-07-24 08:30', lastActive: 'Just now',   mfaEnabled: true,  avatar: 'MN', department: 'HR',          designation: 'HR Business Partner',     manager: 'Priya Sharma', authMethod: 'SAML (Okta)', riskLevel: 'Low' },
];

// ── Roles ─────────────────────────────────────────────────────────────────────
export const MOCK_ROLES = [
  { id: 1, name: 'CEO',             type: 'System', description: 'Full executive access — all modules, analytics, and financial KPIs.',    userCount: 1,  permissions: 52, color: 'rose',   status: 'Active', createdAt: '2024-01-10' },
  { id: 2, name: 'HR Admin',        type: 'System', description: 'Full HR operations — users, requisitions, onboarding, compliance.',      userCount: 3,  permissions: 41, color: 'blue',   status: 'Active', createdAt: '2024-01-10' },
  { id: 3, name: 'Hiring Manager',  type: 'System', description: 'Manage requisitions, interviews, and team-level hiring pipelines.',      userCount: 2,  permissions: 28, color: 'indigo', status: 'Active', createdAt: '2024-02-15' },
  { id: 4, name: 'Recruiter',       type: 'System', description: 'Manage candidates, post jobs, schedule interviews, send offers.',        userCount: 3,  permissions: 19, color: 'purple', status: 'Active', createdAt: '2024-02-20' },
  { id: 5, name: 'Viewer',          type: 'System', description: 'Read-only access to dashboards and reports.',                            userCount: 1,  permissions: 8,  color: 'slate',  status: 'Active', createdAt: '2024-03-05' },
  { id: 6, name: 'IT Auditor',      type: 'Custom', description: 'Read-only access to audit logs and API keys for compliance.',            userCount: 0,  permissions: 12, color: 'slate',  status: 'Active', createdAt: '2025-06-12' },
];

// ── Permissions Matrix ─────────────────────────────────────────────────────────
export const PERMISSION_MODULES = [
  'Dashboard', 'Users', 'Roles', 'Candidates', 'Jobs', 'Requisitions',
  'Interviews', 'Offers', 'Reports', 'Audit Logs', 'API Keys', 'Settings',
];
export const PERMISSION_ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Export'];

export const MOCK_PERMISSIONS = {
  CEO:            { Dashboard: ['View'], Users: ['View','Create','Edit','Delete','Export'], Roles: ['View','Create','Edit','Delete'], Candidates: ['View','Create','Edit','Delete','Export'], Jobs: ['View','Create','Edit','Delete'], Requisitions: ['View','Create','Edit','Delete','Export'], Interviews: ['View','Create','Edit','Delete'], Offers: ['View','Create','Edit','Delete'], Reports: ['View','Export'], 'Audit Logs': ['View','Export'], 'API Keys': ['View','Create','Delete'], Settings: ['View','Edit'] },
  'HR Admin':     { Dashboard: ['View'], Users: ['View','Create','Edit'], Roles: ['View'], Candidates: ['View','Create','Edit','Delete','Export'], Jobs: ['View','Create','Edit'], Requisitions: ['View','Create','Edit','Export'], Interviews: ['View','Create','Edit'], Offers: ['View','Create','Edit'], Reports: ['View','Export'], 'Audit Logs': ['View'], 'API Keys': [], Settings: ['View'] },
  'Hiring Manager':{ Dashboard: ['View'], Users: [], Roles: [], Candidates: ['View','Create','Edit','Export'], Jobs: ['View','Create'], Requisitions: ['View','Create','Edit'], Interviews: ['View','Create','Edit','Delete'], Offers: ['View','Create'], Reports: ['View'], 'Audit Logs': [], 'API Keys': [], Settings: [] },
  Recruiter:      { Dashboard: ['View'], Users: [], Roles: [], Candidates: ['View','Create','Edit','Export'], Jobs: ['View','Create'], Requisitions: ['View','Create'], Interviews: ['View','Create','Edit'], Offers: ['View','Create'], Reports: ['View'], 'Audit Logs': [], 'API Keys': [], Settings: [] },
  Viewer:         { Dashboard: ['View'], Users: [], Roles: [], Candidates: ['View'], Jobs: ['View'], Requisitions: ['View'], Interviews: ['View'], Offers: [], Reports: ['View'], 'Audit Logs': [], 'API Keys': [], Settings: [] },
};

// ── Company ───────────────────────────────────────────────────────────────────
export const MOCK_COMPANY = {
  name: 'PeopleWorks Technologies Pvt. Ltd.',
  industry: 'HR Technology / SaaS',
  website: 'https://peopleworks.in',
  email: 'contact@peopleworks.in',
  phone: '+91 98765 43210',
  gstin: '29AABCP1234F1Z5',
  cin: 'U72900KA2020PTC123456',
  address: '4th Floor, Prestige Tech Park, Outer Ring Road, Bangalore - 560103',
  state: 'Karnataka',
  country: 'India',
  pincode: '560103',
  founded: '2020',
  employees: '250–500',
  plan: 'Enterprise',
  planExpiry: '2027-01-01',
  accountStatus: 'Active',
  timezone: 'Asia/Kolkata (IST, UTC+5:30)',
  logo: null,
};

// ── Tenants ───────────────────────────────────────────────────────────────────
export const MOCK_TENANTS = [
  { id: 1, name: 'Infosys BPM',         domain: 'infosysbpm.peopleworks.in',   plan: 'Enterprise', users: 420,  activeJobs: 42, recruitersCount: 18, status: 'Active',    createdAt: '2024-03-01', expiryDate: '2027-01-15', lastActivity: '2 mins ago', adminEmail: 'admin@infosysbpm.com', licenseUsage: '420/500', storageUsage: '450 GB', billingStatus: 'Paid', env: 'Production' },
  { id: 2, name: 'Tata Consultancy',    domain: 'tcs.peopleworks.in',          plan: 'Enterprise', users: 1200, activeJobs: 86, recruitersCount: 34, status: 'Active',    createdAt: '2024-04-15', expiryDate: '2027-04-30', lastActivity: 'Just now', adminEmail: 'admin@tcs.com', licenseUsage: '1200/2000', storageUsage: '1.2 TB', billingStatus: 'Paid', env: 'Production' },
  { id: 3, name: 'Wipro HR Division',   domain: 'wipro.peopleworks.in',        plan: 'Professional', users: 310,  activeJobs: 24, recruitersCount: 12, status: 'Active',    createdAt: '2024-06-01', expiryDate: '2026-11-20', lastActivity: '15 mins ago', adminEmail: 'admin@wipro.com', licenseUsage: '310/350', storageUsage: '280 GB', billingStatus: 'Paid', env: 'Production' },
  { id: 4, name: 'HCL Technologies',    domain: 'hcl.peopleworks.in',          plan: 'Professional', users: 180,  activeJobs: 12, recruitersCount: 6,  status: 'Suspended', createdAt: '2024-08-10', expiryDate: '2026-08-01', lastActivity: '3 days ago', adminEmail: 'admin@hcl.com', licenseUsage: '180/200', storageUsage: '190 GB', billingStatus: 'Past Due', env: 'Production' },
  { id: 5, name: 'Mindtree Talent',     domain: 'mindtree.peopleworks.in',     plan: 'Starter',    users: 45,   activeJobs: 8,  recruitersCount: 4,  status: 'Trial',     createdAt: '2025-01-20', expiryDate: '2026-12-10', lastActivity: '1 hr ago', adminEmail: 'admin@mindtree.com', licenseUsage: '45/50', storageUsage: '15 GB', billingStatus: 'Paid', env: 'Sandbox' },
];

// ── API Keys ───────────────────────────────────────────────────────────────────
export const MOCK_API_KEYS = [
  { id: 1, name: 'Greenhouse Webhook Integration', prefix: 'pw_live_8f...2a19', scopes: ['read:candidates', 'write:jobs'], status: 'Active', lastUsed: '2 mins ago', created: '2025-01-10' },
  { id: 2, name: 'Workday HR Sync Key',            prefix: 'pw_live_3b...91ef', scopes: ['read:users', 'write:users', 'export:data'], status: 'Active', lastUsed: '1 hr ago', created: '2025-02-14' },
  { id: 3, name: 'Zapier Automation Relay',        prefix: 'pw_test_1c...00dd', scopes: ['read:jobs'], status: 'Revoked', lastUsed: '3 weeks ago', created: '2024-11-05' },
];

// ── Audit Logs ─────────────────────────────────────────────────────────────────
const auditModules = ['Users', 'Roles', 'Jobs', 'Candidates', 'Offers', 'Settings', 'Auth', 'API Keys'];
const auditActions = ['Login', 'Logout', 'Create', 'Update', 'Delete', 'Export', 'View', 'Revoke'];
const auditUsers   = ['arun.kumar', 'priya.sharma', 'vikram.nair', 'sneha.reddy', 'kavitha.iyer'];
const auditIPs     = ['192.168.1.10', '10.0.0.5', '172.16.0.8', '192.168.2.44', '10.10.1.3'];
const auditStatuses = ['Info', 'Info', 'Info', 'Critical', 'Warn'];
const mockPayloads = [
  '{ "action": "login", "method": "saml_sso", "provider": "okta" }',
  '{ "user_id": "EMP-305", "fields_updated": ["designation", "department"] }',
  '{ "tenant_id": 4, "status": "suspended", "reason": "billing_past_due" }',
  '{ "error": "invalid_credentials", "attempts": 5, "lockout": true }',
  '{ "api_key_id": "sk_live_...2b88", "scopes_added": ["export:data"] }'
];

export const MOCK_AUDIT_LOGS = Array.from({ length: 60 }, (_, i) => {
  const d = new Date('2026-07-24T10:00:00');
  d.setMinutes(d.getMinutes() - i * 18);
  return {
    id: i + 1,
    timestamp: d.toISOString().replace('T', ' ').slice(0, 16),
    user: auditUsers[i % auditUsers.length],
    action: auditActions[i % auditActions.length],
    module: auditModules[i % auditModules.length],
    ip: auditIPs[i % auditIPs.length],
    severity: auditStatuses[i % auditStatuses.length],
    payload: mockPayloads[i % mockPayloads.length],
  };
});
