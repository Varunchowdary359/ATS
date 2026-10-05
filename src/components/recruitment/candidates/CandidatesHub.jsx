import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Plus, Download, RefreshCw, Eye, ArrowRight, Trash2,
  UserPlus, Briefcase, Clock, LayoutTemplate, Columns, ArrowUpRight
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { useToast } from '../../shared/ToastContext';
import { candidateService } from './candidateService';
import { 
  APPLICATION_STAGE, 
  CANDIDATE_STATUS,
  ATS_ROLES,
  PERMISSIONS,
  hasPermission 
} from './candidateTypes';
import CandidatePipeline from './CandidatePipeline';
import CandidateProfilePage from './CandidateProfilePage';
import CreateCandidatePage from './CreateCandidatePage';
import StageTransitionModal from './StageTransitionModal';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import ModernSearchInput from '../../dashboard/shared/ModernSearchInput';
import DataTable from '../../dashboard/shared/DataTable';
import EnterpriseKpiAnalyticsModal from '../../dashboard/shared/EnterpriseKpiAnalyticsModal';
import ConfirmModal from '../../admin/shared/ConfirmModal';
import { useBreadcrumb } from '../../shared/BreadcrumbContext';

const CandidatesHub = ({ onNavigate: _onNavigate }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || 'var(--pw-brand)';
  const { addToast } = useToast();

  // Role-Based Access Control & Scope State (HM is strictly scoped to assigned REQ-2026-0001)
  const [currentRole, setCurrentRole] = useState(ATS_ROLES.ATS_ADMIN);
  const [userRequisitions] = useState(['REQ-2026-0001', 'REQ-2026-001']);

  // Navigation & Sub-views: 'hub' | 'profile' | 'create'
  const [currentView, setCurrentView] = useState('hub');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  // View mode: 'table' | 'board'
  const [viewMode, setViewMode] = useState('table');

  // Core Data State
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { extraCrumbs, setExtraCrumbs, clearExtraCrumbs } = useBreadcrumb();

  useEffect(() => {
    if (currentView === 'create') {
      setExtraCrumbs([{ label: 'Add Candidate' }]);
    } else if (currentView === 'profile' && selectedCandidateId) {
      const cand = candidates.find(c => c.id === selectedCandidateId);
      const name = cand ? `${cand.firstName} ${cand.lastName}` : 'Candidate Profile';
      setExtraCrumbs([{ label: name }]);
    } else if (currentView === 'hub') {
      clearExtraCrumbs();
    }
  }, [currentView, selectedCandidateId, candidates]);

  useEffect(() => {
    if (extraCrumbs.length === 0 && currentView !== 'hub') {
      setCurrentView('hub');
      setSelectedCandidateId(null);
    }
  }, [extraCrumbs]);

  // Pipeline Data State
  const [pipelineData, setPipelineData] = useState({ columns: {}, totalActive: 0, exceptionCounts: {} });

  // KPI Analytics
  const [kpiStats, setKpiStats] = useState({
    totalCandidates: 0,
    newCandidates: 0,
    activeApplications: 0,
    screeningPending: 0
  });

  // Search & Filter Dropdown States
  const [search, setSearch] = useState('');
  const [activePreset, setActivePreset] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');

  // Selection & Export
  const [selectedCandidatesForAction, setSelectedCandidatesForAction] = useState([]);

  // Modals
  const [stageModalData, setStageModalData] = useState(null); // { candidate, application }
  const [activeKpiGraphModal, setActiveKpiGraphModal] = useState(null);
  const [bulkDeletingCandidates, setBulkDeletingCandidates] = useState(null);

  // Handle KPI Click to filter preset AND open Real-time Graph Analytics modal
  const handleKpiClick = (stat) => {
    setActivePreset(stat.id);
    let modalRecords = candidates;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (stat.id === 'new') {
      modalRecords = candidates.filter(c => new Date(c.createdAt || 0) >= sevenDaysAgo);
    } else if (stat.id === 'active_apps') {
      modalRecords = candidates.filter(c => c.applicationsCount > 0 && c.status !== CANDIDATE_STATUS.ARCHIVED);
    } else if (stat.id === 'screening') {
      modalRecords = candidates.filter(c => c.currentStage === APPLICATION_STAGE.SCREENING);
    }
    setActiveKpiGraphModal({
      kpiId: stat.id,
      label: stat.label,
      records: modalRecords
    });
  };

  // Permissions
  const canCreate = hasPermission(currentRole, PERMISSIONS.CANDIDATE_CREATE);
  const canExport = hasPermission(currentRole, PERMISSIONS.CANDIDATE_EXPORT);
  const canArchive = hasPermission(currentRole, PERMISSIONS.CANDIDATE_ARCHIVE);

  // Fetch Candidates Data
  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await candidateService.getCandidates({
        page: 1,
        pageSize: 100, // retrieve scoped dataset for client-side sorting & preset tabs
        search: '',
        filters: {},
        sortBy: 'lastActivity',
        sortOrder: 'desc',
        userRole: currentRole,
        userRequisitions
      });

      setCandidates(res.data);

      const [kpiRes, pipeRes] = await Promise.all([
        candidateService.getKPIAnalytics(),
        candidateService.getPipelineData({
          requisitionId: 'All',
          recruiter: 'All',
          search,
          userRole: currentRole,
          userRequisitions
        })
      ]);

      setKpiStats(kpiRes);
      setPipelineData(pipeRes);
    } catch (err) {
      console.error('Error fetching candidates', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentRole, userRequisitions, search]);

  useEffect(() => {
    loadCandidates();

    const handleDataUpdate = () => {
      loadCandidates();
    };

    const handleNavigate = (e) => {
      if (e.detail?.candidateId) {
        setSelectedCandidateId(e.detail.candidateId);
        setCurrentView('profile');
      }
    };

    window.addEventListener('pw:candidate_created', handleDataUpdate);
    window.addEventListener('pw_candidate_created', handleDataUpdate);
    window.addEventListener('pw:application_created', handleDataUpdate);
    window.addEventListener('pw_db_updated', handleDataUpdate);
    window.addEventListener('pw:navigate_to_candidate', handleNavigate);

    return () => {
      window.removeEventListener('pw:candidate_created', handleDataUpdate);
      window.removeEventListener('pw_candidate_created', handleDataUpdate);
      window.removeEventListener('pw:application_created', handleDataUpdate);
      window.removeEventListener('pw_db_updated', handleDataUpdate);
      window.removeEventListener('pw:navigate_to_candidate', handleNavigate);
    };
  }, [loadCandidates]);

  // Handle Role change
  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    setSelectedStatus('All');
    setSelectedStage('All');
    setSelectedSource('All');
    setActivePreset('all');
    setSearch('');
  };

  // Live Count Badges per Filter Preset
  const presetCounts = useMemo(() => {
    const base = candidates;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return {
      all: base.length,
      new: base.filter(c => new Date(c.createdAt || 0) >= sevenDaysAgo).length,
      active_apps: base.filter(c => c.applicationsCount > 0 && c.status !== CANDIDATE_STATUS.ARCHIVED).length,
      screening: base.filter(c => c.currentStage === APPLICATION_STAGE.SCREENING).length,
      shortlisted: base.filter(c => c.currentStage === APPLICATION_STAGE.SHORTLISTED).length,
      interview: base.filter(c => c.currentStage === APPLICATION_STAGE.INTERVIEW).length,
      talent_pool: base.filter(c => !c.requisitionId || c.applicationsCount === 0).length,
      archived: base.filter(c => c.status === CANDIDATE_STATUS.ARCHIVED).length
    };
  }, [candidates]);

  // Filtered Candidates list based on activePreset, search, and dropdown filters
  const filteredCandidates = useMemo(() => {
    let result = candidates;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1. Preset filter
    if (activePreset === 'new') {
      result = result.filter(c => new Date(c.createdAt || 0) >= sevenDaysAgo);
    } else if (activePreset === 'active_apps') {
      result = result.filter(c => c.applicationsCount > 0 && c.status !== CANDIDATE_STATUS.ARCHIVED);
    } else if (activePreset === 'screening') {
      result = result.filter(c => c.currentStage === APPLICATION_STAGE.SCREENING);
    } else if (activePreset === 'shortlisted') {
      result = result.filter(c => c.currentStage === APPLICATION_STAGE.SHORTLISTED);
    } else if (activePreset === 'interview') {
      result = result.filter(c => c.currentStage === APPLICATION_STAGE.INTERVIEW);
    } else if (activePreset === 'talent_pool') {
      result = result.filter(c => !c.requisitionId || c.applicationsCount === 0);
    } else if (activePreset === 'archived') {
      result = result.filter(c => c.status === CANDIDATE_STATUS.ARCHIVED);
    }

    // 2. Text Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(c => 
        c.name?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q) ||
        c.candidateNumber?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.appliedRole?.toLowerCase().includes(q) ||
        c.requisitionId?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q)
      );
    }

    // 3. Dropdown Filters
    if (selectedStatus !== 'All') {
      result = result.filter(c => c.status === selectedStatus);
    }
    if (selectedStage !== 'All') {
      result = result.filter(c => c.currentStage === selectedStage);
    }
    if (selectedSource !== 'All') {
      result = result.filter(c => c.source?.toLowerCase().includes(selectedSource.toLowerCase()));
    }

    return result;
  }, [candidates, activePreset, search, selectedStatus, selectedStage, selectedSource]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedStatus('All');
    setSelectedStage('All');
    setSelectedSource('All');
    setActivePreset('all');
    setSearch('');
  };

  // CSV Export
  const handleExportCSV = () => {
    const toExport = selectedCandidatesForAction.length > 0 ? selectedCandidatesForAction : filteredCandidates;
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Candidate Number,Name,Email,Phone,Applied Role,Requisition,Current Stage,Match Score,Location,Recruiter"].join(",") + "\n"
      + toExport.map(c => 
        `"${c.candidateNumber || c.id}","${c.name}","${c.email}","${c.formattedPhone || c.phone || ''}","${c.appliedRole || ''}","${c.requisitionId || 'Talent Pool'}","${c.currentStage || ''}","${c.screeningScore ?? ''}","${c.location || ''}","${c.assignedRecruiter || ''}"`
      ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `candidates_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Bulk Delete Confirmation Popup
  const handleBulkArchiveRequest = (selectedItems) => {
    if (!selectedItems || selectedItems.length === 0) return;
    setBulkDeletingCandidates(selectedItems);
  };

  // Confirm Bulk Archive / Delete Action
  const confirmBulkDelete = async () => {
    if (!bulkDeletingCandidates || bulkDeletingCandidates.length === 0) return;
    try {
      const count = bulkDeletingCandidates.length;
      const idsToDelete = bulkDeletingCandidates.map(c => c.id);
      for (const item of bulkDeletingCandidates) {
        await candidateService.deleteCandidate(item.id);
      }
      setCandidates(prev => prev.filter(c => !idsToDelete.includes(c.id)));
      setSelectedCandidatesForAction([]);
      setBulkDeletingCandidates(null);
      loadCandidates();
      if (addToast) {
        addToast({
          title: 'Candidates Deleted',
          message: `${count} Candidate${count > 1 ? 's' : ''} deleted successfully.`,
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Error deleting candidates', err);
    }
  };

  // Confirm Stage Transition
  const handleConfirmStageTransition = async ({ applicationId, targetStage, reason, isOverride }) => {
    await candidateService.transitionStage({
      applicationId,
      targetStage,
      reason,
      isOverride,
      actor: currentRole === ATS_ROLES.HR_ADMIN ? 'HR Admin' : 'Lead Recruiter'
    });
    setStageModalData(null);
    loadCandidates();
  };

  // 4 KPI Cards definition matching RequisitionHub pattern
  const kpiCardsList = [
    {
      id: 'all',
      label: 'TOTAL CANDIDATES',
      value: kpiStats.totalCandidates,
      trend: '+12%',
      trendUp: true,
      subtitle: 'Master talent profiles registered in ATS',
      actionText: 'View Details →',
      updatedAt: '5m ago',
      icon: <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60'
    },
    {
      id: 'new',
      label: 'NEW CANDIDATES',
      value: kpiStats.newCandidates,
      trend: 'Sourcing',
      trendUp: true,
      subtitle: 'Added to repository within last 7 days',
      actionText: 'View Queue →',
      updatedAt: '10m ago',
      icon: <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60'
    },
    {
      id: 'active_apps',
      label: 'ACTIVE APPLICATIONS',
      value: kpiStats.activeApplications,
      trend: '+18% Velocity',
      trendUp: true,
      subtitle: 'Candidates actively progressing in funnels',
      actionText: 'View Pipeline →',
      updatedAt: '2h ago',
      icon: <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      iconBg: 'bg-purple-50 dark:bg-purple-950/60'
    },
    {
      id: 'screening',
      label: 'SCREENING PENDING',
      value: kpiStats.screeningPending,
      trend: 'Awaiting',
      trendUp: false,
      subtitle: 'Candidates awaiting recruiter assessment',
      actionText: 'Review Queue →',
      updatedAt: 'Just now',
      icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60'
    }
  ];

  // DataTable Columns definition matching RequisitionHub format
  const columns = [
    {
      header: 'Candidate',
      accessor: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-2.5 py-0.5">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
            style={{ backgroundColor: row.avatarBg || brandColor }}
          >
            {row.avatar || 'CD'}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[#0F172A] dark:text-white text-xs flex items-center gap-1.5 leading-snug whitespace-nowrap">
              <span className="hover:underline">{val}</span>
              {row.applicationsCount > 1 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  {row.applicationsCount} Reqs
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 truncate mt-0.5 whitespace-nowrap">
              <span>{row.email}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Phone Number',
      accessor: 'phone',
      align: 'center',
      render: (val, row) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {row.formattedPhone || val || '—'}
        </span>
      )
    },
    {
      header: 'Candidate ID',
      accessor: 'candidateNumber',
      align: 'center',
      render: (val, row) => (
        <div className="flex justify-center">
          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded whitespace-nowrap border border-slate-200/60 dark:border-slate-700/60">
            {val || row.id}
          </span>
        </div>
      )
    },
    {
      header: 'Applied Role & Req',
      accessor: 'appliedRole',
      align: 'left',
      render: (val, row) => (
        <div className="py-0.5 whitespace-nowrap">
          <div className="text-xs font-semibold text-[#0F172A] dark:text-slate-100 truncate max-w-[200px]">
            {val}
          </div>
          {row.requisitionId ? (
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
              {row.requisitionId}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Talent Pool</span>
          )}
        </div>
      )
    },
    {
      header: 'Source',
      accessor: 'source',
      align: 'center',
      render: (val) => (
        <div className="flex justify-center">
          <span className="text-xs font-medium text-[#475569] dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap">
            {val}
          </span>
        </div>
      )
    },
    {
      header: 'Current Stage',
      accessor: 'currentStage',
      align: 'center',
      render: (val) => {
        let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
        let dotColor = 'bg-slate-500';
        if (val === 'Hired') {
          colorClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
          dotColor = 'bg-emerald-500';
        } else if (val === 'Offer') {
          colorClass = 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
          dotColor = 'bg-cyan-500';
        } else if (val === 'Interview') {
          colorClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
          dotColor = 'bg-amber-500';
        } else if (val === 'Shortlisted') {
          colorClass = 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
          dotColor = 'bg-purple-500';
        } else if (val === 'Screening') {
          colorClass = 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800';
          dotColor = 'bg-sky-500';
        } else if (val === 'Rejected') {
          colorClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
          dotColor = 'bg-rose-500';
        }

        return (
          <div className="flex justify-center">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 w-fit whitespace-nowrap ${colorClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              <span>{val}</span>
            </span>
          </div>
        );
      }
    },
    {
      header: 'Match Score',
      accessor: 'screeningScore',
      align: 'center',
      render: (score) => {
        if (score === null || score === undefined) return <span className="text-slate-400 text-xs">—</span>;
        const color = score >= 85 ? '#10b981' : score >= 70 ? '#3b82f6' : '#f59e0b';
        return (
          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
            <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
            </div>
            <span className="font-mono text-xs font-bold" style={{ color }}>{score}%</span>
          </div>
        );
      }
    },
    {
      header: 'Experience',
      accessor: 'experienceDisplay',
      align: 'center',
      render: (val, row) => (
        <div className="flex flex-col items-center justify-center whitespace-nowrap">
          <div className="font-semibold text-xs text-[#0F172A] dark:text-slate-200">
            {val || `${row.totalExperience || 0} yrs`}
          </div>
          {row.currentCompany && (
            <div className="text-[11px] text-[#64748B] dark:text-slate-400">
              {row.currentCompany}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'location',
      align: 'center',
      render: (val) => (
        <span className="text-xs text-[#475569] dark:text-slate-300 whitespace-nowrap">
          {val}
        </span>
      )
    },
    {
      header: 'Assigned Recruiter',
      accessor: 'assignedRecruiter',
      align: 'center',
      render: (name) => (
        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
          <div className="w-5.5 h-5.5 rounded-full bg-[#E2E8F0] dark:bg-slate-700 text-[#475569] dark:text-slate-200 text-[10px] font-medium flex items-center justify-center shrink-0">
            {name ? name.split(' ').map(n => n[0]).join('') : 'U'}
          </div>
          <span className="text-xs font-medium text-[#0F172A] dark:text-slate-200">{name}</span>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      align: 'center',
      isStickyRight: true,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="Inspect Candidate"
            onClick={() => { setSelectedCandidateId(row.id); setCurrentView('profile'); }}
            className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <Eye size={13.5} />
          </button>
          {row.primaryApplication ? (
            <button
              type="button"
              title="Advance Stage"
              onClick={() => setStageModalData({ candidate: row, application: row.primaryApplication })}
              className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            >
              <ArrowRight size={13.5} />
            </button>
          ) : (
            <button
              type="button"
              title="Associate Requisition (Talent Pool)"
              onClick={() => { setSelectedCandidateId(row.id); setCurrentView('profile'); }}
              className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:border-amber-200 dark:hover:border-amber-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            >
              <Briefcase size={13.5} />
            </button>
          )}
          {canArchive && (
            <button
              type="button"
              title="Delete Candidate"
              onClick={() => handleBulkArchiveRequest([row])}
              className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            >
              <Trash2 size={13.5} />
            </button>
          )}
        </div>
      )
    }
  ];

  // If in Create Candidate view
  if (currentView === 'create') {
    return (
      <CreateCandidatePage
        onBack={() => {
          setCurrentView('hub');
          loadCandidates();
        }}
        onCandidateCreated={(_newCandidate) => {
          setCurrentView('hub');
          loadCandidates();
        }}
        brandColor={brandColor}
      />
    );
  }

  // If in Candidate Profile view
  if (currentView === 'profile' && selectedCandidateId) {
    return (
      <>
        <CandidateProfilePage
          candidateId={selectedCandidateId}
          onBack={() => {
            setCurrentView('hub');
            setSelectedCandidateId(null);
            loadCandidates();
          }}
          onOpenStageTransition={(cand, app) => setStageModalData({ candidate: cand, application: app })}
          brandColor={brandColor}
          userRole={currentRole}
          userRequisitions={userRequisitions}
        />

        {/* Stage Transition Modal (Live in Candidate Profile) */}
        {stageModalData && (
          <StageTransitionModal
            isOpen={true}
            candidate={stageModalData.candidate}
            application={stageModalData.application}
            onClose={() => setStageModalData(null)}
            onConfirmTransition={handleConfirmStageTransition}
            userRole={currentRole}
          />
        )}
      </>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-6 text-start">
      
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP GLASSMORPHIC CONTAINER HEADER (MATCHING REQUISITION HUB)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4.5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-3.5 font-sans relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
          
          {/* Title & Subtitle */}
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl text-white bg-[var(--pw-brand)] shadow-sm flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Candidates Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Operational
                </span>
              </div>
              <p className="text-xs text-slate-500/90 dark:text-slate-400 mt-0.5">
                Manage candidate talent pool, applications, and recruitment pipeline
              </p>
            </div>
          </div>

          {/* Role Selector & Primary CTA Cluster */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <CustomSelect
              prefix="Role: "
              value={currentRole}
              onChange={(val) => handleRoleChange(val)}
              options={[
                { label: 'Recruiter', value: ATS_ROLES.RECRUITER },
                { label: 'Hiring Manager', value: ATS_ROLES.HIRING_MANAGER },
                { label: 'HR Admin', value: ATS_ROLES.HR_ADMIN },
                { label: 'ATS Admin', value: ATS_ROLES.ATS_ADMIN }
              ]}
              size="sm"
              className="w-48"
            />

            {canCreate && (
              <motion.button 
                onClick={() => setCurrentView('create')}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="h-9.5 px-4.5 text-xs font-extrabold text-white bg-[var(--pw-brand)] shadow-md shadow-[var(--pw-brand)]/20 hover:brightness-110 rounded-xl border border-white/20 flex items-center gap-2 shrink-0 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                <Plus size={16} strokeWidth={2.5} /> 
                <span>Add Candidate</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. 4 FROSTED GLASS KPI CARDS (MATCHING REQUISITION HUB)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiCardsList.map((stat, idx) => {
          return (
            <motion.div 
              key={stat.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 + 0.1 }}
              whileHover={{ y: -3 }}
              onClick={() => handleKpiClick(stat)}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleKpiClick(stat);
                  }}
                  className="font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform hover:underline cursor-pointer" 
                  style={{ color: brandColor }}
                >
                  {stat.actionText} 📊
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. UNIFIED GLASSMORPHIC WORKSPACE CANVAS (MATCHING REQUISITION HUB)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="bg-gradient-to-br from-white/70 via-white/65 to-blue-50/30 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl shadow-[0_8px_30px_rgba(26,86,219,0.04)] font-sans space-y-0 relative z-10 overflow-hidden"
      >
        
        {/* CANVAS TOOLBAR: TABS + COMMAND SEARCH + FILTERS */}
        <div className="p-3.5 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md space-y-3">
          
          {/* Level 1: Segmented Pill Preset Navigation Tabs + Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: 'all', label: 'All Scoped Candidates', count: presetCounts.all },
                { id: 'active_apps', label: 'Active Applications', count: presetCounts.active_apps },
                { id: 'screening', label: 'Screening Pending', count: presetCounts.screening },
                { id: 'shortlisted', label: 'Shortlisted', count: presetCounts.shortlisted },
                { id: 'interview', label: 'Interview Stage', count: presetCounts.interview },
                { id: 'talent_pool', label: 'Talent Pool', count: presetCounts.talent_pool },
                { id: 'archived', label: 'Archived', count: presetCounts.archived }
              ].map(p => {
                const isActive = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePreset(p.id)}
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
                    <span>{p.label}</span>
                    <span 
                      className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetFilters}
              className="h-8 px-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 shrink-0 transition-all shadow-2xs cursor-pointer group"
            >
              <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                <RefreshCw size={12} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
              </motion.div>
              <span>Reset Filters</span>
            </motion.button>
          </div>

          {/* Level 2: Command Search + Dropdown Filters + View Switcher */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
            <ModernSearchInput 
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder="Filter candidates by Name, ID, Email, Role, or Requisition..."
              className="max-w-md"
            />

            <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end w-full md:w-auto">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 w-full sm:w-auto">
                <CustomSelect 
                  prefix="Status: "
                  value={selectedStatus}
                  onChange={(val) => setSelectedStatus(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Active', value: 'Active' },
                    { label: 'Hired', value: 'Hired' },
                    { label: 'Archived', value: 'Archived' }
                  ]}
                  size="sm"
                  className="w-36"
                />

                <CustomSelect 
                  prefix="Stage: "
                  value={selectedStage}
                  onChange={(val) => setSelectedStage(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Applied', value: 'Applied' },
                    { label: 'Screening', value: 'Screening' },
                    { label: 'Shortlisted', value: 'Shortlisted' },
                    { label: 'Interview', value: 'Interview' },
                    { label: 'Offer', value: 'Offer' },
                    { label: 'Hired', value: 'Hired' }
                  ]}
                  size="sm"
                  className="w-38"
                />

                <CustomSelect 
                  prefix="Source: "
                  value={selectedSource}
                  onChange={(val) => setSelectedSource(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Careers Portal', value: 'Careers Portal' },
                    { label: 'LinkedIn', value: 'LinkedIn' },
                    { label: 'Naukri.com', value: 'Naukri' },
                    { label: 'Referral', value: 'Referral' }
                  ]}
                  size="sm"
                  className="w-36"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {canExport && (
                  <motion.button 
                    whileHover={{ scale: 1.03, y: -0.5 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleExportCSV}
                    title={selectedCandidatesForAction.length > 0 ? `Export ${selectedCandidatesForAction.length} Selected Candidates` : "Export CSV"}
                    style={selectedCandidatesForAction.length > 0 ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                    className={`h-8.5 px-3.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs font-sans cursor-pointer group rounded-xl border ${
                      selectedCandidatesForAction.length > 0 
                        ? 'text-white shadow-md' 
                        : 'text-slate-700 dark:text-slate-200 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-md border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400/80 dark:hover:border-blue-500/80'
                    }`}
                  >
                    <motion.div whileHover={{ y: 1 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.4 }}>
                      <Download size={13} className={selectedCandidatesForAction.length > 0 ? 'text-white' : 'text-blue-500 group-hover:text-blue-600 transition-colors'} />
                    </motion.div>
                    <span>{selectedCandidatesForAction.length > 0 ? `Export (${selectedCandidatesForAction.length})` : 'Export'}</span>
                  </motion.button>
                )}

                {/* View Switcher Glass Container with Spring Pill Slide */}
                <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner relative">
                  <button 
                    onClick={() => setViewMode('table')}
                    style={viewMode === 'table' ? { color: brandColor } : {}}
                    className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 font-sans cursor-pointer relative z-10 ${
                      viewMode === 'table' ? 'font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutTemplate size={13} style={viewMode === 'table' ? { color: brandColor } : {}} className={viewMode === 'table' ? '' : 'text-slate-400'} />
                    <span>Grid</span>
                    {viewMode === 'table' && (
                      <motion.div 
                        layoutId="activeCandidateViewPill"
                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600/60 -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                  <button 
                    onClick={() => setViewMode('board')}
                    style={viewMode === 'board' ? { color: brandColor } : {}}
                    className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 font-sans cursor-pointer relative z-10 ${
                      viewMode === 'board' ? 'font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Columns size={13} style={viewMode === 'board' ? { color: brandColor } : {}} className={viewMode === 'board' ? '' : 'text-slate-400'} />
                    <span>Board</span>
                    {viewMode === 'board' && (
                      <motion.div 
                        layoutId="activeCandidateViewPill"
                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600/60 -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Level 3: Main Grid or Kanban Board */}
        {viewMode === 'table' ? (
          <DataTable 
            title="Candidates Data Grid"
            columns={columns}
            data={filteredCandidates}
            selectable={true}
            borderless={true}
            onRowClick={(row) => { setSelectedCandidateId(row.id); setCurrentView('profile'); }}
            onInspect={(row) => { setSelectedCandidateId(row.id); setCurrentView('profile'); }}
            onSelectionChange={(selectedItems) => setSelectedCandidatesForAction(selectedItems)}
            onDeleteSelected={(selectedItems) => handleBulkArchiveRequest(selectedItems)}
          />
        ) : (
          <CandidatePipeline 
            pipelineData={pipelineData}
            onOpenProfile={(cand) => { setSelectedCandidateId(cand.id); setCurrentView('profile'); }}
            onOpenStageTransition={(cand, app) => setStageModalData({ candidate: cand, application: app })}
            brandColor={brandColor}
            isLoading={isLoading}
          />
        )}
      </motion.div>


      {/* Stage Transition Modal */}
      {stageModalData && (
        <StageTransitionModal
          isOpen={true}
          candidate={stageModalData.candidate}
          application={stageModalData.application}
          onClose={() => setStageModalData(null)}
          onConfirmTransition={handleConfirmStageTransition}
          userRole={currentRole}
        />
      )}

      {/* 10/10 Enterprise KPI Real-Time Analytics System Modal */}
      {activeKpiGraphModal && (
        <EnterpriseKpiAnalyticsModal
          isOpen={!!activeKpiGraphModal}
          onClose={() => setActiveKpiGraphModal(null)}
          kpiId={activeKpiGraphModal.kpiId}
          kpiLabel={activeKpiGraphModal.label}
          kpiValue={activeKpiGraphModal.records?.length || candidates.length}
          moduleType="candidates"
          rawRecords={activeKpiGraphModal.records || candidates}
        />
      )}

      {/* Bulk Delete / Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={!!bulkDeletingCandidates && bulkDeletingCandidates.length > 0}
        onClose={() => setBulkDeletingCandidates(null)}
        title="Delete / Archive Selected Candidates"
        message={`Are you sure you want to delete / archive ${bulkDeletingCandidates?.length || 0} selected candidate record(s) (${bulkDeletingCandidates?.map(c => c.name).join(', ')})? This action cannot be undone.`}
        confirmText={`Delete ${bulkDeletingCandidates?.length || 0} Candidate(s)`}
        onConfirm={confirmBulkDelete}
        brandColor={brandColor}
      />
    </div>
  );
};

export default CandidatesHub;
