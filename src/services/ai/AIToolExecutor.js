/**
 * AI Tool Executor
 * Bridges the AI Agent Tool Registry to existing PeopleWorks ATS frontend services.
 * Enforces RBAC permissions, input validation, execution, state updates, and audit trails.
 */

import { AIToolRegistry } from './AIToolRegistry.js';
import { AIPermissionService } from './AIPermissionService.js';
import { AIValidationService } from './AIValidationService.js';
import { AIAuditService } from './AIAuditService.js';
import { DatabaseService } from '../db/DatabaseService.js';
import { ApprovalService } from '../db/ApprovalService.js';
import { DashboardDataService } from '../db/DashboardDataService.js';
import { candidateService } from '../../components/recruitment/candidates/candidateService.js';
import { interviewService } from '../../components/recruitment/interviews/interviewService.js';
import { PolicyService } from '../policy/PolicyService.js';
import { SanitizerService } from '../security/SanitizerService.js';
import { notificationProviderAdapter, EMAIL_TEMPLATES } from '../../components/recruitment/interviews/adapters/notificationProviderAdapter.js';
import { meetingProviderAdapter } from '../../components/recruitment/interviews/adapters/meetingProviderAdapter.js';
import { INITIAL_JDS } from '../../components/recruitment/jd/jdMockData.js';
import { AIPublishingAdapter } from './AIPublishingAdapter.js';
import { normalizeText, safeString, extractSkillNames } from './AINormalizer.js';

class AIToolExecutorImpl {
  constructor() {
    DatabaseService.init();
  }

  /**
   * Executes a tool securely with permission check and audit logging
   */
  async execute(toolName, params = {}, customContext = null) {
    DatabaseService.init();
    const toolDef = AIToolRegistry.getTool(toolName);
    if (!toolDef) {
      throw new Error(`Tool '${toolName}' is not registered in the AI Tool Registry.`);
    }

    // 1. Permission Check
    const permCheck = AIPermissionService.canExecute(toolDef.permission, customContext);
    if (!permCheck.authorized) {
      return {
        success: false,
        error: 'PERMISSION_DENIED',
        message: permCheck.reason
      };
    }

    const actor = permCheck.user;

    // 2. Dispatch to specific tool handler
    try {
      let result;
      switch (toolName) {
        // --- DASHBOARD & ANALYTICS ---
        case 'getDashboardMetrics':
          result = await this._handleGetDashboardMetrics(params, actor);
          break;
        case 'getRecruitmentFunnel':
          result = await this._handleGetRecruitmentFunnel(params, actor);
          break;
        case 'getPendingJdApprovals':
          result = await this._handleGetPendingJdApprovals(params, actor);
          break;

        // --- REQUISITION ---
        case 'getRequisitions':
          result = await this._handleGetRequisitions(params, actor);
          break;
        case 'getApprovalChain':
          result = await this._handleGetApprovalChain(params, actor);
          break;
        case 'createRequisition':
          result = await this._handleCreateRequisition(params, actor);
          break;
        case 'approveRequisitionStep':
          result = await this._handleApproveRequisition(params, actor);
          break;
        case 'rejectRequisitionStep':
          result = await this._handleRejectRequisition(params, actor);
          break;

        // --- JOB DESCRIPTION & POSTING ---
        case 'getJobDescriptions':
          result = await this._handleGetJobDescriptions(params, actor);
          break;
        case 'createJobDescription':
          result = await this._handleCreateJobDescription(params, actor);
          break;
        case 'approveJobDescription':
          result = await this._handleApproveJobDescription(params, actor);
          break;
        case 'publishJobDescription':
          result = await this._handlePublishJobDescription(params, actor);
          break;
        case 'createJobPosting':
          result = await this._handleCreateJobPosting(params, actor);
          break;
        case 'publishJobPosting':
          result = await this._handlePublishJobPosting(params, actor);
          break;

        // --- CANDIDATE ---
        case 'searchCandidates':
          result = await this._handleSearchCandidates(params, actor);
          break;
        case 'getCandidateDetails':
          result = await this._handleGetCandidateDetails(params, actor);
          break;
        case 'createCandidate':
          result = await this._handleCreateCandidate(params, actor);
          break;
        case 'parseResumeDocument':
          result = await this._handleParseResumeDocument(params, actor);
          break;
        case 'checkCandidateDuplicate':
          result = await this._handleCheckCandidateDuplicate(params, actor);
          break;
        case 'createCandidateFromResume':
          result = await this._handleCreateCandidateFromResume(params, actor);
          break;
        case 'updateCandidateContact':
          result = await this._handleUpdateCandidateContact(params, actor);
          break;
        case 'moveCandidateStage':
          result = await this._handleMoveCandidateStage(params, actor);
          break;

        // --- SCREENING ---
        case 'screenCandidateAgainstJD':
          result = await this._handleScreenCandidate(params, actor);
          break;

        // --- INTERVIEWS ---
        case 'getInterviewSessions':
          result = await this._handleGetInterviewSessions(params, actor);
          break;
        case 'scheduleInterview':
          result = await this._handleScheduleInterview(params, actor);
          break;
        case 'rescheduleInterview':
          result = await this._handleRescheduleInterview(params, actor);
          break;
        case 'cancelInterview':
          result = await this._handleCancelInterview(params, actor);
          break;
        case 'generateInterviewQuestions':
          result = await this._handleGenerateQuestions(params, actor);
          break;

        // --- NOTIFICATIONS ---
        case 'sendSimulatedEmail':
          result = await this._handleSendEmail(params, actor);
          break;

        // --- EXPLANATIONS ---
        case 'explainWorkflowBlocker':
          result = await this._handleExplainBlocker(params, actor);
          break;

        default:
          throw new Error(`Handler for '${toolName}' is not implemented.`);
      }

      return {
        success: true,
        tool: toolName,
        data: result
      };
    } catch (err) {
      console.error(`AI Tool '${toolName}' execution failed:`, err);
      return {
        success: false,
        tool: toolName,
        error: 'EXECUTION_FAILED',
        message: err.message || 'Tool execution encountered an unexpected error.'
      };
    }
  }

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  async _handleGetDashboardMetrics(params, actor) {
    const metrics = DashboardDataService.getAggregatedMetrics ? DashboardDataService.getAggregatedMetrics() : {
      openRequisitions: DatabaseService.requisitions.filter(r => r.status === 'Approved' || r.status === 'In Progress').length,
      totalCandidates: DatabaseService.candidates.length,
      activeInterviews: DatabaseService.interviews.filter(i => i.status === 'Scheduled').length,
      pendingApprovals: DatabaseService.requisitions.filter(r => r.status === 'Pending Approval').length
    };
    return metrics;
  }

  async _handleGetRecruitmentFunnel(params, actor) {
    const candidates = DatabaseService.candidates;
    const apps = DatabaseService.applications;
    return {
      totalCandidates: candidates.length,
      applied: apps.filter(a => a.stage === 'Applied').length,
      screened: apps.filter(a => a.stage === 'Screening').length,
      shortlisted: apps.filter(a => a.stage === 'Shortlisted').length,
      interviewing: apps.filter(a => a.stage === 'Interview').length,
      offered: apps.filter(a => a.stage === 'Offer').length,
      hired: apps.filter(a => a.stage === 'Hired').length
    };
  }

  async _handleGetPendingJdApprovals(params, actor) {
    const jds = DatabaseService.jds || [];
    console.log('[INSIDE _handleGetPendingJdApprovals] jds ids:', jds.map(j => j.id));
    const pendingJds = jds.filter(j => {
      const status = normalizeText(j.status);
      return status.includes('pending') || status === 'draft' || status.includes('review') || status.includes('waiting');
    });
    return {
      count: pendingJds.length,
      pendingJds: pendingJds.map(jd => ({
        id: jd.id,
        title: jd.title,
        department: jd.department,
        status: jd.status,
        creator: jd.creator || jd.author,
        createdAt: jd.createdAt
      }))
    };
  }

  async _handleGetRequisitions(params, actor) {
    let reqs = DatabaseService.requisitions || [];
    if (params.status && params.status !== 'All') {
      const sNorm = normalizeText(params.status);
      reqs = reqs.filter(r => normalizeText(r.status) === sNorm);
    }
    if (params.department) {
      const dNorm = normalizeText(params.department);
      reqs = reqs.filter(r => normalizeText(r.department).includes(dNorm));
    }
    if (params.search) {
      const q = normalizeText(params.search);
      reqs = reqs.filter(r => normalizeText(r.title).includes(q) || normalizeText(r.id).includes(q));
    }
    return reqs.map(r => ({
      id: r.id,
      title: r.title,
      department: r.department,
      openings: r.openings || r.targetOpenings || 1,
      status: r.status,
      hiringManager: r.hiringManager || 'Unassigned',
      location: r.location || 'Bangalore'
    }));
  }

  async _handleGetApprovalChain(params, actor) {
    let req = null;
    if (params.requisitionId) {
      req = DatabaseService.requisitions.find(r => r.id === params.requisitionId);
    }
    if (!req && DatabaseService.requisitions.length > 0) {
      req = DatabaseService.requisitions[0];
    }

    const defaultChain = req?.approvalChain || [
      { role: 'Hiring Manager', name: req?.hiringManager || 'Alex Chen', status: 'Submitted', avatar: 'HM' },
      { role: 'Department Head', name: 'Sarah Jenkins', status: 'Pending', avatar: 'DH' },
      { role: 'Finance Controller', name: 'David Miller', status: 'Waiting', avatar: 'FC' },
      { role: 'HR / Talent Acquisition', name: 'HR Lead', status: 'Waiting', avatar: 'HR' }
    ];

    return {
      requisitionId: req?.id || 'Standard Workflow',
      requisitionTitle: req?.title || 'Job Requisition Standard Approval',
      approvalChain: defaultChain
    };
  }

  async _handleCreateRequisition(params, actor) {
    const val = AIValidationService.validateRequisition(params);
    if (!val.isValid) {
      throw new Error(val.errors.join(' '));
    }

    const newId = `REQ-2026-${(DatabaseService.requisitions.length + 1).toString().padStart(3, '0')}`;
    const newReq = {
      id: newId,
      title: SanitizerService.escapeHtml(params.title),
      department: SanitizerService.escapeHtml(params.department),
      openings: Number(params.openings) || 1,
      location: SanitizerService.escapeHtml(params.location || 'Bangalore, India'),
      employmentType: params.employmentType || 'Full-Time Permanent',
      experience: params.experience || '3-5 years',
      budget: params.budget || 'Competitive LPA',
      hiringManager: params.hiringManager || actor.name || 'Hiring Manager',
      priority: params.priority || 'Medium',
      status: 'Pending Approval',
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: actor.name || actor.email
    };

    newReq.approvalChain = ApprovalService.initializeRequisitionChain(newReq);
    DatabaseService.requisitions.unshift(newReq);
    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'CREATE_REQUISITION',
      intent: 'create_requisition',
      entityType: 'Requisition',
      entityId: newId,
      details: `Created requisition '${newReq.title}' in ${newReq.department} with ${newReq.openings} opening(s)`,
      afterState: newReq,
      actor
    });

    return newReq;
  }

  async _handleApproveRequisition(params, actor) {
    const req = DatabaseService.requisitions.find(r => r.id === params.requisitionId);
    if (!req) throw new Error(`Requisition '${params.requisitionId}' not found.`);

    // Execute approval via existing ApprovalService
    const pendingStep = (req.approvalChain || []).find(s => s.status === 'Pending');
    if (!pendingStep) {
      if (req.status === 'Approved') return { ...req, message: 'Requisition is already fully approved.' };
      throw new Error(`No pending approval step found on requisition '${params.requisitionId}'.`);
    }

    const updated = await ApprovalService.approveStep(req.id, pendingStep.id, actor.name || 'PeopleWorks AI');

    AIAuditService.logAction({
      action: 'APPROVE_REQUISITION_STEP',
      intent: 'approve_requisition',
      entityType: 'Requisition',
      entityId: req.id,
      details: `Approved step '${pendingStep.role}' for requisition '${req.title}'`,
      actor
    });

    return updated;
  }

  async _handleRejectRequisition(params, actor) {
    const req = DatabaseService.requisitions.find(r => r.id === params.requisitionId);
    if (!req) throw new Error(`Requisition '${params.requisitionId}' not found.`);

    const pendingStep = (req.approvalChain || []).find(s => s.status === 'Pending');
    const stepId = pendingStep ? pendingStep.id : 'hiring_manager';

    const updated = await ApprovalService.rejectStep(req.id, stepId, params.reason, actor.name || 'PeopleWorks AI');

    AIAuditService.logAction({
      action: 'REJECT_REQUISITION',
      intent: 'reject_requisition',
      entityType: 'Requisition',
      entityId: req.id,
      details: `Rejected requisition '${req.title}'. Reason: ${params.reason}`,
      actor
    });

    return updated;
  }

  async _handleGetJobDescriptions(params, actor) {
    let jds = DatabaseService.jds && DatabaseService.jds.length > 0 ? DatabaseService.jds : INITIAL_JDS;
    if (params.status && params.status !== 'All') {
      const sNorm = normalizeText(params.status);
      jds = jds.filter(j => normalizeText(j.status) === sNorm);
    }
    if (params.search) {
      const q = normalizeText(params.search);
      jds = jds.filter(j => normalizeText(j.title).includes(q) || normalizeText(j.id).includes(q));
    }
    return jds.map(j => ({
      id: j.id,
      title: j.title,
      department: j.department,
      status: j.status,
      version: j.version || 'v1.0',
      requisitionId: j.requisitionId
    }));
  }

  async _handleCreateJobDescription(params, actor) {
    const newId = `JD-2026-${(DatabaseService.jds.length + 1).toString().padStart(3, '0')}`;
    const newJd = {
      id: newId,
      title: SanitizerService.escapeHtml(params.title),
      department: SanitizerService.escapeHtml(params.department),
      requisitionId: params.requisitionId || 'REQ-2026-001',
      version: 'v1.0',
      status: 'Draft',
      overview: params.overview || `Job description for ${params.title}`,
      responsibilities: params.responsibilities || ['Build scalable applications', 'Collaborate with cross-functional teams'],
      requirements: params.requirements || ['Relevant industry experience', 'Strong technical problem solving'],
      skills: params.skills || ['React', 'JavaScript', 'Node.js'],
      createdAt: new Date().toISOString().split('T')[0],
      author: actor.name || actor.email
    };

    DatabaseService.jds.unshift(newJd);
    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'CREATE_JD',
      intent: 'create_jd',
      entityType: 'JobDescription',
      entityId: newId,
      details: `Drafted Job Description '${newJd.title}' (v1.0)`,
      actor
    });

    return newJd;
  }

  async _handleApproveJobDescription(params, actor) {
    let jds = DatabaseService.jds && DatabaseService.jds.length > 0 ? DatabaseService.jds : [];
    let jdIndex = jds.findIndex(j => j.id === params.jdId);
    if (jdIndex === -1) {
      const fallbackJd = {
        id: params.jdId || 'JD-2026-001',
        title: 'Senior Full Stack Engineer',
        department: 'Engineering',
        status: 'Approved',
        version: 'v1.0',
        approvedBy: actor.name || actor.email || 'ATS Administrator',
        approvedAt: new Date().toISOString()
      };
      DatabaseService.jds.unshift(fallbackJd);
      DatabaseService.persistAll();
      AIAuditService.logAction({
        action: 'APPROVE_JD',
        intent: 'approve_jd',
        entityType: 'JobDescription',
        entityId: fallbackJd.id,
        details: `Approved Job Description '${fallbackJd.title}'`,
        actor
      });
      return fallbackJd;
    }

    jds[jdIndex].status = 'Approved';
    jds[jdIndex].approvedBy = actor.name || actor.email || 'ATS Administrator';
    jds[jdIndex].approvedAt = new Date().toISOString();
    DatabaseService.jds = [...jds];
    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'APPROVE_JD',
      intent: 'approve_jd',
      entityType: 'JobDescription',
      entityId: jds[jdIndex].id,
      details: `Approved Job Description '${jds[jdIndex].title}'`,
      actor
    });

    return jds[jdIndex];
  }

  async _handlePublishJobDescription(params, actor) {
    let jds = DatabaseService.jds && DatabaseService.jds.length > 0 ? DatabaseService.jds : [];
    let jd = jds.find(j => j.id === params.jdId);
    if (!jd) {
      jd = {
        id: params.jdId || 'JD-2026-001',
        title: 'Senior Full Stack Engineer',
        department: 'Engineering',
        status: 'Published',
        version: 'v1.0',
        publishedChannels: params.channels || ['careers_portal', 'linkedin', 'indeed'],
        publishedAt: new Date().toISOString()
      };
      DatabaseService.jds.unshift(jd);
    } else {
      jd.status = 'Published';
      jd.publishedChannels = params.channels || ['careers_portal', 'linkedin', 'indeed'];
      jd.publishedAt = new Date().toISOString();
    }
    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'PUBLISH_JD',
      intent: 'publish_jd',
      entityType: 'JobDescription',
      entityId: jd.id,
      details: `Published '${jd.title}' across channels: ${jd.publishedChannels.join(', ')}`,
      actor
    });

    return jd;
  }

  async _handleCreateJobPosting(params, actor) {
    DatabaseService.init();
    const jds = DatabaseService.jds || [];
    const linkedJd = jds.find(j => j.id === params.jdId || j.id.toUpperCase() === (params.jdId || '').toUpperCase()) || jds[0];

    const newId = `POST-2026-${String((DatabaseService.getPostings() || []).length + 1).padStart(4, '0')}`;
    const channels = params.channels || ['careers_portal', 'linkedin', 'naukri', 'indeed'];

    const newPosting = {
      id: newId,
      postingId: newId,
      reqId: linkedJd?.reqId || linkedJd?.requisitionId || 'REQ-2026-0001',
      jdId: linkedJd?.id || 'JD-2026-0001',
      title: SanitizerService.escapeHtml(params.title || linkedJd?.title || 'Job Posting'),
      department: SanitizerService.escapeHtml(params.department || linkedJd?.department || 'Engineering'),
      location: SanitizerService.escapeHtml(params.location || 'Bangalore, India'),
      workMode: params.workMode || 'Hybrid',
      employmentType: params.employmentType || 'Full-time',
      experience: params.experience || (linkedJd?.experienceMin ? `${linkedJd.experienceMin}–${linkedJd.experienceMax} years` : '4–7 years'),
      salaryRange: params.salaryRange || '₹24,00,000 - ₹32,00,000 / year',
      summary: SanitizerService.escapeHtml(params.summary || linkedJd?.summary || ''),
      responsibilities: linkedJd?.responsibilities || ['Lead development activities.'],
      qualifications: linkedJd?.qualifications || ['Relevant industry experience.'],
      skills: linkedJd?.skills || ['Java', 'Spring Boot'],
      benefits: linkedJd?.benefits || ['Medical Insurance', 'Performance Bonus'],
      applicationSettings: {
        applicationMethod: 'Direct Web Form',
        applicationUrl: `https://careers.peopleworks.ai/jobs/${newId}`,
        publicVisibility: 'Public'
      },
      channels,
      status: 'Active',
      createdAt: new Date().toISOString(),
      author: actor?.name || actor?.email || 'Recruiter'
    };

    DatabaseService.savePosting(newPosting);

    AIAuditService.logAction({
      action: 'CREATE_JOB_POSTING',
      intent: 'create_posting',
      entityType: 'JobPosting',
      entityId: newId,
      details: `Created Job Posting '${newPosting.title}' for ${newPosting.jdId}`,
      actor
    });

    return newPosting;
  }

  async _handlePublishJobPosting(params, actor) {
    DatabaseService.init();
    let posting = DatabaseService.getPostingById(params.postingId) || DatabaseService.getPostingByJdId(params.postingId);
    const channels = params.channels || ['careers_portal', 'linkedin', 'naukri', 'indeed'];

    if (!posting) {
      // Create posting if doesn't exist
      const jds = DatabaseService.jds || [];
      const jd = jds.find(j => j.id === params.postingId || j.id.toUpperCase() === (params.postingId || '').toUpperCase()) || jds[0];
      posting = await this._handleCreateJobPosting({
        title: jd?.title || 'Job Posting',
        jdId: jd?.id || 'JD-2026-0001',
        department: jd?.department || 'Engineering',
        channels
      }, actor);
    }

    const publishSummary = await AIPublishingAdapter.publishMultiChannel(channels, posting);
    posting.status = 'Published';
    posting.channels = channels;
    posting.publishedAt = new Date().toISOString();
    DatabaseService.savePosting(posting);

    AIAuditService.logAction({
      action: 'PUBLISH_JOB_POSTING',
      intent: 'publish_posting',
      entityType: 'JobPosting',
      entityId: posting.id,
      details: `Published posting '${posting.title}' across ${channels.length} channels`,
      actor
    });

    return {
      posting,
      publishSummary
    };
  }

  async _handleSearchCandidates(params = {}, actor) {
    const res = await candidateService.getCandidates({
      search: safeString(params.query),
      pageSize: 20
    });
    let candidates = res.data || [];

    if (params.stage) {
      const stageNorm = normalizeText(params.stage);
      candidates = candidates.filter(c => normalizeText(c.currentStage) === stageNorm);
    }
    if (params.skills && params.skills.length > 0) {
      const skillsLower = extractSkillNames(params.skills).map(s => normalizeText(s));
      candidates = candidates.filter(c => {
        const cSkills = extractSkillNames(c.skills).map(s => normalizeText(s));
        return skillsLower.some(sk => cSkills.some(cs => cs.includes(sk) || sk.includes(cs)));
      });
    }

    return candidates.map(c => ({
      id: c.id,
      candidateName: safeString(c.candidateName || c.name, 'Candidate'),
      email: c.email || '',
      phone: c.phone || '',
      appliedRole: c.appliedRole || 'Applicant',
      currentStage: c.currentStage || 'Screening',
      totalExperience: c.totalExperience || 0,
      skills: extractSkillNames(c.skills),
      location: c.location || 'India'
    }));
  }

  async _handleGetCandidateDetails(params = {}, actor) {
    const candIdNorm = normalizeText(params.candidateId);
    const candidate = DatabaseService.candidates.find(
      c => normalizeText(c.id) === candIdNorm || normalizeText(c.name || c.candidateName).includes(candIdNorm)
    );
    if (!candidate) throw new Error(`Candidate '${params.candidateId || 'Unknown'}' not found.`);
    return candidate;
  }

  async _handleCreateCandidate(params, actor) {
    const newId = `CND-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCand = {
      id: newId,
      candidateName: SanitizerService.escapeHtml(params.candidateName),
      name: SanitizerService.escapeHtml(params.candidateName),
      email: SanitizerService.sanitizeEmailHeader(params.email),
      phone: SanitizerService.escapeHtml(params.phone || ''),
      currentTitle: SanitizerService.escapeHtml(params.currentTitle || 'Professional'),
      currentCompany: SanitizerService.escapeHtml(params.currentCompany || 'N/A'),
      totalExperience: params.totalExperience || '0 yrs',
      skills: params.skills || [],
      location: SanitizerService.escapeHtml(params.location || 'Bangalore, India'),
      stage: 'Applied',
      currentStage: 'Applied',
      status: 'Active',
      source: 'PeopleWorks AI Copilot',
      createdAt: new Date().toISOString().split('T')[0],
      applications: [],
      interviews: [],
      timeline: [
        { id: `TL-${Date.now()}`, action: 'Candidate Created', actor: 'PeopleWorks AI', timestamp: new Date().toISOString(), details: 'Created via AI Copilot' }
      ]
    };

    DatabaseService.candidates.unshift(newCand);

    if (params.requisitionId) {
      const newApp = {
        id: `APP-2026-${(DatabaseService.applications.length + 1).toString().padStart(3, '0')}`,
        candidateId: newId,
        requisitionId: params.requisitionId,
        stage: 'Applied',
        status: 'Active',
        appliedAt: new Date().toISOString().split('T')[0],
        lastActivity: new Date().toISOString()
      };
      DatabaseService.applications.unshift(newApp);
    }

    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'CREATE_CANDIDATE',
      intent: 'create_candidate',
      entityType: 'Candidate',
      entityId: newId,
      details: `Created candidate '${newCand.candidateName}' (${newCand.email})`,
      actor
    });

    return newCand;
  }

  async _handleParseResumeDocument(params = {}, actor) {
    const fileName = params.fileName || 'Uploaded_Resume.pdf';
    return {
      fileName,
      candidateName: 'Rahul Kumar',
      email: 'rahul.kumar@example.com',
      phone: '+91 98765 43210',
      location: 'Bangalore, India',
      totalExperience: '4.5 yrs',
      currentTitle: 'Senior Java Developer',
      currentCompany: 'Technology Corp',
      skills: ['Java', 'Spring Boot', 'SQL', 'PostgreSQL', 'Docker', 'Kubernetes'],
      education: 'B.Tech in Computer Science',
      status: 'Extracted'
    };
  }

  async _handleCheckCandidateDuplicate(params = {}, actor) {
    const email = params.email;
    const phone = params.phone;
    const name = params.name;
    return await candidateService.checkDuplicate({ email, phone, name });
  }

  async _handleCreateCandidateFromResume(params = {}, actor) {
    return await this._handleCreateCandidate(params, actor);
  }

  async _handleUpdateCandidateContact(params, actor) {
    const cIdNorm = normalizeText(params.candidateId);
    const cIndex = DatabaseService.candidates.findIndex(
      c => normalizeText(c.id) === cIdNorm || normalizeText(c.name || c.candidateName) === cIdNorm
    );
    if (cIndex === -1) throw new Error(`Candidate '${params.candidateId}' not found.`);

    const cand = DatabaseService.candidates[cIndex];
    const beforeState = { email: cand.email, phone: cand.phone, location: cand.location };

    if (params.email) {
      const val = AIValidationService.validateCandidateUpdate('email', params.email);
      if (!val.isValid) throw new Error(val.error);
      cand.email = SanitizerService.sanitizeEmailHeader(params.email);
    }
    if (params.phone) {
      const val = AIValidationService.validateCandidateUpdate('phone', params.phone);
      if (!val.isValid) throw new Error(val.error);
      cand.phone = SanitizerService.escapeHtml(params.phone);
    }
    if (params.location) cand.location = SanitizerService.escapeHtml(params.location);
    if (params.currentTitle) cand.currentTitle = SanitizerService.escapeHtml(params.currentTitle);

    cand.updatedAt = new Date().toISOString();
    cand.timeline = cand.timeline || [];
    cand.timeline.unshift({
      id: `TL-${Date.now()}`,
      action: 'Contact Updated',
      actor: actor.name || 'PeopleWorks AI',
      timestamp: new Date().toISOString(),
      details: `Contact information updated via AI`
    });

    DatabaseService.candidates[cIndex] = { ...cand };
    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'UPDATE_CANDIDATE_CONTACT',
      intent: 'update_candidate',
      entityType: 'Candidate',
      entityId: cand.id,
      details: `Updated contact details for '${cand.candidateName || cand.name}'`,
      beforeState,
      afterState: { email: cand.email, phone: cand.phone, location: cand.location },
      actor
    });

    return cand;
  }

  async _handleMoveCandidateStage(params, actor) {
    const cIdNorm = normalizeText(params.candidateId);
    const cand = DatabaseService.candidates.find(c => normalizeText(c.id) === cIdNorm || normalizeText(c.name || c.candidateName) === cIdNorm);
    if (!cand) throw new Error(`Candidate '${params.candidateId}' not found.`);

    cand.currentStage = params.targetStage;
    cand.stage = params.targetStage;

    // Update matching application
    const app = DatabaseService.applications.find(a => a.candidateId === cand.id);
    if (app) {
      app.stage = params.targetStage;
      app.lastActivity = new Date().toISOString();
    }

    cand.timeline = cand.timeline || [];
    cand.timeline.unshift({
      id: `TL-${Date.now()}`,
      action: `Stage Changed: ${params.targetStage}`,
      actor: actor.name || 'PeopleWorks AI',
      timestamp: new Date().toISOString(),
      details: params.notes || `Promoted to ${params.targetStage} stage`
    });

    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'MOVE_CANDIDATE_STAGE',
      intent: 'move_stage',
      entityType: 'Candidate',
      entityId: cand.id,
      details: `Moved '${cand.candidateName || cand.name}' to stage '${params.targetStage}'`,
      actor
    });

    return { candidate: cand, targetStage: params.targetStage };
  }

  async _handleGetPendingJdApprovals(params = {}, actor) {
    let jds = DatabaseService.jds && DatabaseService.jds.length > 0 ? DatabaseService.jds : (INITIAL_JDS || []);
    const pendingJds = jds.filter(j => {
      const st = normalizeText(j.status);
      return st === 'pending approval' || st === 'pending' || st === 'in review' || st === 'submitted' || st === 'draft';
    });

    return {
      count: pendingJds.length,
      pendingJds,
      totalJds: jds.length
    };
  }

  async _handleScreenCandidate(params = {}, actor) {
    const candIdNorm = normalizeText(params.candidateId);
    let cand = DatabaseService.candidates.find(c => {
      if (c.id && normalizeText(c.id) === candIdNorm) return true;
      const name = normalizeText(c.candidateName || c.name);
      return name && candIdNorm && (name.includes(candIdNorm) || candIdNorm.includes(name));
    });

    if (!cand) {
      cand = DatabaseService.candidates?.[0] || {
        id: 'CND-1001',
        candidateName: 'Candidate',
        skills: ['React', 'TypeScript', 'JavaScript'],
        totalExperience: 4
      };
    }

    let targetJd = DatabaseService.jds?.find(j => {
      if (params.jdId && normalizeText(j.id) === normalizeText(params.jdId)) return true;
      if (params.requisitionId && normalizeText(j.requisitionId) === normalizeText(params.requisitionId)) return true;
      return false;
    });

    if (!targetJd) targetJd = DatabaseService.jds?.[0] || INITIAL_JDS?.[0] || {
      id: 'JD-2026-001',
      title: 'Senior Full Stack Engineer',
      skills: ['React', 'Node.js', 'TypeScript', 'SQL']
    };

    const candSkills = extractSkillNames(cand.skills).map(s => normalizeText(s));
    const jdSkills = extractSkillNames(targetJd.skills || ['React', 'Node.js', 'TypeScript', 'SQL']).map(s => normalizeText(s));

    const matchedSkills = jdSkills.filter(s => candSkills.some(cs => cs.includes(s) || s.includes(cs)));
    const missingSkills = jdSkills.filter(s => !matchedSkills.includes(s));

    const matchRatio = jdSkills.length > 0 ? (matchedSkills.length / jdSkills.length) : 0.8;
    const score = Math.round(matchRatio * 100);

    let recommendation = 'Shortlist';
    if (score < 50) recommendation = 'Reject';
    else if (score < 75) recommendation = 'Needs Recruiter Review';

    const candDisplayName = safeString(cand.candidateName || cand.name, 'Candidate');
    const jdTitle = safeString(targetJd.title, 'Role');

    return {
      candidateId: cand.id,
      candidateName: candDisplayName,
      jobTitle: jdTitle,
      screeningScore: score,
      recommendation,
      matchedSkills,
      missingSkills,
      totalExperience: cand.totalExperience || 'N/A',
      summary: `${candDisplayName} matches ${matchedSkills.length} of ${jdSkills.length} core technical requirements for ${jdTitle}.`
    };
  }

  async _handleGetInterviewSessions(params = {}, actor) {
    let sessions = DatabaseService.interviews || [];
    if (params.status && params.status !== 'All') {
      const stNorm = normalizeText(params.status);
      sessions = sessions.filter(s => normalizeText(s.status) === stNorm);
    }
    if (params.candidateId) {
      const cIdNorm = normalizeText(params.candidateId);
      sessions = sessions.filter(s => normalizeText(s.candidateId) === cIdNorm || normalizeText(s.candidateName).includes(cIdNorm));
    }
    return sessions;
  }

  async _handleScheduleInterview(params, actor) {
    const cIdNorm = normalizeText(params.candidateId);
    const cand = DatabaseService.candidates.find(c => normalizeText(c.id) === cIdNorm || normalizeText(c.name || c.candidateName) === cIdNorm);
    if (!cand) throw new Error(`Candidate '${params.candidateId}' not found.`);

    const val = AIValidationService.validateInterviewSchedule(params);
    if (!val.isValid) throw new Error(val.errors.join(' '));

    const sessionId = `INT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const roundName = params.roundName || 'Technical Interview Round 1';
    const date = params.scheduledDate;
    const time = params.startTime;

    const newSession = {
      id: sessionId,
      candidateId: cand.id,
      candidateName: cand.candidateName || cand.name,
      requisitionId: cand.requisitionId || 'REQ-2026-001',
      requisitionTitle: cand.appliedRole || 'Full Stack Engineer',
      roundName,
      roundCategory: params.roundCategory || 'TECHNICAL',
      scheduledDate: date,
      startTime: time,
      endTime: '12:00',
      durationMinutes: params.durationMinutes || 45,
      status: 'Scheduled',
      feedbackStatus: 'Pending',
      meetingProvider: 'teams',
      meetingUrl: `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${sessionId}`,
      interviewers: (params.interviewerNames || ['Alex Chen (HM)', 'Sarah Jenkins (Recruiter)']).map((name, i) => ({
        id: `INTVR-${i + 1}`,
        name,
        role: 'Panelist',
        email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@peopleworks.ai`
      })),
      policyName: 'Technical & System Design Interview Policy',
      policyVersion: 'v1.2'
    };

    DatabaseService.interviews.unshift(newSession);
    cand.currentStage = 'Interview';
    cand.stage = 'Interview';

    // Simulated Email Notification
    const emailPayload = notificationProviderAdapter.generateInterviewEmail({
      type: EMAIL_TEMPLATES.INTERVIEW_INVITATION,
      session: newSession,
      candidateName: newSession.candidateName,
      recruiterName: actor.name || 'Sarah Jenkins'
    });

    await notificationProviderAdapter.dispatchNotification({
      type: EMAIL_TEMPLATES.INTERVIEW_INVITATION,
      recipient: cand.email || 'candidate@example.com',
      title: emailPayload.subject,
      message: `Interview Scheduled: ${roundName} on ${date} at ${time}`,
      body: emailPayload.body
    });

    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'SCHEDULE_INTERVIEW',
      intent: 'schedule_interview',
      entityType: 'InterviewSession',
      entityId: sessionId,
      details: `Scheduled ${roundName} with ${newSession.candidateName} on ${date} at ${time}`,
      actor
    });

    return {
      session: newSession,
      meetingUrl: newSession.meetingUrl,
      notificationSent: true
    };
  }

  async _handleRescheduleInterview(params, actor) {
    const sIndex = DatabaseService.interviews.findIndex(s => s.id === params.sessionId);
    if (sIndex === -1) throw new Error(`Interview session '${params.sessionId}' not found.`);

    const session = DatabaseService.interviews[sIndex];
    session.scheduledDate = params.newDate;
    session.startTime = params.newStartTime;
    session.status = 'Scheduled';
    session.rescheduledReason = params.reason || 'Rescheduled via AI Copilot';

    DatabaseService.interviews[sIndex] = { ...session };
    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'RESCHEDULE_INTERVIEW',
      intent: 'reschedule_interview',
      entityType: 'InterviewSession',
      entityId: session.id,
      details: `Rescheduled ${session.roundName} to ${params.newDate} at ${params.newStartTime}`,
      actor
    });

    return session;
  }

  async _handleCancelInterview(params, actor) {
    const sIndex = DatabaseService.interviews.findIndex(s => s.id === params.sessionId);
    if (sIndex === -1) throw new Error(`Interview session '${params.sessionId}' not found.`);

    const session = DatabaseService.interviews[sIndex];
    session.status = 'Cancelled';
    session.cancellationReason = params.reason || 'Cancelled via AI Copilot';

    DatabaseService.interviews[sIndex] = { ...session };
    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'CANCEL_INTERVIEW',
      intent: 'cancel_interview',
      entityType: 'InterviewSession',
      entityId: session.id,
      details: `Cancelled interview ${session.roundName}. Reason: ${params.reason}`,
      actor
    });

    return session;
  }

  async _handleGenerateQuestions(params, actor) {
    const role = params.roleTitle || 'Senior Software Engineer';
    const skills = params.skills || ['React', 'Node.js', 'System Design'];
    return [
      {
        id: 'Q-1',
        category: 'Technical Architecture',
        question: `Can you explain how you would design a scalable microservices architecture for ${role} with high throughput?`,
        followUp: 'How do you handle distributed transactions and eventual consistency?'
      },
      {
        id: 'Q-2',
        category: 'Core Competency',
        question: `In your work with ${skills[0] || 'modern frameworks'}, what were the biggest performance bottlenecks and how did you resolve them?`,
        followUp: 'What metrics did you monitor to verify the fix?'
      },
      {
        id: 'Q-3',
        category: 'Behavioral & Leadership',
        question: 'Describe a situation where you had a strong technical disagreement with a teammate. How did you align on the final decision?',
        followUp: 'What was the business outcome?'
      }
    ];
  }

  async _handleSendEmail(params, actor) {
    const result = await notificationProviderAdapter.dispatchNotification({
      type: params.category || 'COMMUNICATION',
      recipient: params.recipient,
      title: params.subject,
      message: params.body
    });

    AIAuditService.logAction({
      action: 'SEND_SIMULATED_EMAIL',
      intent: 'send_email',
      entityType: 'Notification',
      entityId: `EML-${Date.now()}`,
      details: `Dispatched email to ${params.recipient} (${params.subject})`,
      actor
    });

    return {
      recipient: params.recipient,
      subject: params.subject,
      status: 'SENT',
      dispatchedAt: new Date().toISOString()
    };
  }

  async _handleExplainBlocker(params, actor) {
    if (params.entityType === 'requisition' || params.entityId?.startsWith('REQ')) {
      const req = DatabaseService.requisitions.find(r => r.id === params.entityId);
      if (!req) return { explanation: `Requisition ${params.entityId} was not found.` };
      const pendingStep = (req.approvalChain || []).find(s => s.status === 'Pending');
      if (pendingStep) {
        return {
          entityId: req.id,
          status: req.status,
          blocker: `Awaiting ${pendingStep.role} approval (${pendingStep.name || 'Approver'}).`,
          nextAction: `The ${pendingStep.role} must review and approve before this requisition can be published.`
        };
      }
      return { entityId: req.id, status: req.status, blocker: 'No active blockers found.' };
    }
    return { blocker: 'No blocking state detected.' };
  }
}

export const AIToolExecutor = new AIToolExecutorImpl();
