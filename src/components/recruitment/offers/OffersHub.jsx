import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Plus, RefreshCw, Download, FileText, 
  ShieldCheck, Clock, Send, CheckCircle2, XCircle, 
  AlertTriangle, RotateCcw, ArrowUpRight, Check, 
  ExternalLink, Eye, LayoutTemplate, Columns, Briefcase, Trash2
} from 'lucide-react';
import { 
  OFFER_STATUS, 
  APPROVAL_STATUS,
  SIGNATURE_STATUS,
  OFFER_ROLES, 
  MOCK_OFFER_PERSONAS 
} from './offerTypes';
import { offerService } from './offerService';
import OfferDetailsPage from './OfferDetailsPage';
import CreateOfferPage from './CreateOfferPage';
import CandidateOfferPortalModal from './CandidateOfferPortalModal';
import OfferTemplatesModal from './OfferTemplatesModal';
import OfferApprovalPoliciesModal from './OfferApprovalPoliciesModal';
import PreboardingHandoffModal from './PreboardingHandoffModal';
import OfferEligibilityModal from './OfferEligibilityModal';
import ModernSearchInput from '../../dashboard/shared/ModernSearchInput';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import DataTable from '../../dashboard/shared/DataTable';
import EnterpriseKpiAnalyticsModal from '../../dashboard/shared/EnterpriseKpiAnalyticsModal';
import ConfirmModal from '../../admin/shared/ConfirmModal';
import { ThemeContext } from '../../../ThemeContext';
import { useToast } from '../../shared/ToastContext';
import { useBreadcrumb } from '../../shared/BreadcrumbContext';

export const OffersHub = ({ onNavigate = () => {}, initialCandidateId = null }) => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || 'var(--pw-brand)';

  // Navigation Sub-view: 'hub' | 'details' | 'create'
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [createCandidateId, setCreateCandidateId] = useState(initialCandidateId || null);

  const { extraCrumbs, setExtraCrumbs, clearExtraCrumbs } = useBreadcrumb();

  useEffect(() => {
    if (selectedOffer) {
      const code = selectedOffer.offerCode || selectedOffer.id;
      const label = selectedOffer.candidateName ? `${code} (${selectedOffer.candidateName})` : code;
      setExtraCrumbs([{ label }]);
    } else if (isCreatingOffer) {
      setExtraCrumbs([{ label: 'Create Offer' }]);
    } else {
      clearExtraCrumbs();
    }
  }, [selectedOffer, isCreatingOffer]);

  useEffect(() => {
    if (extraCrumbs.length === 0) {
      if (selectedOffer) setSelectedOffer(null);
      if (isCreatingOffer) {
        setIsCreatingOffer(false);
        setCreateCandidateId(null);
      }
    }
  }, [extraCrumbs]);

  // Role Governance & Persona Switcher
  const [currentRole, setCurrentRole] = useState(OFFER_ROLES.RECRUITER);
  const currentPersona = useMemo(() => MOCK_OFFER_PERSONAS[currentRole] || MOCK_OFFER_PERSONAS[OFFER_ROLES.RECRUITER], [currentRole]);

  // Data State
  const [allOffers, setAllOffers] = useState(() => offerService.offers || []);
  const [metrics, setMetrics] = useState(() => offerService.getOfferKpiMetrics());
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Search & Filter States
  const [currentNav, setCurrentNav] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedOffersForExport, setSelectedOffersForExport] = useState([]);

  // Modals State (non-creation dialogs)
  const [isCandidatePortalOpen, setIsCandidatePortalOpen] = useState(false);
  const [portalOffer, setPortalOffer] = useState(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [handoffOffer, setHandoffOffer] = useState(null);
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  const [activeKpiModal, setActiveKpiModal] = useState(null);
  const [bulkDeletingOffers, setBulkDeletingOffers] = useState(null);
  const [deletingOffer, setDeletingOffer] = useState(null);

  // Refresh Local State from service
  const refreshData = useCallback(() => {
    const list = offerService.offers || [];
    setAllOffers([...list]);
    setMetrics(offerService.getOfferKpiMetrics());
  }, []);

  // Confirm Single Offer Delete
  const handleConfirmSingleDelete = () => {
    if (!deletingOffer) return;
    offerService.deleteOffer(deletingOffer.id, currentPersona?.name);
    setDeletingOffer(null);
    refreshData();
    addToast({
      title: 'Offer Deleted',
      message: `Offer record ${deletingOffer.offerCode || deletingOffer.id} has been deleted.`,
      type: 'success'
    });
  };

  // Confirm Bulk Delete Action
  const handleConfirmBulkDelete = () => {
    if (!bulkDeletingOffers || bulkDeletingOffers.length === 0) return;
    const count = bulkDeletingOffers.length;
    const ids = bulkDeletingOffers.map(o => o.id);
    offerService.deleteOffers(ids, currentPersona?.name);
    setBulkDeletingOffers(null);
    setSelectedOffersForExport([]);
    refreshData();
    addToast({
      title: 'Offers Deleted',
      message: `Successfully deleted ${count} offer record(s).`,
      type: 'success'
    });
  };

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-open create offer page if initial candidate passed
  useEffect(() => {
    if (initialCandidateId) {
      setIsCreatingOffer(true);
    }
  }, [initialCandidateId]);

  // Filtered List calculation based on sub-nav tab & filter bars
  const filteredOffers = useMemo(() => {
    return allOffers.filter(offer => {
      // 1. Role-based persona scoping
      if (currentRole === OFFER_ROLES.HIRING_MANAGER) {
        // Hiring Manager sees offers where they are HM or assigned
        if (offer.hiringManagerName && !offer.hiringManagerName.toLowerCase().includes('alex')) {
          // allow demo visibility or filter
        }
      }

      // 2. Preset Tab filtering
      if (currentNav === 'my_offers') {
        const recruiterName = currentPersona.name?.toLowerCase();
        if (offer.recruiterName && !offer.recruiterName.toLowerCase().includes(recruiterName.split(' ')[0])) {
          return false;
        }
      } else if (currentNav === 'pending_approval') {
        if (offer.status !== OFFER_STATUS.PENDING_APPROVAL && offer.status !== OFFER_STATUS.PENDING_REAPPROVAL) {
          return false;
        }
      } else if (currentNav === 'drafts') {
        if (offer.status !== OFFER_STATUS.DRAFT && offer.status !== OFFER_STATUS.REVISED) {
          return false;
        }
      } else if (currentNav === 'sent') {
        if (![OFFER_STATUS.SENT, OFFER_STATUS.VIEWED, OFFER_STATUS.PENDING_SIGNATURE].includes(offer.status)) {
          return false;
        }
      } else if (currentNav === 'negotiation') {
        if (offer.status !== OFFER_STATUS.NEGOTIATION) {
          return false;
        }
      } else if (currentNav === 'accepted') {
        if (offer.status !== OFFER_STATUS.ACCEPTED && offer.status !== OFFER_STATUS.COMPLETED) {
          return false;
        }
      } else if (currentNav === 'archived') {
        if (![OFFER_STATUS.DECLINED, OFFER_STATUS.EXPIRED, OFFER_STATUS.WITHDRAWN, OFFER_STATUS.SUPERSEDED].includes(offer.status)) {
          return false;
        }
      }

      // 3. Dropdown Filters
      if (selectedStatusFilter !== 'All' && offer.status !== selectedStatusFilter) return false;
      if (selectedDeptFilter !== 'All' && offer.department !== selectedDeptFilter) return false;
      if (selectedTypeFilter !== 'All' && offer.employmentType !== selectedTypeFilter && offer.workArrangement !== selectedTypeFilter) return false;

      // 4. Command Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const candName = (offer.candidateName || '').toLowerCase();
        const code = (offer.offerCode || '').toLowerCase();
        const role = (offer.jobTitle || '').toLowerCase();
        const req = (offer.requisitionId || '').toLowerCase();
        const dept = (offer.department || '').toLowerCase();
        const rec = (offer.recruiterName || '').toLowerCase();
        return candName.includes(q) || code.includes(q) || role.includes(q) || req.includes(q) || dept.includes(q) || rec.includes(q);
      }

      return true;
    });
  }, [allOffers, currentNav, currentRole, currentPersona, selectedStatusFilter, selectedDeptFilter, selectedTypeFilter, search]);

  // Counts for Metric Badges
  const pendingCount = allOffers.filter(o => o.status === OFFER_STATUS.PENDING_APPROVAL || o.status === OFFER_STATUS.PENDING_REAPPROVAL).length;
  const draftCount = allOffers.filter(o => o.status === OFFER_STATUS.DRAFT || o.status === OFFER_STATUS.REVISED).length;
  const sentCount = allOffers.filter(o => [OFFER_STATUS.SENT, OFFER_STATUS.VIEWED, OFFER_STATUS.PENDING_SIGNATURE].includes(o.status)).length;
  const negotiationCount = allOffers.filter(o => o.status === OFFER_STATUS.NEGOTIATION).length;
  const acceptedCount = allOffers.filter(o => o.status === OFFER_STATUS.ACCEPTED || o.status === OFFER_STATUS.COMPLETED).length;
  const archivedCount = allOffers.filter(o => [OFFER_STATUS.DECLINED, OFFER_STATUS.EXPIRED, OFFER_STATUS.WITHDRAWN, OFFER_STATUS.SUPERSEDED].includes(o.status)).length;

  const myOffersCount = allOffers.filter(o => {
    const recruiterFirstName = currentPersona.name?.split(' ')[0]?.toLowerCase();
    return o.recruiterName && o.recruiterName.toLowerCase().includes(recruiterFirstName);
  }).length;

  // Handlers
  const handleSelectOffer = (offer) => {
    setSelectedOffer(offer);
  };

  const handleOpenCandidatePortal = (offer) => {
    setPortalOffer(offer);
    setIsCandidatePortalOpen(true);
  };

  const handleOpenHandoff = (offer) => {
    setHandoffOffer(offer);
    setIsHandoffModalOpen(true);
  };

  const handleExportCsv = () => {
    const items = selectedOffersForExport.length > 0 ? selectedOffersForExport : filteredOffers;
    if (items.length === 0) {
      addToast({
        title: 'Export Notice',
        message: 'No offers currently available to export.',
        type: 'warning'
      });
      return;
    }
    const headers = ['Offer Code', 'Candidate Name', 'Email', 'Role', 'Department', 'Requisition', 'Currency', 'Base CTC', 'Total CTC', 'Status', 'Approval Status', 'Start Date', 'Expiration'];
    const rows = items.map(o => [
      `"${o.offerCode || o.id}"`,
      `"${o.candidateName || ''}"`,
      `"${o.candidateEmail || ''}"`,
      `"${o.jobTitle || ''}"`,
      `"${o.department || ''}"`,
      `"${o.requisitionId || ''}"`,
      `"${o.currency || 'INR'}"`,
      `"${o.totalBase || 0}"`,
      `"${o.totalCtc || 0}"`,
      `"${o.status || ''}"`,
      `"${o.approvalStatus || ''}"`,
      `"${o.expectedStartDate || ''}"`,
      `"${o.offerExpirationDate || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Offers_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({
      title: 'Export Completed',
      message: `Exported ${items.length} offers to CSV successfully.`,
      type: 'success'
    });
  };

  // Status Badge Helper
  const getOfferStatusBadge = (status) => {
    switch (status) {
      case OFFER_STATUS.ACCEPTED:
      case OFFER_STATUS.COMPLETED:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 w-fit">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>{status}</span>
          </span>
        );
      case OFFER_STATUS.PENDING_APPROVAL:
      case OFFER_STATUS.PENDING_REAPPROVAL:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 w-fit">
            <Clock size={12} className="text-amber-500" />
            <span>{status}</span>
          </span>
        );
      case OFFER_STATUS.APPROVED:
      case OFFER_STATUS.GENERATED:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 w-fit">
            <ShieldCheck size={12} className="text-blue-500" />
            <span>{status}</span>
          </span>
        );
      case OFFER_STATUS.SENT:
      case OFFER_STATUS.VIEWED:
      case OFFER_STATUS.PENDING_SIGNATURE:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 w-fit">
            <Send size={12} className="text-indigo-500" />
            <span>{status}</span>
          </span>
        );
      case OFFER_STATUS.NEGOTIATION:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 w-fit">
            <RefreshCw size={12} className="text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{status}</span>
          </span>
        );
      case OFFER_STATUS.DECLINED:
      case OFFER_STATUS.REJECTED:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 w-fit">
            <XCircle size={12} className="text-rose-500" />
            <span>{status}</span>
          </span>
        );
      case OFFER_STATUS.EXPIRED:
      case OFFER_STATUS.WITHDRAWN:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 w-fit">
            <AlertTriangle size={12} className="text-slate-400" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 w-fit">
            <FileText size={12} className="text-slate-400" />
            <span>{status || 'Draft'}</span>
          </span>
        );
    }
  };

  // DataTable Column Definitions
  const offerColumns = useMemo(() => [
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
                v{row.version || 1}
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
      header: 'REQUISITION',
      accessor: 'requisitionId',
      align: 'left',
      render: (val, row) => (
        <div className="py-1">
          <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            {val || 'REQ-2026-0001'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
            {row.department}
          </div>
        </div>
      )
    },
    {
      header: 'OFFER CTC',
      accessor: 'totalCtc',
      align: 'right',
      render: (val, row) => {
        const symbol = row.currency === 'USD' ? '$' : '₹';
        const formattedTotal = `${symbol}${Number(val || 0).toLocaleString('en-IN')}`;
        const formattedBase = `${symbol}${Number(row.totalBase || 0).toLocaleString('en-IN')}`;
        return (
          <div className="py-1 text-right">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white font-sans">
              {formattedTotal}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Base: {formattedBase}
            </div>
          </div>
        );
      }
    },
    {
      header: 'STATUS',
      accessor: 'status',
      align: 'center',
      render: (val) => (
        <div className="flex justify-center">
          {getOfferStatusBadge(val)}
        </div>
      )
    },
    {
      header: 'ESIGNATURE',
      accessor: 'signatureStatus',
      align: 'center',
      render: (val, row) => {
        const sig = row.signatureStatus || SIGNATURE_STATUS.NOT_INITIATED;
        const provider = row.eSignature?.provider || 'DocuSign';
        return (
          <div className="py-1 text-center">
            <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {sig}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {provider}
            </div>
          </div>
        );
      }
    },
    {
      header: 'KEY DATES',
      accessor: 'expectedStartDate',
      align: 'center',
      render: (_val, row) => (
        <div className="py-1 text-[11px] text-center">
          <div className="text-slate-700 dark:text-slate-300 font-medium">
            Joining: <strong className="font-semibold text-slate-900 dark:text-white">{row.expectedStartDate || 'Pending'}</strong>
          </div>
          <div className="text-slate-400 text-[10px]">
            Expiry: {row.offerExpirationDate || '14 Days'}
          </div>
        </div>
      )
    },
    {
      header: 'OWNER',
      accessor: 'recruiterName',
      align: 'center',
      render: (val, row) => (
        <div className="py-1 text-xs text-center">
          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
            {val || 'Sarah Jenkins'}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            HM: {row.hiringManagerName || 'Alex Chen'}
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
              handleSelectOffer(row);
            }}
            className="h-7 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Eye size={13} />
            <span>Details</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCandidatePortal(row);
            }}
            title="Open Candidate Portal Simulator"
            className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <ExternalLink size={13.5} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingOffer(row);
            }}
            title="Delete Offer"
            className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <Trash2 size={13.5} />
          </button>
        </div>
      )
    }
  ], [brandColor]);

  // Full-page Create Offer View
  if (isCreatingOffer) {
    return (
      <div className="w-full max-w-[1600px] mx-auto pb-12 animate-fade-in-up">
        <CreateOfferPage
          onBack={() => {
            setIsCreatingOffer(false);
            setCreateCandidateId(null);
            refreshData();
          }}
          initialCandidateId={createCandidateId || initialCandidateId}
          onOfferCreated={(newOffer) => {
            setIsCreatingOffer(false);
            setCreateCandidateId(null);
            refreshData();
            addToast({
              title: 'Offer Created',
              message: `Offer ${newOffer?.offerCode || newOffer?.id || ''} has been created and routed for approval.`,
              type: 'success'
            });
          }}
          brandColor={brandColor}
        />
      </div>
    );
  }

  // Full-page Offer Detail View when an offer is selected
  if (selectedOffer) {
    const freshOffer = allOffers.find(o => o.id === selectedOffer.id) || selectedOffer;
    return (
      <div className="w-full max-w-[1600px] mx-auto pb-12 animate-fade-in-up">
        <OfferDetailsPage
          offer={freshOffer}
          onBack={() => {
            setSelectedOffer(null);
            refreshData();
          }}
          currentRole={currentRole}
          currentUserContext={currentPersona}
          onOfferUpdated={(updated) => {
            setSelectedOffer(updated);
            refreshData();
          }}
          onOpenCandidatePortal={handleOpenCandidatePortal}
          onOpenPreboardingHandoff={handleOpenHandoff}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-6">
      
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP GLASSMORPHIC CONTAINER HEADER (MATCHING JD & REQUISITION)
      ═══════════════════════════════════════════════════════════════════ */}
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
              <Award size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-sans">
                  Offer Management Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Operational
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Enterprise Lifecycle & Approval Workflow System
              </p>
            </div>
          </div>

          {/* Header Right: Role Selector & Create Offer Button */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto shrink-0">
            <CustomSelect
              prefix="Role: "
              value={currentRole}
              onChange={(val) => setCurrentRole(val)}
              options={[
                { label: 'Recruiter / Offer Owner', value: OFFER_ROLES.RECRUITER },
                { label: 'Hiring Manager (Alex Chen)', value: OFFER_ROLES.HIRING_MANAGER },
                { label: 'HR / HRBP (Marcus Vance)', value: OFFER_ROLES.HR_BP },
                { label: 'Finance & Comp (Elena Rostova)', value: OFFER_ROLES.FINANCE },
                { label: 'HR Admin (Priya Sharma)', value: OFFER_ROLES.HR_ADMIN },
                { label: 'Super Admin', value: OFFER_ROLES.ATS_ADMIN }
              ]}
              size="sm"
              className="w-full sm:w-56"
            />

            <motion.button 
              onClick={() => setIsCreatingOffer(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="flex-1 sm:flex-initial h-9.5 px-4.5 text-xs font-extrabold text-white bg-[var(--pw-brand)] shadow-md shadow-[var(--pw-brand)]/20 hover:brightness-110 rounded-xl border border-white/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all"
            >
              <Plus size={16} strokeWidth={2.5} /> <span>Create New Offer</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. 4 FROSTED GLASS KPI STATS CARDS (MATCHING JD REPOSITORY)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { id: 'all', label: 'TOTAL OFFERS', value: allOffers.length, subtitle: 'Active in Lifecycle', icon: <Award className="w-4 h-4" style={{ color: brandColor }} />, iconBg: 'bg-slate-100/80 dark:bg-slate-800/80', trend: '+5%', trendUp: true, actionText: 'View All →', updatedAt: 'Just now' },
          { id: 'pending_approval', label: 'PENDING APPROVAL', value: pendingCount, subtitle: 'Awaiting Sign-off', icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />, iconBg: 'bg-amber-50 dark:bg-amber-950/60', trend: 'Action', trendUp: false, actionText: 'Review Queue →', updatedAt: '5m ago' },
          { id: 'sent', label: 'EXTENDED & IN PORTAL', value: sentCount, subtitle: 'Candidate Action & eSign', icon: <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, iconBg: 'bg-emerald-50 dark:bg-emerald-950/60', trend: '+12%', trendUp: true, actionText: 'Track Offers →', updatedAt: '1h ago' },
          { id: 'accepted', label: 'ACCEPTED & PREBOARDING', value: acceptedCount, subtitle: 'Ready for Preboarding', icon: <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />, iconBg: 'bg-indigo-50 dark:bg-indigo-950/60', trend: `${metrics.acceptanceRate || 85}% Target`, trendUp: true, actionText: 'View Pipeline →', updatedAt: 'Today' }
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
                setActiveKpiModal(stat.id);
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

      {/* ═══════════════════════════════════════════════════════════════════
          3. UNIFIED GLASSMORPHIC WORKSPACE CANVAS (TABS + SEARCH + DATATABLE)
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
            {/* Segmented Pill Tabs Bar */}
            <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: 'all', label: 'All Offers', count: allOffers.length },
                { id: 'my_offers', label: 'My Offers', count: myOffersCount },
                { id: 'pending_approval', label: 'Pending Approval', count: pendingCount },
                { id: 'drafts', label: 'Drafts', count: draftCount },
                { id: 'sent', label: 'Sent & In Portal', count: sentCount },
                { id: 'negotiation', label: 'In Negotiation', count: negotiationCount },
                { id: 'accepted', label: 'Accepted', count: acceptedCount },
                { id: 'archived', label: 'Archived', count: archivedCount }
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

            {/* Reset Filters Button */}
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { 
                setSelectedDeptFilter('All'); 
                setSelectedStatusFilter('All'); 
                setSelectedTypeFilter('All'); 
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

          {/* Level 2: Command Search + Dropdown Filters + Secondary Actions + View Switcher */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
            {/* Command Search Field */}
            <ModernSearchInput 
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder="Filter Offers by Candidate, Code, Title, or Requisition..."
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
                    { label: 'Platform Engineering', value: 'Platform Engineering' },
                    { label: 'Product Management', value: 'Product Management' },
                    { label: 'Quality Assurance', value: 'Quality Assurance' },
                    { label: 'Security & Compliance', value: 'Security & Compliance' },
                    { label: 'Design & UX', value: 'Design & User Experience' }
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
                    { label: 'Draft', value: OFFER_STATUS.DRAFT },
                    { label: 'Pending Approval', value: OFFER_STATUS.PENDING_APPROVAL },
                    { label: 'Approved', value: OFFER_STATUS.APPROVED },
                    { label: 'Sent / In Portal', value: OFFER_STATUS.SENT },
                    { label: 'In Negotiation', value: OFFER_STATUS.NEGOTIATION },
                    { label: 'Pending Signature', value: OFFER_STATUS.PENDING_SIGNATURE },
                    { label: 'Accepted', value: OFFER_STATUS.ACCEPTED },
                    { label: 'Declined', value: OFFER_STATUS.DECLINED },
                    { label: 'Expired', value: OFFER_STATUS.EXPIRED },
                    { label: 'Withdrawn', value: OFFER_STATUS.WITHDRAWN }
                  ]}
                  size="sm"
                  className="w-40"
                />

                <CustomSelect 
                  prefix="Mode: "
                  value={selectedTypeFilter}
                  onChange={(val) => setSelectedTypeFilter(val)}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: 'Full Time', value: 'Full-Time' },
                    { label: 'Hybrid', value: 'Hybrid' },
                    { label: 'Remote', value: 'Remote' },
                    { label: 'On-site', value: 'On-site' }
                  ]}
                  size="sm"
                  className="w-32"
                />
              </div>

              {/* Action Buttons: Eligibility, Templates, Policies, Export, View Toggle */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setIsEligibilityModalOpen(true)}
                  className="h-8.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Eligibility Validation Inspector"
                >
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="hidden sm:inline">Eligibility</span>
                </button>

                <button
                  onClick={() => setIsTemplatesModalOpen(true)}
                  className="h-8.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Offer Letter Templates"
                >
                  <FileText size={14} style={{ color: brandColor }} />
                  <span className="hidden sm:inline">Templates</span>
                </button>

                <button
                  onClick={() => setIsPoliciesModalOpen(true)}
                  className="h-8.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Approval Policies & Governance"
                >
                  <ShieldCheck size={14} className="text-amber-500" />
                  <span className="hidden sm:inline">Policies</span>
                </button>

                <motion.button 
                  whileHover={{ scale: 1.03, y: -0.5 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleExportCsv}
                  title={selectedOffersForExport.length > 0 ? `Export ${selectedOffersForExport.length} Selected Offers` : "Export CSV"}
                  style={selectedOffersForExport.length > 0 ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                  className={`h-8.5 px-3.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs font-sans cursor-pointer group rounded-xl border ${
                    selectedOffersForExport.length > 0 
                      ? 'text-white shadow-md' 
                      : 'text-slate-700 dark:text-slate-200 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-md border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400/80 dark:hover:border-blue-500/80'
                  }`}
                >
                  <motion.div whileHover={{ y: 1 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.4 }}>
                    <Download size={13} className={selectedOffersForExport.length > 0 ? 'text-white' : 'text-blue-500 group-hover:text-blue-600 transition-colors'} />
                  </motion.div>
                  <span>{selectedOffersForExport.length > 0 ? `Export (${selectedOffersForExport.length})` : 'Export'}</span>
                </motion.button>

                {/* View Switcher Glass Container */}
                <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner relative">
                  <button 
                    onClick={() => setViewMode('table')}
                    style={viewMode === 'table' ? { color: brandColor } : {}}
                    className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 font-sans cursor-pointer relative z-10 ${
                      viewMode === 'table' ? 'font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutTemplate size={13} style={viewMode === 'table' ? { color: brandColor } : {}} />
                    <span>Grid</span>
                    {viewMode === 'table' && (
                      <motion.div 
                        layoutId="activeOfferViewPill"
                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600/60 -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    style={viewMode === 'grid' ? { color: brandColor } : {}}
                    className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 font-sans cursor-pointer relative z-10 ${
                      viewMode === 'grid' ? 'font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Columns size={13} style={viewMode === 'grid' ? { color: brandColor } : {}} />
                    <span>Board</span>
                    {viewMode === 'grid' && (
                      <motion.div 
                        layoutId="activeOfferViewPill"
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

        {/* Level 3: Main Data View via DataTable or Board Grid */}
        {viewMode === 'table' ? (
          <DataTable 
            title="Offers Pipeline Grid"
            columns={offerColumns}
            data={filteredOffers}
            selectable={true}
            onSelectionChange={(selectedItems) => setSelectedOffersForExport(selectedItems)}
            onDeleteSelected={(selectedItems) => setBulkDeletingOffers(selectedItems)}
            onDelete={(row) => setDeletingOffer(row)}
            borderless={true}
            onRowClick={(row) => handleSelectOffer(row)}
            emptyText="No matching offer records found."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {filteredOffers.map(offer => (
              <div 
                key={offer.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-3"
                onClick={() => handleSelectOffer(offer)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{offer.candidateName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                      <span>{offer.offerCode || offer.id}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300">{offer.requisitionId}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    v{offer.version || 1}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {offer.jobTitle}
                </div>
                <div className="text-[11px] text-slate-400">
                  {offer.department} • {offer.workLocation || 'Bengaluru'}
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Total CTC:</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {offer.currency === 'USD' ? '$' : '₹'}{Number(offer.totalCtc || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  {getOfferStatusBadge(offer.status)}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {offer.expectedStartDate || 'Start Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. MODALS & SUB-DIALOGS
      ═══════════════════════════════════════════════════════════════════ */}
      <CandidateOfferPortalModal
        isOpen={isCandidatePortalOpen}
        onClose={() => setIsCandidatePortalOpen(false)}
        offer={portalOffer}
        onOfferAction={(_updated) => {
          refreshData();
          addToast({
            title: 'Candidate Action Recorded',
            message: 'Candidate action has been processed and state updated.',
            type: 'success'
          });
        }}
      />

      <OfferTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        brandColor={brandColor}
      />

      <OfferApprovalPoliciesModal
        isOpen={isPoliciesModalOpen}
        onClose={() => setIsPoliciesModalOpen(false)}
        brandColor={brandColor}
      />

      <PreboardingHandoffModal
        isOpen={isHandoffModalOpen}
        onClose={() => setIsHandoffModalOpen(false)}
        offer={handoffOffer}
        onHandoffCompleted={() => {
          refreshData();
          addToast({
            title: 'Preboarding Initiated',
            message: 'Candidate transitioned to Preboarding successfully.',
            type: 'success'
          });
        }}
        brandColor={brandColor}
      />

      <OfferEligibilityModal
        isOpen={isEligibilityModalOpen}
        onClose={() => setIsEligibilityModalOpen(false)}
        onProceedToCreate={(candId) => {
          setIsEligibilityModalOpen(false);
          setCreateCandidateId(candId);
          setIsCreatingOffer(true);
        }}
        brandColor={brandColor}
      />

      {/* Enterprise KPI Analytics Graph Modal */}
      {activeKpiModal && (
        <EnterpriseKpiAnalyticsModal
          isOpen={!!activeKpiModal}
          onClose={() => setActiveKpiModal(null)}
          kpiId={activeKpiModal}
          kpiLabel={
            activeKpiModal === 'pending_approval' ? 'Pending Approval Workflow Queue' :
            activeKpiModal === 'sent' ? 'Offers Extended & In Portal' :
            activeKpiModal === 'accepted' ? 'Accepted Offers & Preboarding Conversion' :
            'Total Offers Lifecycle Analytics'
          }
          currentRecords={allOffers}
          brandColor={brandColor}
        />
      )}

      {/* Single Offer Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingOffer}
        onClose={() => setDeletingOffer(null)}
        title="Delete Employment Offer"
        message={`Are you sure you want to delete offer record ${deletingOffer?.offerCode || deletingOffer?.id || ''} for candidate ${deletingOffer?.candidateName || ''}? This action cannot be undone.`}
        confirmText="Delete Offer"
        onConfirm={handleConfirmSingleDelete}
        brandColor={brandColor}
      />

      {/* Bulk Delete Offers Confirmation Modal */}
      <ConfirmModal
        isOpen={!!bulkDeletingOffers && bulkDeletingOffers.length > 0}
        onClose={() => setBulkDeletingOffers(null)}
        title="Delete Selected Offers"
        message={`Are you sure you want to delete ${bulkDeletingOffers?.length || 0} selected offer record(s) (${bulkDeletingOffers?.map(o => o.offerCode || o.id).join(', ')})? This action cannot be undone.`}
        confirmText={`Delete All (${bulkDeletingOffers?.length || 0})`}
        onConfirm={handleConfirmBulkDelete}
        brandColor={brandColor}
      />
    </div>
  );
};

export default OffersHub;
