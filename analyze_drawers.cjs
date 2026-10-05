const fs = require('fs');
const files = [
  'recruitment/sourcing/EditCampaignDrawer.jsx',
  'recruitment/candidates/EditCandidateDrawer.jsx',
  'admin/FeatureFlags.jsx',
  'admin/UserManagement.jsx',
  'admin/TenantManagement.jsx',
  'admin/SubscriptionBilling.jsx',
  'admin/RoleManagement.jsx',
  'admin/HealthDashboard.jsx',
  'admin/AuditLogs.jsx',
  'admin/company/WorkCalendarManagement.jsx',
  'admin/company/HolidayListManagement.jsx',
  'admin/company/LocationManagement.jsx',
  'admin/company/EmploymentTypeManagement.jsx',
  'admin/company/GradeManagement.jsx',
  'admin/company/DesignationManagement.jsx',
  'admin/company/DepartmentManagement.jsx',
  'admin/company/CostCenterManagement.jsx',
  'admin/company/CompanyProfileView.jsx',
  'admin/company/BusinessUnitManagement.jsx',
  'admin/ApiKeys.jsx',
  'admin/company/ApprovalWorkflowManagement.jsx',
  'admin/AIUsage.jsx',
  'recruitment/sourcing/AddCustomBoardModal.jsx'
];
files.forEach(f => {
  try {
    const content = fs.readFileSync('src/components/' + f, 'utf8');
    const fieldsMatch = content.match(/<DrawerField/g);
    const numFields = fieldsMatch ? fieldsMatch.length : 0;
    
    // Check if it has multiple sections or complex elements
    const sectionsMatch = content.match(/<DrawerSection/g);
    const numSections = sectionsMatch ? sectionsMatch.length : 0;
    
    const lines = content.split('\n').length;
    
    console.log(`${f} | Fields: ${numFields} | Sections: ${numSections} | Lines: ${lines}`);
  } catch (e) { 
    console.error(e.message);
  }
});
