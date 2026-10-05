import React, { useState, useEffect } from 'react';
import { useDashboardPreferences } from '../../DashboardPreferencesContext';
import { useWorkflowActions } from './shared/WorkflowContext';
import EmptyState from './shared/EmptyState';
import { StatusBadge } from './shared/SharedComponents';
import { MGR_COMPARISON_CANDIDATES } from './data/mockData';
import { formatMetric } from './shared/formatHelpers';
import { DashboardDataService } from '../../services/db/DashboardDataService';

// ── My Requisitions Table ─────────────────────────────────────────────────────
export const RequisitionsTable = ({ themeColor: _themeColor }) => {
  const { isFieldVisible } = useDashboardPreferences();
  const { requisitions } = useWorkflowActions();
  const [searchTerm, setSearchTerm] = React.useState('');

  const isVisible = (field) => isFieldVisible("workspace", "My Requisitions", field);

  const filteredRequisitions = requisitions.filter(req => 
    Object.values(req).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex justify-end">
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search requisitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="w-full overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200 dark:border-slate-700/40 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
            <th className="px-5 py-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">REQ ID</th>
            {isVisible("Role") && <th className="px-5 py-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Role</th>}
            {isVisible("Department") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Dept</th>}
            {isVisible("Assigned Recruiter") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Recruiter</th>}
            {isVisible("Priority") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Priority</th>}
            {isVisible("Approved Budget") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Budget</th>}
            {isVisible("Status") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>}
            {isVisible("SLA Status") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">SLA Status</th>}
            {isVisible("Days Open") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Days Open</th>}
            {isVisible("Candidates") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Candidates</th>}
            {isVisible("Next Action") && <th className="px-5 py-4 text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Next Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/60 dark:divide-slate-700/30">
          {filteredRequisitions.map((req) => (
            <tr key={req.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group ${
              req.syncStatus === 'pending' ? 'bg-amber-50/30 dark:bg-amber-950/20 animate-pulse' : ''
            }`}>
              <td className="px-5 py-4">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{req.id}</span>
                {req.syncStatus === 'pending' && (
                  <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300">
                    Syncing...
                  </span>
                )}
              </td>
              {isVisible("Role") && (
                <td className="px-5 py-4">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{req.role}</span>
                </td>
              )}
              {isVisible("Department") && (
                <td className="px-5 py-4">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{req.dept}</span>
                </td>
              )}
              {isVisible("Assigned Recruiter") && (
                <td className="px-5 py-4">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{req.recruiter || 'Unassigned'}</span>
                </td>
              )}
              {isVisible("Priority") && (
                <td className="px-5 py-4">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    req.priority === 'critical' ? 'bg-red-500/10 text-red-500 dark:text-red-400' :
                    req.priority === 'high' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    req.priority === 'medium' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                  }`}>
                    {req.priority || 'medium'}
                  </span>
                </td>
              )}
              {isVisible("Approved Budget") && (
                <td className="px-5 py-4">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">{formatMetric(req.budget, 'currency')}</span>
                </td>
              )}
              {isVisible("Status") && (
                <td className="px-5 py-4">
                  <StatusBadge status={req.status} />
                </td>
              )}
              {isVisible("SLA Status") && (
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    req.slaStatus === 'on-track' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                    req.slaStatus === 'at-risk' ? 'bg-amber-550/10 text-amber-600 dark:text-amber-400' :
                    'bg-red-50 text-red-650 dark:bg-red-500/10 dark:text-red-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      req.slaStatus === 'on-track' ? 'bg-emerald-500' :
                      req.slaStatus === 'at-risk' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
                    }`} />
                    {req.slaStatus || 'on-track'}
                  </span>
                </td>
              )}
              {isVisible("Days Open") && (
                <td className="px-5 py-4">
                  <span className={`text-xs font-black ${
                    req.daysOpen >= 20 ? 'text-rose-500' : req.daysOpen >= 14 ? 'text-amber-500' : 'text-slate-500'
                  }`}>{req.daysOpen}d</span>
                </td>
              )}
              {isVisible("Candidates") && (
                <td className="px-5 py-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{req.candidates}</span>
                </td>
              )}
              {isVisible("Next Action") && (
                <td className="px-5 py-4">
                  <button
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none cursor-pointer"
                  >
                    {req.nextAction}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {filteredRequisitions.length === 0 && (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          No requisitions found matching your search.
        </div>
      )}
      </div>
    </div>
  );
};

// ── Candidate Comparison View ─────────────────────────────────────────────────
export const CandidateComparison = ({ themeColor }) => {
  const { isFieldVisible } = useDashboardPreferences();
  const [candidates, setCandidates] = useState(() => DashboardDataService.getComparisonCandidates() || MGR_COMPARISON_CANDIDATES);

  useEffect(() => {
    const refresh = () => {
      setCandidates(DashboardDataService.getComparisonCandidates() || MGR_COMPARISON_CANDIDATES);
    };
    const unsub = DashboardDataService.subscribe(refresh);
    window.addEventListener('pw_db_updated', refresh);
    return () => {
      unsub();
      window.removeEventListener('pw_db_updated', refresh);
    };
  }, []);

  const allSkills = [...new Set(candidates.flatMap(c => Object.keys(c.skills || {})))];

  const isVisible = (field) => isFieldVisible("workspace", "Candidate Comparison", field);

  return (
    <div className="w-full overflow-x-auto custom-scrollbar bg-white/80 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700/40 rounded-2xl shadow-sm">
      <div className="min-w-[700px]">
        {/* Comparison Header */}
        <div className="grid border-b border-slate-200 dark:border-slate-700/40" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
          <div className="sticky left-0 z-10 px-5 py-5 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Compare</span>
          </div>
          {candidates.map((c, i) => {
            const isTop = c.match === Math.max(...candidates.map(x => x.match));
            return (
              <div 
                key={i} 
                className={`px-5 py-5 text-center transition-colors relative ${
                  isTop 
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30 rounded-t-xl' 
                    : 'bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-13 h-13 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-700"
                    style={{ background: themeColor || '#3b82f6' }}
                  >
                    {c.avatar}
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{c.name}</span>
                  <span className="text-[10px] font-semibold text-slate-450">{c.exp} · {c.company}</span>
                  {isTop && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm">
                      ⭐ Top Match
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Match Score */}
        <div className="grid border-b border-slate-200/60 dark:border-slate-700/30" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
          <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Match Score</span>
          </div>
          {candidates.map((c, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-center gap-3">
              <span className="text-sm font-black text-slate-800 dark:text-slate-100">{c.match}%</span>
              <div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${c.match}%`, background: themeColor || '#3b82f6' }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Skills */}
        {isVisible("Skills Score") && allSkills.map((skill, si) => (
          <div key={si} className="grid border-b border-slate-100/40 dark:border-slate-700/20" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
            <div className="sticky left-0 z-10 px-5 py-3 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{skill}</span>
            </div>
            {candidates.map((c, i) => {
              const val = c.skills[skill] || 0;
              const isHighest = val === Math.max(...candidates.map(x => x.skills[skill] || 0));
              return (
                <div key={i} className="px-5 py-3 flex items-center justify-center gap-2.5">
                  <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${val}%`, backgroundColor: isHighest ? '#22c55e' : (themeColor || '#3b82f6') }}
                    />
                  </div>
                  <span className={`text-[11px] font-black w-8 text-right ${isHighest ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {val}%
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        {/* Technical Test Score */}
        {isVisible("Technical Score") && (
          <div className="grid border-b border-slate-200/60 dark:border-slate-700/30" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
            <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tech Test Score</span>
            </div>
            {candidates.map((c, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-center gap-2.5">
                <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${c.technicalScore}%` }}/>
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-350">{c.technicalScore}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Culture Fit Rating */}
        {isVisible("Culture Fit") && (
          <div className="grid border-b border-slate-200/60 dark:border-slate-700/30" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
            <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Culture Fit</span>
            </div>
            {candidates.map((c, i) => (
              <div key={i} className="px-5 py-4 text-center flex items-center justify-center gap-1">
                <span className="text-xs font-black text-amber-500">{c.cultureFit}</span>
                <span className="text-amber-400 text-xs">★</span>
              </div>
            ))}
          </div>
        )}

        {/* Preferred Location */}
        {isVisible("Location") && (
          <div className="grid border-b border-slate-200/60 dark:border-slate-700/30" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
            <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Preferred Work Style</span>
            </div>
            {candidates.map((c, i) => (
              <div key={i} className="px-5 py-4 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-400">
                  {c.preferredLocation}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* AI Strengths Summary */}
        {isVisible("AI Summary") && (
          <div className="grid border-b border-slate-200/60 dark:border-slate-700/30" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
            <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">AI Screening Summary</span>
            </div>
            {candidates.map((c, i) => (
              <div key={i} className="px-5 py-4 text-left">
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">{c.aiSummary}</p>
              </div>
            ))}
          </div>
        )}

        {/* Hiring Probability */}
        {isVisible("Hiring Probability") && (
          <div className="grid border-b border-slate-200/60 dark:border-slate-700/30" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
            <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Hiring Probability</span>
            </div>
            {candidates.map((c, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-center gap-2.5">
                <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-750 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.hiringProbability}%` }}/>
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{c.hiringProbability}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Salary Fit */}
        {isVisible("Salary Fit") && (
          <div className="grid border-b border-slate-200/60 dark:border-slate-700/30" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
            <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Salary Budget Fit</span>
            </div>
            {candidates.map((c, i) => (
              <div key={i} className="px-5 py-4 text-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  c.salaryFit === 'Within Budget' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                }`}>
                  {c.salaryFit}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Notice Risk */}
        {isVisible("Notice Risk") && (
          <div className="grid border-b border-slate-200/60 dark:border-slate-700/30" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
            <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Notice Risk</span>
            </div>
            {candidates.map((c, i) => (
              <div key={i} className="px-5 py-4 text-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  c.noticeRisk === 'Low' ? 'bg-emerald-500/10 text-emerald-600' :
                  c.noticeRisk === 'Medium' ? 'bg-amber-500/10 text-amber-600' :
                  'bg-rose-500/10 text-rose-600'
                }`}>
                  {c.noticeRisk} Notice
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Salary */}
        <div className="grid border-b border-slate-200/60 dark:border-slate-700/30" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
          <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Salary (Current → Exp)</span>
          </div>
          {candidates.map((c, i) => (
            <div key={i} className="px-5 py-4 text-center">
              <span className="text-xs font-semibold text-slate-450">{formatMetric(c.salary, 'currency')}</span>
              <span className="text-xs font-bold text-slate-500 mx-1.5">→</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{formatMetric(c.expected, 'currency')}</span>
            </div>
          ))}
        </div>

        {/* Notice Period */}
        <div className="grid border-b border-slate-200/60 dark:border-slate-700/30" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
          <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Notice Period</span>
          </div>
          {candidates.map((c, i) => (
            <div key={i} className="px-5 py-4 text-center">
              <span className={`text-xs font-black ${
                c.noticePeriod <= 30 ? 'text-emerald-500' : c.noticePeriod <= 45 ? 'text-amber-500' : 'text-rose-500'
              }`}>{c.noticePeriod} days</span>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div className="grid" style={{ gridTemplateColumns: `170px repeat(${candidates.length}, 1fr)` }}>
          <div className="sticky left-0 z-10 px-5 py-4 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md flex items-center border-r border-slate-200/80 dark:border-slate-700/60 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25)]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Feedback</span>
          </div>
          {candidates.map((c, i) => (
            <div key={i} className="px-5 py-4 text-center">
              {c.feedback.map((f, fi) => (
                <div key={fi}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-xs font-black text-amber-500">{f.rating}</span>
                    <span className="text-amber-400 text-xs">★</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-450 dark:text-slate-500 leading-normal">{f.comment}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Feedback Pending Widget ───────────────────────────────────────────────────
export const FeedbackPending = ({ themeColor }) => {
  const { feedbackPending, openWorkflowModal } = useWorkflowActions();

  if (feedbackPending.length === 0) {
    return (
      <EmptyState
        icon="✍️"
        title="All Feedback Submitted!"
        subtitle="Great job! You have no pending interview evaluations to complete."
        themeColor={themeColor}
      />
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700/40 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-700/40 bg-rose-50/30 dark:bg-rose-950/10">
        <div className="flex items-center gap-2.5">
          <span className="text-base">✍️</span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">Feedback Pending</span>
          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-500">
            {feedbackPending.length}
          </span>
        </div>
      </div>
      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/20">
        {feedbackPending.map((fb) => (
          <div key={fb.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{fb.candidate}</p>
                {fb.urgent && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200/50 dark:border-rose-800/40 shrink-0">
                    Overdue
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {fb.role} · <span className="font-semibold text-slate-700 dark:text-slate-300">{fb.round}</span> · {fb.date}
              </p>
            </div>
            
            <div className="flex items-center justify-end sm:justify-start shrink-0">
              <button
                onClick={(e) => openWorkflowModal('feedback', fb, e.currentTarget)}
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                style={{ backgroundColor: themeColor || '#3b82f6' }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ── Quick Actions Panel ───────────────────────────────────────────────────────
export const QuickActions = ({ themeColor, onNavigate }) => {
  const { isFieldVisible } = useDashboardPreferences();
  const { openWorkflowModal } = useWorkflowActions();

  const actions = [
    { 
      type: 'raise_req', 
      label: 'Raise New Requisition', 
      desc: 'Create a new hiring request',
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
    },
    { 
      type: 'schedule_iv', 
      label: 'Schedule Interview', 
      desc: 'Book interview slots',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
    },
    { 
      type: 'simulated', 
      label: 'Send to HR', 
      desc: 'Submit for HR approval',
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
    },
    { 
      type: 'simulated', 
      label: 'Download Report', 
      desc: 'Export hiring data',
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
    },
  ];

  const activeActions = actions.filter(a => isFieldVisible("workspace", "Quick Actions", a.label));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {activeActions.map((a, i) => (
        <button
          key={i}
          onClick={(e) => {
            if (a.type === 'raise_req' && onNavigate) {
              onNavigate('requisition/create');
            } else {
              openWorkflowModal(a.type, a, e.currentTarget);
            }
          }}
          className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#17243A] hover:bg-slate-50 dark:hover:bg-[#1e2f4c] transition-all duration-200 cursor-pointer group text-left border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${a.bgColor} ${a.iconColor} group-hover:scale-105 transition-transform duration-200`}>
            {a.icon}
          </div>
          <div>
            <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">{a.label}</div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{a.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
