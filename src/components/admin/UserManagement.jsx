import React, { useState, useMemo, useContext, useEffect } from 'react';
import { MOCK_USERS } from '../admin/adminMockData';
import { useToast } from '../shared/ToastContext';
import { ThemeContext } from '../../ThemeContext';
import ConfirmModal from './shared/ConfirmModal';
import { useBreadcrumb } from '../shared/BreadcrumbContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernCardGrid,
  ModernStatusBadge,
  ModernEmptyState,
  DrawerSection,
  DrawerField,
} from './shared/ModernAdminLayoutComponents';
import { Users, UserCheck, ShieldCheck, KeyRound, Eye, Edit3, Trash2, Shield, Building, Mail, CheckCircle2, X, Save, Clock, Lock, AlertTriangle } from 'lucide-react';
import CustomSelect from '../dashboard/shared/CustomSelect';

const ROLE_ACCESS_SCOPE = {
  'CEO':            ['Full System Access', 'Financial Analytics', 'Audit Logs', 'API Keys'],
  'HR Admin':       ['User Provisioning', 'Workforce Directory', 'Leave Approval', 'Reports Export'],
  'Hiring Manager': ['Job Requisitions', 'Candidate Pipelines', 'Interview Scorecards'],
  'Recruiter':      ['Job Postings', 'Candidate Sourcing', 'Interview Scheduling'],
  'Viewer':         ['Read-Only Dashboards', 'Reports Export', 'Directory Lookup'],
  'IT Auditor':     ['Audit Logs Stream', 'API Key Management', 'Security Policies'],
};

const ROLE_ACCENT_STYLES = {
  'CEO': { accent: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', tagBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' },
  'HR Admin': { accent: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', tagBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
  'Hiring Manager': { accent: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
  'Recruiter': { accent: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', tagBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
  'Viewer': { accent: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400', tagBg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  'IT Auditor': { accent: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', tagBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' },
};

// ── Inspector Drawer Component ───────────────────────────────────────────────
const UserProfilePage = ({ user, onClose, brandColor }) => {
  if (!user) return null;
  
  return (
    <div className="w-full h-full flex flex-col bg-slate-50/50 dark:bg-[#0a0a0a] animate-fade-in relative z-10 overflow-y-auto scrollbar-thin pb-20">
      {/* Sticky Header with Quick Actions */}
      <div className="px-6 py-6 md:px-10 mx-auto w-full max-w-[1600px] border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1017] sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              {user.name}
              <ModernStatusBadge status={user.status} />
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_ACCENT_STYLES[user.role]?.tagBg || 'bg-slate-100 text-slate-700'}`}>{user.role}</span>
            </h1>
            <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Reset Password
            </button>
            <button className="h-9 px-4 text-xs font-bold text-rose-600 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
              <Shield className="w-4 h-4" /> Suspend
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <button onClick={onClose} className="h-9 w-9 flex justify-center items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 3-Column Enterprise Grid Layout */}
      <div className="flex-1 px-6 md:px-10 mt-8 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: Identity & Entitlements (25%) */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full font-bold text-xl flex items-center justify-center shadow-sm mb-3" style={{ backgroundColor: brandColor || 'var(--pw-brand)', color: 'var(--pw-brand-fg, #ffffff)' }}>
                {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">{user.name}</h2>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{user.empId || 'EMP-UNKNOWN'}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-left">
                <div><label className="text-[10px] uppercase font-bold text-slate-400">Department</label><div className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{user.department || 'General Operations'}</div></div>
                <div><label className="text-[10px] uppercase font-bold text-slate-400">Direct Manager</label><div className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Unassigned</div></div>
                <div><label className="text-[10px] uppercase font-bold text-slate-400">System Role Assigned</label><div className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{user.role}</div></div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
              <h3 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                Security Posture
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Multi-Factor Auth</span>
                  {user.mfaEnabled ? 
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Enforced</span> : 
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Disabled</span>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Last Password Change</span>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">45 days ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Failed Logins</span>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Activity & Matrix (75%) */}
          <div className="lg:col-span-9 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
              <h3 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Building className="w-4 h-4 text-slate-400" />
                Granted Modules (Role Inherited)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2 font-bold text-[13px] text-slate-800 dark:text-slate-200 mb-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Recruitment Hub</div>
                  <p className="text-[11px] text-slate-500 font-medium ml-5">Full read/write access to candidates, requisitions, and interviews.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2 font-bold text-[13px] text-slate-800 dark:text-slate-200 mb-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Administration</div>
                  <p className="text-[11px] text-slate-500 font-medium ml-5">Access based on exact role definitions.</p>
                </div>
              </div>
              <button className="mt-3 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors">View Full Permission Matrix →</button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
              <h3 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                Audit Timeline
              </h3>
              
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-6 pb-2">
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1 border-2 border-white dark:border-slate-900"></div>
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Logged In Successfully</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">{user.lastActive || '2 mins ago'} • IP: 192.168.1.45</div>
                </div>
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-full -left-[7px] top-1 border-2 border-white dark:border-slate-900"></div>
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Role Changed to {user.role}</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">By System Admin • 3 months ago</div>
                </div>
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-full -left-[7px] top-1 border-2 border-white dark:border-slate-900"></div>
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Account Provisioned</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">By Auto-Provisioning Service • 1 year ago</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// ── Edit/Add Drawer Component ────────────────────────────────────────────────
const UserDrawer = ({ user, isOpen, onClose, onSave, brandColor }) => {
  const { addToast } = useToast();
  const defaultForm = { name: '', email: '', role: 'Recruiter', status: 'Active', mfaEnabled: true, empId: `EMP-${Math.floor(100 + Math.random() * 900)}` };
  const [form, setForm] = useState(user || defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (user) setForm(user);
    else setForm(defaultForm);
  }, [user]);

  const hasChanges = user ? JSON.stringify(form) !== JSON.stringify(user) : JSON.stringify(form) !== JSON.stringify(defaultForm);

  const handleSaveInternal = () => {
    if (!form.name.trim() || !form.email.trim()) {
      addToast({ title: 'Validation Error', message: 'Name and Email are required fields.', type: 'error' });
      return;
    }
    
    setIsSaving(true);
    setTimeout(() => {
      onSave(form);
      setIsSaving(false);
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-drawer-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50"
          >
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h2 id="user-drawer-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">{user ? 'Edit User Entitlements' : 'Provision User Account'}</h2>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{user ? 'Update user identity, role access, and status' : 'Create a new user profile in directory'}</p>
              </div>
              <button onClick={onClose} aria-label="Close dialog" className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <DrawerSection title="Identity Details" description="Basic user profile information">
                <DrawerField label="Full Name" required>
                  <input 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                    placeholder="e.g. Arun Kumar" 
                    autoComplete="name"
                    aria-required="true"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  />
                </DrawerField>
                <DrawerField label="Corporate Email" required>
                  <input 
                    value={form.email} 
                    type="email"
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                    placeholder="e.g. arun.kumar@company.com" 
                    autoComplete="email"
                    aria-required="true"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  />
                </DrawerField>
              </DrawerSection>

              <DrawerSection title="Access & Security" description="System role and active status">
                <div className="grid grid-cols-2 gap-4">
                  <DrawerField label="System Role">
                    <CustomSelect 
                      value={form.role} 
                      onChange={val => setForm(f => ({ ...f, role: val }))} 
                      options={['CEO', 'HR Admin', 'Hiring Manager', 'Recruiter', 'Viewer', 'IT Auditor'].map(r => ({label: r, value: r}))} 
                    />
                  </DrawerField>
                  <DrawerField label="Status">
                    <CustomSelect 
                      value={form.status} 
                      onChange={val => setForm(f => ({ ...f, status: val }))} 
                      options={['Active', 'Inactive', 'Suspended'].map(s => ({label: s, value: s}))} 
                    />
                  </DrawerField>
                </div>
              </DrawerSection>
            </div>
            
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button onClick={onClose} disabled={isSaving} className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button 
                onClick={handleSaveInternal} 
                disabled={isSaving || (!hasChanges && !!user)}
                className="px-5 py-2 text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ 
                  backgroundColor: (!hasChanges && !!user) ? '#94a3b8' : (brandColor || 'var(--pw-brand)'),
                  color: (!hasChanges && !!user) ? '#ffffff' : 'var(--pw-brand-fg, #ffffff)'
                }}
              >
                {isSaving ? 'Processing...' : (!hasChanges && user ? 'No Changes' : (user ? <><Save size={16}/> Save Changes</> : 'Provision Account'))}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ── Main User Management Page ────────────────────────────────────────────────
const UserManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All Roles');
  const [viewMode, setViewMode] = useState('grid');
  const [drawerUser, setDrawerUser] = useState(null);
  const [inspectorUser, setInspectorUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const { extraCrumbs, setExtraCrumbs, clearExtraCrumbs } = useBreadcrumb();

  useEffect(() => {
    if (inspectorUser) {
      setExtraCrumbs([{ label: inspectorUser.name }]);
    } else {
      clearExtraCrumbs();
    }
  }, [inspectorUser]);

  useEffect(() => {
    if (extraCrumbs.length === 0 && inspectorUser) {
      setInspectorUser(null);
    }
  }, [extraCrumbs]);

  const brandColor = activeTheme?.color || '#2563eb';

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.empId.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === 'All Roles' || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  const handleSaveUser = (userData) => {
    if (userData.id) {
      setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
      addToast({ title: 'User Updated', message: `${userData.name}'s account updated.`, type: 'success' });
    } else {
      const newUser = { ...userData, id: `usr-${Date.now()}` };
      setUsers(prev => [newUser, ...prev]);
      addToast({ title: 'User Provisioned', message: `Account created for ${userData.name}.`, type: 'success' });
    }
    setIsDrawerOpen(false);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      addToast({ title: 'User Removed', message: `${userToDelete.name} deleted from directory.`, type: 'success' });
      setUserToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  if (inspectorUser) {
    return <UserProfilePage user={inspectorUser} onClose={() => setInspectorUser(null)} brandColor={brandColor} />;
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Real-time Enterprise Header */}
      <ModernPageHeader
        title="User Identity & Access Directory"
        subtitle="Manage enterprise user accounts, system role entitlements, authentication status, and security compliance"
        icon={<Users className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employee name, email, or ID..."
        filterOptions={['All Roles', 'CEO', 'HR Admin', 'Hiring Manager', 'Recruiter', 'Viewer']}
        activeFilter={filterRole}
        onFilterChange={setFilterRole}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Provision User"
        onPrimaryAction={() => { setDrawerUser(null); setIsDrawerOpen(true); }}
        themeColor={brandColor}
      />

      {/* Refined Enterprise KPI Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Total Enterprise Users', value: users.length, sub: 'Registered directory', icon: <Users className="w-4 h-4" /> },
          { label: 'Active User Accounts', value: users.filter(u=>u.status==='Active').length, sub: 'Operational rate', icon: <UserCheck className="w-4 h-4" /> },
          { label: 'MFA Enforced', value: users.filter(u=>u.mfaEnabled).length, sub: 'Multi-factor active', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'System Roles', value: '5 Roles', sub: 'RBAC Tiers', icon: <KeyRound className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        filteredUsers.length === 0 ? (
          <ModernEmptyState 
            title="No users found" 
            subtitle="No user accounts match your current search and role filters." 
            icon={Users}
          />
        ) : (
          <ModernCardGrid totalCount={users.length} filteredCount={filteredUsers.length} resourceName="user accounts">
            {filteredUsers.map((user) => {
            const styleObj = ROLE_ACCENT_STYLES[user.role] || { accent: 'bg-blue-500', text: 'text-blue-600', tagBg: 'bg-blue-50 text-blue-700 border-blue-200' };

            const accessScopes = ROLE_ACCESS_SCOPE[user.role] || [];
            const visibleScopes = accessScopes.slice(0, 2);
            const remainingScopes = accessScopes.length - visibleScopes.length;

            return (
              <div
                key={user.id}
                className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col gap-0 group hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Accent Stripe */}
                <div className={`absolute top-0 left-0 right-0 h-[3px] ${styleObj.accent}`} />

                {/* Top Row: EmpId tag + Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${styleObj.tagBg}`}>
                    {user.empId} · {user.role}
                  </span>
                  <ModernStatusBadge status={user.status} />
                </div>

                {/* Avatar + Name + Designation */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: brandColor || 'var(--pw-brand)', color: 'var(--pw-brand-fg, #ffffff)' }}
                  >
                    {user.avatar || user.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight truncate group-hover:text-blue-600 transition-colors">
                      {user.name}
                    </h3>
                    <p className="text-slate-400 font-mono text-xs truncate">{user.email}</p>
                  </div>
                </div>

                {/* Designation + Department row */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-snug font-medium truncate">
                  {user.designation} &nbsp;·&nbsp; {user.department}
                </p>

                {/* ACCESS SCOPE section */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Access Scope</p>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider ${styleObj.text}`}>
                      {accessScopes.length} Active
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleScopes.map((scope) => (
                      <span
                        key={scope}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                        {scope}
                      </span>
                    ))}
                    {remainingScopes > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        +{remainingScopes} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Row — matches Role card style */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  {/* Left: Stacked avatar + last active (like Role card's "3 Users") */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                        {user.avatar?.charAt(0) || user.name[0]}
                      </div>
                      <div className="w-6 h-6 rounded-full text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
                        style={{ backgroundColor: brandColor }}>
                        {user.avatar?.charAt(1) || user.name.split(' ')[1]?.[0] || ''}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        {user.mfaEnabled ? (
                          <><ShieldCheck className="w-3 h-3 text-emerald-500" /> MFA On</>
                        ) : (
                          <><AlertTriangle className="w-3 h-3 text-amber-500" /> No MFA</>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {user.lastActive}
                      </span>
                    </div>
                  </div>

                  {/* Right: Action Buttons — matching Role card style */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setInspectorUser(user)}
                      title={`View Profile for ${user.name}`}
                      aria-label={`View Profile for ${user.name}`}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" /> Profile
                    </button>
                    <button
                      onClick={() => { setDrawerUser(user); setIsDrawerOpen(true); }}
                      title={`Edit User ${user.name}`}
                      aria-label={`Edit User ${user.name}`}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setUserToDelete(user)}
                      title={`Delete User ${user.name}`}
                      aria-label={`Delete User ${user.name}`}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                    </button>
                  </div>
                </div>

              </div>
            );
            })}
          </ModernCardGrid>
        )
      ) : (
        /* ── COMPACT TABLE VIEW ── */
        filteredUsers.length === 0 ? (
          <ModernEmptyState 
            title="No users found" 
            subtitle="No user accounts match your current search and role filters." 
            icon={Users}
          />
        ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-md">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th scope="col" className="px-6 py-3.5 text-center">Employee ID</th>
                <th scope="col" className="px-6 py-3.5 text-left">User Name & Email</th>
                <th scope="col" className="px-6 py-3.5 text-center">System Role</th>
                <th scope="col" className="px-6 py-3.5 text-left">Department</th>
                <th scope="col" className="px-6 py-3.5 text-center">MFA Status</th>
                <th scope="col" className="px-6 py-3.5 text-center">Account Status</th>
                <th scope="col" className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredUsers.map((user) => {
                const styleObj = ROLE_ACCENT_STYLES[user.role] || { text: 'text-blue-600', tagBg: 'bg-blue-50 text-blue-700 border-blue-200' };

                return (
                  <tr key={user.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{user.empId}</td>
                    <td className="px-6 py-3.5 text-left">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                        <span>{user.name}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${styleObj.tagBg}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-300">{user.department || 'General'}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${user.mfaEnabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {user.mfaEnabled ? 'Enforced' : 'Off'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex justify-center">
                        <ModernStatusBadge status={user.status} />
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 py-0.5">
                        <button 
                          onClick={() => setInspectorUser(user)} 
                          title={`View details for ${user.name}`}
                          aria-label={`View details for ${user.name}`}
                          className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button 
                          onClick={() => { setDrawerUser(user); setIsDrawerOpen(true); }} 
                          title={`Edit ${user.name}`}
                          aria-label={`Edit ${user.name}`}
                          className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button 
                          onClick={() => setUserToDelete(user)} 
                          title={`Delete ${user.name}`}
                          aria-label={`Delete ${user.name}`}
                          className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )
      )}

      {/* Render logic conditional */}

      <UserDrawer user={drawerUser} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onSave={handleSaveUser} brandColor={brandColor} />
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        isLoading={isDeleting}
        title="Delete User Account"
        message={`Are you sure you want to delete ${userToDelete?.name}'s account?`}
        confirmText="Delete User"
      />
    </div>
  );
};

export default UserManagement;
