/**
 * Enterprise Preboarding Workspace & Detail Page
 * PeopleWorks ATS SaaS - 100% Visual Uniformity with Offer & Candidate Profile Pages
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Briefcase, 
  Calendar, 
  Mail, 
  UserCheck, 
  Clock, 
  PauseCircle, 
  Ban, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Layers,
  Building2,
  Share2,
  MoreVertical
} from 'lucide-react';
import { PREBOARDING_STATUS, ACTION_STATUS } from './preboardingTypes';
import { evaluateJoiningReadiness } from './preboardingValidation';

import OverviewTab from './tabs/OverviewTab';
import CandidateInfoTab from './tabs/CandidateInfoTab';
import JoiningDetailsTab from './tabs/JoiningDetailsTab';
import DocumentsTab from './tabs/DocumentsTab';
import BgvTab from './tabs/BgvTab';
import TasksTab from './tabs/TasksTab';
import ReadinessTab from './tabs/ReadinessTab';
import HandoffTab from './tabs/HandoffTab';
import TimelineTab from './tabs/TimelineTab';

import HandoffReviewModal from './modals/HandoffReviewModal';
import ChangeOwnerModal from './modals/ChangeOwnerModal';

export const PreboardingDetail = ({
  record = {},
  onBack = () => {},
  onUpdateCandidateInfo = () => {},
  onUpdateJoiningDetails = () => {},
  onManageDocument = () => {},
  onManageBgv = () => {},
  onManageTask = () => {},
  onUpdateStatus = () => {},
  onChangeOwner = () => {},
  onMarkReady = () => {},
  onConvertToEmployee = () => {},
  onRetryHandoff = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const readiness = evaluateJoiningReadiness(record);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePutOnHold = async () => {
    const reason = window.prompt('Enter reason for placing preboarding on hold:');
    if (reason && reason.trim()) {
      await onUpdateStatus(record.id, PREBOARDING_STATUS.ON_HOLD, reason.trim());
      showToast('Preboarding placed on hold.');
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt('Are you sure you want to cancel this preboarding record? Enter cancellation reason:');
    if (reason && reason.trim()) {
      await onUpdateStatus(record.id, PREBOARDING_STATUS.CANCELLED, reason.trim());
      showToast('Preboarding record cancelled.');
    }
  };

  const handleSendReminder = () => {
    showToast(`Automated preboarding checklist reminder dispatched to ${record.candidateEmail}.`);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'candidate_info', label: 'Candidate Info' },
    { id: 'joining_details', label: 'Joining Details' },
    { 
      id: 'documents', 
      label: 'Documents', 
      badge: (record.documents || []).filter(d => d.status === 'Uploaded' || d.status === 'Under Review').length || null 
    },
    { 
      id: 'bgv', 
      label: 'BGV',
      badge: (record.bgvChecks || []).some(b => b.status === 'Discrepancy') ? '!' : null,
      badgeColor: 'bg-amber-500'
    },
    { 
      id: 'tasks', 
      label: 'Tasks',
      badge: (record.tasks || []).filter(t => t.status !== 'Completed').length || null
    },
    { 
      id: 'readiness', 
      label: 'Joining Readiness',
      badge: readiness.isReady ? '✓' : `${readiness.blockers.length}`,
      badgeColor: readiness.isReady ? 'bg-emerald-500' : 'bg-amber-500'
    },
    { id: 'handoff', label: 'Employee Handoff' },
    { id: 'timeline', label: 'Timeline' }
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-6 animate-fade-in-up">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Glassmorphic Container Header (100% Matching Offers & Candidate Profile) */}
      <div className="bg-gradient-to-br from-blue-50/50 via-white/80 to-slate-50/50 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-blue-950/30 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        
        {/* Back Button + Quick Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Preboarding Hub</span>
          </button>

          {/* Quick Workspace Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            <button
              onClick={handleSendReminder}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
            >
              <Mail size={13} className="text-slate-500" />
              <span>Send Reminder</span>
            </button>

            <button
              onClick={() => setShowOwnerModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
            >
              <UserCheck size={13} className="text-slate-500" />
              <span>Change Owner</span>
            </button>

            {record.status !== PREBOARDING_STATUS.ON_HOLD ? (
              <button
                onClick={handlePutOnHold}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
              >
                <PauseCircle size={13} />
                <span>Put On Hold</span>
              </button>
            ) : (
              <button
                onClick={() => onUpdateStatus(record.id, PREBOARDING_STATUS.IN_PROGRESS, 'Resumed from hold')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer shadow-xs"
              >
                <span>Resume Preboarding</span>
              </button>
            )}

            {/* Mark Ready / Convert CTA */}
            {record.status === PREBOARDING_STATUS.READY_TO_JOIN ? (
              <button
                onClick={() => setShowHandoffModal(true)}
                className="inline-flex items-center gap-1.5 px-4.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: brandColor }}
              >
                <Sparkles size={14} />
                <span>Employee Handoff</span>
              </button>
            ) : record.status !== PREBOARDING_STATUS.EMPLOYEE_CREATED ? (
              <button
                onClick={() => setActiveTab('readiness')}
                className="inline-flex items-center gap-1.5 px-4.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: brandColor }}
              >
                <CheckCircle2 size={14} />
                <span>Check Readiness Gate</span>
              </button>
            ) : null}

            <button
              onClick={handleCancel}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Cancel Preboarding"
            >
              <Ban size={15} />
            </button>
          </div>
        </div>

        {/* Candidate Master Profile Hero Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl text-white shrink-0 shadow-md ring-4 ring-white/60 dark:ring-slate-800/60"
              style={{ backgroundColor: brandColor }}
            >
              {record.candidateName ? record.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'C'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {record.candidateName}
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                  {record.id}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  record.status === PREBOARDING_STATUS.READY_TO_JOIN || record.status === PREBOARDING_STATUS.EMPLOYEE_CREATED
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : record.status === PREBOARDING_STATUS.ON_HOLD
                    ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Briefcase size={13} className="text-slate-400" />
                  {record.joiningDetails?.designation || record.jobTitle}
                </span>
                <span>•</span>
                <span>Req: <strong className="text-slate-700 dark:text-slate-300 font-mono">{record.requisitionId}</strong></span>
                <span>•</span>
                <span>Offer: <strong className="text-slate-700 dark:text-slate-300 font-mono">{record.offerId}</strong></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 font-bold text-slate-900 dark:text-white">
                  <Calendar size={13} className="text-blue-600 dark:text-blue-400" />
                  Joining: {record.joiningDate || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs (Unified Segmented Pill Bar) */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-lg transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-white shadow-xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/70'
                }`}
                style={{
                  backgroundColor: isActive ? brandColor : undefined
                }}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive 
                      ? 'bg-white/25 text-white' 
                      : tab.badgeColor ? `${tab.badgeColor} text-white` : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>


      {/* Active Tab Panel */}
      <div className="flex-1">
        {activeTab === 'overview' && (
          <OverviewTab
            record={record}
            onNavigateTab={(tab) => setActiveTab(tab)}
            brandColor={brandColor}
          />
        )}
        {activeTab === 'candidate_info' && (
          <CandidateInfoTab
            record={record}
            onSave={onUpdateCandidateInfo}
            brandColor={brandColor}
          />
        )}
        {activeTab === 'joining_details' && (
          <JoiningDetailsTab
            record={record}
            onSave={onUpdateJoiningDetails}
            brandColor={brandColor}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab
            record={record}
            onManageDocument={onManageDocument}
            brandColor={brandColor}
          />
        )}
        {activeTab === 'bgv' && (
          <BgvTab
            record={record}
            onManageBgv={onManageBgv}
            brandColor={brandColor}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            record={record}
            onManageTask={onManageTask}
            brandColor={brandColor}
          />
        )}
        {activeTab === 'readiness' && (
          <ReadinessTab
            record={record}
            onMarkReady={onMarkReady}
            onNavigateTab={(tab) => setActiveTab(tab)}
            brandColor={brandColor}
          />
        )}
        {activeTab === 'handoff' && (
          <HandoffTab
            record={record}
            onConvertToEmployee={onConvertToEmployee}
            onRetryHandoff={onRetryHandoff}
            brandColor={brandColor}
          />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab
            record={record}
            brandColor={brandColor}
          />
        )}
      </div>

      {/* Modals */}
      {showHandoffModal && (
        <HandoffReviewModal
          isOpen={true}
          record={record}
          onClose={() => setShowHandoffModal(false)}
          onConvertToEmployee={onConvertToEmployee}
          brandColor={brandColor}
        />
      )}

      {showOwnerModal && (
        <ChangeOwnerModal
          isOpen={true}
          record={record}
          onClose={() => setShowOwnerModal(false)}
          onChangeOwner={onChangeOwner}
          brandColor={brandColor}
        />
      )}

    </div>
  );
};

export default PreboardingDetail;
