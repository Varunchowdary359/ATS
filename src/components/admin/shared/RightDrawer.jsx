import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const RightDrawer = ({ isOpen, onClose, title, subtitle, children, actions, size = 'md', width }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl'
  };
  const drawerWidth = width ? width : (sizeClasses[size] || sizeClasses.md);
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
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className={`relative w-full ${drawerWidth} bg-white dark:bg-[#0B1120] border-l border-slate-200 dark:border-slate-800 shadow-xl h-full flex flex-col animate-in slide-in-from-right duration-200`}>
        
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] sticky top-0 z-10">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-900/20">
          {children}
        </div>

        {/* Footer Actions */}
        {actions && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 sticky bottom-0 z-10 mt-auto">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default RightDrawer;
