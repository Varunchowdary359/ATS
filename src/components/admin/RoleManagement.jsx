import React, { useState, useMemo, useContext } from 'react';
import { MOCK_ROLES } from '../admin/adminMockData';
import { useToast } from '../shared/ToastContext';
import { ThemeContext } from '../../ThemeContext';
import ConfirmModal from './shared/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernCardGrid,
  ModernStatusBadge,
  ModernEmptyState,
  DrawerSection,
  DrawerField,
  CompactRadioCard
} from './shared/ModernAdminLayoutComponents';
import { ShieldCheck, Shield, KeyRound, Users, Eye, Edit3, Trash2, CheckCircle2, Lock, X, Save } from 'lucide-react';

const ROLE_PERMISSIONS_MAP = {
  'CEO': ['Full System Governance', 'Financial Analytics', 'Executive Dashboard', 'Payroll Approval', 'User Provisioning', 'Audit Trace'],
  'HR Admin': ['User Provisioning', 'Workforce Directory', 'Leave Approval', 'Compensation Rules', 'Role Delegation', 'Compliance'],
  'Hiring Manager': ['Job Requisitions', 'Candidate Pipelines', 'Interview Scorecards', 'Offer Approvals', 'Team Analytics'],
  'Recruiter': ['Job Postings', 'Candidate Sourcing', 'Interview Scheduling', 'Resume Parser', 'Talent Pool'],
  'Viewer': ['Read-Only Dashboards', 'Reports Export', 'Directory Lookup'],
  'IT Auditor': ['Audit Logs Stream', 'API Key Management', 'Security Policies', 'SAML SSO Config', 'IP Whitelist'],
};

const ROLE_ACCENT_STYLES = {
  'CEO': { accent: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', tagBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' },
  'HR Admin': { accent: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', tagBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
  'Hiring Manager': { accent: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
  'Recruiter': { accent: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', tagBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
  'Viewer': { accent: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400', tagBg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  'IT Auditor': { accent: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', tagBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' },
};

// ── Role Inspector Drawer ──────────────────────────────────────────────────────
const RoleInspectorDrawer = ({ role, isOpen, onClose, brandColor }) => {
  const permList = ROLE_PERMISSIONS_MAP[role?.name] || ['General Access', 'Dashboard View', 'Audit Trail'];
  
  return (
    <AnimatePresence>
      {isOpen && role && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50"
          >
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  {role.name}
                </h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{role.description}</p>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center justify-between">
                <span>Granted Permission Matrix</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">{permList.length} Rules Active</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {permList.map((perm, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{perm}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      ALLOWED
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const RoleEditorPage = ({ role, onClose, onSave, brandColor }) => {
  const { addToast } = useToast();
  const defaultForm = { name: '', description: '', type: 'Custom' };
  const [form, setForm] = useState(role || defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [activeModule, setActiveModule] = useState('Recruitment');

  const modules = ['Recruitment', 'Administration', 'Settings', 'Integrations'];
  
  // Dummy permissions grid for UI purpose
  const [permissions, setPermissions] = useState({
    'Recruitment': { 'View Jobs': true, 'Create Jobs': false, 'Edit Candidates': true, 'Delete Candidates': false, 'Offer Approvals': false },
    'Administration': { 'Manage Users': false, 'Manage Roles': false, 'View Audit Logs': true },
    'Settings': { 'Edit Company Profile': false, 'Manage Billing': false },
    'Integrations': { 'Manage API Keys': false, 'Configure Webhooks': false }
  });

  const togglePermission = (mod, perm) => {
    setPermissions(prev => ({
      ...prev,
      [mod]: { ...prev[mod], [perm]: !prev[mod][perm] }
    }));
  };

  const handleSaveInternal = () => {
    if (!form.name.trim()) {
      addToast({ title: 'Validation Error', message: 'Role Name is required.', type: 'error' });
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      onSave(form);
      setIsSaving(false);
    }, 600);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/50 dark:bg-[#0a0a0a] animate-fade-in relative z-10 overflow-y-auto scrollbar-thin pb-20">
      {/* Sticky Header */}
      <div className="px-6 py-6 md:px-10 mx-auto w-full max-w-[1600px] border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1017] sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">
              <button onClick={onClose} className="hover:text-brand transition-colors">Role Management</button>
              <span className="mx-2">/</span>
              <span className="text-slate-600 dark:text-slate-300">{role ? 'Edit Role' : 'Create Role'}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              {role ? 'Edit Role Configuration' : 'Create System Role'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="h-9 px-5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
              Cancel
            </button>
            <button 
              onClick={handleSaveInternal} 
              disabled={isSaving}
              className="h-9 px-5 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50" 
              style={{ backgroundColor: brandColor }}
            >
              {isSaving ? 'Processing...' : (role ? <><Save size={16}/> Update Role</> : <><Plus size={16}/> Create Role</>)}
            </button>
          </div>
        </div>
      </div>
      
      {/* 3-Column Enterprise Grid Layout */}
      <div className="flex-1 px-6 md:px-10 mt-8 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Role Context (30%) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                Role Details
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Role Name <span className="text-rose-500">*</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Senior Recruiter"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Classification</label>
                  <CompactRadioCard 
                    name="roleType"
                    options={[{ label: 'System Role', value: 'System' }, { label: 'Custom Role', value: 'Custom' }]}
                    value={form.type}
                    onChange={val => setForm(f => ({ ...f, type: val }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe role responsibilities..." 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none resize-none font-medium focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-900/30 p-6">
               <h3 className="text-xs font-extrabold text-blue-900 dark:text-blue-100 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Shield className="w-4 h-4" /> Best Practice
               </h3>
               <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                 Use Custom Roles to apply granular RBAC permissions. System roles are pre-configured and provide standardized access across modules.
               </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Complex RBAC Matrix (70%) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[700px]">
              
              {/* Matrix Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto scrollbar-none">
                {modules.map(mod => (
                  <button 
                    key={mod}
                    onClick={() => setActiveModule(mod)}
                    className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeModule === mod ? 'border-brand text-brand bg-white dark:bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    style={activeModule === mod ? { borderColor: brandColor, color: brandColor } : {}}
                  >
                    {mod} Module
                  </button>
                ))}
              </div>

              {/* Checkbox Grid */}
              <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeModule} Permissions</h3>
                    <p className="text-xs text-slate-500 font-medium">Configure deep capabilities for {activeModule}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded hover:bg-slate-200 transition-colors">Select All</button>
                    <button className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded hover:bg-slate-200 transition-colors">Clear All</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permissions[activeModule] || {}).map(([permName, isGranted]) => (
                    <label key={permName} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${isGranted ? 'border-brand/40 bg-brand/5 dark:bg-brand/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`} style={isGranted ? { borderColor: brandColor } : {}}>
                      <div className="mt-0.5">
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${isGranted ? 'border-brand bg-brand' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`} style={isGranted ? { backgroundColor: brandColor, borderColor: brandColor } : {}}>
                          {isGranted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{permName}</div>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                          Grants access to {permName.toLowerCase()} within the {activeModule} system module.
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const RoleManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [roles, setRoles] = useState(MOCK_ROLES);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [drawerRole, setDrawerRole] = useState(null);
  const [inspectRole, setInspectRole] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#2563eb';

  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      const matchSearch = search === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'All Types' || r.type === filterType;
      return matchSearch && matchType;
    });
  }, [roles, search, filterType]);

  const handleSave = (form) => {
    if (form.id) {
      setRoles(prev => prev.map(r => r.id === form.id ? form : r));
      addToast({ title: 'Role Updated', message: `${form.name} updated successfully.`, type: 'success' });
    } else {
      const newObj = { ...form, id: `role-${Date.now()}`, userCount: 0, permissions: 14, createdAt: '2026-07-27' };
      setRoles(prev => [newObj, ...prev]);
      addToast({ title: 'Role Configured', message: `${form.name} created successfully.`, type: 'success' });
    }
    setIsDrawerOpen(false);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
      addToast({ title: 'Role Deleted', message: `${roleToDelete.name} removed from RBAC directory.`, type: 'success' });
      setRoleToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  if (isDrawerOpen) {
    return (
      <RoleEditorPage role={drawerRole} onClose={() => setIsDrawerOpen(false)} onSave={handleSave} brandColor={brandColor} />
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="Role RBAC Access Control & Entitlements"
        subtitle="Define enterprise security role tiers, manage permission grant matrices, and audit active user assignments"
        icon={<ShieldCheck className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search role title or description..."
        filterOptions={['All Types', 'System', 'Custom']}
        activeFilter={filterType}
        onFilterChange={setFilterType}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Create Role Tier"
        onPrimaryAction={() => { setDrawerRole(null); setIsDrawerOpen(true); }}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Configured Roles', value: roles.length, sub: 'RBAC access tiers', icon: <KeyRound className="w-4 h-4" /> },
          { label: 'Active Security Roles', value: roles.filter(r=>r.status==='Active').length, sub: 'Enforced & operational', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Assigned Users', value: `${roles.reduce((acc,r)=>acc+(r.userCount||0),0)} Users`, sub: 'Active directory count', icon: <Users className="w-4 h-4" /> },
          { label: 'Security Access Rules', value: '41 Rules', sub: 'System permission grants', icon: <Lock className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        filteredRoles.length === 0 ? (
          <ModernEmptyState 
            title="No roles found" 
            subtitle="No security roles match your current search and filters." 
            icon={Shield}
          />
        ) : (
        <ModernCardGrid totalCount={roles.length} filteredCount={filteredRoles.length} resourceName="security roles">
          {filteredRoles.map((r) => {
            const styleObj = ROLE_ACCENT_STYLES[r.name] || { accent: 'bg-blue-500', text: 'text-blue-600', tagBg: 'bg-blue-50 text-blue-700 border-blue-200' };
            const permissions = ROLE_PERMISSIONS_MAP[r.name] || ['General Access', 'Dashboard View', 'Reports'];

            return (
              <div
                key={r.id}
                className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Subtle Accent Stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${styleObj.accent}`} />

                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${styleObj.tagBg}`}>
                      {r.type} ROLE TIER
                    </span>
                    <ModernStatusBadge status={r.status} />
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${styleObj.text}`} />
                    {r.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed line-clamp-2">
                    {r.description}
                  </p>

                  {/* Granted Permission Matrix Chips */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                      <span>Granted Permission Scope</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{permissions.length} Active</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                      {permissions.slice(0, 3).map((perm, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50/70 text-blue-700 border border-blue-200/80 dark:bg-slate-800 dark:text-blue-300 dark:border-slate-700 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {perm}
                        </span>
                      ))}
                      {permissions.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                          +{permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-6.5 h-6.5 rounded-full bg-slate-800 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-2xs">
                        U1
                      </div>
                      <div 
                        style={{ backgroundColor: brandColor }}
                        className="w-6.5 h-6.5 rounded-full text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-2xs"
                      >
                        U2
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      {r.userCount} Users
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setInspectRole(r)}
                      title="Inspect Granted Matrix"
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" /> Matrix
                    </button>
                    <button
                      onClick={() => { setDrawerRole(r); setIsDrawerOpen(true); }}
                      title="Edit Role"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRoleToDelete(r)}
                      title="Delete Role"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </ModernCardGrid>
        )
      ) : (
        /* ── MID-LEVEL POLISHED DATA TABLE VIEW ── */
        filteredRoles.length === 0 ? (
          <ModernEmptyState 
            title="No roles found" 
            subtitle="No security roles match your current search and filters." 
            icon={Shield}
          />
        ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-md">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="px-6 py-3.5 text-left">Security Role & Scope</th>
                <th className="px-6 py-3.5 text-center">Classification Tier</th>
                <th className="px-6 py-3.5 text-center">Assigned Active Users</th>
                <th className="px-6 py-3.5 text-center">Granted Matrix Scope</th>
                <th className="px-6 py-3.5 text-center">Security Status</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredRoles.map((r) => {
                const styleObj = ROLE_ACCENT_STYLES[r.name] || { text: 'text-blue-600', tagBg: 'bg-blue-50 text-blue-700 border-blue-200' };
                const ruleCount = (ROLE_PERMISSIONS_MAP[r.name] || []).length;

                return (
                  <tr key={r.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-3.5 text-left">
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${styleObj.text}`} />
                        <span>{r.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium truncate max-w-sm mt-0.5">{r.description}</div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${styleObj.tagBg}`}>
                        {r.type} ROLE
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-extrabold text-slate-900 dark:text-white">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.userCount} Active Users</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => setInspectRole(r)}
                          className="px-2.5 py-1 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 font-mono font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {ruleCount} Granted Rules
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex justify-center">
                        <ModernStatusBadge status={r.status} />
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 py-0.5">
                        <button 
                          onClick={() => setInspectRole(r)} 
                          title="Inspect Permission Matrix"
                          className="h-7 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs hover:shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500" /> Matrix
                        </button>
                        <button 
                          onClick={() => { setDrawerRole(r); setIsDrawerOpen(true); }} 
                          title="Edit Role"
                          className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs hover:shadow-xs active:scale-95 flex items-center justify-center cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setRoleToDelete(r)} 
                          title="Delete Role"
                          className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 transition-all shadow-2xs hover:shadow-xs active:scale-95 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {isDrawerOpen ? (
        <RoleEditorPage role={drawerRole} onClose={() => setIsDrawerOpen(false)} onSave={handleSave} brandColor={brandColor} />
      ) : (
        <>
          <RoleInspectorDrawer role={inspectRole} isOpen={!!inspectRole} onClose={() => setInspectRole(null)} brandColor={brandColor} />
          <ConfirmModal
            isOpen={!!roleToDelete}
            onClose={() => setRoleToDelete(null)}
            onConfirm={confirmDelete}
            isLoading={isDeleting}
            title="Delete System Role"
            message={`Are you sure you want to delete role ${roleToDelete?.name}?`}
            confirmText="Delete Role"
          />
        </>
      )}
      <ConfirmModal
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete System Role"
        message={`Are you sure you want to delete role ${roleToDelete?.name}?`}
        confirmText="Delete Role"
      />
    </div>
  );
};

export default RoleManagement;
