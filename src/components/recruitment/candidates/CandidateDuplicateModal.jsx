import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const CandidateDuplicateModal = ({
  isOpen,
  onClose,
  duplicateInfo,
  onContinueAnyway,
  onViewExisting
}) => {
  if (!isOpen || !duplicateInfo) return null;

  const targetContainer = typeof document !== 'undefined' ? document.body : null;
  if (!targetContainer) return null;

  const matched = duplicateInfo.matchedCandidate;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-md font-sans text-start" dir="ltr">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-900/60 p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              Potential Duplicate Candidate Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {duplicateInfo.reason}
            </p>
          </div>
        </div>

        {/* Matched Candidate Comparison Card */}
        {matched && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">{matched.name}</span>
              <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">{matched.candidateNumber || matched.id}</span>
            </div>
            <div className="text-slate-600 dark:text-slate-300 text-[11px] space-y-0.5">
              <p>Email: {matched.email}</p>
              <p>Phone: {matched.formattedPhone || matched.phone}</p>
              <p>Role: {matched.currentTitle} • {matched.location}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Creating duplicate profiles can cause fractured interview history and inaccurate pipeline metrics. Do you wish to view the existing candidate record or proceed with creating a new candidate?
        </p>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={() => {
              onClose();
              if (matched) onViewExisting(matched);
            }}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center"
          >
            <span>View Existing</span>
            <ExternalLink size={12} />
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onContinueAnyway();
            }}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer shadow-xs text-center"
          >
            Continue Creating
          </button>
        </div>
      </div>
    </div>,
    targetContainer
  );
};

export default CandidateDuplicateModal;
