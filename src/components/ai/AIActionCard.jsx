import React from 'react';
import { CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Clock, ExternalLink } from 'lucide-react';

export default function AIActionCard({ card, onActionClick }) {
  if (!card) return null;

  const isApproved = card.badgeColor === 'emerald' || card.badge === 'Approved' || card.badge === 'Synchronized';
  const isPending = card.badgeColor === 'amber' || card.badge === 'Pending Approval';
  const isPublished = card.badgeColor === 'blue' || card.badge === 'Published';

  return (
    <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          {isApproved && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
          {isPending && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
          {isPublished && <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />}
          <span className="text-xs font-bold text-slate-900 dark:text-white">{card.title}</span>
        </div>
        {card.badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
            isPending ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' :
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
          }`}>
            {card.badge}
          </span>
        )}
      </div>

      {card.details && card.details.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          {card.details.map((d, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{d.value}</span>
            </div>
          ))}
        </div>
      )}

      {card.approvalSteps && card.approvalSteps.length > 0 && (
        <div className="mb-3">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Approval Workflow Chain:</span>
          <div className="flex flex-col gap-1">
            {card.approvalSteps.map((step, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-300">{step.role} ({step.name})</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  step.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                  step.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                  'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {card.actions && card.actions.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          {card.actions.map((act, idx) => (
            <button
              key={idx}
              onClick={() => onActionClick && onActionClick(act)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-brand hover:bg-brand-hover text-white transition-all shadow-xs cursor-pointer"
            >
              <span>{act.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
