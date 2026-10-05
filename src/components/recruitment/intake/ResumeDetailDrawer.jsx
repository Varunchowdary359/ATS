import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, Mail, Phone, MapPin, Briefcase, Calendar, Award, 
  FileText, Download, FileSearch, AlertTriangle, CheckCircle2, 
  History, Building2, Layers, ExternalLink, ShieldCheck, Tag,
  ThumbsUp, ThumbsDown, Check, Star, CalendarPlus, Link as LinkIcon
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { ModernStatusBadge } from '../../admin/shared/ModernAdminLayoutComponents';

const ResumeDetailDrawer = ({ 
  isOpen, 
  onClose, 
  resume, 
  onOpenScreening, 
  onOpenDuplicate, 
  onShortlist,
  onRecommendInterview,
  onRejectCandidate,
  onScheduleInterview,
  userRole = 'recruiter' 
}) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || 'var(--pw-brand)';
  const [hmFeedback, setHmFeedback] = useState(null); // 'recommended' | 'rejected' | null
  const [hmNotes, setHmNotes] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !resume) return null;

  const candidateInitials = resume.candidateName 
    ? resume.candidateName.split(' ').map(n => n[0]).join('').substring(0, 2)
    : 'CN';

  const isShortlisted = resume.processingStatus === 'Shortlisted' || resume.processingStatus === 'HM Recommended' || resume.processingStatus === 'Interview Scheduled';
  const isInterviewScheduled = resume.processingStatus === 'Interview Scheduled';
  const isHmRecommended = resume.processingStatus === 'HM Recommended';
  const isRejected = resume.processingStatus === 'Rejected';
  const isHiringManager = userRole === 'hiring_manager';

  const currentReq = resume.requisitionId || resume.linkedReqId;
  const currentReqTitle = resume.requisitionTitle || resume.linkedJobTitle;

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-slate-950/70 backdrop-blur-md animate-fade-in" dir="ltr">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-[580px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200/80 dark:border-slate-800 flex flex-col h-full animate-slide-in-right">
          
          {/* ═══════════════════════════════════════════════════════════════════
              1. DRAWER HEADER (MILD BLUE GLASSMORPHISM)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-blue-100/70 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-blue-950/30 backdrop-blur-xl shrink-0 shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 border"
                style={{ backgroundColor: `${brandColor}15`, color: brandColor, borderColor: `${brandColor}30` }}
              >
                {candidateInitials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                    {resume.candidateName}
                  </h3>
                  <ModernStatusBadge status={resume.processingStatus || 'Screened'} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {resume.id} • Candidate Profile
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              2. DRAWER BODY (SCROLLABLE CONTENT SECTIONS)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
            
            {/* Candidate Metadata 2-Column Grid */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Email</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 truncate block">
                  {resume.email || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Phone</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 truncate block">
                  {resume.phone || 'N/A'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {resume.location || 'Bangalore, India (Hybrid)'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Total Experience</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {resume.totalExperience || '4+ yrs'}
                </span>
              </div>
            </div>

            {/* Associated Requisition Box */}
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Target Requisition &amp; Role Link
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {currentReq 
                    ? `${currentReq} — ${currentReqTitle || 'Engineering Role'}` 
                    : 'Unassigned / General Repository'}
                </p>
              </div>

              {!currentReq && onOpenScreening && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenScreening(resume);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Assign to REQ</span>
                </button>
              )}
            </div>

            {/* Screening AI Scorecard Breakdown (if screened) */}
            {resume.screeningScore !== null && (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    AI Semantic Fit Score
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                      {resume.screeningScore}%
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      ({resume.screeningOutcome || 'Good Match'})
                    </span>
                  </div>
                </div>
                
                {onOpenScreening && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenScreening(resume);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>View Matrix</span>
                  </button>
                )}
              </div>
            )}

            {/* Hiring Manager Technical Review Section (if in HM mode) */}
            {isHiringManager && (
              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600" />
                    Hiring Manager Technical Scope Review
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">
                    HM Mode
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHmFeedback('recommended');
                      if (onRecommendInterview) {
                        onRecommendInterview(resume.id, hmNotes || 'Strong profile fit, recommended for technical interview.');
                        onClose();
                      }
                    }}
                    style={{ backgroundColor: brandColor }}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-2xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Recommend for Interview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHmFeedback('rejected');
                      if (onRejectCandidate) {
                        onRejectCandidate(resume.id, hmNotes || 'Not a fit for this technical scope.');
                        onClose();
                      }
                    }}
                    className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Not a Fit</span>
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={hmNotes}
                    onChange={(e) => setHmNotes(e.target.value)}
                    placeholder="Add technical review notes (e.g. Strong React fundamentals)..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Candidate Skills Tags */}
            {resume.skills && resume.skills.length > 0 && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Extracted Skills &amp; Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Document File Card */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-8 h-8 shrink-0" style={{ color: brandColor }} />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {resume.fileName || `${resume.candidateName?.replace(/\s+/g, '_')}_Resume.docx`}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {resume.fileSize || '0.02 MB'} • Ingested via {resume.source || 'Single Upload'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert(`Downloading ${resume.fileName || 'Resume.docx'}...`)}
                style={{ backgroundColor: brandColor }}
                className="px-3 py-1.5 text-xs font-bold text-white rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>

            {/* Audit Trail Timeline */}
            {resume.auditTrail && resume.auditTrail.length > 0 && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-100 dark:border-slate-800 pb-2">
                  Candidate Activity &amp; Ingestion History
                </span>
                <div className="space-y-2 text-xs">
                  {resume.auditTrail.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
                      <History size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">By {log.actor || 'System'} • {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              3. STICKY DRAWER FOOTER (BRAND COLOR ACTIONS)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              {/* Recruiter Action: Mark as Shortlisted */}
              {!isHiringManager && onShortlist && (
                <button
                  type="button"
                  disabled={isShortlisted}
                  onClick={() => {
                    onShortlist(resume.id);
                    onClose();
                  }}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                    isShortlisted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isShortlisted ? 'Shortlisted ✓' : 'Mark as Shortlisted'}</span>
                </button>
              )}

              {/* Hiring Manager Actions: Recommend for Interview or Not a Fit */}
              {isHiringManager && (
                <>
                  {isInterviewScheduled ? (
                    <span className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Interview Scheduled</span>
                    </span>
                  ) : isHmRecommended ? (
                    <span className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Recommended for Interview ✓</span>
                    </span>
                  ) : isRejected ? (
                    <span className="px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-1.5 shadow-2xs">
                      <X className="w-4 h-4 text-rose-600" />
                      <span>Not a Fit</span>
                    </span>
                  ) : (
                    <>
                      {onRejectCandidate && (
                        <button
                          type="button"
                          onClick={() => {
                            onRejectCandidate(resume.id, hmNotes || 'Not a fit for this technical scope.');
                            onClose();
                          }}
                          className="px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span>Not a Fit</span>
                        </button>
                      )}

                      {onRecommendInterview && (
                        <button
                          type="button"
                          onClick={() => {
                            onRecommendInterview(resume.id, hmNotes || 'Recommended for technical assessment.');
                            onClose();
                          }}
                          style={{ backgroundColor: brandColor }}
                          className="px-4 py-2 text-xs font-bold text-white rounded-xl hover:brightness-110 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>Recommend for Interview</span>
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Run Screening Action */}
              {onOpenScreening && !isHiringManager && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenScreening(resume);
                  }}
                  style={{ backgroundColor: brandColor }}
                  className="px-3.5 py-2 text-xs font-bold text-white rounded-xl hover:brightness-110 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileSearch className="w-4 h-4" />
                  <span>{resume.screeningScore !== null ? 'Re-Run Screening' : 'Run Screening'}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default ResumeDetailDrawer;
