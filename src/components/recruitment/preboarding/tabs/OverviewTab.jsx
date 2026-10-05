/**
 * Preboarding Workspace - Overview Tab
 * PeopleWorks ATS SaaS - Enterprise Structured Information & Interactive Stage Checklist
 */

import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileCheck,
  ShieldCheck,
  CheckSquare,
  ArrowRight,
  Sparkles,
  FileText,
  UserCheck,
  Layers
} from 'lucide-react';
import { evaluateJoiningReadiness } from '../preboardingValidation';

export const OverviewTab = ({
  record = {},
  onNavigateTab = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const readiness = evaluateJoiningReadiness(record);

  const steps = [
    {
      id: 'candidate_info',
      tab: 'candidate_info',
      icon: User,
      label: 'Candidate Information',
      description: 'Personal details, contact info, permanent & residential address',
      isComplete: readiness.checks.find(c => c.id === 'candidate_info')?.passed || false
    },
    {
      id: 'joining_details',
      tab: 'joining_details',
      icon: Briefcase,
      label: 'Joining & Position Details',
      description: 'Designation, department, reporting manager, work location & schedule',
      isComplete: readiness.checks.find(c => c.id === 'joining_details')?.passed || false
    },
    {
      id: 'documents',
      tab: 'documents',
      icon: FileText,
      label: 'Compliance Documents',
      description: `${(record.documents || []).filter(d => d.status === 'Verified').length} of ${(record.documents || []).filter(d => d.required).length} mandatory verified`,
      isComplete: readiness.checks.find(c => c.id === 'mandatory_documents')?.passed || false
    },
    {
      id: 'bgv',
      tab: 'bgv',
      icon: ShieldCheck,
      label: 'Background Verification (BGV)',
      description: 'Identity, employment, education & criminal checks via partner integration',
      isComplete: readiness.checks.find(c => c.id === 'bgv_clearance')?.passed || false
    },
    {
      id: 'tasks',
      tab: 'tasks',
      icon: CheckSquare,
      label: 'Cross-Departmental Tasks',
      description: `${(record.tasks || []).filter(t => t.status === 'Completed').length} of ${(record.tasks || []).length} internal provisioning tasks completed`,
      isComplete: readiness.checks.find(c => c.id === 'mandatory_tasks')?.passed || false
    },
    {
      id: 'readiness',
      tab: 'readiness',
      icon: Sparkles,
      label: 'Joining Readiness Gate',
      description: readiness.isReady ? 'All 8 governance checkpoints passed' : `${readiness.blockers.length} active blocker(s) present`,
      isComplete: readiness.isReady
    },
    {
      id: 'handoff',
      tab: 'handoff',
      icon: UserCheck,
      label: 'HRMS Employee Conversion',
      description: record.employeeId ? `Employee ID: ${record.employeeId}` : 'Awaiting final administrative sign-off & sync',
      isComplete: record.status === 'Employee Created'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top 2-Column Grid: Candidate Snapshot & Readiness Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: Position & Candidate Quick Info Cards */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                style={{ backgroundColor: brandColor }}
              >
                <Briefcase size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Preboarding Candidate & Position Snapshot
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('candidate_info')}
              className="text-xs font-bold text-slate-500 hover:text-brand transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Profile</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Frosted Detail Cells Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Candidate ID</span>
              <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">{record.candidateId || 'CAND-102'}</span>
            </div>
            
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Offer ID</span>
              <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">{record.offerId || 'OFF-2026-001'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Requisition ID</span>
              <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">{record.requisitionId || 'REQ-2026-001'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Department</span>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block truncate">{record.joiningDetails?.department || record.department || 'Platform Engineering'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email Address</span>
              <span className="font-medium text-xs text-slate-800 dark:text-slate-200 block truncate" title={record.candidateEmail}>{record.candidateEmail || '—'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Mobile Phone</span>
              <span className="font-medium text-xs text-slate-800 dark:text-slate-200 block truncate">{record.candidatePhone || '—'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Reporting Manager</span>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block truncate">{record.joiningDetails?.reportingManager || 'Alex Chen'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Joining Date</span>
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1 truncate">
                <Calendar size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                {record.joiningDate || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Readiness Scorecard Tile */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Joining Readiness Gate
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                readiness.isReady 
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
              }`}>
                {readiness.isReady ? 'Ready to Join' : 'In Progress'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {readiness.readinessScore}%
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                ({readiness.passedCount}/{readiness.totalCount} checkpoints)
              </span>
            </div>

            {/* Smooth Linear Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-3.5 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${readiness.readinessScore}%`,
                  backgroundColor: readiness.isReady ? '#10b981' : brandColor
                }}
              />
            </div>

            {/* Action Text */}
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {readiness.isReady 
                ? 'All mandatory compliance documents, BGV verification, and provisioning tasks have been validated.'
                : `${readiness.blockers.length} item(s) require operational review before HRMS handoff can proceed.`
              }
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('readiness')}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer group shadow-2xs"
          >
            <span>Review Readiness Gate</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>

      {/* Actionable Blockers Banner (If Any) */}
      {!readiness.isReady && readiness.blockers.length > 0 && (
        <div className="p-4.5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-800 dark:text-amber-300">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>Active Blockers Preventing Joining Clearance ({readiness.blockers.length})</span>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hidden sm:inline">
              Click any blocker to resolve directly
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {readiness.blockers.map((blocker, i) => {
              const isDoc = blocker.toLowerCase().includes('document');
              const isTask = blocker.toLowerCase().includes('task');
              const isBgv = blocker.toLowerCase().includes('bgv');
              const targetTab = isDoc ? 'documents' : isTask ? 'tasks' : isBgv ? 'bgv' : 'readiness';

              return (
                <div 
                  key={i} 
                  onClick={() => onNavigateTab(targetTab)}
                  className="flex items-start gap-2.5 p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-amber-200/80 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-700 transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                      {blocker}
                    </span>
                  </div>
                  <ArrowRight size={13} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preboarding Pipeline Stage Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Preboarding Pipeline Stage Checklist
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sequential stage gating and operational readiness milestones
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
            {steps.filter(s => s.isComplete).length} of {steps.length} Stages Completed
          </span>
        </div>

        <div className="space-y-2.5">
          {steps.map((step, idx) => {
            const Icon = step.icon || CheckCircle2;
            return (
              <div
                key={step.id}
                onClick={() => onNavigateTab(step.tab)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer transition-all group hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    step.isComplete 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {step.isComplete ? <CheckCircle2 size={18} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors truncate">
                      {step.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {step.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    step.isComplete 
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  }`}>
                    {step.isComplete ? 'Complete' : 'Pending'}
                  </span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-slate-300 transition-colors">
                    <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default OverviewTab;
