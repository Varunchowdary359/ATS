import React from 'react';

export const OfferNegotiationTab = ({ offer }) => {
  if (!offer) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-fade-in-up">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Negotiation & Counter Proposals</h3>
        <p className="text-xs text-slate-500">Applicant compensation adjustment requests and resolution history</p>
      </div>

      {Array.isArray(offer.negotiations) && offer.negotiations.length > 0 ? (
        offer.negotiations.map(neg => (
          <div key={neg.id} className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/15 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 dark:text-amber-300">{neg.requestedBy}</span>
              <span className="text-[11px] text-slate-400">{new Date(neg.requestedAt).toLocaleString()}</span>
            </div>
            <div className="text-slate-700 dark:text-slate-300 space-y-1">
              <p><strong>Field:</strong> {neg.field}</p>
              <p><strong>Current:</strong> {neg.currentValue}</p>
              <p className="text-amber-700 dark:text-amber-300 font-bold"><strong>Requested:</strong> {neg.requestedValue}</p>
              <p className="italic text-slate-500">"{neg.reason}"</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-16 text-slate-400 text-xs">
          No active negotiation or counter requests on record for this candidate.
        </div>
      )}
    </div>
  );
};
