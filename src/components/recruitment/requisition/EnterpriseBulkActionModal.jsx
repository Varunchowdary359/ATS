import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, UserPlus, ToggleLeft, CheckCircle2, AlertTriangle, ShieldAlert, Loader2, ArrowRight, FileSpreadsheet, Archive } from 'lucide-react';
import CustomSelect from '../../dashboard/shared/CustomSelect';

const RECRUITERS = [
  'Sarah Jenkins',
  'Michael Scott',
  'Emily Watson',
  'David Miller',
  'Unassigned'
];

const STATUS_OPTIONS = [
  'Open',
  'Pending Approval',
  'Approved',
  'On Hold',
  'Closed'
];

const EnterpriseBulkActionModal = ({ 
  isOpen, 
  onClose, 
  selectedReqs = [], 
  onExecuteBulkAction, 
  simulatedRole = 'Hiring Manager' 
}) => {
  const [bulkActionType, setBulkActionType] = useState('assign_recruiter');
  const [targetValue, setTargetValue] = useState(RECRUITERS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  if (!isOpen) return null;

  const canBulkApprove = simulatedRole === 'Super Admin' || simulatedRole === 'Department Head / Approver' || simulatedRole === 'Finance Approver' || simulatedRole === 'Finance Controller' || simulatedRole === 'Finance';

  const handleRunBulk = () => {
    setIsProcessing(true);
    setResultSummary(null);

    setTimeout(() => {
      let successCount = 0;
      let failedCount = 0;

      if (bulkActionType === 'bulk_approve') {
        if (!canBulkApprove) {
          failedCount = selectedReqs.length;
        } else {
          selectedReqs.forEach(req => {
            if (req.status === 'Pending Approval' || req.status === 'Draft') {
              successCount++;
            } else {
              failedCount++;
            }
          });
        }
      } else {
        successCount = selectedReqs.length;
      }

      const summary = {
        total: selectedReqs.length,
        success: successCount,
        failed: failedCount,
        actionLabel: 
          bulkActionType === 'assign_recruiter' ? `Assigned recruiter to "${targetValue}"` :
          bulkActionType === 'change_status' ? `Changed status to "${targetValue}"` :
          bulkActionType === 'bulk_approve' ? 'Bulk Approved Requisitions' :
          bulkActionType === 'archive' ? 'Archived Requisitions' : 'Exported Requisitions'
      };

      onExecuteBulkAction({
        actionType: bulkActionType,
        targetValue,
        selectedReqs
      });

      setIsProcessing(false);
      setResultSummary(summary);
    }, 1200);
  };

  const handleCloseAll = () => {
    setResultSummary(null);
    setIsProcessing(false);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm" dir="ltr">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Modal Header */}
          <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  Enterprise Bulk Operations
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Selected Requisitions: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedReqs.length} Records</span>
                </p>
              </div>
            </div>
            <button 
              onClick={handleCloseAll}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          {resultSummary ? (
            /* Summary Result View */
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-center overflow-y-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Bulk Operation Completed
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {resultSummary.actionLabel}
                </p>
              </div>

              {/* Execution Summary Breakdown Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Selected</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">{resultSummary.total}</span>
                </div>
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] uppercase font-bold">Successful</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{resultSummary.success}</span>
                </div>
                <div>
                  <span className="text-rose-600 dark:text-rose-400 block text-[10px] uppercase font-bold">Failed / Skipped</span>
                  <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">{resultSummary.failed}</span>
                </div>
              </div>

              {resultSummary.failed > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 text-left flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {resultSummary.failed} requisition(s) could not be updated due to missing role approval permissions or locked status.
                  </span>
                </div>
              )}

              <button
                onClick={handleCloseAll}
                style={{ backgroundColor: 'var(--pw-brand, #3b82f6)' }}
                className="w-full py-2.5 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          ) : isProcessing ? (
            /* Loading Processing View */
            <div className="p-8 sm:p-12 text-center space-y-4 overflow-y-auto">
              <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Processing Bulk Operations...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Executing update across {selectedReqs.length} selected requisitions
                </p>
              </div>
            </div>
          ) : (
            /* Form View */
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
              {/* Select Bulk Action Type */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Action
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => { setBulkActionType('assign_recruiter'); setTargetValue(RECRUITERS[0]); }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      bulkActionType === 'assign_recruiter'
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 text-blue-500" />
                    Assign Recruiter
                  </button>

                  <button
                    type="button"
                    onClick={() => { setBulkActionType('change_status'); setTargetValue(STATUS_OPTIONS[0]); }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      bulkActionType === 'change_status'
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <ToggleLeft className="w-4 h-4 text-emerald-500" />
                    Change Status
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkActionType('bulk_approve')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      bulkActionType === 'bulk_approve'
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                    Bulk Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkActionType('export')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      bulkActionType === 'export'
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                    Export Selected
                  </button>
                </div>
              </div>

              {/* Target Parameter Picker */}
              {bulkActionType === 'assign_recruiter' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Target Recruiter
                  </label>
                  <CustomSelect
                    value={targetValue}
                    onChange={(val) => setTargetValue(val)}
                    options={RECRUITERS.map(r => ({ value: r, label: r }))}
                    size="md"
                  />
                </div>
              )}

              {bulkActionType === 'change_status' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Target Status
                  </label>
                  <CustomSelect
                    value={targetValue}
                    onChange={(val) => setTargetValue(val)}
                    options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                    size="md"
                  />
                </div>
              )}

              {bulkActionType === 'bulk_approve' && !canBulkApprove && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Your active role (<strong>{simulatedRole}</strong>) does not have approval permissions. Bulk approval will be restricted.
                  </span>
                </div>
              )}

              {/* Action Confirmation Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunBulk}
                  style={{ backgroundColor: 'var(--pw-brand, #3b82f6)' }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Execute Bulk Action</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default EnterpriseBulkActionModal;
