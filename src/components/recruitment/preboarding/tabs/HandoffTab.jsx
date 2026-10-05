/**
 * Preboarding Workspace - Employee Handoff Tab
 * PeopleWorks ATS SaaS - Enterprise HRMS Provisioning & Data Lineage
 */

import React, { useState } from 'react';
import { 
  UserCheck, 
  Building2, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Layers,
  FileText,
  Clock,
  ArrowRightCircle
} from 'lucide-react';
import { evaluateJoiningReadiness } from '../preboardingValidation';
import { PREBOARDING_STATUS, HANDOFF_STATUS } from '../preboardingTypes';
import HandoffReviewModal from '../modals/HandoffReviewModal';

export const HandoffTab = ({
  record = {},
  onConvertToEmployee = () => {},
  onRetryHandoff = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(null);

  const readiness = evaluateJoiningReadiness(record);
  const isEmployeeCreated = record.status === PREBOARDING_STATUS.EMPLOYEE_CREATED || !!record.employeeId;
  const isFailed = record.status === PREBOARDING_STATUS.HANDOFF_FAILED || record.handoff?.status === HANDOFF_STATUS.FAILED;

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      await onRetryHandoff(record.id, 'HR Administrator manually initiated conversion retry.');
    } catch (err) {
      setError(err.message || 'Retry failed.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Lifecycle Status Banner */}
      {isEmployeeCreated ? (
        <div className="p-6 bg-gradient-to-r from-blue-50/90 via-white to-blue-50/50 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20 border border-blue-300 dark:border-blue-800 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md ring-4 ring-blue-100 dark:ring-blue-900/40">
              <Sparkles size={26} />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                HRMS Core Lifecycle Active
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Employee Profile Created & Synchronized
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                Corporate Employee ID: <strong className="text-blue-600 dark:text-blue-400 text-sm font-bold">{record.employeeId}</strong>
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 self-start sm:self-auto shadow-2xs">
            Lifecycle Synchronized to Core HRMS
          </div>
        </div>
      ) : isFailed ? (
        <div className="p-6 bg-rose-50/90 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md ring-4 ring-rose-100 dark:ring-rose-900/40">
              <AlertTriangle size={26} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Conversion Failed
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                HRMS Provisioning API Exception
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-xl">
                {record.handoff?.errorDetails || 'Integration timeout: Target system was unable to commit employee master record.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4.5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
            style={{ backgroundColor: brandColor }}
          >
            <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
            <span>{retrying ? 'Retrying...' : 'Retry Handoff'}</span>
          </button>
        </div>
      ) : (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Final Preboarding Stage
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className={`text-xs font-bold ${readiness.isReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {readiness.isReady ? 'Readiness Gate Passed (100%)' : 'Readiness Blockers Pending'}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Convert Candidate to Corporate Employee
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
              Consolidated data package validation and direct dispatch to PeopleWorks Enterprise Core HRMS API.
            </p>
          </div>

          <button
            onClick={() => setShowReviewModal(true)}
            disabled={!readiness.isReady}
            className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
            style={{ backgroundColor: brandColor }}
          >
            <span>Initiate Employee Handoff</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* End-to-End Enterprise Lineage Map */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers size={14} className="text-brand" /> End-to-End ATS → HRMS Lifecycle Lineage
          </h4>
          <span className="text-xs text-slate-400 font-mono">Immutable Audit Chain</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-sans font-bold uppercase tracking-wider">Candidate</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{record.candidateId || 'CAND-102'}</span>
          </div>
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-sans font-bold uppercase tracking-wider">Application</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{record.applicationId || 'APP-2026-088'}</span>
          </div>
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-sans font-bold uppercase tracking-wider">Offer Record</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{record.offerId || 'OFF-2026-001'}</span>
          </div>
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-sans font-bold uppercase tracking-wider">Preboarding</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{record.id}</span>
          </div>
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/60 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-sans font-bold uppercase tracking-wider">HRMS Employee</span>
            <span className={`text-xs font-bold ${isEmployeeCreated ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
              {record.employeeId || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Structured Information Review Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* 1. Candidate Demographics */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <UserCheck size={14} className="text-brand" /> Candidate Demographics
          </h4>
          <div className="text-xs space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Full Legal Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{record.candidateName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Primary Email</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">{record.candidateEmail}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Mobile Phone</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">{record.candidatePhone}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Permanent Address</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[220px]">
                {record.candidateInfo?.currentAddress || record.location || 'Bangalore, India'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Employment Structure */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Building2 size={14} className="text-brand" /> Employment Structure
          </h4>
          <div className="text-xs space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Official Designation</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{record.joiningDetails?.designation || record.jobTitle}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Department / BU</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{record.joiningDetails?.department || 'Platform Engineering'} ({record.joiningDetails?.businessUnit || 'Core Tech'})</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Reporting Manager</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{record.joiningDetails?.reportingManager || 'Alex Chen'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Expected Joining Date</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{record.joiningDate}</span>
            </div>
          </div>
        </div>

        {/* 3. Compensation Package */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <DollarSign size={14} className="text-brand" /> Compensation & Payroll
          </h4>
          <div className="text-xs space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Total Annual CTC</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {record.compensation?.currency || 'INR'} {record.compensation?.totalCtc?.toLocaleString() || '2,800,000'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Fixed Base Pay</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">
                {record.compensation?.currency || 'INR'} {record.compensation?.baseSalary?.toLocaleString() || '2,400,000'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Variable / Performance Bonus</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">
                {record.compensation?.currency || 'INR'} {record.compensation?.variablePay?.toLocaleString() || '400,000'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Pay Frequency</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{record.compensation?.payFrequency || 'Monthly'}</span>
            </div>
          </div>
        </div>

        {/* 4. Compliance & Verification Summary */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck size={14} className="text-brand" /> Governance Verification Package
          </h4>
          <div className="text-xs space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Compliance Documents</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {(record.documents || []).filter(d => d.status === 'Verified').length} Verified
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Background Verification</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {(record.bgvChecks || []).filter(b => b.status === 'Clear').length} Cleared
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Department Tasks</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(record.tasks || []).filter(t => t.status === 'Completed').length} / {(record.tasks || []).length} Completed
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Overall Gate Score</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">{readiness.readinessScore}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showReviewModal && (
        <HandoffReviewModal
          isOpen={true}
          record={record}
          onClose={() => setShowReviewModal(false)}
          onConvertToEmployee={onConvertToEmployee}
          brandColor={brandColor}
        />
      )}

    </div>
  );
};

export default HandoffTab;
