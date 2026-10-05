import React, { useState } from 'react';
import { 
  Search, LayoutGrid, Table, Plus, ChevronRight, Clock, 
  CheckCircle2, ShieldCheck, X, Filter, BarChart2
} from 'lucide-react';
import MetricsDrillDownModal from './MetricsDrillDownModal';
import CustomSelect from '../../dashboard/shared/CustomSelect';

/**
 * 1. Mid-Level Balanced Header with Customizable Corporate Icon
 */
export const ModernPageHeader = ({
  title,
  subtitle,
  icon,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterOptions = [],
  activeFilter = 'All',
  onFilterChange,
  viewMode = 'grid', // 'grid' | 'table'
  onViewModeChange,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled = false,
  secondaryActionLabel,
  onSecondaryAction,
  themeColor = '#2563eb',
}) => {
  const HeaderIcon = icon || <ShieldCheck className="w-5 h-5" />;

  const hasControls = onSearchChange || (filterOptions.length > 0 && onFilterChange) || onViewModeChange;

  return (
    <>
      {/* Primary Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div 
              className="p-2.5 rounded-xl shrink-0 flex items-center justify-center border"
              style={{ 
                backgroundColor: `${themeColor}15`, 
                color: themeColor,
                borderColor: `${themeColor}30`
              }}
            >
              {React.isValidElement(HeaderIcon) 
                ? React.cloneElement(HeaderIcon, { 
                    className: 'w-5 h-5', 
                    style: { color: themeColor } 
                  }) 
                : HeaderIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Operational
                </span>
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-relaxed max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {secondaryActionLabel && onSecondaryAction && (
              <button
                onClick={onSecondaryAction}
                className="flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-2xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0"
              >
                <span>{secondaryActionLabel}</span>
              </button>
            )}
            {primaryActionLabel && onPrimaryAction && (
              <button
                onClick={onPrimaryAction}
                disabled={primaryActionDisabled}
                className="flex items-center gap-1.5 h-8.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer shrink-0 hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryActionDisabled ? '#94a3b8' : themeColor }}
              >
                <Plus className="w-4 h-4" />
                <span>{primaryActionLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Toolbar: Search, Filters & View Toggle */}
      {hasControls && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-1">
            {/* Search Input */}
            {onSearchChange && (
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 pl-8 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Filter Dropdown */}
            {filterOptions.length > 0 && onFilterChange && (
              <div className="w-36">
                <CustomSelect
                  value={activeFilter}
                  onChange={(val) => onFilterChange(val)}
                  options={filterOptions.map((opt) => ({label: opt, value: opt}))}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* View Mode Switcher */}
          {onViewModeChange && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => onViewModeChange('grid')}
                title="Card Grid View"
                style={viewMode === 'grid' ? { backgroundColor: themeColor, color: '#fff' } : {}}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards View</span>
              </button>
              <button
                onClick={() => onViewModeChange('table')}
                title="Compact Table View"
                style={viewMode === 'table' ? { backgroundColor: themeColor, color: '#fff' } : {}}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

/**
 * 2. Mid-Level Balanced KPI Strip (Soft Colored Accent Icon Boxes)
 */
export const ModernMetricsStrip = ({ stats = [] }) => {
  const [selectedStat, setSelectedStat] = useState(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        {stats.map((stat, idx) => {
          const accentColors = [
            { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/70 dark:border-blue-800/70' },
            { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/70 dark:border-emerald-800/70' },
            { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200/70 dark:border-purple-800/70' },
            { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/70 dark:border-amber-800/70' },
          ][idx % 4];

          return (
            <button
              key={idx}
              onClick={() => setSelectedStat(stat)}
              className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group text-left cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {stat.label}
                </span>
                {stat.icon && (
                  <div className={`p-2 rounded-xl border ${accentColors.bg} ${accentColors.text} ${accentColors.border} shadow-2xs group-hover:scale-105 transition-transform`}>
                    {stat.icon}
                  </div>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2.5">
                {stat.value}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] w-full">
                {stat.sub && (
                  <span className="text-slate-400 font-medium">{stat.sub}</span>
                )}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-slate-400">
                  <BarChart2 size={12} />
                  <span className="font-bold">View Data</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <MetricsDrillDownModal 
        isOpen={!!selectedStat} 
        onClose={() => setSelectedStat(null)} 
        statContext={selectedStat} 
      />
    </>
  );
};

/**
 * 3. Card Grid Container
 */
export const ModernCardGrid = ({ children, totalCount = 0, filteredCount = 0, resourceName = 'items' }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs px-0.5">
        <span className="text-slate-500 dark:text-slate-400 font-semibold">
          Showing <strong className="text-slate-900 dark:text-white font-mono font-black">{filteredCount}</strong> of <strong className="text-slate-900 dark:text-white font-mono font-black">{totalCount}</strong> {resourceName}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
};

/**
 * 4. Mid-Level Status Badge
 */
export const ModernStatusBadge = ({ status }) => {
  // ATS & JD Lifecycle statuses
  const statusMap = {
    'Open':              { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800', dot: 'bg-emerald-500 animate-pulse' },
    'Draft':             { badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', dot: 'bg-slate-400' },
    'Pending Review':    { badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800', dot: 'bg-amber-500 animate-pulse' },
    'Pending Approval':  { badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800', dot: 'bg-amber-500 animate-pulse' },
    'Changes Requested': { badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-800', dot: 'bg-orange-500' },
    'Approved':                  { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800', dot: 'bg-emerald-500' },
    'Recommended for Offer':     { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800', dot: 'bg-emerald-500' },
    'HM Recommended':            { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800', dot: 'bg-emerald-500' },
    'Ready for Offer':           { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800', dot: 'bg-emerald-500' },
    'Published':                 { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800', dot: 'bg-indigo-500' },
    'Rejected':          { badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800', dot: 'bg-rose-500' },
    'Archived':          { badge: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700', dot: 'bg-slate-400' },
  };

  if (statusMap[status]) {
    const { badge, dot } = statusMap[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap shrink-0 ${badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
        <span>{status}</span>
      </span>
    );
  }

  // Fallback for other Admin statuses
  const isGood = ['Active', 'Paid', 'Healthy', 'Full Rollout', 'Enabled', 'Global', 'Enforced'].includes(status);
  const isWarn = ['Trial', 'Targeted', 'Percentage (50%)', 'WARN', 'Pending'].includes(status);
  const isDanger = ['Inactive', 'Suspended', 'Past Due', 'ERROR', 'Locked'].includes(status);

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
  let dotStyle = 'bg-slate-400';

  if (isGood) {
    badgeStyle = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    dotStyle = 'bg-emerald-500 animate-pulse';
  } else if (isWarn) {
    badgeStyle = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    dotStyle = 'bg-amber-500';
  } else if (isDanger) {
    badgeStyle = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    dotStyle = 'bg-rose-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap shrink-0 ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />
      <span>{status}</span>
    </span>
  );
};


/**
 * 5. Visual Sequence Stepper Node
 */
export const ModernVisualChainBuilder = ({ steps = [], chainSummary = '', slaHours = 48, themeColor = '#2563eb' }) => {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Approval Nodes ({steps ? steps.length : 0})</span>
        <span className="flex items-center gap-1 font-mono text-slate-500">
          <Clock className="w-3 h-3 text-blue-500" /> SLA: {slaHours}h
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {steps && steps.length > 0 ? (
          steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 text-xs font-bold shadow-2xs">
                <span
                  className="w-3.5 h-3.5 rounded-full font-black text-[9px] flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: themeColor }}
                >
                  {step.stepNumber}
                </span>
                <span className="text-slate-800 dark:text-slate-200">{step.roleName}</span>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </React.Fragment>
          ))
        ) : (
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            {chainSummary || 'Direct Manager ➔ HR Admin'}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 6. Modern Empty State for Grids and Tables
 */
export const ModernEmptyState = ({ title = 'No records found', subtitle = 'Try adjusting your search or filters.', icon }) => {
  const IconComponent = icon || Filter;
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-slate-200 border-dashed rounded-2xl bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 m-2">
      <div className="w-12 h-12 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        <IconComponent className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">{subtitle}</p>
    </div>
  );
};

// ── Drawer Form Layout Standard Components ─────────────────────────────────

export const DrawerSection = ({ title, description, children }) => (
  <div className="flex flex-col gap-3 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800 last:border-0 last:pb-0 last:mb-0">
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
    </div>
    <div className="flex flex-col gap-4">
      {children}
    </div>
  </div>
);

export const DrawerField = ({ label, children, required }) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

export const CompactRadioCard = ({ options, value, onChange, name }) => (
  <div className="flex items-center gap-2 flex-wrap">
    {options.map(opt => {
      const isSelected = value === opt.value;
      return (
        <label 
          key={opt.value}
          className={`flex-1 min-w-[120px] flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none ${
            isSelected
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400 shadow-2xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <input 
            type="radio" 
            name={name}
            value={opt.value}
            checked={isSelected}
            onChange={() => onChange(opt.value)}
            className="hidden"
          />
          {opt.label}
        </label>
      );
    })}
  </div>
);
