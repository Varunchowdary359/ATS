import React, { useState, useContext, useMemo, useEffect } from 'react';
import { 
  INITIAL_JDS, 
  ROLES, 
  INITIAL_WORKFLOW_CONFIGS, 
  hasJdPermission
} from './jdMockData';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  TableCellsIcon,
  Squares2X2Icon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  FolderIcon,
  UserIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import JDCreator from './JDCreator';
import JDDetailPage from './JDDetailPage';
import JDWorkflowConfig from './JDWorkflowConfig';
import { ModernPageHeader, ModernMetricsStrip, ModernStatusBadge } from '../../admin/shared/ModernAdminLayoutComponents';
import ConfirmModal from '../../admin/shared/ConfirmModal';
import EnterpriseKpiAnalyticsModal from '../../dashboard/shared/EnterpriseKpiAnalyticsModal';
import DataTable from '../../dashboard/shared/DataTable';
import { ThemeContext } from '../../../ThemeContext';
import { FileText, LayoutTemplate } from 'lucide-react';
import { ChevronRight, Briefcase, Plus, Search, RefreshCw, Download, Columns, ArrowUpRight, TrendingUp, X, Globe, Check, Lock } from 'lucide-react';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import ModernSearchInput from '../../dashboard/shared/ModernSearchInput';
import { useToast } from '../../shared/ToastContext';
import KpiAnalyticsGraphModal from '../../dashboard/shared/KpiAnalyticsGraphModal';
import { useBreadcrumb } from '../../shared/BreadcrumbContext';


const LIFECYCLE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon },
  { id: 'all', label: 'All JDs', icon: DocumentTextIcon },
  { id: 'my_jds', label: 'My JDs', icon: UserIcon },
  { id: 'pending_approval', label: 'Pending My Approval', icon: ClockIcon, badgeKey: 'pendingCount' },
  { id: 'drafts', label: 'Drafts', icon: PencilIcon },
  { id: 'changes_requested', label: 'Changes Requested', icon: ArrowPathIcon },
  { id: 'approved', label: 'Approved', icon: CheckCircleIcon },
  { id: 'published', label: 'Published', icon: ShieldCheckIcon },
  { id: 'rejected', label: 'Rejected', icon: XCircleIcon },
  { id: 'archived', label: 'Archived', icon: FolderIcon },
  { id: 'workflow_config', label: 'Approval Workflow Config', icon: LayoutTemplate, permRequired: 'jd.configWorkflow' }
];

const normalizeJdItem = (item) => {
  if (!item || !item.id) return item;
  const pendingStage = item.approvalChain?.find(s => s.status === 'Pending');
  const defaultApprover = pendingStage ? `${pendingStage.approverName} (${pendingStage.roleName || pendingStage.role})` : 'Alex Rivera (VP Eng)';
  
  return {
    ...item,
    currentApproverRole: item.currentApproverRole || pendingStage?.role || 'hiring_manager',
    currentApproverName: item.currentApproverName || (item.status === 'Draft' ? '— Not Assigned' : item.status === 'Approved' || item.status === 'Published' ? 'Fully Approved' : defaultApprover),
    requiredSkills: Array.isArray(item.requiredSkills) ? item.requiredSkills.join(', ') : (item.requiredSkills || 'Java, Spring Boot, SQL'),
    preferredSkills: Array.isArray(item.preferredSkills) ? item.preferredSkills.join(', ') : (item.preferredSkills || 'AWS, React'),
    responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities.join('\n') : (item.responsibilities || ''),
    versionHistory: Array.isArray(item.versionHistory) && item.versionHistory.length > 0 ? item.versionHistory : [{ version: item.version || 'v1.0', changedBy: item.createdBy || 'Sarah Chen', date: item.createdDate || 'Recent', summary: 'Initial Version', status: item.status || 'Pending Approval' }],
    auditTrail: Array.isArray(item.auditTrail) && item.auditTrail.length > 0 ? item.auditTrail : [{ id: 'AUD-01', user: item.createdBy || 'Sarah Chen', role: 'Recruiter', action: 'Created JD', dateTime: 'Recent', comment: 'Initial JD record' }]
  };
};

export default function JDRepository({ onNavigate }) {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#3b82f6';

  const pushNotification = (title, message, statusType = 'info') => {
    let type = 'info';
    if (statusType === 'approved' || statusType === 'success') type = 'success';
    else if (statusType === 'rejected' || statusType === 'error') type = 'error';
    else if (statusType === 'changes_requested' || statusType === 'warning') type = 'warning';

    addToast({
      title,
      message,
      type
    });
  };
  
  // State Management
  const [currentNav, setCurrentNav] = useState('dashboard');
  const [activeKpiGraphModal, setActiveKpiGraphModal] = useState(null);
  const [userRole, setUserRole] = useState('recruiter'); // 'recruiter' | 'hiring_manager' | 'hrbp' | 'dept_head' | 'hr_head' | 'admin' | 'viewer'
  
  const [jds, setJds] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedLocal = localStorage.getItem('pw_job_descriptions');
        const savedSession = sessionStorage.getItem('pw_jds');
        let localList = savedLocal ? JSON.parse(savedLocal) : [];
        let sessionList = savedSession ? JSON.parse(savedSession) : [];

        const mergedMap = new Map();
        [...INITIAL_JDS, ...localList, ...sessionList].forEach(item => {
          if (item && item.id) {
            mergedMap.set(item.id, normalizeJdItem(item));
          }
        });
        return Array.from(mergedMap.values());
      }
    } catch (e) {}
    return INITIAL_JDS.map(normalizeJdItem);
  });

  const [workflowConfigs, setWorkflowConfigs] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('pw_workflow_configs_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_WORKFLOW_CONFIGS;
  });

  // Auto-persist when state changes across both localStorage & sessionStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (Array.isArray(jds)) {
          localStorage.setItem('pw_job_descriptions', JSON.stringify(jds));
          sessionStorage.setItem('pw_jds', JSON.stringify(jds));
        }
        if (Array.isArray(workflowConfigs)) {
          localStorage.setItem('pw_workflow_configs_v2', JSON.stringify(workflowConfigs));
          localStorage.removeItem('pw_workflow_configs');
        }
      }
    } catch (e) {}
  }, [jds, workflowConfigs]);

  // Reactive listener for real-time AI JD creation and database updates
  useEffect(() => {
    const handleSync = () => {
      try {
        if (typeof window !== 'undefined') {
          const savedLocal = localStorage.getItem('pw_job_descriptions');
          const savedSession = sessionStorage.getItem('pw_jds');
          let localList = savedLocal ? JSON.parse(savedLocal) : [];
          let sessionList = savedSession ? JSON.parse(savedSession) : [];

          const mergedMap = new Map();
          [...INITIAL_JDS, ...localList, ...sessionList].forEach(item => {
            if (item && item.id) {
              mergedMap.set(item.id, normalizeJdItem(item));
            }
          });
          setJds(Array.from(mergedMap.values()));
        }
      } catch (e) {}
    };

    window.addEventListener('pw:jd_created', handleSync);
    window.addEventListener('pw_db_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('pw:jd_created', handleSync);
      window.removeEventListener('pw_db_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pw_workflow_configs', JSON.stringify(workflowConfigs));
  }, [workflowConfigs]);

  // Search and Advanced Filters
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterWorkMode, setFilterWorkMode] = useState('All');

  // Modals & Selection
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [selectedJD, setSelectedJD] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deletingJD, setDeletingJD] = useState(null);
  const [bulkDeleteItems, setBulkDeleteItems] = useState(null);
  const [selectedJDsForExport, setSelectedJDsForExport] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const { extraCrumbs, setExtraCrumbs, clearExtraCrumbs } = useBreadcrumb();

  useEffect(() => {
    if (isCreatorOpen) {
      setExtraCrumbs([{ label: editTarget ? `Edit ${editTarget.id}` : 'Create Job Description' }]);
    } else if (selectedJD) {
      setExtraCrumbs([{ label: selectedJD.id }]);
    } else if (currentNav === 'workflow_config') {
      setExtraCrumbs([{ label: 'Workflow Configuration' }]);
    } else {
      clearExtraCrumbs();
    }
  }, [isCreatorOpen, selectedJD, currentNav, editTarget]);

  useEffect(() => {
    if (extraCrumbs.length === 0) {
      if (isCreatorOpen) {
        setIsCreatorOpen(false);
        setEditTarget(null);
      }
      if (selectedJD) setSelectedJD(null);
      if (currentNav === 'workflow_config') setCurrentNav('dashboard');
    }
  }, [extraCrumbs]);

  const handleExportCSV = () => {
    const itemsToExport = selectedJDsForExport.length > 0 ? selectedJDsForExport : filteredJDs;
    if (itemsToExport.length === 0) {
      pushNotification('Export Warning', 'No Job Descriptions available to export.', 'warning');
      return;
    }

    const headers = ['JD ID', 'Requisition ID', 'Title', 'Department', 'Work Mode', 'Location', 'Status', 'Created By', 'Last Modified'];
    const csvRows = [
      headers.join(','),
      ...itemsToExport.map(jd => [
        `"${jd.id || ''}"`,
        `"${jd.reqId || 'REQ-2026-0001'}"`,
        `"${(jd.title || '').replace(/"/g, '""')}"`,
        `"${(jd.department || '').replace(/"/g, '""')}"`,
        `"${(jd.workMode || '').replace(/"/g, '""')}"`,
        `"${(jd.location || '').replace(/"/g, '""')}"`,
        `"${(jd.status || '').replace(/"/g, '""')}"`,
        `"${(jd.createdBy || '').replace(/"/g, '""')}"`,
        `"${(jd.lastModified || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Job_Descriptions_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    pushNotification('Export Success', `Exported ${itemsToExport.length} Job Descriptions to CSV.`, 'success');
  };

  // Current user display based on role
  const currentUserMap = {
    recruiter: 'Sarah Chen (Recruiter)',
    hiring_manager: 'Alex Rivera (Hiring Manager)',
    hr_lead: 'Elena Rostova (HR & Compliance Lead)',
    hrbp: 'Elena Rostova (HR & Compliance Lead)',
    admin: 'System Admin',
    viewer: 'Auditor Viewer'
  };


  // KPI Graph Analytics Modal Helper
  const openKpiGraphModal = (kpiId) => {
    let records = jds;
    let label = 'Total Job Descriptions Repository';
    if (kpiId === 'pending_approval') {
      records = jds.filter(j => j.status === 'Pending Approval');
      label = 'Pending Approval Workflow Queue';
    } else if (kpiId === 'published') {
      records = jds.filter(j => j.status === 'Published' || j.status === 'Approved');
      label = 'Published JDs Library';
    } else if (kpiId === 'drafts') {
      records = jds.filter(j => j.status === 'Draft');
      label = 'Draft JDs In Progress';
    }
    setActiveKpiGraphModal({ kpiId, label, records });
  };

  // Filtered List calculation based on sub-nav tab
  const filteredJDs = useMemo(() => {
    return jds.filter(jd => {
      // Role-based viewer guard
      if (userRole === 'viewer' && jd.status !== 'Approved' && jd.status !== 'Published') {
        return false;
      }

      // Nav Tab Filter
      if (currentNav === 'my_jds') {
        const currentUserFirstName = currentUserMap[userRole]?.split(' ')[0]?.toLowerCase();
        const matchesUser = (jd.createdBy && jd.createdBy.toLowerCase().includes(currentUserFirstName)) || jd.creatorRole === userRole;
        if (!matchesUser) return false;
      }
      if (currentNav === 'pending_approval') {
        if (jd.status !== 'Pending Approval') return false;
        const pendingStage = jd.approvalChain?.find(c => c.status === 'Pending');
        // Show if pending stage matches user role, or if user is admin, or if role matches current approver role
        if (userRole !== 'admin' && pendingStage?.role !== userRole && jd.currentApproverRole !== userRole) return false;
      }
      if (currentNav === 'drafts' && jd.status !== 'Draft') return false;
      if (currentNav === 'changes_requested' && jd.status !== 'Changes Requested') return false;
      if (currentNav === 'approved' && jd.status !== 'Approved') return false;
      if (currentNav === 'published' && jd.status !== 'Published') return false;
      if (currentNav === 'rejected' && jd.status !== 'Rejected') return false;
      if (currentNav === 'archived' && jd.status !== 'Archived') return false;

      // Dropdown Filters
      if (filterDepartment !== 'All' && jd.department !== filterDepartment) return false;
      if (filterStatus !== 'All' && jd.status !== filterStatus) return false;
      if (filterWorkMode !== 'All' && jd.workMode !== filterWorkMode) return false;

      // Search Query
      if (search) {
        const q = search.toLowerCase();
        return jd.title.toLowerCase().includes(q) || jd.id.toLowerCase().includes(q) || (jd.reqId && jd.reqId.toLowerCase().includes(q)) || jd.department.toLowerCase().includes(q);
      }
      return true;
    });
  }, [jds, currentNav, userRole, filterDepartment, filterStatus, filterWorkMode, search]);

  // Counts for Metrics & Badges
  const pendingCount = jds.filter(j => {
    if (j.status !== 'Pending Approval') return false;
    const pendingStage = j.approvalChain?.find(c => c.status === 'Pending');
    return userRole === 'admin' || pendingStage?.role === userRole || j.currentApproverRole === userRole;
  }).length;
  const draftCount = jds.filter(j => j.status === 'Draft').length;
  const publishedCount = jds.filter(j => j.status === 'Published').length;
  const approvedCount = jds.filter(j => j.status === 'Approved').length;

  // ── Permission-based action guards ──────────────────────────────────────
  // All guards delegate to hasJdPermission() so the single JD_PERMISSIONS
  // matrix in jdMockData.js is the only place that needs changing.

  const canEditJD = (jd) => {
    if (!jd) return false;
    if (userRole === 'admin') return true;
    if (!hasJdPermission(userRole, 'jd.edit')) return false;
    // Recruiter can edit Drafts, Changes-Requested, or Pending Approval JDs (including AI-created JDs)
    if (userRole === 'recruiter') {
      const myFirstName = currentUserMap[userRole]?.split(' ')[0]?.toLowerCase() || 'sarah';
      const isOwner = !jd.createdBy || 
        jd.createdBy.toLowerCase().includes(myFirstName) ||
        jd.createdBy.toLowerCase().includes('peopleworks') ||
        jd.createdBy.toLowerCase().includes('copilot') ||
        jd.createdBy.toLowerCase().includes('ai') ||
        jd.createdBy.toLowerCase().includes('sujith') ||
        jd.creatorRole === 'recruiter';
      return isOwner && (jd.status === 'Draft' || jd.status === 'Changes Requested' || jd.status === 'Pending Approval');
    }
    return false;
  };

  const canArchiveJD = (jd) => {
    return true;
  };

  // Handle Save / Submit from JDCreator
  // ── Server-side creation / edit guard ───────────────────────────────────
  // Even if a user bypasses the button, this blocks the action.
  const handleSaveJD = (formData, targetStatus = 'Draft') => {
    const isEdit = jds.some(j => j.id === formData.id);
    if (!isEdit && !hasJdPermission(userRole, 'jd.create')) {
      pushNotification('Permission Denied', 'Only Recruiter role can create a new Job Description.', 'rejected');
      return;
    }
    if (isEdit && !hasJdPermission(userRole, 'jd.edit') && userRole !== 'admin') {
      pushNotification('Permission Denied', 'Your role does not have permission to edit this Job Description.', 'rejected');
      return;
    }
    const now = new Date().toISOString().split('T')[0];

    if (isEdit) {
      // Editing existing JD
      const updatedList = jds.map(jd => {
        if (jd.id === formData.id) {
          // Storing version snapshot before update for clear comparison
          const previousSnapshot = jd.previousSnapshot || {
            summary: jd.summary,
            responsibilities: jd.responsibilities,
            requiredSkills: jd.requiredSkills,
            salaryMin: jd.salaryMin,
            salaryMax: jd.salaryMax
          };

          const isCreatingNewVersion = jd.status === 'Published' || jd.status === 'Approved';
          const currentVerNum = parseFloat(String(jd.version || jd.versionNum || '1.0').replace(/[^0-9.]/g, '')) || 1.0;
          const newVersionNum = isCreatingNewVersion ? parseFloat((currentVerNum + 0.1).toFixed(1)) : currentVerNum;
          const newVersionStr = `v${newVersionNum.toFixed(1)}`;

          // Reset approval stages for re-approval across all departments/approvers when resubmitted
          const baseChain = Array.isArray(jd.approvalChain) && jd.approvalChain.length > 0 ? jd.approvalChain : (INITIAL_JDS[0]?.approvalChain || []);
          const resetApprovalChain = baseChain.map(stg => {
            if (stg.stageId === 1) {
              return { ...stg, status: 'Submitted', timestamp: `${now} 11:30 AM`, comment: 'Revised and resubmitted' };
            } else if (stg.stageId === 2 && targetStatus === 'Pending Approval') {
              return { ...stg, status: 'Pending', timestamp: null, comment: null };
            } else {
              return { ...stg, status: 'Waiting', timestamp: null, comment: null };
            }
          });

          // Determine next approver name for display
          let newCurrentApproverRole = null;
          let newCurrentApproverName = '\u2014';
          if (targetStatus === 'Pending Approval') {
            newCurrentApproverRole = 'hiring_manager';
            newCurrentApproverName = 'Alex Rivera (Hiring Manager)';
          } else if (targetStatus === 'Draft') {
            newCurrentApproverRole = null;
            newCurrentApproverName = '\u2014';
          }

          const newAudit = {
            id: `AUD-${Date.now()}`,
            user: currentUserMap[userRole],
            role: ROLES.find(r => r.id === userRole)?.name || userRole,
            action: targetStatus === 'Pending Approval' ? 'Resubmitted for Full Re-Approval' : 'Saved Revised Draft',
            dateTime: `${now} 11:30 AM`,
            version: newVersionStr,
            previousValue: jd.status,
            newValue: targetStatus,
            comment: targetStatus === 'Pending Approval' ? 'Resubmitted for fresh re-approval after revisions' : 'Saved draft updates'
          };

          return {
            ...jd,
            ...formData,
            status: targetStatus,
            version: newVersionStr,
            versionNum: newVersionNum,
            lastModified: now,
            currentApproverRole: newCurrentApproverRole,
            currentApproverName: newCurrentApproverName,
            approvalChain: targetStatus === 'Pending Approval' ? resetApprovalChain : jd.approvalChain,
            previousSnapshot: previousSnapshot,
            auditTrail: [newAudit, ...(jd.auditTrail || [])],
            versionHistory: [
              { 
                version: newVersionStr, 
                changedBy: currentUserMap[userRole], 
                date: now, 
                summary: targetStatus === 'Pending Approval' ? 'Revised content & resubmitted for re-approval' : 'Draft revisions saved', 
                status: targetStatus,
                snapshot: {
                  summary: formData.summary,
                  responsibilities: formData.responsibilities,
                  requiredSkills: formData.requiredSkills,
                  salaryMin: formData.salaryMin,
                  salaryMax: formData.salaryMax
                }
              },
              ...(jd.versionHistory || [])
            ]
          };
        }
        return jd;
      });
      setJds(updatedList);
      pushNotification('JD Updated', `JD ${formData.id} has been updated to ${targetStatus}.`, 'approved');
      setSelectedJD(updatedList.find(j => j.id === formData.id));
    } else {
      // Creating Brand New JD
      const newId = formData.id || `JD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const newEntry = {
        ...formData,
        id: newId,
        status: targetStatus,
        version: formData.version || 'v1.0',
        versionNum: formData.versionNum || 1.0,
        createdBy: formData.createdBy || currentUserMap[userRole],
        creatorRole: formData.creatorRole || userRole,
        createdDate: formData.createdDate || now,
        lastModified: now,
        currentApproverRole: formData.currentApproverRole || (targetStatus === 'Pending Approval' ? 'hiring_manager' : null),
        currentApproverName: formData.currentApproverName || (targetStatus === 'Pending Approval' ? 'Hiring Manager' : '—'),
        approvalChain: formData.approvalChain || INITIAL_WORKFLOW_CONFIGS[0].stages.map(stg => ({
          stageId: stg.id,
          role: stg.role,
          roleName: stg.roleName,
          approverName: stg.id === 1 ? currentUserMap[userRole] : (stg.id === 2 ? 'Alex Rivera' : (stg.id === 3 ? 'Jessica Taylor' : (stg.id === 4 ? 'David Zhang' : 'Elena Rostova'))),
          status: stg.id === 1 ? 'Approved' : (stg.id === 2 && targetStatus === 'Pending Approval' ? 'Pending' : 'Waiting'),
          timestamp: stg.id === 1 ? `${now} 09:00 AM` : null,
          comment: stg.id === 1 ? 'Initial JD created' : null
        })),
        workflowSnapshot: formData.workflowSnapshot || undefined,
        versionHistory: [
          { version: 'v1.0', changedBy: currentUserMap[userRole], date: now, summary: 'Initial creation', status: targetStatus }
        ],
        auditTrail: [
          { id: `AUD-${Date.now()}`, user: currentUserMap[userRole], role: userRole, action: 'Created JD', dateTime: `${now} 09:00 AM`, version: 'v1.0', previousValue: '-', newValue: targetStatus, comment: 'Created initial record' }
        ]
      };
      setJds([newEntry, ...jds]);
      pushNotification('JD Created', `New JD ${newId} (${formData.title}) was created successfully.`, 'approved');
      setSelectedJD(null);
      setCurrentNav('dashboard');
    }

    setIsCreatorOpen(false);
    setEditTarget(null);
  };

  // Approver Action Handler (Approve / Changes / Reject / Publish)
  const handleApproverAction = (actionType, targetJD, commentNote) => {
    const now = new Date().toISOString().split('T')[0];
    const updated = jds.map(jd => {
      if (jd.id === targetJD.id) {
        let newStatus = jd.status;
        let newApproverRole = jd.currentApproverRole;
        let newApproverName = jd.currentApproverName;

        const updatedChain = jd.approvalChain.map(stg => {
          if (stg.status === 'Pending') {
            if (actionType === 'Approve' || actionType === 'AdminOverride_Approve') {
              return { ...stg, status: 'Approved', timestamp: `${now} 02:00 PM`, comment: commentNote || 'Approved stage' };
            } else if (actionType === 'Changes' || actionType === 'AdminOverride_Changes') {
              return { ...stg, status: 'Changes Requested', timestamp: `${now} 02:00 PM`, comment: commentNote };
            } else if (actionType === 'Reject' || actionType === 'AdminOverride_Reject') {
              return { ...stg, status: 'Rejected', timestamp: `${now} 02:00 PM`, comment: commentNote };
            }
          }
          if (actionType === 'AdminOverride_Cancel Workflow' && stg.status === 'Pending') {
          return { ...stg, status: 'Waiting' };
          }
          return stg;
        });

        if (actionType === 'Approve' || actionType === 'AdminOverride_Approve') {
          const currentPendingIndex = jd.approvalChain.findIndex(c => c.status === 'Pending');
          if (currentPendingIndex >= 0 && currentPendingIndex < jd.approvalChain.length - 1) {
            const nextStage = updatedChain[currentPendingIndex + 1];
            nextStage.status = 'Pending';
            newApproverRole = nextStage.role;
            newApproverName = `${nextStage.approverName} (${nextStage.roleName})`;
          } else {
            newStatus = 'Approved';
            newApproverRole = null;
            newApproverName = 'Fully Approved';
          }
        } else if (actionType === 'Changes') {
          const changesStage = updatedChain.find(s => s.status === 'Changes Requested');
          newStatus = 'Changes Requested';
          newApproverRole = changesStage?.role || 'hiring_manager';
          newApproverName = changesStage
            ? `${changesStage.approverName} (${changesStage.roleName} — Changes Requested)`
            : `${currentUserMap[userRole]} (Changes Requested)`;
        } else if (actionType === 'Reject') {
          const rejectStage = updatedChain.find(s => s.status === 'Rejected');
          newStatus = 'Rejected';
          newApproverRole = rejectStage?.role || userRole;
          newApproverName = rejectStage
            ? `${rejectStage.approverName} (${rejectStage.roleName} — Rejected)`
            : `${currentUserMap[userRole]} — Rejected`;
        } else if (actionType === 'Publish') {
          newStatus = 'Published';
          newApproverRole = null;
          newApproverName = 'Fully Approved & Published';
        } else if (actionType === 'AdminOverride_Cancel Workflow') {
          newStatus = 'Draft';
          newApproverRole = null;
          newApproverName = '—';
        }

        const newAudit = {
          id: `AUD-${Date.now()}`,
          user: currentUserMap[userRole],
          role: userRole,
          action: actionType.startsWith('AdminOverride') ? `Admin Override: ${actionType.split('_')[1]}` : `${actionType} Stage Action`,
          dateTime: `${now} 02:00 PM`,
          version: jd.version,
          previousValue: jd.status,
          newValue: newStatus,
          comment: commentNote || `Action: ${actionType}`
        };

        return {
          ...jd,
          status: newStatus,
          currentApproverRole: newApproverRole,
          currentApproverName: newApproverName,
          approvalChain: updatedChain,
          auditTrail: [newAudit, ...(jd.auditTrail || [])]
        };
      }
      return jd;
    });

    setJds(updated);
    if (selectedJD && selectedJD.id === targetJD.id) {
      setSelectedJD(updated.find(j => j.id === targetJD.id));
    }
    pushNotification(`JD ${actionType}`, `Action "${actionType}" applied to ${targetJD.id}.`, actionType === 'Approve' ? 'approved' : 'changes_requested');
  };

  // ── Archive helper shared between JDDetailPage and ConfirmModal ──────────
  const handleArchiveJD = (targetJD) => {
    const now = new Date().toISOString().split('T')[0];
    const updated = jds.map(j => {
      if (j.id === targetJD.id) {
        const archiveAudit = {
          id: `AUD-${Date.now()}`,
          user: currentUserMap[userRole],
          role: userRole,
          action: 'Archived JD',
          dateTime: `${now} 12:35 PM`,
          version: j.version,
          previousValue: j.status,
          newValue: 'Archived',
          comment: 'Moved to archived status'
        };
        return { ...j, status: 'Archived', currentApproverName: 'Archived Record', auditTrail: [archiveAudit, ...(j.auditTrail || [])] };
      }
      return j;
    });
    setJds(updated);
  };

  // Shared action dispatcher for JDDetailPage
  const handleDetailAction = (actionType, targetJD, commentNote) => {
    if (actionType === 'EditRevision') {
      setEditTarget(targetJD);
      setIsCreatorOpen(true);
    } else if (actionType === 'CreateNewVersion') {
      setEditTarget({ ...targetJD, id: targetJD.id });
      setIsCreatorOpen(true);
    } else if (actionType === 'DuplicateJD') {
      setEditTarget({ ...targetJD, id: undefined, status: 'Draft' });
      setIsCreatorOpen(true);
    } else if (actionType === 'Archive') {
      handleArchiveJD(targetJD);
      setSelectedJD(null);
    } else if (actionType === 'Delete') {
      setDeletingJD(targetJD);
      setSelectedJD(null);
    } else {
      handleApproverAction(actionType, targetJD, commentNote);
      setSelectedJD(prev => prev ? jds.find(j => j.id === prev.id) || null : null);
    }
  };


  // DataTable columns setup (matching Requisition grid quality standards)
  const jdColumns = [
    { 
      header: 'JD Code & Title', 
      accessor: 'title', 
      align: 'left',
      render: (val, row) => (
        <div className="py-0.5 min-w-[240px]">
          <div 
            className="text-xs font-bold text-[#0F172A] dark:text-white hover:text-[var(--pw-brand)] transition-colors cursor-pointer leading-snug flex items-center gap-1.5 whitespace-nowrap"
            onClick={() => setSelectedJD(row)}
          >
            <span>{val}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
            <span className="font-mono text-[10px] text-[#64748B] dark:text-slate-400 tracking-wider">{row.id}</span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">·</span>
            <span className="font-mono text-[10px] text-[#64748B] dark:text-slate-400 font-medium">
              {row.reqId || 'REQ-2026-0001'}
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-mono border border-slate-200/60 dark:border-slate-700/60">
              {row.version}
            </span>
          </div>
        </div>
      ) 
    },
    { 
      header: 'Department', 
      accessor: 'department', 
      align: 'left',
      render: (val, row) => (
        <div className="py-0.5 min-w-[160px]">
          <div className="font-semibold text-xs text-[#0F172A] dark:text-slate-200 leading-snug whitespace-nowrap">{val}</div>
          <div className="text-[10px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-tight whitespace-nowrap">{row.jobFamily}</div>
        </div>
      ) 
    },
    { 
      header: 'Location & Mode', 
      accessor: 'location',
      align: 'left',
      render: (val, row) => (
        <span className="text-xs font-medium text-[#475569] dark:text-slate-300 leading-snug whitespace-nowrap">{val} ({row.workMode})</span>
      )
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      align: 'center',
      render: (val) => (
        <div className="flex justify-center">
          <ModernStatusBadge status={val} small />
        </div>
      ) 
    },
    { 
      header: 'Current Approver', 
      accessor: 'currentApproverName',
      align: 'left',
      render: (val, row) => {
        let displayText = val;
        let textColor = 'text-[#475569] dark:text-slate-300';
        let iconColor = 'text-[#64748B]';

        if (row.status === 'Draft') {
          displayText = '— Not Assigned';
          textColor = 'text-[#94A3B8] dark:text-slate-500 italic';
        } else if (row.status === 'Approved' || row.status === 'Published') {
          displayText = 'Fully Approved';
          textColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
          iconColor = 'text-emerald-500';
        } else if (row.status === 'Changes Requested') {
          textColor = 'text-amber-600 dark:text-amber-400';
          iconColor = 'text-amber-500';
        } else if (row.status === 'Rejected') {
          textColor = 'text-red-600 dark:text-red-400';
          iconColor = 'text-red-500';
        } else if (row.status === 'Archived') {
          displayText = 'Archived';
          textColor = 'text-[#94A3B8] dark:text-slate-500 italic';
        }

        return (
          <span className={`text-xs font-medium ${textColor} flex items-center gap-1.5 leading-snug whitespace-nowrap`}>
            <UserIcon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} /> {displayText}
          </span>
        );
      }
    },
    { 
      header: 'Created By', 
      accessor: 'createdBy',
      align: 'left',
      render: (val) => <span className="text-xs text-[#64748B] dark:text-slate-400 font-medium leading-snug whitespace-nowrap">{val}</span>
    },
    {
      header: 'Publish',
      accessor: 'id',
      align: 'center',
      render: (val, row) => {
        if (row.status === 'Published') {
          return (
            <div className="flex justify-center">
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 whitespace-nowrap">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Published</span>
              </span>
            </div>
          );
        }

        if (row.status === 'Approved') {
          return (
            <div className="flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDetailAction('Publish', row);
                  pushNotification('JD Published', `'${row.title}' (${row.id}) is now Published and synced to Job Distribution Hub.`, 'success');
                  if (onNavigate) {
                    onNavigate('job postings', row.reqId || 'REQ-2026-0001');
                  }
                }}
                className="px-2.5 py-1 text-[10px] font-bold rounded-md border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 whitespace-nowrap shadow-2xs cursor-pointer active:scale-95"
                title="Publish to Job Portals"
              >
                <Globe className="w-3 h-3" />
                <span>Publish JD</span>
              </button>
            </div>
          );
        }

        return (
          <div className="flex justify-center">
            <span 
              className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60 opacity-60 cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
              title="Publishing is unavailable until all required approval stages are completed."
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Publish Locked</span>
            </span>
          </div>
        );
      }
    }
  ];

  // ── 1. Full-page JD Editor View — replaces the entire view when editing/creating ──
  if (isCreatorOpen) {
    return (
      <div className="w-full max-w-[1600px] mx-auto pb-12 animate-fade-in-up">
        <JDCreator
          onClose={() => { setIsCreatorOpen(false); setEditTarget(null); }}
          onSave={handleSaveJD}
          initialData={editTarget}
          isEditMode={!!editTarget}
          userRole={userRole}
          existingJDs={jds}
          workflows={workflowConfigs}
        />
      </div>
    );
  }

  // ── 2. Full-page JD Detail View — replaces repository when a JD is selected ──
  if (selectedJD) {
    // Always show the freshest version of the JD from state
    const freshJD = jds.find(j => j.id === selectedJD.id) || selectedJD;
    return (
      <div className="w-full max-w-[1600px] mx-auto pb-12 animate-fade-in-up">
        <JDDetailPage
          jd={freshJD}
          onBack={() => setSelectedJD(null)}
          onAction={handleDetailAction}
          userRole={userRole}
          onSwitchRole={(role) => setUserRole(role)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-6">
      {/* TOP GLASSMORPHIC CONTAINER HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4.5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-3.5 font-sans relative overflow-hidden"
      >
        {/* Top Row: Icon + Title + Status + Subtitle & Action Cluster */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl text-white bg-[var(--pw-brand)] shadow-sm flex items-center justify-center shrink-0">
              <Briefcase size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Job Description Repository</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Operational
                </span>
              </div>
              <p className="text-xs text-slate-500/90 dark:text-slate-400 mt-0.5">Enterprise Lifecycle &amp; Approval Workflow System</p>
            </div>
          </div>


          <div className="flex items-center gap-2.5 shrink-0">
            <CustomSelect
              prefix="Role: "
              value={userRole}
              onChange={(val) => setUserRole(val)}
              options={[
                { label: 'Recruiter / JD Owner', value: 'recruiter' },
                { label: 'Hiring Manager', value: 'hiring_manager' },
                { label: 'HR & Compliance Lead', value: 'hr_lead' },
                { label: 'Super Admin', value: 'admin' }
              ]}
              size="sm"
              className="w-56"
            />

            {hasJdPermission(userRole, 'jd.create') && (
              <motion.button 
                onClick={() => { setEditTarget(null); setIsCreatorOpen(true); }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="h-9.5 px-4.5 text-xs font-extrabold text-white bg-[var(--pw-brand)] shadow-md shadow-[var(--pw-brand)]/20 hover:brightness-110 rounded-xl border border-white/20 flex items-center gap-2 shrink-0 cursor-pointer transition-all"
              >
                <Plus size={16} strokeWidth={2.5} /> <span>Create New JD</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4 FROSTED GLASS KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { id: 'all', label: 'TOTAL JDS', value: jds.length, subtitle: 'Active in Lifecycle', icon: <DocumentTextIcon className="w-4 h-4" style={{ color: brandColor }} />, iconBg: 'bg-slate-100/80 dark:bg-slate-800/80', trend: '+5%', trendUp: true, actionText: 'View All →', updatedAt: 'Just now' },
          { id: 'pending_approval', label: 'PENDING APPROVAL', value: pendingCount, subtitle: 'Awaiting Action', icon: <ClockIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />, iconBg: 'bg-amber-50 dark:bg-amber-950/60', trend: 'Action', trendUp: false, actionText: 'Review Queue →', updatedAt: '5m ago' },
          { id: 'published', label: 'PUBLISHED & READY', value: publishedCount, subtitle: 'Available for Requisitions', icon: <ShieldCheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, iconBg: 'bg-emerald-50 dark:bg-emerald-950/60', trend: '+12%', trendUp: true, actionText: 'View Library →', updatedAt: '1h ago' },
          { id: 'drafts', label: 'DRAFTS IN PROGRESS', value: draftCount, subtitle: 'Recruiter Work-in-progress', icon: <PencilIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />, iconBg: 'bg-indigo-50 dark:bg-indigo-950/60', trend: 'Saved', trendUp: true, actionText: 'Continue →', updatedAt: 'Today' }
        ].map((stat, idx) => {
          return (
            <motion.div 
              key={stat.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 + 0.1 }}
              whileHover={{ y: -3 }}
              onClick={() => {
                setCurrentNav(stat.id);
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
                    stat.trendUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
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

      {/* UNIFIED GLASSMORPHIC WORKSPACE CANVAS */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="bg-gradient-to-br from-white/70 via-white/65 to-blue-50/30 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl shadow-[0_8px_30px_rgba(26,86,219,0.04)] font-sans space-y-0 relative z-10"
      >
        
        {/* CANVAS TOOLBAR: TABS + COMMAND SEARCH + FILTERS */}
        <div className="p-3.5 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md space-y-3">
          
          {/* Level 1: Segmented Pill Preset Navigation Tabs + Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Segmented Pill Tabs Bar */}
            <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: 'dashboard', label: 'Overview', count: jds.length },
                { id: 'all', label: 'All JDs', count: jds.length },
                { id: 'my_jds', label: 'My JDs', count: jds.filter(jd => {
                  const currentUserFirstName = currentUserMap[userRole]?.split(' ')[0]?.toLowerCase();
                  return (jd.createdBy && jd.createdBy.toLowerCase().includes(currentUserFirstName)) || jd.creatorRole === userRole;
                }).length },
                { id: 'pending_approval', label: 'Pending Approval', count: pendingCount },
                { id: 'drafts', label: 'Drafts', count: draftCount },
                { id: 'published', label: 'Published', count: publishedCount }
              ].map(p => {
                const isActive = currentNav === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCurrentNav(p.id)}
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
              onClick={() => { setFilterDepartment('All'); setFilterStatus('All'); setFilterWorkMode('All'); setCurrentNav('all'); setSearch(''); }}
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
            {/* Command Search Field */}
            <ModernSearchInput 
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder="Filter JDs by Code, Title, or Department..."
              className="max-w-md"
            />

            {/* Dropdown Filters & Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end w-full md:w-auto">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 w-full sm:w-auto">
                <CustomSelect 
                  prefix="Dept: "
                  value={filterDepartment}
                  onChange={(val) => setFilterDepartment(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Engineering', value: 'Engineering' },
                    { label: 'Sales', value: 'Sales' },
                    { label: 'Marketing', value: 'Marketing' },
                    { label: 'Finance', value: 'Finance' }
                  ]}
                  size="sm"
                  className="w-full sm:w-36"
                />

                <CustomSelect 
                  prefix="Status: "
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Draft', value: 'Draft' },
                    { label: 'Pending Approval', value: 'Pending Approval' },
                    { label: 'Approved', value: 'Approved' },
                    { label: 'Published', value: 'Published' },
                    { label: 'Changes Requested', value: 'Changes Requested' },
                    { label: 'Rejected', value: 'Rejected' },
                    { label: 'Archived', value: 'Archived' }
                  ]}
                  size="sm"
                  className="w-40"
                />

                <CustomSelect 
                  prefix="Mode: "
                  value={filterWorkMode}
                  onChange={(val) => setFilterWorkMode(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Remote', value: 'Remote' },
                    { label: 'Hybrid', value: 'Hybrid' },
                    { label: 'On-site', value: 'On-site' }
                  ]}
                  size="sm"
                  className="w-36"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <motion.button 
                  whileHover={{ scale: 1.03, y: -0.5 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleExportCSV}
                  title={selectedJDsForExport.length > 0 ? `Export ${selectedJDsForExport.length} Selected Job Descriptions` : "Export CSV"}
                  style={selectedJDsForExport.length > 0 ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                  className={`h-8.5 px-3.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs font-sans cursor-pointer group rounded-xl border ${
                    selectedJDsForExport.length > 0 
                      ? 'text-white shadow-md' 
                      : 'text-slate-700 dark:text-slate-200 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-md border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400/80 dark:hover:border-blue-500/80'
                  }`}
                >
                  <motion.div whileHover={{ y: 1 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.4 }}>
                    <Download size={13} className={selectedJDsForExport.length > 0 ? 'text-white' : 'text-blue-500 group-hover:text-blue-600 transition-colors'} />
                  </motion.div>
                  <span>{selectedJDsForExport.length > 0 ? `Export (${selectedJDsForExport.length})` : 'Export'}</span>
                </motion.button>

                {/* View Switcher Glass Container with Spring Pill Slide */}
                <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner relative">
                  <button 
                    onClick={() => setViewMode('table')}
                    style={viewMode === 'table' ? { color: brandColor } : {}}
                    className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 font-sans cursor-pointer relative z-10 ${
                      viewMode === 'table' 
                        ? 'font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutTemplate size={13} style={viewMode === 'table' ? { color: brandColor } : {}} className={viewMode === 'table' ? '' : 'text-slate-400'} />
                    <span>Grid</span>
                    {viewMode === 'table' && (
                      <motion.div 
                        layoutId="activeViewPill2"
                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600/60 -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    style={viewMode === 'grid' ? { color: brandColor } : {}}
                    className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 font-sans cursor-pointer relative z-10 ${
                      viewMode === 'grid' 
                        ? 'font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Columns size={13} style={viewMode === 'grid' ? { color: brandColor } : {}} className={viewMode === 'grid' ? '' : 'text-slate-400'} />
                    <span>Board</span>
                    {viewMode === 'grid' && (
                      <motion.div 
                        layoutId="activeViewPill2"
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

        {/* Main Data View */}
        {currentNav === 'workflow_config' ? (
          <JDWorkflowConfig
            workflows={workflowConfigs}
            setWorkflows={setWorkflowConfigs}
            brandColor={brandColor}
          />
        ) : viewMode === 'table' ? (
          <DataTable 
            title="Job Descriptions Grid"
            columns={jdColumns}
            data={filteredJDs}
            selectable={true}
            onSelectionChange={(selectedItems) => setSelectedJDsForExport(selectedItems)}
            onDeleteSelected={(selectedItems) => setBulkDeleteItems(selectedItems)}
            borderless={true}
            onRowClick={(row) => setSelectedJD(row)}
            onEdit={(row) => { if (canEditJD(row)) { setEditTarget(row); setIsCreatorOpen(true); } }}
            onDelete={(row) => { 
              if (canArchiveJD(row)) { 
                setDeletingJD(row); 
              } else {
                pushNotification('Action Restricted', 'Job Descriptions currently pending approval cannot be deleted.', 'warning');
              }
            }}
            emptyText="No Job Descriptions found."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {filteredJDs.map(jd => (
              <div key={jd.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedJD(jd)}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{jd.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                      <span>{jd.id}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300">{jd.reqId || 'REQ-2026-0001'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">{jd.version}</span>
                </div>
                <div className="text-xs text-slate-500 mb-3">{jd.department} • {jd.location}</div>
                <div className="flex justify-between items-center mt-4">
                  <ModernStatusBadge status={jd.status} small />
                  {jd.status === 'Published' ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Published</span>
                    </span>
                  ) : jd.status === 'Approved' ? (
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDetailAction('Publish', jd);
                        pushNotification('JD Published', `'${jd.title}' (${jd.id}) is now Published and synced to Job Distribution Hub.`, 'success');
                        if (onNavigate) {
                          onNavigate('job postings', jd.reqId || 'REQ-2026-0001');
                        }
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded border border-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      title="Publish to Job Portals"
                    >
                      <Globe className="w-3 h-3 text-white" />
                      <span>Publish JD</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">{jd.lastModified}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Single JD Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingJD}
        onClose={() => setDeletingJD(null)}
        onConfirm={() => {
          if (!deletingJD) return;
          setJds(prev => prev.filter(j => j.id !== deletingJD.id));
          pushNotification('JD Deleted', `Job Description ${deletingJD.id} (${deletingJD.title}) has been deleted.`, 'success');
          setDeletingJD(null);
        }}
        title="Delete Job Description"
        message={`Are you sure you want to delete ${deletingJD?.id} (${deletingJD?.title})? This action cannot be undone.`}
        confirmText="Delete JD"
        confirmVariant="danger"
        brandColor={brandColor}
      />

      {/* Bulk JD Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!bulkDeleteItems && bulkDeleteItems.length > 0}
        onClose={() => setBulkDeleteItems(null)}
        onConfirm={() => {
          if (!bulkDeleteItems || bulkDeleteItems.length === 0) return;
          const idsToDelete = new Set(bulkDeleteItems.map(j => j.id));
          setJds(prev => prev.filter(j => !idsToDelete.has(j.id)));
          pushNotification('JDs Deleted', `${bulkDeleteItems.length} Job Descriptions deleted successfully.`, 'success');
          setBulkDeleteItems(null);
          setSelectedJDsForExport([]);
        }}
        title="Delete Selected Job Descriptions"
        message={`Are you sure you want to delete all ${bulkDeleteItems?.length} selected Job Descriptions? This action cannot be undone.`}
        confirmText={bulkDeleteItems?.length > 1 ? `Delete All (${bulkDeleteItems?.length})` : 'Delete JD'}
        confirmVariant="danger"
        brandColor={brandColor}
      />

      {/* 10/10 Enterprise KPI Real-Time Analytics System Modal */}
      {activeKpiGraphModal && (
        <EnterpriseKpiAnalyticsModal
          isOpen={!!activeKpiGraphModal}
          onClose={() => setActiveKpiGraphModal(null)}
          kpiId={activeKpiGraphModal.kpiId}
          kpiLabel={activeKpiGraphModal.label}
          kpiValue={activeKpiGraphModal.records?.length || jds.length}
          moduleType="jd"
          rawRecords={activeKpiGraphModal.records || jds}
        />
      )}
    </div>
  );

}
