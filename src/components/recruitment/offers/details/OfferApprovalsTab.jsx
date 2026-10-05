import React from 'react';
import { APPROVAL_STATUS } from '../offerTypes';

export const OfferApprovalsTab = ({ offer }) => {
  if (!offer) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-fade-in-up">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Multi-Level Governance Approval Chain</h3>
        <p className="text-xs text-slate-500">Automated sign-off routing by Hiring Manager, HRBP, and Finance</p>
      </div>

      <div className="space-y-3.5">
        {(Array.isArray(offer.approvals) ? offer.approvals : []).map((appr, index) => {
          const isApproved = appr.status === APPROVAL_STATUS.APPROVED;
          const isRejected = appr.status === APPROVAL_STATUS.REJECTED;
          return (
            <div key={appr.id || index} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/40 dark:bg-slate-800/20">
              <div className="flex items-start gap-3.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isApproved ? 'bg-emerald-100 text-emerald-700' : isRejected ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  L{appr.level}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{appr.approverName} ({appr.role})</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{appr.approverRoleTitle || 'Authorized Approver'}</div>
                  {appr.comments && (
                    <div className="mt-2 text-xs italic text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      "{appr.comments}"
                    </div>
                  )}
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 border ${
                isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {appr.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
