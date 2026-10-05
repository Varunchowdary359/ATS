import React, { useState, useMemo, useContext } from 'react';
import { useToast } from '../shared/ToastContext';
import { ThemeContext } from '../../ThemeContext';
import ModernCenterModal from './shared/ModernCenterModal';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernCardGrid,
  ModernStatusBadge,
  ModernEmptyState,
  DrawerSection,
  DrawerField,
} from './shared/ModernAdminLayoutComponents';
import { CreditCard, DollarSign, ShieldCheck, AlertTriangle, Eye, Edit3, Calendar, Users, HardDrive } from 'lucide-react';
import CustomSelect from '../dashboard/shared/CustomSelect';

const MOCK_SUBSCRIPTIONS = [
  { id: 1, tenant: 'Infosys BPM', plan: 'Enterprise', amount: '$4,200/mo', renewalDate: '2026-08-01', billingCycle: 'Monthly', status: 'Paid', email: 'billing@infosysbpm.com', users: 280, jobs: 'Unlimited', aiCredits: '5M tokens', storage: '500 GB' },
  { id: 2, tenant: 'Tata Consultancy', plan: 'Enterprise', amount: '$12,000/mo', renewalDate: '2026-09-15', billingCycle: 'Monthly', status: 'Paid', email: 'billing@tcs.com', users: 840, jobs: 'Unlimited', aiCredits: '20M tokens', storage: '2 TB' },
  { id: 3, tenant: 'Wipro HR Division', plan: 'Professional', amount: '$1,500/mo', renewalDate: '2026-08-10', billingCycle: 'Monthly', status: 'Paid', email: 'billing@wipro.com', users: 80, jobs: '200 active', aiCredits: '1M tokens', storage: '100 GB' },
  { id: 4, tenant: 'HCL Technologies', plan: 'Professional', amount: '$1,500/mo', renewalDate: '2026-07-28', billingCycle: 'Monthly', status: 'Past Due', email: 'billing@hcl.com', users: 60, jobs: '200 active', aiCredits: '1M tokens', storage: '100 GB' },
  { id: 5, tenant: 'Mindtree Talent', plan: 'Starter', amount: '$450/mo', renewalDate: '2027-01-20', billingCycle: 'Annual', status: 'Paid', email: 'billing@mindtree.com', users: 15, jobs: '50 active', aiCredits: '100K tokens', storage: '20 GB' },
];

const SubscriptionInspectorDrawer = ({ sub, isOpen, onClose, brandColor }) => (
  <ModernCenterModal
    isOpen={isOpen}
    onClose={onClose}
    title="Subscription Details"
    subtitle={sub?.tenant || '—'}
    actions={
      <button onClick={onClose} className="h-8.5 px-4 rounded-lg text-xs font-semibold text-white shadow-2xs cursor-pointer" style={{ backgroundColor: brandColor }}>
        Close Inspector
      </button>
    }
  >
    {sub && (
      <div className="flex flex-col gap-5 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Monthly Contract Value</div>
            <div className="text-lg font-extrabold" style={{ color: brandColor }}>{sub.amount}</div>
          </div>
          <ModernStatusBadge status={sub.status} />
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1">Contract Quotas</div>
          {[
            { label: 'Client Tenant', value: sub.tenant },
            { label: 'Plan Tier', value: sub.plan },
            { label: 'Billing Cycle', value: sub.billingCycle },
            { label: 'Next Renewal Date', value: sub.renewalDate },
            { label: 'Billing Contact Email', value: sub.email },
            { label: 'Active User Quota', value: `${sub.users} Users` },
            { label: 'Requisition Quota', value: sub.jobs },
            { label: 'AI Credit Quota', value: sub.aiCredits },
            { label: 'Document Storage', value: sub.storage },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
              <span className="text-slate-500 font-medium text-xs">{label}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </ModernCenterModal>
);

const PlanDrawer = ({ subscription, isOpen, onClose, onSave, brandColor }) => {
  const [plan, setPlan] = useState(subscription?.plan || 'Professional');
  const [cycle, setCycle] = useState(subscription?.billingCycle || 'Monthly');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (subscription) {
      setPlan(subscription.plan);
      setCycle(subscription.billingCycle);
    }
  }, [subscription]);

  const hasChanges = subscription && (subscription.plan !== plan || subscription.billingCycle !== cycle);

  const handleSaveInternal = () => {
    setIsSaving(true);
    setTimeout(() => {
      onSave(plan, cycle);
      setIsSaving(false);
    }, 600);
  };

  return (
    <ModernCenterModal isOpen={isOpen} onClose={onClose}
      title="Modify Subscription"
      subtitle={`Configure billing contract for ${subscription?.tenant}`}
      actions={
        <>
          <button onClick={onClose} disabled={isSaving} className="h-8.5 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50">Cancel</button>
          <button 
            onClick={handleSaveInternal} 
            disabled={isSaving || !hasChanges}
            className="h-8.5 px-3.5 rounded-lg text-xs font-bold text-white shadow-2xs transition-all hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
            style={{ backgroundColor: !hasChanges ? '#94a3b8' : brandColor }}
          >
            {isSaving ? 'Processing...' : (!hasChanges ? 'No Changes' : 'Update Subscription')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <DrawerField label="Tenant Name">
          <input value={subscription?.tenant || ''} disabled className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-500 cursor-not-allowed font-medium" />
        </DrawerField>
        <DrawerField label="Subscription Plan" required>
          <CustomSelect 
            value={plan} 
            onChange={val => setPlan(val)} 
            options={[{label: 'Starter', value: 'Starter'}, {label: 'Professional', value: 'Professional'}, {label: 'Enterprise', value: 'Enterprise'}]} 
          />
        </DrawerField>
      </div>
    </ModernCenterModal>
  );
};

const SubscriptionBilling = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [subscriptions, setSubscriptions] = useState(MOCK_SUBSCRIPTIONS);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('All Plans');
  const [viewMode, setViewMode] = useState('grid');
  const [editingSub, setEditingSub] = useState(null);
  const [inspectSub, setInspectSub] = useState(null);

  const brandColor = activeTheme?.color || '#2563eb';

  const filtered = useMemo(() => {
    return subscriptions.filter(s => {
      const matchSearch = search === '' ||
        s.tenant.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchPlan = filterPlan === 'All Plans' || s.plan === filterPlan;
      return matchSearch && matchPlan;
    });
  }, [subscriptions, search, filterPlan]);

  const handleUpdatePlan = (newPlan, newCycle) => {
    if (!editingSub) return;
    setSubscriptions(prev => prev.map(s => s.id === editingSub.id ? { ...s, plan: newPlan, billingCycle: newCycle } : s));
    addToast({ title: 'Subscription Plan Updated', message: `${editingSub.tenant} upgraded to ${newPlan}.`, type: 'success' });
    setEditingSub(null);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="Subscription Plans & Revenue Contracts"
        subtitle="Track multi-tenant client billing contracts, subscription MRR, seat quotas, and renewal dates"
        icon={<CreditCard className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tenant name or billing email..."
        filterOptions={['All Plans', 'Enterprise', 'Professional', 'Starter']}
        activeFilter={filterPlan}
        onFilterChange={setFilterPlan}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Total Client Contracts', value: subscriptions.length, sub: 'Active tenant accounts', icon: <CreditCard className="w-4 h-4" /> },
          { label: 'Active Monthly Revenue', value: '$19,650/mo', sub: 'ARR: $235.8K', icon: <DollarSign className="w-4 h-4" /> },
          { label: 'Paid Subscriptions', value: subscriptions.filter(s=>s.status==='Paid').length, sub: 'Current in good standing', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Past Due Invoices', value: subscriptions.filter(s=>s.status==='Past Due').length || '1 Invoice', sub: 'Requires billing outreach', icon: <AlertTriangle className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        filtered.length === 0 ? (
          <ModernEmptyState 
            title="No subscriptions found" 
            subtitle="No billing contracts match your current search and filters." 
            icon={CreditCard}
          />
        ) : (
        <ModernCardGrid totalCount={subscriptions.length} filteredCount={filtered.length} resourceName="billing contracts">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Subtle Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200/80">
                    {s.plan} PLAN
                  </span>
                  <ModernStatusBadge status={s.status} />
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  {s.tenant}
                </h3>
                
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  MRR Contract: <strong className="text-blue-600 dark:text-blue-400 font-extrabold font-mono">{s.amount}</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>{s.users} Users</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.storage}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Renews {s.renewalDate}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setInspectSub(s)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" /> Details
                  </button>
                  <button
                    onClick={() => setEditingSub(s)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </ModernCardGrid>
        )
      ) : (
        /* ── COMPACT DATA TABLE VIEW ── */
        filtered.length === 0 ? (
          <ModernEmptyState 
            title="No subscriptions found" 
            subtitle="No billing contracts match your current search and filters." 
            icon={CreditCard}
          />
        ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="px-6 py-3.5">Client Tenant</th>
                <th className="px-6 py-3.5">Plan Tier</th>
                <th className="px-6 py-3.5">MRR Amount</th>
                <th className="px-6 py-3.5">Renewal Date</th>
                <th className="px-6 py-3.5">User Quota</th>
                <th className="px-6 py-3.5">Billing Status</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    <span>{s.tenant}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {s.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono font-extrabold text-blue-600 dark:text-blue-400">{s.amount}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">{s.renewalDate}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-100">{s.users} Seats</td>
                  <td className="px-6 py-3.5">
                    <ModernStatusBadge status={s.status} />
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 py-0.5">
                      <button 
                        onClick={() => setInspectSub(s)} 
                        title="View Subscription"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setEditingSub(s)} 
                        title="Edit Plan"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
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

      <SubscriptionInspectorDrawer sub={inspectSub} isOpen={!!inspectSub} onClose={() => setInspectSub(null)} brandColor={brandColor} />
      <PlanDrawer subscription={editingSub} isOpen={!!editingSub} onClose={() => setEditingSub(null)} onSave={handleUpdatePlan} brandColor={brandColor} />
    </div>
  );
};

export default SubscriptionBilling;
