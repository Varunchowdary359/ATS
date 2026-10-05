import React, { useState, useEffect } from 'react';
import SolarKPIs, { KPICustomizeDropdown } from './shared/SolarKPIs';
import { SectionTitle } from './shared/SharedComponents';
import DashboardErrorBoundary from './shared/DashboardErrorBoundary';
import SectionFilter from './shared/SectionFilter';
import { useDashboardPreferences } from '../../DashboardPreferencesContext';
import { useFilter } from '../../FilterContext';
import { getPeriodSeries } from './shared/usePeriodData';
import { ToastProvider } from './shared/ToastProvider';
import { WorkflowProvider } from './shared/WorkflowContext';
import WorkflowModal from './shared/WorkflowModal';
import { HR_SLA_DATA, MGR_COMPARISON_CANDIDATES } from './data/mockData';
import { ActivityFeed, CandidateTable, StatusBadge, ChartCard, InteractiveFunnel } from './shared/SharedComponents';
import { CJSDoughnut, CJSBar, CJSHBar, CJSLine } from './shared/Charts';
import { RequisitionsTable, CandidateComparison, FeedbackPending, QuickActions } from './WorkspaceWidgets';
import { DashboardDataService } from '../../services/db/DashboardDataService';

// ── Kanban Board Component ────────────────────────────────────────────────────
const KanbanBoard = ({ themeColor: _themeColor }) => {
  const [columns, setColumns] = useState(() => DashboardDataService.getKanbanColumns());
  const [dragItem, setDragItem] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  useEffect(() => {
    const handleUpdate = () => setColumns(DashboardDataService.getKanbanColumns());
    window.addEventListener('pw_db_updated', handleUpdate);
    const unsub = DashboardDataService.subscribe(handleUpdate);
    return () => {
      window.removeEventListener('pw_db_updated', handleUpdate);
      unsub();
    };
  }, []);

  const colColors = {
    'Draft': '#94a3b8',
    'Pending Approval': '#f59e0b',
    'Approved': '#22c55e',
    'JD Published': '#3b82f6',
    'Hiring': '#7c3aed',
    'Closed': '#0f172a',
  };

  const handleDragStart = (item, colName) => {
    setDragItem(item);
    setDragSource(colName);
  };

  const handleDragOver = (e, colName) => {
    e.preventDefault();
    setDragOverCol(colName);
  };

  const handleDrop = (targetCol) => {
    if (!dragItem || !dragSource || dragSource === targetCol) {
      setDragOverCol(null);
      return;
    }
    setColumns(prev => {
      const newCols = { ...prev };
      newCols[dragSource] = prev[dragSource].filter(i => i.id !== dragItem.id);
      newCols[targetCol] = [...prev[targetCol], dragItem];
      return newCols;
    });
    setDragItem(null);
    setDragSource(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDragOverCol(null);
  };

  const { isFieldVisible } = useDashboardPreferences();

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollSnapType: 'x mandatory' }}>
      {Object.entries(columns)
        .filter(([colName]) => isFieldVisible("workspace", "Requisition Pipeline", colName))
        .map(([colName, items]) => (
        <div
          key={colName}
          className={`flex-shrink-0 w-[250px] rounded-2xl border transition-all duration-200 ${
            dragOverCol === colName
              ? 'border-blue-300 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
              : 'border-slate-200/60 dark:border-slate-700/40 bg-slate-50/60 dark:bg-slate-800/30'
          }`}
          onDragOver={(e) => handleDragOver(e, colName)}
          onDrop={() => handleDrop(colName)}
          style={{ scrollSnapAlign: 'start' }}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200/50 dark:border-slate-700/20 bg-slate-50/30 dark:bg-slate-900/5">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colColors[colName] || '#94a3b8' }} />
              <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">{colName}</span>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {items.length}
            </span>
          </div>
          {/* Cards */}
          <div className="flex flex-col gap-3 p-3 min-h-[120px]">
            {items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item, colName)}
                onDragEnd={handleDragEnd}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-slate-450 dark:text-slate-500">{item.id}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{item.days}d open</span>
                </div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-snug">{item.role}</p>
                <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-1 block">{item.dept}</span>
              </div>
            ))}
            {items.length === 0 && (
              <div className="flex items-center justify-center h-20 text-xs font-semibold text-slate-350 dark:text-slate-650">
                Drop requisitions here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Interview Calendar Widget ─────────────────────────────────────────────────
const InterviewCalendar = () => {
  const [interviewsList, setInterviewsList] = useState(() => DashboardDataService.getUpcomingInterviews());

  useEffect(() => {
    const handleUpdate = () => setInterviewsList(DashboardDataService.getUpcomingInterviews());
    window.addEventListener('pw_db_updated', handleUpdate);
    const unsub = DashboardDataService.subscribe(handleUpdate);
    return () => {
      window.removeEventListener('pw_db_updated', handleUpdate);
      unsub();
    };
  }, []);

  const grouped = {};
  interviewsList.forEach(item => {
    const d = item.date || 'Today';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(item);
  });

  return (
    <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700/40 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.15)] overflow-hidden">
      {Object.entries(grouped).map(([date, interviews], gi) => (
        <div key={date}>
          {/* Date Header */}
          <div className={`px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 ${gi > 0 ? 'border-t border-slate-200 dark:border-slate-700/40' : ''}`}>
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{date}</span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 ml-2.5">({interviews.length} interviews scheduled)</span>
          </div>
          {/* Interview Items */}
          {interviews.map((iv, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-t border-slate-100 dark:border-slate-700/20 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
              <span className="text-xs font-black text-slate-650 dark:text-slate-400 w-20 shrink-0">{iv.time}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">{iv.candidate}</p>
                <p className="text-[11px] font-semibold text-slate-450 dark:text-slate-500 mt-0.5">{iv.role} · {iv.interviewer}</p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-500 shrink-0">
                {iv.round}
              </span>
              <button className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                Join →
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const WorkspaceDashboardContent = ({ themeColor, onNavigate }) => {
  const { isSectionVisible } = useDashboardPreferences();
  const { getSectionFilter } = useFilter() || {};
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('pw_db_updated', handleUpdate);
    const unsub = DashboardDataService.subscribe(handleUpdate);
    return () => {
      window.removeEventListener('pw_db_updated', handleUpdate);
      unsub();
    };
  }, []);

  const ws = DashboardDataService.getWorkspaceMetrics();
  const topCandidates = DashboardDataService.getTopCandidates();
  const actionItems = DashboardDataService.getActionItems();
  const activities = DashboardDataService.getRecentActivities();
  const pipelineFunnel = DashboardDataService.getPipelineFunnel();
  const deptPositions = DashboardDataService.getDepartmentOpenPositions();
  const sourceDistribution = DashboardDataService.getSourceDistribution();

  // Filters for chart sections
  const pipeFilter = getSectionFilter?.('workspace', 'Pipeline Overview') || {};
  const deptFilter = getSectionFilter?.('workspace', 'Department & Source Analytics') || {};

  const offerTrend = getPeriodSeries(pipeFilter, { base: Math.max(8, ws.totalApplicationsCount), growth: 2, amp: 4, offset: 5 });
  const acceptedTrend = getPeriodSeries(pipeFilter, { base: Math.max(5, Math.round(ws.totalApplicationsCount * 0.4)), growth: 1.8, amp: 3, offset: 8 });

  const timeToHireTrend = getPeriodSeries(deptFilter, { base: ws.timeToFill, growth: -1.5, amp: 2, offset: 12 });

  // Funnel / Doughnut dynamic shifts
  const isLongPipe = ['YTD', 'This Quarter'].includes(pipeFilter.period);
  const statusSlices = [
    { label: 'Open',      value: ws.openJobsCount, color: '#3b82f6' },
    { label: 'Interview', value: ws.interviewsCount,  color: '#f97316' },
    { label: 'Offer',     value: Math.max(2, Math.round(ws.totalApplicationsCount * 0.2)),  color: '#22c55e' },
    { label: 'Closed',    value: Math.max(1, ws.openJobsCount - ws.pendingApprovalsCount),  color: '#0f172a' },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-20 flex flex-col gap-8">

      {isSectionVisible("workspace", "My Workspace") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Recruitment Workspace</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Your team's active pipeline and operations</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <KPICustomizeDropdown role="workspace" />
                <SectionFilter
                  sectionKey="My Workspace"
                  role="workspace"
                  periodOptions={['Today', 'This Week', 'This Month', 'Last Month', 'This Quarter']}
                  secondaryFilters={[{ key: 'dept', label: 'Department', options: ['All', 'IT', 'Sales', 'Finance', 'HR', 'Operations'] }]}
                  themeColor={themeColor}
                />
              </div>
            </div>
            <SolarKPIs role="workspace" themeColor={themeColor} hideDropdown={true} />
          </div>
        </DashboardErrorBoundary>
      )}

      {isSectionVisible("workspace", "Quick Actions") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-4 sm:p-6">
            <SectionTitle title="Quick Actions" sub="One-click shortcuts for common tasks" />
            <QuickActions themeColor={themeColor} onNavigate={onNavigate} />
          </div>
        </DashboardErrorBoundary>
      )}

      {isSectionVisible("workspace", "Today's Action Items") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-4 sm:p-6">
            <SectionTitle title="Today's Action Items" sub="Tasks requiring your immediate attention" widgetKey="Today's Action Items" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3.5 p-4 sm:p-5 bg-white dark:bg-[#17243A] hover:bg-slate-50 dark:hover:bg-[#1e2f4c] transition-colors duration-200 group cursor-pointer h-full rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)]"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform" style={{ backgroundColor: item.color + '15', color: item.color }}>
                      {item.icon === '📋' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
                      {item.icon === '📝' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>}
                      {item.icon === '📅' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
                      {item.icon === '⏰' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                      {item.icon === '🎉' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">{item.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: item.color + '15', color: item.color }}>
                      {item.badge}
                    </span>
                    <button
                      className="hidden md:inline-flex px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardErrorBoundary>
      )}


      {isSectionVisible("workspace", "Feedback Pending") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <SectionTitle title="Feedback Pending" sub="Submit evaluations for recent candidate interviews" />
            <FeedbackPending themeColor={themeColor} />
          </div>
        </DashboardErrorBoundary>
      )}

      {isSectionVisible("workspace", "Pipeline Overview") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Pipeline Overview</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Your requisition funnel and source analytics</p>
              </div>
              <SectionFilter
                sectionKey="Pipeline Overview"
                role="workspace"
                periodOptions={['This Month', 'Last Month', 'This Quarter', 'YTD']}
                themeColor={themeColor}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <ChartCard title="My Requisition Pipeline">
                <InteractiveFunnel data={[
                  { label: 'Raised',    value: isLongPipe ? Math.round(ws.openJobsCount * 1.5) : ws.openJobsCount, width: '100%', color: '#94a3b8' },
                  { label: 'Approved',  value: Math.max(1, ws.openJobsCount - ws.pendingApprovalsCount), width: '77%',  color: '#3b82f6' },
                  { label: 'JD Created',value: Math.max(1, ws.openJobsCount - 2), width: '66%',  color: '#6366f1' },
                  { label: 'Published', value: Math.max(1, ws.openJobsCount - 3), width: '61%',  color: '#8b5cf6' },
                  { label: 'Hiring',    value: Math.max(1, ws.openJobsCount - 4),  width: '50%',  color: '#f59e0b' },
                  { label: 'Closed',    value: Math.max(1, Math.round(ws.openJobsCount * 0.3)),  width: '27%',  color: '#22c55e' },
                ]} />
              </ChartCard>
              <ChartCard title="Hiring Status Distribution">
                <CJSDoughnut slices={statusSlices}/>
              </ChartCard>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Source of Candidates">
                <InteractiveFunnel data={sourceDistribution} />
              </ChartCard>
              <ChartCard title={`Offer Acceptance Trend (${pipeFilter.period || 'This Month'})`}>
                <CJSLine themeColor={themeColor} labels={offerTrend.labels}
                  series={[
                    { label: 'Offers Made',     data: offerTrend.data },
                    { label: 'Offers Accepted', data: acceptedTrend.data },
                  ]}
                />
              </ChartCard>
            </div>
          </div>
        </DashboardErrorBoundary>
      )}


      {isSectionVisible("workspace", "Department & Source Analytics") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Department & Source Analytics</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Hiring performance by department and sourcing channel</p>
              </div>
              <SectionFilter
                sectionKey="Department & Source Analytics"
                role="workspace"
                periodOptions={['This Month', 'Last Month', 'This Quarter', 'YTD']}
                secondaryFilters={[{ key: 'source', label: 'Source', options: ['All', 'LinkedIn', 'Referral', 'Naukri', 'Career Portal'] }]}
                themeColor={themeColor}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <ChartCard title="Department-wise Open Positions">
                <InteractiveFunnel data={deptPositions} />
              </ChartCard>
              <ChartCard title="Requisition Status">
                <CJSDoughnut slices={statusSlices}/>
              </ChartCard>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <ChartCard title="Sourcing Channel ROI Analysis">
                <CJSBar themeColor={themeColor} labels={['Referral', 'LinkedIn', 'Naukri', 'Career Portal', 'Agency']}
                  series={[
                    { label: 'Avg. Cost Per Hire (₹ Thousands)', data: [12, 38, 25, 18, 95], color: '#f59e0b' },
                    { label: 'Conversion Rate (%)', data: [42, 28, 22, 18, 55], color: '#3b82f6' }
                  ]}
                />
              </ChartCard>
              <ChartCard title={`Time-to-Hire Trend (${deptFilter.period || 'This Month'})`}>
                <CJSLine themeColor={themeColor} labels={timeToHireTrend.labels}
                  series={[{ label: 'Avg Days', data: timeToHireTrend.data }]}
                />
              </ChartCard>
            </div>
            <div className="mt-5">
              <ChartCard title="Hiring Funnel Overview">
                <InteractiveFunnel data={pipelineFunnel} />
              </ChartCard>
            </div>
          </div>
        </DashboardErrorBoundary>
      )}


      {isSectionVisible("workspace", "My Requisitions") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6 overflow-hidden">
            <SectionTitle title="My Active Requisitions" sub="Track the status of roles you are hiring for" />
            <RequisitionsTable themeColor={themeColor} />
          </div>
        </DashboardErrorBoundary>
      )}

      {isSectionVisible("workspace", "Requisition Pipeline") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6 overflow-hidden">
             <SectionTitle title="Requisition Pipeline" sub="Drag and drop to update status" />
             <KanbanBoard themeColor={themeColor} />
          </div>
        </DashboardErrorBoundary>
      )}

      {isSectionVisible("workspace", "Interview Schedule") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <SectionTitle title="Upcoming Interviews" sub="Interviews scheduled across your requisitions" />
            <InterviewCalendar />
          </div>
        </DashboardErrorBoundary>
      )}


      {isSectionVisible("workspace", "Top AI Candidate Recommendations") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Top AI Candidate Recommendations</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Highest-scoring candidates across all active requisitions</p>
              </div>
              <button 
                onClick={() => onNavigate && onNavigate('candidates')}
                className="text-[12px] font-bold hover:opacity-70 transition-opacity shrink-0 cursor-pointer" 
                style={{ color: themeColor }}
              >
                View All →
              </button>
            </div>
            <CandidateTable themeColor={themeColor} candidates={topCandidates}/>
          </div>
        </DashboardErrorBoundary>
      )}


      {isSectionVisible("workspace", "Candidate Comparison") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6 overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Candidate Comparison</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Head-to-head evaluation of shortlisted candidates</p>
              </div>
              <SectionFilter
                sectionKey="Candidate Comparison"
                role="workspace"
                periodOptions={['All Active']}
                secondaryFilters={[{ key: 'role', label: 'Role', options: ['All Roles', 'Frontend Lead', 'Product Manager'] }]}
                themeColor={themeColor}
              />
            </div>
            <CandidateComparison themeColor={themeColor} />
          </div>
        </DashboardErrorBoundary>
      )}


      {isSectionVisible("workspace", "Compliance & SLA Monitor") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Compliance & SLA Monitor</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Average days per stage vs SLA target — identify bottlenecks</p>
              </div>
              <SectionFilter
                sectionKey="Compliance & SLA Monitor"
                role="workspace"
                periodOptions={['This Week', 'This Month', 'Last Month', 'This Quarter', 'YTD']}
                themeColor={themeColor}
              />
            </div>
            <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md border border-slate-100 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col gap-4">
                {HR_SLA_DATA.map((sla, i) => {
                  const pct = Math.min((sla.avg / (sla.target * 1.5)) * 100, 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{sla.stage}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-semibold text-slate-400">
                            {sla.avg}d avg / {sla.target}d target
                          </span>
                          <StatusBadge status={sla.status} small />
                        </div>
                      </div>
                      <div className="relative h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: sla.color }} />
                        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500" style={{ left: `${(sla.target / (sla.target * 1.5)) * 100}%` }} title={`Target: ${sla.target}d`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DashboardErrorBoundary>
      )}


      {isSectionVisible("workspace", "Recent Activities") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <SectionTitle title="Recent Activities" sub="Live audit trail across recruitment operations" />
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/60 dark:border-slate-700/60 rounded-2xl shadow-sm p-4 mt-4">
              <ActivityFeed items={activities}/>
            </div>
          </div>
        </DashboardErrorBoundary>
      )}

      {/* ── WORKSPACE METRICS ── */}
      {/* ── KANBAN BOARD ── */}
      {/* ── INTERVIEWS ── */}
      {/* ── HR WIDGETS ── */}
      {/* ── MANAGER WIDGETS ── */}
      {/* ── MANAGER WIDGETS ── */}
    </div>
  );
};

const WorkspaceDashboard = (props) => (
  <WorkspaceDashboardContent {...props} />
);

export default WorkspaceDashboard;
