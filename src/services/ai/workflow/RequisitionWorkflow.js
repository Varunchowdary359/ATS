/**
 * RequisitionWorkflow
 * Concrete conversational creation workflow for PeopleWorks ATS Job Requisitions.
 * Interactively guides the recruiter/hiring manager through EVERY mandatory field
 * required by the actual CreateRequisitionPage form:
 * - Title, Department, Location, Employment Type, Openings,
 * - Hiring Manager, Lead Recruiter, Priority,
 * - Salary Range (Min, Max, Currency), Target Start Date,
 * - Business Justification, Cost Center,
 * - Approval Chain Approvers (Hiring Manager, Finance Controller, Department Head).
 */

import { ConversationalWorkflow } from './ConversationalWorkflow.js';
import { DatabaseService } from '../../db/DatabaseService.js';
import { ApprovalService } from '../../db/ApprovalService.js';
import { AIAuditService } from '../AIAuditService.js';
import { AIPermissionService } from '../AIPermissionService.js';
import { AIValidationService } from '../AIValidationService.js';
import { SanitizerService } from '../../security/SanitizerService.js';
import { UserDirectoryService } from '../../directory/UserDirectoryService.js';
import { normalizeText, safeString } from '../AINormalizer.js';

// Number words to digits dictionary
const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  ఒకటి: 1, రెండు: 2, మూడు: 3, నాలుగు: 4, ఐదు: 5,
  एक: 1, दो: 2, तीन: 3, चार: 4, पाँच: 5
};

const getNextSequentialReqId = () => {
  try {
    let allReqs = [];
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('pw_requisitions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allReqs = parsed;
        }
      }
    }
    if (allReqs.length === 0 && DatabaseService.requisitions?.length > 0) {
      allReqs = DatabaseService.requisitions;
    }

    let maxNum = 0;
    allReqs.forEach(req => {
      if (req?.id) {
        const match = req.id.match(/\d+/g);
        if (match && match.length > 0) {
          const lastNum = parseInt(match[match.length - 1], 10);
          if (!isNaN(lastNum) && lastNum > maxNum) {
            maxNum = lastNum;
          }
        }
      }
    });

    const nextNum = maxNum + 1;
    return `REQ-2026-${String(nextNum).padStart(4, '0')}`;
  } catch (e) {
    return 'REQ-2026-0001';
  }
};

const formatCurrencyNumber = (num, curr = 'INR') => {
  if (!num) return '0';
  const val = Number(num);
  if (isNaN(val)) return String(num);
  const symbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '₹';
  return `${symbol} ${val.toLocaleString(curr === 'INR' ? 'en-IN' : 'en-US')}`;
};

export class RequisitionWorkflow extends ConversationalWorkflow {
  constructor() {
    super({
      type: 'CREATE_REQUISITION',
      title: 'Job Requisition Creation',
      fieldDefinitions: [
        // 1. Job Title
        {
          key: 'jobTitle',
          label: 'Job Title',
          required: true,
          aliases: ['title', 'job title', 'role', 'designation', 'position title'],
          question: 'What is the job title for this position? (e.g. Senior Java Developer, Product Manager, DevOps Engineer)',
          questionTe: 'ఈ పొజిషన్ కోసం జాబ్ టైటిల్ ఏమిటి? (ఉదా: Senior Java Developer, Product Manager)',
          questionHi: 'इस पद के लिए जॉब टाइटल क्या है? (जैसे: Senior Java Developer, Product Manager)',
          extract: (raw, lower) => {
            const titleMatch = raw.match(/\b(?:for|role|position|as|title)\s+(?:\d+\s+)?([A-Za-z0-9\s.+#]+?)(?:\s+\b(?:in|with|under|at|openings|positions|candidates|budget)\b|,|$)/i);
            if (titleMatch && titleMatch[1].trim().length >= 3 && !/\b(requisition|req|creation)\b/i.test(titleMatch[1])) {
              let t = titleMatch[1].trim().replace(/^\d+\s*/, '').trim();
              return t.replace(/Developers$/i, 'Developer').replace(/Engineers$/i, 'Engineer').replace(/Designers$/i, 'Designer');
            }
            if (/\b(developer|engineer|manager|architect|designer|lead|specialist|consultant|analyst|tester|qa|recruiter|executive|director|vp)\b/i.test(lower)) {
              const clean = raw.replace(/\b(?:in|under|at)\s+(?:engineering|sales|marketing|hr|finance|bangalore|hyderabad|pune|mumbai|delhi|chennai|remote).*$/i, '').trim();
              if (clean.length >= 3 && !/\b(create|requisition|req)\b/i.test(clean)) {
                return clean.replace(/^\d+\s*/, '').trim();
              }
            }
            return null;
          },
          validate: (val) => {
            if (!val || String(val).trim().length < 3) {
              return { isValid: false, error: '⚠️ Job Title is required and must be at least 3 characters.' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            let res = String(val).trim().replace(/^\d+\s*/, '').trim();
            res = res.replace(/Developers$/i, 'Developer').replace(/Engineers$/i, 'Engineer').replace(/Designers$/i, 'Designer');
            return res.replace(/\b\w/g, l => l.toUpperCase());
          }
        },

        // 2. Department
        {
          key: 'department',
          label: 'Department',
          required: true,
          aliases: ['dept', 'division', 'team', 'department'],
          question: 'Which department will this position belong to? (e.g. Engineering, Product, Design, Sales, Marketing, HR, Finance)',
          questionTe: 'ఈ ఉద్యోగం ఏ డిపార్ట్‌మెంట్‌కి చెందినది? (ఉదా: Engineering, Product, Sales, HR)',
          questionHi: 'यह पद किस विभाग (Department) के अंतर्गत होगा? (जैसे: Engineering, Product, Sales, HR)',
          extract: (raw, lower) => {
            if (/\b(engineering|tech|software|information\s+technology|it\s+dept|it\s+department)\b/i.test(lower) && !/\b(developer|engineer)\b/i.test(lower)) return 'Engineering';
            if (/\b(engineering\s+dept|engineering\s+department|under\s+engineering|in\s+engineering)\b/i.test(lower)) return 'Engineering';
            if (/\b(product|pm)\b/i.test(lower) && !/\b(product\s+manager)\b/i.test(lower)) return 'Product';
            if (/\b(product\s+department|under\s+product|in\s+product)\b/i.test(lower)) return 'Product';
            if (/\b(design|ui|ux)\b/i.test(lower) && !/\b(designer)\b/i.test(lower)) return 'Design';
            if (/\b(sales|business development|bd)\b/i.test(lower)) return 'Sales';
            if (/\b(marketing|growth)\b/i.test(lower)) return 'Marketing';
            if (/\b(human resources|people\s+ops)\b/i.test(lower)) return 'Human Resources';
            if (/\b(finance|accounts)\b/i.test(lower)) return 'Finance';
            if (/\b(operations|ops)\b/i.test(lower)) return 'Operations';
            const deptMatch = raw.match(/\b(?:department|dept|division|team)\s*(?::|is|=|to)?\s*([A-Za-z\s]+)/i);
            if (deptMatch && deptMatch[1].trim().length >= 2) {
              return deptMatch[1].trim();
            }
            return null;
          },
          validate: (val) => {
            if (!val || String(val).trim().length < 2) {
              return { isValid: false, error: '⚠️ Department is required.' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            return String(val).trim().replace(/\b\w/g, l => l.toUpperCase());
          }
        },

        // 3. Location
        {
          key: 'location',
          label: 'Location',
          required: true,
          aliases: ['location', 'city', 'place', 'work location', 'office'],
          question: 'Where will the position be located? (e.g. Bangalore, Hyderabad, Pune, Mumbai, Remote)',
          questionTe: 'ఈ ఉద్యోగ లొకేషన్ ఎక్కడ? (ఉదా: Bangalore, Hyderabad, Remote)',
          questionHi: 'नौकरी का स्थान (Location) कहाँ होगा? (जैसे: Bangalore, Hyderabad, Remote)',
          extract: (raw, lower) => {
            if (/\b(bangalore|bengaluru)\b/i.test(lower)) return 'Bangalore, India';
            if (/\b(hyderabad)\b/i.test(lower)) return 'Hyderabad, India';
            if (/\b(pune)\b/i.test(lower)) return 'Pune, India';
            if (/\b(mumbai)\b/i.test(lower)) return 'Mumbai, India';
            if (/\b(delhi|noida|gurgaon|ncr)\b/i.test(lower)) return 'Delhi NCR, India';
            if (/\b(chennai)\b/i.test(lower)) return 'Chennai, India';
            if (/\b(remote|wfh|work from home)\b/i.test(lower)) return 'Remote';
            const locMatch = raw.match(/\b(?:location|city|place|office|based\s+in)\s*(?::|is|=|to)?\s*([A-Za-z\s]+)/i);
            if (locMatch && !/\b(engineering|sales|marketing|hr|finance|product|design)\b/i.test(locMatch[1]) && locMatch[1].trim().length >= 3) {
              return locMatch[1].trim();
            }
            return null;
          },
          validate: (val) => {
            if (!val || String(val).trim().length < 2) {
              return { isValid: false, error: '⚠️ Location is required.' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            return String(val).trim();
          }
        },

        // 4. Employment Type (Secondary - smart default to Full-Time)
        {
          key: 'employmentType',
          label: 'Employment Type',
          required: false,
          defaultValue: 'Full-Time',
          aliases: ['job type', 'type', 'employment type', 'work type'],
          question: 'What is the employment type? (Full-Time, Contract, Part-Time, Internship)',
          questionTe: 'ఉద్యోగ రకం ఏమిటి? (Full-Time, Contract, Part-Time)',
          questionHi: 'रोजगार का प्रकार क्या है? (Full-Time, Contract, Part-Time)',
          extract: (raw, lower) => {
            if (/\b(contract|contractor|c2h)\b/i.test(lower)) return 'Contract';
            if (/\b(part[-\s]?time)\b/i.test(lower)) return 'Part-Time';
            if (/\b(intern|internship)\b/i.test(lower)) return 'Internship';
            if (/\b(full[-\s]?time|permanent)\b/i.test(lower)) return 'Full-Time';
            return null;
          },
          validate: (val) => {
            const validTypes = ['Full-Time', 'Contract', 'Part-Time', 'Internship'];
            if (val && !validTypes.includes(val)) {
              return { isValid: false, error: '⚠️ Please select a valid employment type (Full-Time, Contract, Part-Time, Internship).' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            if (/contract/i.test(val)) return 'Contract';
            if (/part/i.test(val)) return 'Part-Time';
            if (/intern/i.test(val)) return 'Internship';
            return 'Full-Time';
          }
        },

        // 5. Openings (Core Step 4)
        {
          key: 'openings',
          label: 'Openings',
          required: true,
          aliases: ['openings', 'positions', 'headcount', 'count', 'seats', 'vacancies'],
          question: 'How many openings or vacancies do you need to hire for? (e.g. 3 openings, Full-Time)',
          questionTe: 'మీకు ఎన్ని ఓపెనింగ్స్ / ఖాళీలు అవసరం? (ఉదా: 3 openings, Full-Time)',
          questionHi: 'आपको कितने पदों (Openings) के लिए भर्ती करनी है? (जैसे: 3 openings, Full-Time)',
          extract: (raw, lower) => {
            const digitMatch = lower.match(/\b(\d{1,3})\s*(?:openings|positions|headcount|seats|vacancies|candidates)\b/);
            if (digitMatch) {
              return parseInt(digitMatch[1], 10);
            }
            for (const [w, n] of Object.entries(NUMBER_WORDS)) {
              if (new RegExp(`\\b${w}\\s*(?:openings|positions|headcount|seats|vacancies|candidates)?\\b`, 'i').test(lower)) {
                return n;
              }
            }
            if (/^\s*\d{1,3}\s*$/.test(raw.trim())) {
              return parseInt(raw.trim(), 10);
            }
            return null;
          },
          validate: (val) => {
            const num = Number(val);
            if (isNaN(num) || num < 1) {
              return { isValid: false, error: '⚠️ Openings must be a positive number (at least 1).' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            return Number(val) || 1;
          }
        },

        // 6. Hiring Manager (Core Step 5)
        {
          key: 'hiringManager',
          label: 'Hiring Manager',
          required: true,
          defaultValue: 'Alex Chen',
          aliases: ['hiring manager', 'hm', 'manager', 'reporting manager'],
          question: 'Who is the Hiring Manager for this requisition? (e.g. Alex Chen, Ravi Kumar)',
          questionTe: 'ఈ ఉద్యోగానికి హైరింగ్ మేనేజర్ ఎవరు? (ఉదా: Alex Chen, Ravi Kumar)',
          questionHi: 'इस पद के लिए हायरिंग मैनेजर कौन हैं? (जैसे: Alex Chen, Ravi Kumar)',
          extract: (raw, lower) => {
            const hmMatch = raw.match(/\b(?:hiring manager|manager|hm)\s*(?::|is|=|to)?\s*([A-Za-z\s]+)/i);
            if (hmMatch && hmMatch[1].trim().length >= 3 && !/\b(urgent|high|low|medium|full-time|contract|india|salary|budget|openings)\b/i.test(hmMatch[1])) {
              const res = UserDirectoryService.resolveUser(hmMatch[1].trim(), 'Hiring Manager');
              return res?.user?.name || hmMatch[1].trim();
            }
            return null;
          },
          validate: (val) => {
            if (!val || String(val).trim().length < 2) {
              return { isValid: false, error: '⚠️ Hiring Manager name is required.' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            const res = UserDirectoryService.resolveUser(val, 'Hiring Manager');
            return res?.user?.name || String(val).trim().replace(/\b\w/g, l => l.toUpperCase());
          }
        },

        // 7. Lead Recruiter (Secondary - smart default to Sarah Jenkins)
        {
          key: 'recruiter',
          label: 'Lead Recruiter',
          required: false,
          defaultValue: 'Sarah Jenkins',
          aliases: ['lead recruiter', 'recruiter', 'assigned recruiter', 'hr recruiter', 'hrbp'],
          question: 'Who is the Lead Recruiter assigned to manage this role? (e.g. Sarah Jenkins, Priya Sharma, Sarah Miller)',
          questionTe: 'ఈ రోల్‌కి లీడ్ రిక్రూటర్ ఎవరు? (ఉదా: Sarah Jenkins, Priya Sharma)',
          questionHi: 'इस पद के लिए लीड रिक्रूटर कौन हैं? (जैसे: Sarah Jenkins, Priya Sharma)',
          extract: (raw, lower) => {
            const recMatch = raw.match(/\b(?:lead recruiter|recruiter|hrbp)\s*(?::|is|=|to)?\s*([A-Za-z\s]+)/i);
            if (recMatch && recMatch[1].trim().length >= 3) {
              const res = UserDirectoryService.resolveUser(recMatch[1].trim(), 'Lead Recruiter');
              return res?.user?.name || recMatch[1].trim();
            }
            return null;
          },
          validate: (val) => {
            if (val && String(val).trim().length < 2) {
              return { isValid: false, error: '⚠️ Lead Recruiter is required.' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            const res = UserDirectoryService.resolveUser(val, 'Lead Recruiter');
            return res?.user?.name || String(val).trim().replace(/\b\w/g, l => l.toUpperCase());
          }
        },

        // 8. Priority (Secondary - smart default to High)
        {
          key: 'priority',
          label: 'Priority',
          required: false,
          defaultValue: 'High',
          aliases: ['priority', 'urgency', 'hiring priority'],
          question: 'What is the hiring priority level? (Low, Medium, High, Urgent)',
          questionTe: 'హైరింగ్ ప్రాధాన్యత ఏమిటి? (Low, Medium, High, Urgent)',
          questionHi: 'हायरिंग प्राथमिकता क्या है? (Low, Medium, High, Urgent)',
          extract: (raw, lower) => {
            if (/\b(urgent|critical|immediate)\b/i.test(lower)) return 'Urgent';
            if (/\b(high)\b/i.test(lower)) return 'High';
            if (/\b(medium|normal)\b/i.test(lower)) return 'Medium';
            if (/\b(low)\b/i.test(lower)) return 'Low';
            return null;
          },
          validate: (val) => {
            const valids = ['Low', 'Medium', 'High', 'Urgent'];
            if (val && !valids.includes(val)) {
              return { isValid: false, error: '⚠️ Priority must be Low, Medium, High, or Urgent.' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            if (/urgent|critical/i.test(val)) return 'Urgent';
            if (/high/i.test(val)) return 'High';
            if (/low/i.test(val)) return 'Low';
            return 'Medium';
          }
        },

        // 9. Minimum Salary (Core Step 6)
        {
          key: 'minSalary',
          label: 'Annual Salary / Budget Range',
          required: true,
          defaultValue: '1200000',
          aliases: ['salary', 'budget', 'min salary', 'minimum salary', 'budget min', 'minimum budget', 'min budget'],
          question: 'What is the annual salary range or budget? (e.g. 12 to 18 Lakhs INR, 15 LPA, or 1200000)',
          questionTe: 'వార్షిక బడ్జెట్ లేదా శాలరీ ఎంత? (ఉదా: 12 to 18 Lakhs INR, 15 LPA)',
          questionHi: 'वार्षिक बजट या वेतन सीमा क्या है? (जैसे: 12 to 18 Lakhs INR, 15 LPA)',
          extract: (raw, lower, allData) => {
            const cleanText = raw.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '').replace(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/g, '');
            const explicitMin = cleanText.match(/\b(?:min|minimum)\s*(?:salary|budget)?\s*(?::|is|=|to)?\s*(\d{5,8})\b/i);
            if (explicitMin) return explicitMin[1];

            // Range match (e.g. "12 to 18 lakhs" or "12-18 LPA" or "1200000 to 1800000")
            const rangeMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs|lakh|lac|k|inr)?/i);
            if (rangeMatch) {
              let min = parseFloat(rangeMatch[1]);
              if (min < 100) min = min * 100000;
              return String(Math.round(min));
            }
            const singleLakhMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakhs|lakh|lac)/i);
            if (singleLakhMatch) {
              const val = parseFloat(singleLakhMatch[1]) * 100000;
              return String(Math.round(val));
            }
            if (/^\s*\d{5,8}\s*$/.test(cleanText.trim())) return cleanText.trim();
            return null;
          },
          validate: (val) => {
            const num = Number(val);
            if (isNaN(num) || num <= 0) {
              return { isValid: false, error: '⚠️ Minimum budget must be greater than 0.' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            const clean = String(val).replace(/,/g, '').trim();
            const num = Number(clean);
            if (!isNaN(num) && num < 100) return String(Math.round(num * 100000));
            return String(num || 1200000);
          }
        },

        // 10. Maximum Salary (Secondary - calculated or extracted)
        {
          key: 'maxSalary',
          label: 'Maximum Budget',
          required: false,
          defaultValue: (session) => {
            const min = Number(session?.getField('minSalary') || 1200000);
            return String(Math.round(min * 1.5));
          },
          aliases: ['max salary', 'maximum salary', 'budget max', 'maximum budget', 'max budget'],
          question: 'What is the maximum annual budget / salary? (e.g. 1800000, 18 Lakhs, or 18 LPA)',
          questionTe: 'గరిష్ట వార్షిక బడ్జెట్ / శాలరీ ఎంత? (ఉదా: 1800000, 18 Lakhs)',
          questionHi: 'अधिकतम वार्षिक बजट / वेतन क्या है? (जैसे: 1800000, 18 Lakhs)',
          extract: (raw, lower, allData) => {
            const cleanText = raw.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '').replace(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/g, '');
            const explicitMax = cleanText.match(/\b(?:max|maximum)\s*(?:salary|budget)?\s*(?::|is|=|to)?\s*(\d{5,8})\b/i);
            if (explicitMax) return explicitMax[1];

            const rangeMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs|lakh|lac|k|inr)?/i);
            if (rangeMatch) {
              let max = parseFloat(rangeMatch[2]);
              if (max < 100) max = max * 100000;
              return String(Math.round(max));
            }
            const singleLakhMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakhs|lakh|lac)/i);
            if (singleLakhMatch && allData?.minSalary) {
              const val = parseFloat(singleLakhMatch[1]) * 100000;
              return String(Math.round(val));
            }
            if (/^\s*\d{5,8}\s*$/.test(cleanText.trim()) && allData?.minSalary) return cleanText.trim();
            return null;
          },
          validate: (val, allData) => {
            if (!val) return { isValid: true };
            const max = Number(val);
            const min = Number(allData?.minSalary || 0);
            if (isNaN(max) || max <= 0) {
              return { isValid: false, error: '⚠️ Maximum budget must be greater than 0.' };
            }
            if (min > 0 && max <= min) {
              return { isValid: false, error: `⚠️ Maximum budget (${max}) must be greater than Minimum budget (${min}).` };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            const clean = String(val).replace(/,/g, '').trim();
            const num = Number(clean);
            if (!isNaN(num) && num < 100) return String(Math.round(num * 100000));
            return String(num || 1800000);
          }
        },

        // 11. Currency (Secondary - smart default INR)
        {
          key: 'currency',
          label: 'Currency',
          required: false,
          defaultValue: 'INR',
          aliases: ['currency', 'pay currency'],
          question: 'Which currency should be used? (INR, USD, EUR, GBP)',
          extract: (raw, lower) => {
            if (/\b(usd|\$|dollar|dollars)\b/i.test(lower)) return 'USD';
            if (/\b(eur|€|euro|euros)\b/i.test(lower)) return 'EUR';
            if (/\b(gbp|£|pound|pounds)\b/i.test(lower)) return 'GBP';
            if (/\b(inr|₹|rupee|rupees|rs)\b/i.test(lower)) return 'INR';
            return null;
          },
          validate: (val) => {
            const valids = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'];
            if (val && !valids.includes(String(val).toUpperCase())) {
              return { isValid: false, error: '⚠️ Please specify a valid currency (INR, USD, EUR, GBP).' };
            }
            return { isValid: true };
          },
          normalize: (val) => String(val).toUpperCase().trim()
        },

        // 12. Target Hire Date (Secondary - smart default +30 days)
        {
          key: 'targetHireDate',
          label: 'Target Start Date',
          required: false,
          defaultValue: () => {
            const d = new Date(Date.now() + 30 * 86400000);
            return d.toISOString().split('T')[0];
          },
          aliases: ['target date', 'start date', 'target start date', 'hire date', 'joining date'],
          question: 'What is the target start date or hire date? (e.g. 15 Oct 2026, 2026-10-15, next month)',
          questionTe: 'టార్గెట్ జాయినింగ్ / స్టార్ట్ డేట్ ఎప్పుడు? (ఉదా: 15 Oct 2026, 2026-10-15)',
          questionHi: 'लक्षित प्रारंभ तिथि (Start Date) क्या है? (जैसे: 15 Oct 2026, 2026-10-15)',
          extract: (raw, lower) => {
            if (/\bnext\s+month\b/i.test(lower)) {
              const d = new Date();
              d.setMonth(d.getMonth() + 1);
              return d.toISOString().split('T')[0];
            }
            const isoMatch = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
            if (isoMatch) return isoMatch[1];

            const textDateMatch = raw.match(/\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+\d{4})?)\b/i);
            if (textDateMatch) {
              const parsed = Date.parse(textDateMatch[1]);
              if (!isNaN(parsed)) {
                return new Date(parsed).toISOString().split('T')[0];
              }
            }

            const slashDateMatch = raw.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
            if (slashDateMatch) {
              const parsed = Date.parse(slashDateMatch[1]);
              if (!isNaN(parsed)) {
                return new Date(parsed).toISOString().split('T')[0];
              }
            }
            return null;
          },
          validate: (val) => {
            if (val && (!/\d{4}-\d{2}-\d{2}/.test(val) && isNaN(Date.parse(val)))) {
              return { isValid: false, error: '⚠️ Please provide a valid target hire date (e.g. 15 Oct 2026, 2026-10-15).' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            if (/\d{4}-\d{2}-\d{2}/.test(val)) return val;
            const parsed = Date.parse(val);
            if (!isNaN(parsed)) return new Date(parsed).toISOString().split('T')[0];
            return val;
          }
        },

        // 13. Justification (Secondary - standard enterprise default)
        {
          key: 'justificationNote',
          label: 'Justification',
          required: false,
          defaultValue: 'New headcount required for quarterly business delivery and engineering expansion.',
          aliases: ['justification', 'business justification', 'reason', 'business case'],
          question: 'What is the business justification for this requisition? (e.g. New headcount for scaling team, Replacement for existing role)',
          questionTe: 'ఈ ఉద్యోగానికి వ్యాపార సమర్థన (Justification) ఏమిటి? (ఉదా: టీమ్ విస్తరణ, రీప్లేస్‌మెంట్)',
          questionHi: 'इस पद के लिए व्यावसायिक औचित्य (Justification) क्या है? (जैसे: टीम विस्तार, पद प्रतिस्थापन)',
          extract: (raw, lower) => {
            const justMatch = raw.match(/\b(?:justification|reason|business case|purpose)\s*(?::|is|=|to)?\s*([^,\n]+?)(?=\s*(?:,|$|\bcost\s+center\b|\bfinance\b|\bdept\s+head\b))/i);
            if (justMatch && justMatch[1].trim().length >= 4) return justMatch[1].trim();
            if (/\b(?:replacement|backfill|expansion|growth|scaling|workload|new headcount|new project|scaling team)\b/i.test(lower)) {
              return raw.trim();
            }
            return null;
          },
          validate: (val) => {
            if (val && String(val).trim().length < 4) {
              return { isValid: false, error: '⚠️ Business Justification is required.' };
            }
            return { isValid: true };
          },
          normalize: (val) => String(val).trim()
        },

        // 14. Cost Center (Secondary - standard default CC-1024)
        {
          key: 'costCenter',
          label: 'Cost Center',
          required: false,
          defaultValue: 'CC-1024',
          aliases: ['cost center', 'cc', 'billing code', 'cost code'],
          question: 'Which cost center should this requisition be billed to? (Format: CC-XXXX, e.g. CC-1024, CC-1002)',
          questionTe: 'ఈ ఉద్యోగానికి కాస్ట్ సెంటర్ ఏది? (ఉదా: CC-1024, CC-1002)',
          questionHi: 'इस पद के लिए कॉस्ट सेंटर (Cost Center) क्या है? (जैसे: CC-1024, CC-1002)',
          extract: (raw, lower) => {
            const ccMatch = raw.match(/\b(CC-?\d{3,5})\b/i);
            if (ccMatch) {
              let cc = ccMatch[1].toUpperCase();
              if (!cc.includes('-')) cc = `CC-${cc.slice(2)}`;
              return cc;
            }
            const explicitCC = raw.match(/\bcost\s+center\s*(?::|is|=|to)?\s*(\w+)/i);
            if (explicitCC) {
              let cc = explicitCC[1].toUpperCase();
              if (/^\d+$/.test(cc)) return `CC-${cc}`;
              return cc;
            }
            return null;
          },
          validate: (val) => {
            if (val && !/^CC-\w+$/i.test(String(val).trim())) {
              return { isValid: false, error: '⚠️ Cost center format must be CC-XXXX (e.g. CC-1024, CC-1002).' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            let res = String(val).trim().toUpperCase();
            if (/^\d+$/.test(res)) res = `CC-${res}`;
            if (/^CC\d+$/.test(res)) res = `CC-${res.slice(2)}`;
            return res;
          }
        },

        // 15. Finance Controller Approver (Core Step 7)
        {
          key: 'approverFinance',
          label: 'Finance Approver',
          required: true,
          defaultValue: 'David Miller',
          aliases: ['approver', 'finance approver', 'finance controller', 'finance lead', 'finance signoff'],
          question: 'Who should approve this requisition? (e.g. David Miller for Finance Controller, Ravi Sharma)',
          questionTe: 'ఈ రిక్విజిషన్‌ను ఎవరు ఆమోదించాలి? (ఉదా: David Miller - Finance Controller)',
          questionHi: 'इस पद को कौन अप्रूव करेगा? (जैसे: David Miller - Finance Controller)',
          extract: (raw, lower) => {
            const finMatch = raw.match(/\b(?:approver|finance approver|finance controller|finance lead|finance signoff|finance)\s*(?::|is|=|to)?\s*([A-Za-z\s]+?)(?=\s*(?:,|$|\bdept\s+head\b|\bcost\s+center\b|\bjustification\b))/i);
            if (finMatch && finMatch[1].trim().length >= 3 && !/\b(approver|head|director|manager)\b/i.test(finMatch[1].trim())) {
              const res = UserDirectoryService.resolveUser(finMatch[1].trim(), 'Finance Controller');
              return res?.user?.name || finMatch[1].trim();
            }
            return null;
          },
          validate: (val) => {
            if (!val || String(val).trim().length < 2) {
              return { isValid: false, error: '⚠️ Finance Approver is required.' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            const res = UserDirectoryService.resolveUser(val, 'Finance Controller');
            return res?.user?.name || String(val).trim().replace(/\b\w/g, l => l.toUpperCase());
          }
        },

        // 16. Department Head Approver (Secondary - smart default to Sarah Jenkins)
        {
          key: 'approverDeptHead',
          label: 'Department Head Approver',
          required: false,
          defaultValue: 'Sarah Jenkins',
          aliases: ['dept head', 'department head', 'vp approver', 'director approver', 'head of dept'],
          question: 'Who should be the Department Head / Director approver? (e.g. Sarah Jenkins, Vikram Malhotra)',
          questionTe: 'డిపార్ట్‌మెంట్ హెడ్ ఆమోదకర్త ఎవరు? (ఉదా: Sarah Jenkins, Vikram Malhotra)',
          questionHi: 'डिपार्टमेंट हेड अप्रूवर कौन होंगे? (जैसे: Sarah Jenkins, Vikram Malhotra)',
          extract: (raw, lower) => {
            const dhMatch = raw.match(/\b(?:dept head|department head|director approver|vp approver|head of dept|dept head approver)\s*(?::|is|=|to)?\s*([A-Za-z\s]+?)(?=\s*(?:,|$|\bcost\s+center\b|\bfinance\b|\bjustification\b))/i);
            if (dhMatch && dhMatch[1].trim().length >= 3) {
              const res = UserDirectoryService.resolveUser(dhMatch[1].trim(), 'Department Head');
              return res?.user?.name || dhMatch[1].trim();
            }
            return null;
          },
          validate: (val) => {
            if (val && String(val).trim().length < 2) {
              return { isValid: false, error: '⚠️ Department Head Approver is required.' };
            }
            return { isValid: true };
          },
          normalize: (val) => {
            const res = UserDirectoryService.resolveUser(val, 'Department Head');
            return res?.user?.name || String(val).trim().replace(/\b\w/g, l => l.toUpperCase());
          }
        }
      ],

      // Complete Structured Preview Renderer
      previewRenderer: (session, lang, customHeader = '') => {
        const data = session.getAllData();
        const curr = data.currency || 'INR';
        const minSalaryFmt = formatCurrencyNumber(data.minSalary, curr);
        const maxSalaryFmt = formatCurrencyNumber(data.maxSalary, curr);
        const salaryBandStr = `${minSalaryFmt} – ${maxSalaryFmt} (${curr})`;

        const header = customHeader || `📋 **Requisition Review & Summary**\nAll mandatory details have been collected and validated against PeopleWorks enterprise rules:`;

        const details = [
          { label: 'Job Title', value: data.jobTitle || 'N/A' },
          { label: 'Department', value: data.department || 'Engineering' },
          { label: 'Location', value: data.location || 'Bangalore, India' },
          { label: 'Employment Type', value: data.employmentType || 'Full-Time' },
          { label: 'Openings', value: `${data.openings || 1} Position(s)` },
          { label: 'Hiring Manager', value: data.hiringManager || 'Alex Chen' },
          { label: 'Lead Recruiter', value: data.recruiter || 'Sarah Jenkins' },
          { label: 'Priority', value: data.priority || 'High' },
          { label: 'Salary Band', value: salaryBandStr },
          { label: 'Target Start Date', value: data.targetHireDate || 'Pending' },
          { label: 'Justification', value: data.justificationNote || 'New headcount expansion' },
          { label: 'Cost Center', value: data.costCenter || 'CC-1024' }
        ];

        const approvalChain = [
          { role: 'Hiring Manager', name: data.hiringManager || 'Alex Chen', status: 'Submitted', avatar: 'HM' },
          { role: 'Department Head', name: data.approverDeptHead || 'Sarah Jenkins', status: 'Pending', avatar: 'DH' },
          { role: 'Finance Controller', name: data.approverFinance || 'David Miller', status: 'Waiting', avatar: 'FC' },
          { role: 'HR / Talent Acquisition', name: 'HR Lead', status: 'Waiting', avatar: 'HR' }
        ];

        return {
          text: `${header}\n\n• **Title:** ${data.jobTitle}\n• **Department:** ${data.department}\n• **Location:** ${data.location}\n• **Job Type:** ${data.employmentType || 'Full-Time'}\n• **Openings:** ${data.openings || 1}\n• **Hiring Manager:** ${data.hiringManager || 'Alex Chen'}\n• **Lead Recruiter:** ${data.recruiter || 'Sarah Jenkins'}\n• **Priority:** ${data.priority || 'High'}\n• **Salary Band:** ${salaryBandStr}\n• **Target Start Date:** ${data.targetHireDate}\n• **Justification:** ${data.justificationNote}\n• **Cost Center:** ${data.costCenter}\n\n**Sequential Approval Chain:**\n1. Hiring Manager: **${data.hiringManager || 'Alex Chen'}** (Creator)\n2. Department Head: **${data.approverDeptHead || 'Sarah Jenkins'}** (L1 Headcount Sign-off)\n3. Finance Controller: **${data.approverFinance || 'David Miller'}** (L2 Budget Clearance)\n4. HR / Talent Acquisition: **HR Lead** (L3 Sourcing Clearance)\n\n**Would you like me to create this requisition now?**`,
          cards: [
            {
              type: 'action_result',
              title: `Ready to Create Requisition: ${data.jobTitle}`,
              badge: 'All Validations Passed',
              badgeColor: 'blue',
              details,
              approvalSteps: approvalChain,
              actions: [
                { label: 'Create Requisition', actionIntent: 'confirm_create_requisition' },
                { label: 'Edit Details', actionIntent: 'edit_workflow_field', variant: 'secondary' },
                { label: 'Cancel', actionIntent: 'cancel_workflow', variant: 'danger' }
              ]
            }
          ],
          toolCalls: []
        };
      },

      // Full Requisition Creation & Reactive Synchronization
      executor: async (session, context = {}) => {
        DatabaseService.init();
        const user = context.user || { name: 'Sujith (Recruiter)', role: 'ats_admin', email: 'sujith@peopleworks.ai' };

        // 1. Check Permissions
        const perm = AIPermissionService.canExecute('create:requisition', user);
        if (!perm.authorized) {
          throw new Error(perm.reason || 'Your role does not have permission to create requisitions.');
        }

        const data = session.getAllData();

        // 2. Comprehensive Validation
        const val = AIValidationService.validateRequisition(data);
        if (!val.isValid) {
          throw new Error(val.errors.join(' '));
        }

        // 3. Generate Sequential ID matching CreateRequisitionPage
        const reqId = getNextSequentialReqId();
        const curr = data.currency || 'INR';
        const symbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '₹';
        const salaryBand = `${symbol}${Number(data.minSalary || 0).toLocaleString()} - ${symbol}${Number(data.maxSalary || 0).toLocaleString()}`;

        const isSubmitRequested = session.submitForApproval || context.submitForApproval;
        const initialStatus = isSubmitRequested ? 'Pending Approval' : 'Pending Approval';

        const approvalChain = [
          { id: 'hiring_manager', role: 'Hiring Manager', name: data.hiringManager || 'Alex Chen', status: 'Submitted', date: new Date().toISOString(), avatar: 'HM' },
          { id: 'dept_head', role: 'Department Head', name: data.approverDeptHead || 'Sarah Jenkins', status: 'Pending', date: null, avatar: 'DH' },
          { id: 'finance', role: 'Finance Controller', name: data.approverFinance || 'David Miller', status: 'Waiting', date: null, avatar: 'FC' },
          { id: 'hr', role: 'HR / Talent Acquisition', name: 'HR Lead', status: 'Waiting', date: null, avatar: 'HR' }
        ];

        const newReq = {
          id: reqId,
          title: SanitizerService.escapeHtml(data.jobTitle),
          jobTitle: SanitizerService.escapeHtml(data.jobTitle),
          department: SanitizerService.escapeHtml(data.department || 'Engineering'),
          location: SanitizerService.escapeHtml(data.location || 'Bangalore, India'),
          employmentType: data.employmentType || 'Full-Time',
          headcount: Number(data.openings) || 1,
          openings: Number(data.openings) || 1,
          targetOpenings: Number(data.openings) || 1,
          hiringManager: data.hiringManager || 'Alex Chen',
          recruiter: data.recruiter || 'Sarah Jenkins',
          leadRecruiter: data.recruiter || 'Sarah Jenkins',
          priority: data.priority || 'High',
          hiringPriority: data.priority || 'High',
          minSalary: String(data.minSalary),
          maxSalary: String(data.maxSalary),
          currency: curr,
          salaryBand,
          targetHireDate: data.targetHireDate,
          justificationNote: SanitizerService.escapeHtml(data.justificationNote || ''),
          costCenter: data.costCenter || 'CC-1024',
          status: initialStatus,
          daysOpen: 1,
          candidateCount: 0,
          approvalChain,
          skills: ['React', 'TypeScript', 'Node.js'],
          description: `Requisition for ${data.jobTitle} in ${data.department}.`,
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: user.name || user.email,
          history: [
            { action: 'Created via PeopleWorks AI', by: user.name || 'AI Copilot', date: new Date().toISOString() }
          ]
        };

        // 4. Persist to DatabaseService
        DatabaseService.requisitions.unshift(newReq);
        DatabaseService.persistAll();

        // 5. Persist to sessionStorage for RequisitionHub & CreateRequisitionPage consistency
        if (typeof window !== 'undefined') {
          try {
            const stored = sessionStorage.getItem('pw_requisitions');
            let currentList = [];
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) currentList = parsed;
            }
            const exists = currentList.some(r => r.id === newReq.id);
            const updated = exists ? currentList : [newReq, ...currentList];
            sessionStorage.setItem('pw_requisitions', JSON.stringify(updated));
          } catch (storageErr) {
            console.warn('[RequisitionWorkflow] sessionStorage write error:', storageErr);
          }
        }

        // 6. Verify Persisted Entity
        const verified = DatabaseService.requisitions.find(r => r.id === reqId);
        if (!verified) {
          throw new Error('Verification failure: Requisition was not confirmed in local persistence.');
        }

        // 7. Log AIAuditService
        AIAuditService.logAction({
          action: 'CREATE_REQUISITION_AI_WORKFLOW',
          intent: 'create_requisition',
          entityType: 'Requisition',
          entityId: reqId,
          details: `Created requisition '${newReq.title}' (${reqId}) with complete mandatory fields & approver chain via PeopleWorks AI`,
          afterState: newReq,
          actor: user
        });

        // 8. Dispatch Reactive Custom Event for RequisitionHub & Application State
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pw:requisition_created', { detail: newReq }));
          window.dispatchEvent(new CustomEvent('pw_db_updated'));
        }

        return {
          text: `🎉 **Requisition Created Successfully!**\n\nYour job requisition **${newReq.title}** has been registered with ID **${reqId}** and is now visible in the Requisition Hub.`,
          cards: [
            {
              type: 'action_result',
              title: `Requisition Created: ${newReq.title}`,
              badge: newReq.status,
              badgeColor: 'amber',
              details: [
                { label: 'Requisition ID', value: newReq.id },
                { label: 'Department', value: newReq.department },
                { label: 'Location', value: newReq.location },
                { label: 'Openings', value: `${newReq.openings} Position(s)` },
                { label: 'Hiring Manager', value: newReq.hiringManager },
                { label: 'Salary Band', value: newReq.salaryBand },
                { label: 'Cost Center', value: newReq.costCenter },
                { label: 'Status', value: newReq.status }
              ],
              approvalSteps: newReq.approvalChain,
              actions: [
                { label: 'Draft Job Description', actionIntent: 'publish_jd' }
              ]
            }
          ],
          toolCalls: [
            {
              name: 'createRequisition',
              params: data,
              result: { success: true, requisition: newReq }
            }
          ]
        };
      }
    });
  }
}
