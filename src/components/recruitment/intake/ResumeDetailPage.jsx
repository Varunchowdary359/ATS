import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  ArrowLeft, CheckCircle2, Clock, AlertCircle, 
  Building, MapPin, Tag, Briefcase, DollarSign, Users, 
  FileText, Shield, RefreshCw, Copy, Archive, Globe, 
  ChevronDown, X, Share2, Printer, Bell, UserPlus, FileUp, 
  ShieldCheck, Lock, ExternalLink, Download, Layers, Eye, 
  MoreHorizontal, Check, Trash2, Sparkles, Award, GraduationCap, 
  Mail, Phone, Calendar, AlertTriangle, ArrowRight, UserCheck, 
  Send, ThumbsUp, ThumbsDown, SlidersHorizontal, Search
} from 'lucide-react';
import { ModernStatusBadge } from '../../admin/shared/ModernAdminLayoutComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../../../ThemeContext';

// ─── Shared Quick Info Row Sub-component ───────────────────────────────────
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
  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
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

// ─── Metric Tile Sub-component ──────────────────────────────────────────────
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

export default function ResumeDetailPage({ 
  resume, 
  onBack, 
  onAction, 
  userRole = 'recruiter', 
  requisitions = [],
  jds = []
}) {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#3b82f6';

  const [activeTab, setActiveTab] = useState('match'); // match | parsed | requisition | reviews | audit
  const [toast, setToast] = useState(null);
  const [techFeedback, setTechFeedback] = useState('');
  const [recruiterNotes, setRecruiterNotes] = useState(resume?.recruiterNotes || '');
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const moreActionsRef = useRef(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target)) {
        setIsMoreActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!resume) return null;

  // Compute or extract screening details
  const rawScore = typeof resume.screeningScore === 'number' 
    ? resume.screeningScore 
    : parseInt(String(resume.screeningScore || '65').replace('%', ''), 10) || 65;
  
  const outcomeText = resume.screeningOutcome || (rawScore >= 80 ? 'Strong Match' : rawScore >= 60 ? 'Good Match' : 'Partial Match');
  
  const scoreColor = rawScore >= 80 ? '#059669' : rawScore >= 60 ? '#2563eb' : rawScore >= 45 ? '#d97706' : '#dc2626';

  // Default skills list
  const parsedSkills = Array.isArray(resume.skills) 
    ? resume.skills 
    : typeof resume.skills === 'string' 
      ? resume.skills.split(',').map(s => s.trim()) 
      : ['Selenium', 'Java', 'TestNG', 'RestAssured', 'Git', 'Maven', 'Jenkins', 'SQL', 'Postman', 'Cucumber BDD'];

  // Required skills for REQ-2026-0001
  const reqSkillsList = ['Selenium', 'Java', 'TestNG', 'RestAssured', 'Git', 'Playwright', 'Docker', 'CI/CD'];
  const matchedSkills = parsedSkills.filter(s => reqSkillsList.some(r => r.toLowerCase() === s.toLowerCase()));
  const missingSkills = reqSkillsList.filter(r => !parsedSkills.some(s => s.toLowerCase() === r.toLowerCase()));

  // 5-Stage Journey Stepper Definition
  const statusStr = (resume.processingStatus || '').toLowerCase();
  const isRejected = statusStr.includes('reject') || statusStr.includes('not fit');
  const isInterviewScheduled = statusStr.includes('interview') || statusStr.includes('scheduled');
  const isHmRecommended = resume.processingStatus === 'HM Recommended' || statusStr.includes('hm recommended');
  const isShortlisted = statusStr.includes('shortlist') || isHmRecommended;
  const isScreened = statusStr.includes('screen') || rawScore > 0;
  const isParsed = statusStr.includes('pars') || statusStr.includes('dedup');

  const currentStageIndex = () => {
    if (isInterviewScheduled) return 5;
    if (isHmRecommended) return 5;
    if (isShortlisted) return 4;
    if (isScreened) return 3;
    if (isParsed) return 2;
    return 1;
  };

  const stageIndex = currentStageIndex();

  const stages = [
    { label: '1. Ingestion', desc: resume.intakeSource || 'Single File', complete: true },
    { label: '2. AI Parsing & Dedup', desc: 'Fingerprint Verified', complete: stageIndex >= 2 },
    { label: '3. AI Screening', desc: `${rawScore}% Match Score`, complete: stageIndex >= 3 },
    { label: '4. Recruiter Shortlist', desc: isRejected ? 'Rejected' : stageIndex >= 4 ? 'Shortlisted ✓' : 'Pending Review', complete: stageIndex >= 4 && !isRejected },
    { label: '5. HM Review & Interview', desc: isInterviewScheduled ? 'Interview Scheduled ✓' : isHmRecommended ? 'HM Recommended ✓' : isRejected ? 'Not Recommended' : (stageIndex >= 4 ? 'Awaiting HM Review' : 'Upcoming'), complete: isInterviewScheduled || isHmRecommended }
  ];

  // Tabs list
  const tabs = [
    { id: 'match', label: 'AI Match & Fit Analysis' },
    { id: 'parsed', label: 'Parsed Candidate Profile' },
    { id: 'requisition', label: 'Requisition & JD Alignment' },
    { id: 'reviews', label: 'Reviewer Feedback & Decision' },
    { id: 'audit', label: `Activity History (${resume.activityHistory?.length || 4})` }
  ];

  // Actions
  const handleShortlist = () => {
    if (onAction) {
      onAction('shortlist', { ...resume, processingStatus: 'Shortlisted' });
    }
    showToast(`${resume.candidateName} marked as Shortlisted for REQ-2026-0001`, 'success');
  };

  const handleRecommendTech = (status) => {
    if (onAction) {
      onAction('tech_review', { 
        ...resume, 
        processingStatus: status === 'approved' ? 'HM Recommended' : 'Rejected',
        interviewStage: status === 'approved' ? 'Ready for Scheduling' : 'Not Recommended',
        hmReviewNotes: techFeedback || (status === 'approved' ? 'Candidate recommended for technical assessment by Hiring Manager.' : 'Candidate profile does not meet minimum technical benchmarks.')
      });
    }
    showToast(status === 'approved' ? 'Candidate recommended for interview! Notification dispatched to Recruiter.' : 'Candidate marked as Not a Fit', status === 'approved' ? 'success' : 'warning');
    setTechFeedback('');
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([
      `CANDIDATE RESUME: ${resume.candidateName}\n` +
      `Email: ${resume.email || 'mohanarani.s@gmail.com'}\n` +
      `Phone: ${resume.phone || '+91 98451 23456'}\n` +
      `Experience: ${resume.totalExperience || '4+ years'}\n` +
      `Skills: ${parsedSkills.join(', ')}\n` +
      `Requisition: ${resume.requisitionTitle || 'Senior Automation Test Engineer'}\n` +
      `Screening Score: ${rawScore}% (${outcomeText})\n` +
      `Ingested via: ${resume.intakeSource || 'Single File Upload'}\n` +
      `Date: ${resume.uploadedDate || '28/9/2026'}\n`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = resume.resumeFileName || `${resume.candidateName.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Resume file downloaded successfully', 'info');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[1600px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-5"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          1. COMPACT ENTITY HEADER (MATCHING JD DETAIL PAGE FORMAT)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-30 bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-3">
        
        {/* Row 1: Back Nav + Title + Status + Primary Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Title & Status Group */}
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              {resume.candidateName}
            </h1>

            <ModernStatusBadge status={resume.processingStatus || 'Screened'} />

            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shrink-0">
              {resume.id || 'RES-2026-001'}
            </span>

            {/* Score Pill */}
            <span 
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0 flex items-center gap-1"
            >
              <Sparkles size={11} className="text-emerald-600" /> {rawScore}% Match · {outcomeText}
            </span>
          </div>

          {/* Contextual Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Recruiter Primary Actions */}
            {(userRole === 'recruiter' || userRole === 'admin') && (
              <>
                {isInterviewScheduled ? (
                  <span className="h-8 px-3.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 size={13} className="text-indigo-600" /> Interview Scheduled
                  </span>
                ) : isShortlisted ? (
                  <span className="h-8 px-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Shortlisted
                  </span>
                ) : isRejected ? (
                  <span className="h-8 px-3.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-1.5 shadow-2xs">
                    <X size={13} className="text-rose-600" /> Rejected
                  </span>
                ) : (
                  <button
                    onClick={handleShortlist}
                    style={{ backgroundColor: brandColor }}
                    className="h-8 px-3.5 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 size={13} /> Mark as Shortlisted
                  </button>
                )}

                <button
                  onClick={() => onAction && onAction('screen_again', resume)}
                  className="h-8 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <RefreshCw size={12} className="text-blue-500" /> Re-Screen AI
                </button>
              </>
            )}

            {/* Hiring Manager Primary Actions */}
            {userRole === 'hiring_manager' && (
              <>
                {isInterviewScheduled ? (
                  <span className="h-8 px-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Interview Scheduled
                  </span>
                ) : isRejected ? (
                  <span className="h-8 px-3.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-1.5 shadow-2xs">
                    <X size={13} className="text-rose-600" /> Not a Fit
                  </span>
                ) : isHmRecommended ? (
                  <div className="flex items-center gap-2">
                    <span className="h-8 px-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Recommended for Interview ✓
                    </span>
                    <button
                      onClick={() => handleRecommendTech('rejected')}
                      className="h-8 px-3 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ThumbsDown size={12} /> Change to Not a Fit
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleRecommendTech('approved')}
                      style={{ backgroundColor: brandColor }}
                      className="h-8 px-4 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
                    >
                      <ThumbsUp size={13} /> Recommend for Interview
                    </button>

                    <button
                      onClick={() => handleRecommendTech('rejected')}
                      className="h-8 px-3.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <ThumbsDown size={13} /> Not a Fit
                    </button>
                  </>
                )}
              </>
            )}

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
                        <Eye size={14} className="text-slate-500" /> View Activity Audit
                      </button>
                      <button
                        onClick={() => { setIsMoreActionsOpen(false); handleDownload(); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Download size={14} className="text-blue-500" /> Download Resume
                      </button>
                      <button
                        onClick={() => { setIsMoreActionsOpen(false); onAction && onAction('assign_req', resume); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <UserPlus size={14} className="text-indigo-500" /> Re-assign Requisition
                      </button>
                      {resume.duplicateStatus === 'Potential Duplicate' && (
                        <button
                          onClick={() => { setIsMoreActionsOpen(false); onAction && onAction('resolve_dup', resume); }}
                          className="w-full px-3.5 py-2 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                        >
                          <ShieldCheck size={14} /> Resolve Duplicate
                        </button>
                      )}
                    </div>
                    <div className="py-0.5">
                      <button
                        onClick={() => { setIsMoreActionsOpen(false); showToast('Candidate profile shared with interview panel', 'info'); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Share2 size={14} className="text-slate-400" /> Share Profile Link
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
            <strong className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">{resume.requisitionId || 'REQ-2026-0001'}</strong>
          </div>

          {/* Col 2, Row 1: Current Role */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Building size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Current Role:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{resume.currentRole || 'Senior QA Engineer'}</strong>
          </div>

          {/* Col 3, Row 1: Total Experience */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Experience:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{resume.totalExperience || '4.5'} yrs</strong>
          </div>

          {/* Col 4, Row 1: Intake Source */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <FileUp size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Source:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{resume.intakeSource || resume.source || 'Single File Upload'}</strong>
          </div>

          {/* Col 1, Row 2: Email Address */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Mail size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Email:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{resume.email || 'arjun.sharma.qa@example.com'}</strong>
          </div>

          {/* Col 2, Row 2: Phone Number */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Phone size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Phone:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{resume.phone || '+91 98765 43210'}</strong>
          </div>

          {/* Col 3, Row 2: Location */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Location:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{resume.location || 'Bengaluru, India'}</strong>
          </div>

          {/* Col 4, Row 2: Resume Reference ID */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <FileText size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Resume Ref:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">{resume.id || 'RES-2026-001'}</strong>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. RESUME INTAKE LIFECYCLE STEPPER (MILD BLUE GLASS & BRAND STEPPERS)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-100/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Resume Intake Lifecycle Workflow</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Current Stage: <strong className="font-bold text-blue-600 dark:text-blue-400">{resume.processingStatus || 'Screened'}</strong>
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
          {[
            { stepNum: 1, label: '1. Ingestion', subtitle: resume.intakeSource || 'Single File' },
            { stepNum: 2, label: '2. AI Parsing & Dedup', subtitle: 'Fingerprint Verified' },
            { stepNum: 3, label: '3. AI Screening', subtitle: `${rawScore}% Match Score` },
            { stepNum: 4, label: '4. Recruiter Shortlist', subtitle: isRejected ? 'Rejected' : stageIndex >= 4 ? 'Shortlisted' : 'Pending Review' },
            { stepNum: 5, label: '5. HM Tech Review & Interview', subtitle: isInterviewScheduled ? 'Interview Scheduled' : isRejected ? 'Not Recommended' : (stageIndex >= 4 ? 'Ready to Schedule' : 'Awaiting HM') }
          ].map((s) => {
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

        {/* Card 2 Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
          <span>Ingested by <strong>Sarah Chen (Recruiter)</strong> on {resume.uploadedDate || '2026-09-28'}</span>
          <span>Last Evaluated: <strong>{new Date().toISOString().split('T')[0]}</strong></span>
        </div>
      </div>

      {/* Dynamic Context Notification Banner */}
      <div className="px-4 py-2.5 bg-blue-500/10 dark:bg-blue-500/5 rounded-xl border border-blue-500/20 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
          <Sparkles size={14} className="text-blue-600 shrink-0" />
          <span>
            <strong>Screening Verdict:</strong> AI Engine evaluated candidate profile with <strong>{rawScore}% match score</strong> for <strong>REQ-2026-0001</strong>. 
            {userRole === 'recruiter' && ' You can mark profile as Shortlisted to route to the Hiring Manager.'}
            {userRole === 'hiring_manager' && ' Please review candidate technical scope and click Recommend for Interview to notify the Recruiter.'}
          </span>
        </div>
        <button
          onClick={handleDownload}
          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Download size={12} /> Original Resume
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. MAIN CONTENT TABS & BODY
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
          
          {/* ──────────────── TAB 1: AI MATCH & FIT ANALYSIS ────────────── */}
          {activeTab === 'match' && (
            <div className="space-y-6 animate-fade-in">
              {/* Overall AI Scorecard Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold text-lg">
                      🤖
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Screening & Fit Scorecard</h2>
                      <p className="text-xs text-slate-500">Evaluated against REQ-2026-0001 (Senior Automation Test Engineer JD)</p>
                    </div>
                  </div>
                  <span 
                    className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                    style={{ backgroundColor: `${scoreColor}15`, color: scoreColor }}
                  >
                    {outcomeText}
                  </span>
                </div>

                {/* 4 Pillar Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pillar 1: Skills */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Tag size={13} className="text-blue-500" /> Technical Skills (40%)
                      </span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">72%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '72%' }} />
                    </div>
                    <p className="text-[11px] text-slate-500">Matched 6 core automation skills. Missing Playwright & Docker.</p>
                  </div>

                  {/* Pillar 2: Experience */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Briefcase size={13} className="text-indigo-500" /> Experience & Seniority (30%)
                      </span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">68%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '68%' }} />
                    </div>
                    <p className="text-[11px] text-slate-500">4.5 yrs vs 5+ yrs requirement. Strong UI automation background.</p>
                  </div>

                  {/* Pillar 3: Education */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <GraduationCap size={13} className="text-emerald-500" /> Education & Certs (15%)
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">85%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: '85%' }} />
                    </div>
                    <p className="text-[11px] text-slate-500">B.Tech in Computer Science & Engineering. ISTQB Certified.</p>
                  </div>

                  {/* Pillar 4: Knockout */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-amber-500" /> Knockout & Logistics (15%)
                      </span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">90%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '90%' }} />
                    </div>
                    <p className="text-[11px] text-slate-500">Notice period: 30 days. Location: Bangalore (Immediate availability).</p>
                  </div>
                </div>

                {/* Skills Match Matrix (Matched vs Gaps) */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Detailed Skills Matrix</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Matched */}
                    <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 size={13} /> Matched Skills ({matchedSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {matchedSkills.map((sk, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <Check size={11} /> {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Gaps */}
                    <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 space-y-2">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertCircle size={13} /> Missing / Gap Areas ({missingSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {missingSkills.map((sk, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <AlertCircle size={11} /> {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Executive Recommendation */}
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-600" />
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">AI Recruiter Summary & Interview Recommendation</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Mohanarani demonstrates solid 4+ years hands-on experience in Java/Selenium automation frameworks, TestNG, and CI/CD integration. She meets 75% of core qualifications for REQ-2026-0001. Recommended for technical interview to assess API testing depth and readiness to adopt Playwright.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 2: PARSED CANDIDATE PROFILE ────────────── */}
          {activeTab === 'parsed' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Extracted Candidate Profile</h2>
                  <p className="text-xs text-slate-500">Structured data parsed automatically by PeopleWorks Ingestion Engine</p>
                </div>

                {/* Professional Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Professional Summary</h3>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Senior QA Automation Engineer with 4.5 years of experience in designing, building, and maintaining automated test suites for enterprise web applications using Java, Selenium WebDriver, TestNG, RestAssured, and Jenkins CI/CD. Adept at agile methodologies, test case execution, and defect tracking.
                  </div>
                </div>

                {/* Experience Timeline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Parsed Work Experience</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Senior Automation Test Engineer</span>
                        <span className="text-[11px] font-mono font-semibold text-slate-500">2022 – Present (2.5 Yrs)</span>
                      </div>
                      <p className="text-xs text-blue-600 font-semibold">Infosys Technologies · Bangalore, India</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        • Built hybrid test automation frameworks using Selenium Java and TestNG from scratch.<br/>
                        • Automated 450+ test scenarios reducing manual regression testing time by 65%.<br/>
                        • Integrated automation test suites into Jenkins CI/CD pipeline for nightly triggers.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">QA Engineer (Automation & Manual)</span>
                        <span className="text-[11px] font-mono font-semibold text-slate-500">2020 – 2022 (2 Yrs)</span>
                      </div>
                      <p className="text-xs text-blue-600 font-semibold">Wipro Limited · Hyderabad, India</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        • Executed functional, sanity, regression, and smoke test suites on web applications.<br/>
                        • Maintained automated test scripts and logged defects in JIRA.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Education & Academics</h3>
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Bachelor of Technology (B.Tech) · Computer Science & Engineering</h4>
                      <p className="text-xs text-slate-500">JNTU University · Graduated with 8.2 CGPA</p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-500">2016 – 2020</span>
                  </div>
                </div>

                {/* Ingested File Box */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} className="text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{resume.resumeFileName || 'Mohana Rani 4+years Resume.docx'}</p>
                      <p className="text-[11px] text-slate-500">{resume.fileSize || '0.02 MB'} · Ingested via {resume.intakeSource || 'Single File Upload'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} /> Download File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 3: REQUISITION & JD ALIGNMENT ─────────── */}
          {activeTab === 'requisition' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Linked Job Requisition</h2>
                  <p className="text-xs text-slate-500">Parent requisition context and JD requirements mapping</p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/30 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/50 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold font-mono text-blue-700 dark:text-blue-300 uppercase">Parent Requisition</span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {resume.requisitionId || 'REQ-2026-0001'}: {resume.requisitionTitle || 'Senior Automation Test Engineer'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Department: Engineering · Hiring Manager: Alex Rivera</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Approved & Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Target Budget</span>
                      <p className="font-bold text-slate-900 dark:text-white">₹18,00,000 – ₹24,00,000</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Open Positions</span>
                      <p className="font-bold text-slate-900 dark:text-white">2 Vacancies</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Work Mode</span>
                      <p className="font-bold text-slate-900 dark:text-white">Hybrid (Bangalore)</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Candidate Expectation</span>
                      <p className="font-bold text-emerald-600">₹16,00,000 (Within Budget)</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500">Need to switch this candidate to another requisition?</p>
                  <button
                    onClick={() => onAction && onAction('assign_req', resume)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus size={13} className="text-blue-500" /> Re-assign to another Requisition
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 4: REVIEWER FEEDBACK & DECISION ───────── */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Reviewer Feedback & Stage Actions</h2>
                  <p className="text-xs text-slate-500">Recruiter screening notes, hiring manager technical endorsement, and interview triggers</p>
                </div>

                {/* Recruiter Assessment Box */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <UserCheck size={14} className="text-blue-600" /> Recruiter Screening Note (Sarah Chen)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">28/9/2026, 5:11 pm</span>
                  </div>
                  <textarea
                    rows={2}
                    value={recruiterNotes}
                    onChange={(e) => setRecruiterNotes(e.target.value)}
                    placeholder="Enter recruiter profile notes, communication score, and salary feedback..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-600 font-semibold">✓ Communication: Excellent · Notice: 30 Days</span>
                    {isShortlisted || isInterviewScheduled ? (
                      <span className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Shortlisted
                      </span>
                    ) : isRejected ? (
                      <span className="px-3.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <X size={13} className="text-rose-600" /> Rejected
                      </span>
                    ) : (
                      <button
                        onClick={handleShortlist}
                        style={{ backgroundColor: brandColor }}
                        className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-2xs hover:brightness-110 cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 size={13} /> Save & Mark Shortlisted
                      </button>
                    )}
                  </div>
                </div>

                {/* Hiring Manager Technical Review Box */}
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award size={14} className="text-purple-600" /> Hiring Manager Technical Review (Alex Rivera)
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      Technical Gatekeeper
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={techFeedback}
                    onChange={(e) => setTechFeedback(e.target.value)}
                    placeholder="Provide technical evaluation comments, specific round focus areas, and interview feedback..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    {isInterviewScheduled ? (
                      <span className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Interview Scheduled
                      </span>
                    ) : isRejected ? (
                      <span className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 shadow-2xs">
                        <X size={13} className="text-rose-600" /> Candidate Not a Fit
                      </span>
                    ) : isHmRecommended ? (
                      <div className="flex items-center gap-2">
                        <span className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 size={13} className="text-emerald-600" /> Recommended for Interview ✓
                        </span>
                        <button
                          onClick={() => handleRecommendTech('rejected')}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-colors"
                        >
                          <ThumbsDown size={12} className="inline mr-1" /> Not a Fit
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRecommendTech('rejected')}
                          className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold cursor-pointer transition-colors"
                        >
                          <ThumbsDown size={12} className="inline mr-1" /> Not a Fit
                        </button>
                        <button
                          onClick={() => handleRecommendTech('approved')}
                          style={{ backgroundColor: brandColor }}
                          className="px-4 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 hover:brightness-110 cursor-pointer shadow-2xs transition-all active:scale-95"
                        >
                          <ThumbsUp size={12} /> Recommend for Interview
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 5: AUDIT TRAIL & INGESTION HISTORY ───── */}
          {activeTab === 'audit' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Audit Trail & Candidate Activity History</h2>
                  <p className="text-xs text-slate-500">Chronological immutable record of ingestion, parsing, screenings & role actions</p>
                </div>

                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {(resume.activityHistory || [
                    { title: 'Technical Interview Scheduled', by: 'Alex Rivera (Hiring Manager)', time: '28/9/2026, 5:15 pm', desc: 'Progressed candidate to Interview Scheduling module for Round 1 Technical Assessment.' },
                    { title: 'Candidate Shortlisted', by: 'Sarah Chen (Recruiter)', time: '28/9/2026, 5:11 pm', desc: 'Screening score validated at 65%. Profile marked as shortlisted for REQ-2026-0001.' },
                    { title: 'AI Screening Assessment Completed', by: 'AI Screening Engine', time: '28/9/2026, 5:05 pm', desc: 'Weighted score computed against REQ-2026-0001 JD. Overall match: 65% (Good Match).' },
                    { title: 'Resume Uploaded & Parsed', by: 'Current User', time: '28/9/2026, 5:04 pm', desc: 'Single file uploaded: Mohana Rani 4+years Resume.docx. SHA-256 fingerprint verified.' }
                  ]).map((item, index) => (
                    <div key={index} className="relative group">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{item.time}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{item.by}</p>
                        {item.desc && <p className="text-xs text-slate-600 dark:text-slate-300 pt-0.5">{item.desc}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            5. RIGHT SIDEBAR INFO PANELS (4 cols)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Quick Info Card */}
          <SideCard icon={Briefcase} title="Candidate Quick Info">
            <div className="space-y-0.5">
              <QuickInfoRow label="Full Name" value={resume.candidateName} />
              <QuickInfoRow label="Email" value={resume.email || 'mohanarani.s@gmail.com'} icon={Mail} />
              <QuickInfoRow label="Phone" value={resume.phone || '+91 98451 23456'} icon={Phone} />
              <QuickInfoRow label="Location" value={resume.location || 'Bangalore, India'} icon={MapPin} />
              <QuickInfoRow label="Total Experience" value={resume.totalExperience || '4.5 Years'} isHighlight />
              <QuickInfoRow label="Current CTC" value={resume.currentCtc || '₹11,00,000 / yr'} />
              <QuickInfoRow label="Expected CTC" value={resume.expectedCtc || '₹16,00,000 / yr'} isHighlight highlightColor="#059669" />
              <QuickInfoRow label="Notice Period" value={resume.noticePeriod || '30 Days'} />
              <QuickInfoRow label="Ingestion Source" value={resume.intakeSource || 'Single File Upload'} isMonospace />
              <QuickInfoRow label="Ingested Date" value={resume.uploadedDate || '28/9/2026'} isMonospace />
            </div>
          </SideCard>

          {/* Duplicate Guard Card */}
          <SideCard icon={Shield} title="Duplicate Guard Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold">Verified Non-Duplicate</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">0 Match</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                SHA-256 fingerprint checked against all 18,400+ candidate repository records. No identical email, phone, or resume hash collision detected.
              </p>
            </div>
          </SideCard>

          {/* Requisition Link Card */}
          <SideCard icon={Building} title="Linked Requisition">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-mono font-bold text-blue-600 uppercase">{resume.requisitionId || 'REQ-2026-0001'}</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{resume.requisitionTitle || 'Senior Automation Test Engineer'}</p>
                <p className="text-[11px] text-slate-500 mt-1">Hiring Manager: Alex Rivera</p>
              </div>
              <button
                onClick={() => onAction && onAction('assign_req', resume)}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={13} className="text-blue-500" /> Switch Requisition
              </button>
            </div>
          </SideCard>
        </div>
      </div>

      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`fixed bottom-20 right-6 sm:right-28 z-[999999] max-w-md flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white border border-white/20 backdrop-blur-md ${
              toast.type === 'warning' ? 'bg-amber-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 size={13} className="text-white" />
            </div>
            <span className="flex-1 leading-snug">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
