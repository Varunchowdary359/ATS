import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, FileText, CheckCircle, Award, Star, Video, 
  Clock, ShieldCheck, Lock, ChevronRight, User, AlertCircle 
} from 'lucide-react';
import { SCORECARD_RECOMMENDATION, FEEDBACK_STATUS, INTERVIEW_ROLES, hasInterviewPermission, INTERVIEW_PERMISSIONS } from './interviewTypes';
import { interviewService } from './interviewService';

const InterviewKitModal = ({
  isOpen,
  onClose,
  session,
  currentRole = INTERVIEW_ROLES.INTERVIEWER,
  currentInterviewerId = 'INT-04',
  currentInterviewerName = 'Elena Rostova',
  onScorecardSubmitted,
  brandColor = 'var(--pw-brand)'
}) => {
  const [activeLeftTab, setActiveLeftTab] = useState('instructions'); // instructions | resume | skills
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scorecard Evaluation Form State
  const [ratings, setRatings] = useState({});
  const [evidence, setEvidence] = useState({});
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Load template & existing scorecard for this interviewer
  useEffect(() => {
    if (!isOpen || !session) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const templates = await interviewService.getScorecardTemplates();
        const t = templates.find(x => x.id === session.scorecardTemplateId) || templates[0];
        setTemplate(t);

        // Pre-fill if already submitted or in-progress
        const existing = (session.scorecards || []).find(sc => sc.interviewerId === currentInterviewerId);
        if (existing) {
          setRatings(existing.ratings || {});
          setEvidence(existing.evidence || {});
          setComments(existing.comments || '');
          setRecommendation(existing.recommendation || '');
        }
      } catch (e) {
        console.error('Error loading scorecard template', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isOpen, session, currentInterviewerId]);

  const canSubmit = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SCORECARD_SUBMIT);
  const existingScorecard = (session?.scorecards || []).find(sc => sc.interviewerId === currentInterviewerId);
  const isLocked = !canSubmit || existingScorecard?.isLocked || existingScorecard?.status === FEEDBACK_STATUS.SUBMITTED;

  const handleRatingChange = (critId, score) => {
    if (isLocked) return;
    setRatings(prev => ({ ...prev, [critId]: score }));
  };

  const handleEvidenceChange = (critId, text) => {
    if (isLocked) return;
    setEvidence(prev => ({ ...prev, [critId]: text }));
  };

  const calculateOverallRating = () => {
    if (!template?.criteria?.length) return 0;
    const scores = Object.values(ratings).filter(Boolean).map(Number);
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return (sum / scores.length).toFixed(1);
  };

  const handleSubmitScorecard = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Validate mandatory criteria
    const missingCriteria = (template?.criteria || [])
      .filter(c => c.required && !ratings[c.id])
      .map(c => c.name);

    if (missingCriteria.length > 0) {
      setValidationError(`Please complete required ratings for: ${missingCriteria.join(', ')}`);
      return;
    }

    if (!recommendation) {
      setValidationError('Please select an overall hiring recommendation.');
      return;
    }

    if (!comments.trim()) {
      setValidationError('Please provide summary feedback and justification comments.');
      return;
    }

    setIsSubmitting(true);
    try {
      const overall = calculateOverallRating();
      const updatedSession = await interviewService.submitScorecardFeedback(
        session.id,
        currentInterviewerId,
        {
          recommendation,
          overallRating: overall,
          ratings,
          evidence,
          comments: comments.trim()
        },
        currentInterviewerName
      );

      onScorecardSubmitted(updatedSession);
      onClose();
    } catch (err) {
      console.error('Failed submitting scorecard', err);
      setValidationError(err.message || 'Failed to submit scorecard feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !session || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto" dir="ltr">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-6 text-slate-900 dark:text-slate-100 flex flex-col max-h-[94vh] sm:max-h-[90vh] text-start"
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs font-extrabold shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <Award size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Interview Kit & Scorecard
                </h2>
                {isLocked && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Lock size={10} /> Submitted & Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session.roundName} • {session.candidateName} ({session.requisitionTitle})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {session.meetingUrl && (
              <a
                href={session.meetingUrl}
                target="_blank"
                rel="noreferrer"
                style={{ backgroundColor: brandColor }}
                className="px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
              >
                <Video size={13} />
                <span className="hidden sm:inline">Join Call</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Two-Column Grid Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Kit Dossier (Candidate Snapshot & Instructions) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/40 dark:bg-slate-900/40">
            {/* Left Tabs */}
            <div className="px-4 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-4 overflow-x-auto">
              {[
                { id: 'instructions', label: 'Round Brief' },
                { id: 'resume', label: 'Candidate Resume' },
                { id: 'details', label: 'Key Profile' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLeftTab(tab.id)}
                  style={activeLeftTab === tab.id ? { color: brandColor, borderColor: brandColor } : {}}
                  className={`pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeLeftTab === tab.id 
                      ? 'border-b-2' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Left Content Area */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {activeLeftTab === 'instructions' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-1.5">
                    <div className="font-bold text-blue-900 dark:text-blue-300">
                      Objective of {session.roundName}
                    </div>
                    <p className="text-blue-700 dark:text-blue-400 leading-relaxed">
                      Evaluate core problem-solving ability, architecture design patterns, and state scalability. Focus on practical engineering trade-offs.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white">Suggested Topics & Questions</div>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                      <li>Walk through a high-concurrency state management challenge in React/TypeScript.</li>
                      <li>How do you handle API failure states, retries, and offline caching?</li>
                      <li>Experience with design systems modular component architectures.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Session Logistics</div>
                    <div className="text-slate-500">Duration: {session.duration} minutes • Timezone: {session.timezone}</div>
                    <div className="text-slate-500">Interviewer: {currentInterviewerName}</div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'resume' && (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText size={14} className="text-blue-500" />
                      {session.candidateName}_Resume.pdf
                    </span>
                    <span className="text-[10px] text-slate-400">1.2 MB</span>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white">Summary:</p>
                    <p>7.5+ years experience building enterprise frontend architectures at Stripe & Figma. Expert in React, TypeScript, Next.js, and design token engines.</p>
                  </div>
                </div>
              )}

              {activeLeftTab === 'details' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Current Role</div>
                    <div className="font-bold text-slate-900 dark:text-white">Senior Frontend Architect at Stripe</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Notice Period</div>
                    <div className="font-bold text-slate-900 dark:text-white">30 Days</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Scorecard Rubrics & Submission */}
          <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  Evaluation Rubric ({template?.name || 'Standard Rubric'})
                </h3>
                <p className="text-[11px] text-slate-400">Rate candidate criteria on 1-5 scale with justification</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">
                  Score: {calculateOverallRating()} / 5.0
                </span>
              </div>
            </div>

            {/* Criteria Evaluation Form */}
            <form noValidate onSubmit={handleSubmitScorecard} className="p-4 overflow-y-auto space-y-5 flex-1 text-start">
              {validationError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5 shadow-xs animate-shake">
                  <AlertCircle size={16} className="shrink-0 text-rose-500" />
                  <span className="font-semibold">{validationError}</span>
                </div>
              )}

              {/* Criteria List */}
              <div className="space-y-4">
                {(template?.criteria || []).map((crit, idx) => (
                  <div 
                    key={crit.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/30 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{idx + 1}. {crit.name}</span>
                          {crit.required && <span className="text-rose-500 font-bold">*</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{crit.description}</div>
                      </div>

                      {/* 1-5 Rating Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map(score => {
                          const isSelected = ratings[crit.id] === score;
                          return (
                            <button
                              type="button"
                              key={score}
                              disabled={isLocked}
                              onClick={() => {
                                handleRatingChange(crit.id, score);
                                if (validationError) setValidationError('');
                              }}
                              style={isSelected ? { backgroundColor: brandColor, color: '#fff' } : {}}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'shadow-2xs scale-105'
                                  : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                              }`}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Evidence Input */}
                    <input
                      type="text"
                      disabled={isLocked}
                      value={evidence[crit.id] || ''}
                      onChange={e => handleEvidenceChange(crit.id, e.target.value)}
                      placeholder="Notes / Observed evidence for this rating..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                    />
                  </div>
                ))}
              </div>

              {/* Overall Recommendation */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  Overall Recommendation *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { rec: SCORECARD_RECOMMENDATION.STRONG_YES, color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                    { rec: SCORECARD_RECOMMENDATION.YES, color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/30' },
                    { rec: SCORECARD_RECOMMENDATION.NEUTRAL, color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/30' },
                    { rec: SCORECARD_RECOMMENDATION.NO, color: 'text-rose-600', bg: 'bg-rose-500/10 border-rose-500/30' },
                    { rec: SCORECARD_RECOMMENDATION.STRONG_NO, color: 'text-red-700', bg: 'bg-red-500/10 border-red-500/30' }
                  ].map(item => {
                    const isSelected = recommendation === item.rec;
                    return (
                      <button
                        type="button"
                        key={item.rec}
                        disabled={isLocked}
                        onClick={() => {
                          setRecommendation(item.rec);
                          if (validationError) setValidationError('');
                        }}
                        style={isSelected ? { backgroundColor: brandColor, color: '#fff', borderColor: brandColor } : {}}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'shadow-xs scale-102'
                            : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300`
                        }`}
                      >
                        {item.rec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Comments */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  Summary Justification & Feedback Comments *
                </label>
                <textarea
                  rows={3}
                  disabled={isLocked}
                  value={comments}
                  onChange={e => {
                    setComments(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  placeholder="Summarize candidate technical strengths, areas of improvement, and overall hiring fit justification..."
                  className={`w-full p-3 bg-white dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none resize-none transition-colors ${
                    validationError && !comments.trim()
                      ? 'border-rose-400 dark:border-rose-600 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-brand'
                  }`}
                />
              </div>

              {/* Submit Button (if not locked) */}
              {!isLocked ? (
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ backgroundColor: brandColor }}
                    className="w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-110"
                  >
                    <CheckCircle size={14} />
                    <span>{isSubmitting ? 'Submitting Scorecard...' : 'Submit & Lock Scorecard'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <span>Your scorecard evaluation has been submitted and locked into the candidate audit trail.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default InterviewKitModal;
