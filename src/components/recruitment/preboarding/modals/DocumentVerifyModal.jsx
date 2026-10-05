/**
 * Document Verification & Review Modal
 * PeopleWorks ATS SaaS
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, XCircle, RefreshCw, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export const DocumentVerifyModal = ({
  isOpen = false,
  onClose = () => {},
  documentItem = null,
  onAction = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [selectedAction, setSelectedAction] = useState('VERIFY'); // 'VERIFY' | 'REJECT' | 'REQUEST_REUPLOAD' | 'WAIVE'
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !documentItem || typeof document === 'undefined') return null;

  const handleSubmit = async () => {
    if ((selectedAction === 'REJECT' || selectedAction === 'REQUEST_REUPLOAD') && !reason.trim()) {
      setError('Please provide a mandatory reason explaining why the document is rejected or requires re-upload.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onAction(documentItem.id, selectedAction, { reason: reason.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Compliance Document Review
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{documentItem.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Document Metadata Card */}
        <div className="my-4 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {documentItem.fileName || 'Document File'}
              </div>
              <div className="text-[11px] text-slate-500">
                Size: {documentItem.fileSize || '1.2 MB'} • Version {documentItem.version || 1}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {documentItem.category}
          </span>
        </div>

        {/* Action Selection Radio Cards */}
        <div className="space-y-2 mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select Review Decision
          </label>

          <div className="grid grid-cols-2 gap-2">
            {/* Verify */}
            <div
              onClick={() => setSelectedAction('VERIFY')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                selectedAction === 'VERIFY'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold">Approve & Verify</div>
                <div className="text-[10px] text-slate-500">Mark verified</div>
              </div>
            </div>

            {/* Reject */}
            <div
              onClick={() => setSelectedAction('REJECT')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                selectedAction === 'REJECT'
                  ? 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300 ring-1 ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <XCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold">Reject Document</div>
                <div className="text-[10px] text-slate-500">Invalid / unreadable</div>
              </div>
            </div>

            {/* Request Re-upload */}
            <div
              onClick={() => setSelectedAction('REQUEST_REUPLOAD')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                selectedAction === 'REQUEST_REUPLOAD'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <RefreshCw size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold">Request Re-upload</div>
                <div className="text-[10px] text-slate-500">Needs clearer copy</div>
              </div>
            </div>

            {/* Waive */}
            <div
              onClick={() => setSelectedAction('WAIVE')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                selectedAction === 'WAIVE'
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold">Waive Requirement</div>
                <div className="text-[10px] text-slate-500">HR policy exception</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection / Notes Textarea (Mandatory for Reject / Re-upload) */}
        {(selectedAction === 'REJECT' || selectedAction === 'REQUEST_REUPLOAD' || selectedAction === 'WAIVE') && (
          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {selectedAction === 'REJECT' ? 'Mandatory Rejection Reason *' : 'Reason / Exception Notes *'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(null); }}
              rows={3}
              placeholder={selectedAction === 'REJECT' ? 'e.g. Document image is blurry or expired date on ID.' : 'Notes for candidate and audit trail...'}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40 mb-3">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: brandColor }}
          >
            {submitting ? 'Applying Decision...' : 'Confirm Decision'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default DocumentVerifyModal;
