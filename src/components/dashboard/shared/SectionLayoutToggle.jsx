import React, { useState, useRef, useEffect, useContext } from 'react';
import { useDashboardPreferences } from '../../../DashboardPreferencesContext';
import { ThemeContext } from '../../../ThemeContext';

const SectionLayoutToggle = ({ sectionName }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const { activeRole, activeTheme } = useContext(ThemeContext);
  const { getSectionConfig, toggleField, resetSection } = useDashboardPreferences();

  const role = activeRole?.id || 'ceo';
  const themeColor = activeTheme?.color || '#3b82f6';
  const config = getSectionConfig(role, sectionName);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!config || !config.fields || Object.keys(config.fields).length === 0) {
    return null;
  }

  const fields = config.fields;
  const fieldOrder = config.fieldOrder || Object.keys(fields);
  const visibleCount = Object.values(fields).filter(v => v !== false).length;

  return (
    <div className="relative" ref={containerRef}>

      {/* ── Trigger Button ── */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center gap-2 px-3.5 py-1.5 text-[13px] font-bold rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 cursor-pointer ${
          open
            ? 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-100'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
        }`}
        aria-label="Customize Metrics"
        title="Customize Metrics"
      >
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        Customize
      </button>

      {/* ── Popup Panel — Checkbox Style ── */}
      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 w-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] z-[200] overflow-hidden"
          style={{ animation: 'sltScaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Metrics Display
            </span>
          </div>

          {/* Toggle List */}
          <div className="py-1.5 max-h-[280px] overflow-y-auto scrollbar-none">
            {fieldOrder.map((fieldName) => {
              const isChecked = fields[fieldName] !== false;
              const isDisabled = isChecked && visibleCount === 1;

              return (
                <label
                  key={fieldName}
                  className={`flex items-center justify-between px-4 py-2.5 transition-colors duration-150 ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`text-[13px] font-medium capitalize leading-none select-none ${
                    isDisabled
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    {fieldName}
                  </span>
                  {/* Toggle Switch */}
                  <span
                    className={`relative inline-flex items-center w-[32px] h-[18px] rounded-full transition-colors duration-200 flex-shrink-0 ${
                      !isChecked ? 'bg-slate-200 dark:bg-slate-700' : ''
                    }`}
                    style={isChecked ? { backgroundColor: themeColor } : {}}
                  >
                    <span className={`absolute w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      isChecked ? 'translate-x-[16px]' : 'translate-x-[2px]'
                    }`} />
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => {
                        if (!isDisabled) toggleField(role, sectionName, fieldName, !isChecked);
                      }}
                      className="sr-only"
                    />
                  </span>
                </label>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
            <button
              onClick={() => resetSection(role, sectionName)}
              className="w-full text-center text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Reset Metrics
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sltScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SectionLayoutToggle;
