/**
 * Enterprise Preboarding Service & Lifecycle Test Suite
 * PeopleWorks ATS SaaS
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { preboardingService } from './preboardingService';
import { bgvService } from './bgvService';
import { hrmsHandoffService } from './hrmsHandoffService';
import {
  PREBOARDING_STATUS,
  DOCUMENT_STATUS,
  BGV_STATUS,
  TASK_STATUS,
  HANDOFF_STATUS
} from './preboardingTypes';
import { evaluateJoiningReadiness, validateCandidateInfo, validateJoiningDetails } from './preboardingValidation';

describe('Enterprise ATS Preboarding Management Module Test Suite', () => {
  
  describe('1. Automatic Preboarding Creation from Accepted Offer', () => {
    it('creates a new preboarding record inheriting all candidate and offer data without duplication', async () => {
      const mockOffer = {
        id: 'OFF-TEST-999',
        candidateId: 'CAND-TEST-99',
        applicationId: 'APP-TEST-99',
        requisitionId: 'REQ-TEST-99',
        candidateName: 'Alexander Hayes',
        candidateEmail: 'alex.hayes@example.com',
        candidatePhone: '+1 415 555 0199',
        jobTitle: 'Principal Cloud Architect',
        department: 'Infrastructure',
        businessUnit: 'Cloud Services',
        workLocation: 'New York, NY',
        expectedStartDate: '2026-05-01',
        totalBase: 220000,
        totalVariable: 30000,
        totalCtc: 250000
      };

      const record = await preboardingService.createPreboardingFromOffer(mockOffer, 'Vitest Engine');
      expect(record).toBeDefined();
      expect(record.offerId).toBe('OFF-TEST-999');
      expect(record.candidateId).toBe('CAND-TEST-99');
      expect(record.candidateName).toBe('Alexander Hayes');
      expect(record.status).toBe(PREBOARDING_STATUS.INITIATED);
      expect(record.documents.length).toBeGreaterThan(0);
      expect(record.tasks.length).toBeGreaterThan(0);
    });

    it('returns existing preboarding record if already created for an offer', async () => {
      const mockOffer = {
        id: 'OFF-2026-001',
        candidateName: 'Vikram Sethi'
      };
      const record = await preboardingService.createPreboardingFromOffer(mockOffer);
      expect(record.id).toBe('PRE-2026-001');
    });
  });

  describe('2. Validation & Joining Readiness Gate', () => {
    it('validates mandatory candidate info fields correctly', () => {
      const invalid = validateCandidateInfo({});
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.firstName).toBeDefined();
      expect(invalid.errors.email).toBeDefined();

      const valid = validateCandidateInfo({
        firstName: 'Sarah',
        lastName: 'Jenkins',
        dob: '1990-01-01',
        email: 'sarah@example.com',
        mobile: '+1 555 1234567',
        currentAddress: '123 Main St',
        city: 'Austin',
        state: 'TX',
        country: 'United States',
        postalCode: '78701',
        emergencyContactName: 'John Doe',
        emergencyContactRelationship: 'Spouse',
        emergencyContactMobile: '+1 555 9876543'
      });
      expect(valid.isValid).toBe(true);
    });

    it('blocks Ready to Join status when mandatory documents or BGV are pending', () => {
      const unreadyRecord = {
        id: 'PRE-TEST-UNREADY',
        offerId: 'OFF-1',
        candidateInfo: {
          firstName: 'John',
          lastName: 'Doe',
          dob: '1990-01-01',
          email: 'john@example.com',
          mobile: '+1 555 0100',
          currentAddress: '123 Pine St',
          city: 'Seattle',
          state: 'WA',
          country: 'United States',
          postalCode: '98101',
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Sister',
          emergencyContactMobile: '+1 555 0101'
        },
        joiningDetails: {
          joiningDate: '2026-04-01',
          location: 'Seattle, WA',
          workArrangement: 'Hybrid',
          department: 'Engineering',
          designation: 'Staff Engineer',
          employmentType: 'Full Time',
          reportingManager: 'Manager'
        },
        documents: [
          { name: 'Passport', required: true, status: DOCUMENT_STATUS.REJECTED }
        ],
        bgvChecks: [
          { type: 'Identity', required: true, status: BGV_STATUS.DISCREPANCY }
        ],
        tasks: [
          { name: 'Task 1', required: true, status: TASK_STATUS.NOT_STARTED }
        ]
      };

      const result = evaluateJoiningReadiness(unreadyRecord);
      expect(result.isReady).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
    });

    it('allows Ready to Join when all 8 readiness checkpoints are satisfied', () => {
      const readyRecord = {
        id: 'PRE-TEST-READY',
        offerId: 'OFF-1',
        candidateInfo: {
          firstName: 'John',
          lastName: 'Doe',
          dob: '1990-01-01',
          email: 'john@example.com',
          mobile: '+1 555 0100',
          currentAddress: '123 Pine St',
          city: 'Seattle',
          state: 'WA',
          country: 'United States',
          postalCode: '98101',
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Sister',
          emergencyContactMobile: '+1 555 0101'
        },
        joiningDetails: {
          joiningDate: '2026-04-01',
          location: 'Seattle, WA',
          workArrangement: 'Hybrid',
          department: 'Engineering',
          designation: 'Staff Engineer',
          employmentType: 'Full Time',
          reportingManager: 'Manager'
        },
        documents: [
          { name: 'Passport', required: true, status: DOCUMENT_STATUS.VERIFIED }
        ],
        bgvChecks: [
          { type: 'Identity', required: true, status: BGV_STATUS.CLEAR }
        ],
        tasks: [
          { name: 'Task 1', required: true, status: TASK_STATUS.COMPLETED }
        ]
      };

      const result = evaluateJoiningReadiness(readyRecord);
      expect(result.isReady).toBe(true);
      expect(result.blockers.length).toBe(0);
    });
  });

  describe('3. Document & BGV Management Workflows', () => {
    it('manages document verification and rejection with mandatory reason', async () => {
      // Rejection requires reason
      await expect(
        preboardingService.manageDocument('PRE-2026-001', 'DOC-01', 'REJECT', { reason: '' })
      ).rejects.toThrow();

      // Verify doc
      const updated = await preboardingService.manageDocument('PRE-2026-001', 'DOC-01', 'VERIFY');
      const doc = updated.documents.find(d => d.id === 'DOC-01');
      expect(doc.status).toBe(DOCUMENT_STATUS.VERIFIED);
    });

    it('initiates and fetches BGV check records via bgvService', async () => {
      const check = await bgvService.startCheck('PRE-2026-001', 'Identity', 'authbridge');
      expect(check.id).toBeDefined();
      expect(check.status).toBe(BGV_STATUS.IN_PROGRESS);

      const status = await bgvService.getStatus('PRE-2026-001', check.id);
      expect(status.status).toBe(BGV_STATUS.IN_PROGRESS);
    });
  });

  describe('4. HRMS Employee Handoff & Failure Recovery', () => {
    it('prepares compliant JSON schema payload for HRMS integration', () => {
      const mockRecord = {
        id: 'PRE-2026-001',
        candidateId: 'CAND-102',
        applicationId: 'APP-102',
        requisitionId: 'REQ-2026-001',
        offerId: 'OFF-2026-001',
        candidateName: 'Vikram Sethi',
        candidateEmail: 'vikram.sethi@gmail.com',
        joiningDetails: {
          designation: 'Staff DevOps Engineer',
          department: 'Platform Engineering',
          location: 'Bengaluru',
          joiningDate: '2026-04-01'
        },
        compensation: { totalCtc: 3400000, currency: 'INR' }
      };

      const payload = hrmsHandoffService.prepareEmployeePayload(mockRecord);
      expect(payload.integrationHeader.targetSystem).toBe('PeopleWorks_HRMS_Core');
      expect(payload.identifiers.preboardingId).toBe('PRE-2026-001');
      expect(payload.identifiers.candidateId).toBe('CAND-102');
    });

    it('handles simulated HRMS conversion failure and records retryable state', async () => {
      const failRes = await preboardingService.convertToEmployee('PRE-2026-002', { simulateFailure: true, failureReason: 'Network error' });
      expect(failRes.handoffRes.success).toBe(false);
      expect(failRes.record.status).toBe(PREBOARDING_STATUS.HANDOFF_FAILED);

      // Now retry handoff
      const retryRes = await preboardingService.retryHandoff('PRE-2026-002', 'Connection restored');
      expect(retryRes.handoffRes.success).toBe(true);
      expect(retryRes.record.status).toBe(PREBOARDING_STATUS.EMPLOYEE_CREATED);
      expect(retryRes.record.employeeId).toMatch(/^EMP-\d+/);
    });
  });

});
