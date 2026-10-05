import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, CheckCircle, AlertTriangle, PauseCircle, 
  ArrowRight, ShieldCheck, UserCheck, Award, MessageSquare 
} from 'lucide-react';
import { ROUND_OUTCOME_DECISION, FEEDBACK_STATUS } from './interviewTypes';
import { interviewService } from './interviewService';

const RoundOutcomeModal = ({
  isOpen,
  onClose,
  session,
  currentUserContext = {},
  onOutcomeDecided,
  brandColor = 'var(--pw-brand)'
}) => {
  const [decision, setDecision] = useState(ROUND_OUTCOME_DECISION.PASS);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scorecards = session?.scorecards || [];
  const submittedCount = scorecards.filter(s => s.status === FEEDBACK_STATUS.SUBMITTED).length;
  const isAllSubmitted = submittedCount === scorecards.length && scorecards.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await interviewService.decideRoundOutcome(
        session.id,
        decision,
        notes,
        `${currentUserContext.name || 'Alex Chen'} (${currentUserContext.title || 'Hiring Manager'})`
      );
      onOutcomeDecided(updated);
      onClose();
    } catch (err) {
      console.error('Failed to decide round outcome', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !session || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto" dir="ltr">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 text-slate-900 dark:text-slate-100 text-start max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs font-extrabold shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Validate Round Outcome
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session.roundName} • {session.candidateName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Decision Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Panel Feedback Summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">Panel Feedback Status</span>
              <span className={isAllSubmitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                {submittedCount} of {scorecards.length} Submitted
              </span>
            </div>

            <div className="space-y-2">
              {scorecards.map(sc => (
                <div key={sc.interviewerId} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{sc.interviewerName}</span>
                    <div className="text-[11px] text-slate-500">{sc.comments ? `"${sc.comments.substring(0, 50)}..."` : 'No comments'}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{sc.recommendation || 'Pending'}</span>
                    {sc.overallRating > 0 && <div className="text-[10px] text-slate-400">{sc.overallRating} / 5.0</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Hiring Manager Decision <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: ROUND_OUTCOME_DECISION.PASS, label: 'Pass Round', icon: CheckCircle, color: 'text-emerald-600' },
                { key: ROUND_OUTCOME_DECISION.HOLD, label: 'Place on Hold', icon: PauseCircle, color: 'text-amber-600' },
                { key: ROUND_OUTCOME_DECISION.FAIL, label: 'Fail / Reject', icon: AlertTriangle, color: 'text-rose-600' },
                { key: ROUND_OUTCOME_DECISION.CONTINUE, label: 'Additional Round', icon: ArrowRight, color: 'text-blue-600' }
              ].map(item => {
                const isSelected = decision === item.key;
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => setDecision(item.key)}
                    style={isSelected ? { backgroundColor: brandColor, color: '#fff' } : {}}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={16} className={`mx-auto mb-1 ${isSelected ? 'text-white' : item.color}`} />
                    <div className="text-xs font-bold">{item.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Decision Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Decision Justification / HM Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Rationale for passing candidate to the next round or holding..."
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
            />
          </div>

          {/* Impact preview */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30 text-xs text-blue-800 dark:text-blue-300">
            {decision === ROUND_OUTCOME_DECISION.PASS && '✅ Marking this round as PASS will unlock the next configured round in the plan for scheduling.'}
            {decision === ROUND_OUTCOME_DECISION.HOLD && '⏸️ Candidate will be held at this stage pending further review.'}
            {decision === ROUND_OUTCOME_DECISION.FAIL && '🛑 Candidate will not proceed to subsequent interview rounds.'}
            {decision === ROUND_OUTCOME_DECISION.CONTINUE && '🔄 An extra follow-up assessment or interview session will be scheduled.'}
          </div>

          {/* Footer Controls */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: brandColor }}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving Outcome...' : 'Confirm Round Outcome'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

export default RoundOutcomeModal;
