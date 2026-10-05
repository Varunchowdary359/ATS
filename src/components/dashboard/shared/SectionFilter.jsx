// ══════════════════════════════════════════════════════════════════════════════
// SECTION FILTER — Advanced Analytics Date Picker (10/10)
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import { useFilter, DATA_THROUGH } from '../../../FilterContext';
import CustomDateRangePicker from './CustomDateRangePicker';
import SectionLayoutToggle from './SectionLayoutToggle';
import CustomSelect from './CustomSelect';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PRESETS = ['1M', '3M', '6M', 'YTD'];
const COMPARISONS = [
  { value: 'none', label: 'None' },
  { value: 'prev_period', label: 'Previous Period' },
  { value: 'prev_year', label: 'Previous Year' }
];

// ── Date Math Helpers ─────────────────────────────────────────────────────────

// Gets the absolute Date objects for a given filter state
const getActiveRange = (filter) => {
  if (filter.period === 'Custom') {
    const s = new Date(filter.customStart || new Date().toISOString());
    const e = new Date(filter.customEnd || new Date().toISOString());
    return { start: s, end: e };
  }

  const y = filter.endYear;
  const m = filter.endMonth; // 0-11
  const end = new Date(y, m + 1, 0); // Last day of endMonth
  let start;

  if (filter.period === '1M') {
    start = new Date(y, m, 1);
  } else if (filter.period === '3M') {
    start = new Date(y, m - 2, 1);
  } else if (filter.period === '6M') {
    start = new Date(y, m - 5, 1);
  } else if (filter.period === 'YTD') {
    start = new Date(y, 0, 1);
  } else {
    start = new Date(y, m, 1);
  }
  return { start, end };
};

const formatDate = (date) => {
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getComparisonText = (filter, range) => {
  if (filter.compare === 'none' || !filter.compare) return null;
  
  if (filter.compare === 'prev_year') {
    const s = new Date(range.start);
    s.setFullYear(s.getFullYear() - 1);
    const e = new Date(range.end);
    e.setFullYear(e.getFullYear() - 1);
    return `vs ${formatDate(s)} – ${formatDate(e)}`;
  }
  
  if (filter.compare === 'prev_period') {
    const diffTime = Math.abs(range.end - range.start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const e = new Date(range.start);
    e.setDate(e.getDate() - 1);
    const s = new Date(e);
    s.setDate(s.getDate() - diffDays);
    return `vs ${formatDate(s)} – ${formatDate(e)}`;
  }
  
  return null;
};

const getTriggerLabel = (filter) => {
  if (filter.period === 'Custom') return 'Custom Range';
  const monthName = MONTHS[filter.endMonth];
  if (filter.period === '1M') return `${monthName} ${filter.endYear}`;
  return `${filter.period} · Ending ${monthName} ${filter.endYear}`;
};

// ── Period Badge (Used by KPI cards) ──────────────────────────────────────────
export const PeriodBadge = ({ period, color = '#94a3b8' }) => (
  <span
    className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0"
    style={{ backgroundColor: color + '18', color }}
  >
    {period}
  </span>
);

// ── Main SectionFilter ────────────────────────────────────────────────────────
const SectionFilter = ({ 
  sectionKey, 
  role = 'workspace', 
  periodOptions = ['1M', '3M', '6M', 'YTD'], 
  secondaryFilters = [],
  themeColor = '#3b82f6',
  hideLayoutToggle = false
}) => {
  const { getSectionFilter, setSectionOverride, resetSectionOverride } = useFilter() || {};
  const effectiveFilter = getSectionFilter?.(role, sectionKey);

  const [open, setOpen] = useState(false);
  const [navYear, setNavYear] = useState(effectiveFilter?.endYear || DATA_THROUGH.year);
  const ref = useRef(null);
  const triggerRef = useRef(null);

  // Sync navYear when filter changes outside
  useEffect(() => {
    if (!open && effectiveFilter?.endYear) {
      setNavYear(effectiveFilter.endYear);
    }
  }, [open, effectiveFilter?.endYear]);

  // Accessibility: Handle outside click and Escape key
  useEffect(() => {
    const handleMouse = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleMouse);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouse);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!effectiveFilter) return null;

  // ── Interaction Handlers ──
  const applyFilter = (updates) => {
    if (setSectionOverride) {
      setSectionOverride(role, sectionKey, { ...effectiveFilter, ...updates });
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    if (resetSectionOverride) resetSectionOverride(role, sectionKey);
  };

  // ── Derived State ──
  const range = getActiveRange(effectiveFilter);
  const summaryText = `Showing: ${formatDate(range.start)} – ${formatDate(range.end)}`;
  const comparisonText = getComparisonText(effectiveFilter, range);
  const isOverridden = effectiveFilter.overridden;
  const triggerLabel = getTriggerLabel(effectiveFilter);
  
  // Future month validation based on global data limit
  const isFuture = (y, m) => y > DATA_THROUGH.year || (y === DATA_THROUGH.year && m > DATA_THROUGH.month);

  return (
    <div className="flex items-center gap-1.5 flex-wrap" ref={ref}>

      {/* ── Settings/Layout Toggle ────────────────────────────────────────── */}
      {!hideLayoutToggle && <SectionLayoutToggle sectionName={sectionKey} />}

      {/* ── Trigger Button ────────────────────────────────────────── */}
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            isOverridden
              ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
          }`}
          style={isOverridden ? { focusRingColor: themeColor } : {}}
        >
          {/* Overridden Indicator Dot */}
          {isOverridden && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
          )}
          {!isOverridden && (
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          )}
          
          <span>{triggerLabel}</span>
          
          {/* Reset Action */}
          {isOverridden && (
            <span 
              onClick={handleReset}
              className="ml-1 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Reset to default"
              role="button"
              tabIndex={0}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </span>
          )}
          
          {/* Chevron */}
          {!isOverridden && (
            <svg className={`w-2.5 h-2.5 transition-transform shrink-0 text-slate-400 ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          )}
        </button>

        {/* ── Popover Panel ───────────────────────────────────────── */}
        {open && (
          <div 
            className="absolute top-[calc(100%+8px)] right-0 w-[300px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-2xl z-[200] flex flex-col origin-top-right transition-all duration-200 overflow-hidden"
            style={{ animation: 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)' }}
            role="dialog"
            aria-label="Filter selection"
          >
            {/* Top Row: Presets */}
            <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-2">
              {PRESETS.map(p => {
                const isActive = effectiveFilter.period === p;
                return (
                  <button
                    key={p}
                    onClick={() => applyFilter({ period: p })}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-full cursor-pointer transition-all focus:outline-none hover:scale-105 active:scale-95 ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                    style={isActive ? { backgroundColor: themeColor || '#6366f1' } : {}}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => applyFilter({ period: 'Custom' })}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-full cursor-pointer transition-all focus:outline-none hover:scale-105 active:scale-95 ${
                  effectiveFilter.period === 'Custom'
                    ? 'text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60'
                }`}
                style={effectiveFilter.period === 'Custom' ? { backgroundColor: themeColor || '#6366f1' } : {}}
              >
                Custom
              </button>
            </div>

            {/* Custom Range View OR Month Grid View */}
            {effectiveFilter.period === 'Custom' ? (
              <CustomDateRangePicker 
                startDate={effectiveFilter.customStart}
                endDate={effectiveFilter.customEnd}
                onChange={(start, end) => {
                  applyFilter({ customStart: start, customEnd: end });
                  setOpen(false);
                }}
                onCancel={() => setOpen(false)}
                themeColor={themeColor}
              />
            ) : (
              <>
                {/* Year Navigator */}
                <div className="flex items-center justify-between px-3 py-2">
                  <button
                    onClick={() => setNavYear(y => y - 1)}
                    disabled={navYear <= 2023}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-25 cursor-pointer transition-colors focus:outline-none hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-wider">{navYear}</span>
                  <button
                    onClick={() => setNavYear(y => y + 1)}
                    disabled={navYear >= DATA_THROUGH.year}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-25 cursor-pointer transition-colors focus:outline-none hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
                  {MONTHS.map((m, i) => {
                    const future = isFuture(navYear, i);
                    const isSelected = effectiveFilter.endMonth === i && effectiveFilter.endYear === navYear;
                    return (
                      <button
                        key={m}
                        onClick={() => !future && applyFilter({ endMonth: i, endYear: navYear })}
                        disabled={future}
                        title={future ? "No data available yet" : ""}
                        className={`py-2 rounded-xl text-xs font-bold transition-all focus:outline-none hover:scale-[1.03] active:scale-[0.97] ${
                          future
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                            : isSelected
                              ? 'text-white shadow-md'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                        style={isSelected ? { backgroundColor: themeColor || '#6366f1' } : {}}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Bottom Summary Strip */}
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  {summaryText}
                </div>
                {comparisonText && (
                  <div className="text-[10px] font-semibold text-slate-500 ml-6">
                    {comparisonText}
                  </div>
                )}
              </div>
              
              {/* Compare Control */}
              <div className="flex items-center justify-between w-full mt-0.5">
                <span className="text-[11px] font-semibold text-slate-500">Compare to</span>
                <div className="w-32">
                  <CustomSelect 
                    value={effectiveFilter.compare || 'none'}
                    onChange={(val) => applyFilter({ compare: val })}
                    options={COMPARISONS}
                    size="sm"
                  />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Secondary filters (if any) ───────────────────────────── */}
      {secondaryFilters.map(({ key, label, options }) => {
        const curr = effectiveFilter.secondary?.[key] || options[0];
        return (
          <SecondaryPill
            key={key}
            label={label}
            value={curr}
            options={options}
            onChange={(v) => applyFilter({ secondary: { ...effectiveFilter.secondary, [key]: v } })}
            themeColor={themeColor}
          />
        );
      })}

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        /* Make native datepicker indicator cover the whole input to act as a trigger */
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
    </div>
  );
};

// ── Secondary dropdown pill ───────────────────────────────────────────────────
const SecondaryPill = ({ label, value, options, onChange, themeColor }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all duration-200 cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 ${
          open
            ? 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-100'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
        }`}
      >
        <span className="text-slate-400 dark:text-slate-500 font-semibold">{label}:</span>
        <span style={{ color: themeColor }}>{value}</span>
        <svg className={`w-2.5 h-2.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] z-[200] overflow-hidden"
          style={{ animation: 'scaleIn 0.12s cubic-bezier(0.16,1,0.3,1)' }}
        >
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{label}</span>
          </div>
          {/* Option rows */}
          <div className="py-1.5">
            {options.map(opt => (
              <label
                key={opt}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150"
              >
                <div className="w-4 flex justify-center shrink-0">
                  {value === opt && (
                    <span style={{ color: themeColor }} className="text-sm font-black">
                      ✓
                    </span>
                  )}
                </div>
                <span className={`text-[13px] font-medium leading-none select-none ${
                  value === opt
                    ? 'font-bold text-slate-800 dark:text-slate-100'
                    : 'text-slate-700 dark:text-slate-300'
                }`} style={value === opt ? { color: themeColor } : {}}>
                  {opt}
                </span>
                <input
                  type="radio"
                  name={`sf-pill-${label}`}
                  checked={value === opt}
                  onChange={() => { onChange(opt); setOpen(false); }}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionFilter;
