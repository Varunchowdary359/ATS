import React from 'react';
import { Sparkles } from 'lucide-react';

export const OfferBenefitsTab = ({ offer }) => {
  if (!offer) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-fade-in-up">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Corporate Benefits & Wellness</h3>
        <p className="text-xs text-slate-500">Included medical insurance, allowances, wellness programs and leave policies</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {(Array.isArray(offer.benefits) ? offer.benefits : []).map(b => (
          <div key={b.id} className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand/10 text-brand shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">{b.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{b.category} • {b.employerContribution || 'Company Sponsored'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
