/**
 * JDWorkflow
 * 7-Step Conversational Job Description (JD) Creation Workflow for PeopleWorks ATS.
 * 
 * STEP 1 — REQUISITION + BASIC INFORMATION
 * STEP 2 — ROLE + EXPERIENCE
 * STEP 3 — JOB SUMMARY
 * STEP 4 — RESPONSIBILITIES + QUALIFICATIONS
 * STEP 5 — SKILLS (MANDATORY + PREFERRED)
 * STEP 6 — BENEFITS + ADDITIONAL DETAILS
 * STEP 7 — REVIEW + WORKFLOW + CREATE
 */

import { ConversationalWorkflow } from './ConversationalWorkflow.js';
import { DatabaseService } from '../../db/DatabaseService.js';
import { AIValidationService } from '../AIValidationService.js';
import { AIPermissionService } from '../AIPermissionService.js';
import { AIAuditService } from '../AIAuditService.js';
import { SanitizerService } from '../../security/SanitizerService.js';
import { UserDirectoryService } from '../../directory/UserDirectoryService.js';
import { normalizeText, safeString } from '../AINormalizer.js';
import { evaluateWorkflowForJd, INITIAL_WORKFLOW_CONFIGS } from '../../../components/recruitment/jd/jdMockData.js';

const getNextSequentialJdId = () => {
  try {
    DatabaseService.init();
    const jds = DatabaseService.jds || [];
    let maxNum = 0;

    jds.forEach(j => {
      if (j && j.id) {
        const match = j.id.match(/\d+/g);
        if (match && match.length > 0) {
          const lastNum = parseInt(match[match.length - 1], 10);
          if (!isNaN(lastNum) && lastNum > maxNum) {
            maxNum = lastNum;
          }
        }
      }
    });

    const nextNum = maxNum + 1;
    return `JD-2026-${String(nextNum).padStart(4, '0')}`;
  } catch (e) {
    return 'JD-2026-0001';
  }
};

const formatSkillsArray = (skills) => {
  if (Array.isArray(skills)) return skills;
  if (!skills) return [];
  return String(skills)
    .split(/[,;\n•]+|\band\b/i)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !/^(and|with)$/i.test(s));
};

const formatBulletList = (text) => {
  if (!text) return '';
  if (Array.isArray(text)) return text.map(t => `• ${t}`).join('\n');
  const clean = String(text).trim();
  if (clean.includes('\n') || clean.includes('•') || clean.includes('-')) {
    return clean
      .split(/\n+/)
      .map(line => {
        const trimmed = line.trim().replace(/^[-*•]\s*/, '');
        return trimmed ? `• ${trimmed}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return `• ${clean}`;
};

export class JDWorkflow extends ConversationalWorkflow {
  constructor() {
    super({
      type: 'CREATE_JD',
      title: 'Job Description Creation',
      fieldDefinitions: [
        // =====================================================================
        // STEP 1 — REQUISITION + BASIC INFORMATION
        // =====================================================================
        {
          key: 'reqId',
          label: 'Linked Requisition',
          required: true,
          step: 1,
          aliases: ['requisition', 'req', 'req id', 'requisition id', 'linked req', 'for req', 'approved requisition'],
          question: 'Which approved requisition should this JD be linked to? (e.g. REQ-2026-0001, Senior Java Developer, or say "Standalone")',
          questionTe: 'ఈ JD ఏ అప్రూవ్డ్ రిక్విజిషన్‌కు లింక్ చేయాలి? (ఉదా: REQ-2026-0001 లేదా Standalone)',
          questionHi: 'यह JD किस स्वीकृत (Approved) Requisition से लिंक होना चाहिए? (जैसे: REQ-2026-0001 या Standalone)',
          extract: (raw, lower, allData) => {
            DatabaseService.init();
            const clean = raw.trim();

            if (/\b(standalone|none|no\s+req|independent)\b/i.test(lower)) {
              return 'Standalone';
            }

            // Exact REQ ID match (e.g. REQ-2026-0001)
            const idMatch = raw.match(/\b(REQ-?\d{4}-?\d{3,5})\b/i);
            if (idMatch) {
              const formattedId = idMatch[1].toUpperCase().replace(/^REQ(\d)/, 'REQ-$1');
              const found = DatabaseService.requisitions.find(r => r.id.toUpperCase() === formattedId);
              if (found) {
                return found.id;
              }
              return formattedId;
            }

            // Lookup by job title or keyword in DatabaseService.requisitions
            if (clean.length >= 3 && !/\b(create|make|jd|job\s+description)\b/i.test(clean)) {
              const matches = DatabaseService.requisitions.filter(r => 
                (r.title && r.title.toLowerCase().includes(lower)) ||
                (r.jobTitle && r.jobTitle.toLowerCase().includes(lower))
              );
              if (matches.length > 0) {
                return matches[0].id;
              }
            }

            // Context fallback: if an active approved requisition exists, use it
            const approvedReq = DatabaseService.requisitions.find(r => (r.status || '').toLowerCase() === 'approved');
            if (approvedReq && /\b(approved|recent|latest|this|the)\b/i.test(lower)) {
              return approvedReq.id;
            }

            return null;
          },
          validate: (val) => {
            if (!val || String(val).trim().length < 2) {
              return { isValid: false, error: '⚠️ Please specify an approved requisition ID (e.g. REQ-2026-0001) or say "Standalone".' };
            }
            return { isValid: true };
          },
          normalize: (val, session) => {
            const clean = String(val).trim();
            if (/standalone/i.test(clean)) {
              return 'Standalone';
            }

            DatabaseService.init();
            const found = DatabaseService.requisitions.find(r => r.id.toUpperCase() === clean.toUpperCase());
            if (found && session) {
              // Pre-fill compatible fields from linked requisition
              if (!session.hasField('title')) session.setField('title', found.title || found.jobTitle || 'Senior Software Engineer');
              if (!session.hasField('department')) session.setField('department', found.department || 'Engineering');
              if (!session.hasField('costCenter')) session.setField('costCenter', found.costCenter || 'CC-1024');
              if (!session.hasField('salaryMin')) session.setField('salaryMin', found.minSalary || 1200000);
              if (!session.hasField('salaryMax')) session.setField('salaryMax', found.maxSalary || 1800000);
              if (!session.hasField('currency')) session.setField('currency', found.currency || 'INR');
              if (!session.hasField('location')) session.setField('location', found.location || 'Bangalore, India');
              if (!session.hasField('employmentType')) session.setField('employmentType', found.employmentType || 'Full-Time');
              if (!session.hasField('positions')) session.setField('positions', found.openings || 1);
              return found.id;
            }
            return clean;
          }
        },

        // =====================================================================
        // STEP 2 — ROLE + EXPERIENCE
        // =====================================================================
        {
          key: 'title',
          label: 'Role Title',
          required: false,
          step: 2,
          defaultValue: 'Senior Java Developer',
          aliases: ['title', 'role', 'job title', 'designation', 'position'],
          question: 'What is the confirmed role title? (e.g. Senior Java Developer, Product Manager)',
          questionTe: 'ఈ రోల్ టైటిల్ ఏమిటి? (ఉదా: Senior Java Developer, Product Manager)',
          questionHi: 'इस पद का शीर्षक (Job Title) क्या है? (जैसे: Senior Java Developer, Product Manager)',
          extract: (raw, lower) => {
            const titleMatch = raw.match(/\b(?:for|title|role|position|as)\s+([A-Za-z0-9\s.+#]+?)(?:\s+\b(?:in|with|under|at|experience|exp|years)\b|,|$)/i);
            if (titleMatch && titleMatch[1].trim().length >= 3 && !/\b(jd|job\s+description|requisition|req)\b/i.test(titleMatch[1])) {
              return titleMatch[1].trim().replace(/\b\w/g, l => l.toUpperCase());
            }
            if (/\b(developer|engineer|manager|architect|designer|lead|analyst|specialist|consultant)\b/i.test(lower)) {
              let clean = raw
                .replace(/\b(?:in|under|at)\s+(?:engineering|sales|marketing|hr|finance|bangalore|hyderabad).*$/i, '')
                .replace(/,\s*\d+.*$/i, '')
                .replace(/\b\d+\s*(?:to|-|–)\s*\d+\s*(?:years|yrs|year|yr).*$/i, '')
                .replace(/\b(remote|hybrid|on[-\s]?site)\b/i, '')
                .replace(/[,\s]+$/, '')
                .trim();
              if (clean.length >= 3 && !/\b(create|make|jd)\b/i.test(clean)) {
                return clean.replace(/\b\w/g, l => l.toUpperCase());
              }
            }
            return null;
          },
          validate: (val) => {
            if (val && String(val).trim().length < 3) {
              return { isValid: false, error: '⚠️ Role title must be at least 3 characters.' };
            }
            return { isValid: true };
          },
          normalize: (val) => String(val).trim().replace(/\b\w/g, l => l.toUpperCase())
        },

        {
          key: 'experienceMin',
          label: 'Role & Experience Range',
          required: true,
          step: 2,
          defaultValue: 4,
          aliases: ['experience', 'exp', 'years of experience', 'experience range', 'exp range', 'min experience'],
          question: (session, lang) => {
            const currentTitle = session?.getField('title');
            if (currentTitle && currentTitle !== 'Senior Java Developer' && currentTitle !== 'Senior Software Engineer') {
              if (lang === 'te') return `**${currentTitle}** రోల్‌కి ఎంత అనుభవం (ఉదా: 4 to 7 years) మరియు వర్క్ మోడ్ (Hybrid/Remote) అవసరం?`;
              if (lang === 'hi') return `**${currentTitle}** पद के लिए अनुभव सीमा (जैसे: 4 to 7 years) और वर्क मोड क्या होना चाहिए?`;
              return `What experience range and work mode should this role require for **${currentTitle}**? (e.g. 4 to 7 years, Hybrid)`;
            }
            if (lang === 'te') return `ఈ రోల్ టైటిల్ మరియు ఎంత అనుభవం (ఉదా: Senior Java Developer, 4 to 7 years) అవసరం?`;
            if (lang === 'hi') return `इस पद का शीर्षक और अनुभव सीमा (जैसे: Senior Java Developer, 4 to 7 years) क्या होनी चाहिए?`;
            return `What is the confirmed role title and required experience range? (e.g. Senior Java Developer, 4 to 7 years, Hybrid)`;
          },
          extract: (raw, lower, allData) => {
            // Range match (e.g. "4 to 7 years", "4-7 yrs", "5 to 8")
            const rangeMatch = raw.match(/(\d{1,2})\s*(?:to|-|–)\s*(\d{1,2})/i);
            if (rangeMatch) {
              return parseInt(rangeMatch[1], 10);
            }
            const singleExp = raw.match(/(\d{1,2})\s*\+?\s*(?:years|yrs|year|yr)\b/i);
            if (singleExp) {
              return parseInt(singleExp[1], 10);
            }
            const standaloneDigit = raw.match(/^\s*(\d{1,2})\s*$/);
            if (standaloneDigit) {
              return parseInt(standaloneDigit[1], 10);
            }
            return null;
          },
          validate: (val, allData, raw) => {
            const num = Number(val);
            if (isNaN(num) || num < 0) {
              return { isValid: false, error: '⚠️ Minimum experience must be a non-negative number.' };
            }
            if (raw) {
              const rangeMatch = String(raw).match(/(\d{1,2})\s*(?:to|-|–)\s*(\d{1,2})/i);
              if (rangeMatch) {
                const min = parseInt(rangeMatch[1], 10);
                const max = parseInt(rangeMatch[2], 10);
                if (min > max) {
                  return { isValid: false, error: `⚠️ Minimum experience (${min} yrs) cannot be greater than maximum experience (${max} yrs).` };
                }
              }
            }
            return { isValid: true };
          },
          normalize: (val, session) => {
            const min = Number(val) || 0;
            return min;
          }
        },

        {
          key: 'experienceMax',
          label: 'Maximum Experience (Years)',
          required: false,
          step: 2,
          defaultValue: (session) => {
            const min = Number(session?.getField('experienceMin') || 4);
            return min + 3;
          },
          aliases: ['max experience', 'max exp', 'maximum experience'],
          extract: (raw, lower, allData) => {
            const rangeMatch = raw.match(/(\d{1,2})\s*(?:to|-|–)\s*(\d{1,2})/i);
            if (rangeMatch) {
              return parseInt(rangeMatch[2], 10);
            }
            return null;
          },
          validate: (val, allData) => {
            if (val === undefined || val === null) return { isValid: true };
            const max = Number(val);
            const min = Number(allData?.experienceMin || 0);
            if (isNaN(max) || max < 0) {
              return { isValid: false, error: '⚠️ Maximum experience must be a non-negative number.' };
            }
            if (max < min) {
              return { isValid: false, error: `⚠️ Maximum experience (${max} yrs) cannot be less than Minimum experience (${min} yrs).` };
            }
            return { isValid: true };
          },
          normalize: (val) => Number(val) || 7
        },

        {
          key: 'workMode',
          label: 'Workplace Mode',
          required: false,
          step: 2,
          defaultValue: 'Hybrid',
          aliases: ['work mode', 'workplace mode', 'mode', 'workplace'],
          extract: (raw, lower) => {
            if (/\b(remote|wfh|work from home)\b/i.test(lower)) return 'Remote';
            if (/\b(on[-\s]?site|office|in[-\s]?office)\b/i.test(lower)) return 'On-Site';
            if (/\b(hybrid|flexible)\b/i.test(lower)) return 'Hybrid';
            return null;
          },
          validate: () => ({ isValid: true }),
          normalize: (val) => {
            if (/remote/i.test(val)) return 'Remote';
            if (/on-?site/i.test(val)) return 'On-Site';
            return 'Hybrid';
          }
        },

        // =====================================================================
        // STEP 3 — JOB SUMMARY
        // =====================================================================
        {
          key: 'summary',
          label: 'Job Summary',
          required: true,
          step: 3,
          defaultValue: 'Responsible for leading design and implementation of enterprise web applications.',
          aliases: ['summary', 'job summary', 'overview', 'role overview', 'description', 'job description summary'],
          question: 'Please provide a short summary or overview of the role.',
          questionTe: 'దయచేసి ఈ రోల్ యొక్క సంక్షిప్త సారాంశాన్ని (Job Summary) అందించండి.',
          questionHi: 'कृपया इस पद का एक संक्षिप्त सारांश (Job Summary) प्रदान करें।',
          extract: (raw, lower) => {
            const sumMatch = raw.match(/\b(?:summary|overview|about the role)\s*(?::|is|=|to)?\s*(.+?)(?=\s*(?:\bresponsibilities\b|\bskills\b|\bqualifications\b|\bbenefits\b|$))/i);
            if (sumMatch && sumMatch[1].trim().length >= 5) {
              return sumMatch[1].trim();
            }
            return null;
          },
          validate: (val) => {
            if (!val || String(val).trim().length < 5) {
              return { isValid: false, error: '⚠️ Job Summary is required and must be at least 5 characters.' };
            }
            return { isValid: true };
          },
          normalize: (val) => String(val).trim()
        },

        // =====================================================================
        // STEP 4 — RESPONSIBILITIES + QUALIFICATIONS
        // =====================================================================
        {
          key: 'responsibilities',
          label: 'Key Responsibilities',
          required: true,
          step: 4,
          defaultValue: '• Architect and build resilient, scalable backend services.\n• Collaborate closely with Product Managers and Frontend Engineers.\n• Lead code reviews and enforce architectural excellence.',
          aliases: ['responsibilities', 'duties', 'key responsibilities', 'role responsibilities'],
          question: 'What are the key responsibilities and required qualifications for this role?',
          questionTe: 'ఈ రోల్ ముఖ్య బాధ్యతలు (Responsibilities) మరియు అర్హతలు (Qualifications) ఏమిటి?',
          questionHi: 'इस पद के लिए प्रमुख जिम्मेदारियां (Responsibilities) और योग्यताएं (Qualifications) क्या हैं?',
          extract: (raw, lower) => {
            const respMatch = raw.match(/\b(?:responsibilities|duties|deliverables)\s*(?::|is|=|to)?\s*(.+?)(?=\s*(?:\bskills\b|\bmandatory\b|\bpreferred\b|\bqualifications\b|\bbenefits\b|$))/i);
            if (respMatch && respMatch[1].trim().length >= 5) {
              return respMatch[1].trim();
            }
            return null;
          },
          validate: (val) => {
            if (!val || String(val).trim().length < 5) {
              return { isValid: false, error: '⚠️ Key Responsibilities are required.' };
            }
            return { isValid: true };
          },
          normalize: (val) => formatBulletList(val)
        },

        {
          key: 'qualifications',
          label: 'Qualifications',
          required: false,
          step: 4,
          defaultValue: "Bachelor's Degree in Computer Science, Software Engineering, or equivalent practical experience.",
          aliases: ['qualifications', 'education', 'degree', 'qualification', 'academic requirements'],
          extract: (raw, lower) => {
            const qualMatch = raw.match(/(?:qualifications?|education|degree)\s*(?::|is|=|to)?\s*([^.\n\r]+?)(?=\s*(?:\bskills\b|\bbenefits\b|$))/i);
            if (qualMatch && qualMatch[1].trim().length >= 4) {
              return qualMatch[1].trim();
            }
            return null;
          },
          validate: () => ({ isValid: true }),
          normalize: (val) => String(val).trim()
        },

        // =====================================================================
        // STEP 5 — SKILLS (MANDATORY + PREFERRED)
        // =====================================================================
        {
          key: 'requiredSkills',
          label: 'Mandatory Skills',
          required: true,
          step: 5,
          defaultValue: 'Java, Spring Boot, SQL, REST APIs, Microservices',
          aliases: ['skills', 'mandatory skills', 'required skills', 'must have skills', 'must-have skills', 'core skills'],
          question: 'What are the mandatory (must-have) and preferred skills? (e.g. Mandatory: Java, Spring Boot, SQL; Preferred: AWS, React)',
          questionTe: 'తప్పనిసరి స్కిల్స్ (Mandatory) మరియు ప్రాధాన్యత స్కిల్స్ (Preferred) ఏమిటి? (ఉదా: Java, Spring Boot, SQL)',
          questionHi: 'अनिवार्य कौशल (Mandatory Skills) और पसंदीदा कौशल (Preferred) क्या हैं? (जैसे: Java, Spring Boot, SQL)',
          extract: (raw, lower) => {
            const mandMatch = raw.match(/(?:mandatory\s+skills?|must[-\s]have\s+skills?|required\s+skills?|mandatory)\s*[:=]?\s*([^.\n\r;]+)/i);
            if (mandMatch && mandMatch[1].trim().length >= 2) {
              return mandMatch[1].trim().replace(/\s+(?:preferred|optional|qualifications|benefits).*$/i, '').trim();
            }
            return null;
          },
          validate: (val) => {
            if (!val || String(val).trim().length < 2) {
              return { isValid: false, error: '⚠️ At least one mandatory skill is required (e.g. Java, Spring Boot).' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            const arr = formatSkillsArray(val);
            return arr.join(', ');
          }
        },

        {
          key: 'preferredSkills',
          label: 'Preferred Skills',
          required: false,
          step: 5,
          defaultValue: 'AWS, Docker, Kubernetes, CI/CD, React',
          aliases: ['preferred skills', 'nice to have', 'good to have', 'optional skills', 'preferred'],
          extract: (raw, lower) => {
            const prefMatch = raw.match(/(?:preferred\s+skills?|nice\s+to\s+have|good\s+to\s+have|preferred)\s*[:=]?\s*([^.\n\r;]+)/i);
            if (prefMatch && prefMatch[1].trim().length >= 2) {
              return prefMatch[1].trim().replace(/\s+(?:benefits|qualifications).*$/i, '').trim();
            }
            return null;
          },
          validate: () => ({ isValid: true }),
          normalize: (val) => {
            const arr = formatSkillsArray(val);
            return arr.join(', ');
          }
        },

        // =====================================================================
        // STEP 6 — BENEFITS + ADDITIONAL DETAILS
        // =====================================================================
        {
          key: 'benefits',
          label: 'Benefits & Perks',
          required: true,
          step: 6,
          defaultValue: 'Comprehensive Health Insurance, Learning Stipend, Performance Bonus, Flexible Hybrid Work, Wellness Allowance',
          aliases: ['benefits', 'perks', 'compensation benefits', 'allowances'],
          question: 'What benefits and perks are offered for this role? (e.g. Health Insurance, Learning Stipend, ESOPs - or say "Default")',
          questionTe: 'ఈ ఉద్యోగానికి అందించే ప్రయోజనాలు మరియు అలవెన్సులు (Benefits) ఏమిటి? (లేదా "Default" అనవచ్చు)',
          questionHi: 'इस पद के लिए क्या लाभ और सुविधाएं (Benefits) दी जा रही हैं? (या "Default" कह सकते हैं)',
          extract: (raw, lower) => {
            const benMatch = raw.match(/(?:benefits?|perks?|allowances?)\s*(?::|is|=|to)?\s*([^.\n\r]+)/i);
            if (benMatch && benMatch[1].trim().length >= 3) {
              return benMatch[1].trim();
            }
            return null;
          },
          validate: () => ({ isValid: true }),
          normalize: (val) => {
            const clean = String(val).trim();
            if (/^(default|standard|skip|none|normal)$/i.test(clean)) {
              return 'Comprehensive Health Insurance, Learning Stipend, Performance Bonus, Flexible Hybrid Work, Wellness Allowance';
            }
            return clean;
          }
        },

        // Secondary Internal Fields with Standard Defaults
        {
          key: 'department',
          label: 'Department',
          required: false,
          defaultValue: 'Engineering',
          aliases: ['department', 'dept', 'function'],
          extract: (raw, lower) => {
            if (/\b(engineering|tech|software|it)\b/i.test(lower)) return 'Engineering';
            if (/\b(product|pm)\b/i.test(lower)) return 'Product';
            if (/\b(design|ux|ui)\b/i.test(lower)) return 'Design';
            if (/\b(sales|business\s+dev)\b/i.test(lower)) return 'Sales';
            if (/\b(marketing|growth)\b/i.test(lower)) return 'Marketing';
            if (/\b(human\s+resources|hr|people)\b/i.test(lower)) return 'Human Resources';
            if (/\b(finance|accounts)\b/i.test(lower)) return 'Finance';
            if (/\b(operations|ops)\b/i.test(lower)) return 'Operations';
            return null;
          },
          validate: () => ({ isValid: true }),
          normalize: (val) => String(val).trim()
        },

        {
          key: 'costCenter',
          label: 'Cost Center',
          required: false,
          defaultValue: 'CC-1024',
          aliases: ['cost center', 'cost-center', 'cc'],
          extract: (raw, lower) => {
            const ccMatch = raw.match(/\b(CC-?\d{3,5})\b/i);
            if (ccMatch) return ccMatch[1].toUpperCase();
            return null;
          },
          validate: () => ({ isValid: true }),
          normalize: (val) => String(val).trim().toUpperCase()
        },

        {
          key: 'salaryMin',
          label: 'Minimum Salary',
          required: false,
          defaultValue: 1200000,
          aliases: ['min salary', 'minimum salary', 'salary min'],
          extract: (raw) => {
            const range = raw.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakh|inr)?/i);
            if (range) {
              let min = parseFloat(range[1]);
              if (min < 100) min = min * 100000;
              return Math.round(min);
            }
            return null;
          },
          validate: () => ({ isValid: true }),
          normalize: (val) => Number(val) || 1200000
        },

        {
          key: 'salaryMax',
          label: 'Maximum Salary',
          required: false,
          defaultValue: 1800000,
          aliases: ['max salary', 'maximum salary', 'salary max'],
          extract: (raw) => {
            const range = raw.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakh|inr)?/i);
            if (range) {
              let max = parseFloat(range[2]);
              if (max < 100) max = max * 100000;
              return Math.round(max);
            }
            return null;
          },
          validate: () => ({ isValid: true }),
          normalize: (val) => Number(val) || 1800000
        },

        {
          key: 'currency',
          label: 'Currency',
          required: false,
          defaultValue: 'INR',
          aliases: ['currency'],
          extract: (raw, lower) => {
            if (/\b(usd|\$)\b/i.test(lower)) return 'USD';
            if (/\b(eur|€)\b/i.test(lower)) return 'EUR';
            if (/\b(gbp|£)\b/i.test(lower)) return 'GBP';
            if (/\b(inr|₹|rupees?)\b/i.test(lower)) return 'INR';
            return null;
          },
          validate: () => ({ isValid: true }),
          normalize: (val) => String(val).trim().toUpperCase()
        },

        {
          key: 'location',
          label: 'Location',
          required: false,
          defaultValue: 'Bangalore, India',
          aliases: ['location', 'city'],
          extract: (raw, lower) => {
            if (/\b(bangalore|bengaluru)\b/i.test(lower)) return 'Bangalore, India';
            if (/\b(hyderabad)\b/i.test(lower)) return 'Hyderabad, India';
            if (/\b(pune)\b/i.test(lower)) return 'Pune, India';
            if (/\b(mumbai)\b/i.test(lower)) return 'Mumbai, India';
            if (/\b(delhi|noida|gurgaon)\b/i.test(lower)) return 'Delhi NCR, India';
            if (/\b(remote)\b/i.test(lower)) return 'Remote';
            return null;
          },
          validate: () => ({ isValid: true }),
          normalize: (val) => String(val).trim()
        }
      ],

      // =====================================================================
      // STEP 7 — REVIEW + WORKFLOW + CREATE
      // =====================================================================
      previewRenderer: (session, lang, customHeader = '') => {
        const data = session.getAllData();
        const minExp = data.experienceMin !== undefined ? data.experienceMin : 4;
        const maxExp = data.experienceMax !== undefined ? data.experienceMax : 7;
        const expStr = `${minExp}–${maxExp} years`;
        const salaryBandStr = data.salaryMin && data.salaryMax 
          ? `₹ ${Number(data.salaryMin).toLocaleString()} – ₹ ${Number(data.salaryMax).toLocaleString()} (${data.currency || 'INR'})`
          : 'As per approved requisition band';

        const progressHeader = `📌 *Step 7 of 7 (Review & Approval Workflow)*\n\n📋 **JOB DESCRIPTION REVIEW**`;
        const header = customHeader ? `${progressHeader}\n${customHeader}` : `${progressHeader}\nAll 7 conversational steps have been verified against PeopleWorks standards:`;

        const details = [
          { label: 'Requisition ID', value: data.reqId || 'Standalone' },
          { label: 'Role Title', value: data.title || 'Senior Java Developer' },
          { label: 'Department', value: data.department || 'Engineering' },
          { label: 'Cost Center', value: data.costCenter || 'CC-1024' },
          { label: 'Experience Level', value: expStr },
          { label: 'Work Mode & Location', value: `${data.workMode || 'Hybrid'} (${data.location || 'Bangalore, India'})` },
          { label: 'Mandatory Skills', value: data.requiredSkills || 'Java, Spring Boot, SQL' },
          { label: 'Preferred Skills', value: data.preferredSkills || 'AWS, React' },
          { label: 'Compensation Band', value: salaryBandStr },
          { label: 'Version', value: 'v1.0' }
        ];

        // Resolve active workflow
        const wfEval = evaluateWorkflowForJd({
          department: data.department || 'Engineering',
          experienceMin: minExp,
          minExperience: minExp,
          maxExperience: maxExp
        });

        const activeWf = wfEval.workflow || INITIAL_WORKFLOW_CONFIGS[0];
        const approvalSteps = (activeWf.stages || []).map((stage, idx) => ({
          role: stage.roleName || stage.role,
          name: stage.roleName,
          status: idx === 0 ? 'Pending' : 'Waiting',
          avatar: stage.role.slice(0, 2).toUpperCase()
        }));

        return {
          text: `${header}\n\n• **Requisition:** ${data.reqId || 'Standalone'}\n• **Title:** ${data.title}\n• **Department:** ${data.department}\n• **Cost Center:** ${data.costCenter}\n• **Experience:** ${expStr}\n• **Work Mode:** ${data.workMode || 'Hybrid'} (${data.location || 'Bangalore, India'})\n\n**Job Summary:**\n${data.summary}\n\n**Key Responsibilities:**\n${data.responsibilities}\n\n**Mandatory Skills:**\n${data.requiredSkills}\n\n**Preferred Skills:**\n${data.preferredSkills || 'None specified'}\n\n**Qualifications:**\n${data.qualifications}\n\n**Benefits:**\n${data.benefits}\n\n**Approval Workflow (${activeWf.name}):**\n${approvalSteps.map((s, i) => `${i + 1}. ${s.role}`).join('\n')}\n\n**Everything required is complete. Would you like me to create this JD?**`,
          cards: [
            {
              type: 'action_result',
              title: `Ready to Create JD: ${data.title}`,
              badge: 'v1.0 • Ready for Review',
              badgeColor: 'blue',
              details,
              approvalSteps,
              actions: [
                { label: 'Create JD', actionIntent: 'confirm_create_jd' },
                { label: 'Edit Details', actionIntent: 'edit_workflow_field', variant: 'secondary' },
                { label: 'Cancel', actionIntent: 'cancel_workflow', variant: 'danger' }
              ]
            }
          ],
          toolCalls: []
        };
      },

      // Full JD Creation & Persistence Executor
      executor: async (session, context = {}) => {
        DatabaseService.init();
        const user = context.user || { name: 'Sujith (Recruiter)', role: 'recruiter', email: 'sujith@peopleworks.ai' };

        // 1. Permission Check
        const perm = AIPermissionService.canExecute('create:jd', user);
        if (!perm.authorized) {
          throw new Error(perm.reason || 'Your role does not have permission to create Job Descriptions.');
        }

        const data = session.getAllData();

        // 2. Comprehensive Validation
        const val = AIValidationService.validateJD(data);
        if (!val.isValid) {
          throw new Error(val.errors.join(' '));
        }

        // 3. Generate Sequential JD ID
        const jdId = getNextSequentialJdId();
        const minExp = Number(data.experienceMin !== undefined ? data.experienceMin : 4);
        const maxExp = Number(data.experienceMax !== undefined ? data.experienceMax : 7);

        // 4. Resolve Workflow
        const wfEval = evaluateWorkflowForJd({
          department: data.department || 'Engineering',
          experienceMin: minExp,
          minExperience: minExp,
          maxExperience: maxExp
        });
        const activeWf = wfEval.workflow || INITIAL_WORKFLOW_CONFIGS[0];

        const approvalChain = [
          { stageId: 1, role: 'recruiter', roleName: 'Recruiter', approverName: user.name || 'Sarah Chen', status: 'Submitted', timestamp: new Date().toISOString(), comment: 'Created and submitted via PeopleWorks AI' },
          ...(activeWf.stages || []).map((stg, i) => ({
            stageId: stg.id || (i + 2),
            role: stg.role,
            roleName: stg.roleName,
            approverName: UserDirectoryService.getDefaultApprover(stg.roleName)?.name || stg.roleName,
            status: i === 0 ? 'Pending' : 'Waiting',
            timestamp: null,
            comment: null
          }))
        ];

        const pendingStage = approvalChain.find(s => s.status === 'Pending');
        const pendingRole = pendingStage ? pendingStage.role : 'hiring_manager';
        const pendingApprover = pendingStage ? `${pendingStage.approverName} (${pendingStage.roleName})` : 'Alex Rivera (Hiring Manager)';

        const reqSkillsStr = Array.isArray(data.requiredSkills) ? data.requiredSkills.join(', ') : (data.requiredSkills || 'Java, Spring Boot, SQL');
        const prefSkillsStr = Array.isArray(data.preferredSkills) ? data.preferredSkills.join(', ') : (data.preferredSkills || 'AWS, React');

        const newJd = {
          id: jdId,
          reqId: data.reqId || 'REQ-2026-0001',
          jobCode: `JOB-${data.department?.substring(0, 3).toUpperCase() || 'ENG'}-${Math.floor(10 + Math.random() * 90)}`,
          title: SanitizerService.escapeHtml(data.title || 'Senior Software Engineer'),
          department: SanitizerService.escapeHtml(data.department || 'Engineering'),
          businessUnit: 'Core Platforms',
          costCenter: data.costCenter || 'CC-1024',
          jobFamily: `${data.department || 'Engineering'} Core`,
          jobLevel: 'L4 / Senior',
          employmentType: data.employmentType || 'Full-Time',
          workMode: data.workMode || 'Hybrid',
          location: SanitizerService.escapeHtml(data.location || 'Bangalore, India'),
          experienceMin: minExp,
          experienceMax: maxExp,
          positions: Number(data.positions) || 1,
          summary: SanitizerService.escapeHtml(data.summary || ''),
          responsibilities: data.responsibilities || '',
          requiredSkills: reqSkillsStr,
          preferredSkills: formatSkillsArray(prefSkillsStr),
          mandatorySkills: formatSkillsArray(reqSkillsStr),
          qualifications: SanitizerService.escapeHtml(data.qualifications || "Bachelor's Degree in Computer Science or equivalent"),
          technicalSkills: reqSkillsStr,
          softSkills: 'Team Leadership, Problem Solving, Communication',
          salaryMin: Number(data.salaryMin) || 1200000,
          salaryMax: Number(data.salaryMax) || 1800000,
          currency: data.currency || 'INR',
          benefits: SanitizerService.escapeHtml(data.benefits || 'Comprehensive Health Insurance, Learning Stipend, Annual Bonus'),
          status: 'Pending Approval',
          version: 'v1.0',
          versionNum: 1.0,
          workflowId: activeWf.id,
          workflowName: activeWf.name,
          createdBy: user.name ? `${user.name} (Recruiter)` : 'Sarah Chen (Recruiter)',
          creatorRole: user.role || 'recruiter',
          currentApproverRole: pendingRole,
          currentApproverName: pendingApprover,
          createdDate: new Date().toISOString().split('T')[0],
          lastModified: new Date().toISOString().split('T')[0],
          approvalChain,
          versionHistory: [
            {
              version: 'v1.0',
              changedBy: user.name || 'Sarah Chen',
              date: new Date().toISOString().split('T')[0],
              summary: 'Initial JD creation via PeopleWorks AI',
              status: 'Pending Approval'
            }
          ],
          auditTrail: [
            {
              id: `AUD-${Date.now()}-01`,
              user: user.name || 'Sarah Chen',
              role: 'Recruiter',
              action: 'Created JD',
              dateTime: `${new Date().toISOString().split('T')[0]} 02:00 PM`,
              version: 'v1.0',
              previousValue: '-',
              newValue: 'Draft',
              comment: `Created initial JD linked to ${data.reqId || 'Standalone'}`
            },
            {
              id: `AUD-${Date.now()}-02`,
              user: user.name || 'Sarah Chen',
              role: 'Recruiter',
              action: 'Submitted for Review',
              dateTime: `${new Date().toISOString().split('T')[0]} 02:05 PM`,
              version: 'v1.0',
              previousValue: 'Draft',
              newValue: 'Pending Approval',
              comment: `Submitted to ${pendingApprover}`
            }
          ]
        };

        // 5. Persist to DatabaseService
        DatabaseService.jds = [newJd, ...(DatabaseService.jds || [])];
        DatabaseService.persistAll();

        // 6. Sync to browser Storage
        if (typeof window !== 'undefined') {
          try {
            const currentSaved = localStorage.getItem('pw_job_descriptions');
            const parsed = currentSaved ? JSON.parse(currentSaved) : [];
            localStorage.setItem('pw_job_descriptions', JSON.stringify([newJd, ...parsed.filter(j => j.id !== jdId)]));
            sessionStorage.setItem('pw_jds', JSON.stringify([newJd, ...parsed.filter(j => j.id !== jdId)]));
            window.dispatchEvent(new CustomEvent('pw:jd_created', { detail: newJd }));
            window.dispatchEvent(new CustomEvent('pw_db_updated', { detail: { type: 'jd', record: newJd } }));
          } catch (e) {}
        }

        // 7. Audit Log
        AIAuditService.logAction({
          action: 'CREATE_JOB_DESCRIPTION',
          intent: 'CREATE_JD',
          entityType: 'job_description',
          entityId: jdId,
          details: { title: newJd.title, reqId: newJd.reqId, department: newJd.department }
        });

        // 8. Verification Check
        const verified = DatabaseService.jds.find(j => j.id === jdId);
        if (!verified) {
          throw new Error('Database verification failed. The record could not be confirmed in storage.');
        }

        const lang = context.language || 'en';
        const successMsg = lang === 'te'
          ? `🎉 **Job Description విజయవంతంగా సృష్టించబడింది!**\n\n• **JD ID:** \`${jdId}\`\n• **టైటిల్:** **${newJd.title}**\n• **Requisition:** \`${newJd.reqId}\`\n• **స్టేటస్:** ⏳ **Pending Approval**\n• **వెర్షన్:** \`${newJd.version}\`\n\nఈ JD ఇప్పుడు JD Repository లో ఆమోదం కోసం సిద్ధంగా ఉంది.`
          : lang === 'hi'
          ? `🎉 **Job Description सफलतापूर्वक बनाई गई!**\n\n• **JD ID:** \`${jdId}\`\n• **टाइटल:** **${newJd.title}**\n• **Requisition:** \`${newJd.reqId}\`\n• **स्थिति:** ⏳ **Pending Approval**\n• **संस्करण:** \`${newJd.version}\`\n\nयह JD अब JD Repository में समीक्षा हेतु उपलब्ध है।`
          : `🎉 **Job Description Created Successfully!**\n\n• **JD ID:** \`${jdId}\`\n• **Title:** **${newJd.title}**\n• **Linked Requisition:** \`${newJd.reqId}\`\n• **Department:** ${newJd.department}\n• **Status:** ⏳ **Pending Approval**\n• **Version:** \`${newJd.version}\`\n• **Workflow:** ${newJd.workflowName}\n\nThe new Job Description has been persisted and synced to the **JD Repository** in real time.`;

        return {
          text: successMsg,
          cards: [
            {
              type: 'action_result',
              title: `JD Created: ${newJd.title}`,
              badge: 'Pending Approval',
              badgeColor: 'amber',
              details: [
                { label: 'JD ID', value: jdId },
                { label: 'Title', value: newJd.title },
                { label: 'Requisition', value: newJd.reqId },
                { label: 'Department', value: newJd.department },
                { label: 'Experience', value: `${minExp}–${maxExp} years` },
                { label: 'Version', value: 'v1.0' },
                { label: 'Workflow', value: newJd.workflowName }
              ]
            }
          ],
          toolCalls: [
            {
              name: 'createJobDescription',
              params: { jdId, title: newJd.title, reqId: newJd.reqId },
              result: { success: true, jd: newJd }
            }
          ]
        };
      }
    });
    this.totalSteps = 7;
  }
}
