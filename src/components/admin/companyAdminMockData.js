// ══════════════════════════════════════════════════════════════════════════════
// COMPANY ADMINISTRATION MOCK DATA — 12 Sub-Modules
// ══════════════════════════════════════════════════════════════════════════════

// 1. Company Setup Checklist
export const MOCK_SETUP_CHECKLIST = [
  { stepNo: 1, stepKey: 'legal_profile', moduleName: 'Company Profile & Registration', requirement: 'Mandatory', status: 'Completed', updatedAt: '2026-07-20 10:15', updatedBy: 'Arun Kumar' },
  { stepNo: 2, stepKey: 'departments', moduleName: 'Department Hierarchy', requirement: 'Mandatory', status: 'Completed', updatedAt: '2026-07-21 14:30', updatedBy: 'Priya Sharma' },
  { stepNo: 3, stepKey: 'business_units', moduleName: 'Business Units / Operating Divisions', requirement: 'Optional', status: 'Completed', updatedAt: '2026-07-21 16:00', updatedBy: 'Priya Sharma' },
  { stepNo: 4, stepKey: 'locations', moduleName: 'Locations & Office Sites', requirement: 'Mandatory', status: 'Completed', updatedAt: '2026-07-22 09:45', updatedBy: 'Arun Kumar' },
  { stepNo: 5, stepKey: 'cost_centers', moduleName: 'Cost Centers & Financial Accounts', requirement: 'Mandatory', status: 'Completed', updatedAt: '2026-07-22 11:20', updatedBy: 'Deepak Joshi' },
  { stepNo: 6, stepKey: 'designations', moduleName: 'Designations & Job Titles', requirement: 'Mandatory', status: 'Completed', updatedAt: '2026-07-22 15:10', updatedBy: 'Priya Sharma' },
  { stepNo: 7, stepKey: 'grades', moduleName: 'Job Grades, Bands & Notice Periods', requirement: 'Mandatory', status: 'Completed', updatedAt: '2026-07-23 11:00', updatedBy: 'Priya Sharma' },
  { stepNo: 8, stepKey: 'employment_types', moduleName: 'Employment Contracts & Statutory Flags', requirement: 'Mandatory', status: 'Completed', updatedAt: '2026-07-23 14:15', updatedBy: 'Priya Sharma' },
  { stepNo: 9, stepKey: 'work_calendars', moduleName: 'Work Calendars & Shift Hours', requirement: 'Mandatory', status: 'Completed', updatedAt: '2026-07-24 09:30', updatedBy: 'Arun Kumar' },
  { stepNo: 10, stepKey: 'holiday_lists', moduleName: 'Holiday Calendars & Regional Lists', requirement: 'Mandatory', status: 'Completed', updatedAt: '2026-07-24 11:45', updatedBy: 'Priya Sharma' },
  { stepNo: 11, stepKey: 'approval_workflows', moduleName: 'Approval Chains & SLA Policies', requirement: 'Mandatory', status: 'In Progress', updatedAt: '2026-07-25 08:30', updatedBy: 'Priya Sharma' },
  { stepNo: 12, stepKey: 'go_live_check', moduleName: 'System Verification & Go-Live Checklist', requirement: 'Mandatory', status: 'Pending', updatedAt: '—', updatedBy: '—' },
];

// 2. Company Profile
export const MOCK_COMPANY_PROFILE = {
  legalName: 'PeopleWorks Technologies Pvt. Ltd.',
  tradeName: 'PeopleWorks HR Suite',
  entityType: 'Private Limited Company',
  cin: 'U72900KA2020PTC123456',
  pan: 'AAACP1234F',
  gstin: '29AAACP1234F1Z5',
  tan: 'BLRP12345E',
  pfCode: 'PYKNG0012345000',
  esiCode: '31000123450000101',
  fiscalYearStart: 'April 1',
  currency: 'INR (₹)',
  timezone: 'Asia/Kolkata (UTC+05:30)',
  website: 'https://peopleworks.in',
  email: 'contact@peopleworks.in',
  phone: '+91 80 4567 8900',
  addressLine1: '4th Floor, Prestige Tech Park',
  addressLine2: 'Outer Ring Road, Kadubeesanahalli',
  city: 'Bangalore',
  state: 'Karnataka',
  country: 'India',
  pincode: '560103',
  logoUrl: '',
};

// 3. Departments
export const MOCK_DEPARTMENTS = [
  { id: 1, code: 'DEP-EXEC-01', name: 'Executive Leadership', parentDept: '—', headName: 'Arun Kumar', headRole: 'CEO', headAvatar: 'AK', costCenterCode: 'CC-EXEC-100', headcount: 6, budget: '₹ 18,000,000', status: 'Active' },
  { id: 2, code: 'DEP-ENG-01',  name: 'Software Engineering', parentDept: 'Product & Tech', headName: 'Vikram Nair', headRole: 'VP Engineering', headAvatar: 'VN', costCenterCode: 'CC-ENG-101', headcount: 85, budget: '₹ 95,000,000', status: 'Active' },
  { id: 3, code: 'DEP-HR-01',   name: 'Human Resources', parentDept: 'Executive Leadership', headName: 'Priya Sharma', headRole: 'VP HR', headAvatar: 'PS', costCenterCode: 'CC-HR-102', headcount: 14, budget: '₹ 22,000,000', status: 'Active' },
  { id: 4, code: 'DEP-FIN-01',  name: 'Finance & Accounting', parentDept: 'Executive Leadership', headName: 'Deepak Joshi', headRole: 'CFO', headAvatar: 'DJ', costCenterCode: 'CC-FIN-201', headcount: 12, budget: '₹ 28,000,000', status: 'Active' },
  { id: 5, code: 'DEP-PROD-01', name: 'Product Management', parentDept: 'Product & Tech', headName: 'Ananya Das', headRole: 'Director Product', headAvatar: 'AD', costCenterCode: 'CC-PROD-103', headcount: 24, budget: '₹ 38,000,000', status: 'Active' },
  { id: 6, code: 'DEP-SALES-01',name: 'Global Sales & BD', parentDept: 'Executive Leadership', headName: 'Suresh Pillai', headRole: 'VP Sales', headAvatar: 'SP', costCenterCode: 'CC-SALES-301', headcount: 45, budget: '₹ 62,000,000', status: 'Active' },
  { id: 7, code: 'DEP-OPS-01',  name: 'Customer Operations', parentDept: 'Executive Leadership', headName: 'Kavitha Iyer', headRole: 'Head of Ops', headAvatar: 'KI', costCenterCode: 'CC-OPS-401', headcount: 32, budget: '₹ 30,000,000', status: 'Active' },
];

// 4. Business Units
export const MOCK_BUSINESS_UNITS = [
  { id: 1, code: 'BU-SAAS-ENT', name: 'Enterprise HR SaaS Division', headName: 'Priya Sharma', headAvatar: 'PS', currency: 'INR (₹)', headcount: 180, deptsCount: 5, status: 'Active', description: 'Core cloud enterprise HRMS & Payroll operations' },
  { id: 2, code: 'BU-AI-LABS',  name: 'PeopleWorks AI & Analytics Labs', headName: 'Vikram Nair', headAvatar: 'VN', currency: 'USD ($)', headcount: 38, deptsCount: 2, status: 'Active', description: 'Next-gen HR intelligence, predictive attrition & resume matching AI' },
  { id: 3, code: 'BU-APAC-OPS', name: 'APAC Regional Services', headName: 'Suresh Pillai', headAvatar: 'SP', currency: 'SGD ($)', headcount: 42, deptsCount: 3, status: 'Active', description: 'APAC regional customer support, implementation and compliance' },
];

// 5. Locations
export const MOCK_LOCATIONS = [
  { id: 1, code: 'LOC-BLR-HQ',  name: 'Bangalore Global HQ', type: 'Headquarters', city: 'Bangalore', state: 'Karnataka', country: 'India', timezone: 'Asia/Kolkata (UTC+05:30)', geofence: 150, capacity: 500, headcount: 310, calendarName: 'India Standard 5-Day', status: 'Active' },
  { id: 2, code: 'LOC-MUM-REG', name: 'Mumbai Regional Office', type: 'Regional Office', city: 'Mumbai', state: 'Maharashtra', country: 'India', timezone: 'Asia/Kolkata (UTC+05:30)', geofence: 100, capacity: 120, headcount: 65, calendarName: 'India Standard 5-Day', status: 'Active' },
  { id: 3, code: 'LOC-DEL-BR',  name: 'Delhi NCR Hub', type: 'Branch Office', city: 'Gurugram', state: 'Haryana', country: 'India', timezone: 'Asia/Kolkata (UTC+05:30)', geofence: 200, capacity: 80, headcount: 42, calendarName: 'India Standard 5-Day', status: 'Active' },
  { id: 4, code: 'LOC-SGP-APAC',name: 'Singapore APAC Hub', type: 'International Office', city: 'Singapore', state: 'Central Region', country: 'Singapore', timezone: 'Asia/Singapore (UTC+08:00)', geofence: 100, capacity: 50, headcount: 28, calendarName: 'APAC Regional 5-Day', status: 'Active' },
  { id: 5, code: 'LOC-REM-GLOBAL',name: 'Remote Global Workforce', type: 'Remote Base', city: 'Virtual Hub', state: 'Global', country: 'Multiple', timezone: 'Flexible', geofence: 0, capacity: 1000, headcount: 45, calendarName: 'Flexible Global Work Calendar', status: 'Active' },
];

// 6. Cost Centers
export const MOCK_COST_CENTERS = [
  { id: 1, code: 'CC-EXEC-100', name: 'Executive Operations Ledger', deptName: 'Executive Leadership', ownerName: 'Arun Kumar', ownerAvatar: 'AK', annualBudget: '₹ 18,000,000', ytdSpend: '₹ 11,200,000', spendPct: 62, currency: 'INR', status: 'Active' },
  { id: 2, code: 'CC-ENG-101',  name: 'Engineering & R&D Ledger', deptName: 'Software Engineering', ownerName: 'Vikram Nair', ownerAvatar: 'VN', annualBudget: '₹ 95,000,000', ytdSpend: '₹ 68,400,000', spendPct: 72, currency: 'INR', status: 'Active' },
  { id: 3, code: 'CC-HR-102',   name: 'Human Resources & Talent Ledger', deptName: 'Human Resources', ownerName: 'Priya Sharma', ownerAvatar: 'PS', annualBudget: '₹ 22,000,000', ytdSpend: '₹ 14,300,000', spendPct: 65, currency: 'INR', status: 'Active' },
  { id: 4, code: 'CC-FIN-201',  name: 'Finance & Compliance Ledger', deptName: 'Finance & Accounting', ownerName: 'Deepak Joshi', ownerAvatar: 'DJ', annualBudget: '₹ 28,000,000', ytdSpend: '₹ 17,900,000', spendPct: 64, currency: 'INR', status: 'Active' },
  { id: 5, code: 'CC-PROD-103', name: 'Product Strategy & UX Ledger', deptName: 'Product Management', ownerName: 'Ananya Das', ownerAvatar: 'AD', annualBudget: '₹ 38,000,000', ytdSpend: '₹ 24,700,000', spendPct: 65, currency: 'INR', status: 'Active' },
  { id: 6, code: 'CC-SALES-301',name: 'Global Sales & Marketing Ledger', deptName: 'Global Sales & BD', ownerName: 'Suresh Pillai', ownerAvatar: 'SP', annualBudget: '₹ 62,000,000', ytdSpend: '₹ 46,500,000', spendPct: 75, currency: 'INR', status: 'Active' },
];

// 7. Designations
export const MOCK_DESIGNATIONS = [
  { id: 1, code: 'DESG-VP-ENG', title: 'VP of Engineering', deptName: 'Software Engineering', jobFamily: 'Engineering Leadership', gradeName: 'Grade G8 (VP/Exec)', minSalary: '₹ 4,500,000', maxSalary: '₹ 7,500,000', employeeCount: 2, status: 'Active' },
  { id: 2, code: 'DESG-SR-ARCH',title: 'Principal Software Architect', deptName: 'Software Engineering', jobFamily: 'Engineering', gradeName: 'Grade G6 (Principal)', minSalary: '₹ 3,200,000', maxSalary: '₹ 5,000,000', employeeCount: 5, status: 'Active' },
  { id: 3, code: 'DESG-SR-ENG', title: 'Senior Software Engineer', deptName: 'Software Engineering', jobFamily: 'Engineering', gradeName: 'Grade G4 (Senior)', minSalary: '₹ 1,800,000', maxSalary: '₹ 2,800,000', employeeCount: 42, status: 'Active' },
  { id: 4, code: 'DESG-SDE-2',  title: 'Software Engineer II', deptName: 'Software Engineering', jobFamily: 'Engineering', gradeName: 'Grade G3 (Mid-Level)', minSalary: '₹ 1,200,000', maxSalary: '₹ 1,800,000', employeeCount: 36, status: 'Active' },
  { id: 5, code: 'DESG-HR-BP',  title: 'Senior HR Business Partner', deptName: 'Human Resources', jobFamily: 'Human Resources', gradeName: 'Grade G4 (Senior)', minSalary: '₹ 1,400,000', maxSalary: '₹ 2,200,000', employeeCount: 6, status: 'Active' },
  { id: 6, code: 'DESG-FIN-DIR',title: 'Director of Corporate Finance', deptName: 'Finance & Accounting', jobFamily: 'Finance', gradeName: 'Grade G7 (Director)', minSalary: '₹ 3,500,000', maxSalary: '₹ 5,500,000', employeeCount: 2, status: 'Active' },
  { id: 7, code: 'DESG-PM-LEAD', title: 'Lead Product Manager', deptName: 'Product Management', jobFamily: 'Product', gradeName: 'Grade G5 (Lead)', minSalary: '₹ 2,500,000', maxSalary: '₹ 3,800,000', employeeCount: 8, status: 'Active' },
];

// 8. Grades & Job Bands
export const MOCK_GRADES = [
  { id: 1, code: 'G1', name: 'Entry / Junior Associate', rankOrder: 1, minExpYears: 0.0, noticePeriodDays: 30, probationDays: 180, benefitsTier: 'Tier 3 Standard', travelTier: 'Economy Class', employeeCount: 28, status: 'Active' },
  { id: 2, code: 'G2', name: 'Associate Professional', rankOrder: 2, minExpYears: 2.0, noticePeriodDays: 30, probationDays: 90, benefitsTier: 'Tier 3 Standard', travelTier: 'Economy Class', employeeCount: 65, status: 'Active' },
  { id: 3, code: 'G3', name: 'Mid-Level Professional', rankOrder: 3, minExpYears: 4.0, noticePeriodDays: 60, probationDays: 90, benefitsTier: 'Tier 2 Premium', travelTier: 'Economy Plus', employeeCount: 110, status: 'Active' },
  { id: 4, code: 'G4', name: 'Senior Individual Contributor', rankOrder: 4, minExpYears: 7.0, noticePeriodDays: 60, probationDays: 90, benefitsTier: 'Tier 2 Premium', travelTier: 'Economy Plus', employeeCount: 85, status: 'Active' },
  { id: 5, code: 'G5', name: 'Lead / Team Manager', rankOrder: 5, minExpYears: 10.0, noticePeriodDays: 90, probationDays: 90, benefitsTier: 'Tier 1 Executive', travelTier: 'Business Class Domestic', employeeCount: 42, status: 'Active' },
  { id: 6, code: 'G6', name: 'Principal / Senior Manager', rankOrder: 6, minExpYears: 13.0, noticePeriodDays: 90, probationDays: 60, benefitsTier: 'Tier 1 Executive', travelTier: 'Business Class Global', employeeCount: 24, status: 'Active' },
  { id: 7, code: 'G7', name: 'Director / Functional Head', rankOrder: 7, minExpYears: 16.0, noticePeriodDays: 90, probationDays: 30, benefitsTier: 'Tier 1 Executive Plus', travelTier: 'Business Class Global', employeeCount: 12, status: 'Active' },
  { id: 8, code: 'G8', name: 'Vice President / Executive Leadership', rankOrder: 8, minExpYears: 20.0, noticePeriodDays: 90, probationDays: 0, benefitsTier: 'Tier 1 Executive Plus', travelTier: 'First / Business Class', employeeCount: 6, status: 'Active' },
];

// 9. Employment Types
export const MOCK_EMPLOYMENT_TYPES = [
  { id: 1, code: 'EMP-FT', name: 'Full-Time Permanent', isStatutory: true, isBenefits: true, isOvertime: false, weeklyHours: 40.0, employeeCount: 385, status: 'Active', description: 'Standard permanent corporate employment contract' },
  { id: 2, code: 'EMP-PT', name: 'Part-Time Regular', isStatutory: true, isBenefits: true, isOvertime: true, weeklyHours: 20.0, employeeCount: 18, status: 'Active', description: 'Pro-rata hours and benefit entitlement' },
  { id: 3, code: 'EMP-CONT', name: 'Fixed-Term Contractor', isStatutory: false, isBenefits: false, isOvertime: false, weeklyHours: 40.0, employeeCount: 32, status: 'Active', description: 'Direct contract for defined milestone duration' },
  { id: 4, code: 'EMP-INT', name: 'Graduate Trainee / Intern', isStatutory: false, isBenefits: false, isOvertime: false, weeklyHours: 40.0, employeeCount: 24, status: 'Active', description: 'Stipend-based 6-month or 1-year internship program' },
  { id: 5, code: 'EMP-CONS', name: 'Retained Consultant', isStatutory: false, isBenefits: false, isOvertime: false, weeklyHours: 15.0, employeeCount: 8, status: 'Active', description: 'Specialist retainer agreement' },
];

// 10. Work Calendars
export const MOCK_WORK_CALENDARS = [
  { id: 1, code: 'CAL-IND-STD', name: 'India Standard 5-Day Work Week', locationName: 'Bangalore HQ', workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], shiftTiming: '09:00 AM – 06:00 PM', flexiBand: '08:00 AM – 10:00 AM', dailyHours: 8.0, employeeCount: 375, isDefault: true, status: 'Active' },
  { id: 2, code: 'CAL-APAC-STD', name: 'APAC Regional 5-Day Work Week', locationName: 'Singapore Hub', workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], shiftTiming: '08:30 AM – 05:30 PM', flexiBand: '08:00 AM – 09:30 AM', dailyHours: 8.0, employeeCount: 28, isDefault: false, status: 'Active' },
  { id: 3, code: 'CAL-SUPPORT-247', name: '24/7 Operations Rotational Shift', locationName: 'All Office Locations', workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], shiftTiming: 'Rotational 3-Shift (8h)', flexiBand: 'Fixed Shift Schedule', dailyHours: 8.0, employeeCount: 45, isDefault: false, status: 'Active' },
  { id: 4, code: 'CAL-GLOBAL-FLEX', name: 'Global Flexible Work Schedule', locationName: 'Remote Global Workforce', workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], shiftTiming: 'Core Hours 01:00 PM – 05:00 PM IST', flexiBand: '24-hour flexi window', dailyHours: 8.0, employeeCount: 42, isDefault: false, status: 'Active' },
];

// 11. Holiday Lists & Events
export const MOCK_HOLIDAY_LISTS = [
  { id: 1, name: 'India Corporate Holidays 2026', year: 2026, totalHolidays: 14, mandatoryCount: 10, optionalLimit: 4, locationNames: ['Bangalore HQ', 'Mumbai Regional', 'Delhi NCR Hub'], status: 'Active' },
  { id: 2, name: 'Singapore Regional Holidays 2026', year: 2026, totalHolidays: 11, mandatoryCount: 11, optionalLimit: 0, locationNames: ['Singapore Hub'], status: 'Active' },
  { id: 3, name: 'Global US/US-East Holidays 2026', year: 2026, totalHolidays: 10, mandatoryCount: 10, optionalLimit: 2, locationNames: ['Remote Global Workforce'], status: 'Active' },
];

export const MOCK_HOLIDAY_EVENTS = [
  { id: 101, listId: 1, date: '2026-01-26', name: 'Republic Day', dayOfWeek: 'Monday', type: 'Mandatory', region: 'All India Offices' },
  { id: 102, listId: 1, date: '2026-03-04', name: 'Maha Shivratri', dayOfWeek: 'Wednesday', type: 'Mandatory', region: 'All India Offices' },
  { id: 103, listId: 1, date: '2026-03-25', name: 'Holi', dayOfWeek: 'Wednesday', type: 'Mandatory', region: 'All India Offices' },
  { id: 104, listId: 1, date: '2026-04-03', name: 'Good Friday', dayOfWeek: 'Friday', type: 'Mandatory', region: 'All India Offices' },
  { id: 105, listId: 1, date: '2026-05-01', name: 'May Day / Labor Day', dayOfWeek: 'Friday', type: 'Mandatory', region: 'All India Offices' },
  { id: 106, listId: 1, date: '2026-08-15', name: 'Independence Day', dayOfWeek: 'Saturday', type: 'Mandatory', region: 'All India Offices' },
  { id: 107, listId: 1, date: '2026-10-02', name: 'Gandhi Jayanti', dayOfWeek: 'Friday', type: 'Mandatory', region: 'All India Offices' },
  { id: 108, listId: 1, date: '2026-10-20', name: 'Dussehra / Vijayadashami', dayOfWeek: 'Tuesday', type: 'Mandatory', region: 'All India Offices' },
  { id: 109, listId: 1, date: '2026-11-08', name: 'Diwali / Deepavali', dayOfWeek: 'Sunday', type: 'Mandatory', region: 'All India Offices' },
  { id: 110, listId: 1, date: '2026-12-25', name: 'Christmas Day', dayOfWeek: 'Friday', type: 'Mandatory', region: 'All India Offices' },
  { id: 111, listId: 1, date: '2026-01-15', name: 'Pongal / Makar Sankranti', dayOfWeek: 'Thursday', type: 'Restricted / Optional', region: 'User Opt-in' },
  { id: 112, listId: 1, date: '2026-04-14', name: 'Dr. B.R. Ambedkar Jayanti', dayOfWeek: 'Tuesday', type: 'Restricted / Optional', region: 'User Opt-in' },
  { id: 113, listId: 1, date: '2026-09-04', name: 'Janmashtami', dayOfWeek: 'Friday', type: 'Restricted / Optional', region: 'User Opt-in' },
  { id: 114, listId: 1, date: '2026-11-01', name: 'Kannada Rajyotsava', dayOfWeek: 'Sunday', type: 'Restricted / Optional', region: 'Karnataka Locations' },
];

// 12. Approval Workflows
export const MOCK_APPROVAL_WORKFLOWS = [
  { 
    id: 1, 
    code: 'WF-LEAVE-STD', 
    name: 'Standard Leave Approval Workflow', 
    module: 'Leave Management', 
    triggerRule: 'Leave duration > 0 days', 
    stepCount: 2, 
    chainSummary: 'Direct Manager ➔ HR Business Partner', 
    slaHours: 48, 
    status: 'Active',
    steps: [
      { stepNumber: 1, approverType: 'DIRECT_MANAGER', roleName: 'Direct Manager', slaHours: 24, fallbackAction: 'Escalate to Skip-Level' },
      { stepNumber: 2, approverType: 'ROLE_BASED', roleName: 'HR Admin', slaHours: 24, fallbackAction: 'Auto-Approve' },
    ]
  },
  { 
    id: 2, 
    code: 'WF-EXP-EXEC', 
    name: 'High Value Expense Claim Approval', 
    module: 'Expense & Payouts', 
    triggerRule: 'Claim Amount > ₹ 25,000', 
    stepCount: 3, 
    chainSummary: 'Direct Manager ➔ Department Head ➔ Finance Director', 
    slaHours: 72, 
    status: 'Active',
    steps: [
      { stepNumber: 1, approverType: 'DIRECT_MANAGER', roleName: 'Direct Manager', slaHours: 24, fallbackAction: 'Escalate' },
      { stepNumber: 2, approverType: 'DEPARTMENT_HEAD', roleName: 'Department Head', slaHours: 24, fallbackAction: 'Escalate' },
      { stepNumber: 3, approverType: 'ROLE_BASED', roleName: 'Finance Admin', slaHours: 24, fallbackAction: 'Auto-Reject' },
    ]
  },
  { 
    id: 3, 
    code: 'WF-REQ-HEADCOUNT', 
    name: 'New Requisition / Headcount Request', 
    module: 'Recruitment Requisition', 
    triggerRule: 'Any new hiring requisition', 
    stepCount: 3, 
    chainSummary: 'Department Head ➔ VP HR ➔ CEO / Executive', 
    slaHours: 96, 
    status: 'Active',
    steps: [
      { stepNumber: 1, approverType: 'DEPARTMENT_HEAD', roleName: 'Department Head', slaHours: 48, fallbackAction: 'Escalate' },
      { stepNumber: 2, approverType: 'ROLE_BASED', roleName: 'HR Admin', slaHours: 24, fallbackAction: 'Escalate' },
      { stepNumber: 3, approverType: 'SPECIFIC_USER', roleName: 'Arun Kumar (CEO)', slaHours: 24, fallbackAction: 'Hold for Review' },
    ]
  },
  { 
    id: 4, 
    code: 'WF-ATT-REG', 
    name: 'Attendance Regularization & Missed Punch', 
    module: 'Attendance & Shifts', 
    triggerRule: 'Punch regularization request', 
    stepCount: 1, 
    chainSummary: 'Direct Manager', 
    slaHours: 24, 
    status: 'Active',
    steps: [
      { stepNumber: 1, approverType: 'DIRECT_MANAGER', roleName: 'Direct Manager', slaHours: 24, fallbackAction: 'Auto-Approve' },
    ]
  },
];
