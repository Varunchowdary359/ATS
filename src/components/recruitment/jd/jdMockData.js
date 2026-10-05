import React from 'react';

// Initial Roles - Standardized Core Enterprise Personas for JD Module
export const ROLES = [
  { id: 'recruiter',       name: 'Recruiter / JD Owner',              description: 'Drafts JD from mandatory requisition, submits, and publishes' },
  { id: 'hiring_manager', name: 'Hiring Manager',                    description: 'Technical reviewer: validates technical scope and skills' },
  { id: 'hr_lead',        name: 'HR & Compliance Lead',              description: 'Governance & EEO review: grants final publishing clearance' },
  { id: 'admin',          name: 'Super Admin',                       description: 'Full governance, workflow setup, and all overrides' }
];

export const CURRENT_USER_MAP = {
  recruiter: 'Sarah Chen (Recruiter)',
  hiring_manager: 'Alex Rivera (Hiring Manager)',
  hr_lead: 'Elena Rostova (HR & Compliance Lead)',
  hrbp: 'Elena Rostova (HR & Compliance Lead)',
  hr_head: 'Elena Rostova (HR & Compliance Lead)',
  admin: 'System Admin',
  viewer: 'Auditor Viewer'
};

// ─── JD Permission Matrix ─────────────────────────────────────────────────────
export const JD_PERMISSIONS = {
  recruiter:       new Set(['jd.create', 'jd.edit', 'jd.submit', 'jd.publish', 'jd.createVersion', 'jd.duplicate', 'jd.viewAudit', 'jd.archive']),
  hiring_manager:  new Set(['jd.approve', 'jd.requestChanges', 'jd.reject', 'jd.viewAudit', 'jd.archive']),
  hr_lead:         new Set(['jd.approve', 'jd.requestChanges', 'jd.reject', 'jd.publish', 'jd.viewAudit', 'jd.archive']),
  hrbp:            new Set(['jd.approve', 'jd.requestChanges', 'jd.reject', 'jd.publish', 'jd.viewAudit', 'jd.archive']),
  admin:           new Set(['jd.create', 'jd.edit', 'jd.submit', 'jd.approve', 'jd.requestChanges', 'jd.reject', 'jd.publish', 'jd.createVersion', 'jd.duplicate', 'jd.archive', 'jd.viewAudit', 'jd.configWorkflow', 'jd.adminOverride']),
};

/**
 * Check if a given role has a specific JD permission.
 * @param {string} role   - Role id (e.g. 'recruiter', 'admin')
 * @param {string} action - Action key (e.g. 'jd.create', 'jd.approve')
 * @returns {boolean}
 */
export function hasJdPermission(role, action) {
  const perms = JD_PERMISSIONS[role];
  if (!perms) return false;
  return perms.has(action);
}

// Master Department to Cost Center Mappings
export const DEPARTMENT_COST_CENTERS = {
  'Engineering': ['CC-1024', 'CC-1025', 'CC-ENG-01', 'CC-ENG-02'],
  'Sales': ['CC-2048', 'CC-2050', 'CC-SLS-01'],
  'Marketing': ['CC-3010', 'CC-3012', 'CC-MKT-01'],
  'Finance': ['CC-4001', 'CC-4002', 'CC-FIN-01'],
  'Design': ['CC-5010', 'CC-DSG-01'],
  'HR': ['CC-6010', 'CC-HR-01'],
  'HR & Talent': ['CC-6010', 'CC-HR-01'],
  'Product': ['CC-7010', 'CC-PRD-01']
};

/**
 * Validates whether a cost center code belongs to the selected department.
 */
export function validateCostCenterMapping(dept, costCenter) {
  if (!dept || !costCenter) return true;
  const allowed = DEPARTMENT_COST_CENTERS[dept];
  if (!allowed) return true;
  const cleanCc = costCenter.trim().toUpperCase();
  return allowed.some(c => cleanCc.startsWith(c.toUpperCase()) || c.toUpperCase().startsWith(cleanCc));
}

/**
 * Dynamically evaluates and resolves the active approval workflow for a given JD.
 * Returns: { status: 'success' | 'conflict' | 'default', workflow, message }
 */
export function evaluateWorkflowForJd(jd, workflows = INITIAL_WORKFLOW_CONFIGS) {
  if (!Array.isArray(workflows) || workflows.length === 0) {
    workflows = INITIAL_WORKFLOW_CONFIGS;
  }
  const activeRules = workflows.filter(w => w.status !== 'Inactive');
  const jdExp = Number(jd.experienceMin || jd.minExperience || 0);
  const jdDept = (jd.department || '').trim();

  // Find exact department + experience range matches (excluding default fallback)
  const matches = activeRules.filter(w => {
    if (w.isDefault) return false;
    const deptMatch = w.department === 'All Departments' || w.department === jdDept || (w.department && w.department.includes(jdDept));
    const expMatch = jdExp >= (w.minExperience || 0) && jdExp <= (w.maxExperience || 99);
    return deptMatch && expMatch;
  });

  if (matches.length > 1) {
    return {
      status: 'conflict',
      workflow: null,
      message: 'Multiple approval workflows match this JD. Please contact the ATS Administrator to resolve the workflow configuration.'
    };
  }

  if (matches.length === 1) {
    return {
      status: 'success',
      workflow: matches[0],
      message: `Matched approval rule: ${matches[0].name}`
    };
  }

  // Fallback to default workflow
  const defaultWf = activeRules.find(w => w.isDefault) || workflows[0];
  return {
    status: 'default',
    workflow: defaultWf,
    message: `Applied default approval rule: ${defaultWf.name}`
  };
}

// Initial Workflow Configurations (Admin-configured — recruiter cannot change approvers)
export const INITIAL_WORKFLOW_CONFIGS = [
  {
    id: 'WF-STD-001',
    name: 'Standard Enterprise Workflow',
    department: 'All Departments',
    minExperience: 0,
    maxExperience: 20,
    isDefault: true,
    status: 'Active',
    stages: [
      { id: 1, role: 'hiring_manager', roleName: 'Hiring Manager', type: 'sequential', mandatory: true, slaHours: 48 },
      { id: 2, role: 'hr_lead', roleName: 'HR & Compliance Lead', type: 'sequential', mandatory: true, slaHours: 24 }
    ]
  }
];

// Seeded Job Descriptions
// NOTE: stageId 1 = Recruiter submission (status: 'Submitted'), stageId 2-5 = actual approvers
export const INITIAL_JDS = [];
/*
const OLD_MOCK_JDS = [
    employmentType: 'Full-Time',
    workMode: 'Hybrid',
    location: 'San Francisco, CA',
    experienceMin: 5,
    experienceMax: 8,
    positions: 2,

    summary: 'We are seeking a highly skilled Senior Frontend Engineer to lead the architecture and frontend implementation of our enterprise web platforms.',
    responsibilities: '- Architect and build resilient, high-performance web applications using React and TypeScript.\n- Lead frontend architecture reviews and design scalable component libraries.\n- Collaborate closely with UX designers, Product Managers, and Backend Engineers.\n- Mentor junior & mid-level frontend engineers and enforce code quality.',
    requiredSkills: 'React.js, TypeScript, Next.js, Redux/Zustand, Modern CSS, Web Vitals Optimization',
    preferredSkills: 'GraphQL, WebSockets, Micro-frontends, Jest, Cypress, CI/CD pipelines',
    qualifications: 'B.S. or M.S. in Computer Science, Software Engineering, or equivalent practical experience.',
    technicalSkills: 'React 18+, TypeScript 5+, TailwindCSS, Vite, Webpack, Node.js',
    softSkills: 'Technical Leadership, Problem Solving, Cross-functional Communication, Mentorship',

    salaryMin: 140000,
    salaryMax: 175000,
    currency: 'USD',
    variablePay: '15% Annual Performance Bonus',
    benefits: 'Comprehensive Health/Dental/Vision, 401(k) 5% Match, Unlimited PTO, $2,000 Learning Stipend',
    otherComp: '$15,000 Equity grant over 4 years',

    status: 'Published',
    version: 'v1.0',
    versionNum: 1.0,
    createdBy: 'Sarah Chen (Recruiter)',
    creatorRole: 'recruiter',
    currentApproverRole: null,
    currentApproverName: 'Fully Approved & Published',
    createdDate: '2026-07-10',
    lastModified: '2026-07-28',

    approvalChain: [
      { stageId: 1, role: 'recruiter', roleName: 'Recruiter', approverName: 'Sarah Chen', status: 'Submitted', timestamp: '2026-07-10 09:15 AM', comment: 'JD submitted for review' },
      { stageId: 2, role: 'hiring_manager', roleName: 'Hiring Manager', approverName: 'Alex Rivera (VP Eng)', status: 'Approved', timestamp: '2026-07-12 02:30 PM', comment: 'Technical requirements look crisp and accurate.' },
      { stageId: 3, role: 'hrbp', roleName: 'HR / HRBP', approverName: 'Jessica Taylor', status: 'Approved', timestamp: '2026-07-14 11:00 AM', comment: 'Salary range is aligned with Grade L5 benchmarks.' },
      { stageId: 4, role: 'dept_head', roleName: 'Department Head', approverName: 'David Zhang (CTO)', status: 'Approved', timestamp: '2026-07-15 04:45 PM', comment: 'Approved for headcount opening.' },
      { stageId: 5, role: 'hr_head', roleName: 'HR Head (Final)', approverName: 'Elena Rostova', status: 'Approved', timestamp: '2026-07-16 10:00 AM', comment: 'Final approval granted. Published for requisitioning.' }
    ],

    versionHistory: [
      { version: 'v1.0', changedBy: 'Sarah Chen', date: '2026-07-16', summary: 'Published original approved JD version', status: 'Published' }
    ],

    auditTrail: [
      { id: 'AUD-01', user: 'Sarah Chen', role: 'Recruiter', action: 'Created JD', dateTime: '2026-07-10 09:15 AM', version: 'v1.0', previousValue: '-', newValue: 'Draft', comment: 'Created initial draft' },
      { id: 'AUD-02', user: 'Sarah Chen', role: 'Recruiter', action: 'Submitted for Review', dateTime: '2026-07-10 09:30 AM', version: 'v1.0', previousValue: 'Draft', newValue: 'Pending Approval', comment: 'Submitted to Hiring Manager' },
      { id: 'AUD-03', user: 'Alex Rivera', role: 'Hiring Manager', action: 'Approved Stage 2', dateTime: '2026-07-12 02:30 PM', version: 'v1.0', previousValue: 'Pending HM', newValue: 'Pending HRBP', comment: 'Approved tech skills' },
      { id: 'AUD-04', user: 'Jessica Taylor', role: 'HR / HRBP', action: 'Approved Stage 3', dateTime: '2026-07-14 11:00 AM', version: 'v1.0', previousValue: 'Pending HRBP', newValue: 'Pending Dept Head', comment: 'Compensation approved' },
      { id: 'AUD-05', user: 'David Zhang', role: 'Department Head', action: 'Approved Stage 4', dateTime: '2026-07-15 04:45 PM', version: 'v1.0', previousValue: 'Pending Dept Head', newValue: 'Pending HR Head', comment: 'Department approved' },
      { id: 'AUD-06', user: 'Elena Rostova', role: 'HR Head', action: 'Approved & Published', dateTime: '2026-07-16 10:00 AM', version: 'v1.0', previousValue: 'Pending Approval', newValue: 'Published', comment: 'Final approval and published' }
    ]
  },
  {
    id: 'JD-2026-002',
    reqId: 'REQ-2026-0002',
    jobCode: 'SALES-AE-04',
    title: 'Enterprise Account Executive',
    department: 'Sales',
    businessUnit: 'Global Commercial',
    jobFamily: 'Field Sales',
    jobLevel: 'L4 - Mid-Senior',
    employmentType: 'Full-Time',
    workMode: 'On-Site',
    location: 'New York, NY',
    experienceMin: 6,
    experienceMax: 10,
    positions: 3,

    summary: 'Drive high-velocity SaaS enterprise deal execution across Fortune 500 strategic accounts.',
    responsibilities: '- Manage entire sales cycles from prospect discovery to executive pitch and contract execution.\n- Build strong enterprise pipelines and achieve $1.5M annual ARR quotas.\n- Collaborate with Solution Engineers and Product Teams during RFP evaluations.',
    requiredSkills: 'Enterprise B2B SaaS Sales, Contract Negotiation, CRM (Salesforce), Executive Pitching',
    preferredSkills: 'MEDDPICC sales methodology certification, Cloud Security product background',
    qualifications: 'B.A./B.S. degree with 6+ years of quota-carrying B2B SaaS sales experience.',
    technicalSkills: 'Salesforce Enterprise, Outreach, LinkedIn Sales Navigator, Gong',
    softSkills: 'Persuasiveness, High Resilience, Deal Structuring, Strategic Planning',

    salaryMin: 120000,
    salaryMax: 150000,
    currency: 'USD',
    variablePay: '100% OTE Uncapped Commission ($120k variable)',
    benefits: 'Full Health benefits, Car allowance, Executive Travel perks',
    otherComp: 'Quarterly President Club trip eligibility',

    status: 'Pending Approval',
    version: 'v1.0',
    versionNum: 1.0,
    createdBy: 'James Wilson (Recruiter)',
    creatorRole: 'recruiter',
    currentApproverRole: 'hrbp',
    currentApproverName: 'Jessica Taylor (HR / HRBP)',
    createdDate: '2026-07-29',
    lastModified: '2026-08-02',

    approvalChain: [
      { stageId: 1, role: 'recruiter', roleName: 'Recruiter', approverName: 'James Wilson', status: 'Submitted', timestamp: '2026-07-29 11:00 AM', comment: 'JD submitted for review' },
      { stageId: 2, role: 'hiring_manager', roleName: 'Hiring Manager', approverName: 'Marcus Brody', status: 'Approved', timestamp: '2026-08-01 03:20 PM', comment: 'Looks good to target East Coast Enterprise accounts.' },
      { stageId: 3, role: 'hrbp', roleName: 'HR / HRBP', approverName: 'Jessica Taylor', status: 'Pending', timestamp: null, comment: null },
      { stageId: 4, role: 'dept_head', roleName: 'Department Head', approverName: 'Rachel Green (VP Sales)', status: 'Waiting', timestamp: null, comment: null },
      { stageId: 5, role: 'hr_head', roleName: 'HR Head (Final)', approverName: 'Elena Rostova', status: 'Waiting', timestamp: null, comment: null }
    ],

    versionHistory: [
      { version: 'v1.0', changedBy: 'James Wilson', date: '2026-07-29', summary: 'Initial draft submitted for review', status: 'Pending Approval' }
    ],

    auditTrail: [
      { id: 'AUD-10', user: 'James Wilson', role: 'Recruiter', action: 'Created JD', dateTime: '2026-07-29 11:00 AM', version: 'v1.0', previousValue: '-', newValue: 'Draft', comment: 'Draft created' },
      { id: 'AUD-11', user: 'James Wilson', role: 'Recruiter', action: 'Submitted for Review', dateTime: '2026-07-29 11:15 AM', version: 'v1.0', previousValue: 'Draft', newValue: 'Pending Approval', comment: 'Submitted to Hiring Manager' },
      { id: 'AUD-12', user: 'Marcus Brody', role: 'Hiring Manager', action: 'Approved Stage 2', dateTime: '2026-08-01 03:20 PM', version: 'v1.0', previousValue: 'Pending HM', newValue: 'Pending HRBP', comment: 'Approved requirements' }
    ]
  },
  {
    id: 'JD-2026-003',
    reqId: 'REQ-2026-0003',
    jobCode: 'MKT-PMM-02',
    title: 'Senior Product Marketing Manager',
    department: 'Marketing',
    businessUnit: 'Corporate Marketing',
    jobFamily: 'Product Marketing',
    jobLevel: 'L4 - Senior',
    employmentType: 'Full-Time',
    workMode: 'Remote',
    location: 'Austin, TX',
    experienceMin: 4,
    experienceMax: 7,
    positions: 1,

    summary: 'Lead go-to-market messaging, competitive intelligence, and launch strategies for our HR technology suites.',
    responsibilities: '- Define value propositions and product positioning for new feature releases.\n- Build sales enablement collateral, pitch decks, and battlecards.\n- Conduct market research and competitive gap analysis.',
    requiredSkills: 'Product Marketing, GTM Strategy, Content Creation, Competitive Intelligence',
    preferredSkills: 'ATS/HR Tech domain knowledge, Analyst relations (Gartner, Forrester)',
    qualifications: 'B.A. in Marketing, Communications, or Business.',
    technicalSkills: 'HubSpot, Figma, Google Analytics, Notion, Salesforce',
    softSkills: 'Storytelling, Messaging Clarity, Cross-department alignment',

    salaryMin: 110000,
    salaryMax: 135000,
    currency: 'USD',
    variablePay: '10% Annual Bonus',
    benefits: 'Standard Health, Dental, 401(k), Remote Work stipend ($100/mo)',
    otherComp: '$5,000 Equity grant',

    // Changes Requested: JD is back with the original recruiter (Emma Davis)
    status: 'Changes Requested',
    version: 'v1.0',
    versionNum: 1.0,
    createdBy: 'Emma Davis (Recruiter)',
    creatorRole: 'recruiter',
    // Changes Requested: show who requested the change, not who owns it
    currentApproverRole: 'hiring_manager',
    currentApproverName: 'Sarah Jenkins (Director Marketing)',
    changesRequestedBy: 'Sarah Jenkins (Director Marketing)',
    changesRequestedByRole: 'Hiring Manager',
    createdDate: '2026-08-03',
    lastModified: '2026-08-05',

    approvalChain: [
      { stageId: 1, role: 'recruiter', roleName: 'Recruiter', approverName: 'Emma Davis', status: 'Submitted', timestamp: '2026-08-03 01:00 PM', comment: 'JD submitted for review' },
      { stageId: 2, role: 'hiring_manager', roleName: 'Hiring Manager', approverName: 'Sarah Jenkins (Director Marketing)', status: 'Changes Requested', timestamp: '2026-08-05 10:15 AM', comment: 'Please expand the required skills to include Analyst Relations and adjust salary range minimum.' },
      { stageId: 3, role: 'hrbp', roleName: 'HR / HRBP', approverName: 'Jessica Taylor', status: 'Waiting', timestamp: null, comment: null },
      { stageId: 4, role: 'dept_head', roleName: 'Department Head', approverName: 'Tom Holland (CMO)', status: 'Waiting', timestamp: null, comment: null },
      { stageId: 5, role: 'hr_head', roleName: 'HR Head (Final)', approverName: 'Elena Rostova', status: 'Waiting', timestamp: null, comment: null }
    ],

    versionHistory: [
      { version: 'v1.0', changedBy: 'Emma Davis', date: '2026-08-03', summary: 'Created original draft', status: 'Changes Requested' }
    ],

    auditTrail: [
      { id: 'AUD-20', user: 'Emma Davis', role: 'Recruiter', action: 'Created JD', dateTime: '2026-08-03 01:00 PM', version: 'v1.0', previousValue: '-', newValue: 'Draft', comment: 'Initial submission' },
      { id: 'AUD-21', user: 'Emma Davis', role: 'Recruiter', action: 'Submitted for Review', dateTime: '2026-08-03 01:10 PM', version: 'v1.0', previousValue: 'Draft', newValue: 'Pending Approval', comment: 'Submitted to Hiring Manager' },
      { id: 'AUD-22', user: 'Sarah Jenkins', role: 'Hiring Manager', action: 'Requested Changes', dateTime: '2026-08-05 10:15 AM', version: 'v1.0', previousValue: 'Pending Approval', newValue: 'Changes Requested', comment: 'Please expand required skills and adjust salary range minimum.' }
    ]
  },
  {
    id: 'JD-2026-004',
    reqId: 'REQ-2026-0004',
    jobCode: 'FIN-ANL-09',
    title: 'Financial Planning & Analysis Lead',
    department: 'Finance',
    businessUnit: 'Corporate Operations',
    jobFamily: 'Finance & Accounting',
    jobLevel: 'L4 - Senior',
    employmentType: 'Full-Time',
    workMode: 'Hybrid',
    location: 'Chicago, IL',
    experienceMin: 5,
    experienceMax: 8,
    positions: 1,

    summary: 'Oversee corporate financial modeling, annual budget planning, and executive reporting.',
    responsibilities: '- Build financial forecasting models for multi-department budgets.\n- Deliver quarterly revenue and expenditure analysis to CFO.\n- Evaluate capital allocation for key engineering & sales initiatives.',
    requiredSkills: 'Financial Modeling, Budgeting, Corporate Forecasting, SQL, Excel Advanced',
    preferredSkills: 'CPA/CFA credential, Anaplan or NetSuite experience',
    qualifications: 'B.S. in Finance, Accounting, or Economics.',
    technicalSkills: 'Excel, NetSuite, Tableau, Anaplan, PowerBI',
    softSkills: 'Analytical Precision, Executive Presentation',

    salaryMin: 125000,
    salaryMax: 155000,
    currency: 'USD',
    variablePay: '12% Performance Bonus',
    benefits: 'Standard Health & Retirement benefits',
    otherComp: 'N/A',

    status: 'Draft',
    version: 'v1.0',
    versionNum: 1.0,
    createdBy: 'Sarah Chen (Recruiter)',
    creatorRole: 'recruiter',
    currentApproverRole: null,
    currentApproverName: '\u2014',
    createdDate: '2026-08-08',
    lastModified: '2026-08-08',

    approvalChain: [
      { stageId: 1, role: 'recruiter', roleName: 'Recruiter', approverName: 'Sarah Chen', status: 'Pending', timestamp: null, comment: null },
      { stageId: 2, role: 'hiring_manager', roleName: 'Hiring Manager', approverName: 'Robert Vance (CFO)', status: 'Waiting', timestamp: null, comment: null },
      { stageId: 3, role: 'hrbp', roleName: 'HR / HRBP', approverName: 'Jessica Taylor', status: 'Waiting', timestamp: null, comment: null },
      { stageId: 4, role: 'dept_head', roleName: 'Department Head', approverName: 'Robert Vance', status: 'Waiting', timestamp: null, comment: null },
      { stageId: 5, role: 'hr_head', roleName: 'HR Head (Final)', approverName: 'Elena Rostova', status: 'Waiting', timestamp: null, comment: null }
    ],

    versionHistory: [
      { version: 'v1.0', changedBy: 'Sarah Chen', date: '2026-08-08', summary: 'Initial draft saved', status: 'Draft' }
    ],

    auditTrail: [
      { id: 'AUD-30', user: 'Sarah Chen', role: 'Recruiter', action: 'Created Draft', dateTime: '2026-08-08 09:00 AM', version: 'v1.0', previousValue: '-', newValue: 'Draft', comment: 'Saved draft in progress' }
    ]
  },
  {
    id: 'JD-2026-005',
    reqId: 'REQ-2026-0005',
    jobCode: 'HR-HRBP-03',
    title: 'HR Business Partner \u2013 Technology',
    department: 'HR & Talent',
    businessUnit: 'People Operations',
    jobFamily: 'Human Resources',
    jobLevel: 'L4 - Senior',
    employmentType: 'Full-Time',
    workMode: 'Hybrid',
    location: 'Austin, TX',
    experienceMin: 5,
    experienceMax: 9,
    positions: 1,

    summary: 'Act as strategic HR partner for our Technology and Engineering divisions, managing talent lifecycle, workforce planning, and organizational design.',
    responsibilities: '- Partner with Technology leaders on workforce planning and org design.\n- Lead talent review and succession planning cycles.\n- Provide coaching on performance management and complex employee relations.',
    requiredSkills: 'HRBP experience, Workforce Planning, Performance Management, Employee Relations, HR Analytics',
    preferredSkills: 'Tech sector HR experience, SHRM-SCP/SPHR certification',
    qualifications: 'B.S./M.S. in HR Management or Business Administration.',
    technicalSkills: 'Workday, SAP SuccessFactors, Excel, Tableau',
    softSkills: 'Executive Presence, Conflict Resolution, Strategic Thinking',

    salaryMin: 115000,
    salaryMax: 140000,
    currency: 'USD',
    variablePay: '10% Annual Bonus',
    benefits: 'Comprehensive Health, 401(k) 4% Match, Unlimited PTO',
    otherComp: 'N/A',

    status: 'Rejected',
    version: 'v1.0',
    versionNum: 1.0,
    createdBy: 'James Wilson (Recruiter)',
    creatorRole: 'recruiter',
    currentApproverRole: 'dept_head',
    currentApproverName: 'David Zhang (CTO)',
    rejectedBy: 'David Zhang (CTO)',
    rejectedByRole: 'Department Head',
    createdDate: '2026-08-06',
    lastModified: '2026-08-10',

    approvalChain: [
      { stageId: 1, role: 'recruiter', roleName: 'Recruiter', approverName: 'James Wilson', status: 'Submitted', timestamp: '2026-08-06 09:00 AM', comment: 'JD submitted for review' },
      { stageId: 2, role: 'hiring_manager', roleName: 'Hiring Manager', approverName: 'Alex Rivera (VP Eng)', status: 'Approved', timestamp: '2026-08-07 11:00 AM', comment: 'Looks good' },
      { stageId: 3, role: 'hrbp', roleName: 'HR / HRBP', approverName: 'Jessica Taylor', status: 'Approved', timestamp: '2026-08-08 02:00 PM', comment: 'Compensation aligned' },
      { stageId: 4, role: 'dept_head', roleName: 'Department Head', approverName: 'David Zhang (CTO)', status: 'Rejected', timestamp: '2026-08-10 10:30 AM', comment: 'This headcount is not aligned with our current tech hiring freeze. Cannot approve at this time.' },
      { stageId: 5, role: 'hr_head', roleName: 'HR Head (Final)', approverName: 'Elena Rostova', status: 'Waiting', timestamp: null, comment: null }
    ],

    versionHistory: [
      { version: 'v1.0', changedBy: 'James Wilson', date: '2026-08-06', summary: 'Initial draft submitted', status: 'Rejected' }
    ],

    auditTrail: [
      { id: 'AUD-40', user: 'James Wilson', role: 'Recruiter', action: 'Created JD', dateTime: '2026-08-06 09:00 AM', version: 'v1.0', previousValue: '-', newValue: 'Draft', comment: 'Created' },
      { id: 'AUD-41', user: 'James Wilson', role: 'Recruiter', action: 'Submitted for Review', dateTime: '2026-08-06 09:15 AM', version: 'v1.0', previousValue: 'Draft', newValue: 'Pending Approval', comment: 'Submitted to Hiring Manager' },
      { id: 'AUD-42', user: 'Alex Rivera', role: 'Hiring Manager', action: 'Approved Stage 2', dateTime: '2026-08-07 11:00 AM', version: 'v1.0', previousValue: 'Pending HM', newValue: 'Pending HRBP', comment: 'Approved' },
      { id: 'AUD-43', user: 'Jessica Taylor', role: 'HR / HRBP', action: 'Approved Stage 3', dateTime: '2026-08-08 02:00 PM', version: 'v1.0', previousValue: 'Pending HRBP', newValue: 'Pending Dept Head', comment: 'Approved' },
      { id: 'AUD-44', user: 'David Zhang', role: 'Department Head', action: 'Rejected JD', dateTime: '2026-08-10 10:30 AM', version: 'v1.0', previousValue: 'Pending Dept Head', newValue: 'Rejected', comment: 'Hiring freeze \u2014 cannot approve this headcount.' }
    ]
  }
];
*/

export const MOCK_NOTIFICATIONS = [];
