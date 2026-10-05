import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ArrowPathIcon, 
  XCircleIcon, 
  ClockIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  LockClosedIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { ModernStatusBadge } from '../../admin/shared/ModernAdminLayoutComponents';
import CustomSelect from '../../dashboard/shared/CustomSelect';

export default function JDDetails({ jd, onClose, onAction, userRole = 'recruiter', brandColor }) {
  const [activeTab, setActiveTab] = useState('details');
  const [actionModal, setActionModal] = useState(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [compareVersion, setCompareVersion] = useState(jd.versionHistory?.[0]?.version || 'v1.0');

  if (!jd) return null;

  const isApproverForCurrentStage = () => {
    if (jd.status !== 'Pending Approval') return false;
    if (userRole === 'recruiter' || userRole === 'viewer' || userRole === 'admin') return false;
    const pendingStage = jd.approvalChain?.find(s => s.status === 'Pending');
    if (!pendingStage) return false;
    return pendingStage.role === userRole || jd.currentApproverRole === userRole;
  };

  const isAdminOverrideAllowed = () =>
    userRole === 'admin' &&
    (jd.status === 'Pending Approval' || jd.status === 'Changes Requested' || jd.status === 'Rejected');

  const canRecruiterEdit = () => {
    if (userRole !== 'recruiter' && userRole !== 'admin') return false;
    return jd.status === 'Draft' || jd.status === 'Changes Requested';
  };

  const handleExecuteAction = () => {
    if ((actionModal === 'Changes' || actionModal === 'Reject' || actionModal === 'AdminOverride') && !comment.trim()) {
      setCommentError('A comment / reason is mandatory for this action.');
      return;
    }
    onAction(actionModal, jd, comment);
    setActionModal(null);
    setComment('');
    setCommentError('');
  };

  // ── Approval Timeline ──────────────────────────────────────────────────────
  const renderApprovalTimeline = () => {
    let headerLabel = null;
    if (jd.status === 'Approved' || jd.status === 'Published') {
      headerLabel = <span className="text-emerald-600 dark:text-emerald-400 font-bold">Fully Approved</span>;
    } else if (jd.status === 'Draft') {
      headerLabel = <span className="italic text-slate-400">— Not yet submitted</span>;
    } else if (jd.status === 'Pending Approval') {
      headerLabel = <>Pending: <strong className="text-slate-800 dark:text-slate-200">{jd.currentApproverName}</strong></>;
    } else if (jd.status === 'Changes Requested') {
      const by = jd.changesRequestedBy || jd.currentApproverName;
      const byRole = jd.changesRequestedByRole || '';
      headerLabel = <><span className="text-amber-600 dark:text-amber-400 font-bold">Changes Requested By:</span>{' '}<strong className="text-slate-800 dark:text-slate-200">{by}{byRole ? ` (${byRole})` : ''}</strong></>;
    } else if (jd.status === 'Rejected') {
      const by = jd.rejectedBy || jd.currentApproverName;
      const byRole = jd.rejectedByRole || '';
      headerLabel = <><span className="text-red-600 dark:text-red-400 font-bold">Rejected By:</span>{' '}<strong className="text-slate-800 dark:text-slate-200">{by}{byRole ? ` (${byRole})` : ''}</strong></>;
    } else if (jd.status === 'Archived') {
      headerLabel = <span className="italic text-slate-400">— Archived</span>;
    }

    return (
      <div className="bg-slate-50/70 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
        {/* Tracker Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-indigo-500 shrink-0" />
            Approval Workflow Tracker
          </h4>
          <span className="text-[11px] font-mono text-slate-500 text-right leading-tight">{headerLabel}</span>
        </div>

        {/* Approval Stage Cards — horizontal scroll on small viewports */}
        <div className="w-full overflow-x-auto">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${jd.approvalChain?.length || 5}, minmax(140px, 1fr))`, minWidth: 0 }}
          >
            {jd.approvalChain?.map((stage, idx) => {
              const isRecruiterStage = stage.stageId === 1;

              let cardCls = 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
              let badgeText = 'Waiting';
              let badgeCls = 'text-slate-500 dark:text-slate-400';

              if (isRecruiterStage) {
                if (stage.status === 'Submitted') {
                  cardCls = 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400';
                  badgeText = 'Submitted';
                  badgeCls = 'text-indigo-700 dark:text-indigo-300';
                } else {
                  cardCls = 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
                  badgeText = 'Draft';
                  badgeCls = 'text-slate-400';
                }
              } else {
                if (stage.status === 'Approved') {
                  cardCls = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500';
                  badgeText = 'Approved';
                  badgeCls = 'text-emerald-700 dark:text-emerald-300';
                } else if (stage.status === 'Pending') {
                  cardCls = 'bg-amber-50 dark:bg-amber-900/30 border-amber-500 animate-pulse';
                  badgeText = 'Pending';
                  badgeCls = 'text-amber-700 dark:text-amber-300';
                } else if (stage.status === 'Changes Requested') {
                  cardCls = 'bg-orange-50 dark:bg-orange-900/30 border-orange-500';
                  badgeText = 'Changes Requested';
                  badgeCls = 'text-orange-700 dark:text-orange-300';
                } else if (stage.status === 'Rejected') {
                  cardCls = 'bg-red-50 dark:bg-red-900/30 border-red-500';
                  badgeText = 'Rejected';
                  badgeCls = 'text-red-700 dark:text-red-300';
                }
              }

              return (
                <div key={idx} className={`p-3 rounded-xl border-2 flex flex-col gap-1 min-w-0 ${cardCls}`}>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                      {isRecruiterStage ? 'Created By' : `Stage ${stage.stageId - 1}`}
                    </span>
                    <span className={`text-[10px] font-bold shrink-0 ${badgeCls}`}>{badgeText}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate">{stage.roleName}</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight truncate">{stage.approverName}</div>
                  {stage.comment && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 italic border-t border-slate-200/50 dark:border-slate-700/50 pt-1 mt-0.5 line-clamp-2">
                      &ldquo;{stage.comment}&rdquo;
                    </div>
                  )}
                  {stage.timestamp && (
                    <div className="text-[10px] text-slate-400 mt-auto pt-1 border-t border-slate-200/50 dark:border-slate-700/50 font-mono truncate">
                      {stage.timestamp}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── TABS config ────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'details', label: 'JD Content' },
    { id: 'history', label: `Version History (${jd.versionHistory?.length || 1})` },
    { id: 'audit', label: `Audit Trail (${jd.auditTrail?.length || 0})` },
    { id: 'compare', label: 'Compare Versions' }
  ];

  if (!jd || typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex items-start justify-center overflow-hidden"
        style={{ padding: 'clamp(8px, 3vh, 32px) clamp(8px, 2vw, 24px)' }}
        dir="ltr"
      >
        {/* ── Modal Shell ── fixed height, flex column ────────────────────── */}
        <div
          className="
            relative flex flex-col w-full bg-white dark:bg-[#0A0C10]
            border border-slate-200 dark:border-slate-800
            rounded-2xl shadow-2xl overflow-hidden
          "
          style={{
            maxWidth: 'min(1100px, calc(100vw - clamp(16px, 4vw, 48px)))',
            height: 'min(92vh, 900px)',
            maxHeight: '92vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ═══════════════════════════════════════════════════════════════
              FIXED HEADER — never clips, always visible
          ════════════════════════════════════════════════════════════════ */}
          <div className="shrink-0 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4">
              {/* Row 1: Meta + Close */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                {/* Left: ID / Status / Version / Title */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded shrink-0">
                      {jd.id}
                    </span>
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                      {jd.reqId || 'REQ-2026-0001'}
                    </span>
                    <ModernStatusBadge status={jd.status} />
                    <span className="font-mono text-[11px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold rounded shrink-0">
                      {jd.version}
                    </span>
                    {jd.status === 'Rejected' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded flex items-center gap-1 shrink-0">
                        <LockClosedIcon className="w-3 h-3" /> Read-Only
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-tight truncate">
                    {jd.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {jd.department} · {jd.location} · Created by{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{jd.createdBy}</strong>
                  </p>
                </div>

                {/* Right: Action Buttons + Close */}
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">

                  {/* Approver Decision Buttons */}
                  {isApproverForCurrentStage() && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 p-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <button
                        onClick={() => { setActionModal('Approve'); setComment(''); setCommentError(''); }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 whitespace-nowrap"
                      >
                        <CheckCircleIcon className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => { setActionModal('Changes'); setComment(''); setCommentError(''); }}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 whitespace-nowrap"
                      >
                        <ArrowPathIcon className="w-3.5 h-3.5" /> Request Changes
                      </button>
                      <button
                        onClick={() => { setActionModal('Reject'); setComment(''); setCommentError(''); }}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 whitespace-nowrap"
                      >
                        <XCircleIcon className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}

                  {/* Admin Override */}
                  {isAdminOverrideAllowed() && (
                    <button
                      onClick={() => { setActionModal('AdminOverride'); setComment(''); setCommentError(''); }}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 whitespace-nowrap"
                      title="Admin Authorized Override"
                    >
                      <ShieldExclamationIcon className="w-3.5 h-3.5" /> Admin Override
                    </button>
                  )}

                  {/* Revise & Resubmit (Changes Requested) */}
                  {jd.status === 'Changes Requested' && canRecruiterEdit() && (
                    <button
                      onClick={() => onAction('EditRevision', jd)}
                      className="px-2.5 py-1.5 bg-brand text-white font-bold text-[11px] rounded-lg flex items-center gap-1 whitespace-nowrap hover:opacity-90"
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5" /> Revise & Resubmit
                    </button>
                  )}

                  {/* Edit Draft */}
                  {jd.status === 'Draft' && canRecruiterEdit() && (
                    <button
                      onClick={() => onAction('EditRevision', jd)}
                      className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 dark:bg-slate-200 dark:hover:bg-slate-300 text-white dark:text-slate-900 font-bold text-[11px] rounded-lg flex items-center gap-1 whitespace-nowrap"
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5" /> Edit Draft
                    </button>
                  )}

                  {/* Publish */}
                  {jd.status === 'Approved' && (userRole === 'recruiter' || userRole === 'admin' || userRole === 'hr_head') && (
                    <button
                      onClick={() => onAction('Publish', jd)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 whitespace-nowrap"
                    >
                      <ShieldCheckIcon className="w-3.5 h-3.5" /> Publish JD
                    </button>
                  )}

                  {/* Create New Version */}
                  {(jd.status === 'Published' || jd.status === 'Approved') && (userRole === 'recruiter' || userRole === 'admin') && (
                    <button
                      onClick={() => onAction('CreateNewVersion', jd)}
                      className="px-2.5 py-1.5 bg-brand text-white font-bold text-[11px] rounded-lg flex items-center gap-1 whitespace-nowrap hover:opacity-90"
                    >
                      <DocumentDuplicateIcon className="w-3.5 h-3.5" /> Create New Version (v{(jd.versionNum + 0.1).toFixed(1)})
                    </button>
                  )}

                  {/* Duplicate Rejected JD */}
                  {jd.status === 'Rejected' && (userRole === 'recruiter' || userRole === 'admin') && (
                    <button
                      onClick={() => onAction('DuplicateJD', jd)}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 whitespace-nowrap"
                      title="Duplicate & Create New JD from this rejected JD"
                    >
                      <DocumentDuplicateIcon className="w-3.5 h-3.5" /> Duplicate & Create New
                    </button>
                  )}

                  {/* Close */}
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Status Banners */}
            {jd.status === 'Rejected' && (
              <div className="mx-5 mb-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                <LockClosedIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This JD was <strong>rejected</strong> by{' '}
                  <strong>{jd.rejectedBy || jd.currentApproverName}</strong>
                  {jd.rejectedByRole ? ` (${jd.rejectedByRole})` : ''}.
                  Use <strong>Duplicate & Create New</strong> to start a fresh version.
                </span>
              </div>
            )}
            {jd.status === 'Changes Requested' && (
              <div className="mx-5 mb-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>{jd.changesRequestedBy || jd.currentApproverName}</strong>
                  {jd.changesRequestedByRole ? ` (${jd.changesRequestedByRole})` : ''} has requested changes.
                  {(userRole === 'recruiter' || userRole === 'admin') ? ' Edit and resubmit to restart the approval workflow.' : ''}
                </span>
              </div>
            )}

            {/* ── TABS (fixed, never clips) ─────────────────────────── */}
            <div className="flex border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/30 px-4 pt-1 gap-1 overflow-x-auto scrollbar-none">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`
                    px-3 py-2 text-[11px] font-bold border-b-2 transition-all whitespace-nowrap shrink-0
                    ${activeTab === t.id
                      ? 'border-brand text-brand bg-white dark:bg-slate-800 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }
                  `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SCROLLABLE CONTENT AREA — only this scrolls
          ════════════════════════════════════════════════════════════════ */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            <div className="p-5 space-y-5">

              {/* ── JD Content Tab ── */}
              {activeTab === 'details' && (
                <div className="space-y-5">
                  {renderApprovalTimeline()}

                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                    {/* Job Summary */}
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Job Summary</h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">{jd.summary}</p>
                    </div>

                    {/* Responsibilities */}
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Responsibilities</h3>
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
                        {jd.responsibilities}
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Required Skills</h3>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 break-words">
                          {jd.requiredSkills}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Preferred Skills</h3>
                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 break-words">
                          {jd.preferredSkills || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Compensation */}
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Compensation & Benefits</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">Salary Range</span>
                          <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm break-words">
                            {jd.currency} ${Number(jd.salaryMin).toLocaleString()} – ${Number(jd.salaryMax).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">Variable Bonus</span>
                          <div className="font-bold text-slate-800 dark:text-slate-200 break-words">{jd.variablePay || 'None'}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">Equity / Perks</span>
                          <div className="font-bold text-slate-800 dark:text-slate-200 break-words">{jd.otherComp || 'Standard'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Version History Tab ── */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Immutable Version History</h3>
                  {jd.versionHistory?.map((ver, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-brand/10 text-brand rounded">{ver.version}</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{ver.summary}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">Changed by {ver.changedBy} on {ver.date}</div>
                      </div>
                      <ModernStatusBadge status={ver.status} />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Audit Trail Tab ── */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Audit Trail Log</h3>
                  {jd.auditTrail?.map((aud) => (
                    <div key={aud.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 flex-wrap">
                          <span className="truncate">{aud.user}</span>
                          <span className="text-[10px] font-normal px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded shrink-0">{aud.role}</span>
                          <span className="text-brand shrink-0">• {aud.action}</span>
                        </div>
                        <p className="text-slate-500 mt-0.5 break-words">{aud.comment}</p>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 shrink-0 whitespace-nowrap">{aud.dateTime}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Compare Versions Tab ── */}
              {activeTab === 'compare' && (() => {
                const selectedVerObj = jd.versionHistory?.find(v => v.version === compareVersion);
                const prevSnap = selectedVerObj?.snapshot || jd.previousSnapshot || {
                  summary: 'Initial revision draft content.',
                  responsibilities: jd.responsibilities,
                  requiredSkills: jd.requiredSkills,
                  salaryMin: jd.salaryMin,
                  salaryMax: jd.salaryMax
                };
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Compare Current ({jd.version}) against:
                      </span>
                      <div className="w-64">
                        <CustomSelect
                          value={compareVersion}
                          onChange={(val) => setCompareVersion(val)}
                          options={jd.versionHistory?.map(v => ({ label: `${v.version} (${v.date}) – ${v.summary}`, value: v.version })) || []}
                          align="right"
                        />
                      </div>
                    </div>

                    {[
                      { label: '1. Job Summary', prev: prevSnap.summary, curr: jd.summary },
                      { label: '2. Required Skills', prev: prevSnap.requiredSkills, curr: jd.requiredSkills },
                      { label: '3. Responsibilities', prev: prevSnap.responsibilities, curr: jd.responsibilities }
                    ].map(({ label, prev, curr }) => (
                      <div key={label} className="space-y-1">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                          <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl max-h-36 overflow-y-auto">
                            <span className="text-[10px] font-bold text-red-600 block mb-1">Previous ({compareVersion})</span>
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line break-words">{prev}</p>
                          </div>
                          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl max-h-36 overflow-y-auto">
                            <span className="text-[10px] font-bold text-emerald-600 block mb-1">Current ({jd.version})</span>
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line break-words">{curr}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>
          </div>
          {/* END scrollable content */}

        </div>
      </div>

      {/* ── Approver Action Modal (z-[100000], above main modal) ─────────────────── */}
      {actionModal && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" dir="ltr">
          <div
            className="bg-white dark:bg-[#0A0C10] border border-slate-200 dark:border-slate-800 w-full rounded-2xl p-6 space-y-4 shadow-2xl"
            style={{ maxWidth: 'min(480px, calc(100vw - 32px))' }}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {actionModal === 'AdminOverride'
                ? '🛡️ Admin Authorized Override'
                : <><span>Confirm Action: </span><span className="text-brand">{actionModal}</span></>
              }
            </h3>

            {actionModal === 'AdminOverride' && (
              <>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-xs text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  This is an <strong>authorized ATS Admin override</strong>. It will be recorded in the Audit Trail. Select the override action:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Approve', 'Changes', 'Reject', 'Cancel Workflow'].map(act => (
                    <button
                      key={act}
                      onClick={() => setActionModal(`AdminOverride_${act}`)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${
                        act === 'Approve' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' :
                        act === 'Reject' || act === 'Cancel Workflow' ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' :
                        'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-xs text-slate-500">
              Acting as <strong className="text-slate-800 dark:text-slate-200">{userRole}</strong> on record <strong>{jd.id}</strong>.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {actionModal === 'Approve' ? 'Approval Note (optional)' : <>Reason / Comment <span className="text-red-500">* Required</span></>}
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => { setComment(e.target.value); setCommentError(''); }}
                placeholder={
                  actionModal === 'Approve' ? 'Optional approval comments...' :
                  actionModal === 'AdminOverride' ? 'State the authorized reason for this admin override...' :
                  'Please specify requested changes or rejection rationale...'
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand resize-none"
              />
              {commentError && <span className="text-[10px] font-bold text-red-500 mt-1 block">{commentError}</span>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md ${
                  actionModal === 'Approve' || actionModal?.endsWith('Approve') ? 'bg-emerald-600 hover:bg-emerald-700' :
                  actionModal === 'Changes' || actionModal?.endsWith('Changes') ? 'bg-amber-500 hover:bg-amber-600' :
                  actionModal?.startsWith('AdminOverride') ? 'bg-purple-600 hover:bg-purple-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {actionModal?.startsWith('AdminOverride') ? 'Override' : actionModal}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
