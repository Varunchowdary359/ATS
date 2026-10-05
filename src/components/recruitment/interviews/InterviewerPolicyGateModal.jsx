import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, ShieldCheck, CheckSquare, Square, ArrowRight, 
  FileText, Award, Lock, CheckCircle2, AlertTriangle, Eye, Scale, UserCheck
} from 'lucide-react';
import { PolicyService } from '../../../services/policy/PolicyService';
import { interviewService } from './interviewService';

export const InterviewerPolicyGateModal = ({
  isOpen,
  onClose,
  session,
  interviewerId = 'INT-04',
  interviewerName = 'Elena Rostova',
  onAccepted,
  brandColor = 'var(--pw-brand)'
}) => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !session || typeof document === 'undefined') return null;

  // Retrieve assigned policy (or fallback to resolved)
  let policy = session.policyId ? PolicyService.getPolicyById(session.policyId) : null;
  if (!policy) {
    const resolved = PolicyService.resolvePolicyForInterview({
      roundId: session.roundId,
      requisitionId: session.requisitionId,
      roundCategory: session.roundCategory,
      interviewType: session.interviewType
    });
    policy = resolved.policy;
  }

  const effectiveVersion = session.policyVersion || policy?.version || 'v1.0';
  const rules = policy?.rules || {};

  const handleConfirmAcceptance = async () => {
    if (!hasAgreed) return;
    setIsSubmitting(true);
    try {
      await interviewService.updateInterviewerPolicyStatus(session.id, interviewerId, {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        policyVersion: effectiveVersion,
        interviewerName
      });

      if (onAccepted) onAccepted();
    } catch (e) {
      console.error('Failed to record interviewer policy acceptance', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto" dir="ltr">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-8 text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh] sm:max-h-[90vh] text-start"
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-extrabold shadow-2xs shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Interviewer Policy &amp; Code of Conduct
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {policy?.name || 'Interview Policy'} ({effectiveVersion})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Panelist: <span className="font-semibold text-slate-800 dark:text-slate-200">{interviewerName}</span> ({interviewerId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-slate-300">
          
          {/* Policy Overview Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{policy?.name || 'Enterprise Interview Protocol'}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {policy?.description || 'All interviewers are strictly required to review and accept the ethical evaluation standards, non-bias commitment, and compliance parameters before conducting this session.'}
            </p>
          </div>

          {/* Standard Evaluation Mandates */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Mandatory Conduct Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Objective Scoring</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assess candidate solely on job-specific competencies defined in the rubric.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Bias Prevention</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Strictly refrain from non-job-related personal, demographic, or cultural queries.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Timely Feedback</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Submit comprehensive scorecard notes within {policy?.enforcement?.feedbackSlaHours || 24} hours of session conclusion.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Data Confidentiality</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Candidate responses and test submissions must remain strictly confidential.
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Checkbox Agreement */}
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-0.5 text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                I acknowledge that I have read, understand, and agree to adhere strictly to the <strong>{policy?.name || 'Interview Policy'}</strong> (Version: {effectiveVersion}). I confirm that I will provide unbiased evaluation and comply with enterprise recruitment regulations.
              </span>
            </label>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-6">
              Your digital agreement timestamp will be cryptographically locked into the audit trail for this round.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmAcceptance}
            disabled={!hasAgreed || isSubmitting}
            style={hasAgreed && !isSubmitting ? { backgroundColor: brandColor } : {}}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              hasAgreed && !isSubmitting
                ? 'hover:brightness-110'
                : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span>{isSubmitting ? 'Recording...' : 'Enter Interview Workspace'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
