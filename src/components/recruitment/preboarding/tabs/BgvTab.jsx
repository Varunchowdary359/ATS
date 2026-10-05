/**
 * Preboarding Workspace - Background Verification (BGV) Tab
 * PeopleWorks ATS SaaS - Enterprise Verification Partner Integration Matrix
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Building2, 
  Plus, 
  FileText,
  Ban,
  Fingerprint,
  GraduationCap,
  Briefcase,
  Scale,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { BGV_STATUS, BGV_CHECK_TYPE } from '../preboardingTypes';
import BgvInitiateModal from '../modals/BgvInitiateModal';

export const BgvTab = ({
  record = {},
  onManageBgv = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [showInitiateModal, setShowInitiateModal] = useState(false);

  const bgvChecks = record.bgvChecks || [];
  const clearChecks = bgvChecks.filter(c => c.status === BGV_STATUS.CLEAR);
  const discrepancyChecks = bgvChecks.filter(c => c.status === BGV_STATUS.DISCREPANCY);
  const inProgressChecks = bgvChecks.filter(c => c.status === BGV_STATUS.IN_PROGRESS);

  const getCheckIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('identity') || t.includes('aadhaar') || t.includes('pan')) return <Fingerprint size={16} className="text-blue-500" />;
    if (t.includes('employment') || t.includes('experience')) return <Briefcase size={16} className="text-indigo-500" />;
    if (t.includes('education') || t.includes('degree')) return <GraduationCap size={16} className="text-purple-500" />;
    if (t.includes('criminal') || t.includes('court')) return <Scale size={16} className="text-amber-500" />;
    if (t.includes('address')) return <MapPin size={16} className="text-emerald-500" />;
    return <ShieldCheck size={16} className="text-brand" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case BGV_STATUS.CLEAR:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <CheckCircle2 size={12} className="shrink-0" /> Clear
          </span>
        );
      case BGV_STATUS.DISCREPANCY:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-2xs">
            <ShieldAlert size={12} className="shrink-0" /> Discrepancy Found
          </span>
        );
      case BGV_STATUS.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
            <Clock size={12} className="shrink-0 animate-spin" /> In Progress
          </span>
        );
      case BGV_STATUS.FAILED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-2xs">
            <XCircle size={12} className="shrink-0" /> Verification Failed
          </span>
        );
      case BGV_STATUS.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Ban size={12} className="shrink-0" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Not Started
          </span>
        );
    }
  };

  const handleInitiateSubmit = async (data) => {
    await onManageBgv(record.id, null, 'INITIATE', data);
    setShowInitiateModal(false);
  };

  const handleCancelCheck = async (checkId) => {
    if (window.confirm('Are you sure you want to cancel this active background verification check?')) {
      await onManageBgv(record.id, checkId, 'CANCEL', { reason: 'Cancelled by HR Administrator' });
    }
  };

  const handleManualStatusOverride = async (checkId, newStatus) => {
    await onManageBgv(record.id, checkId, 'UPDATE_STATUS', {
      status: newStatus,
      result: newStatus === BGV_STATUS.CLEAR ? 'Clear - Verified by Provider' : 'Discrepancy recorded'
    });
  };

  return (
    <div className="space-y-5">
      
      {/* Action & Partner Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
            style={{ backgroundColor: brandColor }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Background Verification (BGV) Gateway</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                API Live: AuthBridge
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated multi-point checks: Identity, Employment History, Highest Degree, Address & Criminal Records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowInitiateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 transition-transform active:scale-95 cursor-pointer"
            style={{ backgroundColor: brandColor }}
          >
            <Plus size={14} />
            <span>Initiate Check</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Checks</span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{bgvChecks.length}</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 block">Cleared Checks</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{clearChecks.length}</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">In Progress</span>
          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{inProgressChecks.length}</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">Discrepancies</span>
          <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">{discrepancyChecks.length}</span>
        </div>
      </div>

      {/* BGV Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 text-left">Check Type</th>
                <th className="py-3.5 px-4 text-left">Provider & Reference</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Initiated</th>
                <th className="py-3.5 px-4 text-center">Completed</th>
                <th className="py-3.5 px-4 text-left">Result Findings</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bgvChecks.map((check) => (
                <tr key={check.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors">
                  
                  {/* Type */}
                  <td className="py-3.5 px-4 text-left font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                        {getCheckIcon(check.type)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{check.type} Verification</div>
                        <div className="text-[10px] text-slate-400">Automated Webhook</div>
                      </div>
                    </div>
                  </td>

                  {/* Provider */}
                  <td className="py-3.5 px-4 text-left text-slate-700 dark:text-slate-300">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span>{check.provider || 'AuthBridge'}</span>
                      </div>
                      {check.referenceNumber && (
                        <div className="text-[10px] font-mono text-slate-400">
                          Ref: {check.referenceNumber}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(check.status)}
                  </td>

                  {/* Initiated */}
                  <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {check.initiatedAt ? new Date(check.initiatedAt).toLocaleDateString() : '—'}
                  </td>

                  {/* Completed */}
                  <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {check.completedAt ? new Date(check.completedAt).toLocaleDateString() : '—'}
                  </td>

                  {/* Result */}
                  <td className="py-3.5 px-4 text-left">
                    {check.result ? (
                      <div className={`text-xs font-semibold ${
                        check.status === BGV_STATUS.CLEAR ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {check.result}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Awaiting vendor webhook callback</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {check.status === BGV_STATUS.IN_PROGRESS && (
                        <>
                          <button
                            onClick={() => handleManualStatusOverride(check.id, BGV_STATUS.CLEAR)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer shadow-2xs"
                            title="Simulate Clear Callback"
                          >
                            Mark Clear
                          </button>
                          <button
                            onClick={() => handleCancelCheck(check.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Cancel Check"
                          >
                            <Ban size={14} />
                          </button>
                        </>
                      )}
                      {check.status === BGV_STATUS.DISCREPANCY && (
                        <button
                          onClick={() => handleManualStatusOverride(check.id, BGV_STATUS.CLEAR)}
                          className="px-3 py-1 text-xs font-bold rounded-lg text-white shadow-xs hover:brightness-110 cursor-pointer transition-transform active:scale-95"
                          style={{ backgroundColor: brandColor }}
                        >
                          Resolve & Clear
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInitiateModal && (
        <BgvInitiateModal
          isOpen={true}
          candidateName={record.candidateName}
          onClose={() => setShowInitiateModal(false)}
          onInitiate={handleInitiateSubmit}
          brandColor={brandColor}
        />
      )}

    </div>
  );
};

export default BgvTab;
