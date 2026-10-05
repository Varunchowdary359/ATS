/**
 * Preboarding Workspace - Timeline & Audit Log Tab
 * PeopleWorks ATS SaaS - Enterprise Immutable Chronological Audit Trail
 */

import React from 'react';
import { 
  Clock, 
  User, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  UserCheck,
  Building2,
  Calendar
} from 'lucide-react';

export const TimelineTab = ({
  record = {},
  brandColor = 'var(--pw-brand)'
}) => {
  const events = record.timeline || [];

  const getEventIcon = (action = '') => {
    const act = action.toLowerCase();
    if (act.includes('employee') || act.includes('created') || act.includes('handoff')) {
      return <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />;
    }
    if (act.includes('verified') || act.includes('clear') || act.includes('completed') || act.includes('ready')) {
      return <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />;
    }
    if (act.includes('rejected') || act.includes('fail') || act.includes('discrepancy') || act.includes('cancel')) {
      return <AlertTriangle size={14} className="text-rose-600 dark:text-rose-400" />;
    }
    if (act.includes('document') || act.includes('upload')) {
      return <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />;
    }
    if (act.includes('bgv') || act.includes('check')) {
      return <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" />;
    }
    return <Clock size={14} className="text-slate-500" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
            style={{ backgroundColor: brandColor }}
          >
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Preboarding Event Stream & Immutable Audit Trail
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cryptographically timestamped record of document uploads, verification approvals, BGV events, and HRMS handoffs
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
          {events.length} Recorded Events
        </span>
      </div>

      {/* Stream Timeline */}
      {events.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No audit history events recorded yet.
        </div>
      ) : (
        <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
          {events.map((evt, idx) => (
            <div key={evt.id || idx} className="relative group">
              
              {/* Event Dot Icon */}
              <div className="absolute -left-7 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 group-hover:border-brand flex items-center justify-center transition-colors shadow-2xs">
                {getEventIcon(evt.action)}
              </div>

              {/* Event Content Card */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/50 space-y-1.5 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {evt.action}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Calendar size={11} />
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : '—'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {typeof evt.details === 'object' && evt.details !== null ? JSON.stringify(evt.details) : String(evt.details || '')}
                </p>

                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <User size={11} className="text-slate-400" />
                    <span>Actor: {evt.actor || 'System Automation'}</span>
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default TimelineTab;
