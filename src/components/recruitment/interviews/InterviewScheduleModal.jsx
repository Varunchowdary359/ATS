import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, Video, MapPin, Users, AlertTriangle, 
  CheckCircle2, ShieldAlert, Sparkles, Building, ChevronRight, Lock,
  ShieldCheck, Camera, Mic, Monitor, Maximize, Radio
} from 'lucide-react';
import { 
  ROUND_CATEGORY, 
  INTERVIEW_TYPE, 
  MEETING_PROVIDERS, 
  SESSION_STATUS,
  INTERVIEW_ROLES,
  INTERVIEW_PERMISSIONS,
  hasInterviewPermission,
  toLocalDateString
} from './interviewTypes';
import { interviewService } from './interviewService';
import { candidateService } from '../candidates/candidateService';
import { PolicyService } from '../../../services/policy/PolicyService';
import { INITIAL_CANDIDATES, INITIAL_APPLICATIONS } from '../candidates/candidateMockData';
import { INITIAL_INTERVIEW_PLANS, INTERVIEWERS_ROSTER } from './interviewMockData';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import SearchableSelect from '../../dashboard/shared/SearchableSelect';

const TIMEZONES = [
  'America/Los_Angeles (PST)',
  'America/New_York (EST)',
  'America/Chicago (CST)',
  'Europe/London (GMT)',
  'Asia/Kolkata (IST)',
  'Asia/Singapore (SGT)'
];

const DURATIONS = [30, 45, 60, 90, 120];

const InterviewScheduleModal = ({
  isOpen,
  onClose,
  onScheduled,
  initialCandidate = null,
  initialApplication = null,
  currentRole = INTERVIEW_ROLES.RECRUITER,
  currentUserContext = {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [plans, setPlans] = useState(INITIAL_INTERVIEW_PLANS);
  const [interviewersRoster, setInterviewersRoster] = useState(INTERVIEWERS_ROSTER);
  const [candidatesList, setCandidatesList] = useState(INITIAL_CANDIDATES);
  const [applicationsList, setApplicationsList] = useState(INITIAL_APPLICATIONS);
  const [isLoading, setIsLoading] = useState(true);

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
      department: app?.department || first?.department || 'Engineering'
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

  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return toLocalDateString(d);
  });
  const [startTime, setStartTime] = useState('14:00');
  const [duration, setDuration] = useState(60);
  const [timezone, setTimezone] = useState('America/Los_Angeles (PST)');
  const [allowConflictOverride, setAllowConflictOverride] = useState(false);
  const [candidateInstructions, setCandidateInstructions] = useState('');


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

  // Load plans, interviewers, candidates & applications
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [plansRes, intRes, candsRes, appsRes] = await Promise.allSettled([
          interviewService.getInterviewPlans(),
          interviewService.getInterviewersRoster(),
          candidateService.getCandidates({ 
            pageSize: 100,
            userRole: currentRole || 'recruiter',
            userId: currentUserContext?.id || 'INT-02'
          }),
          candidateService.getApplications()
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

        setPlans(loadedPlans);
        setInterviewersRoster(loadedInterviewers);
        setCandidatesList(loadedCands);
        setApplicationsList(loadedApps);

        // Resolve candidate to schedule
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
            department: app?.department || firstCand?.department || 'Engineering'
          };
        }

        if (targetCand) {
          setSelectedCandidate(targetCand);
          setSelectedCandidateId(targetCand?.id || '');

          // Find best matching plan (e.g. PM vs SWE)
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
        console.error('Error loading schedule metadata', e);
        setCandidatesList(INITIAL_CANDIDATES);
        setApplicationsList(INITIAL_APPLICATIONS);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isOpen, initialCandidate, initialApplication, currentRole, currentUserContext]);

  // Handle Switching Candidate
  const handleSelectCandidate = (candId) => {
    setSelectedCandidateId(candId);
    const cand = candidatesList.find(c => c.id === candId);
    if (!cand) return;

    const app = applicationsList.find(a => a.candidateId === candId) || cand.primaryApplication;
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
      department: app?.department || cand.department || 'Engineering'
    };
    setSelectedCandidate(newSelected);

    // Auto switch to relevant plan and default to Round 1
    const matchedPlan = plans.find(p => {
      const role = (newSelected.requisitionTitle || '').toLowerCase();
      if (role.includes('product') || role.includes('manager')) {
        return p.id === 'PLAN-PM-02';
      }
      return p.id === 'PLAN-SWE-01';
    }) || plans[0];

    if (matchedPlan) {
      setSelectedPlanId(matchedPlan.id);
      setSelectedRoundId(matchedPlan.rounds?.[0]?.id || '');
    }
  };

  // Active Plan & Selected Round
  const activePlan = useMemo(() => {
    return plans.filter(Boolean).find(p => p?.id === selectedPlanId) || plans.filter(Boolean)[0] || null;
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

  // Check Round Eligibility whenever round changes
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
    if (!scheduledDate || !startTime || !endTime || (!selectedInterviewerIds.length && !selectedCandidate?.id)) return;

    const check = async () => {
      const res = await interviewService.checkAvailabilityAndConflicts({
        candidateId: selectedCandidate?.id,
        interviewerIds: selectedInterviewerIds,
        date: scheduledDate,
        startTime,
        endTime,
        timezone
      });
      setConflictState(res);
    };
    check();
  }, [selectedInterviewerIds, selectedCandidate, scheduledDate, startTime, endTime, timezone]);

  const toggleInterviewer = (id) => {
    setSelectedInterviewerIds(prev => 
      prev.includes(id) 
        ? prev.length > 1 ? prev.filter(x => x !== id) : prev 
        : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!eligibilityState.isEligible && !allowConflictOverride) {
      setSubmitError(eligibilityState.reason || 'This round is currently ineligible to schedule.');
      return;
    }

    if (conflictState.hasConflict && !allowConflictOverride) {
      setSubmitError(conflictState.conflicts[0]?.message || 'Scheduling conflict detected.');
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedInterviewers = interviewersRoster
        .filter(i => selectedInterviewerIds.includes(i.id))
        .map((int, idx) => ({ ...int, isLead: idx === 0 }));

      const session = await interviewService.scheduleInterviewSession({
        applicationId: selectedCandidate.applicationId,
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.name,
        candidateEmail: selectedCandidate.email,
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
        room: interviewType === INTERVIEW_TYPE.IN_PERSON ? room : null,
        interviewers: assignedInterviewers,
        scorecardTemplateId: activeRound?.scorecardTemplateId || 'SCT-TECH-01',
        candidateInstructions: candidateInstructions.trim(),
        allowConflictOverride
      }, currentUserContext.name ? `${currentUserContext.name} (${currentUserContext.title || 'Recruiter'})` : 'Sarah Jenkins (Recruiter)');


      onScheduled(session);
      onClose();
    } catch (err) {
      console.error('Failed to schedule session', err);
      setSubmitError(err.message || 'Could not schedule interview session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto" dir="ltr">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 text-slate-900 dark:text-slate-100 text-start"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <Calendar size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Schedule Interview Session
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Configure eligible round, assign panelists, and verify calendar availability
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[75vh] overflow-y-auto">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <div>
                <span className="font-bold">Cannot Schedule: </span>
                {submitError}
              </div>
            </div>
          )}

          {/* 1. Candidate Selection & Target Requisition Snapshot */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Select Candidate to Schedule <span className="text-red-500 font-bold ml-0.5">*</span></span>
                <span className="text-[11px] font-normal text-slate-400">
                  {candidatesList.length} Active Candidates
                </span>
              </label>
              <SearchableSelect
                value={selectedCandidateId}
                onChange={handleSelectCandidate}
                options={candidatesList.map(c => {
                  const app = applicationsList.find(a => a.candidateId === c.id) || c.primaryApplication;
                  return {
                    value: c.id,
                    label: `${c.name || c.candidateName}`,
                    subtext: app ? `${app.jobTitle || app.requisitionTitle} • ${app.requisitionId || ''}` : (c.currentTitle || 'Talent Pool')
                  };
                })}
                placeholder="Search candidate by name, email, or role..."
                size="md"
              />
            </div>

            {/* Candidate & Target Requisition Snapshot */}
            {selectedCandidate && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl text-white font-extrabold flex items-center justify-center text-sm shadow-2xs"
                    style={{ backgroundColor: selectedCandidate.avatarBg || '#6366f1' }}
                  >
                    {selectedCandidate.avatar || (selectedCandidate.name ? selectedCandidate.name.split(' ').map(n=>n[0]).join('') : 'CD')}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-400">{selectedCandidate.id} • {selectedCandidate.applicationId}</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedCandidate.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{selectedCandidate.email}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {selectedCandidate.requisitionId || 'REQ-2026-001'}
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedCandidate.requisitionTitle || 'Senior Position'}</div>
                  <div className="text-[11px] text-slate-400">{selectedCandidate.department || 'Engineering'}</div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Select Plan & Dynamic Round */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Interview Plan <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <SearchableSelect
                value={selectedPlanId}
                onChange={val => {
                  setSelectedPlanId(val);
                  const p = plans.find(x => x?.id === val);
                  const validRounds = (p?.rounds || []).filter(Boolean);
                  if (validRounds[0]) setSelectedRoundId(validRounds[0].id);
                }}
                options={plans.filter(Boolean).map(p => ({
                  value: p?.id || '',
                  label: p?.name || 'Plan',
                  subtext: `${(p?.rounds || []).filter(Boolean).length} Rounds • ${p?.targetRole || 'Engineering'}`
                }))}
                size="md"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Interview Round <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <CustomSelect
                value={selectedRoundId}
                onChange={val => setSelectedRoundId(val)}
                options={(activePlan?.rounds || []).filter(Boolean).map(r => ({
                  value: r?.id || '',
                  label: `Round ${r?.sequence || ''}: ${r?.name || ''} (${r?.category || ''})`
                }))}
                size="md"
              />
            </div>
          </div>

          {/* Prerequisite & Eligibility Alert */}
          {!eligibilityState.isEligible ? (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
              <Lock size={15} className="text-amber-600 shrink-0" />
              <span>{eligibilityState.reason}</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Prerequisites satisfied. This round is fully eligible for scheduling.</span>
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

          {/* 3. Assign Interviewer(s) / Panel */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Assign Interviewer(s) / Panel (Select at least 1) <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(interviewersRoster || []).filter(Boolean).map(int => {
                if (!int || !int.id) return null;
                const isSelected = (selectedInterviewerIds || []).includes(int.id);
                return (
                  <button
                    type="button"
                    key={int.id}
                    onClick={() => toggleInterviewer(int.id)}
                    style={isSelected ? { borderColor: brandColor, backgroundColor: 'color-mix(in srgb, var(--pw-brand) 8%, transparent)' } : {}}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: int.avatarBg || '#6366f1' }}
                    >
                      {int.avatar || 'INT'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{int.name || 'Interviewer'}</div>
                      <div className="text-[10px] text-slate-500 truncate">{int.title || 'Interviewer'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Date, Time, Duration & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Date <span className="text-red-500 font-bold ml-0.5">*</span>
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
                  label: `${d} Minutes (${endTime})`
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

          {/* 5. Conflict Check Status Alert (Enterprise Specification Section 16 & 17) */}
          {conflictState.hasConflict && (() => {
            const canOverride = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.PREREQUISITE_CONFLICT_OVERRIDE);
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
                      // Bump time slot by duration
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
                        // Switch to another available interviewer
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

          {/* 6. Interview Type & Meeting Details */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Interview Delivery Method <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
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
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <Icon size={16} className="text-slate-600 dark:text-slate-300 mb-1" />
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
          </div>

          {/* 7. Automatic Email Notification & Optional Custom Instructions */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3">
              <Sparkles size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Automatic Candidate Email Notification
                </div>
                <p className="text-[11px] text-blue-700/90 dark:text-blue-300 leading-relaxed">
                  Upon confirmation, an interview invitation email with the calendar schedule, {interviewType === INTERVIEW_TYPE.VIDEO ? 'meeting link' : interviewType === INTERVIEW_TYPE.IN_PERSON ? 'office location' : 'phone screen details'}, and preparation guidelines will be automatically dispatched to <strong className="font-semibold text-blue-950 dark:text-white">{selectedCandidate?.email || 'the candidate'}</strong>.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Special Instructions / Message to Candidate <span className="text-slate-400 font-normal">(Optional)</span></span>
                <span className="text-[10px] text-slate-400">Included in the email body</span>
              </label>
              <textarea
                rows={3}
                value={candidateInstructions}
                onChange={e => setCandidateInstructions(e.target.value)}
                placeholder="E.g., Please bring a copy of your portfolio, review our system design overview doc, or prepare a 10-minute code walkthrough..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>
          </div>
        </form>


        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!eligibilityState.isEligible && !allowConflictOverride)}
            style={{ backgroundColor: brandColor }}
            className="px-4 sm:px-5 py-2 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
          >
            {isSubmitting ? (
              <span>Scheduling...</span>
            ) : (
              <>
                <span>Confirm & Send Invites</span>
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default InterviewScheduleModal;
