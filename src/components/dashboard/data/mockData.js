// ══════════════════════════════════════════════════════════════════════════════
// MOCK DATA — Centralized data for all 3 dashboards
// ══════════════════════════════════════════════════════════════════════════════

// ── CEO Mock Data ─────────────────────────────────────────────────────────────

export const CEO_APPROVALS = [
  { id: 'REQ-2041', role: 'VP of Product',      dept: 'Product',   budget: 9500000,  requestedBy: 'Priya M.',  daysPending: 5,  status: 'pending', priority: 'high', hiringManager: 'Priya M.', employmentType: 'Full-time', workLocation: 'Hybrid' },
  { id: 'REQ-2038', role: 'Chief Data Officer', dept: 'Analytics', budget: 24000000, requestedBy: 'Ravi K.',   daysPending: 8,  status: 'pending', priority: 'critical', hiringManager: 'Ravi K.', employmentType: 'Full-time', workLocation: 'On-site' },
  { id: 'REQ-2031', role: 'Director – Finance', dept: 'Finance',   budget: 7200000,  requestedBy: 'Shreya T.', daysPending: 12, status: 'pending', priority: 'high', hiringManager: 'Shreya T.', employmentType: 'Full-time', workLocation: 'Hybrid' },
  { id: 'REQ-2027', role: 'Head of Legal',      dept: 'Legal',     budget: 6800000,  requestedBy: 'Anand P.',  daysPending: 15, status: 'pending', priority: 'medium', hiringManager: 'Anand P.', employmentType: 'Contract', workLocation: 'Remote' },
];

export const CEO_RISKS = [
  { severity: 'HIGH',   sev_color: '#ef4444', icon: '🔴', title: 'REQ-0901 – VP of Engineering',         detail: 'No shortlist submitted in 45 days. 3 JD revisions pending. Business impact: product roadmap at risk.', sla: 45, impact: '₹12L/week', escalated: true, riskOwner: 'Aravind S. (TA Lead)', vendorAgencyActive: true, actionPlan: 'Schedule alignment call with hiring manager' },
  { severity: 'HIGH',   sev_color: '#ef4444', icon: '🔴', title: 'IT Dept – 28 open roles, 3 interviews', detail: 'Low interview-to-shortlist ratio. Sourcing pipeline is thin. Recommend external agency activation.', sla: 38, impact: '₹8.4L/week', escalated: false, riskOwner: 'Aravind S. (TA Lead)', vendorAgencyActive: false, actionPlan: 'Activate external sourcing agency partners' },
  { severity: 'MEDIUM', sev_color: '#f59e0b', icon: '🟡', title: 'Offer acceptance dropping in Finance',  detail: 'Acceptance rate fell from 91% to 78% in last 6 weeks. Compensation benchmarking recommended.', sla: 22, impact: '₹3.2L/week', escalated: false, riskOwner: 'Neha G. (HR Lead)', vendorAgencyActive: false, actionPlan: 'Initiate compensation benchmarking review' },
  { severity: 'MEDIUM', sev_color: '#f59e0b', icon: '🟡', title: 'Sales headcount 40% below target',      detail: 'Q3 target: 45 hires. Current: 27. At current velocity, shortfall of 18 by quarter end.', sla: 30, impact: '₹5.1L/week', escalated: false, riskOwner: 'Pooja V. (Sales Recruiter)', vendorAgencyActive: true, actionPlan: 'Conduct weekend drive for Sales Executives' },
  { severity: 'LOW',    sev_color: '#3b82f6', icon: '🔵', title: 'Marketing JD not published – 12 days',  detail: 'REQ-2044 draft is awaiting HR Admin review. No blocker identified. Follow-up recommended.', sla: 12, impact: '₹0.8L/week', escalated: false, riskOwner: 'Rohit S. (HR Executive)', vendorAgencyActive: false, actionPlan: 'Follow up on JD draft approval' },
];

export const CEO_AI_INSIGHTS = [
  {
    icon: '⚡', headline: 'IT dept hiring 22% faster than last quarter',
    detail: 'Average time-to-hire dropped from 26 to 18 days. Primary driver: improved JD quality and pre-screened talent pools.',
    confidence: 92, confLabel: 'High', confColor: '#22c55e',
    action: 'Scale JD templates to other depts',
    bg: 'from-blue-50/60 to-indigo-50/60 dark:from-blue-950/20 dark:to-indigo-950/20',
    border: 'border-blue-100/60 dark:border-blue-800/20',
  },
  {
    icon: '🎯', headline: 'Referral channel has highest offer acceptance at 97%',
    detail: 'Compared to LinkedIn (82%) and Naukri (74%). Increasing referral budget by 15% could yield 18+ quality hires.',
    confidence: 88, confLabel: 'High', confColor: '#22c55e',
    action: 'Increase referral budget 15%',
    bg: 'from-violet-50/60 to-purple-50/60 dark:from-violet-950/20 dark:to-purple-950/20',
    border: 'border-violet-100/60 dark:border-violet-800/20',
  },
  {
    icon: '🔴', headline: 'Sales dept time-to-hire is 8 days above benchmark',
    detail: 'Average 34 days vs 26-day industry benchmark. Root cause: JD revisions cycle averaging 6 iterations.',
    confidence: 75, confLabel: 'Medium', confColor: '#f59e0b',
    action: 'Standardise JD templates',
    bg: 'from-rose-50/60 to-orange-50/60 dark:from-rose-950/20 dark:to-orange-950/20',
    border: 'border-rose-100/60 dark:border-rose-800/20',
  },
  {
    icon: '📈', headline: 'Offer acceptance improving — up 6% YoY',
    detail: 'Currently at 94%. Driven by flexible work policies added in Q2. Projected to reach 96% by Dec if compensation bands are revised.',
    confidence: 70, confLabel: 'Medium', confColor: '#f59e0b',
    action: 'Revise Finance comp bands',
    bg: 'from-teal-50/60 to-emerald-50/60 dark:from-teal-950/20 dark:to-emerald-950/20',
    border: 'border-teal-100/60 dark:border-teal-800/20',
  },
];

export const CEO_HEATMAP = {
  departments: ['IT', 'Operations', 'Sales', 'Finance', 'HR', 'Marketing'],
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  // Values: 0-100 representing hiring velocity, null = upcoming month (no data yet)
  data: [
    [88, 92, 85, 90, 95, 93, 96, null, null, null, null, null], // IT
    [72, 78, 80, 85, 82, 88, 90, null, null, null, null, null], // Operations
    [65, 58, 52, 48, 45, 42, 40, null, null, null, null, null], // Sales
    [80, 75, 70, 68, 72, 70, 74, null, null, null, null, null], // Finance
    [90, 92, 95, 88, 90, 95, 93, null, null, null, null, null], // HR
    [55, 60, 45, 50, 48, 42, 38, null, null, null, null, null], // Marketing
  ],
};

export const CEO_BOARD_METRICS = [
  { label: 'Cost Per Hire', value: 42000, type: 'currency', trendVal: -3000, trendPct: 6.7, trendUp: true, color: '#22c55e', trendPeriod: 'vs Last Month' },
  { label: 'Time to Fill', value: 22, type: 'days', trendVal: -4, trendPct: 15.4, trendUp: true, color: '#3b82f6', trendPeriod: 'vs Last Month' },
  { label: 'Quality of Hire', value: 8.4, type: 'ratio', trendVal: 0.6, trendPct: 7.7, trendUp: true, color: '#7c3aed', trendPeriod: 'vs Last Month' },
  { label: 'Attrition Risk', value: 4.2, type: 'percentage', trendVal: -1.1, trendPct: 20.8, trendUp: true, color: '#14b8a6', trendPeriod: 'vs Last Month' },
  { label: 'Offer-to-Join', value: 94, type: 'percentage', trendVal: 2, trendPct: 2.2, trendUp: true, color: '#f59e0b', trendPeriod: 'vs Last Month' },
  { label: 'Pipeline Health', value: 3.2, type: 'ratio', trendVal: 0.4, trendPct: 14.3, trendUp: true, color: '#6366f1', trendPeriod: 'vs Last Month' },
  { label: 'Total Employees', value: 2450, type: 'count', trendVal: 120, trendPct: 5.1, trendUp: true, color: '#10b981', trendPeriod: 'vs Last Quarter' },
  { label: 'Open Positions', value: 84, type: 'count', trendVal: -12, trendPct: 12.5, trendUp: true, color: '#ef4444', trendPeriod: 'vs Last Month' },
];

// ── HR Admin Mock Data ────────────────────────────────────────────────────────

export const HR_ACTION_ITEMS = [
  { id: 1, type: 'approval', text: '3 requisitions pending your approval', badge: '3', color: '#64748b', icon: '📋', action: 'Review Now' },
  { id: 2, type: 'jd',       text: '2 JDs need review before publishing', badge: '2', color: '#64748b', icon: '📝', action: 'Review JDs' },
  { id: 3, type: 'interview', text: '6 interviews to schedule this week', badge: '6', color: '#8b5cf6', icon: '📅', action: 'Schedule' },
  { id: 4, type: 'offer',    text: '2 offers expiring today — action required', badge: '2', color: '#f97316', icon: '⏰', action: 'Send Offers' },
  { id: 5, type: 'joiner',   text: '4 new joiners onboarding next Monday', badge: '4', color: '#22c55e', icon: '🎉', action: 'View Details' },
];

export const HR_KANBAN_INITIAL = {
  'Draft': [
    { id: 'REQ-2050', role: 'UI/UX Designer', dept: 'Product', days: 2 },
    { id: 'REQ-2051', role: 'Content Writer', dept: 'Marketing', days: 1 },
  ],
  'Pending Approval': [
    { id: 'REQ-2048', role: 'DevOps Lead', dept: 'IT', days: 5 },
    { id: 'REQ-2049', role: 'Business Analyst', dept: 'Finance', days: 3 },
  ],
  'Approved': [
    { id: 'REQ-2045', role: 'Sr. Cloud Architect', dept: 'IT', days: 8 },
    { id: 'REQ-2046', role: 'Data Engineer', dept: 'Analytics', days: 6 },
  ],
  'JD Published': [
    { id: 'REQ-2040', role: 'Product Manager', dept: 'Product', days: 12 },
    { id: 'REQ-2042', role: 'Sales Executive', dept: 'Sales', days: 10 },
    { id: 'REQ-2043', role: 'QA Engineer', dept: 'IT', days: 9 },
  ],
  'Hiring': [
    { id: 'REQ-2035', role: 'Backend Developer', dept: 'IT', days: 18 },
    { id: 'REQ-2036', role: 'HR Coordinator', dept: 'HR', days: 15 },
  ],
  'Closed': [
    { id: 'REQ-2030', role: 'Frontend Developer', dept: 'IT', days: 25 },
  ],
};

export const HR_INTERVIEW_CALENDAR = [
  { date: 'Today', time: '10:00 AM', candidate: 'Sarah Jenkins', role: 'Sr. Cloud Architect', interviewer: 'Ravi K.', round: 'R2', link: '#', status: 'upcoming' },
  { date: 'Today', time: '11:30 AM', candidate: 'Michael Chen', role: 'Backend Developer', interviewer: 'Priya M.', round: 'R1', link: '#', status: 'upcoming' },
  { date: 'Today', time: '2:00 PM', candidate: 'Aisha Nair', role: 'Frontend Developer', interviewer: 'Anand P.', round: 'Final', link: '#', status: 'upcoming' },
  { date: 'Today', time: '4:00 PM', candidate: 'David Kim', role: 'Data Engineer', interviewer: 'Shreya T.', round: 'R1', link: '#', status: 'upcoming' },
  { date: 'Tomorrow', time: '9:30 AM', candidate: 'Elena Rodriguez', role: 'VP of Engineering', interviewer: 'CEO Panel', round: 'Final', link: '#', status: 'scheduled' },
  { date: 'Tomorrow', time: '11:00 AM', candidate: 'Vikram Singh', role: 'Project Manager', interviewer: 'Ravi K.', round: 'R2', link: '#', status: 'scheduled' },
  { date: 'Tomorrow', time: '3:00 PM', candidate: 'Priya Sharma', role: 'DevOps Engineer', interviewer: 'Anand P.', round: 'R1', link: '#', status: 'scheduled' },
  { date: 'Day After', time: '10:00 AM', candidate: 'Rahul Mehta', role: 'Data Analyst', interviewer: 'Shreya T.', round: 'R1', link: '#', status: 'scheduled' },
];

export const HR_SLA_DATA = [
  { stage: 'Requisition Approval', avg: 3.2, target: 3, status: 'on-track', color: '#22c55e' },
  { stage: 'JD Creation', avg: 5.8, target: 5, status: 'at-risk', color: '#f59e0b' },
  { stage: 'Sourcing', avg: 8.4, target: 7, status: 'breaching', color: '#ef4444' },
  { stage: 'Screening', avg: 2.1, target: 3, status: 'on-track', color: '#22c55e' },
  { stage: 'Interview Scheduling', avg: 3.5, target: 4, status: 'on-track', color: '#22c55e' },
  { stage: 'Offer Release', avg: 4.8, target: 3, status: 'breaching', color: '#ef4444' },
];

export const HR_ACTIVITIES = [
  { title: 'Requisition REQ-1102 Approved', time: '2 min ago', tag: 'Approved', color: '#3b82f6', icon: '✓' },
  { title: 'JD Published for Sr. Cloud Architect', time: '15 min ago', tag: 'JD Live', color: '#3b82f6', icon: '📄' },
  { title: 'Candidate Sarah Jenkins Shortlisted', time: '1 hr ago', tag: 'Shortlisted', color: '#8b5cf6', icon: '⭐' },
  { title: 'Interview Scheduled – Michael Chen', time: '2 hr ago', tag: 'Interview', color: '#8b5cf6', icon: '📅' },
  { title: 'Offer Released to Elena Rodriguez', time: '3 hr ago', tag: 'Offer', color: '#f97316', icon: '🤝' },
  { title: 'New Joiner Onboarded – David Kim', time: 'Yesterday', tag: 'Joined', color: '#22c55e', icon: '🎉' },
];

export const HR_CANDIDATES = [
  { name: 'Sarah Jenkins',   exp: '8 yrs · Amazon',  role: 'Sr. Cloud Architect',    reqId: 'REQ-1042', match: 96 },
  { name: 'Michael Chen',    exp: '5 yrs · Stripe',  role: 'Backend Engineer (Node)', reqId: 'REQ-1088', match: 92 },
  { name: 'Elena Rodriguez', exp: '12 yrs · Google', role: 'VP of Engineering',       reqId: 'REQ-0901', match: 88 },
  { name: 'David Kim',       exp: '3 yrs · Startup', role: 'Frontend Developer',      reqId: 'REQ-1102', match: 85 },
  { name: 'Anjali Rao',      exp: '7 yrs · Flipkart',role: 'Data Scientist',          reqId: 'REQ-1099', match: 83 },
];

// ── Hiring Manager Mock Data ──────────────────────────────────────────────────

export const MGR_REQUISITIONS = [
  { id: 'REQ-1055', role: 'DevOps Engineer',     dept: 'IT',        status: 'Hiring',    daysOpen: 18, candidates: 12, nextAction: 'Schedule R2 Interview', recruiter: 'Pooja V.', priority: 'high', budget: 2200000, slaStatus: 'on-track' },
  { id: 'REQ-1061', role: 'Data Analyst',         dept: 'Analytics', status: 'Screening', daysOpen: 8,  candidates: 24, nextAction: 'Review Shortlist', recruiter: 'Rohit S.', priority: 'medium', budget: 1400000, slaStatus: 'on-track' },
  { id: 'REQ-1072', role: 'Frontend Developer',   dept: 'IT',        status: 'Interview', daysOpen: 14, candidates: 8,  nextAction: 'Submit Feedback', recruiter: 'Pooja V.', priority: 'high', budget: 1600000, slaStatus: 'at-risk' },
  { id: 'REQ-1038', role: 'Project Manager',      dept: 'PMO',       status: 'Offer',     daysOpen: 22, candidates: 3,  nextAction: 'Approve Offer Letter', recruiter: 'Rohit S.', priority: 'high', budget: 2500000, slaStatus: 'breached' },
  { id: 'REQ-1080', role: 'QA Automation Lead',   dept: 'IT',        status: 'JD Review', daysOpen: 3,  candidates: 0,  nextAction: 'Approve JD Draft', recruiter: 'Pooja V.', priority: 'medium', budget: 1800000, slaStatus: 'on-track' },
  { id: 'REQ-1085', role: 'Business Analyst',     dept: 'Finance',   status: 'Sourcing',  daysOpen: 10, candidates: 15, nextAction: 'Review Profiles', recruiter: 'Rohit S.', priority: 'low', budget: 1500000, slaStatus: 'on-track' },
];

export const MGR_INTERVIEWS = [
  { date: 'Today', time: '10:30 AM', candidate: 'Priya Sharma',  role: 'DevOps Engineer',     round: 'R2', link: 'https://meet.google.com/abc', status: 'upcoming' },
  { date: 'Today', time: '2:00 PM',  candidate: 'Rahul Mehta',   role: 'Data Analyst',         round: 'R1', link: 'https://meet.google.com/def', status: 'upcoming' },
  { date: 'Today', time: '4:30 PM',  candidate: 'Aisha Nair',    role: 'Frontend Developer',   round: 'Final', link: 'https://meet.google.com/ghi', status: 'upcoming' },
  { date: 'Tomorrow', time: '11:00 AM', candidate: 'Vikram Singh', role: 'Project Manager',    round: 'R2', link: 'https://meet.google.com/jkl', status: 'scheduled' },
  { date: 'Tomorrow', time: '3:00 PM',  candidate: 'Neha Gupta',   role: 'QA Automation Lead', round: 'R1', link: 'https://meet.google.com/mno', status: 'scheduled' },
];

export const MGR_COMPARISON_CANDIDATES = [
  {
    name: 'Priya Sharma', avatar: 'PS', exp: '4 yrs', company: 'Infosys',
    role: 'DevOps Engineer', reqId: 'REQ-1055',
    skills: { 'Docker': 90, 'Kubernetes': 85, 'CI/CD': 92, 'AWS': 78, 'Terraform': 80 },
    salary: 1800000, expected: 2200000, match: 91,
    feedback: [
      { interviewer: 'Ravi K.', round: 'R1', rating: 4.2, comment: 'Strong on DevOps fundamentals' },
    ],
    education: 'B.Tech, NIT Trichy',
    noticePeriod: 30,
    technicalScore: 88,
    cultureFit: 4.6,
    preferredLocation: 'Hybrid',
    aiSummary: 'Fast learner, strong CI/CD automation expertise, low notice period.',
    hiringProbability: 91,
    salaryFit: 'Within Budget',
    noticeRisk: 'Low',
  },
  {
    name: 'Arjun Reddy', avatar: 'AR', exp: '5 yrs', company: 'TCS',
    role: 'DevOps Engineer', reqId: 'REQ-1055',
    skills: { 'Docker': 82, 'Kubernetes': 90, 'CI/CD': 85, 'AWS': 92, 'Terraform': 75 },
    salary: 1600000, expected: 2000000, match: 87,
    feedback: [
      { interviewer: 'Ravi K.', round: 'R1', rating: 3.8, comment: 'Good AWS knowledge, needs CI/CD depth' },
    ],
    education: 'M.Tech, IIT Hyderabad',
    noticePeriod: 60,
    technicalScore: 84,
    cultureFit: 4.0,
    preferredLocation: 'On-site',
    aiSummary: 'Good AWS skills, but has longer 60 days notice period and needs training in Terraform.',
    hiringProbability: 78,
    salaryFit: 'Within Budget',
    noticeRisk: 'Medium',
  },
  {
    name: 'Kavitha Nair', avatar: 'KN', exp: '6 yrs', company: 'Wipro',
    role: 'DevOps Engineer', reqId: 'REQ-1055',
    skills: { 'Docker': 95, 'Kubernetes': 88, 'CI/CD': 90, 'AWS': 85, 'Terraform': 92 },
    salary: 2000000, expected: 2500000, match: 94,
    feedback: [
      { interviewer: 'Ravi K.', round: 'R1', rating: 4.5, comment: 'Excellent across all areas' },
    ],
    education: 'B.Tech, VIT Vellore',
    noticePeriod: 45,
    technicalScore: 96,
    cultureFit: 4.8,
    preferredLocation: 'Remote',
    aiSummary: 'Outstanding technical profile across CI/CD & Terraform. Salary expectation exceeds current budget.',
    hiringProbability: 94,
    salaryFit: 'Exceeds Budget',
    noticeRisk: 'Low',
  },
];

export const MGR_FEEDBACK_PENDING = [
  { id: 1, candidate: 'Aisha Nair',    role: 'Frontend Developer', date: '2 days ago', round: 'R1', urgent: true },
  { id: 2, candidate: 'Vikram Singh',  role: 'Project Manager',    date: '3 days ago', round: 'R2', urgent: true },
  { id: 3, candidate: 'Neha Gupta',    role: 'QA Automation Lead', date: '5 days ago', round: 'R1', urgent: false },
];

export const MGR_CANDIDATES = [
  { name: 'Priya Sharma',  exp: '4 yrs · Infosys', role: 'DevOps Engineer',    reqId: 'REQ-1055', match: 91 },
  { name: 'Rahul Mehta',   exp: '6 yrs · TCS',     role: 'Data Analyst',       reqId: 'REQ-1061', match: 87 },
  { name: 'Aisha Nair',    exp: '2 yrs · Startup',  role: 'Frontend Developer', reqId: 'REQ-1072', match: 84 },
  { name: 'Vikram Singh',  exp: '9 yrs · Wipro',    role: 'Project Manager',    reqId: 'REQ-1038', match: 89 },
];

// ── Notification Mock Data ────────────────────────────────────────────────────

export const NOTIFICATIONS = {
  ceo: [
    { id: 1, type: 'approval', text: 'REQ-2038 — Chief Data Officer pending 8 days', time: '2m ago', read: false, color: '#ef4444' },
    { id: 2, type: 'escalation', text: 'VP of Engineering — auto-escalated (45 days)', time: '1h ago', read: false, color: '#ef4444' },
    { id: 3, type: 'insight', text: 'AI: IT dept hiring 22% faster — review insight', time: '3h ago', read: true, color: '#3b82f6' },
    { id: 4, type: 'budget', text: 'IT dept budget at 96% — projected overrun ₹4.2L', time: '5h ago', read: true, color: '#f59e0b' },
  ],
  hradmin: [
    { id: 1, type: 'approval', text: '3 requisitions pending your approval', time: '5m ago', read: false, color: '#ef4444' },
    { id: 2, type: 'interview', text: 'Interview with Sarah Jenkins in 30 min', time: '30m ago', read: false, color: '#3b82f6' },
    { id: 3, type: 'offer', text: '2 offers expiring today — action required', time: '1h ago', read: false, color: '#f59e0b' },
    { id: 4, type: 'joiner', text: '4 new joiners onboarding next Monday', time: '2h ago', read: true, color: '#22c55e' },
    { id: 5, type: 'candidate', text: 'New AI match: 96% for Sr. Cloud Architect', time: '4h ago', read: true, color: '#7c3aed' },
  ],
  manager: [
    { id: 1, type: 'interview', text: 'Interview with Priya Sharma at 10:30 AM', time: '15m ago', read: false, color: '#3b82f6' },
    { id: 2, type: 'feedback', text: 'Feedback pending: Aisha Nair (2 days overdue)', time: '2h ago', read: false, color: '#ef4444' },
    { id: 3, type: 'candidate', text: '3 new candidates shortlisted for DevOps role', time: '3h ago', read: false, color: '#7c3aed' },
    { id: 4, type: 'approval', text: 'REQ-1080 JD approved by HR — ready to publish', time: '5h ago', read: true, color: '#22c55e' },
  ],
  super_admin: [
    { id: 1, type: 'alert', text: 'High API latency detected on Server-4', time: '10m ago', read: false, color: '#ef4444' },
    { id: 2, type: 'tenant', text: 'New Enterprise Tenant "Acme Corp" registered', time: '1h ago', read: false, color: '#22c55e' },
  ],
  pw_ceo: [
    { id: 1, type: 'revenue', text: 'MRR crossed ₹4.5Cr milestone', time: '2h ago', read: false, color: '#22c55e' },
    { id: 2, type: 'churn', text: 'Client "Beta Inc" downgraded to Starter plan', time: '5h ago', read: false, color: '#f59e0b' },
  ]
};

// ── Super Admin Mock Data (Platform Level) ────────────────────────────────────

export const SA_METRICS = [
  { label: 'Active Tenants', value: 342, type: 'count', trendVal: 12, trendPct: 3.6, trendUp: true, color: '#3b82f6', trendPeriod: 'vs Last Month' },
  { label: 'Platform Users', value: 45200, type: 'count', trendVal: 1200, trendPct: 2.7, trendUp: true, color: '#8b5cf6', trendPeriod: 'vs Last Month' },
  { label: 'API Requests', value: 2400000, type: 'count', trendVal: 200000, trendPct: 9.1, trendUp: true, color: '#14b8a6', trendPeriod: 'daily avg' },
  { label: 'Avg Response Time', value: 185, type: 'ms', trendVal: -12, trendPct: 6.1, trendUp: true, color: '#22c55e', trendPeriod: 'vs Last Month' },
  { label: 'System Error Rate', value: 0.04, type: 'percentage', trendVal: -0.01, trendPct: 20.0, trendUp: true, color: '#22c55e', trendPeriod: 'vs Last Month' },
  { label: 'Open Support Tickets', value: 28, type: 'count', trendVal: 5, trendPct: 21.7, trendUp: false, color: '#f59e0b', trendPeriod: 'vs Last Month' },
  { label: 'Server Status', value: 'Optimal', type: 'text', trendVal: 100, trendPct: 100, trendUp: true, color: '#10b981', trendPeriod: 'CPU Load 42%' },
  { label: 'DB Query Health', value: 99.98, type: 'percentage', trendVal: 0.02, trendPct: 0.02, trendUp: true, color: '#10b981', trendPeriod: 'Stable' },
  { label: 'Backup Status', value: '100% Success', type: 'text', trendVal: 0, trendPct: 0, trendUp: true, color: '#6366f1', trendPeriod: 'Daily Auto' },
];

export const SA_RECENT_TENANTS = [
  { id: 1, name: 'Acme Corp', plan: 'Enterprise', status: 'Active', users: 1250, date: 'Today', mrr: 250000, billingCycle: 'Annual', storage: '142 GB', apiCalls: 48200, renewalDate: '2027-07-20', adminEmail: 'admin@acme.com' },
  { id: 2, name: 'TechFlow', plan: 'Professional', status: 'Active', users: 450, date: 'Yesterday', mrr: 85000, billingCycle: 'Monthly', storage: '48 GB', apiCalls: 12400, renewalDate: '2026-08-25', adminEmail: 'admin@techflow.com' },
  { id: 3, name: 'Global Retail', plan: 'Enterprise', status: 'Provisioning', users: 3200, date: '2 days ago', mrr: 450000, billingCycle: 'Annual', storage: '310 GB', apiCalls: 89100, renewalDate: '2027-06-15', adminEmail: 'billing@globalretail.com' },
  { id: 4, name: 'StartUp Labs', plan: 'Starter', status: 'Active', users: 45, date: '3 days ago', mrr: 15000, billingCycle: 'Monthly', storage: '8 GB', apiCalls: 1800, renewalDate: '2026-11-10', adminEmail: 'contact@startuplabs.io' },
];

// ── PW CEO Mock Data (SaaS Business Level) ────────────────────────────────────

export const PW_CEO_METRICS = [
  { label: 'Annual Rec. Rev (ARR)', value: 540000000, type: 'currency', trendVal: 40000000, trendPct: 8.0, trendUp: true, color: '#22c55e', trendPeriod: 'vs Last Month' },
  { label: 'Customer Churn', value: 1.2, type: 'percentage', trendVal: -0.3, trendPct: 20.0, trendUp: true, color: '#3b82f6', trendPeriod: 'vs Last Quarter' },
  { label: 'Cust. Acquisition Cost', value: 120000, type: 'currency', trendVal: -10000, trendPct: 7.7, trendUp: true, color: '#8b5cf6', trendPeriod: 'vs Last Quarter' },
  { label: 'Active Subscriptions', value: 342, type: 'count', trendVal: 12, trendPct: 3.6, trendUp: true, color: '#14b8a6', trendPeriod: 'vs Last Month' },
  { label: 'Upgrades (This Month)', value: 15, type: 'count', trendVal: 4, trendPct: 36.4, trendUp: true, color: '#f59e0b', trendPeriod: 'vs Last Month' },
  { label: 'ARPU', value: 130000, type: 'currency', trendVal: 5000, trendPct: 4.0, trendUp: true, color: '#6366f1', trendPeriod: 'vs Last Month' },
  { label: 'New Customers (Monthly)', value: 24, type: 'count', trendVal: 6, trendPct: 33.3, trendUp: true, color: '#22c55e', trendPeriod: 'vs Last Month' },
  { label: 'Trial → Paid Conversion', value: 68, type: 'percentage', trendVal: 4, trendPct: 6.2, trendUp: true, color: '#7c3aed', trendPeriod: 'vs Last Quarter' },
];

export const PW_CEO_GROWTH_INSIGHTS = [
  { icon: '🚀', title: 'SaaS Growth', details: 'ARR increased 12% this month due to Enterprise plan expansion led by Acme Corp.' },
  { icon: '📉', title: 'Retention Health', details: 'Customer churn remains below the industry average at 1.2%, signaling strong product-market fit.' },
  { icon: '⚠️', title: 'CAC Alert', details: 'CAC increased 18% in the EMEA region due to seasonal marketing campaigns. Budget optimization is underway.' },
  { icon: '📊', title: 'Revenue Share', details: 'Enterprise tier customers contributed 72% of total platform recurring revenue YTD.' },
];
