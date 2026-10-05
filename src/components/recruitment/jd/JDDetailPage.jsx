import React, { useState, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Edit2, CheckCircle2, Clock, AlertCircle,
  Building, MapPin, Tag, Briefcase, DollarSign, Users,
  FileText, Shield, RefreshCw, Copy, Archive, Globe,
  ChevronDown, X, Share2, Printer, Bell, UserPlus, FileUp,
  ShieldCheck, Lock, ExternalLink, Download, Layers, Eye, MoreHorizontal, Check, Trash2
} from 'lucide-react';
import { ModernStatusBadge } from '../../admin/shared/ModernAdminLayoutComponents';
import { motion, AnimatePresence } from 'framer-motion';

import { ThemeContext } from '../../../ThemeContext';
import { hasJdPermission, CURRENT_USER_MAP } from './jdMockData';
import CustomSelect from '../../dashboard/shared/CustomSelect';

// ─── Shared Sub-components ──────────────────────────────────────────────────
const QuickInfoRow = ({ label, value, icon: Icon, isMonospace = false, isHighlight = false, highlightColor }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0 text-xs">
    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
      {Icon && <Icon size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />}
      {label}
    </span>
    <span className={`font-semibold text-right ${
      isMonospace ? 'font-mono text-[11px]' : ''
    } ${
      isHighlight ? 'font-bold' : 'text-slate-900 dark:text-slate-100'
    }`} style={isHighlight && highlightColor ? { color: highlightColor } : {}}>
      {value || '—'}
    </span>
  </div>
);

const SideCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
      {Icon && <Icon size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />}
      <span>{title}</span>
    </h3>
    <div>{children}</div>
  </div>
);

const InfoTile = ({ label, value, subtext }) => (
  <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-2xs">
    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{label}</span>
    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">{value || '—'}</span>
    {subtext && <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">{subtext}</span>}
  </div>
);

// ─── User Role Mapping ──────────────────────────────────────────────────────
const currentUserMap = {
  recruiter: 'Sarah Chen (Recruiter)',
  hiring_manager: 'Alex Rivera (Hiring Manager)',
  hr_lead: 'Elena Rostova (HR & Compliance Lead)',
  hrbp: 'Elena Rostova (HR & Compliance Lead)',
  admin: 'System Admin',
  viewer: 'Auditor Viewer'
};

// ─── Toast Notification ──────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles = {
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-500 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white'
  };
  const icons = {
    success: '✓',
    warning: '↩',
    error: '✕',
    info: 'ℹ'
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[80] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold animate-fade-in-up ${styles[type]}`}
      style={{ minWidth: 280, maxWidth: 420 }}
    >
      <span className="text-base leading-none font-bold">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 text-base leading-none">&times;</button>
    </div>
  );
}

// ─── Compact Action Confirmation Popup ───────────────────────────────────────
function JDActionPopup({ actionType, jd, userRole, onConfirm, onClose }) {
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const config = {
    Approve: {
      title: 'Approve Job Description?',
      subtitle: `${jd.id} · ${jd.title}`,
      message: 'Are you sure you want to approve this Job Description?',
      fieldLabel: 'Approval note',
      placeholder: 'Optional comment for audit log...',
      required: false,
      btnLabel: 'Approve',
      btnCls: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      icon: '✓'
    },
    Changes: {
      title: 'Request Changes?',
      subtitle: `${jd.id} · ${jd.title}`,
      message: 'Please specify the revisions required before this JD can be approved.',
      fieldLabel: 'Required changes details',
      placeholder: 'Describe required changes...',
      required: true,
      btnLabel: 'Request Changes',
      btnCls: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
      icon: '↩'
    },
    Reject: {
      title: 'Reject Job Description?',
      subtitle: `${jd.id} · ${jd.title}`,
      message: 'This action will reject the current JD approval request.',
      fieldLabel: 'Rejection reason',
      placeholder: 'Enter rejection justification...',
      required: true,
      btnLabel: 'Reject JD',
      btnCls: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      iconBg: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
      icon: '✕'
    },
    Publish: {
      title: 'Publish Job Description?',
      subtitle: `${jd.id} · ${jd.title}`,
      message: 'Publishing will make this approved Job Description available across enterprise requisitions.',
      fieldLabel: 'Publish note',
      placeholder: 'Optional publication note...',
      required: false,
      btnLabel: 'Publish JD',
      btnCls: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
      icon: '🌐'
    },
    AdminOverride: {
      title: '🛡️ Admin Override',
      subtitle: `${jd.id} · ${jd.title}`,
      message: 'This is an authorized ATS Admin override. Action will be recorded in the Audit Trail.',
      fieldLabel: 'Override reason',
      placeholder: 'State authorized override justification...',
      required: true,
      btnLabel: 'Confirm Override',
      btnCls: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
      icon: '🛡'
    }
  };

  const baseType = actionType?.startsWith('AdminOverride') ? 'AdminOverride' : actionType;
  const cfg = config[baseType] || config.Approve;

  const handleConfirm = () => {
    if (cfg.required && !comment.trim()) {
      setCommentError('This field is required.');
      inputRef.current?.focus();
      return;
    }
    onConfirm(actionType, jd, comment.trim());
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      dir="ltr"
    >
      <div
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full overflow-hidden"
        style={{ maxWidth: 'min(460px, calc(100vw - 32px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${cfg.iconBg}`}>
              {cfg.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{cfg.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-mono">{cfg.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 ml-2"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3.5">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{cfg.message}</p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              {cfg.fieldLabel}
              {cfg.required && <span className="text-red-500 text-[10px] font-bold">*</span>}
            </label>
            <textarea
              ref={inputRef}
              rows={3}
              value={comment}
              onChange={(e) => { setComment(e.target.value); setCommentError(''); }}
              placeholder={cfg.placeholder}
              className={`
                w-full px-3 py-2.5 text-xs rounded-xl border bg-slate-50 dark:bg-slate-950
                text-slate-900 dark:text-white placeholder-slate-400 resize-none
                focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all
                ${commentError
                  ? 'border-red-400 dark:border-red-700 focus:ring-red-300'
                  : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                }
              `}
            />
            {commentError && (
              <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                <span>⚠</span> {commentError}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${cfg.btnCls}`}
          >
            {cfg.btnLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main JD Detail Page ─────────────────────────────────────────────────────
export default function JDDetailPage({ jd, onBack, onAction, userRole = 'recruiter', onSwitchRole }) {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#3b82f6';

  const [activeTab, setActiveTab] = useState('content');
  const [actionModal, setActionModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [compareVersion, setCompareVersion] = useState(jd?.versionHistory?.[0]?.version || 'v1.0');
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const moreActionsRef = useRef(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target)) {
        setIsMoreActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!jd) return null;

  // ── Permission helpers ────────────────────────────────────────────────────
  const isApproverForCurrentStage = () => {
    if (jd.status !== 'Pending Approval') return false;
    if (userRole === 'admin') return true;
    if (userRole === 'recruiter' || userRole === 'viewer') return false;

    const pendingStage = jd.approvalChain?.find(s => s.status === 'Pending');
    if (!pendingStage) return false;
    const currentRole = jd.currentApproverRole || pendingStage.role;
    return (
      pendingStage.role === userRole || 
      currentRole === userRole || 
      ((userRole === 'hr_lead' || userRole === 'hrbp') && (pendingStage.role === 'hr_lead' || pendingStage.role === 'hrbp' || pendingStage.role === 'hr_head')) ||
      (userRole === 'hiring_manager' && pendingStage.role === 'hiring_manager')
    );
  };

  const canEdit = () => {
    if (userRole === 'admin') return true;
    if (!hasJdPermission(userRole, 'jd.edit')) return false;
    if (userRole === 'recruiter') {
      const myFirst = CURRENT_USER_MAP?.[userRole]?.split(' ')[0]?.toLowerCase() || 'sarah';
      const isOwner = !jd.createdBy || 
        jd.createdBy.toLowerCase().includes(myFirst) || 
        jd.createdBy.toLowerCase().includes('peopleworks') || 
        jd.createdBy.toLowerCase().includes('copilot') || 
        jd.createdBy.toLowerCase().includes('ai') || 
        jd.createdBy.toLowerCase().includes('sujith') || 
        jd.creatorRole === 'recruiter';
      return isOwner && (jd.status === 'Draft' || jd.status === 'Changes Requested' || jd.status === 'Pending Approval');
    }
    return false;
  };

  const canArchive = () => {
    if (!hasJdPermission(userRole, 'jd.archive')) return false;
    return true;
  };

  // ── Lifecycle Journey Stages ──────────────────────────────────────────────
  const isRejected = jd.status === 'Rejected';
  const isChangesRequested = jd.status === 'Changes Requested';

  // ── Tabs Definition ───────────────────────────────────────────────────────
  const tabs = [
    { id: 'content', label: 'JD Content' },
    { id: 'workflow', label: 'Approval Workflow' },
    { id: 'history', label: `Version History (${jd.versionHistory?.length || 1})` },
    ...(hasJdPermission(userRole, 'jd.viewAudit')
      ? [{ id: 'audit', label: `Audit Trail (${jd.auditTrail?.length || 0})` }]
      : []),
    { id: 'compare', label: 'Compare Versions' }
  ];

  const currentApproverDisplay = jd.currentApproverName || jd.approvalChain?.find(s => s.status === 'Pending')?.approverName || 'Alex Rivera (Hiring Manager)';

  // ── Status Banner Helper ─────────────────────────────────────────────────
  const renderStatusBanner = () => {
    if (jd.status === 'Rejected') return (
      <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 shadow-2xs">
        <Lock className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
        <div className="flex-1 leading-relaxed">
          <strong>Job Description Rejected:</strong> This JD was rejected by <strong>{jd.rejectedBy || currentApproverDisplay}</strong>
          {jd.rejectedByRole ? ` (${jd.rejectedByRole})` : ''}. Direct editing is locked.
          Use <strong>Duplicate &amp; Create New JD</strong> to initiate a new draft.
        </div>
      </div>
    );

    if (jd.status === 'Changes Requested') return (
      <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5 shadow-2xs">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 leading-relaxed">
          <strong>Changes Requested:</strong> <strong>{jd.changesRequestedBy || currentApproverDisplay}</strong>
          {jd.changesRequestedByRole ? ` (${jd.changesRequestedByRole})` : ''} requested revisions.
          {canEdit() ? ' Please update the requirements and click Edit & Resubmit to restart approval.' : ''}
        </div>
      </div>
    );

    if (jd.status === 'Pending Approval' && !isApproverForCurrentStage()) return (
      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2.5 shadow-2xs">
        <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex-1 leading-relaxed">
          <strong>Read-Only Mode:</strong> Active stage approver is <strong>{currentApproverDisplay}</strong>. Publishing is unavailable until all required approval stages are completed.
        </div>
      </div>
    );

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[1550px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-6"
    >
      
      {/* ═══════════════════════════════════════════════════════════════════
          1. COMPACT ENTITY HEADER (CLEAN & LOW-HEIGHT SAAS HEADER)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-30 bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-3">
        
        {/* Row 1: Back Nav + Title + Status + Primary Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Title & Status Group */}
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              {jd.title}
            </h1>

            <ModernStatusBadge status={jd.status} />

            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shrink-0">
              {(jd.version || '1.0').startsWith('v') ? jd.version : `v${jd.version}`}
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shrink-0">
              {jd.positions || 1} {Number(jd.positions || 1) === 1 ? 'Opening' : 'Vacancies'}
            </span>
          </div>

          {/* Contextual Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onSwitchRole && (
              <CustomSelect
                prefix="Role: "
                value={userRole === 'hrbp' || userRole === 'hr_head' ? 'hr_lead' : userRole}
                onChange={(val) => onSwitchRole(val)}
                options={[
                  { label: 'Recruiter / JD Owner', value: 'recruiter' },
                  { label: 'Hiring Manager', value: 'hiring_manager' },
                  { label: 'HR & Compliance Lead', value: 'hr_lead' },
                  { label: 'Super Admin', value: 'admin' }
                ]}
                size="sm"
                className="w-56"
              />
            )}
            {/* Stage Approver Actions */}
            {isApproverForCurrentStage() && (
              <>
                <button
                  onClick={() => setActionModal('Approve')}
                  className="h-8 px-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <CheckCircle2 size={13} /> Approve JD
                </button>
                <button
                  onClick={() => setActionModal('Changes')}
                  className="h-8 px-3.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Clock size={13} /> Request Changes
                </button>
                <button
                  onClick={() => setActionModal('Reject')}
                  className="h-8 px-3.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <X size={13} /> Reject
                </button>
              </>
            )}

            {/* Edit / Resubmit */}
            {canEdit() && (jd.status === 'Draft' || jd.status === 'Changes Requested' || jd.status === 'Pending Approval') && (
              <button
                onClick={() => onAction('EditRevision', jd)}
                className="h-8 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <Edit2 size={13} className="text-blue-500" />
                <span>{jd.status === 'Changes Requested' ? 'Edit & Resubmit' : 'Edit JD'}</span>
              </button>
            )}

            {/* Publish JD */}
            {jd.status === 'Approved' && (hasJdPermission(userRole, 'jd.publish') || userRole === 'recruiter') && (
              <button
                onClick={() => setActionModal('Publish')}
                style={{ backgroundColor: brandColor }}
                className="h-8 px-3.5 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
              >
                <Globe size={13} /> Publish JD
              </button>
            )}

            {/* Primary Action: Create New Version */}
            {(jd.status === 'Approved' || jd.status === 'Published') && (
              <button
                onClick={() => onAction('CreateNewVersion', jd)}
                style={{ backgroundColor: brandColor }}
                className="h-8 px-3.5 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw size={13} /> Create New Version
              </button>
            )}

            {/* Duplicate for Rejected */}
            {jd.status === 'Rejected' && (
              <button
                onClick={() => onAction('DuplicateJD', jd)}
                style={{ backgroundColor: brandColor }}
                className="h-8 px-3.5 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
              >
                <Copy size={13} /> Duplicate &amp; Create New JD
              </button>
            )}

            {/* More Actions Dropdown */}
            <div className="relative" ref={moreActionsRef}>
              <button
                onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
                className="h-8 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>More Actions</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${isMoreActionsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMoreActionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 z-[100] text-xs divide-y divide-slate-100 dark:divide-slate-800"
                    style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
                  >
                    <div className="py-0.5">
                      <button
                        onClick={() => { setActiveTab('workflow'); setIsMoreActionsOpen(false); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Eye size={14} className="text-slate-500" /> View Approval Details
                      </button>
                      <button
                        onClick={() => {
                          showToast('JD exported successfully.', 'success');
                          setIsMoreActionsOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Download size={14} className="text-slate-500" /> Export JD
                      </button>
                      <button
                        onClick={() => {
                          onAction('DuplicateJD', jd);
                          setIsMoreActionsOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Copy size={14} className="text-slate-500" /> Duplicate JD
                      </button>
                    </div>
                    {canArchive() && (
                      <div className="py-0.5">
                        <button
                          onClick={() => {
                            onAction('Archive', jd);
                            setIsMoreActionsOpen(false);
                          }}
                          className="w-full px-3.5 py-2 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                        >
                          <Archive size={14} /> Archive JD
                        </button>
                        <button
                          onClick={() => {
                            onAction('Delete', jd);
                            setIsMoreActionsOpen(false);
                          }}
                          className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} /> Delete JD
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Row 2: Compact Inline Clean Metadata Strip matching Requisitions */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <FileText size={12} className="text-slate-400" />
            <span>{jd.id}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Briefcase size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Linked Requisition:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">{jd.reqId || 'REQ-2026-0001'}</strong>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Building size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Business Unit:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200">{jd.businessUnit || 'Cloud & AI Platform'}</strong>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Layers size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Department:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200">{jd.department || 'Engineering'}</strong>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <MapPin size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Location:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200">{jd.location || 'Bangalore'} ({jd.workMode || 'Hybrid'})</strong>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Users size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Hiring Manager:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200">{jd.hiringManager || 'Alex Rivera'}</strong>
          </div>
        </div>

      </div>

      {/* Status Notice Banner (if any) */}
      {renderStatusBanner()}

      {/* ═══════════════════════════════════════════════════════════════════
          2. JD LIFECYCLE STEPPER (MILD BLUE GLASS & BRAND STEPPERS)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-100/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">JD Lifecycle Workflow</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Current Stage: <strong className="font-bold text-blue-600 dark:text-blue-400">{jd.status}</strong>
            </span>
          </div>
          <button
            onClick={() => setActiveTab('workflow')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Lifecycle History</span>
            <ChevronDown size={12} className="-rotate-90" />
          </button>
        </div>

        {/* Compact Workflow Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
          {[
            { stage: 'Draft', stepNum: 1, label: '1. Draft Created' },
            { stage: 'Pending Approval', stepNum: 2, label: '2. Pending Approval' },
            { stage: 'Approved', stepNum: 3, label: '3. Approved' },
            { stage: 'Published', stepNum: 4, label: '4. Published' }
          ].map((s) => {
            // Determine state logic
            const statusMap = { 'Draft': 1, 'Pending Approval': 2, 'Approved': 3, 'Published': 4, 'Changes Requested': 2, 'Rejected': 2, 'Archived': 4 };
            const currentLevel = statusMap[jd.status] || 1;
            
            let isCompleted = s.stepNum < currentLevel || (jd.status === 'Published' && s.stepNum <= 4) || (jd.status === 'Approved' && s.stepNum <= 3);
            let isCurrent = s.stepNum === currentLevel && jd.status !== 'Changes Requested' && jd.status !== 'Rejected';
            let isWarning = s.stepNum === 2 && jd.status === 'Changes Requested';
            let isError = s.stepNum === 2 && jd.status === 'Rejected';

            return (
              <div
                key={s.stage}
                className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-br from-white via-blue-50/60 to-blue-50/30 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border-blue-300/80 dark:border-blue-800 shadow-[0_4px_15px_-2px_rgba(26,86,219,0.12)] -translate-y-0.5'
                    : isCompleted
                      ? 'bg-gradient-to-br from-blue-50/30 to-white/60 dark:from-blue-950/20 dark:to-slate-900/40 border-blue-100/80 dark:border-blue-900/30'
                      : isWarning
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                        : isError
                          ? 'bg-red-50/60 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                          : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCompleted || isCurrent
                      ? 'text-white shadow-xs'
                      : isWarning
                        ? 'bg-amber-500 text-white'
                        : isError
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                  style={isCompleted || isCurrent ? { backgroundColor: brandColor } : {}}
                >
                  {isCompleted ? <Check size={13} strokeWidth={3} /> : s.stepNum}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-bold truncate ${
                    isCurrent
                      ? 'text-blue-950 dark:text-blue-100'
                      : isCompleted
                        ? 'text-slate-800 dark:text-slate-200'
                        : isWarning
                          ? 'text-amber-900 dark:text-amber-200'
                          : isError
                            ? 'text-red-900 dark:text-red-200'
                            : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {isWarning ? 'Changes Requested' : isError ? 'Rejected' : s.stage}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {isCompleted ? '✓ Stage Completed' : isCurrent ? 'Active Workflow' : isWarning ? 'Attention Required' : isError ? 'Rejected' : 'Upcoming'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supporting Metadata Footer Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <div>
            Created by <strong className="font-semibold text-slate-700 dark:text-slate-300">{jd.createdBy || 'Recruiter'}</strong> on {jd.createdDate || 'Recent'}
          </div>
          <div>
            Last Modified: <strong className="font-semibold text-slate-700 dark:text-slate-300">{jd.lastModified || 'Just now'}</strong>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. TAB NAVIGATION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-6 overflow-x-auto scrollbar-none" aria-label="Tabs">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={isActive ? { color: brandColor, borderColor: brandColor } : {}}
                className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-b-2'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. MAIN CONTENT AREA
      ═══════════════════════════════════════════════════════════════════ */}

      {/* ── TAB 1: JD CONTENT ────────────────────────────────────────────── */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT SIDE: Primary Job Description Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Job Summary & Core Details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">Job Summary</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">{jd.summary}</p>
              </div>

              {/* Responsibilities */}
              {jd.responsibilities && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Responsibilities</h3>
                  <div className="space-y-2">
                    {(Array.isArray(jd.responsibilities) ? jd.responsibilities : String(jd.responsibilities).split('\n')).filter(r => r && String(r).trim()).map((resp, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: brandColor }} />
                        <span className="leading-relaxed break-words">{String(resp).replace(/^[-•]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Qualifications */}
              {jd.qualifications && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">Qualifications</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">{jd.qualifications}</p>
                </div>
              )}
            </div>

            {/* Skills & Requirements Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Skills &amp; Requirements</h3>
              
              {jd.requiredSkills && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">Required Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(jd.requiredSkills) ? jd.requiredSkills : String(jd.requiredSkills).split(',')).map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/50">
                        {typeof skill === 'string' ? skill.trim() : String(skill)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {jd.preferredSkills && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">Preferred Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(jd.preferredSkills) ? jd.preferredSkills : String(jd.preferredSkills).split(',')).map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {typeof skill === 'string' ? skill.trim() : String(skill)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {jd.technicalSkills && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Technical Stack &amp; Tools</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 break-words">{Array.isArray(jd.technicalSkills) ? jd.technicalSkills.join(', ') : jd.technicalSkills}</p>
                </div>
              )}
            </div>

            {/* Compensation & Benefits Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Compensation &amp; Benefits</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoTile
                  label={`Salary Range (${jd.currency || 'USD'})`}
                  value={`$${Number(jd.salaryMin || 0).toLocaleString()} – $${Number(jd.salaryMax || 0).toLocaleString()}`}
                  subtext="Base Annual Target"
                />
                <InfoTile
                  label="Variable Pay / Bonus"
                  value={jd.variablePay || '15% Performance Bonus'}
                />
                <InfoTile
                  label="Equity / Options"
                  value={jd.otherComp || 'Standard RSU Package'}
                />
              </div>

              {jd.benefits && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Benefits Package</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 break-words leading-relaxed">{jd.benefits}</p>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDE: Sticky Quick Information Panel */}
          <div className="space-y-4 lg:sticky lg:top-6">
            
            <SideCard icon={FileText} title="Quick Information">
              <QuickInfoRow label="Job Code" value={jd.jobCode || jd.id} isMonospace />
              <QuickInfoRow label="Department" value={jd.department} />
              <QuickInfoRow label="Business Unit" value={jd.businessUnit} />
              <QuickInfoRow label="Job Family" value={jd.jobFamily || 'Software Engineering'} />
              <QuickInfoRow label="Job Level / Grade" value={jd.jobLevel || 'L5 / Senior'} />
              <QuickInfoRow label="Employment Type" value={jd.employmentType || 'Full-Time'} />
              <QuickInfoRow label="Location" value={jd.location} />
              <QuickInfoRow label="Work Mode" value={jd.workMode} isHighlight highlightColor={brandColor} />
              <QuickInfoRow label="Required Experience" value={`${jd.experienceMin || 5}–${jd.experienceMax || 8} Years`} />
              <QuickInfoRow label="Open Requisitions" value={`${jd.positions || 1} Open Position${(jd.positions || 1) > 1 ? 's' : ''}`} />
            </SideCard>

            <SideCard icon={Users} title="Governance & Record">
              <QuickInfoRow label="Created By" value={jd.createdBy || 'Sarah Chen (Recruiter)'} />
              <QuickInfoRow label="Created Date" value={jd.createdDate || 'Recent'} />
              <QuickInfoRow label="Last Modified" value={jd.lastModified || 'Recent'} />
              <QuickInfoRow label="Active Version" value={`v${jd.version || '1.0'}`} isMonospace isHighlight highlightColor={brandColor} />
              <QuickInfoRow
                label="Current Approver"
                value={
                  jd.status === 'Draft' ? '— Not Assigned' :
                  jd.status === 'Approved' || jd.status === 'Published' ? '✓ Fully Approved' :
                  jd.status === 'Changes Requested' ? (jd.changesRequestedBy || currentApproverDisplay) :
                  jd.status === 'Rejected' ? (jd.rejectedBy || currentApproverDisplay) :
                  currentApproverDisplay
                }
              />
            </SideCard>

          </div>

        </div>
      )}

      {/* ── TAB 2: APPROVAL WORKFLOW ────────────────────────────────────── */}
      {activeTab === 'workflow' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Approval Workflow Tracker</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Multi-stage approval chain sequence for enterprise job description validation.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {jd.approvalChain?.map((stage, idx) => {
              const isRecruiter = stage.stageId === 1;
              let cardBg = 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800';
              let badgeCls = 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
              let statusText = 'Waiting';

              if (isRecruiter && stage.status === 'Submitted') {
                cardBg = 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
                badgeCls = 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
                statusText = 'Submitted';
              } else if (stage.status === 'Approved') {
                cardBg = 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50';
                badgeCls = 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300';
                statusText = 'Approved ✓';
              } else if (stage.status === 'Pending') {
                cardBg = 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 ring-2 ring-amber-300/30';
                badgeCls = 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300';
                statusText = 'Pending Review';
              } else if (stage.status === 'Changes Requested') {
                cardBg = 'bg-orange-50/60 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800';
                badgeCls = 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300';
                statusText = 'Changes Requested';
              } else if (stage.status === 'Rejected') {
                cardBg = 'bg-red-50/60 dark:bg-red-950/30 border-red-300 dark:border-red-800';
                badgeCls = 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
                statusText = 'Rejected';
              }

              return (
                <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-2.5 ${cardBg}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {isRecruiter ? 'Submitted By' : `Stage ${(stage.stageId || idx + 1) - 1 || 1}`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeCls}`}>
                      {statusText}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{stage.roleName || stage.role}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{stage.approverName || 'Approver'}</div>
                  </div>
                  {stage.comment && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 italic border-t border-slate-200/60 dark:border-slate-800 pt-2 leading-relaxed break-words">
                      &ldquo;{stage.comment}&rdquo;
                    </div>
                  )}
                  {(stage.timestamp || stage.date) && (
                    <div className="text-[10px] text-slate-400 font-mono mt-auto pt-1">
                      {stage.timestamp || stage.date}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: VERSION HISTORY ───────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Version History</h3>
            <span className="text-xs text-slate-400 font-mono">Total Releases: {jd.versionHistory?.length || 1}</span>
          </div>

          <div className="space-y-3">
            {(jd.versionHistory && jd.versionHistory.length > 0 ? jd.versionHistory : [{ version: 'v1.0', changedBy: jd.createdBy || 'Sarah Chen', date: jd.createdDate || 'Recent', summary: 'Initial version', status: jd.status || 'Pending Approval' }]).map((ver, idx) => (
              <div key={idx} className="p-4 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800">
                      {ver.version || 'v1.0'}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{ver.summary || ver.changes || 'Initial release'}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Modified by <strong className="text-slate-700 dark:text-slate-300">{ver.changedBy || ver.author || jd.createdBy || 'Recruiter'}</strong> on {ver.date || ver.timestamp?.split('T')[0] || 'Recent'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ModernStatusBadge status={ver.status || jd.status || 'Pending Approval'} />
                  <button
                    onClick={() => {
                      setCompareVersion(ver.version || 'v1.0');
                      setActiveTab('compare');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg border border-blue-200/60 dark:border-blue-900/50 transition-colors cursor-pointer"
                  >
                    Compare
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: AUDIT TRAIL ───────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Audit Log Timeline</h3>
          
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 before:z-0">
            {(jd.auditTrail && jd.auditTrail.length > 0 ? jd.auditTrail : [{ id: 'AUD-01', user: jd.createdBy || 'Sarah Chen', role: 'Recruiter', action: 'Created JD', dateTime: 'Recent', comment: 'Initial JD record' }]).map((aud, idx) => (
              <div key={aud.id || idx} className="relative z-10 flex items-start gap-3.5">
                <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-1">
                  <Clock size={10} className="text-slate-500" />
                </div>
                <div className="flex-1 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">{aud.user || aud.performedBy || 'System'}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 font-medium">{aud.role || 'Recruiter'}</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">• {aud.action || 'Created'}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{aud.dateTime || aud.timestamp || 'Recent'}</span>
                  </div>
                  {(aud.comment || aud.details) && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 break-words leading-relaxed">
                      {typeof (aud.comment || aud.details) === 'object' ? JSON.stringify(aud.comment || aud.details) : String(aud.comment || aud.details)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: COMPARE VERSIONS ──────────────────────────────────────── */}
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
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Comparing Current (v{jd.version}) against Previous Snapshot:
              </span>
              <div className="w-64">
                <CustomSelect
                  value={compareVersion}
                  onChange={(val) => setCompareVersion(val)}
                  options={jd.versionHistory?.map(v => ({ label: `${v.version} (${v.date}) — ${v.summary}`, value: v.version })) || []}
                  align="right"
                />
              </div>
            </div>

            {[
              { label: 'Job Summary', prev: prevSnap.summary, curr: jd.summary },
              { label: 'Required Skills', prev: prevSnap.requiredSkills, curr: jd.requiredSkills },
              { label: 'Responsibilities', prev: prevSnap.responsibilities, curr: jd.responsibilities }
            ].map(({ label, prev, curr }) => (
              <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{label}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50/40 dark:bg-red-950/20 border border-red-200/70 dark:border-red-900/40 rounded-xl">
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-2">Previous Version ({compareVersion})</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line break-words leading-relaxed font-mono">{prev || '—'}</p>
                  </div>
                  <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-2">Current Active Version (v{jd.version})</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line break-words leading-relaxed font-mono">{curr || '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Action Dialog Popup ────────────────────────────────────────────── */}
      {actionModal && (
        <JDActionPopup
          actionType={actionModal}
          jd={jd}
          userRole={userRole}
          onConfirm={(type, record, note) => {
            onAction(type, record, note);
            const toastMessages = {
              Approve: 'Job Description approved successfully.',
              Changes: 'Changes requested successfully.',
              Reject: 'Job Description rejected.',
              Publish: 'Job Description published successfully.',
              AdminOverride: 'Admin override applied.'
            };
            const baseType = type?.startsWith('AdminOverride') ? 'AdminOverride' : type;
            showToast(toastMessages[baseType] || `Action "${type}" completed.`, baseType === 'Reject' ? 'error' : baseType === 'Changes' ? 'warning' : 'success');
          }}
          onClose={() => setActionModal(null)}
        />
      )}

      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

    </motion.div>
  );
}
