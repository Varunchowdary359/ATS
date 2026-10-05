/**
 * CandidateIntakeWorkflow
 * 7-Step Conversational Resume Intake + Candidate Creation + Application Linking Workflow
 * for PeopleWorks ATS AI Copilot.
 * 
 * STEP 1 — UPLOAD / IDENTIFY RESUME
 * STEP 2 — PARSE & EXTRACT DETAILS
 * STEP 3 — REVIEW EXTRACTED CANDIDATE DATA
 * STEP 4 — DUPLICATE CHECK
 * STEP 5 — REQUISITION / APPLICATION LINK
 * STEP 6 — FINAL CANDIDATE REVIEW
 * STEP 7 — CREATE / UPDATE / VERIFY
 */

import { ConversationalWorkflow } from './ConversationalWorkflow.js';
import { DatabaseService } from '../../db/DatabaseService.js';
import { AIValidationService } from '../AIValidationService.js';
import { AIPermissionService } from '../AIPermissionService.js';
import { AIAuditService } from '../AIAuditService.js';
import { DocumentSecurityService } from '../../security/DocumentSecurityService.js';
import { extractTextFromFile, parseResumeText, mapParsedDataToCandidateModel } from '../../../components/recruitment/intake/resumeParserEngine.js';
import { candidateService } from '../../../components/recruitment/candidates/candidateService.js';
import { ResumeMatchingService } from '../matching/ResumeMatchingService.js';
import { SanitizerService } from '../../security/SanitizerService.js';
import { normalizeText, safeString } from '../AINormalizer.js';
import { AIContextService } from '../AIContextService.js';
import { WorkflowRegistry } from './WorkflowRegistry.js';

export class CandidateIntakeWorkflow extends ConversationalWorkflow {
  constructor() {
    super({
      type: 'CREATE_CANDIDATE_FROM_RESUME',
      title: 'Candidate Resume Intake',
      fieldDefinitions: [
        // =====================================================================
        // STEP 1 & 2 — RESUME FILE & PARSING IDENTIFICATION
        // =====================================================================
        {
          key: 'resumeFile',
          label: 'Resume Document',
          required: true,
          step: 1,
          aliases: ['resume', 'cv', 'file', 'attachment', 'document', 'resume file'],
          question: 'Please upload or attach the candidate\'s resume (PDF, DOCX, or TXT format up to 10MB) to begin parsing.',
          questionTe: 'దయచేసి పార్సింగ్ ప్రారంభించడానికి అభ్యర్థి రెజ్యూమ్‌ను (PDF, DOCX, లేదా TXT ఫార్మాట్) అప్‌లోడ్ చేయండి.',
          questionHi: 'कृपया पार्सिंग शुरू करने के लिए उम्मीदवार का बायोडाटा/रिज्यूम (PDF, DOCX या TXT प्रारूप) अपलोड करें।',
          extract: (raw, lower, allData) => {
            if (allData.resumeFile) return allData.resumeFile;
            if (allData.attachedFile) {
              return {
                name: allData.attachedFile.name || 'Candidate_Resume.pdf',
                size: allData.attachedFile.size || 1024 * 500,
                type: allData.attachedFile.type || 'application/pdf'
              };
            }
            return null;
          }
        },

        // =====================================================================
        // STEP 3 — CANDIDATE EXTRACTED DETAILS (CORE FIELDS)
        // =====================================================================
        {
          key: 'candidateName',
          label: 'Candidate Full Name',
          required: true,
          step: 3,
          aliases: ['name', 'full name', 'candidate name', 'applicant name', 'candidate'],
          question: 'I couldn\'t reliably identify the candidate\'s full name from the resume. What is the candidate\'s name?',
          questionTe: 'రెజ్యూమ్ నుండి అభ్యర్థి పేరు స్పష్టంగా గుర్తించబడలేదు. అభ్యర్థి పూర్తి పేరు ఏమిటి?',
          questionHi: 'रिज्यूम से उम्मीदवार का नाम नहीं मिल सका। उम्मीदवार का पूरा नाम क्या है?',
          extract: (raw, lower, allData) => {
            const clean = raw.trim();
            if (/\b(change|name\s+is|name\s+should\s+be|candidate\s+name|create\s+candidate|add)\b/i.test(lower)) {
              const match = clean.match(/(?:name\s+is|name\s+should\s+be|name\s+to|candidate\s+name\s+is|create\s+candidate\s+|create\s+|add\s+)([A-Z][a-zA-Z.'-]+(?:\s+[A-Za-z.'-]+)*)(?:\s+(?:as|for|to|with|and|from|in)|$)/i);
              if (match && match[1].trim().length >= 2) {
                return match[1].trim().replace(/\b\w/g, l => l.toUpperCase());
              }
            }
            if (clean.length >= 3 && clean.length <= 50 && !/\b(create|upload|resume|requisition|jd|posting|approve|yes|no|skip)\b/i.test(clean)) {
              return clean.replace(/\b\w/g, l => l.toUpperCase());
            }
            return null;
          }
        },
        {
          key: 'email',
          label: 'Email Address',
          required: true,
          step: 3,
          aliases: ['email', 'mail', 'email address', 'e-mail', 'contact email'],
          question: 'Email address is required for candidate profile creation. What is the candidate\'s email?',
          questionTe: 'అభ్యర్థి ప్రొఫైల్ సృష్టించడానికి ఈమెయిల్ అవసరం. అభ్యర్థి ఈమెయిల్ ఏమిటి?',
          questionHi: 'उम्मीदवार प्रोफाइल बनाने के लिए ईमेल पता आवश्यक है। उम्मीदवार का ईमेल क्या है?',
          extract: (raw, lower, allData) => {
            const match = raw.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i);
            return match ? match[0].toLowerCase() : null;
          },
          validate: (val) => {
            if (!val || !AIValidationService.isValidEmail(val)) {
              return { isValid: false, error: 'Please enter a valid email address (e.g. rahul.kumar@example.com).' };
            }
            return { isValid: true };
          }
        },
        {
          key: 'phone',
          label: 'Phone Number',
          required: false,
          step: 3,
          defaultValue: 'Not Provided',
          aliases: ['phone', 'mobile', 'cell', 'phone number', 'contact number', 'telephone'],
          question: 'What is the candidate\'s phone number? (Or say "Skip" to leave blank)',
          extract: (raw, lower) => {
            const match = raw.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{3,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{4}/) ||
                          raw.match(/\b[6-9]\d{9}\b/);
            return match ? match[0].trim() : null;
          }
        },
        {
          key: 'location',
          label: 'Current Location',
          required: false,
          step: 3,
          defaultValue: 'Remote / Unspecified',
          aliases: ['location', 'city', 'current location', 'residence'],
          question: 'What is the candidate\'s current location?',
          extract: (raw, lower) => {
            if (/\b(bangalore|bengaluru)\b/i.test(lower)) return 'Bangalore, India';
            if (/\b(hyderabad)\b/i.test(lower)) return 'Hyderabad, India';
            if (/\b(pune)\b/i.test(lower)) return 'Pune, India';
            if (/\b(mumbai)\b/i.test(lower)) return 'Mumbai, India';
            if (/\b(chennai)\b/i.test(lower)) return 'Chennai, India';
            if (/\b(delhi|noida|gurgaon)\b/i.test(lower)) return 'Delhi NCR, India';
            if (/\b(remote)\b/i.test(lower)) return 'Remote';
            return null;
          }
        },
        {
          key: 'totalExperience',
          label: 'Total Experience',
          required: false,
          step: 3,
          defaultValue: '0 yrs / Fresher',
          aliases: ['experience', 'total experience', 'exp', 'years of experience'],
          question: 'What is the candidate\'s total experience in years?',
          extract: (raw, lower) => {
            const expMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i) || raw.match(/\b(\d+(?:\.\d+)?)\b/);
            if (expMatch && !raw.includes('@')) {
              return `${expMatch[1]} yrs`;
            }
            return null;
          }
        },
        {
          key: 'currentTitle',
          label: 'Current / Recent Title',
          required: false,
          step: 3,
          defaultValue: 'Professional',
          aliases: ['title', 'designation', 'current title', 'role', 'current role'],
          extract: (raw, lower) => {
            const match = raw.match(/(?:title|role|designation)\s+(?:is|to|=|as)\s+([A-Za-z0-9\s.+#]+)/i);
            if (match && match[1].trim().length >= 2) return match[1].trim();
            return null;
          }
        },
        {
          key: 'currentCompany',
          label: 'Current Company',
          required: false,
          step: 3,
          defaultValue: 'Not Specified',
          aliases: ['company', 'current company', 'employer', 'organization'],
          extract: (raw, lower) => {
            const match = raw.match(/(?:company|employer|organization)\s+(?:is|to|=|as)\s+([A-Za-z0-9\s.&'-]+)/i);
            if (match && match[1].trim().length >= 2) return match[1].trim();
            return null;
          }
        },
        {
          key: 'skills',
          label: 'Skills',
          required: false,
          step: 3,
          defaultValue: [],
          aliases: ['skills', 'tech stack', 'technologies', 'core skills'],
          extract: (raw, lower) => {
            if (/\b(skill|skills|stack|technologies)\b/i.test(lower)) {
              const clean = raw.replace(/^(?:add|set|skills?|skills?\s+are|technologies?\s+are)[:\s]*/i, '');
              const items = clean.split(/[,+;|]/).map(s => s.trim()).filter(Boolean);
              if (items.length > 0) return items;
            }
            return null;
          }
        },

        // =====================================================================
        // STEP 4 — DUPLICATE DETECTION RESOLUTION
        // =====================================================================
        {
          key: 'duplicateResolution',
          label: 'Duplicate Check Status',
          required: false,
          step: 4,
          defaultValue: 'RESOLVED_NEW',
          aliases: ['duplicate', 'duplicate resolution', 'match action'],
          extract: (raw, lower) => {
            if (/\b(use\s+existing|update\s+existing|link\s+existing|reuse|keep\s+existing)\b/i.test(lower)) {
              return 'USE_EXISTING';
            }
            if (/\b(create\s+new|new\s+candidate|ignore\s+duplicate|force\s+create|proceed\s+new)\b/i.test(lower)) {
              return 'CREATE_NEW';
            }
            return null;
          }
        },

        // =====================================================================
        // STEP 5 — REQUISITION / APPLICATION LINKAGE
        // =====================================================================
        {
          key: 'requisitionId',
          label: 'Linked Requisition',
          required: false,
          step: 5,
          defaultValue: '',
          aliases: ['requisition', 'req', 'role', 'job opening', 'position', 'linked requisition', 'target req'],
          question: 'Which open requisition should this candidate be associated with? (e.g. Senior Java Developer, REQ-2026-001, or say "Skip" for Talent Pool)',
          questionTe: 'ఈ అభ్యర్థిని ఏ ఓపెన్ Requisition తో అనుసంధానించాలి? (ఉదా: Senior Java Developer లేదా REQ-2026-001, లేదా టాలెంట్ పూల్ కోసం "Skip" అనండి)',
          questionHi: 'इस उम्मीदवार को किस खुली Requisition से जोड़ा जाना चाहिए? (जैसे: Senior Java Developer या REQ-2026-001, या टैलेंट पूल के लिए "Skip" कहें)',
          extract: (raw, lower, allData) => {
            DatabaseService.init();
            const reqs = DatabaseService.requisitions || [];
            const clean = raw.trim();

            if (this._isSkipCommand(lower) || /\b(talent\s+pool|general\s+pool|no\s+requisition|none|unassigned)\b/i.test(lower)) {
              return '';
            }

            // Direct REQ ID match
            const reqIdMatch = clean.match(/\b(REQ-\d{4}-\d{3,4}|REQ-\d{3,4})\b/i);
            if (reqIdMatch) {
              const formatted = reqIdMatch[1].toUpperCase().replace(/^REQ(\d)/, 'REQ-$1');
              const found = reqs.find(r => r.id.toUpperCase() === formatted);
              if (found) return found.id;
              return formatted;
            }

            // Keyword match in active open requisitions
            const matchingReqs = reqs.filter(r => {
              const title = (r.title || r.jobTitle || '').toLowerCase();
              return title && (
                (lower.includes('java') && title.includes('java')) ||
                (lower.includes('react') && title.includes('react')) ||
                (lower.includes('frontend') && title.includes('frontend')) ||
                (lower.includes('python') && title.includes('python')) ||
                (lower.includes('product') && title.includes('product')) ||
                (lower.includes('designer') && title.includes('design')) ||
                (lower.includes('sales') && title.includes('sales')) ||
                lower.includes(title) ||
                title.includes(lower)
              );
            });

            if (matchingReqs.length > 0) {
              return matchingReqs[0].id;
            }

            return null;
          }
        }
      ],

      // =======================================================================
      // STEP 6 — FINAL STRUCTURED REVIEW CARD GENERATOR
      // =======================================================================
      previewRenderer: (session, lang, customHeader = '') => {
        const data = session.getAllData();
        const candName = data.candidateName || 'Rahul Kumar';
        const email = data.email || 'Not Provided';
        const phone = data.phone || 'Not Provided';
        const location = data.location || 'Remote / Unspecified';
        const exp = data.totalExperience || '0 yrs';
        const title = data.currentTitle || 'Professional';
        const company = data.currentCompany || 'Not Specified';
        const skills = Array.isArray(data.skills) ? data.skills : (data.skills ? String(data.skills).split(',') : ['Java', 'Spring Boot', 'SQL']);
        const reqId = data.requisitionId || null;
        const reqTitle = reqId ? (DatabaseService.requisitions?.find(r => r.id === reqId)?.title || reqId) : 'Unassigned (Talent Pool)';
        const matchScoreStr = data.resumeMatchScore?.overallScore ? `${data.resumeMatchScore.overallScore} / 100` : (reqId ? '82 / 100' : 'Talent Pool Evaluation');
        const isExistingCand = data.duplicateResolution === 'USE_EXISTING' && data.matchedCandidateId;
        const duplicateStatusStr = data.duplicateDetected
          ? (isExistingCand ? `Existing Match (${data.matchedCandidateId}) — Link Application` : 'Duplicate Found — Force Create New')
          : 'Clean Record (No Duplicate)';

        const actionLabel = isExistingCand
          ? (reqId ? 'Link Application to Existing Candidate' : 'Update Existing Candidate')
          : (reqId ? 'Create Candidate & Application' : 'Create Candidate Record');

        const reviewTitle = isExistingCand ? `Candidate Update & Application Review: ${candName}` : `Final Candidate Review: ${candName}`;

        const details = [
          { label: 'Candidate Name', value: candName, source: data.userProvidedFields?.has('candidateName') ? 'USER PROVIDED' : 'FROM RESUME' },
          { label: 'Email Address', value: email, source: data.userProvidedFields?.has('email') ? 'USER PROVIDED' : 'FROM RESUME' },
          { label: 'Phone Number', value: phone, source: data.userProvidedFields?.has('phone') ? 'USER PROVIDED' : 'FROM RESUME' },
          { label: 'Current Location', value: location, source: data.userProvidedFields?.has('location') ? 'USER PROVIDED' : 'FROM RESUME' },
          { label: 'Current Designation', value: title, source: data.userProvidedFields?.has('currentTitle') ? 'USER PROVIDED' : 'FROM RESUME' },
          { label: 'Current Company', value: company, source: data.userProvidedFields?.has('currentCompany') ? 'USER PROVIDED' : 'FROM RESUME' },
          { label: 'Total Experience', value: exp, source: data.userProvidedFields?.has('totalExperience') ? 'USER PROVIDED' : 'FROM RESUME' },
          { label: 'Skills Breakdown', value: skills.slice(0, 8).join(', '), source: data.userProvidedFields?.has('skills') ? 'USER PROVIDED' : 'FROM RESUME' },
          { label: 'Attached Document', value: data.fileName || data.resumeFile?.name || 'Candidate_Resume.pdf', source: 'FROM RESUME' },
          { label: 'Target Requisition', value: reqTitle, source: reqId ? 'APPROVED REQ' : 'NOT LINKED' },
          { label: 'Resume Match Score', value: matchScoreStr, source: 'JD MATCH ENGINE' },
          { label: 'Duplicate Status', value: duplicateStatusStr, source: 'SYSTEM AUDIT' },
          { label: 'Application Status', value: reqId ? 'Draft Ready / Screened' : 'Talent Pool Intake', source: 'ATS WORKFLOW' }
        ];

        const baseSummary = lang === 'te'
          ? `📋 **అభ్యర్థి ప్రొఫైల్ సమీక్ష (Step 6 of 7 — Final Candidate Review):**\n\nదయచేసి క్రింది అభ్యర్థి వివరాలు మరియు JD మ్యాచ్ స్కోర్‌ను పరిశీలించి నిర్ధారించండి:`
          : lang === 'hi'
          ? `📋 **उम्मीदवार प्रोफाइल समीक्षा (Step 6 of 7 — Final Candidate Review):**\n\nकृपया निम्नलिखित उम्मीदवार विवरण और JD मैच स्कोर की समीक्षा करें और पुष्टि करें:`
          : `📋 **Step 6 of 7 — Consolidated Final Review**\n\nPlease review the complete candidate profile, matched Job Description, and application draft before final creation:`;

        const summaryText = customHeader ? `${customHeader}\n\n${baseSummary}` : baseSummary;

        return {
          text: summaryText,
          cards: [
            {
              type: 'candidate_review_card',
              title: reviewTitle,
              badge: isExistingCand ? 'Existing Candidate Match' : 'Ready for Creation',
              badgeColor: isExistingCand ? 'blue' : 'emerald',
              details,
              skills,
              actions: [
                { label: actionLabel, action: 'confirm_candidate_create', color: 'emerald' },
                { label: 'Edit Details', action: 'edit_workflow_field', color: 'blue' },
                { label: 'Cancel', action: 'cancel_workflow', color: 'rose' }
              ]
            }
          ],
          toolCalls: []
        };
      },

      // =======================================================================
      // STEP 7 — FINAL EXECUTION, PERSISTENCE & POST-SAVE VERIFICATION
      // =======================================================================
      executor: async (session, context) => {
        DatabaseService.init();
        const data = session.getAllData();
        const actor = AIPermissionService.getUserContext(context);
        const lang = context.language || 'en';

        // 1. RBAC Permission Check
        const permCheck = AIPermissionService.canExecute('create:candidate', context.user);
        if (!permCheck.authorized) {
          throw new Error(`403 Forbidden: You lack the required permission to create candidate records (${permCheck.reason}).`);
        }

        const isTalentPool = data.linkageMode === 'TALENT_POOL' || !data.requisitionId;
        const isUseExisting = data.duplicateResolution === 'USE_EXISTING' && data.matchedCandidateId;
        let createdCandidate = null;
        let createdApp = null;
        const candidateId = isUseExisting
          ? data.matchedCandidateId
          : `CAND-${Math.floor(1000 + Math.random() * 9000)}`;
        const candidateNumber = `CD-${Math.floor(8800 + Math.random() * 200)}`;

        const skills = Array.isArray(data.skills) ? data.skills : (data.skills ? String(data.skills).split(',').map(s => s.trim()) : ['Java', 'Spring Boot', 'SQL']);
        const experienceNum = parseFloat(String(data.totalExperience || '0').replace(/[^\d.]/g, '')) || 0;

        if (isUseExisting) {
          // --- UPDATE / LINK EXISTING CANDIDATE ---
          const existingIdx = (DatabaseService.candidates || []).findIndex(c => c.id === candidateId);
          if (existingIdx >= 0) {
            const existing = DatabaseService.candidates[existingIdx];
            createdCandidate = {
              ...existing,
              updatedAt: new Date().toISOString()
            };
            DatabaseService.candidates[existingIdx] = createdCandidate;
          } else {
            throw new Error(`Matched candidate ${candidateId} could not be found in repository.`);
          }

          // Check if application already exists for this requisition (only if not talent pool)
          if (!isTalentPool && data.requisitionId) {
            const existingApp = (DatabaseService.applications || []).find(a => 
              a.candidateId === candidateId && a.requisitionId === data.requisitionId
            );
            if (existingApp) {
              createdApp = existingApp;
            } else {
              const req = (DatabaseService.requisitions || []).find(r => r.id === data.requisitionId);
              createdApp = {
                id: `APP-2026-${String((DatabaseService.applications || []).length + 1).padStart(3, '0')}`,
                candidateId,
                requisitionId: data.requisitionId,
                jobTitle: req?.title || req?.jobTitle || 'Requisition Role',
                department: req?.department || 'Engineering',
                stage: 'Applied',
                status: 'Active',
                source: 'AI Resume Intake',
                assignedRecruiter: actor.name || 'Current User',
                hiringManager: req?.hiringManager || 'Hiring Manager',
                appliedAt: new Date().toISOString().split('T')[0],
                lastActivity: new Date().toISOString()
              };
              DatabaseService.applications.unshift(createdApp);
            }
          }
        } else {
          // --- CREATE BRAND NEW CANDIDATE ---
          const candName = SanitizerService.escapeHtml(data.candidateName || 'Rahul Kumar');
          const email = SanitizerService.sanitizeEmailHeader(data.email || 'rahul@example.com');
          const phone = SanitizerService.escapeHtml(data.phone || '');
          const fileName = SanitizerService.escapeHtml(data.fileName || data.resumeFile?.name || 'Resume.pdf');

          createdCandidate = {
            id: candidateId,
            candidateNumber,
            name: candName,
            candidateName: candName,
            email,
            phone,
            formattedPhone: phone,
            countryCode: 'IN',
            location: SanitizerService.escapeHtml(data.location || 'Bangalore, India'),
            currentTitle: SanitizerService.escapeHtml(data.currentTitle || 'Software Engineer'),
            currentCompany: SanitizerService.escapeHtml(data.currentCompany || 'Technology Corp'),
            totalExperience: experienceNum,
            experienceDisplay: `${experienceNum} yrs`,
            noticePeriod: '30 Days',
            preferredLocation: data.location || 'Bangalore, India',
            workAuthorization: 'Authorized',
            stage: isTalentPool ? 'Talent Pool' : 'Applied',
            status: 'Active',
            talentPoolDestination: isTalentPool ? 'GENERAL' : null,
            linkageMode: isTalentPool ? 'TALENT_POOL' : 'REQUISITION',
            avatar: candName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CD',
            avatarBg: '#6366f1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: ['AI Parsed', ...(isTalentPool ? ['Talent Pool'] : []), ...skills.slice(0, 2)],
            skills,
            experience: data.experienceHistory || [
              {
                id: 'exp-1',
                title: data.currentTitle || 'Software Engineer',
                company: data.currentCompany || 'Technology Corp',
                duration: `${experienceNum} yrs`,
                isCurrent: true,
                location: data.location || 'Bangalore'
              }
            ],
            education: data.educationHistory || [
              {
                id: 'edu-1',
                degree: 'B.Tech in Computer Science',
                institution: 'Educational Institution',
                startYear: '2018',
                endYear: '2022'
              }
            ],
            certifications: data.certifications || [],
            documents: [
              {
                id: `DOC-${Date.now()}`,
                name: fileName,
                type: 'resume',
                fileSize: data.resumeFile?.size ? `${(data.resumeFile.size / 1024).toFixed(0)} KB` : '450 KB',
                uploadedDate: new Date().toISOString().split('T')[0],
                uploadedBy: actor.name || 'AI Copilot'
              }
            ],
            timeline: [
              {
                id: `TL-${Date.now()}`,
                event: isTalentPool ? 'Candidate Added to General Talent Pool' : 'Candidate Created via AI Resume Intake',
                action: 'Candidate Created',
                user: actor.name || 'AI Copilot',
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                details: isTalentPool
                  ? `Extracted from resume '${fileName}' and placed into General Talent Pool.`
                  : `Extracted from resume '${fileName}' and linked to ${data.requisitionId}.`
              }
            ]
          };

          DatabaseService.candidates.unshift(createdCandidate);

          if (!isTalentPool && data.requisitionId) {
            const req = (DatabaseService.requisitions || []).find(r => r.id === data.requisitionId);
            createdApp = {
              id: `APP-2026-${String((DatabaseService.applications || []).length + 1).padStart(3, '0')}`,
              candidateId,
              requisitionId: data.requisitionId,
              jobTitle: req?.title || req?.jobTitle || 'Requisition Role',
              department: req?.department || 'Engineering',
              stage: 'Applied',
              status: 'Active',
              source: 'AI Resume Intake',
              assignedRecruiter: actor.name || 'Current User',
              hiringManager: req?.hiringManager || 'Hiring Manager',
              appliedAt: new Date().toISOString().split('T')[0],
              lastActivity: new Date().toISOString(),
              screeningScore: data.resumeMatchScore?.overallScore || 85,
              screeningOutcome: (data.resumeMatchScore?.overallScore || 85) >= 75 ? 'Strong Match' : 'Moderate Match',
              timeline: [
                {
                  id: `TL-${Date.now()}`,
                  action: 'Application Initiated',
                  user: actor.name || 'AI Copilot',
                  timestamp: new Date().toISOString(),
                  details: `Applied to ${data.requisitionId} via AI Copilot`
                }
              ]
            };
            DatabaseService.applications.unshift(createdApp);
          }
        }

        // 2. Persist in DatabaseService & Storage
        DatabaseService.persistAll();

        // 3. Sync to browser Storage
        if (typeof window !== 'undefined') {
          try {
            const currentCands = localStorage.getItem('pw_db_candidates');
            const parsedCands = currentCands ? JSON.parse(currentCands) : [];
            localStorage.setItem('pw_db_candidates', JSON.stringify([createdCandidate, ...parsedCands.filter(c => c.id !== candidateId)]));
            sessionStorage.setItem('pw_candidates', JSON.stringify([createdCandidate, ...parsedCands.filter(c => c.id !== candidateId)]));

            if (createdApp) {
              const currentApps = localStorage.getItem('pw_db_applications');
              const parsedApps = currentApps ? JSON.parse(currentApps) : [];
              localStorage.setItem('pw_db_applications', JSON.stringify([createdApp, ...parsedApps.filter(a => a.id !== createdApp.id)]));
              sessionStorage.setItem('pw_applications', JSON.stringify([createdApp, ...parsedApps.filter(a => a.id !== createdApp.id)]));
            }

            // Real-time Event Dispatches for Live Hub Reactivity
            window.dispatchEvent(new CustomEvent('pw:candidate_created', { detail: createdCandidate }));
            window.dispatchEvent(new CustomEvent('pw_candidate_created', { detail: createdCandidate }));
            if (createdApp) {
              window.dispatchEvent(new CustomEvent('pw:application_created', { detail: createdApp }));
            }
            window.dispatchEvent(new CustomEvent('pw_db_updated', { detail: { type: 'candidate', record: createdCandidate } }));
          } catch (e) {
            console.warn('[CandidateIntakeWorkflow] Storage sync notice:', e);
          }
        }

        // 4. Audit Log
        AIAuditService.logAction({
          action: isTalentPool ? 'CREATE_TALENT_POOL_CANDIDATE' : (isUseExisting ? 'LINK_CANDIDATE_APPLICATION' : 'CREATE_CANDIDATE_FROM_RESUME'),
          intent: 'CREATE_CANDIDATE_FROM_RESUME',
          entityType: 'candidate',
          entityId: candidateId,
          details: {
            candidateName: createdCandidate.name || createdCandidate.candidateName,
            email: createdCandidate.email,
            requisitionId: isTalentPool ? null : (data.requisitionId || null),
            applicationId: createdApp?.id || null,
            destination: isTalentPool ? 'GENERAL_TALENT_POOL' : 'REQUISITION',
            document: createdCandidate.documents?.[0]?.name || 'Resume'
          },
          actor
        });

        // 5. Verification Check in DB
        const verifiedCand = (DatabaseService.candidates || []).find(c => c.id === candidateId);
        if (!verifiedCand) {
          throw new Error(`Database verification failed: Candidate ${candidateId} could not be confirmed in storage.`);
        }

        const linkedReqTitle = !isTalentPool && data.requisitionId
          ? (DatabaseService.requisitions?.find(r => r.id === data.requisitionId)?.title || data.requisitionId)
          : 'General Talent Pool';

        const successText = isTalentPool
          ? (lang === 'te'
              ? `🎉 **అభ్యర్థి ప్రొఫైల్ విజయవంతంగా జనరల్ టాలెంట్ పూల్‌లో చేర్చబడింది!**\n\n• **Candidate ID:** \`${candidateId}\` (${candidateNumber})\n• **పేరు:** **${verifiedCand.name || verifiedCand.candidateName}**\n• **ఈమెయిల్:** ${verifiedCand.email}\n• **ఫోన్:** ${verifiedCand.phone || 'N/A'}\n• **అనుభవం:** ${verifiedCand.experienceDisplay || verifiedCand.totalExperience}\n• **స్థానం:** **General Talent Pool** (Requisition లింక్ లేదు)\n\nఈ అభ్యర్థి ఇప్పుడు **Candidates Hub** లో అందుబాటులో ఉన్నారు.`
              : lang === 'hi'
              ? `🎉 **उम्मीदवार प्रोफाइल सफलतापूर्वक जनरल टैलेंट पूल में जोड़ दी गई!**\n\n• **Candidate ID:** \`${candidateId}\` (${candidateNumber})\n• **नाम:** **${verifiedCand.name || verifiedCand.candidateName}**\n• **ईमेल:** ${verifiedCand.email}\n• **फोन:** ${verifiedCand.phone || 'N/A'}\n• **अनुभव:** ${verifiedCand.experienceDisplay || verifiedCand.totalExperience}\n• **गंतव्य:** **General Talent Pool** (कोई Requisition नहीं)\n\nयह उम्मीदवार अब **Candidates Hub** में लाइव दिखाई दे रहा है।`
              : `🎉 **Candidate Successfully Added to General Talent Pool!**\n\n• **Candidate ID:** \`${candidateId}\` (${candidateNumber})\n• **Name:** **${verifiedCand.name || verifiedCand.candidateName}**\n• **Email:** ${verifiedCand.email}\n• **Phone:** ${verifiedCand.phone || 'N/A'}\n• **Location:** ${verifiedCand.location}\n• **Total Experience:** ${verifiedCand.experienceDisplay || `${verifiedCand.totalExperience} yrs`}\n• **Destination:** **General Talent Pool** (No requisition linked)\n• **Document Saved:** \`${verifiedCand.documents?.[0]?.name || 'Resume.pdf'}\`\n\nThe candidate profile has been committed to the **Candidates Hub** and is available immediately in real time.`)
          : (lang === 'te'
              ? `🎉 **అభ్యర్థి ప్రొఫైల్ విజయవంతంగా సృష్టించబడింది!**\n\n• **Candidate ID:** \`${candidateId}\` (${candidateNumber})\n• **పేరు:** **${verifiedCand.name || verifiedCand.candidateName}**\n• **ఈమెయిల్:** ${verifiedCand.email}\n• **ఫోన్:** ${verifiedCand.phone || 'N/A'}\n• **అనుభవం:** ${verifiedCand.experienceDisplay || verifiedCand.totalExperience}\n• **లింక్ చేసిన Requisition:** ${linkedReqTitle}\n\nఈ అభ్యర్థి ఇప్పుడు **Candidates Hub** లో వెంటనే కనిపిస్తారు.`
              : lang === 'hi'
              ? `🎉 **उम्मीदवार प्रोफाइल सफलतापूर्वक बनाई गई!**\n\n• **Candidate ID:** \`${candidateId}\` (${candidateNumber})\n• **नाम:** **${verifiedCand.name || verifiedCand.candidateName}**\n• **ईमेल:** ${verifiedCand.email}\n• **फोन:** ${verifiedCand.phone || 'N/A'}\n• **अनुभव:** ${verifiedCand.experienceDisplay || verifiedCand.totalExperience}\n• **Requisition लिंकेज:** ${linkedReqTitle}\n\nयह उम्मीदवार अब **Candidates Hub** में लाइव दिखाई दे रहा है।`
              : `🎉 **Candidate Successfully Created & Verified in ATS!**\n\n• **Candidate ID:** \`${candidateId}\` (${candidateNumber})\n• **Name:** **${verifiedCand.name || verifiedCand.candidateName}**\n• **Email:** ${verifiedCand.email}\n• **Phone:** ${verifiedCand.phone || 'N/A'}\n• **Location:** ${verifiedCand.location}\n• **Total Experience:** ${verifiedCand.experienceDisplay || `${verifiedCand.totalExperience} yrs`}\n• **Requisition Link:** ${linkedReqTitle}${createdApp ? ` (Application \`${createdApp.id}\`)` : ''}\n• **Document Saved:** \`${verifiedCand.documents?.[0]?.name || 'Resume.pdf'}\`\n\nThe candidate profile has been committed to the **Candidates Hub** and is available immediately in real time.`);

        return {
          text: successText,
          cards: [
            {
              type: 'candidate_created_card',
              title: `Candidate: ${verifiedCand.name || verifiedCand.candidateName}`,
              badge: isTalentPool ? 'Added to Talent Pool' : (createdApp ? 'Created + Applied' : 'Created in Talent Pool'),
              badgeColor: 'emerald',
              candidateId,
              candidateNumber,
              candidateName: verifiedCand.name || verifiedCand.candidateName,
              email: verifiedCand.email,
              phone: verifiedCand.phone,
              location: verifiedCand.location,
              currentTitle: verifiedCand.currentTitle,
              experience: verifiedCand.experienceDisplay || `${verifiedCand.totalExperience} yrs`,
              skills: verifiedCand.skills || [],
              requisitionId: isTalentPool ? 'Talent Pool' : (data.requisitionId || null),
              applicationId: createdApp?.id || null,
              actions: [
                { label: 'View Candidate Profile', action: 'view_candidate_profile', candidateId },
                ...(!isTalentPool && data.requisitionId ? [{ label: 'Screen Candidate (Phase 5)', action: 'screen_candidate_action', candidateId, requisitionId: data.requisitionId }] : [])
              ]
            }
          ],
          toolCalls: [
            {
              name: 'createCandidateFromResume',
              params: { candidateId, candidateName: verifiedCand.name, email: verifiedCand.email },
              result: { success: true, candidate: verifiedCand, application: createdApp }
            }
          ]
        };
      }
    });
  }

  /**
   * Overridden processTurn to handle exact 7 conversational steps with file upload and parsing
   */
  async processTurn(session, userInput, context = {}) {
    const rawInput = safeString(userInput).trim();
    const lower = normalizeText(rawInput);
    const lang = context.language || 'en';

    this._initializePhase4State(session, session.getAllData(), context);
    session.turnCount = (session.turnCount || 0) + 1;

    // 0A. Cancel Check
    if (this._isCancelCommand(lower, rawInput)) {
      return this._handleCancellation(session, lang);
    }

    // 0B. Start Over / Restart Check
    if (this._isRestartCommand(lower, rawInput)) {
      session.clearFields();
      session.setStatus('COLLECTING');
      session.setField('sessionId', session.id);
      session.setField('currentPhase4Step', 1);
      session.setField('fileValidationStatus', null);
      session.setField('parsedResume', null);
      session.setField('extractedCandidate', null);
      session.setField('attachedFile', null);
      session.setField('fileName', null);
      session.setField('fileType', null);
      session.setField('duplicateResults', null);
      session.setField('selectedRequisition', null);
      session.setField('applicationDraft', null);
      session.setField('linkageMode', null);
      session.setField('talentPoolDestination', null);
      session.setField('resumeMatchScore', null);
      AIContextService.clearFileAttachment();
      return {
        text: lang === 'te'
          ? 'ఖచ్చితంగా. కొత్త అభ్యర్థి ఇన్‌టేక్ ప్రారంభించబడుతోంది. దయచేసి అభ్యర్థి రెజ్యూమ్‌ను అప్‌లోడ్ చేయండి.'
          : lang === 'hi'
          ? 'ज़रूर। नया उम्मीदवार इनटेक शुरू हो रहा है। कृपया उम्मीदवार का रिज्यूम अपलोड करें।'
          : "Sure. Starting a new candidate intake. Please upload the candidate's resume to continue.",
        cards: [
          {
            type: 'resume_upload_card',
            title: 'Upload Candidate Resume',
            step: 1,
            subtitle: 'Drag & drop PDF, DOCX, or TXT (Max 10MB)'
          }
        ],
        toolCalls: []
      };
    }

    // 1. Natural Language Query & Inspection Handlers
    // 1A. "Show me the resume score" / "What is the match score?"
    if (session.hasField('parsedResume') && /\b(show\s+(?:me\s+)?(?:the\s+)?(?:resume\s+)?(?:match\s+)?score|what\s+is\s+(?:the\s+)?(?:resume\s+)?(?:match\s+)?score|resume\s+score|match\s+score)\b/i.test(lower)) {
      let matchResult = session.getField('resumeMatchScore');
      if (!matchResult) {
        const resolved = this._resolveJdOrRequisitionContext(session, rawInput, lower, context);
        const parsedData = session.getField('parsedResume') || session.getAllData();
        matchResult = ResumeMatchingService.calculateMatch(parsedData, resolved?.jd || resolved?.req || null);
        session.setField('resumeMatchScore', matchResult);
      }
      const scoreCard = this._buildResumeMatchScoreCard(session, matchResult);
      return {
        text: `📊 **Resume Match Score Analysis:**\n\nOverall alignment for **${session.getField('candidateName') || 'Candidate'}** against **${matchResult.jdTitle}** is **${matchResult.overallScore}/100**.\n\n• **Skill Match:** ${matchResult.breakdown.skillMatch}%\n• **Experience Match:** ${matchResult.breakdown.experienceMatch}%\n• **Role Match:** ${matchResult.breakdown.roleMatch}%\n• **Education Match:** ${matchResult.breakdown.educationMatch}%`,
        cards: [scoreCard],
        toolCalls: []
      };
    }

    // 1B. "What skills are missing?" / "Missing requirements"
    if (session.hasField('parsedResume') && /\b(what\s+skills?\s+are\s+missing|missing\s+skills?|missing\s+requirements?|skill\s+gaps?|gap\s+analysis)\b/i.test(lower)) {
      let matchResult = session.getField('resumeMatchScore');
      if (!matchResult) {
        const resolved = this._resolveJdOrRequisitionContext(session, rawInput, lower, context);
        const parsedData = session.getField('parsedResume') || session.getAllData();
        matchResult = ResumeMatchingService.calculateMatch(parsedData, resolved?.jd || resolved?.req || null);
        session.setField('resumeMatchScore', matchResult);
      }
      const missingList = matchResult.missingMandatorySkills?.length > 0
        ? matchResult.missingMandatorySkills.map(s => `• ⚠️ **${s}** (Mandatory Requirement)`).join('\n')
        : '• ✅ No mandatory skills are missing! Candidate meets all required core competencies.';

      return {
        text: `🔍 **Skill Gap Analysis against ${matchResult.jdTitle}:**\n\n${missingList}\n\nCandidate has strong matched competencies in: **${matchResult.matchedSkills?.join(', ') || 'General engineering'}**.`,
        cards: [this._buildResumeMatchScoreCard(session, matchResult)],
        toolCalls: []
      };
    }

    // 1C. "Change JD to..." / "Use this resume for QA Engineer"
    if (session.hasField('parsedResume') && /\b(change\s+(?:the\s+)?jd|switch\s+(?:the\s+)?jd|use\s+(?:this\s+)?resume\s+for|evaluate\s+for|target\s+role)\b/i.test(lower)) {
      const cleanTarget = rawInput.replace(/^(?:change\s+(?:the\s+)?jd\s+to|switch\s+(?:the\s+)?jd\s+to|use\s+(?:this\s+)?resume\s+for|evaluate\s+for|target\s+role\s+is)[:\s]*/i, '').trim();
      const resolved = this._resolveJdOrRequisitionContext(session, cleanTarget, normalizeText(cleanTarget), context);
      if (resolved) {
        session.setField('requisitionId', resolved.req?.id || '');
        session.setField('selectedRequisition', resolved.req?.id || '');
        session.setField('selectedJd', (resolved.jd || resolved.req).id);
        const parsedData = session.getField('parsedResume') || session.getAllData();
        const matchResult = ResumeMatchingService.calculateMatch(parsedData, resolved.jd || resolved.req);
        session.setField('resumeMatchScore', matchResult);
        session.setStatus('PREVIEW');
        session.setField('currentPhase4Step', 6);
        return this._buildPreviewResponse(session, lang, `🎯 Updated Target Job Description to **${matchResult.jdTitle}** (${resolved.req?.id || 'Approved JD'}). Recalculated match score: **${matchResult.overallScore}/100**.`);
      }
    }

    // 2. Check if user provided explicit field correction (e.g. "Change email to ...", "Phone is ...", "Add skill Playwright")
    if (session.turnCount > 1 && session.hasField('parsedResume')) {
      const correctionHandled = this._handleCandidateFieldCorrection(session, rawInput, lower, lang);
      if (correctionHandled) {
        // If candidate skills or experience changed, recalculate match score
        if (session.hasField('selectedJd') || session.hasField('requisitionId')) {
          const resolved = this._resolveJdOrRequisitionContext(session, '', '', context);
          if (resolved) {
            const parsedData = session.getAllData();
            const matchResult = ResumeMatchingService.calculateMatch(parsedData, resolved.jd || resolved.req);
            session.setField('resumeMatchScore', matchResult);
          }
        }

        if (session.isPreview()) {
          return this._buildPreviewResponse(session, lang, correctionHandled.feedback);
        }
        // If in step 3/4/5, re-render current stage with feedback
        const nextMissing = this.getNextMissingRequiredField(session);
        if (!nextMissing) {
          session.setStatus('PREVIEW');
          session.setField('currentPhase4Step', 6);
          return this._buildPreviewResponse(session, lang, correctionHandled.feedback);
        }
        return this._formulateQuestion(session, nextMissing, lang, correctionHandled.feedback);
      }
    }

    // 3. PREVIEW CONFIRMATION / REJECTION (Step 6 -> Step 7)
    if (session.isPreview()) {
      session.setField('currentPhase4Step', 7);
      return await this._processPreviewTurn(session, rawInput, lower, lang, context);
    }

    // 4. STEP 1 & 2: Resume File Upload & Automatic End-to-End Progression Handling
    if (!session.hasField('parsedResume')) {
      const uploadedFile = context.file || context.uploadedFile || context.attachment || context.activeFile || session.getField('attachedFile');
      if (uploadedFile) {
        const currentFileId = `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        session.setField('currentFileId', currentFileId);
        session.setField('sessionId', session.id);
        const capturedSessionId = session.id;
        const capturedFileId = currentFileId;

        // Wipe previous parsed data to prevent stale state
        session.setField('parsedResume', null);
        session.setField('extractedCandidate', null);
        session.setField('duplicateResults', null);
        session.setField('resumeMatchScore', null);
        session.setField('applicationDraft', null);

        // Run Document Security Validation
        const securityCheck = await DocumentSecurityService.validateDocumentUpload({
          file: uploadedFile,
          name: uploadedFile.name,
          size: uploadedFile.size
        });

        // Discard if session changed or file superseded
        if (session.id !== capturedSessionId || session.getField('currentFileId') !== capturedFileId || session.isCancelled()) {
          return { text: '', cards: [], toolCalls: [] };
        }

        if (!securityCheck.isValid) {
          session.setField('fileValidationStatus', 'INVALID');
          session.setField('currentPhase4Step', 1);
          return {
            text: `⚠️ **Security Validation Error (Step 1 of 7):** ${securityCheck.error}\n\nPlease upload a valid text-based resume in PDF, DOCX, or TXT format (max 10MB).`,
            cards: [{ type: 'resume_upload_card', title: 'Upload Candidate Resume', step: 1, subtitle: 'Drag & drop PDF, DOCX, or TXT (Max 10MB)' }],
            toolCalls: []
          };
        }

        // Run Parser Engine
        try {
          const parsedText = await extractTextFromFile(uploadedFile);
          
          // Discard if session changed during async extraction
          if (session.id !== capturedSessionId || session.getField('currentFileId') !== capturedFileId || session.isCancelled()) {
            return { text: '', cards: [], toolCalls: [] };
          }

          if (!parsedText || parsedText.trim().length === 0) {
            session.setField('currentPhase4Step', 1);
            return {
              text: `⚠️ **Parsing Notice (Step 2 of 7):** I couldn't extract readable text from '${uploadedFile.name}'. The document may be an image-only scan or encrypted.\n\nPlease upload a text-based PDF, DOCX, or TXT resume or provide candidate details manually.`,
              cards: [{ type: 'resume_upload_card', title: 'Upload Readable Resume', step: 1, subtitle: 'Drag & drop PDF, DOCX, or TXT (Max 10MB)' }],
              toolCalls: []
            };
          }

          const parsedData = parseResumeText(parsedText, uploadedFile.name, `${((uploadedFile.size || 1024) / 1024).toFixed(0)} KB`);
          const candidateModel = mapParsedDataToCandidateModel(parsedData);
          
          parsedData.sessionId = session.id;
          parsedData.fileId = currentFileId;
          candidateModel.sessionId = session.id;
          candidateModel.fileId = currentFileId;

          session.setField('fileValidationStatus', 'VALID');
          session.setField('attachedFile', uploadedFile);
          session.setField('fileName', uploadedFile.name);
          session.setField('fileType', uploadedFile.type || 'application/pdf');
          session.setField('parsedResume', parsedData);
          session.setField('extractedCandidate', candidateModel);
          session.setField('resumeFile', { name: uploadedFile.name, size: uploadedFile.size || 1024, type: uploadedFile.type || 'application/pdf' });

          this._populateExtractedFields(session, parsedData, uploadedFile.name);

          // Apply initial prompt overrides if present
          if (session.getField('candidateName')) {
            session.setField('candidateName', session.getField('candidateName'));
          }
          if (session.getField('requisitionId')) {
            session.setField('requisitionId', session.getField('requisitionId'));
            session.setField('selectedRequisition', session.getField('requisitionId'));
          }

          // Step 2 & 3: Generate Preview Card & Extraction Card
          const previewCard = this._buildResumePreviewCard(session);
          const extractionCard = this._buildExtractionCard(session, 'Extracted');

          // Step 4: Run Duplicate Check on extracted identity
          const candName = session.getField('candidateName') || parsedData.candidateName || '';
          const email = session.getField('email') || parsedData.email || '';
          const phone = session.getField('phone') || parsedData.phone || '';

          let isDuplicate = false;
          let dupCard = null;
          let matchedCand = null;

          if (email || phone || (candName && candName !== 'Candidate' && candName !== 'N/A')) {
            const dupResult = await candidateService.checkDuplicate({ email, phone, name: candName });
            session.setField('duplicateResults', dupResult);
            if (dupResult.isDuplicate && dupResult.matchedCandidate) {
              isDuplicate = true;
              matchedCand = dupResult.matchedCandidate;
              session.setField('duplicateDetected', true);
              session.setField('matchedCandidateId', matchedCand.id);
              session.setField('matchedCandidateName', matchedCand.name || matchedCand.candidateName);
              dupCard = {
                type: 'duplicate_candidate_card',
                title: 'Duplicate Match Detected (Step 4 of 7)',
                matchType: dupResult.matchType,
                reason: dupResult.reason,
                candidate: {
                  id: matchedCand.id,
                  name: matchedCand.name || matchedCand.candidateName,
                  email: matchedCand.email,
                  phone: matchedCand.phone || matchedCand.formattedPhone,
                  currentStage: matchedCand.stage || 'Talent Pool'
                },
                actions: [
                  { label: 'Use Existing Candidate', action: 'use_existing_candidate', color: 'blue' },
                  { label: 'Create New Candidate', action: 'create_new_candidate', color: 'slate' }
                ]
              };
            } else {
              session.setField('duplicateDetected', false);
              session.setField('duplicateResolution', 'RESOLVED_NEW');
            }
          }

          // Step 5: Check whether a JD / Requisition is already available in context
          const resolvedContext = this._resolveJdOrRequisitionContext(session, rawInput, lower, context);

          if (resolvedContext) {
            // JD IS AVAILABLE: Automatically calculate match score, prepare application draft, advance to Step 6 Preview!
            const targetJd = resolvedContext.jd || resolvedContext.req;
            const targetReqId = resolvedContext.req?.id || '';
            session.setField('requisitionId', targetReqId);
            session.setField('selectedRequisition', targetReqId);
            session.setField('selectedJd', targetJd.id);

            const matchResult = ResumeMatchingService.calculateMatch(parsedData, targetJd);
            session.setField('resumeMatchScore', matchResult);

            const matchScoreCard = this._buildResumeMatchScoreCard(session, matchResult);
            const appDraftCard = this._buildApplicationDraftCard(session, matchResult);

            session.setStatus('PREVIEW');
            session.setField('currentPhase4Step', 6);

            const reviewResponse = this._buildPreviewResponse(session, lang);
            const cards = [previewCard, extractionCard];
            if (dupCard) cards.push(dupCard);
            cards.push(matchScoreCard, appDraftCard, reviewResponse.cards[0]);

            const autoAdvanceText = lang === 'te'
              ? `📄 **రెజ్యూమ్ విజయవంతంగా అప్‌లోడ్ చేసి పార్స్ చేయబడింది!**\n\n• **అభ్యర్థి:** **${session.getField('candidateName')}** (${session.getField('currentTitle') || 'Professional'})\n• **లక్ష్య JD:** **${matchResult.jdTitle}** (${targetReqId})\n• **JD మ్యాచ్ స్కోర్:** **${matchResult.overallScore} / 100**\n\n${dupCard ? '⚠️ **Duplicate Candidate Notice (Step 4 of 7):** A candidate with matching details was found in the database.\n\n' : ''}క్రింద ఉన్న పూర్తి వివరాలు మరియు అప్లికేషన్ డ్రాఫ్ట్‌ను పరిశీలించండి:`
              : lang === 'hi'
              ? `📄 **रिज्यूम सफलतापूर्वक अपलोड और पार्स किया गया!**\n\n• **उम्मीदवार:** **${session.getField('candidateName')}** (${session.getField('currentTitle') || 'Professional'})\n• **लक्ष्य JD:** **${matchResult.jdTitle}** (${targetReqId})\n• **JD मैच स्कोर:** **${matchResult.overallScore} / 100**\n\n${dupCard ? '⚠️ **Duplicate Candidate Notice (Step 4 of 7):** A candidate with matching details was found in the database.\n\n' : ''}कृपया नीचे दिए गए संपूर्ण उम्मीदवार विवरण और ड्राफ्ट की समीक्षा करें:`
              : `Resume received. I'll extract the candidate details now.\n\n📄 **Resume Uploaded & Parsed Successfully!**\n\nExtracted candidate profile for **${session.getField('candidateName')}** (${session.getField('currentTitle') || 'Professional'} · ${session.getField('totalExperience') || '0 yrs'}).\n\n🎯 **JD Match Score:** **${matchResult.overallScore} / 100** against **${matchResult.jdTitle}** (${targetReqId || 'Approved JD'}).\n\n${dupCard ? '⚠️ **Duplicate Candidate Notice (Step 4 of 7):** A candidate with matching details was found in the database.\n\n' : ''}Please review the consolidated candidate profile and application draft below:`;

            return {
              text: autoAdvanceText,
              cards,
              toolCalls: []
            };
          } else {
            // NO JD CONTEXT YET: Stay on Step 5 to ask which approved JD or requisition to evaluate against
            session.setField('currentPhase4Step', 5);
            DatabaseService.init();
            const openReqs = (DatabaseService.requisitions || []).filter(r => (r.status || '').toUpperCase() === 'APPROVED' || (r.status || '').toUpperCase() === 'OPEN');

            const reqSelectorCard = {
              type: 'requisition_selector_card',
              title: 'Select Approved Requisition / JD (Step 5 of 7)',
              requisitions: openReqs.map(r => ({
                id: r.id,
                title: r.title || r.jobTitle,
                department: r.department,
                location: r.location
              }))
            };

            const cards = [previewCard, extractionCard];
            if (dupCard) cards.push(dupCard);
            cards.push(reqSelectorCard);

            const promptJdText = lang === 'te'
              ? `📄 **రెజ్యూమ్ విజయవంతంగా పార్స్ చేయబడింది!**\n\n${dupCard ? '⚠️ **Duplicate Candidate Notice (Step 4 of 7):** A candidate with matching details was found in the database.\n\n' : ''}ఈ అభ్యర్థిని ఏ ఆమోదించబడిన Requisition లేదా JD తో మూల్యాంకనం చేయాలనుకుంటున్నారు? క్రింది జాబితా నుండి ఎంచుకోండి లేదా టాలెంట్ పూల్ కోసం "Skip" అనండి:`
              : lang === 'hi'
              ? `📄 **रिज्यूम सफलतापूर्वक पार्स किया गया!**\n\n${dupCard ? '⚠️ **Duplicate Candidate Notice (Step 4 of 7):** A candidate with matching details was found in the database.\n\n' : ''}इस उम्मीदवार का मूल्यांकन किस स्वीकृत Requisition / JD के आधार पर करना चाहते हैं? नीचे से चुनें या "Skip" कहें:`
              : `Resume received. I'll extract the candidate details now.\n\n📄 **Resume Uploaded & Parsed Successfully!**\n\nExtracted details for **${session.getField('candidateName')}**.\n\n${dupCard ? '⚠️ **Duplicate Candidate Notice (Step 4 of 7):** A candidate with matching details was found in the database.\n\n' : ''}Which approved JD or requisition should I use to evaluate this candidate? Please select an open requisition below or say "Skip" for general Talent Pool:`;

            return {
              text: promptJdText,
              cards,
              toolCalls: []
            };
          }
        } catch (err) {
          session.setField('currentPhase4Step', 1);
          return {
            text: `⚠️ **Resume Parsing Error:** ${err.message}. Please upload another resume or enter details.`,
            cards: [{ type: 'resume_upload_card', title: 'Retry Resume Upload', step: 1, subtitle: 'Drag & drop PDF, DOCX, or TXT (Max 10MB)' }],
            toolCalls: []
          };
        }
      } else {
        // NO file attachment exists -> Stay firmly on Step 1 of 7!
        session.setField('currentPhase4Step', 1);
        session.setField('attachedFile', null);
        session.setField('fileName', null);
        session.setField('fileType', null);
        session.setField('fileValidationStatus', 'PENDING');
        session.setField('parsedResume', null);
        session.setField('extractedCandidate', null);
        session.setField('duplicateResults', null);
        session.setField('applicationDraft', null);

        const promptText = lang === 'te'
          ? `ఖచ్చితంగా. దయచేసి కొనసాగడానికి అభ్యర్థి రెజ్యూమ్‌ను అప్‌లోడ్ చేయండి. మద్దతు ఉన్న ఫార్మాట్‌లు: PDF, DOCX, TXT.`
          : lang === 'hi'
          ? `ज़रूर। कृपया जारी रखने के लिए उम्मीदवार का बायोडाटा/रिज्यूम अपलोड करें। समर्थित प्रारूप: PDF, DOCX, TXT.`
          : `Sure. Please upload the candidate's resume to continue. Supported formats: PDF, DOCX, TXT.`;

        return {
          text: promptText,
          cards: [
            {
              type: 'resume_upload_card',
              title: 'Upload Candidate Resume',
              step: 1,
              subtitle: 'Drag & drop PDF, DOCX, or TXT (Max 10MB)'
            }
          ],
          toolCalls: []
        };
      }
    }

    // 5. STEP 4: DUPLICATE RESOLUTION TURN
    if (session.getField('duplicateDetected') && !session.getField('duplicateResolutionHandled')) {
      if (/\b(use\s+existing|existing|update\s+existing|link|reuse|1)\b/i.test(lower)) {
        session.setField('duplicateResolution', 'USE_EXISTING');
        session.setField('duplicateResolutionHandled', true);
      } else if (/\b(create\s+new|new\s+candidate|new|proceed\s+new|2)\b/i.test(lower)) {
        session.setField('duplicateResolution', 'CREATE_NEW');
        session.setField('duplicateResolutionHandled', true);
      }
    }

    // 6. STEP 5: REQUISITION & JD LINKAGE PROCESSING
    if (!session.hasField('requisitionId') || session.getField('currentPhase4Step') === 5) {
      if (this._isSkipCommand(lower) || /\b(skip|none|no\s+requisition|talent\s+pool)\b/i.test(lower)) {
        session.setField('requisitionId', '');
        session.setField('selectedRequisition', null);
        session.setField('selectedJd', null);
        session.setField('applicationDraft', null);
        session.setField('talentPoolDestination', 'GENERAL');
        session.setField('linkageMode', 'TALENT_POOL');
        session.setField('resumeMatchScore', null);
        session.setField('currentPhase4Step', 6);
        session.setStatus('PREVIEW');
        return this._buildPreviewResponse(session, lang, '📋 **Step 6 of 7 — Final Candidate Review (General Talent Pool)**\n\nCandidate will be added to the **General Talent Pool** (no requisition linkage).\n\nPlease review and confirm creation:');
      }

      const resolved = this._resolveJdOrRequisitionContext(session, rawInput, lower, context);
      if (resolved) {
        session.setField('requisitionId', resolved.req?.id || '');
        session.setField('selectedRequisition', resolved.req?.id || '');
        session.setField('selectedJd', (resolved.jd || resolved.req).id);
        session.setField('linkageMode', 'REQUISITION');
        session.setField('talentPoolDestination', null);

        const parsedData = session.getField('parsedResume') || session.getAllData();
        const matchResult = ResumeMatchingService.calculateMatch(parsedData, resolved.jd || resolved.req);
        session.setField('resumeMatchScore', matchResult);

        const matchScoreCard = this._buildResumeMatchScoreCard(session, matchResult);
        const appDraftCard = this._buildApplicationDraftCard(session, matchResult);

        session.setField('currentPhase4Step', 6);
        session.setStatus('PREVIEW');

        const reviewResponse = this._buildPreviewResponse(session, lang);
        return {
          text: `📋 **Step 6 of 7 — Final Candidate Review**\n\n🎯 **Requisition Selected:** Associated with **${resolved.req?.title || resolved.req?.id}**.\n\n• **Resume Match Score:** **${matchResult.overallScore}/100**\n\nPlease review the consolidated profile and application draft:`,
          cards: [matchScoreCard, appDraftCard, reviewResponse.cards[0]],
          toolCalls: []
        };
      } else {
        session.setField('currentPhase4Step', 5);
        DatabaseService.init();
        const openReqs = (DatabaseService.requisitions || []).filter(r => (r.status || '').toUpperCase() === 'APPROVED' || (r.status || '').toUpperCase() === 'OPEN');
        return {
          text: lang === 'te'
            ? `ఈ అభ్యర్థిని ఏ Requisition కి లింక్ చేయాలనుకుంటున్నారు? క్రింది జాబితా నుండి ఎంచుకోండి లేదా "Skip" అనండి:`
            : lang === 'hi'
            ? `इस उम्मीदवार को किस Requisition से जोड़ना चाहते हैं? नीचे से चुनें या "Skip" कहें:`
            : `Which requisition should this candidate be associated with? Select an open requisition below or say "Skip" for general Talent Pool:`,
          cards: [
            {
              type: 'requisition_selector_card',
              title: 'Select Open Requisition (Step 5 of 7)',
              requisitions: openReqs.map(r => ({
                id: r.id,
                title: r.title || r.jobTitle,
                department: r.department,
                location: r.location
              }))
            }
          ],
          toolCalls: []
        };
      }
    }

    // 7. Check if all required fields are present -> advance to Step 6 Preview
    const nextMissing = this.getNextMissingRequiredField(session);
    if (!nextMissing) {
      this._applyDefaultValues(session);
      session.setStatus('PREVIEW');
      session.setField('currentPhase4Step', 6);
      return this._buildPreviewResponse(session, lang);
    }

    session.currentFieldIndex = this.fields.findIndex(f => f.key === nextMissing.key);
    return this._formulateQuestion(session, nextMissing, lang);
  }

  // --- Helper Methods ---

  _isRestartCommand(lower, rawInput = '') {
    return /\b(start\s+over|restart|reset\s+(?:intake|candidate|workflow)|upload\s+(?:a\s+)?(?:different|another|new)\s+resume|replace\s+(?:this\s+)?resume|use\s+another\s+resume|malli\s+modalu|phir\s+se)\b/i.test(lower) ||
      /మళ్ళీ\s+మొదలు|फिर\s*से\s*शुरू/i.test(rawInput);
  }

  _initializePhase4State(session, allData = {}, context = {}) {
    if (!session.hasField('currentPhase4Step')) {
      session.setField('sessionId', session.id);
      session.setField('currentPhase4Step', 1);
      session.setField('attachedFile', null);
      session.setField('fileName', null);
      session.setField('fileType', null);
      session.setField('fileValidationStatus', null);
      session.setField('parsedResume', null);
      session.setField('extractedCandidate', null);
      session.setField('duplicateResults', null);
      session.setField('selectedRequisition', null);
      session.setField('applicationDraft', null);
      session.setField('linkageMode', null);
      session.setField('talentPoolDestination', null);
      session.setField('resumeMatchScore', null);
    }
  }

  _handleCancellation(session, lang) {
    session.setStatus('CANCELLED');
    session.clearFields();
    AIContextService.clearFileAttachment();
    WorkflowRegistry.clearActiveSession();

    const cancelMsg = lang === 'te'
      ? `❌ అభ్యర్థి రెజ్యూమ్ ఇన్‌టేక్ రద్దు చేయబడింది. ఏ రికార్డు సృష్టించబడలేదు.`
      : lang === 'hi'
      ? `❌ उम्मीदवार रिज्यूम इनटेक रद्द कर दिया गया है। कोई रिकॉर्ड नहीं बनाया गया।`
      : `❌ Candidate resume intake workflow has been cancelled. No candidate or application record was saved.`;

    return {
      text: cancelMsg,
      cards: [],
      toolCalls: []
    };
  }

  _populateExtractedFields(session, parsedData, fileName) {
    if (parsedData.candidateName && parsedData.candidateName !== 'N/A') {
      session.setField('candidateName', parsedData.candidateName);
    }
    if (parsedData.email && parsedData.email !== 'N/A') {
      session.setField('email', parsedData.email);
    }
    if (parsedData.phone && parsedData.phone !== 'N/A' && parsedData.phone !== '') {
      session.setField('phone', parsedData.phone);
    }
    if (parsedData.location && parsedData.location !== 'N/A') {
      session.setField('location', parsedData.location);
    }
    if (parsedData.totalExperience && parsedData.totalExperience !== 'N/A' && parsedData.totalExperience !== '') {
      session.setField('totalExperience', `${parsedData.totalExperience} yrs`);
    }
    if (parsedData.currentTitle && parsedData.currentTitle !== 'Not Found / Needs Review') {
      session.setField('currentTitle', parsedData.currentTitle);
    }
    if (parsedData.currentCompany && parsedData.currentCompany !== 'Not Found / Needs Review') {
      session.setField('currentCompany', parsedData.currentCompany);
    }
    if (parsedData.skills && parsedData.skills.length > 0) {
      session.setField('skills', parsedData.skills);
    }
    if (parsedData.experienceHistory) {
      session.setField('experienceHistory', parsedData.experienceHistory);
    }
    if (parsedData.educationHistory) {
      session.setField('educationHistory', parsedData.educationHistory);
    }
    if (parsedData.parsedSummary?.certifications) {
      session.setField('certifications', parsedData.parsedSummary.certifications);
    }
    session.setField('fileName', fileName);
  }

  _buildResumePreviewCard(session) {
    const data = session.getAllData();
    const parsed = data.parsedResume || {};
    const fileName = data.fileName || data.resumeFile?.name || 'Resume.pdf';
    const fileType = data.fileType || 'PDF Document';
    const fileSize = data.resumeFile?.size ? `${((data.resumeFile.size) / 1024).toFixed(0)} KB` : (parsed.fileSize || '1.2 MB');

    return {
      type: 'resume_preview_card',
      title: 'Step 2 of 7 — Resume Parsed & Document Preview',
      badge: 'Parsed Successfully',
      badgeColor: 'emerald',
      fileName,
      fileType,
      fileSize,
      candidateName: data.candidateName || parsed.candidateName || 'N/A',
      currentRole: data.currentTitle || parsed.currentTitle || 'Professional',
      currentCompany: data.currentCompany || parsed.currentCompany || 'N/A',
      experience: data.totalExperience || (parsed.totalExperience ? `${parsed.totalExperience} yrs` : '0 yrs'),
      location: data.location || parsed.location || 'Remote / Unspecified',
      email: data.email || parsed.email || 'Not Found',
      phone: data.phone || parsed.phone || 'Not Found',
      skills: Array.isArray(data.skills) ? data.skills : (parsed.skills || []),
      education: parsed.educationHistory?.[0]?.degree || (data.educationHistory?.[0]?.degree) || 'Degree Not Found',
      certifications: parsed.parsedSummary?.certifications?.join(', ') || 'None Listed',
      rawText: parsed.rawText || '',
      actions: [
        { label: 'Proceed to Details Review', action: 'proceed_to_review', color: 'blue' }
      ]
    };
  }

  _buildExtractionCard(session, badgeStatus = 'Extracted') {
    const data = session.getAllData();
    const parsed = data.parsedResume || {};
    const skills = Array.isArray(data.skills) ? data.skills : (parsed.skills || []);

    const getStatus = (val) => {
      if (!val || val === 'Not Found' || val === 'N/A' || val === 'None Listed') return 'Not Found';
      if (val === 'Needs Review' || val === 'Not Found / Needs Review') return 'Needs Review';
      return 'Extracted';
    };

    const sections = [
      {
        title: 'Personal & Identity',
        fields: [
          { label: 'Candidate Name', value: data.candidateName || 'Not Found', status: getStatus(data.candidateName) },
          { label: 'Email Address', value: data.email || 'Not Found', status: getStatus(data.email) },
          { label: 'Phone Number', value: data.phone || 'Not Found', status: getStatus(data.phone) },
          { label: 'Current Location', value: data.location || 'Not Found', status: getStatus(data.location) },
          { label: 'Preferred Location', value: parsed.preferredLocation || data.location || 'Not Found', status: getStatus(parsed.preferredLocation) },
          { label: 'Work Authorization', value: parsed.employmentType || 'Authorized', status: 'Extracted' }
        ]
      },
      {
        title: 'Professional Summary',
        fields: [
          { label: 'Current Designation', value: data.currentTitle || 'Not Found', status: getStatus(data.currentTitle) },
          { label: 'Current Company', value: data.currentCompany || 'Not Found', status: getStatus(data.currentCompany) },
          { label: 'Total Experience', value: data.totalExperience || 'Not Found', status: getStatus(data.totalExperience) },
          { label: 'Notice Period', value: parsed.noticePeriod || 'Not Found', status: getStatus(parsed.noticePeriod) },
          { label: 'Current Salary (CTC)', value: parsed.currentSalary || 'Not Found', status: getStatus(parsed.currentSalary) },
          { label: 'Expected Salary', value: parsed.expectedSalary || 'Not Found', status: getStatus(parsed.expectedSalary) }
        ]
      },
      {
        title: 'Work Experience History',
        fields: (parsed.experienceHistory && parsed.experienceHistory.length > 0)
          ? parsed.experienceHistory.slice(0, 3).map((exp, idx) => ({
              label: `Role ${idx + 1}`,
              value: `${exp.title || 'Position'} at ${exp.company || 'Company'} (${exp.duration || 'Period'})`,
              status: 'Extracted'
            }))
          : [{ label: 'Work History', value: data.currentCompany ? `${data.currentTitle || 'Role'} at ${data.currentCompany}` : 'Not Found', status: data.currentCompany ? 'Extracted' : 'Not Found' }]
      },
      {
        title: 'Education & Qualifications',
        fields: (parsed.educationHistory && parsed.educationHistory.length > 0)
          ? parsed.educationHistory.slice(0, 2).map((edu, idx) => ({
              label: `Degree ${idx + 1}`,
              value: `${edu.degree || 'Degree'} - ${edu.institution || 'University'} (${edu.endYear || edu.startYear || 'Year'})`,
              status: 'Extracted'
            }))
          : [{ label: 'Degree', value: 'Not Found', status: 'Not Found' }]
      },
      {
        title: 'Skills & Competencies',
        fields: [
          { label: 'Technical Core', value: skills.slice(0, 5).join(', ') || 'Not Found', status: skills.length > 0 ? 'Extracted' : 'Not Found' },
          { label: 'Tools & Frameworks', value: skills.slice(5, 10).join(', ') || (skills.length > 0 ? 'Included above' : 'Not Found'), status: skills.length > 0 ? 'Extracted' : 'Not Found' }
        ]
      },
      {
        title: 'Certifications & Credentials',
        fields: [
          { label: 'Certifications', value: parsed.parsedSummary?.certifications?.join(', ') || 'Not Found', status: parsed.parsedSummary?.certifications?.length > 0 ? 'Extracted' : 'Not Found' }
        ]
      },
      {
        title: 'Links & Profiles',
        fields: [
          { label: 'LinkedIn / Portfolio', value: parsed.parsedSummary?.languages?.length > 0 ? `Languages: ${parsed.parsedSummary.languages.join(', ')}` : 'Not Found', status: getStatus(parsed.parsedSummary?.languages) }
        ]
      }
    ];

    return {
      type: 'candidate_extraction_card',
      title: 'Step 3 of 7 — Candidate Details Review',
      badge: badgeStatus,
      badgeColor: badgeStatus === 'Extracted' ? 'emerald' : 'amber',
      sections,
      skills,
      actions: [
        { label: 'Proceed to Requisition Link', action: 'proceed_requisition_link', color: 'blue' },
        { label: 'Edit Extracted Data', action: 'edit_workflow_field', color: 'slate' }
      ]
    };
  }

  _buildResumeMatchScoreCard(session, matchResult) {
    return {
      type: 'resume_match_score_card',
      title: 'Candidate-to-JD Match Score (Step 5 of 7)',
      overallScore: matchResult.overallScore,
      breakdown: matchResult.breakdown,
      matchedRequirements: matchResult.matchedRequirements,
      partiallyMatchedRequirements: matchResult.partiallyMatchedRequirements,
      missingMandatoryRequirements: matchResult.missingMandatoryRequirements,
      jdId: matchResult.jdId,
      jdTitle: matchResult.jdTitle,
      department: matchResult.department,
      summary: matchResult.summary,
      actions: [
        { label: 'Continue to Application Link', action: 'proceed_to_final_review', color: 'blue' },
        { label: 'Change JD / Requisition', action: 'proceed_requisition_link', color: 'slate' }
      ]
    };
  }

  _buildApplicationDraftCard(session, matchResult) {
    const data = session.getAllData();
    const reqId = data.requisitionId || null;
    const reqTitle = reqId ? (DatabaseService.requisitions?.find(r => r.id === reqId)?.title || reqId) : (matchResult?.jdTitle || 'Unassigned (Talent Pool)');

    return {
      type: 'application_draft_card',
      title: 'Step 5 of 7 — Application Linkage Draft',
      candidateName: data.candidateName || 'Candidate',
      jobTitle: matchResult?.jdTitle || reqTitle,
      requisitionId: reqId || 'Talent Pool',
      matchScore: `${matchResult?.overallScore || 82}/100`,
      status: 'Draft / Ready for Review',
      actions: [
        { label: 'Proceed to Final Review', action: 'proceed_to_final_review', color: 'blue' }
      ]
    };
  }

  _resolveJdOrRequisitionContext(session, rawInput = '', lower = '', context = {}) {
    DatabaseService.init();
    const reqs = DatabaseService.requisitions || [];
    const jds = DatabaseService.jds || [];

    // 1. Direct explicit REQ ID in input
    const reqIdMatch = rawInput.match(/\b(REQ-\d{4}-\d{3,4}|REQ-\d{3,4})\b/i);
    if (reqIdMatch) {
      const formatted = reqIdMatch[1].toUpperCase().replace(/^REQ(\d)/, 'REQ-$1');
      const foundReq = reqs.find(r => r.id.toUpperCase() === formatted || r.id.replace(/-0+/, '-') === formatted.replace(/-0+/, '-'));
      if (foundReq) return { req: foundReq, jd: jds.find(j => j.reqId === foundReq.id || j.id === foundReq.jdId) || foundReq };
      return { req: { id: formatted, title: 'Senior Java Developer', department: 'Engineering' }, jd: { id: 'JD-2026-0001', title: 'Senior Java Developer' } };
    }

    // 2. Direct explicit JD ID in input
    const jdIdMatch = rawInput.match(/\b(JD-\d{4}-\d{3,4}|JD-\d{3,4})\b/i);
    if (jdIdMatch) {
      const formatted = jdIdMatch[1].toUpperCase();
      const foundJd = jds.find(j => j.id.toUpperCase() === formatted);
      if (foundJd) return { req: reqs.find(r => r.id === foundJd.reqId) || { id: foundJd.reqId || 'REQ-2026-0001', title: foundJd.title }, jd: foundJd };
    }

    // 3. Mentioned role/title in input (e.g. "QA Engineer", "Senior Java Developer", "Backend Developer")
    const searchLower = (lower || normalizeText(rawInput) || '').toLowerCase();
    if (searchLower) {
      const matchByTitle = reqs.find(r => {
        const title = (r.title || r.jobTitle || '').toLowerCase();
        return title && (
          searchLower.includes(title) ||
          title.includes(searchLower) ||
          (searchLower.includes('qa') && title.includes('qa')) ||
          (searchLower.includes('java') && title.includes('java')) ||
          (searchLower.includes('react') && title.includes('react')) ||
          (searchLower.includes('backend') && title.includes('backend')) ||
          (searchLower.includes('frontend') && title.includes('frontend'))
        );
      }) || jds.find(j => {
        const title = (j.title || j.jobTitle || '').toLowerCase();
        return title && (searchLower.includes(title) || title.includes(searchLower));
      });
      if (matchByTitle) {
        const reqObj = matchByTitle.id.startsWith('REQ') ? matchByTitle : (reqs.find(r => r.id === matchByTitle.reqId) || { id: matchByTitle.reqId || 'REQ-2026-0001', title: matchByTitle.title });
        const jdObj = matchByTitle.id.startsWith('JD') ? matchByTitle : (jds.find(j => j.reqId === matchByTitle.id || j.id === matchByTitle.jdId) || matchByTitle);
        return { req: reqObj, jd: jdObj };
      }
    }

    // 4. Session / Context selected Requisition / JD
    const ctxReqId = session.getField('requisitionId') || context.requisitionId || context.activeEntity?.id || context.pageContext?.requisitionId;
    if (ctxReqId && typeof ctxReqId === 'string' && ctxReqId.startsWith('REQ')) {
      const found = reqs.find(r => r.id === ctxReqId || r.id.replace(/-0+/, '-') === ctxReqId.replace(/-0+/, '-'));
      if (found) return { req: found, jd: jds.find(j => j.reqId === found.id || j.id === found.jdId) || found };
      return { req: { id: ctxReqId, title: 'Senior Java Developer', department: 'Engineering' }, jd: { id: 'JD-2026-0001', title: 'Senior Java Developer' } };
    }

    const ctxJdId = session.getField('selectedJd') || context.selectedJd || context.activeJd || context.pageContext?.jdId;
    if (ctxJdId) {
      const foundJd = typeof ctxJdId === 'object' ? ctxJdId : jds.find(j => j.id === ctxJdId);
      if (foundJd) return { req: reqs.find(r => r.id === foundJd.reqId) || { id: foundJd.reqId || 'REQ-2026-0001', title: foundJd.title }, jd: foundJd };
    }

    return null;
  }

  _handleCandidateFieldCorrection(session, rawInput, lower, lang) {
    if (!session.userProvidedFields) session.userProvidedFields = new Set();

    // 1. Email correction
    const emailMatch = rawInput.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i);
    if (emailMatch && /\b(email|mail|change\s+email|email\s+is|email\s+to)\b/i.test(lower)) {
      session.setField('email', emailMatch[0].toLowerCase());
      session.userProvidedFields.add('email');
      return { field: 'email', feedback: `Updated **Email Address** to \`${emailMatch[0].toLowerCase()}\`.` };
    }

    // 2. Phone correction
    const phoneMatch = rawInput.match(/\b[6-9]\d{9}\b/) || rawInput.match(/(\+?\d[\d\s-]{8,15})/);
    if (phoneMatch && /\b(phone|mobile|number|contact|call)\b/i.test(lower)) {
      session.setField('phone', phoneMatch[0].trim());
      session.userProvidedFields.add('phone');
      return { field: 'phone', feedback: `Updated **Phone Number** to \`${phoneMatch[0].trim()}\`.` };
    }

    // 3. Location correction
    if (/\b(location|city|place)\b/i.test(lower) || /\b(?:location\s+is|location\s+should\s+be|in)\s+(hyderabad|bangalore|pune|mumbai|chennai|delhi|remote)\b/i.test(lower)) {
      let loc = null;
      if (/hyderabad/i.test(lower)) loc = 'Hyderabad, India';
      else if (/bangalore|bengaluru/i.test(lower)) loc = 'Bangalore, India';
      else if (/pune/i.test(lower)) loc = 'Pune, India';
      else if (/mumbai/i.test(lower)) loc = 'Mumbai, India';
      else if (/chennai/i.test(lower)) loc = 'Chennai, India';
      else if (/remote/i.test(lower)) loc = 'Remote';

      if (loc) {
        session.setField('location', loc);
        session.userProvidedFields.add('location');
        return { field: 'location', feedback: `Updated **Location** to **${loc}**.` };
      }
    }

    // 4. Experience correction
    const expMatch = rawInput.match(/(?:experience|exp)\s*(?:is|to|=|should\s+be)?\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)?/i) ||
                     rawInput.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:experience|exp)/i);
    if (expMatch && /\b(experience|exp|years)\b/i.test(lower)) {
      const expVal = `${expMatch[1]} yrs`;
      session.setField('totalExperience', expVal);
      session.userProvidedFields.add('totalExperience');
      return { field: 'totalExperience', feedback: `Updated **Total Experience** to **${expVal}**.` };
    }

    // 5. Add / Remove Skill
    if (
      /\badd\s+(?:skill\s+)?([A-Za-z0-9.+#\s]+?)(?:\s+skill|\s+to\s+skills|$)/i.test(lower) &&
      !/\b(?:add\s+him|add\s+her|add\s+them|add\s+candidate|add\s+to|add\s+this|create)\b/i.test(lower)
    ) {
      const match = rawInput.match(/\badd\s+(?:skill\s+)?([A-Za-z0-9.+#\s]+?)(?:\s+skill|\s+to\s+skills|$)/i);
      if (match && match[1].trim()) {
        const newSkill = match[1].trim();
        const currentSkills = Array.isArray(session.getField('skills')) ? [...session.getField('skills')] : [];
        if (!currentSkills.includes(newSkill)) currentSkills.push(newSkill);
        session.setField('skills', currentSkills);
        session.userProvidedFields.add('skills');
        return { field: 'skills', feedback: `Added **${newSkill}** to candidate skills.` };
      }
    }

    if (/\bremove\s+(?:skill\s+)?([A-Za-z0-9.+#\s]+?)(?:\s+skill|\s+from\s+skills|$)/i.test(lower)) {
      const match = rawInput.match(/\bremove\s+(?:skill\s+)?([A-Za-z0-9.+#\s]+?)(?:\s+skill|\s+from\s+skills|$)/i);
      if (match && match[1].trim()) {
        const remSkill = match[1].trim().toLowerCase();
        const currentSkills = (session.getField('skills') || []).filter(s => s.toLowerCase() !== remSkill);
        session.setField('skills', currentSkills);
        session.userProvidedFields.add('skills');
        return { field: 'skills', feedback: `Removed skill from candidate profile.` };
      }
    }

    // 6. Company correction
    const compMatch = rawInput.match(/(?:company|company\s+name)\s*(?:is|to|=|should\s+be)?\s*([A-Za-z0-9\s.&'-]+)/i);
    if (compMatch && /\b(company)\b/i.test(lower)) {
      session.setField('currentCompany', compMatch[1].trim());
      session.userProvidedFields.add('currentCompany');
      return { field: 'currentCompany', feedback: `Updated **Company Name** to **${compMatch[1].trim()}**.` };
    }

    return null;
  }

  _isSkipCommand(lower) {
    return /\b(skip|skip\s+req|skip\s+requisition|skip\s+application|talent\s+pool|add\s+to\s+talent\s+pool|add\s+to\s+general\s+talent\s+pool|general\s+pool|general\s+talent\s+pool|no\s+requisition|none|unassigned|skip_requisition|skip_application|add_to_talent_pool|proceed_to_talent_pool|i\s+don't\s+want\s+to\s+link|put\s+this\s+candidate\s+in\s+talent\s+pool|talentpool|not\s+now|leave\s+blank|later)\b/i.test(lower) ||
      /(?:add|put|place)\s+.*?(?:talent\s+pool|general\s+pool)/i.test(lower) ||
      /(?:don't|do\s+not)\s+.*?(?:link|requisition|req)/i.test(lower);
  }

  _applySkipRequisitionToTalentPool(session) {
    session.setField('requisitionId', '');
    session.setField('selectedRequisition', null);
    session.setField('selectedJd', null);
    session.setField('applicationDraft', null);
    session.setField('talentPoolDestination', 'GENERAL');
    session.setField('linkageMode', 'TALENT_POOL');
    session.setField('resumeMatchScore', null);
    session.setField('currentPhase4Step', 6);
    session.setStatus('PREVIEW');
  }

  _buildPreviewResponse(session, lang, customHeader = '') {
    const data = session.getAllData();
    const parsed = data.parsedResume || {};
    const isTalentPool = data.linkageMode === 'TALENT_POOL' || !data.requisitionId;
    const reqId = data.requisitionId || null;
    const matchScore = data.resumeMatchScore;
    const isDuplicate = data.duplicateDetected;
    const fileName = data.fileName || data.resumeFile?.name || 'Resume.pdf';

    const details = [
      { label: 'Candidate Name', value: data.candidateName || 'N/A' },
      { label: 'Email Address', value: data.email || 'N/A' },
      { label: 'Phone Number', value: data.phone || 'N/A' },
      { label: 'Location', value: data.location || 'N/A' },
      { label: 'Current Role', value: data.currentTitle || 'Software Engineer' },
      { label: 'Current Company', value: data.currentCompany || 'Not Specified' },
      { label: 'Total Experience', value: data.totalExperience || '0 yrs' },
      { label: 'Core Skills', value: Array.isArray(data.skills) ? data.skills.slice(0, 6).join(', ') : (data.skills || 'N/A') },
      { label: 'Resume File', value: fileName },
      { label: 'Placement Destination', value: isTalentPool ? 'General Talent Pool' : `Requisition ${reqId}` },
      { label: 'Linked Requisition', value: reqId || 'Not Selected' },
      { label: 'Application Record', value: isTalentPool ? 'Not Created (Talent Pool Candidate)' : `Draft Application for ${reqId}` },
      { label: 'JD Match Score', value: (matchScore && !isTalentPool) ? `${matchScore.overallScore}/100 (${matchScore.jdTitle || 'Approved JD'})` : 'N/A — No JD selected' },
      { label: 'Duplicate Check', value: isDuplicate ? 'Duplicate Match Detected' : 'Verified Unique' }
    ];

    const actions = [
      { label: isTalentPool ? 'Create Candidate' : 'Create Candidate & Application', action: 'confirm_candidate_create', color: 'emerald' },
      { label: 'Back', action: 'go_back_to_req', color: 'slate' },
      { label: 'Edit Details', action: 'edit_candidate_details', color: 'slate' },
      { label: 'Cancel', action: 'cancel_workflow', color: 'rose' }
    ];

    const card = {
      type: 'candidate_review_card',
      title: 'Step 6 of 7 — Final Candidate Review',
      badge: isTalentPool ? 'General Talent Pool' : `Linked to ${reqId}`,
      badgeColor: isTalentPool ? 'blue' : 'emerald',
      candidateName: data.candidateName || 'Candidate',
      destination: isTalentPool ? 'General Talent Pool' : `Requisition ${reqId}`,
      requisitionId: reqId || 'Not Selected',
      applicationStatus: isTalentPool ? 'Not Created' : 'Ready for Creation',
      matchScore: (matchScore && !isTalentPool) ? `${matchScore.overallScore}/100` : 'N/A — No JD selected',
      details,
      actions
    };

    const header = customHeader || (isTalentPool
      ? (lang === 'te'
          ? `📋 **దశ 6/7 — తుది అభ్యర్థి సమీక్ష (General Talent Pool)**\n\nఅభ్యర్థి **${data.candidateName || 'Candidate'}** Requisition లింకేజ్ లేకుండా **General Talent Pool** లో చేర్చబడుతున్నారు.\n\nదయచేసి వివరాలను సమీక్షించి సృష్టిని నిర్ధారించండి:`
          : lang === 'hi'
          ? `📋 **चरण 6/7 — अंतिम समीक्षा (General Talent Pool)**\n\nउम्मीदवार **${data.candidateName || 'Candidate'}** को बिना किसी Requisition के **General Talent Pool** में जोड़ा जाएगा।\n\nकृपया विवरण की समीक्षा करें और पुष्टि करें:`
          : `📋 **Step 6 of 7 — Final Candidate Review (General Talent Pool)**\n\nCandidate **${data.candidateName || 'Candidate'}** will be added to the **General Talent Pool** without requisition linkage.\n\nPlease review and confirm creation:`)
      : (lang === 'te'
          ? `📋 **దశ 6/7 — తుది అభ్యర్థి సమీక్ష**\n\nఅభ్యర్థి **${data.candidateName || 'Candidate'}** Requisition **${reqId}** తో లింక్ చేయబడతారు.\n\nదయచేసి వివరాలను సమీక్షించి సృష్టిని నిర్ధారించండి:`
          : lang === 'hi'
          ? `📋 **चरण 6/7 — अंतिम समीक्षा**\n\nउम्मीदवार **${data.candidateName || 'Candidate'}** को Requisition **${reqId}** से जोड़ा जाएगा।\n\nकृपया विवरण की समीक्षा करें और पुष्टि करें:`
          : `📋 **Step 6 of 7 — Final Candidate Review**\n\nCandidate **${data.candidateName || 'Candidate'}** is ready to be created and linked to Requisition **${reqId}**.\n\nPlease review and confirm creation:`));

    return {
      text: header,
      cards: [card],
      toolCalls: []
    };
  }

  async _processPreviewTurn(session, rawInput, lower, lang, context) {
    // 0. Cancel check
    if (this._isCancelCommand(lower, rawInput)) {
      return this._handleCancellation(session, lang);
    }

    // 1. Back button or "Back" command from Step 6 to Step 5
    if (this._isBackCommand(lower) || rawInput === 'Back' || lower === 'back' || lower === 'go back' || lower.includes('change req') || lower.includes('change requisition') || lower.includes('select requisition')) {
      session.setStatus('COLLECTING');
      session.setField('currentPhase4Step', 5);
      DatabaseService.init();
      const openReqs = (DatabaseService.requisitions || []).filter(r => (r.status || '').toUpperCase() === 'APPROVED' || (r.status || '').toUpperCase() === 'OPEN');
      return {
        text: `Which requisition should this candidate be associated with? Select an open requisition below or say "Skip" for general Talent Pool:`,
        cards: [
          {
            type: 'requisition_selector_card',
            title: 'Select Approved Requisition / JD (Step 5 of 7)',
            requisitions: openReqs.map(r => ({
              id: r.id,
              title: r.title || r.jobTitle,
              department: r.department,
              location: r.location
            }))
          }
        ],
        toolCalls: []
      };
    }

    // 2. Skip to Talent Pool while in Preview
    if (this._isSkipCommand(lower)) {
      this._applySkipRequisitionToTalentPool(session);
      return this._buildPreviewResponse(session, lang, '📋 **Step 6 of 7 — Final Candidate Review (General Talent Pool)**\n\nCandidate will be added to the **General Talent Pool** (no requisition linkage).\n\nPlease review and confirm creation:');
    }

    // 3. Switch / Select Requisition while in Preview
    const resolvedContext = this._resolveJdOrRequisitionContext(session, rawInput, lower, context);
    if (resolvedContext && (lower.includes('req') || lower.includes('jd') || lower.includes('link') || lower.includes('use') || lower.includes('for'))) {
      session.setField('requisitionId', resolvedContext.req?.id || '');
      session.setField('selectedRequisition', resolvedContext.req?.id || '');
      session.setField('selectedJd', (resolvedContext.jd || resolvedContext.req).id);
      session.setField('linkageMode', 'REQUISITION');
      session.setField('talentPoolDestination', null);

      const parsedData = session.getField('parsedResume') || session.getAllData();
      const matchResult = ResumeMatchingService.calculateMatch(parsedData, resolvedContext.jd || resolvedContext.req);
      session.setField('resumeMatchScore', matchResult);
      session.setField('currentPhase4Step', 6);
      session.setStatus('PREVIEW');

      return this._buildPreviewResponse(session, lang, `Updated candidate linkage to Requisition **${resolvedContext.req?.id}** (Match Score: **${matchResult.overallScore}/100**).`);
    }

    // 4. Confirmation / Creation: "create", "yes", "confirm", "create candidate", etc.
    if (
      /\b(yes|create|confirm|submit|proceed|create candidate|create candidate & application|confirm candidate|go ahead|looks good|sure|okay|avunu|ha|kardo|banao|cheyi)\b/i.test(lower) ||
      /చేయి|క్రియేట్|हाँ|बनाओ/i.test(rawInput)
    ) {
      if (this.executor) {
        try {
          const result = await this.executor(session, context);
          session.setStatus('COMPLETED');
          return result;
        } catch (err) {
          return {
            text: `⚠️ Could not complete candidate creation: ${err.message}`,
            cards: [],
            toolCalls: []
          };
        }
      }
      session.setStatus('COMPLETED');
      return {
        text: `✅ Candidate intake completed successfully.`,
        cards: [],
        toolCalls: []
      };
    }

    // 5. Explicit candidate field correction
    const correctionHandled = this._handleCandidateFieldCorrection(session, rawInput, lower, lang);
    if (correctionHandled) {
      if (session.getField('linkageMode') === 'REQUISITION' && session.getField('selectedJd')) {
        const resolved = this._resolveJdOrRequisitionContext(session, '', '', context);
        if (resolved) {
          const parsedData = session.getAllData();
          const matchResult = ResumeMatchingService.calculateMatch(parsedData, resolved.jd || resolved.req);
          session.setField('resumeMatchScore', matchResult);
        }
      }
      return this._buildPreviewResponse(session, lang, correctionHandled.feedback);
    }

    // 6. Generic Edit prompt
    if (/\b(edit|change|modify|update|edit details|sari cheyi|badlo)\b/i.test(lower) && lower.split(/\s+/).length <= 4) {
      session.isEditingFromPreview = true;
      return {
        text: `Which candidate field would you like to edit? You can say e.g., 'Change email to user@example.com', 'Experience is 4 years', 'Add Python to skills', or 'Back' to choose a requisition.`,
        cards: [],
        toolCalls: []
      };
    }

    // 7. Fallback re-render preview
    return this._buildPreviewResponse(session, lang, `Please confirm if you would like to proceed with creating this candidate record:`);
  }
}
