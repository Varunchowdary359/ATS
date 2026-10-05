import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, ChevronRight, BarChart3 } from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { CJSLine, CJSBar, CJSDoughnut } from './Charts';

/**
 * Universal KPI Trend & Performance Analytics Graph Modal Component
 * Used across all Hubs (Requisitions, Resumes, JDs, Postings, Users, Companies)
 */
const KpiAnalyticsGraphModal = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle = 'Visual analytics, stage velocities, and matching records.',
  kpiLabel,
  chartType = 'bar', // 'bar' | 'line' | 'doughnut'
  chartData, 
  records = [],
  renderRecord,
  onRecordClick
}) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || 'var(--pw-brand)';

  const targetContainer = typeof document !== 'undefined' ? document.body : null;
  if (!isOpen || !targetContainer) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" dir="ltr">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-4xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col font-sans text-start"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-2.5 rounded-xl text-white font-bold shadow-2xs shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {kpiLabel || title} - Trend & Performance Graph
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Graph Visual Area */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 h-64 flex items-center justify-center shadow-2xs relative">
            {chartData && chartType === 'line' && (
              <CJSLine 
                labels={chartData.labels}
                datasets={chartData.datasets}
                height={220}
              />
            )}

            {chartData && chartType === 'bar' && (
              <CJSBar 
                labels={chartData.labels}
                datasets={chartData.datasets}
                height={220}
              />
            )}

            {chartData && chartType === 'doughnut' && (
              <CJSDoughnut 
                labels={chartData.labels}
                data={chartData.data}
                colors={chartData.colors}
                height={220}
              />
            )}

            {!chartData && (
              <div className="text-center text-xs text-slate-400 font-medium">
                No visualization data available for this metric.
              </div>
            )}
          </div>

          {/* Filtered Data Records Section Below Graph */}
          <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[160px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Matching Data Records ({records.length})
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Click any record to inspect details</span>
            </div>

            {records.map((item, idx) => {
              if (renderRecord) return renderRecord(item, idx);

              return (
                <div 
                  key={item.id || idx}
                  onClick={() => {
                    if (onRecordClick) onRecordClick(item);
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-brand transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      {item.title || item.candidateName || item.jobTitle || item.name || `Record #${idx + 1}`}
                      {item.status && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.status}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.id || item.fileName || item.email || 'Ref ID'} {item.department ? `• ${item.department}` : ''} {item.uploadedAt ? `• Uploaded ${new Date(item.uploadedAt).toLocaleDateString()}` : ''}
                    </div>
                  </div>

                  <button 
                    type="button"
                    className="text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    style={{ color: brandColor }}
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}

            {records.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No matching records found for this KPI filter.
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              Close Graph Window
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>,
    targetContainer
  );
};

export default KpiAnalyticsGraphModal;
