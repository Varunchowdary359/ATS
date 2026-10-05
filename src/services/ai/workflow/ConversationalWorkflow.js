/**
 * ConversationalWorkflow
 * Reusable abstract base class for multi-turn conversational forms in PeopleWorks ATS.
 * Supports step-by-step field collection, multi-field extraction, natural language normalization,
 * field corrections, back-navigation, optional skipping, structured preview, and execution.
 */

import { normalizeText, safeString } from '../AINormalizer.js';

export class ConversationalWorkflow {
  constructor({
    type,
    title,
    fieldDefinitions = [],
    previewRenderer = null,
    executor = null
  }) {
    this.type = type;
    this.title = title;
    this.fields = fieldDefinitions;
    this.previewRenderer = previewRenderer;
    this.executor = executor;
  }

  getFieldDefinition(key) {
    return this.fields.find(f => f.key === key) || null;
  }

  getRequiredFields() {
    return this.fields.filter(f => f.required);
  }

  getNextMissingRequiredField(session) {
    for (const field of this.fields) {
      if (field.required) {
        if (!session.hasField(field.key)) {
          return field;
        }
      }
    }
    return null;
  }

  /**
   * Main entry point for processing a user's conversational turn
   */
  async processTurn(session, userInput, context = {}) {
    const rawInput = safeString(userInput).trim();
    const lower = normalizeText(rawInput);
    const lang = context.language || 'en';

    session.turnCount = (session.turnCount || 0) + 1;
    const isInitialTurn = session.turnCount === 1;

    // 1. CANCEL CHECK
    if (this._isCancelCommand(lower, rawInput)) {
      session.setStatus('CANCELLED');
      return this._handleCancellation(lang);
    }

    // 2. PREVIEW CONFIRMATION / REJECTION (When in PREVIEW state)
    if (session.isPreview()) {
      return await this._processPreviewTurn(session, rawInput, lower, lang, context);
    }

    // 2B. PREMATURE CREATE ATTEMPT CHECK (When in COLLECTING state)
    if (
      /\b(create\s+it|create\s+now|submit\s+now|confirm\s+now|finish\s+now|proceed\s+now|create\s+jd\s+now|create\s+jd|create\s+requisition\s+now|create\s+requisition)\b/i.test(lower) &&
      !isInitialTurn
    ) {
      const missingFields = this.getRequiredFields().filter(f => !session.hasField(f.key));
      if (missingFields.length > 0) {
        const missingList = missingFields.map(f => `• ${f.label}`).join('\n');
        const nextMissing = missingFields[0];
        session.currentFieldIndex = this.fields.findIndex(f => f.key === nextMissing.key);
        const warning = lang === 'te'
          ? `⚠️ ఇంకా పూర్తి చేయాల్సిన తప్పనిసరి వివరాలు ఉన్నాయి:\n${missingList}\n\nదయచేసి క్రింది ప్రశ్నకు సమాధానం ఇవ్వండి:`
          : lang === 'hi'
          ? `⚠️ अभी भी कुछ अनिवार्य विवरण बाकी हैं:\n${missingList}\n\nकृपया निम्नलिखित प्रश्न का उत्तर दें:`
          : `⚠️ Cannot create the ${this.title} yet. Missing mandatory items:\n${missingList}\n\nPlease provide the required details:`;
        return this._formulateQuestion(session, nextMissing, lang, warning);
      }
    }

    // 3. GO BACK CHECK
    if (this._isBackCommand(lower)) {
      return this._handleGoBack(session, lang);
    }

    // 4. FIELD CORRECTION CHECK (e.g. "change department to Sales", "actually Hyderabad", "make it 5 openings")
    const correctionHandled = this._handleExplicitCorrection(session, rawInput, lower, lang);
    if (correctionHandled) {
      if (session.isEditingFromPreview) {
        session.isEditingFromPreview = false;
        session.setStatus('PREVIEW');
        return this._buildPreviewResponse(session, lang, correctionHandled.feedback);
      }
      // Check if all required fields are now present
      const nextReq = this.getNextMissingRequiredField(session);
      if (!nextReq) {
        session.setStatus('PREVIEW');
        return this._buildPreviewResponse(session, lang, correctionHandled.feedback);
      }
      return this._formulateQuestion(session, nextReq, lang, correctionHandled.feedback);
    }

    // 5. EXTRACT MULTIPLE FIELDS FROM CURRENT INPUT
    this._extractAllPossibleFields(session, rawInput, lower, lang);

    // 6. PROCESS CURRENT FIELD IF APPLICABLE
    const askedField = this.fields[session.currentFieldIndex];
    
    if (askedField && !session.hasField(askedField.key)) {
      if (!isInitialTurn) {
        // Check for Skip command
        if (this._isSkipCommand(lower) && !askedField.required) {
          const defVal = typeof askedField.defaultValue === 'function'
            ? askedField.defaultValue(session)
            : (askedField.defaultValue !== undefined ? askedField.defaultValue : '');
          session.setField(askedField.key, defVal);
        } else {
          // Try field-specific extractor or fallback
          let extracted = askedField.extract
            ? askedField.extract(rawInput, lower, session.getAllData(), lang)
            : null;

          if (extracted === null || extracted === undefined) {
            extracted = rawInput;
          }

          const valToSet = extracted;

          // Validation
          if (askedField.validate) {
            const valRes = askedField.validate(valToSet, session.getAllData(), rawInput);
            if (!valRes.isValid) {
              return {
                text: valRes.error || `Please provide a valid value for ${askedField.label}.`,
                cards: [],
                toolCalls: []
              };
            }
          }

          const normalizedVal = askedField.normalize ? askedField.normalize(valToSet, session) : valToSet;
          session.setField(askedField.key, normalizedVal);
        }
      }
    }

    // 7. CHECK IF ALL REQUIRED FIELDS ARE COMPLETE
    const nextMissing = this.getNextMissingRequiredField(session);
    if (!nextMissing) {
      this._applyDefaultValues(session);
      session.setStatus('PREVIEW');
      return this._buildPreviewResponse(session, lang);
    }

    // 8. ADVANCE TO NEXT REQUIRED FIELD
    session.currentFieldIndex = this.fields.findIndex(f => f.key === nextMissing.key);
    return this._formulateQuestion(session, nextMissing, lang);
  }

  _applyDefaultValues(session) {
    for (const field of this.fields) {
      if (!session.hasField(field.key)) {
        const defVal = typeof field.defaultValue === 'function'
          ? field.defaultValue(session)
          : (field.defaultValue !== undefined ? field.defaultValue : '');
        if (defVal !== undefined && defVal !== '') {
          session.setField(field.key, defVal);
        }
      }
    }
  }

  /**
   * Handle user action while in PREVIEW state
   */
  async _processPreviewTurn(session, rawInput, lower, lang, context) {
    // 0. Cancel check
    if (this._isCancelCommand(lower, rawInput)) {
      session.setStatus('CANCELLED');
      return this._handleCancellation(lang);
    }

    // A. Confirmation: "yes", "create", "confirm", "submit", "proceed", "go ahead", "publish", "publish now", "save draft", "create posting"
    if (
      /\b(yes|create|confirm|submit|proceed|create it|go ahead|looks good|perfect|sure|okay|avunu|ha|kardo|banao|cheyi|publish|publish now|publish it|post now|post it|post|save draft|create posting|save|draft)\b/i.test(lower) ||
      /చేయి|క్రియేట్|పబ్లిష్|हाँ|बनाओ|प्रकाशित|सेव/i.test(rawInput)
    ) {
      if (/\b(save draft|draft|draft only|save)\b/i.test(lower)) {
        session.isDraftOnly = true;
      }
      if (this.executor) {
        try {
          const result = await this.executor(session, context);
          session.setStatus('COMPLETED');
          return result;
        } catch (err) {
          return {
            text: `⚠️ Could not complete creation: ${err.message}`,
            cards: [],
            toolCalls: []
          };
        }
      }
      session.setStatus('COMPLETED');
      return {
        text: `✅ ${this.title} completed successfully.`,
        cards: [],
        toolCalls: []
      };
    }

    // B. Explicit field correction while in PREVIEW state (e.g. "Change experience to 5–8 years", "Add Docker to skills")
    const correctionHandled = this._handleExplicitCorrection(session, rawInput, lower, lang);
    if (correctionHandled) {
      return this._buildPreviewResponse(session, lang, correctionHandled.feedback);
    }

    // C. Generic Edit command from preview
    if (/\b(edit|change|modify|update|edit details|sari cheyi|badlo)\b/i.test(lower) && lower.split(/\s+/).length <= 4) {
      session.isEditingFromPreview = true;
      session.setStatus('COLLECTING');
      const feedback = lang === 'te'
        ? `మీరు ఏ వివరాలను మార్చాలనుకుంటున్నారు? (ఉదా: 'Change location to Hyderabad' లేదా 'Publish on LinkedIn and Naukri')`
        : lang === 'hi'
        ? `आप किस विवरण को बदलना चाहते हैं? (जैसे: 'Change location to Hyderabad' या 'Publish on LinkedIn and Naukri')`
        : `Which field would you like to edit? You can say e.g., 'Change location to Hyderabad', 'Use Indeed instead of Glassdoor', or 'Make it remote'.`;
      
      return {
        text: feedback,
        cards: [],
        toolCalls: []
      };
    }

    // D. Re-render preview if unclear
    return this._buildPreviewResponse(session, lang, `Please confirm if you would like to proceed with creating this record:`);
  }

  _extractAllPossibleFields(session, rawInput, lower, lang) {
    const isGenericAffirmative = /^(?:keep|same|default|looks\s+good|fine|ok|perfect|yes|use\s+jd|keep\s+jd\s+title)(?:\s+(?:and|with)\s+[A-Za-z\s]+)?$/i.test(lower.trim());
    for (const field of this.fields) {
      if (session.getField(field.key) === undefined) {
        // If it's a generic affirmative and NOT the currently asked field, skip extracting for other fields
        const currentAsked = this.fields[session.currentFieldIndex];
        if (isGenericAffirmative && currentAsked && currentAsked.key !== field.key) {
          continue;
        }

        if (field.extract) {
          const val = field.extract(rawInput, lower, session.getAllData(), lang);
          if (val !== null && val !== undefined) {
            const normalized = field.normalize ? field.normalize(val, session) : val;
            if (field.validate) {
              const check = field.validate(normalized, session.getAllData(), rawInput);
              if (check.isValid) {
                session.setField(field.key, normalized);
              }
            } else {
              session.setField(field.key, normalized);
            }
          }
        }
      }
    }
  }

  _handleExplicitCorrection(session, rawInput, lower, lang) {
    // 0. Work mode corrections: "make it remote", "make it hybrid", "make it on-site"
    if (/\b(?:make\s+it|set\s+to|change\s+to)\s+(remote|hybrid|on[-\s]?site)\b/i.test(lower)) {
      const modeMatch = lower.match(/\b(remote|hybrid|on[-\s]?site)\b/i);
      if (modeMatch) {
        const mode = modeMatch[1].toLowerCase().includes('remote') ? 'Remote' : modeMatch[1].toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site';
        session.setField('workMode', mode);
        if (mode === 'Remote') {
          session.setField('location', 'Remote');
        }
        return {
          field: 'workMode',
          feedback: `Updated **Work Mode** to **${mode}**.`
        };
      }
    }

    // 0B. Expiry duration corrections: "change expiry to 30 days", "keep it open for 45 days"
    const expDaysMatch = lower.match(/(?:expiry|expiration|deadline|duration|keep\s+it\s+open)\s+(?:to|for|=|is)?\s*(\d+)\s*days?/i);
    if (expDaysMatch) {
      const days = parseInt(expDaysMatch[1], 10);
      const expDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
      session.setField('expirationDate', expDate);
      session.setField('durationDays', days);
      return {
        field: 'expirationDate',
        feedback: `Updated **Application Deadline** to **${days} days** (\`${expDate}\`).`
      };
    }

    // 0C. Channel corrections: "remove Naukri", "use Indeed instead of Glassdoor", "only LinkedIn"
    if (/(?:channel|publish|post|portal|board|linkedin|naukri|indeed|glassdoor|careers|referral|mobility)/i.test(lower)) {
      if (/\b(?:remove|delete|exclude|drop)\s+(linkedin|naukri|indeed|glassdoor|careers|referral|mobility)\b/i.test(lower)) {
        const chMatch = lower.match(/\b(linkedin|naukri|indeed|glassdoor|careers|referral|mobility)\b/i);
        if (chMatch) {
          const chKey = chMatch[1].toLowerCase().includes('careers') ? 'careers_portal' : chMatch[1].toLowerCase();
          const current = session.getField('channels') || ['careers_portal', 'linkedin', 'naukri', 'indeed'];
          const updated = current.filter(c => c !== chKey);
          session.setField('channels', updated);
          return {
            field: 'channels',
            feedback: `Removed **${chMatch[1]}** from target distribution channels.`
          };
        }
      }
      if (/\b(?:use|publish\s+to|publish\s+on|post\s+to|post\s+on)\s+(.+?)\s+(?:instead\s+of|rather\s+than)\s+(.+)/i.test(lower)) {
        const repMatch = lower.match(/\b(?:use|publish\s+to|publish\s+on|post\s+to|post\s+on)\s+(.+?)\s+(?:instead\s+of|rather\s+than)\s+(.+)/i);
        if (repMatch) {
          const map = { linkedin: 'linkedin', naukri: 'naukri', indeed: 'indeed', glassdoor: 'glassdoor', careers: 'careers_portal' };
          const newChKey = map[repMatch[1].toLowerCase().trim()] || repMatch[1].toLowerCase().trim();
          const oldChKey = map[repMatch[2].toLowerCase().trim()] || repMatch[2].toLowerCase().trim();
          let current = session.getField('channels') || ['careers_portal', 'linkedin', 'naukri', 'indeed'];
          current = current.filter(c => c !== oldChKey);
          if (!current.includes(newChKey)) current.push(newChKey);
          session.setField('channels', current);
          return {
            field: 'channels',
            feedback: `Updated channels: Replaced **${repMatch[2]}** with **${repMatch[1]}**.`
          };
        }
      }
    }

    // 1. Check for experience range correction (e.g. "change experience to 5 to 8 years", "5-8 years")
    if (/(?:experience|exp)/i.test(lower)) {
      const expRangeMatch = rawInput.match(/(?:change|make|set|update|edit)\s+(?:the\s+)?(?:experience|exp)(?:\s+range)?\s+(?:to|as|=|is)?\s*(\d+)\s*(?:to|-|–)\s*(\d+)/i);
      if (expRangeMatch) {
        const min = parseInt(expRangeMatch[1], 10);
        const max = parseInt(expRangeMatch[2], 10);
        session.setField('experienceMin', min);
        session.setField('experienceMax', max);
        session.lastEditedField = 'experienceMin';
        return {
          field: 'experienceMin',
          feedback: `Updated **Experience Range** to **${min}–${max} years**.`
        };
      }
    }

    for (const field of this.fields) {
      const fieldNamePatterns = [field.key.toLowerCase(), field.label.toLowerCase()];
      if (field.aliases) {
        field.aliases.forEach(a => fieldNamePatterns.push(a.toLowerCase()));
      }

      for (const alias of fieldNamePatterns) {
        // Check for "add <value> to <field>"
        const addRegex = new RegExp(`(?:add|include)\\s+(.+?)\\s+(?:to|in|under|as)\\s+(?:the\\s+)?${alias}`, 'i');
        const addMatch = rawInput.match(addRegex);
        if (addMatch) {
          const itemToAdd = addMatch[1].trim();
          const existing = session.getField(field.key);
          let updatedVal;
          if (Array.isArray(existing)) {
            updatedVal = [...existing, itemToAdd];
          } else if (typeof existing === 'string' && existing.length > 0) {
            updatedVal = `${existing}, ${itemToAdd}`;
          } else {
            updatedVal = itemToAdd;
          }
          const normalized = field.normalize ? field.normalize(updatedVal, session) : updatedVal;
          session.setField(field.key, normalized);
          session.lastEditedField = field.key;
          return {
            field: field.key,
            feedback: `Added **${itemToAdd}** to **${field.label}**.`
          };
        }

        // Check for "change/update/make/set <field> to <value>"
        const regex = new RegExp(`(?:change|make|set|update|edit|actually)\\s+(?:the\\s+)?${alias}\\s+(?:to|as|=|is)?\\s*(.+)`, 'i');
        const match = rawInput.match(regex);
        if (match) {
          const newValRaw = match[1].trim();
          const extracted = field.extract ? field.extract(newValRaw, normalizeText(newValRaw), session.getAllData(), lang) : null;
          const valToUse = extracted !== null && extracted !== undefined ? extracted : newValRaw;
          const normalized = field.normalize ? field.normalize(valToUse, session) : valToUse;
          session.setField(field.key, normalized);
          session.lastEditedField = field.key;
          return {
            field: field.key,
            feedback: `Updated **${field.label}** to **${normalized}**.`
          };
        }
      }
    }

    // Check for "actually <value>"
    if (/^actually\s+(.+)/i.test(rawInput)) {
      const match = rawInput.match(/^actually\s+(.+)/i);
      if (match) {
        const newValRaw = match[1].trim();
        const newValLower = normalizeText(newValRaw);

        // 1. Try matching with explicit field extractors first (e.g. location matching Hyderabad, department matching Engineering)
        for (const field of this.fields) {
          if (field.extract) {
            const extracted = field.extract(newValRaw, newValLower, session.getAllData(), lang);
            if (extracted !== null && extracted !== undefined) {
              const normalized = field.normalize ? field.normalize(extracted, session) : extracted;
              session.setField(field.key, normalized);
              session.lastEditedField = field.key;
              return {
                field: field.key,
                feedback: `Updated **${field.label}** to **${normalized}**.`
              };
            }
          }
        }

        // 2. Fallback to last question answered
        if (session.history.length > 0) {
          const lastTurn = session.history[session.history.length - 1];
          const field = this.getFieldDefinition(lastTurn.key);
          if (field) {
            const extracted = field.extract ? field.extract(newValRaw, newValLower, session.getAllData(), lang) : null;
            const valToUse = extracted !== null && extracted !== undefined ? extracted : newValRaw;
            const normalized = field.normalize ? field.normalize(valToUse, session) : valToUse;
            session.setField(field.key, normalized);
            session.lastEditedField = field.key;
            return {
              field: field.key,
              feedback: `Updated **${field.label}** to **${normalized}**.`
            };
          }
        }
      }
    }

    return null;
  }

  _formulateQuestion(session, field, lang, prefixFeedback = '', cards = []) {
    const totalSteps = this.totalSteps || 7;
    let stepNumber;

    if (field.step) {
      stepNumber = field.step;
    } else {
      const requiredTotal = this.getRequiredFields().length;
      const completedRequired = this.getRequiredFields().filter(f => session.hasField(f.key)).length;
      stepNumber = Math.min(completedRequired + 1, totalSteps);
    }

    let questionText = typeof field.question === 'function'
      ? field.question(session, lang)
      : field.question;

    if (lang === 'te' && field.questionTe) {
      questionText = field.questionTe;
    } else if (lang === 'hi' && field.questionHi) {
      questionText = field.questionHi;
    }

    const progressIndicator = `📌 *Step ${stepNumber} of ${totalSteps} (${field.label})*`;
    const fullText = prefixFeedback
      ? `${prefixFeedback}\n\n${progressIndicator}\n${questionText}`
      : `${progressIndicator}\n${questionText}`;

    return {
      text: fullText,
      cards: cards || [],
      toolCalls: []
    };
  }

  _buildPreviewResponse(session, lang, customHeader = '') {
    if (this.previewRenderer) {
      return this.previewRenderer(session, lang, customHeader);
    }

    const data = session.getAllData();
    const rows = this.fields.map(f => `• **${f.label}:** ${data[f.key] || 'Not specified'}`).join('\n');
    const header = customHeader || `📋 **${this.title} Summary**\nAll required details have been collected:`;

    return {
      text: `${header}\n\n${rows}\n\nWould you like me to proceed and create this record?`,
      cards: [
        {
          type: 'action_result',
          title: `Ready to Create: ${data.title || this.title}`,
          badge: 'Ready for Review',
          badgeColor: 'blue',
          details: this.fields.map(f => ({ label: f.label, value: String(data[f.key] || 'N/A') })),
          actions: [
            { label: 'Create Record', actionIntent: 'confirm_workflow_create' },
            { label: 'Edit Details', actionIntent: 'edit_workflow_field', variant: 'secondary' },
            { label: 'Cancel', actionIntent: 'cancel_workflow', variant: 'danger' }
          ]
        }
      ],
      toolCalls: []
    };
  }

  _handleGoBack(session, lang) {
    if (session.currentFieldIndex > 0) {
      session.currentFieldIndex -= 1;
      const prevField = this.fields[session.currentFieldIndex];
      return this._formulateQuestion(session, prevField, lang, `Returned to previous question.`);
    }
    return {
      text: `You are at the first step of this workflow.`,
      cards: [],
      toolCalls: []
    };
  }

  _handleCancellation(lang) {
    const text = lang === 'te'
      ? `రద్దు చేయబడింది. రికార్డ్ సృష్టించబడలేదు. నేను మీకు ఇంకేమైనా సహాయం చేయగలనా?`
      : lang === 'hi'
      ? `रद्द कर दिया गया। कोई रिकॉर्ड नहीं बनाया गया। क्या मैं आपकी किसी और चीज़ में सहायता करूँ?`
      : `Requisition creation has been cancelled. No record was saved. Let me know if you need anything else!`;

    return {
      text,
      cards: [],
      toolCalls: []
    };
  }

  _isCancelCommand(lower, raw) {
    return /\b(cancel|stop|abandon|nevermind|don't\s+want\s+to\s+create|cancel\s+requisition|vaddu|aapeyi|rok\s+do|mat\s+banao)\b/i.test(lower) ||
      /వద్దు|ఆపు|రద్దు|रद्द|मत\s+बनाओ/i.test(raw);
  }

  _isBackCommand(lower) {
    return /\b(go\s+back|previous\s+question|previous|back|venakki|peeche)\b/i.test(lower);
  }

  _isSkipCommand(lower) {
    return /\b(skip|not\s+now|leave\s+it\s+blank|leave\s+blank|don't\s+have\s+it|later|i'll\s+add\s+it\s+later|none|no|oddu|nahi)\b/i.test(lower);
  }
}
