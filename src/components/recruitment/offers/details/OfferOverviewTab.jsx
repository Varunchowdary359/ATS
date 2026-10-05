import React from 'react';
import { 
  DollarSign, Calendar, Clock, FileCheck, Activity, Check, 
  ArrowUpRight, Eye, Download 
} from 'lucide-react';
import { APPROVAL_STATUS } from '../offerTypes';

export const OfferOverviewTab = ({
  offer,
  brandColor = 'var(--pw-brand)',
  lifecycleSteps = [],
  formatCurrency,
  onNavigateTab,
  onGenerateLetter
}) => {
  if (!offer) return null;

  return (
    <div className="space-y-5 animate-fade-in-up">
      
      {/* 4 Frosted Glass Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total CTC */}
        <div className="bg-gradient-to-br from-white/90 to-blue-50/30 dark:from-slate-900/80 dark:to-blue-950/20 backdrop-blur-md border border-blue-100/70 dark:border-blue-900/30 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Annual CTC</span>
              <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                <DollarSign size={15} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans mt-0.5">
              {formatCurrency(offer.totalCtc)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-2 flex justify-between">
            <span>Base: <strong>{formatCurrency(offer.totalBase)}</strong></span>
            <span>Var: <strong>{formatCurrency(offer.totalVariable)}</strong></span>
          </div>
        </div>

        {/* Card 2: Joining Date */}
        <div className="bg-gradient-to-br from-white/90 to-emerald-50/30 dark:from-slate-900/80 dark:to-emerald-950/20 backdrop-blur-md border border-emerald-100/70 dark:border-emerald-900/30 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Joining Date</span>
              <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                <Calendar size={15} />
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans mt-0.5">
              {offer.expectedStartDate || 'Pending Setup'}
            </div>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-2 border-t border-emerald-100/60 dark:border-slate-800/60 mt-2">
            Notice: {offer.noticePeriod || '60 Days'} • Probation: {offer.probationPeriod || '3M'}
          </div>
        </div>

        {/* Card 3: Expiration SLA */}
        <div className="bg-gradient-to-br from-white/90 to-amber-50/30 dark:from-slate-900/80 dark:to-amber-950/20 backdrop-blur-md border border-amber-100/70 dark:border-amber-900/30 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Offer Expiration SLA</span>
              <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
                <Clock size={15} />
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans mt-0.5">
              {offer.offerExpirationDate || '14 Days'}
            </div>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-2 border-t border-amber-100/60 dark:border-slate-800/60 mt-2">
            Action SLA: 7 Days Remaining
          </div>
        </div>

        {/* Card 4: eSignature Certified Status */}
        <div className="bg-gradient-to-br from-white/90 to-blue-50/30 dark:from-slate-900/80 dark:to-blue-950/20 backdrop-blur-md border border-blue-100/70 dark:border-blue-900/30 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">eSignature Status</span>
              <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                <FileCheck size={15} />
              </div>
            </div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-sans mt-0.5">
              {offer.signatureStatus || 'Not Initiated'}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-2">
            Provider: {offer.eSignature?.provider || 'DocuSign Integration'}
          </div>
        </div>
      </div>

      {/* Interactive Milestone Lifecycle Pipeline Stepper */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Activity size={15} style={{ color: brandColor }} />
            <span>Offer Lifecycle Milestone Progress</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            Current Phase: <strong className="text-slate-900 dark:text-white font-bold">{offer.status}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          {lifecycleSteps.map((step, idx) => (
            <div 
              key={step.id} 
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                step.active 
                  ? 'border-brand bg-brand/5 dark:bg-brand/10 text-slate-900 dark:text-white shadow-xs'
                  : step.done 
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                  : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step.done ? 'bg-emerald-500 text-white' : step.active ? 'bg-brand text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                }`}>
                  {step.done ? <Check size={11} strokeWidth={3} /> : idx + 1}
                </span>
                <span className="text-[9px] font-extrabold uppercase">
                  {step.done ? 'Done' : step.active ? 'Active' : 'Queued'}
                </span>
              </div>
              <span className="text-xs font-bold leading-tight truncate">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column SaaS Workspace: Left (7 Cols) & Right (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Compensation & Approval Snapshots (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Compensation Structure Snapshot Card */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Compensation Components</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cost-to-Company (CTC) Package Breakdown</p>
              </div>
              <button 
                onClick={() => onNavigateTab('compensation')}
                className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                style={{ color: brandColor }}
              >
                <span>Full Breakdown</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            {/* Components mini list */}
            <div className="space-y-2.5">
              {(Array.isArray(offer.components) ? offer.components : []).map(comp => (
                <div key={comp.id} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{comp.name}</div>
                    <div className="text-[11px] text-slate-400">{comp.type} • {comp.frequency}</div>
                  </div>
                  <div className="font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(comp.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Governance Approval Chain Card */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Tier Approval Routing Chain</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Automated corporate governance status</p>
              </div>
              <button 
                onClick={() => onNavigateTab('approvals')}
                className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                style={{ color: brandColor }}
              >
                <span>View Matrix</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="space-y-2.5">
              {(Array.isArray(offer.approvals) ? offer.approvals : []).map((appr, idx) => {
                const isApproved = appr.status === APPROVAL_STATUS.APPROVED;
                const isRejected = appr.status === APPROVAL_STATUS.REJECTED;
                return (
                  <div key={appr.id || idx} className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isApproved ? 'bg-emerald-100 text-emerald-700' : isRejected ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        L{appr.level}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{appr.approverName}</div>
                        <div className="text-[10px] text-slate-400">{appr.role} ({appr.approverRoleTitle || 'Sign-off'})</div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {appr.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Candidate Dossier & Quick Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Candidate & Role Profile Card */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Candidate Dossier & Context
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Email Address:</span>
                <strong className="text-slate-800 dark:text-slate-200">{offer.candidateEmail || 'rohan.s@example.com'}</strong>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Phone Contact:</span>
                <span className="text-slate-800 dark:text-slate-200">{offer.candidatePhone || '+91 98450 11223'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Application ID:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{offer.applicationId || 'APP-2026-001'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Hiring Manager:</span>
                <strong className="text-slate-800 dark:text-slate-200">{offer.hiringManagerName || 'Alex Chen'}</strong>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Assigned Recruiter:</span>
                <span className="text-slate-800 dark:text-slate-200">{offer.recruiterName || 'Sarah Jenkins'}</span>
              </div>
            </div>
          </div>

          {/* Offer Letter Document Snapshot */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Offer Letter Document
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                v{offer.version}
              </span>
            </div>
            
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Template Used:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{offer.templateName || 'India Standard Full-Time'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">DocuSign Envelope:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{offer.eSignature?.envelopeId || 'DOCU-ENV-2026-9021'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onNavigateTab('letter')}
                style={{
                  backgroundColor: brandColor,
                  boxShadow: `0 2px 10px ${brandColor}35`
                }}
                className="flex-1 py-2 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye size={13} />
                <span>Inspect Letter</span>
              </button>
              <button
                onClick={() => {
                  const doc = offer.documentVersions?.[0];
                  if (doc?.contentHtml) {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(doc.contentHtml);
                    printWindow.document.close();
                    printWindow.print();
                  } else {
                    onGenerateLetter();
                  }
                }}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>PDF</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
