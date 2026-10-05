import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  ArrowLeft, Calendar, Clock, Video, MapPin, Users, Award, 
  RotateCcw, Ban, CheckCircle2, ShieldCheck, Download, 
  FileText, ExternalLink, ArrowRight, UserCheck, CheckSquare, Sparkles,
  Camera, Mic, Monitor, Maximize, Radio, Eye, Mail, Phone, Building,
  Briefcase, Star, MessageSquare, Send, Copy, Printer, Share2, 
  ChevronRight, AlertTriangle, Info, Check, Shield, Layers, HelpCircle,
  ChevronDown, X, RefreshCw, ThumbsUp, ThumbsDown, FileUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernStatusBadge } from '../../admin/shared/ModernAdminLayoutComponents';
import { ThemeContext } from '../../../ThemeContext';
import { useToast } from '../../shared/ToastContext';
import { 
  SESSION_STATUS, 
  FEEDBACK_STATUS, 
  INTERVIEW_TYPE,
  INTERVIEW_ROLES,
  INTERVIEW_PERMISSIONS,
  FINAL_SELECTION_STATUS,
  hasInterviewPermission
} from './interviewTypes';
import { calendarProviderAdapter } from './adapters/calendarProviderAdapter';
import { InterviewPolicyViewModal } from './InterviewPolicyViewModal';

// ─── Shared Quick Info Row Sub-component ────────────────────────────────────
const QuickInfoRow = ({ label, value, icon: Icon, isMonospace = false, isHighlight = false, highlightColor }) => (
  <div className="flex items-center justify-between gap-2 py-2.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0 text-xs">
    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium whitespace-nowrap shrink-0">
      {Icon && <Icon size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />}
      <span>{label}</span>
    </span>
    <span className={`font-semibold text-right truncate ${
      isMonospace ? 'font-mono text-[11px]' : ''
    } ${
      isHighlight ? 'font-bold' : 'text-slate-900 dark:text-slate-100'
    }`} style={isHighlight && highlightColor ? { color: highlightColor } : {}}>
      {value || '—'}
    </span>
  </div>
);

// ─── Shared Side Card Sub-component ─────────────────────────────────────────
const SideCard = ({ icon: Icon, title, badge, children }) => (
  <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)]">
    <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100 dark:border-slate-800">
      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />}
        <span>{title}</span>
      </h3>
      {badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{badge}</span>}
    </div>
    <div>{children}</div>
  </div>
);

// ─── Shared Metric Tile Sub-component ───────────────────────────────────────
const MetricTile = ({ label, value, subtext, icon: Icon, statusColor }) => (
  <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-2xs flex items-start gap-3">
    {Icon && (
      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">{label}</span>
      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block truncate" style={statusColor ? { color: statusColor } : {}}>
        {value || '—'}
      </span>
      {subtext && <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">{subtext}</span>}
    </div>
  </div>
);

export default function InterviewDetailPage({
  session,
  onBack,
  brandColor: propBrandColor,
  currentRole = INTERVIEW_ROLES.RECRUITER,
  currentUserContext = {},
  onOpenKit = () => {},
  onOpenReschedule = () => {},
  onOpenCancel = () => {},
  onOpenOutcome = () => {},
  onOpenFinalDecision = () => {},
  onOpenCandidatePortal = () => {},
  onScheduleNextRound = () => {}
}) {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = propBrandColor || activeTheme?.color || '#3b82f6';
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // overview | scorecards | policy | candidate | audit
  const [isPolicyViewModalOpen, setIsPolicyViewModalOpen] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [auditNotes, setAuditNotes] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const moreActionsRef = useRef(null);

  // Close more actions dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target)) {
        setIsMoreActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session) return null;

  // Permissions Check
  const canOpenKit = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.KIT_ACCESS);
  const canSubmitScorecard = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SCORECARD_SUBMIT);
  const canValidateOutcome = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.ROUND_OUTCOME_DECIDE);
  const canRecommendFinal = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.FINAL_SELECTION_RECOMMEND);
  const canAuthorizeHRGate = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.HR_FINAL_VALIDATION_GATE);
  const canReschedule = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SESSION_RESCHEDULE);
  const canCancel = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SESSION_CANCEL);
  const canSchedule = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SESSION_SCHEDULE);

  const scorecards = session?.scorecards || [];
  const hasCompletedScorecard = scorecards.length > 0 || session?.status === SESSION_STATUS.COMPLETED;
  const currentSelectionStatus = session?.finalSelectionStatus || FINAL_SELECTION_STATUS.PENDING_HM_RECOMMENDATION;
  const isOfferReady = currentSelectionStatus === FINAL_SELECTION_STATUS.HR_APPROVED_READY_FOR_OFFER;
  const isHmRecommended = currentSelectionStatus === FINAL_SELECTION_STATUS.RECOMMENDED_BY_HM || !!session?.finalSelectionRecommendation?.recommendation;

  const headerStatus = isOfferReady 
    ? 'Ready for Offer' 
    : isHmRecommended 
      ? 'Recommended for Offer' 
      : (session.status || 'Scheduled');

  // Copy Meeting Link Handler
  const handleCopyMeetingLink = () => {
    if (session.meetingUrl) {
      navigator.clipboard?.writeText(session.meetingUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      addToast({
        title: 'Meeting URL Copied',
        message: 'Direct video conference link copied to clipboard.',
        type: 'success'
      });
    }
  };

  // ICS Calendar Download
  const handleDownloadIcs = () => {
    calendarProviderAdapter.generateIcsDownload({
      title: `${session.roundName} - ${session.candidateName}`,
      description: `Interview for ${session.requisitionTitle} (${session.requisitionId}). Round: ${session.roundName}.`,
      startTime: `${session.scheduledDate}T${session.startTime}:00Z`,
      endTime: `${session.scheduledDate}T${session.endTime}:00Z`,
      meetingUrl: session.meetingUrl,
      location: session.location
    });
    addToast({
      title: 'Calendar Invite (.ics)',
      message: 'ICS calendar file generated and downloaded.',
      type: 'success'
    });
  };

  // Add Internal Note Handler
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!internalNote.trim()) return;

    const newEntry = {
      id: Date.now(),
      author: currentUserContext?.name || 'Recruiter Admin',
      role: currentRole,
      text: internalNote.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    };

    setAuditNotes([newEntry, ...auditNotes]);
    setInternalNote('');
    addToast({
      title: 'Session Note Logged',
      message: 'Internal interviewer note saved to session audit history.',
      type: 'success'
    });
  };

  // 5-Stage Lifecycle Stepper Calculation
  const currentStageIndex = () => {
    if (isOfferReady || isHmRecommended) return 5;
    if (scorecards.length > 0) return 4;
    if (session.status === SESSION_STATUS.COMPLETED || session.status === SESSION_STATUS.IN_PROGRESS) return 3;
    if (session.candidatePolicyAccepted) return 2;
    return 1;
  };

  const stageIndex = currentStageIndex();

  const lifecycleStages = [
    { stepNum: 1, label: '1. Scheduled & Dispatched', subtitle: `${session.scheduledDate || '2026-09-30'} • ${session.startTime || '14:00'}` },
    { stepNum: 2, label: '2. Policy & Integrity Gate', subtitle: session.candidatePolicyAccepted ? 'Gate Signed ✓' : 'Awaiting Candidate Gate' },
    { stepNum: 3, label: '3. Session Conducted', subtitle: session.status || 'Scheduled' },
    { stepNum: 4, label: '4. Scorecard Calibration', subtitle: scorecards.length > 0 ? `${scorecards.length} Rubric Submitted ✓` : 'Pending Feedback' },
    { stepNum: 5, label: '5. Offer / Next Round Gate', subtitle: isOfferReady ? 'Ready for Offer ✓' : isHmRecommended ? 'Recommended for Offer ✓' : 'Pending Final Gate' }
  ];

  // Workspace Tabs Definition
  const tabs = [
    { id: 'overview', label: 'Overview & Logistics', icon: Calendar },
    { id: 'scorecards', label: `Scorecard & Rubrics (${scorecards.length})`, icon: Award },
    { id: 'policy', label: 'Assessment Policy & Gates', icon: ShieldCheck },
    { id: 'candidate', label: 'Candidate Profile & Fit', icon: UserCheck },
    { id: 'audit', label: `Timeline & Audit Logs (${auditNotes.length + 3})`, icon: Clock }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[1600px] mx-auto pt-4 sm:pt-6 pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-5 text-start"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          1. COMPACT ENTITY HEADER (MATCHING RESUME & REQUISITION FORMAT)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-30 bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-3.5">
        
        {/* Row 1: Back Nav + Candidate Title + Badges on Left, Action Toolbar on Right */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
          
          {/* Title & Status Group */}
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all shadow-2xs cursor-pointer shrink-0 active:scale-95"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              {session.candidateName}
            </h1>

            <ModernStatusBadge status={headerStatus} />

            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shrink-0">
              {session.id}
            </span>

            {/* Round Badge */}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shrink-0 flex items-center gap-1">
              <Video size={11} className="text-indigo-600" /> Round {session.roundSequence || 1}: {session.roundName}
            </span>
          </div>

          {/* Contextual Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Recruiter Primary Actions */}
            {canReschedule && (
              <button
                onClick={() => onOpenReschedule(session)}
                className="h-8 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <RotateCcw size={12} className="text-blue-500" /> Reschedule
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => onOpenCancel(session)}
                className="h-8 px-3.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <Ban size={12} /> Cancel Session
              </button>
            )}

            {/* Panelist & Interviewer Actions (Only if Interviewer role) */}
            {canSubmitScorecard && currentRole === INTERVIEW_ROLES.INTERVIEWER && (
              <button
                onClick={() => onOpenKit(session)}
                style={{ backgroundColor: brandColor }}
                className="h-8 px-4 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
              >
                <Award size={13} /> {hasCompletedScorecard ? 'View / Edit Scorecard' : 'Submit Scorecard'}
              </button>
            )}

            {/* Round Outcome Gate (for HM and Admins) */}
            {canValidateOutcome && (
              <button
                onClick={() => onOpenOutcome(session)}
                className="h-8 px-3.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <CheckSquare size={12} /> Outcome Gate
              </button>
            )}

            {/* Hiring Manager Primary Action: Recommend for Hire */}
            {canRecommendFinal && (
              isHmRecommended ? (
                <span className="h-8 px-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Recommended for Offer ✓
                </span>
              ) : (
                <button
                  onClick={() => onOpenFinalDecision(session)}
                  style={{ backgroundColor: brandColor }}
                  className="h-8 px-4 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
                >
                  <ThumbsUp size={13} /> Recommend for Hire
                </button>
              )
            )}

            {/* HRBP Primary Action: HR Validation & Offer Gate */}
            {canAuthorizeHRGate && !canRecommendFinal && (
              isOfferReady ? (
                <span className="h-8 px-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Ready for Offer Module ✓
                </span>
              ) : (
                <button
                  onClick={() => onOpenFinalDecision(session)}
                  style={{ backgroundColor: brandColor }}
                  className="h-8 px-4 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
                >
                  <UserCheck size={13} /> HR Offer Gate
                </button>
              )
            )}

            {/* Recruiter Schedule Next Round */}
            {canSchedule && currentRole === INTERVIEW_ROLES.RECRUITER && (
              <button
                onClick={() => onScheduleNextRound(session)}
                style={{ backgroundColor: brandColor }}
                className="h-8 px-3.5 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
              >
                <Calendar size={13} /> Schedule Next Round
              </button>
            )}

            {/* Candidate Portal View */}
            <button
              onClick={() => onOpenCandidatePortal(session)}
              className="h-8 px-3 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={12} /> Candidate Portal
            </button>

            {/* More Actions Dropdown */}
            <div className="relative" ref={moreActionsRef}>
              <button
                onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
                className="h-8 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>More Actions</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${isMoreActionsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMoreActionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 z-[100] text-xs divide-y divide-slate-100 dark:divide-slate-800"
                    style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
                  >
                    <div className="py-0.5">
                      <button
                        onClick={() => { setActiveTab('audit'); setIsMoreActionsOpen(false); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Clock size={14} className="text-slate-500" /> View Session Audit
                      </button>
                      <button
                        onClick={() => { setIsMoreActionsOpen(false); handleDownloadIcs(); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Download size={14} className="text-blue-500" /> Download Calendar (.ics)
                      </button>
                      <button
                        onClick={() => { setIsMoreActionsOpen(false); setIsPolicyViewModalOpen(true); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <ShieldCheck size={14} className="text-indigo-500" /> View Policy Terms
                      </button>
                    </div>
                    <div className="py-0.5">
                      <button
                        onClick={() => { setIsMoreActionsOpen(false); handleCopyMeetingLink(); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Share2 size={14} className="text-slate-400" /> Copy Meeting Link
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Row 2: Structured 4-Column Aligned Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2.5 gap-x-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {/* Col 1, Row 1: Linked Requisition */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Briefcase size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Linked REQ:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">
              {session.requisitionId || 'REQ-2026-0001'}
            </strong>
          </div>

          {/* Col 2, Row 1: Interview Mode */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Video size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Mode:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {session.interviewType || 'Video Conference'}
            </strong>
          </div>

          {/* Col 3, Row 1: Scheduled Date */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Calendar size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Date:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {session.scheduledDate || '2026-09-30'}
            </strong>
          </div>

          {/* Col 4, Row 1: Time & Duration */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Time:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {session.startTime} - {session.endTime} ({session.duration || 60}m)
            </strong>
          </div>

          {/* Col 1, Row 2: Panel Lead */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Users size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Panel Lead:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {session.interviewers?.[0]?.name || 'Alex Chen'}
            </strong>
          </div>

          {/* Col 2, Row 2: Candidate Email */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Mail size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Email:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {session.candidateEmail || 'arjun.sharma.qa@example.com'}
            </strong>
          </div>

          {/* Col 3, Row 2: Candidate Phone */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Phone size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Phone:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {session.candidatePhone || '+1 (555) 234-5678'}
            </strong>
          </div>

          {/* Col 4, Row 2: Assessment Policy */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <ShieldCheck size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Policy:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {session.policyName || 'General Aptitude & Domain Policy'}
            </strong>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. INTERVIEW LIFECYCLE WORKFLOW STEPPER (MILD BLUE GLASS)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-100/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Interview Lifecycle Workflow</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Current Stage: <strong className="font-bold text-blue-600 dark:text-blue-400">{session.status || 'Scheduled'}</strong>
            </span>
          </div>
          <button
            onClick={() => setActiveTab('audit')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Lifecycle History</span>
            <ChevronDown size={12} className="-rotate-90" />
          </button>
        </div>

        {/* Compact Workflow Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
          {lifecycleStages.map((s) => {
            let isCompleted = s.stepNum < stageIndex || (stageIndex === 5 && s.stepNum <= 5);
            let isCurrent = s.stepNum === stageIndex && stageIndex !== 5;

            return (
              <div
                key={s.stepNum}
                className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-br from-white via-blue-50/60 to-blue-50/30 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border-blue-300/80 dark:border-blue-800 shadow-[0_4px_15px_-2px_rgba(26,86,219,0.12)] -translate-y-0.5'
                    : isCompleted
                      ? 'bg-gradient-to-br from-blue-50/30 to-white/60 dark:from-blue-950/20 dark:to-slate-900/40 border-blue-100/80 dark:border-blue-900/30'
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCompleted || isCurrent
                      ? 'text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                  style={isCompleted || isCurrent ? { backgroundColor: brandColor } : {}}
                >
                  {isCompleted ? <Check size={13} strokeWidth={3} /> : s.stepNum}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-bold truncate ${
                    isCurrent
                      ? 'text-blue-950 dark:text-blue-100'
                      : isCompleted
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {s.label}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {isCompleted ? '✓ Stage Completed' : isCurrent ? 'Active Evaluation' : 'Upcoming'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stepper Card Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
          <span>Scheduled by <strong>Sarah Jenkins (Recruiter)</strong> on {session.scheduledDate || '2026-09-30'}</span>
          <span>Compliance Gate: <strong>{session.candidatePolicyAccepted ? 'Verified & Agreed' : 'Pending Signature'}</strong></span>
        </div>
      </div>

      {/* Dynamic Context Notification Banner */}
      <div className="px-4 py-2.5 bg-blue-500/10 dark:bg-blue-500/5 rounded-xl border border-blue-500/20 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
          <Sparkles size={14} className="text-blue-600 shrink-0" />
          <span>
            <strong>Session Status:</strong> {session.roundName} is scheduled for <strong>{session.scheduledDate} at {session.startTime}</strong>.
            {canSubmitScorecard && ' As an assigned interviewer, you can submit your rubric scorecard upon round completion.'}
            {canReschedule && ' You can modify panelist allocations or shift timings using the action controls above.'}
          </span>
        </div>
        {session.meetingUrl && (
          <a
            href={session.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Video size={12} /> Join Room
          </a>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. MAIN WORKSPACE TABS STRIP
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={activeTab === tab.id ? { borderBottomColor: brandColor, color: brandColor } : {}}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-50 dark:bg-slate-800/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. TAB CONTENTS + RIGHT SIDEBAR (RESPONSIVE 12-COL GRID)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center Main Pane (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* ──────────────── TAB 1: OVERVIEW & LOGISTICS ────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Meeting Conference Join Card (Glassmorphic) */}
              <div className="bg-gradient-to-br from-blue-50/60 via-white/80 to-indigo-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/80 dark:border-blue-900/40 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(26,86,219,0.04)] relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                      <Video size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>{session.interviewType || 'Video Conference'} Room</span>
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                      {session.roundName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Scheduled for {session.scheduledDate} at {session.startTime} - {session.endTime} ({session.duration || 60} mins)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.meetingUrl ? (
                      <a
                        href={session.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ backgroundColor: brandColor }}
                        className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Video size={14} />
                        <span>Join Meeting Room</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No direct video URL specified</span>
                    )}

                    {session.meetingUrl && (
                      <button
                        onClick={handleCopyMeetingLink}
                        title="Copy Meeting Link"
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-2xs transition-colors cursor-pointer"
                      >
                        {isCopied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                      </button>
                    )}
                  </div>
                </div>

                {session.meetingUrl && (
                  <div className="mt-4 pt-3.5 border-t border-blue-100/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 font-mono">
                    <span className="truncate max-w-md bg-white/70 dark:bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800">{session.meetingUrl}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans font-medium">Passcode: <strong className="font-mono text-slate-800 dark:text-slate-200">482910</strong></span>
                  </div>
                )}
              </div>

              {/* Assigned Panelists Roster */}
              <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={15} className="text-blue-500" />
                    <span>Assigned Panelists & Interviewers ({session.interviewers?.length || 0})</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Panel availability confirmed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(session.interviewers || []).map((panelist, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3.5"
                    >
                      <div 
                        className="w-10 h-10 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: panelist.avatarBg || '#6366f1' }}
                      >
                        {panelist.avatar || panelist.name?.slice(0, 2).toUpperCase() || 'IV'}
                      </div>
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{panelist.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{panelist.title || 'Technical Interviewer'}</div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                          <Mail size={11} /> {panelist.email || 'panelist@peopleworks.internal'}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Gate Cleared
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Focus Areas & Round Instructions */}
              <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={15} className="text-indigo-500" />
                  <span>Round Format & Focus Areas</span>
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {session.instructions || 'Comprehensive evaluation covering domain architecture, technical execution, algorithmic problem solving, clean coding, and organizational leadership fit.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MetricTile 
                    label="Round Category" 
                    value={session.roundCategory || 'Technical'} 
                    subtext={`Sequence #${session.roundSequence || 1}`}
                    icon={Award}
                  />
                  <MetricTile 
                    label="Expected Duration" 
                    value={`${session.duration || 60} Minutes`} 
                    subtext="Single session format"
                    icon={Clock}
                  />
                  <MetricTile 
                    label="Evaluation Method" 
                    value="Scorecard Rubric" 
                    subtext="Multi-criteria 1-5 scale"
                    icon={CheckSquare}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 2: SCORECARD & RUBRICS ────────────── */}
          {activeTab === 'scorecards' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award size={16} className="text-amber-500" />
                      <span>Scorecard Evaluation Summary</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Standardized rubric feedback and hiring recommendation for this session.
                    </p>
                  </div>

                  {canSubmitScorecard && (
                    <button
                      onClick={() => onOpenKit(session)}
                      style={{ backgroundColor: brandColor }}
                      className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Award size={14} />
                      <span>{scorecards.length > 0 ? 'Edit Scorecard' : 'Fill Scorecard Now'}</span>
                    </button>
                  )}
                </div>

                {scorecards.length > 0 ? (
                  <div className="space-y-4">
                    {scorecards.map((sc, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{sc.interviewerName || 'Panelist Evaluation'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({sc.submittedAt || '2026-09-30'})</span>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                            sc.recommendation === 'Strong Yes' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            sc.recommendation === 'Yes' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                            'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>
                            Recommendation: {sc.recommendation || 'Strong Yes'}
                          </span>
                        </div>

                        {/* Criteria Scores */}
                        <div className="space-y-2 mt-3 text-xs">
                          {(sc.criteriaScores || [
                            { name: 'Problem Solving & Algorithmic Thinking', score: 4, notes: 'Quick to break down complexity and produce clean code.' },
                            { name: 'System Architecture & Scalability', score: 5, notes: 'Exceptional understanding of micro-frontends and caching.' },
                            { name: 'Code Quality & Modularity', score: 4, notes: 'Followed solid TypeScript design patterns and modular components.' },
                            { name: 'Technical Communication & Collaboration', score: 5, notes: 'Articulate, open to feedback and structured in explanations.' }
                          ]).map((crit, cIdx) => (
                            <div key={cIdx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">{crit.name}</span>
                                {crit.notes && <span className="text-[11px] text-slate-500 block mt-0.5">{crit.notes}</span>}
                              </div>
                              <div className="flex items-center gap-1 text-amber-500 font-bold shrink-0">
                                <Star size={12} fill="currentColor" />
                                <span>{crit.score} / 5</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Justification Comments */}
                        {sc.comments && (
                          <div className="mt-4 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs">
                            <span className="font-bold text-blue-900 dark:text-blue-300 block mb-1">Interviewer Feedback Summary:</span>
                            <p className="text-slate-700 dark:text-slate-300 italic">{sc.comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                    <Award size={32} className="mx-auto text-slate-400 mb-2" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Scorecard Submitted Yet</h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                      Assigned interviewers can submit their structured rubrics and hiring recommendation directly after the session.
                    </p>
                    {canSubmitScorecard && (
                      <button
                        onClick={() => onOpenKit(session)}
                        style={{ backgroundColor: brandColor }}
                        className="mt-4 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm hover:opacity-95 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award size={13} />
                        <span>Open Scorecard Kit</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────── TAB 3: ASSESSMENT POLICY & GATES ────────────── */}
          {activeTab === 'policy' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={20} className="text-indigo-600" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {session.policyName || 'Standard Engineering Assessment Policy'}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Version {session.policyVersion || 'v1.0'} • Mandatory Compliance Gate
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsPolicyViewModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>View Full Policy Terms</span>
                  </button>
                </div>

                {/* Policy Gates Breakdown */}
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">Candidate Policy Acceptance</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {session.candidatePolicyAccepted ? 'Candidate reviewed & digitally signed agreement prior to room access.' : 'Awaiting candidate signature in prep portal.'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      session.candidatePolicyAccepted ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {session.candidatePolicyAccepted ? 'Gate Cleared' : 'Pending'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">Anti-Bias & Code of Conduct Signoff</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Panelists completed mandatory objective evaluation checklist.
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Verified
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Shield size={12} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">Integrity & Proctoring Verification</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Camera feed & screen sharing enabled for live technical pairing.
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 4: CANDIDATE PROFILE & FIT ────────────── */}
          {activeTab === 'candidate' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <UserCheck size={15} className="text-blue-500" />
                  <span>Candidate Profile & Matched Competencies</span>
                </h3>

                {/* Candidate Overview Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MetricTile 
                    label="Requisition Match" 
                    value="88% Match Score" 
                    subtext="Strong Engineering Fit"
                    icon={Sparkles}
                    statusColor="#059669"
                  />
                  <MetricTile 
                    label="Total Experience" 
                    value="7.5 Years" 
                    subtext="Senior / Lead Level"
                    icon={Briefcase}
                  />
                  <MetricTile 
                    label="Application ID" 
                    value={session.applicationId || 'APP-2026-001'} 
                    subtext="Ingested via Direct Apply"
                    icon={FileText}
                  />
                </div>

                {/* Parsed Technical Skills */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Key Skills & Proficiencies:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {['React 19', 'TypeScript', 'Node.js', 'System Design', 'Micro-Frontends', 'TailwindCSS', 'GraphQL', 'Jest / Playwright', 'Docker', 'AWS ECS'].map((skill, idx) => (
                      <span key={idx} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 5: TIMELINE & AUDIT LOGS ────────────── */}
          {activeTab === 'audit' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Clock size={15} className="text-indigo-500" />
                  <span>Session Timeline & Compliance Audit History</span>
                </h3>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                    Log Internal Interviewer Note:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="Add an internal debrief note, candidate observation, or feedback follow-up..."
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="submit"
                      style={{ backgroundColor: brandColor }}
                      className="px-4 py-2 rounded-lg text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Send size={13} />
                      <span>Post Note</span>
                    </button>
                  </div>
                </form>

                {/* Timeline Events */}
                <div className="space-y-3 text-xs">
                  {auditNotes.map(item => (
                    <div key={item.id} className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-blue-900 dark:text-blue-300">{item.author} ({item.role})</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{item.text}</p>
                    </div>
                  ))}

                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={13} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">Calendar Invites Dispatched</span>
                        <span className="text-[10px] text-slate-400 font-mono">2026-09-28, 09:30 AM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Direct calendar ICS attachments and candidate preparation portal dispatched.
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <ShieldCheck size={13} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">Assessment Policy Bound</span>
                        <span className="text-[10px] text-slate-400 font-mono">2026-09-28, 09:30 AM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Policy {session.policyName || 'General Aptitude & Domain Policy'} bound to session #{session.id}.
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Calendar size={13} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">Interview Session Created</span>
                        <span className="text-[10px] text-slate-400 font-mono">2026-09-28, 09:15 AM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Scheduled by Recruiter for {session.scheduledDate} at {session.startTime}.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Candidate Quick Contact Card */}
          <SideCard icon={UserCheck} title="Candidate Information">
            <div className="space-y-0.5">
              <QuickInfoRow label="Full Name" value={session.candidateName} icon={UserCheck} />
              <QuickInfoRow label="Email Address" value={session.candidateEmail || 'arjun.sharma.qa@example.com'} icon={Mail} />
              <QuickInfoRow label="Phone" value={session.candidatePhone || '+1 (555) 234-5678'} icon={Phone} />
              <QuickInfoRow label="Department" value={session.department || 'Engineering'} icon={Building} />
              <QuickInfoRow label="Requisition" value={session.requisitionId || 'REQ-2026-0001'} icon={Briefcase} isMonospace />
            </div>
          </SideCard>

          {/* Quick Actions Panel */}
          <SideCard icon={Sparkles} title="Quick Actions">
            <div className="space-y-2 text-xs">
              <button
                onClick={handleDownloadIcs}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                <span>Export Calendar (.ICS)</span>
              </button>

              <button
                onClick={() => onOpenCandidatePortal(session)}
                className="w-full py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={14} />
                <span>Candidate Portal Preview</span>
              </button>

              {canSubmitScorecard && (
                <button
                  onClick={() => onOpenKit(session)}
                  style={{ backgroundColor: brandColor }}
                  className="w-full py-2.5 px-3 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xs hover:opacity-95 cursor-pointer active:scale-95"
                >
                  <Award size={14} />
                  <span>{scorecards.length > 0 ? 'Edit Scorecard' : 'Fill Scorecard'}</span>
                </button>
              )}
            </div>
          </SideCard>
        </div>
      </div>

      {/* Assessment Policy Modal */}
      {isPolicyViewModalOpen && (
        <InterviewPolicyViewModal
          isOpen={isPolicyViewModalOpen}
          policyId={session.policyId}
          onClose={() => setIsPolicyViewModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
