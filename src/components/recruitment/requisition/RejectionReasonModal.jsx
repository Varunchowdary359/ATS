import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CornerDownRight, MessageSquareWarning } from 'lucide-react';

const RejectionReasonModal = ({ 
  isOpen, 
  onClose, 
  onConfirmReject, 
  requisition, 
  stageInfo 
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A valid rejection reason is required before rejecting a requisition.');
      return;
    }
    setError('');
    onConfirmReject(reason.trim());
    setReason('');
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm" dir="ltr">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Modal Header */}
          <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shrink-0">
                <MessageSquareWarning className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  Reject Requisition Sign-off
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Requisition ID: <span className="font-mono font-semibold">{requisition?.id}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold flex-wrap gap-1">
                <span>Target Role: {requisition?.jobTitle}</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">Stage: {stageInfo?.role || 'Approval'}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Department: {requisition?.department} | Manager: {requisition?.hiringManager}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Rejection Reason / Governance Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                rows={4}
                placeholder="Provide detailed business justification for rejecting this requisition (e.g. Headcount cap exceeded, salary range policy breach, hiring freeze)..."
                className={`w-full p-3 rounded-xl border text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none transition-all resize-none ${
                  error 
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                    : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
              {error && (
                <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CornerDownRight className="w-4 h-4" />
                Confirm Rejection
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default RejectionReasonModal;
