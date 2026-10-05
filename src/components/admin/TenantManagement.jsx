import React, { useState, useMemo, useContext } from 'react';
import { MOCK_TENANTS } from '../admin/adminMockData';
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
} from './shared/ModernAdminLayoutComponents';
import { Building2, ShieldCheck, Clock, AlertTriangle, Eye, Edit3, Trash2, Globe, Briefcase, Users, X, Save, CheckCircle2 } from 'lucide-react';

const TENANT_ACCENT_STYLES = {
  'Enterprise': { accent: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', tagBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800' },
  'Professional': { accent: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', tagBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
  'Starter': { accent: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
};

// ── Inspector Drawer Component ───────────────────────────────────────────────
const TenantInspectorDrawer = ({ tenant, isOpen, onClose, brandColor }) => (
  <AnimatePresence>
    {isOpen && tenant && (
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
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Workspace Telemetry</h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{tenant?.domain || '—'}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{tenant.name}</h3>
                <p className="text-slate-400 font-mono text-xs mt-0.5">{tenant.domain}</p>
              </div>
              <ModernStatusBadge status={tenant.status} />
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1">Workspace Resource Metrics</div>
              {[
                { label: 'SaaS Plan Tier', value: tenant.plan },
                { label: 'Domain Isolation', value: tenant.domain },
                { label: 'Active Requisitions', value: `${tenant.activeJobs} Jobs` },
                { label: 'Recruiter Seats', value: `${tenant.recruitersCount} Seats` },
                { label: 'Contract Expiry', value: tenant.expiryDate },
                { label: 'Last Activity', value: tenant.lastActivity || '2 mins ago' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500 font-medium">{label}:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
            <button onClick={onClose} className="h-9 px-5 rounded-lg text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: brandColor }}>
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const TenantWizard = ({ tenant, isOpen, onClose, onSave, brandColor }) => {
  const { addToast } = useToast();
  const defaultForm = { name: '', domain: '', plan: 'Enterprise', status: 'Active', modules: ['Recruitment'], adminEmail: '' };
  const [form, setForm] = useState(tenant || defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);

  React.useEffect(() => {
    if (tenant) {
      setForm(tenant);
      setStep(1);
    } else {
      setForm(defaultForm);
      setStep(1);
    }
  }, [tenant, isOpen]);

  const steps = [
    { id: 1, title: 'Workspace Identity', desc: 'Core branding & domain' },
    { id: 2, title: 'Subscription Tier', desc: 'Plan & capacity limits' },
    { id: 3, title: 'Module Selection', desc: 'Enable ATS features' },
    { id: 4, title: 'Review & Provision', desc: 'Final confirmation' }
  ];

  const handleNext = () => {
    if (step === 1 && (!form.name || !form.domain)) {
      addToast({ title: 'Missing Info', message: 'Name and domain are required.', type: 'error' });
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSaveInternal = () => {
    setIsSaving(true);
    setTimeout(() => {
      onSave(form);
      setIsSaving(false);
    }, 800);
  };

  const toggleModule = (mod) => {
    setForm(prev => {
      const exists = prev.modules?.includes(mod);
      if (exists) return { ...prev, modules: prev.modules.filter(m => m !== mod) };
      return { ...prev, modules: [...(prev.modules || []), mod] };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/50 dark:bg-[#0a0a0a] animate-fade-in relative z-10 overflow-y-auto scrollbar-thin pb-20">
      {/* Wizard Header */}
      <div className="px-6 py-5 md:px-10 mx-auto w-full max-w-[1200px] border-b border-slate-200 dark:border-slate-800 bg-transparent sticky top-0 z-20 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand" style={{ color: brandColor }} /> 
              {tenant ? 'Reconfigure Tenant Workspace' : 'Provision New Tenant'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Enterprise multi-tenant environment setup</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} />
          </button>
      </div>

      <div className="flex-1 px-6 md:px-10 mt-8 max-w-[1200px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Left Side: Progress Tracker */}
        <div className="md:col-span-4 hidden md:block">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sticky top-24">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">Setup Progress</h3>
            <div className="space-y-6">
              {steps.map((s, idx) => (
                <div key={s.id} className="flex gap-4 relative">
                  {idx !== steps.length - 1 && (
                    <div className={`absolute left-3.5 top-8 bottom-[-24px] w-[2px] ${step > s.id ? 'bg-brand' : 'bg-slate-100 dark:bg-slate-800'}`} style={step > s.id ? { backgroundColor: brandColor } : {}}></div>
                  )}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-colors ${step > s.id ? 'bg-brand text-white' : step === s.id ? 'border-2 border-brand text-brand bg-white dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`} style={step > s.id ? { backgroundColor: brandColor } : step === s.id ? { borderColor: brandColor, color: brandColor } : {}}>
                    {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${step >= s.id ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{s.title}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Step Content */}
        <div className="md:col-span-8 flex flex-col min-h-[500px]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex-1">
            
            {step === 1 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Workspace Identity</h2>
                  <p className="text-xs text-slate-500">Provide the core branding and URL details for the new tenant.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Company / Tenant Name <span className="text-rose-500">*</span></label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acme Corp" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand/20 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Subdomain URL <span className="text-rose-500">*</span></label>
                    <div className="flex">
                      <input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="acme" className="flex-1 h-11 px-4 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand/20 transition-all" />
                      <div className="h-11 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl flex items-center justify-center text-xs font-mono text-slate-500">.peopleworks.in</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Primary Admin Email</label>
                    <input value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} placeholder="admin@acme.com" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand/20 transition-all" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Subscription Tier</h2>
                  <p className="text-xs text-slate-500">Select the licensing capacity and limits for this tenant.</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {Object.keys(TENANT_ACCENT_STYLES).map(plan => (
                    <div key={plan} onClick={() => setForm(f => ({ ...f, plan }))} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${form.plan === plan ? 'border-brand bg-brand/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`} style={form.plan === plan ? { borderColor: brandColor } : {}}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${form.plan === plan ? 'border-brand' : 'border-slate-300 dark:border-slate-600'}`} style={form.plan === plan ? { borderColor: brandColor } : {}}>
                         {form.plan === plan && <div className="w-3 h-3 rounded-full bg-brand" style={{ backgroundColor: brandColor }}></div>}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{plan} Plan</div>
                        <div className="text-xs text-slate-500 mt-0.5">Includes {plan === 'Enterprise' ? 'unlimited' : plan === 'Professional' ? '50' : '10'} seats and standard support.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Module Selection</h2>
                  <p className="text-xs text-slate-500">Toggle the ATS capabilities available to this workspace.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['Recruitment', 'Onboarding', 'Performance', 'Analytics'].map(mod => {
                    const isSelected = form.modules?.includes(mod);
                    return (
                      <div key={mod} onClick={() => toggleModule(mod)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-brand bg-brand/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`} style={isSelected ? { borderColor: brandColor } : {}}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{mod}</div>
                          <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${isSelected ? 'bg-brand border-brand' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`} style={isSelected ? { backgroundColor: brandColor, borderColor: brandColor } : {}}>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Enable the full suite of {mod.toLowerCase()} tools for this tenant.</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Review & Provision</h2>
                  <p className="text-xs text-slate-500">Confirm the workspace details before final provisioning.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex justify-between pb-3 border-b border-slate-200 dark:border-slate-700/50">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tenant Name</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{form.name}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-slate-200 dark:border-slate-700/50">
                    <span className="text-xs font-bold text-slate-500 uppercase">Domain</span>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{form.domain}.peopleworks.in</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-slate-200 dark:border-slate-700/50">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tier</span>
                    <span className="text-sm font-extrabold text-brand" style={{ color: brandColor }}>{form.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Active Modules</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{(form.modules || []).join(', ')}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Wizard Footer Controls */}
          <div className="mt-6 flex justify-between items-center">
            {step > 1 ? (
              <button onClick={handleBack} className="h-10 px-5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                Back
              </button>
            ) : <div></div>}
            
            {step < 4 ? (
              <button onClick={handleNext} className="h-10 px-6 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: brandColor }}>
                Continue to Next Step
              </button>
            ) : (
              <button onClick={handleSaveInternal} disabled={isSaving} className="h-10 px-8 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2" style={{ backgroundColor: brandColor }}>
                {isSaving ? 'Provisioning...' : <><Globe size={16}/> Provision Workspace</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page Component ──────────────────────────────────────────────────────
const TenantManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [tenants, setTenants] = useState(MOCK_TENANTS);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('All Plans');
  const [viewMode, setViewMode] = useState('grid');
  const [drawerTenant, setDrawerTenant] = useState(null);
  const [inspectTenant, setInspectTenant] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#2563eb';

  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchSearch = search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.domain.toLowerCase().includes(search.toLowerCase());
      const matchPlan = filterPlan === 'All Plans' || t.plan === filterPlan;
      return matchSearch && matchPlan;
    });
  }, [tenants, search, filterPlan]);

  const handleSave = (form) => {
    if (form.id) {
      setTenants(prev => prev.map(t => t.id === form.id ? form : t));
      addToast({ title: 'Workspace Updated', message: `${form.name} updated.`, type: 'success' });
    } else {
      const newObj = { ...form, id: Date.now(), activeJobs: 0, recruitersCount: 1, users: 1, expiryDate: '2027-01-01', lastActivity: 'Just now' };
      setTenants(prev => [newObj, ...prev]);
      addToast({ title: 'Tenant Provisioned', message: `${form.name} workspace created.`, type: 'success' });
    }
    setIsDrawerOpen(false);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = () => {
    if (!tenantToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setTenants(prev => prev.filter(t => t.id !== tenantToDelete.id));
      addToast({ title: 'Tenant Deprovisioned', message: `${tenantToDelete.name} deleted.`, type: 'success' });
      setTenantToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

    if (isDrawerOpen) {
      return <TenantWizard tenant={drawerTenant} isOpen={true} onClose={() => setIsDrawerOpen(false)} onSave={handleSave} brandColor={brandColor} />;
    }

    return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* 2026 Modern Page Header */}
      <ModernPageHeader
        title="Tenant SaaS Workspaces"
        subtitle="Provision SaaS client accounts, manage multi-tenant domain isolation, and track subscription tiers"
        icon={<Building2 className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search workspace name or domain..."
        filterOptions={['All Plans', 'Enterprise', 'Professional', 'Starter']}
        activeFilter={filterPlan}
        onFilterChange={setFilterPlan}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Provision Workspace"
        onPrimaryAction={() => { setDrawerTenant(null); setIsDrawerOpen(true); }}
        themeColor={brandColor}
      />

      {/* Modern KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Total Workspaces', value: tenants.length, sub: 'Isolated SaaS tenants', icon: <Building2 className="w-4 h-4" /> },
          { label: 'Active ATS Clients', value: tenants.filter(t=>t.status==='Active').length, sub: 'Operational rate', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Trial Accounts', value: tenants.filter(t=>t.status==='Trial').length, sub: 'Expiring in 14 days', icon: <Clock className="w-4 h-4" /> },
          { label: 'Suspended Accounts', value: tenants.filter(t=>t.status==='Suspended').length, sub: 'Action required', icon: <AlertTriangle className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        filteredTenants.length === 0 ? (
          <ModernEmptyState 
            title="No workspaces found" 
            subtitle="No tenant workspaces match your current search and filters." 
            icon={Building2}
          />
        ) : (
        <ModernCardGrid totalCount={tenants.length} filteredCount={filteredTenants.length} resourceName="tenant workspaces">
          {filteredTenants.map((t) => {
            const styleObj = TENANT_ACCENT_STYLES[t.plan] || { accent: 'bg-indigo-500', text: 'text-indigo-600', tagBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };

            return (
              <div
                key={t.id}
                className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Subtle Accent Stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${styleObj.accent}`} />

                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${styleObj.tagBg}`}>
                      {t.plan} TIER
                    </span>
                    <ModernStatusBadge status={t.status} />
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                    <Building2 className={`w-4 h-4 ${styleObj.text}`} />
                    {t.name}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-slate-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{t.domain}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.activeJobs} Jobs</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.recruitersCount} Seats</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">Exp: {t.expiryDate}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setInspectTenant(t)}
                      title="View Workspace"
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" /> Details
                    </button>
                    <button
                      onClick={() => { setDrawerTenant(t); setIsDrawerOpen(true); }}
                      title="Edit Workspace"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTenantToDelete(t)}
                      title="Delete Workspace"
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
        /* ── COMPACT TABLE VIEW ── */
        filteredTenants.length === 0 ? (
          <ModernEmptyState 
            title="No workspaces found" 
            subtitle="No tenant workspaces match your current search and filters." 
            icon={Building2}
          />
        ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-md">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="px-6 py-3.5 text-left">Company Workspace</th>
                <th className="px-6 py-3.5 text-center">Plan Tier</th>
                <th className="px-6 py-3.5 text-center">Active Jobs</th>
                <th className="px-6 py-3.5 text-center">Recruiter Seats</th>
                <th className="px-6 py-3.5 text-center">Contract Expiry</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredTenants.map((t) => {
                const styleObj = TENANT_ACCENT_STYLES[t.plan] || { text: 'text-indigo-600', tagBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };

                return (
                  <tr key={t.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-3 align-middle text-left">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-extrabold text-slate-900 dark:text-white leading-tight">{t.name}</span>
                          <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t.domain}</span>
                        </div>
                      </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${styleObj.tagBg}`}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-extrabold text-slate-900 dark:text-white">{t.activeJobs} Jobs</td>
                    <td className="px-6 py-3.5 text-center font-bold text-blue-600 dark:text-blue-400">{t.recruitersCount} Seats</td>
                    <td className="px-6 py-3.5 text-center font-mono text-slate-500">{t.expiryDate}</td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex justify-center">
                        <ModernStatusBadge status={t.status} />
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 py-0.5">
                        <button 
                          onClick={() => setInspectTenant(t)} 
                          title="View Tenant"
                          className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => { setDrawerTenant(t); setIsDrawerOpen(true); }} 
                          title="Edit Tenant"
                          className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setTenantToDelete(t)} 
                          title="Delete Tenant"
                          className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
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

      <TenantInspectorDrawer tenant={inspectTenant} isOpen={!!inspectTenant} onClose={() => setInspectTenant(null)} brandColor={brandColor} />
      {/* Render Logic */}
      <ConfirmModal
        isOpen={!!tenantToDelete}
        onClose={() => setTenantToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Tenant Workspace"
        message={`Are you sure you want to delete ${tenantToDelete?.name}'s workspace?`}
        confirmText="Delete Workspace"
      />
    </div>
  );
};

export default TenantManagement;
