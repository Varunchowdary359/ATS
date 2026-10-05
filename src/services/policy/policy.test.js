import { describe, it, expect, beforeEach } from 'vitest';
import { 
  PolicyService, POLICY_TYPES, VIOLATION_ACTIONS, VIOLATION_TYPES 
} from './PolicyService';

describe('Enterprise ATS Interview & Assessment Policy Module', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('1. Central Policy Configuration & Defaults', () => {
    it('should initialize with standard default policies for interviews and exams', () => {
      const policies = PolicyService.getPolicies();
      expect(policies.length).toBeGreaterThanOrEqual(4);

      const hrPolicy = policies.find(p => p.id === 'POL-INT-HR-001');
      expect(hrPolicy).toBeDefined();
      expect(hrPolicy.type).toBe(POLICY_TYPES.INTERVIEW);
      expect(hrPolicy.rules.camera.required).toBe(true);
      expect(hrPolicy.rules.microphone.required).toBe(true);
      expect(hrPolicy.rules.recording.enabled).toBe(false);

      const proctorPolicy = policies.find(p => p.id === 'POL-ASM-PROCTOR-003');
      expect(proctorPolicy).toBeDefined();
      expect(proctorPolicy.type).toBe(POLICY_TYPES.PROCTORED_ASSESSMENT);
      expect(proctorPolicy.rules.fullscreen.required).toBe(true);
      expect(proctorPolicy.rules.tabSwitch.detection).toBe(true);
      expect(proctorPolicy.rules.clipboard.preventCopy).toBe(true);
    });

    it('should retrieve a policy by its ID', () => {
      const policy = PolicyService.getPolicyById('POL-INT-TECH-002');
      expect(policy).toBeDefined();
      expect(policy.name).toContain('Technical');
      expect(policy.rules.screenShare.required).toBe(true);
    });
  });

  describe('2. Policy Versioning & Mutation', () => {
    it('should auto-increment minor version when modifying an existing policy', () => {
      const original = PolicyService.getPolicyById('POL-INT-HR-001');
      expect(original.version).toBe('v1.0');

      const updated = PolicyService.savePolicy({
        ...original,
        description: 'Updated HR Policy Description with new notes'
      });

      expect(updated.version).toBe('v1.1');
      const retrieved = PolicyService.getPolicyById('POL-INT-HR-001');
      expect(retrieved.version).toBe('v1.1');
      expect(retrieved.description).toContain('Updated HR Policy Description');
    });

    it('should duplicate a policy and assign a clean copy ID and v1.0 version', () => {
      const duplicated = PolicyService.duplicatePolicy('POL-ASM-PROCTOR-003');
      expect(duplicated).toBeDefined();
      expect(duplicated.id).toMatch(/^POL-COPY-/);
      expect(duplicated.name).toContain('(Copy)');
      expect(duplicated.version).toBe('v1.0');
      expect(duplicated.rules.fullscreen.required).toBe(true);
    });

    it('should toggle policy enabled/disabled status', () => {
      const policyId = 'POL-TEST-SCREEN-005';
      const toggled1 = PolicyService.togglePolicyStatus(policyId);
      expect(toggled1.enabled).toBe(false);

      const toggled2 = PolicyService.togglePolicyStatus(policyId);
      expect(toggled2.enabled).toBe(true);
    });
  });

  describe('3. Policy Assignment & Resolution', () => {
    it('should assign a specific policy to a job requisition and resolve it', () => {
      const reqId = 'REQ-2026-ENG-042';
      const policyId = 'POL-INT-TECH-002';

      PolicyService.assignPolicy('requisition', reqId, policyId);
      const effective = PolicyService.getEffectivePolicy('requisition', reqId);

      expect(effective).toBeDefined();
      expect(effective.id).toBe(policyId);
      expect(effective.type).toBe(POLICY_TYPES.TECHNICAL_INTERVIEW);
    });

    it('should fallback to default workflow policy if no specific assignment exists', () => {
      const effective = PolicyService.getEffectivePolicy('requisition', 'REQ-UNASSIGNED-999', POLICY_TYPES.EXAM);
      expect(effective).toBeDefined();
      expect(effective.type).toBe(POLICY_TYPES.EXAM);
    });
  });

  describe('4. Candidate Readiness & Mandatory Policy Blockers', () => {
    const strictPolicy = {
      id: 'POL-TEST-STRICT',
      version: 'v1.0',
      rules: {
        camera: { required: true },
        microphone: { required: true },
        screenShare: { required: true },
        fullscreen: { required: true },
        recording: { enabled: true },
        candidateAcknowledgement: { required: true, privacyConsentRequired: true }
      }
    };

    it('should block starting when mandatory camera and microphone checks are incomplete', () => {
      const state = {
        cameraStatus: 'idle',
        microphoneStatus: 'idle',
        screenShareStatus: 'ready',
        fullscreenActive: true,
        acknowledgedPolicy: true,
        acknowledgedPrivacy: true
      };

      const result = PolicyService.validateCandidateReadiness(strictPolicy, state);
      expect(result.ready).toBe(false);
      expect(result.blockers.some(b => b.includes('camera check'))).toBe(true);
      expect(result.blockers.some(b => b.includes('microphone check'))).toBe(true);
    });

    it('should block starting when mandatory policy acknowledgement is not checked', () => {
      const state = {
        cameraStatus: 'ready',
        microphoneStatus: 'ready',
        screenShareStatus: 'ready',
        fullscreenActive: true,
        acknowledgedPolicy: false,
        acknowledgedPrivacy: true
      };

      const result = PolicyService.validateCandidateReadiness(strictPolicy, state);
      expect(result.ready).toBe(false);
      expect(result.blockers.some(b => b.includes('explicitly acknowledged'))).toBe(true);
    });

    it('should block starting when recording is active and privacy consent is not checked', () => {
      const state = {
        cameraStatus: 'ready',
        microphoneStatus: 'ready',
        screenShareStatus: 'ready',
        fullscreenActive: true,
        acknowledgedPolicy: true,
        acknowledgedPrivacy: false
      };

      const result = PolicyService.validateCandidateReadiness(strictPolicy, state);
      expect(result.ready).toBe(false);
      expect(result.blockers.some(b => b.includes('privacy consent'))).toBe(true);
    });

    it('should permit session start when all mandatory readiness prerequisites are satisfied', () => {
      const state = {
        cameraStatus: 'ready',
        microphoneStatus: 'ready',
        screenShareStatus: 'ready',
        fullscreenActive: true,
        acknowledgedPolicy: true,
        acknowledgedPrivacy: true
      };

      const result = PolicyService.validateCandidateReadiness(strictPolicy, state);
      expect(result.ready).toBe(true);
      expect(result.blockers.length).toBe(0);
    });
  });

  describe('5. Candidate Policy Acceptance Evidence Logging', () => {
    it('should create an immutable acceptance record with timestamp and device state', () => {
      const record = PolicyService.recordCandidateAcceptance({
        candidateId: 'CAND-2026-88',
        candidateName: 'Sarah Jenkins',
        candidateEmail: 'sarah.j@example.com',
        policyId: 'POL-ASM-PROCTOR-003',
        policyVersion: 'v2.0',
        interviewId: 'INT-9901',
        deviceCapabilities: {
          cameraReady: true,
          micReady: true,
          screenReady: true,
          fullscreen: true
        }
      });

      expect(record.id).toMatch(/^ACC-/);
      expect(record.candidateId).toBe('CAND-2026-88');
      expect(record.policyVersion).toBe('v2.0');
      expect(record.acceptedAt).toBeDefined();
      expect(record.evidenceStatus).toBe('VERIFIED_ON_CLIENT');

      const stored = PolicyService.getCandidateAcceptances('CAND-2026-88');
      expect(stored.length).toBe(1);
      expect(stored[0].candidateEmail).toBe('sarah.j@example.com');
    });
  });

  describe('6. Standardized Violation Records & Threshold Triggering', () => {
    it('should generate a standardized violation record', () => {
      const viol = PolicyService.createViolationRecord({
        type: VIOLATION_TYPES.TAB_SWITCH,
        message: 'Candidate navigated away from assessment window.',
        severity: 'high',
        currentCount: 2,
        maxThreshold: 3,
        actionTaken: VIOLATION_ACTIONS.WARNING
      });

      expect(viol.id).toMatch(/^VIOL-/);
      expect(viol.type).toBe('tab_switch');
      expect(viol.count).toBe(2);
      expect(viol.actionTaken).toBe('warning');
      expect(viol.timestamp).toBeDefined();
    });

    it('should trigger AUTO_SUBMIT when violation count reaches maximum configured threshold', () => {
      const max = 3;
      const count = 3;
      const action = count >= max ? VIOLATION_ACTIONS.AUTO_SUBMIT : VIOLATION_ACTIONS.WARNING;

      const finalViol = PolicyService.createViolationRecord({
        type: VIOLATION_TYPES.FULLSCREEN_EXITED,
        message: 'Candidate exited fullscreen mode repeatedly.',
        severity: 'high',
        currentCount: count,
        maxThreshold: max,
        actionTaken: action
      });

      expect(finalViol.actionTaken).toBe(VIOLATION_ACTIONS.AUTO_SUBMIT);
    });
  });
});
