import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, ShieldCheck, UserCheck, DollarSign, Building, Calendar, 
  FileText, MessageSquare, AlertCircle, Send, Plus, Edit2, Share2, Printer, ChevronRight, Layers, Flame, Award, Download, UserPlus, Bell, Sparkles, Copy, ExternalLink, Filter, Check, Briefcase, Users, Globe, History, FilePlus, ChevronDown, Eye, Archive, Trash2
} from 'lucide-react';
import { ModernStatusBadge } from '../../admin/shared/ModernAdminLayoutComponents';
import { useToast } from '../../shared/ToastContext';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import ApprovalChainStepper, { getRequisitionApprovalChain, sortApprovalChain, isRoleMatching } from './ApprovalChainStepper';
import RejectionReasonModal from './RejectionReasonModal';
import RequisitionApprovalModal from './RequisitionApprovalModal';
import { DatabaseService } from '../../../services/db/DatabaseService';

// ─── Quick Information Row Sub-component ────────────────────────────────────
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

// ─── Side Card Sub-component ────────────────────────────────────────────────
const SideCard = ({ icon: Icon, title, children }) => (
  <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)]">
    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
      {Icon && <Icon size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />}
      <span>{title}</span>
    </h3>
    <div>{children}</div>
  </div>
);

const RequisitionDetails = ({ requisition, onBack, onEdit, simulatedRole, onRoleChange, brandColor = 'var(--pw-brand)', onUpdateRequisition }) => {
  const { addToast } = useToast();
  const [localReq, setLocalReq] = useState(requisition);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'ai_match' | 'budget' | 'approvals' | 'history'
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [activeRejectStage, setActiveRejectStage] = useState(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [activeApproveStage, setActiveApproveStage] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('All');
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const moreActionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target)) {
        setIsMoreActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    setLocalReq(requisition);
  }, [requisition]);

  const req = localReq || requisition;

  const currentChain = getRequisitionApprovalChain(req);
  const activePendingStep = currentChain.find(s => s.status === 'Pending');
  const isMyTurnToApprove = activePendingStep && isRoleMatching(simulatedRole, activePendingStep.role);

  if (!req) return null;

  // ── Controlled Status Transition Validation Helper ─────────────────────────────
  const validateStatusTransition = (targetStatus) => {
    const currentStatus = req.status || 'Draft';
    
    // Status Flow rules: Draft -> Pending Approval -> Approved -> Open/Active -> On Hold -> Closed
    if (currentStatus === 'Closed' && targetStatus === 'Approved') {
      addToast({
        title: 'Status Transition Blocked',
        message: 'A Closed requisition cannot be directly Approved without reopening to Draft.',
        type: 'error'
      });
      return false;
    }

    if (currentStatus === 'Draft' && targetStatus === 'Open') {
      addToast({
        title: 'Approval Required',
        message: 'Requisitions in Draft state must be submitted for Approval before moving to Active status.',
        type: 'warning'
      });
      return false;
    }

    return true;
  };

  // ── Handler Callbacks ─────────────────────────────────────────────────────
  const handleApproveStage = (stageStep) => {
    if (!validateStatusTransition('Approved')) return;
    setActiveApproveStage(stageStep || activePendingStep);
    setApprovalModalOpen(true);
  };

  const handleConfirmApprove = (approvalComment) => {
    const rawChain = getRequisitionApprovalChain(req);
    const targetStep = activeApproveStage || activePendingStep;
    
    // Find target index safely by comparing ID or normalized role
    let targetIdx = -1;
    if (targetStep) {
      targetIdx = rawChain.findIndex(s => {
        if (targetStep.id && s.id && s.id === targetStep.id) return true;
        if (targetStep.role && s.role && s.role.trim().toLowerCase() === targetStep.role.trim().toLowerCase()) return true;
        return false;
      });
    }
    
    // Fallback: the active Pending step
    if (targetIdx === -1) {
      targetIdx = rawChain.findIndex(s => s.status === 'Pending');
    }

    if (targetIdx === -1) return;

    const approvedStep = rawChain[targetIdx];
    let nextChain = rawChain.map((step, idx) => {
      if (idx === targetIdx) {
        return { 
          ...step, 
          status: 'Approved', 
          date: new Date().toISOString(),
          approverName: simulatedRole || step.name,
          comment: approvalComment || undefined
        };
      }
      return step;
    });

    // Automatically set the next step in line to 'Pending'
    let nextActivated = false;
    nextChain = nextChain.map((step, idx) => {
      if (idx > targetIdx && step.status !== 'Approved' && !nextActivated) {
        nextActivated = true;
        return { ...step, status: 'Pending' };
      }
      return step;
    });

    const remainingUnapproved = nextChain.filter(s => s.status !== 'Approved' && s.status !== 'Submitted');
    const isFullyApproved = remainingUnapproved.length === 0;

    const newHistoryItem = { 
      action: `Approved Stage: ${approvedStep?.role || 'Stage Sign-off'}`, 
      by: simulatedRole || 'Approver', 
      date: new Date().toISOString(),
      prevValue: 'Pending',
      newValue: isFullyApproved ? 'Fully Approved' : 'Stage Approved',
      comment: approvalComment || undefined
    };

    const updatedCommentsList = approvalComment ? [
      ...(req.commentsList || req.comments || []),
      {
        author: simulatedRole || 'Approver',
        role: approvedStep?.role || 'Approver',
        text: `[Approval Note] ${approvalComment}`,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ] : (req.commentsList || req.comments || []);

    const updated = {
      ...req,
      status: isFullyApproved ? 'Approved' : 'Pending Approval',
      approvalChain: nextChain,
      commentsList: updatedCommentsList,
      history: [
        ...(req.history || []),
        newHistoryItem
      ]
    };
    
    setLocalReq(updated);
    if (onUpdateRequisition) onUpdateRequisition(updated);

    try {
      DatabaseService.init();
      const dbIdx = DatabaseService.requisitions.findIndex(r => r.id === updated.id);
      if (dbIdx !== -1) {
        DatabaseService.requisitions[dbIdx] = updated;
        DatabaseService.persistAll();
      }
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('pw_requisitions');
        if (stored) {
          const list = JSON.parse(stored);
          const sIdx = list.findIndex(r => r.id === updated.id);
          if (sIdx !== -1) {
            list[sIdx] = updated;
            sessionStorage.setItem('pw_requisitions', JSON.stringify(list));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    setApprovalModalOpen(false);
    setActiveApproveStage(null);

    addToast({ 
      title: isFullyApproved ? 'Requisition Fully Approved' : `${approvedStep?.role || 'Stage'} Signed Off`, 
      message: isFullyApproved 
        ? `${req.id} has completed all approval stages and is ready for sourcing.` 
        : `Stage "${approvedStep?.role || 'Approval'}" signed off successfully. Proceeding to next approver.`, 
      type: 'success' 
    });
  };

  const handleOpenRejectModal = (stageStep) => {
    setActiveRejectStage(stageStep);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = (rejectionReason) => {
    const rawChain = getRequisitionApprovalChain(req);
    const nextChain = rawChain.map(step => {
      const isTarget = activeRejectStage && (
        (activeRejectStage.id && step.id && step.id === activeRejectStage.id) ||
        (activeRejectStage.role && step.role && step.role.trim().toLowerCase() === activeRejectStage.role.trim().toLowerCase())
      );
      if (isTarget || (!activeRejectStage && step.status === 'Pending')) {
        return { ...step, status: 'Rejected', rejectionComment: rejectionReason, date: new Date().toISOString() };
      }
      return step;
    });

    const updated = {
      ...req,
      status: 'Rejected',
      rejectionReason: rejectionReason,
      approvalChain: nextChain,
      history: [
        ...(req.history || []),
        { 
          action: `Rejected Stage: ${activeRejectStage?.role || 'Approval'}`, 
          by: simulatedRole || 'Approver', 
          date: new Date().toISOString(),
          prevValue: 'Pending Approval',
          newValue: 'Rejected'
        }
      ]
    };

    setLocalReq(updated);
    if (onUpdateRequisition) onUpdateRequisition(updated);

    try {
      DatabaseService.init();
      const dbIdx = DatabaseService.requisitions.findIndex(r => r.id === updated.id);
      if (dbIdx !== -1) {
        DatabaseService.requisitions[dbIdx] = updated;
        DatabaseService.persistAll();
      }
    } catch (e) {
      console.error(e);
    }

    setRejectModalOpen(false);
    setActiveRejectStage(null);
    addToast({ 
      title: 'Requisition Rejected', 
      message: `${req.id} returned to Hiring Manager with mandatory rejection notes.`, 
      type: 'info' 
    });
  };

  const handleRecruiterAccept = () => {
    if (!validateStatusTransition('Open')) return;

    const updated = {
      ...req,
      status: 'Open',
      recruiter: 'Sarah Jenkins',
      history: [
        ...(req.history || []),
        { action: 'Assigned to Recruiter (Sarah Jenkins)', by: simulatedRole || 'HR Lead', date: new Date().toISOString(), prevValue: 'Approved', newValue: 'Open' }
      ]
    };
    if (onUpdateRequisition) onUpdateRequisition(updated);
    addToast({ title: 'Sourcing Started', message: `Assigned to Sarah Jenkins. Job Description module initiated.`, type: 'success' });
  };

  const handleNudgeApprover = (approverName) => {
    addToast({
      title: 'Nudge Reminder Sent',
      message: `An automated SLA reminder notification was dispatched to ${approverName || 'the pending approver'}.`,
      type: 'info'
    });
    const updated = {
      ...req,
      history: [
        ...(req.history || []),
        { action: `Nudge Reminder sent to ${approverName || 'Approver'}`, by: simulatedRole || 'System', date: new Date().toISOString() }
      ]
    };
    if (onUpdateRequisition) onUpdateRequisition(updated);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentObj = {
      author: simulatedRole || 'Team Member',
      text: newComment,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = {
      ...req,
      commentsList: [...(req.commentsList || []), commentObj]
    };
    if (onUpdateRequisition) onUpdateRequisition(updated);
    setNewComment('');
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast({ title: 'Link Copied', message: 'Requisition control room URL copied to clipboard.', type: 'success' });
  };

  const pipeline = req.pipeline || { applied: 8, screened: 4, interviewing: 2, offer: 0, hired: 0 };
  const topCandidates = req.topCandidates || [];
  const filteredCandidates = selectedStageFilter === 'All' 
    ? topCandidates 
    : topCandidates.filter(c => c.stage.toLowerCase() === selectedStageFilter.toLowerCase());

  // ── Tabs Definition ───────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview', label: 'Overview & Job Specs', icon: FileText },
    { id: 'ai_match', label: `Candidates & Talent Match (${topCandidates.length})`, icon: UserPlus },
    { id: 'budget', label: 'Financials & Hardware', icon: DollarSign },
    { id: 'approvals', label: 'Approval Workflow', icon: ShieldCheck },
    { id: 'history', label: 'Audit Trail', icon: Clock }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[1550px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-6"
    >
      
      {/* ═══════════════════════════════════════════════════════════════════
          1. COMPACT ENTITY HEADER (MATCHING JD DETAIL PAGE FORMAT)
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
              {req.jobTitle}
            </h1>

            <ModernStatusBadge status={req.status} />

            {/* SLA Timer Badge */}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 shrink-0 ${
              req.isOverdue || (req.slaDaysLeft || 0) <= 1
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${req.isOverdue ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              {req.isOverdue ? 'SLA Overdue!' : `SLA: ${req.slaDaysLeft || 12} Days`}
            </span>

            {/* Vacancy Pill */}
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shrink-0">
              {req.headcount} Vacancies
            </span>
          </div>

          {/* Contextual Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onRoleChange && (
              <CustomSelect
                prefix="Role: "
                value={simulatedRole}
                onChange={(val) => onRoleChange(val)}
                options={[
                  { label: 'Hiring Manager', value: 'Hiring Manager' },
                  { label: 'Recruiter / HR', value: 'HR Recruiter' },
                  { label: 'Department Head', value: 'Department Head / Approver' },
                  { label: 'Finance Approver', value: 'Finance Approver' },
                  { label: 'Super Admin', value: 'Super Admin' }
                ]}
                size="sm"
                className="w-48"
              />
            )}

            {req.status === 'Pending Approval' && (
              <button
                onClick={() => handleNudgeApprover(req.approvalChain?.find(c => c.status === 'Pending')?.name)}
                className="h-8 px-3.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <Bell size={13} className="text-white animate-pulse" /> Nudge
              </button>
            )}

            {isMyTurnToApprove && req.status === 'Pending Approval' && (
              <>
                <button
                  onClick={() => handleApproveStage(activePendingStep)}
                  className="h-8 px-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <CheckCircle2 size={13} /> Approve {activePendingStep ? `(${activePendingStep.role})` : ''}
                </button>
                <button
                  onClick={() => handleOpenRejectModal(activePendingStep)}
                  className="h-8 px-3.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <XCircle size={13} /> Reject
                </button>
              </>
            )}

            {simulatedRole === 'HR Recruiter' && req.status === 'Approved' && (
              <button
                onClick={handleRecruiterAccept}
                style={{ backgroundColor: brandColor }}
                className="h-8 px-3.5 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
              >
                <UserPlus size={13} /> Start Sourcing
              </button>
            )}

            {simulatedRole === 'Hiring Manager' && (
              <button
                onClick={onEdit}
                style={{ backgroundColor: brandColor }}
                className="h-8 px-3.5 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer active:scale-95"
              >
                <Edit2 size={13} /> Edit Requisition
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
                        onClick={() => { setActiveTab('approvals'); setIsMoreActionsOpen(false); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Eye size={14} className="text-slate-500" /> View Approval Details
                      </button>
                      <button
                        onClick={() => {
                          addToast({ title: 'Export Success', message: `Exported ${req.id} specifications to CSV.`, type: 'success' });
                          setIsMoreActionsOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Download size={14} className="text-slate-500" /> Export Requisition
                      </button>
                      <button
                        onClick={() => {
                          addToast({ title: 'Requisition Cloned', message: `Draft duplicate of ${req.id} created.`, type: 'success' });
                          setIsMoreActionsOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Copy size={14} className="text-slate-500" /> Duplicate Requisition
                      </button>
                      <button
                        onClick={() => { handleCopyLink(); setIsMoreActionsOpen(false); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Share2 size={14} className="text-slate-500" /> Share Link
                      </button>
                      <button
                        onClick={() => { window.print(); setIsMoreActionsOpen(false); }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Printer size={14} className="text-slate-500" /> Print Requisition
                      </button>
                    </div>
                    <div className="py-0.5">
                      <button
                        onClick={() => {
                          addToast({ title: 'Requisition Archived', message: `${req.id} has been moved to archive.`, type: 'info' });
                          setIsMoreActionsOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Archive size={14} /> Archive Requisition
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Row 2: Compact Inline Metadata Strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <FileText size={12} className="text-slate-400" />
            <span>{req.id}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Building size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Business Unit:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200">{req.businessUnit || 'Cloud & AI'}</strong>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Layers size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Department:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200">{req.department}</strong>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Users size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Hiring Manager:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200">{req.hiringManager}</strong>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Calendar size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Target Hire Date:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200">{req.targetHireDate}</strong>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. SOURCING FUNNEL STEPPER BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(26,86,219,0.03)] space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live ATS Sourcing Funnel</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Total Applicants: <strong className="font-semibold text-slate-900 dark:text-white font-mono">{req.candidateCount || 14}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Click stage to filter candidate talent match</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {[
            { label: 'Applied', val: pipeline.applied, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-950/30', border: 'border-blue-200/70 dark:border-blue-900/40' },
            { label: 'Screened', val: pipeline.screened, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-950/30', border: 'border-amber-200/70 dark:border-amber-900/40' },
            { label: 'Interviewing', val: pipeline.interviewing, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50/50 dark:bg-purple-950/30', border: 'border-purple-200/70 dark:border-purple-900/40' },
            { label: 'Offer Sent', val: pipeline.offer, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/50 dark:bg-indigo-950/30', border: 'border-indigo-200/70 dark:border-indigo-900/40' },
            { label: 'Hired', val: pipeline.hired, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-950/30', border: 'border-emerald-200/70 dark:border-emerald-900/40' },
          ].map((stage, idx) => (
            <button
              key={idx}
              onClick={() => { setSelectedStageFilter(stage.label); setActiveTab('ai_match'); }}
              className={`p-3 rounded-lg border ${stage.bg} ${stage.border} transition-all hover:scale-[1.01] text-left flex items-center justify-between cursor-pointer`}
            >
              <div>
                <div className={`text-base font-extrabold font-mono ${stage.color}`}>{stage.val}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stage.label}</div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. ENTERPRISE SAAS TAB NAVIGATION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-6 overflow-x-auto scrollbar-none" aria-label="Tabs">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            const Icon = t.icon;
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
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. MAIN CONTENT AREA (TWO-COLUMN ENTERPRISE LAYOUT)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Primary Workspace Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: OVERVIEW & JOB SPECS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Next Step Workflow Banner */}
              {(req.status === 'Approved' || req.status === 'Open') && (
                <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200/80 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ backgroundColor: brandColor }} 
                      className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md"
                    >
                      <FilePlus size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Next Action: Create &amp; Link Job Description (JD)
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        🔔 Notification sent to Recruiter (Sarah Jenkins) &amp; Hiring Manager ({req.hiringManager || 'Alex Chen'}) for JD Drafting.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('jd');
                      addToast({ title: 'Notification Triggered', message: `Routing to JD Creator linked with ${req.id}`, type: 'info' });
                    }}
                    style={{ backgroundColor: brandColor }}
                    className="px-3.5 py-2 text-xs font-extrabold text-white rounded-xl shadow-md flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shrink-0 active:scale-95 border border-white/20"
                  >
                    <FileText size={14} />
                    <span>Create &amp; Link JD for {req.id}</span>
                  </button>
                </div>
              )}

              {/* Job Description & Responsibilities */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                    Job Description &amp; Role Mission
                  </h3>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words">
                    {req.description || 'We are seeking a talented professional to lead key operational targets.'}
                  </p>
                </div>

                {req.responsibilities && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                      Key Responsibilities
                    </h3>
                    <div className="space-y-2">
                      {req.responsibilities.map((resp, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-relaxed break-words">{resp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                    Required Key Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(req.skills) 
                      ? req.skills 
                      : typeof req.skills === 'string' 
                      ? req.skills.split(',') 
                      : ['React', 'Node.js', 'GraphQL']
                    ).map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/50">
                        {typeof skill === 'string' ? skill.trim() : String(skill)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Internal Team Discussion Stream */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare size={15} style={{ color: brandColor }} /> Internal Notes &amp; Discussion ({req.commentsList?.length || req.comments?.length || 0})
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Real-time team chat</span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {(req.commentsList || req.comments || []).map((c, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{c.author}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {c.role || 'Member'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{c.date}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 break-words leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add an internal note or hiring rationale..."
                    className="flex-1 h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                  />
                  <button 
                    onClick={handleAddComment}
                    style={{ backgroundColor: brandColor }}
                    className="h-9 px-4 text-xs font-bold text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Send size={13} /> Post Note
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CANDIDATES & AI MATCH */}
          {activeTab === 'ai_match' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <UserPlus size={15} className="text-amber-500" /> Talent Match &amp; Candidate Recommendations
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Top candidates scored against job requirements and skills tags.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="text-slate-400">Filter Stage:</span>
                  <div className="w-32">
                    <CustomSelect 
                      value={selectedStageFilter}
                      onChange={(val) => setSelectedStageFilter(val)}
                      options={['All', 'Applied', 'Screened', 'Interviewing'].map(x => ({label: x === 'All' ? 'All Stages' : x, value: x}))}
                      size="sm"
                      align="right"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {filteredCandidates.map(cand => (
                  <div key={cand.id} className="p-4 bg-slate-50/70 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-blue-400 transition-all flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border" style={{ backgroundColor: `${brandColor}15`, color: brandColor, borderColor: `${brandColor}30` }}>
                        {cand.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{cand.name}</div>
                        <div className="text-xs text-slate-500">
                          {cand.role} • Stage: <strong style={{ color: brandColor }}>{cand.stage}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                        {cand.matchScore}% Match
                      </span>
                      <button className="h-8 px-3 text-xs font-semibold text-white rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 transition-colors cursor-pointer">
                        Schedule Screen
                      </button>
                    </div>
                  </div>
                ))}

                {filteredCandidates.length === 0 && (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No candidates found matching the selected stage filter.
                  </div>
                )}
              </div>

              {/* Recommended Channels */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommended Auto-Sourcing Channels</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">LinkedIn Recruiter</span>
                    <ExternalLink size={13} className="text-slate-400" />
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">GitHub Talent Pool</span>
                    <ExternalLink size={13} className="text-slate-400" />
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Internal Employee Network</span>
                    <ExternalLink size={13} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS & HARDWARE */}
          {activeTab === 'budget' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                Financial Allocation &amp; IT Provisioning
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50/70 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1 font-bold uppercase text-[10px]">Approved Salary Range</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{req.salaryBand}</span>
                </div>
                <div className="p-4 bg-slate-50/70 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1 font-bold uppercase text-[10px]">Cost Center Code</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{req.costCenter}</span>
                </div>
                <div className="p-4 bg-slate-50/70 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1 font-bold uppercase text-[10px]">Hardware Standard</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{req.hardware || 'MacBook Pro M3 Max'}</span>
                </div>
                <div className="p-4 bg-slate-50/70 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1 font-bold uppercase text-[10px]">Software Licensing</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{req.software || 'Standard SaaS Stack'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPROVAL WORKFLOW */}
          {activeTab === 'approvals' && (
            <ApprovalChainStepper 
              requisition={req} 
              onApprove={handleApproveStage} 
              onReject={handleOpenRejectModal} 
              simulatedRole={simulatedRole} 
              onRoleChange={onRoleChange}
            />
          )}

          {/* TAB 5: AUDIT TRAIL */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                Requisition Audit &amp; Lifecycle History
              </h3>

              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 before:z-0">
                {(req.history || []).map((item, i) => (
                  <div key={i} className="relative z-10 flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-1">
                      <Clock size={10} className="text-slate-500" />
                    </div>
                    <div className="flex-1 bg-slate-50/70 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{item.action}</span>
                          <span className="text-slate-400 text-[11px] block">By {item.by}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">{new Date(item.date).toLocaleString()}</span>
                      </div>
                      {item.comment && (
                        <p className="text-xs italic text-slate-700 dark:text-slate-300 mt-1.5 pl-2.5 border-l-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 py-1 rounded-r">
                          “{item.comment}”
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sticky Quick Information Panel */}
        <div className="space-y-4 lg:sticky lg:top-6">
          
          <SideCard icon={Briefcase} title="Quick Information">
            <QuickInfoRow label="Requisition ID" value={req.id} isMonospace />
            <QuickInfoRow label="Department" value={req.department} />
            <QuickInfoRow label="Business Unit" value={req.businessUnit || 'Cloud & AI'} />
            <QuickInfoRow label="Hiring Manager" value={req.hiringManager} />
            <QuickInfoRow label="Job Grade" value={req.jobGrade || 'L4 - Senior'} />
            <QuickInfoRow label="Vacancies" value={`${req.headcount} Open Positions`} isHighlight highlightColor={brandColor} />
            <QuickInfoRow label="Assigned Recruiter" value={req.recruiter || 'Unassigned'} />
            <QuickInfoRow label="Target Hire Date" value={req.targetHireDate} />
            <QuickInfoRow label="Sourcing Velocity" value="+18% vs avg" isHighlight highlightColor="#10b981" />
          </SideCard>

          <SideCard icon={Clock} title="SLA & Campaign Health">
            <QuickInfoRow label="Days Open" value={`${req.daysOpen || 1} Days`} isMonospace />
            <QuickInfoRow
              label="SLA Days Left"
              value={req.isOverdue ? 'Overdue!' : `${req.slaDaysLeft || 12} Days`}
              isHighlight
              highlightColor={req.isOverdue ? '#ef4444' : '#10b981'}
            />
            <div className="pt-2">
              <button 
                onClick={() => handleNudgeApprover(req.hiringManager)}
                className="w-full h-8 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bell size={13} /> Dispatched SLA Alert
              </button>
            </div>
          </SideCard>

        </div>

      </div>

      {/* Requisition Approval Modal with Comment */}
      <RequisitionApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => { setApprovalModalOpen(false); setActiveApproveStage(null); }}
        onConfirmApprove={handleConfirmApprove}
        requisition={req}
        stageInfo={activeApproveStage}
        simulatedRole={simulatedRole}
        brandColor={brandColor}
      />

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setActiveRejectStage(null); }}
        onConfirmReject={handleConfirmReject}
        requisition={req}
        stageInfo={activeRejectStage}
      />

    </motion.div>
  );
};

export default RequisitionDetails;
