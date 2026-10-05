import React, { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ArrowRight, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { 
  PIPELINE_STAGES, 
  EXCEPTION_STATUS, 
  APPLICATION_STAGE, 
  REJECTION_REASONS,
  validateStageTransition,
  normalizeCanonicalStage,
  ATS_ROLES,
  PERMISSIONS,
  hasPermission
} from './candidateTypes';
import CustomSelect from '../../dashboard/shared/CustomSelect';

const getNextSequentialStage = (cur) => {
  const stageFlow = [
    APPLICATION_STAGE.APPLIED,
    APPLICATION_STAGE.SCREENING,
    APPLICATION_STAGE.SHORTLISTED,
    APPLICATION_STAGE.INTERVIEW,
    APPLICATION_STAGE.OFFER,
    APPLICATION_STAGE.HIRED
  ];
  const idx = stageFlow.indexOf(cur);
  return idx >= 0 && idx < stageFlow.length - 1 ? stageFlow[idx + 1] : cur;
};

const StageTransitionModal = ({
  isOpen,
  onClose,
  candidate,
  application,
  onConfirmTransition,
  userRole = ATS_ROLES.ATS_ADMIN
}) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || 'var(--pw-brand)';

  const currentStage = normalizeCanonicalStage(application?.stage || APPLICATION_STAGE.SCREENING);
  const [targetStage, setTargetStage] = useState(() => getNextSequentialStage(currentStage));
  const [reason, setReason] = useState('');
  const [isOverrideAuthorized, setIsOverrideAuthorized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !candidate || !application) return null;

  const validation = validateStageTransition(currentStage, targetStage);

  const isException = Object.values(EXCEPTION_STATUS).includes(targetStage);
  const isSkip = !validation.valid && validation.requiresOverride;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (currentStage === targetStage) {
      setErrorMsg('Target stage must be different from current stage.');
      return;
    }

    if (isSkip && !isOverrideAuthorized) {
      setErrorMsg('You must explicitly authorize the managerial override to proceed.');
      return;
    }

    if ((isSkip || isException) && !reason.trim()) {
      setErrorMsg(`A business justification note is mandatory when ${isException ? 'marking as ' + targetStage : 'skipping stages'}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmTransition({
        applicationId: application.id,
        targetStage,
        reason,
        isOverride: isSkip
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update stage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetContainer = typeof document !== 'undefined' ? document.body : null;
  if (!targetContainer) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in" dir="ltr">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden font-sans text-start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Advance Application Stage
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {candidate.name} • {application.jobTitle} ({application.requisitionId})
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Current vs Next Stage Indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Stage</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentStage}</span>
            </div>
            <ArrowRight size={16} className="text-slate-400" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Stage</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{targetStage}</span>
            </div>
          </div>

          {/* Target Stage Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Target Stage
            </label>
            <CustomSelect
              value={targetStage}
              onChange={(val) => setTargetStage(val)}
              options={[
                ...PIPELINE_STAGES.map(s => ({ value: s.id, label: s.label })),
                ...Object.values(EXCEPTION_STATUS).map(s => ({ value: s, label: s }))
              ]}
              size="md"
            />
          </div>

          {/* Validation Feedback Banner */}
          {validation.valid && !isSkip && !isException && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{validation.message}</span>
            </div>
          )}

          {/* Stage Skip Warning */}
          {isSkip && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <span>{validation.message}</span>
              </div>
              {hasPermission(userRole, PERMISSIONS.CANDIDATE_OVERRIDE) ? (
                <label className="flex items-center gap-2 font-bold cursor-pointer pt-1 text-slate-900 dark:text-white">
                  <input
                    type="checkbox"
                    checked={isOverrideAuthorized}
                    onChange={(e) => setIsOverrideAuthorized(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>I authorize this managerial override (Admin / HR)</span>
                </label>
              ) : (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 pt-1">
                  Managerial override restricted. Your role does not hold authorization to bypass intermediate pipeline stages.
                </p>
              )}
            </div>
          )}

          {/* Exception Reason Template Selector */}
          {targetStage === EXCEPTION_STATUS.REJECTED && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Rejection Category
              </label>
              <CustomSelect
                value={reason}
                onChange={(val) => setReason(val)}
                placeholder="Select standard rejection reason..."
                options={REJECTION_REASONS.map(r => ({ value: r, label: r }))}
                size="md"
              />
            </div>
          )}

          {/* Notes & Justification */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Business Justification / Activity Notes</span>
              {(isSkip || isException) && (
                <span className="text-rose-500 text-[11px] font-normal">* Mandatory</span>
              )}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context regarding this pipeline movement for audit history..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || currentStage === targetStage}
              style={{ backgroundColor: brandColor }}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Stage Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    targetContainer
  );
};

export default StageTransitionModal;
