import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, AlertTriangle, UserCheck, RefreshCw, Layers, ShieldAlert, Check, ArrowRight
} from 'lucide-react';

const DuplicateResolutionModal = ({ isOpen, onClose, resume, onResolveDuplicate }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !resume || !resume.duplicateInfo) return null;

  const dupInfo = resume.duplicateInfo;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in" dir="ltr">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-900 dark:text-amber-100 leading-tight">Possible Duplicate Candidate Detected</h2>
              <p className="text-xs text-amber-700 dark:text-amber-300">Identity signals match existing ATS candidate profile</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5">
          {/* Match Reason Banner */}
          <div className="p-3.5 rounded-xl bg-amber-100/60 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold">Match Signal: {dupInfo.matchReasons ? dupInfo.matchReasons.join(', ') : 'Matching Candidate Profile'}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 font-mono">
              {dupInfo.matchScore || 95}% Match
            </span>
          </div>

          {/* Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* New Uploaded Candidate Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Newly Uploaded Resume</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {resume.id}
                </span>
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">{resume.candidateName}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{resume.email}</p>
                <p className="text-[11px] text-slate-500 font-mono">{resume.phone || 'No phone recorded'}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] space-y-1">
                <p><span className="text-slate-400">Source:</span> <span className="font-medium">{resume.source}</span></p>
                <p><span className="text-slate-400">Assigned REQ:</span> <span className="font-medium">{resume.requisitionId || 'Unassigned'}</span></p>
                <p><span className="text-slate-400">Uploaded:</span> <span className="font-medium">{new Date(resume.uploadedAt).toLocaleDateString()}</span></p>
              </div>
            </div>

            {/* Existing Candidate in System */}
            <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/60 pb-2">
                <span className="font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider text-[10px]">Existing System Record</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                  {dupInfo.existingCandidateId || 'CAND-101'}
                </span>
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">{dupInfo.existingCandidateName || resume.candidateName}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{dupInfo.existingEmail || resume.email}</p>
                <p className="text-[11px] text-slate-500 font-mono">{dupInfo.existingPhone || resume.phone}</p>
              </div>

              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 text-[11px] space-y-1">
                <p><span className="text-slate-400">Existing REQ:</span> <span className="font-medium">{dupInfo.existingRequisition || 'N/A'}</span></p>
                <p><span className="text-slate-400">Status:</span> <span className="font-medium text-emerald-600">Active Applicant</span></p>
              </div>
            </div>
          </div>

          {/* Action Choices */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Choose Resolution Action</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                type="button"
                onClick={() => onResolveDuplicate(resume.id, 'merge')}
                className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-left space-y-1 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                  <Layers className="w-4 h-4" />
                  <span>Merge Candidate</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Combine resume versions into existing profile timeline.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onResolveDuplicate(resume.id, 'overwrite')}
                className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-left space-y-1 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                  <RefreshCw className="w-4 h-4" />
                  <span>Update Profile</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Replace older resume file with newly parsed document.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onResolveDuplicate(resume.id, 'ignore')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-left space-y-1 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>Keep Separate</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Mark as distinct candidate and ignore duplicate alert.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel / Dismiss
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DuplicateResolutionModal;
