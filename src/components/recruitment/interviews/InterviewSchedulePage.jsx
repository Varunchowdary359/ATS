import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, Video, MapPin, Users, AlertTriangle, 
  CheckCircle2, ShieldAlert, Sparkles, Building, ChevronRight, Lock,
  Award, FileText, Check, Layers, AlertCircle, Info, RefreshCw, Send,
  UserCheck, ExternalLink, HelpCircle, Phone, Mail, Briefcase, Star, Copy,
  ShieldCheck, Camera, Mic, Monitor, Maximize, Radio
} from 'lucide-react';
import { 
  ROUND_CATEGORY, 
  INTERVIEW_TYPE, 
  MEETING_PROVIDERS, 
  SESSION_STATUS,
  INTERVIEW_ROLES,
  INTERVIEW_PERMISSIONS,
  ROUND_OUTCOME_DECISION,
  hasInterviewPermission,
  toLocalDateString
} from './interviewTypes';
import { interviewService } from './interviewService';
import { PolicyService } from '../../../services/policy/PolicyService';
import { notificationProviderAdapter, EMAIL_TEMPLATES } from './adapters/notificationProviderAdapter';
import { candidateService } from '../candidates/candidateService';
import { INITIAL_CANDIDATES, INITIAL_APPLICATIONS } from '../candidates/candidateMockData';
import { 
  INITIAL_INTERVIEW_PLANS, 
  INTERVIEWERS_ROSTER, 
  SCORECARD_TEMPLATES 
} from './interviewMockData';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import SearchableSelect from '../../dashboard/shared/SearchableSelect';
import { useToast } from '../../shared/ToastContext';

const TIMEZONES = [
  'America/Los_Angeles (PST)',
  'America/New_York (EST)',
  'America/Chicago (CST)',
  'Europe/London (GMT)',
  'Asia/Kolkata (IST)',
  'Asia/Singapore (SGT)'
];

const DURATIONS = [30, 45, 60, 90, 120];

const PRESET_TIME_SLOTS = ['09:30', '11:00', '14:00', '15:30', '16:30'];

const InterviewSchedulePage = ({
  onBack,
  initialCandidate = null,
  initialApplication = null,
  currentRole = INTERVIEW_ROLES.RECRUITER,
  currentUserContext = {},
  onScheduled = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const { addToast } = useToast();

  const [plans, setPlans] = useState(INITIAL_INTERVIEW_PLANS);
  const [interviewersRoster, setInterviewersRoster] = useState(INTERVIEWERS_ROSTER);
  const [candidatesList, setCandidatesList] = useState(INITIAL_CANDIDATES);
  const [applicationsList, setApplicationsList] = useState(INITIAL_APPLICATIONS);
  const [scorecardTemplates, setScorecardTemplates] = useState(SCORECARD_TEMPLATES);
  const [allSessions, setAllSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Email Notification Preview Tab State
  const [activeEmailTab, setActiveEmailTab] = useState('candidate'); // 'candidate' | 'panel'
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Form State
  const [selectedCandidate, setSelectedCandidate] = useState(() => {
    if (initialCandidate) return initialCandidate;
    const first = INITIAL_CANDIDATES[0];
    const app = INITIAL_APPLICATIONS.find(a => a?.candidateId === first?.id) || first?.primaryApplication;
    return {
      id: first?.id || 'CAND-101',
      name: first?.name || first?.candidateName || 'Sophia Chen',
      email: first?.email || 'sophia.chen@example.com',
      phone: first?.formattedPhone || first?.phone || '+1 (415) 555-0192',
      avatar: first?.avatar || 'SC',
      avatarBg: first?.avatarBg || '#6366f1',
      applicationId: app?.id || initialApplication?.id || `APP-${first?.id || 'CAND-101'}`,
      requisitionId: app?.requisitionId || initialApplication?.requisitionId || 'REQ-2026-001',
      requisitionTitle: app?.jobTitle || initialApplication?.jobTitle || first?.currentTitle || 'Senior Frontend Architect',
      department: app?.department || first?.department || 'Engineering',
      currentCompany: first?.currentCompany || 'Stripe Inc.',
      experienceYears: first?.experienceYears || first?.experienceDisplay || '7.5 Yrs',
      rating: first?.rating || '4.8'
    };
  });
  const [selectedCandidateId, setSelectedCandidateId] = useState(() => initialCandidate?.id || INITIAL_CANDIDATES[0]?.id || 'CAND-101');

  const [selectedPlanId, setSelectedPlanId] = useState(() => INITIAL_INTERVIEW_PLANS[0]?.id || '');
  const [selectedRoundId, setSelectedRoundId] = useState(() => INITIAL_INTERVIEW_PLANS[0]?.rounds?.[0]?.id || '');
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState(['INT-04']);
  const [interviewType, setInterviewType] = useState(INTERVIEW_TYPE.VIDEO);
  const [meetingProvider, setMeetingProvider] = useState(MEETING_PROVIDERS.TEAMS);
  const [customMeetingUrl, setCustomMeetingUrl] = useState('');
  const [location, setLocation] = useState('PeopleWorks HQ, Tower B, Floor 14');
  const [room, setRoom] = useState('Aurora 14A');
  const [candidateInstructions, setCandidateInstructions] = useState('');

  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return toLocalDateString(d);
  });
  const [startTime, setStartTime] = useState('14:00');
  const [duration, setDuration] = useState(60);
  const [timezone, setTimezone] = useState('America/Los_Angeles (PST)');
  const [allowConflictOverride, setAllowConflictOverride] = useState(false);

  // Validation & Conflict State
  const [conflictState, setConflictState] = useState({ hasConflict: false, conflicts: [] });
  const [eligibilityState, setEligibilityState] = useState({ isEligible: true, reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // End time calculation
  const endTime = useMemo(() => {
    if (!startTime) return '15:00';
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + Number(duration);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  }, [startTime, duration]);

  // Load all metadata on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [plansRes, intRes, candsRes, appsRes, scRes, sessRes] = await Promise.allSettled([
          interviewService.getInterviewPlans(),
          interviewService.getInterviewersRoster(),
          candidateService.getCandidates({ 
            pageSize: 100,
            userRole: currentRole || 'recruiter',
            userId: currentUserContext?.id || 'INT-02'
          }),
          candidateService.getApplications(),
          interviewService.getScorecardTemplates(),
          interviewService.getInterviewSessions({ page: 1, pageSize: 500 })
        ]);

        const loadedPlans = plansRes.status === 'fulfilled' && plansRes.value?.length > 0 ? plansRes.value : INITIAL_INTERVIEW_PLANS;
        const loadedInterviewers = intRes.status === 'fulfilled' && intRes.value?.length > 0 ? intRes.value : INTERVIEWERS_ROSTER;
        const rawCands = candsRes.status === 'fulfilled' && Array.isArray(candsRes.value?.data)
          ? candsRes.value.data.filter(Boolean)
          : [];
        let loadedCands = rawCands.length > 0 ? rawCands : INITIAL_CANDIDATES;
        const rawApps = appsRes.status === 'fulfilled' && Array.isArray(appsRes.value)
          ? appsRes.value.filter(Boolean)
          : [];
        let loadedApps = rawApps.length > 0 ? rawApps : INITIAL_APPLICATIONS;
        const loadedTemplates = scRes.status === 'fulfilled' && scRes.value?.length > 0 ? scRes.value : SCORECARD_TEMPLATES;
        const loadedSessions = sessRes.status === 'fulfilled' ? sessRes.value : [];

        setPlans(loadedPlans);
        setInterviewersRoster(loadedInterviewers);
        setCandidatesList(loadedCands);
        setApplicationsList(loadedApps);
        setScorecardTemplates(loadedTemplates);
        setAllSessions(loadedSessions);

        // Resolve active candidate
        let targetCand = initialCandidate;
        if (!targetCand && loadedCands.length > 0) {
          const firstCand = loadedCands[0];
          const app = loadedApps.find(a => a?.candidateId === firstCand?.id) || firstCand?.primaryApplication;
          targetCand = {
            id: firstCand?.id || 'CAND-101',
            name: firstCand?.name || firstCand?.candidateName || 'Sophia Chen',
            email: firstCand?.email || 'sophia.chen@example.com',
            phone: firstCand?.formattedPhone || firstCand?.phone || '+1 (415) 555-0192',
            avatar: firstCand?.avatar || (firstCand?.name ? firstCand.name.substring(0, 2).toUpperCase() : 'SC'),
            avatarBg: firstCand?.avatarBg || '#6366f1',
            applicationId: app?.id || initialApplication?.id || `APP-${firstCand?.id || 'CAND-101'}`,
            requisitionId: app?.requisitionId || initialApplication?.requisitionId || 'REQ-2026-001',
            requisitionTitle: app?.jobTitle || initialApplication?.jobTitle || firstCand?.currentTitle || 'Senior Frontend Architect',
            department: app?.department || firstCand?.department || 'Engineering',
            currentCompany: firstCand?.currentCompany || 'Stripe Inc.',
            experienceYears: firstCand?.experienceYears || firstCand?.experienceDisplay || '7.5 Yrs',
            rating: firstCand?.rating || '4.8'
          };
        }

        if (targetCand) {
          setSelectedCandidate(targetCand);
          setSelectedCandidateId(targetCand?.id || '');

          // Find best matching plan
          const matchedPlan = loadedPlans.find(p => {
            const role = (targetCand?.requisitionTitle || '').toLowerCase();
            if (role.includes('product') || role.includes('manager')) {
              return p?.id === 'PLAN-PM-02';
            }
            return p?.id === 'PLAN-SWE-01';
          }) || loadedPlans[0];

          if (matchedPlan) {
            setSelectedPlanId(matchedPlan?.id || '');
            const validRounds = (matchedPlan?.rounds || []).filter(Boolean);
            setSelectedRoundId(validRounds[0]?.id || '');
          }
        }
      } catch (e) {
        console.error('Error loading schedule workspace metadata', e);
        setCandidatesList(INITIAL_CANDIDATES);
        setApplicationsList(INITIAL_APPLICATIONS);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [initialCandidate, initialApplication, currentRole, currentUserContext]);

  // Handle Switching Candidate
  const handleSelectCandidate = (candId) => {
    setSelectedCandidateId(candId);
    const cand = (candidatesList || []).find(c => c?.id === candId);
    if (!cand) return;

    const app = (applicationsList || []).find(a => a?.candidateId === candId) || cand.primaryApplication;
    const newSelected = {
      id: cand.id,
      name: cand.name || cand.candidateName,
      email: cand.email,
      phone: cand.formattedPhone || cand.phone,
      avatar: cand.avatar || (cand.name ? cand.name.substring(0, 2).toUpperCase() : 'CD'),
      avatarBg: cand.avatarBg || '#6366f1',
      applicationId: app?.id || `APP-${cand.id}`,
      requisitionId: app?.requisitionId || 'REQ-2026-001',
      requisitionTitle: app?.jobTitle || cand.currentTitle || 'Senior Position',
      department: app?.department || cand.department || 'Engineering',
      currentCompany: cand.currentCompany || 'TechCorp',
      experienceYears: cand.experienceYears || '5 Yrs',
      rating: cand.rating || '4.6'
    };
    setSelectedCandidate(newSelected);

    // Auto match plan
    const validPlans = (plans || []).filter(Boolean);
    const matchedPlan = validPlans.find(p => {
      const role = (newSelected.requisitionTitle || '').toLowerCase();
      if (role.includes('product') || role.includes('manager')) {
        return p?.id === 'PLAN-PM-02';
      }
      return p?.id === 'PLAN-SWE-01';
    }) || validPlans[0];

    if (matchedPlan) {
      setSelectedPlanId(matchedPlan.id || '');
      const validRounds = (matchedPlan.rounds || []).filter(Boolean);
      setSelectedRoundId(validRounds[0]?.id || '');
    }
  };

  // Active Plan & Selected Round
  const activePlan = useMemo(() => {
    const validPlans = (plans || []).filter(Boolean);
    return validPlans.find(p => p?.id === selectedPlanId) || validPlans[0] || null;
  }, [plans, selectedPlanId]);

  const activeRound = useMemo(() => {
    const validRounds = (activePlan?.rounds || []).filter(Boolean);
    return validRounds.find(r => r?.id === selectedRoundId) || validRounds[0] || null;
  }, [activePlan, selectedRoundId]);

  // Determine Assigned Policy via multi-level precedence: Round -> Requisition -> Category -> None
  const resolvedPolicyInfo = useMemo(() => {
    return PolicyService.resolvePolicyForInterview({
      roundId: activeRound?.id || selectedRoundId,
      requisitionId: selectedCandidate?.requisitionId,
      roundCategory: activeRound?.category,
      roundSubtype: activeRound?.subtype,
      roundName: activeRound?.name,
      interviewType
    });
  }, [activeRound, selectedRoundId, selectedCandidate, interviewType]);

  const assignedPolicy = resolvedPolicyInfo?.policy || null;

  // Active Scorecard Template for rubric preview
  const activeTemplate = useMemo(() => {
    if (!activeRound?.scorecardTemplateId) return null;
    return (scorecardTemplates || []).find(t => t?.id === activeRound.scorecardTemplateId) || (scorecardTemplates || [])[0] || null;
  }, [scorecardTemplates, activeRound]);

  // Candidate Previous Sessions History
  const candidateSessionHistory = useMemo(() => {
    if (!selectedCandidate?.applicationId) return [];
    return (allSessions || []).filter(Boolean).filter(s => s?.applicationId === selectedCandidate.applicationId);
  }, [allSessions, selectedCandidate]);

  // Live Email Invitation Preview Generator
  const previewCandidateEmail = useMemo(() => {
    return notificationProviderAdapter.generateInterviewEmail({
      type: EMAIL_TEMPLATES.INTERVIEW_INVITATION,
      session: {
        candidateName: selectedCandidate?.name,
        candidateEmail: selectedCandidate?.email,
        candidatePhone: selectedCandidate?.phone,
        roundName: activeRound?.name || 'Interview Round',
        requisitionTitle: selectedCandidate?.requisitionTitle,
        requisitionId: selectedCandidate?.requisitionId,
        scheduledDate,
        startTime,
        endTime,
        duration,
        timezone,
        interviewType,
        meetingProvider,
        meetingUrl: customMeetingUrl || (interviewType === INTERVIEW_TYPE.VIDEO ? 'https://teams.microsoft.com/l/meetup-join/mock-interview-call' : null),
        location,
        room,
        interviewers: (interviewersRoster || []).filter(Boolean).filter(i => (selectedInterviewerIds || []).includes(i?.id))
      },
      candidate: selectedCandidate,
      customInstructions: candidateInstructions,
      companyName: 'PeopleWorks Inc.',
      recruiterName: currentUserContext.name || 'Sarah Jenkins'
    });
  }, [selectedCandidate, activeRound, scheduledDate, startTime, endTime, duration, timezone, interviewType, meetingProvider, customMeetingUrl, location, room, interviewersRoster, selectedInterviewerIds, candidateInstructions, currentUserContext]);

  const previewPanelEmail = useMemo(() => {
    const assigned = (interviewersRoster || []).filter(Boolean).filter(i => (selectedInterviewerIds || []).includes(i?.id));
    const names = assigned.map(a => a?.name || 'Interviewer').join(', ');
    const emails = assigned.map(a => a?.email || `${(a?.name || 'interviewer').toLowerCase().replace(/\s+/g, '.')}@peopleworks.internal`).join('; ');
    const subject = `[Calendar Invite] ${activeRound?.name || 'Interview'} with ${selectedCandidate?.name || 'Candidate'} - ${selectedCandidate?.requisitionTitle || 'Role'}`;
    const body = `Hi ${names || 'Interview Panel'},

You have been scheduled to conduct ${activeRound?.name || 'Round'} for candidate ${selectedCandidate?.name || 'Candidate'} applying for ${selectedCandidate?.requisitionTitle || 'Position'} (${selectedCandidate?.requisitionId || 'REQ'}).

SESSION SCHEDULE:
• Date: ${scheduledDate}
• Time: ${startTime} - ${endTime} (${timezone})
• Duration: ${duration} Minutes
• Format: ${interviewType} (${interviewType === INTERVIEW_TYPE.VIDEO ? (customMeetingUrl || meetingProvider) : (location + (room ? ` Room: ${room}` : ''))})

INTERVIEW KIT & SCORECARD:
• Scorecard Template: ${activeTemplate?.name || 'Standard Technical Rubric'}
• Please access the Interview Kit to review candidate resume and submit your scorecard ratings within 24 hours of session completion.

Best regards,
Talent Operations | PeopleWorks ATS`;

    return {
      recipient: emails || 'panel@peopleworks.internal',
      subject,
      body
    };
  }, [interviewersRoster, selectedInterviewerIds, activeRound, selectedCandidate, scheduledDate, startTime, endTime, duration, timezone, interviewType, customMeetingUrl, meetingProvider, location, room, activeTemplate]);

  const handleCopyEmail = (text) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedEmail(true);
      addToast({ title: 'Email Copied', message: 'Invitation email copied to clipboard.', type: 'info' });
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  // Check Round Eligibility
  useEffect(() => {
    if (!selectedRoundId || !selectedPlanId || !selectedCandidate?.applicationId) return;

    const checkElig = async () => {
      const res = await interviewService.validateRoundEligibility(
        selectedCandidate.applicationId,
        selectedRoundId,
        selectedPlanId
      );
      setEligibilityState(res);
    };
    checkElig();
  }, [selectedRoundId, selectedPlanId, selectedCandidate]);

  // Real-time Conflict Detection
  useEffect(() => {
    if (!scheduledDate || !startTime || !endTime || selectedInterviewerIds.length === 0) return;

    const check = async () => {
      const res = await interviewService.checkAvailabilityAndConflicts({
        interviewerIds: selectedInterviewerIds,
        date: scheduledDate,
        startTime,
        endTime,
        timezone
      });
      setConflictState(res);
    };
    check();
  }, [selectedInterviewerIds, scheduledDate, startTime, endTime, timezone]);

  const toggleInterviewer = (id) => {
    setSelectedInterviewerIds(prev => 
      prev.includes(id) 
        ? prev.length > 1 ? prev.filter(x => x !== id) : prev 
        : [...prev, id]
    );
  };

  const canOverride = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.PREREQUISITE_CONFLICT_OVERRIDE);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitError('');

    if (!eligibilityState.isEligible && !allowConflictOverride) {
      setSubmitError(eligibilityState.reason || 'This round is currently ineligible to schedule.');
      addToast({ title: 'Eligibility Error', message: eligibilityState.reason, type: 'error' });
      return;
    }

    if (conflictState.hasConflict && !allowConflictOverride) {
      setSubmitError(conflictState.conflicts[0]?.message || 'Scheduling conflict detected.');
      addToast({ title: 'Schedule Conflict', message: 'Please resolve time overlap or use override.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedInterviewers = interviewersRoster
        .filter(i => selectedInterviewerIds.includes(i.id))
        .map((int, idx) => ({ ...int, isLead: idx === 0 }));

      const actorName = currentUserContext.name 
        ? `${currentUserContext.name} (${currentUserContext.title || 'Recruiter'})` 
        : 'Sarah Jenkins (Recruiter)';

      const session = await interviewService.scheduleInterviewSession({
        applicationId: selectedCandidate.applicationId,
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.name,
        candidateEmail: selectedCandidate.email,
        candidateAvatar: selectedCandidate.avatar,
        candidateAvatarBg: selectedCandidate.avatarBg,
        requisitionId: selectedCandidate.requisitionId,
        requisitionTitle: selectedCandidate.requisitionTitle,
        department: selectedCandidate.department,
        planId: selectedPlanId,
        roundId: selectedRoundId,
        roundName: activeRound?.name || 'Interview Round',
        roundCategory: activeRound?.category || ROUND_CATEGORY.INTERVIEW,
        roundSubtype: activeRound?.subtype || 'Technical Interview',
        roundSequence: activeRound?.sequence || 1,
        scheduledDate,
        startTime,
        endTime,
        duration,
        timezone,
        interviewType,
        meetingProvider,
        meetingUrl: customMeetingUrl || null,
        location: interviewType === INTERVIEW_TYPE.IN_PERSON ? location : null,
        interviewers: assignedInterviewers,
        scorecardTemplateId: activeRound?.scorecardTemplateId || 'SCT-TECH-01',
        allowConflictOverride,
        candidateInstructions,
        // Policy Association
        policyId: assignedPolicy?.id || null,
        policyVersion: assignedPolicy?.version || null,
        policyName: assignedPolicy?.name || null,
        policyType: assignedPolicy?.type || null,
        policyAssignmentSource: resolvedPolicyInfo?.source || 'none',
        policyRequired: !!assignedPolicy?.required,
        candidatePolicyRequired: !!assignedPolicy?.rules?.candidateAcknowledgement?.required,
        interviewerPolicyRequired: !!assignedPolicy?.rules?.interviewerAcknowledgement?.required
      }, actorName);

      onScheduled(session);
      addToast({
        title: 'Interview Scheduled & Dispatched',
        message: `${session.roundName} scheduled for ${session.candidateName}. Calendar invites generated.`,
        type: 'success'
      });
      onBack();
    } catch (err) {
      console.error('Failed to schedule session', err);
      setSubmitError(err.message || 'Could not schedule interview session.');
      addToast({ title: 'Scheduling Failed', message: err.message || 'Error occurred.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-16 text-slate-900 dark:text-slate-100 font-sans space-y-6 text-start">
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP GLASSMORPHIC ACTION HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4.5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-3.5 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Schedule Interview Session
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Orchestrator Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>Interviews</span>
                <span>/</span>
                <span>Schedule Session</span>
                <span>/</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedCandidate?.name || 'Candidate'}</span>
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onBack}
              className="h-9 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>

            <motion.button 
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (!eligibilityState.isEligible && !allowConflictOverride)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ backgroundColor: brandColor }}
              className="h-9.5 px-5 text-xs font-extrabold text-white rounded-xl shadow-md hover:brightness-110 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Dispatching Invites...</span>
              ) : (
                <>
                  <Send size={15} />
                  <span>Confirm &amp; Dispatch Invites</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. MAIN 2-COLUMN SPLIT STUDIO WORKSPACE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT CANVAS (65% / 8 Cols): Scheduling Form & Interactive Steppers */}
        <div className="lg:col-span-8 space-y-6">

          {/* STEP 1: Candidate & Requisition Context Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Target Candidate &amp; Requisition Application
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {candidatesList.length} Active Applicants
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Candidate <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <SearchableSelect
                  value={selectedCandidateId}
                  onChange={handleSelectCandidate}
                  options={(candidatesList || []).filter(Boolean).map(c => ({
                    value: c?.id || '',
                    label: `${c?.name || c?.candidateName || 'Candidate'} • ${c?.currentTitle || c?.appliedRole || 'Applicant'}`,
                    subtext: `${c?.email || ''} ${c?.requisitionId ? `• ${c.requisitionId}` : ''}`
                  }))}
                  placeholder="Search and select candidate..."
                />
              </div>

              {selectedCandidate && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-white dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100/80 dark:border-blue-900/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-2xs shrink-0"
                      style={{ backgroundColor: selectedCandidate.avatarBg || brandColor }}
                    >
                      {selectedCandidate.avatar || 'CD'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {selectedCandidate.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {selectedCandidate.requisitionId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {selectedCandidate.requisitionTitle} • {selectedCandidate.department}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        App ID: {selectedCandidate.applicationId}
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end shrink-0 text-right text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {selectedCandidate.email}
                    </span>
                    <span className="text-slate-400 mt-0.5">
                      {selectedCandidate.phone || 'Phone verified'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* STEP 2: Interview Plan & Sequential Round Stepper */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Interview Plan &amp; Sequential Progression
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {activePlan?.rounds?.length || 0} Configured Rounds
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Interview Plan <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <CustomSelect
                  value={selectedPlanId}
                  onChange={(planId) => {
                    setSelectedPlanId(planId);
                    const p = plans.find(x => x?.id === planId);
                    const validRounds = (p?.rounds || []).filter(Boolean);
                    if (validRounds.length) {
                      setSelectedRoundId(validRounds[0]?.id || '');
                    }
                  }}
                  options={plans.filter(Boolean).map(p => ({
                    value: p?.id || '',
                    label: `${p?.name || 'Plan'} (${(p?.rounds || []).filter(Boolean).length} Rounds)`
                  }))}
                  size="md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Evaluation Round <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <CustomSelect
                  value={selectedRoundId}
                  onChange={(rndId) => setSelectedRoundId(rndId)}
                  options={(activePlan?.rounds || []).filter(Boolean).map(r => ({
                    value: r?.id || '',
                    label: `Round ${r?.sequence || ''}: ${r?.name || ''} (${r?.category || ''})`
                  }))}
                  size="md"
                />
              </div>
            </div>

            {/* Visual Round Progression Stepper */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Plan Round Progression Stepper
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(activePlan?.rounds || []).filter(Boolean).map((round, idx) => {
                  if (!round || !round.id) return null;
                  const isSelected = round.id === selectedRoundId;
                  const isPassed = candidateSessionHistory.some(s => s?.roundId === round.id && s?.roundOutcome === ROUND_OUTCOME_DECISION.PASS);
                  const isFailed = candidateSessionHistory.some(s => s?.roundId === round.id && s?.roundOutcome === ROUND_OUTCOME_DECISION.FAIL);

                  return (
                    <button
                      type="button"
                      key={round.id || `round-${idx}`}
                      onClick={() => setSelectedRoundId(round.id)}
                      style={isSelected ? { borderColor: brandColor, backgroundColor: 'color-mix(in srgb, var(--pw-brand) 6%, transparent)' } : {}}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'border-2 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400">
                          Round {round.sequence || idx + 1}
                        </span>
                        {isPassed && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-0.5">
                            <Check size={10} /> Passed
                          </span>
                        )}
                        {isFailed && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            Failed
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {round.name || 'Round'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{round.category || 'Interview'}</span>
                        <span>•</span>
                        <span>{round.duration || 60}m</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Eligibility Banner */}
            {eligibilityState.isEligible ? (
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Prerequisites satisfied. This round is fully eligible for scheduling.</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span>Prerequisite Notification</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 pl-6">
                  {eligibilityState.reason}
                </p>
                {canOverride && (
                  <label className="flex items-center gap-2 pl-6 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowConflictOverride}
                      onChange={e => setAllowConflictOverride(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Authorized Override: Allow scheduling out-of-order ({currentUserContext.title || 'HR / Admin'})</span>
                  </label>
                )}
              </div>
            )}

            {/* Assigned Policy & Integrity Rules Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/60 via-slate-50 to-indigo-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Assigned Assessment &amp; Interview Policy
                  </span>
                </div>
                {assignedPolicy ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {resolvedPolicyInfo.source === 'round' ? 'Round Precedence' : resolvedPolicyInfo.source === 'requisition' ? 'Requisition Precedence' : 'Category Standard'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {assignedPolicy.version}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    No policy assigned
                  </span>
                )}
              </div>

              {assignedPolicy ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {assignedPolicy.name}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
                    <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${assignedPolicy.rules.camera?.required ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold' : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Cam: {assignedPolicy.rules.camera?.required ? '✓ Req' : '— Opt'}</span>
                    </div>
                    <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${assignedPolicy.rules.microphone?.required ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold' : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Mic: {assignedPolicy.rules.microphone?.required ? '✓ Req' : '— Opt'}</span>
                    </div>
                    <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${assignedPolicy.rules.screenShare?.required ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold' : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Screen: {assignedPolicy.rules.screenShare?.required ? '✓ Req' : '— Opt'}</span>
                    </div>
                    <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${assignedPolicy.rules.fullscreen?.required ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold' : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                      <Maximize className="w-3.5 h-3.5" />
                      <span>Fullscr: {assignedPolicy.rules.fullscreen?.required ? '✓ Req' : '— Opt'}</span>
                    </div>
                    <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${assignedPolicy.rules.recording?.enabled ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold' : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                      <Radio className="w-3.5 h-3.5" />
                      <span>Rec: {assignedPolicy.rules.recording?.enabled ? '✓ Active' : '✕ Off'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  No policy assigned for this round. Standard unmonitored interview guidelines will apply.
                </p>
              )}

              {/* Development Diagnostic Metadata Pill */}
              <div className="pt-2 border-t border-indigo-100/70 dark:border-indigo-900/30 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span><strong className="text-slate-500 dark:text-slate-400">Req:</strong> {selectedCandidate?.requisitionId || 'None'}</span>
                <span>•</span>
                <span><strong className="text-slate-500 dark:text-slate-400">Round:</strong> {activeRound?.id || selectedRoundId || 'None'}</span>
                <span>•</span>
                <span><strong className="text-slate-500 dark:text-slate-400">Category:</strong> {activeRound?.category || 'None'}</span>
                <span>•</span>
                <span><strong className="text-slate-500 dark:text-slate-400">Type:</strong> {interviewType || 'Video'}</span>
                <span>•</span>
                <span><strong className="text-slate-500 dark:text-slate-400">Source:</strong> {resolvedPolicyInfo?.source || 'none'}</span>
                {assignedPolicy && (
                  <>
                    <span>•</span>
                    <span><strong className="text-slate-500 dark:text-slate-400">Policy:</strong> {assignedPolicy.id} ({assignedPolicy.version})</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* STEP 3: Panel Selection & Visual Time-Slot Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Assign Interviewers &amp; Calendar Time Slots
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {selectedInterviewerIds.length} Panelists Selected
              </span>
            </div>

            {/* Panel Selector Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Assign Interviewer(s) / Panel (Select at least 1) <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(interviewersRoster || []).filter(Boolean).map((int, idx) => {
                  if (!int || !int.id) return null;
                  const isSelected = (selectedInterviewerIds || []).includes(int.id);
                  const isLead = isSelected && selectedInterviewerIds[0] === int.id;

                  return (
                    <button
                      type="button"
                      key={int.id || `int-${idx}`}
                      onClick={() => toggleInterviewer(int.id)}
                      style={isSelected ? { borderColor: brandColor, backgroundColor: 'color-mix(in srgb, var(--pw-brand) 6%, transparent)' } : {}}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected 
                          ? 'border-2 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-2xs"
                        style={{ backgroundColor: int.avatarBg || '#0284c7' }}
                      >
                        {int.avatar || 'INT'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {int.name || 'Interviewer'}
                          </span>
                          {isLead && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              Lead
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {int.title || 'Interviewer'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date, Time & Quick Slot Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Interview Date <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Start Time <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Duration <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <CustomSelect
                  value={duration}
                  onChange={val => setDuration(Number(val))}
                  options={DURATIONS.map(d => ({
                    value: d,
                    label: `${d} Mins (${endTime})`
                  }))}
                  size="md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Timezone <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <CustomSelect
                  value={timezone}
                  onChange={val => setTimezone(val)}
                  options={TIMEZONES.map(tz => ({
                    value: tz,
                    label: tz
                  }))}
                  size="md"
                />
              </div>
            </div>

            {/* Recommended Time Slots Bar */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs font-bold text-slate-500">Quick Slots:</span>
              {PRESET_TIME_SLOTS.map(slot => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setStartTime(slot)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    startTime === slot 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            {/* Conflict Warning Alert (Enterprise Specification Section 16 & 17) */}
            {conflictState.hasConflict && (() => {
              const firstConf = conflictState.conflicts[0] || {};
              const isInterviewerConflict = firstConf.type === 'INTERVIEWER_OVERLAP';

              return (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-200">
                      <AlertTriangle size={17} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-sm">
                        {isInterviewerConflict ? '⚠ Interviewer Scheduling Conflict' : '⚠ Candidate Schedule Conflict'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100">
                      {scheduledDate} • {startTime}–{endTime}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/80 dark:bg-slate-900/70 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Existing Interview:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {firstConf.candidateName || 'Scheduled Candidate'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {firstConf.roundName || 'Interview'} ({firstConf.time || `${startTime}–${endTime}`})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Requested Interview:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {selectedCandidate?.name || 'New Candidate'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {activeRound?.name || 'Interview Round'} ({startTime}–{endTime})
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    {firstConf.message}
                  </p>

                  {/* Quick Resolution Actions */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const [h, m] = startTime.split(':').map(Number);
                        const nextH = (h + 1) % 24;
                        setStartTime(`${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-colors cursor-pointer shadow-2xs"
                    >
                      Choose Another Time (+1h)
                    </button>

                    {isInterviewerConflict && (
                      <button
                        type="button"
                        onClick={() => {
                          const available = interviewersRoster.find(i => !selectedInterviewerIds.includes(i.id));
                          if (available) {
                            setSelectedInterviewerIds([available.id]);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-colors cursor-pointer shadow-2xs"
                      >
                        Choose Another Interviewer
                      </button>
                    )}
                  </div>

                  {canOverride ? (
                    <label className="flex items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-900/40 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowConflictOverride}
                        onChange={e => setAllowConflictOverride(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Authorized Override: Force schedule despite calendar overlap ({currentUserContext.title || 'HR / Admin'})</span>
                    </label>
                  ) : (
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-900/40 text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Lock size={12} />
                      <span>Calendar conflict override requires HR / Admin governance permissions.</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>

          {/* STEP 4: Delivery Method & Logistics */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Interview Delivery Method &amp; Candidate Instructions
                </h2>
              </div>
            </div>

            {/* Delivery Method Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: INTERVIEW_TYPE.VIDEO, icon: Video, desc: 'Teams / Meet / Zoom' },
                { type: INTERVIEW_TYPE.IN_PERSON, icon: Building, desc: 'Office / Conference Room' },
                { type: INTERVIEW_TYPE.PHONE, icon: Users, desc: 'Direct Phone Screen' }
              ].map(item => {
                const isSelected = interviewType === item.type;
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => setInterviewType(item.type)}
                    style={isSelected ? { borderColor: brandColor, backgroundColor: 'color-mix(in srgb, var(--pw-brand) 8%, transparent)' } : {}}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected ? 'border-2 shadow-xs' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} className="text-slate-600 dark:text-slate-300 mb-1.5" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.type}</div>
                    <div className="text-[10px] text-slate-400">{item.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Provider Conditional details */}
            {interviewType === INTERVIEW_TYPE.VIDEO && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Virtual Meeting Provider *
                  </label>
                  <CustomSelect
                    value={meetingProvider}
                    onChange={val => setMeetingProvider(val)}
                    options={[
                      { value: MEETING_PROVIDERS.TEAMS, label: 'Microsoft Teams (Auto Link)' },
                      { value: MEETING_PROVIDERS.GOOGLE_MEET, label: 'Google Meet (Auto Link)' },
                      { value: MEETING_PROVIDERS.ZOOM, label: 'Zoom Video (Auto Link)' },
                      { value: MEETING_PROVIDERS.CUSTOM, label: 'Custom URL Link' }
                    ]}
                    size="md"
                  />
                </div>

                {meetingProvider === MEETING_PROVIDERS.CUSTOM && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Custom Video Link URL
                    </label>
                    <input
                      type="url"
                      value={customMeetingUrl}
                      onChange={e => setCustomMeetingUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {interviewType === INTERVIEW_TYPE.IN_PERSON && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Location Address *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Room / Floor
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Candidate Instructions */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Special Instructions for Candidate (Included in Invite)
              </label>
              <textarea
                rows={2}
                value={candidateInstructions}
                onChange={e => setCandidateInstructions(e.target.value)}
                placeholder="E.g., Please join 5 minutes early, have your IDE open, and be prepared for interactive system design..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
              />
            </div>
          </motion.div>

        </div>

        {/* RIGHT SPOTLIGHT SIDEBAR (35% / 4 Cols): Dossier, Rubric Preview & Audit Preview */}
        <div className="lg:col-span-4 space-y-6">

          {/* Candidate Dossier Summary */}
          {selectedCandidate && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Briefcase size={14} className="text-blue-600" />
                <span>Candidate Dossier</span>
              </div>

              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-2xs shrink-0"
                  style={{ backgroundColor: selectedCandidate.avatarBg || brandColor }}
                >
                  {selectedCandidate.avatar || 'CD'}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {selectedCandidate.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedCandidate.requisitionTitle}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[10px] text-slate-400">Department</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{selectedCandidate.department}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[10px] text-slate-400">Application ID</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">{selectedCandidate.applicationId}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Previous Rounds Evaluation History */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Award size={14} className="text-purple-600" />
                <span>Rounds History</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {candidateSessionHistory.length} Sessions
              </span>
            </div>

            {candidateSessionHistory.length > 0 ? (
              <div className="space-y-2">
                {(candidateSessionHistory || []).filter(Boolean).map((sess, i) => (
                  <div key={sess.id || i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{sess.roundName || 'Round'}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        sess.roundOutcome === ROUND_OUTCOME_DECISION.PASS 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {sess.roundOutcome || sess.status || 'Completed'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{sess.scheduledDate || '—'}</span>
                      <span>{sess.feedbackStatus || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400 italic">
                Initial round for this application. No previous sessions recorded.
              </div>
            )}
          </motion.div>

          {/* LIVE EMAIL & CALENDAR INVITE PREVIEW STUDIO */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Mail size={13} />
                </div>
                <span>Live Invite & Notification Studio</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Auto-Dispatched
              </span>
            </div>

            {/* Notification Recipient Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveEmailTab('candidate')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeEmailTab === 'candidate'
                    ? 'text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                style={activeEmailTab === 'candidate' ? { backgroundColor: brandColor } : {}}
              >
                <UserCheck size={12} />
                <span>Candidate Email</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveEmailTab('panel')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeEmailTab === 'panel'
                    ? 'text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                style={activeEmailTab === 'panel' ? { backgroundColor: brandColor } : {}}
              >
                <Calendar size={12} />
                <span>Panelist Invite</span>
              </button>
            </div>

            {/* Email Header Preview Metadata */}
            {activeEmailTab === 'candidate' ? (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">To (Candidate):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[190px]">
                      {previewCandidateEmail.recipient}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-slate-400 font-medium">Subject:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={previewCandidateEmail.subject}>
                      {previewCandidateEmail.subject}
                    </span>
                  </div>
                </div>

                {/* Body Viewer */}
                <div className="relative group">
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/70 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-[190px] overflow-y-auto leading-relaxed select-text custom-scrollbar">
                    {previewCandidateEmail.body}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(previewCandidateEmail.body)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 shadow-2xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold"
                  >
                    {copiedEmail ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">To (Panelists):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[190px]">
                      {previewPanelEmail.recipient}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-slate-400 font-medium">Subject:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={previewPanelEmail.subject}>
                      {previewPanelEmail.subject}
                    </span>
                  </div>
                </div>

                {/* Body Viewer */}
                <div className="relative group">
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/70 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-[190px] overflow-y-auto leading-relaxed select-text custom-scrollbar">
                    {previewPanelEmail.body}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(previewPanelEmail.body)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 shadow-2xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold"
                  >
                    {copiedEmail ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-1">
              <Info size={11} className="text-blue-500 shrink-0" />
              <span>Real-time email and calendar .ics invites are triggered upon clicking Schedule Interview.</span>
            </div>
          </motion.div>

          {/* Active Scorecard Rubric Preview */}
          {activeTemplate && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  <Star size={14} className="text-amber-500" />
                  <span>Scorecard Rubric Preview</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  {activeTemplate.id}
                </span>
              </div>

              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {activeTemplate.name}
              </div>

              <div className="space-y-1.5 pt-1">
                {(activeTemplate.criteria || []).filter(Boolean).map((crit, idx) => (
                  <div key={crit.id || idx} className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{crit.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{crit.description}</div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
                      {crit.weight}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Enterprise Audit & Governance Notice */}
          <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
              <ShieldAlert size={14} />
              <span>Audit &amp; Traceability Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This action generates an immutable audit record tied to Application ID <code className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1 py-0.5 rounded">{selectedCandidate?.applicationId || 'APP'}</code>.
            </p>
            <p className="text-[10px] italic text-slate-400 pt-1">
              Immutable audit trail supporting enterprise compliance, governance, and traceability.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default InterviewSchedulePage;
