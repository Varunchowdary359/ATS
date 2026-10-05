import React from 'react';

export const OfferAuditTab = ({ auditHistory = [] }) => {
  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-fade-in-up">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Immutable Security Audit Trail</h3>
        <p className="text-xs text-slate-500">Cryptographically stamped chronological change log</p>
      </div>

      <div className="space-y-2.5">
        {(auditHistory || []).map(log => (
          <div key={log.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-start justify-between text-xs gap-3">
            <div>
              <strong className="text-slate-900 dark:text-white">{log.action}</strong>
              <p className="text-[11px] text-slate-500 mt-0.5">By: {log.actor}</p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
