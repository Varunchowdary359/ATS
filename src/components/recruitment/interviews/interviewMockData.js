/**
 * Enterprise Interview Mock Storage & Datasets
 * PeopleWorks ATS - Realistic Enterprise Seed Data
 */
import { 
  ROUND_CATEGORY, 
  ROUND_SUBTYPES, 
  INTERVIEW_TYPE, 
  MEETING_PROVIDERS, 
  SESSION_STATUS, 
  FEEDBACK_STATUS,
  SCORECARD_RECOMMENDATION,
  ROUND_OUTCOME_DECISION,
  EVALUATION_METHOD
} from './interviewTypes';

export const SCORECARD_TEMPLATES = [
  {
    id: 'SCT-TECH-01',
    name: 'Senior Engineering & Architecture Rubric',
    category: 'Technical',
    description: 'Comprehensive evaluation for Senior/Lead/Staff technical roles',
    criteria: [
      { id: 'crit-1', name: 'Problem Solving & Algorithmic Thinking', weight: 25, required: true, description: 'Ability to dissect ambiguity, break down complex logic, and optimize time/space complexity.' },
      { id: 'crit-2', name: 'System Architecture & Scalability', weight: 25, required: true, description: 'Knowledge of distributed systems, resilience, concurrency, caching, and state management.' },
      { id: 'crit-3', name: 'Code Quality, Modularity & Testing', weight: 20, required: true, description: 'Clean, idiomatic code, maintainability, unit/integration test coverage, and documentation.' },
      { id: 'crit-4', name: 'Technical Communication & Collaboration', weight: 15, required: true, description: 'Clarity in explaining technical trade-offs, active listening, and receptive to feedback.' },
      { id: 'crit-5', name: 'Domain & Cloud Platform Expertise', weight: 15, required: false, description: 'Proficiency in React/TypeScript, AWS/GCP, Docker/K8s, and modern CI/CD tooling.' }
    ]
  },
  {
    id: 'SCT-MGR-02',
    name: 'Managerial & Behavioral Leadership Rubric',
    category: 'Managerial',
    description: 'Evaluation for leadership, ownership, team enablement, and stakeholder management',
    criteria: [
      { id: 'crit-6', name: 'Ownership & Accountability', weight: 30, required: true, description: 'Demonstrated history of driving outcomes, navigating obstacles, and taking responsibility for failures.' },
      { id: 'crit-7', name: 'Strategic Prioritization & Execution', weight: 25, required: true, description: 'Balancing technical debt vs business delivery, roadmap execution, and trade-off management.' },
      { id: 'crit-8', name: 'Mentorship & People Enablement', weight: 25, required: true, description: 'Experience mentoring junior/mid engineers, conducting effective 1:1s, and fostering growth.' },
      { id: 'crit-9', name: 'Conflict Resolution & Cross-Functional Alignment', weight: 20, required: true, description: 'Working effectively with Product, Design, and Executive leadership.' }
    ]
  },
  {
    id: 'SCT-HR-03',
    name: 'HR & Cultural Alignment Rubric',
    category: 'HR / Culture',
    description: 'Assessment for core values, compensation expectations, notice period, and career motivations',
    criteria: [
      { id: 'crit-10', name: 'Cultural Alignment & Core Values', weight: 35, required: true, description: 'Alignment with customer-first mindset, continuous learning, and collaborative integrity.' },
      { id: 'crit-11', name: 'Career Motivation & Growth Aspirations', weight: 25, required: true, description: 'Clear understanding of why PeopleWorks and long-term trajectory fit.' },
      { id: 'crit-12', name: 'Communication & Professional Presence', weight: 20, required: true, description: 'Clear, articulate, respectful communication and executive presence.' },
      { id: 'crit-13', name: 'Logistics, Compensation & Notice Alignment', weight: 20, required: true, description: 'Notice period flexibility, salary expectation adherence, and work authorization.' }
    ]
  }
];

export const INTERVIEWERS_ROSTER = [
  { id: 'INT-01', name: 'Alex Chen', email: 'alex.chen@peopleworks.internal', role: 'Engineering Director', department: 'Engineering', title: 'Hiring Manager', avatar: 'AC', avatarBg: '#6366f1' },
  { id: 'INT-02', name: 'Sarah Jenkins', email: 'sarah.jenkins@peopleworks.internal', role: 'Lead Technical Recruiter', department: 'Talent Acquisition', title: 'Primary Recruiter', avatar: 'SJ', avatarBg: '#0284c7' },
  { id: 'INT-03', name: 'Marcus Brody', email: 'marcus.brody@peopleworks.internal', role: 'Principal Architect', department: 'Cloud & AI Platform', title: 'Technical Interviewer', avatar: 'MB', avatarBg: '#8b5cf6' },
  { id: 'INT-04', name: 'Elena Rostova', email: 'elena.rostova@peopleworks.internal', role: 'Staff Frontend Engineer', department: 'Engineering', title: 'Technical Interviewer', avatar: 'ER', avatarBg: '#ec4899' },
  { id: 'INT-05', name: 'David Vance', email: 'david.vance@peopleworks.internal', role: 'VP of Product & Engineering', department: 'Executive', title: 'Executive Interviewer', avatar: 'DV', avatarBg: '#10b981' },
  { id: 'INT-06', name: 'Priya Sharma', email: 'priya.sharma@peopleworks.internal', role: 'Senior HR Business Partner', department: 'People Operations', title: 'HR Manager', avatar: 'PS', avatarBg: '#f59e0b' }
];

export const INITIAL_INTERVIEW_PLANS = [
  {
    id: 'PLAN-SWE-01',
    name: 'Software Engineer Standard Hiring Plan (6 Rounds)',
    description: 'Complete 6-stage lifecycle plan for Senior and Staff software engineering roles',
    associatedRole: 'Senior Frontend Architect / Staff Engineer',
    department: 'Engineering',
    isActive: true,
    roundsCount: 6,
    createdBy: 'ATS Admin',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-20T14:30:00Z',
    rounds: [
      {
        id: 'RND-SWE-1',
        sequence: 1,
        name: 'Aptitude & Cognitive Assessment',
        category: ROUND_CATEGORY.ASSESSMENT,
        subtype: ROUND_SUBTYPES.APTITUDE_TEST,
        required: true,
        duration: 45,
        evaluationMethod: EVALUATION_METHOD.PASS_FAIL_SCORE,
        passScoreThreshold: 75,
        prerequisiteRoundId: null,
        instructions: 'Automated 45-minute timed aptitude test covering quantitative, logical, and verbal reasoning.',
        scorecardTemplateId: null,
        interviewerRequirement: 'Automated Platform'
      },
      {
        id: 'RND-SWE-2',
        sequence: 2,
        name: 'Coding & Algorithmic Assessment',
        category: ROUND_CATEGORY.ASSESSMENT,
        subtype: ROUND_SUBTYPES.CODING_ASSESSMENT,
        required: true,
        duration: 60,
        evaluationMethod: EVALUATION_METHOD.HYBRID,
        passScoreThreshold: 80,
        prerequisiteRoundId: 'RND-SWE-1',
        instructions: 'Live or take-home coding challenge evaluating data structures, concurrency, and modular architecture.',
        scorecardTemplateId: 'SCT-TECH-01',
        interviewerRequirement: 'Single Reviewer'
      },
      {
        id: 'RND-SWE-3',
        sequence: 3,
        name: 'Technical Deep-Dive Interview',
        category: ROUND_CATEGORY.INTERVIEW,
        subtype: ROUND_SUBTYPES.TECHNICAL_INTERVIEW,
        required: true,
        duration: 60,
        evaluationMethod: EVALUATION_METHOD.SCORECARD,
        prerequisiteRoundId: 'RND-SWE-2',
        instructions: '1:1 technical interview with Senior/Staff engineer focusing on language fundamentals, state management, and performance.',
        scorecardTemplateId: 'SCT-TECH-01',
        interviewerRequirement: 'Single Interviewer'
      },
      {
        id: 'RND-SWE-4',
        sequence: 4,
        name: 'System Design & Scalability',
        category: ROUND_CATEGORY.INTERVIEW,
        subtype: ROUND_SUBTYPES.SYSTEM_DESIGN,
        required: true,
        duration: 60,
        evaluationMethod: EVALUATION_METHOD.SCORECARD,
        prerequisiteRoundId: 'RND-SWE-3',
        instructions: 'Interactive whiteboard session architecting a high-throughput, fault-tolerant web application tier.',
        scorecardTemplateId: 'SCT-TECH-01',
        interviewerRequirement: 'Single Interviewer'
      },
      {
        id: 'RND-SWE-5',
        sequence: 5,
        name: 'Managerial & Cultural Fit Interview',
        category: ROUND_CATEGORY.INTERVIEW,
        subtype: ROUND_SUBTYPES.MANAGERIAL_INTERVIEW,
        required: true,
        duration: 45,
        evaluationMethod: EVALUATION_METHOD.SCORECARD,
        prerequisiteRoundId: 'RND-SWE-4',
        instructions: 'Hiring Manager discussion on past impact, engineering philosophy, collaboration, and ownership.',
        scorecardTemplateId: 'SCT-MGR-02',
        interviewerRequirement: 'Hiring Manager'
      },
      {
        id: 'RND-SWE-6',
        sequence: 6,
        name: 'HR & Final Leadership Alignment',
        category: ROUND_CATEGORY.INTERVIEW,
        subtype: ROUND_SUBTYPES.HR_INTERVIEW,
        required: true,
        duration: 30,
        evaluationMethod: EVALUATION_METHOD.SCORECARD,
        prerequisiteRoundId: 'RND-SWE-5',
        instructions: 'HR discussion on compensation expectations, notice period, work authorization, and final team fit.',
        scorecardTemplateId: 'SCT-HR-03',
        interviewerRequirement: 'HR Manager'
      }
    ]
  },
  {
    id: 'PLAN-PM-02',
    name: 'Senior Product Manager Plan (3 Rounds)',
    description: 'Streamlined 3-round plan for Product Management and Design leads',
    associatedRole: 'Senior Product Manager',
    department: 'Product',
    isActive: true,
    roundsCount: 3,
    createdBy: 'ATS Admin',
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-08-22T09:15:00Z',
    rounds: [
      {
        id: 'RND-PM-1',
        sequence: 1,
        name: 'Product Strategy Case Study',
        category: ROUND_CATEGORY.ASSESSMENT,
        subtype: ROUND_SUBTYPES.CASE_STUDY,
        required: true,
        duration: 60,
        evaluationMethod: EVALUATION_METHOD.SCORECARD,
        prerequisiteRoundId: null,
        instructions: 'Product sense case study on customer onboarding optimization and metric definition.',
        scorecardTemplateId: 'SCT-MGR-02',
        interviewerRequirement: 'Single Interviewer'
      },
      {
        id: 'RND-PM-2',
        sequence: 2,
        name: 'Functional Product Interview',
        category: ROUND_CATEGORY.INTERVIEW,
        subtype: ROUND_SUBTYPES.FUNCTIONAL_INTERVIEW,
        required: true,
        duration: 60,
        evaluationMethod: EVALUATION_METHOD.SCORECARD,
        prerequisiteRoundId: 'RND-PM-1',
        instructions: 'Roadmap execution, wireframing, metrics, and developer empathy assessment.',
        scorecardTemplateId: 'SCT-MGR-02',
        interviewerRequirement: 'Hiring Manager'
      },
      {
        id: 'RND-PM-3',
        sequence: 3,
        name: 'Executive Leadership Panel',
        category: ROUND_CATEGORY.PANEL,
        subtype: ROUND_SUBTYPES.LEADERSHIP_PANEL,
        required: true,
        duration: 45,
        evaluationMethod: EVALUATION_METHOD.SCORECARD,
        prerequisiteRoundId: 'RND-PM-2',
        instructions: 'Multi-stakeholder panel evaluating business vision and executive communication.',
        scorecardTemplateId: 'SCT-MGR-02',
        interviewerRequirement: 'Panel (2+ Interviewers)'
      }
    ]
  }
];

// Dynamic Date Helper relative to current week Monday (0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun)
export const getWeekDayDate = (dayOffset) => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  const target = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayOffset);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const dateNum = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${dateNum}`;
};

// Initial interview sessions empty by default for fresh scheduling testing
export const INITIAL_INTERVIEW_SESSIONS = [];

export const INITIAL_AUDIT_LOGS = [
  { id: 'AUD-001', timestamp: '2026-09-09T15:00:00Z', actor: 'Alex Chen (Hiring Manager)', action: 'Round Outcome Decided', entity: 'Interview Session', entityId: 'INT-SESS-2026-002', oldValue: 'Not Evaluated', newValue: 'Pass', reason: 'Excellent system architecture and cloud knowledge.' },
  { id: 'AUD-002', timestamp: '2026-09-09T12:30:00Z', actor: 'Marcus Brody', action: 'Scorecard Submitted', entity: 'Scorecard', entityId: 'INT-SESS-2026-002', oldValue: 'Pending', newValue: 'Strong Yes (4.8/5)', reason: 'Submitted evaluation rubric with detailed evidence.' },
  { id: 'AUD-003', timestamp: '2026-09-08T10:00:00Z', actor: 'Sarah Jenkins', action: 'Interview Scheduled', entity: 'Interview Session', entityId: 'INT-SESS-2026-001', oldValue: null, newValue: 'Scheduled (MS Teams)', reason: 'Candidate passed prerequisite coding challenge.' }
];
