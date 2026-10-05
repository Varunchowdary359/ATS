import React, { useState, useContext, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernPageHeader, ModernStatusBadge } from '../admin/shared/ModernAdminLayoutComponents';
import DataTable from '../dashboard/shared/DataTable';
import { CJSLine, CJSBar, CJSDoughnut } from '../dashboard/shared/Charts';
import { 
  Briefcase, LayoutTemplate, Columns, Search, Clock, Users, Plus, Edit2, Trash2, Eye, 
  ShieldCheck, CheckCircle2, Flame, UserCheck, User, ArrowRight, ChevronRight, ShieldAlert, FileText, 
  Check, X, FileEdit, Award, Filter, Download, RefreshCw, Columns3, Layers, CheckSquare, AlertTriangle, ArrowUpDown, TrendingUp, PieChart, ArrowUpRight, Copy, Archive
} from 'lucide-react';
import { ThemeContext } from '../../ThemeContext';
import { INITIAL_REQUISITIONS } from './recruitmentMockData';
import { useBreadcrumb } from '../shared/BreadcrumbContext';

import RequisitionDetails from './requisition/RequisitionDetails';
import CreateRequisitionPage from './requisition/CreateRequisitionPage';
import ConfirmModal from '../admin/shared/ConfirmModal';
import CustomSelect from '../dashboard/shared/CustomSelect';
import ModernSearchInput from '../dashboard/shared/ModernSearchInput';
import EnterpriseKpiAnalyticsModal from '../dashboard/shared/EnterpriseKpiAnalyticsModal';
import EnterpriseBulkActionModal from './requisition/EnterpriseBulkActionModal';

import { DatabaseService } from '../../services/db/DatabaseService';

// Readable Date Helper (e.g., 2026-09-15 -> 15 Sep 2026)
const formatDateReadable = (isoString) => {
  if (!isoString) return 'Pending';
  try {
    const parts = isoString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${monthNames[monthIdx]} ${year}`;
    }
  } catch (e) {
    return isoString;
  }
  return isoString;
};

const RequisitionHub = ({ onNavigate }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#3b82f6';
  
  const [simulatedRole, setSimulatedRole] = useState('Hiring Manager');
  const [activePreset, setActivePreset] = useState('all');
  const [requisitions, setRequisitions] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('pw_requisitions');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
        DatabaseService.init();
        if (DatabaseService.requisitions && DatabaseService.requisitions.length > 0) {
          return DatabaseService.requisitions;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Persist requisitions changes to sessionStorage safely
  const updateRequisitionsState = (newReqsOrFn) => {
    setRequisitions(prev => {
      const next = typeof newReqsOrFn === 'function' ? newReqsOrFn(prev) : newReqsOrFn;
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pw_requisitions', JSON.stringify(next));
        }
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Listen to AI conversational requisition creation for real-time reactivity
  React.useEffect(() => {
    const handleReqCreated = (e) => {
      if (e.detail) {
        setRequisitions(prev => {
          const exists = prev.some(r => r.id === e.detail.id);
          const next = exists ? prev : [e.detail, ...prev];
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('pw_requisitions', JSON.stringify(next));
            }
          } catch (err) {
            console.error(err);
          }
          return next;
        });
      }
    };

    const handleDbUpdated = () => {
      DatabaseService.init();
      if (DatabaseService.requisitions && DatabaseService.requisitions.length > 0) {
        setRequisitions(prev => {
          const dbReqs = DatabaseService.requisitions;
          const merged = [...dbReqs];
          prev.forEach(p => {
            if (!merged.some(m => m.id === p.id)) {
              merged.push(p);
            }
          });
          return merged;
        });
      }
    };

    window.addEventListener('pw:requisition_created', handleReqCreated);
    window.addEventListener('pw_db_updated', handleDbUpdated);
    return () => {
      window.removeEventListener('pw:requisition_created', handleReqCreated);
      window.removeEventListener('pw_db_updated', handleDbUpdated);
    };
  }, []);
  const [viewMode, setViewMode] = useState('table');
  const [search, setSearch] = useState('');
  
  // Filter Dropdown States
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  
  const [currentView, setCurrentView] = useState('hub'); // 'hub' | 'create' | 'details'
  const [selectedReq, setSelectedReq] = useState(null);
  const [deletingReq, setDeletingReq] = useState(null);
  const [inspectingDrawerReq, setInspectingDrawerReq] = useState(null);
  const [selectedReqsForExport, setSelectedReqsForExport] = useState([]);
  const [bulkDeletingReqs, setBulkDeletingReqs] = useState(null);

  const { extraCrumbs, setExtraCrumbs, clearExtraCrumbs } = useBreadcrumb();

  useEffect(() => {
    if (currentView === 'details' && selectedReq) {
      setExtraCrumbs([{ label: selectedReq.id }]);
    } else if (currentView === 'hub') {
      clearExtraCrumbs();
    }
  }, [currentView, selectedReq]);

  useEffect(() => {
    if (extraCrumbs.length === 0 && currentView === 'details') {
      setCurrentView('hub');
      setSelectedReq(null);
    }
  }, [extraCrumbs]);

  const [enterpriseBulkModalOpen, setEnterpriseBulkModalOpen] = useState(false);

  const handleBulkDelete = (selectedItems) => {
    if (Array.isArray(selectedItems) && selectedItems.length > 0) {
      setSelectedReqsForExport(selectedItems);
      setEnterpriseBulkModalOpen(true);
    } else if (selectedReqsForExport.length > 0) {
      setEnterpriseBulkModalOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    if (bulkDeletingReqs && bulkDeletingReqs.length > 0) {
      const idsToDelete = bulkDeletingReqs.map(r => r.id);
      setRequisitions(prev => prev.filter(r => !idsToDelete.includes(r.id)));
      setSelectedReqsForExport([]);
      setBulkDeletingReqs(null);
    }
  };

  const handleExecuteEnterpriseBulkAction = ({ actionType, targetValue, selectedReqs }) => {
    if (!Array.isArray(selectedReqs) || selectedReqs.length === 0) return;
    const ids = selectedReqs.map(r => r.id);

    setRequisitions(prev => prev.map(req => {
      if (!ids.includes(req.id)) return req;

      let nextReq = { ...req };
      const timestamp = new Date().toISOString();

      if (actionType === 'assign_recruiter') {
        nextReq.recruiter = targetValue;
        nextReq.history = [...(nextReq.history || []), { action: `Assigned Recruiter: ${targetValue}`, by: simulatedRole, date: timestamp, prevValue: req.recruiter || 'Unassigned', newValue: targetValue }];
      } else if (actionType === 'change_status') {
        nextReq.status = targetValue;
        nextReq.history = [...(nextReq.history || []), { action: `Status Changed to ${targetValue}`, by: simulatedRole, date: timestamp, prevValue: req.status, newValue: targetValue }];
      } else if (actionType === 'bulk_approve') {
        if (simulatedRole === 'Super Admin' || simulatedRole === 'Department Head / Approver' || simulatedRole === 'Finance Approver' || simulatedRole === 'Finance Controller' || simulatedRole === 'Finance') {
          nextReq.status = 'Approved';
          nextReq.history = [...(nextReq.history || []), { action: 'Bulk Approved', by: simulatedRole, date: timestamp, prevValue: req.status, newValue: 'Approved' }];
        }
      } else if (actionType === 'archive') {
        nextReq.status = 'Closed';
        nextReq.history = [...(nextReq.history || []), { action: `Archived Requisition`, by: simulatedRole, date: timestamp, prevValue: req.status, newValue: 'Closed' }];
      }
      return nextReq;
    }));

    if (actionType === 'export') {
      handleExportCSV();
    }
  };

  // KPI Graph Analytics Modal State
  const [activeKpiGraphModal, setActiveKpiGraphModal] = useState(null);

  // Persona auto tab selection
  const handleRoleChange = (newRole) => {
    setSimulatedRole(newRole);
    setSelectedDept('All');
    setSelectedStatus('All');
    setSelectedPriority('All');
    if (newRole === 'Department Head / Approver' || newRole === 'Finance Approver' || newRole === 'Finance Controller') {
      setActivePreset('pending_approvals');
    } else if (newRole === 'HR Recruiter') {
      setActivePreset('recruiter_queue');
    } else {
      setActivePreset('all');
    }
  };

  const openCreate = () => { 
    sessionStorage.removeItem('pw_req_edit');
    setSelectedReq(null);
    if (onNavigate) {
      onNavigate('requisition/create');
    } else {
      setCurrentView('create');
    }
  };

  const openEdit = (req) => { 
    sessionStorage.setItem('pw_req_edit', JSON.stringify(req));
    setSelectedReq(req);
    if (onNavigate) {
      onNavigate('requisition/create');
    } else {
      setCurrentView('create');
    }
  };

  const handleDuplicate = (req) => {
    let maxNum = 0;
    requisitions.forEach(r => {
      if (r?.id) {
        const match = r.id.match(/\d+/g);
        if (match && match.length > 0) {
          const lastNum = parseInt(match[match.length - 1], 10);
          if (!isNaN(lastNum) && lastNum > maxNum) {
            maxNum = lastNum;
          }
        }
      }
    });
    const nextNum = maxNum + 1;

    const dup = {
      ...req,
      id: `REQ-2026-${String(nextNum).padStart(4, '0')}`,
      jobTitle: `${req.jobTitle} (Copy)`,
      status: 'Draft'
    };
    setRequisitions(prev => [dup, ...prev]);
  };

  const handleUpdateRequisition = (updatedReq) => {
    setRequisitions(prev => {
      const exists = prev.some(r => r.id === updatedReq.id);
      const next = exists 
        ? prev.map(r => r.id === updatedReq.id ? updatedReq : r)
        : [updatedReq, ...prev];
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pw_requisitions', JSON.stringify(next));
        }
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    if (selectedReq && selectedReq.id === updatedReq.id) {
      setSelectedReq(updatedReq);
    }
  };

  // Role-based Scoped Data
  const roleScopedReqs = useMemo(() => {
    if (simulatedRole === 'Hiring Manager') {
      const filtered = requisitions.filter(r => r.hiringManager === 'Alex Chen' || !r.hiringManager);
      return filtered.length > 0 ? filtered : requisitions;
    } else if (simulatedRole === 'Department Head / Approver') {
      const filtered = requisitions.filter(r => ['Engineering', 'Design', 'Sales', 'Marketing', 'Human Resources', 'Cloud & AI Platform'].includes(r.department) && r.status !== 'Draft');
      return filtered.length > 0 ? filtered : requisitions;
    } else if (simulatedRole === 'Finance Approver' || simulatedRole === 'Finance Controller' || simulatedRole === 'Finance') {
      const filtered = requisitions.filter(r => r.status !== 'Draft');
      return filtered.length > 0 ? filtered : requisitions;
    } else if (simulatedRole === 'HR Recruiter') {
      const filtered = requisitions.filter(r => r.status === 'Approved' || r.status === 'Open' || r.status === 'Pending Approval' || r.status === 'Draft');
      return filtered.length > 0 ? filtered : requisitions;
    }
    return requisitions;
  }, [requisitions, simulatedRole]);

  // Live Count Badges per Filter Preset
  const presetCounts = useMemo(() => {
    const base = roleScopedReqs;
    return {
      all: base.length,
      my_submissions: base.length,
      pending_approvals: base.filter(r => r.status === 'Pending Approval').length,
      recruiter_queue: base.filter(r => r.status === 'Approved').length,
      urgent_sla: base.filter(r => r.isOverdue || r.hiringPriority === 'Urgent').length,
      drafts: base.filter(r => r.status === 'Draft').length,
      active_open_roles: base.filter(r => r.status === 'Open').length,
    };
  }, [roleScopedReqs]);

  // Filtered Requisitions Grid
  const filteredReqs = useMemo(() => {
    let base = roleScopedReqs;

    if (activePreset === 'pending_approvals') base = base.filter(r => r.status === 'Pending Approval');
    else if (activePreset === 'recruiter_queue') base = base.filter(r => r.status === 'Approved');
    else if (activePreset === 'urgent_sla') base = base.filter(r => r.isOverdue || r.hiringPriority === 'Urgent');
    else if (activePreset === 'drafts') base = base.filter(r => r.status === 'Draft');
    else if (activePreset === 'my_submissions') base = roleScopedReqs;
    else if (activePreset === 'active_open_roles') base = base.filter(r => r.status === 'Open');

    if (selectedDept !== 'All') base = base.filter(r => r.department === selectedDept);
    if (selectedStatus !== 'All') base = base.filter(r => r.status === selectedStatus);
    if (selectedPriority !== 'All') base = base.filter(r => r.hiringPriority === selectedPriority);

    const result = base.filter(r => 
      r.jobTitle.toLowerCase().includes(search.toLowerCase()) || 
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase()) ||
      r.hiringManager.toLowerCase().includes(search.toLowerCase())
    );

    return result.length > 0 ? result : roleScopedReqs;
  }, [roleScopedReqs, search, activePreset, selectedDept, selectedStatus, selectedPriority]);

  // Enterprise KPI Stats - 4 Cards per Role
  const kpiStats = useMemo(() => {
    if (simulatedRole === 'Hiring Manager') {
      const alexReqs = requisitions.filter(r => r.hiringManager === 'Alex Chen');
      const approvedCount = alexReqs.filter(r => r.status === 'Approved' || r.status === 'Open').length;
      const pendingCount = alexReqs.filter(r => r.status === 'Pending Approval').length;
      const draftCount = alexReqs.filter(r => r.status === 'Draft').length;

      return [
        { 
          id: 'my_submissions', 
          label: 'MY SUBMISSIONS', 
          value: alexReqs.length, 
          trend: '+12%',
          trendUp: true,
          subtitle: `${approvedCount} Approved · ${pendingCount} Pending`,
          actionText: 'View Details →',
          updatedAt: '5m ago',
          icon: <FileText className="w-4 h-4" style={{ color: brandColor }} />,
          iconBg: 'bg-slate-100/80 dark:bg-slate-800/80',
          metrics: [
            { label: 'Approved', val: approvedCount },
            { label: 'Pending', val: pendingCount }
          ],
          filterFn: (r) => r.hiringManager === 'Alex Chen',
          chartType: 'line',
          chartData: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{ label: 'Submissions', data: [1, 2, 1, 3, 2, 4], color: '#1A56DB' }]
          }
        },
        { 
          id: 'pending_approvals', 
          label: 'PENDING APPROVAL', 
          value: pendingCount, 
          trend: 'Awaiting',
          trendUp: false,
          subtitle: `${pendingCount} Awaiting Sign-off (Avg 1.2d)`,
          actionText: 'View Queue →',
          updatedAt: '10m ago',
          icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          iconBg: 'bg-amber-50 dark:bg-amber-950/60',
          metrics: [
            { label: 'HR Sign-off', val: pendingCount },
            { label: 'Avg SLA', val: '1.2d' }
          ],
          filterFn: (r) => r.hiringManager === 'Alex Chen' && r.status === 'Pending Approval',
          chartType: 'bar',
          chartData: {
            labels: ['Engineering', 'Design', 'Sales', 'Marketing'],
            datasets: [{ label: 'Pending Approvals', data: [2, 1, 0, 1], color: '#f59e0b' }]
          }
        },
        { 
          id: 'drafts', 
          label: 'UNSUBMITTED DRAFTS', 
          value: draftCount, 
          trend: 'Saved',
          trendUp: true,
          subtitle: `${draftCount} Saved & Ready for Submission`,
          actionText: 'Continue →',
          updatedAt: '2h ago',
          icon: <FileEdit className="w-4 h-4 text-[#0D9488]" />,
          iconBg: 'bg-teal-50 dark:bg-teal-950/60',
          metrics: [
            { label: 'Incomplete', val: draftCount },
            { label: 'Auto Saved', val: 'Today' }
          ],
          filterFn: (r) => r.hiringManager === 'Alex Chen' && r.status === 'Draft',
          chartType: 'bar',
          chartData: {
            labels: ['Draft Stage 1', 'Draft Stage 2', 'Draft Stage 3'],
            datasets: [{ label: 'Draft Progress', data: [1, 2, 0], color: '#0D9488' }]
          }
        },
        { 
          id: 'active_open_roles', 
          label: 'ACTIVE OPEN ROLES', 
          value: alexReqs.filter(r => r.status === 'Open').length, 
          trend: 'Sourcing',
          trendUp: true,
          subtitle: '28 Candidates · 1 Offer',
          actionText: 'View Pipeline →',
          updatedAt: 'Just now',
          icon: <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
          metrics: [
            { label: 'Candidates', val: 28 },
            { label: 'Offers', val: 1 }
          ],
          filterFn: (r) => r.hiringManager === 'Alex Chen' && r.status === 'Open',
          chartType: 'doughnut',
          chartData: {
            labels: ['Engineering', 'Design', 'Product'],
            data: [3, 2, 1],
            colors: ['#1A56DB', '#10b981', '#8b5cf6']
          }
        }
      ];
    } else if (simulatedRole === 'Department Head / Approver') {
      const deptReqs = requisitions.filter(r => ['Engineering', 'Design'].includes(r.department));
      const pendingDept = deptReqs.filter(r => r.status === 'Pending Approval').length;
      const approvedHeadcount = deptReqs.filter(r => r.status === 'Approved' || r.status === 'Open').length;
      const rejectedCount = deptReqs.filter(r => r.status === 'Rejected').length;

      return [
        { 
          id: 'pending_approvals', 
          label: 'AWAITING MY SIGN-OFF', 
          value: pendingDept, 
          trend: 'Action Needed',
          trendUp: false,
          subtitle: `${pendingDept} Pending Department Sign-off`,
          actionText: 'Review Queue →',
          updatedAt: '2m ago',
          icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          iconBg: 'bg-amber-50 dark:bg-amber-950/60',
          metrics: [
            { label: 'Engineering', val: 3 },
            { label: 'Design', val: 1 }
          ],
          filterFn: (r) => r.status === 'Pending Approval',
          chartType: 'bar',
          chartData: {
            labels: ['Engineering', 'Design'],
            datasets: [{ label: 'Sign-off Queue', data: [3, 1], color: '#f59e0b' }]
          }
        },
        { 
          id: 'approved_headcount', 
          label: 'APPROVED HEADCOUNT', 
          value: approvedHeadcount, 
          trend: '+24% YoY',
          trendUp: true,
          subtitle: `${approvedHeadcount} Roles Approved · 100% Budget Met`,
          actionText: 'View Headcount →',
          updatedAt: '15m ago',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
          metrics: [
            { label: 'Budget Met', val: '100%' },
            { label: 'Avg Salary', val: '$125k' }
          ],
          filterFn: (r) => r.status === 'Approved' || r.status === 'Open',
          chartType: 'line',
          chartData: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4 Target'],
            datasets: [{ label: 'Approved Headcount', data: [4, 6, 8, 12], color: '#10b981' }]
          }
        },
        { 
          id: 'rejected_reqs', 
          label: 'RETURNED / REJECTED', 
          value: rejectedCount, 
          trend: 'Adjustments',
          trendUp: false,
          subtitle: '0 Revisions Needed',
          actionText: 'View Rejections →',
          updatedAt: 'Today',
          icon: <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          iconBg: 'bg-rose-50 dark:bg-rose-950/60',
          metrics: [
            { label: 'Revisions', val: 0 },
            { label: 'Reject Rate', val: '0%' }
          ],
          filterFn: (r) => r.status === 'Rejected',
          chartType: 'doughnut',
          chartData: {
            labels: ['Budget Exceeded', 'Unapproved Headcount', 'Strategy Shift'],
            data: [2, 1, 1],
            colors: ['#ef4444', '#f59e0b', '#64748b']
          }
        },
        { 
          id: 'urgent_sla', 
          label: 'APPROVAL SLA TARGET', 
          value: '1.8 Days', 
          trend: '<2.5d Target',
          trendUp: true,
          subtitle: '96% SLA Compliance Across Depts',
          actionText: 'View SLA Speed →',
          updatedAt: '1h ago',
          icon: <Flame className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
          iconBg: 'bg-purple-50 dark:bg-purple-950/60',
          metrics: [
            { label: 'Compliance', val: '96%' },
            { label: 'Fastest', val: '0.5d' }
          ],
          filterFn: (r) => r.isOverdue || r.hiringPriority === 'Urgent',
          chartType: 'line',
          chartData: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{ label: 'Approval Speed (Days)', data: [2.5, 2.1, 1.8, 1.6], color: '#8b5cf6' }]
          }
        }
      ];
    } else if (simulatedRole === 'Finance Approver' || simulatedRole === 'Finance Controller' || simulatedRole === 'Finance') {
      const pendingFinance = requisitions.filter(r => r.status === 'Pending Approval').length;
      const approvedCount = requisitions.filter(r => r.status === 'Approved' || r.status === 'Open').length;
      const totalBudget = requisitions.reduce((acc, r) => acc + (parseFloat(r.budget || r.targetSalaryMax || 120000)), 0);
      const formattedBudget = `$${(totalBudget / 1000000).toFixed(1)}M`;

      return [
        { 
          id: 'pending_approvals', 
          label: 'BUDGET CLEARANCE QUEUE', 
          value: pendingFinance, 
          trend: 'L2 Sign-off',
          trendUp: false,
          subtitle: `${pendingFinance} Requisitions Awaiting Cost Center Audit`,
          actionText: 'Review Budget →',
          updatedAt: '1m ago',
          icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          iconBg: 'bg-amber-50 dark:bg-amber-950/60',
          metrics: [
            { label: 'Pending L2', val: pendingFinance },
            { label: 'Cost Centers', val: 4 }
          ],
          filterFn: (r) => r.status === 'Pending Approval',
          chartType: 'bar',
          chartData: {
            labels: ['Engineering', 'Design', 'Sales', 'Product'],
            datasets: [{ label: 'Pending Budget Clearance', data: [2, 1, 1, 1], color: '#f59e0b' }]
          }
        },
        { 
          id: 'approved_headcount', 
          label: 'COMMITTED SALARY POOL', 
          value: formattedBudget, 
          trend: '+12% FY26',
          trendUp: true,
          subtitle: `${approvedCount} Approved Roles Within Budget Band`,
          actionText: 'View Financials →',
          updatedAt: '5m ago',
          icon: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
          metrics: [
            { label: 'Band Met', val: '100%' },
            { label: 'Variance', val: '-2.4%' }
          ],
          filterFn: (r) => r.status === 'Approved' || r.status === 'Open',
          chartType: 'line',
          chartData: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4 Target'],
            datasets: [{ label: 'Committed Payroll ($M)', data: [1.2, 2.4, 3.8, 5.2], color: '#10b981' }]
          }
        },
        { 
          id: 'cost_center_compliance', 
          label: 'COST CENTER COMPLIANCE', 
          value: '100%', 
          trend: 'GL Verified',
          trendUp: true,
          subtitle: 'All Requisitions Mapped to Valid CC Codes',
          actionText: 'View Audit Log →',
          updatedAt: 'Today',
          icon: <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          iconBg: 'bg-blue-50 dark:bg-blue-950/60',
          metrics: [
            { label: 'CC-ENG-01', val: 'Active' },
            { label: 'CC-DSG-02', val: 'Active' }
          ],
          filterFn: (r) => Boolean(r.costCenter || r.department),
          chartType: 'doughnut',
          chartData: {
            labels: ['CC-ENG-101', 'CC-DES-204', 'CC-SLS-305', 'CC-MKT-402'],
            data: [45, 20, 20, 15],
            colors: ['#1A56DB', '#10b981', '#f59e0b', '#8b5cf6']
          }
        },
        { 
          id: 'urgent_sla', 
          label: 'FINANCE SLA TARGET', 
          value: '1.2 Days', 
          trend: '<2.0d SLA',
          trendUp: true,
          subtitle: 'Budget Band Audit & Sign-off Velocity',
          actionText: 'View Clearance SLA →',
          updatedAt: '10m ago',
          icon: <Flame className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
          iconBg: 'bg-purple-50 dark:bg-purple-950/60',
          metrics: [
            { label: 'Audit SLA', val: '1.2d' },
            { label: 'Fastest', val: '0.3d' }
          ],
          filterFn: (r) => r.isOverdue || r.hiringPriority === 'Urgent',
          chartType: 'line',
          chartData: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{ label: 'Clearance Speed (Days)', data: [1.8, 1.5, 1.3, 1.2], color: '#8b5cf6' }]
          }
        }
      ];
    } else {
      const approvedReqs = requisitions.filter(r => r.status === 'Approved');
      const openReqs = requisitions.filter(r => r.status === 'Open');
      const totalCandidates = requisitions.reduce((acc, r) => acc + (r.candidateCount || 0), 0);
      const openVacancies = openReqs.reduce((acc, r) => acc + (r.headcount || 0), 0);

      return [
        { 
          id: 'recruiter_queue', 
          label: 'RECRUITER SOURCING QUEUE', 
          value: approvedReqs.length, 
          trend: 'Ready',
          trendUp: true,
          subtitle: `${approvedReqs.length} Approved Roles Ready to Source`,
          actionText: 'Assign Sourcing →',
          updatedAt: '4m ago',
          icon: <Users className="w-4 h-4 text-[#1A56DB]" />,
          iconBg: 'bg-blue-50 dark:bg-blue-950/40',
          metrics: [
            { label: 'Eng Dept', val: 2 },
            { label: 'Avg Age', val: '1d' }
          ],
          filterFn: (r) => r.status === 'Approved',
          chartType: 'bar',
          chartData: {
            labels: ['Engineering', 'Design', 'Marketing', 'Sales'],
            datasets: [{ label: 'Unassigned Reqs', data: [3, 2, 1, 1], color: '#1A56DB' }]
          }
        },
        { 
          id: 'active_assignments', 
          label: 'ACTIVE ASSIGNMENTS', 
          value: openReqs.length, 
          trend: 'Sourcing',
          trendUp: true,
          subtitle: `${openVacancies} Open Vacancies Across Active Reqs`,
          actionText: 'View Workload →',
          updatedAt: '10m ago',
          icon: <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
          metrics: [
            { label: 'Active JDs', val: 5 },
            { label: 'Capacity', val: '80%' }
          ],
          filterFn: (r) => r.status === 'Open',
          chartType: 'line',
          chartData: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{ label: 'Recruiter Workload', data: [2, 4, 5, 6], color: '#10b981' }]
          }
        },
        { 
          id: 'total_headcount', 
          label: 'TOTAL OPEN VACANCIES', 
          value: openVacancies, 
          trend: 'Target Roles',
          trendUp: true,
          subtitle: '8 Tech Openings · 24d Time Fill',
          actionText: 'View Openings →',
          updatedAt: '30m ago',
          icon: <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
          iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
          metrics: [
            { label: 'Tech Openings', val: 8 },
            { label: 'Time Fill', val: '24d' }
          ],
          filterFn: (r) => r.status === 'Open',
          chartType: 'doughnut',
          chartData: {
            labels: ['Engineering', 'Design', 'Operations'],
            data: [8, 4, 2],
            colors: ['#1A56DB', '#10b981', '#f59e0b']
          }
        },
        { 
          id: 'active_pipeline', 
          label: 'TOTAL CANDIDATE PIPELINE', 
          value: totalCandidates, 
          trend: '+18% Velocity',
          trendUp: true,
          subtitle: `${totalCandidates} Candidates Active in Stage Funnels`,
          actionText: 'View Candidates →',
          updatedAt: 'Just now',
          icon: <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
          iconBg: 'bg-purple-50 dark:bg-purple-950/60',
          metrics: [
            { label: 'Screening', val: 18 },
            { label: 'Interview', val: 12 }
          ],
          filterFn: (r) => (r.candidateCount || 0) > 0,
          chartType: 'doughnut',
          chartData: {
            labels: ['Applied', 'Screened', 'Interviewing'],
            data: [35, 18, 12],
            colors: ['#3b82f6', '#f59e0b', '#8b5cf6']
          }
        }
      ];
    }
  }, [requisitions, simulatedRole]);

  const handleKpiClick = (stat) => {
    setActivePreset(stat.id);
    const modalData = roleScopedReqs.filter(stat.filterFn);
    setActiveKpiGraphModal({ 
      kpiId: stat.id,
      label: stat.label, 
      chartType: stat.chartType, 
      chartData: stat.chartData, 
      records: modalData.length > 0 ? modalData : roleScopedReqs 
    });
  };

  const handleExportCSV = () => {
    const reqsToExport = selectedReqsForExport.length > 0 ? selectedReqsForExport : filteredReqs;
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Job Title,Department,Openings,Priority,Status,Manager,Target Hire Date"].join(",") + "\n"
      + reqsToExport.map(e => `${e.id},"${e.jobTitle}",${e.department},${e.headcount || 1},${e.hiringPriority || 'Normal'},${e.status},${e.hiringManager},"${e.targetHireDate || ''}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `requisitions_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.removeChild(link);
  };

  // Enterprise Data Grid Columns - Streamlined & High-Priority Layout
  const columns = [
    { 
      header: 'Requisition ID & Title', 
      accessor: 'id', 
      align: 'left',
      render: (val, row) => (
        <div className="py-0.5">
          <div className="font-semibold text-[#0F172A] dark:text-white text-xs flex items-center gap-1.5 leading-snug whitespace-nowrap">
            <span>{row.jobTitle}</span>
            {row.hireType === 'Replacement' && (
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">Backfill</span>
            )}
          </div>
          <div className="font-mono text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">{val}</div>
        </div>
      ) 
    },
    {
      header: 'Department',
      accessor: 'department',
      align: 'left',
      render: (val) => (
        <span className="text-xs font-medium text-[#475569] dark:text-slate-300 whitespace-nowrap">
          {val}
        </span>
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
      header: 'Openings', 
      accessor: 'headcount', 
      align: 'center',
      render: (val) => (
        <div className="flex justify-center">
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 whitespace-nowrap">
            {val || 1} {Number(val) === 1 ? 'Opening' : 'Openings'}
          </span>
        </div>
      )
    },
    { 
      header: 'Priority', 
      accessor: 'hiringPriority', 
      align: 'center',
      render: (priority, row) => {
        const p = priority || 'Normal';
        if (p === 'Urgent' || row.isOverdue) {
          return (
            <div className="flex justify-center">
              <span className="px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 flex items-center gap-1 w-fit whitespace-nowrap">
                <Flame size={11} /> Urgent
              </span>
            </div>
          );
        }
        if (p === 'High') {
          return (
            <div className="flex justify-center">
              <span className="px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 w-fit whitespace-nowrap">
                High
              </span>
            </div>
          );
        }
        return (
          <div className="flex justify-center">
            <span className="px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-700 w-fit whitespace-nowrap">
              Normal
            </span>
          </div>
        );
      }
    },
    { 
      header: 'Hiring Manager', 
      accessor: 'hiringManager',
      align: 'left',
      render: (name) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className="w-5.5 h-5.5 rounded-full bg-[#E2E8F0] dark:bg-slate-700 text-[#475569] dark:text-slate-200 text-[10px] font-medium flex items-center justify-center shrink-0">
            {name ? name.split(' ').map(n=>n[0]).join('') : 'HM'}
          </div>
          <span className="text-xs font-medium text-[#0F172A] dark:text-slate-200">{name}</span>
        </div>
      )
    },
    { 
      header: 'Target Hire Date', 
      accessor: 'targetHireDate', 
      align: 'center',
      render: (val) => (
        <span className="font-mono text-xs text-[#475569] dark:text-slate-400 whitespace-nowrap">{formatDateReadable(val)}</span>
      ) 
    }
  ];

  if (currentView === 'create') {
    return (
      <CreateRequisitionPage 
        onNavigate={() => setCurrentView('hub')} 
        onSaveRequisition={(newReq) => {
          handleUpdateRequisition(newReq);
          setCurrentView('hub');
        }} 
      />
    );
  }

  if (currentView === 'details' && selectedReq) {
    return (
      <RequisitionDetails 
        requisition={selectedReq} 
        onBack={() => setCurrentView('hub')}
        onEdit={() => openEdit(selectedReq)}
        simulatedRole={simulatedRole}
        onRoleChange={handleRoleChange}
        brandColor={brandColor} 
        onUpdateRequisition={handleUpdateRequisition}
      />
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
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Requisition Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Operational
                </span>
              </div>
              <p className="text-xs text-slate-500/90 dark:text-slate-400 mt-0.5">Manage and track hiring requests across the organization</p>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            <CustomSelect
              prefix="Role: "
              value={simulatedRole}
              onChange={(val) => handleRoleChange(val)}
              options={[
                { label: 'Hiring Manager', value: 'Hiring Manager' },
                { label: 'Recruiter / HR', value: 'HR Recruiter' },
                { label: 'Department Head', value: 'Department Head / Approver' },
                { label: 'Finance Approver', value: 'Finance Approver' },
                { label: 'Super Admin', value: 'Super Admin' }
              ]}
              size="sm"
              className="w-48"
            />

            {simulatedRole === 'Hiring Manager' && (
              <motion.button 
                onClick={openCreate}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="h-9.5 px-4.5 text-xs font-extrabold text-white bg-[var(--pw-brand)] shadow-md shadow-[var(--pw-brand)]/20 hover:brightness-110 rounded-xl border border-white/20 flex items-center gap-2 shrink-0 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                <Plus size={16} strokeWidth={2.5} /> <span>Create Requisition</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4 FROSTED GLASS KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiStats.map((stat, idx) => {
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
        className="bg-gradient-to-br from-white/70 via-white/65 to-blue-50/30 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl shadow-[0_8px_30px_rgba(26,86,219,0.04)] font-sans space-y-0 relative z-10 overflow-hidden"
      >
        
        {/* CANVAS TOOLBAR: TABS + COMMAND SEARCH + FILTERS */}
        <div className="p-3.5 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md space-y-3">
          
          {/* Level 1: Segmented Pill Preset Navigation Tabs + Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Segmented Pill Tabs Bar */}
            <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: 'all', label: 'All Scoped Reqs', count: presetCounts.all, roles: ['Hiring Manager', 'Department Head / Approver', 'Finance Approver', 'HR Recruiter', 'Super Admin'] },
                { id: 'my_submissions', label: 'My Submissions', count: presetCounts.my_submissions, roles: ['Hiring Manager'] },
                { id: 'pending_approvals', label: 'Pending Approvals', count: presetCounts.pending_approvals, roles: ['Hiring Manager', 'Department Head / Approver', 'Finance Approver', 'Super Admin'] },
                { id: 'recruiter_queue', label: 'Recruiter Queue', count: presetCounts.recruiter_queue, roles: ['HR Recruiter', 'Super Admin'] },
                { id: 'urgent_sla', label: 'Urgent / SLA Overdue', count: presetCounts.urgent_sla, roles: ['Hiring Manager', 'Department Head / Approver', 'Finance Approver', 'HR Recruiter', 'Super Admin'] },
                { id: 'drafts', label: 'My Drafts', count: presetCounts.drafts, roles: ['Hiring Manager'] },
                { id: 'active_open_roles', label: 'Active Open Roles', count: presetCounts.active_open_roles, roles: ['Hiring Manager', 'HR Recruiter', 'Super Admin'] }
              ]
                .filter(p => p.roles.includes(simulatedRole))
                .map(p => {
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
              onClick={() => { setSelectedDept('All'); setSelectedStatus('All'); setSelectedPriority('All'); setActivePreset('all'); setSearch(''); }}
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
              placeholder="Filter requisitions by Title, ID, or Hiring Manager..."
              className="max-w-md"
            />

            {/* Dropdown Filters & Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end w-full md:w-auto">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 w-full sm:w-auto">
                {/* Dept Select */}
                <CustomSelect 
                  prefix="Dept: "
                  value={selectedDept}
                  onChange={(val) => setSelectedDept(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Engineering', value: 'Engineering' },
                    { label: 'Design', value: 'Design' },
                    { label: 'Product', value: 'Product' },
                    { label: 'Sales', value: 'Sales' },
                    { label: 'Marketing', value: 'Marketing' }
                  ]}
                  size="sm"
                  className="w-full sm:w-36"
                />

                {/* Status Select */}
                <CustomSelect 
                  prefix="Status: "
                  value={selectedStatus}
                  onChange={(val) => setSelectedStatus(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Draft', value: 'Draft' },
                    { label: 'Pending Approval', value: 'Pending Approval' },
                    { label: 'Approved', value: 'Approved' },
                    { label: 'Open', value: 'Open' },
                    { label: 'Rejected', value: 'Rejected' }
                  ]}
                  size="sm"
                  className="w-40"
                />

                {/* Priority Select */}
                <CustomSelect 
                  prefix="Priority: "
                  value={selectedPriority}
                  onChange={(val) => setSelectedPriority(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Urgent', value: 'Urgent' },
                    { label: 'High', value: 'High' },
                    { label: 'Normal', value: 'Normal' }
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
                  title={selectedReqsForExport.length > 0 ? `Export ${selectedReqsForExport.length} Selected Requisitions` : "Export CSV"}
                  style={selectedReqsForExport.length > 0 ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                  className={`h-8.5 px-3.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs font-sans cursor-pointer group rounded-xl border ${
                    selectedReqsForExport.length > 0 
                      ? 'text-white shadow-md' 
                      : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <motion.div whileHover={{ y: 1 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.4 }}>
                    <Download size={13} className={selectedReqsForExport.length > 0 ? 'text-white' : 'text-blue-500 group-hover:text-blue-600 transition-colors'} />
                  </motion.div>
                  <span>{selectedReqsForExport.length > 0 ? `Export (${selectedReqsForExport.length})` : 'Export'}</span>
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
                        layoutId="activeViewPill"
                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600/60 -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                  <button 
                    onClick={() => setViewMode('kanban')}
                    style={viewMode === 'kanban' ? { color: brandColor } : {}}
                    className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 font-sans cursor-pointer relative z-10 ${
                      viewMode === 'kanban' 
                        ? 'font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Columns size={13} style={viewMode === 'kanban' ? { color: brandColor } : {}} className={viewMode === 'kanban' ? '' : 'text-slate-400'} />
                    <span>Board</span>
                    {viewMode === 'kanban' && (
                      <motion.div 
                        layoutId="activeViewPill"
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

      {/* Main Grid / Kanban View */}
      {viewMode === 'table' ? (
        <DataTable 
          title="Requisitions Data Grid"
          columns={columns}
          data={filteredReqs}
          selectable={true}
          onSelectionChange={(selectedItems) => setSelectedReqsForExport(selectedItems)}
          onDeleteSelected={(selectedItems) => handleBulkDelete(selectedItems)}
          borderless={true}
          onRowClick={(row) => { setSelectedReq(row); setCurrentView('details'); }}
          onInspect={(row) => setInspectingDrawerReq(row)}
          onEdit={(row) => openEdit(row)}
          onDelete={(row) => setDeletingReq(row)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {['Draft', 'Pending Approval', 'Approved', 'Open', 'Rejected'].map(stage => {
            const stageReqs = filteredReqs.filter(r => r.status === stage);
            return (
              <div key={stage} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{stage}</span>
                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-mono">
                    {stageReqs.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {stageReqs.map(req => (
                    <div 
                      key={req.id} 
                      onClick={() => { setSelectedReq(req); setCurrentView('details'); }}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-brand transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{req.jobTitle}</div>
                        <ModernStatusBadge status={req.status} small />
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 mb-2">{req.id} • {req.department}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>{req.hiringManager}</span>
                        <span className="font-bold font-mono" style={{ color: brandColor }}>{req.headcount} Openings</span>
                      </div>
                    </div>
                  ))}

                  {stageReqs.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      No requisitions
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>

      {/* KPI Trend Graph & Analytics Modal */}
      {activeKpiGraphModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4" dir="ltr">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-br from-white/90 via-slate-50/85 to-white/90 dark:from-slate-900/90 dark:via-slate-900/85 dark:to-slate-950/90 backdrop-blur-2xl border border-white/90 dark:border-slate-700/60 rounded-2xl p-6 max-w-4xl w-full shadow-[0_16px_48px_0_rgba(31,38,135,0.15)] space-y-6 max-h-[90vh] flex flex-col font-sans"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold backdrop-blur-md">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {activeKpiGraphModal.label} - Trend & Performance Graph
                  </h3>
                  <p className="text-xs text-slate-500">Visual analytics, stage velocities, and matching records.</p>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setActiveKpiGraphModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/60 text-rose-500 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200/80 dark:border-rose-800/60 transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                <X size={16} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Modal Graph View Container */}
            <div className="p-4 bg-white/60 dark:bg-slate-950/40 rounded-xl border border-white/80 dark:border-slate-800 backdrop-blur-md h-64 flex items-center justify-center shadow-2xs">
              {activeKpiGraphModal.chartType === 'line' && (
                <CJSLine 
                  labels={activeKpiGraphModal.chartData.labels}
                  datasets={activeKpiGraphModal.chartData.datasets}
                  height={220}
                />
              )}
              {activeKpiGraphModal.chartType === 'bar' && (
                <CJSBar 
                  labels={activeKpiGraphModal.chartData.labels}
                  datasets={activeKpiGraphModal.chartData.datasets}
                  height={220}
                />
              )}
              {activeKpiGraphModal.chartType === 'doughnut' && (
                <CJSDoughnut 
                  labels={activeKpiGraphModal.chartData.labels}
                  data={activeKpiGraphModal.chartData.data}
                  colors={activeKpiGraphModal.chartData.colors}
                  height={220}
                />
              )}
            </div>

            {/* Filtered Data Records Table Below Graph */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Matching Requisition Records ({activeKpiGraphModal.records.length})
              </span>
              {activeKpiGraphModal.records.map(req => (
                <motion.div 
                  key={req.id} 
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { setActiveKpiGraphModal(null); setSelectedReq(req); setCurrentView('details'); }}
                  className="p-3.5 rounded-xl border border-white/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      {req.jobTitle}
                      <ModernStatusBadge status={req.status} small />
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 mt-0.5">{req.id} • {req.department} • {req.hiringManager}</div>
                  </div>
                  <button className="text-xs font-bold flex items-center gap-1 hover:underline" style={{ color: brandColor }}>
                    View Details <ChevronRight size={14} />
                  </button>
                </motion.div>
              ))}

              {activeKpiGraphModal.records.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No records match this KPI metric.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200/80 dark:border-slate-800">
              <motion.button 
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveKpiGraphModal(null)}
                style={{ backgroundColor: brandColor }}
                className="h-9 px-5 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer"
              >
                Close Graph Window
              </motion.button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Slide-Over Quick Inspection Translucent Glass Drawer */}
      {inspectingDrawerReq && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex justify-end" dir="ltr">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="w-full max-w-xl bg-gradient-to-b from-white/90 via-slate-50/80 to-white/90 dark:from-slate-900/90 dark:via-slate-900/85 dark:to-slate-950/90 backdrop-blur-2xl h-full border-l border-white/80 dark:border-slate-700/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] flex flex-col justify-between overflow-y-auto font-sans"
          >
            <div>
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold backdrop-blur-md" style={{ color: brandColor }}>
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{inspectingDrawerReq.jobTitle}</h3>
                      <ModernStatusBadge status={inspectingDrawerReq.status} small />
                    </div>
                    <span className="font-mono text-xs text-slate-500">{inspectingDrawerReq.id} • {inspectingDrawerReq.department}</span>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setInspectingDrawerReq(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/60 text-rose-500 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200/80 dark:border-rose-800/60 transition-all shrink-0 cursor-pointer shadow-2xs"
                >
                  <X size={16} strokeWidth={2.5} />
                </motion.button>
              </div>

              {/* Drawer Body */}
              <div className="p-5 space-y-6">
                
                {/* Live Candidate Pipeline Funnel */}
                <div className="p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">Live Candidate Pipeline</span>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white/80 dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <div className="text-lg font-black text-blue-600 dark:text-blue-400">{inspectingDrawerReq.pipeline?.applied || 0}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Applied</div>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <div className="text-lg font-black text-amber-600 dark:text-amber-400">{inspectingDrawerReq.pipeline?.screened || 0}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Screened</div>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <div className="text-lg font-black text-purple-600 dark:text-purple-400">{inspectingDrawerReq.pipeline?.interviewing || 0}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Interviewing</div>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{inspectingDrawerReq.pipeline?.hired || 0}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Hired</div>
                    </div>
                  </div>
                </div>

                {/* Key Attributes */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/80 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Hiring Manager</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{inspectingDrawerReq.hiringManager}</span>
                  </div>
                  <div className="p-3.5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/80 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Recruiter Assigned</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{inspectingDrawerReq.recruiter || 'Unassigned'}</span>
                  </div>
                  <div className="p-3.5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/80 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Salary Band</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">{inspectingDrawerReq.salaryBand}</span>
                  </div>
                  <div className="p-3.5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/80 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Target Date</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">{formatDateReadable(inspectingDrawerReq.targetHireDate)}</span>
                  </div>
                </div>

                {/* AI Matched Top Candidates Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Top AI Matched Candidates ({inspectingDrawerReq.topCandidates?.length || 0})
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 backdrop-blur-md">
                      {inspectingDrawerReq.aiMatchedCount || 0} Auto-Sourced
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(inspectingDrawerReq.topCandidates || []).map(cand => (
                      <div key={cand.id} className="p-3 bg-white/80 dark:bg-slate-900 backdrop-blur-md rounded-xl border border-white/90 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 font-bold text-xs flex items-center justify-center" style={{ color: brandColor }}>
                            {cand.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">{cand.name}</div>
                            <span className="text-[10px] text-slate-500">{cand.role} • <span className="text-brand font-bold">{cand.stage}</span></span>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {cand.matchScore}% Match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Job Description Preview Snippet */}
                <div className="p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/80 dark:border-slate-800 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Summary</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {inspectingDrawerReq.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer Actions Footer */}
            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex items-center gap-2 sticky bottom-0">
              <motion.button 
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSelectedReq(inspectingDrawerReq);
                  setInspectingDrawerReq(null);
                  setCurrentView('details');
                }}
                style={{ backgroundColor: brandColor }}
                className="flex-1 h-9.5 text-xs font-semibold text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye size={14} /> View Full Requisition Workspace
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => openEdit(inspectingDrawerReq)}
                className="h-9.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800 hover:bg-white border border-white/80 dark:border-slate-700 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 size={13} /> Edit
              </motion.button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingReq}
        onClose={() => setDeletingReq(null)}
        title="Delete Requisition Record"
        message={`Are you sure you want to delete requisition ${deletingReq?.id}? This action cannot be undone.`}
        confirmText="Delete Record"
        onConfirm={() => {
          setRequisitions(prev => prev.filter(r => r.id !== deletingReq.id));
          setDeletingReq(null);
        }}
        brandColor={brandColor}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!bulkDeletingReqs && bulkDeletingReqs.length > 0}
        onClose={() => setBulkDeletingReqs(null)}
        title="Delete Selected Requisitions"
        message={`Are you sure you want to delete ${bulkDeletingReqs?.length || 0} selected requisition records (${bulkDeletingReqs?.map(r => r.id).join(', ')})? This action cannot be undone.`}
        confirmText={`Delete ${bulkDeletingReqs?.length || 0} Records`}
        onConfirm={confirmBulkDelete}
        brandColor={brandColor}
      />

      {/* Enterprise Bulk Action Modal */}
      <EnterpriseBulkActionModal
        isOpen={enterpriseBulkModalOpen}
        onClose={() => setEnterpriseBulkModalOpen(false)}
        selectedReqs={selectedReqsForExport}
        onExecuteBulkAction={handleExecuteEnterpriseBulkAction}
        simulatedRole={simulatedRole}
      />

      {/* 10/10 Enterprise KPI Real-Time Analytics System Modal */}
      {activeKpiGraphModal && (
        <EnterpriseKpiAnalyticsModal
          isOpen={!!activeKpiGraphModal}
          onClose={() => setActiveKpiGraphModal(null)}
          kpiId={activeKpiGraphModal.kpiId}
          kpiLabel={activeKpiGraphModal.label}
          kpiValue={activeKpiGraphModal.records?.length || requisitions.length}
          moduleType="requisition"
          rawRecords={activeKpiGraphModal.records || requisitions}
        />
      )}
    </div>
  );
};

export default RequisitionHub;
