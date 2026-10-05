import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, Calendar, Clock, Video, ShieldCheck, CheckCircle2, 
  AlertTriangle, Lock, Eye, CheckSquare, Square, ArrowRight, VideoOff, RefreshCw
} from 'lucide-react';
import { TechnicalReadinessCheck } from '../../policy/TechnicalReadinessCheck';
import { AssessmentSessionContainer } from '../../policy/AssessmentSessionContainer';
import { PolicyService } from '../../../services/policy/PolicyService';
import { interviewService } from './interviewService';

export const CandidateInterviewPortalModal = ({
  isOpen,
  onClose,
  session,
  onSessionComplete
}) => {
  const [isInLiveSession, setIsInLiveSession] = useState(false);
  const [checklistState, setChecklistState] = useState({
    cameraStatus: 'idle',
    microphoneStatus: 'idle',
    screenShareStatus: 'idle',
    speakerStatus: 'idle',
    fullscreenActive: false,
    identityStatus: 'not_required',
    acknowledgedPolicy: false,
    acknowledgedPrivacy: false
  });

  const [attemptedStart, setAttemptedStart] = useState(false);

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

  const rules = policy?.rules || {};
  const isRecordingEnabled = !!rules.recording?.enabled;
  const isCandidatePolicyRequired = !!rules.candidateAcknowledgement?.required;
  const isPrivacyConsentRequired = isRecordingEnabled && !!rules.candidateAcknowledgement?.privacyConsentRequired;

  const handleUpdateChecklist = (key, value) => {
    setChecklistState(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Readiness validation against assigned policy rules
  const validation = policy 
    ? PolicyService.validateCandidateReadiness(policy, checklistState) 
    : { ready: true, blockers: [] };

  const handleStartInterview = async () => {
    setAttemptedStart(true);
    if (!validation.ready) return;

    // Record candidate acceptance in central PolicyService
    const acceptanceRecord = PolicyService.recordCandidateAcceptance({
      candidateId: session.candidateId || 'CAND-ONLINE',
      candidateName: session.candidateName,
      candidateEmail: session.candidateEmail,
      policyId: policy?.id || 'POL-DEFAULT',
      policyVersion: session.policyVersion || policy?.version || 'v1.0',
      interviewId: session.id,
      deviceCapabilities: {
        cameraReady: checklistState.cameraStatus === 'ready',
        micReady: checklistState.microphoneStatus === 'ready',
        screenReady: checklistState.screenShareStatus === 'ready',
        fullscreen: checklistState.fullscreenActive
      }
    });

    // Update interview session status in interviewService
    await interviewService.updateCandidatePolicyStatus(session.id, {
      accepted: true,
      acceptedAt: acceptanceRecord.acceptedAt,
      evidenceId: acceptanceRecord.id,
      policyVersion: session.policyVersion || policy?.version,
      actor: session.candidateName
    });

    setIsInLiveSession(true);
  };

  // If candidate is inside the live session
  if (isInLiveSession) {
    return createPortal(
      <div className="fixed inset-0 z-[999999] bg-slate-950 overflow-y-auto" dir="ltr">
        <AssessmentSessionContainer
          policy={policy}
          sessionInfo={{
            title: `${session.roundName} - ${session.requisitionTitle}`,
            candidateName: session.candidateName,
            candidateEmail: session.candidateEmail,
            durationMinutes: session.duration || rules.timeLimit?.durationMinutes || 60,
            interviewId: session.id
          }}
          onComplete={async (result) => {
            setIsInLiveSession(false);
            if (onSessionComplete) onSessionComplete(result);
            onClose();
          }}
          onExit={() => {
            setIsInLiveSession(false);
            onClose();
          }}
        />
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto" dir="ltr">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-6 text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh] text-start"
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold shadow-2xs shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  Candidate Policy &amp; Technical Readiness Gate
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                  {policy ? `${policy.name} (${session.policyVersion || policy.version})` : 'No Policy Assigned'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Complete pre-session device verification and required policy acknowledgements before starting.
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs flex-1">
          {/* Scheduled Interview Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/60 via-slate-50 to-indigo-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Interview Session
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {session.roundName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {session.requisitionTitle} ({session.requisitionId})
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-500" />
                <span>{session.scheduledDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-amber-500" />
                <span>{session.startTime} - {session.endTime} ({session.duration || 60}m)</span>
              </div>
            </div>
          </div>

          {/* Candidate Policy Terms & Rules */}
          {policy && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Candidate Interview Policy Guidelines
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Effective: {policy.effectiveDate || '2026-01-01'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {policy.description || 'Please adhere to the academic integrity and professional conduct guidelines for this session.'}
              </p>

              {/* Rules Checklist Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                <div>• Webcam: <span className="font-semibold">{rules.camera?.required ? 'Mandatory active video feed' : 'Optional'}</span></div>
                <div>• Microphone: <span className="font-semibold">{rules.microphone?.required ? 'Mandatory clear audio' : 'Optional'}</span></div>
                <div>• Screen Sharing: <span className="font-semibold">{rules.screenShare?.required ? 'Active desktop stream required' : 'Not required'}</span></div>
                <div>• Full-Screen Mode: <span className="font-semibold">{rules.fullscreen?.required ? 'Focused full-screen required' : 'Standard window'}</span></div>
                <div>• Integrity Violations: <span className="font-semibold">Max {rules.violationHandling?.maxViolations || 3} allowed before {rules.violationHandling?.actionOnThreshold || 'action'}</span></div>
                <div>• Recording: <span className="font-semibold">{isRecordingEnabled ? 'Video & audio recording active for QA' : 'No recording'}</span></div>
              </div>
            </div>
          )}

          {/* Hardware & Technical Readiness Check */}
          {policy && (
            <TechnicalReadinessCheck
              policy={policy}
              checklistState={checklistState}
              onUpdateChecklist={handleUpdateChecklist}
            />
          )}

          {/* Mandatory Candidate Acknowledgement Section */}
          {policy && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Mandatory Declarations &amp; Consents
              </h4>

              <div className="space-y-2">
                {/* 1. Policy Agreement */}
                {isCandidatePolicyRequired && (
                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => handleUpdateChecklist('acknowledgedPolicy', !checklistState.acknowledgedPolicy)}
                      className="mt-0.5 text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
                    >
                      {checklistState.acknowledgedPolicy ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      I have read, understood, and agree to abide by the <strong>{policy.name} ({session.policyVersion || policy.version})</strong> and candidate conduct requirements.
                    </span>
                  </label>
                )}

                {/* 2. Recording Consent (Only when recording is actually configured) */}
                {isPrivacyConsentRequired && (
                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => handleUpdateChecklist('acknowledgedPrivacy', !checklistState.acknowledgedPrivacy)}
                      className="mt-0.5 text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
                    >
                      {checklistState.acknowledgedPrivacy ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      I explicitly consent to audio and video recording during this interview session for quality and evaluation auditing.
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Validation Blockers Notice */}
          {attemptedStart && !validation.ready && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Cannot Start Interview: Missing Prerequisites
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {validation.blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}
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
            onClick={handleStartInterview}
            disabled={!validation.ready}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              validation.ready
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span>{validation.ready ? 'Start Live Interview Session' : 'Complete Required Checks to Start'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
