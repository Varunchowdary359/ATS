import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyService, POLICY_TYPES, DEFAULT_POLICY_ASSIGNMENTS } from '../../../services/policy/PolicyService';
import { interviewService } from './interviewService';
import { notificationProviderAdapter, EMAIL_TEMPLATES } from './adapters/notificationProviderAdapter';

describe('Enterprise ATS Interview Module & Policy System Integration Test Suite', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage?.clear();
      window.sessionStorage?.clear();
    }
  });

  describe('1. Standard Configured Rounds Resolution (SWE Plan & PM Plan)', () => {
    it('1.1 Round 1: Aptitude & Cognitive Assessment resolves to Aptitude Exam Policy (POL-EXAM-MCQ-004)', () => {
      const res = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-SWE-1',
        roundName: 'Aptitude & Cognitive Assessment',
        roundCategory: 'Assessment',
        roundSubtype: 'Aptitude Test'
      });
      expect(res).toBeDefined();
      expect(res.isAssigned).toBe(true);
      expect(res.policy?.id).toBe('POL-EXAM-MCQ-004');
      expect(res.policy?.name).toContain('Aptitude');
      expect(res.policy?.rules.fullscreen.required).toBe(true);
    });

    it('1.2 Round 2: Coding & Algorithmic Assessment resolves to Proctored Coding Policy (POL-ASM-PROCTOR-003)', () => {
      const res = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-SWE-2',
        roundName: 'Coding & Algorithmic Assessment',
        roundCategory: 'Assessment',
        roundSubtype: 'Coding Assessment'
      });
      expect(res).toBeDefined();
      expect(res.isAssigned).toBe(true);
      expect(res.policy?.id).toBe('POL-ASM-PROCTOR-003');
      expect(res.policy?.name).toContain('Coding Assessment');
      expect(res.policy?.rules.camera.required).toBe(true);
      expect(res.policy?.rules.screenShare.required).toBe(true);
    });

    it('1.3 Round 3: Technical Deep-Dive Interview resolves to Technical Policy (POL-INT-TECH-002 v1.2)', () => {
      const res = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-SWE-3',
        roundName: 'Technical Deep-Dive Interview',
        roundCategory: 'Interview',
        roundSubtype: 'Technical Interview'
      });
      expect(res).toBeDefined();
      expect(res.isAssigned).toBe(true);
      expect(res.policy?.id).toBe('POL-INT-TECH-002');
      expect(res.version).toBe('v1.2');
      expect(res.policy?.rules.camera.required).toBe(true);
      expect(res.policy?.rules.microphone.required).toBe(true);
      expect(res.policy?.rules.screenShare.required).toBe(true);
    });

    it('1.4 Round 4: System Design & Scalability resolves to Technical Policy (POL-INT-TECH-002)', () => {
      const res = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-SWE-4',
        roundName: 'System Design & Scalability',
        roundCategory: 'Interview',
        roundSubtype: 'System Design'
      });
      expect(res).toBeDefined();
      expect(res.isAssigned).toBe(true);
      expect(res.policy?.id).toBe('POL-INT-TECH-002');
    });

    it('1.5 Round 5: Managerial & Cultural Fit resolves to HR/Behavioral Policy (POL-INT-HR-001)', () => {
      const res = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-SWE-5',
        roundName: 'Managerial & Cultural Fit Interview',
        roundCategory: 'Interview',
        roundSubtype: 'Managerial Interview'
      });
      expect(res).toBeDefined();
      expect(res.isAssigned).toBe(true);
      expect(res.policy?.id).toBe('POL-INT-HR-001');
      expect(res.policy?.rules.camera.required).toBe(true);
      expect(res.policy?.rules.microphone.required).toBe(true);
      expect(res.policy?.rules.screenShare.required).toBe(false);
    });

    it('1.6 Round 6: HR & Final Leadership Alignment resolves to HR Policy (POL-INT-HR-001)', () => {
      const res = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-SWE-6',
        roundName: 'HR & Final Leadership Alignment',
        roundCategory: 'Interview',
        roundSubtype: 'HR Interview'
      });
      expect(res).toBeDefined();
      expect(res.isAssigned).toBe(true);
      expect(res.policy?.id).toBe('POL-INT-HR-001');
    });
  });

  describe('2. Multi-Level Precedence Engine (Round -> Requisition -> Category -> None)', () => {
    it('2.1 Round assignment overrides both Requisition and Category policies', () => {
      // 1. Assign specific policy to round
      PolicyService.assignPolicy('round', 'RND-SPECIAL-OVERRIDE', 'POL-INT-TECH-002');
      // 2. Assign different policy to requisition
      PolicyService.assignPolicy('requisition', 'REQ-SR-DEV-001', 'POL-INT-HR-001');

      const resolved = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-SPECIAL-OVERRIDE',
        requisitionId: 'REQ-SR-DEV-001',
        roundCategory: 'HR & Culture'
      });

      expect(resolved.isAssigned).toBe(true);
      expect(resolved.policy?.id).toBe('POL-INT-TECH-002');
      expect(resolved.source).toBe('round');
    });

    it('2.2 Requisition assignment resolves when round policy is absent', () => {
      PolicyService.assignPolicy('requisition', 'REQ-DEVOPS-999', 'POL-ASM-PROCTOR-003');

      const resolved = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-UNCONFIGURED-CUSTOM-99',
        requisitionId: 'REQ-DEVOPS-999',
        roundCategory: 'Generic Interview'
      });

      expect(resolved.isAssigned).toBe(true);
      expect(resolved.policy?.id).toBe('POL-ASM-PROCTOR-003');
      expect(resolved.source).toBe('requisition');
    });

    it('2.3 Category policy resolves when both round and requisition policies are absent', () => {
      const resolvedTech = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-NONEXISTENT-XYZ',
        requisitionId: 'REQ-NONEXISTENT-ABC',
        roundCategory: 'Technical'
      });
      expect(resolvedTech.isAssigned).toBe(true);
      expect(resolvedTech.policy?.id).toBe('POL-INT-TECH-002');
      expect(resolvedTech.source).toBe('category');

      const resolvedHR = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-NONEXISTENT-XYZ',
        requisitionId: 'REQ-NONEXISTENT-ABC',
        roundCategory: 'HR'
      });
      expect(resolvedHR.isAssigned).toBe(true);
      expect(resolvedHR.policy?.id).toBe('POL-INT-HR-001');
      expect(resolvedHR.source).toBe('category');
    });

    it('2.4 Returns fail-closed unassigned result (policy: null, isAssigned: false) when no policy is assigned at any level', () => {
      const resolved = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-TOTALLY-UNKNOWN-9999',
        requisitionId: 'REQ-TOTALLY-UNKNOWN-9999',
        roundCategory: 'CompletelyUnregisteredCustomWorkflowCategory'
      });
      expect(resolved.isAssigned).toBe(false);
      expect(resolved.policy).toBeNull();
      expect(resolved.source).toBe('none');
      expect(resolved.reason).toBe('No policy assigned');
    });
  });

  describe('3. Robust ID, Category & Subtype Normalization', () => {
    it('3.1 Handles whitespace and case variations in round IDs', () => {
      const res = PolicyService.resolvePolicyForInterview({
        roundId: ' rnd-swe-3  '
      });
      expect(res.isAssigned).toBe(true);
      expect(res.policy?.id).toBe('POL-INT-TECH-002');
    });

    it('3.2 Handles whitespace and case variations in requisition IDs', () => {
      PolicyService.assignPolicy('requisition', 'REQ-CLOUD-2026', 'POL-INT-TECH-002');

      const res = PolicyService.resolvePolicyForInterview({
        requisitionId: ' req-cloud-2026 '
      });
      expect(res.isAssigned).toBe(true);
      expect(res.policy?.id).toBe('POL-INT-TECH-002');
    });

    it('3.3 Resolves policy via roundSubtype when roundCategory is generic Interview', () => {
      const res = PolicyService.resolvePolicyForInterview({
        roundCategory: 'Interview',
        roundSubtype: 'Technical Interview'
      });
      expect(res.isAssigned).toBe(true);
      expect(res.policy?.id).toBe('POL-INT-TECH-002');
    });
  });

  describe('4. Dynamic Policy Re-Resolution on Selection Changes', () => {
    it('4.1 Re-resolves correctly when user switches rounds', () => {
      // 1. Select Round 1 (Aptitude)
      const res1 = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-SWE-1',
        roundName: 'Aptitude & Cognitive Assessment',
        roundCategory: 'Assessment'
      });
      expect(res1.policy?.id).toBe('POL-EXAM-MCQ-004');

      // 2. Switch to Round 3 (Technical Deep-Dive)
      const res2 = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-SWE-3',
        roundName: 'Technical Deep-Dive Interview',
        roundCategory: 'Interview'
      });
      expect(res2.policy?.id).toBe('POL-INT-TECH-002');

      // 3. Switch to Round 5 (Managerial Fit)
      const res3 = PolicyService.resolvePolicyForInterview({
        roundId: 'RND-SWE-5',
        roundName: 'Managerial & Cultural Fit Interview',
        roundCategory: 'Interview'
      });
      expect(res3.policy?.id).toBe('POL-INT-HR-001');
    });

    it('4.2 Re-resolves correctly when user switches job requisitions', () => {
      PolicyService.assignPolicy('requisition', 'REQ-ENG-CORE', 'POL-INT-TECH-002');
      PolicyService.assignPolicy('requisition', 'REQ-HR-PEOPLE', 'POL-INT-HR-001');

      const res1 = PolicyService.resolvePolicyForInterview({
        requisitionId: 'REQ-ENG-CORE'
      });
      expect(res1.policy?.id).toBe('POL-INT-TECH-002');

      const res2 = PolicyService.resolvePolicyForInterview({
        requisitionId: 'REQ-HR-PEOPLE'
      });
      expect(res2.policy?.id).toBe('POL-INT-HR-001');
    });
  });

  describe('5. Policy Immutability & Version Locking', () => {
    it('5.1 Historical scheduled session retains locked policyId and version across global policy edits', async () => {
      const initialPolicy = PolicyService.getPolicyById('POL-INT-HR-001');
      expect(initialPolicy.version).toBe('v1.0');

      // Schedule historical interview
      const historicalSession = await interviewService.scheduleInterviewSession({
        candidateId: 'CAND-100',
        candidateName: 'Alice Morgan',
        candidateEmail: 'alice@example.com',
        requisitionId: 'REQ-GEN-001',
        roundId: 'RND-SWE-5',
        roundName: 'Managerial Fit',
        roundCategory: 'Interview'
      });

      expect(historicalSession.policyId).toBe('POL-INT-HR-001');
      expect(historicalSession.policyVersion).toBe('v1.0');

      // Admin modifies policy definition, bumping version to v1.1
      PolicyService.savePolicy({
        ...initialPolicy,
        description: 'Updated HR Policy Description for 2026'
      });

      const globalPolicy = PolicyService.getPolicyById('POL-INT-HR-001');
      expect(globalPolicy.version).toBe('v1.1');

      // Historical interview MUST remain locked at v1.0
      expect(historicalSession.policyId).toBe('POL-INT-HR-001');
      expect(historicalSession.policyVersion).toBe('v1.0');
    });
  });

  describe('6. Interview Scheduling & Email Notification Integration', () => {
    it('6.1 Stores resolved policy metadata and dispatches email with policy guidelines', async () => {
      const session = await interviewService.scheduleInterviewSession({
        candidateName: 'David Lee',
        candidateEmail: 'david@example.com',
        requisitionId: 'REQ-2026-001',
        requisitionTitle: 'Senior Full Stack Engineer',
        roundId: 'RND-SWE-3',
        roundName: 'Technical Deep-Dive Interview',
        roundCategory: 'Interview',
        scheduledDate: '2026-09-28',
        startTime: '10:00 AM',
        endTime: '11:00 AM'
      });

      expect(session.policyId).toBe('POL-INT-TECH-002');
      expect(session.policyVersion).toBe('v1.2');
      expect(session.policyName).toContain('Technical');
      expect(session.interviewerPolicyRequired).toBe(true);

      const email = notificationProviderAdapter.generateInterviewEmail({
        type: EMAIL_TEMPLATES.INTERVIEW_INVITATION,
        session,
        companyName: 'PeopleWorks ATS',
        recruiterName: 'Sarah Jenkins'
      });

      expect(email.body).toContain('ASSESSMENT & INTEGRITY POLICY:');
      expect(email.body).toContain(session.policyName);
      expect(email.body).toContain(session.policyVersion);
      expect(email.body).toContain('Readiness & Integrity Gate');
    });
  });
});
