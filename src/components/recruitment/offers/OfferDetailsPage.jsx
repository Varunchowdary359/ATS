import React, { useState, useMemo } from 'react';
import { 
  Eye, User, Briefcase, DollarSign, Sparkles, CheckCircle2, 
  ShieldCheck, FileText, RotateCcw, FileCheck, Activity, History 
} from 'lucide-react';
import { OFFER_STATUS, APPROVAL_STATUS } from './offerTypes';
import { offerService } from './offerService';
import { useToast } from '../../shared/ToastContext';

// Modular Sub-components
import { OfferHeader } from './details/OfferHeader';
import { OfferTabsNav } from './details/OfferTabsNav';
import { OfferOverviewTab } from './details/OfferOverviewTab';
import { OfferContextTab } from './details/OfferContextTab';
import { OfferEmploymentTab } from './details/OfferEmploymentTab';
import { OfferCompensationTab } from './details/OfferCompensationTab';
import { OfferBenefitsTab } from './details/OfferBenefitsTab';
import { OfferConditionsTab } from './details/OfferConditionsTab';
import { OfferApprovalsTab } from './details/OfferApprovalsTab';
import { OfferLetterTab } from './details/OfferLetterTab';
import { OfferNegotiationTab } from './details/OfferNegotiationTab';
import { OfferEsignatureTab } from './details/OfferEsignatureTab';
import { OfferCandidatePortalTab } from './details/OfferCandidatePortalTab';
import { OfferAuditTab } from './details/OfferAuditTab';
import { 
  ApprovalDecisionModal, 
  NegotiationCounterModal, 
  WithdrawOfferModal 
} from './details/OfferModals';

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'context', label: 'Candidate & Position', icon: User },
  { id: 'employment', label: 'Employment Terms', icon: Briefcase },
  { id: 'compensation', label: 'Compensation & CTC', icon: DollarSign },
  { id: 'benefits', label: 'Benefits & Perks', icon: Sparkles },
  { id: 'conditions', label: 'Conditions & BGV', icon: CheckCircle2 },
  { id: 'approvals', label: 'Approval Chain', icon: ShieldCheck },
  { id: 'letter', label: 'Offer Letter', icon: FileText },
  { id: 'negotiation', label: 'Negotiation', icon: RotateCcw },
  { id: 'esignature', label: 'eSignature', icon: FileCheck },
  { id: 'candidate_portal', label: 'Candidate Activity', icon: Activity },
  { id: 'audit', label: 'Audit Trail', icon: History }
];

export const OfferDetailsPage = ({ 
  offer: initialOffer, 
  onBack, 
  currentRole = 'recruiter', 
  currentUserContext = {}, 
  onOfferUpdated = () => {},
  onOpenCandidatePortal = () => {},
  onOpenPreboardingHandoff = () => {},
  brandColor = 'var(--pw-brand)' 
}) => {
  const { addToast } = useToast();
  const [offer, setOffer] = useState(initialOffer);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalDecisionType, setApprovalDecisionType] = useState('APPROVE');
  const [approvalComments, setApprovalComments] = useState('');
  
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterDecision, setCounterDecision] = useState('COUNTER');
  const [counterBaseSalary, setCounterBaseSalary] = useState(offer?.totalBase || 0);
  const [counterStartDate, setCounterStartDate] = useState(offer?.expectedStartDate || '');
  const [counterReason, setCounterReason] = useState('');

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('Business Decision / Reorganization');

  // Format Helper
  const formatCurrency = (amount) => {
    return `${offer?.currency === 'USD' ? '$' : '₹'}${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const isPendingMyApproval = useMemo(() => {
    if (!offer) return false;
    if (offer.status !== OFFER_STATUS.PENDING_APPROVAL && offer.status !== OFFER_STATUS.PENDING_REAPPROVAL) return false;
    return Array.isArray(offer.approvals) && offer.approvals.some(a => a.role === currentRole && a.status === APPROVAL_STATUS.PENDING);
  }, [offer, currentRole]);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case OFFER_STATUS.ACCEPTED:
      case OFFER_STATUS.COMPLETED:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
          dot: 'bg-emerald-500',
          label: status
        };
      case OFFER_STATUS.APPROVED:
      case OFFER_STATUS.GENERATED:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/60',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800',
          dot: 'bg-blue-500',
          label: status
        };
      case OFFER_STATUS.PENDING_APPROVAL:
      case OFFER_STATUS.PENDING_REAPPROVAL:
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
          label: status
        };
      case OFFER_STATUS.SENT:
      case OFFER_STATUS.VIEWED:
      case OFFER_STATUS.PENDING_SIGNATURE:
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/60',
          text: 'text-indigo-700 dark:text-indigo-300',
          border: 'border-indigo-200 dark:border-indigo-800',
          dot: 'bg-indigo-500',
          label: status
        };
      case OFFER_STATUS.NEGOTIATION:
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
          label: status
        };
      case OFFER_STATUS.DECLINED:
      case OFFER_STATUS.REJECTED:
      case OFFER_STATUS.WITHDRAWN:
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/60',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-200 dark:border-rose-800',
          dot: 'bg-rose-500',
          label: status
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
          label: status || 'Draft'
        };
    }
  };

  const badgeStyle = getStatusBadge(offer?.status);

  // Business Action Handlers
  const handleGenerateLetter = async () => {
    if (!offer) return;
    setActionLoading(true);
    try {
      const res = await offerService.generateOfferLetter(offer.id, offer.templateId || 'TMPL-IND-FT-01', currentUserContext?.name);
      setOffer(res.offer);
      onOfferUpdated(res.offer);
      setActiveTab('letter');
      addToast({
        title: 'Letter Generated',
        message: `Offer letter v${res.offer.version} generated successfully.`,
        type: 'success'
      });
    } catch (e) {
      addToast({
        title: 'Generation Error',
        message: e.message || 'Failed to generate offer letter.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendOffer = async () => {
    if (!offer) return;
    setActionLoading(true);
    try {
      const res = await offerService.sendOfferToCandidate(offer.id, {}, currentUserContext?.name);
      setOffer(res);
      onOfferUpdated(res);
      addToast({
        title: 'Offer Sent',
        message: `Offer extended to ${offer.candidateName} via candidate portal.`,
        type: 'success'
      });
    } catch (e) {
      addToast({
        title: 'Dispatch Error',
        message: e.message || 'Failed to dispatch offer.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessApproval = async () => {
    if (!offer) return;
    setActionLoading(true);
    try {
      const res = await offerService.processApprovalDecision(offer.id, {
        role: currentRole,
        decision: approvalDecisionType,
        comments: approvalComments
      }, currentUserContext?.name);
      setOffer(res);
      onOfferUpdated(res);
      setShowApprovalModal(false);
      addToast({
        title: 'Approval Recorded',
        message: `Decision (${approvalDecisionType}) recorded successfully.`,
        type: 'success'
      });
    } catch (e) {
      addToast({
        title: 'Approval Error',
        message: e.message || 'Failed to process approval decision.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessNegotiation = async () => {
    if (!offer) return;
    setActionLoading(true);
    try {
      const res = await offerService.processNegotiationResponse(offer.id, {
        decision: counterDecision,
        revisedData: {
          totalBase: counterBaseSalary,
          expectedStartDate: counterStartDate
        },
        counterReason
      }, currentUserContext?.name);
      setOffer(res);
      onOfferUpdated(res);
      setShowCounterModal(false);
      addToast({
        title: 'Negotiation Updated',
        message: `Counter decision recorded. New version v${res.version} created.`,
        type: 'success'
      });
    } catch (e) {
      addToast({
        title: 'Negotiation Error',
        message: e.message || 'Failed to update negotiation.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!offer) return;
    setActionLoading(true);
    try {
      const res = await offerService.withdrawOffer(offer.id, withdrawReason, currentUserContext?.name);
      setOffer(res);
      onOfferUpdated(res);
      setShowWithdrawModal(false);
      addToast({
        title: 'Offer Withdrawn',
        message: `Offer ${offer.offerCode} has been withdrawn.`,
        type: 'warning'
      });
    } catch (e) {
      addToast({
        title: 'Withdrawal Error',
        message: e.message || 'Failed to withdraw offer.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const auditHistory = useMemo(() => {
    if (!offer?.id) return [];
    return Array.isArray(offerService.auditLogs) ? offerService.auditLogs.filter(a => a.offerId === offer.id) : [];
  }, [offer?.id]);

  if (!offer) return null;

  // Pipeline Lifecycle Stage Configuration
  const LIFECYCLE_STEPS = [
    { id: 'draft', label: 'Draft Created', key: 'draft', done: true },
    { id: 'approval', label: 'Multi-Tier Approval', key: 'pending_approval', done: ![OFFER_STATUS.DRAFT, OFFER_STATUS.PENDING_APPROVAL, OFFER_STATUS.PENDING_REAPPROVAL].includes(offer.status), active: [OFFER_STATUS.PENDING_APPROVAL, OFFER_STATUS.PENDING_REAPPROVAL].includes(offer.status) },
    { id: 'approved', label: 'Policy Approved', key: 'approved', done: ![OFFER_STATUS.DRAFT, OFFER_STATUS.PENDING_APPROVAL, OFFER_STATUS.PENDING_REAPPROVAL].includes(offer.status) },
    { id: 'letter', label: 'Letter Generated', key: 'generated', done: ![OFFER_STATUS.DRAFT, OFFER_STATUS.PENDING_APPROVAL, OFFER_STATUS.APPROVED].includes(offer.status) },
    { id: 'sent', label: 'Extended to Portal', key: 'sent', done: [OFFER_STATUS.SENT, OFFER_STATUS.VIEWED, OFFER_STATUS.PENDING_SIGNATURE, OFFER_STATUS.NEGOTIATION, OFFER_STATUS.ACCEPTED, OFFER_STATUS.COMPLETED].includes(offer.status), active: [OFFER_STATUS.SENT, OFFER_STATUS.VIEWED, OFFER_STATUS.PENDING_SIGNATURE].includes(offer.status) },
    { id: 'accepted', label: 'Accepted & eSigned', key: 'accepted', done: [OFFER_STATUS.ACCEPTED, OFFER_STATUS.COMPLETED].includes(offer.status), active: offer.status === OFFER_STATUS.ACCEPTED },
    { id: 'preboarding', label: 'Preboarding Handoff', key: 'completed', done: offer.status === OFFER_STATUS.COMPLETED }
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12 font-sans space-y-4 sm:space-y-5 animate-fade-in-up">
      
      {/* 1. Header Hero Banner */}
      <OfferHeader
        offer={offer}
        onBack={onBack}
        brandColor={brandColor}
        isPendingMyApproval={isPendingMyApproval}
        actionLoading={actionLoading}
        badgeStyle={badgeStyle}
        onOpenCandidatePortal={onOpenCandidatePortal}
        onOpenApprovalModal={() => {
          setApprovalDecisionType('APPROVE');
          setShowApprovalModal(true);
        }}
        onGenerateLetter={handleGenerateLetter}
        onSendOffer={handleSendOffer}
        onOpenCounterModal={() => setShowCounterModal(true)}
        onOpenPreboardingHandoff={onOpenPreboardingHandoff}
        onOpenWithdrawModal={() => setShowWithdrawModal(true)}
      />

      {/* 2. Responsive Segmented Tab Navigation */}
      <OfferTabsNav
        tabs={DETAIL_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        brandColor={brandColor}
      />

      {/* 3. Main Tab Content Workspace */}
      <div className="space-y-4 sm:space-y-5">
        {activeTab === 'overview' && (
          <OfferOverviewTab
            offer={offer}
            brandColor={brandColor}
            lifecycleSteps={LIFECYCLE_STEPS}
            formatCurrency={formatCurrency}
            onNavigateTab={setActiveTab}
            onGenerateLetter={handleGenerateLetter}
          />
        )}

        {activeTab === 'context' && (
          <OfferContextTab offer={offer} />
        )}

        {activeTab === 'employment' && (
          <OfferEmploymentTab offer={offer} />
        )}

        {activeTab === 'compensation' && (
          <OfferCompensationTab
            offer={offer}
            brandColor={brandColor}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'benefits' && (
          <OfferBenefitsTab offer={offer} />
        )}

        {activeTab === 'conditions' && (
          <OfferConditionsTab offer={offer} />
        )}

        {activeTab === 'approvals' && (
          <OfferApprovalsTab offer={offer} />
        )}

        {activeTab === 'letter' && (
          <OfferLetterTab
            offer={offer}
            onGenerateLetter={handleGenerateLetter}
          />
        )}

        {activeTab === 'negotiation' && (
          <OfferNegotiationTab offer={offer} />
        )}

        {activeTab === 'esignature' && (
          <OfferEsignatureTab offer={offer} />
        )}

        {activeTab === 'candidate_portal' && (
          <OfferCandidatePortalTab offer={offer} />
        )}

        {activeTab === 'audit' && (
          <OfferAuditTab auditHistory={auditHistory} />
        )}
      </div>

      {/* 4. Sub-Modals */}
      <ApprovalDecisionModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        offer={offer}
        brandColor={brandColor}
        decisionType={approvalDecisionType}
        setDecisionType={setApprovalDecisionType}
        comments={approvalComments}
        setComments={setApprovalComments}
        onConfirm={handleProcessApproval}
        loading={actionLoading}
      />

      <NegotiationCounterModal
        isOpen={showCounterModal}
        onClose={() => setShowCounterModal(false)}
        offer={offer}
        brandColor={brandColor}
        baseSalary={counterBaseSalary}
        setBaseSalary={setCounterBaseSalary}
        startDate={counterStartDate}
        setStartDate={setCounterStartDate}
        reason={counterReason}
        setReason={setCounterReason}
        onConfirm={handleProcessNegotiation}
        loading={actionLoading}
      />

      <WithdrawOfferModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        reason={withdrawReason}
        setReason={setWithdrawReason}
        onConfirm={handleWithdraw}
        loading={actionLoading}
      />

    </div>
  );
};

export default OfferDetailsPage;
