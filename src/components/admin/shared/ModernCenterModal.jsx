import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';

const ModernCenterModal = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  actions, 
  brandColor,
  width = 'max-w-lg'
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

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2.5 sm:p-4">
      {/* Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Centered Modal Card */}
      <div className={`relative w-full max-w-[calc(100vw-20px)] ${width} bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col animate-in zoom-in-95 duration-200 z-10 max-h-[90vh]`}>
        
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 bg-slate-100/80 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all duration-200 cursor-pointer shrink-0 ml-2"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto scrollbar-thin">
          {children}
        </div>

        {/* Footer Actions */}
        {actions && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-2xl">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ModernCenterModal;
