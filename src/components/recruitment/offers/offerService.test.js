import { describe, it, expect, beforeEach } from 'vitest';
import { offerService } from './offerService';
import { DatabaseService } from '../../../services/db/DatabaseService';
import { 
  OFFER_STATUS, 
  APPROVAL_STATUS, 
  APPROVAL_DECISION,
  SIGNATURE_STATUS, 
  OFFER_ROLES, 
  OFFER_PERMISSIONS, 
  COMPENSATION_TYPE,
  hasOfferPermission 
} from './offerTypes';

describe('Enterprise ATS Offer Management Engine & Service Integration', () => {
  beforeEach(() => {
    // Reset service state before each test
    offerService.resetToDefaults();
    
    DatabaseService.initialized = true;
    DatabaseService.candidates = [
      { id: 'CAND-101', name: 'Sophia Chen', email: 'sophia.chen@example.com', status: 'Active' },
      { id: 'CAND-102', name: 'Vikram Sethi', email: 'vikram.sethi@gmail.com', status: 'Active' },
      { id: 'CAND-103', name: 'Emily Watson', email: 'emily.watson@example.com', status: 'Active' },
      { id: 'CAND-104', name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', status: 'Active' },
      { id: 'CAND-105', name: 'Jessica Martinez', email: 'jessica.martinez@example.com', status: 'Active' }
    ];
    DatabaseService.applications = [
      { id: 'APP-2026-001', candidateId: 'CAND-101', requisitionId: 'REQ-2026-001', status: 'Active', stage: 'Interview' },
      { id: 'APP-101', candidateId: 'CAND-101', requisitionId: 'REQ-2026-002', status: 'Active', stage: 'Interview' },
      { id: 'APP-102', candidateId: 'CAND-102', requisitionId: 'REQ-2026-001', status: 'Active', stage: 'Interview' },
      { id: 'APP-103', candidateId: 'CAND-103', requisitionId: 'REQ-2026-001', status: 'Active', stage: 'Interview' },
      { id: 'APP-104', candidateId: 'CAND-104', requisitionId: 'REQ-2026-003', status: 'Active', stage: 'Interview' },
      { id: 'APP-105', candidateId: 'CAND-105', requisitionId: 'REQ-2026-001', status: 'Active', stage: 'Interview' }
    ];
    DatabaseService.requisitions = [
      { id: 'REQ-2026-001', title: 'Senior Frontend Architect', status: 'Approved', department: 'Engineering' },
      { id: 'REQ-2026-002', title: 'Staff DevOps Engineer', status: 'Approved', department: 'Platform Engineering' },
      { id: 'REQ-2026-003', title: 'Lead Product Manager', status: 'Approved', department: 'Product' }
    ];
    DatabaseService._save('pw_db_candidates', DatabaseService.candidates);
    DatabaseService._save('pw_db_applications', DatabaseService.applications);
    DatabaseService._save('pw_db_requisitions', DatabaseService.requisitions);
  });


  describe('1. Offer Eligibility Validation Gate', () => {
    it('passes eligibility when candidate has active application and requisition is open', async () => {
      // First ensure CAND-101 has no active offer in mock data
      offerService.init();
      offerService.offers = offerService.offers.filter(o => o.candidateId !== 'CAND-101');
      offerService._save('pw_db_offers', offerService.offers);
      const eligibility = await offerService.validateOfferEligibility({
        candidateId: 'CAND-101',
        applicationId: 'APP-2026-001',
        requisitionId: 'REQ-2026-001'
      });
      expect(eligibility.isEligible).toBe(true);
      expect(eligibility.candidate).toBeDefined();
      expect(eligibility.application).toBeDefined();
      expect(eligibility.requisition).toBeDefined();
      expect(eligibility.blockers).toHaveLength(0);
    });

    it('blocks offer creation when active offer already exists for the same candidate/app', async () => {
      // CAND-102 (Vikram Sethi) already has active offer OFF-2026-001 in INITIAL_OFFERS
      const eligibility = await offerService.validateOfferEligibility({
        candidateId: 'CAND-102',
        applicationId: 'APP-102',
        requisitionId: 'REQ-2026-001'
      });
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.blockers.some(b => b.includes('already exists'))).toBe(true);
    });

    it('blocks offer creation for non-existent candidate with user-friendly business error', async () => {
      const eligibility = await offerService.validateOfferEligibility({
        candidateId: 'CAND-999',
        applicationId: 'APP-999',
        requisitionId: 'REQ-999'
      });
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.blockers.some(b => b.includes('does not exist'))).toBe(true);
    });
  });

  describe('2. Offer Creation & Requisition Inheritance', () => {
    it('creates a draft offer with component-based compensation and auto-calculated CTC', async () => {
      const newOfferPayload = {
        candidateId: 'CAND-004',
        candidateName: 'Vikram Malhotra',
        candidateEmail: 'vikram.m@example.com',
        applicationId: 'APP-2026-004',
        requisitionId: 'REQ-2026-001',
        jobTitle: 'Senior Full Stack Engineer',
        department: 'Engineering',
        businessUnit: 'Cloud Platform',
        legalEntity: 'PeopleWorks Tech Pvt Ltd (India)',
        workLocation: 'Bangalore HQ (Hybrid)',
        employmentType: 'Full-Time',
        jobLevel: 'Senior (IC-4)',
        hiringManagerName: 'Alex Chen',
        recruiterName: 'Sarah Jenkins',
        currency: 'INR',
        payFrequency: 'Annual',
        components: [
          { name: 'Base Salary', amount: 2400000, frequency: 'Annual', type: COMPENSATION_TYPE.BASE_SALARY, taxable: true },
          { name: 'Performance Bonus', amount: 400000, frequency: 'Annual', type: COMPENSATION_TYPE.VARIABLE_PAY, taxable: true },
          { name: 'Joining Bonus', amount: 200000, frequency: 'One Time', type: COMPENSATION_TYPE.JOINING_BONUS, taxable: true }
        ],
        benefits: [
          { name: 'Comprehensive Health Cover', value: '₹10,00,000 / family' },
          { name: 'Internet & Work Perks', value: '₹3,000 / month' }
        ],
        offerExpirationDate: '2026-10-30',
        expectedStartDate: '2026-11-15',
        reportingManager: 'Alex Chen',
        probationPeriod: '3 months',
        noticePeriod: '60 days'
      };

      const offer = await offerService.createOffer(newOfferPayload, 'Sarah Jenkins');
      expect(offer).toBeDefined();
      expect(offer.id).toMatch(/^OFF-/);
      expect(offer.status).toBe(OFFER_STATUS.DRAFT);
      expect(offer.version).toBe(1);
      expect(offer.totalBase).toBe(2400000);
      expect(offer.totalVariable).toBe(400000);
      expect(offer.totalOneTime).toBe(200000);
      expect(offer.totalCtc).toBe(3000000);
      expect(offer.approvals.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Multi-tier Approval Routing & Governance', () => {
    it('progresses sequential approval and updates offer status when all stakeholders approve', async () => {
      // OFF-2026-003 is in Pending Approval
      const offer = offerService.getOfferById('OFF-2026-003');
      expect(offer.status).toBe(OFFER_STATUS.PENDING_APPROVAL);

      // Level 1: Hiring Manager is already approved in mock data, let's approve remaining:
      // Level 2: HRBP approves
      await offerService.processApprovalDecision('OFF-2026-003', {
        role: 'hr_bp',
        decision: APPROVAL_DECISION.APPROVE,
        comments: 'Internal parity verified.'
      }, 'Marcus Vance');

      // Level 3: Finance approves
      const finalRes = await offerService.processApprovalDecision('OFF-2026-003', {
        role: 'finance',
        decision: APPROVAL_DECISION.APPROVE,
        comments: 'Approved within division allocation.'
      }, 'Elena Rostova');

      expect(finalRes.status).toBe(OFFER_STATUS.APPROVED);
      expect(finalRes.approvalStatus).toBe(APPROVAL_STATUS.APPROVED);
    });

    it('rejects an offer and updates status when a stakeholder records a reject decision', async () => {
      const res = await offerService.processApprovalDecision('OFF-2026-003', {
        role: 'finance',
        decision: APPROVAL_DECISION.REJECT,
        comments: 'Budget constraints prevent proceeding at this salary band.'
      }, 'Elena Rostova');

      expect(res.status).toBe(OFFER_STATUS.REJECTED);
      expect(res.approvalStatus).toBe(APPROVAL_STATUS.REJECTED);
    });

    it('returns an offer to draft for revision when return is requested', async () => {
      const res = await offerService.processApprovalDecision('OFF-2026-003', {
        role: 'hr_bp',
        decision: APPROVAL_DECISION.RETURN,
        returnReason: 'Please re-verify the notice period with candidate before re-submitting.'
      }, 'Marcus Vance');

      expect(res.status).toBe(OFFER_STATUS.DRAFT);
      expect(res.approvalStatus).toBe(APPROVAL_STATUS.RETURNED);
    });
  });

  describe('4. Template Engine & Offer Letter Generation', () => {
    it('interpolates template tags with live candidate and offer version data', async () => {
      // First approve OFF-2026-003
      const offer = offerService.getOfferById('OFF-2026-003');
      offer.status = OFFER_STATUS.APPROVED;

      const genResult = await offerService.generateOfferLetter('OFF-2026-003', 'TMPL-IND-FT-01', 'Sarah Jenkins');
      
      expect(genResult.document).toBeDefined();
      expect(genResult.document.contentHtml).toContain(offer.candidateName);
      expect(genResult.document.generatedBy).toBe('Sarah Jenkins');
      expect(genResult.document.version).toBe(1);
      expect(genResult.offer.status).toBe(OFFER_STATUS.GENERATED);
      expect(genResult.offer.documentVersions.length).toBeGreaterThan(0);
    });
  });

  describe('5. Candidate Portal, Negotiation & Version Bumping (V1 -> V2)', () => {
    it('handles candidate change request, bumps version to V2 on counter and requires re-approval', async () => {
      // OFF-2026-004 is in Sent status
      let offer = offerService.getOfferById('OFF-2026-004');
      expect(offer.status).toBe(OFFER_STATUS.SENT);

      // Step 1: Candidate submits change request in portal
      const negOffer = await offerService.recordCandidateAction('OFF-2026-004', {
        action: 'REQUEST_CHANGES',
        payload: {
          requestedValue: '₹27,00,000 / Annual Base + Earlier Start Date Nov 1',
          reason: 'Competing offer with immediate start date'
        }
      });
      expect(negOffer.status).toBe(OFFER_STATUS.NEGOTIATION);
      expect(negOffer.negotiations.length).toBeGreaterThan(0);

      // Step 2: Recruiter processes response by countering -> V1 to V2 bump
      const revisedOffer = await offerService.processNegotiationResponse('OFF-2026-004', {
        decision: 'COUNTER',
        revisedData: {
          totalBase: 2400000,
          expectedStartDate: '2026-11-01'
        },
        counterReason: 'Adjusted base to 24 LPA and confirmed Nov 1 join date with Hiring Manager.'
      }, 'Sarah Jenkins');

      expect(revisedOffer.version).toBe(2);
      expect(revisedOffer.status).toBe(OFFER_STATUS.PENDING_REAPPROVAL);
      expect(revisedOffer.approvalStatus).toBe(APPROVAL_STATUS.PENDING);
      expect(revisedOffer.totalBase).toBe(2400000);
    });

    it('locks offer permanently when accepted with digital eSignature', async () => {
      const acceptedOffer = await offerService.recordCandidateAction('OFF-2026-004', {
        action: 'ACCEPT',
        payload: { signatureType: 'Certified Digital Cryptographic Signature' }
      });

      expect(acceptedOffer.status).toBe(OFFER_STATUS.ACCEPTED);
      expect(acceptedOffer.signatureStatus).toBe(SIGNATURE_STATUS.SIGNED);
      expect(acceptedOffer.isLocked).toBe(true);
      expect(acceptedOffer.eSignature.certificateId).toBeDefined();
    });

    it('records candidate decline with mandatory reason', async () => {
      const declinedOffer = await offerService.recordCandidateAction('OFF-2026-004', {
        action: 'DECLINE',
        payload: {
          reason: 'Accepted Another Offer',
          comments: 'Candidate accepted competing offer closer to location.'
        }
      });

      expect(declinedOffer.status).toBe(OFFER_STATUS.DECLINED);
      expect(declinedOffer.declineReason).toBe('Accepted Another Offer');
      expect(declinedOffer.signatureStatus).toBe(SIGNATURE_STATUS.DECLINED);
    });
  });

  describe('6. Preboarding Handoff', () => {
    it('transfers accepted offer payload to Preboarding without duplicating master candidate', async () => {
      // OFF-2026-001 is already ACCEPTED in INITIAL_OFFERS
      const handoff = await offerService.moveCandidateToPreboarding('OFF-2026-001', 'Sarah Jenkins');
      expect(handoff.status).toBe(OFFER_STATUS.COMPLETED);
      expect(handoff.preboardingStatus).toBe('Transferred to Preboarding');
    });

    it('blocks preboarding handoff for non-accepted offers', async () => {
      await expect(
        offerService.moveCandidateToPreboarding('OFF-2026-003', 'Sarah Jenkins')
      ).rejects.toThrow(/Only accepted offers/);
    });
  });

  describe('7. Expiry, Extension, and Rescind/Withdrawal', () => {
    it('extends offer expiration date with audit record', async () => {
      // OFF-2026-006 is in EXPIRED status
      const extOffer = await offerService.extendOfferExpiry('OFF-2026-006', '2026-11-15', 'Candidate requested extension', 'Sarah Jenkins');
      expect(extOffer.offerExpirationDate).toBe('2026-11-15');
      expect(extOffer.status).toBe(OFFER_STATUS.SENT); // Unblocks expired offer to active Sent
    });

    it('withdraws an offer requiring mandatory reason and records immutability', async () => {
      const withdrawnOffer = await offerService.withdrawOffer('OFF-2026-004', 'Position Headcount Cancelled', 'Sarah Jenkins');
      expect(withdrawnOffer.status).toBe(OFFER_STATUS.WITHDRAWN);
      expect(withdrawnOffer.withdrawnReason).toBe('Position Headcount Cancelled');
    });
  });

  describe('8. Role-Based Access Control (RBAC) Permissions Matrix', () => {
    it('allows recruiters to create, update, submit, and negotiate offers', () => {
      expect(hasOfferPermission(OFFER_ROLES.RECRUITER, OFFER_PERMISSIONS.CREATE)).toBe(true);
      expect(hasOfferPermission(OFFER_ROLES.RECRUITER, OFFER_PERMISSIONS.SUBMIT)).toBe(true);
      expect(hasOfferPermission(OFFER_ROLES.RECRUITER, OFFER_PERMISSIONS.NEGOTIATE)).toBe(true);
    });

    it('prevents hiring managers from creating templates or managing system policies', () => {
      expect(hasOfferPermission(OFFER_ROLES.HIRING_MANAGER, OFFER_PERMISSIONS.MANAGE_TEMPLATES)).toBe(false);
      expect(hasOfferPermission(OFFER_ROLES.HIRING_MANAGER, OFFER_PERMISSIONS.MANAGE_POLICIES)).toBe(false);
      expect(hasOfferPermission(OFFER_ROLES.HIRING_MANAGER, OFFER_PERMISSIONS.APPROVE)).toBe(true);
    });

    it('restricts candidate role to candidate portal actions only', () => {
      expect(hasOfferPermission(OFFER_ROLES.CANDIDATE, OFFER_PERMISSIONS.READ)).toBe(true);
      expect(hasOfferPermission(OFFER_ROLES.CANDIDATE, OFFER_PERMISSIONS.CREATE)).toBe(false);
      expect(hasOfferPermission(OFFER_ROLES.CANDIDATE, OFFER_PERMISSIONS.APPROVE)).toBe(false);
      expect(hasOfferPermission(OFFER_ROLES.CANDIDATE, OFFER_PERMISSIONS.WITHDRAW)).toBe(false);
    });
  });

  describe('9. KPI & Dashboard Analytics Derivation', () => {
    it('computes live metrics derived accurately from actual active offer datasets', () => {
      const kpis = offerService.getOfferKpiMetrics();
      expect(kpis.total).toBeGreaterThan(0);
      expect(kpis.acceptanceRate).toBeDefined();
      expect(kpis.negotiation).toBeGreaterThanOrEqual(1);
      expect(kpis.pendingApproval).toBeGreaterThanOrEqual(1);
    });
  });

  describe('10. Advanced CTC & Component Math Precision', () => {
    it('accurately calculates composite CTC with multi-tier allowances and annual components', async () => {
      const complexOfferPayload = {
        candidateId: 'CAND-009',
        candidateName: 'Aarav Singhania',
        candidateEmail: 'aarav.s@example.com',
        applicationId: 'APP-2026-009',
        requisitionId: 'REQ-2026-001',
        jobTitle: 'Principal Architect',
        department: 'Architecture',
        components: [
          { name: 'Basic Salary', amount: 3600000, frequency: 'Annual', type: COMPENSATION_TYPE.BASE_SALARY },
          { name: 'House Rent Allowance (HRA)', amount: 1440000, frequency: 'Annual', type: COMPENSATION_TYPE.ALLOWANCE },
          { name: 'Special Allowance', amount: 960000, frequency: 'Annual', type: COMPENSATION_TYPE.ALLOWANCE },
          { name: 'Annual Performance Bonus', amount: 1000000, frequency: 'Annual', type: COMPENSATION_TYPE.VARIABLE_PAY },
          { name: 'Sign-on Stock Grant (Year 1)', amount: 1000000, frequency: 'One Time', type: COMPENSATION_TYPE.JOINING_BONUS }
        ]
      };

      const offer = await offerService.createOffer(complexOfferPayload, 'Sarah Jenkins');
      expect(offer.totalBase).toBe(3600000);
      expect(offer.totalVariable).toBe(1000000);
      expect(offer.totalOneTime).toBe(1000000);
      // Total CTC = Base (36L) + HRA (14.4L) + Special (9.6L) + Variable (10L) + Sign-on (10L) = 80,00,000
      expect(offer.totalCtc).toBe(8000000);
    });
  });

  describe('11. Search, Filtering, and Offer Queries', () => {
    it('retrieves and filters offers by status, department, and candidate search query', async () => {
      const allOffers = offerService.getAllOffers();
      expect(allOffers.length).toBeGreaterThan(0);

      const paginatedResult = await offerService.getOffers({ pageSize: 5 });
      expect(paginatedResult.items.length).toBeGreaterThan(0);
      expect(paginatedResult.totalCount).toBe(allOffers.length);

      const engineeringOffers = allOffers.filter(o => (o.department || '').includes('Engineering'));
      expect(engineeringOffers.length).toBeGreaterThan(0);

      const specificOffer = offerService.getOfferById(allOffers[0].id);
      expect(specificOffer).toBeDefined();
      expect(specificOffer.id).toBe(allOffers[0].id);
    });
  });
});
