import React from 'react';
import SolarKPIs, { KPICustomizeDropdown } from './shared/SolarKPIs';
import { SectionTitle, ChartCard } from './shared/SharedComponents';
import { CJSLine, CJSDoughnut } from './shared/Charts';
import DashboardErrorBoundary from './shared/DashboardErrorBoundary';
import SectionFilter from './shared/SectionFilter';
import { useDashboardPreferences } from '../../DashboardPreferencesContext';
import { useFilter } from '../../FilterContext';
import { getPeriodSeries } from './shared/usePeriodData';
import { SA_METRICS, SA_RECENT_TENANTS } from './data/mockData';
import { formatMetric } from './shared/formatHelpers';

const SuperAdminDashboard = ({ themeColor }) => {
  const { isSectionVisible, isFieldVisible } = useDashboardPreferences();
  const { getSectionFilter } = useFilter() || {};

  // Filter for System Metrics section
  const sysFilter = getSectionFilter?.('super_admin', 'System Metrics') || {};
  const tenantGrowth = getPeriodSeries(sysFilter, { base: 45, growth: 14, amp: 6, offset: 1 });
  const resourceData = {
    // Doughnut slices shift with period to show filter is live
    db:      Math.round(38 + (sysFilter.period === 'YTD' ? 12 : sysFilter.period === '6M' ? 7 : sysFilter.period === '3M' ? 4 : 0)),
    storage: Math.round(25 + (sysFilter.period === 'YTD' ? -5  : sysFilter.period === '6M' ? -2 : 0)),
    cpu:     Math.round(22 + (sysFilter.period === 'YTD' ? 3   : 0)),
  };
  resourceData.avail = Math.max(5, 100 - resourceData.db - resourceData.storage - resourceData.cpu);

  // Visible system metrics (filtered by user prefs)
  const visibleMetrics = SA_METRICS.filter(m =>
    isFieldVisible ? isFieldVisible("super_admin", "System Metrics", m.label) : true
  );

  // Tenant table column visibility
  const showPlan    = isFieldVisible ? isFieldVisible("super_admin", "Recent Tenants", "Plan") : true;
  const showUsers   = isFieldVisible ? isFieldVisible("super_admin", "Recent Tenants", "Users") : true;
  const showMRR     = isFieldVisible ? isFieldVisible("super_admin", "Recent Tenants", "MRR Contribution") : true;
  const showBilling = isFieldVisible ? isFieldVisible("super_admin", "Recent Tenants", "Billing Cycle") : true;
  const showStorage = isFieldVisible ? isFieldVisible("super_admin", "Recent Tenants", "Disk Space") : true;
  const showCalls   = isFieldVisible ? isFieldVisible("super_admin", "Recent Tenants", "API Calls") : true;
  const showStatus  = isFieldVisible ? isFieldVisible("super_admin", "Recent Tenants", "Status") : true;
  const showDate    = isFieldVisible ? isFieldVisible("super_admin", "Recent Tenants", "Date") : true;

  // Dynamic grid cols class (Tailwind needs static strings, so we use inline style)
  const metricColCount = Math.max(3, visibleMetrics.length);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredTenants = SA_RECENT_TENANTS.filter(t => 
    Object.values(t).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-20 flex flex-col gap-8">
      
      {/* ── PLATFORM OVERVIEW SECTION ── */}
      {isSectionVisible("super_admin", "Platform Overview") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Platform Overview</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Global tenant management and system health metrics</p>
              </div>
              <div className="flex items-center gap-3">
                <KPICustomizeDropdown role="super_admin" />
                <SectionFilter
                  sectionKey="Platform Overview"
                  role="super_admin"
                  periodOptions={['Today', 'This Week', 'This Month', 'Last Month', 'This Quarter']}
                  secondaryFilters={[{ key: 'tenant', label: 'Tenant Type', options: ['All', 'Enterprise', 'SMB', 'Trial'] }]}
                  themeColor={themeColor}
                />
              </div>
            </div>
            <SolarKPIs role="super_admin" themeColor={themeColor} hideDropdown={true} />
          </div>
        </DashboardErrorBoundary>
      )}

      {/* ── SYSTEM METRICS ── */}
      {isSectionVisible("super_admin", "System Metrics") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <div className="flex items-start justify-between mb-6">
              <SectionTitle title="System Metrics & Capacity" sub="Real-time platform performance and scaling indicators" />
              <SectionFilter
                sectionKey="System Metrics"
                role="super_admin"
                periodOptions={['Today', 'This Week', '1M', '3M', '6M', 'YTD']}
                themeColor={themeColor}
              />
            </div>

            {visibleMetrics.length > 0 ? (
              <div
                className="grid gap-px bg-slate-200 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden mb-6"
                style={{ gridTemplateColumns: `repeat(${metricColCount}, minmax(0, 1fr))` }}
              >
                {visibleMetrics.map((m, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 p-5 bg-white dark:bg-[#17243A] hover:bg-slate-50 dark:hover:bg-[#1e2f4c] transition-colors duration-200 cursor-default group h-full">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">{m.label}</span>
                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1 text-center group-hover:scale-105 transition-transform">
                      {formatMetric(m.value, m.type)}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest mt-1 ${m.trendUp ? 'text-emerald-500' : 'text-rose-500'} text-center`}
                      title={m.trendPeriod}
                    >
                      {m.trend}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No metrics visible. Enable fields via the Customize panel.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Global Tenant Growth">
                <CJSLine themeColor={themeColor}
                  labels={tenantGrowth.labels}
                  series={[{ label: 'Total Tenants', data: tenantGrowth.data }]}
                />
              </ChartCard>
              <ChartCard title="System Resource Usage">
                <CJSDoughnut slices={[
                  { label: 'Database IOPS', value: resourceData.db,      color: '#3b82f6' },
                  { label: 'Storage',       value: resourceData.storage,  color: '#f59e0b' },
                  { label: 'Compute (CPU)', value: resourceData.cpu,      color: '#8b5cf6' },
                  { label: 'Available',     value: resourceData.avail,    color: '#22c55e' },
                ]}/>
              </ChartCard>
            </div>
          </div>
        </DashboardErrorBoundary>
      )}

      {/* ── RECENT TENANTS ── */}
      {isSectionVisible("super_admin", "Recent Tenants") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <div className="flex justify-between items-start mb-2">
              <SectionTitle title="Recent Tenants" sub="Recently provisioned workspaces and clients" widgetKey="Recent Tenants" />
              <div className="relative w-64 mt-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="w-full overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200 dark:border-slate-700/40 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md mt-2">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Tenant Name</th>
                    {showPlan    && <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Plan</th>}
                    {showUsers   && <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Users</th>}
                    {showMRR     && <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">MRR</th>}
                    {showBilling && <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Billing</th>}
                    {showStorage && <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Disk Space</th>}
                    {showCalls   && <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">API Calls</th>}
                    {showStatus  && <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>}
                    {showDate    && <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Date</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 dark:divide-slate-700/30">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="transition-colors group hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                      <td className="px-5 py-4">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{t.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{t.adminEmail}</div>
                      </td>
                      {showPlan && (
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                            t.plan === 'Enterprise' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                            t.plan === 'Professional' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                            {t.plan}
                          </span>
                        </td>
                      )}
                      {showUsers && (
                        <td className="px-5 py-4">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{t.users.toLocaleString()}</span>
                        </td>
                      )}
                      {showMRR && (
                        <td className="px-5 py-4">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatMetric(t.mrr, 'currency')}</span>
                        </td>
                      )}
                      {showBilling && (
                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.billingCycle}</span>
                        </td>
                      )}
                      {showStorage && (
                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t.storage}</span>
                        </td>
                      )}
                      {showCalls && (
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatMetric(t.apiCalls, 'count')}</span>
                        </td>
                      )}
                      {showStatus && (
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            t.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                            {t.status}
                          </span>
                        </td>
                      )}
                      {showDate && (
                        <td className="px-5 py-4">
                          <span className="text-[11px] font-semibold text-slate-500">{t.date}</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTenants.length === 0 && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No tenants found matching your search.
                </div>
              )}
            </div>
          </div>
        </DashboardErrorBoundary>
      )}

    </div>
  );
};

export default SuperAdminDashboard;
