import React, { useState } from 'react';
import SolarKPIs, { KPICustomizeDropdown } from './shared/SolarKPIs';
import { InteractiveFunnel, SectionTitle, ChartCard } from './shared/SharedComponents';
import SectionFilter from './shared/SectionFilter';
import EmptyState from './shared/EmptyState';
import DashboardErrorBoundary from './shared/DashboardErrorBoundary';
import { useDashboardPreferences } from '../../DashboardPreferencesContext';
import { useFilter } from '../../FilterContext';
import { getPeriodSeries, getQuarterlyLabels } from './shared/usePeriodData';
import { CJSLine, CJSBar, CJSDoughnut } from './shared/Charts';
import { ToastProvider } from './shared/ToastProvider';
import { WorkflowProvider, useWorkflowActions } from './shared/WorkflowContext';
import WorkflowModal from './shared/WorkflowModal';
import CustomSelect from './shared/CustomSelect';
import { CEO_APPROVALS, CEO_RISKS, CEO_AI_INSIGHTS, CEO_HEATMAP, CEO_BOARD_METRICS } from './data/mockData';
import { formatMetric } from './shared/formatHelpers';
import { DashboardDataService } from '../../services/db/DashboardDataService';
import { DatabaseService } from '../../services/db/DatabaseService';

import { CheckCircle2, BarChart3, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';

const CostOfVacancyCalculator = ({ openRolesCount = 28 }) => {
  const [weeklyCost, setWeeklyCost] = useState(150000); // Default ₹1.5L per week

  const totalWeeklyLoss = openRolesCount * weeklyCost;
  const totalMonthlyLoss = totalWeeklyLoss * 4;

  return (
    <div className="bento-card-premium p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>💰 Cost of Vacancy Calculator</span>
            <span className="bg-rose-500/10 text-rose-500 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">Financial Impact</span>
          </h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
            Estimate the hidden financial leakage of having {openRolesCount} positions currently vacant across your departments.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
              <span>Avg. Weekly Cost per Vacant Position:</span>
              <span className="text-blue-500 dark:text-blue-400 font-extrabold">{formatMetric(weeklyCost, 'currency')}</span>
            </div>
            <input
              type="range"
              min="50000"
              max="500000"
              step="25000"
              value={weeklyCost}
              onChange={(e) => setWeeklyCost(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
              <span>₹50K</span>
              <span>₹2.5L</span>
              <span>₹5L</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 shrink-0">
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 w-36 h-28">
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest text-center">Weekly Loss</span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-450 mt-2 text-center">{formatMetric(totalWeeklyLoss, 'currency')}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-100/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/50 w-36 h-28 shadow-sm">
            <span className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest text-center">Monthly Loss</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-450 mt-2 text-center">{formatMetric(totalMonthlyLoss, 'currency')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CEOQuickActions = () => {
  const { openWorkflowModal } = useWorkflowActions();
  const actions = [
    { label: 'Approve All Pending', desc: 'Batch approve requisitions', icon: <CheckCircle2 size={20} />, color: '#22c55e' },
    { label: 'Download Board Report', desc: 'Export executive deck PDF', icon: <BarChart3 size={20} />, color: '#3b82f6' },
    { label: 'Review Critical Risks', desc: 'Check SLA & budget breaches', icon: <AlertTriangle size={20} />, color: '#ef4444' },
    { label: 'Schedule Alignment', desc: 'Book align meeting with HR Head', icon: <CalendarIcon size={20} />, color: '#8b5cf6' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act, i) => (
        <button
          key={i}
          onClick={(e) => openWorkflowModal('simulated', act, e.currentTarget)}
          className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#17243A] hover:bg-slate-50 dark:hover:bg-[#1e2f4c] transition-all duration-200 cursor-pointer group text-left border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: act.color + '15', color: act.color }}>
            {act.icon}
          </div>
          <div>
            <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{act.label}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{act.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

const ClientCEODashboardContent = ({ themeColor }) => {
  const { isSectionVisible, isFieldVisible, getSectionIndex } = useDashboardPreferences();
  const { getSectionFilter } = useFilter() || {};

  // Filters for chart sections
  const forecastFilter = getSectionFilter?.('client_ceo', 'Hiring Forecast') || {};
  const diversityFilter = getSectionFilter?.('client_ceo', 'Diversity & Inclusion Progress') || {};

  const forecastSeries = getPeriodSeries(forecastFilter, { base: 32, growth: 2.5, amp: 4, offset: 2 });
  const targetSeries   = getPeriodSeries(forecastFilter, { base: 35, growth: 1.8, amp: 2, offset: 5 });

  const divQLabels = getQuarterlyLabels(diversityFilter);
  const divTarget  = divQLabels.map((_, i) => 25 + i * 5);
  const divActual  = divQLabels.map((_, i) => 22 + i * 6 + (diversityFilter.period === 'YTD' ? 8 : 0));

  // ── Approval state & Live Metrics ──────────────────────────────────────────
  const [approvals, setApprovals] = useState(() => DashboardDataService.getCEOApprovals());
  const [metrics, setMetrics] = useState(() => DashboardDataService.getWorkspaceMetrics());
  const [auditLog, setAuditLog]   = useState([]);
  const [sortBy, setSortBy] = useState('priority');
  const [searchTerm, setSearchTerm] = useState('');

  const [heatmapFilter, setHeatmapFilter] = useState('All');

  // Listen for database changes
  React.useEffect(() => {
    const refreshData = () => {
      setApprovals(DashboardDataService.getCEOApprovals());
      setMetrics(DashboardDataService.getWorkspaceMetrics());
    };
    const unsub = DashboardDataService.subscribe(refreshData);
    window.addEventListener('pw_db_updated', refreshData);
    return () => {
      unsub();
      window.removeEventListener('pw_db_updated', refreshData);
    };
  }, []);

  const handleApproval = (id, action) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const req = approvals.find(a => a.id === id);
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
    setAuditLog(prev => [{ id, role: req ? req.role : 'Requisition', action, time: timeStr }, ...prev].slice(0, 10));

    // Update in DatabaseService if exists
    DatabaseService.init();
    const targetReq = DatabaseService.requisitions.find(r => r.id === id || r.requisitionNumber === id);
    if (targetReq) {
      targetReq.status = action === 'approved' ? 'Approved' : 'Rejected';
    }
    DatabaseService.logAudit('EXECUTIVE_APPROVAL', 'requisitions', id, `Requisition ${id} ${action} by Client CEO`);
    DatabaseService.persistAll();
  };

  const handleBulkAction = (action) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const pending = approvals.filter(a => a.status === 'pending');
    setApprovals(prev => prev.map(a => a.status === 'pending' ? { ...a, status: action } : a));
    pending.forEach(req => {
      setAuditLog(prev => [{ id: req.id, role: req.role, action, time: timeStr }, ...prev].slice(0, 10));
    });

    // Update all pending in DatabaseService
    DatabaseService.init();
    DatabaseService.requisitions.forEach(r => {
      if (r.status === 'Pending Approval' || r.status === 'Pending') {
        r.status = action === 'approved' ? 'Approved' : 'Rejected';
      }
    });
    DatabaseService.logAudit('BULK_EXECUTIVE_APPROVAL', 'requisitions', 'ALL', `Bulk ${action} executed by Client CEO`);
    DatabaseService.persistAll();
  };

  const sortedApprovals = [...approvals].sort((a, b) => {
    if (sortBy === 'priority') {
      const prio = { critical: 0, high: 1, medium: 2, low: 3 };
      return (prio[a.priority] || 3) - (prio[b.priority] || 3);
    }
    if (sortBy === 'days') return b.daysPending - a.daysPending;
    return 0;
  });

  const filteredApprovals = sortedApprovals.filter(req => 
    Object.values(req).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-20 flex flex-col gap-8">
      
      {/* ── OVERVIEW SECTION ── */}
      <div className="flex flex-col gap-6">
        
        {/* Executive Overview */}
        {isSectionVisible("client_ceo", "Executive Overview") && (
          <DashboardErrorBoundary>
            <div className="bento-card-premium p-6" style={{ order: getSectionIndex("client_ceo", "Executive Overview") }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Smart KPIs</h2>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Your personal hiring metrics and pending actions</p>
                </div>
                <div className="flex items-center gap-3">
                  <KPICustomizeDropdown role="client_ceo" />
                  <SectionFilter
                    sectionKey="Executive Overview"
                    role="client_ceo"
                    periodOptions={['Today', 'This Week', 'This Month', 'Last Month', 'This Quarter']}
                    secondaryFilters={[{ key: 'dept', label: 'Department', options: ['All', 'IT', 'Sales', 'Finance', 'HR', 'Operations'] }]}
                    themeColor={themeColor}
                  />
                </div>
              </div>
              <SolarKPIs role="client_ceo" themeColor={themeColor} hideDropdown={true} />
            </div>
          </DashboardErrorBoundary>
        )}

        {/* Board-Ready Metrics Strip */}
        {isSectionVisible("client_ceo", "Board-Ready Metrics") && (
          <DashboardErrorBoundary>
            <div className="bento-card-premium p-6" style={{ order: getSectionIndex("client_ceo", "Board-Ready Metrics") }}>
              <SectionTitle title="Board Metrics" sub="High-level indicators for executive reporting" widgetKey="Board-Ready Metrics" />
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 mt-2">
              {CEO_BOARD_METRICS.filter(m => isFieldVisible ? isFieldVisible("client_ceo", "Board-Ready Metrics", m.label) : true).map((m, i) => {
                const formattedVal = formatMetric(m.value, m.type);
                const isCost = m.label.includes("Cost") || m.label.includes("Budget");
                const formattedTrendVal = isCost ? formatMetric(Math.abs(m.trendVal), 'currency') : Math.abs(m.trendVal);
                const trendText = `${m.trendUp ? '↑' : '↓'} ${formattedTrendVal}${m.type === 'days' ? 'd' : ''}`;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/40 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:shadow-sm hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-200 cursor-default group h-full">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest text-center leading-tight">{m.label}</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5 text-center group-hover:scale-105 transition-transform">{formattedVal}</span>
                    <div className={`mt-auto flex items-center justify-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm ${m.trendUp ? 'text-emerald-500' : 'text-rose-500'}`} title={m.trendPeriod}>
                      <span className="text-[10px] font-black uppercase tracking-wider">{trendText}</span>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </DashboardErrorBoundary>
        )}

        {/* Executive Quick Actions */}
        {isSectionVisible("client_ceo", "Executive Quick Actions") && (
          <DashboardErrorBoundary>
            <div className="bento-card-premium p-6" style={{ order: getSectionIndex("client_ceo", "Executive Quick Actions") }}>
              <SectionTitle title="Executive Quick Actions" sub="1-Click shortcuts for high-priority C-Suite tasks" widgetKey="Executive Quick Actions" />
              <CEOQuickActions />
            </div>
          </DashboardErrorBoundary>
        )}

        {/* Cost of Vacancy Calculator */}
        {isSectionVisible("client_ceo", "Executive Overview") && (
          <DashboardErrorBoundary>
            <CostOfVacancyCalculator openRolesCount={metrics.openJobsCount || 11} />
          </DashboardErrorBoundary>
        )}

      {/* ── APPROVALS SECTION ── */}
      {isSectionVisible("client_ceo", "Executive Approvals Queue") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6" style={{ order: getSectionIndex("client_ceo", "Executive Approvals Queue") }}>
            <SectionTitle
              title="Executive Approvals Queue"
              sub="Review and approve pending requisitions."
              widgetKey="Executive Approvals Queue"
              rightContent={
                <>
                  <div className="relative w-48 mr-2 hidden sm:block">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-36">
                    <CustomSelect
                      value={sortBy}
                      onChange={(val) => setSortBy(val)}
                      options={[{label: 'Sort: Priority', value: 'priority'}, {label: 'Sort: Aging', value: 'days'}]}
                      size="sm"
                    />
                  </div>
                  {pendingCount > 0 && (
                    <>
                      <button onClick={() => handleBulkAction('approved')} className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">Approve All</button>
                      <button onClick={() => handleBulkAction('rejected')} className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors">Reject All</button>
                    </>
                  )}
                </>
              }
            />

            {sortedApprovals.length === 0 ? (
              <EmptyState
                icon="🎉"
                title="Approvals Queue Clean"
                subtitle="You have reviewed all pending executive requisitions."
              />
            ) : (
              <div className="w-full overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200 dark:border-slate-700/40 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.15)] mt-2">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="px-5 py-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">ID</th>
                      {isFieldVisible("client_ceo", "Executive Approvals Queue", "Role / Dept") && <th className="px-5 py-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Role / Dept</th>}
                      {isFieldVisible("client_ceo", "Executive Approvals Queue", "Budget") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Budget</th>}
                      {isFieldVisible("client_ceo", "Executive Approvals Queue", "Requester") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Requester</th>}
                      {isFieldVisible("client_ceo", "Executive Approvals Queue", "Hiring Manager") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Hiring Manager</th>}
                      {isFieldVisible("client_ceo", "Executive Approvals Queue", "Employment Type") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Type</th>}
                      {isFieldVisible("client_ceo", "Executive Approvals Queue", "Work Location") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Location</th>}
                      {isFieldVisible("client_ceo", "Executive Approvals Queue", "Aging") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Aging</th>}
                      {isFieldVisible("client_ceo", "Executive Approvals Queue", "Priority") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Priority</th>}
                      {isFieldVisible("client_ceo", "Executive Approvals Queue", "Status") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60 dark:divide-slate-700/30">
                    {filteredApprovals.map((req) => {
                      const done = req.status !== 'pending';
                      const prioColors = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8' };
                      return (
                        <tr key={req.id} className={`transition-colors group hover:bg-slate-50/80 dark:hover:bg-slate-700/30`}>
                          <td className="px-5 py-3"><span className="text-xs font-black text-slate-700 dark:text-slate-300">{req.id}</span></td>
                          {isFieldVisible("client_ceo", "Executive Approvals Queue", "Role / Dept") && (
                            <td className="px-5 py-3">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{req.role}</div>
                              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{req.dept}</div>
                            </td>
                          )}
                          {isFieldVisible("client_ceo", "Executive Approvals Queue", "Budget") && (
                            <td className="px-5 py-3"><span className="text-xs font-black text-emerald-600 dark:text-emerald-450">{formatMetric(req.budget, 'currency')}</span></td>
                          )}
                          {isFieldVisible("client_ceo", "Executive Approvals Queue", "Requester") && (
                            <td className="px-5 py-3"><span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{req.requestedBy}</span></td>
                          )}
                          {isFieldVisible("client_ceo", "Executive Approvals Queue", "Hiring Manager") && (
                            <td className="px-5 py-3"><span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{req.hiringManager}</span></td>
                          )}
                          {isFieldVisible("client_ceo", "Executive Approvals Queue", "Employment Type") && (
                            <td className="px-5 py-3"><span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{req.employmentType}</span></td>
                          )}
                          {isFieldVisible("client_ceo", "Executive Approvals Queue", "Work Location") && (
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                                {req.workLocation}
                              </span>
                            </td>
                          )}
                          {isFieldVisible("client_ceo", "Executive Approvals Queue", "Aging") && (
                            <td className="px-5 py-3">
                              <span className={`text-[11px] font-black ${req.daysPending >= 10 ? 'text-rose-500' : req.daysPending >= 7 ? 'text-amber-500' : 'text-slate-500'}`}>
                                {req.daysPending} days
                              </span>
                            </td>
                          )}
                          {isFieldVisible("client_ceo", "Executive Approvals Queue", "Priority") && (
                            <td className="px-5 py-3">
                              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md" style={{ backgroundColor: (prioColors[req.priority] || '#94a3b8') + '15', color: prioColors[req.priority] || '#94a3b8' }}>
                                {req.priority}
                              </span>
                            </td>
                          )}
                          {isFieldVisible("client_ceo", "Executive Approvals Queue", "Status") && (
                            <td className="px-5 py-3">
                              {done ? (
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                  {req.status === 'approved' ? 'Approved' : 'Rejected'}
                                </span>
                              ) : (
                                <div className="flex gap-2">
                                  <button onClick={() => handleApproval(req.id, 'approved')} className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-emerald-500 dark:hover:bg-emerald-500 transition-colors shadow-sm">Approve</button>
                                  <button onClick={() => handleApproval(req.id, 'rejected')} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 hover:bg-rose-500/10 transition-colors">Decline</button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredApprovals.length === 0 && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    No approvals found matching your search.
                  </div>
                )}
              </div>
            )}

            {auditLog.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Audit Log</h4>
                <div className="flex flex-col gap-2">
                  {auditLog.map((log, i) => (
                    <div key={i} className="flex items-center gap-3 text-[11px]">
                      <span className="text-slate-400 font-mono w-16">{log.time}</span>
                      <span className={`font-black uppercase w-4 ${log.action === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>{log.action === 'approved' ? '✓' : '✕'}</span>
                      <span className="text-slate-600 dark:text-slate-400">{log.id} — <span className="font-bold text-slate-800 dark:text-slate-200">{log.role}</span> was {log.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DashboardErrorBoundary>
      )}


        {/* Bento Grid: Risks & Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" style={{ order: Math.min(getSectionIndex("client_ceo", "Critical Hiring Risks"), getSectionIndex("client_ceo", "AI Executive Insights")) }}>
          
          {/* Critical Risks */}
          {isSectionVisible("client_ceo", "Critical Hiring Risks") && (
            <DashboardErrorBoundary>
              <div className="bento-card-premium p-6 h-full">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
                  <span>Critical Hiring Risks</span>
                  <span className="bg-rose-500/10 text-rose-500 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Action Needed</span>
                </h3>
                <div className="flex flex-col gap-3">
                  {CEO_RISKS.map((risk, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 hover:border-rose-500/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group relative overflow-hidden">
                      <div className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-xl" style={{ backgroundColor: risk.sev_color }} />
                      <span className="text-base shrink-0 mt-0.5 ml-2">{risk.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-black text-slate-800 dark:text-slate-100">{risk.title}</span>
                          {risk.escalated && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 animate-pulse">Escalated</span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-2">{risk.detail}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            ⏱ {risk.sla} days
                          </span>
                          <span className="text-[10px] font-black text-rose-500">
                            💰 {risk.impact} impact
                          </span>
                        </div>
                      </div>
                      <button className="shrink-0 self-center px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors dark:text-slate-200">
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </DashboardErrorBoundary>
          )}

          {/* AI Insights */}
          {isSectionVisible("client_ceo", "AI Executive Insights") && (
            <DashboardErrorBoundary>
              <div className="bento-card-premium p-6 h-full">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  Executive Insights & Intelligence
                </h3>
                <div className="flex flex-col gap-4">
                  {CEO_AI_INSIGHTS.map((ins, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-[#0F1117] transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-default">
                      <div className="text-2xl mt-1 shrink-0">{ins.icon}</div>
                      <div className="flex-1">
                        <h4 className="text-[13px] font-black text-slate-800 dark:text-slate-100 mb-1">{ins.headline}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">{ins.detail}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Confidence</span>
                            <span className="text-[11px] font-black" style={{ color: ins.confColor }}>{ins.confidence}%</span>
                          </div>
                          <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-sm glow-primary transition-all hover:scale-105 active:scale-95"
                                  style={{ backgroundColor: 'var(--color-brand)' }}>
                            {ins.action}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DashboardErrorBoundary>
          )}
        </div>

        {/* Heatmap & Funnel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" style={{ order: Math.min(getSectionIndex("client_ceo", "Org-Wide Hiring Heatmap"), getSectionIndex("client_ceo", "Hiring Funnel")) }}>
          
          {isSectionVisible("client_ceo", "Org-Wide Hiring Heatmap") && (
            <div className="xl:col-span-2 bento-card-premium p-6 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Org-Wide Hiring Heatmap</h3>
                <div className="flex gap-2">
                  {['All', 'Healthy', 'At risk', 'Critical'].map((tab) => (
                    <button key={tab} onClick={() => setHeatmapFilter(tab)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                              heatmapFilter === tab ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800'
                            }`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-1 overflow-x-auto pb-2 mt-2">
                <div className="flex items-center gap-1.5 px-2 mb-2">
                  <div className="w-24 shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dept</div>
                  <div className="flex-1 grid grid-cols-6 gap-1.5">
                    {CEO_HEATMAP.months.map(m => (
                      <div key={m} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{m}</div>
                    ))}
                  </div>
                </div>
                
                {CEO_HEATMAP.departments.map((dept, idx) => {
                  const row = CEO_HEATMAP.data[idx];
                  const validVals = row.filter(v => v !== null);
                  const latestVal = validVals.length ? validVals[validVals.length - 1] : 0;
                  let status = 'Healthy';
                  if (latestVal < 40) status = 'Critical';
                  else if (latestVal <= 70) status = 'At risk';
                  
                  if (heatmapFilter !== 'All' && status !== heatmapFilter) return null;

                  return (
                    <div key={dept} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <div className="w-24 shrink-0 text-[11px] font-black text-slate-700 dark:text-slate-300 truncate" title={dept}>{dept}</div>
                      <div className="flex-1 grid grid-cols-6 gap-1.5">
                        {row.map((val, ci) => {
                          if (val === null) {
                            return <div key={ci} className="h-7 rounded-md bg-slate-100 dark:bg-slate-800/40" />;
                          }
                          const isHealthy = val > 70;
                          const isAtRisk = val >= 40 && val <= 70;
                          const opacity = 0.3 + (val / 100) * 0.7;
                          const colorHex = isHealthy ? '34, 197, 94' : isAtRisk ? '245, 158, 11' : '239, 68, 68';
                          
                          return (
                            <div 
                              key={ci} 
                              className="h-8 rounded-md transition-transform hover:scale-105 cursor-pointer flex items-center justify-center relative group/cell border border-black/5 dark:border-white/5"
                              style={{ backgroundColor: `rgba(${colorHex}, ${opacity})` }}
                            >
                              <span className="text-[11px] font-black text-slate-800 dark:text-white mix-blend-overlay">
                                {val}%
                              </span>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/cell:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                                {CEO_HEATMAP.months[ci]} - {val}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isSectionVisible("client_ceo", "Hiring Funnel") && (
            <div className="xl:col-span-1 h-full">
              <ChartCard title="Hiring Funnel Efficiency" className="h-full">
                <InteractiveFunnel data={[
                  { label: 'Applied',     value: 6840, width: '100%', color: '#94a3b8' },
                  { label: 'Screened',    value: 4120, width: '60%',  color: '#3b82f6' },
                  { label: 'Shortlisted', value: 2100, width: '31%',  color: '#6366f1' },
                  { label: 'Interviewed', value: 1200, width: '17%',  color: '#8b5cf6' },
                  { label: 'Selected',    value: 380,  width: '5.5%', color: '#f59e0b' },
                  { label: 'Joined',      value: 312,  width: '4.5%', color: '#22c55e' },
                ]} />
              </ChartCard>
            </div>
          )}

        </div>

        {/* Hiring Forecast */}
        {isSectionVisible("client_ceo", "Hiring Forecast") && (
          <DashboardErrorBoundary>
            <div className="bento-card-premium p-6" style={{ order: getSectionIndex("client_ceo", "Hiring Forecast") }}>
               <div className="flex items-start justify-between mb-6">
                 <SectionTitle title="Hiring Forecast vs Target" sub="Projected headcount additions for the selected period" widgetKey="Hiring Forecast" />
                 <SectionFilter
                   sectionKey="Hiring Forecast"
                   role="client_ceo"
                   periodOptions={['This Quarter', 'Next Quarter', 'YTD']}
                   themeColor={themeColor}
                   hideLayoutToggle={true}
                 />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2">
                   <ChartCard title={`Trend Analysis (${forecastFilter.period || '1M'})`}>
                     <CJSLine themeColor={themeColor} labels={forecastSeries.labels}
                       series={[
                         { label: 'Forecast', data: forecastSeries.data },
                         { label: 'Target',   data: targetSeries.data },
                       ]}
                     />
                   </ChartCard>
                 </div>
                 <div className="lg:col-span-1">
                   <ChartCard title="Department Status" className="h-full justify-center pt-8">
                     <div className="flex flex-col gap-5">
                      {[
                        { dept: 'IT',         status: 'On Track', pct: 92, color: '#22c55e' },
                        { dept: 'Operations', status: 'On Track', pct: 88, color: '#22c55e' },
                        { dept: 'Sales',      status: 'At Risk',  pct: 61, color: '#f59e0b' },
                        { dept: 'Finance',    status: 'At Risk',  pct: 70, color: '#f59e0b' },
                      ].map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-16 text-[10px] font-bold text-slate-600 dark:text-slate-400 shrink-0 uppercase tracking-wide">{d.dept}</span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                            <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width: `${d.pct}%`, backgroundColor: d.color }}/>
                          </div>
                          <span className="text-[11px] font-black w-8 text-right" style={{ color: d.color }}>{d.pct}%</span>
                        </div>
                      ))}
                     </div>
                   </ChartCard>
                 </div>
               </div>
            </div>
          </DashboardErrorBoundary>
        )}

        {/* Diversity & Inclusion Progress */}
        {isSectionVisible("client_ceo", "Diversity & Inclusion Progress") && (
          <DashboardErrorBoundary>
            <div className="bento-card-premium p-6 mt-2" style={{ order: getSectionIndex("client_ceo", "Diversity & Inclusion Progress") }}>
              <div className="flex items-start justify-between mb-6">
                <SectionTitle title="Diversity & Inclusion (D&I) Progress" sub="Tracking hiring diversity goals across the organization" widgetKey="Diversity & Inclusion Progress" />
                <SectionFilter
                  sectionKey="Diversity & Inclusion Progress"
                  role="client_ceo"
                  periodOptions={['1M', '3M', '6M', 'YTD', 'This Quarter']}
                  themeColor={themeColor}
                  hideLayoutToggle={true}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="D&I Hiring Targets">
                  <CJSBar themeColor={themeColor} labels={divQLabels}
                    series={[
                      { label: 'Target', data: divTarget, color: '#94a3b8' },
                      { label: 'Actual', data: divActual, color: '#8b5cf6' }
                    ]}
                  />
                </ChartCard>
                <ChartCard title="Diversity Breakdown">
                  <CJSDoughnut slices={[
                    { label: 'Women in Tech',   value: 40, color: '#ec4899' },
                    { label: 'Veterans',        value: 15, color: '#3b82f6' },
                    { label: 'Minorities',      value: 25, color: '#f59e0b' },
                    { label: 'Other',           value: 20, color: '#22c55e' },
                  ]}/>
                </ChartCard>
              </div>
            </div>
          </DashboardErrorBoundary>
        )}

      </div>

    </div>
  );
};

const ClientCEODashboard = (props) => (
  <ClientCEODashboardContent {...props} />
);

export default ClientCEODashboard;
