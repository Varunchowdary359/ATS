// ══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS — Used across all 3 dashboards
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { KPI_COLORS, Icons } from './dashboardConstants';
import { motion } from 'framer-motion';
import SectionLayoutToggle from './SectionLayoutToggle';
import { useDashboardPreferences } from '../../../DashboardPreferencesContext';
export { KPI_COLORS, Icons };

export const SectionTitle = ({ title, sub, rightContent, widgetKey }) => {
  return (
    <div className="mb-6 ml-1 flex justify-between items-start relative">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h2>
        {sub && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
        {widgetKey && <SectionLayoutToggle sectionName={widgetKey} />}
      </div>
    </div>
  );
};

// ── Chart Card wrapper ────────────────────────────────────────────────────────
export const ChartCard = ({ title, children, className = '', noBg = false }) => (
  <div className={noBg 
    ? `flex flex-col p-4 ${className} group relative cursor-pointer transition-all hover:shadow-md` 
    : `glass-card p-5 flex flex-col ${className} group relative cursor-pointer transition-all hover:shadow-md hover:border-brand/30`
  }>
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</h3>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[10px] font-bold text-brand bg-brand/10 px-2 py-1 rounded-md uppercase tracking-widest">
        <span>Drill Down</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      </div>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

// ── Activity Feed ─────────────────────────────────────────────────────────────
export const ActivityFeed = ({ items }) => {
  const getIcon = (iconStr) => {
    switch (iconStr) {
      case '📅': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
      case '🤝': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>;
      case '⏳': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
      case '📥': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
      case '✓': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>;
      case '📄': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>;
      case '⭐': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>;
      case '🎤': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>;
      case '🎉': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
      case '🤝': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>;
      default: return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
    }
  };

  const hiringToday = [
    { label: 'Interviews', value: 12, color: '#3b82f6', icon: '📅' },
    { label: 'Offers Out', value: 5,  color: '#14b8a6', icon: '🤝' },
    { label: 'Pending',    value: 8,  color: '#f59e0b', icon: '⏳' },
    { label: 'New Apps',   value: 48, color: '#7c3aed', icon: '📥' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-[300px]">
      
      {/* Left: Activity Feed (70%) */}
      <div className="flex-1 lg:pr-6 lg:border-r border-slate-100 dark:border-slate-700/50">
        <div className="flex flex-col gap-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 group py-2.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-200 cursor-default">
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 group-hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: item.color + '18', color: item.color }}
              >
                {getIcon(item.icon)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.time}</p>
              </div>

              {/* Tag */}
              <span
                className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wider"
                style={{ backgroundColor: item.color + '15', color: item.color }}
              >
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Hiring Today Widget (30%) */}
      <div className="lg:w-[260px] shrink-0 lg:pl-6 pt-4 lg:pt-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Hiring Today</h3>
        </div>

        <div className="flex flex-col gap-3">
          {hiringToday.map((stat, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 hover:scale-[1.02] cursor-default group"
              style={{ 
                backgroundColor: stat.color + '08',
                borderColor: stat.color + '25'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{stat.label}</span>
              </div>
              <span className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Quick separator */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Live Pulse</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse" style={{ width: '68%' }} />
            </div>
            <span className="text-xs font-black text-emerald-500">68%</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Pipeline fill rate today</p>
        </div>
      </div>
    </div>
  );
};

// ── Candidate Table (Memoized with Density & Column Visibility Controls) ───────

const getMatchGradient = (score) => {
  if (score >= 85) return 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
  if (score >= 70) return 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)';
  if (score >= 50) return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
  return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
};

export const CandidateTable = React.memo(({ candidates = [], themeColor }) => {
  const { density, columnVisibility, toggleColumnVisibility } = useDashboardPreferences() || {};
  const [showColMenu, setShowColMenu] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const cols = columnVisibility?.candidateTable || { candidate: true, role: true, matchScore: true, action: true };

  const filteredCandidates = candidates.filter(c => 
    Object.values(c).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Density padding styles
  const cellPadding = density === 'compact' ? 'py-2 px-4' : density === 'comfortable' ? 'py-5 px-7' : 'py-4 px-6';

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Search and Column Customizer Toolbar */}
      <div className="flex justify-between items-center relative z-20 mb-1">
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end relative">
        <button
          onClick={() => setShowColMenu(prev => !prev)}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            showColMenu
              ? 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-100'
              : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
          Columns
        </button>

        {showColMenu && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] z-30 overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Toggle Columns</span>
            </div>
            {/* Toggle List */}
            <div className="py-1.5">
              {Object.keys(cols).map((colKey) => (
                <label key={colKey} className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150">
                  <span className="text-[13px] font-medium capitalize text-slate-700 dark:text-slate-200 leading-none select-none">
                    {colKey.replace(/([A-Z])/g, ' $1')}
                  </span>
                  {/* Toggle Switch */}
                  <span 
                    className={`relative inline-flex items-center w-[32px] h-[18px] rounded-full transition-colors duration-200 flex-shrink-0 ${
                      !cols[colKey] ? 'bg-slate-200 dark:bg-slate-700' : ''
                    }`}
                    style={cols[colKey] ? { backgroundColor: themeColor } : {}}
                  >
                    <span className={`absolute w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      cols[colKey] ? 'translate-x-[16px]' : 'translate-x-[2px]'
                    }`} />
                    <input
                      type="checkbox"
                      checked={cols[colKey]}
                      onChange={() => toggleColumnVisibility('candidateTable', colKey)}
                      className="sr-only"
                    />
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Table Element */}
      <div className="w-full overflow-x-auto custom-scrollbar rounded-2xl bento-card border border-slate-200 dark:border-slate-700/50">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
              {cols.candidate && <th className={`${cellPadding} text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest`}>Candidate</th>}
              {cols.role && <th className={`${cellPadding} text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell`}>Role</th>}
              {cols.matchScore && <th className={`${cellPadding} text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest`}>Match Score</th>}
              {cols.action && <th className={`${cellPadding} text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest text-right`}>Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60 dark:divide-slate-700/30">
            {filteredCandidates.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors duration-200 group">
                {cols.candidate && (
                  <td className={cellPadding}>
                    <div className="flex items-center gap-3.5">
                      <img src={`https://i.pravatar.cc/150?u=${c.name}`} alt={c.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 transition-transform group-hover:scale-105"/>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.name}</div>
                        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{c.exp}</div>
                      </div>
                    </div>
                  </td>
                )}
                {cols.role && (
                  <td className={`${cellPadding} hidden sm:table-cell`}>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{c.role}</div>
                    <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{c.reqId}</div>
                  </td>
                )}
                {cols.matchScore && (
                  <td className={cellPadding}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-850 dark:text-slate-200 w-9">{c.match}%</span>
                      <div className="w-24 sm:w-28 h-2 bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden relative shadow-inner">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.match}%`, background: getMatchGradient(c.match) }}/>
                      </div>
                    </div>
                  </td>
                )}
                {cols.action && (
                  <td className={`${cellPadding} text-right`}>
                    <button 
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer shadow-sm" 
                      style={{ backgroundColor: themeColor || '#3b82f6' }}
                    >
                      Review
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCandidates.length === 0 && (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            No candidates found matching your search.
          </div>
        )}
      </div>
    </div>
  );
});

// ── Interactive Funnel (Animated & Collision-Aware Tooltip) ────────────────────
export const InteractiveFunnel = React.memo(({ data }) => {
  const [hoveredIdx, setHoveredIdx] = React.useState(null);

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {data.map((stage, i) => {
        const prevValue = i > 0 ? data[i - 1].value : stage.value;
        const convRate = i > 0 && prevValue > 0 ? Math.round((stage.value / prevValue) * 100) : 100;

        return (
          <div 
            key={i} 
            className="flex flex-col gap-1.5 group relative"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Label and Value row */}
            <div className="flex justify-between items-center w-full px-0.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color || '#3b82f6' }} />
                {stage.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">{stage.value}</span>
                {i > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {convRate}% conv.
                  </span>
                )}
              </div>
            </div>
            
            {/* The Bar */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden flex items-center shadow-inner relative">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: stage.width || '0%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full transition-shadow duration-200"
                style={{ 
                  backgroundColor: stage.color || '#3b82f6',
                  boxShadow: hoveredIdx === i ? `0 0 10px ${stage.color || '#3b82f6'}80` : 'none'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ── Status Badge ──────────────────────────────────────────────────────────────
export const StatusBadge = React.memo(({ status, small = false }) => {
  const statusMap = {
    'Draft':            { bg: '#94a3b8', label: 'Draft', isLive: false },
    'Pending Approval': { bg: '#f97316', label: 'Pending', isLive: true },
    'Approved':         { bg: '#22c55e', label: 'Approved', isLive: false },
    'JD Review':        { bg: '#f97316', label: 'JD Review', isLive: true },
    'JD Published':     { bg: '#3b82f6', label: 'Published', isLive: false },
    'Sourcing':         { bg: '#3b82f6', label: 'Sourcing', isLive: true },
    'Screening':        { bg: '#8b5cf6', label: 'Screening', isLive: true },
    'Interview':        { bg: '#f97316', label: 'Interview', isLive: true },
    'Hiring':           { bg: '#3b82f6', label: 'Hiring', isLive: true },
    'Offer':            { bg: '#22c55e', label: 'Offer', isLive: false },
    'Closed':           { bg: '#64748b', label: 'Closed', isLive: false },
    'on-track':         { bg: '#22c55e', label: 'On Track', isLive: false },
    'at-risk':          { bg: '#f97316', label: 'At Risk', isLive: true },
    'breaching':        { bg: '#ef4444', label: 'Breaching', isLive: true },
  };
  const s = statusMap[status] || { bg: '#94a3b8', label: status, isLive: false };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full ${
        small ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'
      }`}
      style={{ backgroundColor: s.bg + '18', color: s.bg }}
    >
      <span 
        className={`w-1.5 h-1.5 rounded-full ${s.isLive ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: s.bg }}
      />
      {s.label}
    </span>
  );
});

// ── Enterprise Toggle Switch ───────────────────────────────────────────────────
export const ToggleSwitch = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        checked ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-2' : '-translate-x-2'
        }`}
      />
    </button>
  );
};

// ── Confirmation Dialog ───────────────────────────────────────────────────────
export const ConfirmationDialog = ({ isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, isDestructive = false, isLoading = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl shadow-xl overflow-hidden p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">{title}</h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={isLoading} className={`px-4 py-2 text-[12px] font-bold text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${isDestructive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-brand hover:bg-brand-hover'} disabled:opacity-50`}>
            {isLoading && <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
