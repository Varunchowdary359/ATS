/**
 * Enterprise Preboarding "Attention Required" Action Center
 * PeopleWorks ATS SaaS - 100% Visual Uniformity
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  FileWarning, 
  ShieldAlert, 
  Clock, 
  CalendarX, 
  ChevronRight, 
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const PreboardingAttentionSection = ({
  items = [],
  onActionClick = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              All Preboarding Operations On Track
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              No document rejections, BGV discrepancies, or overdue tasks across active candidates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getItemIcon = (type) => {
    switch (type) {
      case 'HANDOFF_FAILED':
        return <RefreshCw size={14} className="text-rose-600 dark:text-rose-400" />;
      case 'DOCUMENT_REJECTED':
        return <FileWarning size={14} className="text-rose-600 dark:text-rose-400" />;
      case 'BGV_DISCREPANCY':
        return <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400" />;
      case 'TASK_OVERDUE':
        return <Clock size={14} className="text-amber-600 dark:text-amber-400" />;
      case 'JOINING_APPROACHING':
        return <CalendarX size={14} className="text-purple-600 dark:text-purple-400" />;
      default:
        return <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />;
    }
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'CRITICAL') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          Critical
        </span>
      );
    }
    if (severity === 'HIGH') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          High Priority
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
        Attention
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/40 via-white/80 to-amber-50/20 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-amber-950/20 backdrop-blur-xl border border-amber-200/70 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Attention Required</span>
              <span className="px-2 py-0.2 bg-amber-500 text-white text-[10px] font-extrabold rounded-full">
                {items.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Immediate operational bottlenecks impacting joining readiness and employee conversion
            </p>
          </div>
        </div>

        <button className="p-1 rounded-lg hover:bg-amber-100/50 dark:hover:bg-slate-800 text-slate-400">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Action Items List */}
      {isExpanded && (
        <div className="space-y-2 pt-1">
          {items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-amber-100/80 dark:border-slate-700/60 hover:border-amber-300 dark:hover:border-slate-600 transition-colors shadow-2xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  {getItemIcon(item.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.candidateName}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                      {item.jobTitle}
                    </span>
                    {getSeverityBadge(item.severity)}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end shrink-0 pt-1.5 sm:pt-0">
                <button
                  onClick={() => onActionClick(item)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg text-white shadow-xs transition-transform active:scale-95"
                  style={{ backgroundColor: brandColor }}
                >
                  <span>{item.actionText}</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreboardingAttentionSection;
