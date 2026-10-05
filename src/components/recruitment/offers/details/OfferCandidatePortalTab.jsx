import React from 'react';

export const OfferCandidatePortalTab = ({ offer }) => {
  if (!offer) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-fade-in-up">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Candidate Portal Telemetry</h3>
        <p className="text-xs text-slate-500">Candidate email open rates, portal visits, and action events</p>
      </div>

      <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 text-xs">
        <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
          <span className="text-slate-400">Offer Notification Dispatched:</span>
          <strong className="text-slate-800 dark:text-slate-200">{offer.sentDate ? new Date(offer.sentDate).toLocaleString() : 'Not Sent Yet'}</strong>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-400">First Candidate Portal View:</span>
          <strong className="text-slate-800 dark:text-slate-200">{offer.viewedDate ? new Date(offer.viewedDate).toLocaleString() : 'Pending Candidate Open'}</strong>
        </div>
      </div>
    </div>
  );
};
