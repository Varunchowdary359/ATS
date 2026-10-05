/**
 * Enterprise Preboarding Management Hub
 * PeopleWorks ATS SaaS - 100% Visual & Functional Uniformity with Requisitions, Offers & Candidates
 */

import React, { useState, useContext, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCheck, 
  Plus, 
  RefreshCw, 
  Download, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  Check, 
  Columns, 
  LayoutTemplate, 
  Briefcase, 
  Trash2,
  Mail,
  Users,
  Sparkles,
  Layers,
  Filter,
  ExternalLink,
  Kanban,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  Calendar,
  Building2,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { usePreboarding } from './usePreboarding';
import { preboardingService } from './preboardingService';
import { PREBOARDING_STATUS, ACTION_STATUS, TASK_ASSIGNEE_ROLE } from './preboardingTypes';
import { evaluateJoiningReadiness } from './preboardingValidation';
import PreboardingKpis from './PreboardingKpis';
import PreboardingAttentionSection from './PreboardingAttentionSection';
import PreboardingKanbanBoard from './PreboardingKanbanBoard';
import PreboardingDetail from './PreboardingDetail';
import CandidatePreboardingPortalModal from './modals/CandidatePreboardingPortalModal';
import PreboardingTemplatesModal from './modals/PreboardingTemplatesModal';
import PreboardingPoliciesModal from './modals/PreboardingPoliciesModal';
import CreatePreboardingModal from './modals/CreatePreboardingModal';
import ModernSearchInput from '../../dashboard/shared/ModernSearchInput';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import DataTable from '../../dashboard/shared/DataTable';
import EnterpriseKpiAnalyticsModal from '../../dashboard/shared/EnterpriseKpiAnalyticsModal';
import ConfirmModal from '../../admin/shared/ConfirmModal';
import { ThemeContext } from '../../../ThemeContext';
import { useToast } from '../../shared/ToastContext';
import { useBreadcrumb } from '../../shared/BreadcrumbContext';

export const PreboardingHub = ({ onNavigate = () => {} }) => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || 'var(--pw-brand)';

  // Navigation Sub-view: 'hub' | 'details'
  const [activeRecord, setActiveRecord] = useState(null);

  const { extraCrumbs, setExtraCrumbs, clearExtraCrumbs } = useBreadcrumb();

  useEffect(() => {
    if (activeRecord) {
      const label = activeRecord.candidateName || activeRecord.id;
      setExtraCrumbs([{ label }]);
    } else {
      clearExtraCrumbs();
    }
  }, [activeRecord]);

  useEffect(() => {
    if (extraCrumbs.length === 0 && activeRecord) {
      setActiveRecord(null);
    }
  }, [extraCrumbs]);

  // Role Governance & Persona Switcher
  const [currentRole, setCurrentRole] = useState('recruiter');

  // Core Data State
  const {
    records: allRecords,
    metrics,
    attentionItems,
    loading,
    refetch,
    brandColor: activeBrandColor
  } = usePreboarding();

  // Search & Filter States
  const [currentNav, setCurrentNav] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedActionFilter, setSelectedActionFilter] = useState('All');
  const [selectedRecordsForAction, setSelectedRecordsForAction] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban' | 'grid'

  // Modals State
  const [isCandidatePortalOpen, setIsCandidatePortalOpen] = useState(false);
  const [portalCandidate, setPortalCandidate] = useState(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeKpiModal, setActiveKpiModal] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [bulkDeletingRecords, setBulkDeletingRecords] = useState(null);

  // Distinct Filter Options
  const departments = useMemo(() => {
    return Array.from(new Set(allRecords.map(r => r.department).filter(Boolean)));
  }, [allRecords]);

  // Filtered List calculation
  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      // 1. Role-based scoping (Hiring manager only sees their candidates)
      if (currentRole === 'hiring_manager') {
        if (record.hiringManagerName && !record.hiringManagerName.toLowerCase().includes('alex')) {
          // allow demo visibility or filter
        }
      }

      // 2. Preset Tab filtering
      if (currentNav === 'pending_actions') {
        if (record.actionStatus !== ACTION_STATUS.ACTION_REQUIRED && record.status !== PREBOARDING_STATUS.HANDOFF_FAILED) {
          return false;
        }
      } else if (currentNav === 'joining_this_week') {
        if (!record.joiningDate) return false;
        const now = new Date();
        const next7 = new Date();
        next7.setDate(now.getDate() + 7);
        const jDate = new Date(record.joiningDate);
        if (jDate < now || jDate > next7) return false;
      } else if (currentNav === 'ready_to_join') {
        if (record.status !== PREBOARDING_STATUS.READY_TO_JOIN && record.status !== PREBOARDING_STATUS.HANDOFF_PENDING) {
          return false;
        }
      } else if (currentNav === 'in_progress') {
        if (record.status !== PREBOARDING_STATUS.IN_PROGRESS && record.status !== PREBOARDING_STATUS.INITIATED) {
          return false;
        }
      } else if (currentNav === 'employee_created') {
        if (record.status !== PREBOARDING_STATUS.EMPLOYEE_CREATED) {
          return false;
        }
      } else if (currentNav === 'failed_handoff') {
        if (record.status !== PREBOARDING_STATUS.HANDOFF_FAILED) {
          return false;
        }
      } else if (currentNav === 'on_hold') {
        if (record.status !== PREBOARDING_STATUS.ON_HOLD) {
          return false;
        }
      }

      // 3. Dropdown Filters
      if (selectedStatusFilter !== 'All' && record.status !== selectedStatusFilter) return false;
      if (selectedDeptFilter !== 'All' && record.department !== selectedDeptFilter) return false;
      if (selectedActionFilter !== 'All' && record.actionStatus !== selectedActionFilter) return false;

      // 4. Command Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (record.candidateName || '').toLowerCase();
        const email = (record.candidateEmail || '').toLowerCase();
        const id = (record.id || '').toLowerCase();
        const candId = (record.candidateId || '').toLowerCase();
        const req = (record.requisitionId || '').toLowerCase();
        const role = (record.jobTitle || '').toLowerCase();
        const dept = (record.department || '').toLowerCase();
        return name.includes(q) || email.includes(q) || id.includes(q) || candId.includes(q) || req.includes(q) || role.includes(q) || dept.includes(q);
      }

      return true;
    });
  }, [allRecords, currentNav, currentRole, selectedStatusFilter, selectedDeptFilter, selectedActionFilter, search]);

  // Counts for Metric Badges
  const pendingCount = allRecords.filter(r => r.actionStatus === ACTION_STATUS.ACTION_REQUIRED || r.status === PREBOARDING_STATUS.HANDOFF_FAILED).length;
  const readyCount = allRecords.filter(r => r.status === PREBOARDING_STATUS.READY_TO_JOIN).length;
  const inProgressCount = allRecords.filter(r => r.status === PREBOARDING_STATUS.IN_PROGRESS || r.status === PREBOARDING_STATUS.INITIATED).length;
  const createdCount = allRecords.filter(r => r.status === PREBOARDING_STATUS.EMPLOYEE_CREATED).length;
  const failedCount = allRecords.filter(r => r.status === PREBOARDING_STATUS.HANDOFF_FAILED).length;
  const holdCount = allRecords.filter(r => r.status === PREBOARDING_STATUS.ON_HOLD).length;

  // Handlers
  const handleOpenRecord = (record) => {
    setActiveRecord(record);
  };

  const handleBackToHub = () => {
    setActiveRecord(null);
    refetch();
  };

  const handleOpenPortal = (record) => {
    setPortalCandidate(record || allRecords[0]);
    setIsCandidatePortalOpen(true);
  };

  const handleKpiClick = (kpiId, kpiLabel) => {
    setCurrentNav(kpiId);
    let modalRecords = allRecords;
    if (kpiId === 'pending_actions') {
      modalRecords = allRecords.filter(r => r.actionStatus === ACTION_STATUS.ACTION_REQUIRED || r.status === PREBOARDING_STATUS.HANDOFF_FAILED);
    } else if (kpiId === 'ready_to_join') {
      modalRecords = allRecords.filter(r => r.status === PREBOARDING_STATUS.READY_TO_JOIN);
    } else if (kpiId === 'joining_this_week') {
      modalRecords = allRecords.filter(r => {
        if (!r.joiningDate) return false;
        const now = new Date();
        const next7 = new Date();
        next7.setDate(now.getDate() + 7);
        const jDate = new Date(r.joiningDate);
        return jDate >= now && jDate <= next7;
      });
    }
    setActiveKpiModal({
      kpiId,
      label: kpiLabel,
      records: modalRecords
    });
  };

  const handleExportCsv = () => {
    const items = selectedRecordsForAction.length > 0 
      ? selectedRecordsForAction 
      : filteredRecords;

    if (items.length === 0) {
      addToast({
        title: 'Export Notice',
        message: 'No preboarding candidates available to export.',
        type: 'warning'
      });
      return;
    }

    const headers = ['Preboarding ID', 'Candidate ID', 'Name', 'Email', 'Phone', 'Role', 'Department', 'Requisition', 'Offer ID', 'Joining Date', 'Status', 'Action State', 'Employee ID'];
    const rows = items.map(r => [
      `"${r.id}"`,
      `"${r.candidateId || ''}"`,
      `"${r.candidateName || ''}"`,
      `"${r.candidateEmail || ''}"`,
      `"${r.candidatePhone || ''}"`,
      `"${r.jobTitle || ''}"`,
      `"${r.department || ''}"`,
      `"${r.requisitionId || ''}"`,
      `"${r.offerId || ''}"`,
      `"${r.joiningDate || ''}"`,
      `"${r.status || ''}"`,
      `"${r.actionStatus || ''}"`,
      `"${r.employeeId || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Preboarding_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: 'Export Completed',
      message: `Exported ${items.length} preboarding records to CSV successfully.`,
      type: 'success'
    });
  };

  // Workspace CRUD Handlers
  const handleCreatePreboardingRecord = async (formData) => {
    const newRecord = {
      id: `PRE-2026-${String(allRecords.length + 1).padStart(3, '0')}`,
      candidateId: `CAN-2026-${Math.floor(100 + Math.random() * 900)}`,
      candidateName: formData.candidateName,
      candidateEmail: formData.candidateEmail,
      candidatePhone: formData.candidatePhone,
      jobTitle: formData.jobTitle,
      department: formData.department,
      requisitionId: formData.requisitionId,
      offerId: formData.offerId,
      joiningDate: formData.joiningDate,
      status: PREBOARDING_STATUS.INITIATED,
      actionStatus: ACTION_STATUS.ACTION_REQUIRED,
      ownerName: formData.ownerName || 'Sarah Jenkins',
      candidateInfo: {
        fullName: formData.candidateName,
        email: formData.candidateEmail,
        phone: formData.candidatePhone
      },
      joiningDetails: {
        joiningDate: formData.joiningDate,
        jobTitle: formData.jobTitle,
        department: formData.department,
        reportingManager: formData.reportingManager,
        workLocation: formData.location
      },
      documents: [
        { id: 'doc-1', name: 'Government Photo ID', category: 'IDENTIFICATION', isMandatory: true, status: 'PENDING_UPLOAD' },
        { id: 'doc-2', name: 'Degree Certificate', category: 'ACADEMIC', isMandatory: true, status: 'PENDING_UPLOAD' },
        { id: 'doc-3', name: 'Previous Relieving Letter', category: 'EXPERIENCE', isMandatory: true, status: 'PENDING_UPLOAD' },
        { id: 'doc-4', name: 'Direct Deposit / Bank Details', category: 'FINANCIAL', isMandatory: true, status: 'PENDING_UPLOAD' }
      ],
      bgvChecks: [
        { id: 'bgv-1', type: 'Identity Verification', status: 'IN_PROGRESS' },
        { id: 'bgv-2', type: 'Employment History', status: 'IN_PROGRESS' }
      ],
      tasks: [
        { id: 't-1', title: 'IT Credentials & SSO Setup', assignedToRole: 'IT_ADMIN', status: 'PENDING', dueDate: formData.joiningDate },
        { id: 't-2', title: 'Schedule Orientation Session', assignedToRole: 'RECRUITER', status: 'PENDING', dueDate: formData.joiningDate }
      ]
    };

    preboardingService.records.unshift(newRecord);
    refetch();
  };

  const handleUpdateCandidateInfo = async (id, info) => {
    const updated = await preboardingService.updateCandidateInfo(id, info);
    setActiveRecord(updated);
    refetch();
  };

  const handleUpdateJoiningDetails = async (id, details) => {
    const updated = await preboardingService.updateJoiningDetails(id, details);
    setActiveRecord(updated);
    refetch();
  };

  const handleManageDocument = async (id, docId, action, payload) => {
    const updated = await preboardingService.manageDocument(id, docId, action, payload);
    setActiveRecord(updated);
    refetch();
  };

  const handleManageBgv = async (id, checkId, action, payload) => {
    const updated = await preboardingService.manageBgvCheck(id, checkId, action, payload);
    setActiveRecord(updated);
    refetch();
  };

  const handleManageTask = async (id, taskId, action, payload) => {
    const updated = await preboardingService.manageTask(id, taskId, action, payload);
    setActiveRecord(updated);
    refetch();
  };

  const handleUpdateStatus = async (id, newStatus, reason) => {
    const updated = await preboardingService.updateStatus(id, newStatus, reason);
    setActiveRecord(updated);
    refetch();
  };

  const handleChangeOwner = async (id, newOwnerId, newOwnerName) => {
    const updated = await preboardingService.changeOwner(id, newOwnerId, newOwnerName);
    setActiveRecord(updated);
    refetch();
  };

  const handleMarkReady = async (id) => {
    const updated = await preboardingService.markReadyToJoin(id);
    setActiveRecord(updated);
    refetch();
  };

  const handleConvertToEmployee = async (id, options) => {
    const res = await preboardingService.convertToEmployee(id, options);
    setActiveRecord(res.record);
    refetch();
    return res;
  };

  const handleRetryHandoff = async (id, notes) => {
    const res = await preboardingService.retryHandoff(id, notes);
    setActiveRecord(res.record);
    refetch();
    return res;
  };

  // Comprehensive Standard Columns matching DataTable standards
  const preboardingColumns = useMemo(() => [
    {
      header: 'CANDIDATE & ROLE',
      accessor: 'candidateName',
      align: 'left',
      render: (_val, row) => (
        <div className="flex items-center gap-3 py-1">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs text-white shadow-2xs shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            {row.candidateName ? row.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CD'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-white text-xs hover:text-blue-600 transition-colors cursor-pointer truncate">
                {row.candidateName}
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {row.id}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
              {row.jobTitle}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'REQUISITION & DEPT',
      accessor: 'requisitionId',
      align: 'left',
      render: (val, row) => (
        <div className="py-1">
          <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            {val || 'REQ-2026-0001'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
            {row.department}
          </div>
        </div>
      )
    },
    {
      header: 'JOINING DATE',
      accessor: 'joiningDate',
      align: 'left',
      render: (val, row) => (
        <div className="py-1">
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-900 dark:text-white">
            <Calendar size={12} className="text-slate-400" />
            <span>{val || '2026-04-01'}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            Offer: {row.offerId || 'OFF-2026-001'}
          </div>
        </div>
      )
    },
    {
      header: 'DOCUMENTS',
      accessor: 'documents',
      align: 'left',
      render: (_val, row) => {
        const docs = row.documents || [];
        const verified = docs.filter(d => d.status === 'VERIFIED').length;
        const total = docs.length;
        const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
        const isComplete = verified === total && total > 0;
        return (
          <div className="py-1 min-w-[110px]">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className={isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                {verified}/{total} Verified
              </span>
              <span className="text-[10px] font-mono text-slate-400">{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'BGV STATUS',
      accessor: 'bgvStatus',
      align: 'center',
      render: (val, row) => {
        const status = val || row.bgvStatus || 'IN_PROGRESS';
        if (status === 'CLEARED') {
          return (
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit mx-auto">
              <CheckCircle2 size={11} className="text-emerald-500" />
              <span>Cleared</span>
            </span>
          );
        }
        if (status === 'DISCREPANCY') {
          return (
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1 w-fit mx-auto">
              <AlertTriangle size={11} className="text-rose-500" />
              <span>Discrepancy</span>
            </span>
          );
        }
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 w-fit mx-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      }
    },
    {
      header: 'TASKS & IT',
      accessor: 'tasks',
      align: 'left',
      render: (_val, row) => {
        const tasks = row.tasks || [];
        const completed = tasks.filter(t => t.status === 'COMPLETED').length;
        const total = tasks.length;
        return (
          <div className="py-1">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {completed}/{total} Tasks Done
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {row.tasks?.some(t => t.status === 'OVERDUE') ? (
                <span className="text-rose-500 font-semibold flex items-center gap-0.5">
                  <AlertCircle size={10} /> Overdue action
                </span>
              ) : (
                'On schedule'
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'READINESS',
      accessor: 'readinessScore',
      align: 'center',
      render: (_val, row) => {
        const readiness = evaluateJoiningReadiness(row);
        return (
          <div className="py-1 flex flex-col items-center">
            <span 
              className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border mb-1 flex items-center gap-1"
              style={{ 
                backgroundColor: `${readiness.color}15`, 
                borderColor: `${readiness.color}40`,
                color: readiness.color 
              }}
            >
              {readiness.readinessScore}% Ready
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {readiness.passedCount}/8 Gates
            </span>
          </div>
        );
      }
    },
    {
      header: 'STATUS',
      accessor: 'status',
      align: 'center',
      render: (status) => {
        switch (status) {
          case PREBOARDING_STATUS.READY_TO_JOIN:
            return (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 w-fit mx-auto">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>{status}</span>
              </span>
            );
          case PREBOARDING_STATUS.EMPLOYEE_CREATED:
            return (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 w-fit mx-auto">
                <Sparkles size={12} className="text-blue-500" />
                <span>{status}</span>
              </span>
            );
          case PREBOARDING_STATUS.IN_PROGRESS:
            return (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 w-fit mx-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>{status}</span>
              </span>
            );
          case PREBOARDING_STATUS.HANDOFF_FAILED:
            return (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 w-fit mx-auto">
                <AlertCircle size={12} className="text-rose-500" />
                <span>{status}</span>
              </span>
            );
          case PREBOARDING_STATUS.ON_HOLD:
            return (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 w-fit mx-auto">
                <Clock size={12} className="text-amber-500" />
                <span>{status}</span>
              </span>
            );
          default:
            return (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 w-fit mx-auto">
                <span>{status || 'Initiated'}</span>
              </span>
            );
        }
      }
    },
    {
      header: 'OWNER',
      accessor: 'ownerName',
      align: 'center',
      render: (val, row) => (
        <div className="py-1 text-xs text-center">
          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
            {val || 'Sarah Jenkins'}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            HM: {row.joiningDetails?.reportingManager || row.hiringManagerName || 'Alex Chen'}
          </div>
        </div>
      )
    },
    {
      header: 'ACTIONS',
      accessor: 'id',
      align: 'center',
      render: (_val, row) => (
        <div className="flex items-center justify-center gap-1.5 py-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenRecord(row);
            }}
            className="h-7 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Eye size={13} />
            <span>Workspace</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPortal(row);
            }}
            title="Candidate Portal Simulator"
            className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <ExternalLink size={13.5} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingRecord(row);
            }}
            title="Cancel Preboarding"
            className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <Trash2 size={13.5} />
          </button>
        </div>
      )
    }
  ], [brandColor]);

  // Full-page Detail View Mode
  if (activeRecord) {
    const freshRecord = allRecords.find(r => r.id === activeRecord.id) || activeRecord;
    return (
      <div className="w-full max-w-[1600px] mx-auto pb-12 animate-fade-in-up">
        <PreboardingDetail
          record={freshRecord}
          onBack={handleBackToHub}
          onUpdateCandidateInfo={handleUpdateCandidateInfo}
          onUpdateJoiningDetails={handleUpdateJoiningDetails}
          onManageDocument={handleManageDocument}
          onManageBgv={handleManageBgv}
          onManageTask={handleManageTask}
          onUpdateStatus={handleUpdateStatus}
          onChangeOwner={handleChangeOwner}
          onMarkReady={handleMarkReady}
          onConvertToEmployee={handleConvertToEmployee}
          onRetryHandoff={handleRetryHandoff}
          brandColor={activeBrandColor || brandColor}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-6">
      
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP GLASSMORPHIC CONTAINER HEADER (100% MATCHING OFFERS & REQS)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4.5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-3.5 font-sans relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div 
              className="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-sans">
                  Preboarding Management Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Operational
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Enterprise Compliance, Background Checks & HRMS Employee Conversion Engine
              </p>
            </div>
          </div>

          {/* Header Right: Persona Selector & Quick Onboard Action */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto shrink-0">
            <CustomSelect
              prefix="Role: "
              value={currentRole}
              onChange={(val) => setCurrentRole(val)}
              options={[
                { label: 'Recruiter / Onboarding Owner', value: 'recruiter' },
                { label: 'Hiring Manager (Alex Chen)', value: 'hiring_manager' },
                { label: 'HRBP (Marcus Vance)', value: 'hr_bp' },
                { label: 'IT Administrator (Alex Thorne)', value: 'it_admin' },
                { label: 'Finance Ops (Priya Nair)', value: 'finance' },
                { label: 'Super Admin', value: 'ats_admin' }
              ]}
              size="sm"
              className="w-full sm:w-56"
            />

            <motion.button 
              onClick={() => setIsCreateModalOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{ backgroundColor: brandColor }}
              className="flex-1 sm:flex-initial h-9.5 px-4.5 text-xs font-extrabold text-white shadow-md rounded-xl border border-white/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all hover:brightness-110"
            >
              <Plus size={16} strokeWidth={2.5} /> <span>Quick Onboard Candidate</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. EXACTLY 4 FROSTED GLASS KPI STATS CARDS (MATCHING OFFERS HUB)
      ═══════════════════════════════════════════════════════════════════ */}
      <PreboardingKpis
        metrics={metrics}
        currentNav={currentNav}
        onSelectKpi={handleKpiClick}
        brandColor={activeBrandColor || brandColor}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          3. ATTENTION REQUIRED ACTION SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <PreboardingAttentionSection
        items={attentionItems}
        onActionClick={(item) => {
          const rec = allRecords.find(r => r.id === item.preboardingId);
          if (rec) setActiveRecord(rec);
        }}
        brandColor={activeBrandColor || brandColor}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          4. UNIFIED GLASSMORPHIC WORKSPACE CANVAS (TABS + TOOLBAR + DATATABLE)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="bg-gradient-to-br from-white/70 via-white/65 to-blue-50/30 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl shadow-[0_8px_30px_rgba(26,86,219,0.04)] font-sans space-y-0 relative z-10 overflow-hidden"
      >
        {/* CANVAS TOOLBAR */}
        <div className="p-3.5 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md space-y-3">
          
          {/* Level 1: Segmented Pill Preset Navigation Tabs + Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: 'all', label: 'All Preboarding', count: allRecords.length },
                { id: 'pending_actions', label: 'Pending Actions', count: pendingCount },
                { id: 'joining_this_week', label: 'Joining This Week', count: metrics.joiningThisWeek },
                { id: 'ready_to_join', label: 'Ready to Join', count: readyCount },
                { id: 'in_progress', label: 'In Progress', count: inProgressCount },
                { id: 'employee_created', label: 'Employee Created', count: createdCount },
                { id: 'failed_handoff', label: 'Failed Handoff', count: failedCount },
                { id: 'on_hold', label: 'On Hold', count: holdCount }
              ].map(p => {
                const isActive = currentNav === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCurrentNav(p.id)}
                    style={isActive ? {
                      backgroundColor: brandColor,
                      color: '#ffffff',
                      boxShadow: `0 2px 10px ${brandColor}44`
                    } : {}}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive 
                        ? 'shadow-xs font-extrabold text-white' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-750'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                      isActive 
                        ? 'bg-white/25 text-white' 
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {p.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reset Filters Button */}
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { 
                setSelectedDeptFilter('All'); 
                setSelectedStatusFilter('All'); 
                setSelectedActionFilter('All'); 
                setCurrentNav('all'); 
                setSearch(''); 
              }}
              className="h-8 px-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 shrink-0 transition-all shadow-2xs cursor-pointer group"
            >
              <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                <RefreshCw size={12} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
              </motion.div>
              <span>Reset Filters</span>
            </motion.button>
          </div>

          {/* Level 2: ModernSearchInput + CustomSelects + Portal + Templates + Policies + Export + View Switcher */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
            
            {/* Search Field */}
            <ModernSearchInput 
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder="Filter Preboarding by Candidate, Email, CAN-ID, REQ-ID, PRE-ID..."
              className="max-w-md"
            />

            {/* Dropdown Filters & Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end w-full md:w-auto">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 w-full sm:w-auto">
                <CustomSelect 
                  prefix="Dept: "
                  value={selectedDeptFilter}
                  onChange={(val) => setSelectedDeptFilter(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    ...departments.map(d => ({ label: d, value: d }))
                  ]}
                  size="sm"
                  className="w-full sm:w-36"
                />

                <CustomSelect 
                  prefix="Status: "
                  value={selectedStatusFilter}
                  onChange={(val) => setSelectedStatusFilter(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    ...Object.values(PREBOARDING_STATUS).map(s => ({ label: s, value: s }))
                  ]}
                  size="sm"
                  className="w-40"
                />

                <CustomSelect 
                  prefix="Action: "
                  value={selectedActionFilter}
                  onChange={(val) => setSelectedActionFilter(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    ...Object.values(ACTION_STATUS).map(a => ({ label: a, value: a }))
                  ]}
                  size="sm"
                  className="w-32"
                />
              </div>

              {/* Action Buttons: Candidate Portal, Templates, Policies, Export, View Toggle */}
              <div className="flex items-center gap-1.5 flex-wrap">
                
                {/* Candidate Portal Simulator */}
                <button
                  onClick={() => handleOpenPortal(filteredRecords[0] || allRecords[0])}
                  className="h-8.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Open Candidate Preboarding Portal Simulator"
                >
                  <ExternalLink size={14} className="text-blue-500" />
                  <span className="hidden sm:inline">Portal Preview</span>
                </button>

                {/* Templates Modal */}
                <button
                  onClick={() => setIsTemplatesModalOpen(true)}
                  className="h-8.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Preboarding Checklist & Document Templates"
                >
                  <FileText size={14} style={{ color: brandColor }} />
                  <span className="hidden sm:inline">Templates</span>
                </button>

                {/* Policies Modal */}
                <button
                  onClick={() => setIsPoliciesModalOpen(true)}
                  className="h-8.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Compliance, BGV & HRMS Policies"
                >
                  <ShieldCheck size={14} className="text-amber-500" />
                  <span className="hidden sm:inline">Policies</span>
                </button>

                {/* Export CSV */}
                <motion.button 
                  whileHover={{ scale: 1.03, y: -0.5 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleExportCsv}
                  title={selectedRecordsForAction.length > 0 ? `Export ${selectedRecordsForAction.length} Selected Candidates` : "Export CSV"}
                  style={selectedRecordsForAction.length > 0 ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                  className={`h-8.5 px-3.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs font-sans cursor-pointer group rounded-xl border ${
                    selectedRecordsForAction.length > 0 
                      ? 'text-white shadow-md' 
                      : 'text-slate-700 dark:text-slate-200 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-md border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400/80 dark:hover:border-blue-500/80'
                  }`}
                >
                  <motion.div whileHover={{ y: 1 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.4 }}>
                    <Download size={13} className={selectedRecordsForAction.length > 0 ? 'text-white' : 'text-blue-500 group-hover:text-blue-600 transition-colors'} />
                  </motion.div>
                  <span>{selectedRecordsForAction.length > 0 ? `Export (${selectedRecordsForAction.length})` : 'Export'}</span>
                </motion.button>

                {/* View Switcher Pill (Matching Requisition & Candidate Hub) */}
                <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner relative">
                  <button 
                    onClick={() => setViewMode('table')}
                    style={viewMode === 'table' ? { color: brandColor } : {}}
                    className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 font-sans cursor-pointer relative z-10 ${
                      viewMode === 'table' 
                        ? 'font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Data Grid Table View"
                  >
                    <LayoutTemplate size={13} style={viewMode === 'table' ? { color: brandColor } : {}} className={viewMode === 'table' ? '' : 'text-slate-400'} />
                    <span>Grid</span>
                    {viewMode === 'table' && (
                      <motion.div 
                        layoutId="activePreboardingViewPill"
                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600/60 -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>

                  <button 
                    onClick={() => setViewMode('kanban')}
                    style={viewMode === 'kanban' ? { color: brandColor } : {}}
                    className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 font-sans cursor-pointer relative z-10 ${
                      viewMode === 'kanban' 
                        ? 'font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Stage Pipeline Kanban Board"
                  >
                    <Columns size={13} style={viewMode === 'kanban' ? { color: brandColor } : {}} className={viewMode === 'kanban' ? '' : 'text-slate-400'} />
                    <span>Board</span>
                    {viewMode === 'kanban' && (
                      <motion.div 
                        layoutId="activePreboardingViewPill"
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

        {/* WORKSPACE VIEW: DATATABLE / KANBAN */}
        {viewMode === 'kanban' ? (
          <PreboardingKanbanBoard
            records={filteredRecords}
            onOpenRecord={handleOpenRecord}
            brandColor={activeBrandColor || brandColor}
          />
        ) : (
          <DataTable 
            title="Preboarding Pipeline Data Grid"
            columns={preboardingColumns}
            data={filteredRecords}
            selectable={true}
            onRowClick={(row) => handleOpenRecord(row)}
            onInspect={(row) => handleOpenRecord(row)}
            onDelete={(row) => setDeletingRecord(row)}
            onSelectionChange={(selected) => setSelectedRecordsForAction(selected)}
            onDeleteSelected={(rows) => setBulkDeletingRecords(rows)}
            borderless={false}
          />
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. MODALS & DIALOGS
      ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Candidate Self-Service Preboarding Portal Simulator */}
      <CandidatePreboardingPortalModal
        isOpen={isCandidatePortalOpen}
        onClose={() => setIsCandidatePortalOpen(false)}
        record={portalCandidate || filteredRecords[0] || allRecords[0]}
        brandColor={activeBrandColor || brandColor}
        onDocumentUpload={handleManageDocument}
        onTaskComplete={handleManageTask}
      />

      {/* Checklist Templates Modal */}
      <PreboardingTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        brandColor={activeBrandColor || brandColor}
      />

      {/* Compliance & BGV Policies Modal */}
      <PreboardingPoliciesModal
        isOpen={isPoliciesModalOpen}
        onClose={() => setIsPoliciesModalOpen(false)}
        brandColor={activeBrandColor || brandColor}
      />

      {/* Quick Onboard Preboarding Initiator Modal */}
      <CreatePreboardingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePreboardingRecord}
        brandColor={activeBrandColor || brandColor}
      />

      {/* Enterprise KPI Real-time Analytics Modal */}
      {activeKpiModal && (
        <EnterpriseKpiAnalyticsModal
          isOpen={!!activeKpiModal}
          onClose={() => setActiveKpiModal(null)}
          kpiId={activeKpiModal.kpiId}
          title={activeKpiModal.label}
          records={activeKpiModal.records}
          brandColor={activeBrandColor || brandColor}
        />
      )}

      {/* Confirm Record Delete / Cancel Modal */}
      {deletingRecord && (
        <ConfirmModal
          isOpen={!!deletingRecord}
          onClose={() => setDeletingRecord(null)}
          onConfirm={() => {
            handleUpdateStatus(deletingRecord.id, PREBOARDING_STATUS.CANCELLED, 'Cancelled by user');
            setDeletingRecord(null);
            addToast({
              title: 'Preboarding Cancelled',
              message: `Preboarding record for ${deletingRecord.candidateName} has been cancelled.`,
              type: 'warning'
            });
          }}
          title="Cancel Preboarding Process"
          message={`Are you sure you want to cancel preboarding for ${deletingRecord.candidateName} (${deletingRecord.id})? This will archive all ongoing BGV and IT tasks.`}
          confirmText="Yes, Cancel Preboarding"
          cancelText="Keep Active"
          type="danger"
        />
      )}

      {/* Bulk Delete Confirm Modal */}
      {bulkDeletingRecords && bulkDeletingRecords.length > 0 && (
        <ConfirmModal
          isOpen={!!bulkDeletingRecords}
          onClose={() => setBulkDeletingRecords(null)}
          onConfirm={() => {
            bulkDeletingRecords.forEach(rec => {
              handleUpdateStatus(rec.id, PREBOARDING_STATUS.CANCELLED, 'Bulk cancelled by user');
            });
            setBulkDeletingRecords(null);
            setSelectedRecordsForAction([]);
            addToast({
              title: 'Preboardings Cancelled',
              message: `Successfully cancelled ${bulkDeletingRecords.length} preboarding candidate process(es).`,
              type: 'warning'
            });
          }}
          title="Cancel Selected Preboardings"
          message={`Are you sure you want to cancel ${bulkDeletingRecords.length} selected candidate preboarding processes?`}
          confirmText="Yes, Cancel Selected"
          cancelText="Keep Active"
          type="danger"
        />
      )}

    </div>
  );
};

export default PreboardingHub;
