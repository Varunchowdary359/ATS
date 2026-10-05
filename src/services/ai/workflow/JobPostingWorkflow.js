/**
 * JobPostingWorkflow
 * 7-Step Conversational Job Posting Creation & Publishing Workflow for PeopleWorks ATS.
 * 
 * STEP 1 — JD / REQUISITION SELECTION
 * STEP 2 — BASIC POSTING INFORMATION
 * STEP 3 — JOB CONTENT
 * STEP 4 — LOCATION / EMPLOYMENT / REQUIREMENTS
 * STEP 5 — APPLICATION / CANDIDATE SETTINGS
 * STEP 6 — PUBLISHING CHANNELS + SCHEDULE
 * STEP 7 — REVIEW + VALIDATE + PUBLISH
 */

import { ConversationalWorkflow } from './ConversationalWorkflow.js';
import { DatabaseService } from '../../db/DatabaseService.js';
import { AIValidationService } from '../AIValidationService.js';
import { AIPermissionService } from '../AIPermissionService.js';
import { AIAuditService } from '../AIAuditService.js';
import { AIPublishingAdapter, PUBLISHING_CHANNELS } from '../AIPublishingAdapter.js';
import { SanitizerService } from '../../security/SanitizerService.js';
import { normalizeText, safeString } from '../AINormalizer.js';

const getNextSequentialPostingId = () => {
  try {
    DatabaseService.init();
    const postings = DatabaseService.getPostings() || [];
    let maxNum = 0;

    postings.forEach(p => {
      if (p && p.id) {
        const match = p.id.match(/\d+/g);
        if (match && match.length > 0) {
          const lastNum = parseInt(match[match.length - 1], 10);
          if (!isNaN(lastNum) && lastNum > maxNum) {
            maxNum = lastNum;
          }
        }
      }
    });

    const nextNum = maxNum + 1;
    return `POST-2026-${String(nextNum).padStart(4, '0')}`;
  } catch (e) {
    return 'POST-2026-0001';
  }
};

export class JobPostingWorkflow extends ConversationalWorkflow {
  constructor() {
    super({
      type: 'CREATE_JOB_POSTING',
      title: 'Job Posting & Publishing',
      fieldDefinitions: [
        // =====================================================================
        // STEP 1 — JD / REQUISITION SELECTION
        // =====================================================================
        {
          key: 'jdId',
          label: 'Approved Job Description',
          required: true,
          step: 1,
          aliases: ['jd', 'job description', 'approved jd', 'linked jd', 'for jd', 'jd id'],
          question: 'Which approved Job Description should this posting use? (e.g. Senior Java Developer, JD-2026-0001, or choose from approved JDs)',
          questionTe: 'ఈ జాబ్ పోస్టింగ్ కోసం ఏ అప్రూవ్డ్ Job Description (JD) ఉపయోగించాలి? (ఉదా: Senior Java Developer లేదా JD-2026-0001)',
          questionHi: 'इस जॉब पोस्टिंग के लिए किस स्वीकृत (Approved) Job Description का उपयोग करना चाहिए? (जैसे: Senior Java Developer या JD-2026-0001)',
          extract: (raw, lower, allData) => {
            DatabaseService.init();
            const jds = DatabaseService.jds || [];
            const clean = raw.trim();

            // Match JD ID directly (e.g. JD-2026-0001)
            const idMatch = raw.match(/\b(JD-?\d{4}-?\d{3,5})\b/i);
            if (idMatch) {
              const formattedId = idMatch[1].toUpperCase().replace(/^JD(\d)/, 'JD-$1');
              const found = jds.find(j => j.id.toUpperCase() === formattedId);
              if (found) return found.id;
              return formattedId;
            }

            // Match by REQ ID (e.g. REQ-2026-0001)
            const reqMatch = raw.match(/\b(REQ-?\d{4}-?\d{3,5})\b/i);
            if (reqMatch) {
              const formattedReq = reqMatch[1].toUpperCase().replace(/^REQ(\d)/, 'REQ-$1');
              const foundByReq = jds.find(j => j.reqId?.toUpperCase() === formattedReq || j.requisitionId?.toUpperCase() === formattedReq);
              if (foundByReq) return foundByReq.id;
            }

            // Match by Title Keyword in Approved JDs
            if (clean.length >= 3 && !/\b(create|make|post|posting|publish)\b/i.test(clean)) {
              const titleMatches = jds.filter(j => 
                j.title && normalizeText(j.title).includes(lower)
              );
              if (titleMatches.length > 0) {
                // Prioritize approved JD if multiple
                const approvedMatch = titleMatches.find(j => j.status === 'Approved' || j.status === 'Published');
                return (approvedMatch || titleMatches[0]).id;
              }
            }

            return null;
          },
          normalize: (val, session) => {
            DatabaseService.init();
            const jds = DatabaseService.jds || [];
            const found = jds.find(j => j.id.toUpperCase() === String(val).toUpperCase());
            if (found && session) {
              if (!session.hasField('reqId')) session.setField('reqId', found.reqId || found.requisitionId || 'REQ-2026-0001');
              if (!session.hasField('department')) session.setField('department', found.department || 'Engineering');
              if (!session.hasField('experience')) session.setField('experience', found.experienceMin ? `${found.experienceMin}–${found.experienceMax} years` : '4–7 years');
            }
            return val;
          },
          validate: (val) => {
            DatabaseService.init();
            const jds = DatabaseService.jds || [];
            const clean = String(val).toUpperCase();
            const found = jds.find(j => j.id.toUpperCase() === clean);
            if (found && found.status !== 'Approved' && found.status !== 'Published') {
              return {
                isValid: false,
                error: `⚠️ This JD is not approved yet. The current status is '${found.status}', so it cannot be published.`
              };
            }
            return { isValid: true };
          },
          widgetRenderer: (session, context) => {
            DatabaseService.init();
            const approvedJds = (DatabaseService.jds || []).filter(j => j.status === 'Approved' || j.status === 'Published');
            return {
              type: 'jd_selector',
              title: 'Select an Approved Job Description',
              subtitle: 'Only approved JDs can be distributed to public job boards.',
              items: approvedJds.slice(0, 4).map(j => ({
                id: j.id,
                title: j.title,
                department: j.department,
                reqId: j.reqId || j.requisitionId || 'REQ-2026-0001',
                status: j.status,
                experience: j.experienceMin ? `${j.experienceMin}–${j.experienceMax} yrs` : '4–7 yrs',
                actionText: `Use ${j.id}`
              }))
            };
          }
        },

        // =====================================================================
        // STEP 2 — BASIC POSTING INFORMATION
        // =====================================================================
        {
          key: 'title',
          label: 'Posting Title',
          required: true,
          step: 2,
          aliases: ['title', 'job title', 'posting title', 'position title'],
          question: (session, lang) => {
            DatabaseService.init();
            const linkedJd = (DatabaseService.jds || []).find(j => j.id === session?.getField('jdId'));
            const defaultTitle = linkedJd?.title || 'Senior Java Developer';
            if (lang === 'te') return `ఈ జాబ్ పోస్టింగ్ యొక్క పబ్లిక్ టైటిల్ ఏమిటి? (JD నుండి: **${defaultTitle}**, ఉంచడానికి "keep" లేదా మార్పులు చెప్పండి)`;
            if (lang === 'hi') return `इस जॉब पोस्टिंग का पब्लिक टाइटल क्या होना चाहिए? (JD से: **${defaultTitle}**, रखने के लिए "keep" कहें या नया बताएं)`;
            return `What is the public title for this posting? (Pre-filled from approved JD: **${defaultTitle}** — say "keep" or specify title and department)`;
          },
          extract: (raw, lower, allData) => {
            DatabaseService.init();
            const linkedJd = (DatabaseService.jds || []).find(j => j.id === allData.jdId);
            const defaultTitle = linkedJd?.title || 'Senior Java Developer';

            if (/\b(keep|same|default|looks\s+good|ok|yes|use\s+jd|keep\s+jd\s+title)\b/i.test(lower)) {
              if (/\b(engineering|tech|software|it)\b/i.test(lower)) allData.department = 'Engineering';
              else if (/\b(product|pm)\b/i.test(lower)) allData.department = 'Product';
              else if (/\b(sales)\b/i.test(lower)) allData.department = 'Sales';
              else if (/\b(marketing)\b/i.test(lower)) allData.department = 'Marketing';
              return allData.title || defaultTitle;
            }

            if (/\b(?:title|role|position)\s*[:=]?\s*([A-Za-z0-9\s.+#]+)/i.test(raw)) {
              const m = raw.match(/\b(?:title|role|position)\s*[:=]?\s*([A-Za-z0-9\s.+#]+)/i);
              return m[1].trim();
            }

            return null;
          }
        },
        {
          key: 'department',
          label: 'Department',
          required: false,
          step: 2,
          defaultValue: (session) => {
            DatabaseService.init();
            const linkedJd = (DatabaseService.jds || []).find(j => j.id === session?.getField('jdId'));
            return linkedJd?.department || 'Engineering';
          },
          aliases: ['department', 'dept', 'team'],
          extract: (raw, lower, allData) => {
            if (/\b(engineering|tech|software|it)\b/i.test(lower)) return 'Engineering';
            if (/\b(product|pm)\b/i.test(lower)) return 'Product';
            if (/\b(design|ui|ux)\b/i.test(lower)) return 'Design';
            if (/\b(sales|business development)\b/i.test(lower)) return 'Sales';
            if (/\b(marketing|growth)\b/i.test(lower)) return 'Marketing';
            if (/\b(human resources|hr)\b/i.test(lower)) return 'Human Resources';
            if (/\b(finance|accounts)\b/i.test(lower)) return 'Finance';
            return null;
          }
        },

        // =====================================================================
        // STEP 3 — JOB CONTENT
        // =====================================================================
        {
          key: 'summary',
          label: 'Job Summary',
          required: true,
          step: 3,
          aliases: ['summary', 'overview', 'description', 'job summary', 'public summary'],
          question: 'Please review the public Job Summary. Would you like to keep the approved summary or customize it? (Say "looks good" or specify modifications)',
          questionTe: 'దయచేసి పబ్లిక్ జాబ్ సారాంశాన్ని (Summary) సమీక్షించండి. దీన్ని అలాగే ఉంచాలా లేదా మార్పులు చేయాలా?',
          questionHi: 'कृपया जॉब सारांश (Summary) की समीक्षा करें। क्या आप इसे स्वीकृत JD के अनुसार रखना चाहते हैं या बदलना चाहते हैं?',
          extract: (raw, lower, allData) => {
            DatabaseService.init();
            const linkedJd = (DatabaseService.jds || []).find(j => j.id === allData.jdId);
            const defaultSummary = linkedJd?.summary || 'Building high-throughput enterprise cloud platforms.';

            if (/\b(looks\s+good|keep|same|default|fine|ok|perfect|yes|use\s+jd)\b/i.test(lower) && !/\b(title|department)\b/i.test(lower)) {
              return allData.summary || defaultSummary;
            }
            if (/\b(make\s+it\s+more\s+attractive|attractive|rewrite|polish)\b/i.test(lower)) {
              return `🌟 (AI Suggested) Join our elite engineering team at PeopleWorks! We are seeking an exceptional ${allData.title || 'Professional'} to architect scalable, high-impact cloud platforms that power thousands of enterprise users worldwide.`;
            }
            if (/\b(?:summary|overview|description)\s*[:=]\s*(.+)/i.test(raw)) {
              const m = raw.match(/\b(?:summary|overview|description)\s*[:=]\s*(.+)/i);
              return m[1].trim();
            }
            if (raw.length >= 25 && !/\b(create|post|publish|bangalore|hyderabad|hybrid|full-time|title|department|engineering|sales)\b/i.test(lower)) {
              return raw.trim();
            }
            return null;
          }
        },

        // =====================================================================
        // STEP 4 — LOCATION / EMPLOYMENT / REQUIREMENTS
        // =====================================================================
        {
          key: 'location',
          label: 'Job Location & Work Mode',
          required: true,
          step: 4,
          aliases: ['location', 'city', 'place', 'work mode', 'workmode', 'remote', 'hybrid', 'onsite'],
          question: 'What is the job location and work mode? (e.g. Bangalore, Hybrid, or 100% Remote)',
          questionTe: 'జాబ్ లొకేషన్ మరియు వర్క్ మోడ్ ఏమిటి? (ఉదా: Bangalore, Hybrid లేదా Remote)',
          questionHi: 'जॉब की लोकेशन और वर्क मोड क्या है? (जैसे: Bangalore, Hybrid या Remote)',
          extract: (raw, lower, allData) => {
            let loc = null;
            if (/\b(bangalore|bengaluru)\b/i.test(lower)) loc = 'Bangalore, India';
            else if (/\b(hyderabad)\b/i.test(lower)) loc = 'Hyderabad, India';
            else if (/\b(mumbai)\b/i.test(lower)) loc = 'Mumbai, India';
            else if (/\b(pune)\b/i.test(lower)) loc = 'Pune, India';
            else if (/\b(chennai)\b/i.test(lower)) loc = 'Chennai, India';
            else if (/\b(delhi|ncr|gurgaon|noida)\b/i.test(lower)) loc = 'Delhi NCR, India';
            else if (/\b(new york|nyc|us)\b/i.test(lower)) loc = 'New York, US';
            else if (/\b(remote|work from home|wfh)\b/i.test(lower)) {
              loc = 'Remote';
              allData.workMode = 'Remote';
            }

            // Extract work mode if mentioned
            if (/\b(remote|wfh)\b/i.test(lower)) allData.workMode = 'Remote';
            else if (/\b(hybrid)\b/i.test(lower)) allData.workMode = 'Hybrid';
            else if (/\b(on-site|onsite|in-office)\b/i.test(lower)) allData.workMode = 'On-site';

            // Extract employment type if mentioned
            if (/\b(full[-\s]time)\b/i.test(lower)) allData.employmentType = 'Full-time';
            else if (/\b(part[-\s]time)\b/i.test(lower)) allData.employmentType = 'Part-time';
            else if (/\b(contract|freelance)\b/i.test(lower)) allData.employmentType = 'Contract';
            else if (/\b(internship|intern)\b/i.test(lower)) allData.employmentType = 'Internship';

            if (/\b(keep|same|default|looks\s+good|use\s+jd)\b/i.test(lower)) {
              return allData.location || 'Bangalore, India';
            }

            return loc;
          }
        },

        // =====================================================================
        // STEP 5 — APPLICATION / CANDIDATE SETTINGS
        // =====================================================================
        {
          key: 'applicationMethod',
          label: 'Application Method',
          required: true,
          step: 5,
          aliases: ['application method', 'apply method', 'application settings', 'candidate settings', 'apply url', 'application'],
          question: 'How should candidates apply, and what is the application duration? (e.g. Direct Web Form, Quick Apply, or 30 days deadline)',
          questionTe: 'అభ్యర్థులు ఎలా దరఖాస్తు చేసుకోవాలి మరియు వ్యవధి ఎంత? (ఉదా: Direct Web Form, Quick Apply లేదా 30 days)',
          questionHi: 'उम्मीदवार कैसे आवेदन करेंगे और आवेदन की समय सीमा क्या है? (जैसे: Direct Web Form, Quick Apply या 30 दिन)',
          extract: (raw, lower, allData) => {
            // Extract deadline duration if mentioned
            const daysMatch = lower.match(/(\d+)\s*days?/);
            if (daysMatch) {
              const days = parseInt(daysMatch[1], 10);
              const expDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
              allData.expirationDate = expDate;
              allData.durationDays = days;
            } else if (/\b(1\s+month|30\s+days)\b/i.test(lower)) {
              allData.expirationDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
              allData.durationDays = 30;
            }

            if (/\b(quick\s+apply|quickapply|easy\s+apply)\b/i.test(lower)) return 'Quick Apply';
            if (/\b(email|mail)\b/i.test(lower)) return 'Email Application';
            if (/\b(external|ats\s+url)\b/i.test(lower)) return 'External Portal URL';
            if (/\b(direct\s+web\s+form|web\s+form|direct|30\s+days|keep|same|default|ok)\b/i.test(lower)) return 'Direct Web Form';
            return null;
          }
        },

        // =====================================================================
        // STEP 6 — PUBLISHING CHANNELS + SCHEDULE
        // =====================================================================
        {
          key: 'channels',
          label: 'Publishing Distribution Channels',
          required: true,
          step: 6,
          aliases: ['channels', 'portals', 'job boards', 'publish to', 'publish on', 'platforms'],
          question: 'Which distribution channels should this posting be published to? (Choose: Careers Portal, LinkedIn, Indeed, Naukri, Glassdoor, Employee Referral, Internal Mobility, or "all channels")',
          questionTe: 'ఈ పోస్టింగ్‌ను ఏ ప్లాట్‌ఫారమ్‌లలో పబ్లిష్ చేయాలి? (Careers Portal, LinkedIn, Naukri, Indeed, లేదా అన్ని ఛానెల్స్)',
          questionHi: 'इस पोस्टिंग को किन वितरण चैनलों (Channels) पर प्रकाशित किया जाना चाहिए? (Careers Portal, LinkedIn, Naukri, Indeed या सभी चैनल)',
          extract: (raw, lower, allData) => {
            if (/\b(linkedin|naukri|indeed|careers|glassdoor|referral|mobility|everywhere|all\s+channels|all)\b/i.test(lower)) {
              const resolved = AIPublishingAdapter.resolveChannels(raw);
              if (resolved && resolved.length > 0) return resolved;
            }
            if (/\b(keep|default|standard|yes|ok)\b/i.test(lower)) {
              return ['careers_portal', 'linkedin', 'naukri', 'indeed'];
            }
            return null;
          },
          widgetRenderer: (session, context) => {
            const currentSelected = session.getField('channels') || ['careers_portal', 'linkedin', 'naukri', 'indeed'];
            return {
              type: 'channel_selector',
              title: 'Select Publishing Channels',
              subtitle: 'Choose target talent boards and internal syndication portals.',
              channels: PUBLISHING_CHANNELS.map(ch => ({
                id: ch.id,
                name: ch.name,
                badge: ch.badge,
                color: ch.color,
                method: ch.method,
                reach: ch.estimatedReach,
                selected: currentSelected.includes(ch.id)
              }))
            };
          }
        }
      ],

      // =====================================================================
      // STEP 7 — REVIEW + VALIDATE + PUBLISH
      // =====================================================================
      previewRenderer: (session, lang) => {
        const data = session.getAllData();
        const selectedChannels = data.channels || ['careers_portal', 'linkedin', 'naukri', 'indeed'];
        const channelDetails = PUBLISHING_CHANNELS.filter(c => selectedChannels.includes(c.id));
        const channelList = channelDetails.map(c => `• **${c.name}** (${c.method})`).join('\n');

        const stepHeader = `📌 *Step 7 of 7 (Job Posting & Distribution Review)*\n\n`;
        const title = lang === 'te' ? '📋 **జాబ్ పోస్టింగ్ సమీక్ష & నిర్ధారణ**' : lang === 'hi' ? '📋 **जॉब पोस्टिंग समीक्षा और पुष्टि**' : '📋 **Job Posting & Distribution Review**';
        const subtitle = lang === 'te' ? 'వివరాలను తనిఖీ చేసి పబ్లిష్ చేయండి:' : lang === 'hi' ? 'कृपया सभी विवरणों की समीक्षा करें और पुष्टि करें:' : 'Please review the job posting configuration before distributing to channels:';

        const text = `${stepHeader}${title}\n${subtitle}\n\n` +
          `• **Linked JD:** \`${data.jdId || 'JD-2026-0001'}\` *(Approved)*\n` +
          `• **Linked Requisition:** \`${data.reqId || 'REQ-2026-0001'}\`\n` +
          `• **Posting Title:** **${data.title || 'Senior Software Engineer'}**\n` +
          `• **Department:** ${data.department || 'Engineering'}\n` +
          `• **Location & Mode:** ${data.location || 'Bangalore, India'} (${data.workMode || 'Hybrid'})\n` +
          `• **Employment Type:** ${data.employmentType || 'Full-time'}\n` +
          `• **Experience Range:** ${data.experience || '4–7 years'}\n` +
          `• **Application Method:** ${data.applicationMethod || 'Direct Web Form'}\n` +
          `• **Application Deadline:** ${data.expirationDate || '30 days from publish'}\n` +
          `• **Schedule:** ${data.scheduleDate || 'Immediate (Today)'}\n\n` +
          `📡 **Selected Distribution Channels (${channelDetails.length}):**\n${channelList}\n\n` +
          `Ready to publish? Click **Publish Now** to syndicate live across channels, or **Create Posting** to save as active draft.`;

        return {
          text,
          cards: [
            {
              type: 'posting_review',
              title: data.title || 'Job Posting',
              badge: 'Ready for Publication',
              badgeColor: 'emerald',
              details: [
                { label: 'Linked JD', value: `${data.jdId} (Approved)` },
                { label: 'Requisition', value: data.reqId || 'REQ-2026-0001' },
                { label: 'Department', value: data.department || 'Engineering' },
                { label: 'Location', value: `${data.location} (${data.workMode || 'Hybrid'})` },
                { label: 'Employment', value: data.employmentType || 'Full-time' },
                { label: 'Experience', value: data.experience || '4–7 years' },
                { label: 'Application Method', value: data.applicationMethod || 'Direct Web Form' },
                { label: 'Channels', value: channelDetails.map(c => c.name).join(', ') },
                { label: 'Schedule', value: 'Immediate' }
              ],
              actions: [
                { label: '🚀 Publish Now', action: 'publish_posting', color: 'emerald' },
                { label: '💾 Save Draft', action: 'create_posting', color: 'blue' },
                { label: '✏️ Edit Details', action: 'edit_posting', color: 'slate' },
                { label: '✕ Cancel', action: 'cancel_posting', color: 'rose' }
              ]
            }
          ]
        };
      },

      executor: async (session, context = {}) => {
        DatabaseService.init();
        const data = session.getAllData();
        const isAutoPublish = !session.isDraftOnly;

        // 1. RBAC Permission Check
        const permKey = isAutoPublish ? 'publish:posting' : 'create:posting';
        const authCheck = AIPermissionService.canExecute(permKey, context.user);
        if (!authCheck.authorized) {
          throw new Error(authCheck.reason || 'Permission denied to create/publish job postings.');
        }

        const user = authCheck.user || AIPermissionService.getUserContext();

        // 2. Validate linked JD and approval status
        const jds = DatabaseService.jds || [];
        const linkedJd = jds.find(j => j.id === data.jdId || j.id.toUpperCase() === (data.jdId || '').toUpperCase());
        if (!linkedJd) {
          throw new Error(`Job Description '${data.jdId}' could not be found in the system.`);
        }

        if (linkedJd.status !== 'Approved' && linkedJd.status !== 'Published') {
          throw new Error(`This JD is not approved yet. The current status is '${linkedJd.status}', so it cannot be published.`);
        }

        // 3. Complete Schema Validation
        const valResult = AIValidationService.validateJobPosting
          ? AIValidationService.validateJobPosting(data)
          : { isValid: true };

        if (!valResult.isValid) {
          throw new Error(`Posting validation failed: ${valResult.errors?.join(' ')}`);
        }

        const postingId = getNextSequentialPostingId();
        const selectedChannels = Array.isArray(data.channels) && data.channels.length > 0
          ? data.channels
          : ['careers_portal', 'linkedin', 'naukri', 'indeed'];

        // 4. Multi-Channel Simulated Publishing
        let publishSummary = null;
        if (isAutoPublish) {
          publishSummary = await AIPublishingAdapter.publishMultiChannel(selectedChannels, {
            id: postingId,
            reqId: data.reqId || linkedJd.reqId || 'REQ-2026-0001',
            title: data.title || linkedJd.title,
            department: data.department || linkedJd.department,
            location: data.location || 'Bangalore, India',
            skills: linkedJd.skills || data.skills || ['Java', 'Spring Boot']
          });
        }

        const channelStatuses = {};
        PUBLISHING_CHANNELS.forEach(ch => {
          if (selectedChannels.includes(ch.id)) {
            channelStatuses[ch.id] = isAutoPublish ? 'Published' : 'Active';
          } else {
            channelStatuses[ch.id] = 'Offline';
          }
        });

        // 5. Build Enterprise Job Posting Record
        const newPosting = {
          id: postingId,
          postingId: postingId,
          reqId: data.reqId || linkedJd.reqId || 'REQ-2026-0001',
          jdId: linkedJd.id,
          title: SanitizerService.escapeHtml(data.title || linkedJd.title),
          department: SanitizerService.escapeHtml(data.department || linkedJd.department),
          location: SanitizerService.escapeHtml(data.location || 'Bangalore, India'),
          workMode: data.workMode || linkedJd.workMode || 'Hybrid',
          employmentType: data.employmentType || linkedJd.employmentType || 'Full-time',
          experience: data.experience || (linkedJd.experienceMin ? `${linkedJd.experienceMin}–${linkedJd.experienceMax} years` : '4–7 years'),
          salaryRange: data.salaryRange || '₹24,00,000 - ₹32,00,000 / year',
          summary: SanitizerService.escapeHtml(data.summary || linkedJd.summary || linkedJd.overview || ''),
          responsibilities: Array.isArray(linkedJd.responsibilities) ? linkedJd.responsibilities : [linkedJd.responsibilities || 'Lead sprint deliverables.'],
          qualifications: Array.isArray(linkedJd.qualifications) ? linkedJd.qualifications : [linkedJd.qualifications || 'Relevant technical experience.'],
          skills: Array.isArray(linkedJd.skills) ? linkedJd.skills : (linkedJd.mandatorySkills ? [linkedJd.mandatorySkills] : ['Java', 'Spring Boot']),
          benefits: Array.isArray(linkedJd.benefits) ? linkedJd.benefits : ['Comprehensive Healthcare', 'Flexible Hours', 'Annual Bonus'],
          applicationSettings: {
            applicationMethod: data.applicationMethod || 'Direct Web Form',
            applicationUrl: `https://careers.peopleworks.ai/jobs/${postingId}`,
            publicVisibility: data.publicVisibility || 'Public',
            candidateRequirements: ['Resume/CV', 'Contact Info', 'LinkedIn URL']
          },
          channels: selectedChannels,
          channelStatuses,
          schedule: {
            publishDate: new Date().toISOString().split('T')[0],
            publishTime: '09:00 AM',
            timezone: 'IST (UTC+5:30)',
            expirationDate: data.expirationDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            durationDays: data.durationDays || 30
          },
          status: isAutoPublish ? 'Published' : 'Active',
          createdAt: new Date().toISOString(),
          author: user.name || 'Sujith (Recruiter)'
        };

        // 6. Persist to DatabaseService
        DatabaseService.savePosting(newPosting);

        // 7. Update Requisition Status to Published
        const reqIdx = (DatabaseService.requisitions || []).findIndex(r => r.id === newPosting.reqId);
        if (reqIdx >= 0) {
          DatabaseService.requisitions[reqIdx].status = 'Published';
          DatabaseService.persistAll();
        }

        // 8. Sync to browser Storage
        if (typeof window !== 'undefined') {
          try {
            const currentSaved = localStorage.getItem('pw_db_job_postings');
            const parsed = currentSaved ? JSON.parse(currentSaved) : [];
            localStorage.setItem('pw_db_job_postings', JSON.stringify([newPosting, ...parsed.filter(p => p.id !== postingId)]));
            sessionStorage.setItem('pw_job_postings', JSON.stringify([newPosting, ...parsed.filter(p => p.id !== postingId)]));
            window.dispatchEvent(new CustomEvent('pw:posting_created', { detail: newPosting }));
            window.dispatchEvent(new CustomEvent('pw_posting_published', { detail: newPosting }));
            window.dispatchEvent(new CustomEvent('pw_db_updated', { detail: { type: 'posting', record: newPosting } }));
          } catch (e) {}
        }

        // 9. Audit Log
        AIAuditService.logAction({
          action: isAutoPublish ? 'PUBLISH_JOB_POSTING' : 'CREATE_JOB_POSTING',
          intent: 'CREATE_JOB_POSTING',
          entityType: 'job_posting',
          entityId: postingId,
          details: {
            title: newPosting.title,
            jdId: newPosting.jdId,
            reqId: newPosting.reqId,
            channels: selectedChannels,
            status: newPosting.status
          }
        });

        // 10. Verification Check
        const verified = DatabaseService.getPostingById(postingId);
        if (!verified) {
          throw new Error('Database verification failed. The job posting record could not be confirmed in storage.');
        }

        const lang = context.language || 'en';
        const channelCount = selectedChannels.length;
        const channelListFormatted = selectedChannels.map(chId => {
          const ch = PUBLISHING_CHANNELS.find(c => c.id === chId);
          return `✓ **${ch?.name || chId}** — Published (${ch?.method || 'Direct Sync'})`;
        }).join('\n');

        const successMsg = lang === 'te'
          ? `🎉 **జాబ్ పోస్టింగ్ విజయవంతంగా పబ్లిష్ చేయబడింది!**\n\n• **Posting ID:** \`${postingId}\`\n• **టైటిల్:** **${newPosting.title}**\n• **Linked JD:** \`${newPosting.jdId}\`\n• **Requisition:** \`${newPosting.reqId}\`\n• **స్టేటస్:** 🟢 **Published**\n\n📡 **పబ్లిష్ చేసిన ఛానెల్స్ (${channelCount}):**\n${channelListFormatted}\n\nఈ పోస్టింగ్ ఇప్పుడు Job Postings Hub మరియు పబ్లిక్ కెరీర్స్ పోర్టల్‌లో లైవ్ అయ్యింది.`
          : lang === 'hi'
          ? `🎉 **जॉब पोस्टिंग सफलतापूर्वक प्रकाशित की गई!**\n\n• **Posting ID:** \`${postingId}\`\n• **टाइटल:** **${newPosting.title}**\n• **Linked JD:** \`${newPosting.jdId}\`\n• **Requisition:** \`${newPosting.reqId}\`\n• **स्थिति:** 🟢 **Published**\n\n📡 **प्रकाशित चैनल (${channelCount}):**\n${channelListFormatted}\n\nयह जॉब पोस्टिंग अब Job Postings Hub में लाइव है।`
          : `🎉 **Job Posting Created & Published Successfully!**\n\n• **Posting ID:** \`${postingId}\`\n• **Title:** **${newPosting.title}**\n• **Linked Approved JD:** \`${newPosting.jdId}\`\n• **Requisition:** \`${newPosting.reqId}\`\n• **Department:** ${newPosting.department}\n• **Location:** ${newPosting.location} (${newPosting.workMode})\n• **Status:** 🟢 **Published**\n\n📡 **Publication Results (${channelCount} Channels):**\n${channelListFormatted}\n\n*Note: Job distribution was executed through PeopleWorks simulated enterprise channel adapters.* The posting is now live in the **Job Postings Hub** in real time.`;

        return {
          text: successMsg,
          cards: [
            {
              type: 'publication_result',
              title: `Live Posting: ${newPosting.title}`,
              badge: 'Published Live',
              badgeColor: 'emerald',
              details: [
                { label: 'Posting ID', value: postingId },
                { label: 'Linked JD', value: newPosting.jdId },
                { label: 'Requisition', value: newPosting.reqId },
                { label: 'Location', value: `${newPosting.location} (${newPosting.workMode})` },
                { label: 'Channels', value: selectedChannels.join(', ') },
                { label: 'Shareable URL', value: `https://careers.peopleworks.ai/jobs/${postingId}` }
              ],
              results: (publishSummary?.results || []).map(r => ({
                channelName: r.channelName,
                status: r.status,
                method: r.method,
                reach: r.reach,
                liveUrl: r.liveUrl
              }))
            }
          ],
          toolCalls: [
            {
              name: 'createJobPosting',
              params: { postingId, title: newPosting.title, jdId: newPosting.jdId, channels: selectedChannels },
              result: { success: true, posting: newPosting }
            }
          ]
        };
      }
    });
    this.totalSteps = 7;
  }
}
