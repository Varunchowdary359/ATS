import React, { useState } from 'react';
import { 
  ShieldCheck, Clock, Camera, Mic, Monitor, Maximize, AlertOctagon, 
  FileText, CheckCircle2, ChevronRight, AlertTriangle, Lock, Eye
} from 'lucide-react';
import { TechnicalReadinessCheck } from './TechnicalReadinessCheck';
import { PolicyService } from '../../services/policy/PolicyService';

export const CandidatePolicyGate = ({
  policy,
  sessionInfo = {
    title: 'Senior Frontend Engineer Technical Interview',
    candidateName: 'Alex Morgan',
    candidateEmail: 'alex.morgan@example.com',
    scheduledTime: 'Today, 2:00 PM EST',
    durationMinutes: 45
  },
  isSimulator = false,
  onStartSession,
  onCancel
}) => {
  const effectivePolicy = policy || PolicyService.getPolicies()[0];
  const rules = effectivePolicy.rules || {};

  const [checklistState, setChecklistState] = useState({
    cameraStatus: rules.camera?.required ? 'idle' : 'optional',
    microphoneStatus: rules.microphone?.required ? 'idle' : 'optional',
    screenShareStatus: rules.screenShare?.required ? 'idle' : 'optional',
    speakerStatus: 'idle',
    fullscreenActive: false,
    identityStatus: rules.identityVerification?.required ? 'pending' : 'not_required',
    acknowledgedPolicy: false,
    acknowledgedPrivacy: false
  });

  const [attemptedStart, setAttemptedStart] = useState(false);

  const handleUpdateChecklist = (key, value) => {
    setChecklistState(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validation = PolicyService.validateCandidateReadiness(effectivePolicy, checklistState);

  // Calculate readiness score
  const requiredChecks = [
    rules.camera?.required && { key: 'cameraStatus', ready: checklistState.cameraStatus === 'ready' },
    rules.microphone?.required && { key: 'microphoneStatus', ready: checklistState.microphoneStatus === 'ready' },
    rules.screenShare?.required && { key: 'screenShareStatus', ready: checklistState.screenShareStatus === 'ready' },
    rules.fullscreen?.required && { key: 'fullscreenActive', ready: checklistState.fullscreenActive },
    { key: 'speakerStatus', ready: checklistState.speakerStatus === 'ready' },
    { key: 'acknowledgedPolicy', ready: checklistState.acknowledgedPolicy },
    rules.recording?.enabled && { key: 'acknowledgedPrivacy', ready: checklistState.acknowledgedPrivacy }
  ].filter(Boolean);

  const completedCount = requiredChecks.filter(c => c.ready).length;
  const totalCount = requiredChecks.length;

  const handleStart = () => {
    setAttemptedStart(true);
    if (!validation.ready) return;

    // Record acceptance evidence in frontend storage
    PolicyService.recordCandidateAcceptance({
      candidateId: sessionInfo.candidateId || 'CAND-DEMO-001',
      candidateName: sessionInfo.candidateName,
      candidateEmail: sessionInfo.candidateEmail,
      policyId: effectivePolicy.id,
      policyVersion: effectivePolicy.version,
      interviewId: sessionInfo.interviewId || null,
      assessmentId: sessionInfo.assessmentId || null,
      deviceCapabilities: {
        cameraReady: checklistState.cameraStatus === 'ready',
        micReady: checklistState.microphoneStatus === 'ready',
        screenReady: checklistState.screenShareStatus === 'ready',
        fullscreen: checklistState.fullscreenActive
      }
    });

    if (onStartSession) {
      onStartSession({
        policy: effectivePolicy,
        checklistState,
        sessionInfo
      });
    }
  };

  // Extract initials for candidate avatar
  const initials = sessionInfo.candidateName
    ? sessionInfo.candidateName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CA';

  return (
    <div className="w-full space-y-6">
      {/* Unified Enterprise Glassmorphic Header Banner */}
      <div className="bg-gradient-to-br from-blue-50/50 via-white/80 to-slate-50/50 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-blue-950/30 backdrop-blur-xl border border-blue-100/80 dark:border-blue-900/40 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-4 relative overflow-hidden">
        {/* Ambient Glow in Corner */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 dark:bg-brand/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Top Control & Status Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-blue-100/60 dark:border-slate-800 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            {isSimulator && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand border border-brand/20 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span>
                Simulator Mode Active
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
              Policy {effectivePolicy.version || 'v1.1'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Secure Proctoring Enforced
            </span>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
            >
              ← Exit to Policy Center
            </button>
          )}
        </div>

        {/* Main Banner Information */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-0.5 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl text-white bg-brand shadow-sm flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {sessionInfo.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center border border-brand/20">
                    {initials}
                  </span>
                  <span>Candidate: {sessionInfo.candidateName}</span>
                  <span className="font-mono text-slate-400">({sessionInfo.candidateEmail})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Metrics Pills */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-blue-100/80 dark:border-slate-700/80 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {rules.timeLimit?.durationMinutes || sessionInfo.durationMinutes || 45} Mins
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-blue-100/80 dark:border-slate-700/80 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Policy Type</div>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                  {effectivePolicy.type?.replace('_', ' ') || 'Exam'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Rules & Integrity Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand" />
              Proctoring & Integrity Guidelines
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              The evaluation session enforces the following active security standards and monitoring rules:
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            6 Active Rules
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Camera Rule */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 flex items-start gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-600">
            <div className={`p-2.5 rounded-xl shrink-0 ${rules.camera?.required ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
              <Camera className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Camera Requirement</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${rules.camera?.required ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' : 'bg-slate-100 text-slate-600'}`}>
                  {rules.camera?.required ? 'Mandatory' : 'Optional'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {rules.camera?.required ? 'Mandatory live webcam during session' : 'Camera stream is optional'}
              </p>
            </div>
          </div>

          {/* Microphone Rule */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 flex items-start gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-600">
            <div className={`p-2.5 rounded-xl shrink-0 ${rules.microphone?.required ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
              <Mic className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Microphone Input</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${rules.microphone?.required ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                  {rules.microphone?.required ? 'Continuous' : 'Optional'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {rules.microphone?.required ? 'Continuous audio feed monitored' : 'Microphone optional'}
              </p>
            </div>
          </div>

          {/* Fullscreen & Tab Switch Rule */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 flex items-start gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-600">
            <div className={`p-2.5 rounded-xl shrink-0 ${rules.fullscreen?.required || rules.tabSwitch?.detection ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
              <Maximize className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Window & Tab Monitoring</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                  Logged
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {rules.tabSwitch?.detection ? `Tab switches logged (Max ${rules.violationHandling?.maxViolations || 3})` : 'Standard browser focus'}
              </p>
            </div>
          </div>

          {/* Screen Share */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 flex items-start gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-600">
            <div className={`p-2.5 rounded-xl shrink-0 ${rules.screenShare?.required ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50 dark:border-cyan-800/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
              <Monitor className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Screen Sharing</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${rules.screenShare?.required ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300' : 'bg-slate-100 text-slate-600'}`}>
                  {rules.screenShare?.required ? 'Required' : 'On Request'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {rules.screenShare?.required ? 'Candidate screen sharing required' : 'Screen share on request'}
              </p>
            </div>
          </div>

          {/* Clipboard & Copy/Paste */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 flex items-start gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-600">
            <div className={`p-2.5 rounded-xl shrink-0 ${rules.clipboard?.preventCopy ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Clipboard Security</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${rules.clipboard?.preventCopy ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300' : 'bg-slate-100 text-slate-600'}`}>
                  {rules.clipboard?.preventCopy ? 'Strict' : 'Standard'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {rules.clipboard?.preventCopy ? 'Copy / Paste disabled on questions' : 'Normal clipboard access'}
              </p>
            </div>
          </div>

          {/* Violation Action */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 flex items-start gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-600">
            <div className="p-2.5 rounded-xl shrink-0 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Violation Threshold</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                  Enforced
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed capitalize">
                {rules.violationHandling?.actionOnThreshold ? `${rules.violationHandling.actionOnThreshold.replace('_', ' ')} after ${rules.violationHandling.maxViolations || 3} Flags` : 'Auto Submit After 3 Flags'}
              </p>
            </div>
          </div>
        </div>

        {/* Recording Notice (If Enabled) */}
        {rules.recording?.enabled && (
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50 flex items-start gap-3">
            <Eye className="w-4 h-4 text-brand dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">Notice of Video & Audio Recording:</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {rules.recording?.storageNotice || 'This evaluation session is recorded for verification and unbiased review. Recording will be retained according to corporate compliance guidelines.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hardware & Technical Readiness Checker */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <TechnicalReadinessCheck
          policy={effectivePolicy}
          checklistState={checklistState}
          onUpdateChecklist={handleUpdateChecklist}
        />
      </div>

      {/* Mandatory Candidate Acknowledgement Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand" />
            Mandatory Candidate Acknowledgement
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {completedCount} of {totalCount} Requirements Ready
          </span>
        </div>

        <div className="space-y-3">
          {/* Policy Agreement Checkbox Card */}
          <label 
            className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
              checklistState.acknowledgedPolicy 
                ? 'bg-brand/5 border-brand/40 shadow-xs' 
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input
              type="checkbox"
              id="candidate-ack-policy"
              checked={checklistState.acknowledgedPolicy}
              onChange={(e) => handleUpdateChecklist('acknowledgedPolicy', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
            />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                I agree to abide by the assessment rules and integrity guidelines.
              </span>
              I understand that leaving the exam window, attempting to copy/paste, or unauthorized communication may result in automatic session termination and disqualification.
            </div>
          </label>

          {/* Privacy & Recording Agreement Checkbox Card (When required) */}
          {rules.recording?.enabled && (
            <label 
              className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                checklistState.acknowledgedPrivacy 
                  ? 'bg-brand/5 border-brand/40 shadow-xs' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="checkbox"
                id="candidate-ack-privacy"
                checked={checklistState.acknowledgedPrivacy}
                onChange={(e) => handleUpdateChecklist('acknowledgedPrivacy', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
              />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                  I consent to proctored monitoring and video/audio recording.
                </span>
                I acknowledge that session data is recorded strictly for the purpose of candidate evaluation, identity verification, and anti-fraud compliance.
              </div>
            </label>
          )}
        </div>

        {/* Validation Blockers Notice */}
        {attemptedStart && !validation.ready && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 space-y-1.5 animate-shake">
            <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Please complete all mandatory requirements before starting:
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-rose-700/90 dark:text-rose-300/90">
              {validation.blockers.map((blocker, idx) => (
                <li key={idx}>{blocker}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel & Exit
          </button>

          <button
            type="button"
            onClick={handleStart}
            disabled={!validation.ready}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              validation.ready
                ? 'bg-brand hover:bg-brand-hover shadow-brand/25 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0'
                : 'bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed'
            }`}
          >
            <span>Start Assessment & Enter Session</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
