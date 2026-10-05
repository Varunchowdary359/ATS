/**
 * UserDirectoryService
 * Master user directory for PeopleWorks ATS.
 * Provides user lookups, disambiguation, role filtering, and ID resolution
 * for Hiring Managers, Recruiters, Approvers, and HRBPs.
 */

export const MASTER_USERS = [
  { id: 'USR-101', name: 'Alex Chen', email: 'alex.chen@peopleworks.ai', role: 'Hiring Manager', dept: 'Engineering', title: 'Director of Engineering', avatar: 'AC' },
  { id: 'USR-102', name: 'Sarah Jenkins', email: 'sarah.jenkins@peopleworks.ai', role: 'Department Head', dept: 'Human Resources', title: 'Head of Talent / VP HR', avatar: 'SJ' },
  { id: 'USR-103', name: 'David Miller', email: 'david.miller@peopleworks.ai', role: 'Finance Controller', dept: 'Finance & Accounts', title: 'Finance Controller / Director', avatar: 'DM' },
  { id: 'USR-104', name: 'Priya Sharma', email: 'priya.sharma@peopleworks.ai', role: 'Lead Recruiter', dept: 'Talent Acquisition', title: 'Lead Technical Recruiter', avatar: 'PS' },
  { id: 'USR-105', name: 'Ravi Kumar', email: 'ravi.kumar@peopleworks.ai', role: 'Hiring Manager', dept: 'Engineering', title: 'Engineering Manager', avatar: 'RK' },
  { id: 'USR-106', name: 'Ravi Sharma', email: 'ravi.sharma@peopleworks.ai', role: 'Finance Controller', dept: 'Finance & Accounts', title: 'Senior Finance Manager', avatar: 'RS' },
  { id: 'USR-107', name: 'Sujith', email: 'sujith@peopleworks.ai', role: 'Lead Recruiter', dept: 'Talent Acquisition', title: 'Lead Recruiter / ATS Admin', avatar: 'SU' },
  { id: 'USR-108', name: 'Sarah Miller', email: 'sarah.miller@peopleworks.ai', role: 'Lead Recruiter', dept: 'Talent Acquisition', title: 'Senior Recruiter', avatar: 'SM' },
  { id: 'USR-109', name: 'Vikram Malhotra', email: 'vikram.m@peopleworks.ai', role: 'Department Head', dept: 'Engineering', title: 'VP of Engineering', avatar: 'VM' },
  { id: 'USR-110', name: 'Finance Admin', email: 'finance.admin@peopleworks.ai', role: 'Finance Controller', dept: 'Finance', title: 'Finance Admin', avatar: 'FA' }
];

export class UserDirectoryService {
  /**
   * Search users by partial name, role, or department
   */
  static searchUsers(query, roleFilter = null) {
    if (!query) return MASTER_USERS;
    const q = String(query).toLowerCase().trim();
    return MASTER_USERS.filter(u => {
      const matchesText = u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.dept.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      
      if (!roleFilter) return matchesText;
      return matchesText && u.role.toLowerCase().includes(roleFilter.toLowerCase());
    });
  }

  /**
   * Resolve a user string to a validated user record or ambiguous matches
   */
  static resolveUser(input, preferredRole = null) {
    if (!input) return null;
    const raw = String(input).trim();
    const lower = raw.toLowerCase();

    // 1. Exact ID Match
    const exactId = MASTER_USERS.find(u => u.id.toLowerCase() === lower);
    if (exactId) return { user: exactId, isAmbiguous: false, matches: [exactId] };

    // 2. Exact Name Match
    const exactName = MASTER_USERS.find(u => u.name.toLowerCase() === lower);
    if (exactName) return { user: exactName, isAmbiguous: false, matches: [exactName] };

    // 3. Partial Name Matches
    const matches = MASTER_USERS.filter(u => u.name.toLowerCase().includes(lower));

    if (matches.length === 1) {
      return { user: matches[0], isAmbiguous: false, matches };
    }

    if (matches.length > 1) {
      // If preferredRole is specified, try filtering
      if (preferredRole) {
        const roleMatches = matches.filter(u => u.role.toLowerCase().includes(preferredRole.toLowerCase()));
        if (roleMatches.length === 1) {
          return { user: roleMatches[0], isAmbiguous: false, matches: roleMatches };
        }
      }
      return { user: null, isAmbiguous: true, matches };
    }

    return { user: null, isAmbiguous: false, matches: [] };
  }

  /**
   * Get default approver by role
   */
  static getDefaultApprover(role) {
    switch (role) {
      case 'Finance Controller':
      case 'Finance':
        return MASTER_USERS.find(u => u.name === 'David Miller') || MASTER_USERS[2];
      case 'Department Head':
        return MASTER_USERS.find(u => u.name === 'Sarah Jenkins') || MASTER_USERS[1];
      case 'Hiring Manager':
        return MASTER_USERS.find(u => u.name === 'Alex Chen') || MASTER_USERS[0];
      case 'Lead Recruiter':
        return MASTER_USERS.find(u => u.name === 'Priya Sharma') || MASTER_USERS[3];
      default:
        return MASTER_USERS[0];
    }
  }
}
