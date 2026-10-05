import React from 'react';

export const OfferEmploymentTab = ({ offer }) => {
  if (!offer) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-fade-in-up">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Corporate Employment Terms</h3>
        <p className="text-xs text-slate-500">Legal entity, location, work arrangement, and contractual SLAs</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 text-xs">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-slate-400 text-[10px] font-bold uppercase">Employment Type</span>
          <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">{offer.employmentType || 'Full-Time'}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-slate-400 text-[10px] font-bold uppercase">Work Arrangement</span>
          <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">{offer.workArrangement || 'Hybrid'}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-slate-400 text-[10px] font-bold uppercase">Work Location</span>
          <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">{offer.workLocation || 'Bengaluru, India'}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-slate-400 text-[10px] font-bold uppercase">Reporting Manager</span>
          <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">{offer.reportingManager || offer.hiringManagerName || 'Alex Chen'}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-slate-400 text-[10px] font-bold uppercase">Probation Period</span>
          <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">{offer.probationPeriod || '3 Months'}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-slate-400 text-[10px] font-bold uppercase">Notice Period</span>
          <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">{offer.noticePeriod || '60 Days'}</p>
        </div>
      </div>
    </div>
  );
};
