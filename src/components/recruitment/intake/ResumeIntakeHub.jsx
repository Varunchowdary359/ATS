import React, { useState, useContext, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileUp, Briefcase, Files, FolderArchive, Mail, Eye, Download, Link, 
  Copy, Folder, Clock, Search, Filter, AlertTriangle, CheckCircle2, 
  XCircle, MoreVertical, ShieldCheck, UserCheck, RefreshCw, Layers, 
  Trash2, FileSearch, History, Check, ChevronDown, HelpCircle,
  FileSpreadsheet, AlertCircle, ArrowUpDown, TrendingUp, Award, Columns3, X,
  SlidersHorizontal, RotateCcw, Users, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../../../ThemeContext';
import { ModernPageHeader, ModernStatusBadge } from '../../admin/shared/ModernAdminLayoutComponents';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import ModernSearchInput from '../../dashboard/shared/ModernSearchInput';

import { INITIAL_RESUMES, ALL_INTAKE_SOURCES } from './resumeIntakeMockData';
import { INITIAL_REQUISITIONS } from '../recruitmentMockData';
import { INITIAL_JDS } from '../jd/jdMockData';

import AddResumeModal from './AddResumeModal';
import AddResumeToJobModal from './AddResumeToJobModal';
import ScreenExistingResumeModal from './ScreenExistingResumeModal';
import DuplicateResolutionModal from './DuplicateResolutionModal';
import ResumeDetailDrawer from './ResumeDetailDrawer';
import ResumeDetailPage from './ResumeDetailPage';
import KpiAnalyticsGraphModal from '../../dashboard/shared/KpiAnalyticsGraphModal';
import EnterpriseKpiAnalyticsModal from '../../dashboard/shared/EnterpriseKpiAnalyticsModal';
import ConfirmModal from '../../admin/shared/ConfirmModal';
import { useBreadcrumb } from '../../shared/BreadcrumbContext';
import { DatabaseService } from '../../../services/db/DatabaseService';

// Standard Personas matching Requisition & JD Hubs
const INTAKE_PERSONAS = [
  { 
    id: 'recruiter', 
    label: 'Recruiter / Resume Manager', 
    description: 'Full intake, single/bulk upload, assign to REQ/JD, screen candidates, review duplicates',
    color: '#3b82f6'
  },
  { 
    id: 'hiring_manager', 
    label: 'Hiring Manager / Reviewer', 
    description: 'View resumes assigned to your requisitions, screening scores & candidate profiles',
    color: '#8b5cf6'
  },
  { 
    id: 'dept_head', 
    label: 'Department Head / Approver', 
    description: 'Departmental review of candidate pipeline and hiring approvals',
    color: '#f59e0b'
  },
  { 
    id: 'admin', 
    label: 'Super Admin / ATS Admin', 
    description: 'Full repository control, duplicate resolution, source config, audit visibility & deletion',
    color: '#10b981'
  }
];

const ResumeIntakeHub = ({ onNavigate, initialTab = 'all' }) => {
  const { activeRole, setActiveRole, activeTheme, isDarkMode } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || 'var(--pw-brand)';
  
  // Master State
  const [resumes, setResumes] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedSession = sessionStorage.getItem('pw_resumes');
        const savedLocal = localStorage.getItem('pw_resumes');
        let sessionList = savedSession ? JSON.parse(savedSession) : [];
        let localList = savedLocal ? JSON.parse(savedLocal) : [];
        const mergedMap = new Map();
        [...INITIAL_RESUMES, ...localList, ...sessionList].forEach(item => {
          if (item && item.id) {
            mergedMap.set(item.id, item);
          }
        });
        if (mergedMap.size > 0) return Array.from(mergedMap.values());
      }
    } catch (e) {}
    return INITIAL_RESUMES;
  });

  // Synchronize candidate into enterprise database for Candidate Repository and Interview module
  const syncCandidateToDatabase = (resume, status = 'Shortlisted') => {
    if (!resume || !resume.candidateName) return;
    try {
      DatabaseService.init();
      const candidateId = resume.id || `CAND-${Date.now()}`;
      const nameParts = (resume.candidateName || 'Unknown Candidate').split(' ');
      const firstName = nameParts[0] || 'Candidate';
      const lastName = nameParts.slice(1).join(' ') || '';

      // 1. Upsert Candidate in DatabaseService.candidates
      const existingIndex = DatabaseService.candidates.findIndex(c => 
        c.id === candidateId || 
        (c.email && resume.email && c.email.toLowerCase() === resume.email.toLowerCase()) ||
        (c.name && resume.candidateName && c.name.toLowerCase() === resume.candidateName.toLowerCase())
      );

      const candObj = {
        id: candidateId,
        candidateNumber: resume.id || candidateId,
        name: resume.candidateName || 'Mohanarani Sambaru',
        firstName,
        lastName,
        email: resume.email || 'mohanarani.s@gmail.com',
        phone: resume.phone || '+91 98451 23456',
        location: resume.location || 'Bangalore, India',
        totalExperience: parseFloat(resume.totalExperience) || 4.5,
        experienceDisplay: resume.totalExperience || '4.5 yrs',
        currentCompany: resume.currentCompany || 'Infosys Technologies',
        currentTitle: resume.currentRole || 'Automation QA Engineer',
        skills: Array.isArray(resume.skills) ? resume.skills : ['Selenium', 'Java', 'TestNG', 'RestAssured'],
        status: 'Active',
        source: resume.intakeSource || 'Single File Upload',
        createdAt: resume.uploadedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        DatabaseService.candidates[existingIndex] = { ...DatabaseService.candidates[existingIndex], ...candObj };
      } else {
        DatabaseService.candidates.unshift(candObj);
      }

      // 2. Upsert Application in DatabaseService.applications
      const appId = `APP-${candidateId}`;
      const existingAppIndex = DatabaseService.applications.findIndex(a => a.id === appId || a.candidateId === candidateId);
      
      const rawStatus = (status || resume.processingStatus || '').toLowerCase();
      let appStage = 'Screening';
      if (rawStatus.includes('shortlist') || rawStatus.includes('hm recommended') || rawStatus.includes('recommend')) {
        appStage = 'Shortlisted';
      } else if (rawStatus.includes('interview') || rawStatus.includes('scheduled')) {
        appStage = 'Interview';
      } else if (rawStatus.includes('offer')) {
        appStage = 'Offer';
      } else if (rawStatus.includes('hire')) {
        appStage = 'Hired';
      } else if (rawStatus.includes('screen') || (resume.screeningScore !== null && resume.screeningScore !== undefined)) {
        appStage = 'Screening';
      } else {
        appStage = 'Applied';
      }

      const candidateTitle = resume.currentRole || resume.jobTitle || 'Automation QA Engineer';
      const reqTitle = resume.requisitionTitle || 'Senior Automation Test Engineer';

      const appObj = {
        id: appId,
        candidateId: candidateId,
        requisitionId: resume.requisitionId || 'REQ-2026-0001',
        jobTitle: reqTitle,
        stage: appStage,
        status: 'Active',
        screeningScore: typeof resume.screeningScore === 'number' ? resume.screeningScore : parseInt(String(resume.screeningScore || '85').replace('%', ''), 10) || 85,
        appliedAt: resume.uploadedAt || new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        assignedRecruiter: 'Sarah Chen',
        hiringManager: 'Alex Rivera',
        source: resume.intakeSource || 'Direct'
      };

      if (existingAppIndex >= 0) {
        DatabaseService.applications[existingAppIndex] = { ...DatabaseService.applications[existingAppIndex], ...appObj };
      } else {
        DatabaseService.applications.unshift(appObj);
      }

      // 3. If Interview Scheduled, create interview session in DatabaseService.interviews
      if (status === 'Interview Scheduled') {
        const interviewId = `INT-${candidateId}`;
        const existingIntIndex = DatabaseService.interviews.findIndex(i => i.id === interviewId || i.candidateId === candidateId);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const scheduledDateStr = tomorrow.toISOString().split('T')[0];

        const interviewObj = {
          id: interviewId,
          applicationId: appId,
          candidateId: candidateId,
          requisitionId: resume.requisitionId || 'REQ-2026-0001',
          candidateName: resume.candidateName,
          jobTitle: resume.requisitionTitle || 'Senior Automation Test Engineer',
          roundName: 'Round 1 Technical Interview',
          roundType: 'Technical',
          scheduledDate: scheduledDateStr,
          startTime: '10:00',
          endTime: '11:00',
          interviewers: ['Alex Rivera (Hiring Manager)'],
          status: 'SCHEDULED',
          statusDisplay: 'Scheduled',
          meetingUrl: 'https://meet.google.com/xyz-recruitment-tech',
          createdAt: new Date().toISOString()
        };

        if (existingIntIndex >= 0) {
          DatabaseService.interviews[existingIntIndex] = { ...DatabaseService.interviews[existingIntIndex], ...interviewObj };
        } else {
          DatabaseService.interviews.unshift(interviewObj);
        }
      }

      DatabaseService.persistAll();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pw_db_updated'));
        window.dispatchEvent(new CustomEvent('pw:candidate_created'));
        window.dispatchEvent(new CustomEvent('pw:application_created'));
      }
    } catch (err) {
      console.error('Error syncing resume to candidate repository:', err);
    }
  };

  // Auto-persist resumes to sessionStorage & localStorage and sync to database
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && Array.isArray(resumes)) {
        sessionStorage.setItem('pw_resumes', JSON.stringify(resumes));
        localStorage.setItem('pw_resumes', JSON.stringify(resumes));
        resumes.forEach(r => {
          syncCandidateToDatabase(r, r.processingStatus);
        });
      }
    } catch (e) {}
  }, [resumes]);
  const [requisitions] = useState(INITIAL_REQUISITIONS);
  const [jds] = useState(INITIAL_JDS);

  // Active Persona State
  const [selectedPersona, setSelectedPersona] = useState(() => {
    if (activeRole?.id === 'hiring_manager') return 'hiring_manager';
    if (activeRole?.id === 'super_admin' || activeRole?.id === 'pw_ceo') return 'admin';
    return 'recruiter';
  });

  // Active Navigation Tab & Filters
  const [activeTab, setActiveTab] = useState(initialTab); // all | processing | review | duplicates | screening | repository
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedReqFilter, setSelectedReqFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedOutcomeFilter, setSelectedOutcomeFilter] = useState('All');

  // Multi-select Export Checkbox State
  const [selectedResumeIds, setSelectedResumeIds] = useState([]);

  // Action Menu, Add Resume Menu & Customize View Dropdown State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [rowMenuStyle, setRowMenuStyle] = useState({});
  const menuRef = useRef(null);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);

  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false);
  const [colSearchQuery, setColSearchQuery] = useState('');
  const [customizeMenuStyle, setCustomizeMenuStyle] = useState({});
  const customizeMenuRef = useRef(null);

  const updateCustomizeMenuPosition = () => {
    if (customizeMenuRef.current && showCustomizeMenu) {
      const rect = customizeMenuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popoverWidth = Math.min(260, viewportWidth - 24);
      const popoverHeight = 350;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const flip = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

      let calculatedRight = viewportWidth - rect.right;
      let calculatedLeft = undefined;

      if (rect.right - popoverWidth < 12) {
        calculatedLeft = 12;
        calculatedRight = undefined;
      }
      if (calculatedRight !== undefined && calculatedRight < 12) {
        calculatedRight = 12;
      }

      setCustomizeMenuStyle({
        position: 'fixed',
        top: flip ? undefined : rect.bottom + 6,
        bottom: flip ? viewportHeight - rect.top + 6 : undefined,
        right: calculatedRight,
        left: calculatedLeft,
        width: `${popoverWidth}px`,
        maxWidth: `calc(100vw - 24px)`,
        zIndex: 999999
      });
    }
  };

  useLayoutEffect(() => {
    if (showCustomizeMenu) {
      updateCustomizeMenuPosition();
      window.addEventListener('scroll', updateCustomizeMenuPosition, true);
      window.addEventListener('resize', updateCustomizeMenuPosition);
      return () => {
        window.removeEventListener('scroll', updateCustomizeMenuPosition, true);
        window.removeEventListener('resize', updateCustomizeMenuPosition);
      };
    }
  }, [showCustomizeMenu]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.closest('[data-portal-resume-customize]')) return;
      if (customizeMenuRef.current && !customizeMenuRef.current.contains(e.target)) {
        setShowCustomizeMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowCustomizeMenu(false);
    };
    if (showCustomizeMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCustomizeMenu]);

  const updateRowMenuPosition = () => {
    if (menuRef.current && activeMenuId) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popoverWidth = 192;
      const popoverHeight = 180;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const flip = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

      let calculatedRight = viewportWidth - rect.right;
      let calculatedLeft = undefined;

      if (rect.right - popoverWidth < 12) {
        calculatedLeft = 12;
        calculatedRight = undefined;
      }

      setRowMenuStyle({
        position: 'fixed',
        top: flip ? undefined : rect.bottom + 4,
        bottom: flip ? viewportHeight - rect.top + 4 : undefined,
        right: calculatedRight,
        left: calculatedLeft,
        width: `${popoverWidth}px`,
        maxWidth: `calc(100vw - 24px)`,
        zIndex: 999999
      });
    }
  };

  useLayoutEffect(() => {
    if (activeMenuId) {
      updateRowMenuPosition();
      window.addEventListener('scroll', updateRowMenuPosition, true);
      window.addEventListener('resize', updateRowMenuPosition);
      return () => {
        window.removeEventListener('scroll', updateRowMenuPosition, true);
        window.removeEventListener('resize', updateRowMenuPosition);
      };
    }
  }, [activeMenuId]);

  useEffect(() => {
    const handleOutsideMenuClick = (e) => {
      if (e.target.closest('[data-portal-resume-row-menu]')) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveMenuId(null);
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleOutsideMenuClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideMenuClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenuId]);

  const allCustomizeColumns = useMemo(() => [
    { key: 'candidate', label: 'Candidate & Resume File', required: true },
    { key: 'source', label: 'Intake Source', required: false },
    { key: 'jobLink', label: 'Requisition & Job Link', required: false },
    { key: 'status', label: 'Processing Status', required: false },
    { key: 'score', label: 'Screening Score', required: false },
    { key: 'duplicate', label: 'Duplicate Status', required: false },
    { key: 'uploaded', label: 'Uploaded Date', required: false },
    { key: 'phone', label: 'Phone Number (Optional)', required: false },
    { key: 'email', label: 'Email Address (Optional)', required: false },
    { key: 'experience', label: 'Total Experience (Optional)', required: false },
    { key: 'skills', label: 'Key Skills (Optional)', required: false }
  ], []);

  const filteredColumnsList = useMemo(() => {
    if (!colSearchQuery.trim()) return allCustomizeColumns;
    return allCustomizeColumns.filter(c => c.label.toLowerCase().includes(colSearchQuery.toLowerCase()));
  }, [allCustomizeColumns, colSearchQuery]);

  // Column Visibility Control (8 Primary Columns default, optional columns opt-in)
  const [visibleColumns, setVisibleColumns] = useState({
    candidate: true,
    source: true,
    jobLink: true,
    status: true,
    score: true,
    duplicate: true,
    uploaded: true,
    actions: true,
    phone: false,
    email: false,
    experience: false,
    skills: false
  });

  // Modals & Drawer State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalTab, setAddModalTab] = useState('single_upload'); // single_upload | bulk_upload | email_import
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [selectedResumeForJob, setSelectedResumeForJob] = useState(null);
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [selectedResumeForScreen, setSelectedResumeForScreen] = useState(null);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedResumeForDuplicate, setSelectedResumeForDuplicate] = useState(null);

  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedResumeForDrawer, setSelectedResumeForDrawer] = useState(null);
  const [selectedResumeForPage, setSelectedResumeForPage] = useState(null);

  const { extraCrumbs, setExtraCrumbs, clearExtraCrumbs } = useBreadcrumb();

  useEffect(() => {
    if (selectedResumeForPage) {
      const candidateLabel = selectedResumeForPage.candidateName
        ? `${selectedResumeForPage.id || 'RES'} (${selectedResumeForPage.candidateName})`
        : (selectedResumeForPage.id || 'Candidate Details');
      setExtraCrumbs([{ label: candidateLabel }]);
    } else if (showDetailDrawer && selectedResumeForDrawer) {
      const candidateLabel = selectedResumeForDrawer.candidateName
        ? `${selectedResumeForDrawer.id} (${selectedResumeForDrawer.candidateName})`
        : selectedResumeForDrawer.id;
      setExtraCrumbs([{ label: candidateLabel }]);
    } else if (activeTab === 'repository') {
      setExtraCrumbs([{ label: 'Repository' }]);
    } else {
      clearExtraCrumbs();
    }
  }, [selectedResumeForPage, showDetailDrawer, selectedResumeForDrawer, activeTab]);

  useEffect(() => {
    if (extraCrumbs.length === 0) {
      if (selectedResumeForPage) {
        setSelectedResumeForPage(null);
      }
      if (showDetailDrawer) {
        setShowDetailDrawer(false);
        setSelectedResumeForDrawer(null);
      }
    }
  }, [extraCrumbs]);

  // KPI Graph Analytics Modal State
  const [activeKpiGraphModal, setActiveKpiGraphModal] = useState(null);

  const openKpiGraphModal = (kpiKey) => {
    let records = accessibleResumes;
    let label = 'Total Resume Intake Repository';
    if (kpiKey === 'newToday') {
      label = 'New Today Ingestion';
      records = accessibleResumes.filter(r => r.processingStatus === 'New Ingestion' || new Date(r.uploadedAt).toDateString() === new Date().toDateString());
    } else if (kpiKey === 'processing') {
      label = 'Parsing & Processing Queue';
      records = accessibleResumes.filter(r => r.processingStatus === 'Processing' || r.processingStatus === 'Parsing Queue');
    } else if (kpiKey === 'duplicates') {
      label = 'Duplicate Candidate Guard';
      records = accessibleResumes.filter(r => r.isDuplicate || r.processingStatus === 'Duplicate Review');
    } else if (kpiKey === 'shortlisted') {
      label = 'Shortlisted Candidates Pipeline';
      records = accessibleResumes.filter(r => r.processingStatus === 'Shortlisted' || r.processingStatus === 'Interview Scheduled');
    } else if (kpiKey === 'pendingScreening') {
      label = 'Pending Screening Workload';
      records = accessibleResumes.filter(r => r.screeningScore === null);
    } else if (kpiKey === 'screened') {
      label = 'Screening Completion & Scores';
      records = accessibleResumes.filter(r => r.screeningScore !== null || r.processingStatus === 'Screened');
    }
    setActiveKpiGraphModal({ kpiId: kpiKey, label, records });
  };

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close floating menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
      if (customizeMenuRef.current && !customizeMenuRef.current.contains(e.target)) {
        setShowCustomizeMenu(false);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // RBAC Permission Guards based on Persona
  const canUpload = selectedPersona === 'recruiter' || selectedPersona === 'admin';
  const canScreen = selectedPersona === 'recruiter' || selectedPersona === 'admin';
  const canResolveDuplicates = selectedPersona === 'recruiter' || selectedPersona === 'admin';
  const canAssignRequisition = selectedPersona === 'recruiter' || selectedPersona === 'admin';
  const canDeleteRecords = selectedPersona === 'admin';

  // Role-filtered Resumes (Hiring Manager sees assigned requisitions & screened candidate pipeline)
  const accessibleResumes = useMemo(() => {
    if (selectedPersona === 'hiring_manager') {
      return resumes.filter(r => 
        !r.requisitionId || 
        r.requisitionId === 'REQ-2026-0001' || 
        r.requisitionId === 'REQ-2026-0002' ||
        r.requisitionTitle?.toLowerCase().includes('react') || 
        r.requisitionTitle?.toLowerCase().includes('testing') || 
        r.requisitionTitle?.toLowerCase().includes('developer') || 
        r.processingStatus === 'Screened' ||
        r.processingStatus === 'Shortlisted' ||
        r.screeningScore !== null
      );
    }
    return resumes;
  }, [resumes, selectedPersona]);

  // KPI Statistics matching Requisition / JD Hub Card Style (4 High-Priority KPIs)
  const kpis = useMemo(() => {
    const total = accessibleResumes.length;
    const screened = accessibleResumes.filter(r => r.screeningScore !== null || r.processingStatus === 'Screened').length;
    const shortlisted = accessibleResumes.filter(r => r.processingStatus === 'Shortlisted' || r.processingStatus === 'Interview Scheduled').length;
    const duplicates = accessibleResumes.filter(r => r.isDuplicate || r.processingStatus === 'Duplicate Review' || r.duplicateStatus === 'Potential Duplicate').length;

    return { total, screened, shortlisted, duplicates };
  }, [accessibleResumes]);

  // Tab Filtering & Search Logic
  const filteredResumes = useMemo(() => {
    return accessibleResumes.filter(r => {
      // Main Tab Filter
      if (activeTab === 'processing' && r.processingStatus !== 'Processing' && r.processingStatus !== 'Uploaded') return false;
      if (activeTab === 'review' && r.processingStatus !== 'Needs Review' && r.screeningOutcome !== 'Manual Review Required') return false;
      if (activeTab === 'duplicates' && !r.isDuplicate && r.processingStatus !== 'Duplicate Review') return false;
      if (activeTab === 'screening' && r.screeningScore === null) return false;

      // Dropdown Filters
      if (selectedSource !== 'All' && r.source !== selectedSource) return false;
      if (selectedReqFilter !== 'All' && r.requisitionId !== selectedReqFilter) return false;

      if (selectedStatusFilter !== 'All') {
        if (selectedStatusFilter === 'Processing' && r.processingStatus !== 'Processing' && r.processingStatus !== 'Uploaded') return false;
        if (selectedStatusFilter === 'Needs Review' && r.processingStatus !== 'Needs Review') return false;
        if (selectedStatusFilter === 'Screened' && r.processingStatus !== 'Screened' && r.screeningScore === null) return false;
        if (selectedStatusFilter === 'Duplicate Review' && !r.isDuplicate && r.processingStatus !== 'Duplicate Review') return false;
        if (selectedStatusFilter === 'Associated' && !r.requisitionId) return false;
        if (selectedStatusFilter === 'Unassigned' && r.requisitionId) return false;
      }

      if (selectedOutcomeFilter !== 'All') {
        if (selectedOutcomeFilter === 'Not Screened' && r.screeningScore !== null) return false;
        if (selectedOutcomeFilter === 'Strong Match' && r.screeningOutcome !== 'Strong Match') return false;
        if (selectedOutcomeFilter === 'Good Match' && r.screeningOutcome !== 'Good Match') return false;
        if (selectedOutcomeFilter === 'Partial Match' && r.screeningOutcome !== 'Partial Match') return false;
        if (selectedOutcomeFilter === 'Low Match' && r.screeningOutcome !== 'Low Match') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.candidateName?.toLowerCase().includes(q);
        const matchEmail = r.email?.toLowerCase().includes(q);
        const matchPhone = r.phone?.toLowerCase().includes(q);
        const matchReq = r.requisitionId?.toLowerCase().includes(q) || r.requisitionTitle?.toLowerCase().includes(q);
        const matchJd = r.jdTitle?.toLowerCase().includes(q);
        const matchSkills = r.skills?.some(s => s.toLowerCase().includes(q));
        if (!matchName && !matchEmail && !matchPhone && !matchReq && !matchJd && !matchSkills) return false;
      }

      return true;
    });
  }, [accessibleResumes, activeTab, selectedSource, selectedReqFilter, selectedOutcomeFilter, searchQuery]);

  // Handlers for Save Operations
  const handleSaveNewResumes = (newResumesList) => {
    setResumes(prev => [...newResumesList, ...prev]);
    triggerToast(`Ingested and processed ${newResumesList.length} candidate resume(s).`);
  };

  const handleSaveScreeningResult = (resumeId, screeningData) => {
    setResumes(prev => prev.map(r => {
      if (r.id === resumeId) {
        return {
          ...r,
          requisitionId: screeningData.requisitionId,
          requisitionTitle: screeningData.requisitionTitle,
          jdId: screeningData.jdId,
          jdTitle: screeningData.jdTitle,
          screeningScore: screeningData.screeningScore,
          screeningOutcome: screeningData.screeningOutcome,
          screeningBreakdown: screeningData.screeningBreakdown,
          processingStatus: 'Screened',
          auditTrail: [
            { id: Date.now(), action: 'Screening Completed', actor: 'Recruiter', role: selectedPersona, timestamp: new Date().toISOString(), details: `Generated ${screeningData.screeningScore}% score against ${screeningData.jdTitle}` },
            ...(r.auditTrail || [])
          ]
        };
      }
      return r;
    }));
    triggerToast('Screening match evaluation saved successfully.');
  };

  const handleShortlistCandidate = (resumeId) => {
    setResumes(prev => prev.map(r => {
      if (r.id === resumeId) {
        const updated = {
          ...r,
          processingStatus: 'Shortlisted',
          auditTrail: [
            { id: Date.now(), action: 'Candidate Shortlisted', actor: 'Recruiter', role: selectedPersona, timestamp: new Date().toISOString(), details: 'Recruiter reviewed and qualified candidate for Hiring Manager evaluation' },
            ...(r.auditTrail || [])
          ]
        };
        if (selectedResumeForDrawer?.id === resumeId) {
          setSelectedResumeForDrawer(updated);
        }
        syncCandidateToDatabase(updated, 'Shortlisted');
        return updated;
      }
      return r;
    }));
    triggerToast('Candidate marked as Shortlisted for Technical Review');
  };

  const handleRecommendInterviewCandidate = async (resumeId, notes = '') => {
    let targetResume = null;
    setResumes(prev => prev.map(r => {
      if (r.id === resumeId) {
        targetResume = r;
        const updated = {
          ...r,
          processingStatus: 'HM Recommended',
          interviewStage: 'Ready for Scheduling',
          hmReviewNotes: notes || 'Recommended for Technical Interview by Hiring Manager.',
          auditTrail: [
            { id: Date.now(), action: 'Recommended for Interview', actor: 'Hiring Manager', role: selectedPersona, timestamp: new Date().toISOString(), details: `Candidate recommended for Technical Assessment. Notes: ${notes || 'Recommended for Interview'}` },
            ...(r.auditTrail || [])
          ]
        };
        if (selectedResumeForDrawer?.id === resumeId) {
          setSelectedResumeForDrawer(updated);
        }
        syncCandidateToDatabase(updated, 'Shortlisted');
        return updated;
      }
      return r;
    }));

    // Trigger Notification for Recruiter
    try {
      if (targetResume) {
        await DatabaseService.createNotification(
          'Interview Scheduling Requested',
          `Hiring Manager recommended ${targetResume.candidateName} for ${targetResume.requisitionTitle || 'Requisition'}. Please schedule interview.`,
          'recruiter',
          targetResume.id
        );
      }
    } catch (e) {
      console.warn('Could not dispatch HM recommendation notification', e);
    }

    triggerToast('Candidate recommended for interview! Notification sent to Recruiter to schedule interview slot.');
  };

  const handleRejectCandidateHM = (resumeId, notes = '') => {
    setResumes(prev => prev.map(r => {
      if (r.id === resumeId) {
        const updated = {
          ...r,
          processingStatus: 'Rejected',
          hmReviewNotes: notes || 'Candidate marked as Not a Fit by Hiring Manager.',
          auditTrail: [
            { id: Date.now(), action: 'Candidate Rejected', actor: 'Hiring Manager', role: selectedPersona, timestamp: new Date().toISOString(), details: `Marked as Not a Fit. Notes: ${notes || 'Not a fit for this position'}` },
            ...(r.auditTrail || [])
          ]
        };
        if (selectedResumeForDrawer?.id === resumeId) {
          setSelectedResumeForDrawer(updated);
        }
        syncCandidateToDatabase(updated, 'Rejected');
        return updated;
      }
      return r;
    }));
    triggerToast('Candidate marked as Not a Fit.');
  };

  const handleResolveDuplicate = (resumeId, actionType) => {
    setResumes(prev => prev.map(r => {
      if (r.id === resumeId) {
        let newStatus = 'Assigned';
        if (actionType === 'use_existing') newStatus = 'Screened';
        if (actionType === 'update_existing') newStatus = 'Processing';
        if (actionType === 'keep_version') newStatus = 'Assigned';

        return {
          ...r,
          isDuplicate: false,
          processingStatus: newStatus,
          auditTrail: [
            { id: Date.now(), action: `Duplicate Resolved (${actionType})`, actor: 'Recruiter', role: selectedPersona, timestamp: new Date().toISOString(), details: `Resolved duplicate signal using choice: ${actionType}` },
            ...(r.auditTrail || [])
          ]
        };
      }
      return r;
    }));
    setShowDuplicateModal(false);
    triggerToast('Duplicate candidate resolution applied.');
  };

  const handleAssignToJob = (resumeId, reqId, reqTitle) => {
    setResumes(prev => prev.map(r => {
      if (r.id === resumeId) {
        return {
          ...r,
          requisitionId: reqId,
          requisitionTitle: reqTitle,
          auditTrail: [
            { id: Date.now(), action: 'Requisition Assigned', actor: 'Recruiter', role: selectedPersona, timestamp: new Date().toISOString(), details: `Re-assigned candidate to ${reqId}: ${reqTitle}` },
            ...(r.auditTrail || [])
          ]
        };
      }
      return r;
    }));
    setShowAddJobModal(false);
    triggerToast(`Candidate assigned to ${reqId} successfully.`);
  };

  // Delete state
  const [bulkDeletingResumes, setBulkDeletingResumes] = useState(null);
  const [deletingResume, setDeletingResume] = useState(null);

  const handleDeleteResume = (resume) => {
    setDeletingResume(resume);
  };

  const handleConfirmSingleDeleteResume = () => {
    if (!deletingResume) return;
    setResumes(prev => prev.filter(r => r.id !== deletingResume.id));
    setSelectedResumeIds(prev => prev.filter(id => id !== deletingResume.id));
    setDeletingResume(null);
    triggerToast(`Candidate resume removed from repository.`);
  };

  const handleConfirmBulkDeleteResumes = () => {
    if (!bulkDeletingResumes || bulkDeletingResumes.length === 0) return;
    const ids = bulkDeletingResumes.map(r => r.id);
    setResumes(prev => prev.filter(r => !ids.includes(r.id)));
    setSelectedResumeIds([]);
    setBulkDeletingResumes(null);
    triggerToast(`Deleted ${ids.length} candidate resume(s) successfully.`);
  };

  // Toggle All Checkboxes
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedResumeIds(filteredResumes.map(r => r.id));
    } else {
      setSelectedResumeIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedResumeIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // ── Full-page Candidate / Resume Detail View — replaces repository when a candidate is selected ──
  if (selectedResumeForPage) {
    const freshResume = resumes.find(r => r.id === selectedResumeForPage.id) || selectedResumeForPage;
    return (
      <div className="w-full max-w-[1600px] mx-auto pb-16 animate-fade-in" dir="ltr">
        <ResumeDetailPage
          resume={freshResume}
          onBack={() => setSelectedResumeForPage(null)}
          userRole={selectedPersona}
          requisitions={requisitions}
          jds={jds}
          onAction={(actionType, resData) => {
            if (actionType === 'shortlist') {
              handleShortlistCandidate(resData.id);
            } else if (actionType === 'tech_review') {
              if (resData.processingStatus === 'HM Recommended' || resData.processingStatus === 'Shortlisted') {
                handleRecommendInterviewCandidate(resData.id, resData.hmReviewNotes);
              } else if (resData.processingStatus === 'Rejected') {
                handleRejectCandidateHM(resData.id, resData.hmReviewNotes);
              } else {
                setResumes(prev => prev.map(r => r.id === resData.id ? { ...r, ...resData } : r));
                syncCandidateToDatabase(resData, resData.processingStatus);
                triggerToast('Hiring Manager technical evaluation saved successfully!');
              }
            } else if (actionType === 'schedule_interview' || actionType === 'recommend_interview') {
              handleRecommendInterviewCandidate(resData.id, resData.hmReviewNotes);
            } else if (actionType === 'screen_again') {
              setSelectedResumeForScreen(resData);
              setShowScreenModal(true);
            } else if (actionType === 'assign_req') {
              setSelectedResumeForJob(resData);
              setShowAddJobModal(true);
            } else if (actionType === 'resolve_dup') {
              setSelectedResumeForDuplicate(resData);
              setShowDuplicateModal(true);
            }
          }}
        />

        <ScreenExistingResumeModal
          isOpen={showScreenModal}
          onClose={() => setShowScreenModal(false)}
          resume={selectedResumeForScreen}
          requisitions={requisitions}
          jds={jds}
          onSaveScreening={handleSaveScreeningResult}
        />

        <AddResumeToJobModal
          isOpen={showAddJobModal}
          onClose={() => setShowAddJobModal(false)}
          resume={selectedResumeForJob}
          requisitions={requisitions}
          jds={jds}
          onAssign={handleAssignToJob}
        />

        <DuplicateResolutionModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          resume={selectedResumeForDuplicate}
          onResolveDuplicate={handleResolveDuplicate}
        />
      </div>
    );
  }

  return (
    <div className="w-full pb-16 font-sans text-start animate-fade-in" dir="ltr">
      {/* 1. Header Banner matching JDRepository style with embedded SIMULATE PERSONA dropdown */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 p-4.5 mb-4.5 shadow-[0_8px_30px_rgba(26,86,219,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Title & Live Operational Tag */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl text-white shadow-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <FileUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Resume Intake Repository
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Operational
                </span>
              </div>
              <p className="text-xs text-slate-500/90 dark:text-slate-400 mt-0.5">
                Enterprise Resume Ingestion, Duplicate Guard &amp; Screening Engine
              </p>
            </div>
          </div>

          {/* Right: Integrated Persona Simulator Dropdown, Primary + Add Resume ▾ Dropdown & Secondary CTA */}
          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-between md:justify-end">
            {/* SIMULATE PERSONA */}
            <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider shrink-0">SIMULATE PERSONA:</span>
              <CustomSelect 
                value={selectedPersona} 
                onChange={(val) => setSelectedPersona(val)}
                options={INTAKE_PERSONAS.map(p => ({ label: p.label, value: p.id }))}
                size="sm"
                className="w-56"
                buttonClassName="border-0 bg-transparent shadow-none hover:bg-transparent font-bold text-xs"
              />
            </div>

            {/* Direct + Add Resume CTA */}
            {canUpload && (
              <button
                type="button"
                onClick={() => {
                  setAddModalTab('single_upload');
                  setShowAddModal(true);
                }}
                style={{ backgroundColor: brandColor }}
                className="h-9 px-4.5 text-xs font-extrabold text-white shadow-md hover:brightness-110 rounded-xl border border-white/20 flex items-center gap-2 shrink-0 cursor-pointer transition-all"
                title={!canUpload ? "Uploading resumes requires Recruiter or ATS Admin persona" : "Upload candidate resumes to ATS repository"}
              >
                <FileUp className="w-4 h-4" />
                <span>+ Add Resume</span>
              </button>
            )}

            {/* Secondary Screening Assessment Button */}
            {(() => {
              const selectedCount = selectedResumeIds.length;
              const isSingleSelected = selectedCount === 1;
              const isMultipleSelected = selectedCount > 1;

              let tooltipText = "Select a candidate to run screening assessment.";
              if (!canScreen) {
                tooltipText = "Screening requires Recruiter or ATS Admin persona";
              } else if (isSingleSelected) {
                tooltipText = "Run screening assessment for selected candidate";
              } else if (isMultipleSelected) {
                tooltipText = "Individual screening is available for one candidate at a time.";
              }

              const isButtonDisabled = !canScreen || selectedCount !== 1;

              const handleScreenClick = () => {
                if (isSingleSelected && canScreen) {
                  const selectedResume = resumes.find(r => r.id === selectedResumeIds[0]);
                  if (selectedResume) {
                    setSelectedResumeForScreen(selectedResume);
                    setShowScreenModal(true);
                  }
                }
              };

              return (
                <button
                  type="button"
                  onClick={handleScreenClick}
                  disabled={isButtonDisabled}
                  title={tooltipText}
                  style={isSingleSelected && canScreen ? { backgroundColor: brandColor } : {}}
                  className={`h-9 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs shrink-0 ${
                    isSingleSelected && canScreen
                      ? 'text-white shadow-md hover:brightness-110 cursor-pointer'
                      : 'text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 cursor-not-allowed opacity-60'
                  }`}
                >
                  <FileSearch className={`w-4 h-4 ${isSingleSelected && canScreen ? 'text-white' : 'text-slate-400'}`} />
                  <span>
                    {selectedCount > 0 ? `Screen Assessment (${selectedCount})` : 'Screening Assessment'}
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 4 FROSTED GLASS KPI STATS CARDS (Matching JDRepository & RequisitionHub) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {[
          { 
            id: 'all', 
            label: 'TOTAL RESUMES', 
            value: kpis.total, 
            subtitle: 'All candidate resumes in repository', 
            icon: <FileUp className="w-4 h-4" style={{ color: brandColor }} />, 
            iconBg: 'bg-slate-100/80 dark:bg-slate-800/80', 
            trend: '+5%', 
            trendUp: true, 
            actionText: 'View All →', 
            updatedAt: 'Just now' 
          },
          { 
            id: 'screened', 
            label: 'AI SCREENED', 
            value: kpis.screened, 
            subtitle: 'Evaluated against active JDs', 
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, 
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/60', 
            trend: '+12%', 
            trendUp: true, 
            actionText: 'View Screened →', 
            updatedAt: '1h ago' 
          },
          { 
            id: 'shortlisted', 
            label: 'SHORTLISTED ⭐', 
            value: kpis.shortlisted, 
            subtitle: 'Qualified for HM technical review', 
            icon: <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />, 
            iconBg: 'bg-purple-50 dark:bg-purple-950/60', 
            trend: 'Action', 
            trendUp: false, 
            actionText: 'Review Queue →', 
            updatedAt: '5m ago' 
          },
          { 
            id: 'duplicates', 
            label: 'DUPLICATE GUARD', 
            value: kpis.duplicates, 
            subtitle: 'Potential duplicate candidate found', 
            icon: <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />, 
            iconBg: 'bg-red-50 dark:bg-red-950/60', 
            trend: 'Review', 
            trendUp: false, 
            actionText: 'Review Duplicates →', 
            updatedAt: 'Today' 
          }
        ].map((stat, idx) => {
          return (
            <motion.div 
              key={stat.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 + 0.1 }}
              whileHover={{ y: -3 }}
              onClick={() => {
                if (stat.id === 'duplicates') {
                  const dup = accessibleResumes.find(r => r.isDuplicate || r.processingStatus === 'Duplicate Review');
                  if (dup) {
                    setSelectedResumeForDuplicate(dup);
                    setShowDuplicateModal(true);
                  } else {
                    setActiveTab('duplicates');
                  }
                } else if (stat.id === 'shortlisted') {
                  setSelectedStatusFilter('Shortlisted');
                } else if (stat.id === 'screened') {
                  setActiveTab('screening');
                } else {
                  setActiveTab('repository');
                }
                openKpiGraphModal(stat.id);
              }}
              className="px-3.5 py-2.5 rounded-xl border transition-all duration-300 ease-out cursor-pointer relative overflow-hidden group flex flex-col justify-between bg-gradient-to-br from-white/85 to-blue-50/25 dark:from-slate-900/80 dark:to-blue-950/20 backdrop-blur-md border-blue-100/60 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700/80 hover:shadow-md hover:bg-gradient-to-br hover:from-white hover:via-blue-50/40 hover:to-blue-50/10 dark:hover:from-slate-900 dark:hover:via-blue-950/30 dark:hover:to-slate-900 shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans">
                    {stat.label}
                  </span>
                  <div className={`p-1 rounded-lg border border-slate-200 dark:border-slate-700 ${stat.iconBg}`}>
                    {stat.icon}
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xl font-extrabold text-[#0F172A] dark:text-white tracking-tight font-sans">
                    {stat.value}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${
                    stat.trendUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    <ArrowUpRight size={9} /> {stat.trend}
                  </span>
                </div>

                {stat.subtitle && (
                  <p className="text-[11px] font-medium text-[#475569] dark:text-slate-400 mb-1.5 truncate">
                    {stat.subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-medium text-[#64748B] dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800 transition-colors">
                <span className="text-[10px] font-mono text-[#64748B]">{stat.updatedAt}</span>
                <span className="font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform" style={{ color: brandColor }}>
                  {stat.actionText} 📊
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 5. UNIFIED WORKSPACE CANVAS (TABS + COMMAND SEARCH + FILTERS + EXPORT) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs font-sans space-y-0 relative z-30">
        
        {/* CANVAS TOOLBAR: LEVEL 1 TABS + RESET | LEVEL 2 SEARCH + CUSTOM SELECT FILTERS */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 relative z-20">
          
          {/* Level 1: Segmented Pill Preset Navigation Tabs + Reset Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Segmented Pill Tabs Bar */}
            <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: 'all', label: 'All Resumes', count: kpis.total },
                { id: 'processing', label: 'Processing', count: kpis.pendingProcessing },
                { id: 'review', label: 'Needs Review', count: kpis.duplicates },
                { id: 'duplicates', label: 'Duplicates', count: kpis.duplicates },
                { id: 'screening', label: 'Screened', count: kpis.screened },
                { id: 'repository', label: 'Repository', count: kpis.total }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={isActive ? {
                      backgroundColor: brandColor,
                      boxShadow: `0 2px 10px ${brandColor}44`
                    } : {}}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive 
                        ? 'text-white shadow-2xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span 
                      className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reset Filters Button */}
            <button 
              type="button"
              onClick={() => { 
                setSelectedSource('All'); 
                setSelectedReqFilter('All'); 
                setSelectedStatusFilter('All');
                setSelectedOutcomeFilter('All'); 
                setActiveTab('all'); 
                setSearchQuery(''); 
              }}
              className="h-8 px-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 shrink-0 transition-all shadow-2xs cursor-pointer group"
            >
              <RefreshCw size={12} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
              <span>Reset Filters</span>
            </button>
          </div>

          {/* Level 2: Command Search + CustomSelect Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
            {/* Command Search Field */}
            <ModernSearchInput 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search candidates, skills, REQs..."
              className="max-w-md"
            />

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 w-full sm:w-auto">
              <CustomSelect 
                prefix="Source: "
                value={selectedSource} 
                onChange={setSelectedSource}
                options={['All', ...ALL_INTAKE_SOURCES]}
                size="sm"
                className="w-40"
              />

              <CustomSelect 
                prefix="Requisition: "
                value={selectedReqFilter} 
                onChange={setSelectedReqFilter}
                options={['All', ...requisitions.map(r => r.id)]}
                size="sm"
                className="w-44"
              />

              <CustomSelect 
                prefix="Status: "
                value={selectedStatusFilter} 
                onChange={setSelectedStatusFilter}
                options={['All', 'Processing', 'Needs Review', 'Screened', 'Duplicate Review', 'Associated', 'Unassigned']}
                size="sm"
                className="w-40"
              />

              <CustomSelect 
                prefix="Screening: "
                value={selectedOutcomeFilter} 
                onChange={setSelectedOutcomeFilter}
                options={['All', 'Not Screened', 'Strong Match', 'Good Match', 'Partial Match', 'Low Match']}
                size="sm"
                className="w-40"
              />
            </div>
          </div>
        </div>

      {/* 7. Enterprise Resume Repository Data Table Frame */}
      <div className="bg-white dark:bg-[#0f111a] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative z-10">
        
        {/* Table Data Grid Header Strip (Matching Requisition Hub) */}
        <div className="p-3 sm:px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 relative z-30 rounded-t-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
              Candidate Resumes Data Grid
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold font-mono text-slate-500 bg-slate-200/70 dark:bg-slate-800 rounded-full">
              {filteredResumes.length} Records
            </span>

            {selectedResumeIds.length > 0 && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {selectedResumeIds.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const selected = filteredResumes.filter(r => selectedResumeIds.includes(r.id));
                    setBulkDeletingResumes(selected);
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Trash2 size={12} />
                  <span>{selectedResumeIds.length > 1 ? `Delete All (${selectedResumeIds.length})` : 'Delete'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Export Button */}
            <button
              type="button"
              onClick={() => {
                const dataToExport = selectedResumeIds.length > 0 
                  ? filteredResumes.filter(r => selectedResumeIds.includes(r.id)) 
                  : filteredResumes;

                const csvContent = "data:text/csv;charset=utf-8," 
                  + ["ID,Candidate Name,Email,Phone,Intake Source,Requisition ID,Job Title,Processing Status,Screening Score,Duplicate Status,Uploaded Date"].join(",") + "\n"
                  + dataToExport.map(r => 
                      `${r.id},"${r.candidateName}",${r.email},"${r.phone}",${r.source},${r.requisitionId || 'Unassigned'},"${r.requisitionTitle || 'Unassigned'}",${r.processingStatus},${r.screeningScore !== null ? r.screeningScore + '%' : 'Unscreened'},${r.isDuplicate ? 'Duplicate' : 'Unique'},${new Date(r.uploadedAt).toISOString().split('T')[0]}`
                    ).join("\n");

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `candidate_resumes_report_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                triggerToast(`Exported ${dataToExport.length} candidate record(s) to CSV.`);
              }}
              title={selectedResumeIds.length > 0 ? `Export ${selectedResumeIds.length} Selected Resumes` : "Export CSV"}
              style={selectedResumeIds.length > 0 ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
              className={`h-8 px-3 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs font-sans cursor-pointer shrink-0 rounded-xl border ${
                selectedResumeIds.length > 0 
                  ? 'text-white shadow-md' 
                  : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Download size={13} className={selectedResumeIds.length > 0 ? 'text-white' : 'text-blue-500 group-hover:text-blue-600 transition-colors'} />
              <span>{selectedResumeIds.length > 0 ? `Export (${selectedResumeIds.length})` : 'Export'}</span>
            </button>

            {/* Customize View Column Toggler Button */}
            <div className="relative" ref={customizeMenuRef}>
              <button
                type="button"
                onClick={() => setShowCustomizeMenu(!showCustomizeMenu)}
                className="h-8 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
              >
                <SlidersHorizontal size={13} className="text-slate-500" />
                <span>Customize View</span>
              </button>

              {typeof document !== 'undefined' && showCustomizeMenu && createPortal(
                <div 
                  data-portal-resume-customize="true"
                  style={customizeMenuStyle}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 isolate animate-fade-in text-left font-sans space-y-2.5"
                >
                  {/* Header: Title + Reset */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Customize Columns</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setVisibleColumns({
                          candidate: true, source: true, jobLink: true, status: true, score: true, duplicate: true, uploaded: true, actions: true, phone: false, email: false, experience: false, skills: false
                        });
                        setColSearchQuery('');
                      }} 
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Search Columns Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search columns..." 
                      value={colSearchQuery}
                      onChange={(e) => setColSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Columns List with Modern Micro Toggle Switches */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1.5 scrollbar-thin pb-1">
                    {filteredColumnsList.map(col => {
                      const isChecked = visibleColumns[col.key];
                      return (
                        <div
                          key={col.key}
                          className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left group"
                        >
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                            {col.label}
                          </span>
                          
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            disabled={col.required}
                            onClick={() => !col.required && setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                            style={isChecked ? { backgroundColor: brandColor } : {}}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              col.required ? 'opacity-60 cursor-not-allowed' : ''
                            } ${!isChecked ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
                            role="switch"
                            aria-checked={isChecked}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                isChecked ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto rounded-b-2xl">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center sticky left-0 z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap">
                  <input 
                    type="checkbox"
                    checked={filteredResumes.length > 0 && selectedResumeIds.length === filteredResumes.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-brand focus:ring-brand"
                  />
                </th>
                {visibleColumns.candidate && <th className="py-3.5 px-4 text-left whitespace-nowrap">Candidate & Resume File</th>}
                {visibleColumns.phone && <th className="py-3.5 px-4 text-center whitespace-nowrap">Phone Number</th>}
                {visibleColumns.email && <th className="py-3.5 px-4 text-left whitespace-nowrap">Email Address</th>}
                {visibleColumns.source && <th className="py-3.5 px-4 text-center whitespace-nowrap">Intake Source</th>}
                {visibleColumns.jobLink && <th className="py-3.5 px-4 text-left whitespace-nowrap">Requisition & Job Link</th>}
                {visibleColumns.status && <th className="py-3.5 px-4 text-center whitespace-nowrap">Processing Status</th>}
                {visibleColumns.score && <th className="py-3.5 px-4 text-center whitespace-nowrap">Screening Score</th>}
                {visibleColumns.duplicate && <th className="py-3.5 px-4 text-center whitespace-nowrap">Duplicate Status</th>}
                {visibleColumns.experience && <th className="py-3.5 px-4 text-center whitespace-nowrap">Experience</th>}
                {visibleColumns.skills && <th className="py-3.5 px-4 text-left whitespace-nowrap">Skills</th>}
                {visibleColumns.uploaded && <th className="py-3.5 px-4 text-center whitespace-nowrap">Uploaded Date</th>}
                {visibleColumns.actions && (
                  <th className="py-3.5 px-4 text-center sticky right-0 z-30 bg-slate-50 dark:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800/60 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredResumes.length > 0 ? (
                filteredResumes.map((resume) => {
                  const isSelectedRow = selectedResumeIds.includes(resume.id);
                  return (
                    <tr 
                      key={resume.id}
                      className={`group transition-colors cursor-pointer ${
                        isSelectedRow ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
                      }`}
                      onClick={() => {
                        setSelectedResumeForPage(resume);
                      }}
                    >
                      {/* Checkbox */}
                      <td 
                        className={`py-3.5 px-4 text-center sticky left-0 z-20 border-r border-slate-200/60 dark:border-slate-800/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] transition-colors whitespace-nowrap ${
                          isSelectedRow 
                            ? 'bg-[#F0F9FF] dark:bg-[#131f37]' 
                            : 'bg-white dark:bg-[#0f111a] group-hover:bg-slate-50 dark:group-hover:bg-slate-800'
                        }`} 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input 
                          type="checkbox"
                          checked={isSelectedRow}
                          onChange={() => handleSelectOne(resume.id)}
                          className="rounded border-slate-300 text-brand focus:ring-brand"
                        />
                      </td>

                      {/* Candidate / File */}
                      {visibleColumns.candidate && (
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0">
                              {resume.candidateName?.split(' ').map(n => n[0]).join('') || 'C'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate hover:text-brand">{resume.candidateName}</p>
                              <p className="text-[11px] text-slate-400 truncate">{resume.fileName} ({resume.fileSize})</p>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Phone */}
                      {visibleColumns.phone && (
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {resume.phone || '—'}
                        </td>
                      )}

                      {/* Email */}
                      {visibleColumns.email && (
                        <td className="py-3.5 px-4 text-left font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {resume.email}
                        </td>
                      )}

                      {/* Source */}
                      {visibleColumns.source && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                            {resume.source}
                          </span>
                        </td>
                      )}

                      {/* Job Link */}
                      {visibleColumns.jobLink && (
                        <td className="py-3.5 px-4 text-left whitespace-nowrap">
                          {(resume.requisitionTitle || resume.linkedJobTitle) ? (
                            <div className="min-w-[150px]">
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {resume.requisitionTitle || resume.linkedJobTitle}
                              </div>
                              <span className="text-[10px] font-mono text-brand font-medium">
                                {resume.requisitionId || resume.linkedReqId}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="text-xs text-slate-400 italic">Unassigned</span>
                              {canScreen && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedResumeForScreen(resume);
                                    setShowScreenModal(true);
                                  }}
                                  className="text-[11px] text-brand font-bold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                                  title="Assign to active Requisition"
                                >
                                  <Link className="w-3 h-3" />
                                  <span>Assign</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Processing Status Badge */}
                      {visibleColumns.status && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex justify-center whitespace-nowrap">
                            <ModernStatusBadge status={resume.processingStatus} />
                          </div>
                        </td>
                      )}

                      {/* Screening Score */}
                      {visibleColumns.score && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {resume.screeningScore !== null ? (
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-black text-white shrink-0 ${
                                resume.screeningScore >= 85 ? 'bg-emerald-600' :
                                resume.screeningScore >= 70 ? 'bg-blue-600' :
                                resume.screeningScore >= 50 ? 'bg-amber-600' : 'bg-red-600'
                              }`}>
                                {resume.screeningScore}%
                              </span>
                              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {resume.screeningOutcome}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic whitespace-nowrap">Unscreened</span>
                          )}
                        </td>
                      )}

                      {/* Duplicate Alert */}
                      {visibleColumns.duplicate && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {resume.isDuplicate ? (
                            <div className="flex justify-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedResumeForDuplicate(resume);
                                  setShowDuplicateModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>Duplicate</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center whitespace-nowrap">
                              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Verified</span>
                              </span>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Optional Experience Column */}
                      {visibleColumns.experience && (
                        <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300 font-semibold whitespace-nowrap">
                          {resume.totalExperience || '5+ Years'}
                        </td>
                      )}

                      {/* Optional Skills Column */}
                      {visibleColumns.skills && (
                        <td className="py-3.5 px-4 text-left max-w-xs">
                          {resume.skills ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {resume.skills.slice(0, 2).map((sk, i) => (
                                <span key={i} className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] whitespace-nowrap shrink-0">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          ) : '—'}
                        </td>
                      )}

                      {/* Uploaded Date */}
                      {visibleColumns.uploaded && (
                        <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-xs whitespace-nowrap">
                          {new Date(resume.uploadedAt).toLocaleDateString()}
                        </td>
                      )}

                      {/* Actions Column */}
                      {visibleColumns.actions && (
                        <td 
                          className={`py-3.5 px-4 text-center sticky right-0 z-20 border-l border-slate-200/60 dark:border-slate-800/60 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)] transition-colors whitespace-nowrap ${
                            isSelectedRow 
                              ? 'bg-[#F0F9FF] dark:bg-[#131f37]' 
                              : 'bg-white dark:bg-[#0f111a] group-hover:bg-slate-50 dark:group-hover:bg-slate-800'
                          }`} 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5 relative py-0.5">
                            {/* View Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedResumeForPage(resume);
                              }}
                              className="h-7 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                              title="View Candidate Details"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            {/* Screen Button */}
                            {canScreen && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedResumeForScreen(resume);
                                  setShowScreenModal(true);
                                }}
                                className="h-7 px-2.5 rounded-lg border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/50 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                                title="Run Screening Evaluation"
                              >
                                <FileSearch size={13} />
                                <span>Screen</span>
                              </button>
                            )}

                            {/* More ⋮ Floating Menu Button */}
                            <div className="relative" ref={activeMenuId === resume.id ? menuRef : null}>
                              <button
                                type="button"
                                onClick={() => setActiveMenuId(activeMenuId === resume.id ? null : resume.id)}
                                className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                                title="More Actions"
                              >
                                <MoreVertical size={14} />
                              </button>

                              {/* Floating Actions Menu */}
                              {typeof document !== 'undefined' && activeMenuId === resume.id && createPortal(
                                <div 
                                  data-portal-resume-row-menu="true"
                                  style={rowMenuStyle}
                                  className="bg-white dark:bg-[#0f111a] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-[999999] text-left font-sans animate-fade-in"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setSelectedResumeForPage(resume);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                    <span>View Details</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      alert(`Downloading original resume: ${resume.fileName}`);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Download File</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      if (onNavigate) onNavigate('candidates');
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium cursor-pointer"
                                  >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>View in Candidates</span>
                                  </button>

                                  {canScreen && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setSelectedResumeIds([resume.id]);
                                        setSelectedResumeForScreen(resume);
                                        setShowScreenModal(true);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                    >
                                      <FileSearch className="w-3.5 h-3.5 text-purple-500" />
                                      <span>Run Screening Assessment</span>
                                    </button>
                                  )}

                                  {canAssignRequisition && !resume.requisitionId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setSelectedResumeForScreen(resume);
                                        setShowScreenModal(true);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Link className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Assign to Requisition</span>
                                    </button>
                                  )}

                                  {resume.isDuplicate && canResolveDuplicates && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setSelectedResumeForDuplicate(resume);
                                        setShowDuplicateModal(true);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Review Duplicate</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setSelectedResumeForDrawer(resume);
                                      setShowDetailDrawer(true);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    <History className="w-3.5 h-3.5 text-blue-500" />
                                    <span>View Audit History</span>
                                  </button>

                                  {canDeleteRecords && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handleDeleteResume(resume);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete Candidate</span>
                                      </button>
                                    </div>
                                  )}
                                </div>,
                                document.body
                              )}
                            </div>
                          </div>
                        </td>
                      )}        </tr>
                  );
                })
              ) : (
                /* Enterprise Empty State */
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="py-12 text-center text-slate-400">
                    <Folder className="w-10 h-10 mx-auto mb-3 opacity-40 text-slate-400" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">No Candidate Resumes Found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      No resume records match your active search filters or persona view permissions.
                    </p>
                    {(searchQuery || selectedSource !== 'All' || selectedReqFilter !== 'All') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedSource('All');
                          setSelectedReqFilter('All');
                          setSelectedOutcomeFilter('All');
                        }}
                        className="mt-3 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong>{filteredResumes.length}</strong> of <strong>{accessibleResumes.length}</strong> candidate resumes</span>
          <span className="font-semibold">Page 1 of 1</span>
        </div>
      </div>
    </div>

      {/* Modals & Drawer */}
      <AddResumeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaveResumes={handleSaveNewResumes}
        requisitions={requisitions}
        jds={jds}
        initialTab={addModalTab}
      />

      <AddResumeToJobModal
        isOpen={showAddJobModal}
        onClose={() => setShowAddJobModal(false)}
        onSaveResumes={handleSaveNewResumes}
        requisitions={requisitions}
        jds={jds}
      />

      <ScreenExistingResumeModal
        isOpen={showScreenModal}
        onClose={() => setShowScreenModal(false)}
        resume={selectedResumeForScreen}
        requisitions={requisitions}
        jds={jds}
        onSaveScreening={handleSaveScreeningResult}
      />

      <DuplicateResolutionModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        resume={selectedResumeForDuplicate}
        onResolveDuplicate={handleResolveDuplicate}
      />

      <ResumeDetailDrawer
        isOpen={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        resume={selectedResumeForDrawer}
        onOpenScreening={(res) => {
          setShowDetailDrawer(false);
          setSelectedResumeForScreen(res);
          setShowScreenModal(true);
        }}
        onOpenDuplicate={(res) => {
          setShowDetailDrawer(false);
          setSelectedResumeForDuplicate(res);
          setShowDuplicateModal(true);
        }}
        onShortlist={handleShortlistCandidate}
        onRecommendInterview={handleRecommendInterviewCandidate}
        onRejectCandidate={handleRejectCandidateHM}
        onScheduleInterview={handleRecommendInterviewCandidate}
        userRole={selectedPersona}
      />

      {/* 10/10 Enterprise KPI Real-Time Analytics System Modal */}
      {activeKpiGraphModal && (
        <EnterpriseKpiAnalyticsModal
          isOpen={!!activeKpiGraphModal}
          onClose={() => setActiveKpiGraphModal(null)}
          kpiId={activeKpiGraphModal.kpiId}
          kpiLabel={activeKpiGraphModal.label}
          kpiValue={activeKpiGraphModal.records?.length || accessibleResumes.length}
          moduleType="intake"
          rawRecords={activeKpiGraphModal.records || accessibleResumes}
        />
      )}

      {/* Single Resume Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingResume}
        onClose={() => setDeletingResume(null)}
        title="Delete Candidate Resume"
        message={`Are you sure you want to delete the resume record for "${deletingResume?.candidateName || 'this candidate'}" (${deletingResume?.fileName || ''})? This action cannot be undone.`}
        confirmText="Delete Resume"
        onConfirm={handleConfirmSingleDeleteResume}
        brandColor={brandColor}
      />

      {/* Bulk Delete Resumes Confirmation Modal */}
      <ConfirmModal
        isOpen={!!bulkDeletingResumes && bulkDeletingResumes.length > 0}
        onClose={() => setBulkDeletingResumes(null)}
        title="Delete Selected Candidate Resumes"
        message={`Are you sure you want to delete ${bulkDeletingResumes?.length || 0} selected resume record(s)? This action cannot be undone.`}
        confirmText={`Delete All (${bulkDeletingResumes?.length || 0})`}
        onConfirm={handleConfirmBulkDeleteResumes}
        brandColor={brandColor}
      />

      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-20 right-6 sm:right-28 z-[999999] max-w-md flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white bg-emerald-600 border border-emerald-400/40 backdrop-blur-md"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 size={13} className="text-white" />
            </div>
            <span className="flex-1 leading-snug">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeIntakeHub;
