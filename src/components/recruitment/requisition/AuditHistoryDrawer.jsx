import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Clock, User, ArrowRight, Filter, Search, ShieldCheck, Tag } from 'lucide-react';

const formatFullTimestamp = (isoString) => {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
};

const AuditHistoryDrawer = ({ 
  isOpen, 
  onClose, 
  requisition 
}) => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('All');

  if (!isOpen) return null;

  // Build standard audit logs from history or generate structured logs
  const rawHistory = Array.isArray(requisition?.history) && requisition.history.length > 0
    ? requisition.history
    : [
        { action: 'Requisition Created', by: requisition?.hiringManager || 'System', date: '2026-08-01T09:00:00Z', prevValue: 'None', newValue: 'Draft' },
        { action: 'Status Changed', by: requisition?.hiringManager || 'System', date: '2026-08-02T14:30:00Z', prevValue: 'Draft', newValue: requisition?.status || 'Pending Approval' }
      ];

  const formattedLogs = rawHistory.map((item, idx) => {
    return {
      id: idx,
      user: item.by || item.user || 'System User',
      action: item.action || 'Field Update',
      prevValue: item.prevValue || item.previousValue || 'N/A',
      newValue: item.newValue || item.nextValue || 'Updated',
      date: item.date || item.timestamp || '2026-08-01T10:00:00Z',
      field: item.field || (item.action.includes('Salary') ? 'Salary Range' : item.action.includes('Status') ? 'Status' : 'Requisition State')
    };
  });

  const filteredLogs = formattedLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
                          log.action.toLowerCase().includes(search.toLowerCase()) ||
                          log.prevValue.toLowerCase().includes(search.toLowerCase()) ||
                          log.newValue.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterAction === 'All' || log.action.toLowerCase().includes(filterAction.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end" dir="ltr">
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col"
        >
          {/* Drawer Header */}
          <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  Audit History Log
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Requisition: <span className="font-mono font-semibold">{requisition?.id}</span> — {requisition?.jobTitle}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 sm:space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search audit actions, users, values..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
              {['All', 'Created', 'Status', 'Approval', 'Salary'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterAction(f)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                    filterAction === f 
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline List */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No matching audit history records found.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="relative group">
                    {/* Circle Node */}
                    <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-purple-600 dark:bg-purple-400 group-hover:scale-125 transition-transform" />

                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3.5 space-y-2 shadow-2xs">
                      {/* Action Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          {log.action}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatFullTimestamp(log.date)}
                        </span>
                      </div>

                      {/* User Badge */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Performed by: <strong>{log.user}</strong></span>
                      </div>

                      {/* Value Delta Comparison */}
                      {(log.prevValue !== 'N/A' || log.newValue !== 'Updated') && (
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 text-xs flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Previous Value</span>
                            <span className="font-mono text-slate-600 dark:text-slate-400 truncate block">{log.prevValue}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0 text-right">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">New Value</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate block">{log.newValue}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default AuditHistoryDrawer;
