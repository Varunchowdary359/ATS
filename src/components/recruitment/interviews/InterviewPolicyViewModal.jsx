import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, ShieldCheck, CheckCircle2, AlertTriangle, 
  Camera, Mic, Monitor, Maximize, Clock, Radio, Lock, FileText, Check
} from 'lucide-react';
import { PolicyService } from '../../../services/policy/PolicyService';

export const InterviewPolicyViewModal = ({
  isOpen,
  onClose,
  session
}) => {
  if (!isOpen || !session || typeof document === 'undefined') return null;

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
  const effectiveVersion = session.policyVersion || policy?.version || 'v1.0';

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto" dir="ltr">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-8 text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh] sm:max-h-[90vh] text-start"
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold shadow-2xs shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {policy ? policy.name : 'No Policy Assigned'}
                </h2>
                {policy && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {effectiveVersion}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Assigned to: <span className="font-semibold text-slate-800 dark:text-slate-200">{session.roundName}</span> ({session.candidateName})
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs flex-1">
          {policy ? (
            <>
              {/* Description Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                {policy.description}
              </div>

              {/* Hardware & Environment Rules */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Hardware &amp; Proctoring Rules
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-indigo-500" />
                      Webcam / Video Feed
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {rules.camera?.required ? '✓ Mandatory live video stream' : '— Optional preview'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-emerald-500" />
                      Microphone &amp; Audio Input
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {rules.microphone?.required ? '✓ Mandatory audible input' : '— Optional audio'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-cyan-500" />
                      Screen Share Stream
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {rules.screenShare?.required ? '✓ Mandatory desktop stream' : '— Not required'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Maximize className="w-4 h-4 text-violet-500" />
                      Full-Screen Focused Window
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {rules.fullscreen?.required ? '✓ Mandatory full-screen' : '— Windowed allowed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Integrity & Violation Policy */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-2">
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-300">
                  Violation Handling &amp; Action Threshold
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                  <div>Max Violations: <span className="font-bold">{rules.violationHandling?.maxViolations || 3}</span></div>
                  <div>Action on Threshold: <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">{rules.violationHandling?.actionOnThreshold || 'WARNING'}</span></div>
                  <div>Recording: <span className="font-bold">{rules.recording?.enabled ? `Active (${rules.recording?.retentionDays || 90}d retention)` : 'Disabled'}</span></div>
                  <div>Candidate Declaration: <span className="font-bold">{rules.candidateAcknowledgement?.required ? 'Mandatory' : 'Optional'}</span></div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-slate-500">
              <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p>No specific policy has been assigned to this interview session.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50/70 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
