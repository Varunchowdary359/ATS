import React from 'react';

export const OfferCompensationTab = ({
  offer,
  brandColor = 'var(--pw-brand)',
  formatCurrency
}) => {
  if (!offer) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-fade-in-up">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Annual Compensation Matrix</h3>
          <p className="text-xs text-slate-500">Component breakdown, taxable entitlements & variable incentives</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Annual CTC</span>
          <div className="text-lg font-black" style={{ color: brandColor }}>{formatCurrency(offer.totalCtc)}</div>
        </div>
      </div>

      <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-4 py-3.5">Component Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Frequency</th>
                <th className="px-4 py-3.5 text-right">Annual Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(Array.isArray(offer.components) ? offer.components : []).map(comp => (
                <tr key={comp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{comp.name}</td>
                  <td className="px-4 py-3 text-slate-500">{comp.type}</td>
                  <td className="px-4 py-3 text-slate-500">{comp.frequency}</td>
                  <td className="px-4 py-3 font-bold text-right text-slate-900 dark:text-white font-mono">{formatCurrency(comp.amount)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50/90 dark:bg-slate-800/90 font-black text-sm">
                <td colSpan="3" className="px-4 py-4 text-slate-900 dark:text-white">Total Annual Cost to Company (CTC)</td>
                <td className="px-4 py-4 text-right font-mono" style={{ color: brandColor }}>{formatCurrency(offer.totalCtc)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
