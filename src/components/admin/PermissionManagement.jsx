import React, { useState, useContext } from 'react';
import { MOCK_PERMISSIONS, PERMISSION_MODULES, PERMISSION_ACTIONS, MOCK_ROLES } from '../admin/adminMockData';
import { useToast } from '../shared/ToastContext';
import { ThemeContext } from '../../ThemeContext';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernEmptyState,
} from './shared/ModernAdminLayoutComponents';
import { Shield, Save, Search, Copy, ChevronDown, ChevronRight, CheckSquare, Square, KeyRound, Lock, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import CustomSelect from '../dashboard/shared/CustomSelect';

const ACTION_BADGES = {
  View:   { bg: 'bg-blue-50 dark:bg-blue-950/40',   text: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-200/80 dark:border-blue-800/80' },
  Create: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/80 dark:border-emerald-800/80' },
  Edit:   { bg: 'bg-amber-50 dark:bg-amber-950/40',  text: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-200/80 dark:border-amber-800/80' },
  Delete: { bg: 'bg-rose-50 dark:bg-rose-950/40',   text: 'text-rose-600 dark:text-rose-400',   border: 'border-rose-200/80 dark:border-rose-800/80' },
  Export: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200/80 dark:border-purple-800/80' },
};

const PERMISSION_GROUPS = [
  { name: 'Core Platform', icon: 'layout', modules: ['Dashboard', 'Settings'] },
  { name: 'Identity & Access', icon: 'shield', modules: ['Users', 'Roles'] },
  { name: 'Recruitment Hub', icon: 'users', modules: ['Candidates', 'Jobs', 'Requisitions', 'Interviews', 'Offers'] },
  { name: 'Analytics & Compliance', icon: 'chart', modules: ['Reports', 'Audit Logs', 'API Keys'] },
];

const PermissionManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [selectedRole, setSelectedRole] = useState('CEO');
  const [copyFromRole, setCopyFromRole] = useState('');
  const [perms, setPerms] = useState(MOCK_PERMISSIONS);
  const [initialPerms, setInitialPerms] = useState(MOCK_PERMISSIONS);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(PERMISSION_GROUPS.map(g => g.name));

  const brandColor = activeTheme?.color || '#2563eb';

  const toggleGroupCollapse = (name) => {
    setExpandedGroups(prev => prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]);
  };

  const toggle = (module, action) => {
    setPerms(p => {
      const cur = p[selectedRole]?.[module] || [];
      const next = cur.includes(action) ? cur.filter(a => a !== action) : [...cur, action];
      return { ...p, [selectedRole]: { ...p[selectedRole], [module]: next } };
    });
  };

  const toggleAllAction = (action) => {
    setPerms(p => {
      const allHave = PERMISSION_MODULES.every(m => (p[selectedRole]?.[m] || []).includes(action));
      const updated = {};
      PERMISSION_MODULES.forEach(m => {
        const cur = p[selectedRole]?.[m] || [];
        updated[m] = allHave ? cur.filter(a => a !== action) : cur.includes(action) ? cur : [...cur, action];
      });
      return { ...p, [selectedRole]: { ...p[selectedRole], ...updated } };
    });
  };

  const handleCopyFromRole = () => {
    if (!copyFromRole) return;
    setPerms(p => ({
      ...p,
      [selectedRole]: { ...p[copyFromRole] }
    }));
    addToast({ title: 'Template Copied', message: `Copied all permission grants from "${copyFromRole}" to "${selectedRole}".`, type: 'info' });
    setCopyFromRole('');
  };

  const hasChanges = JSON.stringify(perms) !== JSON.stringify(initialPerms);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setInitialPerms(perms);
      setIsSaving(false);
      addToast({ title: 'Permissions Saved', message: `Granular access matrix updated for ${selectedRole}.`, type: 'success' });
    }, 600);
  };

  const rolePerms = perms[selectedRole] || {};
  let totalGrants = 0;
  PERMISSION_MODULES.forEach(m => {
    totalGrants += (rolePerms[m] || []).length;
  });

  const maxGrants = PERMISSION_MODULES.length * PERMISSION_ACTIONS.length;

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="Permission Grants & Security Boundaries"
        subtitle="Configure granular module-level access rules and security boundaries per system role tier"
        icon={<ShieldCheck className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search system module..."
        filterOptions={['CEO', 'HR Admin', 'Hiring Manager', 'Recruiter', 'Viewer']}
        activeFilter={selectedRole}
        onFilterChange={setSelectedRole}
        primaryActionLabel={isSaving ? 'Processing...' : (!hasChanges ? 'No Changes' : 'Save Access Matrix')}
        onPrimaryAction={handleSave}
        primaryActionDisabled={isSaving || !hasChanges}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Active Role Profile', value: selectedRole, sub: 'Editing permission scope', icon: <Shield className="w-4 h-4" /> },
          { label: 'Granted Access Rules', value: `${totalGrants} / ${maxGrants}`, sub: `${Math.round((totalGrants / maxGrants) * 100)}% system coverage`, icon: <CheckCircle2 className="w-4 h-4" /> },
          { label: 'Protected Modules', value: PERMISSION_MODULES.length, sub: 'Core system components', icon: <Lock className="w-4 h-4" /> },
          { label: 'Action Boundaries', value: PERMISSION_ACTIONS.length, sub: 'View, Create, Edit, Delete, Export', icon: <KeyRound className="w-4 h-4" /> },
        ]}
      />

      {/* Controls Bar for Template Application */}
      <div className="p-3 mb-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-slate-700 dark:text-slate-300">Copy Template From:</span>
          <div className="w-56">
            <CustomSelect 
              value={copyFromRole} 
              onChange={val => setCopyFromRole(val)} 
              options={[{label: 'Select Role Template...', value: ''}, ...MOCK_ROLES.filter(r => r.name !== selectedRole).map(r => ({label: r.name, value: r.name}))]} 
              size="sm"
            />
          </div>
          <button onClick={handleCopyFromRole} disabled={!copyFromRole} className="h-8 px-3 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer">
            <Copy className="w-3.5 h-3.5" /> Apply Template
          </button>
        </div>
      </div>

      {/* Matrix Table Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-64">System Module</th>
                {PERMISSION_ACTIONS.map(act => {
                  const badge = ACTION_BADGES[act];
                  const allHasAction = PERMISSION_MODULES.every(m => (rolePerms[m] || []).includes(act));
                  return (
                    <th key={act} className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 cursor-pointer" onClick={() => toggleAllAction(act)}>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {act}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {allHasAction ? '(Revoke)' : '(Grant)'}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {PERMISSION_GROUPS.map(group => {
                const isExpanded = expandedGroups.includes(group.name);
                const matchingModules = group.modules.filter(m => m.toLowerCase().includes(search.toLowerCase()));
                if (matchingModules.length === 0 && search) return null;

                return (
                  <React.Fragment key={group.name}>
                    {/* Group Header Row */}
                    <tr className="bg-slate-100/70 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-700/60 font-extrabold text-slate-900 dark:text-white">
                      <td colSpan={6} className="py-2.5 px-4">
                        <div className="flex items-center justify-between">
                          <button onClick={() => toggleGroupCollapse(group.name)} className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:text-slate-900 transition-colors">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                            {group.name}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Group Module Rows */}
                    {isExpanded && matchingModules.map(mod => {
                      const modActions = rolePerms[mod] || [];
                      return (
                        <tr key={mod} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="py-3 px-4 pl-8 font-bold text-slate-900 dark:text-white text-xs">{mod}</td>
                          {PERMISSION_ACTIONS.map(act => {
                            const isGranted = modActions.includes(act);
                            return (
                              <td key={act} className="py-3 px-4 text-center">
                                 <button 
                                   type="button"
                                   onClick={() => toggle(mod, act)} 
                                   className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 shadow-2xs ${
                                     isGranted 
                                       ? 'text-white border-transparent' 
                                       : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400'
                                   }`}
                                   style={isGranted ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                                   title={isGranted ? `Revoke ${act} on ${mod}` : `Grant ${act} on ${mod}`}
                                 >
                                   {isGranted && <Check size={11} strokeWidth={3} className="text-white" />}
                                 </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          
          {PERMISSION_GROUPS.every(group => group.modules.filter(m => m.toLowerCase().includes(search.toLowerCase())).length === 0) && search && (
            <ModernEmptyState 
              title="No modules found" 
              subtitle="No system modules match your search query." 
              icon={Search}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;
