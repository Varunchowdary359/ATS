/**
 * AI Tool Registry
 * Catalogs all available tool definitions, parameter schemas, and required permissions
 * across all PeopleWorks ATS enterprise modules.
 */

export const AI_TOOL_DEFINITIONS = [
  // -------------------------------------------------------------
  // DASHBOARD & ANALYTICS TOOLS
  // -------------------------------------------------------------
  {
    name: 'getDashboardMetrics',
    category: 'dashboard',
    description: 'Retrieves current ATS KPI metrics, pipeline counts, open requisitions, and upcoming interview stats.',
    permission: 'read:dashboard',
    parameters: {
      type: 'object',
      properties: {
        role: { type: 'string', description: 'Role perspective: super_admin | pw_ceo | client_ceo | workspace' }
      }
    }
  },
  {
    name: 'getRecruitmentFunnel',
    category: 'analytics',
    description: 'Retrieves the current recruiting funnel breakdown (Applied -> Screened -> Shortlisted -> Interview -> Decision -> Offer).',
    permission: 'read:dashboard',
    parameters: {
      type: 'object',
      properties: {
        requisitionId: { type: 'string', description: 'Optional requisition filter' }
      }
    }
  },
  {
    name: 'getPendingJdApprovals',
    category: 'jd',
    description: 'Retrieves current live count and details of Job Descriptions pending approval.',
    permission: 'read:jd',
    parameters: {
      type: 'object',
      properties: {}
    }
  },

  // -------------------------------------------------------------
  // REQUISITION TOOLS
  // -------------------------------------------------------------
  {
    name: 'getRequisitions',
    category: 'requisition',
    description: 'Searches and retrieves requisitions by status, department, or keyword.',
    permission: 'read:requisition',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Draft | Pending Approval | Approved | Rejected | On Hold | Closed | All' },
        department: { type: 'string', description: 'Filter by department' },
        search: { type: 'string', description: 'Search term for title or ID' }
      }
    }
  },
  {
    name: 'getApprovalChain',
    category: 'requisition',
    description: 'Retrieves the sequential approval hierarchy and assigned approver roles for requisitions.',
    permission: 'read:requisition',
    parameters: {
      type: 'object',
      properties: {
        requisitionId: { type: 'string', description: 'Optional requisition ID' }
      }
    }
  },
  {
    name: 'createRequisition',
    category: 'requisition',
    description: 'Creates a new hiring requisition with title, department, openings, budget, location, and hiring manager.',
    permission: 'create:requisition',
    parameters: {
      type: 'object',
      required: ['title', 'department'],
      properties: {
        title: { type: 'string', description: 'Job position title (e.g. Senior Java Developer)' },
        department: { type: 'string', description: 'Department (e.g. Engineering, Sales, Product)' },
        openings: { type: 'number', description: 'Number of open positions' },
        location: { type: 'string', description: 'Primary job location (e.g. Bangalore, Hyderabad, Remote)' },
        employmentType: { type: 'string', description: 'Full-Time Permanent | Contract | Internship' },
        experience: { type: 'string', description: 'Required experience range (e.g. 4-7 years)' },
        budget: { type: 'string', description: 'Target compensation/budget (e.g. 15-20 LPA)' },
        hiringManager: { type: 'string', description: 'Name of Hiring Manager' },
        priority: { type: 'string', description: 'High | Medium | Low' }
      }
    }
  },
  {
    name: 'approveRequisitionStep',
    category: 'requisition',
    description: 'Approves the current pending approval step for a requisition.',
    permission: 'approve:requisition',
    parameters: {
      type: 'object',
      required: ['requisitionId'],
      properties: {
        requisitionId: { type: 'string', description: 'ID of the requisition (e.g. REQ-2026-001)' },
        comments: { type: 'string', description: 'Optional approver comments' }
      }
    }
  },
  {
    name: 'rejectRequisitionStep',
    category: 'requisition',
    description: 'Rejects a requisition step with a mandatory justification comment.',
    permission: 'reject:requisition',
    parameters: {
      type: 'object',
      required: ['requisitionId', 'reason'],
      properties: {
        requisitionId: { type: 'string', description: 'ID of the requisition' },
        reason: { type: 'string', description: 'Justification for rejection' }
      }
    }
  },

  // -------------------------------------------------------------
  // JOB DESCRIPTION TOOLS
  // -------------------------------------------------------------
  {
    name: 'getJobDescriptions',
    category: 'jd',
    description: 'Retrieves job descriptions filtered by status, department, or keyword.',
    permission: 'read:jd',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Draft | In Review | Approved | Published | All' },
        search: { type: 'string', description: 'Keyword search' }
      }
    }
  },
  {
    name: 'createJobDescription',
    category: 'jd',
    description: 'Drafts a new structured Job Description linked to a requisition.',
    permission: 'create:jd',
    parameters: {
      type: 'object',
      required: ['title', 'department'],
      properties: {
        title: { type: 'string', description: 'Job Title' },
        department: { type: 'string', description: 'Department' },
        requisitionId: { type: 'string', description: 'Linked Requisition ID' },
        overview: { type: 'string', description: 'Role summary' },
        responsibilities: { type: 'array', items: { type: 'string' }, description: 'List of core responsibilities' },
        requirements: { type: 'array', items: { type: 'string' }, description: 'List of requirements and qualifications' },
        skills: { type: 'array', items: { type: 'string' }, description: 'Primary required skills' }
      }
    }
  },
  {
    name: 'approveJobDescription',
    category: 'jd',
    description: 'Approves a Job Description and updates its workflow state to Approved.',
    permission: 'approve:jd',
    parameters: {
      type: 'object',
      required: ['jdId'],
      properties: {
        jdId: { type: 'string', description: 'ID of the Job Description' }
      }
    }
  },
  {
    name: 'publishJobDescription',
    category: 'jd',
    description: 'Publishes an approved JD across standard recruitment posting channels (Careers Portal, LinkedIn, etc.).',
    permission: 'publish:jd',
    parameters: {
      type: 'object',
      required: ['jdId'],
      properties: {
        jdId: { type: 'string', description: 'ID of the Job Description to publish' },
        channels: { type: 'array', items: { type: 'string' }, description: 'Target channels (e.g. careers_portal, linkedin, indeed)' }
      }
    }
  },
  {
    name: 'createJobPosting',
    category: 'posting',
    description: 'Creates a Job Posting linked to an approved Job Description.',
    permission: 'create:posting',
    parameters: {
      type: 'object',
      required: ['title', 'jdId'],
      properties: {
        title: { type: 'string', description: 'Title of the Job Posting' },
        jdId: { type: 'string', description: 'ID of the linked approved Job Description' },
        department: { type: 'string', description: 'Department' },
        location: { type: 'string', description: 'Job location' },
        channels: { type: 'array', items: { type: 'string' }, description: 'Selected publishing channels' }
      }
    }
  },
  {
    name: 'publishJobPosting',
    category: 'posting',
    description: 'Publishes a job posting across selected simulated channels.',
    permission: 'publish:posting',
    parameters: {
      type: 'object',
      required: ['postingId'],
      properties: {
        postingId: { type: 'string', description: 'ID of the Job Posting or linked JD to publish' },
        channels: { type: 'array', items: { type: 'string' }, description: 'Target distribution channels' }
      }
    }
  },

  // -------------------------------------------------------------
  // CANDIDATE TOOLS
  // -------------------------------------------------------------
  {
    name: 'searchCandidates',
    category: 'candidate',
    description: 'Searches candidates by name, email, skills, stage, experience, or requisition.',
    permission: 'read:candidate',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term (name, email, role)' },
        skills: { type: 'array', items: { type: 'string' }, description: 'Required skills filter' },
        stage: { type: 'string', description: 'Applied | Screening | Shortlisted | Interview | Offer | Hired' },
        minExperience: { type: 'number', description: 'Minimum years of experience' },
        requisitionId: { type: 'string', description: 'Filter by applied requisition ID' }
      }
    }
  },
  {
    name: 'getCandidateDetails',
    category: 'candidate',
    description: 'Retrieves full 360-degree candidate profile including experience, education, timeline, applications, and documents.',
    permission: 'read:candidate',
    parameters: {
      type: 'object',
      required: ['candidateId'],
      properties: {
        candidateId: { type: 'string', description: 'Candidate ID or full name' }
      }
    }
  },
  {
    name: 'createCandidate',
    category: 'candidate',
    description: 'Creates a new candidate record manually or from parsed resume data.',
    permission: 'create:candidate',
    parameters: {
      type: 'object',
      required: ['candidateName', 'email'],
      properties: {
        candidateName: { type: 'string', description: 'Full name' },
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        currentTitle: { type: 'string', description: 'Current designation' },
        currentCompany: { type: 'string', description: 'Current company' },
        totalExperience: { type: 'string', description: 'Total experience (e.g. 5 yrs)' },
        skills: { type: 'array', items: { type: 'string' }, description: 'Skills list' },
        location: { type: 'string', description: 'Location' },
        requisitionId: { type: 'string', description: 'Optional requisition to link application immediately' }
      }
    }
  },
  {
    name: 'parseResumeDocument',
    category: 'candidate',
    description: 'Extracts and parses text from uploaded candidate resume (PDF/DOCX/TXT).',
    permission: 'create:candidate',
    parameters: {
      type: 'object',
      properties: {
        fileName: { type: 'string', description: 'Name of the uploaded resume file' },
        requisitionId: { type: 'string', description: 'Optional requisition to link' }
      }
    }
  },
  {
    name: 'checkCandidateDuplicate',
    category: 'candidate',
    description: 'Checks for existing duplicate candidates across Email, Phone, and Name.',
    permission: 'read:candidate',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        name: { type: 'string', description: 'Candidate name' }
      }
    }
  },
  {
    name: 'createCandidateFromResume',
    category: 'candidate',
    description: 'Commits a parsed resume record into the Candidate database repository.',
    permission: 'create:candidate',
    parameters: {
      type: 'object',
      required: ['candidateName', 'email'],
      properties: {
        candidateName: { type: 'string', description: 'Full candidate name' },
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        location: { type: 'string', description: 'Location' },
        requisitionId: { type: 'string', description: 'Requisition ID' }
      }
    }
  },
  {
    name: 'updateCandidateContact',
    category: 'candidate',
    description: "Updates a candidate's contact details (email, phone, location, current title).",
    permission: 'update:candidate',
    parameters: {
      type: 'object',
      required: ['candidateId'],
      properties: {
        candidateId: { type: 'string', description: 'Candidate ID' },
        email: { type: 'string', description: 'Updated email address' },
        phone: { type: 'string', description: 'Updated phone number' },
        location: { type: 'string', description: 'Updated location' },
        currentTitle: { type: 'string', description: 'Updated title' }
      }
    }
  },
  {
    name: 'moveCandidateStage',
    category: 'candidate',
    description: 'Transitions a candidate application to a new stage in the recruitment pipeline (e.g. Applied -> Screening -> Shortlisted -> Interview).',
    permission: 'move:candidate_stage',
    parameters: {
      type: 'object',
      required: ['candidateId', 'targetStage'],
      properties: {
        candidateId: { type: 'string', description: 'Candidate ID' },
        applicationId: { type: 'string', description: 'Optional specific application ID' },
        targetStage: { type: 'string', description: 'Applied | Screening | Shortlisted | Interview | Offer | Hired' },
        notes: { type: 'string', description: 'Stage transition notes' }
      }
    }
  },

  // -------------------------------------------------------------
  // SCREENING TOOLS
  // -------------------------------------------------------------
  {
    name: 'screenCandidateAgainstJD',
    category: 'screening',
    description: 'Evaluates and screens a candidate against a target Requisition / Job Description, calculating skill match and recommendations.',
    permission: 'read:candidate',
    parameters: {
      type: 'object',
      required: ['candidateId'],
      properties: {
        candidateId: { type: 'string', description: 'Candidate ID or name' },
        requisitionId: { type: 'string', description: 'Target Requisition ID (or inferred from context)' },
        jdId: { type: 'string', description: 'Target JD ID (or inferred from context)' }
      }
    }
  },

  // -------------------------------------------------------------
  // INTERVIEW TOOLS
  // -------------------------------------------------------------
  {
    name: 'getInterviewSessions',
    category: 'interview',
    description: 'Retrieves scheduled interviews filtered by date, candidate, round, or status.',
    permission: 'read:interview',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Filter by date (YYYY-MM-DD or today / tomorrow)' },
        status: { type: 'string', description: 'Scheduled | Completed | Cancelled | All' },
        candidateId: { type: 'string', description: 'Candidate filter' }
      }
    }
  },
  {
    name: 'scheduleInterview',
    category: 'interview',
    description: 'Schedules an interview session for a candidate, validates policy, generates simulated meeting link, and prepares notification.',
    permission: 'schedule:interview',
    parameters: {
      type: 'object',
      required: ['candidateId', 'scheduledDate', 'startTime'],
      properties: {
        candidateId: { type: 'string', description: 'Candidate ID' },
        roundName: { type: 'string', description: 'Round name (e.g. Technical Round 1, System Design, HR Discussion)' },
        roundCategory: { type: 'string', description: 'TECHNICAL | HR | SYSTEM_DESIGN | EXECUTIVE | CODING' },
        scheduledDate: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        startTime: { type: 'string', description: 'Start time (e.g. 11:00 or 14:30)' },
        durationMinutes: { type: 'number', description: 'Duration in minutes (default 45)' },
        interviewerNames: { type: 'array', items: { type: 'string' }, description: 'Names or emails of assigned panelists' }
      }
    }
  },
  {
    name: 'rescheduleInterview',
    category: 'interview',
    description: 'Reschedules an existing interview session to a new date/time with notification dispatch.',
    permission: 'reschedule:interview',
    parameters: {
      type: 'object',
      required: ['sessionId', 'newDate', 'newStartTime'],
      properties: {
        sessionId: { type: 'string', description: 'Interview Session ID' },
        newDate: { type: 'string', description: 'New date (YYYY-MM-DD)' },
        newStartTime: { type: 'string', description: 'New start time' },
        reason: { type: 'string', description: 'Reason for rescheduling' }
      }
    }
  },
  {
    name: 'cancelInterview',
    category: 'interview',
    description: 'Cancels a scheduled interview session and dispatches simulated cancellation email.',
    permission: 'cancel:interview',
    parameters: {
      type: 'object',
      required: ['sessionId', 'reason'],
      properties: {
        sessionId: { type: 'string', description: 'Interview Session ID' },
        reason: { type: 'string', description: 'Cancellation reason' }
      }
    }
  },
  {
    name: 'generateInterviewQuestions',
    category: 'interview',
    description: 'Generates structured technical and behavioral interview questions tailored to the candidate and role.',
    permission: 'read:interview',
    parameters: {
      type: 'object',
      properties: {
        roleTitle: { type: 'string', description: 'Position title' },
        skills: { type: 'array', items: { type: 'string' }, description: 'Skills to focus on' },
        difficulty: { type: 'string', description: 'Junior | Mid | Senior | Lead' }
      }
    }
  },

  // -------------------------------------------------------------
  // NOTIFICATION & EMAIL TOOLS
  // -------------------------------------------------------------
  {
    name: 'sendSimulatedEmail',
    category: 'notification',
    description: 'Generates and dispatches a simulated enterprise email notification to candidate or interviewer.',
    permission: 'update:candidate',
    parameters: {
      type: 'object',
      required: ['recipient', 'subject', 'body'],
      properties: {
        recipient: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body text' },
        category: { type: 'string', description: 'INTERVIEW_INVITE | OFFER_LETTER | STATUS_UPDATE | REJECTION' }
      }
    }
  },

  // -------------------------------------------------------------
  // AUDIT & EXPLANATION TOOLS
  // -------------------------------------------------------------
  {
    name: 'explainWorkflowBlocker',
    category: 'explanation',
    description: 'Inspects a requisition, JD, or candidate to diagnose why an action cannot be performed or what step is pending.',
    permission: 'read:requisition',
    parameters: {
      type: 'object',
      properties: {
        entityType: { type: 'string', description: 'requisition | jd | candidate | offer' },
        entityId: { type: 'string', description: 'Entity identifier' }
      }
    }
  }
];

class AIToolRegistryImpl {
  constructor() {
    this._tools = new Map();
    AI_TOOL_DEFINITIONS.forEach(def => {
      this._tools.set(def.name, def);
    });
  }

  getTool(name) {
    return this._tools.get(name) || null;
  }

  getAllTools() {
    return Array.from(this._tools.values());
  }

  getToolsByCategory(category) {
    return Array.from(this._tools.values()).filter(t => t.category === category);
  }
}

export const AIToolRegistry = new AIToolRegistryImpl();
