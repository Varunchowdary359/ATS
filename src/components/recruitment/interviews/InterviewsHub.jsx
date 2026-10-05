import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, User, Plus, Download, RefreshCw, Eye, 
  RotateCcw, Ban, Clock, Award, Video, CheckCircle2, 
  Settings, Columns, ArrowUpRight, ShieldAlert, Sparkles, ShieldCheck,
  Filter, MoreHorizontal, UserCheck, Mail, ChevronDown, Trash2
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { useToast } from '../../shared/ToastContext';
import { 
  INTERVIEW_ROLES, 
  SESSION_STATUS, 
  FEEDBACK_STATUS,
  ROUND_OUTCOME_DECISION,
  INTERVIEW_TYPE,
  MOCK_PERSONAS,
  hasInterviewPermission,
  INTERVIEW_PERMISSIONS
} from './interviewTypes';
import { interviewService } from './interviewService';
import InterviewCalendarView, { CALENDAR_VIEW_MODES, detectSessionConflicts } from './InterviewCalendarView';
import InterviewCalendarSidebar from './InterviewCalendarSidebar';
import { InterviewerAvailabilityModal } from './InterviewerAvailabilityModal';
import InterviewScheduleModal from './InterviewScheduleModal';
import InterviewSchedulePage from './InterviewSchedulePage';
import InterviewKitModal from './InterviewKitModal';
import RoundOutcomeModal from './RoundOutcomeModal';
import FinalDecisionModal from './FinalDecisionModal';
import InterviewPlansConfigModal from './InterviewPlansConfigModal';
import RescheduleCancelModal from './RescheduleCancelModal';
import InterviewDetailsDrawer from './InterviewDetailsDrawer';
import InterviewPlanBuilderPage from './InterviewPlanBuilderPage';
import InterviewDetailPage from './InterviewDetailPage';
import { CandidateInterviewPortalModal } from './CandidateInterviewPortalModal';
import { InterviewerPolicyGateModal } from './InterviewerPolicyGateModal';
import { INTERVIEWERS_ROSTER } from './interviewMockData';
import ModernSearchInput from '../../dashboard/shared/ModernSearchInput';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import DataTable from '../../dashboard/shared/DataTable';
import EnterpriseKpiAnalyticsModal from '../../dashboard/shared/EnterpriseKpiAnalyticsModal';
import ConfirmModal from '../../admin/shared/ConfirmModal';
import { useBreadcrumb } from '../../shared/BreadcrumbContext';

const InterviewsHub = ({ onNavigate = () => {} }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || 'var(--pw-brand)';
  const { addToast } = useToast();

  // Navigation Sub-view: 'hub' | 'plan-builder' | 'schedule'
  const [currentSubView, setCurrentSubView] = useState('hub');

  // Role Governance & Persona Switcher
  const [currentRole, setCurrentRole] = useState(INTERVIEW_ROLES.RECRUITER);
  const currentPersona = useMemo(() => MOCK_PERSONAS[currentRole] || MOCK_PERSONAS[INTERVIEW_ROLES.RECRUITER], [currentRole]);
  const userRequisitions = useMemo(() => currentPersona.userRequisitions || ['REQ-2026-001', 'REQ-2026-002'], [currentPersona]);

  // Core Data State
  const [sessions, setSessions] = useState([]);
  const [kpiData, setKpiData] = useState({
    todayCount: 0,
    upcomingCount: 0,
    pendingFeedbackCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: 'table' (Default) | 'calendar'
  const [viewMode, setViewMode] = useState('table');

  // Calendar Specific States
  const [calendarScope, setCalendarScope] = useState('team'); // 'my' | 'team'
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState(CALENDAR_VIEW_MODES.WEEK);

  // Role Switcher Handler with sensible default scopes per role
  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    if (newRole === INTERVIEW_ROLES.INTERVIEWER) {
      setCalendarScope('my');
    } else if (newRole === INTERVIEW_ROLES.HIRING_MANAGER) {
      setCalendarScope('team');
    } else {
      setCalendarScope('team');
    }
  };

  // Search & Filter States (Matching Spec)
  const [search, setSearch] = useState('');
  const [activePreset, setActivePreset] = useState('all'); // all | today | upcoming | feedback_pending | completed | cancelled
  const [selectedInterviewerFilter, setSelectedInterviewerFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedRoundFilter, setSelectedRoundFilter] = useState('All');
  const [selectedReqFilter, setSelectedReqFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  // Modals & Drawers State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedCandidateForSchedule, setSelectedCandidateForSchedule] = useState(null);
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [isFinalDecisionModalOpen, setIsFinalDecisionModalOpen] = useState(false);
  const [isPlansConfigModalOpen, setIsPlansConfigModalOpen] = useState(false);
  const [isRescheduleCancelModalOpen, setIsRescheduleCancelModalOpen] = useState(false);
  const [rescheduleCancelMode, setRescheduleCancelMode] = useState('reschedule');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isCandidatePortalOpen, setIsCandidatePortalOpen] = useState(false);
  const [isInterviewerGateOpen, setIsInterviewerGateOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [activeKpiGraphModal, setActiveKpiGraphModal] = useState(null);
  const [bulkDeletingSessions, setBulkDeletingSessions] = useState(null);
  const [deletingSession, setDeletingSession] = useState(null);
  const [selectedSessionsForExport, setSelectedSessionsForExport] = useState([]);
  const [selectedSessionForPage, setSelectedSessionForPage] = useState(null);

  const { extraCrumbs, setExtraCrumbs, clearExtraCrumbs } = useBreadcrumb();

  useEffect(() => {
    if (selectedSessionForPage) {
      const pageLabel = selectedSessionForPage.candidateName
        ? `${selectedSessionForPage.id} (${selectedSessionForPage.candidateName})`
        : selectedSessionForPage.id;
      setExtraCrumbs([{ label: pageLabel }]);
    } else if (isDetailsDrawerOpen && activeSession) {
      const sessionLabel = activeSession.candidateName
        ? `${activeSession.id} (${activeSession.candidateName})`
        : activeSession.id;
      setExtraCrumbs([{ label: sessionLabel }]);
    } else if (currentSubView === 'plan-builder') {
      setExtraCrumbs([{ label: 'Interview Plan Builder' }]);
    } else if (currentSubView === 'schedule') {
      setExtraCrumbs([{ label: 'Schedule Interview' }]);
    } else {
      clearExtraCrumbs();
    }
  }, [selectedSessionForPage, isDetailsDrawerOpen, activeSession, currentSubView]);

  useEffect(() => {
    if (extraCrumbs.length === 0) {
      if (selectedSessionForPage) setSelectedSessionForPage(null);
      if (currentSubView !== 'hub') setCurrentSubView('hub');
      if (isDetailsDrawerOpen) {
        setIsDetailsDrawerOpen(false);
        setActiveSession(null);
      }
    }
  }, [extraCrumbs]);

  // CSV Export for Interview Sessions
  const handleExportCSV = () => {
    const toExport = selectedSessionsForExport.length > 0 ? selectedSessionsForExport : filteredSessions;
    if (!toExport.length) {
      addToast({ title: 'Export Notice', message: 'No interview sessions to export.', type: 'warning' });
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Session ID,Candidate Name,Email,Round Name,Type,Date,Start Time,End Time,Status,Interviewers"].join(",") + "\n"
      + toExport.map(s => 
        `"${s.id}","${s.candidateName}","${s.candidateEmail || ''}","${s.roundName}","${s.type}","${s.scheduledDate}","${s.startTime}","${s.endTime}","${s.status}","${(s.interviewers || []).map(i => i.name).join('; ')}"`
      ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `interviews_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({
      title: 'Export Completed',
      message: `Exported ${toExport.length} interview session(s) to CSV.`,
      type: 'success'
    });
  };

  // Confirm Single Session Delete
  const handleConfirmSingleDelete = async () => {
    if (!deletingSession) return;
    try {
      await interviewService.deleteInterviewSession(deletingSession.id, currentPersona?.name || 'Recruiter');
      setDeletingSession(null);
      loadData();
      addToast({
        title: 'Interview Deleted',
        message: `Interview session for "${deletingSession.candidateName || ''}" deleted successfully.`,
        type: 'success'
      });
    } catch (err) {
      addToast({ title: 'Delete Failed', message: err.message, type: 'error' });
    }
  };

  // Confirm Bulk Delete Action
  const handleConfirmBulkDelete = async () => {
    if (!bulkDeletingSessions || bulkDeletingSessions.length === 0) return;
    try {
      const count = bulkDeletingSessions.length;
      const ids = bulkDeletingSessions.map(s => s.id);
      await interviewService.deleteInterviewSessions(ids, currentPersona?.name || 'Recruiter');
      setBulkDeletingSessions(null);
      loadData();
      addToast({
        title: 'Interviews Deleted',
        message: `Successfully deleted ${count} interview session(s).`,
        type: 'success'
      });
    } catch (err) {
      addToast({ title: 'Delete Failed', message: err.message, type: 'error' });
    }
  };

  // Load Sessions & KPI Analytics
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessRes, kpiRes] = await Promise.all([
        interviewService.getInterviewSessions({
          page: 1,
          pageSize: 500,
          search: '',
          userRole: currentRole,
          userContext: currentPersona,
          userRequisitions
        }),
        interviewService.getKPIAnalytics(currentRole, currentPersona)
      ]);
      setSessions(sessRes);
      setKpiData(kpiRes);
    } catch (e) {
      console.error('Error fetching interview sessions', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentRole, currentPersona, userRequisitions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dynamic role-aware scope configuration per specification (Section 14 & Section 1)
  const roleScopeConfig = useMemo(() => {
    switch (currentRole) {
      case INTERVIEW_ROLES.HIRING_MANAGER:
        return {
          myLabel: 'My Calendar',
          mySubtitle: 'Your assigned interviews',
          teamLabel: 'Team Calendar',
          teamSubtitle: 'Engineering team interviews',
          showTeam: true,
          activeScopeDescription: calendarScope === 'my' 
            ? 'Showing rounds assigned directly to you (Alex Chen)' 
            : 'Showing all interviews across Engineering requisitions'
        };
      case INTERVIEW_ROLES.INTERVIEWER:
        return {
          myLabel: 'My Calendar',
          mySubtitle: 'My assigned interviews',
          teamLabel: 'Team Calendar',
          teamSubtitle: 'Restricted to Managers & Recruiters',
          showTeam: false,
          activeScopeDescription: 'Showing only interviews where you are an assigned panelist'
        };
      case INTERVIEW_ROLES.RECRUITER:
        return {
          myLabel: 'My Calendar',
          mySubtitle: 'Your schedule',
          teamLabel: 'Team Calendar',
          teamSubtitle: 'Recruitment team schedule',
          showTeam: true,
          activeScopeDescription: calendarScope === 'my'
            ? 'Showing your assigned requisitions pipeline'
            : 'Showing full operational recruitment calendar'
        };
      case INTERVIEW_ROLES.HR_ADMIN:
        return {
          myLabel: 'My Calendar',
          mySubtitle: 'Your assigned interviews',
          teamLabel: 'Team Calendar',
          teamSubtitle: 'Organization schedule',
          showTeam: true,
          activeScopeDescription: calendarScope === 'my'
            ? 'Showing rounds where you are an assigned interviewer'
            : 'Showing organization-wide interview schedule'
        };
      case INTERVIEW_ROLES.ATS_ADMIN:
      default:
        return {
          myLabel: 'My Calendar',
          mySubtitle: 'Your schedule',
          teamLabel: 'Team Calendar',
          teamSubtitle: 'All Organization interviews',
          showTeam: true,
          activeScopeDescription: calendarScope === 'my'
            ? 'Showing your direct scheduled sessions'
            : 'Full enterprise visibility across all departments and interviewers'
        };
    }
  }, [currentRole, calendarScope]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 5 Glassmorphic KPI Cards List
  const kpiCardsList = useMemo(() => {
    const todaySessions = sessions.filter(s => s.scheduledDate === todayStr && s.status !== SESSION_STATUS.CANCELLED);
    const upcomingSessions = sessions.filter(s => s.scheduledDate >= todayStr && s.status === SESSION_STATUS.SCHEDULED);
    const pendingFeedbackSessions = sessions.filter(s => s.feedbackStatus === FEEDBACK_STATUS.PENDING && s.status !== SESSION_STATUS.CANCELLED);
    const completedSessions = sessions.filter(s => s.status === SESSION_STATUS.COMPLETED);
    const cancelledSessions = sessions.filter(s => s.status === SESSION_STATUS.CANCELLED || s.status === SESSION_STATUS.NO_SHOW);

    return [
      {
        id: 'today',
        label: "Today's Schedule",
        value: kpiData.todayCount !== undefined ? kpiData.todayCount : todaySessions.length,
        subtitle: 'Immediate room & calendar load',
        icon: <Clock size={16} className="text-blue-600 dark:text-blue-400" />,
        iconBg: 'bg-blue-50 dark:bg-blue-950/60',
        trend: '+12%',
        trendUp: true,
        actionText: 'Today Graph',
        updatedAt: 'Live sync',
        records: todaySessions
      },
      {
        id: 'upcoming',
        label: 'Upcoming Scheduled',
        value: kpiData.upcomingCount !== undefined ? kpiData.upcomingCount : upcomingSessions.length,
        subtitle: 'Forward booking pipeline',
        icon: <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />,
        iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
        trend: '+18%',
        trendUp: true,
        actionText: 'Booking Trend',
        updatedAt: 'All rounds',
        records: upcomingSessions
      },
      {
        id: 'pendingFeedback',
        label: 'Pending Scorecards',
        value: kpiData.pendingFeedbackCount !== undefined ? kpiData.pendingFeedbackCount : pendingFeedbackSessions.length,
        subtitle: 'Awaiting interviewer feedback SLA',
        icon: <Award size={16} className="text-amber-600 dark:text-amber-400" />,
        iconBg: 'bg-amber-50 dark:bg-amber-950/60',
        trend: '18h SLA',
        trendUp: false,
        actionText: 'Review Queue',
        updatedAt: 'Needs Action',
        records: pendingFeedbackSessions
      },
      {
        id: 'completed',
        label: 'Completed Sessions',
        value: kpiData.completedCount !== undefined ? kpiData.completedCount : completedSessions.length,
        subtitle: 'Ready for hiring manager decision',
        icon: <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />,
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
        trend: '+24%',
        trendUp: true,
        actionText: 'Evaluated',
        updatedAt: 'Evaluated',
        records: completedSessions
      }
    ];
  }, [kpiData, sessions, todayStr]);

  // Handle KPI Card Click (Filter Preset Toggle)
  const handleKpiCardClick = (stat) => {
    if (activePreset === stat.id) {
      setActivePreset('all');
    } else {
      setActivePreset(stat.id);
    }
  };

  // Handle Open Real-time Graph Modal
  const handleOpenKpiGraph = (e, stat) => {
    e.stopPropagation();
    setActiveKpiGraphModal({
      kpiId: stat.id,
      label: stat.label,
      value: stat.value,
      records: stat.records || sessions
    });
  };

  // Requisition Options for Filter Dropdown
  const reqOptions = useMemo(() => {
    const set = new Set(sessions.map(s => s.requisitionId).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [sessions]);

  // Check if any filters are currently active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      search.trim() ||
      activePreset !== 'all' ||
      selectedInterviewerFilter !== 'All' ||
      selectedTypeFilter !== 'All' ||
      selectedRoundFilter !== 'All' ||
      selectedReqFilter !== 'All' ||
      selectedStatusFilter !== 'All' ||
      selectedDateFilter
    );
  }, [
    search, activePreset, selectedInterviewerFilter, selectedTypeFilter, 
    selectedRoundFilter, selectedReqFilter, selectedStatusFilter, 
    selectedDateFilter
  ]);

  const handleClearFilters = () => {
    setSearch('');
    setActivePreset('all');
    setSelectedInterviewerFilter('All');
    setSelectedTypeFilter('All');
    setSelectedRoundFilter('All');
    setSelectedReqFilter('All');
    setSelectedStatusFilter('All');
    setSelectedDateFilter('');
  };

  // Filtered Sessions List for Calendar & Data Table
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // 0. Role-specific Calendar Scope Filtering
    if (currentRole === INTERVIEW_ROLES.INTERVIEWER) {
      // Individual Interviewer/Panelist: ONLY sees interviews they are assigned to
      const myId = currentPersona?.id;
      const myName = currentPersona?.name?.toLowerCase();
      const myEmail = currentPersona?.email?.toLowerCase();
      result = result.filter(s => 
        (s.interviewers || []).some(i => 
          i.id === myId || 
          (i.name && i.name.toLowerCase().includes(myName)) ||
          (i.email && i.email.toLowerCase() === myEmail)
        )
      );
    } else if (currentRole === INTERVIEW_ROLES.HIRING_MANAGER) {
      // Hiring Manager / RO:
      if (calendarScope === 'my') {
        // ONLY rounds where HM is an assigned interviewer/panelist
        const myId = currentPersona?.id;
        const myName = currentPersona?.name?.toLowerCase();
        result = result.filter(s => 
          (s.interviewers || []).some(i => 
            i.id === myId || 
            (i.name && i.name.toLowerCase().includes(myName))
          )
        );
      } else {
        // Team Calendar: All interviews within HM's permitted department/team scope
        const userReqs = currentPersona?.userRequisitions || ['REQ-2026-001', 'REQ-2026-002'];
        result = result.filter(s => 
          userReqs.includes(s.requisitionId) || 
          s.department === 'Engineering' ||
          (s.interviewers || []).some(i => i.department === 'Engineering')
        );
      }
    } else if (currentRole === INTERVIEW_ROLES.RECRUITER) {
      // Recruiter:
      if (calendarScope === 'my') {
        // Recruiter's assigned requisition pipeline
        result = result.filter(s => s.requisitionId === 'REQ-2026-001');
      }
      // 'team' / 'all': full enterprise operational view
    } else if (currentRole === INTERVIEW_ROLES.HR_ADMIN || currentRole === INTERVIEW_ROLES.ATS_ADMIN) {
      // HR Admin / Super Admin:
      if (calendarScope === 'my') {
        const myId = currentPersona?.id;
        const myName = currentPersona?.name?.toLowerCase();
        result = result.filter(s => 
          (s.interviewers || []).some(i => 
            i.id === myId || 
            (i.name && i.name.toLowerCase().includes(myName))
          )
        );
      }
      // 'team' / 'all': organization-wide view
    }

    // KPI Preset Card Filter
    if (activePreset === 'today') {
      result = result.filter(s => s.scheduledDate === todayStr && s.status !== SESSION_STATUS.CANCELLED);
    } else if (activePreset === 'upcoming') {
      result = result.filter(s => s.scheduledDate >= todayStr && s.status === SESSION_STATUS.SCHEDULED);
    } else if (activePreset === 'pendingFeedback') {
      result = result.filter(s => s.feedbackStatus === FEEDBACK_STATUS.PENDING && s.status !== SESSION_STATUS.CANCELLED);
    } else if (activePreset === 'completed') {
      result = result.filter(s => s.status === SESSION_STATUS.COMPLETED);
    } else if (activePreset === 'cancelled') {
      result = result.filter(s => s.status === SESSION_STATUS.CANCELLED || s.status === SESSION_STATUS.NO_SHOW);
    }

    // 1. Text Search (Search Candidate / Req / Interviewer)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(s => 
        s.candidateName?.toLowerCase().includes(q) ||
        s.requisitionTitle?.toLowerCase().includes(q) ||
        s.requisitionId?.toLowerCase().includes(q) ||
        s.roundName?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q) ||
        (s.interviewers || []).some(i => i.name?.toLowerCase().includes(q))
      );
    }

    // 2. Interviewer Filter
    if (selectedInterviewerFilter !== 'All') {
      result = result.filter(s => 
        (s.interviewers || []).some(i => i.name === selectedInterviewerFilter || i.id === selectedInterviewerFilter)
      );
    }

    // 3. Interview Type / Mode Filter
    if (selectedTypeFilter !== 'All') {
      result = result.filter(s => {
        if (selectedTypeFilter === 'Video Interview' || selectedTypeFilter === 'Video') return s.interviewType === INTERVIEW_TYPE.VIDEO;
        if (selectedTypeFilter === 'In-person' || selectedTypeFilter === 'In Person') return s.interviewType === INTERVIEW_TYPE.IN_PERSON;
        if (selectedTypeFilter === 'Phone') return s.interviewType === INTERVIEW_TYPE.PHONE;
        return s.interviewType === selectedTypeFilter;
      });
    }

    // 4. Round / Category Filter
    if (selectedRoundFilter !== 'All') {
      result = result.filter(s => {
        const rName = (s.roundName || '').toLowerCase();
        const cat = (s.roundCategory || '').toLowerCase();
        const target = selectedRoundFilter.toLowerCase();
        return rName.includes(target) || cat.includes(target);
      });
    }

    // 5. Requisition Filter
    if (selectedReqFilter !== 'All') {
      result = result.filter(s => s.requisitionId === selectedReqFilter);
    }

    // 6. Status Filter
    if (selectedStatusFilter !== 'All') {
      result = result.filter(s => s.status === selectedStatusFilter);
    }

    // 7. Single Date Filter
    if (selectedDateFilter) {
      result = result.filter(s => s.scheduledDate === selectedDateFilter);
    }

    return result;
  }, [
    sessions, calendarScope, currentPersona, currentRole, search,
    selectedInterviewerFilter, selectedTypeFilter, selectedRoundFilter,
    selectedReqFilter, selectedStatusFilter, selectedDateFilter
  ]);

  // Action Handlers
  const handleOpenKit = (sess) => {
    const interviewerId = currentPersona.id || 'INT-04';
    const hasAccepted = !!sess.interviewerPolicyAcceptances?.[interviewerId]?.accepted;
    if (sess.interviewerPolicyRequired && !hasAccepted) {
      setActiveSession(sess);
      setIsInterviewerGateOpen(true);
      return;
    }
    setActiveSession(sess);
    setIsKitModalOpen(true);
  };

  const handleOpenCandidatePortal = (sess) => {
    setActiveSession(sess);
    setIsCandidatePortalOpen(true);
  };

  const handleOpenOutcome = (sess) => {
    setActiveSession(sess);
    setIsOutcomeModalOpen(true);
  };

  const handleOpenFinalDecision = (sess) => {
    setActiveSession(sess);
    setIsFinalDecisionModalOpen(true);
  };

  const handleOpenReschedule = (sess) => {
    setActiveSession(sess);
    setRescheduleCancelMode('reschedule');
    setIsRescheduleCancelModalOpen(true);
  };

  const handleOpenCancel = (sess) => {
    setActiveSession(sess);
    setRescheduleCancelMode('cancel');
    setIsRescheduleCancelModalOpen(true);
  };

  const sessionConflicts = useMemo(() => detectSessionConflicts(sessions), [sessions]);

  const handleViewDetails = (sess) => {
    const conflictMeta = sessionConflicts.get(sess.id) || null;
    setActiveSession({ ...sess, conflictInfo: conflictMeta });
    setIsDetailsDrawerOpen(true);
  };

  const handleSendInvites = () => {
    addToast({
      title: 'Calendar Invites Sent',
      message: 'Email invites and assessment policy guidelines dispatched to all candidate and panel calendars.',
      type: 'success'
    });
  };

  // DataTable Columns Definition
  const tableColumns = useMemo(() => [
    {
      accessor: 'candidateName',
      header: 'Candidate & Requisition',
      align: 'left',
      sortable: true,
      render: (_val, row) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div 
            className="w-8 h-8 rounded-xl font-extrabold text-xs text-white flex items-center justify-center shrink-0 shadow-2xs"
            style={{ backgroundColor: row.candidateAvatarBg || brandColor }}
          >
            {row.candidateAvatar || 'CD'}
          </div>
          <div className="min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSessionForPage(row);
              }}
              className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block text-left cursor-pointer"
            >
              {row.candidateName}
            </button>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {row.requisitionTitle} ({row.requisitionId})
            </div>
          </div>
        </div>
      )
    },
    {
      accessor: 'roundName',
      header: 'Interview Round',
      align: 'left',
      sortable: true,
      render: (_val, row) => (
        <div className="min-w-[170px]">
          <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
            {row.roundName}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className="font-semibold text-slate-400">Round {row.roundSequence}</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{row.roundCategory}</span>
          </div>
        </div>
      )
    },
    {
      accessor: 'policyName',
      header: 'Assigned Policy',
      align: 'center',
      render: (_val, row) => {
        const policyName = row.policyName || (row.policyId ? 'Assigned Policy' : null);
        const policyVersion = row.policyVersion || 'v1.0';
        const candidateAccepted = row.candidatePolicyAccepted;

        if (!policyName && !row.policyId) {
          return <span className="text-[11px] text-slate-400 italic">No policy</span>;
        }

        return (
          <div className="min-w-[150px] text-xs flex flex-col items-center justify-center">
            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
              <ShieldCheck size={12} className="text-indigo-500 shrink-0" />
              <span className="truncate">{policyName}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                {policyVersion}
              </span>
              {candidateAccepted ? (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> Candidate Ready
                </span>
              ) : (
                <span className="text-[10px] text-amber-500 font-medium">
                  Gate Pending
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      accessor: 'scheduledDate',
      header: 'Date & Time',
      align: 'center',
      sortable: true,
      render: (_val, row) => (
        <div className="min-w-[140px] text-xs flex flex-col items-center justify-center">
          <div className="font-bold text-slate-800 dark:text-slate-200">
            {row.scheduledDate}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Clock size={11} className="text-slate-400" />
            <span>{row.startTime} - {row.endTime}</span>
          </div>
        </div>
      )
    },
    {
      accessor: 'interviewers',
      header: 'Interviewers',
      align: 'left',
      render: (_val, row) => {
        const list = row.interviewers || [];
        if (!list.length) {
          return <span className="text-xs text-slate-400 italic">Not Assigned</span>;
        }
        return (
          <div className="min-w-[150px] text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {list.map(i => i.name).join(', ')}
            </div>
            {list.length === 1 && list[0].title && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {list[0].title}
              </div>
            )}
            {list.length > 1 && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {list.length} Panelists
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessor: 'status',
      header: 'Status',
      align: 'center',
      sortable: true,
      render: (_val, row) => {
        let badgeClass = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
        if (row.status === SESSION_STATUS.COMPLETED) badgeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (row.status === SESSION_STATUS.IN_PROGRESS) badgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse';
        if (row.status === SESSION_STATUS.CANCELLED) badgeClass = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        if (row.status === SESSION_STATUS.NO_SHOW) badgeClass = 'bg-purple-500/10 text-purple-600 border-purple-500/20';

        return (
          <div className="flex justify-center whitespace-nowrap">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${badgeClass}`}>
              {row.status}
            </span>
          </div>
        );
      }
    },
    {
      accessor: 'actions',
      header: 'Actions',
      align: 'center',
      render: (_val, row) => {
        const canSchedule = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SESSION_SCHEDULE);
        const canSubmitScorecard = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SCORECARD_SUBMIT);
        const canDelete = hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SESSION_CANCEL);

        return (
          <div className="flex items-center gap-1.5 justify-center py-0.5">
            {canSchedule && (
              <button
                onClick={() => {
                  setSelectedCandidateForSchedule({
                    id: row.candidateId,
                    name: row.candidateName,
                    email: row.candidateEmail,
                    applicationId: row.applicationId,
                    requisitionId: row.requisitionId,
                    requisitionTitle: row.requisitionTitle,
                    department: row.department,
                    avatar: row.candidateAvatar,
                    avatarBg: row.candidateAvatarBg
                  });
                  setCurrentSubView('schedule');
                }}
                title="Schedule Round"
                className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              >
                <Calendar size={13.5} />
              </button>
            )}
            {canSubmitScorecard && (
              <button
                onClick={() => handleOpenKit(row)}
                title="Open Scorecard"
                className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:border-amber-200 dark:hover:border-amber-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              >
                <Award size={13.5} />
              </button>
            )}
            <button
              onClick={() => handleViewDetails(row)}
              title="View Details"
              className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            >
              <Eye size={13.5} />
            </button>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingSession(row);
                }}
                title="Delete Interview"
                className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              >
                <Trash2 size={13.5} />
              </button>
            )}
          </div>
        );
      }
    }
  ], [brandColor, currentRole]);

  // Handle Full-Page Sub-Views
  if (currentSubView === 'plan-builder') {
    return (
      <InterviewPlanBuilderPage
        onBack={() => {
          setCurrentSubView('hub');
          loadData();
        }}
        currentRole={currentRole}
        currentUserContext={currentPersona}
        brandColor={brandColor}
      />
    );
  }

  if (currentSubView === 'schedule') {
    return (
      <InterviewSchedulePage
        onBack={() => {
          setCurrentSubView('hub');
          setSelectedCandidateForSchedule(null);
          loadData();
        }}
        initialCandidate={selectedCandidateForSchedule}
        currentRole={currentRole}
        currentUserContext={currentPersona}
        onScheduled={(newSess) => {
          setSessions(prev => [newSess, ...prev]);
          loadData();
        }}
        brandColor={brandColor}
      />
    );
  }

  return (
    <>
      {selectedSessionForPage ? (
        <InterviewDetailPage
          session={selectedSessionForPage}
          onBack={() => {
            setSelectedSessionForPage(null);
            loadData();
          }}
          brandColor={brandColor}
          currentRole={currentRole}
          currentUserContext={currentPersona}
          onOpenKit={(sess) => handleOpenKit(sess)}
          onOpenReschedule={(sess) => handleOpenReschedule(sess)}
          onOpenCancel={(sess) => handleOpenCancel(sess)}
          onOpenOutcome={(sess) => handleOpenOutcome(sess)}
          onOpenFinalDecision={(sess) => handleOpenFinalDecision(sess)}
          onOpenCandidatePortal={(sess) => handleOpenCandidatePortal(sess)}
          onScheduleNextRound={(sess) => {
            setSelectedCandidateForSchedule({
              id: sess.candidateId,
              name: sess.candidateName,
              email: sess.candidateEmail,
              applicationId: sess.applicationId,
              requisitionId: sess.requisitionId,
              requisitionTitle: sess.requisitionTitle,
              department: sess.department,
              avatar: sess.candidateAvatar,
              avatarBg: sess.candidateAvatarBg
            });
            setSelectedSessionForPage(null);
            setCurrentSubView('schedule');
          }}
        />
      ) : (
        <div className="w-full max-w-[1680px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-4 text-start">
          {/* ═══════════════════════════════════════════════════════════════════
              1. PAGE HEADER (SECTION 1 SPEC)
              Title: Interview Calendar
              Subtitle: Manage scheduled interviews, interviewer availability and upcoming sessions.
              Primary Action: + Schedule Interview
          ═══════════════════════════════════════════════════════════════════ */}
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs font-sans relative"
          >
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 relative z-10">
          {/* Left: Icon + Title + Subtitle */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div 
              style={{ backgroundColor: brandColor }}
              className="p-2.5 rounded-xl text-white shadow-xs flex items-center justify-center shrink-0"
            >
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Interviews
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Operational
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage scheduled interviews, panels, scorecard evaluations and candidate pipeline.
              </p>
            </div>
          </div>

          {/* Right Actions: Scope Switcher + Role Governance + CTAs */}
          <div className="flex items-center gap-2 flex-wrap w-full 2xl:w-auto justify-start 2xl:justify-end">
            {/* 1. Dynamic Role-Aware Scope Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setCalendarScope('my')}
                style={calendarScope === 'my' ? { backgroundColor: brandColor, color: '#fff' } : {}}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  calendarScope === 'my'
                    ? 'shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={roleScopeConfig.mySubtitle}
              >
                <User size={13} />
                <span>{roleScopeConfig.myLabel}</span>
              </button>

              {roleScopeConfig.showTeam ? (
                <button
                  onClick={() => setCalendarScope('team')}
                  style={calendarScope === 'team' ? { backgroundColor: brandColor, color: '#fff' } : {}}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    calendarScope === 'team'
                      ? 'shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={roleScopeConfig.teamSubtitle}
                >
                  <Users size={13} />
                  <span>{roleScopeConfig.teamLabel}</span>
                </button>
              ) : null}
            </div>

            {/* Role Governance Selector */}
            <CustomSelect
              prefix="Role: "
              value={currentRole}
              onChange={handleRoleChange}
              options={Object.values(MOCK_PERSONAS).map(p => ({
                label: p.label,
                value: p.role
              }))}
              size="sm"
              className="w-48 sm:w-52 shrink-0"
            />

            {/* Assessment Policies Button */}
            <button
              onClick={() => onNavigate('policy-management')}
              className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              title="Manage Interview & Assessment Policies"
            >
              <ShieldCheck size={13} style={{ color: brandColor }} />
              <span>Policies</span>
            </button>

            {/* Configure Plans */}
            <button
              onClick={() => setCurrentSubView('plan-builder')}
              className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              title="Configure Multi-Round Interview Plans"
            >
              <Settings size={13} />
              <span>Plans</span>
            </button>

            {/* Primary Action Button: + Schedule Interview */}
            {hasInterviewPermission(currentRole, INTERVIEW_PERMISSIONS.SESSION_SCHEDULE) && (
              <motion.button 
                onClick={() => {
                  setSelectedCandidateForSchedule(null);
                  setCurrentSubView('schedule');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ backgroundColor: brandColor }}
                className="h-8 px-3.5 text-xs font-bold text-white shadow-xs hover:brightness-110 rounded-xl border border-white/20 flex items-center gap-1.5 shrink-0 cursor-pointer transition-all whitespace-nowrap"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Schedule Interview</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 2. 4 FROSTED GLASS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiCardsList.map((stat, idx) => {
          return (
            <motion.div 
              key={stat.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 + 0.05 }}
              whileHover={{ y: -3 }}
              onClick={() => handleKpiCardClick(stat)}
              className="px-3.5 py-2.5 rounded-xl border transition-all duration-300 ease-out cursor-pointer relative overflow-hidden group flex flex-col justify-between bg-gradient-to-br from-white/85 to-blue-50/25 dark:from-slate-900/80 dark:to-blue-950/20 backdrop-blur-md border-blue-100/60 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700/80 hover:shadow-md hover:bg-gradient-to-br hover:from-white hover:via-blue-50/40 hover:to-blue-50/10 dark:hover:from-slate-900 dark:hover:via-blue-950/30 dark:hover:to-slate-900 shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans">
                    {stat.label}
                  </span>
                  <div className={`p-1 rounded-lg border border-white/80 dark:border-slate-700/60 ${stat.iconBg}`}>
                    {stat.icon}
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xl font-extrabold text-[#0F172A] dark:text-white tracking-tight font-sans">
                    {stat.value}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${
                    stat.trendUp ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50/90 text-amber-700 border border-amber-200/60'
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

              <div className="flex items-center justify-between text-[10px] font-medium text-[#64748B] dark:text-slate-500 pt-1.5 border-t border-slate-200/50 dark:border-slate-800 transition-colors">
                <span className="text-[10px] font-mono text-[#64748B]">{stat.updatedAt}</span>
                <button
                  type="button"
                  onClick={(e) => handleOpenKpiGraph(e, stat)}
                  className="font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform hover:underline cursor-pointer" 
                  style={{ color: brandColor }}
                >
                  <span>{stat.actionText}</span>
                  <span>📊</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. FILTER TOOLBAR (SECTION 3 SPEC)
          Search Candidate, Requisition, Interview Round, Interviewer, Status,
          Interview Type, Date, Clear Filters
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Candidate */}
          <div className="w-full sm:w-64">
            <ModernSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search candidate, requisition..."
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
            {/* Requisition */}
            <div className="w-38">
              <CustomSelect
                prefix="Req: "
                value={selectedReqFilter}
                onChange={setSelectedReqFilter}
                options={reqOptions.map(r => ({ label: r, value: r }))}
                placeholder="All Requisitions"
                size="sm"
              />
            </div>

            {/* Interview Round */}
            <div className="w-36">
              <CustomSelect
                prefix="Round: "
                value={selectedRoundFilter}
                onChange={setSelectedRoundFilter}
                options={[
                  { label: 'All', value: 'All' },
                  { label: 'Technical', value: 'Technical' },
                  { label: 'Coding', value: 'Coding' },
                  { label: 'Managerial', value: 'Managerial' },
                  { label: 'HR', value: 'HR' },
                  { label: 'Assessment', value: 'Assessment' },
                  { label: 'Panel', value: 'Panel' }
                ]}
                placeholder="All Rounds"
                size="sm"
              />
            </div>

            {/* Interviewer */}
            <div className="w-40">
              <CustomSelect
                prefix="Interviewer: "
                value={selectedInterviewerFilter}
                onChange={setSelectedInterviewerFilter}
                options={[
                  { label: 'All', value: 'All' },
                  ...INTERVIEWERS_ROSTER.map(i => ({ label: i.name, value: i.name }))
                ]}
                placeholder="All Interviewers"
                size="sm"
              />
            </div>

            {/* Status */}
            <div className="w-36">
              <CustomSelect
                prefix="Status: "
                value={selectedStatusFilter}
                onChange={setSelectedStatusFilter}
                options={[
                  { label: 'All', value: 'All' },
                  { label: 'Scheduled', value: SESSION_STATUS.SCHEDULED },
                  { label: 'Confirmed', value: SESSION_STATUS.CONFIRMED },
                  { label: 'In Progress', value: SESSION_STATUS.IN_PROGRESS },
                  { label: 'Completed', value: SESSION_STATUS.COMPLETED },
                  { label: 'Cancelled', value: SESSION_STATUS.CANCELLED },
                  { label: 'Rescheduled', value: SESSION_STATUS.RESCHEDULED },
                  { label: 'No Show', value: SESSION_STATUS.NO_SHOW }
                ]}
                placeholder="All Statuses"
                size="sm"
              />
            </div>

            {/* Interview Type / Delivery Mode */}
            <div className="w-34">
              <CustomSelect
                prefix="Type: "
                value={selectedTypeFilter}
                onChange={setSelectedTypeFilter}
                options={[
                  { label: 'All', value: 'All' },
                  { label: 'Video', value: 'Video' },
                  { label: 'In Person', value: 'In Person' },
                  { label: 'Phone', value: 'Phone' }
                ]}
                placeholder="All Types"
                size="sm"
              />
            </div>

            {/* Date Filter Input */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 h-8">
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="text-xs bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                title="Filter by specific date"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="h-8 px-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Clear Filters</span>
              </button>
            )}

            {/* Export CSV Button */}
            <motion.button 
              whileHover={{ scale: 1.03, y: -0.5 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleExportCSV}
              title={selectedSessionsForExport.length > 0 ? `Export ${selectedSessionsForExport.length} Selected Sessions` : "Export CSV"}
              style={selectedSessionsForExport.length > 0 ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
              className={`h-8 px-3 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs font-sans cursor-pointer group rounded-xl border ${
                selectedSessionsForExport.length > 0 
                  ? 'text-white shadow-md' 
                  : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Download size={13} className={selectedSessionsForExport.length > 0 ? 'text-white' : 'text-blue-500 group-hover:text-blue-600 transition-colors'} />
              <span>{selectedSessionsForExport.length > 0 ? `Export (${selectedSessionsForExport.length})` : 'Export'}</span>
            </motion.button>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              title="Refresh Data"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer shadow-2xs"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* View Switcher Bar (Calendar vs Table) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setViewMode('table')}
              style={viewMode === 'table' ? { backgroundColor: brandColor, color: '#fff' } : {}}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table' 
                  ? 'shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns size={13} />
              <span>Table View ({filteredSessions.length})</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              style={viewMode === 'calendar' ? { backgroundColor: brandColor, color: '#fff' } : {}}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'calendar' 
                  ? 'shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar size={13} />
              <span>Calendar View</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 flex-wrap">
            <span>Showing <strong className="text-slate-800 dark:text-slate-200">{filteredSessions.length}</strong> sessions</span>
            <span>•</span>
            <span style={{ color: brandColor }} className="font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--pw-brand)]" style={{ backgroundColor: brandColor }} />
              {roleScopeConfig.activeScopeDescription}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. MAIN WORKSPACE: CALENDAR VIEW + RIGHT SIDEBAR OR DATA TABLE
      ═══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-12 gap-5 items-start">
          {/* Main Calendar View Area */}
          <div className="col-span-12 xl:col-span-9 space-y-4">
            <InterviewCalendarView
              sessions={filteredSessions}
              brandColor={brandColor}
              currentDate={currentCalendarDate}
              onDateChange={setCurrentCalendarDate}
              viewMode={calendarViewMode}
              onViewModeChange={setCalendarViewMode}
              onSelectSession={handleViewDetails}
              onScheduleClick={() => {
                setSelectedCandidateForSchedule(null);
                setCurrentSubView('schedule');
              }}
              isLoading={isLoading}
              onRetry={loadData}
              currentRole={currentRole}
            />
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 xl:col-span-3 space-y-4">
            <InterviewCalendarSidebar
              currentDate={currentCalendarDate}
              onDateChange={(d) => {
                setCurrentCalendarDate(d);
                setCalendarViewMode(CALENDAR_VIEW_MODES.DAY);
              }}
              sessions={filteredSessions}
              onSelectSession={handleViewDetails}
              onScheduleClick={() => {
                setSelectedCandidateForSchedule(null);
                setCurrentSubView('schedule');
              }}
              onCheckAvailability={() => setIsAvailabilityModalOpen(true)}
              onSendInvites={handleSendInvites}
              onManagePanels={() => setCurrentSubView('plan-builder')}
              onAssessmentPolicies={() => onNavigate('policy-management')}
              brandColor={brandColor}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <DataTable
            title="Interview Sessions Data Grid"
            columns={tableColumns}
            data={filteredSessions}
            isLoading={isLoading}
            selectable={true}
            onRowClick={(row) => setSelectedSessionForPage(row)}
            onSelectionChange={(items) => setSelectedSessionsForExport(items)}
            onDeleteSelected={(items) => setBulkDeletingSessions(items)}
            onDelete={(row) => setDeletingSession(row)}
            borderless={true}
            brandColor={brandColor}
          />
        </div>
      )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          4. MODALS & SLIDE-OVER WORKSPACES (ACTIVE ACROSS HUB & DETAIL VIEW)
      ═══════════════════════════════════════════════════════════════════ */}
      {/* Interviewer Availability Checker Modal */}
      <InterviewerAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        sessions={sessions}
        brandColor={brandColor}
      />

      {/* Schedule Interview Modal */}
      <InterviewScheduleModal
        isOpen={isScheduleModalOpen}
        initialCandidate={selectedCandidateForSchedule}
        currentRole={currentRole}
        currentUserContext={currentPersona}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedCandidateForSchedule(null);
        }}
        onScheduled={(newSess) => {
          setSessions(prev => [newSess, ...prev]);
          addToast({
            title: 'Interview Scheduled',
            message: `${newSess.roundName} scheduled for ${newSess.candidateName}.`,
            type: 'success'
          });
        }}
        brandColor={brandColor}
      />

      {/* Interview Kit & Scorecard Modal */}
      <InterviewKitModal
        isOpen={isKitModalOpen}
        onClose={() => setIsKitModalOpen(false)}
        session={activeSession}
        currentRole={currentRole}
        currentInterviewerId={currentPersona.id}
        currentInterviewerName={currentPersona.name}
        onScorecardSubmitted={(updated) => {
          setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
          setSelectedSessionForPage(prev => (prev && prev.id === updated.id ? updated : prev));
          setActiveSession(updated);
          addToast({
            title: 'Scorecard Submitted',
            message: 'Evaluation rubric locked and recorded in audit trail.',
            type: 'success'
          });
        }}
        brandColor={brandColor}
      />

      {/* Round Outcome Validation Modal */}
      <RoundOutcomeModal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        session={activeSession}
        currentUserContext={currentPersona}
        onOutcomeDecided={(updated) => {
          setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
          setSelectedSessionForPage(prev => (prev && prev.id === updated.id ? updated : prev));
          setActiveSession(updated);
          addToast({
            title: 'Round Outcome Decided',
            message: `Round marked as ${updated.roundOutcome}.`,
            type: 'success'
          });
        }}
        brandColor={brandColor}
      />

      {/* Final Candidate Selection & HR Gate Modal */}
      <FinalDecisionModal
        isOpen={isFinalDecisionModalOpen}
        onClose={() => setIsFinalDecisionModalOpen(false)}
        session={activeSession}
        currentRole={currentRole}
        currentUserContext={currentPersona}
        onFinalDecisionMade={async (_res) => {
          await loadData();
          if (activeSession) {
            const updatedSessions = await interviewService.getInterviewSessions({
              page: 1,
              pageSize: 500,
              search: '',
              userRole: currentRole,
              userContext: currentPersona,
              userRequisitions
            });
            const updated = updatedSessions.find(s => s.id === activeSession.id || (activeSession.applicationId && s.applicationId === activeSession.applicationId));
            if (updated) {
              setActiveSession(updated);
              setSelectedSessionForPage(prev => (prev ? updated : null));
            }
          }
          addToast({
            title: 'Candidate Selection Approved',
            message: `${activeSession?.candidateName || 'Candidate'} approved and recommended for Offer.`,
            type: 'success'
          });
        }}
        onNavigate={onNavigate}
        brandColor={brandColor}
      />

      {/* Plans Config Modal */}
      <InterviewPlansConfigModal
        isOpen={isPlansConfigModalOpen}
        onClose={() => setIsPlansConfigModalOpen(false)}
        onPlanSaved={(plan) => {
          addToast({
            title: 'Plan Saved',
            message: `Interview plan '${plan.name}' saved with ${plan.rounds?.length || 0} rounds.`,
            type: 'success'
          });
        }}
        brandColor={brandColor}
      />

      {/* Reschedule / Cancel / No-Show Modal */}
      <RescheduleCancelModal
        isOpen={isRescheduleCancelModalOpen}
        mode={rescheduleCancelMode}
        session={activeSession}
        onClose={() => setIsRescheduleCancelModalOpen(false)}
        onUpdated={(updated) => {
          setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
          setSelectedSessionForPage(prev => (prev && prev.id === updated.id ? updated : prev));
          setActiveSession(updated);
          addToast({
            title: 'Session Updated',
            message: `Interview session status updated to ${updated.status}.`,
            type: 'info'
          });
        }}
        brandColor={brandColor}
      />

      {/* Candidate Pre-Session & Readiness Portal Modal */}
      <CandidateInterviewPortalModal
        isOpen={isCandidatePortalOpen}
        onClose={() => setIsCandidatePortalOpen(false)}
        session={activeSession}
        onPolicyAccepted={(updatedSession) => {
          setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
          setSelectedSessionForPage(prev => (prev && prev.id === updatedSession.id ? updatedSession : prev));
          setActiveSession(updatedSession);
        }}
      />

      {/* Interviewer Policy & Code of Conduct Gate Modal */}
      <InterviewerPolicyGateModal
        isOpen={isInterviewerGateOpen}
        onClose={() => setIsInterviewerGateOpen(false)}
        session={activeSession}
        interviewerId={currentPersona.id || 'INT-04'}
        interviewerName={currentPersona.name || 'Current Interviewer'}
        onAccepted={(updatedSession) => {
          setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
          setSelectedSessionForPage(prev => (prev && prev.id === updatedSession.id ? updatedSession : prev));
          setActiveSession(updatedSession);
          setIsInterviewerGateOpen(false);
          setIsKitModalOpen(true);
        }}
      />

      {/* Details Slide-Over Drawer */}
      <InterviewDetailsDrawer
        isOpen={isDetailsDrawerOpen}
        session={activeSession}
        currentRole={currentRole}
        currentUserContext={currentPersona}
        onClose={() => setIsDetailsDrawerOpen(false)}
        onOpenInterviewKit={handleOpenKit}
        onOpenRoundOutcome={handleOpenOutcome}
        onOpenFinalDecision={handleOpenFinalDecision}
        onOpenReschedule={handleOpenReschedule}
        onOpenCancel={handleOpenCancel}
        brandColor={brandColor}
      />

      {/* 10/10 Enterprise KPI Real-Time Analytics System Modal */}
      {activeKpiGraphModal && (
        <EnterpriseKpiAnalyticsModal
          isOpen={!!activeKpiGraphModal}
          onClose={() => setActiveKpiGraphModal(null)}
          kpiId={activeKpiGraphModal.kpiId}
          kpiLabel={activeKpiGraphModal.label}
          kpiValue={activeKpiGraphModal.value !== undefined ? activeKpiGraphModal.value : (activeKpiGraphModal.records?.length || sessions.length)}
          moduleType="interviews"
          rawRecords={activeKpiGraphModal.records || sessions}
        />
      )}

      {/* Single Interview Session Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingSession}
        onClose={() => setDeletingSession(null)}
        title="Delete Interview Session"
        message={`Are you sure you want to delete the scheduled interview session for "${deletingSession?.candidateName || ''}" (${deletingSession?.roundName || ''} on ${deletingSession?.scheduledDate || ''})? This action cannot be undone.`}
        confirmText="Delete Interview"
        onConfirm={handleConfirmSingleDelete}
        brandColor={brandColor}
      />

      {/* Bulk Delete Interviews Confirmation Modal */}
      <ConfirmModal
        isOpen={!!bulkDeletingSessions && bulkDeletingSessions.length > 0}
        onClose={() => setBulkDeletingSessions(null)}
        title="Delete Selected Interviews"
        message={`Are you sure you want to delete ${bulkDeletingSessions?.length || 0} selected interview session(s)? This action cannot be undone.`}
        confirmText={`Delete All (${bulkDeletingSessions?.length || 0})`}
        onConfirm={handleConfirmBulkDelete}
        brandColor={brandColor}
      />
    </>
  );
};

export default InterviewsHub;
