import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Delete Record', 
  message = 'Are you sure you want to proceed with this action? This action cannot be undone.', 
  confirmText = 'Delete Record',
  confirmVariant = 'danger',
  brandColor,
  isLoading = false
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === 'danger';

  // Format message text: highlight ID badges cleanly inline with whitespace-nowrap
  const renderMessageContent = () => {
    const idMatch = message.match(/[A-Z]+-\d{4}-\d+/i) || message.match(/REQ-[\w-]+/i) || message.match(/JD-[\w-]+/i);
    if (!idMatch) return message;

    const targetId = idMatch[0];
    const parts = message.split(targetId);

    return (
      <span className="leading-relaxed">
        {parts[0]}
        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 whitespace-nowrap inline-flex items-center mx-1 shadow-xs align-baseline">
          {targetId}
        </span>
        {parts[1]}
      </span>
    );
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop Overlay with Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
            onClick={onClose}
          />

          {/* Centered Modern Floating Card */}
          <motion.div 
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md max-w-[calc(100vw-24px)] bg-white dark:bg-[#0f121d] border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] rounded-3xl p-4 sm:p-6 z-10 font-sans space-y-4 sm:space-y-5"
          >
            {/* Header with Icon & Close Button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isDanger 
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60 shadow-xs' 
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60 shadow-xs'
                }`}>
                  {isDanger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
                </div>

                <div className="pt-0.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {title}
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {renderMessageContent()}
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={onClose}
                title="Close"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/60 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200/80 dark:border-rose-800/60 transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                Cancel
              </button>

              <button 
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95 ${
                  isDanger 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25' 
                    : 'hover:brightness-110'
                }`}
                style={!isDanger && brandColor ? { backgroundColor: brandColor } : {}}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>{confirmText}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmModal;
