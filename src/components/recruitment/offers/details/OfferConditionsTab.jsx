import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const OfferConditionsTab = ({ offer }) => {
  if (!offer) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-fade-in-up">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Pre-Employment Checklist & BGV</h3>
        <p className="text-xs text-slate-500">Compliance conditions, background checks & document submissions</p>
      </div>

      <div className="space-y-2.5">
        {(Array.isArray(offer.conditions) ? offer.conditions : []).map(c => (
          <div key={c.id} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{c.label}</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              c.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {c.status || 'Required'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
