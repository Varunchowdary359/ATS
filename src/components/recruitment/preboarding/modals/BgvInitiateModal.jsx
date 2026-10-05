/**
 * BGV Check Initiation Modal
 * PeopleWorks ATS SaaS
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Building2, AlertCircle } from 'lucide-react';
import { BGV_CHECK_TYPE, BGV_PROVIDERS } from '../preboardingTypes';

export const BgvInitiateModal = ({
  isOpen = false,
  onClose = () => {},
  candidateName = '',
  onInitiate = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [checkType, setCheckType] = useState(BGV_CHECK_TYPE.IDENTITY);
  const [providerId, setProviderId] = useState('authbridge');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await onInitiate({
        type: checkType,
        provider: providerId,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to dispatch background verification check');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Initiate BGV Verification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Candidate: {candidateName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4">
          
          {/* Check Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Check Type *
            </label>
            <select
              value={checkType}
              onChange={(e) => setCheckType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              {Object.values(BGV_CHECK_TYPE).map(t => (
                <option key={t} value={t}>{t} Verification</option>
              ))}
            </select>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Verification Provider Partner *
            </label>
            <div className="space-y-2">
              {BGV_PROVIDERS.map(p => (
                <div
                  key={p.id}
                  onClick={() => setProviderId(p.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    providerId === p.id
                      ? 'border-brand bg-brand/5 text-brand ring-1 ring-brand'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-slate-400" />
                    <span className="text-xs font-semibold">{p.name}</span>
                  </div>
                  {providerId === p.id && (
                    <span className="w-2 h-2 rounded-full bg-brand" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Instructions / Priority Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Fast-track verification for imminent joining date..."
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>

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
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: brandColor }}
          >
            {loading ? 'Initiating...' : 'Dispatch Verification'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default BgvInitiateModal;
