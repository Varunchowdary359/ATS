import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, Video, MapPin, Users, Award, 
  RotateCcw, Ban, CheckCircle2, ShieldCheck, Download, 
  FileText, ExternalLink, ArrowRight, UserCheck, CheckSquare, Sparkles,
  Camera, Mic, Monitor, Maximize, Radio, Eye
} from 'lucide-react';
import { 
  SESSION_STATUS, 
  FEEDBACK_STATUS, 
  INTERVIEW_TYPE,
  INTERVIEW_ROLES,
  INTERVIEW_PERMISSIONS,
  FINAL_SELECTION_STATUS,
  hasInterviewPermission,
  canPerformSessionAction
} from './interviewTypes';
import { calendarProviderAdapter } from './adapters/calendarProviderAdapter';
import { PolicyService } from '../../../services/policy/PolicyService';
import { InterviewPolicyViewModal } from './InterviewPolicyViewModal';

const InterviewDetailsDrawer = ({
  isOpen,
  session,
  currentRole = INTERVIEW_ROLES.RECRUITER,
  currentUserContext = {},
  onClose,
  onOpenInterviewKit,
  onOpenRoundOutcome,
  onOpenFinalDecision,
  onOpenReschedule,
  onOpenCancel,
  brandColor = 'var(--pw-brand)'
}) => {
  const [isPolicyViewModalOpen, setIsPolicyViewModalOpen] = useState(false);

  const handleDownloadIcs = () => {
    calendarProviderAdapter.generateIcsDownload({
      title: `${session.roundName} - ${session.candidateName}`,
      description: `Interview for ${session.requisitionTitle} (${session.requisitionId}). Round: ${session.roundName}.`,
      startTime: `${session.scheduledDate}T${session.startTime}:00Z`,
      endTime: `${session.scheduledDate}T${session.endTime}:00Z`,
      meetingUrl: session.meetingUrl,
      location: session.location
    });
  };

  const scorecards = session?.scorecards || [];

  if (!isOpen || !session || typeof document === 'undefined') return null;

  // Centralized Permissions for this Session
  const canOpenKit = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.KIT_ACCESS);
  const canValidateOutcome = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.ROUND_OUTCOME_DECIDE);
  const canRecommendFinal = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.FINAL_SELECTION_RECOMMEND);
  const canAuthorizeHRGate = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.HR_FINAL_VALIDATION_GATE);
  const canReschedule = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SESSION_RESCHEDULE);
  const canCancel = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SESSION_CANCEL);

  const currentSelectionStatus = session.finalSelectionStatus || FINAL_SELECTION_STATUS.PENDING_HM_RECOMMENDATION;
  const isOfferReady = currentSelectionStatus === FINAL_SELECTION_STATUS.HR_APPROVED_READY_FOR_OFFER;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex justify-end bg-slate-950/70 backdrop-blur-sm" dir="ltr">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 overflow-hidden text-start"
      >
        {/* Header Bar */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs font-extrabold text-sm shrink-0"
              style={{ backgroundColor: session.candidateAvatarBg || brandColor }}
            >
              {session.candidateAvatar || 'CD'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {session.candidateName}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  {session.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{session.requisitionTitle} ({session.requisitionId})</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-400">App: {session.applicationId || 'APP-2026-001'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadIcs}
              title="Download Calendar (.ics)"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-xs">
          {/* Conflict Warning Banner if Conflicted */}
          {session.conflictInfo && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-200">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{session.conflictInfo.title || 'Interviewer Conflict Warning'}</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {session.conflictInfo.message}
              </p>
              {canReschedule && (
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => onOpenReschedule(session)}
                    className="px-3 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    Reschedule Session
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Round & Meeting Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 via-slate-50 to-white dark:from-slate-800/80 dark:via-slate-800/60 dark:to-blue-950/20 border border-blue-100/80 dark:border-blue-900/40 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Round {session.roundSequence} • {session.roundCategory}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {session.roundName}
                </h3>
              </div>

              {session.meetingUrl && (
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ backgroundColor: brandColor }}
                  className="px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-90 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Video size={13} />
                  <span>Join Call</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            {/* Logistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
              <div>
                <div className="text-slate-400 font-bold">Date &amp; Time</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {session.scheduledDate}
                </div>
                <div className="text-slate-500">{session.startTime} - {session.endTime}</div>
              </div>

              <div>
                <div className="text-slate-400 font-bold">Delivery Mode</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {session.interviewType}
                </div>
                <div className="text-slate-500">{session.meetingProvider || session.location || 'Remote'}</div>
              </div>

              <div>
                <div className="text-slate-400 font-bold">Timezone</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {session.timezone || 'UTC+05:30 (IST)'}
                </div>
                <div className="text-slate-500">{session.duration} mins</div>
              </div>

              <div>
                <div className="text-slate-400 font-bold">Feedback Status</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {session.feedbackStatus || 'Pending'}
                </div>
                <div className="text-slate-500">{scorecards.length} Scorecard(s)</div>
              </div>
            </div>
          </div>

          {/* Interviewers & Panelists */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Interviewers &amp; Panel ({session.interviewers?.length || 0})</span>
              <span className="text-[11px] text-slate-400">Feedback: {session.feedbackStatus}</span>
            </div>

            <div className="space-y-2">
              {(session.interviewers || []).map(int => {
                const sc = scorecards.find(s => s.interviewerId === int.id);
                const isSubmitted = sc?.status === FEEDBACK_STATUS.SUBMITTED;

                return (
                  <div 
                    key={int.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-2xs"
                        style={{ backgroundColor: int.avatarBg || '#6366f1' }}
                      >
                        {int.avatar || 'IN'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{int.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{int.title}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isSubmitted ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 size={13} />
                          <span>{sc.recommendation} ({sc.overallRating}/5)</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          Feedback Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              INTERVIEW POLICY & INTEGRITY STATUS
          ═══════════════════════════════════════════════════════════════════ */}
          {(() => {
            let policy = session.policyId ? PolicyService.getPolicyById(session.policyId) : null;
            if (!policy) {
              const res = PolicyService.resolvePolicyForInterview({
                roundId: session.roundId,
                requisitionId: session.requisitionId,
                roundCategory: session.roundCategory,
                interviewType: session.interviewType
              });
              policy = res.policy;
            }
            const rules = policy?.rules || {};
            const effectiveVersion = session.policyVersion || policy?.version || 'v1.0';

            return (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-900 dark:text-white">Interview Policy &amp; Integrity</span>
                  </div>
                  {policy && (
                    <button
                      type="button"
                      onClick={() => setIsPolicyViewModalOpen(true)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>View Policy Rules</span>
                    </button>
                  )}
                </div>

                {policy ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{policy.name}</div>
                        <div className="text-[11px] text-slate-500">Version: <span className="font-bold text-indigo-600 dark:text-indigo-400">{effectiveVersion}</span></div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {session.policyRequired ? 'Mandatory Policy' : 'Advisory Policy'}
                      </span>
                    </div>

                    {/* Candidate & Interviewer Acceptance State */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {/* Candidate Acceptance */}
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Candidate Policy State</div>
                        {session.candidatePolicyAccepted ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 size={13} />
                            <span>Accepted &amp; Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                            <Clock size={13} />
                            <span>Pending Gate Completion</span>
                          </div>
                        )}
                        {session.candidatePolicyAcceptedAt && (
                          <div className="text-[10px] text-slate-400">
                            {new Date(session.candidatePolicyAcceptedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Panelist Acceptance Breakdown */}
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Interviewer Code of Conduct</div>
                        <div className="space-y-1">
                          {(session.interviewers || []).map(int => {
                            const isAccepted = !!session.interviewerPolicyAcceptances?.[int.id]?.accepted;
                            return (
                              <div key={int.id} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{int.name}</span>
                                {isAccepted ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 size={11} /> Accepted
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Pending</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Requirements Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-md border ${rules.camera?.required ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        Camera: {rules.camera?.required ? '✓ Req' : '— Opt'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md border ${rules.microphone?.required ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        Mic: {rules.microphone?.required ? '✓ Req' : '— Opt'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md border ${rules.screenShare?.required ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        Screen: {rules.screenShare?.required ? '✓ Req' : '— Opt'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md border ${rules.fullscreen?.required ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        Fullscr: {rules.fullscreen?.required ? '✓ Req' : '— Off'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    No policy assigned to this interview round.
                  </p>
                )}
              </div>
            );
          })()}

          {/* ═══════════════════════════════════════════════════════════════════
              ROLE-SCOPED WORKFLOW OPERATIONS ACTION HUB
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Workflow Operations</span>
              <span className="text-[10px] font-mono font-bold text-slate-400">Role: {currentRole}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* 1. Interview Kit & Scorecard */}
              {canOpenKit && (
                <button
                  onClick={() => onOpenInterviewKit(session)}
                  style={{ backgroundColor: brandColor }}
                  className="p-2.5 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Award size={14} />
                  <span>Open Interview Kit &amp; Scorecard</span>
                </button>
              )}

              {/* 2. Validate Round Outcome (Hiring Manager / HR / Admin) */}
              {canValidateOutcome && (
                <button
                  onClick={() => onOpenRoundOutcome(session)}
                  className="p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <UserCheck size={14} />
                  <span>Validate Round Outcome</span>
                </button>
              )}

              {/* 3. Tier 1 / Tier 2 Final Candidate Decision */}
              {(canRecommendFinal || canAuthorizeHRGate) && (
                <button
                  onClick={() => onOpenFinalDecision(session)}
                  className="p-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs col-span-1 sm:col-span-2"
                >
                  <ShieldCheck size={14} />
                  <span>
                    {isOfferReady 
                      ? 'View Offer Gate Clearance Status' 
                      : (canAuthorizeHRGate 
                        ? 'Tier 2: Authorize HR Compliance Gate' 
                        : 'Tier 1: Final Selection Recommendation')}
                  </span>
                </button>
              )}

              {/* 4. Reschedule Interview (Recruiter / HR / Admin) */}
              {canReschedule && (
                <button
                  onClick={() => onOpenReschedule(session)}
                  className="p-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reschedule</span>
                </button>
              )}

              {/* 5. Cancel / No-Show (Recruiter / HR / Admin) */}
              {canCancel && (
                <button
                  onClick={() => onOpenCancel(session)}
                  className="p-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Ban size={13} />
                  <span>Cancel / No Show</span>
                </button>
              )}
            </div>
          </div>

          {/* Timeline Audit History */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white">Lifecycle Audit Trail</div>
            <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
              {(session.timeline || []).map(item => (
                <div key={item.id} className="text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                    <span>{item.actor}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{item.action}</div>
                  {item.notes && <div className="text-slate-500">{item.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Policy Details Read-Only Modal */}
      {isPolicyViewModalOpen && (
        <InterviewPolicyViewModal
          isOpen={isPolicyViewModalOpen}
          onClose={() => setIsPolicyViewModalOpen(false)}
          session={session}
        />
      )}
    </div>,
    document.body
  );
};

export default InterviewDetailsDrawer;
