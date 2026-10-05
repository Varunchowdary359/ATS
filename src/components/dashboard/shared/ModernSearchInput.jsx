import React, { useContext } from 'react';
import { Search, X } from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';

/**
 * Modern Command Search Input
 * Sleek, high-end search field styled after enterprise apps (Linear, Raycast, Stripe).
 * Features an active glowing icon badge, glassmorphic surface, focus ring, shortcut pill, and quick clear button.
 */
const ModernSearchInput = ({ 
  value = '', 
  onChange, 
  placeholder = 'Search...', 
  className = '',
  shortcut = '⌘K' 
}) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';

  return (
    <div className={`group relative flex-1 max-w-md ${className}`}>
      {/* Search Icon Badge - High Contrast & Elevated Z-Index */}
      <div 
        style={{
          backgroundColor: `${brandColor}15`,
          borderColor: `${brandColor}35`,
          color: brandColor
        }}
        className="z-10 absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg border text-xs flex items-center justify-center transition-all shadow-2xs pointer-events-none group-focus-within:brightness-110"
      >
        <Search size={13} strokeWidth={2.5} className="shrink-0" />
      </div>

      {/* Input Field */}
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9.5 pr-14 bg-gradient-to-b from-white via-white to-slate-50/70 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 hover:border-[var(--pw-brand)] rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[var(--pw-brand)] focus:ring-4 focus:ring-[var(--pw-brand)]/15 shadow-2xs focus:shadow-md transition-all font-sans"
      />

      {/* Action / Shortcut Badge on Right */}
      <div className="z-10 absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
        {value ? (
          <button
            type="button"
            onClick={() => onChange && onChange('')}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        ) : (
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs select-none">
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
};

export default ModernSearchInput;
