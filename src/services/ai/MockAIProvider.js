/**
 * Mock / Local AI Provider Implementation
 * Simulates an enterprise-grade LLM Agent using local deterministic heuristics,
 * multi-intent natural language understanding, tool execution, and rich response formatting.
 */

import { AIProvider } from './AIProvider.js';
import { AIIntentEngine } from './AIIntentEngine.js';
import { AIToolExecutor } from './AIToolExecutor.js';
import { AIResponseFormatter } from './AIResponseFormatter.js';
import { AIMemoryService } from './AIMemoryService.js';
import { WorkflowRegistry } from './workflow/WorkflowRegistry.js';
import { normalizeText, safeString } from './AINormalizer.js';

export class MockAIProvider extends AIProvider {
  constructor() {
    super('PeopleWorks Local AI Engine (Mock)');
  }

  /**
   * Generates conversational completion and handles tool execution
   */
  async generateCompletion({ prompt, history = [], context = {}, tools = [], onStream = null }) {
    // 1. Simulate asynchronous latency for realistic feel
    await new Promise(r => setTimeout(r, 60));

    // 2. Parse User Intent & Detect Language safely
    const intentResult = AIIntentEngine.parseIntent(prompt, context);
    const lang = intentResult.language || 'en';

    // 3. Handle Conversational Workflows (e.g. Requisition Creation)
    if (intentResult.intent === 'WORKFLOW_TURN') {
      const session = WorkflowRegistry.getActiveSession();
      if (session) {
        const workflow = WorkflowRegistry.getWorkflow(session.type);
        if (workflow) {
          const result = await workflow.processTurn(session, prompt, { ...context, language: lang });
          if (session.isCompleted() || session.isCancelled()) {
            WorkflowRegistry.clearActiveSession();
          }
          return {
            text: result.text,
            cards: result.cards || [],
            toolCalls: result.toolCalls || [],
            intent: intentResult
          };
        }
      }
    }

    if (intentResult.intent === 'START_REQUISITION_WORKFLOW') {
      const session = WorkflowRegistry.startSession('CREATE_REQUISITION', intentResult.initialData || {});
      const workflow = WorkflowRegistry.getWorkflow('CREATE_REQUISITION');
      if (workflow) {
        const result = await workflow.processTurn(session, prompt, { ...context, language: lang });
        if (session.isCompleted() || session.isCancelled()) {
          WorkflowRegistry.clearActiveSession();
        }
        return {
          text: result.text,
          cards: result.cards || [],
          toolCalls: result.toolCalls || [],
          intent: intentResult
        };
      }
    }

    if (intentResult.intent === 'START_JD_WORKFLOW') {
      const session = WorkflowRegistry.startSession('CREATE_JD', intentResult.initialData || {});
      const workflow = WorkflowRegistry.getWorkflow('CREATE_JD');
      if (workflow) {
        const result = await workflow.processTurn(session, prompt, { ...context, language: lang });
        if (session.isCompleted() || session.isCancelled()) {
          WorkflowRegistry.clearActiveSession();
        }
        return {
          text: result.text,
          cards: result.cards || [],
          toolCalls: result.toolCalls || [],
          intent: intentResult
        };
      }
    }

    if (intentResult.intent === 'START_JOB_POSTING_WORKFLOW') {
      const session = WorkflowRegistry.startSession('CREATE_JOB_POSTING', intentResult.initialData || {});
      session.autoPublish = intentResult.autoPublish !== false;
      const workflow = WorkflowRegistry.getWorkflow('CREATE_JOB_POSTING');
      if (workflow) {
        const result = await workflow.processTurn(session, prompt, { ...context, language: lang });
        if (session.isCompleted() || session.isCancelled()) {
          WorkflowRegistry.clearActiveSession();
        }
        return {
          text: result.text,
          cards: result.cards || [],
          toolCalls: result.toolCalls || [],
          intent: intentResult
        };
      }
    }

    if (intentResult.intent === 'START_CANDIDATE_INTAKE_WORKFLOW') {
      const session = WorkflowRegistry.startSession('CREATE_CANDIDATE_FROM_RESUME', intentResult.initialData || {});
      const workflow = WorkflowRegistry.getWorkflow('CREATE_CANDIDATE_FROM_RESUME');
      if (workflow) {
        const result = await workflow.processTurn(session, prompt, { ...context, language: lang });
        if (session.isCompleted() || session.isCancelled()) {
          WorkflowRegistry.clearActiveSession();
        }
        return {
          text: result.text,
          cards: result.cards || [],
          toolCalls: result.toolCalls || [],
          intent: intentResult
        };
      }
    }

    // 4. If an actionable ATS tool is matched, execute it
    if (intentResult.toolName) {
      const toolExecution = await AIToolExecutor.execute(intentResult.toolName, intentResult.params, context.user);
      const formatted = AIResponseFormatter.formatResult(intentResult.toolName, toolExecution, lang, prompt);

      return {
        text: formatted.text,
        cards: formatted.cards || [],
        toolCalls: [
          { name: intentResult.toolName, params: intentResult.params, result: toolExecution }
        ],
        intent: intentResult
      };
    }

    // 4. Handle conversational, capability, or informational queries
    const replyText = this._generateGeneralReply(prompt, intentResult, lang, context);

    return {
      text: replyText,
      cards: [],
      toolCalls: [],
      intent: intentResult
    };
  }

  _generateGeneralReply(prompt, intentResult, lang, context) {
    const rawPrompt = safeString(prompt);
    const p = normalizeText(rawPrompt);
    const intent = intentResult?.intent;
    const honorific = intentResult?.honorific;

    // 4.0 SCREEN CANDIDATES CLARIFICATION / MISSING PARAMETER
    if (intent === 'SCREEN_CANDIDATES' || intentResult?.clarificationNeeded) {
      const jd = intentResult?.jdContext || context?.activeEntity;
      if (jd && (jd.title || jd.id?.startsWith('JD'))) {
        const jdTitle = jd.title || jd.id;
        if (lang === 'te') {
          return `తప్పకుండా. నేను ప్రస్తుత JD (${jdTitle}) కి అభ్యర్థులను స్క్రీన్ చేయగలను. మీరు ఏ అభ్యర్థిని స్క్రీన్ చేయాలనుకుంటున్నారు? (ఉదా: 'Screen Rahul')`;
        }
        if (lang === 'hi') {
          return `ज़रूर। मैं वर्तमान JD (${jdTitle}) के लिए उम्मीदवारों की स्क्रीनिंग कर सकता हूँ। आप किस उम्मीदवार को स्क्रीन करना चाहते हैं? (जैसे: 'Screen Rahul')`;
        }
        return `Sure. I can screen candidates against the current JD (${jdTitle}). Which candidate would you like me to screen? You can specify a name (e.g. 'Screen Rahul') or choose from the candidate list.`;
      }

      if (lang === 'te') {
        return `తప్పకుండా! మీరు ఏ అభ్యర్థులను స్క్రీన్ చేయాలనుకుంటున్నారు? దయచేసి అభ్యర్థి పేరును పేర్కొనండి (ఉదా: 'Screen Rahul') లేదా రెజ్యూమ్‌ను అప్‌లోడ్ చేయండి.`;
      }
      if (lang === 'hi') {
        return `ज़रूर! आप किन उम्मीदवारों को स्क्रीन करना चाहते हैं? कृपया उम्मीदवार का नाम बताएं (जैसे: 'Screen Rahul') या रिज्यूम अपलोड करें।`;
      }
      return `Sure. Which candidates would you like me to screen? You can specify a candidate's name (e.g., 'Screen Rahul') or select a candidate and JD to evaluate match scores.`;
    }

    // 4.1 HOW ARE YOU / WELLBEING INTENT
    if (
      intent === 'GENERAL_CONVERSATION' && (
        p.includes('ela unnav') || p.includes('kaise ho') || p.includes('how are you') ||
        /ఎలా\s+ఉన్నా/i.test(rawPrompt) || /कैसे\s+हो/i.test(rawPrompt)
      )
    ) {
      // 4.1.1 Native Telugu Script
      if (/[\u0C00-\u0C7F]/.test(rawPrompt)) {
        if (honorific === 'mama' || rawPrompt.includes('మామా')) {
          return `బాగున్నాను మామా! 😊\nమీరు ఎలా ఉన్నారు? PeopleWorks లో ఏం సహాయం కావాలి?`;
        }
        return `బాగున్నాను 😊\nమీరు ఎలా ఉన్నారు? PeopleWorks లో ఏం సహాయం కావాలి?`;
      }

      // 4.1.2 Native Devanagari (Hindi) Script
      if (/[\u0900-\u097F]/.test(rawPrompt)) {
        if (honorific === 'bhai' || honorific === 'mama' || rawPrompt.includes('मामा') || rawPrompt.includes('भाई')) {
          return `मैं बढ़िया हूँ भाई! 😊\nPeopleWorks में मैं आपकी कैसे मदद करूँ?`;
        }
        return `मैं बढ़िया हूँ 😊\nPeopleWorks में मैं आपकी कैसे मदद करूँ?`;
      }

      // 4.1.3 Transliterated Telugu / Tenglish
      if (lang === 'te' || honorific === 'thambi' || honorific === 'mama' || honorific === 'anna') {
        if (honorific === 'thambi') {
          return `Nenu bagunnanu thambi! 😊\nMeeru ela unnaru? PeopleWorks AI lo em help kavali?`;
        }
        if (honorific === 'mama' || p.includes('mama')) {
          return `Hey mama! Nenu bagunnanu 😊\nMeeru ela unnaru? PeopleWorks AI lo em help kavali?`;
        }
        return `Nenu bagunnanu 😊\nMeeru ela unnaru? PeopleWorks AI lo em help kavali?`;
      }

      // 4.1.4 Transliterated Hindi / Hinglish
      if (lang === 'hi' || honorific === 'bhai') {
        if (honorific === 'bhai' || honorific === 'mama') {
          return `Main badhiya hoon bhai! 😊\nPeopleWorks me main aapki kaise madad karun?`;
        }
        return `Main badhiya hoon 😊\nPeopleWorks me main aapki kaise madad karun?`;
      }

      // 4.1.5 English
      if (honorific === 'bro') {
        return `Hey bro! I'm doing great 😊\nHow can I help you with PeopleWorks today?`;
      }
      return `I'm doing great! 😊\nHow can I help you with PeopleWorks today?`;
    }

    // 4.2 GREETING INTENT (Hello, Hi, Hey, Namaste, Hello thambi, Good morning, etc.)
    if (intent === 'GENERAL_GREETING') {
      // Time-based greetings
      if (p.includes('good morning')) {
        return `Good morning! ☀️\nHow can I help you with PeopleWorks today?`;
      }
      if (p.includes('good afternoon') || p.includes('good evening')) {
        return `Good evening! 🌆\nHow can I help you with PeopleWorks today?`;
      }

      // Native Telugu Script
      if (/[\u0C00-\u0C7F]/.test(rawPrompt)) {
        return `నమస్కారం! 😊\nనేను మీకు ఎలా సహాయపడగలను?`;
      }

      // Native Hindi Script
      if (/[\u0900-\u097F]/.test(rawPrompt)) {
        return `नमस्ते! 👋\nPeopleWorks AI में मैं आपकी कैसे मदद करूँ?`;
      }

      // Honorific-specific greetings
      if (honorific === 'thambi' || p.includes('thambi')) {
        return `Hello thambi! 😊\nEla unnaru? PeopleWorks AI lo em help kavali?`;
      }
      if (honorific === 'mama' || p.includes('mama')) {
        return `Hey mama! 👋\nEla unnaru? PeopleWorks AI lo em help kavali?`;
      }
      if (honorific === 'bhai' || p.includes('bhai')) {
        return `Hello bhai! 👋\nPeopleWorks me main aapki kaise madad karun?`;
      }
      if (honorific === 'bro' || p.includes('bro')) {
        return `Hey bro! 👋\nHow can I help you today?`;
      }

      if (lang === 'te') {
        return `Namaskaram! 😊\nEla unnaru? PeopleWorks AI lo em help kavali?`;
      }
      if (lang === 'hi') {
        return `Namaste! 👋\nPeopleWorks AI me main aapki kaise madad karun?`;
      }

      return `Hello! 👋\nHow can I help you today?`;
    }

    // 4.3 THANKS & APPRECIATION
    if (intent === 'GENERAL_CONVERSATION' && (p.includes('thank') || p.includes('dhanya') || p.includes('shukriya'))) {
      if (/[\u0C00-\u0C7F]/.test(rawPrompt)) {
        return `మీకు స్వాగతం! 😊 ఇంకా ఏదైనా సహాయం కావాలా?`;
      }
      if (/[\u0900-\u097F]/.test(rawPrompt)) {
        return `आपका स्वागत है! 😊 क्या आपको किसी और चीज़ में सहायता चाहिए?`;
      }
      if (lang === 'te') {
        return `You're welcome! 😊 Inka emaina help kavala?`;
      }
      if (lang === 'hi') {
        return `Aapka swagat hai! 😊 Kuch aur help chahiye kya?`;
      }
      return `You're very welcome! 😊 Let me know if you need any assistance across the ATS.`;
    }

    // 4.4 FAREWELLS & GOODBYES
    if (intent === 'GENERAL_CONVERSATION' && (p.includes('bye') || p.includes('night') || p.includes('cya'))) {
      if (p.includes('night')) {
        return `Good night! 🌙 Have a restful evening and see you tomorrow!`;
      }
      return `Goodbye! 👋 Have a wonderful day ahead with PeopleWorks ATS!`;
    }

    // 4.5 CHIT-CHAT / FEELINGS / IDENTITY / JOKES
    if (intent === 'GENERAL_CONVERSATION') {
      if (p.includes('tired') || p.includes('thak') || p.includes('neerasam')) {
        return `Take a quick breath and relax! 😊 Let me handle the heavy lifting for your recruiting tasks—like screening resumes, scheduling interviews, or reviewing approvals. Just tell me what to do!`;
      }
      if (p.includes('joke') || p.includes('laugh') || p.includes('chutkula')) {
        return `Why did the developer go broke? Because they used up all their cache! 😄\n\nNow, how can I assist with your recruitment pipeline today?`;
      }
      if (p.includes('who are you') || p.includes('about yourself') || p.includes('evaru') || p.includes('kaun ho')) {
        return `I am the **PeopleWorks ATS AI Copilot**, an intelligent, context-aware hiring assistant built right into your recruiting platform. I help talent acquisition teams draft JDs, schedule multi-round interviews, screen resumes, create requisitions, and audit recruiting workflows seamlessly.`;
      }
    }

    // 4.6 ATS CAPABILITY EXPLANATION
    if (intent === 'CAPABILITY_QUERY' || p.includes('what can you do') || p.includes('capabilities') || p.includes('features')) {
      return `I can help with PeopleWorks tasks such as:
• Create and update requisitions
• Create, approve and publish JDs
• Upload and analyze resumes
• Screen candidates
• Schedule interviews
• Run AI interviews
• Manage candidate information
• Prepare offers
• Answer recruitment questions
• Provide recruitment analytics

You can simply ask me in natural language.`;
    }

    // 4.7 ATS REQUISITION WORKFLOW STEPS EXPLANATION
    if (intent === 'EXPLAIN_REQUISITION_STEPS') {
      if (lang === 'te') {
        return `PeopleWorks ATS లో Job Requisition సృష్టించే దశలు:

1. **ప్రాథమిక వివరాలు:** జాబ్ టైటిల్, డిపార్ట్‌మెంట్, లొకేషన్ మరియు ఓపెనింగ్స్ సంఖ్య నమోదు చేయండి.
2. **ఉద్యోగ రకం & బడ్జెట్:** Full-Time/Contract, అనుభవం మరియు జీతం బడ్జెట్‌ను పేర్కొనండి.
3. **ఆమోద ప్రక్రియ (Approvals):** మేనేజర్ మరియు ఫైనాన్స్ ఆమోదం కోసం పంపండి.
4. **JD లింక్:** ఆమోదం తర్వాత JD తో లింక్ చేసి రిక్రూట్‌మెంట్ ప్రారంభించండి.

👉 *మీ కోసం కొత్త Requisition సృష్టించడం ప్రారంభించమంటారా?*`;
      }
      if (lang === 'hi') {
        return `PeopleWorks ATS में Job Requisition बनाने की चरणबद्ध प्रक्रिया:

1. **बुनियादी विवरण:** जॉब टाइटल, विभाग (Department), स्थान (Location) और ओपनिंग्स की संख्या दर्ज करें।
2. **पद विवरण और बजट:** Full-Time/Contract, अनुभव और वेतन सीमा (Budget) तय करें।
3. **स्वीकृति (Approvals):** हायरिंग मैनेजर और फाइनेंस से अनुमोदन प्राप्त करें।
4. **JD लिंकेज:** स्वीकृति मिलने के बाद JD से लिंक करें और भर्ती शुरू करें।

👉 *क्या आप चाहते हैं कि मैं आपके लिए एक नई Requisition बनाना शुरू करूँ?*`;
      }
      return `Here is the step-by-step process to create a Job Requisition in PeopleWorks ATS:

1. **Business Need & Role Details:** Define the job title, department, office/remote location, and target openings count.
2. **Job Specifications & Budget:** Specify employment type (Full-Time/Contract), priority, experience band, and salary range.
3. **Approval Chain Routing:** Submit the requisition for multi-step approval (Hiring Manager → Department Head → Finance Controller → Head of Talent).
4. **Publish & Sourcing:** Once authorized, link the requisition to a Job Description and begin sourcing candidates.

👉 *Would you like me to start creating a new requisition for you now?*`;
    }

    // 4.7B ATS JD WORKFLOW STEPS EXPLANATION
    if (intent === 'EXPLAIN_JD_STEPS') {
      if (lang === 'te') {
        return `PeopleWorks ATS లో Job Description (JD) సృష్టించే 7 దశలు:

1. **Requisition & ప్రాథమిక సమాచారం:** ఆమోదించబడిన Requisition కి లింక్ చేయండి లేదా కొత్త JD ప్రారంభించండి (టైటిల్, డిపార్ట్‌మెంట్).
2. **రోల్ & అనుభవం:** అవసరమైన కనిష్ట మరియు గరిష్ట అనుభవం (ఉదా: 4–7 సంవత్సరాలు), పని విధానం.
3. **జాబ్ సారాంశం (Job Summary):** ఉద్యోగ లక్ష్యం మరియు సంక్షిప్త వివరణ.
4. **బాధ్యతలు & విద్యార్హతలు (Responsibilities & Qualifications):** ముఖ్యమైన విధులు మరియు విద్యా అర్హతలు.
5. **నైపుణ్యాలు (Skills):** తప్పనిసరి (Mandatory) మరియు ప్రాధాన్యత (Preferred) నైపుణ్యాలు.
6. **ప్రయోజనాలు & అదనపు వివరాలు (Benefits):** కంపెనీ ప్రయోజనాలు, భత్యాలు మరియు జీతం శ్రేణి.
7. **సమీక్ష & ఆమోదం (Review & Create):** పూర్తి వివరాలను సమీక్షించి JD ని సృష్టించండి.

👉 *మీ కోసం కొత్త Job Description సృష్టించడం ప్రారంభించమంటారా? **'Create a JD'** అని చెప్పండి.*`;
      }
      if (lang === 'hi') {
        return `PeopleWorks ATS में Job Description (JD) बनाने की 7 आसान प्रक्रियाएँ:

1. **Requisition & बुनियादी विवरण:** स्वीकृत Requisition से लिंक करें, पद नाम (Title) और विभाग (Department) तय करें।
2. **भूमिका और अनुभव:** आवश्यक न्यूनतम और अधिकतम अनुभव (जैसे: 4–7 वर्ष), कार्य मोड।
3. **जॉब सारांश (Job Summary):** पद का मुख्य उद्देश्य और संक्षिप्त विवरण।
4. **जिम्मेदारियां और योग्यताएं (Responsibilities & Qualifications):** प्रमुख कर्तव्य और शैक्षणिक योग्यताएं।
5. **कौशल (Skills):** अनिवार्य (Mandatory) और पसंदीदा (Preferred) कौशल।
6. **लाभ और विवरण (Benefits):** कंपनी के लाभ, भत्ते और वेतन सीमा।
7. **समीक्षा और निर्माण (Review & Create):** सभी विवरणों की समीक्षा करें और JD तैयार करें।

👉 *क्या आप अभी एक नई Job Description बनाना चाहते हैं? बस **'Create a JD'** कहें।*`;
      }
      return `To create a Job Description (JD) in PeopleWorks ATS, you can complete it through 7 simple steps:

1. **Requisition & Basic Info:** Link to an approved requisition (or create standalone) to auto-fill title, department, and cost center.
2. **Role & Experience:** Define the required experience range (min–max years), work mode, and location.
3. **Job Summary:** Provide a concise overview of the role and its core purpose.
4. **Responsibilities & Qualifications:** Outline key day-to-day duties, educational degrees, and certifications.
5. **Skills:** Specify mandatory must-have skills and preferred / nice-to-have skills.
6. **Benefits & Additional Details:** Add compensation band, perks, and employee benefits.
7. **Review, Workflow & Create:** Preview the complete JD card, verify approval routing, and confirm creation.

👉 *Would you like me to start creating a JD now? Just say **'Create a JD'** or **'Prepare a JD for the approved requisition'**.*`;
    }

    // 4.7C ATS JOB POSTING WORKFLOW STEPS EXPLANATION
    if (intent === 'EXPLAIN_JOB_POSTING') {
      if (lang === 'te') {
        return `PeopleWorks ATS లో Job Posting సృష్టించి పబ్లిష్ చేయడానికి 7-దశల ప్రక్రియ:

1. **Approved JD ఎంపిక:** ఆమోదించబడిన JD నుండి వివరాలు స్వయంచాలకంగా లోడ్ చేయబడతాయి.
2. **ప్రాథమిక వివరాలు:** పోస్టింగ్ టైటిల్, డిపార్ట్‌మెంట్ మరియు Requisition ధృవీకరణ.
3. **జాబ్ కంటెంట్:** పబ్లిక్ సారాంశం, బాధ్యతలు మరియు నైపుణ్యాల అనుకూలీకరణ.
4. **లొకేషన్ & వర్క్ మోడ్:** లొకేషన్ (ఉదా: Bangalore, Hybrid లేదా Remote) మరియు ఎంప్లాయ్‌మెంట్ రకం.
5. **అప్లికేషన్ సెట్టింగ్స్:** దరఖాస్తు విధానం (Direct Web Form / Quick Apply) మరియు గడువు.
6. **డిస్ట్రిబ్యూషన్ ఛానెల్స్:** Careers Portal, LinkedIn, Naukri, Indeed, Glassdoor, మొదలైనవి.
7. **సమీక్ష & పబ్లిషింగ్:** ధృవీకరణ మరియు లైవ్ మల్టీ-ఛానల్ డిస్ట్రిబ్యూషన్.

👉 *పోస్టింగ్ ప్రారంభించడానికి **'Create a job posting'** అని చెప్పండి.*`;
      }
      if (lang === 'hi') {
        return `PeopleWorks ATS में Job Posting बनाने और प्रकाशित करने की 7-चरणीय प्रक्रिया:

1. **Approved JD चयन:** स्वीकृत JD से सभी आवश्यक विवरण स्वचालित रूप से लोड होते हैं।
2. **मूल विवरण:** पोस्टिंग शीर्षक, विभाग और लिंक्ड Requisition की पुष्टि।
3. **जॉब सामग्री:** सार्वजनिक सारांश, जिम्मेदारियों और योग्यताओं की समीक्षा।
4. **स्थान और कार्य मोड:** स्थान (जैसे: Bangalore, Hybrid या Remote) और रोजगार प्रकार।
5. **आवेदन सेटिंग्स:** आवेदन का तरीका और अंतिम तिथि।
6. **वितरण चैनल:** Careers Portal, LinkedIn, Naukri, Indeed, Glassdoor, आदि।
7. **समीक्षा और प्रकाशन:** सत्यापन और लाइव मल्टी-चैनल वितरण।

👉 *शुरू करने के लिए **'Create a job posting'** कहें।*`;
      }
      return `Here is how the **Job Posting & Distribution** process works in PeopleWorks ATS across **7 conversational steps**:

1. **Approved JD Selection:** Select an approved JD to automatically inherit role details, responsibilities, and skills.
2. **Basic Posting Details:** Confirm the public posting title, department, and linked requisition.
3. **Job Content Review:** Customize public summary, responsibilities, and key requirements.
4. **Location & Work Mode:** Specify primary location (e.g. Bangalore, Hybrid, or Remote) and employment type.
5. **Application & Candidate Settings:** Configure application method (Direct Web Form / Quick Apply) and duration.
6. **Publishing Distribution Channels:** Select target channels (Careers Portal, LinkedIn, Naukri, Indeed, Glassdoor, Referral, Mobility).
7. **Review & Publish:** Validate all mandatory requirements and execute live simulated multi-channel syndication.

👉 *To begin creating a posting, simply say **'Create a job posting'** or **'Post this JD'**.*`;
    }

    // 4.7D CANDIDATE INTAKE & RESUME WORKFLOW STEPS EXPLANATION (PHASE 4)
    if (intent === 'EXPLAIN_CANDIDATE_INTAKE_STEPS') {
      if (lang === 'te') {
        return `PeopleWorks ATS లో రెజ్యూమ్ అప్‌లోడ్ చేసి అభ్యర్థిని సృష్టించడానికి **7-దశల ప్రక్రియ**:

1. **Step 1 — Upload / Identify Resume:** PDF లేదా DOCX రెజ్యూమ్‌ను అప్‌లోడ్ చేయండి.
2. **Step 2 — Parse & Extract Details:** AI ద్వారా టెక్స్ట్ ఎక్స్‌ట్రాక్షన్ మరియు నైపుణ్యాల వర్గీకరణ.
3. **Step 3 — Review Extracted Data:** పేరు, ఈమెయిల్, ఫోన్, అనుభవం మరియు నైపుణ్యాల సమీక్ష & సవరణ.
4. **Step 4 — Duplicate Check:** ఈమెయిల్, ఫోన్ మరియు పేరు ద్వారా డూప్లికేట్ తనిఖీ.
5. **Step 5 — Requisition / Application Link:** ఓపెన్ Requisition కి అప్లికేషన్ లింక్ చేయడం.
6. **Step 6 — Final Candidate Review:** పూర్తి ప్రొఫైల్ మరియు డాక్యుమెంట్ సారాంశ సమీక్ష.
7. **Step 7 — Create / Update / Verify:** డేటాబేస్ సేవ్, వెరిఫికేషన్ మరియు Candidates Hub లో లైవ్ అప్‌డేట్.

👉 *కొత్త అభ్యర్థిని సృష్టించడానికి **'Upload this resume and create a candidate'** అని చెప్పండి.*`;
      }
      if (lang === 'hi') {
        return `PeopleWorks ATS में रिज्यूम से उम्मीदवार प्रोफाइल बनाने की **7-चरणीय प्रक्रिया**:

1. **Step 1 — Upload / Identify Resume:** PDF या DOCX रिज्यूम अपलोड करें (सुरक्षा जांच के साथ)।
2. **Step 2 — Parse & Extract Details:** AI इंजन द्वारा टेक्स्ट एक्सट्रैक्शन और विवरण पहचान।
3. **Step 3 — Review Extracted Data:** नाम, ईमेल, फोन, अनुभव और कौशल की समीक्षा और सुधार।
4. **Step 4 — Duplicate Check:** ईमेल, फोन और नाम के आधार पर मौजूदा उम्मीदवारों की जांच।
5. **Step 5 — Requisition / Application Link:** खुली Requisition से आवेदन जोड़ना।
6. **Step 6 — Final Candidate Review:** अंतिम संरचित समीक्षा और पुष्टि।
7. **Step 7 — Create / Update / Verify:** डेटाबेस में सुरक्षित संचय और Candidates Hub में तुरंत लाइव अपडेट।

👉 *उम्मीदवार बनाने के लिए **'Upload this resume and create a candidate'** कहें।*`;
      }
      return `Here is how the **Resume Intake & Candidate Creation** workflow works in PeopleWorks ATS across **7 conversational steps**:

1. **STEP 1 — Upload / Identify Resume:** Upload candidate resume (PDF/DOCX) with enterprise document security checks.
2. **STEP 2 — Parse & Extract Details:** Natural language section parsing extracts contact info, work experience, education, and skills.
3. **STEP 3 — Review Extracted Candidate Data:** Inspect parsed fields with status badges (*Extracted*, *Needs Review*, *Not Found*) and make conversational edits.
4. **STEP 4 — Duplicate Check:** Automatic lookup across Email, Phone, and Name against existing candidate records.
5. **STEP 5 — Requisition / Application Link:** Link candidate application to an approved open requisition (with multi-application support).
6. **STEP 6 — Final Candidate Review:** Structured comprehensive review card with explicit source labels before persistence.
7. **STEP 7 — Create / Update / Verify:** Transactional persistence, storage verification, and instant real-time reactive update in **Candidates Hub**.

👉 *To start creating a candidate, simply say **'Upload this resume and create a candidate'** or drag-and-drop a resume into the chat.*`;
    }

    // 4.8 ATS CONCEPT EXPLANATIONS
    if (intent === 'explain_ats_concept') {
      if (p.includes('requisition')) {
        return `In PeopleWorks ATS, a **Requisition** (or Job Requisition) is a formal request and authorization to open a new job vacancy. It defines the job role, budget, headcount/openings, department, hiring manager, and approval workflows before publishing.`;
      }
      if (p.includes('jd') || p.includes('job description')) {
        return `A **Job Description (JD)** defines the role responsibilities, required technical skills, minimum experience, and qualifications. In PeopleWorks ATS, once a JD is drafted, it moves through approval workflow before being published to job portals (LinkedIn, Careers Portal, Naukri).`;
      }
      if (p.includes('ats')) {
        return `An **Applicant Tracking System (ATS)** is software that manages the entire recruiting lifecycle—from posting job requisitions, sourcing and screening candidates, scheduling interviews, through to generating offers and onboarding.`;
      }
    }

    // 4.9 Short conversational affirmative / negative handling
    if (p.length < 4 || p === 'ok' || p === 'yes' || p === 'no' || p === 'sure') {
      return `Understood! What would you like to do next? You can ask me to create a requisition, approve JDs, schedule interviews, screen candidates, or check recruitment metrics.`;
    }

    return `I'm not completely sure what you'd like me to do. Could you tell me a little more? You can ask me to create a requisition, approve JDs, schedule interviews, screen candidates, or query live recruitment analytics.`;
  }
}
