import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useToast } from '../shared/ToastContext';
import { ThemeContext } from '../../ThemeContext';
import ModernCenterModal from './shared/ModernCenterModal';
import ConfirmModal from './shared/ConfirmModal';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernCardGrid,
  ModernStatusBadge,
  DrawerSection,
  DrawerField,
  CompactRadioCard
} from './shared/ModernAdminLayoutComponents';
import { ToggleSwitch } from '../dashboard/shared/SharedComponents';
import { Flag, ShieldCheck, Zap, Sliders, Edit3, Trash2, Eye } from 'lucide-react';

const MOCK_FLAGS = [
  { id: 1, key: 'ai-resume-parser', name: 'AI Resume Parser', description: 'Enable automatic extraction of candidate details using GPT models.', status: 'Active', scope: 'Global', enabledCount: 12, createdAt: '2026-05-10', isCritical: true, rollout: 'Full Rollout' },
  { id: 2, key: 'zoom-integration', name: 'Zoom Meeting Sync', description: 'Provide candidate interview schedule link generations automatically.', status: 'Active', scope: 'Targeted', enabledCount: 4, createdAt: '2026-06-01', isCritical: false, rollout: 'Percentage (50%)' },
  { id: 3, key: 'advanced-reporting', name: 'Advanced Executive Reports', description: 'Unlock access to cross-tenant hiring metrics and custom SLA graphs.', status: 'Inactive', scope: 'Global', enabledCount: 0, createdAt: '2026-06-15', isCritical: false, rollout: 'Full Rollout' },
  { id: 4, key: 'whatsapp-reminders', name: 'WhatsApp Candidate Updates', description: 'Send instant updates to candidates regarding their interview schedules.', status: 'Active', scope: 'Targeted', enabledCount: 2, createdAt: '2026-07-20', isCritical: false, rollout: 'Canary (10%)' },
];

const FlagInspectorDrawer = ({ flag, isOpen, onClose, brandColor }) => (
  <ModernCenterModal
    isOpen={isOpen}
    onClose={onClose}
    title="Feature Flag Inspector"
    subtitle={flag?.key || '—'}
    actions={
      <button onClick={onClose} className="h-8.5 px-4 rounded-lg text-xs font-semibold text-white shadow-2xs cursor-pointer" style={{ backgroundColor: brandColor }}>
        Close Inspector
      </button>
    }
  >
    {flag && (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Overview</h4>
          <div className="grid grid-cols-2 gap-4">
            <DrawerField label="Flag Unique Key">
              <div className="font-mono font-bold h-8 flex items-center" style={{ color: brandColor }}>{flag.key}</div>
            </DrawerField>
            <DrawerField label="Status">
              <div className="h-8 flex items-center">
                <ModernStatusBadge status={flag.status} />
              </div>
            </DrawerField>
          </div>
          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{flag.name}</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">{flag.description}</p>
          </div>
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Rollout Strategy</h4>
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'Targeting Scope', value: flag.scope },
              { label: 'Rollout Strategy', value: flag.rollout },
              { label: 'Enabled Tenant Workspaces', value: `${flag.enabledCount} Tenants` },
              { label: 'Critical System Component', value: flag.isCritical ? 'Yes (High Sensitivity)' : 'Standard Toggle' },
              { label: 'Created Timestamp', value: flag.createdAt },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40 last:border-0">
                <span className="text-slate-500 font-medium text-xs">{label}:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </ModernCenterModal>
);

const FlagDrawer = ({ flag, isOpen, onClose, onSave, brandColor }) => {
  const [form, setForm] = useState(flag || { key: '', name: '', description: '', status: 'Active', scope: 'Global', enabledCount: 0, isCritical: false, rollout: 'Full Rollout' });
  const isEdit = !!flag;

  useEffect(() => {
    if (flag) setForm(flag);
    else setForm({ key: '', name: '', description: '', status: 'Active', scope: 'Global', enabledCount: 0, isCritical: false, rollout: 'Full Rollout' });
  }, [flag]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0f111a] animate-fade-in relative z-10 overflow-y-auto overflow-x-hidden scrollbar-none">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
              <button onClick={onClose} className="hover:text-brand transition-colors">Feature Flags</button>
              <span className="mx-2">/</span>
              <span className="text-slate-600 dark:text-slate-300">{isEdit ? 'Edit Flag' : 'Create Flag'}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Feature Flag' : 'Create Feature Flag'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isEdit ? 'Configure flag properties, status, and scoping rules' : 'Define a new dynamic toggle for SaaS modules'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="h-8.5 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">
              Cancel
            </button>
            <button onClick={() => onSave(form)} disabled={!form.key || !form.name} className="h-8.5 px-4 rounded-lg text-xs font-bold text-white shadow-2xs transition-all disabled:opacity-50 hover:opacity-90 cursor-pointer" style={{ backgroundColor: brandColor }}>
              {isEdit ? 'Save Changes' : 'Create Flag'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <DrawerSection title="Flag Details" description="Identification and descriptive context">
          <DrawerField label="Flag Key ID" required>
            <input type="text" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="e.g. ai-resume-parser" className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Display Name" required>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. AI Resume Parser" className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Description">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Briefly describe what this toggle controls..." className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none resize-none font-medium focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </DrawerField>
        </DrawerSection>

        <DrawerSection title="Configuration" description="Targeting and execution rules">
          <DrawerField label="Status">
            <CompactRadioCard 
              name="flagStatus"
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' }
              ]}
              value={form.status}
              onChange={val => setForm(f => ({ ...f, status: val }))}
            />
          </DrawerField>
        </DrawerSection>
        </div>
      </div>
    </div>
  );
};

const FeatureFlags = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [flags, setFlags] = useState(MOCK_FLAGS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [viewMode, setViewMode] = useState('grid');
  const [drawerFlag, setDrawerFlag] = useState(null);
  const [inspectFlag, setInspectFlag] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [flagToDelete, setFlagToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#2563eb';

  const filteredFlags = useMemo(() => {
    return flags.filter(f => {
      const matchSearch = search === '' ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.key.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All Statuses' || f.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [flags, search, filterStatus]);

  const toggleFlagStatus = (flagId) => {
    setFlags(prev => prev.map(f => {
      if (f.id === flagId) {
        const nextStatus = f.status === 'Active' ? 'Inactive' : 'Active';
        addToast({ title: 'Feature Flag Toggled', message: `Flag "${f.name}" is now ${nextStatus}.`, type: nextStatus === 'Active' ? 'success' : 'info' });
        return { ...f, status: nextStatus };
      }
      return f;
    }));
  };

  const handleSave = (formData) => {
    if (formData.id) {
      setFlags(prev => prev.map(f => f.id === formData.id ? formData : f));
      addToast({ title: 'Feature Flag Updated', message: `Flag "${formData.name}" updated.`, type: 'success' });
    } else {
      const newFlag = { ...formData, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] };
      setFlags(prev => [newFlag, ...prev]);
      addToast({ title: 'Feature Flag Created', message: `Flag "${formData.name}" configured.`, type: 'success' });
    }
    setIsDrawerOpen(false);
  };

  const confirmDelete = () => {
    if (!flagToDelete) return;
    setFlags(prev => prev.filter(f => f.id !== flagToDelete.id));
    addToast({ title: 'Feature Flag Removed', message: `Flag "${flagToDelete.name}" deleted.`, type: 'warning' });
    setFlagToDelete(null);
  };

  if (isDrawerOpen) {
    return (
      <FlagDrawer flag={drawerFlag} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onSave={handleSave} brandColor={brandColor} />
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="Feature Flags & Runtime Toggles"
        subtitle="Control runtime module access, canary deployments, dark launches, and targeted tenant rollouts"
        icon={<Sliders className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search flag key, name, or description..."
        filterOptions={['All Statuses', 'Active', 'Inactive']}
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Create Feature Flag"
        onPrimaryAction={() => { setDrawerFlag(null); setIsDrawerOpen(true); }}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Configured Toggles', value: flags.length, sub: 'Feature flag inventory', icon: <Sliders className="w-4 h-4" /> },
          { label: 'Active Flags', value: flags.filter(f=>f.status==='Active').length, sub: 'Live in production', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Active Rollouts', value: `${flags.filter(f=>f.status==='Active').length} Active`, sub: 'Targeted tenant rollouts', icon: <Zap className="w-4 h-4" /> },
          { label: 'Critical Flags', value: `${flags.filter(f=>f.isCritical).length} Flag`, sub: 'High sensitivity toggles', icon: <Flag className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        <ModernCardGrid totalCount={flags.length} filteredCount={filteredFlags.length} resourceName="feature flags">
          {filteredFlags.map((f) => (
            <div
              key={f.id}
              className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Subtle Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                    {f.key}
                  </span>
                  <ModernStatusBadge status={f.status} />
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  {f.name}
                </h3>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed line-clamp-2">
                  {f.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{f.rollout}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Flag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Scope: {f.scope}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                {/* Instant Status Switch */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{f.status}</span>
                  <ToggleSwitch checked={f.status === 'Active'} onChange={() => toggleFlagStatus(f.id)} />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setInspectFlag(f)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                  <button
                    onClick={() => { setDrawerFlag(f); setIsDrawerOpen(true); }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFlagToDelete(f)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </ModernCardGrid>
      ) : (
        /* ── COMPACT DATA TABLE VIEW ── */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="px-6 py-3.5">Flag Name & Key</th>
                <th className="px-6 py-3.5">Scope</th>
                <th className="px-6 py-3.5">Rollout Strategy</th>
                <th className="px-6 py-3.5">Enabled Tenants</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredFlags.map((f) => (
                <tr key={f.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-blue-500" />
                      <span>{f.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{f.key}</div>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{f.scope}</td>
                  <td className="px-6 py-3.5 font-bold text-amber-600 dark:text-amber-400">{f.rollout}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-100">{f.enabledCount} Tenants</td>
                  <td className="px-6 py-3.5">
                    <ModernStatusBadge status={f.status} />
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 py-0.5">
                      <button 
                        onClick={() => setInspectFlag(f)} 
                        title="View Flag Details"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => { setDrawerFlag(f); setIsDrawerOpen(true); }} 
                        title="Edit Flag"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setFlagToDelete(f)} 
                        title="Delete Flag"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FlagInspectorDrawer flag={inspectFlag} isOpen={!!inspectFlag} onClose={() => setInspectFlag(null)} brandColor={brandColor} />
      <ConfirmModal
        isOpen={!!flagToDelete}
        onClose={() => setFlagToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Feature Flag"
        message={`Are you sure you want to delete feature flag "${flagToDelete?.name}"?`}
        confirmText="Delete Flag"
      />
    </div>
  );
};

export default FeatureFlags;
