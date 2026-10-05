import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Mail, Phone, MapPin, 
  FileText, Download, Eye, Plus, AlertTriangle, X, Briefcase, Check,
  Share2, Printer, ChevronRight, Clock, Award, Building,
  GraduationCap, MessageSquare, Send, Bell, Flame, Trash2
} from 'lucide-react';
import { ModernStatusBadge } from '../../admin/shared/ModernAdminLayoutComponents';
import { useToast } from '../../shared/ToastContext';
import { APPLICATION_STAGE, ATS_ROLES, PERMISSIONS, hasPermission } from './candidateTypes';
import { candidateService } from './candidateService';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import SearchableSelect from '../../dashboard/shared/SearchableSelect';

// ─── Quick Information Row Sub-component (Matching RequisitionDetails) ─────────
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

// ─── Side Card Sub-component (Matching RequisitionDetails) ─────────────────────
const SideCard = ({ icon: Icon, title, children }) => (
  <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)]">
    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
      {Icon && <Icon size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />}
      <span>{title}</span>
    </h3>
    <div>{children}</div>
  </div>
);

const CandidateProfilePage = ({
  candidateId,
  onBack,
  onOpenStageTransition,
  brandColor = 'var(--pw-brand)',
  userRole = ATS_ROLES.ATS_ADMIN,
  userRequisitions = ['REQ-2026-0001', 'REQ-2026-001']
}) => {
  const { addToast } = useToast();
  const [candidate, setCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [newNoteText, setNewNoteText] = useState('');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [selectedNewReqId, setSelectedNewReqId] = useState('');
  const [availableRequisitions, setAvailableRequisitions] = useState([]);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Upload Document Modal State
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [uploadDocData, setUploadDocData] = useState({ name: '', type: 'resume', file: null });

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const data = await candidateService.getCandidateById(candidateId);
        if (isMounted) setCandidate(data);
      } catch (err) {
        console.error('Error loading candidate profile', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (candidateId) loadProfile();

    const handleUpdate = () => {
      if (candidateId && isMounted) loadProfile();
    };

    window.addEventListener('pw_db_updated', handleUpdate);
    window.addEventListener('pw:candidate_created', handleUpdate);
    window.addEventListener('pw:application_created', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('pw_db_updated', handleUpdate);
      window.removeEventListener('pw:candidate_created', handleUpdate);
      window.removeEventListener('pw:application_created', handleUpdate);
    };
  }, [candidateId]);

  useEffect(() => {
    let reqs = [];
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('pw_requisitions');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) reqs = parsed;
        }
      }
    } catch {
      // ignore storage error
    }

    if (reqs.length === 0) {
      reqs = [
        { id: 'REQ-2026-001', jobTitle: 'Senior Frontend Architect', department: 'Engineering' },
        { id: 'REQ-2026-002', jobTitle: 'Lead Cloud DevOps Architect', department: 'Cloud & AI Platform' },
        { id: 'REQ-2026-003', jobTitle: 'Senior Product Manager', department: 'Product' },
        { id: 'REQ-2026-005', jobTitle: 'Senior Machine Learning Engineer', department: 'AI Research & Engineering' },
        { id: 'REQ-2026-014', jobTitle: 'Staff Platform Engineer', department: 'Engineering' }
      ];
    }
    setAvailableRequisitions(reqs);
    if (reqs.length > 0) setSelectedNewReqId(reqs[0].id);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast({ 
      title: 'Link Copied', 
      message: 'Candidate control profile URL copied to clipboard.', 
      type: 'success' 
    });
  };

  const handleNudgeRecruiter = (recruiterName) => {
    addToast({
      title: 'Engagement Dispatched',
      message: `Automated SLA reminder alert sent to ${recruiterName || 'the assigned recruiter'}.`,
      type: 'info'
    });
  };

  const handleAssociateApplication = async (e) => {
    e.preventDefault();
    if (!selectedNewReqId || !candidate) return;

    const reqObj = availableRequisitions.find(r => r.id === selectedNewReqId);
    if (!reqObj) return;

    try {
      const newApp = await candidateService.addApplicationToCandidate(candidate.id, {
        requisitionId: reqObj.id,
        jobTitle: reqObj.jobTitle,
        department: reqObj.department,
        actor: userRole === ATS_ROLES.HR_ADMIN ? 'HR Admin' : 'Lead Recruiter'
      });

      setCandidate(prev => ({
        ...prev,
        applications: [newApp, ...(prev.applications || [])]
      }));
      setIsAddAppModalOpen(false);
      addToast({
        title: 'Application Created',
        message: `${candidate.name} linked to requisition ${reqObj.id}.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to associate application', err);
      addToast({
        title: 'Association Failed',
        message: 'Could not associate candidate to requisition.',
        type: 'error'
      });
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !candidate) return;

    const noteRoleLabel = userRole === ATS_ROLES.HIRING_MANAGER 
      ? 'Hiring Manager' 
      : userRole === ATS_ROLES.HR_ADMIN 
        ? 'HR Admin' 
        : 'Recruiter';

    try {
      const newNote = await candidateService.addNote(candidate.id, {
        author: 'Current User',
        role: noteRoleLabel,
        content: newNoteText.trim()
      });

      setCandidate(prev => ({
        ...prev,
        notes: [newNote, ...(prev.notes || [])]
      }));
      setNewNoteText('');
      addToast({
        title: 'Note Posted',
        message: 'Internal observation logged into candidate dossier.',
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to add note', err);
      addToast({
        title: 'Note Failed',
        message: 'Could not post note to candidate profile.',
        type: 'error'
      });
    }
  };

  const handleOpenEditModal = () => {
    if (!candidate) return;
    const skillsStr = Array.isArray(candidate.skills)
      ? candidate.skills.map(s => typeof s === 'object' ? s.name : s).join(', ')
      : (candidate.skills || '');
    const tagsStr = Array.isArray(candidate.tags) ? candidate.tags.join(', ') : (candidate.tags || '');

    setEditFormData({
      name: candidate.name || '',
      email: candidate.email || '',
      phone: candidate.formattedPhone || candidate.phone || '',
      location: candidate.location || '',
      currentTitle: candidate.currentTitle || '',
      currentCompany: candidate.currentCompany || '',
      totalExperience: candidate.totalExperience || 0,
      noticePeriod: candidate.noticePeriod || '30 Days',
      workAuthorization: candidate.workAuthorization || 'Authorized',
      preferredLocation: candidate.preferredLocation || candidate.location || '',
      skills: skillsStr,
      tags: tagsStr
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditProfile = async (e) => {
    e.preventDefault();
    if (!candidate) return;

    try {
      const skillsArray = editFormData.skills
        ? editFormData.skills.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name, proficiency: 'Advanced', years: Math.round(Number(editFormData.totalExperience) || 4) }))
        : candidate.skills;

      const tagsArray = editFormData.tags
        ? editFormData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : candidate.tags;

      const updated = await candidateService.updateCandidate(candidate.id, {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        formattedPhone: editFormData.phone,
        location: editFormData.location,
        currentTitle: editFormData.currentTitle,
        currentCompany: editFormData.currentCompany,
        totalExperience: Number(editFormData.totalExperience) || 0,
        noticePeriod: editFormData.noticePeriod,
        workAuthorization: editFormData.workAuthorization,
        preferredLocation: editFormData.preferredLocation,
        skills: skillsArray,
        tags: tagsArray
      });

      setCandidate(updated);
      setIsEditModalOpen(false);
      addToast({
        title: 'Profile Updated',
        message: `${editFormData.name}'s profile updated successfully.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to update candidate', err);
      addToast({
        title: 'Update Failed',
        message: 'Could not save candidate edits.',
        type: 'error'
      });
    }
  };

  const handleUploadDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!uploadDocData.name || !candidate) return;

    try {
      const fileSizeStr = uploadDocData.file ? `${(uploadDocData.file.size / 1024 / 1024).toFixed(2)} MB` : '1.1 MB';

      // Convert file to base64 dataUrl for in-browser preview
      let dataUrl = null;
      if (uploadDocData.file) {
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(uploadDocData.file);
        });
      }

      const newDoc = await candidateService.addDocument(candidate.id, {
        name: uploadDocData.name,
        type: uploadDocData.type,
        size: fileSizeStr,
        uploadedBy: 'Current Recruiter',
        dataUrl: dataUrl || null
      });

      setCandidate(prev => ({
        ...prev,
        documents: [newDoc, ...(prev.documents || [])]
      }));
      setIsUploadDocModalOpen(false);
      setUploadDocData({ name: '', type: 'resume', file: null });
      addToast({
        title: 'Document Uploaded',
        message: `${newDoc.name} attached to candidate dossier.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to upload document', err);
      addToast({
        title: 'Upload Failed',
        message: 'Could not attach document.',
        type: 'error'
      });
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!candidate) return;
    try {
      await candidateService.deleteDocument(candidate.id, docId);
      setCandidate(prev => ({
        ...prev,
        documents: (prev.documents || []).filter(d => d.id !== docId)
      }));
      addToast({
        title: 'Document Removed',
        message: 'Document deleted from candidate dossier.',
        type: 'info'
      });
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1550px] mx-auto p-6 space-y-6 animate-pulse text-start">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-44 w-full bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
        <div className="h-96 w-full bg-slate-100 dark:bg-slate-800/40 rounded-2xl" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="w-full max-w-[1550px] mx-auto p-12 text-center space-y-4">
        <AlertTriangle size={36} className="mx-auto text-amber-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Candidate profile not found</h2>
        <button
          type="button"
          onClick={onBack}
          style={{ backgroundColor: brandColor }}
          className="px-4 py-2 text-xs font-bold text-white rounded-xl cursor-pointer"
        >
          Return to Candidates Hub
        </button>
      </div>
    );
  }

  const allApplications = candidate.applications || [];
  const applications = userRole === ATS_ROLES.HIRING_MANAGER
    ? allApplications.filter(a => userRequisitions.includes(a.requisitionId))
    : allApplications;
  const primaryApp = applications[0] || allApplications[0] || null;

  // RBAC Permission check for Stage Transitions (Recruiter, HR Admin, ATS Admin)
  const canAdvanceStage = hasPermission(userRole, PERMISSIONS.CANDIDATE_APPLICATION_MOVE);

  // Pipeline stages reference for the visual funnel
  const pipelineStages = [
    { key: APPLICATION_STAGE.APPLIED, label: 'Applied', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-950/30', border: 'border-blue-200/70 dark:border-blue-900/40' },
    { key: APPLICATION_STAGE.SCREENING, label: 'Screening', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50/50 dark:bg-sky-950/30', border: 'border-sky-200/70 dark:border-sky-900/40' },
    { key: APPLICATION_STAGE.SHORTLISTED, label: 'Shortlisted', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50/50 dark:bg-purple-950/30', border: 'border-purple-200/70 dark:border-purple-900/40' },
    { key: APPLICATION_STAGE.INTERVIEW, label: 'Interview', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-950/30', border: 'border-amber-200/70 dark:border-amber-900/40' },
    { key: APPLICATION_STAGE.OFFER, label: 'Offer', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/50 dark:bg-indigo-950/30', border: 'border-indigo-200/70 dark:border-indigo-900/40' },
    { key: APPLICATION_STAGE.HIRED, label: 'Hired', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-950/30', border: 'border-emerald-200/70 dark:border-emerald-900/40' },
  ];

  const currentStageIndex = pipelineStages.findIndex(s => s.key === (primaryApp?.stage || APPLICATION_STAGE.SCREENING));

  // Enterprise SaaS Navigation Tabs
  const tabs = [
    { id: 'overview', label: 'Overview & Profile', icon: FileText },
    { id: 'applications', label: `Applications (${applications.length})`, icon: Briefcase },
    { id: 'timeline', label: 'Timeline & Audit', icon: Clock },
    { id: 'documents', label: `Documents (${candidate.documents?.length || 0})`, icon: Download },
    { id: 'skills', label: `Skills & Match (${candidate.skills?.length || 0})`, icon: Award },
    { id: 'experience', label: 'Experience & Education', icon: Building },
    { id: 'communication', label: `Communication (${candidate.communication?.length || 0})`, icon: MessageSquare },
    { id: 'notes', label: `Notes (${candidate.notes?.length || 0})`, icon: MessageSquare }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[1550px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-6 text-start"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          1. COMPACT ENTITY HEADER (MATCHING REQUISITION DETAILS FORMAT)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-3">
        
        {/* Row 1: Back Nav + Avatar + Title + Status + Action Toolbar */}
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

            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs text-white shadow-2xs shrink-0"
              style={{ backgroundColor: candidate.avatarBg || brandColor }}
            >
              {candidate.avatar || 'CD'}
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              {candidate.name}
            </h1>

            <ModernStatusBadge status={candidate.status} />

            {/* Match Score Badge */}
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 shrink-0 whitespace-nowrap bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Match: {candidate.screeningScore || 88}%</span>
            </span>

            {/* Applications Pill */}
            <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shrink-0 whitespace-nowrap">
              {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
            </span>
          </div>

          {/* Contextual Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleCopyLink}
              className="h-8 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 size={13} /> Share
            </button>
            
            <button
              onClick={() => window.print()}
              className="h-8 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} /> Print
            </button>

            {primaryApp && canAdvanceStage && (
              <button
                onClick={() => onOpenStageTransition && onOpenStageTransition(candidate, primaryApp)}
                style={{ backgroundColor: brandColor }}
                className="h-8 px-3.5 text-xs font-bold text-white rounded-lg shadow-2xs flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <span>Advance Stage</span>
                <ArrowRight size={13} />
              </button>
            )}

            <button
              onClick={handleOpenEditModal}
              className="h-8 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Row 2: Structured 4-Column Aligned Metadata Grid (Uniform with ResumeDetailPage) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2.5 gap-x-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {/* Col 1, Row 1: Candidate ID */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <FileText size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Candidate ID:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">{candidate.candidateNumber || candidate.id}</strong>
          </div>

          {/* Col 2, Row 1: Current Role */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Briefcase size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Current Role:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{candidate.currentTitle || 'Software Professional'} {candidate.currentCompany ? `at ${candidate.currentCompany}` : ''}</strong>
          </div>

          {/* Col 3, Row 1: Experience */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Experience:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{candidate.experienceDisplay || `${candidate.totalExperience || 0} yrs`}</strong>
          </div>

          {/* Col 4, Row 1: Primary Requisition */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Building size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Primary REQ:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">{primaryApp?.requisitionId || 'Talent Pool'}</strong>
          </div>

          {/* Col 1, Row 2: Email */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Mail size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Email:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{candidate.email}</strong>
          </div>

          {/* Col 2, Row 2: Phone */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Phone size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Phone:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{candidate.formattedPhone || candidate.phone || '—'}</strong>
          </div>

          {/* Col 3, Row 2: Location */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Location:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{candidate.location || '—'}</strong>
          </div>

          {/* Col 4, Row 2: Notice Period */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Notice Period:</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200 truncate">{candidate.noticePeriod || 'Immediate'}</strong>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. CANDIDATE ATS PIPELINE PROGRESSION STEPPER (MILD BLUE GLASS & BRAND STEPPERS)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-100/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Candidate Pipeline Progression</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Target Requisition: <strong className="font-semibold text-slate-900 dark:text-white font-mono">{primaryApp?.requisitionId || 'Talent Pool'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Current Stage: <strong className="font-bold text-blue-600 dark:text-blue-400">{primaryApp?.stage || 'Screening'}</strong>
            </span>
            {primaryApp && canAdvanceStage && (
              <button
                onClick={() => onOpenStageTransition && onOpenStageTransition(candidate, primaryApp)}
                style={{ backgroundColor: brandColor }}
                className="px-2.5 py-1 text-[11px] font-bold text-white rounded-lg shadow-2xs hover:brightness-110 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Advance Stage</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Compact 6-Stage Pipeline Stepper Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 relative">
          {pipelineStages.map((stage, idx) => {
            const isCurrent = (primaryApp?.stage || APPLICATION_STAGE.SCREENING) === stage.key;
            const isCompleted = idx < currentStageIndex;

            return (
              <div
                key={stage.key}
                onClick={() => {
                  if (primaryApp && canAdvanceStage && onOpenStageTransition) {
                    onOpenStageTransition(candidate, primaryApp);
                  }
                }}
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                  canAdvanceStage ? 'cursor-pointer' : 'cursor-default'
                } ${
                  isCurrent
                    ? 'bg-gradient-to-br from-white via-blue-50/60 to-blue-50/30 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border-blue-300/80 dark:border-blue-800 shadow-[0_4px_15px_-2px_rgba(26,86,219,0.12)] -translate-y-0.5 ring-1 ring-[var(--pw-brand)]'
                    : isCompleted
                      ? 'bg-gradient-to-br from-blue-50/30 to-white/60 dark:from-blue-950/20 dark:to-slate-900/40 border-blue-100/80 dark:border-blue-900/30 hover:opacity-100'
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60 hover:opacity-90'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCompleted || isCurrent
                      ? 'text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                  style={isCompleted || isCurrent ? { backgroundColor: brandColor } : {}}
                >
                  {isCompleted ? <Check size={13} strokeWidth={3} /> : idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-bold truncate ${
                    isCurrent
                      ? 'text-blue-950 dark:text-blue-100 font-extrabold'
                      : isCompleted
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {idx + 1}. {stage.label}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {isCompleted ? '✓ Completed' : isCurrent ? 'Active Stage' : 'Pending'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Card 2 Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
          <span>Candidate Ingested into Pipeline on <strong>{candidate.createdAt || candidate.createdDate || '2026-09-28'}</strong></span>
          <span>Current Active Status: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{candidate.status || 'Active'}</strong></span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. MAIN CONTENT TABS (UNIFORM WITH RESUME & JD DETAIL PAGES)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={isActive ? { borderBottomColor: brandColor, color: brandColor } : {}}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-50 dark:bg-slate-800/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {Icon && <Icon size={14} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. MAIN CONTENT AREA (TWO-COLUMN ENTERPRISE LAYOUT)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Primary Workspace Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: OVERVIEW & PROFILE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Professional Details Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <Briefcase size={14} className="text-slate-400" />
                  <span>Professional Details & Employment Parameters</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Total Experience</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{candidate.experienceDisplay || `${candidate.totalExperience} yrs`}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Notice Period</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{candidate.noticePeriod || 'Immediate'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Preferred Work Mode</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{candidate.preferredLocation || 'Flexible'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Work Authorization</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{candidate.workAuthorization || 'Authorized'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Current Employer</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{candidate.currentCompany || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Current Title</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{candidate.currentTitle}</span>
                  </div>
                </div>
              </div>

              {/* Key Skills & Proficiencies Snapshot */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <Award size={14} className="text-slate-400" />
                  <span>Key Skills & Proficiencies</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(candidate.skills || []).map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700"
                    >
                      <span>{skill.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({skill.proficiency})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience Highlights */}
              {candidate.experience && candidate.experience.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <Building size={14} className="text-slate-400" />
                    <span>Recent Experience Highlight</span>
                  </h3>
                  <div className="space-y-3">
                    {candidate.experience.slice(0, 2).map((exp, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="font-bold text-slate-900 dark:text-white">{exp.jobTitle} • {exp.company}</span>
                          <span className="font-mono text-[11px] text-slate-400">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Application History across Requisitions
                  </h3>
                  <span className="text-xs text-slate-500">
                    Each candidate may hold multiple applications across different jobs in the ATS.
                  </span>
                </div>

                {userRole !== ATS_ROLES.HIRING_MANAGER && (
                  <button
                    type="button"
                    onClick={() => setIsAddAppModalOpen(true)}
                    style={{ backgroundColor: brandColor }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-2xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Associate to Requisition</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {applications.map(app => (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {app.jobTitle}
                          </h4>
                          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                            {app.requisitionId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {app.department} • Applied {new Date(app.appliedAt).toLocaleDateString('en-GB')} via {app.source}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 whitespace-nowrap shrink-0">
                          Stage: {app.stage}
                        </span>

                        {canAdvanceStage && (
                          <button
                            type="button"
                            onClick={() => onOpenStageTransition && onOpenStageTransition(candidate, app)}
                            style={{ backgroundColor: brandColor }}
                            className="px-3 py-1.5 text-xs font-bold text-white rounded-lg flex items-center gap-1 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                          >
                            <span>Move Stage</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Screening Breakdown */}
                    {app.screeningScore !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Overall Match Score</span>
                          <span className="text-lg font-bold font-mono text-emerald-600">{app.screeningScore}%</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Outcome</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{app.screeningOutcome || 'Strong Match'}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Assigned Recruiter</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{app.assignedRecruiter}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Hiring Manager</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{app.hiringManager || 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE & AUDIT */}
          {activeTab === 'timeline' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                Chronological Business Activity & Audit Log
              </h3>

              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 before:z-0">
                {(primaryApp?.timeline || [
                  { id: 1, action: 'Candidate Created', user: 'System', timestamp: candidate.createdAt, details: 'Profile registered in ATS master repository' },
                  { id: 2, action: 'Initial Screening Started', user: 'Sarah Jenkins', timestamp: candidate.updatedAt, details: 'Matched with REQ-2026-001 criteria' }
                ]).map((event, idx) => (
                  <div key={idx} className="relative z-10 flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-1">
                      <Clock size={10} className="text-slate-500" />
                    </div>
                    <div className="flex-1 bg-slate-50/70 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{event.action}</span>
                          <span className="text-slate-400 text-[11px] block">By {event.user}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">
                        {typeof event.details === 'object' && event.details !== null ? JSON.stringify(event.details) : String(event.details || '')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Candidate Documents & Attachments
                </h3>
                <button
                  type="button"
                  style={{ backgroundColor: brandColor }}
                  onClick={() => setIsUploadDocModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-white rounded-xl flex items-center gap-1 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  <span>Upload Document</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(candidate.documents || []).length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    No documents attached to candidate dossier. Click Upload Document above.
                  </div>
                ) : (
                  (candidate.documents || []).map(doc => (
                    <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{doc.name}</p>
                          <p className="text-[11px] text-slate-400">{doc.size} • Uploaded {new Date(doc.uploadedAt || Date.now()).toLocaleDateString('en-GB')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDocument(doc)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} /> Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => addToast({ title: 'Downloading', message: `Downloading ${doc.name}...`, type: 'info' })}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete Document"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SKILLS & MATCH */}
          {activeTab === 'skills' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Skills Inventory & Proficiency Assessment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified technical proficiencies extracted from resume and ATS evaluations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(candidate.skills || []).map((skill, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{skill.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {skill.proficiency}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: skill.proficiency === 'Expert' ? '95%' : skill.proficiency === 'Advanced' ? '80%' : '60%',
                          backgroundColor: brandColor 
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Experience: {skill.years || 4}+ years</span>
                      <span>Source: {skill.source || 'Verified'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: EXPERIENCE & EDUCATION */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              {/* Work History */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Building size={14} className="text-slate-400" />
                  <span>Work Experience</span>
                </h3>

                <div className="space-y-4">
                  {(candidate.experience || [
                    {
                      company: candidate.currentCompany || 'Tech Enterprise',
                      jobTitle: candidate.currentTitle || 'Senior Engineer',
                      startDate: '2022',
                      endDate: 'Present',
                      description: 'Architected and implemented enterprise cloud solutions with modern workflows.'
                    }
                  ]).map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{exp.jobTitle}</h4>
                          <p className="text-slate-500 font-medium">{exp.company} • {exp.location || candidate.location}</p>
                        </div>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {exp.startDate} – {exp.endDate}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <GraduationCap size={14} className="text-slate-400" />
                  <span>Education & Credentials</span>
                </h3>

                <div className="space-y-3">
                  {(candidate.education || [
                    {
                      degree: 'B.S. in Computer Science',
                      institution: 'State University',
                      startYear: '2016',
                      endYear: '2020',
                      fieldOfStudy: 'Software Engineering'
                    }
                  ]).map((edu, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{edu.degree}</h4>
                          <p className="text-slate-500 font-medium">{edu.institution}</p>
                        </div>
                        <span className="font-mono text-xs text-slate-400">
                          {edu.startYear} – {edu.endYear}
                        </span>
                      </div>
                      {edu.fieldOfStudy && (
                        <p className="text-slate-600 dark:text-slate-400 text-xs">Major: {edu.fieldOfStudy} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: COMMUNICATION */}
          {activeTab === 'communication' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Mail size={14} className="text-blue-500" />
                  <span>Candidate Email & Communication History</span>
                </h3>
                <span className="text-[11px] font-medium text-slate-400">
                  {(candidate.communication || []).length} Message{(candidate.communication || []).length === 1 ? '' : 's'} Logged
                </span>
              </div>

              <div className="space-y-3">
                {(candidate.communication || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Mail size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No communication logged yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Automated interview invitations and candidate updates will appear here.</p>
                  </div>
                ) : (
                  (candidate.communication || []).map((comm, idx) => (
                    <div key={comm.id || idx} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-2.5 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {comm.type || 'EMAIL'}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{comm.subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            comm.status === 'SENT' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${comm.status === 'SENT' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {comm.status || 'SENT'}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">{new Date(comm.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80">
                        <span><strong className="text-slate-700 dark:text-slate-300">From:</strong> {comm.sender}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span><strong className="text-slate-700 dark:text-slate-300">To:</strong> {comm.recipient}</span>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-sans text-xs whitespace-pre-line leading-relaxed">
                        {comm.body || comm.snippet}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}


          {/* TAB 8: NOTES */}
          {activeTab === 'notes' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <MessageSquare size={14} className="text-slate-400" />
                <span>Recruiter & Hiring Team Internal Notes</span>
              </h3>

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Add an internal observation, interview feedback note, or screening reminder..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    style={{ backgroundColor: brandColor }}
                    className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Send size={12} />
                    <span>Post Note</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {(candidate.notes || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No notes posted yet.</p>
                ) : (
                  (candidate.notes || []).map(n => (
                    <div key={n.id} className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{n.author} ({n.role})</span>
                        <span>{new Date(n.timestamp).toLocaleString('en-GB')}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sticky Quick Information Panels (Matching RequisitionDetails) */}
        <div className="space-y-4 lg:sticky lg:top-6">
          
          <SideCard icon={Briefcase} title="Quick Information">
            <QuickInfoRow label="Candidate ID" value={candidate.candidateNumber || candidate.id} isMonospace />
            <QuickInfoRow label="Target Requisition" value={primaryApp?.requisitionId || 'Talent Pool'} isHighlight highlightColor={brandColor} />
            <QuickInfoRow label="Applied Role" value={primaryApp?.jobTitle || candidate.currentTitle} />
            <QuickInfoRow label="Department" value={primaryApp?.department || 'Engineering'} />
            <QuickInfoRow label="Assigned Recruiter" value={primaryApp?.assignedRecruiter || 'Sarah Jenkins'} />
            <QuickInfoRow label="Hiring Manager" value={primaryApp?.hiringManager || 'Alex Chen'} />
            <QuickInfoRow label="Candidate Source" value={candidate.source} />
            <QuickInfoRow 
              label="Match Score" 
              value={`${primaryApp?.screeningScore || candidate.screeningScore || 88}%`} 
              isHighlight 
              highlightColor="#10b981" 
            />
            <QuickInfoRow label="Notice Period" value={candidate.noticePeriod || 'Immediate'} />
            <QuickInfoRow label="Work Authorization" value={candidate.workAuthorization || 'US Citizen'} />
          </SideCard>

          <SideCard icon={Flame} title="Active Candidate Tags">
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(candidate.tags || ['React', 'TypeScript', 'Design Systems', 'Immediate Joiner']).map((t, i) => (
                <span 
                  key={i} 
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                >
                  #{t}
                </span>
              ))}
            </div>
          </SideCard>

          <SideCard icon={Clock} title="Stage SLA & Engagement">
            <QuickInfoRow label="Current Stage" value={primaryApp?.stage || 'Screening'} isHighlight highlightColor={brandColor} />
            <QuickInfoRow label="Days in Stage" value="3 Days" isMonospace />
            <QuickInfoRow label="Stage SLA Target" value="Under SLA (4d left)" isHighlight highlightColor="#10b981" />
            <div className="pt-2">
              <button 
                onClick={() => handleNudgeRecruiter(primaryApp?.assignedRecruiter)}
                className="w-full h-8 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bell size={13} /> Dispatched SLA Alert
              </button>
            </div>
          </SideCard>

        </div>

      </div>

      {/* Document Preview Modal */}
      {previewDocument && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir="ltr">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-start">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-500 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[400px]">{previewDocument.name}</h3>
                <span className="text-[11px] text-slate-400 font-medium shrink-0">{previewDocument.size}</span>
              </div>
              <button onClick={() => setPreviewDocument(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0">
                <X size={16} />
              </button>
            </div>

            {previewDocument.dataUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height: '75vh' }}>
                <iframe
                  src={previewDocument.dataUrl}
                  title={previewDocument.name}
                  className="w-full h-full"
                  style={{ border: 'none' }}
                />
              </div>
            ) : (
              <div className="h-80 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs gap-3">
                <FileText size={44} className="text-blue-400/70" />
                <div className="text-center space-y-1">
                  <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">{previewDocument.name}</p>
                  <p className="text-slate-400 text-xs">This document was added before file storage was enabled.</p>
                  <p className="text-slate-400 text-xs">Re-upload the file to enable in-browser preview.</p>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Associate Requisition Modal */}
      {isAddAppModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm text-start" dir="ltr">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-[var(--pw-brand)]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Associate to Requisition</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddAppModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssociateApplication} className="space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Link <strong className="text-slate-900 dark:text-white">{candidate.name}</strong> to an active requisition to initiate recruitment screening and pipeline progression.
              </p>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Select Target Requisition</label>
                <SearchableSelect
                  value={selectedNewReqId}
                  onChange={(val) => setSelectedNewReqId(val)}
                  options={availableRequisitions.map(req => ({
                    value: req.id,
                    label: `${req.id} — ${req.jobTitle}`,
                    subtext: req.department
                  }))}
                  placeholder="Select requisition..."
                  size="md"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAppModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: brandColor }}
                  className="px-4 py-1.5 text-xs font-bold text-white rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Check size={14} />
                  <span>Create Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Candidate Profile Modal */}
      {isEditModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm text-start" dir="ltr">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-[var(--pw-brand)]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Candidate Profile</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter candidate full name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter candidate email address"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter contact phone number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    type="text"
                    value={editFormData.location || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter current city / location"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Current Job Title</label>
                  <input
                    type="text"
                    value={editFormData.currentTitle || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, currentTitle: e.target.value }))}
                    placeholder="Enter current job title"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Current Company</label>
                  <input
                    type="text"
                    value={editFormData.currentCompany || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
                    placeholder="Enter current company name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Total Exp (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editFormData.totalExperience || 0}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, totalExperience: e.target.value }))}
                    placeholder="Enter experience in years"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Notice Period</label>
                  <CustomSelect
                    value={editFormData.noticePeriod || '30 Days'}
                    onChange={(val) => setEditFormData(prev => ({ ...prev, noticePeriod: val }))}
                    options={[
                      { value: 'Immediate', label: 'Immediate' },
                      { value: '15 Days', label: '15 Days' },
                      { value: '30 Days', label: '30 Days' },
                      { value: '60 Days', label: '60 Days' },
                      { value: '90 Days', label: '90 Days' }
                    ]}
                    size="md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Work Authorization</label>
                  <input
                    type="text"
                    value={editFormData.workAuthorization || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, workAuthorization: e.target.value }))}
                    placeholder="e.g. Authorized / US Citizen"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Skills (comma separated)</label>
                <input
                  type="text"
                  value={editFormData.skills || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="Enter technical skills (e.g. React, TypeScript, Node.js)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: brandColor }}
                  className="px-4 py-1.5 text-xs font-bold text-white rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Check size={14} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Upload Document Modal */}
      {isUploadDocModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm text-start" dir="ltr">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[var(--pw-brand)]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Candidate Document</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsUploadDocModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadDocumentSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Document Title *</label>
                <input
                  type="text"
                  required
                  value={uploadDocData.name}
                  onChange={(e) => setUploadDocData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter document title"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Document Category</label>
                <CustomSelect
                  value={uploadDocData.type}
                  onChange={(val) => setUploadDocData(prev => ({ ...prev, type: val }))}
                  options={[
                    { value: 'resume', label: 'Resume / CV' },
                    { value: 'cover_letter', label: 'Cover Letter' },
                    { value: 'portfolio', label: 'Portfolio / Work Samples' },
                    { value: 'certificate', label: 'Certification / Degree' },
                    { value: 'id_proof', label: 'Identity Document' },
                    { value: 'offer_letter', label: 'Offer Letter' },
                    { value: 'other', label: 'Other Document' }
                  ]}
                  size="md"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Select File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadDocData(prev => ({
                        ...prev,
                        file,
                        name: prev.name || file.name
                      }));
                    }
                  }}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: brandColor }}
                  className="px-4 py-1.5 text-xs font-bold text-white rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Check size={14} />
                  <span>Attach Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};

export default CandidateProfilePage;
