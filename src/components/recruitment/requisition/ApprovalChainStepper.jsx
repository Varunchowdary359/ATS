import React from 'react';
import { CheckCircle2, Clock, XCircle, ArrowRight, AlertCircle, ShieldCheck, UserCheck, CornerDownRight, MessageSquare } from 'lucide-react';

export const DEFAULT_APPROVAL_STAGES = [
  { id: 'hiring_manager', role: 'Hiring Manager', defaultName: 'Hiring Manager' },
  { id: 'dept_head', role: 'Department Head', defaultName: 'Department Head' },
  { id: 'finance', role: 'Finance', defaultName: 'Finance Director' },
  { id: 'hr', role: 'HR', defaultName: 'HR VP' },
  { id: 'final_approver', role: 'Final Approver', defaultName: 'Executive VP' },
];

export const sortApprovalChain = (chain) => {
  if (!Array.isArray(chain) || chain.length === 0) return chain;
  const roleRank = (roleStr = '') => {
    const r = (roleStr || '').toLowerCase();
    if (r.includes('hiring') || r.includes('manager') || r.includes('initiator')) return 1;
    if (r.includes('department') || r.includes('dept') || r.includes('director') || r.includes('vp')) return 2;
    if (r.includes('finance') || r.includes('controller') || r.includes('budget')) return 3;
    if (r.includes('hr') || r.includes('recruiter') || r.includes('talent')) return 4;
    return 5;
  };

  const sorted = [...chain].sort((a, b) => roleRank(a.role || a.id) - roleRank(b.role || b.id));

  // Normalize IDs and sequential statuses
  let foundFirstUnapproved = false;
  return sorted.map((step, idx) => {
    const r = (step.role || step.id || '').toLowerCase();
    let id = step.id;
    if (!id) {
      if (r.includes('hiring')) id = 'hiring_manager';
      else if (r.includes('dept') || r.includes('department')) id = 'dept_head';
      else if (r.includes('finance')) id = 'finance';
      else if (r.includes('hr') || r.includes('recruiter') || r.includes('talent')) id = 'hr';
      else id = `step_${idx + 1}`;
    }

    let status = step.status || 'Waiting';
    const isHM = idx === 0 || r.includes('hiring');
    if (isHM) {
      status = 'Submitted';
    } else {
      const isComplete = status === 'Approved' || status === 'Submitted';
      if (!isComplete && !foundFirstUnapproved) {
        foundFirstUnapproved = true;
        status = status === 'Rejected' ? 'Rejected' : 'Pending';
      } else if (!isComplete && foundFirstUnapproved) {
        status = status === 'Rejected' ? 'Rejected' : 'Waiting';
      }
    }

    return {
      ...step,
      id,
      status,
      date: (isHM && !step.date) ? (new Date().toISOString()) : step.date
    };
  });
};

export const isRoleMatching = (role, stepRole = '') => {
  if (!role || !stepRole) return false;
  const s = stepRole.toLowerCase();
  if (role === 'Super Admin') return true;
  if (role === 'Hiring Manager' && (s.includes('hiring') || s.includes('manager'))) return true;
  if (role === 'Department Head / Approver' && (s.includes('department') || s.includes('dept') || s.includes('director') || s.includes('vp'))) return true;
  if ((role === 'Finance Approver' || role === 'Finance Controller' || role === 'Finance') && (s.includes('finance') || s.includes('controller') || s.includes('budget'))) return true;
  if (role === 'HR Recruiter' && (s.includes('hr') || s.includes('recruiter') || s.includes('talent'))) return true;
  return false;
};

export const getRequisitionApprovalChain = (req) => {
  if (Array.isArray(req?.approvalChain) && req.approvalChain.length > 0) {
    return sortApprovalChain(req.approvalChain);
  }
  
  const manager = req?.hiringManager || 'Hiring Manager';
  const status = req?.status || 'Draft';
  
  return [
    {
      id: 'hiring_manager',
      role: 'Hiring Manager',
      name: manager,
      status: 'Submitted',
      date: req?.history?.[0]?.date || '2026-08-01T10:00:00Z',
      avatar: manager.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    },
    {
      id: 'dept_head',
      role: 'Department Head',
      name: req?.department ? `${req.department} Director` : 'Department Head',
      status: status === 'Draft' ? 'Pending' : (['Approved', 'Open', 'Active'].includes(status) ? 'Approved' : (status === 'Rejected' ? 'Rejected' : 'Pending')),
      date: ['Approved', 'Open', 'Active'].includes(status) ? '2026-08-03T14:20:00Z' : null,
      avatar: 'DH',
      rejectionComment: status === 'Rejected' ? (req?.rejectionComment || 'Headcount allocation for Q3 exceeded limit.') : null
    },
    {
      id: 'finance',
      role: 'Finance Controller',
      name: 'Finance Controller',
      status: ['Approved', 'Open', 'Active'].includes(status) ? 'Approved' : 'Waiting',
      date: ['Approved', 'Open', 'Active'].includes(status) ? '2026-08-04T09:15:00Z' : null,
      avatar: 'FC'
    },
    {
      id: 'hr',
      role: 'HR / TA Lead',
      name: req?.hrbp || 'HR Lead',
      status: ['Approved', 'Open', 'Active'].includes(status) ? 'Approved' : 'Waiting',
      date: ['Approved', 'Open', 'Active'].includes(status) ? '2026-08-05T11:00:00Z' : null,
      avatar: 'HR'
    }
  ];
};

const formatTimestamp = (isoString) => {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
};

const ApprovalChainStepper = ({ 
  requisition, 
  onApprove, 
  onReject, 
  simulatedRole,
  onRoleChange,
  isDarkMode = false 
}) => {
  const chain = getRequisitionApprovalChain(requisition);
  const currentPendingIndex = chain.findIndex(step => step.status === 'Pending' || step.status === 'Rejected');

  const activePendingStep = currentPendingIndex !== -1 ? chain[currentPendingIndex] : null;
  const canUserActionCurrentStep = activePendingStep && isRoleMatching(simulatedRole, activePendingStep.role);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Approval Chain Workflow
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-stage governance and sign-off tracking
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
          Workflow: {requisition?.approvalWorkflow || 'Standard Multi-Stage'}
        </span>
      </div>

      {/* Stepper Timeline */}
      <div className="relative pt-2 pb-1">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {chain.map((step, idx) => {
            const isApproved = step.status === 'Approved' || step.status === 'Submitted';
            const isPending = step.status === 'Pending';
            const isRejected = step.status === 'Rejected';
            const isCurrentPending = currentPendingIndex === idx;

            return (
              <div 
                key={step.id || idx} 
                className={`relative flex flex-col p-3.5 rounded-xl border transition-all ${
                  isRejected 
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' 
                    : isCurrentPending
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50 shadow-sm'
                      : isApproved
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-70'
                }`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Stage {idx + 1}: {step.role}
                  </span>

                  {/* Status Indicator Pill */}
                  {isApproved && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {step.status === 'Submitted' ? 'Submitted' : 'Approved'}
                    </span>
                  )}
                  {isPending && (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isCurrentPending 
                        ? 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 animate-pulse'
                        : 'text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {isCurrentPending ? 'Pending Sign-off' : 'Waiting'}
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      Rejected
                    </span>
                  )}
                </div>

                {/* Approver Details */}
                <div className="flex items-center gap-2.5 my-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isApproved 
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500' 
                      : isRejected
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    {step.avatar || step.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {step.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {step.date ? formatTimestamp(step.date) : (isApproved ? 'Approved' : 'Pending Action')}
                    </p>
                  </div>
                </div>

                {/* Approval Note Block */}
                {step.comment && (
                  <div className="mt-2.5 p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-900 dark:text-emerald-200 space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                      <MessageSquare className="w-3 h-3" />
                      Approval Note:
                    </div>
                    <p className="italic font-medium pl-4">“{step.comment}”</p>
                  </div>
                )}

                {/* Rejection Note Block */}
                {step.rejectionComment && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-100/70 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-900 dark:text-rose-200 space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400">
                      <CornerDownRight className="w-3 h-3" />
                      Rejection Reason:
                    </div>
                    <p className="italic font-medium pl-4">{step.rejectionComment}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Bar for Pending Approver */}
      {canUserActionCurrentStep && activePendingStep && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Action Required: Sign-off pending for stage <strong>"{activePendingStep.role}"</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onReject && onReject(activePendingStep)}
              className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject Requisition
            </button>

            <button
              onClick={() => onApprove && onApprove(activePendingStep)}
              style={{ backgroundColor: 'var(--pw-brand, #3b82f6)' }}
              className="px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Stage ({activePendingStep.role})
            </button>
          </div>
        </div>
      )}

      {/* Helpful Next-Role Switcher Banner when waiting on another role */}
      {!canUserActionCurrentStep && activePendingStep && (
        <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-950 dark:text-blue-200">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Currently awaiting sign-off for Stage <strong>"{activePendingStep.role}"</strong> ({activePendingStep.name}).
            </span>
          </div>
          {onRoleChange && (
            <button
              onClick={() => {
                const s = activePendingStep.role.toLowerCase();
                let targetRole = 'Super Admin';
                if (s.includes('dept') || s.includes('department') || s.includes('director')) targetRole = 'Department Head / Approver';
                else if (s.includes('finance') || s.includes('controller') || s.includes('budget')) targetRole = 'Finance Approver';
                else if (s.includes('hr') || s.includes('recruiter') || s.includes('talent')) targetRole = 'HR Recruiter';
                onRoleChange(targetRole);
              }}
              style={{ backgroundColor: 'var(--pw-brand, #3b82f6)' }}
              className="px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              Switch Role to {activePendingStep.role} →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalChainStepper;
