/**
 * Preboarding Workspace - Joining Readiness Gate Tab
 * PeopleWorks ATS SaaS - 8-Point Compliance Governance & Automated Gate Clearance
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles,
  Check,
  Lock,
  ChevronRight,
  ShieldAlert,
  FileCheck2
} from 'lucide-react';
import { evaluateJoiningReadiness } from '../preboardingValidation';
import { PREBOARDING_STATUS } from '../preboardingTypes';

export const ReadinessTab = ({
  record = {},
  onMarkReady = () => {},
  onNavigateTab = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const readiness = evaluateJoiningReadiness(record);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState(null);

  const handleMarkReady = async () => {
    setMarking(true);
    setError(null);
    try {
      await onMarkReady(record.id);
    } catch (err) {
      setError(err.message || 'Failed to mark candidate ready to join.');
    } finally {
      setMarking(false);
    }
  };

  const getTargetTabForCheck = (checkId) => {
    switch (checkId) {
      case 'candidate_info': return 'candidate_info';
      case 'joining_details': return 'joining_details';
      case 'mandatory_documents': return 'documents';
      case 'bgv_clearance': return 'bgv';
      case 'mandatory_tasks': return 'tasks';
      default: return 'overview';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Gate Clearance Hero Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all ${
        readiness.isReady 
          ? 'bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
          : 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20 border-amber-300 dark:border-amber-800'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
            readiness.isReady 
              ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/50' 
              : 'bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-900/50'
          }`}>
            {readiness.isReady ? <ShieldCheck size={28} /> : <AlertTriangle size={28} />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                readiness.isReady 
                  ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
                  : 'bg-amber-100/70 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              }`}>
                Governance Gate Assessment
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                {readiness.passedCount} of {readiness.totalCount} Checkpoints Satisfied ({readiness.readinessScore}%)
              </span>
            </div>
            
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {readiness.isReady 
                ? 'READY TO JOIN - All Compliance Checkpoints Satisfied' 
                : 'NOT READY TO JOIN - Actionable Gate Blockers Present'
              }
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {readiness.isReady
                ? 'Candidate profile, mandatory compliance documentation, BGV clearance, and departmental tasks are 100% verified.'
                : 'Enterprise governance requires all 8 readiness gates to pass before HRMS Employee Conversion can be unlocked.'
              }
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="self-end md:self-auto shrink-0">
          {record.status === PREBOARDING_STATUS.READY_TO_JOIN || record.status === PREBOARDING_STATUS.EMPLOYEE_CREATED ? (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs shadow-2xs">
              <Check size={16} />
              <span>Gate Cleared & Locked</span>
            </div>
          ) : (
            <button
              onClick={handleMarkReady}
              disabled={marking || !readiness.isReady}
              className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: brandColor }}
            >
              <Sparkles size={15} />
              <span>{marking ? 'Validating Governance...' : 'Mark Ready to Join'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 8 Checkpoints Detail Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Automated Readiness Checkpoints & Policy Verification Matrix
          </h4>
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
            {readiness.passedCount} / {readiness.totalCount} Passed
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {readiness.checks.map((chk, idx) => (
            <div 
              key={chk.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                  chk.passed 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {chk.passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {idx + 1}. {chk.label}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 uppercase">
                      {chk.category}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${
                    chk.passed ? 'text-slate-500 dark:text-slate-400' : 'text-rose-600 dark:text-rose-400 font-medium'
                  }`}>
                    {typeof chk.details === 'object' && chk.details !== null ? JSON.stringify(chk.details) : String(chk.details || '')}
                  </p>
                </div>
              </div>

              {/* Action CTA if failed */}
              {!chk.passed && (
                <button
                  onClick={() => onNavigateTab(getTargetTabForCheck(chk.id))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 shrink-0 transition-colors shadow-2xs cursor-pointer group self-start sm:self-auto"
                >
                  <span>Resolve Check</span>
                  <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ReadinessTab;
