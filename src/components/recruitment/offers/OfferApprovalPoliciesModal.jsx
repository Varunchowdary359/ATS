import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Plus, Check, Edit2, AlertCircle } from 'lucide-react';
import { offerService } from './offerService';

export const OfferApprovalPoliciesModal = ({ isOpen, onClose, brandColor = 'var(--pw-brand)' }) => {
  const [policies, setPolicies] = useState(() => offerService.getApprovalPolicies());
  const [selectedPolicy, setSelectedPolicy] = useState(policies[0] || null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200" dir="ltr">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand" />
              Offer Approval Policies & Governance Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Configure multi-tier approval routing rules, budget exception thresholds & SLA gates
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {policies.map(pol => {
              const isSelected = selectedPolicy?.id === pol.id;
              return (
                <div
                  key={pol.id}
                  onClick={() => setSelectedPolicy(pol)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {pol.executionType}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">Active</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{pol.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{pol.description}</p>
                  <div className="mt-3 text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    Rule: {pol.criteria}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Policy Breakdown */}
          {selectedPolicy && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4 mt-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedPolicy.name}</h3>
                  <p className="text-xs text-slate-500">{selectedPolicy.description}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand/10 text-brand">
                  {selectedPolicy.levels.length} Approval Tiers
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedPolicy.levels.map(lvl => (
                  <div key={lvl.level} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand font-bold flex items-center justify-center">
                        L{lvl.level}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{lvl.name}</span>
                        <div className="text-[10px] text-slate-400">Target SLA: {lvl.slaHours} Hours</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">Role: {lvl.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button 
            onClick={onClose} 
            style={{
              backgroundColor: brandColor,
              boxShadow: `0 2px 10px ${brandColor}40`
            }}
            className="px-5 py-2 text-white text-xs font-bold rounded-xl shadow-sm hover:brightness-110 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
export default OfferApprovalPoliciesModal;
