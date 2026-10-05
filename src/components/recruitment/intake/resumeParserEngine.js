/**
 * Client-Side Resume Text Extractor & Natural Language Section Parser Engine
 * PDF (pdfjs-dist + pako FlateDecode fallback) & DOCX (mammoth + XML fallback) text extraction.
 */

import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import mammoth from 'mammoth';
import { inflate } from 'pako';
import { calculateScreeningScore } from './resumeIntakeMockData.js';
import { SanitizerService } from '../../../services/security/SanitizerService';


// Configure pdfjs worker using standard Vite / ES module URL resolution
if (typeof window !== 'undefined' && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  } catch (e) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
    } catch {
      console.warn('pdfjs worker init fallback error');
    }
  }
}

const TECH_SKILLS_DICTIONARY = [
  'React', 'React.js', 'React Native', 'TypeScript', 'JavaScript', 'JS', 'Node.js', 'Express', 'Express.js',
  'Python', 'Java', 'C++', 'C#', 'Go', 'Golang', 'PHP', 'Ruby', 'Rust', 'Swift', 'Kotlin', 'Scala',
  'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'K8s', 'Terraform',
  'Figma', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'GraphQL', 'Redux', 'Redux Toolkit', 'Tailwind CSS',
  'CSS3', 'CSS', 'HTML5', 'HTML', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Agile', 'Scrum', 'Git', 'GitHub',
  'System Design', 'Microservices', 'REST API', 'RESTful API', 'Next.js', 'Vue.js', 'Angular',
  'Spring Boot', 'Spring', 'Kafka', 'Apache Kafka', 'Redis', 'Linux', 'Unix', 'Bash', 'Shell',
  'Prometheus', 'Grafana', 'Elasticsearch', 'Logstash', 'Kibana', 'ELK',
  'UI Design', 'UX Design', 'User Research', 'Design Systems', 'Prototyping',
  'Machine Learning', 'ML', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Pandas', 'NumPy',
  'QA Automation', 'Selenium', 'Cypress', 'Playwright', 'Jest', 'Mocha', 'Postman', 'Swagger',
  'Jira', 'Confluence', 'Bitbucket', 'Webpack', 'Vite', 'Babel', 'Vite.js', 'WebSockets', 'Socket.io'
];

const JOB_TITLE_KEYWORDS = [
  // Software Engineering
  'Senior Full Stack Engineer', 'Full Stack Engineer', 'Full Stack Developer',
  'Senior Software Engineer', 'Software Engineer', 'Software Developer', 'Software Development Engineer',
  'SDE-1', 'SDE-2', 'SDE-3', 'SDE',
  'Frontend Developer', 'Frontend Engineer', 'Senior Frontend Engineer',
  'Backend Developer', 'Backend Engineer', 'Senior Backend Engineer',
  'Lead Engineer', 'Tech Lead', 'Technical Lead', 'Lead Software Engineer',
  'Principal Engineer', 'Staff Engineer', 'Engineering Manager',
  // DevOps / Cloud
  'DevOps Engineer', 'Senior DevOps Engineer', 'Cloud Architect',
  'Solutions Architect', 'System Architect', 'Site Reliability Engineer',
  // QA / Testing
  'QA Engineer', 'QA Lead', 'QA Analyst', 'QA Tester', 'Test Engineer',
  'Manual Tester', 'Automation Tester', 'Automation Engineer', 'SDET',
  'Quality Assurance Engineer', 'Quality Analyst', 'Testing Engineer',
  'QA & Development Engineer', 'QA and Development Engineer',
  'QA Development Engineer', 'Development Engineer',
  // Data
  'Data Scientist', 'Senior Data Scientist', 'Data Analyst', 'Data Engineer',
  // Design / Product
  'Product Manager', 'Senior Product Manager', 'Product Designer',
  'UX/UI Designer', 'UI/UX Designer', 'Lead Designer', 'UX Designer', 'UI Designer',
  // Management / Consulting
  'System Administrator', 'Project Manager', 'Scrum Master',
  'Technical Consultant', 'Consultant',
  // Entry / Intern
  'Associate Engineer', 'Associate Developer', 'Associate QA Engineer',
  'Software Engineer Intern', 'Developer Intern', 'QA Intern', 'Intern',
  'Junior Developer', 'Junior Software Engineer', 'Junior QA Engineer',
  'Trainee', 'Fresher', 'Graduate Engineer Trainee', 'GET',
];

// Action verbs that appear at the start of resume bullet points — NOT job titles
const RESUME_ACTION_VERBS = /^(?:performed|developed|designed|implemented|built|created|managed|led|conducted|collaborated|executed|delivered|analyzed|tested|wrote|deployed|maintained|supported|automated|configured|resolved|optimized|reviewed|monitored|coordinated|participated|prepared|worked|assisted|handled|responsible|utilized|used|helped|contributed|ensured|improved|reduced|increased|achieved|gained|acquired|trained|mentored|documented|reported|communicated|defined|established|investigated|identified|fixed|upgraded|migrated|integrated|provided|facilitated|generated|processed|mapped|validated|verified|tracked|measured|planned|scheduled|assessed|evaluated|demonstrated|presented|operated|administered|installed|setup|set up)/i;

const DEGREE_KEYWORDS = [
  'Bachelor of Technology', 'B.Tech', 'B.E.', 'Bachelor of Engineering', 'Bachelor of Science', 'B.S.', 'BS',
  'Master of Technology', 'M.Tech', 'M.E.', 'Master of Science', 'M.S.', 'MS', 'MBA', 'Master of Business Administration',
  'Ph.D.', 'Doctor of Philosophy', 'BCA', 'MCA', 'Bachelor of Computer Applications', 'Master of Computer Applications',
  'Diploma in Computer Engineering', 'Diploma'
];

const LANGUAGE_KEYWORDS = [
  'English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi',
  'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Portuguese', 'Italian'
];

/**
 * Helper to check if text contains corrupted PDF binary stream noise
 */
function isBinaryPDFText(text) {
  if (!text) return true;
  if (/%PDF-|\/FlateDecode|\/Font|\/Catalog|\/Pages|\/Type\s*\/Page|\/Obj\b/i.test(text)) {
    return true;
  }
  return false;
}

const FORBIDDEN_NAME_WORDS = /resume|cv|curriculum|vitae|career|objective|summary|profile|about|experience|work|employment|skills|technical|education|academic|projects|certifications|languages|contact|personal|details|developer|engineer|manager|architect|lead|analyst|consultant|specialist|page|email|phone|mobile|github|linkedin|street|road|city|state|zip|india|usa|bangalore|bengaluru|hyderabad|mumbai|delhi/i;

/**
 * 1. REAL FILE TEXT EXTRACTION FOR PDF, DOCX, DOC, TXT
 */
export const extractTextFromFile = async (file) => {
  if (!file) return '';
  if (typeof file.textContent === 'string' && file.textContent.trim().length > 0) {
    return file.textContent.trim();
  }
  const fileName = (file.name || '').toLowerCase();

  try {
    let arrayBuffer;
    if (typeof file.arrayBuffer === 'function') {
      arrayBuffer = await file.arrayBuffer();
    } else if (file.buffer instanceof ArrayBuffer) {
      arrayBuffer = file.buffer;
    } else if (typeof file.text === 'function') {
      const text = await file.text();
      return text.trim();
    } else {
      const encoder = new TextEncoder();
      arrayBuffer = encoder.encode(typeof file === 'string' ? file : JSON.stringify(file)).buffer;
    }

    // A. PDF Files
    if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
      let extractedPdfText = '';

      // 1st Attempt: PDF.js engine
      try {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false });
        const pdf = await loadingTask.promise;
        let fullPdfText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          let lastY = null;
          let pageText = '';

          for (const item of textContent.items) {
            if (!item.str) continue;
            const y = item.transform ? item.transform[5] : null;
            if (lastY !== null && y !== null && Math.abs(lastY - y) > 5) {
              pageText += '\n';
            } else if (pageText && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
              pageText += ' ';
            }
            pageText += item.str;
            if (y !== null) lastY = y;
          }
          fullPdfText += pageText + '\n\n';
        }

        if (fullPdfText && fullPdfText.trim().length > 5) {
          extractedPdfText = fullPdfText.trim();
        }
      } catch (pdfErr) {
        console.warn('PDFJS extraction failed, attempting pako FlateDecode fallback:', pdfErr);
      }

      // 2nd Attempt: pako FlateDecode stream decompressor
      if (!extractedPdfText) {
        const flateText = extractPDFFlateStreams(arrayBuffer);
        if (flateText && flateText.trim().length > 5) {
          extractedPdfText = flateText.trim();
        }
      }

      return extractedPdfText;
    }

    // B. DOCX / DOC Files
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc') || file.type.includes('wordprocessing')) {
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result && result.value && result.value.trim().length > 15) {
          return result.value.trim();
        }
      } catch (docxErr) {
        console.warn('Mammoth extraction failed, attempting fallback:', docxErr);
      }
      return extractDOCXTextFallback(arrayBuffer);
    }

    // C. TXT / Plain Text Files
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const textStr = textDecoder.decode(arrayBuffer);
    return textStr.trim();

  } catch (err) {
    console.error('File text extraction exception:', err);
    return '';
  }
};

/**
 * Pure JS FlateDecode stream decompressor using pako
 */
function extractPDFFlateStreams(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const textPieces = [];

  let i = 0;
  while (i < bytes.length - 10) {
    // Look for "stream"
    if (
      bytes[i] === 115 &&
      bytes[i + 1] === 116 &&
      bytes[i + 2] === 114 &&
      bytes[i + 3] === 101 &&
      bytes[i + 4] === 97 &&
      bytes[i + 5] === 109
    ) {
      let start = i + 6;
      if (bytes[start] === 13) start++; // \r
      if (bytes[start] === 10) start++; // \n

      // Look for "endstream"
      let end = start;
      while (end < bytes.length - 9) {
        if (
          bytes[end] === 101 &&
          bytes[end + 1] === 110 &&
          bytes[end + 2] === 100 &&
          bytes[end + 3] === 115 &&
          bytes[end + 4] === 116 &&
          bytes[end + 5] === 114 &&
          bytes[end + 6] === 101 &&
          bytes[end + 7] === 97 &&
          bytes[end + 8] === 109
        ) {
          break;
        }
        end++;
      }

      if (end > start) {
        const streamData = bytes.subarray(start, end);
        try {
          const decompressed = inflate(streamData);
          const decompressedStr = new TextDecoder('utf-8', { fatal: false }).decode(decompressed);

          const tjMatches = decompressedStr.match(/\(([^()]+)\)\s*Tj/g);
          if (tjMatches) {
            tjMatches.forEach(m => {
              const match = m.match(/\(([^()]+)\)/);
              if (match && match[1]) textPieces.push(match[1]);
            });
          }

          const arrayTjMatches = decompressedStr.match(/\[((?:\([^()]+\)\s*)+)\]\s*TJ/g);
          if (arrayTjMatches) {
            arrayTjMatches.forEach(m => {
              const innerMatches = m.match(/\(([^()]+)\)/g);
              if (innerMatches) {
                textPieces.push(innerMatches.map(s => s.replace(/[()]/g, '')).join(' '));
              }
            });
          }
        } catch (e) {
          // Stream was uncompressed or failed inflate
        }
      }
      i = end + 9;
    } else {
      i++;
    }
  }

  return textPieces.join('\n').trim();
}

// Fallback DOCX String Extractor
function extractDOCXTextFallback(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  
  const wtMatches = str.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  if (wtMatches && wtMatches.length > 0) {
    return wtMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
  }

  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\x20-\x7E\x0A\x0D]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 2. SECTION-AWARE NATURAL LANGUAGE RESUME PARSER
 */
export const parseResumeText = (rawText = '', fileName = '', fileSize = '1.8 MB') => {
  const text = (rawText || '').trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // --- A. SECTION SEGMENTATION ---
  const sections = {
    header: [],
    summary: [],
    experience: [],
    skills: [],
    education: [],
    certifications: [],
    languages: [],
    internships: [],
    projects: []
  };

  let currentSection = 'header';

  lines.forEach(line => {
    const upper = line.toUpperCase();
    if (/^(SUMMARY|PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY|CAREER OBJECTIVE|OBJECTIVE|PROFILE|ABOUT ME)\b/.test(upper)) {
      currentSection = 'summary';
    } else if (/^(WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT|PROFESSIONAL EXPERIENCE|WORK HISTORY|CAREER HISTORY)\b/.test(upper)) {
      currentSection = 'experience';
    } else if (/^(TECHNICAL SKILLS|SKILLS|CORE COMPETENCIES|SKILLS & TOOLS|TECHNOLOGIES|AREAS OF EXPERTISE)\b/.test(upper)) {
      currentSection = 'skills';
    } else if (/^(EDUCATION|ACADEMIC PROFILE|ACADEMIC BACKGROUND|ACADEMIC QUALIFICATIONS|ACADEMICS)\b/.test(upper)) {
      currentSection = 'education';
    } else if (/^(CERTIFICATIONS|CERTIFICATES|LICENSES|COURSES)\b/.test(upper)) {
      currentSection = 'certifications';
    } else if (/^(LANGUAGES|LANGUAGES KNOWN)\b/.test(upper)) {
      currentSection = 'languages';
    } else if (/^(INTERNSHIP EXPERIENCE|INTERNSHIPS|INTERNSHIP|TRAINING & INTERNSHIPS|TRAINING AND INTERNSHIPS)\b/.test(upper)) {
      currentSection = 'internships';
    } else if (/^(ACADEMIC PROJECTS?|PROJECTS?|ACADEMIC PROJECT)\b/.test(upper)) {
      currentSection = 'projects';
    } else {
      sections[currentSection].push(line);
    }
  });

  const fullText = text;

  // --- B. NAME EXTRACTION ---
  let candidateName = '';
  
  // 1. Scan header section top lines
  for (let i = 0; i < Math.min(sections.header.length, 10); i++) {
    const line = sections.header[i].trim();
    if (!line || line.includes('@') || /\d/.test(line)) continue;
    if (FORBIDDEN_NAME_WORDS.test(line)) continue;

    // Matches Title Case, ALL CAPS, or Initials (e.g., M REDDY VARUN, Varun M Reddy, M. Reddy Varun)
    const isCleanName = /^[A-Za-z][A-Za-z.'-\s]*[A-Za-z.]$/i.test(line) && line.includes(' ');
    if (isCleanName && line.length >= 3 && line.length <= 40) {
      candidateName = line
        .split(' ')
        .map(w => w.length === 1 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      break;
    }
  }

  // 2. Fallback to top 15 lines of raw text
  if (!candidateName) {
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i].trim();
      if (!line || line.includes('@') || /\d/.test(line)) continue;
      if (FORBIDDEN_NAME_WORDS.test(line)) continue;

      const isCleanName = /^[A-Za-z][A-Za-z.'-\s]*[A-Za-z.]$/i.test(line) && line.includes(' ');
      if (isCleanName && line.length >= 3 && line.length <= 40) {
        candidateName = line
          .split(' ')
          .map(w => w.length === 1 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        break;
      }
    }
  }

  // 3. Fallback to clean filename
  if (!candidateName && fileName) {
    const cleanFileName = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/\(\d+\)/g, '')
      .replace(/\b\d+\b/g, '')
      .replace(/resume|cv|curriculum|vitae|file|document|profile|latest|final|draft|copy|updated|v\d+/gi, '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanFileName && cleanFileName.length > 2 && !FORBIDDEN_NAME_WORDS.test(cleanFileName)) {
      candidateName = cleanFileName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  if (!candidateName) candidateName = 'N/A';

  // --- INLINE HEADER PARSING (Tier 1 & Tier 2) ---
  let headerPhone = null;
  let headerEmail = null;
  let headerLocation = null;

  const extractCleanPhone = (text) => {
    let match = text.match(/(?:phone|mobile|tel|contact|ph|cell)[:\s-]*(\+?\d[\d\s.-]{8,20})/i);
    let extractedStr = match ? match[1] : text;
    let cleanPhone = extractedStr.replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (cleanPhone.length >= 10 && cleanPhone.length <= 15 && !/^20\d{6,}/.test(cleanPhone)) {
      let formattedPhone = cleanPhone;
      if (formattedPhone.length === 10 && /^[6-9]/.test(formattedPhone)) {
        formattedPhone = `+91${formattedPhone}`;
      } else {
        formattedPhone = formattedPhone.startsWith('+') ? formattedPhone : `+${formattedPhone}`;
      }
      return formattedPhone;
    }
    return null;
  };

  for (let i = 0; i < Math.min(sections.header.length, 10); i++) {
    const line = sections.header[i].trim();
    if (!line) continue;
    
    // Split by pipe, bullet, semicolon, or multiple spaces
    const segments = line.split(/\s*[|•;]\s*|\s{3,}/);
    for (const segment of segments) {
      if (!segment) continue;
      
      // Email
      if (!headerEmail && /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(segment)) {
        const eMatch = segment.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i);
        if (eMatch && !/info@|support@|careers@|sales@|hr@/i.test(eMatch[0])) {
          headerEmail = eMatch[0].toLowerCase();
        }
      }
      
      // Phone
      if (!headerPhone && !/linkedin\.com/i.test(segment) && !/github\.com/i.test(segment) && !/@/.test(segment)) {
        const potentialPhone = extractCleanPhone(segment);
        if (potentialPhone) {
          headerPhone = potentialPhone;
        }
      }
      
      // Location
      if (!headerLocation) {
        const locMatch = segment.match(/\b(Bangalore|Bengaluru|Hyderabad|Chennai|Mumbai|Pune|Delhi|Noida|Gurgaon|Kolkata|Ahmedabad|Kochi|Coimbatore|San Francisco|New York|Austin|Seattle|Chicago|London|Toronto|Vancouver|Singapore|Dubai|Telangana|Karnataka|Tamil Nadu|Maharashtra|California|Texas)\b/i);
        if (locMatch) {
          headerLocation = locMatch[1];
          if (/India/i.test(segment) && !headerLocation.includes('India')) {
            headerLocation += ', India';
          }
        }
      }
    }
  }

  // --- C. EMAIL EXTRACTION ---
  let email = headerEmail || 'N/A';
  if (email === 'N/A') {
    const emailMatches = fullText.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi);
    if (emailMatches && emailMatches.length > 0) {
      const validEmails = emailMatches.filter(e => !/info@|support@|careers@|sales@|hr@/i.test(e));
      email = (validEmails[0] || emailMatches[0]).toLowerCase();
    }
  }

  // --- D. PHONE EXTRACTION ---
  let phone = headerPhone || 'N/A';
  let countryCode = 'IN';

  if (phone === 'N/A') {
    const phonePatterns = [
      /(?:phone|mobile|tel|contact|ph|cell)?[:\s-]*(\+?91[\s.-]?[6-9]\d{4}[\s.-]?\d{5})/i,
      /(?:phone|mobile|tel|contact|ph|cell)?[:\s-]*(\+?91[\s.-]?[6-9]\d{9})/i,
      /(?:phone|mobile|tel|contact|ph|cell)?[:\s-]*(\+?1[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/i,
      /(?:phone|mobile|tel|contact|ph|cell)?[:\s-]*([6-9]\d{4}[\s.-]?\d{5})/i,
      /(?:phone|mobile|tel|contact|ph|cell)?[:\s-]*([6-9]\d{9})/i,
      /(?:^|\s)(\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4})\b/,
      /\b([6-9]\d{9})\b/,
      /\b([6-9]\d{4}[\s.-]?\d{5})\b/
    ];

    for (const pattern of phonePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const extractedStr = match[1] || match[0];
        let cleanPhone = extractedStr.replace(/[^\d+]/g, '');
        
        if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
          cleanPhone = cleanPhone.substring(1);
        }
        if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
          if (!/^20\d{6,}/.test(cleanPhone)) {
            let formattedPhone = cleanPhone;
            if (formattedPhone.length === 10 && (formattedPhone.startsWith('9') || formattedPhone.startsWith('8') || formattedPhone.startsWith('7') || formattedPhone.startsWith('6'))) {
              formattedPhone = `+91${formattedPhone}`;
            } else {
              formattedPhone = formattedPhone.startsWith('+') ? formattedPhone : `+${formattedPhone}`;
            }
            phone = formattedPhone;
            break;
          }
        }
      }
    }
  }

  // --- E. LOCATION EXTRACTION ---
  let location = headerLocation || 'N/A';
  if (location === 'N/A') {
    const locRegex = /\b(Bangalore|Bengaluru|Hyderabad|Chennai|Mumbai|Pune|Delhi|Noida|Gurgaon|Kolkata|Ahmedabad|Kochi|Coimbatore|San Francisco|New York|Austin|Seattle|Chicago|London|Toronto|Vancouver|Singapore|Dubai|Telangana|Karnataka|Tamil Nadu|Maharashtra|California|Texas)\b/i;
    const locMatch = fullText.match(locRegex);
    if (locMatch) {
      location = locMatch[1];
      if (/India/i.test(fullText) && !location.includes('India')) {
        location += ', India';
      }
    }
  }

  // --- F. SKILLS EXTRACTION ---
  const extractedSkillsSet = new Set();

  TECH_SKILLS_DICTIONARY.forEach(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(fullText)) {
      extractedSkillsSet.add(skill);
    }
  });

  // Extract explicit category items from SKILLS section
  sections.skills.forEach(line => {
    const cleanLine = line.replace(/^[•*\-\d.]+\s*/, '').replace(/^[A-Za-z0-9\s/&\\-]+:\s*/, '');
    const items = cleanLine.split(/[,;|•\n]/).map(s => s.replace(/\([^)]*\)/g, '').trim()).filter(Boolean);
    items.forEach(item => {
      if (item.length >= 2 && item.length <= 35 && !/technical|skills|tools|technologies|programming|front-end|web/i.test(item)) {
        const formatted = item.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          extractedSkillsSet.add(formatted);
      }
    });
  });

  const extractedSkills = Array.from(extractedSkillsSet);

  // ─────────────────────────────────────────────────────────────────────────
  // --- G. CURRENT JOB TITLE & ORGANIZATION ---
  //
  // Strategy: parse the experience section into job blocks anchored on date
  // lines (e.g. "Jan 2024 – Present", "2022 – 2023"). Within each block,
  // identify title (must contain a role keyword) and company (must NOT be a
  // title keyword, location, date, or action verb). Pick the block that
  // contains "Present/Current" as the current role. Fall back to the most
  // recent block if no "Present" entry exists.
  // ─────────────────────────────────────────────────────────────────────────

  let currentTitle = 'N/A';
  let currentCompany = 'N/A';

  // Strict title guard: must contain at least one known role keyword
  const TITLE_ROLE_WORDS = /engineer|developer|designer|manager|analyst|architect|lead|intern|consultant|scientist|administrator|tester|trainer|trainee|fresher|officer|specialist|coordinator|executive|director|associate|sdet|qa\b/i;

  // Date-range line detector
  const DATE_LINE_RE = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[a-z]*[\s./,\-–—]+)?(?:19|20)\d{2}\s*(?:[\-–—]|to)\s*(?:Present|Current|Till(?: Date| Now)?|Ongoing|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[a-z]*[\s./,\-–—]+)?(?:19|20)\d{2})/i;
  const DATE_PORTION_RE = /(?:[\s|]*)(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[a-z]*[\s./,\-–—]+)?(?:19|20)\d{2}\s*(?:[\-–—]|to)\s*(?:Present|Current|Till(?: Date| Now)?|Ongoing|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[a-z]*[\s./,\-–—]+)?(?:19|20)\d{2}).*$/i;
  const PRESENT_RE = /\b(?:Present|Current|Till\s*(?:Date|Now)|Ongoing)\b/i;

  // Values that are never a company name
  const COMPANY_NOISE = /^(?:present|current|till|today|ongoing|full[- ]time|part[- ]time|contract|freelance|remote|hybrid|onsite|bangalore|bengaluru|hyderabad|mumbai|delhi|chennai|pune|noida|gurgaon|kolkata|ahmedabad|india|usa|uk|n\/a|na|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d+)$/i;

  const isPlausibleCompany = (s) => {
    const t = (s || '').trim();
    if (!t || t.length < 2 || t.length > 80) return false;
    if (COMPANY_NOISE.test(t)) return false;
    if (RESUME_ACTION_VERBS.test(t)) return false;
    if (/^\d+$/.test(t)) return false;
    if (!/[a-zA-Z]/.test(t)) return false;
    if (/^(?:the|and|or|in|at|for|of|to|a|an)$/i.test(t)) return false;
    // Reject social profiles, URLs, emails, contact info
    if (/(?:linkedin|github|portfolio|twitter|website|gmail|yahoo)\b/i.test(t)) return false;
    if (/(?:linkedin\.com|github\.com|\.com|\.in|\.org|\.net)/i.test(t)) return false;
    if (/@/.test(t)) return false;
    // Reject "City, Country" or "City, State" patterns — these are locations
    if (/^[A-Z][a-zA-Z\s]+,\s*(?:India|USA|UK|Karnataka|Maharashtra|Telangana|Tamil Nadu|California|Texas|[A-Z][a-z]+)$/i.test(t)) return false;
    // Reject known location-only strings
    if (/^(?:Bengaluru|Bangalore|Hyderabad|Chennai|Mumbai|Pune|Delhi|Noida|Gurgaon|Kolkata|Ahmedabad|Kochi|Coimbatore),?\s*(?:India|Karnataka|Maharashtra|Telangana|Tamil Nadu)?$/i.test(t)) return false;
    return true;
  };

  // Extract title+company from a list of lines from one job block
  // Handles: "Title — Company | Location", "Company — Title", "Title | Company", "Title at Company"
  const extractTitleCompanyFromBlock = (blockLines) => {
    let bTitle = '';
    let bCompany = '';
    for (const raw of blockLines) {
      const line = raw.trim();
      if (!line || RESUME_ACTION_VERBS.test(line) || DATE_LINE_RE.test(line) || line.length > 150) continue;

      // Multi-segment em-dash split: handles these formats:
      //   "Title — Company | Location"            (simple)
      //   "Title | Company — Location | Date"     (compound: left has pipe)
      //   "Company — Title | Location"            (reversed)
      const emDashMatch = line.match(/^(.+?)\s*[—–]\s*(.+)$/);
      if (emDashMatch) {
        const leftFull = emDashMatch[1].trim();
        const rightFull = emDashMatch[2].trim();

        // LEFT side may itself be "Title | Company" — split by pipe
        const leftParts = leftFull.split(/\s*\|\s*/).map(p => p.trim()).filter(Boolean);
        // RIGHT side may be "Location | Date" or just "Company" — take first segment only
        const rightParts = rightFull.split(/\s*\|\s*/).map(p => p.trim()).filter(Boolean);
        const rightFirst = rightParts[0] || '';

        if (leftParts.length >= 2) {
          // Format: "Title | Company — Location"
          // Find which left part is the title and which is the company
          let lTitle = '';
          let lCompany = '';
          for (const part of leftParts) {
            if (!lTitle && TITLE_ROLE_WORDS.test(part) && part.length <= 70) lTitle = part;
            else if (!lCompany && !TITLE_ROLE_WORDS.test(part) && isPlausibleCompany(part)) lCompany = part;
          }
          if (lTitle && !bTitle) bTitle = lTitle;
          if (lCompany && !bCompany) bCompany = lCompany;
          // right side (location) is not the company in this format
        } else {
          // Format: "Title — Company | Location" or "Company — Title"
          const left = leftFull;
          const right = rightFirst;

          if (TITLE_ROLE_WORDS.test(left) && !bTitle) bTitle = left;
          else if (TITLE_ROLE_WORDS.test(right) && !bTitle) bTitle = right;

          if (!bCompany) {
            // Title on left → company is right (first pipe segment)
            if (TITLE_ROLE_WORDS.test(left) && isPlausibleCompany(right) && !TITLE_ROLE_WORDS.test(right)) {
              bCompany = right;
            }
            // Company on left → title is right
            else if (TITLE_ROLE_WORDS.test(right) && isPlausibleCompany(left) && !TITLE_ROLE_WORDS.test(left)) {
              bCompany = left;
            }
          }
        }
        continue;
      }

      // Pipe-only separator: "Title | Company | Location" or "Company | Title | Location"
      if (line.includes('|')) {
        const pipeParts = line.split(/\s*\|\s*/).map(p => p.trim()).filter(Boolean);
        let foundTitle = '';
        let foundCompany = '';
        for (const part of pipeParts) {
          if (!foundTitle && TITLE_ROLE_WORDS.test(part) && part.length <= 70) {
            foundTitle = part;
          } else if (!foundCompany && !TITLE_ROLE_WORDS.test(part) && isPlausibleCompany(part)) {
            foundCompany = part;
          }
        }
        if (foundTitle && !bTitle) bTitle = foundTitle;
        if (foundCompany && !bCompany) bCompany = foundCompany;
        continue;
      }

      // "Title at Company"
      const atMatch = line.match(/^(.+?)\s+at\s+(.+)$/i);
      if (atMatch) {
        const left = atMatch[1].trim();
        const right = atMatch[2].trim().split(/[,|(]/)[0].trim();
        if (TITLE_ROLE_WORDS.test(left) && !bTitle) bTitle = left;
        if (isPlausibleCompany(right) && !TITLE_ROLE_WORDS.test(right) && !bCompany) bCompany = right;
        continue;
      }

      // Single line: classify as title or company
      if (TITLE_ROLE_WORDS.test(line) && line.length <= 60 && line.split(/\s+/).length <= 8 && !bTitle) {
        bTitle = line;
      } else if (!TITLE_ROLE_WORDS.test(line) && isPlausibleCompany(line) && line.length <= 80 && !bCompany) {
        bCompany = line.split(/[,|(]/)[0].trim();
      }
    }
    return { bTitle, bCompany };
  };

  // Generalized block extraction for experience and internships
  const extractHistoryBlocks = (sectionLines, blockType) => {
    const blocks = [];
    let currentBlock = { lines: [], hasPresent: false, rawDate: '' };
    
    for (const line of sectionLines) {
      const trimmed = line.trim();
      const dateMatch = trimmed.match(DATE_LINE_RE);
      if (dateMatch) {
        if (PRESENT_RE.test(trimmed)) currentBlock.hasPresent = true;
        currentBlock.rawDate = dateMatch[0].trim();
        
        const textBeforeDate = trimmed.replace(DATE_PORTION_RE, '').trim();
        if (textBeforeDate && textBeforeDate !== trimmed) {
          currentBlock.lines.push(textBeforeDate);
        }
        
        blocks.push({ ...currentBlock });
        currentBlock = { lines: [], hasPresent: false, rawDate: '' };
      } else {
        currentBlock.lines.push(trimmed);
      }
    }
    if (currentBlock.lines.length > 0) blocks.push(currentBlock);
    
    return blocks.map((b, idx) => {
      const { bTitle, bCompany } = extractTitleCompanyFromBlock(b.lines);
      if (!bTitle && !bCompany && !b.rawDate) return null;

      // Basic location extraction from company pipe parts
      let loc = 'N/A';
      for (const line of b.lines) {
        if (line.includes('|') || line.includes('—') || line.includes('-')) {
          const parts = line.split(/[|—\-]/).map(p => p.trim());
          for (const p of parts) {
            if (/^(?:Bengaluru|Bangalore|Hyderabad|Chennai|Mumbai|Pune|Delhi|Noida|Gurgaon|Kolkata|Ahmedabad|Remote|Onsite|Hybrid)/i.test(p)) {
              loc = p;
              break;
            }
          }
        }
        if (loc !== 'N/A') break;
      }

      return {
        id: `${blockType}-${idx + 1}`,
        type: blockType,
        title: bTitle || 'Not Found / Needs Review',
        company: bCompany || 'Not Found / Needs Review',
        startDate: b.rawDate ? b.rawDate.split(/(?:[\-–—]|to)/i)[0].trim() : 'N/A',
        endDate: b.rawDate ? (b.rawDate.split(/(?:[\-–—]|to)/i)[1]?.trim() || 'N/A') : 'N/A',
        duration: b.rawDate || 'N/A',
        isCurrent: b.hasPresent,
        location: loc,
        description: b.lines.filter(l => l.length > 30).slice(0, 2).join(' '),
        technologies: []
      };
    }).filter(Boolean);
  };

  let experienceHistory = extractHistoryBlocks(sections.experience, 'employment');
  let internshipExperience = extractHistoryBlocks(sections.internships, 'internship');

  // Filter out internships masquerading as experience
  const realExperience = [];
  experienceHistory.forEach(job => {
    if (/intern/i.test(job.title) || /intern/i.test(job.company)) {
      job.type = 'internship';
      internshipExperience.push(job);
    } else {
      realExperience.push(job);
    }
  });
  experienceHistory = realExperience;

  // Identify current job from professional experience OR internships
  let currentJob = experienceHistory.find(j => j.isCurrent);
  if (!currentJob) {
    currentJob = internshipExperience.find(j => j.isCurrent);
  }
  if (!currentJob) {
    currentJob = experienceHistory[0] || internshipExperience[0];
  }

  if (currentJob) {
    if (currentJob.title !== 'Not Found / Needs Review') currentTitle = currentJob.title;
    if (currentJob.company !== 'Not Found / Needs Review') currentCompany = currentJob.company;
    if (currentJob.location !== 'N/A' && location === 'N/A') location = currentJob.location;
  }

  // ── CANDIDATE NAME SAFETY GUARD ──────────────────────────────────────────
  // If the extracted company matches the candidate name (case-insensitive),
  // it is wrong — clear it so the fallback passes can try again.
  const normaliseForCompare = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const isSameAsName = (company) => {
    const nc = normaliseForCompare(company);
    const nn = normaliseForCompare(candidateName);
    if (!nc || nc === 'n/a' || !nn || nn === 'n/a') return false;
    // Exact match or one contains the other fully
    return nc === nn || nn.includes(nc) || nc.includes(nn);
  };
  if (isSameAsName(currentCompany)) {
    currentCompany = 'N/A'; // reset so fallback passes can find the real company
  }

  // --- Company fallback passes (ONLY WITHIN EXPERIENCE) ---

  // C2: "at CompanyName" anywhere in experience text
  if (currentCompany === 'N/A') {
    const expText = sections.experience.join('\n');
    const atMatch = expText.match(/\bat\s+([A-Z][A-Za-z0-9 &.,'\-]{1,60})/);
    if (atMatch) {
      const cand = atMatch[1].trim().split(/[,(]/)[0].trim();
      if (isPlausibleCompany(cand) && !TITLE_ROLE_WORDS.test(cand)) currentCompany = cand;
    }
  }

  // C3: First capital-starting short line in experience that isn't a title/action/date
  if (currentCompany === 'N/A') {
    for (const line of sections.experience) {
      const t = line.trim();
      if (!t || t.length > 70 || t.length < 2) continue;
      if (DATE_LINE_RE.test(t) || RESUME_ACTION_VERBS.test(t) || TITLE_ROLE_WORDS.test(t)) continue;
      if (/^\d/.test(t)) continue;
      if (/^[A-Z]/.test(t) && isPlausibleCompany(t)) {
        currentCompany = t.split(/[,(]/)[0].trim();
        break;
      }
    }
  }

  // Final check: Convert 'N/A' to 'Not Found / Needs Review' as per rules
  if (currentTitle === 'N/A') currentTitle = 'Not Found / Needs Review';
  if (currentCompany === 'N/A') currentCompany = 'Not Found / Needs Review';

  // --- H. TOTAL EXPERIENCE EXTRACTION & DATE RANGES ---
  let totalExperience = 'N/A';
  let primaryStartDate = 'N/A';
  let primaryEndDate = 'Present';
  let internshipExperienceMonths = 0;

  // 1. Scan for explicit statements (e.g. "3.5 years", "2+ yrs", "5 years of experience")
  const explicitExpMatch = fullText.match(/(?:total\s+experience|experience)\s*:\s*(\d+(?:\.\d+)?)\s*(?:\+?\s*(?:years|yrs|months|mos))/i) ||
                           fullText.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs)\s*(?:of\s*)?(?:experience|exp)/i) ||
                           fullText.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs)\b/i);

  if (explicitExpMatch) {
    totalExperience = `${explicitExpMatch[1]} yrs`;
  }

  // 2. Scan for date ranges like "Jul 2026 – Present", "Jul 2024 - Dec 2025", "2022 - 2026", "07/2022 - Present"
  const MONTH_MAP = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
  };

  const currentYear = new Date().getFullYear(); // e.g. 2026
  const currentMonth = new Date().getMonth(); // e.g. 8 (Sept)

  const dateRangeRegex = /(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2})[\s\/-]+)?((?:19|20)\d{2})\s*(?:[–—\-\s]|to)+\s*(Present|Current|Till Date|Till Now|Ongoing|(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2})[\s\/-]+)?((?:19|20)\d{2}))/gi;

  let match;
  let totalMonthsAccumulated = 0;
  const parsedDateRanges = [];
  
  // Calculate months dynamically from filtered experience blocks instead of raw text
  experienceHistory.forEach(job => {
    if (job.duration && job.duration !== 'N/A') {
      const execMatch = [...job.duration.matchAll(dateRangeRegex)][0];
      if (execMatch) {
        const rawStartMonth = (execMatch[1] || '').toLowerCase().trim();
        const startYear = parseInt(execMatch[2], 10);
        const endPresentStr = (execMatch[3] || '').trim();
        const rawEndMonth = (execMatch[4] || '').toLowerCase().trim();
        const endYearStr = execMatch[5];

        let startMonth = 0;
        if (rawStartMonth) {
          if (/^\d+$/.test(rawStartMonth)) {
            startMonth = Math.max(0, Math.min(11, parseInt(rawStartMonth, 10) - 1));
          } else if (MONTH_MAP[rawStartMonth] !== undefined) {
            startMonth = MONTH_MAP[rawStartMonth];
          }
        }

        let endYear = currentYear;
        let endMonth = currentMonth;
        let isPresent = true;

        if (!/present|current|till|ongoing/i.test(endPresentStr)) {
          isPresent = false;
          if (endYearStr) endYear = parseInt(endYearStr, 10);
          if (rawEndMonth) {
            if (/^\d+$/.test(rawEndMonth)) endMonth = Math.max(0, Math.min(11, parseInt(rawEndMonth, 10) - 1));
            else if (MONTH_MAP[rawEndMonth] !== undefined) endMonth = MONTH_MAP[rawEndMonth];
          }
        }

        if (startYear >= 1990 && startYear <= currentYear + 1 && endYear >= startYear) {
          const months = (endYear - startYear) * 12 + (endMonth - startMonth);
          if (months >= 0 && months < 600) {
            totalMonthsAccumulated += months;
            
            const startMonthName = execMatch[1] ? execMatch[1].charAt(0).toUpperCase() + execMatch[1].slice(1).toLowerCase() : '';
            const endMonthName = execMatch[4] ? execMatch[4].charAt(0).toUpperCase() + execMatch[4].slice(1).toLowerCase() : '';

            const startLabel = startMonthName ? `${startMonthName} ${startYear}` : `${startYear}`;
            const endLabel = isPresent ? 'Present' : (endMonthName ? `${endMonthName} ${endYear}` : `${endYear}`);

            parsedDateRanges.push({
              startLabel,
              endLabel,
              months,
              isPresent
            });
          }
        }
      }
    }
  });

  // Handle explicit Fresher detection
  const isFresher = /\\b(fresher|fresh graduate|recent graduate|entry level|seeking first opportunity|no professional experience)\\b/i.test(fullText);

  if (parsedDateRanges.length > 0) {
    primaryStartDate = parsedDateRanges[0].startLabel;
    primaryEndDate = parsedDateRanges[0].endLabel;

    if (totalExperience === 'N/A' && totalMonthsAccumulated > 0) {
      const yrs = totalMonthsAccumulated / 12;
      if (totalMonthsAccumulated < 12) {
        totalExperience = `${totalMonthsAccumulated} mos`;
      } else if (totalMonthsAccumulated % 12 === 0) {
        totalExperience = `${Math.floor(yrs)} yrs`;
      } else {
        totalExperience = `${yrs.toFixed(1)} yrs`;
      }
    }
  } else if (isFresher || sections.experience.length === 0) {
    totalExperience = '0 yrs / Fresher';
  }

  // Calculate internship separate
  const internshipText = sections.internships.join('\\n');
  while ((match = dateRangeRegex.exec(internshipText)) !== null) {
    const rawStartMonth = (match[1] || '').toLowerCase().trim();
    const startYear = parseInt(match[2], 10);
    const endPresentStr = (match[3] || '').trim();
    const rawEndMonth = (match[4] || '').toLowerCase().trim();
    const endYearStr = match[5];

    let startMonth = 0;
    if (rawStartMonth) {
      if (/^\\d+$/.test(rawStartMonth)) {
        startMonth = Math.max(0, Math.min(11, parseInt(rawStartMonth, 10) - 1));
      } else if (MONTH_MAP[rawStartMonth] !== undefined) {
        startMonth = MONTH_MAP[rawStartMonth];
      }
    }

    let endYear = currentYear;
    let endMonth = currentMonth;
    if (!/present|current|till|ongoing/i.test(endPresentStr)) {
      if (endYearStr) endYear = parseInt(endYearStr, 10);
      if (rawEndMonth) {
        if (/^\\d+$/.test(rawEndMonth)) endMonth = Math.max(0, Math.min(11, parseInt(rawEndMonth, 10) - 1));
        else if (MONTH_MAP[rawEndMonth] !== undefined) endMonth = MONTH_MAP[rawEndMonth];
      }
    }

    if (startYear >= 1990 && startYear <= currentYear + 1 && endYear >= startYear) {
      const months = (endYear - startYear) * 12 + (endMonth - startMonth);
      if (months > 0) internshipExperienceMonths += months;
    }
  }

  // --- I. WORK EXPERIENCE HISTORY ---
  // experienceHistory is already built via extractHistoryBlocks.
  // Add technologies from skills if this is the only job.
  if (experienceHistory.length === 1 && extractedSkills.length > 0) {
    experienceHistory[0].technologies = extractedSkills.slice(0, 6);
  }

  // --- J. EDUCATION EXTRACTION ---
  const educationHistory = [];
  const eduText = sections.education.join('\n') || fullText;
  DEGREE_KEYWORDS.forEach(deg => {
    if (new RegExp(`\\b${deg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(eduText)) {
      educationHistory.push({
        id: `edu-${educationHistory.length + 1}`,
        degree: deg,
        institution: eduText.includes('University') ? 'University' : 'Educational Institution',
        startYear: 'N/A',
        endYear: 'N/A',
        grade: 'N/A'
      });
    }
  });

  // --- K. CERTIFICATIONS & LANGUAGES ---
  const certifications = [];
  const certText = sections.certifications.join('\n') || fullText;
  if (/AWS/i.test(certText)) certifications.push('AWS Certified');
  if (/Kubernetes|CKA/i.test(certText)) certifications.push('Certified Kubernetes Administrator (CKA)');
  if (/Java|Oracle/i.test(certText)) certifications.push('Oracle Certified Java Programmer');

  const languages = [];
  const langText = sections.languages.join('\n') || fullText;
  LANGUAGE_KEYWORDS.forEach(lang => {
    if (new RegExp(`\\b${lang}\\b`, 'i').test(langText)) languages.push(lang);
  });

  // --- L. OPTIONAL FIELDS ---
  // Extract notice period — take only the value, strip trailing pipe segments like "| Availability: ..."
  const noticePeriodRaw = fullText.match(/(?:notice[\s-]*period|notice)\s*[:\-]\s*([^\n]+)/i)?.[1]?.trim();
  const noticePeriod = noticePeriodRaw
    ? noticePeriodRaw.split(/\s*\|\s*/)[0].split(/\s*,\s*(?:Availability)/i)[0].trim()
    : 'N/A';

  const currentSalaryMatch = fullText.match(/(?:current salary|ctc)\s*:\s*([^.\n]+)/i)?.[1]?.trim();
  const currentSalary = currentSalaryMatch || 'N/A';

  const expectedSalaryMatch = fullText.match(/(?:expected salary|ectc)\s*:\s*([^.\n]+)/i)?.[1]?.trim();
  const expectedSalary = expectedSalaryMatch || 'N/A';

  const preferredLocMatch = fullText.match(/(?:preferred location)\s*:\s*([^.\n]+)/i)?.[1]?.trim();
  const preferredLocation = preferredLocMatch || 'N/A';
  // Clean up parsed phone number to separate countryCode and local number
  // so that InternationalPhoneInput receives exactly the local number if it expects it.
  if (phone && phone.startsWith('+')) {
    if (phone.startsWith('+91')) {
      countryCode = 'IN';
      phone = phone.slice(3).trim(); // remove +91
    } else if (phone.startsWith('+1')) {
      countryCode = 'US';
      phone = phone.slice(2).trim(); // remove +1
    } else if (phone.startsWith('+44')) {
      countryCode = 'GB';
      phone = phone.slice(3).trim(); // remove +44
    } else if (phone.startsWith('+61')) {
      countryCode = 'AU';
      phone = phone.slice(3).trim(); // remove +61
    } else if (phone.startsWith('+971')) {
      countryCode = 'AE';
      phone = phone.slice(4).trim(); // remove +971
    }
  }

  const parsedResult = {
    candidateName,
    firstName: candidateName !== 'N/A' ? candidateName.split(' ')[0] : '',
    lastName: candidateName !== 'N/A' && candidateName.split(' ').length > 1 ? candidateName.split(' ').slice(1).join(' ') : '',
    email,
    phone: phone === 'N/A' ? '' : phone,
    countryCode,
    altPhone: 'N/A',
    location,
    address: 'N/A',
    currentTitle,
    currentCompany,
    totalExperience: totalExperience === 'N/A' ? '' : (totalExperience.includes('mos') ? (parseFloat(totalExperience)/12).toFixed(1) : totalExperience.replace(/[^\d.]/g, '')),
    noticePeriod,
    currentSalary,
    expectedSalary,
    preferredLocation,
    employmentType: 'Full-Time Permanent',
    skills: extractedSkills,
    skillsBreakdown: extractedSkills.map((s, idx) => ({
      name: s,
      category: idx % 2 === 0 ? 'Technical Core' : 'Framework & Tools',
      experience: totalExperience !== 'N/A' ? totalExperience : 'N/A',
      proficiency: idx === 0 ? 'Expert' : 'Advanced'
    })),
    experienceHistory,
    educationHistory: educationHistory.length > 0 ? educationHistory : [],
    internshipExperienceMonths,
    internshipExperience,
    internships: sections.internships || [],
    parsedSummary: {
      professionalSummary: (currentTitle !== 'Not Found / Needs Review' || totalExperience !== 'N/A' || extractedSkills.length > 0)
        ? `${currentTitle !== 'Not Found / Needs Review' ? currentTitle : 'Professional'}${totalExperience !== 'N/A' && totalExperience !== '0 yrs / Fresher' ? ' with ' + totalExperience + ' experience' : ''}${extractedSkills.length > 0 ? ' specializing in ' + extractedSkills.slice(0, 5).join(', ') : ''}.`
        : 'N/A',
      certifications,
      languages
    },
    fileName,
    fileSize
  };

  return parsedResult;
};

/**
 * 3. Transformer mapping parsed result into Candidate Data Model
 */
export const mapParsedDataToCandidateModel = (parsedData, requisitionId = '') => {
  const skills = (parsedData.skills || []).map(s => SanitizerService.escapeHtml(s));
  
  return {
    id: `CND-${Math.floor(1000 + Math.random() * 9000)}`,
    candidateName: SanitizerService.escapeHtml(parsedData.candidateName || 'N/A'),
    email: SanitizerService.sanitizeEmailHeader(parsedData.email || 'N/A'),
    phone: SanitizerService.escapeHtml(parsedData.phone || 'N/A'),
    altPhone: SanitizerService.escapeHtml(parsedData.altPhone || 'N/A'),
    location: SanitizerService.escapeHtml(parsedData.location || 'N/A'),
    address: SanitizerService.escapeHtml(parsedData.address || 'N/A'),
    nationality: 'United States',
    contactPreference: 'Email & Phone',
    currentTitle: SanitizerService.escapeHtml(parsedData.currentTitle || 'N/A'),
    currentCompany: SanitizerService.escapeHtml(parsedData.currentCompany || 'N/A'),
    totalExperience: SanitizerService.escapeHtml(parsedData.totalExperience || 'N/A'),
    noticePeriod: SanitizerService.escapeHtml(parsedData.noticePeriod || 'N/A'),
    currentSalary: SanitizerService.escapeHtml(parsedData.currentSalary || 'N/A'),
    expectedSalary: SanitizerService.escapeHtml(parsedData.expectedSalary || 'N/A'),
    preferredLocation: SanitizerService.escapeHtml(parsedData.preferredLocation || 'N/A'),
    employmentType: SanitizerService.escapeHtml(parsedData.employmentType || 'Full-Time Permanent'),
    availability: parsedData.noticePeriod && parsedData.noticePeriod !== 'N/A' ? SanitizerService.escapeHtml(parsedData.noticePeriod) : 'Immediate / 1 Month',
    candidateOwner: 'Sarah Jenkins (Recruiter)',
    source: 'Resume Parser Upload',
    rating: 4,
    stage: 'Applied',
    processingStatus: 'Screened',
    tags: ['Parsed Resume', ...skills.slice(0, 2)],
    skills,
    skillsBreakdown: parsedData.skillsBreakdown || [],
    experienceHistory: parsedData.experienceHistory || [],
    educationHistory: parsedData.educationHistory || [],
    internshipExperienceMonths: parsedData.internshipExperienceMonths || 0,
    internshipExperience: parsedData.internshipExperience || [],
    parsedSummary: parsedData.parsedSummary || { professionalSummary: 'N/A', certifications: [], languages: [] },
    fileName: SanitizerService.escapeHtml(parsedData.fileName || 'Resume.pdf'),
    fileSize: parsedData.fileSize || '1.8 MB',
    uploadedDate: new Date().toISOString().split('T')[0],
    screeningResult: calculateScreeningScore(skills, 'React, Node.js'),
    requisitionId: requisitionId || '',
    applications: [],
    interviews: [],
    activities: [],
    communications: [],
    notes: [],
    documents: [
      { id: `doc-${Date.now()}`, name: SanitizerService.escapeHtml(parsedData.fileName || 'Resume.pdf'), type: 'Resume', fileSize: parsedData.fileSize || '1.8 MB', uploadedBy: SanitizerService.escapeHtml(parsedData.candidateName || 'Recruiter'), uploadedDate: new Date().toISOString().split('T')[0] }
    ],
    timeline: [
      { id: `tl-${Date.now()}`, event: 'Candidate Created', description: 'Extracted and parsed from uploaded resume', user: 'Resume Parser', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) }
    ]
  };
};

