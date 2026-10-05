/**
 * Enterprise Employee Handoff & HRMS Provisioning Review Modal
 * PeopleWorks ATS SaaS
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { evaluateJoiningReadiness } from '../preboardingValidation';

export const HandoffReviewModal = ({
  isOpen = false,
  onClose = () => {},
  record = null,
  onConvertToEmployee = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !record || typeof document === 'undefined') return null;

  const readiness = evaluateJoiningReadiness(record);

  const handleConvert = async (overrideFailure = false) => {
    setConverting(true);
    setError(null);
    try {
      const res = await onConvertToEmployee(record.id, {
        simulateFailure: overrideFailure === 'simulate_error'
      });
      if (res && res.handoffRes) {
        if (res.handoffRes.success) {
          setResult(res.handoffRes);
        } else {
          setError(res.handoffRes.error);
        }
      }
    } catch (err) {
      setError(err.message || 'Conversion failed.');
    } finally {
      setConverting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                HRMS Employee Handoff Review
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Preboarding → Enterprise HRMS Core Lifecycle Transition
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Success Screen */}
        {result ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles size={32} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                HRMS Lifecycle Activated
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                Candidate Converted to Employee
              </h3>
              <div className="inline-block mt-3 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-white">
                Employee ID: <span className="text-brand">{result.employeeId}</span>
              </div>
            </div>

            {/* Lineage Map */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono flex items-center justify-center gap-2 flex-wrap">
              <span className="text-slate-500">{record.candidateId}</span>
              <span className="text-slate-400">→</span>
              <span className="text-slate-500">{record.applicationId}</span>
              <span className="text-slate-400">→</span>
              <span className="text-slate-500">{record.offerId}</span>
              <span className="text-slate-400">→</span>
              <span className="text-slate-500">{record.id}</span>
              <span className="text-slate-400">→</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{result.employeeId}</span>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Employee master profile has been created in PeopleWorks HRMS Core. Active lifecycle, attendance, payroll, and benefits are now owned by HRMS.
            </p>

            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs"
                style={{ backgroundColor: brandColor }}
              >
                Done & Return to Workspace
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            
            {/* Candidate Lineage Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div className="font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>{record.candidateId}</span>
                <span>→</span>
                <span>{record.applicationId}</span>
                <span>→</span>
                <span>{record.offerId}</span>
                <span>→</span>
                <span className="font-bold text-slate-900 dark:text-white">{record.id}</span>
              </div>
              <span className="text-[11px] font-bold text-brand">Ready for EMP ID</span>
            </div>

            {/* 4 Overview Grid Review Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* 1. Candidate Info */}
              <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/50 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <UserCheck size={12} /> Candidate Demographics
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{record.candidateName}</div>
                <div className="text-[11px] text-slate-500 truncate">{record.candidateEmail}</div>
                <div className="text-[11px] text-slate-500">{record.candidatePhone}</div>
              </div>

              {/* 2. Employment Terms */}
              <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/50 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Building2 size={12} /> Employment Structure
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{record.joiningDetails?.designation || record.jobTitle}</div>
                <div className="text-[11px] text-slate-500 truncate">{record.joiningDetails?.department || record.department} • {record.joiningDetails?.location || record.location}</div>
                <div className="text-[11px] text-slate-500">Manager: {record.joiningDetails?.reportingManager || 'Alex Chen'}</div>
              </div>

              {/* 3. Compensation */}
              <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/50 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <DollarSign size={12} /> Compensation Package
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {record.compensation?.currency || 'INR'} {record.compensation?.totalCtc?.toLocaleString() || '2,800,000'} / yr
                </div>
                <div className="text-[11px] text-slate-500">
                  Base: {record.compensation?.baseSalary?.toLocaleString()} • Variable: {record.compensation?.variablePay?.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500">Pay Frequency: {record.compensation?.payFrequency || 'Annual'}</div>
              </div>

              {/* 4. Compliance Clearance */}
              <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/50 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <ShieldCheck size={12} /> Compliance & Verification
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>Readiness: {readiness.readinessScore}% Cleared</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {(record.documents || []).filter(d => d.status === 'Verified').length} Documents Verified • BGV Cleared
                </div>
              </div>

            </div>

            {/* Blockers Warning (If Any) */}
            {!readiness.isReady && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-1 text-xs text-rose-700 dark:text-rose-300">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-600" />
                  <span>Joining Readiness Gate Blockers Present</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-600 dark:text-rose-400">
                  {readiness.blockers.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-600 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleConvert()}
                  disabled={converting || !readiness.isReady}
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  style={{ backgroundColor: brandColor }}
                >
                  {converting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Provisioning in HRMS...</span>
                    </>
                  ) : (
                    <>
                      <span>CONVERT TO EMPLOYEE</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

export default HandoffReviewModal;
