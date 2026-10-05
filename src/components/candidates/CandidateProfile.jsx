import React, { useState, useContext } from 'react';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Briefcase, Calendar, Star, Tag, 
  MoreVertical, Edit, Send, Plus, MessageSquarePlus, Copy, Archive, Trash2, 
  Slash, ChevronDown, CheckCircle2, Award, FileText, Sparkles, Lock, AlertCircle
} from 'lucide-react';
import CandidateOverview from './profile/CandidateOverview';
import CandidatePersonalProfessional from './profile/CandidatePersonalProfessional';
import CandidateSkillsExpEdu from './profile/CandidateSkillsExpEdu';
import CandidateResumeView from './profile/CandidateResumeView';
import CandidateScreeningView from './profile/CandidateScreeningView';
import CandidateApplicationsView from './profile/CandidateApplicationsView';
import CandidateInterviewsView from './profile/CandidateInterviewsView';
import CandidateActivitiesCommView from './profile/CandidateActivitiesCommView';
import CandidateNotesDocsView from './profile/CandidateNotesDocsView';
import CandidateTimelineView from './profile/CandidateTimelineView';

import EditCandidateModal from './modals/EditCandidateModal';
import SendEmailModal from './modals/SendEmailModal';
import ScheduleInterviewModal from './modals/ScheduleInterviewModal';
import AddNoteModal from './modals/AddNoteModal';
import CandidateRejectionModal from './modals/CandidateRejectionModal';
import AddResumeToJobModal from '../recruitment/intake/AddResumeToJobModal';
import DuplicateResolutionModal from '../recruitment/intake/DuplicateResolutionModal';
import { PIPELINE_STAGES } from './candidateMockData';
import { validateStageTransition } from './candidateStageRules';

import { ThemeContext } from '../../ThemeContext';
import { 
  canEditCandidate, 
  canDeleteCandidate, 
  canMergeDuplicates, 
  canChangeStage, 
  canScheduleInterview, 
  canSendEmail,
  canAddNote
} from './candidatePermissions';

const PROFILE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal Info' },
  { id: 'professional', label: 'Professional Info' },
  { id: 'tags', label: 'Tags' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'resume', label: 'Resume' },
  { id: 'screening', label: 'Screening' },
  { id: 'applications', label: 'Applications' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'activities', label: 'Activities' },
  { id: 'communication', label: 'Communication' },
  { id: 'notes', label: 'Notes' },
  { id: 'documents', label: 'Documents' },
  { id: 'timeline', label: 'Timeline' }
];

const CandidateProfile = ({ candidate, onBack, onUpdateCandidate, onDeleteCandidate }) => {
  const { activeRole } = useContext(ThemeContext);

  // Permission Checks
  const allowEdit = canEditCandidate(activeRole);
  const allowDelete = canDeleteCandidate(activeRole);
  const allowMerge = canMergeDuplicates(activeRole);
  const allowStage = canChangeStage(activeRole);
  const allowInterview = canScheduleInterview(activeRole);
  const allowEmail = canSendEmail(activeRole);

  const [activeTab, setActiveTab] = useState('overview');
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showStageDropdown, setShowStageDropdown] = useState(false);

  if (!candidate) return null;

  const candidateInitials = candidate.candidateName
    ? candidate.candidateName.split(' ').map(n => n[0]).join('').substring(0, 2)
    : 'CN';

  const handleStageChange = (newStageId) => {
    const prevStage = candidate.stage || 'Applied';
    if (prevStage === newStageId) return;

    const validation = validateStageTransition(candidate, prevStage, newStageId);
    if (!validation.allowed) {
      alert(validation.reason);
      setShowStageDropdown(false);
      return;
    }

    if (newStageId === 'Rejected') {
      setShowStageDropdown(false);
      setShowRejectionModal(true);
      return;
    }

    const newTimelineItem = {
      id: `tl-${Date.now()}`,
      event: 'Stage Changed',
      description: `Stage updated from ${prevStage} to ${newStageId}`,
      user: activeRole?.label || 'Recruiter',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedApps = (candidate.applications || []).map(app => ({
      ...app,
      stage: newStageId,
      lastUpdated: new Date().toISOString().split('T')[0]
    }));

    const updated = {
      ...candidate,
      stage: newStageId,
      applications: updatedApps,
      timeline: [newTimelineItem, ...(candidate.timeline || [])]
    };

    onUpdateCandidate(updated);
    setShowStageDropdown(false);
  };

  const handleConfirmRejection = ({ reason, comments }) => {
    const prevStage = candidate.stage;
    const newStageId = 'Rejected';

    const newTimelineItem = {
      id: `tl-${Date.now()}`,
      event: 'Candidate Rejected',
      description: `Rejected from stage ${prevStage}. Reason: ${reason}${comments ? ` (${comments})` : ''}`,
      user: activeRole?.label || 'Recruiter',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedApps = (candidate.applications || []).map(app => ({
      ...app,
      stage: newStageId,
      status: 'Rejected',
      lastUpdated: new Date().toISOString().split('T')[0]
    }));

    const updated = {
      ...candidate,
      stage: newStageId,
      processingStatus: 'Rejected',
      applications: updatedApps,
      timeline: [newTimelineItem, ...(candidate.timeline || [])]
    };

    onUpdateCandidate(updated);
  };

  const handleRatingChange = (newRating) => {
    if (!allowEdit) return;
    onUpdateCandidate({ ...candidate, rating: newRating });
  };

  const handleAssignToJob = (jobData) => {
    const existingApps = candidate.applications || [];
    const isAlreadyApplied = existingApps.some(a => a.requisitionId === jobData.requisitionId);

    if (isAlreadyApplied) {
      alert(`Candidate ${candidate.candidateName} is already associated with Requisition ID ${jobData.requisitionId} (${jobData.requisitionTitle}). Duplicate applications are not allowed.`);
      return;
    }

    const newApp = {
      id: `APP-${Math.floor(100 + Math.random() * 900)}`,
      jobTitle: jobData.requisitionTitle || 'Assigned Job',
      requisitionId: jobData.requisitionId || 'REQ-NEW',
      appliedDate: new Date().toISOString().split('T')[0],
      source: 'Recruiter Assignment',
      stage: 'Applied',
      status: 'Active',
      recruiter: candidate.candidateOwner || 'Recruiter',
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    const newTimelineItem = {
      id: `tl-${Date.now()}`,
      event: 'Added to Requisition',
      description: `Associated with ${jobData.requisitionId} (${jobData.requisitionTitle})`,
      user: activeRole?.label || 'Recruiter',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedApps = [newApp, ...existingApps];
    onUpdateCandidate({
      ...candidate,
      applications: updatedApps,
      requisitionId: jobData.requisitionId,
      requisitionTitle: jobData.requisitionTitle,
      timeline: [newTimelineItem, ...(candidate.timeline || [])]
    });
    setShowAddJobModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Candidate Management / Pipeline
      </button>

      {/* ═══════════════════════════════════════════════════════════════════
          PROFILE HEADER CARD
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50/60 via-white to-purple-50/30 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Candidate Info Left */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              {candidateInitials}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {candidate.candidateName}
                </h1>
                
                {/* Stage Badge & Dropdown */}
                <div className="relative">
                  <button
                    disabled={!allowStage}
                    onClick={() => setShowStageDropdown(!showStageDropdown)}
                    className={`px-3 py-1 text-xs font-extrabold rounded-full bg-blue-600 text-white flex items-center gap-1.5 shadow-xs ${allowStage ? 'cursor-pointer hover:bg-blue-700' : 'opacity-80 cursor-not-allowed'}`}
                  >
                    Stage: {candidate.stage || 'Applied'} {allowStage && <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showStageDropdown && allowStage && (
                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-[90]">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Change Pipeline Stage</div>
                      {PIPELINE_STAGES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleStageChange(s.id)}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between ${candidate.stage === s.id ? 'text-blue-600 font-bold' : (s.id === 'Rejected' ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300')}`}
                        >
                          <span>{s.label}</span>
                          {candidate.stage === s.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      disabled={!allowEdit}
                      onClick={() => handleRatingChange(star)}
                      className={allowEdit ? 'cursor-pointer' : 'cursor-default'}
                    >
                      <Star
                        className={`w-4 h-4 ${star <= (candidate.rating || 4) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {candidate.currentTitle || 'Title'} • {candidate.currentCompany || 'Company'}
              </p>

              <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 font-medium pt-1">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {candidate.location}</span>
                <span className="flex items-center gap-1 font-mono"><Mail className="w-3.5 h-3.5 text-slate-400" /> {candidate.email}</span>
                <span className="flex items-center gap-1 font-mono"><Phone className="w-3.5 h-3.5 text-slate-400" /> {candidate.phone}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> Exp: {candidate.totalExperience}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Right */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {allowEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            )}

            {allowEmail && (
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send Email
              </button>
            )}

            {allowInterview && (
              <button
                onClick={() => setShowInterviewModal(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" /> Schedule Interview
              </button>
            )}

            <button
              onClick={() => setShowNoteModal(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" /> Add Note
            </button>

            {/* More Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMoreActions && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-[90] text-xs">
                  {allowMerge && (
                    <button
                      onClick={() => { setShowDuplicateModal(true); setShowMoreActions(false); }}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4 text-amber-500" /> Merge Duplicate Record
                    </button>
                  )}

                  <button
                    onClick={() => { setShowAddJobModal(true); setShowMoreActions(false); }}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-blue-500" /> Add to Job Requisition
                  </button>

                  {allowDelete && (
                    <>
                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently delete candidate ${candidate.candidateName}? This action cannot be undone.`)) {
                            onDeleteCandidate(candidate.id);
                            onBack();
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Candidate
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PROFILE NAVIGATION TABS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none pb-px">
        {PROFILE_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all cursor-pointer border-b-2 ${activeTab === t.id ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB CONTENT VIEWS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <CandidateOverview
            candidate={candidate}
            onUpdateCandidate={onUpdateCandidate}
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenAddJob={() => setShowAddJobModal(true)}
          />
        )}
        {activeTab === 'personal' && <CandidatePersonalProfessional candidate={candidate} type="personal" />}
        {activeTab === 'professional' && <CandidatePersonalProfessional candidate={candidate} type="professional" />}
        {activeTab === 'tags' && (
          <CandidateOverview
            candidate={candidate}
            onUpdateCandidate={onUpdateCandidate}
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenAddJob={() => setShowAddJobModal(true)}
          />
        )}
        {activeTab === 'skills' && <CandidateSkillsExpEdu candidate={candidate} section="skills" />}
        {activeTab === 'experience' && <CandidateSkillsExpEdu candidate={candidate} section="experience" />}
        {activeTab === 'education' && <CandidateSkillsExpEdu candidate={candidate} section="education" />}
        {activeTab === 'resume' && <CandidateResumeView candidate={candidate} />}
        {activeTab === 'screening' && <CandidateScreeningView candidate={candidate} />}
        {activeTab === 'applications' && (
          <CandidateApplicationsView candidate={candidate} onOpenAddJob={() => setShowAddJobModal(true)} />
        )}
        {activeTab === 'interviews' && (
          <CandidateInterviewsView candidate={candidate} onScheduleInterview={() => setShowInterviewModal(true)} />
        )}
        {activeTab === 'activities' && <CandidateActivitiesCommView candidate={candidate} type="activities" />}
        {activeTab === 'communication' && (
          <CandidateActivitiesCommView candidate={candidate} type="communication" onSendEmail={() => setShowEmailModal(true)} />
        )}
        {activeTab === 'notes' && (
          <CandidateNotesDocsView
            candidate={candidate}
            view="notes"
            onAddNote={() => setShowNoteModal(true)}
            onUpdateCandidate={onUpdateCandidate}
          />
        )}
        {activeTab === 'documents' && (
          <CandidateNotesDocsView
            candidate={candidate}
            view="documents"
            onUpdateCandidate={onUpdateCandidate}
          />
        )}
        {activeTab === 'timeline' && <CandidateTimelineView candidate={candidate} />}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODALS INTEGRATION
      ═══════════════════════════════════════════════════════════════════ */}
      <EditCandidateModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        candidate={candidate}
        onSave={onUpdateCandidate}
      />

      <SendEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        candidate={candidate}
        onSend={(emailObj) => {
          const updatedComms = [emailObj, ...(candidate.communications || [])];
          onUpdateCandidate({ ...candidate, communications: updatedComms });
        }}
      />

      <ScheduleInterviewModal
        isOpen={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
        candidate={candidate}
        onSchedule={(intObj) => {
          const updatedInts = [intObj, ...(candidate.interviews || [])];
          onUpdateCandidate({ ...candidate, interviews: updatedInts });
        }}
      />

      <AddNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        candidate={candidate}
        onAddNote={(noteObj) => {
          const updatedNotes = [noteObj, ...(candidate.notes || [])];
          onUpdateCandidate({ ...candidate, notes: updatedNotes });
        }}
      />

      <CandidateRejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        candidate={candidate}
        onConfirmReject={handleConfirmRejection}
      />

      <AddResumeToJobModal
        isOpen={showAddJobModal}
        onClose={() => setShowAddJobModal(false)}
        resume={candidate}
        onAssign={handleAssignToJob}
      />

      <DuplicateResolutionModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        newCandidate={candidate}
        existingCandidate={candidate}
        onResolve={() => setShowDuplicateModal(false)}
      />

    </div>
  );
};

export default CandidateProfile;
