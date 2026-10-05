import React, { useState, useMemo, useContext } from 'react';
import { MOCK_API_KEYS } from '../admin/adminMockData';
import { useToast } from '../shared/ToastContext';
import { ThemeContext } from '../../ThemeContext';
import ConfirmModal from './shared/ConfirmModal';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernCardGrid,
  ModernStatusBadge,
  ModernEmptyState,
  DrawerSection,
  DrawerField,
} from './shared/ModernAdminLayoutComponents';
import { Key, Activity, ShieldCheck, Clock, Eye, Trash2, Code, Shield, CheckCircle2, Copy, X } from 'lucide-react';
import CustomSelect from '../dashboard/shared/CustomSelect';

const ALL_SCOPES = ['read:users', 'write:users', 'read:jobs', 'write:jobs', 'read:candidates', 'write:candidates', 'read:reports', 'export:data'];

const KeyInspectorPage = ({ apiKey, onClose, brandColor }) => (
  <div className="w-full h-full flex flex-col bg-slate-50/50 dark:bg-[#0a0a0a] animate-fade-in relative z-10 overflow-y-auto scrollbar-thin pb-20">
    {/* Page Header with Quick Actions */}
    <div className="px-6 py-6 md:px-10 mx-auto w-full max-w-[1600px] border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1017] sticky top-0 z-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">
            <button onClick={onClose} className="hover:text-brand transition-colors">Integrations</button>
            <span className="mx-2">/</span>
            <span className="text-slate-600 dark:text-slate-300">API Key Details</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            {apiKey.name}
            <ModernStatusBadge status={apiKey.status} />
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">Production</span>
          </h1>
          <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
            <Key className="w-3.5 h-3.5" /> {apiKey.prefix}••••••••••••••••
            <button className="text-blue-500 hover:text-blue-700 ml-2" title="Copy Token"><Copy className="w-3.5 h-3.5" /></button>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
            <Activity className="w-4 h-4" /> Test Connection
          </button>
          <button className="h-9 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
            <Code className="w-4 h-4" /> Docs
          </button>
          <button className="h-9 px-4 text-xs font-bold text-white shadow-sm flex items-center gap-2 rounded-lg transition-colors hover:opacity-90" style={{ backgroundColor: brandColor }}>
            Rotate Secret
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Context & Config (25%) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              Integration Profile
            </h3>
            <div className="space-y-3">
              <div><label className="text-[10px] uppercase font-bold text-slate-400">Owner</label><div className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Admin</div></div>
              <div><label className="text-[10px] uppercase font-bold text-slate-400">Created Date</label><div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{apiKey.created}</div></div>
              <div><label className="text-[10px] uppercase font-bold text-slate-400">Integration Type</label><div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Server-to-Server (OAuth2)</div></div>
              <div><label className="text-[10px] uppercase font-bold text-slate-400">Encryption</label><div className="text-sm font-semibold text-slate-700 dark:text-slate-300">AES-256 (At Rest)</div></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              Configuration Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center"><span className="text-slate-500">API Version</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">v2.1</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500">Rate Limit</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">100 / min</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500">Retry Policy</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">Exponential</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500">Webhook URL</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">Configured</span></div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-900/30 p-5">
            <h3 className="text-xs font-extrabold text-blue-900 dark:text-blue-100 uppercase tracking-widest mb-3 flex items-center gap-2">Connected Systems</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Workday HRIS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Active Directory (Okta)</span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Metrics & Scopes (50%) */}
        <div className="lg:col-span-6 space-y-6">
          {/* API Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Requests (7d)</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">1.2M</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Success Rate</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">99.98%</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Avg Latency</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">124ms</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Failed Requests</div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">12</div>
            </div>
          </div>

          {/* Usage Graph Mock */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">API Usage Volume</h3>
              <div className="w-36">
                <CustomSelect 
                  value="Last 7 Days"
                  onChange={()=>{}}
                  options={[{label: 'Last 7 Days', value: 'Last 7 Days'}, {label: 'Last 30 Days', value: 'Last 30 Days'}]}
                  size="sm"
                  align="right"
                />
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex items-end relative overflow-hidden">
              {/* Fake Chart Bars */}
              <div className="absolute inset-x-0 bottom-0 h-full flex items-end justify-between px-4 pb-2 pt-8 gap-2">
                {[40, 60, 45, 80, 50, 90, 75].map((h, i) => (
                  <div key={i} className="w-full relative flex flex-col justify-end h-full">
                    <div className="w-full bg-blue-500/20 rounded-t-sm" style={{ height: `${h}%` }}>
                      <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Granted Permissions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Granted Scopes & Endpoints</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{apiKey.scopes.length} Scopes</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {(apiKey.scopes || []).map(scope => (
                <div key={scope} className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {scope}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Audit & Ops (25%) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 h-full">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              Recent Activity & Audit
            </h3>
            
            <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-8 pb-4">
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1 border-2 border-white dark:border-slate-900"></div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Latest API Call</div>
                <div className="text-[10px] text-slate-500 mt-1">2 mins ago • Endpoint: /v2/candidates</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-full -left-[7px] top-1 border-2 border-white dark:border-slate-900"></div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Scopes Updated</div>
                <div className="text-[10px] text-slate-500 mt-1">Added 'write:jobs' • 3 days ago</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-full -left-[7px] top-1 border-2 border-white dark:border-slate-900"></div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Webhook Triggered</div>
                <div className="text-[10px] text-slate-500 mt-1">Candidate.Created • 4 days ago</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-[7px] top-1 border-2 border-white dark:border-slate-900"></div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Token Rotated</div>
                <div className="text-[10px] text-slate-500 mt-1">By System Admin • 2 months ago</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-full -left-[7px] top-1 border-2 border-white dark:border-slate-900"></div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">API Created</div>
                <div className="text-[10px] text-slate-500 mt-1">{apiKey.created}</div>
              </div>
            </div>

            <button className="w-full mt-6 py-2 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              View Full Audit Log
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
);

const GenerateDrawer = ({ isOpen, onClose, onSave, brandColor }) => {
  const [form, setForm] = useState({ name: '', scopes: [], expiry: 'Never', ipAllowlist: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const toggleScope = (s) => setForm(f => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter(x => x !== s) : [...f.scopes, s] }));
  
  const handleGenerateInternal = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onSave({ ...form, ipAllowlist: form.ipAllowlist ? form.ipAllowlist.split(',').map(s=>s.trim()) : ['Any'] });
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0f111a] animate-fade-in relative z-10 overflow-y-auto overflow-x-hidden scrollbar-none">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
              <button onClick={onClose} className="hover:text-brand transition-colors">API Keys</button>
              <span className="mx-2">/</span>
              <span className="text-slate-600 dark:text-slate-300">Generate</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Generate Security Key</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create a new API credential with enterprise network guardrails</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={isGenerating} className="h-8.5 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50">Cancel</button>
            <button disabled={!form.name || form.scopes.length === 0 || isGenerating}
              onClick={handleGenerateInternal}
              className="h-8.5 px-4 rounded-lg text-xs font-bold text-white shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: brandColor }}
            >
              {isGenerating ? 'Generating...' : 'Generate Secret Key'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <DrawerSection title="Key Configuration" description="Identification and lifecycle settings">
          <DrawerField label="Key Name" required>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mobile App Integration" className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </DrawerField>
          <DrawerField label="Expiration" required>
            <CustomSelect 
              value={form.expiry} 
              onChange={val => setForm(f => ({ ...f, expiry: val }))} 
              options={['Never', '30 Days', '90 Days', '1 Year'].map(x => ({label: x, value: x}))}
            />
          </DrawerField>
        </DrawerSection>

        <DrawerSection title="Access Scope" description="Select permissions to grant">
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {ALL_SCOPES.map(sc => (
              <label key={sc} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800 cursor-pointer font-mono text-[11px]">
                <input type="checkbox" checked={form.scopes.includes(sc)} onChange={() => toggleScope(sc)} className="rounded accent-blue-500" />
                <span className="text-slate-800 dark:text-slate-200">{sc}</span>
              </label>
            ))}
          </div>
        </DrawerSection>
        </div>
      </div>
    </div>
  );
};

const ApiKeys = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [keys, setKeys] = useState(MOCK_API_KEYS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [viewMode, setViewMode] = useState('grid');
  const [inspectKey, setInspectKey] = useState(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#2563eb';

  const filteredKeys = useMemo(() => {
    return keys.filter(k => {
      const matchSearch = search === '' ||
        k.name.toLowerCase().includes(search.toLowerCase()) ||
        k.prefix.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All Statuses' || k.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [keys, search, filterStatus]);

  const handleGenerate = (formData) => {
    const newKey = {
      id: Date.now(),
      name: formData.name,
      prefix: `pw_live_${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
      scopes: formData.scopes,
      status: 'Active',
      lastUsed: 'Never',
      created: new Date().toISOString().split('T')[0],
    };
    setKeys(prev => [newKey, ...prev]);
    setIsGenerateOpen(false);
    addToast({ title: 'API Key Generated', message: `Secret key "${formData.name}" active.`, type: 'success' });
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const confirmRevokeKey = () => {
    if (!keyToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setKeys(prev => prev.filter(k => k.id !== keyToDelete.id));
      addToast({ title: 'API Key Revoked', message: `Key "${keyToDelete.name}" revoked permanently.`, type: 'success' });
      setKeyToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  if (isGenerateOpen) {
    return (
      <GenerateDrawer isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} onSave={handleGenerate} brandColor={brandColor} />
    );
  }

  if (inspectKey) {
    return (
      <KeyInspectorPage apiKey={inspectKey} onClose={() => setInspectKey(null)} brandColor={brandColor} />
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="API Keys & Integrations Credentials"
        subtitle="Manage programmatic credentials, OAuth secret tokens, and webhook scopes for external services"
        icon={<Key className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search key name or prefix token..."
        filterOptions={['All Statuses', 'Active', 'Revoked']}
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Generate Secret Key"
        onPrimaryAction={() => setIsGenerateOpen(true)}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Total Secret Credentials', value: keys.length, sub: 'Active & revoked tokens', icon: <Key className="w-4 h-4" /> },
          { label: 'Active Machine Tokens', value: keys.filter(k=>k.status==='Active').length, sub: 'Operational integrations', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'API Requests (24h)', value: '14,200', sub: 'Healthy throughput', icon: <Activity className="w-4 h-4" /> },
          { label: 'Expiring Tokens', value: '0 Tokens', sub: 'Good standing', icon: <Clock className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        filteredKeys.length === 0 ? (
          <ModernEmptyState 
            title="No keys found" 
            subtitle="No API keys match your current search and filters." 
            icon={Key}
          />
        ) : (
        <ModernCardGrid totalCount={keys.length} filteredCount={filteredKeys.length} resourceName="API credentials">
          {filteredKeys.map((k) => (
            <div
              key={k.id}
              className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Subtle Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                      {k.prefix}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(k.prefix);
                        // Assuming addToast is not directly accessible here without context, but we can do a simple visual cue or pass a prop. Wait, addToast is not in this map scope? Oh it is! keys.map is inside the component.
                        // wait, this is inside `ApiKeys` component so I can use `addToast`.
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Copy Prefix"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <ModernStatusBadge status={k.status} />
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-500" />
                  {k.name}
                </h3>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Granted Scopes</div>
                  <div className="flex flex-wrap gap-1">
                    {k.scopes.slice(0, 3).map((sc, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {sc}
                      </span>
                    ))}
                    {k.scopes.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        +{k.scopes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Last used: {k.lastUsed}</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setInspectKey(k)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                  <button
                    onClick={() => setKeyToDelete(k)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </ModernCardGrid>
        )
      ) : (
        /* ── COMPACT DATA TABLE VIEW ── */
        filteredKeys.length === 0 ? (
          <ModernEmptyState 
            title="No keys found" 
            subtitle="No API keys match your current search and filters." 
            icon={Key}
          />
        ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="px-6 py-3.5">Credential Name</th>
                <th className="px-6 py-3.5">Token Prefix</th>
                <th className="px-6 py-3.5">Granted Scopes</th>
                <th className="px-6 py-3.5">Last Activity</th>
                <th className="px-6 py-3.5">Security Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredKeys.map((k) => (
                <tr key={k.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-blue-500" />
                    {k.name}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{k.prefix}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(k.prefix);
                          addToast({ title: 'Copied', message: 'Token prefix copied to clipboard', type: 'success' });
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">{k.scopes.slice(0, 2).join(', ')}{k.scopes.length > 2 ? ` +${k.scopes.length - 2}` : ''}</td>
                  <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">{k.lastUsed}</td>
                  <td className="px-6 py-3.5">
                    <ModernStatusBadge status={k.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 py-0.5">
                      <button 
                        onClick={() => setInspectKey(k)} 
                        title="View API Key"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setKeyToDelete(k)} 
                        title="Revoke / Delete Key"
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
        )
      )}


      <ConfirmModal
        isOpen={!!keyToDelete}
        onClose={() => setKeyToDelete(null)}
        onConfirm={confirmRevokeKey}
        isLoading={isDeleting}
        title="Revoke API Key"
        message={`Are you sure you want to permanently revoke key "${keyToDelete?.name}"? Connected integrations will lose access instantly.`}
        confirmText="Revoke Secret Key"
      />
    </div>
  );
};

export default ApiKeys;
