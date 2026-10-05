import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, CheckCircle, ShieldCheck, AlertCircle, Award, 
  UserCheck, ArrowUpRight, Lock, CheckSquare, Sparkles,
  ArrowRight, FileCheck, DollarSign, Building, User
} from 'lucide-react';
import { 
  INTERVIEW_ROLES, 
  FINAL_SELECTION_DECISION, 
  FINAL_SELECTION_STATUS,
  hasInterviewPermission,
  INTERVIEW_PERMISSIONS 
} from './interviewTypes';
import { interviewService } from './interviewService';

const FinalDecisionModal = ({
  isOpen,
  onClose,
  session,
  currentRole = INTERVIEW_ROLES.HIRING_MANAGER,
  currentUserContext = {},
  onFinalDecisionMade,
  onNavigate,
  brandColor = 'var(--pw-brand)'
}) => {
  // Tier 1 (HM) State
  const [recommendation, setRecommendation] = useState(
    session?.finalSelectionRecommendation?.recommendation || FINAL_SELECTION_DECISION.APPROVE
  );
  const [justification, setJustification] = useState(
    session?.finalSelectionRecommendation?.justification || ''
  );
  const [suggestedLevel, setSuggestedLevel] = useState(
    session?.finalSelectionRecommendation?.suggestedLevel || 'Senior Level II (IC-5)'
  );
  const [targetComp, setTargetComp] = useState(
    session?.finalSelectionRecommendation?.targetComp || '$165,000 - $180,000 / year'
  );

  // Tier 2 (HR) Compliance Checklist State
  const [isProcessCompliant, setIsProcessCompliant] = useState(true);
  const [isBackgroundVerified, setIsBackgroundVerified] = useState(true);
  const [isBudgetAuthorized, setIsBudgetAuthorized] = useState(true);
  const [hrNotes, setHrNotes] = useState(
    session?.hrValidationGate?.hrNotes || ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !session || typeof document === 'undefined') return null;

  // Determine active view mode based on role
  const isHR = currentRole === INTERVIEW_ROLES.HR_ADMIN || currentRole === INTERVIEW_ROLES.ATS_ADMIN;
  const isHM = currentRole === INTERVIEW_ROLES.HIRING_MANAGER;

  const currentStatus = session.finalSelectionStatus || FINAL_SELECTION_STATUS.PENDING_HM_RECOMMENDATION;
  const isAlreadyOfferReady = currentStatus === FINAL_SELECTION_STATUS.HR_APPROVED_READY_FOR_OFFER;
  const hmRecommendationData = session.finalSelectionRecommendation;

  // Tier 1: Submit HM Recommendation
  const handleHMSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!justification.trim()) {
      setErrorMessage('Please provide a justification for this hiring recommendation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await interviewService.submitHMSelectionRecommendation(
        session.applicationId,
        {
          recommendation,
          justification: justification.trim(),
          suggestedLevel,
          targetComp
        },
        `${currentUserContext.name || 'Alex Chen'} (Hiring Manager)`
      );
      onFinalDecisionMade(res);
      onClose();
    } catch (err) {
      console.error('Failed to submit HM recommendation', err);
      setErrorMessage(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tier 2: Submit HR Final Validation Gate
  const handleHRSubmit = async (e, decision = 'APPROVE') => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (decision === 'APPROVE' && (!isProcessCompliant || !isBudgetAuthorized)) {
      setErrorMessage('Process compliance and budget authorization must be confirmed to approve.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await interviewService.validateHRFinalApproval(
        session.applicationId,
        {
          isProcessCompliant,
          isBackgroundVerified,
          isBudgetAuthorized,
          hrNotes: hrNotes.trim(),
          decision
        },
        `${currentUserContext.name || 'Priya Sharma'} (HR Admin)`
      );
      onFinalDecisionMade(res);
      onClose();
    } catch (err) {
      console.error('Failed to authorize HR gate', err);
      setErrorMessage(err.message || 'Authorization failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto" dir="ltr">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh] text-start"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs font-extrabold shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <Award size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  2-Tier Final Candidate Decision &amp; Governance
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                  {isHR ? 'Tier 2: HR Gate' : 'Tier 1: HM Recommendation'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session.candidateName} • {session.requisitionTitle} ({session.requisitionId})
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

        {/* Candidate Dossier Overview Strip */}
        <div className="px-4 sm:px-6 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shrink-0"
              style={{ backgroundColor: session.candidateAvatarBg || brandColor }}
            >
              {session.candidateAvatar || 'CD'}
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white">{session.candidateName}</span>
              <span className="text-slate-400 text-[11px] ml-1.5">({session.candidateEmail})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">Current Status:</span>
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${
              isAlreadyOfferReady 
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                : (currentStatus === FINAL_SELECTION_STATUS.RECOMMENDED_BY_HM
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20')
            }`}>
              {currentStatus}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            CASE 1: CANDIDATE ALREADY FULLY APPROVED & READY FOR OFFER
        ═══════════════════════════════════════════════════════════════════ */}
        {isAlreadyOfferReady ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle size={16} className="text-emerald-600" />
                <span>Candidate Successfully Promoted to Offer Generation Stage</span>
              </div>
              <p className="text-emerald-700 dark:text-emerald-400 text-[11px] leading-relaxed">
                Both Tier 1 (Hiring Manager Recommendation) and Tier 2 (HR Compliance Gate Validation) have been verified and permanently locked into the audit trail.
              </p>
            </div>

            {/* Sign-off Audit Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tier 1: Hiring Manager Sign-off</div>
                <div className="font-bold text-slate-900 dark:text-white">Alex Chen (Engineering Director)</div>
                <div className="text-[11px] text-slate-500">{hmRecommendationData?.justification || 'Strong architectural skills and leadership fit.'}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">Level: {hmRecommendationData?.suggestedLevel || 'IC-5'}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tier 2: HR Compliance Gate</div>
                <div className="font-bold text-slate-900 dark:text-white">Priya Sharma (HRBP)</div>
                <div className="text-[11px] text-slate-500">{session.hrValidationGate?.hrNotes || 'Headcount, salary band, and policy verified.'}</div>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">✅ 100% Policy Compliant</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('offers');
                  }}
                  style={{ backgroundColor: brandColor }}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Open Offer Management</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        ) : isHM ? (
          /* ═══════════════════════════════════════════════════════════════════
              CASE 2: HIRING MANAGER VIEW — TIER 1 RECOMMENDATION
          ═══════════════════════════════════════════════════════════════════ */
          <form onSubmit={handleHMSubmit} className="p-6 space-y-5">
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300">
              <span className="font-bold">Hiring Manager Responsibility: </span>
              Evaluate all interview round ratings and submit your candidate recommendation. This recommendation will advance to HR for final compliance and offer release.
            </div>

            {/* Recommendation Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Selection Recommendation <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: FINAL_SELECTION_DECISION.APPROVE, label: 'Recommend for Offer', icon: CheckCircle, desc: 'Candidate passed all rounds' },
                  { key: FINAL_SELECTION_DECISION.HOLD, label: 'Place on Hold', icon: AlertCircle, desc: 'Pending other candidates' },
                  { key: FINAL_SELECTION_DECISION.REJECT, label: 'Reject Candidate', icon: X, desc: 'Candidate not selected' }
                ].map(item => {
                  const isSelected = recommendation === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => setRecommendation(item.key)}
                      style={isSelected ? { backgroundColor: brandColor, color: '#fff' } : {}}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <Icon size={16} className="mb-1" />
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] opacity-80">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level and Compensation Recommendation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Suggested Level / Designation
                </label>
                <input
                  type="text"
                  value={suggestedLevel}
                  onChange={e => setSuggestedLevel(e.target.value)}
                  placeholder="e.g. Senior Frontend Architect II"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Compensation Notes
                </label>
                <input
                  type="text"
                  value={targetComp}
                  onChange={e => setTargetComp(e.target.value)}
                  placeholder="e.g. $165,000 - $180,000"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Justification Comments */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Hiring Manager Justification &amp; Impact Assessment <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <textarea
                rows={3}
                value={justification}
                onChange={e => setJustification(e.target.value)}
                placeholder="Detailed rationale on why this candidate is recommended for hire, key technical strengths, and project alignment..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
                required
              />
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
                className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <span>{isSubmitting ? 'Submitting...' : 'Submit Recommendation to HR'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </form>
        ) : isHR ? (
          /* ═══════════════════════════════════════════════════════════════════
              CASE 3: HR / HRBP VIEW — TIER 2 GOVERNANCE & COMPLIANCE GATE
          ═══════════════════════════════════════════════════════════════════ */
          <form onSubmit={handleHRSubmit} className="p-6 space-y-5">
            {/* Step 1 Overview: HM Recommendation Preview */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Tier 1: Hiring Manager Recommendation
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {hmRecommendationData?.recommendation || 'Recommend for Offer'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                "{hmRecommendationData?.justification || 'Candidate demonstrated exceptional architectural depth and cultural alignment.'}"
              </p>
              <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span>By: {hmRecommendationData?.recommendedBy || 'Alex Chen (Hiring Manager)'}</span>
                <span>Level: {hmRecommendationData?.suggestedLevel || 'IC-5'}</span>
              </div>
            </div>

            {/* Step 2: Mandatory HR Compliance Gate Checklist */}
            <div className="space-y-3 p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                <ShieldCheck size={16} className="text-purple-600" />
                <span>Tier 2: HR / HRBP Compliance &amp; Policy Authorization Gate</span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isProcessCompliant}
                    onChange={e => setIsProcessCompliant(e.target.checked)}
                    className="rounded text-purple-600 mt-0.5"
                  />
                  <span>1. All mandatory interview rounds and panel rubrics completed according to ATS policy <span className="text-red-500">*</span></span>
                </label>

                <label className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBudgetAuthorized}
                    onChange={e => setIsBudgetAuthorized(e.target.checked)}
                    className="rounded text-purple-600 mt-0.5"
                  />
                  <span>2. Requisition headcount budget and salary band alignment verified <span className="text-red-500">*</span></span>
                </label>

                <label className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBackgroundVerified}
                    onChange={e => setIsBackgroundVerified(e.target.checked)}
                    className="rounded text-purple-600 mt-0.5"
                  />
                  <span>3. Work authorization, reference, or preliminary screening verified (or scheduled per company policy)</span>
                </label>
              </div>
            </div>

            {/* HR Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                HR Governance Verification Remarks
              </label>
              <textarea
                rows={2}
                value={hrNotes}
                onChange={e => setHrNotes(e.target.value)}
                placeholder="Compliance confirmation notes, approved salary band parameters, or offer instructions..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Enterprise Traceability Notice */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              Immutable audit trail supporting enterprise compliance, governance, and traceability.
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleHRSubmit(null, 'REJECT')}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Reject Candidate
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !isProcessCompliant || !isBudgetAuthorized}
                  style={{ backgroundColor: brandColor }}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck size={14} />
                  <span>{isSubmitting ? 'Authorizing...' : 'Authorize & Mark Ready for Offer'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
              CASE 4: RECRUITER / INTERVIEWER INFORMATIONAL READ-ONLY VIEW
          ═══════════════════════════════════════════════════════════════════ */
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-slate-900 dark:text-white">Governance Status</div>
              <p className="text-slate-500">
                Final selection requires Tier 1 Hiring Manager recommendation followed by Tier 2 HRBP compliance validation.
              </p>
              <div className="pt-2 text-[11px] text-slate-400">
                Current Status: <span className="font-bold text-slate-700 dark:text-slate-200">{currentStatus}</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export default FinalDecisionModal;
