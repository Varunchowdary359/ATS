/**
 * Change Owner Modal
 * PeopleWorks ATS SaaS
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, AlertCircle } from 'lucide-react';

const RECRUITERS = [
  { id: 'USR-REC-01', name: 'Sarah Jenkins', role: 'Lead Technical Recruiter' },
  { id: 'USR-REC-02', name: 'Marcus Vance', role: 'Senior Talent Partner / HRBP' },
  { id: 'USR-REC-03', name: 'Elena Rostova', role: 'Executive Search Specialist' },
  { id: 'USR-REC-04', name: 'Alex Chen', role: 'Engineering Hiring Manager' }
];

export const ChangeOwnerModal = ({
  isOpen = false,
  onClose = () => {},
  record = null,
  onChangeOwner = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState(record?.ownerId || 'USR-REC-01');
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

  if (!isOpen || !record || typeof document === 'undefined') return null;

  const handleSubmit = async () => {
    const ownerObj = RECRUITERS.find(r => r.id === selectedOwnerId);
    if (!ownerObj) return;

    setLoading(true);
    try {
      await onChangeOwner(record.id, ownerObj.id, ownerObj.name);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reassign owner');
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
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reassign Preboarding Owner
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{record.candidateName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Select New Onboarding Owner *
          </label>
          <div className="space-y-2">
            {RECRUITERS.map(rec => (
              <div
                key={rec.id}
                onClick={() => setSelectedOwnerId(rec.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedOwnerId === rec.id
                    ? 'border-brand bg-brand/5 text-brand ring-1 ring-brand'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{rec.name}</div>
                  <div className="text-[11px] text-slate-400">{rec.role}</div>
                </div>
                {selectedOwnerId === rec.id && (
                  <span className="w-2 h-2 rounded-full bg-brand" />
                )}
              </div>
            ))}
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
            {loading ? 'Reassigning...' : 'Save Reassignment'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ChangeOwnerModal;
