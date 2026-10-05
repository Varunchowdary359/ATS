/**
 * AI Intent Engine & Multilingual Natural Language Processor
 * Analyzes user prompts across English, Telugu, Hindi, and code-mixed formats (Hinglish/Tenglish)
 * to resolve intents, extract entities, identify pronouns, and generate tool execution plans.
 * 
 * Guaranteed type safety and resilience against malformed / non-string inputs.
 */

import { DatabaseService } from '../db/DatabaseService.js';
import { AIContextService } from './AIContextService.js';
import { AIMemoryService } from './AIMemoryService.js';
import { WorkflowRegistry } from './workflow/WorkflowRegistry.js';
import { AIPublishingAdapter } from './AIPublishingAdapter.js';
import { normalizeText, safeString, safeToLowerCase } from './AINormalizer.js';

export class AIIntentEngine {
  /**
   * Detects the primary language of the user input
   */
  static detectLanguage(text = '') {
    const raw = safeString(text).trim();
    if (!raw) return 'en';

    // Telugu script detection
    if (/[\u0C00-\u0C7F]/.test(raw)) return 'te';
    // Devanagari (Hindi) script detection
    if (/[\u0900-\u097F]/.test(raw)) return 'hi';
    
    const lower = normalizeText(raw);

    // Transliterated Telugu / Tenglish indicators
    if (/\b(mama|thambi|macha|anna|ela\s+unnav|ela\s+unnava|ela\s+unnaru|bagunnara|bavunnava|cheyi|cheyyi|chesara|chupinchu|cheyyandi|cheyandi|ivvandi|pettandi|unnara|unnayi|unnaaya|enni|evaro|enti|kavali|adigeyi|malli\s+kaluddam)\b/i.test(lower)) {
      return 'te';
    }
    // Transliterated Hindi / Hinglish indicators
    if (/\b(kaise\s+ho|kya\s+haal|kya\s+chal|bhai|theek\s+ho|approve\s+karo|kardo|dikhao|bhejo|batao|schedule\s+karo|karein|chahiye|hona\s+hai|baje|shukriya|dhanyavaad|alvida|kitne|kitna|karo|banao|ke\s+liye|keliye)\b/i.test(lower)) {
      return 'hi';
    }
    return 'en';
  }

  /**
   * Alias for parseIntent for compatibility
   */
  static match(prompt = '', context = {}) {
    return this.parseIntent(prompt, context);
  }

  /**
   * Primary NLU Parser resolving intent, entities, slots, and suggested action
   */
  static parseIntent(prompt = '', context = {}) {
    DatabaseService.init();
    const cleanPrompt = safeString(prompt).trim();
    const lower = normalizeText(cleanPrompt);
    const lang = this.detectLanguage(cleanPrompt);

    // =============================================================
    // -1. ACTIVE CONVERSATIONAL WORKFLOW SESSION CHECK
    // =============================================================
    const activeSession = WorkflowRegistry.getActiveSession();
    const isExplicitNewWorkflow = (() => {
      if (!activeSession) return false;
      // If user is saying "start over" or "restart" or "upload a different resume" inside an active candidate workflow,
      // let WORKFLOW_TURN handle it to reset within the workflow.
      if (activeSession.type === 'CREATE_CANDIDATE_FROM_RESUME' && /\b(start\s+over|restart|upload\s+(?:a\s+)?(?:different|another|new)\s+resume|replace\s+(?:this\s+)?resume|use\s+another\s+resume)\b/i.test(lower)) {
        return false;
      }
      // If starting an explicit new candidate intake:
      if (/\b(i\s+want\s+to\s+add\s+(?:a\s+)?candidate|add\s+(?:a\s+)?candidate\s+from\s+(?:a\s+)?resume|upload\s+(?:a\s+)?(?:candidate\s+)?resume|add\s+a\s+new\s+candidate|create\s+another\s+candidate|start\s+(?:a\s+)?new\s+candidate\s+intake|reset\s+intake)\b/i.test(lower)) {
        return true;
      }
      if (/\b(create\s+candidate\s+from\s+resume)\b/i.test(lower) && !activeSession.isPreview()) {
        return true;
      }
      // If currently NOT a requisition workflow, but user requests requisition creation
      if (activeSession.type !== 'CREATE_REQUISITION' && /\b(create\s+(?:a\s+)?requisition|new\s+requisition)\b/i.test(lower) && !/\b(link|associate|select)\b/i.test(lower)) {
        return true;
      }
      // If currently NOT a JD workflow, but user requests JD creation
      if (activeSession.type !== 'CREATE_JD' && /\b(create\s+(?:a\s+)?jd|draft\s+(?:a\s+)?jd|create\s+job\s+description)\b/i.test(lower)) {
        return true;
      }
      // If currently NOT a Job Posting workflow, but user requests Job Posting creation
      if (activeSession.type !== 'CREATE_JOB_POSTING' && /\b(create\s+(?:a\s+)?job\s+posting|publish\s+job\s+posting)\b/i.test(lower)) {
        return true;
      }
      return false;
    })();

    if (WorkflowRegistry.hasActiveSession()) {
      if (isExplicitNewWorkflow) {
        // Invalidate previous session and clear temporary file attachment
        WorkflowRegistry.clearActiveSession();
        AIContextService.clearFileAttachment();
      } else {
        const session = WorkflowRegistry.getActiveSession();
        return {
          intent: 'WORKFLOW_TURN',
          category: 'workflow',
          workflowType: session.type,
          session,
          language: lang,
          confidence: 1.0
        };
      }
    }

    // 0.1 Check-in / Wellbeing ("how are you", "ela unnav", "kaise ho", etc.)
    if (
      /\b(how\s+are\s+you|how're\s+you|how\s+do\s+you\s+do|how\s+is\s+it\s+going|how\s+are\s+things|what's\s+up|sup)\b/i.test(lower) ||
      /\b(ela\s+unnav|ela\s+unnava|ela\s+unnaru|bagunnara|bavunnava|kushalama)\b/i.test(lower) ||
      /\b(kaise\s+ho|kaisa\s+hai|kya\s+haal|kya\s+chal\s+raha|sab\s+theek|kese\s+ho)\b/i.test(lower) ||
      /ఎలా\s+ఉన్నావ్|ఎలా\s+ఉన్నావు|ఎలా\s+ఉన్నారు|బాగున్నారా/i.test(cleanPrompt) ||
      /कैसे\s+हो|क्या\s+हाल\s+है|सब\s+ठीक/i.test(cleanPrompt)
    ) {
      return {
        intent: 'GENERAL_CONVERSATION',
        category: 'conversation',
        language: lang,
        confidence: 0.98,
        isMama: /\b(mama|thambi|bro|bhai|anna|macha)\b/i.test(lower) || /మామా|मामा/i.test(cleanPrompt),
        honorific: this._extractHonorific(lower)
      };
    }

    // 0.2 Greetings (Hi, Hello, Namaste, Hello thambi, Good morning, etc.)
    const hasGreetingWord = /\b(hi|hello|hey|hola|namaste|vanakkam|pranam|good\s+morning|good\s+afternoon|good\s+evening|good\s+day)\b/i.test(lower) ||
      /^(నమస్కారం|హలో|హాయ్|నమస్తే)[!?. ]*$/i.test(cleanPrompt) ||
      /^(नमस्ते|प्रणाम|हेलो|हाय)[!?. ]*$/i.test(cleanPrompt);

    const hasAtsActionKeyword = /\b(approve|publish|schedule|screen|create|requisition|candidate|interview|jd|job\s+description|metrics|funnel|report|pending)\b/i.test(lower) ||
      /ఆమోద|షెడ్యూల్|స్క్రీన్|स्वीकृत|शेड्यूल/i.test(cleanPrompt);

    if (hasGreetingWord && !hasAtsActionKeyword) {
      return {
        intent: 'GENERAL_GREETING',
        category: 'conversation',
        language: lang,
        confidence: 0.98,
        isMama: /\b(mama|thambi|bro|bhai|anna|macha)\b/i.test(lower),
        honorific: this._extractHonorific(lower)
      };
    }

    // 0.3 Thanks & Appreciation
    if (
      /\b(thanks|thank\s+you|thanku|thx|dhanyavadalu|dhanyavaad|shukriya|much\s+appreciated)\b/i.test(lower) ||
      /ధన్యవాదాలు|ధన్యవాదం|చాలా\s+బాగుంది/i.test(cleanPrompt) ||
      /धन्यवाद|शुक्रिया/i.test(cleanPrompt)
    ) {
      return {
        intent: 'GENERAL_CONVERSATION',
        category: 'conversation',
        language: lang,
        confidence: 0.98,
        honorific: this._extractHonorific(lower)
      };
    }

    // 0.4 Farewells & Goodbyes
    if (
      /\b(bye|goodbye|bye\s+bye|see\s+you|cya|good\s+night|goodnight|take\s+care|tata|malli\s+kaluddam|alvida)\b/i.test(lower) ||
      /శుభరాత్రి|మళ్ళీ\s+కలుద్దాం/i.test(cleanPrompt) ||
      /शुभ\s*रात्रि|अलविदा|बाय/i.test(cleanPrompt)
    ) {
      return {
        intent: 'GENERAL_CONVERSATION',
        category: 'conversation',
        language: lang,
        confidence: 0.98
      };
    }

    // 0.5 Identity, Chit-chat & Casual feelings
    if (
      /who\s+are\s+you|tell\s+me\s+about\s+yourself|who\s+made\s+you|what\s+is\s+your\s+name|nuvvu\s+evaru|aap\s+kaun\s+ho|నువ్వు\s+ఎవరు|आप\s+कौन\s+हो/i.test(lower) ||
      /tell\s+me\s+a\s+joke|make\s+me\s+laugh|joke\s+cheppu|chutkula|joke\s+sunao/i.test(lower) ||
      /today\s+i\s+am\s+tired|i'm\s+tired|nenu\s+tired|neerasanga\s+undi|main\s+thak\s+gaya|bored/i.test(lower)
    ) {
      return {
        intent: 'GENERAL_CONVERSATION',
        category: 'conversation',
        language: lang,
        confidence: 0.95
      };
    }

    // 0.6 ATS Capability Questions & Supported Commands
    if (
      /what\s+can\s+you\s+do|what\s+are\s+your\s+capabilities|what\s+actions|help\s+me|help\b|supported\s+commands|features\b|what\s+can\s+peopleworks\s+ai\s+do|em\s+cheyagalavu|kya\s+kar\s+sakte\s+ho|సహాయం|మదద్/i.test(lower)
    ) {
      return {
        intent: 'CAPABILITY_QUERY',
        category: 'help',
        language: lang,
        confidence: 0.95
      };
    }

    // 0.7 ATS Concept Educational Explanations
    if (
      /what\s+is\s+(a\s+)?(requisition|job\s+description|jd|ats|screening)/i.test(lower) ||
      /requisition\s+ante\s+enti|jd\s+kya\s+hota\s+hai/i.test(lower)
    ) {
      return {
        intent: 'explain_ats_concept',
        category: 'explanation',
        language: lang,
        confidence: 0.95
      };
    }

    // 0.8 Requisition Workflow Steps Explanation
    if (
      /(?:how\s+(?:do\s+i|to|can\s+i)|what\s+are\s+the\s+steps\s+to|explain\s+(?:the\s+)?process\s+(?:of|to|for)|tell\s+me\s+(?:the\s+)?steps\s+to)\s+create\s+(?:a\s+)?(?:requisition|requesition|req)/i.test(lower) ||
      /requisition\s+(?:creation\s+steps|creation\s+process|ela\s+create\s+cheyali|kaise\s+banaye)/i.test(lower)
    ) {
      return {
        intent: 'EXPLAIN_REQUISITION_STEPS',
        category: 'explanation',
        language: lang,
        confidence: 0.98
      };
    }

    // 0.9 JD Workflow Steps Explanation
    if (
      /(?:how\s+(?:do\s+i|to|can\s+i)|what\s+are\s+the\s+steps\s+to|explain\s+(?:the\s+)?process\s+(?:of|to|for)|tell\s+me\s+(?:the\s+)?steps\s+to)\s+create\s+(?:a\s+)?(?:jd|job\s+description)/i.test(lower) ||
      /(?:jd|job\s+description)\s+(?:creation\s+steps|creation\s+process|ela\s+create\s+cheyali|kaise\s+banaye)/i.test(lower)
    ) {
      return {
        intent: 'EXPLAIN_JD_STEPS',
        category: 'explanation',
        language: lang,
        confidence: 0.98
      };
    }

    // 0.10 Candidate Intake & Resume Workflow Steps Explanation
    if (
      /(?:how\s+(?:do\s+i|to|can\s+i)\s+(?:create|add)\s+(?:a\s+)?candidate|how\s+does\s+(?:resume\s+)?intake\s+work|what\s+are\s+the\s+steps\s+to\s+(?:create\s+a\s+candidate|intake\s+a\s+resume)|explain\s+(?:the\s+)?(?:resume\s+intake|candidate\s+intake|candidate\s+creation)\s+process)/i.test(lower) ||
      /(?:resume\s+intake|candidate\s+creation)\s+(?:process|steps|ela\s+pani\s+chesthundi|kaise\s+hota\s+hai|kaise\s+kaam\s+karta\s+hai)/i.test(lower) ||
      /రెజ్యూమ్\s+ఇన్‌టేక్|candidate\s+ఎలా\s+క్రియేట్|resume\s+intake\s+कैसे/i.test(cleanPrompt)
    ) {
      return {
        intent: 'EXPLAIN_CANDIDATE_INTAKE_STEPS',
        category: 'explanation',
        confidence: 0.98,
        language: lang
      };
    }

    // =============================================================
    // 1. COREFERENCE & PRONOUN RESOLUTION
    // =============================================================
    const referencedCandidate = this._extractCandidateReference(cleanPrompt, context);
    const referencedJd = this._extractJdReference(cleanPrompt, context);
    const referencedReq = this._extractRequisitionReference(cleanPrompt, context);

    // =============================================================
    // 2. ATS QUERIES (INFORMATION RETRIEVAL & LIVE COUNTS)
    // =============================================================

    // 2.1 PENDING JD APPROVAL QUERY (GET_PENDING_JD_APPROVALS)
    // Matches: "how many jd approvals are pending", "can i know how many jd approvals are pending",
    // "tell me pending jd approvals", "show pending jd approvals", "are there any jds waiting for approval",
    // "enni jd approvals pending unnayi?", "kitne jd approval pending hain?", "pending jd approvals?", etc.
    const isJdPendingQuery = (
      // "how many jd / job description approvals are pending"
      /(?:how\s+many|number\s+of|count\s+of|any|tell\s+me|can\s+i\s+know|show|list|get|check|what\s+is\s+the\s+number\s+of)\s+.*?(?:jd|job\s+description)s?\s+.*?(?:approval|approvals|pending|waiting|awaiting)/i.test(lower) ||
      // "how many approval(s) pending for jd"
      /(?:how\s+many|any|count\s+of)\s+.*?(?:approval|approvals)\s+.*?(?:pending|waiting|awaiting)\s+.*?(?:for\s+)?(?:jd|job\s+description)/i.test(lower) ||
      // "can i know how many jd approvals are pending"
      /(?:can\s+i\s+know|tell\s+me|show\s+me|what\s+are)\s+.*?(?:jd|job\s+description)\s+.*?(?:approval|pending)/i.test(lower) ||
      // "pending jd approvals" / "jd approvals pending" / "pending jd approval"
      /(?:pending|waiting)\s+(?:jd|job\s+description)\s+(?:approval|approvals)/i.test(lower) ||
      /(?:jd|job\s+description)\s+(?:approval|approvals)\s+(?:are\s+)?(?:pending|waiting)/i.test(lower) ||
      /(?:jd|job\s+description)\s+(?:pending|waiting)\s+approvals?/i.test(lower) ||
      // Multilingual (Telugu / Hindi / Tenglish / Hinglish)
      /(?:enni|anni)\s+(?:jd|job\s+description)s?\s+(?:approvals?\s+)?pending\s+(?:unnayi|unnavi|unnara)/i.test(lower) ||
      /(?:jd|job\s+description)s?\s+(?:approvals?\s+)?(?:enni|anni)\s+pending/i.test(lower) ||
      /kitn[ei]\s+(?:jd|job\s+description)s?\s+(?:approvals?\s+)?pending\s+(?:hai|hain)/i.test(lower) ||
      /(?:jd|job\s+description)s?\s+(?:approvals?\s+)?kitn[ei]\s+pending/i.test(lower) ||
      /jd.*(?:ఆమోద|పెండింగ్)/i.test(cleanPrompt) ||
      /jd.*(?:स्वीकृति|पेंडिंग)/i.test(cleanPrompt)
    ) && !/(?:approve\s+(?:this|the|all|selected)\s+jd|mark\s+as\s+approved)/i.test(lower);

    if (isJdPendingQuery) {
      return {
        intent: 'GET_PENDING_JD_APPROVALS',
        category: 'query',
        toolName: 'getPendingJdApprovals',
        params: {},
        confidence: 0.97,
        language: lang
      };
    }

    // 2.2 PENDING REQUISITION APPROVAL QUERY
    const isReqPendingQuery = (
      /(?:how\s+many|number\s+of|count\s+of|any|tell\s+me|can\s+i\s+know|show|list|get)\s+.*?(?:requisition)s?\s+.*?(?:approval|approvals|pending|waiting|awaiting)/i.test(lower) ||
      /(?:pending|waiting)\s+requisition\s+(?:approval|approvals)/i.test(lower) ||
      /requisition\s+(?:approval|approvals)\s+(?:are\s+)?(?:pending|waiting)/i.test(lower) ||
      /(?:enni|kitne)\s+requisitions?\s+pending/i.test(lower)
    ) && !/approve\s+(?:this\s+|the\s+)?requisition/i.test(lower);

    if (isReqPendingQuery) {
      return {
        intent: 'GET_PENDING_REQUISITION_APPROVALS',
        category: 'query',
        toolName: 'getPendingRequisitions',
        params: { status: 'PENDING_APPROVAL' },
        confidence: 0.95,
        language: lang
      };
    }

    // 2.3 APPROVAL CHAIN & APPROVER QUERY
    if (
      /(?:who\s+(?:are\s+the\s+approvers|approves\s+this|should\s+approve|is\s+the\s+finance\s+approver|is\s+the\s+approver)|show\s+(?:the\s+)?approval\s+chain|approval\s+hierarchy|approver\s+evaru|kaun\s+approve\s+karega)/i.test(lower) ||
      /ఆమోదకర్త|ఎవరు\s+approve/i.test(cleanPrompt) ||
      /कौन\s+स्वीकृत|अप्रूवर\s+कौन/i.test(cleanPrompt)
    ) {
      return {
        intent: 'QUERY_APPROVAL_CHAIN',
        category: 'query',
        toolName: 'getApprovalChain',
        params: {},
        confidence: 0.95,
        language: lang
      };
    }

    // 2.4 GENERAL RECRUITMENT METRICS / FUNNEL / ACTIVE WORK
    if (
      /show\s+(pending|active)?\s*(approvals|requisitions|interviews|candidates)/i.test(lower) ||
      /how\s+many\s+(candidates|interviews|requisitions)/i.test(lower) ||
      /recruitment\s+funnel/i.test(lower) ||
      /what\s+is\s+pending/i.test(lower) ||
      /pending\s+work/i.test(lower) ||
      /enni\s+(candidates|interviews)\s+unnaru/i.test(lower) ||
      /kitne\s+(candidates|interviews)\s+hain/i.test(lower)
    ) {
      return {
        intent: 'GET_RECRUITMENT_FUNNEL',
        category: 'dashboard',
        toolName: 'getDashboardMetrics',
        params: {},
        confidence: 0.93,
        language: lang
      };
    }

    // =============================================================
    // 3. CANDIDATE SCREENING & RESUME EVALUATION
    // =============================================================

    // 3.1 SCREENING INTENT ("screen candidates", "screen Rahul", "screen this resume", etc.)
    const isScreeningIntent = (
      /\bscreen\b/i.test(lower) ||
      /\bevaluate\b/i.test(lower) ||
      /check\s+(?:whether|if)\s+.*matches/i.test(lower) ||
      /resume\s+(?:ni\s+|ko\s+)?screen\s+(?:cheyi|cheyandi|karo|kardo)/i.test(lower) ||
      /candidate\s+(?:ni\s+|ko\s+)?screen\s+(?:cheyi|cheyandi|karo|kardo)/i.test(lower) ||
      /రెజ్యూమ్.*స్క్రీన్/i.test(cleanPrompt) ||
      /रिज्यूम.*स्क्रीन/i.test(cleanPrompt)
    );

    if (isScreeningIntent) {
      // Case A: Specific candidate mentioned or active in context
      if (referencedCandidate) {
        return {
          intent: 'SCREEN_CANDIDATE',
          category: 'screening',
          toolName: 'screenCandidateAgainstJD',
          params: {
            candidateId: referencedCandidate.id || 'CND-1001'
          },
          entity: referencedCandidate,
          confidence: 0.95,
          language: lang
        };
      }

      // Case B: General "screen candidates" without a single selected candidate
      // We resolve cleanly to SCREEN_CANDIDATES without crashing!
      const activeJd = referencedJd || AIContextService.resolveContextualEntity('jd');
      return {
        intent: 'SCREEN_CANDIDATES',
        category: 'screening',
        clarificationNeeded: true,
        jdContext: activeJd,
        confidence: 0.92,
        language: lang
      };
    }

    // =============================================================
    // 4. ATS ACTIONS (APPROVALS, SCHEDULING, CREATION, PUBLISHING)
    // =============================================================

    // 4.1 APPROVE JD ACTION
    if (
      /approve\s+(?:the\s+|this\s+|an?\s+|all\s+|.*?\s+)?(?:jd|job\s+description)/i.test(lower) ||
      /mark\s+(?:this\s+|the\s+)?jd\s+as\s+approved/i.test(lower) ||
      /move\s+(?:this\s+|the\s+)?jd\s+to\s+approved/i.test(lower) ||
      /(?:jd|job\s+description)\s+(?:ni\s+|ko\s+)?approve\s+(?:cheyi|cheyandi|karo|kardo)/i.test(lower) ||
      /ఈ\s+.*jd.*(?:approve|ఆమోద)/i.test(cleanPrompt) ||
      /इस\s+.*jd.*(?:approve|स्वीकृत)/i.test(cleanPrompt)
    ) {
      const targetJd = referencedJd || AIContextService.resolveContextualEntity('jd') || DatabaseService.jds?.[0];
      return {
        intent: 'APPROVE_JD',
        category: 'action',
        toolName: 'approveJobDescription',
        params: { jdId: targetJd?.id || 'JD-2026-001' },
        entity: targetJd,
        confidence: 0.95,
        language: lang,
        requiresConfirmation: false
      };
    }

    // 4.2 PUBLISH JD / JOB POSTING ACTION
    const isPublishAction = (
      /publish\s+(?:this\s+|the\s+|an?\s+|.*?\s+)?(?:jd|job(?:\s+posting)?|posting|requisition|req)/i.test(lower) ||
      /publish\s+(?:REQ|JD|POST)-?\d+/i.test(lower) ||
      /publish\s+it\s+(?:to|on)\s+/i.test(lower) ||
      /publish\s+on\s+(?:linkedin|naukri|indeed|careers|glassdoor)/i.test(lower) ||
      /publish\s+kardo/i.test(lower)
    ) && !/\b(?:create|make|prepare|start|draft|banao)\b/i.test(lower);

    if (isPublishAction) {
      const channels = AIPublishingAdapter.resolveChannels(cleanPrompt);
      const reqIdMatch = cleanPrompt.match(/\b(REQ-\d{4}-\d{3,4}|REQ-\d{3,4})\b/i);
      const jdIdMatch = cleanPrompt.match(/\b(JD-\d{4}-\d{3,4}|JD-\d{3,4})\b/i);
      const postIdMatch = cleanPrompt.match(/\b(POST-\d{4}-\d{3,4}|POST-\d{3,4})\b/i);

      let targetReqId = reqIdMatch ? reqIdMatch[1].toUpperCase() : null;
      let targetJdId = jdIdMatch ? jdIdMatch[1].toUpperCase() : null;
      let targetPostId = postIdMatch ? postIdMatch[1].toUpperCase() : null;

      if (!targetPostId && !targetJdId && !targetReqId) {
        const targetJd = referencedJd || AIContextService.resolveContextualEntity('jd') || DatabaseService.jds?.[0];
        targetJdId = targetJd?.id;
      }

      return {
        intent: 'PUBLISH_JOB_POSTING',
        category: 'action',
        toolName: 'publishJobPosting',
        params: {
          postingId: targetPostId,
          jdId: targetJdId,
          reqId: targetReqId,
          channels: channels.length > 0 ? channels : ['careers_portal', 'linkedin', 'naukri', 'indeed']
        },
        confidence: 0.95,
        language: lang
      };
    }

    // 4.3 SCHEDULE INTERVIEW ACTION
    if (
      /schedule\s+(?:interview|round|him|her|them|.*?\s+interview)?/i.test(lower) ||
      /book\s+(?:.*)?interview/i.test(lower) ||
      /set\s*up\s+an?\s+interview/i.test(lower) ||
      /arrange\s+(?:an?\s+)?interview/i.test(lower) ||
      /interview\s+(?:.*)?(?:schedule\s+)?(?:karo|cheyi|kardo|cheyandi|cheyyi|cheyyandi|karein)/i.test(lower) ||
      /schedule\s+(?:karo|cheyi|kardo|cheyandi|cheyyi|cheyyandi|karein)/i.test(lower) ||
      /कल\s+.*interview/i.test(cleanPrompt) ||
      /రేపు\s+.*interview/i.test(cleanPrompt)
    ) {
      const cand = referencedCandidate || AIContextService.resolveContextualEntity('candidate') || DatabaseService.candidates?.[0];
      
      // Extract date / time parameters safely
      let date = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // Default tomorrow
      if (/today|ఈరోజు|आज/i.test(lower)) {
        date = new Date().toISOString().split('T')[0];
      }
      
      let time = '11:00';
      const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|gantalu)?/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const mins = timeMatch[2] || '00';
        const meridian = normalizeText(timeMatch[3] || '');
        if (meridian === 'pm' && hour < 12) hour += 12;
        time = `${hour.toString().padStart(2, '0')}:${mins}`;
      }

      return {
        intent: 'SCHEDULE_INTERVIEW',
        category: 'action',
        toolName: 'scheduleInterview',
        params: {
          candidateId: cand?.id || 'CND-1001',
          scheduledDate: date,
          startTime: time,
          roundName: 'Technical Interview Round 1',
          roundCategory: 'TECHNICAL'
        },
        entity: cand,
        confidence: 0.94,
        language: lang
      };
    }

    // 4.4 CREATE REQUISITION CONVERSATIONAL WORKFLOW
    const isCreateRequisitionCmd = (
      /\b(?:create|make|start|open|initiate|banao|cheyi|cheyandi|karo|kardo)\s+(?:a\s+|an\s+|new\s+|one\s+)?(?:requisition|requesition|req|job\s+requisition)\b/i.test(lower) ||
      /\b(?:requisition|requesition|req|job\s+requisition)\s+(?:create|banao|cheyi|cheyandi|karo|kardo)\b/i.test(lower) ||
      /\b(?:i\s+want\s+to\s+create|can\s+you\s+create|help\s+me\s+create|okay\s+create|ok\s+create)\s+(?:a\s+|an\s+|one\s+|new\s+)?(?:requisition|requesition|req)?\b/i.test(lower) ||
      /\b(?:new\s+requisition|new\s+req)\b/i.test(lower) ||
      /కొత్త\s+requisition|requisition\s+క్రియేట్|నయా\s+requisition|requisition\s+बनाओ/i.test(cleanPrompt)
    );

    if (isCreateRequisitionCmd) {
      const initialData = {};

      // 1. Title Extraction
      let extractedTitle = null;
      const titleMatchAfter = cleanPrompt.match(/(?:for|of|role)\s+(?:\d+\s+)?([A-Za-z0-9\s.+#]+?)(?:\s+(?:in|with|under|at|openings|positions|candidates|budget|,)|$)/i);
      const titleMatchBefore = cleanPrompt.match(/^([A-Za-z0-9\s.+#]+?)(?:\s+(?:ke\s+liye|ki|kosam|for))?\s+(?:requisition|requesition|req)/i);
      if (titleMatchAfter && titleMatchAfter[1].trim().length >= 3) {
        extractedTitle = titleMatchAfter[1].trim();
      } else if (titleMatchBefore && titleMatchBefore[1].trim().length >= 3 && !/\b(create|make|new|open|start)\b/i.test(titleMatchBefore[1])) {
        extractedTitle = titleMatchBefore[1].trim();
      }

      if (extractedTitle) {
        extractedTitle = extractedTitle.replace(/^\d+\s*/, '').trim();
        extractedTitle = extractedTitle.replace(/Developers$/i, 'Developer').replace(/Engineers$/i, 'Engineer').replace(/Designers$/i, 'Designer');
        const formattedTitle = extractedTitle.replace(/\b\w/g, l => l.toUpperCase());
        initialData.jobTitle = formattedTitle;
        initialData.title = formattedTitle;
      }

      // 2. Department Extraction
      if (/\b(engineering|tech|software|information\s+technology|it\s+dept|it\s+department)\b/i.test(lower) && !/\b(developer|engineer)\b/i.test(lower)) initialData.department = 'Engineering';
      else if (/\b(engineering\s+department|engineering\s+dept|under\s+engineering|in\s+engineering)\b/i.test(lower)) initialData.department = 'Engineering';
      else if (/\b(product|pm)\b/i.test(lower) && !/\b(product\s+manager)\b/i.test(lower)) initialData.department = 'Product';
      else if (/\b(product\s+department|under\s+product|in\s+product)\b/i.test(lower)) initialData.department = 'Product';
      else if (/\b(design|ui|ux)\b/i.test(lower) && !/\b(designer)\b/i.test(lower)) initialData.department = 'Design';
      else if (/\b(sales|business development|bd)\b/i.test(lower)) initialData.department = 'Sales';
      else if (/\b(marketing|growth)\b/i.test(lower)) initialData.department = 'Marketing';
      else if (/\b(human resources|people\s+ops)\b/i.test(lower)) initialData.department = 'Human Resources';
      else if (/\b(finance|accounts)\b/i.test(lower)) initialData.department = 'Finance';
      else if (/\b(operations|ops)\b/i.test(lower)) initialData.department = 'Operations';

      // 3. Location Extraction
      if (/\b(bangalore|bengaluru)\b/i.test(lower)) initialData.location = 'Bangalore, India';
      else if (/\b(hyderabad)\b/i.test(lower)) initialData.location = 'Hyderabad, India';
      else if (/\b(pune)\b/i.test(lower)) initialData.location = 'Pune, India';
      else if (/\b(mumbai)\b/i.test(lower)) initialData.location = 'Mumbai, India';
      else if (/\b(delhi|noida|gurgaon|ncr)\b/i.test(lower)) initialData.location = 'Delhi NCR, India';
      else if (/\b(remote|wfh)\b/i.test(lower)) initialData.location = 'Remote';

      // 4. Openings Extraction
      const digitMatch = lower.match(/\b(\d+)\s*(?:openings|positions|headcount|seats|vacancies)?\b/);
      if (digitMatch) {
        initialData.openings = parseInt(digitMatch[1], 10);
      }

      // 5. Priority Extraction
      if (/\b(urgent|critical|immediate)\b/i.test(lower)) initialData.priority = 'Urgent';
      else if (/\b(high)\b/i.test(lower)) initialData.priority = 'High';

      // 6. Employment Type Extraction
      if (/\b(contract|contractor)\b/i.test(lower)) initialData.employmentType = 'Contract';
      else if (/\b(part[-\s]?time)\b/i.test(lower)) initialData.employmentType = 'Part-Time';
      else if (/\b(full[-\s]?time|permanent)\b/i.test(lower)) initialData.employmentType = 'Full-Time';

      // 7. Budget / Salary Range Extraction
      const rangeMatch = cleanPrompt.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs|lakh|lac|k|inr)?/i);
      if (rangeMatch) {
        let min = parseFloat(rangeMatch[1]);
        if (min < 100) min = min * 100000;
        let max = parseFloat(rangeMatch[2]);
        if (max < 100) max = max * 100000;
        initialData.minSalary = String(Math.round(min));
        initialData.maxSalary = String(Math.round(max));
      }

      // 8. Cost Center Extraction
      const ccMatch = cleanPrompt.match(/\b(CC-?\d{3,5})\b/i);
      if (ccMatch) {
        let cc = ccMatch[1].toUpperCase();
        if (!cc.includes('-')) cc = `CC-${cc.slice(2)}`;
        initialData.costCenter = cc;
      }

      return {
        intent: 'START_REQUISITION_WORKFLOW',
        category: 'workflow',
        workflowType: 'CREATE_REQUISITION',
        initialData,
        confidence: 0.98,
        language: lang
      };
    }

    // 4.4B CREATE JOB DESCRIPTION (JD) CONVERSATIONAL WORKFLOW
    const isCreateJdCmd = (
      /\b(?:create|make|prepare|start|draft|banao|cheyi|cheyandi|karo|kardo)\s+(?:a\s+|an\s+|the\s+|new\s+|one\s+)?(?:jd|job\s+description)\b/i.test(lower) ||
      /\b(?:jd|job\s+description)\s+(?:create|make|prepare|start|draft|banao|cheyi|cheyandi|karo|kardo)\b/i.test(lower) ||
      /\b(?:i\s+want\s+to\s+create|can\s+you\s+create|help\s+me\s+create|okay\s+create|ok\s+create)\s+(?:a\s+|an\s+|the\s+|one\s+|new\s+)?(?:jd|job\s+description)\b/i.test(lower) ||
      /\b(?:new\s+jd|new\s+job\s+description)\b/i.test(lower) ||
      /\bprepare\s+(?:a\s+|the\s+)?jd\b/i.test(lower) ||
      /కొత్త\s+jd|jd\s+క్రియేట్|నయా\s+jd|jd\s+बनाओ|job\s+description\s+बनाओ|jd\s+kosam|jd\s+ke\s+liye/i.test(cleanPrompt)
    ) && !/(?:how\s+(?:do\s+i|to|can\s+i)|what\s+are\s+the\s+steps|explain\s+(?:the\s+)?process)/i.test(lower);

    if (isCreateJdCmd) {
      const initialData = {};

      // 1. Requisition ID Linkage
      const reqIdMatch = cleanPrompt.match(/\b(REQ-\d{4}-\d{3,4}|REQ-\d{3,4})\b/i);
      if (reqIdMatch) {
        initialData.reqId = reqIdMatch[1].toUpperCase();
      } else {
        // Check if context has active requisition or user mentions approved requisition title
        const approvedReqs = (DatabaseService.requisitions || []).filter(r => (r.status || '').toUpperCase() === 'APPROVED');
        if (/approved\s+(?:java|frontend|react|full\s+stack|python|backend|engineer|developer|product|sales)/i.test(lower)) {
          const match = approvedReqs.find(r => {
            const t = (r.title || r.jobTitle || '').toLowerCase();
            if (/java/i.test(lower) && t.includes('java')) return true;
            if (/react|frontend/i.test(lower) && (t.includes('react') || t.includes('frontend'))) return true;
            if (/python/i.test(lower) && t.includes('python')) return true;
            if (/product/i.test(lower) && t.includes('product')) return true;
            return false;
          });
          if (match) {
            initialData.reqId = match.id;
            initialData.title = match.title || match.jobTitle;
            initialData.department = match.department;
            initialData.costCenter = match.costCenter;
          }
        } else if (/the\s+requisition\s+i\s+just\s+created/i.test(lower)) {
          // Resolve most recent requisition
          const allReqs = DatabaseService.requisitions || [];
          if (allReqs.length > 0) {
            const latestReq = allReqs[0];
            initialData.reqId = latestReq.id;
            initialData.title = latestReq.title || latestReq.jobTitle;
            initialData.department = latestReq.department;
          }
        }
      }

      // 2. Title Extraction
      let extractedTitle = null;
      const titleMatchAfter = cleanPrompt.match(/(?:for|role|title)\s+(?:a\s+|the\s+)?([A-Za-z0-9\s.+#]+?)(?:\s+(?:in|with|under|at|experience|summary|responsibilities|skills|,)|$)/i);
      const titleMatchBefore = cleanPrompt.match(/^([A-Za-z0-9\s.+#]+?)(?:\s+(?:ke\s+liye|ki|kosam|for))?\s+(?:jd|job\s+description)/i);
      if (titleMatchAfter && titleMatchAfter[1].trim().length >= 3 && !/\b(approved\s+requisition|our\s+approved|this\s+requisition)\b/i.test(titleMatchAfter[1])) {
        extractedTitle = titleMatchAfter[1].trim();
      } else if (titleMatchBefore && titleMatchBefore[1].trim().length >= 3 && !/\b(create|make|new|open|start|prepare|draft)\b/i.test(titleMatchBefore[1])) {
        extractedTitle = titleMatchBefore[1].trim();
      }

      if (extractedTitle) {
        extractedTitle = extractedTitle.replace(/^\d+\s*/, '').trim();
        extractedTitle = extractedTitle.replace(/Developers$/i, 'Developer').replace(/Engineers$/i, 'Engineer').replace(/Designers$/i, 'Designer');
        const formattedTitle = extractedTitle.replace(/\b\w/g, l => l.toUpperCase());
        initialData.title = formattedTitle;
      }

      // 3. Department Extraction
      if (/\b(engineering|tech|software|information\s+technology|it\s+dept|it\s+department)\b/i.test(lower) && !/\b(developer|engineer)\b/i.test(lower)) initialData.department = 'Engineering';
      else if (/\b(engineering\s+department|engineering\s+dept|under\s+engineering|in\s+engineering)\b/i.test(lower)) initialData.department = 'Engineering';
      else if (/\b(product|pm)\b/i.test(lower) && !/\b(product\s+manager)\b/i.test(lower)) initialData.department = 'Product';
      else if (/\b(product\s+department|under\s+product|in\s+product)\b/i.test(lower)) initialData.department = 'Product';
      else if (/\b(design|ui|ux)\b/i.test(lower) && !/\b(designer)\b/i.test(lower)) initialData.department = 'Design';
      else if (/\b(sales|business development|bd)\b/i.test(lower)) initialData.department = 'Sales';
      else if (/\b(marketing|growth)\b/i.test(lower)) initialData.department = 'Marketing';
      else if (/\b(human resources|people\s+ops)\b/i.test(lower)) initialData.department = 'Human Resources';
      else if (/\b(finance|accounts)\b/i.test(lower)) initialData.department = 'Finance';
      else if (/\b(operations|ops)\b/i.test(lower)) initialData.department = 'Operations';

      // 4. Experience Range Extraction
      const expMatch = cleanPrompt.match(/(?:experience\s*)?(\d+)\s*(?:to|-|–)\s*(\d+)\s*(?:years?|yrs?)/i) ||
                       cleanPrompt.match(/(\d+)\s*(?:to|-|–)\s*(\d+)\s*years?/i);
      if (expMatch) {
        initialData.experienceMin = parseInt(expMatch[1], 10);
        initialData.experienceMax = parseInt(expMatch[2], 10);
      }

      // 5. Summary Extraction
      const summaryMatch = cleanPrompt.match(/summary\s*[:=]\s*([^.\n\r]+(?:\.[^.\n\r]+)?)/i);
      if (summaryMatch) {
        initialData.summary = summaryMatch[1].trim();
      }

      // 6. Responsibilities Extraction
      const respMatch = cleanPrompt.match(/responsibilities\s*[:=]\s*([^.\n\r]+(?:\.[^.\n\r]+)?)/i);
      if (respMatch) {
        initialData.responsibilities = respMatch[1].trim();
      }

      // 7. Mandatory Skills Extraction
      const mandMatch = cleanPrompt.match(/(?:mandatory\s+skills?|must[-\s]have\s+skills?|required\s+skills?)\s*[:=]?\s*([^.\n\r]+)/i);
      if (mandMatch) {
        initialData.mandatorySkills = mandMatch[1].trim();
      }

      // 8. Preferred Skills Extraction
      const prefMatch = cleanPrompt.match(/(?:preferred\s+skills?|nice\s+to\s+have\s+skills?)\s*[:=]?\s*([^.\n\r]+)/i);
      if (prefMatch) {
        initialData.preferredSkills = prefMatch[1].trim();
      }

      // 9. Cost Center Extraction
      const ccMatch = cleanPrompt.match(/\b(CC-?\d{3,5})\b/i);
      if (ccMatch) {
        let cc = ccMatch[1].toUpperCase();
        if (!cc.includes('-')) cc = `CC-${cc.slice(2)}`;
        initialData.costCenter = cc;
      }

      return {
        intent: 'START_JD_WORKFLOW',
        category: 'workflow',
        workflowType: 'CREATE_JD',
        initialData,
        confidence: 0.98,
        language: lang
      };
    }

    // 4.4C EXPLAIN JOB POSTING PROCESS
    if (
      /(?:how\s+(?:do\s+i|to|can\s+i)\s+(?:create|make|publish|post)\s+(?:a\s+)?(?:job\s+)?posting|explain\s+(?:the\s+)?(?:job\s+)?posting\s+process|what\s+are\s+the\s+steps\s+to\s+(?:create|publish)\s+(?:a\s+)?(?:job\s+)?posting)/i.test(lower) ||
      /(?:job\s+posting|posting)\s+(?:process|steps|ela\s+create|kaise\s+kare|kaise\s+banaye)/i.test(lower) ||
      /జాబ్\s+పోస్టింగ్\s+ఎలా|job\s+posting\s+कैसे\s+बनाएं/i.test(cleanPrompt)
    ) {
      return {
        intent: 'EXPLAIN_JOB_POSTING',
        category: 'explanation',
        confidence: 0.98,
        language: lang
      };
    }

    // 4.4D CREATE & PUBLISH JOB POSTING CONVERSATIONAL WORKFLOW
    const isCreatePostingCmd = (
      /\b(?:create|make|prepare|start|draft|post|publish|banao|cheyi|cheyandi|karo|kardo)\s+.*?(?:job\s+posting|job\s+post|posting)\b/i.test(lower) ||
      /\b(?:job\s+posting|job\s+post|posting)\s+.*?(?:create|make|prepare|start|draft|post|publish|banao|cheyi|cheyandi|karo|kardo)\b/i.test(lower) ||
      /\b(?:i\s+want\s+to\s+create|can\s+you\s+create|help\s+me\s+create|okay\s+create|ok\s+create)\s+.*?(?:job\s+posting|job\s+post|posting)\b/i.test(lower) ||
      /\b(?:post\s+this\s+jd|prepare\s+this\s+job\s+for\s+publishing|create\s+and\s+publish\s+this\s+job|create\s+posting\s+for\s+this\s+jd|post\s+this\s+job)\b/i.test(lower) ||
      /\b(?:publish|post)\s+(?:this\s+|the\s+)?(?:approved\s+)?(?:java|frontend|react|python|backend|engineer|developer|designer|product|sales)\s+(?:jd|job|posting)\b/i.test(lower) ||
      /జాబ్\s+పోస్టింగ్|జాబ్\s+పోస్ట్|job\s+posting\s+बनाओ|job\s+posting\s+create|posting\s+క్రియేట్|posting\s+banao/i.test(cleanPrompt) ||
      /(?:jd|job)\s+(?:ni\s+|ko\s+)?.*?(?:linkedin|naukri|indeed|careers|glassdoor).*?(?:publish|post)\s*(?:cheyi|cheyyi|karo|kardo|karein)/i.test(lower) ||
      /(?:is|ee|e|ye)\s+jd\s+(?:ko|ni|lo|me|pe|par)?.*?(?:publish|post)\s*(?:cheyi|cheyyi|karo|kardo)/i.test(lower) ||
      /ఈ\s+jd\s+.*(?:publish|చేయి|పోస్ట్)/i.test(cleanPrompt) ||
      /इस\s+jd\s+.*(?:publish|पोस्ट|करो)/i.test(cleanPrompt)
    ) && !/(?:how\s+(?:do\s+i|to|can\s+i)|what\s+are\s+the\s+steps|explain\s+(?:the\s+)?process)/i.test(lower);

    if (isCreatePostingCmd) {
      const initialData = {};

      // 1. Linked JD extraction
      const jdIdMatch = cleanPrompt.match(/\b(JD-\d{4}-\d{3,4}|JD-\d{3,4})\b/i);
      if (jdIdMatch) {
        initialData.jdId = jdIdMatch[1].toUpperCase();
      } else {
        // Resolve from DatabaseService.jds
        const approvedJds = (DatabaseService.jds || []).filter(j => (j.status || '').toUpperCase() === 'APPROVED' || (j.status || '').toUpperCase() === 'PUBLISHED');
        if (/java/i.test(lower)) {
          const match = approvedJds.find(j => (j.title || '').toLowerCase().includes('java')) || (DatabaseService.jds || []).find(j => (j.title || '').toLowerCase().includes('java'));
          if (match) {
            initialData.jdId = match.id;
            initialData.title = match.title;
            initialData.department = match.department;
            initialData.reqId = match.reqId || match.requisitionId;
          }
        } else if (/react|frontend/i.test(lower)) {
          const match = approvedJds.find(j => (j.title || '').toLowerCase().includes('react') || (j.title || '').toLowerCase().includes('frontend'));
          if (match) {
            initialData.jdId = match.id;
            initialData.title = match.title;
            initialData.department = match.department;
          }
        } else if (referencedJd) {
          initialData.jdId = referencedJd.id;
          initialData.title = referencedJd.title;
          initialData.department = referencedJd.department;
        } else if (context?.activeEntity?.id?.startsWith('JD')) {
          initialData.jdId = context.activeEntity.id;
          initialData.title = context.activeEntity.title;
        }
      }

      // 2. Location extraction
      if (/\b(bangalore|bengaluru)\b/i.test(lower)) initialData.location = 'Bangalore, India';
      else if (/\b(hyderabad)\b/i.test(lower)) initialData.location = 'Hyderabad, India';
      else if (/\b(remote|wfh)\b/i.test(lower)) initialData.location = 'Remote';
      else if (/\b(mumbai)\b/i.test(lower)) initialData.location = 'Mumbai, India';
      else if (/\b(chennai)\b/i.test(lower)) initialData.location = 'Chennai, India';
      else if (/\b(pune)\b/i.test(lower)) initialData.location = 'Pune, India';

      // 3. Employment type
      if (/\b(full[-\s]time)\b/i.test(lower)) initialData.employmentType = 'Full-time';
      else if (/\b(part[-\s]time)\b/i.test(lower)) initialData.employmentType = 'Part-time';
      else if (/\b(contract)\b/i.test(lower)) initialData.employmentType = 'Contract';

      // 4. Channels extraction
      if (/\b(linkedin|naukri|indeed|careers|glassdoor|referral|mobility|all\s+channels|everywhere)\b/i.test(lower)) {
        initialData.channels = AIPublishingAdapter.resolveChannels(cleanPrompt);
      }

      // 5. Expiration / Duration
      const daysMatch = lower.match(/(\d+)\s*days?/);
      if (daysMatch) {
        initialData.durationDays = parseInt(daysMatch[1], 10);
      }

      if (initialData.jdId) {
        DatabaseService.init();
        const linkedJd = (DatabaseService.jds || []).find(j => j.id === initialData.jdId);
        if (linkedJd) {
          if (!initialData.title) initialData.title = linkedJd.title;
          if (!initialData.department) initialData.department = linkedJd.department;
          if (!initialData.reqId) initialData.reqId = linkedJd.reqId || linkedJd.requisitionId || 'REQ-2026-0001';
          if (initialData.channels || initialData.location || /\b(everywhere|all\s+channels|linkedin|naukri|in\s+bangalore|create\s+and\s+publish)\b/i.test(lower) || /JD-\d{4}-\d+/i.test(cleanPrompt)) {
            if (!initialData.summary) initialData.summary = linkedJd.summary || 'Building high-throughput enterprise cloud platforms.';
            if (!initialData.applicationMethod) initialData.applicationMethod = 'Direct Web Form';
            if (!initialData.location) initialData.location = linkedJd.location || 'Bangalore, India';
            if (!initialData.channels) initialData.channels = ['careers_portal', 'linkedin', 'naukri', 'indeed'];
          }
        }
      }

      const autoPublish = /\b(publish|post\s+it|post\s+to|publish\s+cheyyi|publish\s+karo|post\s+karo|post\s+cheyi|post\b)\b/i.test(lower) || /చేయి|పోస్ట్|करो/i.test(cleanPrompt);

      return {
        intent: 'START_JOB_POSTING_WORKFLOW',
        category: 'workflow',
        workflowType: 'CREATE_JOB_POSTING',
        initialData,
        autoPublish,
        confidence: 0.98,
        language: lang
      };
    }

    // 4.4F CREATE CANDIDATE FROM RESUME CONVERSATIONAL WORKFLOW (PHASE 4)
    const isCreateCandidateCmd = (
      /\b(?:create|add|make|start|banao|cheyi|cheyandi|karo|kardo|intake|ingest)\s+.*?(?:candidate|applicant)\b/i.test(lower) ||
      /\b(?:candidate|applicant)\s+.*?(?:create|add|make|banao|cheyi|cheyandi|karo|kardo|intake|ingest)\b/i.test(lower) ||
      /\b(?:upload\s+(?:candidate\s+|this\s+|the\s+)?resume|upload\s+resume|add\s+this\s+cv|use\s+this\s+resume|create\s+from\s+this\s+resume|create\s+candidate\s+from\s+this|add\s+(?:a\s+)?candidate\s+from\s+(?:a\s+)?resume)\b/i.test(lower) ||
      /\b(?:parse\s+(?:this\s+|the\s+)?(?:resume|cv)|extract\s+(?:the\s+)?details\s+from\s+(?:this\s+|the\s+)?(?:resume|cv)|extract\s+candidate\s+details|resume\s+details\s+extract)\b/i.test(lower) ||
      /\b(?:add\s+him\s+to|add\s+her\s+to|add\s+them\s+to|apply\s+this\s+candidate\s+to|link\s+this\s+resume\s+to)\b/i.test(lower) ||
      /\b(?:create\s+one|okay\s+create\s+one|ok\s+create\s+one)\b/i.test(lower) && context?.lastIntent === 'EXPLAIN_CANDIDATE_INTAKE_STEPS' ||
      /రెజ్యూమ్.*క్యాండిడేట్|candidate\s+క్రియేట్|candidate\s+बनाओ|resume.*candidate|రెజ్యూమ్.*extract|resume.*extract.*karo|resume.*extract.*cheyi/i.test(cleanPrompt) ||
      /(?:ee|is|ye)\s+resume.*?(?:candidate|requisition).*?(?:cheyi|cheyyi|banao|karo|kardo)/i.test(lower) ||
      /([A-Z][a-z]+)\s+ni\s+.*?requisition.*?(?:add|cheyi|cheyyi)/i.test(cleanPrompt)
    ) && !/(?:how\s+(?:do\s+i|to|can\s+i)|what\s+are\s+the\s+steps|explain\s+(?:the\s+)?process)/i.test(lower);

    if (isCreateCandidateCmd) {
      const initialData = {};

      // 1. Candidate Name Extraction from Prompt
      let extractedName = null;
      const nameMatch1 = cleanPrompt.match(/(?:create|add)\s+([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,2})(?:\s+(?:as\s+a\s+candidate|as\s+candidate|from\s+this|from\s+resume|to\s+this|to\s+the|for\s+the|and\s+add))/i);
      const nameMatch2 = cleanPrompt.match(/^([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,2})\s+(?:ni|ko)\s+.*?requisition/i);
      if (nameMatch1 && nameMatch1[1].trim().length >= 3 && !/\b(candidate|a\s+candidate|one|resume|cv)\b/i.test(nameMatch1[1])) {
        extractedName = nameMatch1[1].trim();
      } else if (nameMatch2 && nameMatch2[1].trim().length >= 3) {
        extractedName = nameMatch2[1].trim();
      }

      if (extractedName) {
        initialData.candidateName = extractedName.replace(/\b\w/g, l => l.toUpperCase());
      }

      // 2. Requisition Linkage Extraction from Prompt
      const reqIdMatch = cleanPrompt.match(/\b(REQ-\d{4}-\d{3,4}|REQ-\d{3,4})\b/i);
      if (reqIdMatch) {
        initialData.requisitionId = reqIdMatch[1].toUpperCase();
      } else {
        // Match Requisition by title
        DatabaseService.init();
        const reqs = DatabaseService.requisitions || [];
        if (/java/i.test(lower)) {
          const match = reqs.find(r => (r.title || r.jobTitle || '').toLowerCase().includes('java'));
          initialData.requisitionId = match ? match.id : 'REQ-2026-001';
        } else if (/react|frontend/i.test(lower)) {
          const match = reqs.find(r => (r.title || r.jobTitle || '').toLowerCase().includes('react') || (r.title || r.jobTitle || '').toLowerCase().includes('frontend'));
          initialData.requisitionId = match ? match.id : 'REQ-2026-002';
        } else if (context?.activeEntity?.id?.startsWith('REQ')) {
          initialData.requisitionId = context.activeEntity.id;
        }
      }

      // 3. Email & Phone if present
      const emailMatch = cleanPrompt.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i);
      if (emailMatch) {
        initialData.email = emailMatch[0].toLowerCase();
      }

      const phoneMatch = cleanPrompt.match(/(?:\+?91[\s.-]?)?[6-9]\d{9}\b/) || cleanPrompt.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
      if (phoneMatch) {
        initialData.phone = phoneMatch[0].trim();
      }

      // 4. Attached / Context File
      if (context.file || context.activeFile) {
        initialData.resumeFile = context.file || context.activeFile;
      }

      return {
        intent: 'START_CANDIDATE_INTAKE_WORKFLOW',
        category: 'workflow',
        workflowType: 'CREATE_CANDIDATE_FROM_RESUME',
        initialData,
        confidence: 0.98,
        language: lang
      };
    }

    // 4.5 UPDATE CANDIDATE CONTACT
    if (
      /change\s+(his|her|candidate('s)?)\s+(email|phone|contact|number|location)/i.test(lower) ||
      /update\s+(his|her|candidate('s)?)\s+(email|phone|contact|number|location)/i.test(lower) ||
      /(phone|email)\s+change\s+(cheyi|karo)/i.test(lower)
    ) {
      const cand = referencedCandidate || AIContextService.resolveContextualEntity('candidate') || DatabaseService.candidates?.[0];
      const emailMatch = cleanPrompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = cleanPrompt.match(/(\+?\d[\d\s-]{8,15})/);

      return {
        intent: 'UPDATE_CANDIDATE',
        category: 'action',
        toolName: 'updateCandidateContact',
        params: {
          candidateId: cand?.id || 'CND-1001',
          email: emailMatch ? emailMatch[0] : undefined,
          phone: phoneMatch ? phoneMatch[0] : undefined
        },
        entity: cand,
        confidence: 0.91,
        language: lang
      };
    }

    // 4.6 SEND SIMULATED EMAIL
    if (
      /send\s+(the\s+)?(interview\s+)?email/i.test(lower) ||
      /email\s+(the\s+)?candidate/i.test(lower) ||
      /send\s+(the\s+)?offer\s+letter/i.test(lower) ||
      /mail\s+(pampu|bhejo|send\s+cheyi)/i.test(lower)
    ) {
      const cand = referencedCandidate || AIContextService.resolveContextualEntity('candidate') || DatabaseService.candidates?.[0];
      return {
        intent: 'SEND_INTERVIEW_EMAIL',
        category: 'action',
        toolName: 'sendSimulatedEmail',
        params: {
          recipient: cand?.email || 'candidate@example.com',
          subject: 'PeopleWorks ATS: Interview Schedule & Preparation Guidelines',
          body: `Dear ${cand?.candidateName || 'Candidate'},\n\nYour interview has been confirmed. Please review your meeting details.\n\nBest regards,\nPeopleWorks Talent Acquisition`
        },
        entity: cand,
        confidence: 0.9,
        language: lang
      };
    }

    // 4.7 SEARCH CANDIDATES
    if (
      /find\s+candidates?/i.test(lower) ||
      /show\s+candidates?\s+with/i.test(lower) ||
      /search\s+candidates?/i.test(lower) ||
      /candidates\s+ni\s+chupinchu/i.test(lower) ||
      /candidates\s+dikhao/i.test(lower)
    ) {
      const skills = [];
      if (/react/i.test(lower)) skills.push('React');
      if (/java\b/i.test(lower)) skills.push('Java');
      if (/node/i.test(lower)) skills.push('Node.js');
      if (/python/i.test(lower)) skills.push('Python');

      return {
        intent: 'GET_CANDIDATE_COUNT',
        category: 'query',
        toolName: 'searchCandidates',
        params: {
          query: cleanPrompt.replace(/find|candidates|show|with|search/gi, '').trim(),
          skills
        },
        confidence: 0.88,
        language: lang
      };
    }

    // 4.8 GENERATE INTERVIEW QUESTIONS
    if (
      /generate\s+(interview\s+)?questions/i.test(lower) ||
      /suggest\s+questions\s+for/i.test(lower) ||
      /questions\s+adigeyi/i.test(lower)
    ) {
      return {
        intent: 'generate_questions',
        category: 'action',
        toolName: 'generateInterviewQuestions',
        params: {
          roleTitle: 'Senior Full Stack Engineer',
          skills: ['React', 'Node.js', 'System Design']
        },
        confidence: 0.9,
        language: lang
      };
    }

    // 4.9 EXPLAIN WORKFLOW BLOCKER
    if (
      /why\s+can't\s+i\s+(approve|publish|move)/i.test(lower) ||
      /what\s+is\s+blocking/i.test(lower) ||
      /why\s+is\s+(this\s+)?requisition\s+pending/i.test(lower)
    ) {
      return {
        intent: 'explain_blocker',
        category: 'explanation',
        toolName: 'explainWorkflowBlocker',
        params: {
          entityType: 'requisition',
          entityId: referencedReq?.id || 'REQ-2026-001'
        },
        confidence: 0.91,
        language: lang
      };
    }

    // =============================================================
    // 5. FALLBACK GENERAL CONVERSATIONAL / INQUIRY
    // =============================================================
    return {
      intent: 'GENERAL_CONVERSATION',
      category: 'general',
      prompt: cleanPrompt,
      confidence: 0.75,
      language: lang
    };
  }

  // --- Entity Extractor Helpers ---

  static _extractCandidateReference(text, context) {
    const raw = safeString(text);
    const lower = normalizeText(raw);
    const candidates = DatabaseService.candidates || [];

    // 1. Direct DB candidate match
    for (const c of candidates) {
      const name = normalizeText(c.candidateName || c.name || '');
      const first = name.split(' ')[0];
      if (first && first.length > 2 && lower.includes(first)) {
        AIMemoryService.setLastMentionedEntity('candidate', c);
        return c;
      }
    }

    // 2. Pronoun / Contextual match ("he", "him", "his", "her", "this candidate")
    if (/\b(he|him|his|her|she|this candidate|that candidate|the candidate|this resume|the resume|this cv)\b/i.test(lower)) {
      return AIContextService.resolveContextualEntity('candidate') || AIMemoryService.getLastMentionedEntity('candidate');
    }

    // 3. Named extraction from natural screening / scheduling commands (e.g. "screen Rahul", "screen Rahul against this JD", "Rahul resume ni screen cheyyi")
    const match = raw.match(/(?:screen|evaluate|check|schedule)\s+([A-Z][a-z]+|[a-z]+)/i) ||
                  raw.match(/([A-Z][a-z]+|[a-z]+)(?:\s+resume|\s+interview)?\s+(?:ni|ko)\s+(?:screen|schedule)/i);

    if (match) {
      const extracted = match[1].trim();
      const extractedLower = normalizeText(extracted);
      const nonCandidateWords = [
        'candidates', 'candidate', 'resume', 'resumes', 'profile', 'profiles',
        'the', 'this', 'that', 'these', 'those', 'all', 'shortlisted', 'active',
        'any', 'my', 'our', 'new', 'an', 'a', 'jd', 'job', 'requisition', 'round',
        'tomorrow', 'today', 'interview', 'interviews'
      ];
      if (!nonCandidateWords.includes(extractedLower) && extracted.length >= 2) {
        const capitalized = extracted.charAt(0).toUpperCase() + extracted.slice(1);
        const synthesized = {
          id: 'CND-1002',
          candidateName: capitalized,
          name: capitalized
        };
        AIMemoryService.setLastMentionedEntity('candidate', synthesized);
        return synthesized;
      }
    }

    return null;
  }

  static _extractJdReference(text, context) {
    const lower = normalizeText(text);
    const jds = DatabaseService.jds || [];

    // Direct JD-XXXX match
    const match = lower.match(/jd-\d+/i);
    if (match) {
      const found = jds.find(j => normalizeText(j.id) === normalizeText(match[0]));
      if (found) return found;
    }

    if (/\b(this jd|the jd|this job description|approved jd)\b/i.test(lower)) {
      return AIContextService.resolveContextualEntity('jd') || jds[0] || null;
    }

    return null;
  }

  static _extractRequisitionReference(text, context) {
    const lower = normalizeText(text);
    const reqs = DatabaseService.requisitions || [];
    const match = lower.match(/req-\d+/i) || lower.match(/req-2026-\d+/i);
    if (match) {
      const found = reqs.find(r => normalizeText(r.id) === normalizeText(match[0]));
      if (found) return found;
    }
    return AIContextService.resolveContextualEntity('requisition') || reqs[0] || null;
  }

  static _extractHonorific(lowerText = '') {
    const text = normalizeText(lowerText);
    if (/\bthambi\b/i.test(text)) return 'thambi';
    if (/\bmama\b/i.test(text) || /మామా/i.test(text)) return 'mama';
    if (/\bbro\b/i.test(text)) return 'bro';
    if (/\bbhai\b/i.test(text) || /भाई/i.test(text)) return 'bhai';
    if (/\banna\b/i.test(text)) return 'anna';
    if (/\bmacha\b/i.test(text)) return 'macha';
    if (/\bdost\b/i.test(text)) return 'dost';
    if (/\bji\b/i.test(text)) return 'ji';
    return null;
  }
}
