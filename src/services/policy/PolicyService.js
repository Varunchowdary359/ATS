/**
 * Enterprise ATS Interview & Assessment Policy Service
 * Centralizes reusable policy models, device rules, integrity constraints,
 * candidate acceptance tracking, and violation management.
 * (Frontend-only architecture ready for future .NET backend integration)
 */

export const POLICY_TYPES = {
  INTERVIEW: 'interview',
  TECHNICAL_INTERVIEW: 'technical_interview',
  ASSESSMENT: 'assessment',
  TEST: 'test',
  EXAM: 'exam',
  PROCTORED_ASSESSMENT: 'proctored_assessment'
};

export const VIOLATION_ACTIONS = {
  WARNING: 'warning',
  ALLOW_CONTINUATION: 'allow_continuation',
  PAUSE: 'pause',
  RECHECK_READINESS: 'recheck_readiness',
  REQUIRE_ACKNOWLEDGEMENT: 'require_acknowledgement',
  END: 'end',
  AUTO_SUBMIT: 'auto_submit'
};

export const VIOLATION_TYPES = {
  CAMERA_UNAVAILABLE: 'camera_unavailable',
  CAMERA_STOPPED: 'camera_stopped',
  MICROPHONE_UNAVAILABLE: 'microphone_unavailable',
  SCREEN_SHARE_STOPPED: 'screen_share_stopped',
  FULLSCREEN_EXITED: 'fullscreen_exited',
  TAB_SWITCH: 'tab_switch',
  WINDOW_BLUR: 'window_blur',
  COPY_ATTEMPT: 'copy_attempt',
  PASTE_ATTEMPT: 'paste_attempt',
  RIGHT_CLICK_ATTEMPT: 'right_click_attempt',
  TIME_EXPIRED: 'time_expired',
  TECHNICAL_INTERRUPTION: 'technical_interruption'
};

const DEFAULT_POLICIES = [
  {
    id: 'POL-INT-HR-001',
    name: 'Standard HR & Behavioral Interview Policy',
    type: POLICY_TYPES.INTERVIEW,
    version: 'v1.0',
    enabled: true,
    required: true,
    effectiveDate: '2026-01-01',
    lastModified: '2026-03-01T10:00:00Z',
    description: 'Standard guidelines for culture-fit, HR, and behavioral interview conversations.',
    rules: {
      camera: { required: true, livePreview: true, recording: false, strict: false },
      microphone: { required: true, audioLevelCheck: true, recording: false },
      screenShare: { required: false, entireScreenOnly: false },
      fullscreen: { required: false, autoPrompt: false },
      tabSwitch: { detection: false, maxSwitches: 10, strict: false },
      clipboard: { preventCopy: false, preventPaste: false, preventContextMenu: false },
      identityVerification: { required: false, type: 'none' },
      timeLimit: { enabled: true, durationMinutes: 45, autoSubmitOnExpiry: false, warningIntervalMinutes: [10, 5] },
      recording: { enabled: false, consentRequired: false, retentionDays: 0, storageNotice: 'Sessions are not recorded.' },
      violationHandling: { maxViolations: 5, actionOnThreshold: VIOLATION_ACTIONS.WARNING, candidateWarningToast: true },
      candidateAcknowledgement: { required: true, explicitCheckbox: true, privacyConsentRequired: true },
      interviewerAcknowledgement: { required: true, confidentialityRequired: true, independentScoringRequired: true }
    }
  },
  {
    id: 'POL-INT-TECH-002',
    name: 'Technical & System Design Interview Policy',
    type: POLICY_TYPES.TECHNICAL_INTERVIEW,
    version: 'v1.2',
    enabled: true,
    required: true,
    effectiveDate: '2026-02-15',
    lastModified: '2026-03-10T14:30:00Z',
    description: 'Interactive technical live-coding and architectural whiteboard interview policy.',
    rules: {
      camera: { required: true, livePreview: true, recording: true, strict: true },
      microphone: { required: true, audioLevelCheck: true, recording: true },
      screenShare: { required: true, entireScreenOnly: true },
      fullscreen: { required: false, autoPrompt: false },
      tabSwitch: { detection: true, maxSwitches: 5, strict: false },
      clipboard: { preventCopy: false, preventPaste: false, preventContextMenu: false },
      identityVerification: { required: true, type: 'photo_id' },
      timeLimit: { enabled: true, durationMinutes: 60, autoSubmitOnExpiry: false, warningIntervalMinutes: [15, 5, 2] },
      recording: { enabled: true, consentRequired: true, retentionDays: 90, storageNotice: 'Video and audio are recorded for evaluation quality assurance.' },
      violationHandling: { maxViolations: 3, actionOnThreshold: VIOLATION_ACTIONS.RECHECK_READINESS, candidateWarningToast: true },
      candidateAcknowledgement: { required: true, explicitCheckbox: true, privacyConsentRequired: true },
      interviewerAcknowledgement: { required: true, confidentialityRequired: true, independentScoringRequired: true }
    }
  },
  {
    id: 'POL-ASM-PROCTOR-003',
    name: 'Strict Proctored Coding Assessment Policy',
    type: POLICY_TYPES.PROCTORED_ASSESSMENT,
    version: 'v2.0',
    enabled: true,
    required: true,
    effectiveDate: '2026-01-10',
    lastModified: '2026-03-14T09:15:00Z',
    description: 'Automated high-stakes proctored coding and algorithmic assessment policy with strict anti-cheat controls.',
    rules: {
      camera: { required: true, livePreview: true, recording: true, strict: true },
      microphone: { required: true, audioLevelCheck: true, recording: true },
      screenShare: { required: true, entireScreenOnly: true },
      fullscreen: { required: true, autoPrompt: true },
      tabSwitch: { detection: true, maxSwitches: 3, strict: true },
      clipboard: { preventCopy: true, preventPaste: true, preventContextMenu: true },
      identityVerification: { required: true, type: 'photo_id' },
      timeLimit: { enabled: true, durationMinutes: 90, autoSubmitOnExpiry: true, warningIntervalMinutes: [30, 15, 5, 1] },
      recording: { enabled: true, consentRequired: true, retentionDays: 180, storageNotice: 'Continuous video, audio, and screen feeds are recorded and flagged for review.' },
      violationHandling: { maxViolations: 3, actionOnThreshold: VIOLATION_ACTIONS.AUTO_SUBMIT, candidateWarningToast: true },
      candidateAcknowledgement: { required: true, explicitCheckbox: true, privacyConsentRequired: true },
      interviewerAcknowledgement: { required: true, confidentialityRequired: true, independentScoringRequired: true }
    }
  },
  {
    id: 'POL-EXAM-MCQ-004',
    name: 'General Aptitude & Domain MCQ Exam Policy',
    type: POLICY_TYPES.EXAM,
    version: 'v1.1',
    enabled: true,
    required: true,
    effectiveDate: '2026-02-01',
    lastModified: '2026-02-28T16:00:00Z',
    description: 'Timed multiple-choice domain and aptitude evaluation policy with automated submission.',
    rules: {
      camera: { required: true, livePreview: true, recording: false, strict: false },
      microphone: { required: false, audioLevelCheck: false, recording: false },
      screenShare: { required: false, entireScreenOnly: false },
      fullscreen: { required: true, autoPrompt: true },
      tabSwitch: { detection: true, maxSwitches: 3, strict: true },
      clipboard: { preventCopy: true, preventPaste: true, preventContextMenu: true },
      identityVerification: { required: false, type: 'none' },
      timeLimit: { enabled: true, durationMinutes: 45, autoSubmitOnExpiry: true, warningIntervalMinutes: [10, 5, 1] },
      recording: { enabled: false, consentRequired: false, retentionDays: 0, storageNotice: 'No video recording active.' },
      violationHandling: { maxViolations: 3, actionOnThreshold: VIOLATION_ACTIONS.AUTO_SUBMIT, candidateWarningToast: true },
      candidateAcknowledgement: { required: true, explicitCheckbox: true, privacyConsentRequired: true },
      interviewerAcknowledgement: { required: false, confidentialityRequired: false, independentScoringRequired: false }
    }
  },
  {
    id: 'POL-TEST-SCREEN-005',
    name: 'Fast-Track Initial Screening Quiz Policy',
    type: POLICY_TYPES.TEST,
    version: 'v1.0',
    enabled: true,
    required: false,
    effectiveDate: '2026-01-15',
    lastModified: '2026-01-15T12:00:00Z',
    description: 'Low-friction preliminary skills assessment with minimal hardware requirements.',
    rules: {
      camera: { required: false, livePreview: false, recording: false, strict: false },
      microphone: { required: false, audioLevelCheck: false, recording: false },
      screenShare: { required: false, entireScreenOnly: false },
      fullscreen: { required: false, autoPrompt: false },
      tabSwitch: { detection: false, maxSwitches: 0, strict: false },
      clipboard: { preventCopy: false, preventPaste: false, preventContextMenu: false },
      identityVerification: { required: false, type: 'none' },
      timeLimit: { enabled: true, durationMinutes: 20, autoSubmitOnExpiry: true, warningIntervalMinutes: [5, 1] },
      recording: { enabled: false, consentRequired: false, retentionDays: 0, storageNotice: 'Unmonitored quiz.' },
      violationHandling: { maxViolations: 10, actionOnThreshold: VIOLATION_ACTIONS.ALLOW_CONTINUATION, candidateWarningToast: false },
      candidateAcknowledgement: { required: true, explicitCheckbox: true, privacyConsentRequired: false },
      interviewerAcknowledgement: { required: false, confidentialityRequired: false, independentScoringRequired: false }
    }
  }
];

export const DEFAULT_POLICY_ASSIGNMENTS = {
  // Round-Level Default Assignments (PLAN-SWE-01)
  'round:RND-SWE-1': 'POL-EXAM-MCQ-004',      // Aptitude & Cognitive Assessment
  'round:RND-SWE-2': 'POL-ASM-PROCTOR-003',    // Coding & Algorithmic Assessment
  'round:RND-SWE-3': 'POL-INT-TECH-002',       // Technical Deep-Dive Interview
  'round:RND-SWE-4': 'POL-INT-TECH-002',       // System Design & Scalability
  'round:RND-SWE-5': 'POL-INT-HR-001',         // Managerial & Cultural Fit Interview
  'round:RND-SWE-6': 'POL-INT-HR-001',         // HR & Final Leadership Alignment

  // Round-Level Default Assignments (PLAN-PM-02)
  'round:RND-PM-1': 'POL-TEST-SCREEN-005',     // Product Strategy Case Study
  'round:RND-PM-2': 'POL-INT-HR-001',          // Functional Product Interview
  'round:RND-PM-3': 'POL-INT-HR-001',          // Executive Leadership Panel

  // Legacy/Alias Round IDs
  'round:RND-01': 'POL-INT-HR-001',
  'round:RND-02': 'POL-INT-TECH-002',
  'round:RND-03': 'POL-INT-TECH-002',
  'round:RND-04': 'POL-INT-HR-001',
  'round:RND-05': 'POL-INT-HR-001',
  'round:RND-06': 'POL-INT-HR-001',

  // Requisition-Level Default Policies
  'requisition:REQ-2026-001': 'POL-INT-TECH-002', // Senior Full Stack Engineer
  'requisition:REQ-2026-002': 'POL-INT-TECH-002', // Staff DevOps & Cloud Architect
  'requisition:REQ-2026-003': 'POL-INT-HR-001',   // Product Lead & Design Systems
  'requisition:REQ-2026-ENG-001': 'POL-INT-TECH-002',
  'requisition:REQ-2026-ENG-042': 'POL-INT-TECH-002',

  // Workflow Category & Subtype Mappings
  'category:Technical': 'POL-INT-TECH-002',
  'category:Technical Interview': 'POL-INT-TECH-002',
  'category:Coding Interview': 'POL-INT-TECH-002',
  'category:System Design': 'POL-INT-TECH-002',
  'category:Coding Assessment': 'POL-ASM-PROCTOR-003',
  'category:Online Assessment': 'POL-ASM-PROCTOR-003',
  'category:Aptitude Test': 'POL-EXAM-MCQ-004',
  'category:MCQ Assessment': 'POL-EXAM-MCQ-004',
  'category:Aptitude & Cognitive Assessment': 'POL-EXAM-MCQ-004',
  'category:Managerial': 'POL-INT-HR-001',
  'category:Managerial Interview': 'POL-INT-HR-001',
  'category:HR / Culture': 'POL-INT-HR-001',
  'category:HR & Culture': 'POL-INT-HR-001',
  'category:HR Interview': 'POL-INT-HR-001',
  'category:Behavioral Interview': 'POL-INT-HR-001',
  'category:Leadership Interview': 'POL-INT-HR-001',
  'category:HR': 'POL-INT-HR-001',
  'category:Screening': 'POL-TEST-SCREEN-005',
  'category:Recruiter Screening': 'POL-TEST-SCREEN-005',
  'category:Fast-Track Initial Screening': 'POL-TEST-SCREEN-005',
  'category:Case Study': 'POL-TEST-SCREEN-005',
  'category:Take-Home Assignment': 'POL-TEST-SCREEN-005'
};

class PolicyServiceImpl {
  constructor() {
    this._storageKey = 'pw_ats_policies';
    this._acceptanceKey = 'pw_ats_candidate_policy_acceptances';
    this._interviewerAcceptanceKey = 'pw_ats_interviewer_policy_acceptances';
    this._assignmentKey = 'pw_ats_policy_assignments';
    this._initStorage();
  }

  _initStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const stored = localStorage.getItem(this._storageKey);
      if (!stored) {
        localStorage.setItem(this._storageKey, JSON.stringify(DEFAULT_POLICIES));
      }
      if (!localStorage.getItem(this._acceptanceKey)) {
        localStorage.setItem(this._acceptanceKey, JSON.stringify([]));
      }
      if (!localStorage.getItem(this._interviewerAcceptanceKey)) {
        localStorage.setItem(this._interviewerAcceptanceKey, JSON.stringify([]));
      }
      if (!localStorage.getItem(this._assignmentKey)) {
        localStorage.setItem(this._assignmentKey, JSON.stringify(DEFAULT_POLICY_ASSIGNMENTS));
      }
    } catch {
      // Storage unavailable fallback
    }
  }

  /**
   * Get all defined policies
   */
  getPolicies() {
    if (typeof window === 'undefined' || !window.localStorage) return [...DEFAULT_POLICIES];
    try {
      const data = localStorage.getItem(this._storageKey);
      return data ? JSON.parse(data) : [...DEFAULT_POLICIES];
    } catch {
      return [...DEFAULT_POLICIES];
    }
  }

  /**
   * Get policy by ID
   */
  getPolicyById(id) {
    if (!id) return null;
    const policies = this.getPolicies();
    return policies.find(p => p.id === id) || null;
  }

  /**
   * Save or update policy
   */
  savePolicy(policyData) {
    const policies = this.getPolicies();
    const existingIndex = policies.findIndex(p => p.id === policyData.id);

    const updated = {
      ...policyData,
      lastModified: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Increment minor version on update if not explicitly supplied
      const oldVersion = policies[existingIndex].version || 'v1.0';
      if (updated.version === oldVersion) {
        const parts = oldVersion.replace('v', '').split('.');
        const minor = parseInt(parts[1] || '0', 10) + 1;
        updated.version = `v${parts[0] || '1'}.${minor}`;
      }
      policies[existingIndex] = updated;
    } else {
      updated.id = updated.id || `POL-${Date.now().toString(36).toUpperCase()}`;
      updated.version = updated.version || 'v1.0';
      policies.unshift(updated);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this._storageKey, JSON.stringify(policies));
    }
    return updated;
  }

  /**
   * Duplicate existing policy
   */
  duplicatePolicy(policyId) {
    const policy = this.getPolicyById(policyId);
    if (!policy) return null;

    const copy = {
      ...JSON.parse(JSON.stringify(policy)),
      id: `POL-COPY-${Date.now().toString(36).toUpperCase()}`,
      name: `${policy.name} (Copy)`,
      version: 'v1.0',
      lastModified: new Date().toISOString()
    };

    return this.savePolicy(copy);
  }

  /**
   * Toggle enabled state
   */
  togglePolicyStatus(policyId) {
    const policies = this.getPolicies();
    const policy = policies.find(p => p.id === policyId);
    if (!policy) return null;

    policy.enabled = !policy.enabled;
    policy.lastModified = new Date().toISOString();

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this._storageKey, JSON.stringify(policies));
    }
    return policy;
  }

  /**
   * Delete custom policy
   */
  deletePolicy(policyId) {
    let policies = this.getPolicies();
    policies = policies.filter(p => p.id !== policyId);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this._storageKey, JSON.stringify(policies));
    }
    return true;
  }

  /**
   * Assign policy to an entity (requisitionId, roundId, category)
   */
  assignPolicy(targetType, targetId, policyId) {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const stored = localStorage.getItem(this._assignmentKey);
      const assignments = stored ? JSON.parse(stored) : { ...DEFAULT_POLICY_ASSIGNMENTS };
      const key = `${targetType}:${targetId}`;
      if (policyId) {
        assignments[key] = policyId;
      } else {
        delete assignments[key];
      }
      localStorage.setItem(this._assignmentKey, JSON.stringify(assignments));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all explicit policy assignments
   */
  getAssignments() {
    if (typeof window === 'undefined' || !window.localStorage) return { ...DEFAULT_POLICY_ASSIGNMENTS };
    try {
      const stored = localStorage.getItem(this._assignmentKey);
      if (stored) {
        return { ...DEFAULT_POLICY_ASSIGNMENTS, ...JSON.parse(stored) };
      }
      return { ...DEFAULT_POLICY_ASSIGNMENTS };
    } catch {
      return { ...DEFAULT_POLICY_ASSIGNMENTS };
    }
  }

  /**
   * Resolve effective policy for an interview using strict multi-level precedence:
   * Level 1: Round Assignment -> Level 2: Requisition Assignment -> Level 3: Workflow Category/Subtype -> Level 4: No Policy Assigned (null)
   */
  resolvePolicyForInterview({
    roundId = null,
    requisitionId = null,
    roundCategory = null,
    roundSubtype = null,
    roundName = null,
    interviewType = null
  } = {}) {
    const assignments = this.getAssignments();

    // Helper: Find assignment by prefix with case-insensitive / trimmed safety
    const findAssignment = (prefix, val) => {
      if (!val) return null;
      const cleanVal = String(val).trim();
      if (assignments[`${prefix}:${cleanVal}`]) {
        return { key: `${prefix}:${cleanVal}`, policyId: assignments[`${prefix}:${cleanVal}`] };
      }
      const targetKey = `${prefix}:${cleanVal}`.toLowerCase();
      for (const [k, v] of Object.entries(assignments)) {
        if (k.toLowerCase() === targetKey) {
          return { key: k, policyId: v };
        }
      }
      return null;
    };

    // 1. Level 1: Round-Specific Assignment (Highest Precedence)
    if (roundId) {
      const match = findAssignment('round', roundId);
      if (match && match.policyId) {
        const policy = this.getPolicyById(match.policyId);
        if (policy && policy.enabled) {
          return {
            policy,
            isAssigned: true,
            source: 'round',
            sourceId: roundId,
            version: policy.version,
            reason: `Assigned via Interview Round (${roundId})`
          };
        }
      }
    }

    // 2. Level 2: Requisition-Specific Assignment
    if (requisitionId) {
      const match = findAssignment('requisition', requisitionId);
      if (match && match.policyId) {
        const policy = this.getPolicyById(match.policyId);
        if (policy && policy.enabled) {
          return {
            policy,
            isAssigned: true,
            source: 'requisition',
            sourceId: requisitionId,
            version: policy.version,
            reason: `Assigned via Job Requisition (${requisitionId})`
          };
        }
      }
    }

    // 3. Level 3: Workflow Category & Subtype Assignment
    const categoryCandidates = [roundSubtype, roundCategory, roundName].filter(Boolean);
    for (const cat of categoryCandidates) {
      const match = findAssignment('category', cat) || findAssignment('subtype', cat);
      if (match && match.policyId) {
        const policy = this.getPolicyById(match.policyId);
        if (policy && policy.enabled) {
          return {
            policy,
            isAssigned: true,
            source: 'category',
            sourceId: cat,
            version: policy.version,
            reason: `Assigned via Round Category (${cat})`
          };
        }
      }
    }

    // Keyword heuristics for standard category matching (fail-safe without guessing unknown)
    const combinedDesc = `${roundSubtype || ''} ${roundCategory || ''} ${roundName || ''}`.toLowerCase();
    if (combinedDesc.includes('coding') || combinedDesc.includes('algorithmic')) {
      const p = this.getPolicyById('POL-ASM-PROCTOR-003');
      if (p && p.enabled) {
        return {
          policy: p,
          isAssigned: true,
          source: 'category',
          sourceId: roundCategory || 'Coding Assessment',
          version: p.version,
          reason: 'Assigned via Coding Assessment Category'
        };
      }
    }
    if (combinedDesc.includes('technical') || combinedDesc.includes('system design') || combinedDesc.includes('deep-dive') || combinedDesc.includes('architecture')) {
      const p = this.getPolicyById('POL-INT-TECH-002');
      if (p && p.enabled) {
        return {
          policy: p,
          isAssigned: true,
          source: 'category',
          sourceId: roundCategory || 'Technical Interview',
          version: p.version,
          reason: 'Assigned via Technical Interview Category'
        };
      }
    }
    if (combinedDesc.includes('aptitude') || combinedDesc.includes('cognitive') || combinedDesc.includes('mcq')) {
      const p = this.getPolicyById('POL-EXAM-MCQ-004');
      if (p && p.enabled) {
        return {
          policy: p,
          isAssigned: true,
          source: 'category',
          sourceId: roundCategory || 'Aptitude Exam',
          version: p.version,
          reason: 'Assigned via Aptitude Exam Category'
        };
      }
    }
    if (combinedDesc.includes('manager') || combinedDesc.includes('culture') || combinedDesc.includes('behavioral') || combinedDesc.includes('hr fit') || combinedDesc.includes('leadership')) {
      const p = this.getPolicyById('POL-INT-HR-001');
      if (p && p.enabled) {
        return {
          policy: p,
          isAssigned: true,
          source: 'category',
          sourceId: roundCategory || 'HR & Managerial',
          version: p.version,
          reason: 'Assigned via HR & Behavioral Category'
        };
      }
    }
    if (combinedDesc.includes('screening') || combinedDesc.includes('case study')) {
      const p = this.getPolicyById('POL-TEST-SCREEN-005');
      if (p && p.enabled) {
        return {
          policy: p,
          isAssigned: true,
          source: 'category',
          sourceId: roundCategory || 'Screening Quiz',
          version: p.version,
          reason: 'Assigned via Screening Quiz Category'
        };
      }
    }

    // 4. Level 4: Return explicitly unassigned when no policy assigned at any level
    return {
      policy: null,
      isAssigned: false,
      source: 'none',
      sourceId: null,
      version: null,
      reason: 'No policy assigned'
    };
  }

  /**
   * Resolve effective policy for generic target
   */
  getEffectivePolicy(targetType, targetId, fallbackType = null) {
    const assignments = this.getAssignments();
    const key = `${targetType}:${targetId}`;
    const policyId = assignments[key];

    if (policyId) {
      const found = this.getPolicyById(policyId);
      if (found && found.enabled) return found;
    }

    if (fallbackType) {
      const policies = this.getPolicies();
      const matched = policies.find(p => p.type === fallbackType && p.enabled);
      if (matched) return matched;
    }

    return null;
  }

  /**
   * Record candidate policy acceptance evidence
   */
  recordCandidateAcceptance({
    candidateId,
    candidateName,
    candidateEmail,
    policyId,
    policyVersion,
    interviewId,
    assessmentId,
    deviceCapabilities = {}
  }) {
    const record = {
      id: `ACC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      candidateId,
      candidateName,
      candidateEmail,
      policyId,
      policyVersion,
      interviewId: interviewId || null,
      assessmentId: assessmentId || null,
      acceptedAt: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      deviceCapabilities,
      evidenceStatus: 'VERIFIED_ON_CLIENT'
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const acceptances = JSON.parse(localStorage.getItem(this._acceptanceKey) || '[]');
        acceptances.push(record);
        localStorage.setItem(this._acceptanceKey, JSON.stringify(acceptances));
      } catch {
        // Fallback
      }
    }

    return record;
  }

  /**
   * Get candidate policy acceptance records
   */
  getCandidateAcceptances(candidateId = null, interviewId = null) {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      let list = JSON.parse(localStorage.getItem(this._acceptanceKey) || '[]');
      if (candidateId) {
        list = list.filter(item => item.candidateId === candidateId);
      }
      if (interviewId) {
        list = list.filter(item => item.interviewId === interviewId);
      }
      return list;
    } catch {
      return [];
    }
  }

  /**
   * Check if candidate has accepted specific policy version for an interview
   */
  hasCandidateAccepted(sessionOrParams, interviewId = null, policyVersion = null) {
    if (sessionOrParams && typeof sessionOrParams === 'object' && ('candidatePolicyAccepted' in sessionOrParams)) {
      return !!sessionOrParams.candidatePolicyAccepted;
    }
    const candidateId = typeof sessionOrParams === 'string' ? sessionOrParams : sessionOrParams?.candidateId;
    const targetInterviewId = interviewId || sessionOrParams?.interviewId;
    const targetVersion = policyVersion || sessionOrParams?.policyVersion;
    const list = this.getCandidateAcceptances(candidateId, targetInterviewId);
    return list.some(item => (!targetVersion || item.policyVersion === targetVersion));
  }

  /**
   * Record interviewer policy acceptance evidence
   */
  recordInterviewerAcceptance(sessionOrParams, interviewerId = null, interviewerName = 'Interviewer') {
    let params = {};
    if (sessionOrParams && sessionOrParams.id && interviewerId) {
      params = {
        interviewId: sessionOrParams.id,
        interviewerId,
        interviewerName,
        policyId: sessionOrParams.policyId,
        policyVersion: sessionOrParams.policyVersion
      };
    } else {
      params = sessionOrParams || {};
    }

    const record = {
      id: `INT-ACC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      interviewerId: params.interviewerId,
      interviewerName: params.interviewerName || 'Interviewer',
      policyId: params.policyId,
      policyVersion: params.policyVersion,
      interviewId: params.interviewId || null,
      acceptedAt: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      status: 'ACCEPTED'
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const acceptances = JSON.parse(localStorage.getItem(this._interviewerAcceptanceKey) || '[]');
        acceptances.push(record);
        localStorage.setItem(this._interviewerAcceptanceKey, JSON.stringify(acceptances));
      } catch {
        // Fallback
      }
    }

    if (sessionOrParams && sessionOrParams.id && interviewerId) {
      return {
        ...sessionOrParams,
        interviewerPolicyAcceptances: {
          ...(sessionOrParams.interviewerPolicyAcceptances || {}),
          [interviewerId]: {
            accepted: true,
            acceptedAt: record.acceptedAt,
            policyVersion: params.policyVersion,
            interviewerName: params.interviewerName
          }
        }
      };
    }

    return record;
  }

  /**
   * Get interviewer policy acceptance records
   */
  getInterviewerAcceptances(interviewId = null, interviewerId = null) {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      let list = JSON.parse(localStorage.getItem(this._interviewerAcceptanceKey) || '[]');
      if (interviewId) {
        list = list.filter(item => item.interviewId === interviewId);
      }
      if (interviewerId) {
        list = list.filter(item => item.interviewerId === interviewerId);
      }
      return list;
    } catch {
      return [];
    }
  }

  /**
   * Check if specific interviewer has accepted specific policy version for an interview
   */
  hasInterviewerAccepted(sessionOrParams, interviewerId = null, policyVersion = null) {
    if (sessionOrParams && typeof sessionOrParams === 'object') {
      const targetInterviewerId = interviewerId || sessionOrParams.interviewerId;
      if (targetInterviewerId && sessionOrParams.interviewerPolicyAcceptances) {
        return !!sessionOrParams.interviewerPolicyAcceptances[targetInterviewerId]?.accepted;
      }
      const targetInterviewId = sessionOrParams.id || sessionOrParams.interviewId;
      const targetVersion = policyVersion || sessionOrParams.policyVersion;
      const list = this.getInterviewerAcceptances(targetInterviewId, targetInterviewerId);
      return list.some(item => (!targetVersion || item.policyVersion === targetVersion));
    }
    const list = this.getInterviewerAcceptances(null, interviewerId);
    return list.some(item => (!policyVersion || item.policyVersion === policyVersion));
  }

  /**
   * Create standardized violation record
   */
  createViolationRecord({
    type,
    message,
    severity = 'medium',
    currentCount = 1,
    maxThreshold = 3,
    actionTaken = VIOLATION_ACTIONS.WARNING
  }) {
    return {
      id: `VIOL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      message,
      severity,
      count: currentCount,
      maxThreshold,
      actionTaken,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate if candidate meets all mandatory policy prerequisites
   */
  validateCandidateReadiness(policy, checklistState) {
    if (!policy || !checklistState) return { ready: false, blockers: ['Invalid policy or state'] };
    const blockers = [];
    const rules = policy.rules || {};

    if (rules.candidateAcknowledgement?.required && !checklistState.acknowledgedPolicy) {
      blockers.push('Candidate policy rules must be explicitly acknowledged.');
    }

    if (rules.candidateAcknowledgement?.privacyConsentRequired && rules.recording?.enabled && !checklistState.acknowledgedPrivacy) {
      blockers.push('Monitoring and recording privacy consent is required.');
    }

    if (rules.camera?.required && checklistState.cameraStatus !== 'ready') {
      blockers.push('A functional camera check is required before starting.');
    }

    if (rules.microphone?.required && checklistState.microphoneStatus !== 'ready') {
      blockers.push('A functional microphone check is required before starting.');
    }

    if (rules.screenShare?.required && checklistState.screenShareStatus !== 'ready') {
      blockers.push('Active screen sharing is required before starting.');
    }

    if (rules.fullscreen?.required && !checklistState.fullscreenActive) {
      blockers.push('Full-screen mode must be activated before starting.');
    }

    if (rules.identityVerification?.required && checklistState.identityStatus !== 'completed') {
      blockers.push('Identity verification must be completed.');
    }

    return {
      ready: blockers.length === 0,
      blockers
    };
  }
}

export const PolicyService = new PolicyServiceImpl();
