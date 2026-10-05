import React from 'react';
import { Search, Plus, Eye, Edit3, Trash2, Filter } from 'lucide-react';
import CustomSelect from '../../dashboard/shared/CustomSelect';

/**
 * AdminPageHeader - Standardized Header for ALL Admin & Platform pages
 */
export const AdminPageHeader = ({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterOptions = [],
  activeFilter,
  onFilterChange,
  primaryActionLabel,
  onPrimaryAction,
  themeColor = '#3b82f6',
  children,
}) => (
  <div className="bento-card-premium p-6 mb-6">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onSearchChange && (
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        )}

        {filterOptions.length > 0 && (
          <div className="relative">
            <CustomSelect
              value={activeFilter || filterOptions[0]}
              onChange={(val) => onFilterChange && onFilterChange(val)}
              options={filterOptions.map((opt) => ({
                label: typeof opt === 'string' ? opt : opt.label,
                value: typeof opt === 'string' ? opt : opt.value
              }))}
            />
          </div>
        )}

        {children}

        {primaryActionLabel && onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            <Plus className="w-4 h-4" />
            <span>{primaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  </div>
);

/**
 * AdminStatsStrip - Standardized 4-tile metric summary bar
 */
export const AdminStatsStrip = ({ stats = [] }) => {
  if (!stats || stats.length === 0) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((st, i) => (
        <div
          key={i}
          className="bento-card-premium p-4.5 flex items-center gap-4 group hover:scale-[1.01] transition-transform"
        >
          {st.icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: (st.color || '#3b82f6') + '15', color: st.color || '#3b82f6' }}
            >
              {st.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
              {st.label}
            </div>
            <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {st.value}
            </div>
            {st.sub && (
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {st.sub}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * AdminStatusBadge - Standardized status pill across all admin modules
 */
export const AdminStatusBadge = ({ status }) => {
  const norm = (status || '').toString().toLowerCase();

  let bg = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  let dot = 'bg-slate-400';

  if (norm.includes('active') || norm.includes('enabled') || norm.includes('approved') || norm.includes('healthy') || norm.includes('success') || norm.includes('passed')) {
    bg = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40';
    dot = 'bg-emerald-500';
  } else if (norm.includes('pending') || norm.includes('warning') || norm.includes('review') || norm.includes('draft') || norm.includes('trial')) {
    bg = 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40';
    dot = 'bg-amber-500 animate-pulse';
  } else if (norm.includes('inactive') || norm.includes('disabled') || norm.includes('suspended') || norm.includes('error') || norm.includes('failed') || norm.includes('critical') || norm.includes('revoked')) {
    bg = 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40';
    dot = 'bg-rose-500';
  } else if (norm.includes('enterprise') || norm.includes('pro')) {
    bg = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40';
    dot = 'bg-indigo-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
};

/**
 * AdminTableWrapper - Standardized table container with footer summary count
 */
export const AdminTableWrapper = ({ children, totalCount = 0, filteredCount = 0, resourceName = 'items' }) => (
  <div className="bento-card-premium overflow-hidden">
    <div className="w-full overflow-x-auto custom-scrollbar">
      {children}
    </div>
    <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
      <span>
        Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredCount}</span> of{' '}
        <span className="font-bold text-slate-800 dark:text-slate-200">{totalCount}</span> {resourceName}
      </span>
      <span className="text-[11px] text-slate-400">Enterprise Administration Module</span>
    </div>
  </div>
);

/**
 * AdminActionButtons - Standardized View, Edit, Delete buttons for table rows
 */
export const AdminActionButtons = ({ onInspect, onEdit, onDelete, inspectLabel = 'Inspect details', editLabel = 'Edit record', deleteLabel = 'Delete record' }) => (
  <div className="flex items-center justify-end gap-1.5">
    {onInspect && (
      <button
        onClick={onInspect}
        title={inspectLabel}
        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
      >
        <Eye className="w-4 h-4" />
      </button>
    )}
    {onEdit && (
      <button
        onClick={onEdit}
        title={editLabel}
        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
      >
        <Edit3 className="w-4 h-4" />
      </button>
    )}
    {onDelete && (
      <button
        onClick={onDelete}
        title={deleteLabel}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    )}
  </div>
);
