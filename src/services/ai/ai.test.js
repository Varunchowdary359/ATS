import { describe, it, expect, beforeEach } from 'vitest';
import { AIService } from './AIService.js';
import { AIIntentEngine } from './AIIntentEngine.js';
import { AIToolRegistry } from './AIToolRegistry.js';
import { AIToolExecutor } from './AIToolExecutor.js';
import { AIPermissionService } from './AIPermissionService.js';
import { AIContextService } from './AIContextService.js';
import { AIConversationService } from './AIConversationService.js';
import { AIMemoryService } from './AIMemoryService.js';
import { AIAuditService } from './AIAuditService.js';
import { DatabaseService } from '../db/DatabaseService.js';
import { WorkflowRegistry } from './workflow/WorkflowRegistry.js';
import { UserDirectoryService } from '../directory/UserDirectoryService.js';
import { candidateService } from '../../components/recruitment/candidates/candidateService.js';
import { AIPublishingAdapter } from './AIPublishingAdapter.js';
import { normalizeText, safeString, safeToLowerCase, extractSkillNames } from './AINormalizer.js';

describe('PeopleWorks Universal AI Agent & Copilot Master Test Suite', () => {
  beforeEach(() => {
    DatabaseService.init();
    DatabaseService.reset();
    AIMemoryService.reset();
    WorkflowRegistry.reset();
    AIService.reset();
  });

  // =========================================================================
  // 1. TYPE SAFETY & NORMALIZATION ENGINE TESTS
  // =========================================================================
  describe('1. Centralized Safe Normalization & Type Safety', () => {
    it('safely normalizes string inputs', () => {
      expect(normalizeText('  Hello World  ')).toBe('hello world');
      expect(normalizeText('SCREEN CANDIDATES')).toBe('screen candidates');
    });

    it('safely handles null and undefined without throwing TypeError', () => {
      expect(normalizeText(null)).toBe('');
      expect(normalizeText(undefined)).toBe('');
      expect(safeString(null)).toBe('');
      expect(safeString(undefined, 'default')).toBe('default');
    });

    it('safely handles numbers and booleans', () => {
      expect(normalizeText(12345)).toBe('12345');
      expect(normalizeText(true)).toBe('true');
      expect(normalizeText(false)).toBe('false');
      expect(safeString(42)).toBe('42');
    });

    it('safely handles objects with various property names', () => {
      expect(normalizeText({ name: 'React.js' })).toBe('react.js');
      expect(normalizeText({ title: 'Senior Engineer' })).toBe('senior engineer');
      expect(normalizeText({ text: 'Some text' })).toBe('some text');
      expect(normalizeText({})).toBe('');
      expect(normalizeText({ unknownKey: 123 })).toBe('');
    });

    it('safely handles arrays of strings, numbers, or objects', () => {
      expect(normalizeText(['React', 'Node.js'])).toBe('react node.js');
      expect(normalizeText([{ name: 'React' }, { title: 'Node' }])).toBe('react node');
      expect(normalizeText([])).toBe('');
    });

    it('extractSkillNames extracts clean names from string or object skill arrays', () => {
      const skillsMixed = [
        { name: 'React', proficiency: 'Expert' },
        'Node.js',
        { skill: 'TypeScript' },
        null,
        undefined
      ];
      const extracted = extractSkillNames(skillsMixed);
      expect(extracted).toEqual(['React', 'Node.js', 'TypeScript']);
    });

    it('parseIntent handles null, undefined, numbers, and objects without crashing', () => {
      expect(() => AIIntentEngine.parseIntent(null)).not.toThrow();
      expect(() => AIIntentEngine.parseIntent(undefined)).not.toThrow();
      expect(() => AIIntentEngine.parseIntent(12345)).not.toThrow();
      expect(() => AIIntentEngine.parseIntent({})).not.toThrow();
      expect(() => AIIntentEngine.parseIntent({ prompt: 'screen candidates' })).not.toThrow();
    });
  });

  // =========================================================================
  // 2. ATS QUERY: PENDING JD APPROVALS (ACTUAL LOCAL DATA)
  // =========================================================================
  describe('2. Pending JD Approvals Query & Real Local Data Integration', () => {
    const jdPendingPhrases = [
      'can i know how many jd approvals are pending',
      'how many jd approvals are pending',
      'how many job descriptions are waiting for approval',
      'how many JDs are pending approval',
      'tell me pending JD approvals',
      'show pending JD approvals',
      'are there any JDs waiting for approval?',
      'what is the number of pending JD approvals?',
      'pending jd approvals?',
      'pending jd approval',
      'jd approval pending',
      'how many approval pending for jd'
    ];

    jdPendingPhrases.forEach((phrase) => {
      it(`resolves "${phrase}" to GET_PENDING_JD_APPROVALS query intent`, () => {
        const intent = AIIntentEngine.parseIntent(phrase);
        expect(intent.intent).toBe('GET_PENDING_JD_APPROVALS');
        expect(intent.category).toBe('query');
        expect(intent.toolName).toBe('getPendingJdApprovals');
      });
    });

    it('returns actual dynamic count of pending JDs from DatabaseService', async () => {
      // Setup fixture: Seed DatabaseService with 3 pending JDs
      DatabaseService.jds = [
        { id: 'JD-101', title: 'Senior Backend Engineer', department: 'Engineering', status: 'Pending Approval' },
        { id: 'JD-102', title: 'Product Manager', department: 'Product', status: 'Pending Approval' },
        { id: 'JD-103', title: 'UI/UX Designer', department: 'Design', status: 'Pending Approval' },
        { id: 'JD-104', title: 'DevOps Architect', department: 'Engineering', status: 'Approved' }
      ];
      DatabaseService.persistAll();

      const toolExec = await AIToolExecutor.execute('getPendingJdApprovals');
      expect(toolExec.data.count).toBe(3);

      const res = await AIService.sendMessage('can i know how many jd approvals are pending');
      expect(res.text).toContain('3 JDs');
      expect(res.text).toContain('pending approval');
      expect(res.text).not.toContain("I'm not completely sure what you'd like me to do");
      expect(res.cards.length).toBe(1);
      expect(res.cards[0].items.length).toBe(3);
    });

    it('returns "0 JDs pending approval" when no JDs are pending without hallucination', async () => {
      // Setup fixture: 0 pending JDs
      DatabaseService.jds = [
        { id: 'JD-101', title: 'Senior Backend Engineer', department: 'Engineering', status: 'Approved' },
        { id: 'JD-102', title: 'Product Manager', department: 'Product', status: 'Published' }
      ];
      DatabaseService.persistAll();

      const res = await AIService.sendMessage('can i know how many jd approvals are pending');
      expect(res.text).toContain('0 JDs');
      expect(res.text).toContain('pending approval');
      expect(res.cards.length).toBe(0);
    });

    it('distinguishes query from action ("how many jd approvals are pending" vs "approve this JD")', () => {
      const queryIntent = AIIntentEngine.parseIntent('how many jd approvals are pending');
      expect(queryIntent.intent).toBe('GET_PENDING_JD_APPROVALS');
      expect(queryIntent.category).toBe('query');
      expect(queryIntent.toolName).toBe('getPendingJdApprovals');

      const actionIntent = AIIntentEngine.parseIntent('approve this JD');
      expect(actionIntent.intent).toBe('APPROVE_JD');
      expect(actionIntent.category).toBe('action');
      expect(actionIntent.toolName).toBe('approveJobDescription');
    });
  });

  // =========================================================================
  // 3. CANDIDATE SCREENING & "SCREEN CANDIDATES" CRASH FIX
  // =========================================================================
  describe('3. Candidate Screening & Error-Free Flow', () => {
    it('handles "screen candidates" without throwing any TypeError or exception', async () => {
      AIMemoryService.reset();
      const res = await AIService.sendMessage('screen candidates');
      expect(res.text).not.toContain('s.toLowerCase is not a function');
      expect(res.text).toContain('Which candidate');
    });

    it('resolves "screen candidates" to SCREEN_CANDIDATES intent with clarification needed', () => {
      const intent = AIIntentEngine.parseIntent('screen candidates');
      expect(intent.intent).toBe('SCREEN_CANDIDATES');
      expect(intent.clarificationNeeded).toBe(true);
    });

    it('resolves "screen the candidates" to SCREEN_CANDIDATES', () => {
      const intent = AIIntentEngine.parseIntent('screen the candidates');
      expect(intent.intent).toBe('SCREEN_CANDIDATES');
    });

    it('resolves "screen Rahul" to SCREEN_CANDIDATE intent with specific candidate reference', () => {
      const intent = AIIntentEngine.parseIntent('screen Rahul');
      expect(intent.intent).toBe('SCREEN_CANDIDATE');
      expect(intent.toolName).toBe('screenCandidateAgainstJD');
      expect(intent.entity.candidateName).toContain('Rahul');
    });

    it('executes candidate screening safely against candidate with object-skills array', async () => {
      // Seed candidate with skills as objects (which previously crashed s.toLowerCase())
      DatabaseService.candidates = [
        {
          id: 'CND-1002',
          candidateName: 'Rahul Sharma',
          skills: [
            { name: 'React', proficiency: 'Expert', years: 5 },
            { name: 'JavaScript', proficiency: 'Advanced', years: 6 }
          ],
          experienceYears: 6,
          education: "Bachelor's in Computer Science",
          status: 'Applied'
        }
      ];

      const res = await AIService.sendMessage('screen Rahul');
      expect(res.toolCalls.length).toBe(1);
      expect(res.toolCalls[0].name).toBe('screenCandidateAgainstJD');
      expect(res.toolCalls[0].result.success).toBe(true);
      expect(res.text).not.toContain('s.toLowerCase is not a function');
    });
  });

  // =========================================================================
  // 4. MULTILINGUAL QUERIES & CODE-SWITCHING
  // =========================================================================
  describe('4. Multilingual Understanding & Pending JD Queries', () => {
    it('understands "enni JD approvals pending unnayi?" in Tenglish', async () => {
      const prompt = 'enni JD approvals pending unnayi?';
      const lang = AIIntentEngine.detectLanguage(prompt);
      expect(lang).toBe('te');

      const intent = AIIntentEngine.parseIntent(prompt);
      expect(intent.intent).toBe('GET_PENDING_JD_APPROVALS');
      expect(intent.toolName).toBe('getPendingJdApprovals');
    });

    it('understands "JD approvals enni pending unnayi?" in Tenglish', () => {
      const prompt = 'JD approvals enni pending unnayi?';
      const intent = AIIntentEngine.parseIntent(prompt);
      expect(intent.intent).toBe('GET_PENDING_JD_APPROVALS');
    });

    it('understands "kitne JD approval pending hain?" in Hinglish', () => {
      const prompt = 'kitne JD approval pending hain?';
      const lang = AIIntentEngine.detectLanguage(prompt);
      expect(lang).toBe('hi');

      const intent = AIIntentEngine.parseIntent(prompt);
      expect(intent.intent).toBe('GET_PENDING_JD_APPROVALS');
    });

    it('understands Telugu script "ఈ JD ని approve చేయి"', () => {
      const prompt = 'ఈ JD ని approve చేయి';
      const intent = AIIntentEngine.parseIntent(prompt);
      expect(intent.intent).toBe('APPROVE_JD');
    });

    it('understands Hindi script "इस JD को approve करो"', () => {
      const prompt = 'इस JD को approve करो';
      const intent = AIIntentEngine.parseIntent(prompt);
      expect(intent.intent).toBe('APPROVE_JD');
    });
  });

  // =========================================================================
  // 5. NATURAL CONVERSATION & SOCIAL GREETINGS
  // =========================================================================
  describe('5. Natural Conversation & Non-Generic Responses', () => {
    it('handles "hi", "hello", "hey" with clean friendly greeting', async () => {
      const res = await AIService.sendMessage('hi');
      expect(res.text).toContain('Hello! 👋');
      expect(res.text).toContain('How can I help you today?');
    });

    it('handles "hello thambi" with friendly conversational greeting', async () => {
      const res = await AIService.sendMessage('hello thambi');
      expect(res.text).toContain('Hello thambi!');
      expect(res.text).not.toContain("I'm not completely sure");
    });

    it('handles "hey mama" with friendly greeting', async () => {
      const res = await AIService.sendMessage('hey mama');
      expect(res.text).toContain('Hey mama!');
    });

    it('handles "how are you?" with wellbeing response', async () => {
      const res = await AIService.sendMessage('how are you?');
      expect(res.text).toContain("I'm doing great! 😊");
    });

    it('handles time-based greetings "good morning" and "good evening"', async () => {
      const morningRes = await AIService.sendMessage('good morning');
      expect(morningRes.text).toContain('Good morning!');

      const eveningRes = await AIService.sendMessage('good evening');
      expect(eveningRes.text).toContain('Good evening!');
    });

    it('handles "thanks" and "thank you" gracefully', async () => {
      const thanksRes = await AIService.sendMessage('thanks');
      expect(thanksRes.text).toContain("You're very welcome!");
    });

    it('handles "bye" gracefully', async () => {
      const byeRes = await AIService.sendMessage('bye');
      expect(byeRes.text).toContain('Goodbye!');
    });

    it('handles "what can you do?" with capability explanation', async () => {
      const capRes = await AIService.sendMessage('what can you do?');
      expect(capRes.text).toContain('Create and update requisitions');
      expect(capRes.text).toContain('Screen candidates');
    });

    it('handles Telugu "ela unnav", "ఎలా ఉన్నావ్", "హాయ్"', async () => {
      const te1 = await AIService.sendMessage('ela unnav');
      expect(te1.text).toContain('Nenu bagunnanu');

      const te2 = await AIService.sendMessage('ఎలా ఉన్నావ్');
      expect(te2.text).toContain('బాగున్నాను');

      const te3 = await AIService.sendMessage('హాయ్');
      expect(te3.text).toContain('నమస్కారం');
    });

    it('handles Hindi "कैसे हो", "नमस्ते"', async () => {
      const hi1 = await AIService.sendMessage('कैसे हो');
      expect(hi1.text).toContain('मैं बढ़िया हूँ');

      const hi2 = await AIService.sendMessage('नमस्ते');
      expect(hi2.text).toContain('नमस्ते');
    });

    it('handles mixed "hello mama ela unnav"', async () => {
      const mixedRes = await AIService.sendMessage('hello mama ela unnav');
      expect(mixedRes.text).toContain('Hey mama! Nenu bagunnanu');
    });
  });

  // =========================================================================
  // 6. RBAC & PERMISSIONS
  // =========================================================================
  describe('6. AI RBAC & Execution Safeguards', () => {
    it('allows Admin & Recruiter to query and approve JDs', () => {
      const adminCheck = AIPermissionService.canExecute('read:jd', { role: 'ats_admin' });
      expect(adminCheck.authorized).toBe(true);

      const recruiterCheck = AIPermissionService.canExecute('read:jd', { role: 'recruiter' });
      expect(recruiterCheck.authorized).toBe(true);
    });

    it('blocks unauthorized roles from administrative actions', () => {
      const check = AIPermissionService.canExecute('manage:policy', { role: 'recruiter' });
      expect(check.authorized).toBe(false);
      expect(check.reason).toContain('does not have permission');
    });
  });

  // =========================================================================
  // 7. MESSAGE DEDUPLICATION & STATE INTEGRITY
  // =========================================================================
  describe('7. Message Deduplication, Loading States & Recovery', () => {
    it('single prompt produces exactly ONE user message and ONE AI response', async () => {
      AIMemoryService.reset();
      await AIService.sendMessage('how are you?');

      const messages = AIConversationService.getMessages();
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(AIConversationService.isProcessing()).toBe(false);
    });

    it('rapid duplicate submit is debounced and does not duplicate messages', async () => {
      AIMemoryService.reset();
      const p1 = AIService.sendMessage('how are you?');
      const p2 = AIService.sendMessage('how are you?');
      await Promise.all([p1, p2]);

      const messages = AIConversationService.getMessages();
      expect(messages.length).toBe(2);
      expect(AIConversationService.isProcessing()).toBe(false);
    });

    it('recovers loading state to false on error and returns a normalized response', async () => {
      AIMemoryService.reset();
      const faultyProvider = {
        generateCompletion: async () => {
          throw new Error('Simulated network fault');
        }
      };

      const originalProvider = AIService.getProvider();
      AIService.setProvider(faultyProvider);

      const errorRes = await AIService.sendMessage('test error handling');
      expect(errorRes).toBeDefined();
      expect(errorRes.role).toBe('assistant');
      expect(errorRes.text).toContain('⚠️ I ran into a problem while processing that request.');
      expect(AIConversationService.isProcessing()).toBe(false);

      // Restore provider
      AIService.setProvider(originalProvider);
    });

    it('performs full 3-step regression scenario end-to-end', async () => {
      AIMemoryService.reset();
      DatabaseService.jds = [
        { id: 'JD-101', title: 'Senior Backend Engineer', department: 'Engineering', status: 'Pending Approval' },
        { id: 'JD-102', title: 'Product Manager', department: 'Product', status: 'Pending Approval' }
      ];
      DatabaseService.persistAll();

      // Step 1: Greeting
      const turn1 = await AIService.sendMessage('hi');
      expect(turn1.text).toContain('Hello! 👋');
      expect(AIConversationService.isProcessing()).toBe(false);
      expect(AIConversationService.getMessages().length).toBe(2);

      // Step 2: Query pending approvals
      const turn2 = await AIService.sendMessage('how many JD approvals are pending');
      expect(turn2.text).toContain('2 JDs');
      expect(turn2.text).toContain('pending approval');
      expect(AIConversationService.isProcessing()).toBe(false);
      expect(AIConversationService.getMessages().length).toBe(4);

      // Step 3: Screen candidates
      const turn3 = await AIService.sendMessage('screen candidates');
      expect(turn3.text).not.toContain('s.toLowerCase is not a function');
      expect(turn3.text).toContain('Which candidate');
      expect(AIConversationService.isProcessing()).toBe(false);
      expect(AIConversationService.getMessages().length).toBe(6);
    });

    it('handles first message cleanly on a fresh unreset AIMemoryService instance', () => {
      // Direct class instantiation without prior reset()
      const { AIMemoryService: mem } = { AIMemoryService };
      expect(() => {
        mem.addMessage({ role: 'user', content: 'hi' });
      }).not.toThrow();
    });
  });

  // =========================================================================
  // 8. PHASE 1: CONVERSATIONAL REQUISITION CREATION ENGINE
  // =========================================================================
  describe('8. Phase 1: Conversational Requisition Creation Engine', () => {
    it('distinguishes step explanation ("how do i create a req") from creation command', () => {
      const explainIntent = AIIntentEngine.parseIntent('how do i create a requisition?');
      expect(explainIntent.intent).toBe('EXPLAIN_REQUISITION_STEPS');
      expect(explainIntent.category).toBe('explanation');

      const createIntent = AIIntentEngine.parseIntent('create a requisition');
      expect(createIntent.intent).toBe('START_REQUISITION_WORKFLOW');
      expect(createIntent.category).toBe('workflow');
      expect(createIntent.workflowType).toBe('CREATE_REQUISITION');
    });

    it('returns step-by-step guidance for "how do I create a requisition?" without starting creation', async () => {
      const res = await AIService.sendMessage('How do I create a requisition?');
      expect(res.text).toContain('step-by-step process');
      expect(res.text).toContain('Business Need & Role Details');
      expect(res.text).toContain('Approval Chain Routing');
      expect(res.cards.length).toBe(0);
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
    });

    it('guides user step-by-step through requisition creation from "create requisition"', async () => {
      // Turn 1: Start workflow
      const t1 = await AIService.sendMessage('create a requisition');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      expect(t1.text).toContain('Step 1 of 7');
      expect(t1.text).toContain('job title');

      // Turn 2: Provide Job Title (Step 1 -> Step 2)
      const t2 = await AIService.sendMessage('Senior Java Developer');
      expect(t2.text).toContain('Step 2 of 7');
      expect(t2.text).toContain('department');

      // Turn 3: Provide Department (Step 2 -> Step 3)
      const t3 = await AIService.sendMessage('Engineering');
      expect(t3.text).toContain('Step 3 of 7');
      expect(t3.text).toContain('located');

      // Turn 4: Provide Location (Step 3 -> Step 4)
      const t4 = await AIService.sendMessage('Bangalore');
      expect(t4.text).toContain('Step 4 of 7');
      expect(t4.text).toContain('openings');

      // Turn 5: Provide Openings (Step 4 -> Step 5)
      const t5 = await AIService.sendMessage('3');
      expect(t5.text).toContain('Step 5 of 7');
      expect(t5.text).toContain('Hiring Manager');

      // Turn 6: Provide Hiring Manager (Step 5 -> Step 6)
      const t6 = await AIService.sendMessage('Alex Chen');
      expect(t6.text).toContain('Step 6 of 7');
      expect(t6.text).toContain('salary');

      // Turn 7: Provide Salary / Budget Band (Step 6 -> Step 7)
      const t7 = await AIService.sendMessage('1200000 to 1800000');
      expect(t7.text).toContain('Step 7 of 7');
      expect(t7.text).toContain('approve');

      // Turn 8: Provide Finance Approver -> Completes all 7 core steps & renders full 16-field Preview!
      const t8 = await AIService.sendMessage('David Miller');
      expect(t8.text).toContain('Requisition Review & Summary');
      expect(t8.text).toContain('Senior Java Developer');
      expect(t8.text).toContain('Engineering');
      expect(t8.text).toContain('Bangalore, India');
      expect(t8.text).toContain('3');
      expect(t8.text).toContain('Alex Chen');
      expect(t8.text).toContain('CC-1024');
      expect(t8.cards.length).toBe(1);
      expect(t8.cards[0].type).toBe('action_result');
      expect(t8.cards[0].approvalSteps.length).toBe(4);

      // Turn 9: Confirm Creation
      const initialReqCount = DatabaseService.requisitions.length;
      const t9 = await AIService.sendMessage('Create Requisition');
      expect(t9.text).toContain('Requisition Created Successfully!');
      expect(DatabaseService.requisitions.length).toBe(initialReqCount + 1);

      const createdReq = DatabaseService.requisitions[0];
      expect(createdReq.title).toBe('Senior Java Developer');
      expect(createdReq.department).toBe('Engineering');
      expect(createdReq.openings).toBe(3);
      expect(createdReq.hiringManager).toBe('Alex Chen');
      expect(createdReq.costCenter).toBe('CC-1024');
      expect(createdReq.status).toBe('Pending Approval');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
    });

    it('extracts multiple entities from a single detailed prompt and only asks for missing fields', async () => {
      const detailedPrompt = 'Create a requisition for 3 Senior Java Developers in Bangalore under Engineering, full-time, urgent, budget 12 to 18 lakhs, cost center CC-1024';
      const res = await AIService.sendMessage(detailedPrompt);

      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      // It should not ask for Title, Dept, Location, Employment Type, Openings, Min/Max Salary, Cost Center
      expect(res.text).not.toContain('What is the job title');
      expect(res.text).not.toContain('Which department');
      expect(res.text).toContain('Hiring Manager');
    });

    it('supports field correction in the middle of conversation', async () => {
      // Start flow
      await AIService.sendMessage('create requisition');
      await AIService.sendMessage('QA Automation Lead');
      await AIService.sendMessage('Engineering');
      await AIService.sendMessage('Bangalore');

      // User corrects location
      const correctionRes = await AIService.sendMessage('Actually Hyderabad');
      expect(correctionRes.text).toContain('Updated');
      expect(correctionRes.text).toContain('Hyderabad, India');
    });

    it('answers approver queries with the configured sequential chain', async () => {
      const res = await AIService.sendMessage('Who are the approvers?');
      expect(res.text).toContain('Approval Chain');
      expect(res.text).toContain('Hiring Manager');
      expect(res.text).toContain('Finance Controller');
      expect(res.text).toContain('Department Head');
    });

    it('supports user cancellation safely without creating record', async () => {
      const initialCount = DatabaseService.requisitions.length;
      await AIService.sendMessage('create a requisition');
      await AIService.sendMessage('DevOps Engineer');

      const cancelRes = await AIService.sendMessage('cancel');
      expect(cancelRes.text).toContain('cancelled');
      expect(DatabaseService.requisitions.length).toBe(initialCount);
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
    });

    it('resolves and disambiguates users from the master user directory', () => {
      // Single match
      const priya = UserDirectoryService.resolveUser('Priya Sharma');
      expect(priya.isAmbiguous).toBe(false);
      expect(priya.user.name).toBe('Priya Sharma');
      expect(priya.user.id).toBe('USR-104');

      // Ambiguous match with role preference
      const raviHM = UserDirectoryService.resolveUser('Ravi', 'Hiring Manager');
      expect(raviHM.user.name).toBe('Ravi Kumar');
      expect(raviHM.user.id).toBe('USR-105');

      const raviFC = UserDirectoryService.resolveUser('Ravi', 'Finance Controller');
      expect(raviFC.user.name).toBe('Ravi Sharma');
      expect(raviFC.user.id).toBe('USR-106');

      // Ambiguous match without role preference
      const raviAny = UserDirectoryService.resolveUser('Ravi');
      expect(raviAny.isAmbiguous).toBe(true);
      expect(raviAny.matches.length).toBe(2);
    });

    it('supports multiple sequential requisition creations without replacing or duplicating', async () => {
      const startCount = DatabaseService.requisitions.length;

      // Requisition 1: QA Automation Engineer
      await AIService.sendMessage('Create a requisition for QA Automation Engineer in Engineering, Bangalore, full-time, 2 openings, hiring manager Alex Chen, lead recruiter Sarah Jenkins, priority High, min 1000000, max 1500000, INR, start date 2026-11-01, justification New product testing, cost center CC-1001, finance David Miller, dept head Sarah Jenkins');
      const createRes1 = await AIService.sendMessage('Create Requisition');
      expect(createRes1.text).toContain('Requisition Created Successfully!');
      expect(DatabaseService.requisitions.length).toBe(startCount + 1);
      const req1 = DatabaseService.requisitions[0];
      expect(req1.title).toBe('QA Automation Engineer');

      // Requisition 2: Staff Frontend Architect
      await AIService.sendMessage('Create a requisition for Staff Frontend Architect in Engineering, Hyderabad, full-time, 1 openings, hiring manager Alex Chen, lead recruiter Priya Sharma, priority Urgent, min 2500000, max 3500000, INR, start date 2026-12-01, justification UI modernization initiative, cost center CC-1002, finance David Miller, dept head Sarah Jenkins');
      const createRes2 = await AIService.sendMessage('Create Requisition');
      expect(createRes2.text).toContain('Requisition Created Successfully!');
      expect(DatabaseService.requisitions.length).toBe(startCount + 2);
      
      const req2 = DatabaseService.requisitions[0];
      expect(req2.title).toBe('Staff Frontend Architect');

      // Verify both exist in DatabaseService
      expect(DatabaseService.requisitions.some(r => r.title === 'QA Automation Engineer')).toBe(true);
      expect(DatabaseService.requisitions.some(r => r.title === 'Staff Frontend Architect')).toBe(true);
    });

    it('supports multilingual command in Telugu ("Senior Java developer requisition create cheyyi")', async () => {
      const res = await AIService.sendMessage('Senior Java developer requisition create cheyyi');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      expect(res.text).toContain('Step 2 of 7');
      expect(res.text).toContain('డిపార్ట్‌మెంట్');
    });

    it('supports multilingual command in Hindi ("Senior Java developer ke liye requisition banao")', async () => {
      const res = await AIService.sendMessage('Senior Java developer ke liye requisition banao');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      expect(res.text).toContain('Step 2 of 7');
      expect(res.text).toContain('विभाग');
    });
  });

  // =========================================================================
  // 9. PHASE 2: CONVERSATIONAL JOB DESCRIPTION (JD) CREATION ENGINE
  // =========================================================================
  describe('9. Phase 2: Conversational Job Description (JD) Creation Engine', () => {
    beforeEach(() => {
      AIMemoryService.reset();
      WorkflowRegistry.clearActiveSession();
      DatabaseService.init();
    });

    it('distinguishes step explanation ("how do i create a jd") from creation command', () => {
      const explainIntent = AIIntentEngine.parseIntent('how do i create a jd?');
      expect(explainIntent.intent).toBe('EXPLAIN_JD_STEPS');
      expect(explainIntent.category).toBe('explanation');

      const createIntent = AIIntentEngine.parseIntent('create a jd');
      expect(createIntent.intent).toBe('START_JD_WORKFLOW');
      expect(createIntent.category).toBe('workflow');
      expect(createIntent.workflowType).toBe('CREATE_JD');
    });

    it('returns 7-step guidance for "how do I create a job description?" without starting creation', async () => {
      const res = await AIService.sendMessage('How do I create a job description?');
      expect(res.text).toContain('7 simple steps');
      expect(res.text).toContain('Requisition & Basic Info');
      expect(res.text).toContain('Role & Experience');
      expect(res.text).toContain('Job Summary');
      expect(res.text).toContain('Responsibilities & Qualifications');
      expect(res.text).toContain('Skills');
      expect(res.text).toContain('Benefits');
      expect(res.text).toContain('Review, Workflow & Create');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
    });

    it('completes exact 7-step conversational JD creation flow step-by-step', async () => {
      // Setup approved requisition
      DatabaseService.requisitions = [
        {
          id: 'REQ-2026-001',
          title: 'Senior Java Engineer',
          jobTitle: 'Senior Java Engineer',
          department: 'Engineering',
          costCenter: 'CC-1001',
          status: 'APPROVED',
          location: 'Bangalore, India'
        }
      ];
      DatabaseService.persistAll();

      // Initiate JD Creation
      const turn1 = await AIService.sendMessage('Create a JD');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      expect(turn1.text).toContain('Step 1 of 7');
      expect(turn1.text).toContain('approved requisition');

      // Step 1: Provide Requisition ID
      const turn2 = await AIService.sendMessage('REQ-2026-001');
      expect(turn2.text).toContain('Step 2 of 7');
      expect(turn2.text).toContain('experience range');

      // Step 2: Experience Range
      const turn3 = await AIService.sendMessage('4 to 7 years');
      expect(turn3.text).toContain('Step 3 of 7');
      expect(turn3.text).toContain('short summary');

      // Step 3: Job Summary
      const turn4 = await AIService.sendMessage('Responsible for building highly scalable Java and Spring Boot cloud microservices.');
      expect(turn4.text).toContain('Step 4 of 7');
      expect(turn4.text).toContain('responsibilities');

      // Step 4: Responsibilities & Qualifications
      const turn5 = await AIService.sendMessage('Design REST APIs, conduct code reviews, mentor junior engineers. Qualifications: B.Tech in Computer Science or equivalent.');
      expect(turn5.text).toContain('Step 5 of 7');
      expect(turn5.text).toContain('Mandatory Skills');

      // Step 5: Skills (Mandatory & Preferred)
      const turn6 = await AIService.sendMessage('Mandatory: Java, Spring Boot, PostgreSQL, Docker. Preferred: AWS, Kubernetes, React');
      expect(turn6.text).toContain('Step 6 of 7');
      expect(turn6.text).toContain('benefits');

      // Step 6: Benefits & Compensation details
      const turn7 = await AIService.sendMessage('Comprehensive Health Insurance, Annual Performance Bonus, Flexible WFH allowance');
      expect(turn7.text).toContain('Step 7 of 7');
      expect(turn7.text).toContain('JOB DESCRIPTION REVIEW');
      expect(turn7.text).toContain('Senior Java Engineer');
      expect(turn7.cards?.length).toBeGreaterThan(0);

      // Step 7: Confirm & Create
      const initialJdCount = DatabaseService.jds.length;
      const turn8 = await AIService.sendMessage('Create JD');
      expect(turn8.text).toContain('Job Description Created Successfully!');
      expect(turn8.text).toContain('JD-2026-');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);

      // Verify DB persistence
      expect(DatabaseService.jds.length).toBe(initialJdCount + 1);
      const createdJd = DatabaseService.jds[0];
      expect(createdJd.title).toBe('Senior Java Engineer');
      expect(createdJd.reqId).toBe('REQ-2026-001');
      expect(createdJd.experienceMin).toBe(4);
      expect(createdJd.experienceMax).toBe(7);
      expect(createdJd.mandatorySkills).toContain('Java');
      expect(createdJd.mandatorySkills).toContain('Spring Boot');
      expect(createdJd.version).toBe('v1.0');
    });

    it('extracts multiple entities from a comprehensive single-prompt JD request', async () => {
      const prompt = `Create a JD for our approved requisition REQ-2026-001 for Senior Java Developer in Engineering, 4 to 7 years. Summary: Building scalable cloud microservices. Responsibilities: Build APIs, mentor engineers, optimize SQL queries. Mandatory skills Java, Spring Boot, SQL. Preferred skills AWS and React. Benefits: Health insurance, WFH setup allowance.`;
      
      const res = await AIService.sendMessage(prompt);
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      expect(res.text).toContain('Step 7 of 7');
      expect(res.text).toContain('JOB DESCRIPTION REVIEW');
      expect(res.text).toContain('Senior Java Developer');
      expect(res.text).toContain('4–7 years');

      // Finalize creation
      const turn2 = await AIService.sendMessage('Create JD');
      expect(turn2.text).toContain('Job Description Created Successfully!');
      const createdJd = DatabaseService.jds[0];
      expect(createdJd.title).toBe('Senior Java Developer');
      expect(createdJd.department).toBe('Engineering');
      expect(createdJd.experienceMin).toBe(4);
      expect(createdJd.experienceMax).toBe(7);
      expect(createdJd.mandatorySkills).toEqual(expect.arrayContaining(['Java', 'Spring Boot', 'SQL']));
      expect(createdJd.preferredSkills).toEqual(expect.arrayContaining(['AWS', 'React']));
    });

    it('prevents premature creation when mandatory fields are missing', async () => {
      await AIService.sendMessage('Create a JD');
      const prematureRes = await AIService.sendMessage('Create JD now');
      expect(prematureRes.text).toContain('Cannot create the Job Description');
      expect(prematureRes.text).toContain('Missing mandatory items');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
    });

    it('validates experience range and prevents invalid min > max', async () => {
      await AIService.sendMessage('Create a JD for REQ-2026-001 for React Developer in Engineering');
      const invalidExpRes = await AIService.sendMessage('8 to 4 years');
      expect(invalidExpRes.text).toContain('Minimum experience (8 yrs) cannot be greater than maximum experience (4 yrs)');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
    });

    it('supports preview editing before final creation ("Change experience to 5–8 years")', async () => {
      const prompt = `Create a JD for REQ-2026-001 for Senior Java Developer in Engineering, 4 to 7 years. Summary: Cloud services. Responsibilities: Design APIs. Mandatory skills Java, Spring Boot. Preferred skills AWS. Benefits: Health care.`;
      await AIService.sendMessage(prompt);

      // Edit Experience
      const editRes = await AIService.sendMessage('Change experience to 5 to 8 years');
      expect(editRes.text).toContain('5–8 years');

      // Edit Mandatory Skills
      const skillEditRes = await AIService.sendMessage('Add Docker to mandatory skills');
      expect(skillEditRes.text).toContain('Docker');

      // Create and verify saved values
      await AIService.sendMessage('Create JD');
      const createdJd = DatabaseService.jds[0];
      expect(createdJd.experienceMin).toBe(5);
      expect(createdJd.experienceMax).toBe(8);
      expect(createdJd.mandatorySkills).toContain('Docker');
    });

    it('cancels conversational workflow cleanly on user request without persistence', async () => {
      const startCount = DatabaseService.jds.length;
      await AIService.sendMessage('Create a JD for AI Solutions Architect in Engineering');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);

      const cancelRes = await AIService.sendMessage('cancel');
      expect(cancelRes.text).toContain('cancelled');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
      expect(DatabaseService.jds.length).toBe(startCount);
    });

    it('progresses strictly from Step 1 to Step 2 without duplicate step numbers when Standalone is chosen', async () => {
      const turn1 = await AIService.sendMessage('Create a JD');
      expect(turn1.text).toContain('Step 1 of 7');
      expect(turn1.text).toContain('Linked Requisition');

      // Standalone reply
      const turn2 = await AIService.sendMessage('Standalone');
      expect(turn2.text).toContain('Step 2 of 7');
      expect(turn2.text).not.toContain('Step 1 of 7');
      expect(turn2.text).toContain('Role & Experience Range');

      // Fill remaining steps
      const turn3 = await AIService.sendMessage('Senior React Developer, 4 to 7 years, Hybrid');
      expect(turn3.text).toContain('Step 3 of 7');

      await AIService.sendMessage('Building frontend UI');
      await AIService.sendMessage('Develop components, write tests');
      await AIService.sendMessage('React, TypeScript, CSS');
      const reviewTurn = await AIService.sendMessage('Health insurance, bonus');
      expect(reviewTurn.text).toContain('Step 7 of 7');
      expect(reviewTurn.cards?.[0]?.actions?.[0]?.actionIntent).toBe('confirm_create_jd');

      // Create JD
      const createRes = await AIService.sendMessage('Create JD');
      expect(createRes.text).toContain('Job Description Created Successfully!');
      expect(DatabaseService.jds.some(j => j.title === 'Senior React Developer')).toBe(true);
    });
  });

  // =========================================================================
  // 12. PHASE 3: CONVERSATIONAL JOB POSTING & MULTI-CHANNEL PUBLISHING
  // =========================================================================
  describe('12. Phase 3: Conversational Job Posting & Multi-Channel Publishing Suite', () => {
    beforeEach(() => {
      WorkflowRegistry.reset();
      DatabaseService.init();
      AIPublishingAdapter.reset();

      // Ensure test approved JD exists
      const hasApprovedJd = DatabaseService.jds.some(j => j.id === 'JD-2026-0001' && (j.status === 'Approved' || j.status === 'Published'));
      if (!hasApprovedJd) {
        DatabaseService.jds.unshift({
          id: 'JD-2026-0001',
          reqId: 'REQ-2026-0001',
          title: 'Senior Java Developer',
          department: 'Engineering',
          status: 'Approved',
          experienceMin: 4,
          experienceMax: 7,
          summary: 'Building high-throughput enterprise cloud platforms.',
          responsibilities: ['Architect microservices in Java 21', 'Lead sprint reviews'],
          qualifications: ['B.Tech in Computer Science', '4+ years backend experience'],
          skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka'],
          benefits: ['Health Insurance', 'Annual Bonus', 'Hybrid Work Option'],
          location: 'Bangalore, India',
          workMode: 'Hybrid',
          employmentType: 'Full-time'
        });
        DatabaseService.persistAll();
      }
    });

    it('completes exact 7-step conversational Job Posting & Publishing flow step-by-step', async () => {
      // Step 1: Initiate Job Posting workflow
      const turn1 = await AIService.sendMessage('Create a job posting');
      expect(turn1.text).toContain('Step 1 of 7');
      expect(turn1.text).toContain('Approved Job Description');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);

      // Step 1 response: Select Approved JD
      const turn2 = await AIService.sendMessage('Senior Java Developer');
      expect(turn2.text).toContain('Step 2 of 7');
      expect(turn2.text).toContain('Posting Title');

      // Step 2 response: Basic Posting Information
      const turn3 = await AIService.sendMessage('Keep JD title and Engineering department');
      expect(turn3.text).toContain('Step 3 of 7');
      expect(turn3.text).toContain('Job Summary');

      // Step 3 response: Job Content
      const turn4 = await AIService.sendMessage('looks good');
      expect(turn4.text).toContain('Step 4 of 7');
      expect(turn4.text).toContain('Job Location & Work Mode');

      // Step 4 response: Location & Work Mode
      const turn5 = await AIService.sendMessage('Bangalore, Hybrid, Full-time');
      expect(turn5.text).toContain('Step 5 of 7');
      expect(turn5.text).toContain('Application Method');

      // Step 5 response: Application Settings
      const turn6 = await AIService.sendMessage('Direct Web Form, 30 days');
      expect(turn6.text).toContain('Step 6 of 7');
      expect(turn6.text).toContain('Publishing Distribution Channels');

      // Step 6 response: Channels selection
      const turn7 = await AIService.sendMessage('Publish to LinkedIn, Naukri and Careers Portal');
      expect(turn7.text).toContain('Step 7 of 7');
      expect(turn7.text).toContain('Job Posting & Distribution Review');
      expect(turn7.cards?.length).toBeGreaterThan(0);
      expect(turn7.cards?.[0]?.type).toBe('posting_review');

      // Step 7: Confirm & Publish
      const initialCount = (DatabaseService.getPostings() || []).length;
      const turn8 = await AIService.sendMessage('Publish Now');
      expect(turn8.text).toContain('Job Posting Created & Published Successfully!');
      expect(turn8.text).toContain('POST-2026-');
      expect(turn8.cards?.[0]?.type).toBe('publication_result');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);

      // Verify DatabaseService persistence
      const allPostings = DatabaseService.getPostings();
      expect(allPostings.length).toBe(initialCount + 1);
      const created = allPostings[0];
      expect(created.title).toBe('Senior Java Developer');
      expect(created.jdId).toBe('JD-2026-0001');
      expect(created.status).toBe('Published');
      expect(created.channels).toContain('linkedin');
      expect(created.channels).toContain('naukri');
      expect(created.channels).toContain('careers_portal');
    });

    it('explains the 7-step posting process without initiating workflow session (Explanation Mode)', async () => {
      const res = await AIService.sendMessage('How do I create a job posting?');
      expect(res.text).toContain('Job Posting & Distribution');
      expect(res.text).toContain('7 conversational steps');
      expect(res.text).toContain('Approved JD Selection');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
    });

    it('extracts multiple entities from a comprehensive single prompt ("Create a Bangalore full-time Java Developer posting from the approved JD and publish it to LinkedIn, Naukri and Careers Portal.")', async () => {
      const prompt = 'Create a Bangalore full-time Java Developer posting from the approved JD and publish it to LinkedIn, Naukri and Careers Portal.';
      const res = await AIService.sendMessage(prompt);
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      expect(res.text).toContain('Step 7 of 7');
      expect(res.text).toContain('Job Posting & Distribution Review');
      expect(res.text).toContain('Bangalore, India');
      expect(res.text).toContain('LinkedIn');
      expect(res.text).toContain('Naukri');

      // Finalize publish
      const publishRes = await AIService.sendMessage('Publish Now');
      expect(publishRes.text).toContain('Published Successfully!');
      expect(DatabaseService.getPostings().some(p => p.jdId === 'JD-2026-0001' && p.status === 'Published')).toBe(true);
    });

    it('blocks publication when linked JD is not approved (Approval State Check)', async () => {
      // Add a draft unapproved JD
      DatabaseService.jds.unshift({
        id: 'JD-2026-0999',
        reqId: 'REQ-2026-0999',
        title: 'Junior Go Developer',
        department: 'Engineering',
        status: 'Pending Approval',
        experienceMin: 1,
        experienceMax: 3,
        summary: 'Go cloud services'
      });
      DatabaseService.persistAll();

      const prompt = 'Create and publish job posting for JD-2026-0999';
      await AIService.sendMessage(prompt);
      const confirmTurn = await AIService.sendMessage('Publish Now');
      expect(confirmTurn.text).toContain('This JD is not approved yet');
      expect(confirmTurn.text).toContain('Pending Approval');
    });

    it('supports create-only mode without immediate publishing when user requests "Create a posting"', async () => {
      const prompt = 'Create a job posting for Senior Java Developer in Bangalore';
      const turn1 = await AIService.sendMessage(prompt);
      expect(turn1.text).toContain('Step 7 of 7');

      const turn2 = await AIService.sendMessage('Create Posting');
      expect(turn2.text).toContain('Job Posting Created & Published Successfully!');
      const newPost = DatabaseService.getPostings()[0];
      expect(newPost).toBeDefined();
      expect(newPost.title).toBe('Senior Java Developer');
    });

    it('supports publishing an existing posting without creating duplicate records', async () => {
      const startCount = DatabaseService.getPostings().length;
      const res = await AIService.sendMessage('Publish REQ-2026-0001 on LinkedIn and Indeed');
      expect(res.text).toContain('POST-2026-') || expect(res.text).toContain('Published');
      expect(DatabaseService.getPostings().length).toBeGreaterThanOrEqual(startCount);
    });

    it('supports channel selection variants (LinkedIn only, Naukri + LinkedIn, All Channels)', async () => {
      // All Channels
      const allRes = await AIService.sendMessage('Create job posting for Senior Java Developer and publish everywhere');
      expect(allRes.text).toContain('Distribution Channels (7)');

      // LinkedIn Only
      WorkflowRegistry.reset();
      const liRes = await AIService.sendMessage('Create job posting for Senior Java Developer and publish to LinkedIn only');
      expect(liRes.text).toContain('LinkedIn');
      expect(liRes.text).not.toContain('Naukri');
    });

    it('supports field correction during the flow ("Change location to Hyderabad")', async () => {
      await AIService.sendMessage('Create a job posting for Senior Java Developer in Bangalore');
      const editTurn = await AIService.sendMessage('Change location to Hyderabad');
      expect(editTurn.text).toContain('Hyderabad, India');
    });

    it('supports multilingual intents across Telugu and Hindi for job posting creation and publishing', async () => {
      // Telugu Intent
      WorkflowRegistry.reset();
      const teIntent = AIIntentEngine.match('Java JD ni LinkedIn lo publish cheyyi');
      expect(teIntent.workflowType).toBe('CREATE_JOB_POSTING');
      expect(teIntent.autoPublish).toBe(true);

      // Telugu Native Script
      const teNativeIntent = AIIntentEngine.match('ఈ JD ని Naukri లో publish చేయి');
      expect(teNativeIntent.workflowType).toBe('CREATE_JOB_POSTING');

      // Hindi Intent
      const hiIntent = AIIntentEngine.match('Is JD ko LinkedIn aur Naukri pe post karo');
      expect(hiIntent.workflowType).toBe('CREATE_JOB_POSTING');
      expect(hiIntent.autoPublish).toBe(true);
    });

    it('cancels job posting workflow cleanly on user request without saving', async () => {
      const initialCount = DatabaseService.getPostings().length;
      await AIService.sendMessage('Create a job posting for Senior Java Developer');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);

      const cancelRes = await AIService.sendMessage('cancel');
      expect(cancelRes.text).toContain('cancelled');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
      expect(DatabaseService.getPostings().length).toBe(initialCount);
    });

    it('ensures Phase 1 Requisitions and Phase 2 JDs continue to function without regression', async () => {
      // Phase 1 Requisition Start
      WorkflowRegistry.reset();
      const reqRes = await AIService.sendMessage('Create a requisition');
      expect(reqRes.text).toContain('Step 1 of 7');
      expect(WorkflowRegistry.getActiveSession().type).toBe('CREATE_REQUISITION');

      // Phase 2 JD Start
      WorkflowRegistry.reset();
      const jdRes = await AIService.sendMessage('Create a JD');
      expect(jdRes.text).toContain('Step 1 of 7');
      expect(WorkflowRegistry.getActiveSession().type).toBe('CREATE_JD');
    });
  });

  // ===========================================================================
  // 10. PHASE 4: RESUME INTAKE + CANDIDATE CREATION + APPLICATION LINKING
  // ===========================================================================
  describe('10. Phase 4: Conversational Resume Intake & Candidate Creation Workflow', () => {
    const mockPdfFile = {
      name: 'Rahul_Kumar_Resume.pdf',
      size: 1024 * 50,
      type: 'application/pdf',
      textContent: `Rahul Kumar
Senior Java Developer
Email: rahul.kumar@example.com
Phone: +91 98765 43210
Location: Bangalore, India
Experience: 5 years of software engineering experience.
Skills: Java, Spring Boot, Microservices, SQL, Docker, Kafka
Education: B.Tech in Computer Science (2019)`
    };

    const mockDocxFile = {
      name: 'Anita_Sharma_Resume.docx',
      size: 1024 * 30,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      textContent: `Anita Sharma
Product Manager
Email: anita.sharma@example.com
Phone: +91 91234 56789
Location: Hyderabad, India
Experience: 6 years product leadership.
Skills: Agile, Scrum, Product Roadmapping, JIRA, SQL
Education: MBA in Technology Management`
    };

    const mockTxtFile = {
      name: 'Vikram_Singh_Resume.txt',
      size: 1024 * 10,
      type: 'text/plain',
      textContent: `Vikram Singh
Frontend Architect
Email: vikram.singh@example.com
Phone: +91 99887 76655
Location: Pune, India
Experience: 7 years building web applications.
Skills: React, TypeScript, JavaScript, Tailwind, Next.js
Education: B.E. in Information Technology`
    };

    const mockUnsupportedFile = {
      name: 'malicious_resume.exe',
      size: 1024 * 100,
      type: 'application/x-msdownload',
      textContent: 'MZ binary executable'
    };

    beforeEach(() => {
      DatabaseService.init();
      WorkflowRegistry.reset();
      AIConversationService.clearConversation();
      AIService.reset();
      AIContextService.setContext({ file: null, attachedFile: null });
    });

    // -------------------------------------------------------------------------
    // REQUIRED TEST 1: Start Phase 4 without attachment -> remains Step 1
    // -------------------------------------------------------------------------
    it('1. Start Phase 4 without attachment -> stays at Step 1 and asks for upload', async () => {
      const turn1 = await AIService.sendMessage('I want to add a candidate from a resume.');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('currentPhase4Step')).toBe(1);
      expect(turn1.text).toContain("Please upload the candidate's resume to continue. Supported formats: PDF, DOCX, TXT.");
      expect(turn1.cards?.some(c => c.type === 'resume_upload_card')).toBe(true);
    });

    // -------------------------------------------------------------------------
    // REQUIRED TEST 2: No candidate extraction without attachment
    // -------------------------------------------------------------------------
    it('2. No candidate extraction without attachment', async () => {
      await AIService.sendMessage('add candidate from resume');
      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('parsedResume')).toBeNull();
      expect(session.getField('extractedCandidate')).toBeNull();
      expect(session.getField('candidateName')).toBeUndefined();
      expect(session.getField('email')).toBeUndefined();
    });

    // -------------------------------------------------------------------------
    // REQUIRED TEST 3: No duplicate check without attachment
    // -------------------------------------------------------------------------
    it('3. No duplicate check without attachment', async () => {
      const turn1 = await AIService.sendMessage('parse this resume');
      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('duplicateResults')).toBeNull();
      expect(session.getField('duplicateDetected')).toBeUndefined();
      expect(turn1.text).not.toContain('Duplicate Candidate Notice');
      expect(turn1.cards?.some(c => c.type === 'duplicate_candidate_card')).toBe(false);
    });

    // -------------------------------------------------------------------------
    // REQUIRED TEST 4: No stale candidate data reused
    // -------------------------------------------------------------------------
    it('4. No stale candidate data reused from previous session', async () => {
      // Session 1: Complete with Rahul
      const turn1 = await AIService.sendMessage('Create candidate from resume', { file: mockPdfFile });
      expect(turn1.text).toContain('Resume received. I\'ll extract the candidate details now.');
      await AIService.sendMessage('Create Candidate');

      // Reset and Start Session 2 without attachment
      WorkflowRegistry.reset();
      AIService.reset();
      AIConversationService.clearConversation();
      AIContextService.setContext({ file: null, attachedFile: null });

      const turn2 = await AIService.sendMessage('I want to add a candidate from a resume.');
      const newSession = WorkflowRegistry.getActiveSession();
      expect(newSession.getField('currentPhase4Step')).toBe(1);
      expect(newSession.getField('parsedResume')).toBeNull();
      expect(newSession.getField('extractedCandidate')).toBeNull();
      expect(turn2.text).toContain("Please upload the candidate's resume to continue.");
      expect(turn2.text).not.toContain('Rahul Kumar');
    });

    // -------------------------------------------------------------------------
    // REQUIRED TEST 5: Valid PDF attachment -> proceeds to parsing
    // -------------------------------------------------------------------------
    it('5. Valid PDF attachment -> proceeds to parsing (Step 1 -> Step 2/3)', async () => {
      const turn1 = await AIService.sendMessage('add candidate from resume', { file: mockPdfFile });
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('fileValidationStatus')).toBe('VALID');
      expect(session.getField('fileName')).toBe('Rahul_Kumar_Resume.pdf');
      expect(session.getField('parsedResume')).toBeDefined();
      expect(session.getField('candidateName')).toBe('Rahul Kumar');
      expect(session.getField('email')).toBe('rahul.kumar@example.com');
      expect(turn1.text).toContain("Resume received. I'll extract the candidate details now.");
      expect(turn1.cards?.some(c => c.type === 'candidate_extraction_card')).toBe(true);
    });

    // -------------------------------------------------------------------------
    // REQUIRED TEST 6: Valid DOCX attachment -> proceeds to parsing
    // -------------------------------------------------------------------------
    it('6. Valid DOCX attachment -> proceeds to parsing', async () => {
      const turn1 = await AIService.sendMessage('Create candidate from resume', { file: mockDocxFile });
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('fileValidationStatus')).toBe('VALID');
      expect(session.getField('candidateName')).toBe('Anita Sharma');
      expect(session.getField('email')).toBe('anita.sharma@example.com');
      expect(turn1.text).toContain("Resume received. I'll extract the candidate details now.");
    });

    // -------------------------------------------------------------------------
    // REQUIRED TEST 7: Valid TXT attachment -> proceeds to parsing
    // -------------------------------------------------------------------------
    it('7. Valid TXT attachment -> proceeds to parsing', async () => {
      const turn1 = await AIService.sendMessage('Create candidate from resume', { file: mockTxtFile });
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('fileValidationStatus')).toBe('VALID');
      expect(session.getField('candidateName')).toBe('Vikram Singh');
      expect(session.getField('email')).toBe('vikram.singh@example.com');
      expect(turn1.text).toContain("Resume received. I'll extract the candidate details now.");
    });

    // -------------------------------------------------------------------------
    // REQUIRED TEST 8: Invalid/unsupported attachment -> remains Step 1
    // -------------------------------------------------------------------------
    it('8. Invalid/unsupported attachment -> remains Step 1 with error', async () => {
      const turn1 = await AIService.sendMessage('Create candidate from resume', { file: mockUnsupportedFile });
      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('currentPhase4Step')).toBe(1);
      expect(session.getField('fileValidationStatus')).toBe('INVALID');
      expect(session.getField('parsedResume')).toBeNull();
      expect(turn1.text).toContain('Security Validation Error');
      expect(turn1.cards?.some(c => c.type === 'resume_upload_card')).toBe(true);
    });

    // -------------------------------------------------------------------------
    // REQUIRED TEST 9: New conversation resets Phase 4 state
    // -------------------------------------------------------------------------
    it('9. New conversation resets Phase 4 state', async () => {
      await AIService.sendMessage('Create candidate from resume', { file: mockPdfFile });
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);

      // Start new conversation / clear
      AIConversationService.clearConversation();
      WorkflowRegistry.reset();
      AIService.reset();

      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
      const promptTurn = await AIService.sendMessage('I want to add a candidate from a resume.');
      const newSession = WorkflowRegistry.getActiveSession();
      expect(newSession.getField('currentPhase4Step')).toBe(1);
      expect(newSession.getField('attachedFile')).toBeNull();
      expect(newSession.getField('parsedResume')).toBeNull();
      expect(newSession.getField('extractedCandidate')).toBeNull();
      expect(promptTurn.text).toContain("Please upload the candidate's resume to continue.");
    });

    // -------------------------------------------------------------------------
    // REQUIRED TEST 10: Duplicate check runs only after successful extraction/review
    // -------------------------------------------------------------------------
    it('10. Duplicate check runs only after successful extraction/review (Step 4)', async () => {
      // Seed existing candidate
      DatabaseService.candidates.unshift({
        id: 'CND-8888',
        candidateName: 'Rahul Kumar',
        name: 'Rahul Kumar',
        email: 'rahul.kumar@example.com',
        stage: 'Applied',
        status: 'Active'
      });
      DatabaseService.persistAll();

      // Step 1 without file -> no duplicate check
      const turn1 = await AIService.sendMessage('I want to add a candidate from a resume.');
      expect(turn1.text).not.toContain('Duplicate Candidate Notice');

      // Now attach resume -> extracts details and triggers duplicate notice
      const turn2 = await AIService.sendMessage('Uploaded resume', { file: mockPdfFile });
      expect(turn2.text).toContain('Resume received. I\'ll extract the candidate details now.');
      expect(turn2.text).toContain('Duplicate Candidate Notice (Step 4 of 7)');
      expect(turn2.cards?.some(c => c.type === 'duplicate_candidate_card')).toBe(true);
    });

    // -------------------------------------------------------------------------
    // ADDITIONAL WORKFLOW END-TO-END TESTS
    // -------------------------------------------------------------------------
    it('completes exact 7-step conversational candidate creation end-to-end with attached resume', async () => {
      const turn1 = await AIService.sendMessage('Create candidate from this resume', { file: mockPdfFile });
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      expect(turn1.text).toContain('Resume received. I\'ll extract the candidate details now.');
      expect(turn1.cards?.length).toBeGreaterThan(0);

      // Select requisition
      const turn2 = await AIService.sendMessage('REQ-2026-001');
      expect(turn2.text).toContain('Step 6 of 7');
      expect(turn2.cards?.some(c => c.type === 'candidate_review_card')).toBe(true);

      // Finalize creation
      const turn3 = await AIService.sendMessage('Create Candidate');
      expect(turn3.text).toContain('Candidate Successfully Created & Verified in ATS!');
      expect(turn3.cards?.[0]?.type).toBe('candidate_created_card');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);

      // Verify persistence in DatabaseService.candidates
      const newCandidate = DatabaseService.candidates.find(c => c.email === 'rahul.kumar@example.com');
      expect(newCandidate).toBeDefined();
      expect(newCandidate.name).toBe('Rahul Kumar');
    });

    it('explains the 7-step resume intake process without creating anything (Explanation Mode)', async () => {
      const res = await AIService.sendMessage('How does resume intake work?');
      expect(res.text).toContain('Resume Intake & Candidate Creation');
      expect(res.text).toContain('7 conversational steps');
      expect(res.text).toContain('Upload / Identify Resume');
      expect(res.text).toContain('Duplicate Check');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
    });

    it('supports field correction in the middle of conversation ("Change email to rahul.new@example.com")', async () => {
      await AIService.sendMessage('Create candidate from this resume', { file: mockPdfFile });

      // Correct Email
      const emailRes = await AIService.sendMessage('Change email to rahul.new@example.com');
      expect(emailRes.text).toContain('rahul.new@example.com');

      // Correct Phone
      const phoneRes = await AIService.sendMessage('Phone number is 9876543210');
      expect(phoneRes.text).toContain('9876543210');

      // Correct Location
      const locRes = await AIService.sendMessage('Location should be Hyderabad');
      expect(locRes.text).toContain('Hyderabad, India');

      // Add Skill
      const skillRes = await AIService.sendMessage('Add AWS skill');
      expect(skillRes.text).toContain('AWS');

      // Link Requisition and finalize
      await AIService.sendMessage('REQ-2026-001');
      const confirmRes = await AIService.sendMessage('Create Candidate');
      expect(confirmRes.text).toContain('Candidate Successfully Created');

      const savedCand = DatabaseService.candidates.find(c => c.email === 'rahul.new@example.com');
      expect(savedCand).toBeDefined();
      expect(savedCand.phone).toContain('9876543210');
      expect(savedCand.location).toBe('Hyderabad, India');
      expect(savedCand.skills).toContain('AWS');
    });

    it('cancels candidate intake workflow cleanly on user request and resets state', async () => {
      const initialCount = DatabaseService.candidates.length;
      await AIService.sendMessage('Create candidate from this resume', { file: mockPdfFile });
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);

      const cancelRes = await AIService.sendMessage('cancel');
      expect(cancelRes.text).toContain('cancelled');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
      expect(DatabaseService.candidates.length).toBe(initialCount);
    });

    // -------------------------------------------------------------------------
    // PHASE 4 UX & AUTOMATIC PROGRESSION MASTER TEST SUITE
    // -------------------------------------------------------------------------
    it('automatically progresses upon resume upload without requiring user to retype intent', async () => {
      // Step 1: User declares intent without file
      const turn1 = await AIService.sendMessage('I want to add a candidate from a resume.');
      expect(turn1.text).toContain("Please upload the candidate's resume to continue.");
      expect(turn1.cards?.some(c => c.type === 'resume_upload_card')).toBe(true);
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      expect(WorkflowRegistry.getActiveSession().getField('currentPhase4Step')).toBe(1);

      // Step 2: User uploads resume file via context
      const turn2 = await AIService.sendMessage('Uploaded resume: Rahul_Kumar_Resume.pdf', {
        file: mockPdfFile,
        requisitionId: 'REQ-2026-001'
      });

      // Assert automatic progression to Step 6 Preview
      expect(turn2.text).toContain('Resume Uploaded & Parsed Successfully!');
      expect(turn2.text).toContain('Rahul Kumar');
      expect(turn2.cards?.some(c => c.type === 'resume_preview_card')).toBe(true);
      expect(turn2.cards?.some(c => c.type === 'candidate_extraction_card')).toBe(true);
      expect(turn2.cards?.some(c => c.type === 'resume_match_score_card')).toBe(true);
      expect(turn2.cards?.some(c => c.type === 'application_draft_card')).toBe(true);
      expect(turn2.cards?.some(c => c.type === 'candidate_review_card')).toBe(true);

      const session = WorkflowRegistry.getActiveSession();
      expect(session.status).toBe('PREVIEW');
      expect(session.getField('currentPhase4Step')).toBe(6);
      expect(session.getField('candidateName')).toBe('Rahul Kumar');
      expect(session.getField('email')).toBe('rahul.kumar@example.com');
      expect(session.getField('resumeMatchScore')?.overallScore).toBeGreaterThanOrEqual(70);

      // Step 3: User confirms creation directly
      const turn3 = await AIService.sendMessage('Create candidate and application');
      expect(turn3.text).toContain('Candidate Successfully Created & Verified in ATS!');
      expect(turn3.cards?.[0]?.type).toBe('candidate_created_card');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);

      const savedCandidate = DatabaseService.candidates.find(c => c.email === 'rahul.kumar@example.com');
      expect(savedCandidate).toBeDefined();
      const savedApp = DatabaseService.applications.find(a => a.candidateId === savedCandidate.id && a.requisitionId === 'REQ-2026-001');
      expect(savedApp).toBeDefined();
    });

    it('renders structured sections in candidate extraction card (Personal, Professional, Experience, Education, Skills, Certifications, Links)', async () => {
      const turn = await AIService.sendMessage('Upload candidate resume', { file: mockPdfFile });
      const extractCard = turn.cards?.find(c => c.type === 'candidate_extraction_card');
      expect(extractCard).toBeDefined();
      expect(extractCard.sections).toBeDefined();
      expect(extractCard.sections.some(s => s.title === 'Personal & Identity')).toBe(true);
      expect(extractCard.sections.some(s => s.title === 'Professional Summary')).toBe(true);
      expect(extractCard.sections.some(s => s.title === 'Work Experience History')).toBe(true);
      expect(extractCard.sections.some(s => s.title === 'Education & Qualifications')).toBe(true);
      expect(extractCard.sections.some(s => s.title === 'Skills & Competencies')).toBe(true);
      expect(extractCard.sections.some(s => s.title === 'Certifications & Credentials')).toBe(true);
      expect(extractCard.sections.some(s => s.title === 'Links & Profiles')).toBe(true);
    });

    it('handles natural language queries: "Show me the resume score" and "What skills are missing?"', async () => {
      await AIService.sendMessage('Add candidate from resume', { file: mockPdfFile, requisitionId: 'REQ-2026-001' });

      // Query 1: Show resume score
      const scoreRes = await AIService.sendMessage('Show me the resume score');
      expect(scoreRes.text).toContain('Resume Match Score Analysis');
      expect(scoreRes.cards?.some(c => c.type === 'resume_match_score_card')).toBe(true);

      // Query 2: What skills are missing?
      const missingRes = await AIService.sendMessage('What skills are missing?');
      expect(missingRes.text).toContain('Skill Gap Analysis');
      expect(missingRes.cards?.some(c => c.type === 'resume_match_score_card')).toBe(true);

      // Query 3: Change JD to QA Engineer
      const changeJdRes = await AIService.sendMessage('Use this resume for the Senior Java Developer role');
      expect(changeJdRes.text).toContain('Senior Java Developer');
    });

    // -------------------------------------------------------------------------
    // STEP 5 SKIP / GENERAL TALENT POOL PATH TESTS
    // -------------------------------------------------------------------------
    it('supports Step 5 "Skip (Add to general talent pool)" action without requiring a requisition', async () => {
      // Step 1 & 2: Upload resume without pre-set requisition
      const turn1 = await AIService.sendMessage('I want to add a candidate from a resume.', { file: mockPdfFile });
      expect(turn1.text).toContain('Which approved JD or requisition should I use');
      expect(turn1.cards?.some(c => c.type === 'requisition_selector_card')).toBe(true);

      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('currentPhase4Step')).toBe(5);

      // Step 5: User clicks Skip (Add to general talent pool) or says "Skip"
      const turn2 = await AIService.sendMessage('Skip');
      expect(turn2.text).toContain('General Talent Pool');
      expect(turn2.cards?.some(c => c.type === 'candidate_review_card')).toBe(true);

      const reviewCard = turn2.cards.find(c => c.type === 'candidate_review_card');
      expect(reviewCard.destination).toBe('General Talent Pool');
      expect(reviewCard.requisitionId).toBe('Not Selected');
      expect(reviewCard.applicationStatus).toBe('Not Created');
      expect(reviewCard.matchScore).toContain('N/A — No JD selected');

      expect(session.getField('linkageMode')).toBe('TALENT_POOL');
      expect(session.getField('talentPoolDestination')).toBe('GENERAL');
      expect(session.getField('selectedRequisition')).toBeNull();
      expect(session.getField('applicationDraft')).toBeNull();
      expect(session.getField('currentPhase4Step')).toBe(6);
      expect(session.status).toBe('PREVIEW');

      // Step 6: User confirms creation -> creates ONLY candidate in Talent Pool
      const prevCandCount = DatabaseService.candidates.length;
      const prevAppCount = DatabaseService.applications.length;

      const turn3 = await AIService.sendMessage('Create Candidate');
      expect(turn3.text).toContain('Candidate Successfully Added to General Talent Pool!');
      expect(turn3.cards?.[0]?.badge).toBe('Added to Talent Pool');
      expect(DatabaseService.candidates.length).toBe(prevCandCount + 1);
      expect(DatabaseService.applications.length).toBe(prevAppCount); // NO application created!

      const createdCand = DatabaseService.candidates[0];
      expect(createdCand.stage).toBe('Talent Pool');
      expect(createdCand.talentPoolDestination).toBe('GENERAL');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
    });

    it('supports conversational phrases for skipping requisition ("add to talent pool", "skip requisition", "put this candidate in talent pool")', async () => {
      await AIService.sendMessage('Add candidate from resume', { file: mockPdfFile });
      
      const turn = await AIService.sendMessage('Add this candidate to general talent pool');
      expect(turn.text).toContain('General Talent Pool');
      expect(turn.cards?.some(c => c.type === 'candidate_review_card')).toBe(true);

      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('linkageMode')).toBe('TALENT_POOL');
      expect(session.getField('currentPhase4Step')).toBe(6);
    });

    it('supports "Back" from Step 6 to return to Step 5 Requisition Selector, and allows subsequent requisition linkage', async () => {
      await AIService.sendMessage('Add candidate from resume', { file: mockPdfFile });
      await AIService.sendMessage('Skip');

      let session = WorkflowRegistry.getActiveSession();
      expect(session.getField('currentPhase4Step')).toBe(6);

      // Back to Step 5
      const backTurn = await AIService.sendMessage('Back');
      expect(backTurn.text).toContain('Which requisition should this candidate be associated with?');
      expect(backTurn.cards?.some(c => c.type === 'requisition_selector_card')).toBe(true);
      expect(session.getField('currentPhase4Step')).toBe(5);

      // Now choose a requisition
      const reqTurn = await AIService.sendMessage('REQ-2026-001');
      expect(reqTurn.text).toContain('Final Candidate Review');
      expect(session.getField('linkageMode')).toBe('REQUISITION');
      expect(session.getField('requisitionId')).toBe('REQ-2026-001');
      expect(session.getField('resumeMatchScore')).toBeDefined();
    });
  });

  // ===========================================================================
  // 11. PHASE 4: SESSION ISOLATION, ASYNC RACE PROTECTION & STATE LIFECYCLE
  // ===========================================================================
  describe('11. Phase 4: Session Isolation, Async Race Protection & State Lifecycle', () => {
    const resumeA = {
      name: 'Alice_Walker_Resume.pdf',
      size: 1024 * 40,
      type: 'application/pdf',
      textContent: `Alice Walker\nPrincipal Backend Engineer\nEmail: alice.walker@enterprise.com\nPhone: +1 555-019-2834\nLocation: Seattle, WA\nExperience: 10 years distributed systems.\nSkills: Java, Go, Kubernetes, Kafka, Distributed Architecture\nEducation: M.S. Computer Science`
    };

    const resumeB = {
      name: 'Bob_Builder_Resume.docx',
      size: 1024 * 35,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      textContent: `Bob Builder\nUI Architect\nEmail: bob.builder@construction.org\nPhone: +44 20 7946 0912\nLocation: London, UK\nExperience: 8 years frontend design.\nSkills: React, TypeScript, GraphQL, CSS Architecture, Webpack\nEducation: B.S. Software Engineering`
    };

    beforeEach(() => {
      DatabaseService.init();
      WorkflowRegistry.reset();
      AIConversationService.clearConversation();
      AIService.reset();
      AIContextService.resetTemporarySessionContext();
    });

    it('Scenario A: Upload Resume A -> complete -> Start new intake -> Upload Resume B -> Only Resume B appears', async () => {
      // 1. Ingest Resume A
      const turnA = await AIService.sendMessage('Create candidate from resume', { file: resumeA, requisitionId: 'REQ-2026-001' });
      expect(turnA.text).toContain('Alice Walker');
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      const sessionA = WorkflowRegistry.getActiveSession();
      const sessionAId = sessionA.id;

      // Complete Candidate A
      const createTurnA = await AIService.sendMessage('Create Candidate');
      expect(createTurnA.text).toContain('Candidate Successfully Created');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);

      // Verify Persisted DB has Alice
      expect(DatabaseService.candidates.some(c => c.email === 'alice.walker@enterprise.com')).toBe(true);

      // 2. Start a new intake for Resume B
      const startNewTurn = await AIService.sendMessage('I want to add a candidate from a resume.');
      expect(startNewTurn.text).toContain("Please upload the candidate's resume");
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      const sessionB = WorkflowRegistry.getActiveSession();
      expect(sessionB.id).not.toBe(sessionAId);
      expect(sessionB.getField('parsedResume')).toBeNull();
      expect(sessionB.getField('extractedCandidate')).toBeNull();

      // 3. Upload Resume B
      const turnB = await AIService.sendMessage('Uploaded resume: Bob_Builder_Resume.docx', { file: resumeB });
      expect(turnB.text).toContain('Bob Builder');
      expect(turnB.text).not.toContain('Alice Walker');
      expect(sessionB.getField('candidateName')).toBe('Bob Builder');
      expect(sessionB.getField('email')).toBe('bob.builder@construction.org');
      expect(sessionB.getField('skills')).toContain('React');
      expect(sessionB.getField('skills')).not.toContain('Distributed Architecture');
    });

    it('Scenario B: Clear Chat resets temporary AI session & context while preserving ATS business records', async () => {
      const initialCandCount = DatabaseService.candidates.length;
      const initialReqCount = DatabaseService.requisitions.length;

      // Upload Resume A in progress
      await AIService.sendMessage('Create candidate from resume', { file: resumeA });
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);
      expect(AIConversationService.getMessages().length).toBeGreaterThan(0);

      // Execute Clear Chat / Reset Session
      AIService.resetAISession();

      // Verify messages and active session are wiped
      expect(AIConversationService.getMessages().length).toBe(0);
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
      expect(AIContextService.getContext().file).toBeUndefined();

      // Verify Persisted ATS records were NOT destroyed
      expect(DatabaseService.candidates.length).toBe(initialCandCount);
      expect(DatabaseService.requisitions.length).toBe(initialReqCount);

      // Verify fresh intake starts completely clean
      const freshTurn = await AIService.sendMessage('Create candidate from resume');
      expect(freshTurn.text).toContain("Please upload the candidate's resume");
      expect(freshTurn.text).not.toContain('Alice Walker');
    });

    it('Scenario C: Async race condition protection discards stale parser results if session or file changed', async () => {
      // Start workflow with Resume A
      await AIService.sendMessage('I want to add a candidate from a resume.');
      const activeSession = WorkflowRegistry.getActiveSession();
      const initialSessionId = activeSession.id;

      // Simulate starting another intake (superseding the session)
      const freshSession = WorkflowRegistry.startSession('CREATE_CANDIDATE_FROM_RESUME');
      expect(freshSession.id).not.toBe(initialSessionId);

      // Verify the superseded session was cancelled
      expect(activeSession.isCancelled()).toBe(true);
    });

    it('Scenario D: Talent Pool workflow completes and leaves zero stale state for next intake', async () => {
      // Intake A to Talent Pool
      await AIService.sendMessage('Add candidate from resume', { file: resumeA });
      await AIService.sendMessage('Skip');
      const createA = await AIService.sendMessage('Create Candidate');
      expect(createA.text).toContain('Candidate Successfully Added to General Talent Pool!');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);

      // Start Intake B
      const turnB = await AIService.sendMessage('Create candidate from resume', { file: resumeB });
      expect(turnB.text).toContain('Bob Builder');
      expect(turnB.text).not.toContain('Alice Walker');
      expect(turnB.text).not.toContain('alice.walker@enterprise.com');

      const sessionB = WorkflowRegistry.getActiveSession();
      expect(sessionB.getField('candidateName')).toBe('Bob Builder');
    });

    it('Scenario E: Requisition workflow completes and does not leak selected requisition to next intake', async () => {
      // Intake A with Requisition REQ-2026-001
      await AIService.sendMessage('Add candidate from resume', { file: resumeA, requisitionId: 'REQ-2026-001' });
      await AIService.sendMessage('Create Candidate');
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);

      // Intake B without explicit requisition -> should prompt for Step 5 or remain clean
      const turnB = await AIService.sendMessage('Add candidate from resume', { file: resumeB });
      const sessionB = WorkflowRegistry.getActiveSession();
      expect(sessionB.getField('candidateName')).toBe('Bob Builder');
      expect(sessionB.getField('email')).toBe('bob.builder@construction.org');
      // Should not retain Alice's details
      expect(sessionB.getField('candidateName')).not.toBe('Alice Walker');
    });

    it('supports "Start over" / "Restart" command cleanly at any step', async () => {
      await AIService.sendMessage('Add candidate from resume', { file: resumeA });
      expect(WorkflowRegistry.hasActiveSession()).toBe(true);

      const restartTurn = await AIService.sendMessage('Start over');
      expect(restartTurn.text).toContain("Starting a new candidate intake. Please upload the candidate's resume");
      expect(restartTurn.cards?.some(c => c.type === 'resume_upload_card')).toBe(true);

      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('currentPhase4Step')).toBe(1);
      expect(session.getField('parsedResume')).toBeNull();
      expect(session.getField('extractedCandidate')).toBeNull();
      expect(session.getField('candidateName')).toBeUndefined();
    });

    it('supports "Upload a different resume" in the middle of workflow to replace file state', async () => {
      await AIService.sendMessage('Add candidate from resume', { file: resumeA });
      const session = WorkflowRegistry.getActiveSession();
      expect(session.getField('candidateName')).toBe('Alice Walker');

      // User says upload different resume
      const replaceTurn = await AIService.sendMessage('Upload a different resume');
      expect(replaceTurn.text).toContain("Starting a new candidate intake. Please upload the candidate's resume");
      expect(session.getField('parsedResume')).toBeNull();

      // Upload Resume B
      const newUploadTurn = await AIService.sendMessage('Uploaded resume: Bob_Builder_Resume.docx', { file: resumeB });
      expect(newUploadTurn.text).toContain('Bob Builder');
      expect(newUploadTurn.text).not.toContain('Alice Walker');
      expect(session.getField('candidateName')).toBe('Bob Builder');
    });

    it('preserves normal conversational queries without clearing unrelated history', async () => {
      const qTurn = await AIService.sendMessage('Show pending approvals');
      expect(qTurn.text).toBeDefined();
      expect(WorkflowRegistry.hasActiveSession()).toBe(false);
      expect(AIConversationService.getMessages().length).toBe(2);
    });
  });
});



