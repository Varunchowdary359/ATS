// ══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE COMPONENT — Config-driven reusable zero-state UI
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';

const EmptyState = ({
  icon = '✨',
  title = 'No items found',
  subtitle = 'There are no active records in this section right now.',
  ctaLabel,
  onCta,
  themeColor = '#3b82f6',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-sm ${className}`}>
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm border border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-slate-800"
        style={{ color: themeColor }}
      >
        <span>{icon}</span>
      </div>
      
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">{subtitle}</p>

      {ctaLabel && (
        <button
          onClick={onCta}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
          style={{ backgroundColor: themeColor, focusVisibleOutlineColor: themeColor }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
