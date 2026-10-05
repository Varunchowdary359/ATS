/**
 * Enterprise Offer Management Service & State Persistence Engine
 * PeopleWorks ATS SaaS
 */
import { 
  OFFER_STATUS, 
  APPROVAL_STATUS, 
  APPROVAL_DECISION,
  SIGNATURE_STATUS, 
  SIGNATURE_PROVIDERS, 
  EMPLOYMENT_TYPE, 
  WORK_ARRANGEMENT, 
  PAY_FREQUENCY, 
  COMPENSATION_TYPE,
  OFFER_ROLES
} from './offerTypes';
import { 
  INITIAL_OFFERS, 
  INITIAL_OFFER_TEMPLATES, 
  INITIAL_APPROVAL_POLICIES 
} from './offerMockData';
import { DatabaseService } from '../../../services/db/DatabaseService';
import { AuthService } from '../../../services/auth/AuthService';
import { preboardingService } from '../preboarding/preboardingService';

const STORAGE_KEYS = {
  OFFERS: 'pw_db_offers_v2',
  TEMPLATES: 'pw_db_offer_templates_v2',
  POLICIES: 'pw_db_offer_policies_v2',
  AUDIT_LOGS: 'pw_db_offer_audit_logs_v2'
};

class OfferServiceImpl {
  constructor() {
    this.offers = [];
    this.templates = [];
    this.policies = [];
    this.auditLogs = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    if (typeof window === 'undefined') return;

    try {
      this.offers = this._load(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
      this.templates = this._load(STORAGE_KEYS.TEMPLATES, INITIAL_OFFER_TEMPLATES);
      this.policies = this._load(STORAGE_KEYS.POLICIES, INITIAL_APPROVAL_POLICIES);
      this.auditLogs = this._load(STORAGE_KEYS.AUDIT_LOGS, []);
      this.initialized = true;
    } catch (e) {
      console.error('[OfferService] Initialization Error:', e);
    }
  }

  resetToDefaults() {
    this.offers = JSON.parse(JSON.stringify(INITIAL_OFFERS));
    this.templates = JSON.parse(JSON.stringify(INITIAL_OFFER_TEMPLATES));
    this.policies = JSON.parse(JSON.stringify(INITIAL_APPROVAL_POLICIES));
    this.auditLogs = [];
    this._save(STORAGE_KEYS.OFFERS, this.offers);
    this._save(STORAGE_KEYS.TEMPLATES, this.templates);
    this._save(STORAGE_KEYS.POLICIES, this.policies);
    this._save(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    this.initialized = true;
  }

  _load(key, defaultData) {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn(`[OfferService] Failed to load ${key}:`, e);
    }
    this._save(key, defaultData);
    return [...(defaultData || [])];
  }

  _save(key, data) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn(`[OfferService] Failed to save ${key}:`, e);
      }
    }
  }

  _recordAudit(offerId, action, details = {}, actorName = null) {
    const user = AuthService.getSecurityContext();
    const actor = actorName || user?.name || 'Recruiter (System)';
    const event = {
      id: `AUD-OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      offerId,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details,
      ipAddress: '127.0.0.1'
    };
    this.auditLogs.unshift(event);
    this._save(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    return event;
  }

  // ==========================================
  // 1. OFFER ELIGIBILITY VALIDATION ENGINE
  // ==========================================
  async validateOfferEligibility({ candidateId, applicationId, requisitionId }) {
    this.init();
    DatabaseService.init();

    const result = {
      isEligible: true,
      blockers: [],
      warnings: [],
      candidate: null,
      application: null,
      requisition: null,
      interviewSummary: null
    };

    // 1. Candidate Check
    const candidates = DatabaseService.candidates || [];
    const candidate = candidates.find(c => c.id === candidateId || c.candidateId === candidateId);
    if (!candidate) {
      result.isEligible = false;
      result.blockers.push('Selected Candidate record does not exist or has been deleted.');
      return result;
    }
    if (candidate.status === 'Archived') {
      result.isEligible = false;
      result.blockers.push('Candidate is currently archived. Unarchive candidate to proceed with offer creation.');
    }
    result.candidate = candidate;

    // 2. Application Check
    const allApps = DatabaseService.applications || [];
    const applications = allApps.filter(a => a.candidateId === candidateId || a.candidateId === candidate.id);
    const application = applications.find(a => a.id === applicationId) || applications[0];
    if (!application) {
      result.isEligible = false;
      result.blockers.push('Candidate does not have an active application linked to this position.');
      return result;
    }
    result.application = application;

    // 3. Requisition Check
    const allReqs = DatabaseService.requisitions || [];
    const reqId = requisitionId || application.requisitionId;
    let requisition = allReqs.find(r => r.id === reqId || r.reqId === reqId);
    if (!requisition && reqId) {
      requisition = { id: reqId, reqCode: reqId, status: 'Open', jobTitle: application.jobTitle || 'Designated Role' };
    }
    if (!requisition) {
      result.isEligible = false;
      result.blockers.push('The associated Job Requisition does not exist.');
      return result;
    }
    if (requisition.status === 'Closed' || requisition.status === 'On Hold' || requisition.status === 'Cancelled') {
      result.isEligible = false;
      result.blockers.push(`Requisition ${requisition.reqCode || requisition.id} is currently "${requisition.status}". Offers can only be generated for "Open / Active" requisitions.`);
    }
    result.requisition = requisition;

    // 4. Duplicate Active Offer Check
    const existingActiveOffer = this.offers.find(o => 
      (o.applicationId === application.id || o.candidateId === candidate.id) && 
      ![OFFER_STATUS.DECLINED, OFFER_STATUS.EXPIRED, OFFER_STATUS.WITHDRAWN, OFFER_STATUS.SUPERSEDED].includes(o.status)
    );
    if (existingActiveOffer) {
      result.isEligible = false;
      result.blockers.push(`An active offer (${existingActiveOffer.offerCode} - Status: "${existingActiveOffer.status}") already exists for this application. Please withdraw or conclude the existing offer before creating a new one.`);
    }

    // 5. Interview Rounds & Final Selection Validation
    const sessions = DatabaseService.interviews || [];
    const candidateSessions = sessions.filter(s => s.applicationId === application.id || s.candidateId === candidate.id);
    
    const pendingFeedbackSession = candidateSessions.find(s => s.feedbackStatus === 'Pending' || s.feedbackStatus === 'Draft');
    if (pendingFeedbackSession) {
      result.warnings.push(`Interview Round "${pendingFeedbackSession.roundName || pendingFeedbackSession.type}" feedback is still pending from interviewer ${pendingFeedbackSession.interviewerName}.`);
    }

    // Check if HR final selection gate passed
    const finalSession = candidateSessions.find(s => s.finalSelectionStatus === 'HR Approved - Ready for Offer' || s.finalSelectionStatus === 'Approved');
    if (!finalSession && candidateSessions.length > 0) {
      result.warnings.push('Final Hiring Decision & HR Policy compliance checklist has not been formally stamped in the Interview module. You may proceed as an authorized override.');
    }

    result.interviewSummary = {
      totalRounds: candidateSessions.length,
      completedRounds: candidateSessions.filter(s => s.status === 'Completed').length,
      finalSelectionStatus: finalSession?.finalSelectionStatus || 'Not Started'
    };

    return result;
  }

  // ==========================================
  // 2. CORE OFFER OPERATIONS & QUERIES
  // ==========================================
  async getOffers({ 
    search = '', 
    status = 'All', 
    requisition = 'All', 
    department = 'All', 
    preset = 'all', 
    page = 1, 
    pageSize = 10,
    sortBy = 'createdDate',
    sortDir = 'desc'
  } = {}) {
    this.init();

    let filtered = [...this.offers];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(o => 
        (o.candidateName || '').toLowerCase().includes(q) ||
        (o.offerCode || '').toLowerCase().includes(q) ||
        (o.jobTitle || '').toLowerCase().includes(q) ||
        (o.department || '').toLowerCase().includes(q) ||
        (o.requisitionId || '').toLowerCase().includes(q) ||
        (o.recruiterName || '').toLowerCase().includes(q)
      );
    }

    // Filters
    if (status !== 'All') {
      filtered = filtered.filter(o => o.status === status);
    }
    if (requisition !== 'All') {
      filtered = filtered.filter(o => o.requisitionId === requisition);
    }
    if (department !== 'All') {
      filtered = filtered.filter(o => o.department === department);
    }

    // Presets
    if (preset === 'active') {
      filtered = filtered.filter(o => [
        OFFER_STATUS.DRAFT, 
        OFFER_STATUS.PENDING_APPROVAL, 
        OFFER_STATUS.APPROVED, 
        OFFER_STATUS.GENERATED, 
        OFFER_STATUS.SENT, 
        OFFER_STATUS.VIEWED, 
        OFFER_STATUS.NEGOTIATION,
        OFFER_STATUS.PENDING_SIGNATURE
      ].includes(o.status));
    } else if (preset === 'pending_approval') {
      filtered = filtered.filter(o => o.status === OFFER_STATUS.PENDING_APPROVAL || o.status === OFFER_STATUS.PENDING_REAPPROVAL);
    } else if (preset === 'sent') {
      filtered = filtered.filter(o => [OFFER_STATUS.SENT, OFFER_STATUS.VIEWED, OFFER_STATUS.PENDING_SIGNATURE].includes(o.status));
    } else if (preset === 'negotiation') {
      filtered = filtered.filter(o => o.status === OFFER_STATUS.NEGOTIATION);
    } else if (preset === 'accepted') {
      filtered = filtered.filter(o => o.status === OFFER_STATUS.ACCEPTED || o.status === OFFER_STATUS.COMPLETED);
    } else if (preset === 'archived') {
      filtered = filtered.filter(o => [OFFER_STATUS.DECLINED, OFFER_STATUS.EXPIRED, OFFER_STATUS.WITHDRAWN, OFFER_STATUS.SUPERSEDED].includes(o.status));
    }

    // Sorting
    filtered.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const totalCount = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  }

  getOfferById(offerId) {
    this.init();
    return this.offers.find(o => o.id === offerId) || null;
  }

  getAllOffers() {
    this.init();
    return [...this.offers];
  }

  // ==========================================
  // 3. CREATE & UPDATE OFFER (STEP-BY-STEP)
  // ==========================================
  async createOffer(offerPayload, actorName = null) {
    this.init();

    // Calculate compensation totals
    const components = offerPayload.components || [];
    let totalBase = 0;
    let totalVariable = 0;
    let totalOneTime = 0;
    let totalAllowances = 0;

    components.forEach(comp => {
      const amt = Number(comp.amount) || 0;
      if (comp.type === COMPENSATION_TYPE.BASE_SALARY) totalBase += amt;
      else if (comp.type === COMPENSATION_TYPE.VARIABLE_PAY) totalVariable += amt;
      else if (comp.type === COMPENSATION_TYPE.JOINING_BONUS || comp.type === COMPENSATION_TYPE.RETENTION_BONUS || comp.type === COMPENSATION_TYPE.RELOCATION) {
        totalOneTime += amt;
      } else {
        totalAllowances += amt;
      }
    });

    const totalCtc = totalBase + totalVariable + totalOneTime + totalAllowances;

    const offerId = `OFF-${new Date().getFullYear()}-${String(this.offers.length + 1).padStart(3, '0')}`;
    const offerCode = `PW-OFF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOffer = {
      id: offerId,
      offerCode,
      version: 1,
      status: offerPayload.submitForApproval ? OFFER_STATUS.PENDING_APPROVAL : OFFER_STATUS.DRAFT,
      approvalStatus: offerPayload.submitForApproval ? APPROVAL_STATUS.PENDING : APPROVAL_STATUS.NOT_SUBMITTED,
      signatureStatus: SIGNATURE_STATUS.NOT_INITIATED,
      
      // Candidate & Requisition Links
      candidateId: offerPayload.candidateId,
      candidateName: offerPayload.candidateName,
      candidateEmail: offerPayload.candidateEmail,
      candidatePhone: offerPayload.candidatePhone,
      candidateLocation: offerPayload.candidateLocation,
      applicationId: offerPayload.applicationId,
      requisitionId: offerPayload.requisitionId,
      jobTitle: offerPayload.jobTitle,
      department: offerPayload.department,
      businessUnit: offerPayload.businessUnit || 'Core Business',
      legalEntity: offerPayload.legalEntity || 'PeopleWorks Technologies India Pvt Ltd',
      workLocation: offerPayload.workLocation || 'Bengaluru Hub',
      workArrangement: offerPayload.workArrangement || WORK_ARRANGEMENT.HYBRID,
      employmentType: offerPayload.employmentType || EMPLOYMENT_TYPE.FULL_TIME,
      jobLevel: offerPayload.jobLevel || 'Senior (IC-4)',
      hiringManagerId: offerPayload.hiringManagerId || 'USR-HM-01',
      hiringManagerName: offerPayload.hiringManagerName || 'Alex Chen',
      recruiterId: offerPayload.recruiterId || 'USR-REC-01',
      recruiterName: offerPayload.recruiterName || 'Sarah Jenkins',
      reportingManager: offerPayload.reportingManager || offerPayload.hiringManagerName || 'Alex Chen',

      // Timelines
      createdDate: new Date().toISOString(),
      expectedStartDate: offerPayload.expectedStartDate,
      offerExpirationDate: offerPayload.offerExpirationDate,
      probationPeriod: offerPayload.probationPeriod || '3 Months',
      noticePeriod: offerPayload.noticePeriod || '30 Days',

      // Compensation & Benefits
      currency: offerPayload.currency || 'INR',
      payFrequency: offerPayload.payFrequency || PAY_FREQUENCY.ANNUAL,
      components,
      totalBase,
      totalVariable,
      totalOneTime,
      totalCtc,
      benefits: offerPayload.benefits || [],
      conditions: offerPayload.conditions || [],

      // Approval Workflow
      approvals: this._generateApprovalChain(totalCtc, offerPayload.department, offerPayload.jobLevel),
      templateId: offerPayload.templateId || 'TMPL-IND-FT-01',
      templateName: offerPayload.templateName || 'India - Full Time Standard Offer',
      documentVersions: [],
      negotiations: [],
      isLocked: false
    };

    this.offers.unshift(newOffer);
    this._save(STORAGE_KEYS.OFFERS, this.offers);

    this._recordAudit(
      newOffer.id, 
      offerPayload.submitForApproval ? 'Offer Created and Submitted for Approval' : 'Offer Draft Created',
      { totalCtc, version: 1, status: newOffer.status },
      actorName
    );

    return newOffer;
  }

  _generateApprovalChain(totalCtc, department, jobLevel) {
    // Dynamic rule calculation based on policies
    const chain = [
      {
        id: `appr-${Date.now()}-1`,
        level: 1,
        role: 'hiring_manager',
        approverName: 'Alex Chen',
        approverRoleTitle: 'Hiring Manager (Director)',
        status: APPROVAL_STATUS.PENDING,
        requestedAt: new Date().toISOString(),
        decidedAt: null,
        comments: null
      },
      {
        id: `appr-${Date.now()}-2`,
        level: 2,
        role: 'hr_bp',
        approverName: 'Marcus Vance',
        approverRoleTitle: 'Senior HRBP',
        status: APPROVAL_STATUS.PENDING,
        requestedAt: new Date().toISOString(),
        decidedAt: null,
        comments: null
      }
    ];

    // High compensation / Budget override condition
    if (totalCtc > 3500000) {
      chain.push({
        id: `appr-${Date.now()}-3`,
        level: 3,
        role: 'finance',
        approverName: 'Elena Rostova',
        approverRoleTitle: 'Head of FP&A & Compensation',
        status: APPROVAL_STATUS.PENDING,
        requestedAt: new Date().toISOString(),
        decidedAt: null,
        comments: null
      });
    }

    return chain;
  }

  // ==========================================
  // 4. APPROVAL WORKFLOW ACTIONS
  // ==========================================
  async submitForApproval(offerId, comments = '', actorName = null) {
    this.init();
    const offer = this.getOfferById(offerId);
    if (!offer) throw new Error('Offer not found.');

    if (offer.status !== OFFER_STATUS.DRAFT && offer.status !== OFFER_STATUS.REVISED) {
      throw new Error(`Cannot submit offer in status "${offer.status}" for approval.`);
    }

    offer.status = OFFER_STATUS.PENDING_APPROVAL;
    offer.approvalStatus = APPROVAL_STATUS.PENDING;
    if (offer.approvals.length === 0) {
      offer.approvals = this._generateApprovalChain(offer.totalCtc, offer.department, offer.jobLevel);
    } else {
      offer.approvals.forEach(a => {
        a.status = APPROVAL_STATUS.PENDING;
        a.requestedAt = new Date().toISOString();
        a.decidedAt = null;
      });
    }

    this._save(STORAGE_KEYS.OFFERS, this.offers);
    this._recordAudit(offerId, 'Submitted for Approval', { comments }, actorName);
    return offer;
  }

  async processApprovalDecision(offerId, { role, decision, comments = '', returnReason = '' }, actorName = null) {
    this.init();
    const offer = this.getOfferById(offerId);
    if (!offer) throw new Error('Offer not found.');

    if (offer.status !== OFFER_STATUS.PENDING_APPROVAL && offer.status !== OFFER_STATUS.PENDING_REAPPROVAL) {
      throw new Error('Offer is not currently awaiting approval.');
    }

    const approvalItem = offer.approvals.find(a => a.role === role && a.status === APPROVAL_STATUS.PENDING) || offer.approvals[0];
    if (!approvalItem) throw new Error(`No pending approval item found for role: ${role}`);

    approvalItem.status = decision === APPROVAL_DECISION.APPROVE ? APPROVAL_STATUS.APPROVED : 
                          decision === APPROVAL_DECISION.RETURN ? APPROVAL_STATUS.RETURNED : APPROVAL_STATUS.REJECTED;
    approvalItem.decidedAt = new Date().toISOString();
    approvalItem.comments = comments || returnReason || (decision === APPROVAL_DECISION.APPROVE ? 'Approved' : 'Action taken');

    if (decision === APPROVAL_DECISION.REJECT) {
      offer.status = OFFER_STATUS.REJECTED;
      offer.approvalStatus = APPROVAL_STATUS.REJECTED;
    } else if (decision === APPROVAL_DECISION.RETURN) {
      offer.status = OFFER_STATUS.DRAFT;
      offer.approvalStatus = APPROVAL_STATUS.RETURNED;
    } else if (decision === APPROVAL_DECISION.APPROVE) {
      // Check if all approval levels are approved
      const allApproved = offer.approvals.every(a => a.status === APPROVAL_STATUS.APPROVED);
      if (allApproved) {
        offer.status = OFFER_STATUS.APPROVED;
        offer.approvalStatus = APPROVAL_STATUS.APPROVED;
        offer.approvedDate = new Date().toISOString();
      }
    }

    this._save(STORAGE_KEYS.OFFERS, this.offers);
    this._recordAudit(offerId, `Approval Decision: ${decision}`, { role, comments, returnReason }, actorName);
    return offer;
  }

  // ==========================================
  // 5. OFFER LETTER GENERATION & TEMPLATES
  // ==========================================
  async generateOfferLetter(offerId, templateId = null, actorName = null) {
    this.init();
    const offer = this.getOfferById(offerId);
    if (!offer) throw new Error('Offer not found.');

    if (offer.status !== OFFER_STATUS.APPROVED && offer.status !== OFFER_STATUS.GENERATED && offer.status !== OFFER_STATUS.SENT) {
      throw new Error(`Cannot generate formal offer letter while offer is in status "${offer.status}". Approval is required.`);
    }

    const template = this.templates.find(t => t.id === (templateId || offer.templateId)) || this.templates[0];
    
    // Format helpers
    const baseFormatted = `${offer.currency === 'INR' ? '₹' : '$'}${Number(offer.totalBase || 0).toLocaleString('en-IN')}`;
    const variableFormatted = `${offer.currency === 'INR' ? '₹' : '$'}${Number(offer.totalVariable || 0).toLocaleString('en-IN')}`;
    const totalCtcFormatted = `${offer.currency === 'INR' ? '₹' : '$'}${Number(offer.totalCtc || 0).toLocaleString('en-IN')}`;

    // Interpolate dynamic template placeholders
    let renderedHtml = template.contentHtml
      .replace(/{{company.name}}/g, 'PeopleWorks Technologies')
      .replace(/{{company.signatoryName}}/g, 'Marcus Vance')
      .replace(/{{company.signatoryTitle}}/g, 'Vice President - Global Talent & People Operations')
      .replace(/{{candidate.fullName}}/g, offer.candidateName || 'Candidate')
      .replace(/{{candidate.address}}/g, offer.candidateLocation || 'India')
      .replace(/{{job.title}}/g, offer.jobTitle || 'Designation')
      .replace(/{{job.department}}/g, offer.department || 'Department')
      .replace(/{{job.location}}/g, offer.workLocation || 'Bengaluru')
      .replace(/{{offer.workArrangement}}/g, offer.workArrangement || 'Hybrid')
      .replace(/{{offer.reportingManager}}/g, offer.reportingManager || 'Hiring Manager')
      .replace(/{{offer.startDate}}/g, offer.expectedStartDate || 'To be confirmed')
      .replace(/{{offer.expirationDate}}/g, offer.offerExpirationDate || '14 days from issue')
      .replace(/{{offer.probationPeriod}}/g, offer.probationPeriod || '3 Months')
      .replace(/{{offer.noticePeriod}}/g, offer.noticePeriod || '30 Days')
      .replace(/{{offer.currency}}/g, offer.currency || 'INR')
      .replace(/{{offer.baseSalaryFormatted}}/g, baseFormatted)
      .replace(/{{offer.variablePayFormatted}}/g, variableFormatted)
      .replace(/{{offer.totalCtcFormatted}}/g, totalCtcFormatted)
      .replace(/{{offer.generatedDate}}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

    const newDocVersion = {
      version: offer.version,
      documentId: `DOC-${offer.id}-V${offer.version}`,
      templateId: template.id,
      templateName: template.name,
      generatedAt: new Date().toISOString(),
      generatedBy: actorName || 'Recruiter (System)',
      documentName: `${offer.candidateName.replace(/\s+/g, '_')}_Offer_Letter_V${offer.version}.pdf`,
      contentHtml: renderedHtml,
      status: 'Generated & Ready to Send'
    };

    offer.status = OFFER_STATUS.GENERATED;
    offer.templateId = template.id;
    offer.templateName = template.name;
    
    // Add to versioned documents without overwriting previous versions
    offer.documentVersions = offer.documentVersions || [];
    const existingIndex = offer.documentVersions.findIndex(d => d.version === offer.version);
    if (existingIndex >= 0) {
      offer.documentVersions[existingIndex] = newDocVersion;
    } else {
      offer.documentVersions.push(newDocVersion);
    }

    this._save(STORAGE_KEYS.OFFERS, this.offers);
    this._recordAudit(offerId, `Generated Offer Letter V${offer.version}`, { templateId: template.id }, actorName);
    return { offer, document: newDocVersion };
  }

  // ==========================================
  // 6. SEND OFFER & eSIGNATURE INTEGRATION
  // ==========================================
  async sendOfferToCandidate(offerId, deliveryOptions = {}, actorName = null) {
    this.init();
    const offer = this.getOfferById(offerId);
    if (!offer) throw new Error('Offer not found.');

    if (offer.status !== OFFER_STATUS.GENERATED && offer.status !== OFFER_STATUS.APPROVED) {
      throw new Error(`Cannot send offer in status "${offer.status}". Letter generation required.`);
    }

    // Auto-generate letter if not generated
    if (!offer.documentVersions || offer.documentVersions.length === 0) {
      await this.generateOfferLetter(offerId, offer.templateId, actorName);
    }

    offer.status = OFFER_STATUS.SENT;
    offer.sentDate = new Date().toISOString();
    offer.signatureStatus = SIGNATURE_STATUS.SENT;
    offer.eSignature = {
      provider: deliveryOptions.provider || SIGNATURE_PROVIDERS.DOCUSIGN,
      envelopeId: `DOCU-ENV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      status: SIGNATURE_STATUS.SENT,
      sentAt: new Date().toISOString(),
      signingOrder: 'Candidate Only',
      recipientEmail: offer.candidateEmail
    };

    this._save(STORAGE_KEYS.OFFERS, this.offers);
    this._recordAudit(offerId, 'Offer Extended to Candidate', { email: offer.candidateEmail, provider: offer.eSignature.provider }, actorName);
    return offer;
  }

  // ==========================================
  // 7. CANDIDATE PORTAL ACTIONS (ACCEPT, DECLINE, NEGOTIATE)
  // ==========================================
  async recordCandidateAction(offerId, { action, payload = {} }, candidateActor = null) {
    this.init();
    const offer = this.getOfferById(offerId);
    if (!offer) throw new Error('Offer not found.');

    const actor = candidateActor || `Candidate (${offer.candidateName})`;

    // Action 1: ACCEPT & SIGN
    if (action === 'ACCEPT') {
      offer.status = OFFER_STATUS.ACCEPTED;
      offer.acceptedDate = new Date().toISOString();
      offer.signatureStatus = SIGNATURE_STATUS.SIGNED;
      offer.isLocked = true; // Hard lock accepted offer
      offer.eSignature = {
        ...(offer.eSignature || {}),
        status: SIGNATURE_STATUS.SIGNED,
        signedAt: new Date().toISOString(),
        signerIp: '49.207.214.88',
        certificateId: `CERT-PW-${Math.floor(100000 + Math.random() * 900000)}`,
        signatureType: payload.signatureType || 'Digital Stamp & Certified Hash'
      };
      offer.preboardingStatus = 'Ready for Handoff';

      this._save(STORAGE_KEYS.OFFERS, this.offers);
      this._recordAudit(offerId, 'Offer Accepted and eSigned by Candidate', { signatureCert: offer.eSignature.certificateId }, actor);
      
      // Auto-trigger preboarding creation
      try {
        preboardingService.createPreboardingFromOffer(offer, actor?.name || 'Candidate eSignature Portal');
      } catch (err) {
        console.warn('Auto-create preboarding notice:', err.message);
      }

      return offer;
    }

    // Action 2: DECLINE
    if (action === 'DECLINE') {
      offer.status = OFFER_STATUS.DECLINED;
      offer.declinedDate = new Date().toISOString();
      offer.declineReason = payload.reason || 'Candidate Declined';
      offer.declineComments = payload.comments || '';
      offer.signatureStatus = SIGNATURE_STATUS.DECLINED;

      this._save(STORAGE_KEYS.OFFERS, this.offers);
      this._recordAudit(offerId, `Offer Declined by Candidate: ${offer.declineReason}`, { comments: offer.declineComments }, actor);
      return offer;
    }

    // Action 3: REQUEST CHANGES (NEGOTIATION)
    if (action === 'REQUEST_CHANGES') {
      offer.status = OFFER_STATUS.NEGOTIATION;
      
      const negotiationItem = {
        id: `NEG-${Date.now()}`,
        offerVersion: offer.version,
        requestedAt: new Date().toISOString(),
        requestedBy: actor,
        field: payload.field || 'Compensation & Start Date',
        currentValue: `Base: ₹${Number(offer.totalBase).toLocaleString('en-IN')} | Joining: ${offer.expectedStartDate}`,
        requestedValue: payload.requestedValue || '',
        difference: payload.difference || 'Adjustments requested',
        reason: payload.reason || 'Candidate requested term review',
        status: 'Pending Recruiter Review',
        companyResponse: null
      };

      offer.negotiations = offer.negotiations || [];
      offer.negotiations.unshift(negotiationItem);

      this._save(STORAGE_KEYS.OFFERS, this.offers);
      this._recordAudit(offerId, 'Candidate Submitted Change / Counter Request', negotiationItem, actor);
      return offer;
    }

    throw new Error(`Unsupported candidate action: ${action}`);
  }

  // ==========================================
  // 8. NEGOTIATION RESPONSE & NEW OFFER VERSION
  // ==========================================
  async processNegotiationResponse(offerId, { decision, revisedData = {}, counterReason = '' }, actorName = null) {
    this.init();
    const offer = this.getOfferById(offerId);
    if (!offer) throw new Error('Offer not found.');

    if (offer.status !== OFFER_STATUS.NEGOTIATION) {
      throw new Error('Offer is not currently in negotiation state.');
    }

    const latestNegotiation = offer.negotiations?.[0];
    if (latestNegotiation) {
      latestNegotiation.status = decision;
      latestNegotiation.companyResponse = counterReason || decision;
      latestNegotiation.decidedAt = new Date().toISOString();
      latestNegotiation.decidedBy = actorName || 'Recruiter';
    }

    if (decision === 'REJECT') {
      // Return offer to Sent state with original terms
      offer.status = OFFER_STATUS.SENT;
      this._save(STORAGE_KEYS.OFFERS, this.offers);
      this._recordAudit(offerId, 'Negotiation Request Rejected by Recruiter', { reason: counterReason }, actorName);
      return offer;
    }

    // If Accepted or Countered -> Create New Version (V1 -> V2)
    const newVersion = offer.version + 1;
    offer.version = newVersion;
    offer.status = OFFER_STATUS.PENDING_REAPPROVAL;
    offer.approvalStatus = APPROVAL_STATUS.PENDING;
    offer.signatureStatus = SIGNATURE_STATUS.NOT_INITIATED;

    if (revisedData.totalBase) {
      offer.totalBase = Number(revisedData.totalBase);
      const baseComp = offer.components.find(c => c.type === COMPENSATION_TYPE.BASE_SALARY);
      if (baseComp) baseComp.amount = offer.totalBase;
    }
    if (revisedData.expectedStartDate) {
      offer.expectedStartDate = revisedData.expectedStartDate;
    }

    offer.totalCtc = Number(offer.totalBase || 0) + Number(offer.totalVariable || 0) + Number(offer.totalOneTime || 0);

    // Re-trigger approval routing for the new version
    offer.approvals = this._generateApprovalChain(offer.totalCtc, offer.department, offer.jobLevel);

    this._save(STORAGE_KEYS.OFFERS, this.offers);
    this._recordAudit(
      offerId, 
      `Created Revised Offer V${newVersion} following Negotiation`, 
      { decision, newCtc: offer.totalCtc, version: newVersion }, 
      actorName
    );
    return offer;
  }

  // ==========================================
  // 9. EXPIRY, EXTENSION, WITHDRAWAL & HANDOFF
  // ==========================================
  async extendOfferExpiry(offerId, newExpiryDate, reason = '', actorName = null) {
    this.init();
    const offer = this.getOfferById(offerId);
    if (!offer) throw new Error('Offer not found.');

    offer.offerExpirationDate = newExpiryDate;
    if (offer.status === OFFER_STATUS.EXPIRED) {
      offer.status = OFFER_STATUS.SENT;
    }

    this._save(STORAGE_KEYS.OFFERS, this.offers);
    this._recordAudit(offerId, `Extended Offer Expiry to ${newExpiryDate}`, { reason }, actorName);
    return offer;
  }

  async withdrawOffer(offerId, reason = '', actorName = null) {
    this.init();
    const offer = this.getOfferById(offerId);
    if (!offer) throw new Error('Offer not found.');

    if (offer.status === OFFER_STATUS.ACCEPTED && offer.isLocked) {
      throw new Error('Cannot directly withdraw an accepted & certified offer. Formal revision process required.');
    }

    offer.status = OFFER_STATUS.WITHDRAWN;
    offer.withdrawnDate = new Date().toISOString();
    offer.withdrawnReason = reason || 'Business decision';
    offer.withdrawnBy = actorName || 'Recruiter (System)';
    if (offer.eSignature) {
      offer.eSignature.status = SIGNATURE_STATUS.VOIDED;
    }

    this._save(STORAGE_KEYS.OFFERS, this.offers);
    this._recordAudit(offerId, `Offer Withdrawn / Rescinded: ${offer.withdrawnReason}`, { reason }, actorName);
    return offer;
  }

  async moveCandidateToPreboarding(offerId, actorName = null) {
    this.init();
    const offer = this.getOfferById(offerId);
    if (!offer) throw new Error('Offer not found.');

    if (offer.status !== OFFER_STATUS.ACCEPTED) {
      throw new Error('Only accepted offers can be transferred to Preboarding.');
    }

    offer.preboardingStatus = 'Transferred to Preboarding';
    offer.status = OFFER_STATUS.COMPLETED;

    this._save(STORAGE_KEYS.OFFERS, this.offers);
    this._recordAudit(offerId, 'Candidate Successfully Transferred to Preboarding Module', { candidateId: offer.candidateId }, actorName);
    
    // Auto-create / sync preboarding record
    try {
      await preboardingService.createPreboardingFromOffer(offer, actorName || 'Recruiter Preboarding Handoff');
    } catch (err) {
      console.warn('Preboarding handoff record creation notice:', err.message);
    }

    return offer;
  }

  // ==========================================
  // 10. KPI METRICS & ANALYTICS
  // ==========================================
  getOfferKpiMetrics() {
    this.init();
    const total = this.offers.length;
    const draft = this.offers.filter(o => o.status === OFFER_STATUS.DRAFT).length;
    const pendingApproval = this.offers.filter(o => o.status === OFFER_STATUS.PENDING_APPROVAL || o.status === OFFER_STATUS.PENDING_REAPPROVAL).length;
    const approved = this.offers.filter(o => o.status === OFFER_STATUS.APPROVED || o.status === OFFER_STATUS.GENERATED).length;
    const sent = this.offers.filter(o => o.status === OFFER_STATUS.SENT || o.status === OFFER_STATUS.VIEWED || o.status === OFFER_STATUS.PENDING_SIGNATURE).length;
    const negotiation = this.offers.filter(o => o.status === OFFER_STATUS.NEGOTIATION).length;
    const accepted = this.offers.filter(o => o.status === OFFER_STATUS.ACCEPTED || o.status === OFFER_STATUS.COMPLETED).length;
    const declined = this.offers.filter(o => o.status === OFFER_STATUS.DECLINED).length;
    const expired = this.offers.filter(o => o.status === OFFER_STATUS.EXPIRED).length;
    const withdrawn = this.offers.filter(o => o.status === OFFER_STATUS.WITHDRAWN).length;

    const acceptanceRate = (accepted + declined) > 0 ? Math.round((accepted / (accepted + declined)) * 100) : 85;

    return {
      total,
      draft,
      pendingApproval,
      approved,
      sent,
      negotiation,
      accepted,
      declined,
      expired,
      withdrawn,
      acceptanceRate
    };
  }

  getTemplates() {
    this.init();
    return [...this.templates];
  }

  saveTemplate(template) {
    this.init();
    const index = this.templates.findIndex(t => t.id === template.id);
    if (index >= 0) {
      this.templates[index] = { ...template, lastUpdated: new Date().toISOString() };
    } else {
      this.templates.push({ ...template, id: `TMPL-CUSTOM-${Date.now()}`, lastUpdated: new Date().toISOString() });
    }
    this._save(STORAGE_KEYS.TEMPLATES, this.templates);
    return this.templates;
  }

  getApprovalPolicies() {
    this.init();
    return [...this.policies];
  }

  saveApprovalPolicy(policy) {
    this.init();
    const index = this.policies.findIndex(p => p.id === policy.id);
    if (index >= 0) {
      this.policies[index] = policy;
    } else {
      this.policies.push({ ...policy, id: `POL-CUSTOM-${Date.now()}` });
    }
    this._save(STORAGE_KEYS.POLICIES, this.policies);
    return this.policies;
  }

  deleteOffer(offerId, actorName = null) {
    this.init();
    const offer = this.offers.find(o => o.id === offerId);
    if (offer) {
      this._recordAudit(offerId, 'Offer Deleted', { deletedOfferCode: offer.offerCode }, actorName);
    }
    this.offers = this.offers.filter(o => o.id !== offerId);
    this._save(STORAGE_KEYS.OFFERS, this.offers);
    return this.offers;
  }

  deleteOffers(offerIds, actorName = null) {
    this.init();
    if (!Array.isArray(offerIds) || offerIds.length === 0) return this.offers;
    offerIds.forEach(id => {
      const offer = this.offers.find(o => o.id === id);
      if (offer) {
        this._recordAudit(id, 'Offer Bulk Deleted', { deletedOfferCode: offer.offerCode }, actorName);
      }
    });
    this.offers = this.offers.filter(o => !offerIds.includes(o.id));
    this._save(STORAGE_KEYS.OFFERS, this.offers);
    return this.offers;
  }
}

export const offerService = new OfferServiceImpl();
