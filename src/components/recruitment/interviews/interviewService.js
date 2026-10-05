/**
 * Enterprise ATS Interview Service Layer
 * PeopleWorks SaaS - Complete Business Logic & State Engine
 */
import { 
  INITIAL_INTERVIEW_PLANS,
  INITIAL_INTERVIEW_SESSIONS,
  SCORECARD_TEMPLATES,
  INTERVIEWERS_ROSTER,
  INITIAL_AUDIT_LOGS
} from './interviewMockData';
import { 
  INTERVIEW_ROLES,
  SESSION_STATUS,
  FEEDBACK_STATUS,
  ROUND_OUTCOME_DECISION,
  FINAL_SELECTION_DECISION,
  FINAL_SELECTION_STATUS,
  hasInterviewPermission,
  canViewSession,
  INTERVIEW_PERMISSIONS,
  toLocalDateString
} from './interviewTypes';
import { meetingProviderAdapter } from './adapters/meetingProviderAdapter';
import { calendarProviderAdapter } from './adapters/calendarProviderAdapter';
import { notificationProviderAdapter, EMAIL_TEMPLATES } from './adapters/notificationProviderAdapter';
import { DatabaseService } from '../../../services/db/DatabaseService';
import { candidateService } from '../candidates/candidateService';
import { SecurityManager } from '../../../services/db/SecurityManager';
import { SanitizerService } from '../../../services/security/SanitizerService';
import { PolicyService } from '../../../services/policy/PolicyService';



class InterviewService {
  constructor() {
    this.STORAGE_KEY_SESSIONS = 'pw_interview_sessions';
    this.STORAGE_KEY_PLANS = 'pw_interview_plans';
    this.STORAGE_KEY_TEMPLATES = 'pw_interview_templates';
    this.STORAGE_KEY_AUDIT = 'pw_interview_audit_logs';
  }

  // --------------------------------------------------------------------------
  // Storage Helpers
  // --------------------------------------------------------------------------
  _getStorage(key, defaultData) {
    if (key === this.STORAGE_KEY_SESSIONS) {
      DatabaseService.init();
      return [...DatabaseService.interviews];
    }
    try {
      if (typeof window !== 'undefined') {
        const item = sessionStorage.getItem(key) || localStorage.getItem(key);
        if (item) return JSON.parse(item);
      }
    } catch (e) {
      console.warn(`Failed reading storage for ${key}`, e);
    }
    return defaultData;
  }

  _setStorage(key, data) {
    if (key === this.STORAGE_KEY_SESSIONS) {
      DatabaseService.interviews = data;
      DatabaseService.persistAll();
      return;
    }
    try {
      if (typeof window !== 'undefined') {
        const json = JSON.stringify(data);
        sessionStorage.setItem(key, json);
        localStorage.setItem(key, json);
      }
    } catch (e) {
      console.warn(`Failed writing storage for ${key}`, e);
    }
  }

  // --------------------------------------------------------------------------
  // Immutable Enterprise Audit Trail Logging Engine
  // --------------------------------------------------------------------------
  async logAuditEvent({ 
    actor = 'Current User',
    role = 'Recruiter',
    module = 'Interview Management',
    entityType = 'Application',
    entityId,
    action,
    oldValue = null,
    newValue = null,
    reason = '',
    metadata = {}
  }) {
    const logs = this._getStorage(this.STORAGE_KEY_AUDIT, INITIAL_AUDIT_LOGS);
    const counter = (logs.length + 1).toString().padStart(6, '0');
    const year = new Date().getFullYear();
    const newEntry = {
      auditId: `AUD-${year}-${counter}`,
      timestamp: new Date().toISOString(),
      actor: typeof actor === 'object' ? actor : { name: actor, role },
      role: typeof actor === 'object' ? actor.role || role : role,
      module,
      entityType,
      entityId: entityId || metadata.applicationId || metadata.interviewId || `ENT-${counter}`,
      action,
      oldValue: oldValue ? String(oldValue) : null,
      newValue: newValue ? String(newValue) : null,
      reason,
      metadata: {
        candidateId: metadata.candidateId || null,
        applicationId: metadata.applicationId || null,
        requisitionId: metadata.requisitionId || null,
        interviewId: metadata.interviewId || null,
        interviewPlanId: metadata.interviewPlanId || null,
        roundId: metadata.roundId || null,
        ...metadata
      }
    };
    const updated = [newEntry, ...logs];
    this._setStorage(this.STORAGE_KEY_AUDIT, updated);
    return newEntry;
  }

  async getAuditLogs() {
    return this._getStorage(this.STORAGE_KEY_AUDIT, INITIAL_AUDIT_LOGS);
  }

  // --------------------------------------------------------------------------
  // Interview Plans & Templates
  // --------------------------------------------------------------------------
  async getInterviewPlans() {
    return this._getStorage(this.STORAGE_KEY_PLANS, INITIAL_INTERVIEW_PLANS);
  }

  async getInterviewPlanById(planId) {
    const plans = await this.getInterviewPlans();
    return plans.find(p => p.id === planId) || null;
  }

  async saveInterviewPlan(planData, actor = 'ATS Admin') {
    const plans = await this.getInterviewPlans();
    let updated;
    const isNew = !planData.id || !plans.some(p => p.id === planData.id);

    if (isNew) {
      const newPlan = {
        ...planData,
        id: planData.id || `PLAN-${Date.now().toString(36).toUpperCase()}`,
        roundsCount: planData.rounds?.length || 0,
        isActive: planData.isActive ?? true,
        createdBy: actor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updated = [newPlan, ...plans];
      await this.logAuditEvent({
        actor,
        action: 'Interview Plan Created',
        entity: 'Interview Plan',
        entityId: newPlan.id,
        newValue: `${newPlan.name} (${newPlan.roundsCount} rounds)`
      });
    } else {
      updated = plans.map(p => {
        if (p.id === planData.id) {
          return {
            ...p,
            ...planData,
            roundsCount: planData.rounds?.length || p.rounds?.length || 0,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      await this.logAuditEvent({
        actor,
        action: 'Interview Plan Updated',
        entity: 'Interview Plan',
        entityId: planData.id,
        newValue: planData.name
      });
    }

    this._setStorage(this.STORAGE_KEY_PLANS, updated);
    return updated.find(p => p.id === planData.id) || updated[0];
  }

  async deleteInterviewPlan(planId, actor = 'ATS Admin') {
    const plans = await this.getInterviewPlans();
    const target = plans.find(p => p.id === planId);
    const updated = plans.filter(p => p.id !== planId);
    this._setStorage(this.STORAGE_KEY_PLANS, updated);

    if (target) {
      await this.logAuditEvent({
        actor,
        action: 'Interview Plan Deleted',
        entity: 'Interview Plan',
        entityId: planId,
        newValue: target.name
      });
    }
    return updated;
  }

  async getScorecardTemplates() {
    return this._getStorage(this.STORAGE_KEY_TEMPLATES, SCORECARD_TEMPLATES);
  }

  async getInterviewersRoster() {
    return INTERVIEWERS_ROSTER;
  }

  // --------------------------------------------------------------------------
  // Conflict & Availability Detection Engine
  // --------------------------------------------------------------------------
  async checkAvailabilityAndConflicts({ candidateId = null, interviewerIds = [], date, startTime, endTime, timezone, excludeSessionId = null }) {
    if (!date || !startTime || !endTime || (!interviewerIds.length && !candidateId)) {
      return { hasConflict: false, conflicts: [] };
    }

    const sessions = await this.getInterviewSessions({ page: 1, pageSize: 500 });
    const conflicts = [];

    // Parse time to minutes for robust overlap math
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const targetStart = toMinutes(startTime);
    const targetEnd = toMinutes(endTime);

    if (targetEnd <= targetStart) {
      return {
        hasConflict: true,
        conflicts: [{
          type: 'INVALID_DURATION',
          message: 'End time must be strictly after start time.'
        }]
      };
    }

    // Filter active sessions on the same date
    const sameDaySessions = sessions.filter(s => 
      s.scheduledDate === date && 
      s.id !== excludeSessionId &&
      s.status !== SESSION_STATUS.CANCELLED &&
      s.status !== SESSION_STATUS.RESCHEDULED
    );

    for (const session of sameDaySessions) {
      const sessStart = toMinutes(session.startTime);
      const sessEnd = toMinutes(session.endTime);

      // Check overlap: (StartA < EndB) and (EndA > StartB)
      const isOverlapping = targetStart < sessEnd && targetEnd > sessStart;

      if (isOverlapping) {
        // Check if any interviewer is shared
        const overlappingInterviewers = (session.interviewers || []).filter(int => 
          interviewerIds.includes(int.id)
        );

        if (overlappingInterviewers.length > 0) {
          conflicts.push({
            type: 'INTERVIEWER_OVERLAP',
            sessionId: session.id,
            candidateName: session.candidateName,
            roundName: session.roundName,
            time: `${session.startTime} - ${session.endTime}`,
            conflictedInterviewers: overlappingInterviewers.map(i => i.name),
            message: `${overlappingInterviewers.map(i => i.name).join(', ')} already has '${session.roundName}' with ${session.candidateName} at ${session.startTime}-${session.endTime}.`
          });
        }
        
        if (candidateId && session.candidateId === candidateId) {
          conflicts.push({
            type: 'CANDIDATE_OVERLAP',
            sessionId: session.id,
            candidateName: session.candidateName,
            roundName: session.roundName,
            time: `${session.startTime} - ${session.endTime}`,
            message: `Candidate ${session.candidateName} is already scheduled for '${session.roundName}' at ${session.startTime}-${session.endTime}.`
          });
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  }

  // --------------------------------------------------------------------------
  // Round Eligibility & Prerequisite Engine
  // --------------------------------------------------------------------------
  async validateRoundEligibility(applicationId, roundId, planId) {
    if (!applicationId || !roundId) {
      return { isEligible: false, reason: 'Missing Application or Round identifier.' };
    }

    const plan = await this.getInterviewPlanById(planId);
    if (!plan) {
      return { isEligible: false, reason: 'Interview Plan not found for this requisition.' };
    }

    const roundIndex = (plan.rounds || []).findIndex(r => r.id === roundId);
    if (roundIndex === -1) {
      return { isEligible: false, reason: 'Configured round not found in the plan.' };
    }

    const round = plan.rounds[roundIndex];
    const allSessions = await this.getInterviewSessions({ page: 1, pageSize: 500 });
    const appSessions = allSessions.filter(s => s.applicationId === applicationId);

    // Rule 1: Fail Fast - If any previous required round failed, stop workflow
    const failedPriorSession = appSessions.find(s => {
      const rIdx = (plan.rounds || []).findIndex(r => r.id === s.roundId);
      const isReq = (plan.rounds[rIdx]?.requiredToPass ?? true);
      return rIdx !== -1 && rIdx < roundIndex && isReq && s.roundOutcome === ROUND_OUTCOME_DECISION.FAIL;
    });

    if (failedPriorSession) {
      return {
        isEligible: false,
        reason: `Interview workflow stopped: Candidate failed required round '${failedPriorSession.roundName}'. Subsequent rounds cannot be scheduled.`
      };
    }

    // Rule 2: Check prerequisite round (if required)
    if (round.prerequisiteRoundId) {
      const prereqRound = (plan.rounds || []).find(r => r.id === round.prerequisiteRoundId);
      const prereqSession = appSessions.find(s => s.roundId === round.prerequisiteRoundId);

      if (prereqRound?.requiredToPass !== false) {
        if (!prereqSession) {
          return {
            isEligible: false,
            reason: `Prerequisite round '${prereqRound?.name || 'Previous Round'}' has not been scheduled yet.`
          };
        }

        if (prereqSession.roundOutcome !== ROUND_OUTCOME_DECISION.PASS) {
          return {
            isEligible: false,
            reason: `Prerequisite round '${prereqRound?.name || 'Previous Round'}' must be Evaluated & Passed before scheduling ${round.name}. Current outcome: ${prereqSession.roundOutcome || 'Pending'}.`
          };
        }
      }
    }

    return {
      isEligible: true,
      round,
      plan
    };
  }

  // --------------------------------------------------------------------------
  // Interview Sessions CRUD & Operations
  // --------------------------------------------------------------------------
  async getInterviewSessions(options = {}) {
    const {
      page = 1,
      pageSize = 100,
      search = '',
      userRole = INTERVIEW_ROLES.ATS_ADMIN,
      userContext = {},
      filters = {},
      sortBy = 'scheduledDate',
      sortOrder = 'desc'
    } = options;

    let sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);

    // 1. Centralized Role-based Scope Filtering
    sessions = sessions.filter(session => canViewSession(userRole, userContext, session));

    // 2. Search query filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      sessions = sessions.filter(s => 
        s.candidateName?.toLowerCase().includes(q) ||
        s.requisitionTitle?.toLowerCase().includes(q) ||
        s.requisitionId?.toLowerCase().includes(q) ||
        s.roundName?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q) ||
        (s.interviewers || []).some(i => i.name?.toLowerCase().includes(q))
      );
    }

    // 3. Dropdown Filters
    if (filters.status && filters.status !== 'All') {
      sessions = sessions.filter(s => s.status === filters.status);
    }
    if (filters.feedbackStatus && filters.feedbackStatus !== 'All') {
      sessions = sessions.filter(s => s.feedbackStatus === filters.feedbackStatus);
    }
    if (filters.requisitionId && filters.requisitionId !== 'All') {
      sessions = sessions.filter(s => s.requisitionId === filters.requisitionId);
    }
    if (filters.roundCategory && filters.roundCategory !== 'All') {
      sessions = sessions.filter(s => s.roundCategory === filters.roundCategory);
    }
    if (filters.interviewType && filters.interviewType !== 'All') {
      sessions = sessions.filter(s => s.interviewType === filters.interviewType);
    }

    // 4. Sorting
    sessions.sort((a, b) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    return sessions;
  }

  async getInterviewSessionById(sessionId) {
    const sessions = await this.getInterviewSessions({ page: 1, pageSize: 500 });
    return sessions.find(s => s.id === sessionId) || null;
  }

  async scheduleInterviewSession(sessionData, actor = 'Sarah Jenkins (Recruiter)') {
    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);

    // Validate conflict
    const conflictCheck = await this.checkAvailabilityAndConflicts({
      candidateId: sessionData.candidateId,
      interviewerIds: (sessionData.interviewers || []).map(i => i.id),
      date: sessionData.scheduledDate,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      timezone: sessionData.timezone
    });

    if (conflictCheck.hasConflict && !sessionData.allowConflictOverride) {
      throw new Error(conflictCheck.conflicts[0]?.message || 'Scheduling conflict detected.');
    }

    // Generate meeting via adapter
    const meetingDetails = await meetingProviderAdapter.createMeeting({
      provider: sessionData.meetingProvider,
      title: `${sessionData.roundName} - ${sessionData.candidateName}`,
      startTime: `${sessionData.scheduledDate}T${sessionData.startTime}:00Z`,
      endTime: `${sessionData.scheduledDate}T${sessionData.endTime}:00Z`
    });

    // Resolve applicable policy for this interview
    let assignedPolicy = sessionData.policyId ? PolicyService.getPolicyById(sessionData.policyId) : null;
    let policyAssignmentSource = sessionData.policyAssignmentSource || 'none';

    if (!assignedPolicy) {
      const resolved = PolicyService.resolvePolicyForInterview({
        roundId: sessionData.roundId,
        requisitionId: sessionData.requisitionId,
        roundCategory: sessionData.roundCategory,
        interviewType: sessionData.interviewType
      });
      assignedPolicy = resolved.policy;
      policyAssignmentSource = resolved.source;
    }

    const policyId = assignedPolicy ? assignedPolicy.id : (sessionData.policyId || null);
    const policyVersion = assignedPolicy ? (sessionData.policyVersion || assignedPolicy.version) : (sessionData.policyVersion || null);
    const policyName = assignedPolicy ? assignedPolicy.name : (sessionData.policyName || null);
    const policyType = assignedPolicy ? assignedPolicy.type : (sessionData.policyType || null);
    const policyRequired = !!assignedPolicy?.required;
    const candidatePolicyRequired = !!assignedPolicy?.rules?.candidateAcknowledgement?.required;
    const interviewerPolicyRequired = !!assignedPolicy?.rules?.interviewerAcknowledgement?.required;

    const newSession = {
      id: `INT-SESS-${Date.now().toString(36).toUpperCase()}`,
      applicationId: sessionData.applicationId,
      candidateId: sessionData.candidateId,
      candidateName: sessionData.candidateName,
      candidateAvatar: sessionData.candidateAvatar || 'CD',
      candidateAvatarBg: sessionData.candidateAvatarBg || '#0284c7',
      candidateEmail: sessionData.candidateEmail,
      requisitionId: sessionData.requisitionId,
      requisitionTitle: sessionData.requisitionTitle,
      department: sessionData.department || 'Engineering',
      planId: sessionData.planId,
      roundId: sessionData.roundId,
      roundName: sessionData.roundName,
      roundCategory: sessionData.roundCategory,
      roundSubtype: sessionData.roundSubtype,
      roundSequence: sessionData.roundSequence || 1,
      status: SESSION_STATUS.SCHEDULED,
      scheduledDate: sessionData.scheduledDate,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      duration: Number(sessionData.duration) || 60,
      timezone: sessionData.timezone || 'America/Los_Angeles (PST)',
      interviewType: sessionData.interviewType,
      meetingProvider: sessionData.meetingProvider,
      meetingUrl: sessionData.meetingUrl || meetingDetails.meetingUrl,
      meetingId: meetingDetails.meetingId,
      location: sessionData.location || null,
      room: sessionData.room || null,
      interviewers: sessionData.interviewers || [],
      scorecardTemplateId: sessionData.scorecardTemplateId || 'SCT-TECH-01',
      feedbackStatus: FEEDBACK_STATUS.PENDING,
      roundOutcome: ROUND_OUTCOME_DECISION.NOT_EVALUATED,
      createdBy: actor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Policy Integration Attributes
      policyId,
      policyVersion,
      policyName,
      policyType,
      policyAssignmentSource,
      policyRequired,
      candidatePolicyRequired,
      interviewerPolicyRequired,
      candidatePolicyAccepted: sessionData.candidatePolicyAccepted || false,
      candidatePolicyAcceptedAt: sessionData.candidatePolicyAcceptedAt || null,
      candidatePolicyEvidenceId: sessionData.candidatePolicyEvidenceId || null,
      interviewerPolicyAcceptances: sessionData.interviewerPolicyAcceptances || {},
      scorecards: (sessionData.interviewers || []).map(int => ({
        interviewerId: int.id,
        interviewerName: int.name,
        status: FEEDBACK_STATUS.PENDING,
        submittedAt: null,
        recommendation: null,
        overallRating: 0,
        ratings: {},
        comments: '',
        isLocked: false
      })),
      customInstructions: sessionData.customInstructions || sessionData.candidateInstructions || '',
      emailNotified: false,
      emailNotifiedAt: null,
      emailDeliveryStatus: 'PENDING',
      emailError: null,
      timeline: [
        {
          id: `TL-${Date.now()}`,
          action: 'Interview Scheduled',
          actor,
          timestamp: new Date().toISOString(),
          notes: `Scheduled ${sessionData.roundName} with ${sessionData.candidateName} for ${sessionData.scheduledDate} at ${sessionData.startTime}.${policyName ? ` Assigned Policy: ${policyName} ${policyVersion}.` : ''}`
        }
      ]
    };

    // 1. Sync Calendar event
    await calendarProviderAdapter.syncEvent({
      eventId: newSession.id,
      title: `${newSession.roundName} - ${newSession.candidateName}`,
      startTime: `${newSession.scheduledDate}T${newSession.startTime}:00Z`,
      endTime: `${newSession.scheduledDate}T${newSession.endTime}:00Z`,
      meetingUrl: newSession.meetingUrl,
      location: newSession.location
    });

    // 2. Build & Dispatch Candidate Interview Invitation Email
    const emailPayload = notificationProviderAdapter.generateInterviewEmail({
      type: EMAIL_TEMPLATES.INTERVIEW_INVITATION,
      session: newSession,
      customInstructions: newSession.customInstructions,
      recruiterName: actor
    });

    const emailResult = await notificationProviderAdapter.dispatchNotification({
      type: EMAIL_TEMPLATES.INTERVIEW_INVITATION,
      recipient: emailPayload.recipient,
      title: emailPayload.subject,
      message: `Interview Invitation: ${newSession.roundName}`,
      body: emailPayload.body,
      metadata: {
        sessionId: newSession.id,
        applicationId: newSession.applicationId,
        requisitionId: newSession.requisitionId,
        roundName: newSession.roundName
      }
    });

    // Update email notification statuses on session
    if (emailResult.status === 'SENT') {
      newSession.emailNotified = true;
      newSession.emailNotifiedAt = emailResult.sentAt;
      newSession.emailDeliveryStatus = 'SENT';
      newSession.emailMessageId = emailResult.id;
    } else {
      newSession.emailNotified = false;
      newSession.emailDeliveryStatus = 'FAILED';
      newSession.emailError = emailResult.error || 'Email dispatch failed';
    }

    // 3. Persist Candidate Communication Record
    await candidateService.addCandidateCommunication(newSession.candidateId, {
      type: 'EMAIL',
      category: 'INTERVIEW_INVITATION',
      subject: emailPayload.subject,
      sender: `${actor} <recruitment@peopleworks.ai>`,
      recipient: emailPayload.recipient,
      body: emailPayload.body,
      snippet: `Interview Invitation for ${newSession.roundName} on ${newSession.scheduledDate} at ${newSession.startTime} (${newSession.timezone})`,
      status: emailResult.status,
      error: emailResult.error,
      timestamp: new Date().toISOString(),
      metadata: {
        sessionId: newSession.id,
        roundName: newSession.roundName,
        meetingUrl: newSession.meetingUrl,
        location: newSession.location,
        deliveryMethod: newSession.interviewType
      }
    });

    // 4. Update Candidate Application Timeline
    await candidateService.addApplicationTimelineEvent(newSession.applicationId, {
      action: 'Interview Scheduled & Invitation Dispatched',
      user: actor,
      timestamp: new Date().toISOString(),
      details: `Scheduled ${newSession.roundName} on ${newSession.scheduledDate} at ${newSession.startTime}. Invitation email dispatched to ${emailPayload.recipient} (${emailResult.status}).`
    });

    // 5. Notify Internal Interviewers / Panelists
    for (const interviewer of newSession.interviewers || []) {
      if (interviewer.email) {
        await notificationProviderAdapter.dispatchNotification({
          type: EMAIL_TEMPLATES.INTERVIEWER_ASSIGNMENT,
          recipient: interviewer.email,
          title: `Interview Assignment: ${newSession.candidateName} - ${newSession.roundName}`,
          message: `You are assigned to interview ${newSession.candidateName} for ${newSession.roundName} on ${newSession.scheduledDate} at ${newSession.startTime}.`,
          body: `Hi ${interviewer.name},\n\nYou have been scheduled as an interviewer for ${newSession.candidateName} (${newSession.requisitionTitle}).\nDate: ${newSession.scheduledDate} ${newSession.startTime}-${newSession.endTime} (${newSession.timezone})\nMeeting: ${newSession.meetingUrl || newSession.location || 'Video'}\n\nPlease prepare your evaluation scorecard ahead of time.`
        });
      }
    }

    const updatedSessions = [newSession, ...sessions];
    this._setStorage(this.STORAGE_KEY_SESSIONS, updatedSessions);

    await this.logAuditEvent({
      actor,
      action: 'Interview Scheduled',
      entity: 'Interview Session',
      entityId: newSession.id,
      newValue: `${newSession.roundName} on ${newSession.scheduledDate} at ${newSession.startTime} (Email: ${emailResult.status})`
    });

    return newSession;
  }

  async rescheduleInterviewSession(sessionId, newSlotData, reason, actor = 'Sarah Jenkins (Recruiter)') {
    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);
    let target = sessions.find(s => s.id === sessionId);
    if (!target) throw new Error('Interview session not found.');

    const oldSlot = `${target.scheduledDate} ${target.startTime}-${target.endTime}`;
    const newSlot = `${newSlotData.scheduledDate} ${newSlotData.startTime}-${newSlotData.endTime}`;

    const updatedSession = {
      ...target,
      scheduledDate: newSlotData.scheduledDate,
      startTime: newSlotData.startTime,
      endTime: newSlotData.endTime,
      timezone: newSlotData.timezone || target.timezone,
      status: SESSION_STATUS.RESCHEDULED,
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `TL-${Date.now()}`,
          action: 'Interview Rescheduled',
          actor,
          timestamp: new Date().toISOString(),
          notes: `Rescheduled from ${oldSlot} to ${newSlot}. Reason: ${reason}`
        },
        ...(target.timeline || [])
      ]
    };

    // Dispatch Reschedule Email
    const emailPayload = notificationProviderAdapter.generateInterviewEmail({
      type: EMAIL_TEMPLATES.INTERVIEW_RESCHEDULED,
      session: updatedSession,
      customInstructions: reason,
      recruiterName: actor
    });

    const emailResult = await notificationProviderAdapter.dispatchNotification({
      type: EMAIL_TEMPLATES.INTERVIEW_RESCHEDULED,
      recipient: emailPayload.recipient,
      title: emailPayload.subject,
      message: `Interview Rescheduled: ${updatedSession.roundName}`,
      body: emailPayload.body,
      metadata: { sessionId, oldSlot, newSlot, reason }
    });

    // Add communication & timeline entry
    await candidateService.addCandidateCommunication(updatedSession.candidateId, {
      type: 'EMAIL',
      category: 'INTERVIEW_RESCHEDULED',
      subject: emailPayload.subject,
      sender: `${actor} <recruitment@peopleworks.ai>`,
      recipient: emailPayload.recipient,
      body: emailPayload.body,
      snippet: `Interview Rescheduled for ${updatedSession.roundName} to ${newSlot}. Reason: ${reason}`,
      status: emailResult.status,
      timestamp: new Date().toISOString()
    });

    await candidateService.addApplicationTimelineEvent(updatedSession.applicationId, {
      action: 'Interview Rescheduled',
      user: actor,
      timestamp: new Date().toISOString(),
      details: `Rescheduled from ${oldSlot} to ${newSlot}. Candidate email notification sent (${emailResult.status}).`
    });

    // Notify Interviewers
    for (const interviewer of updatedSession.interviewers || []) {
      if (interviewer.email) {
        await notificationProviderAdapter.dispatchNotification({
          type: EMAIL_TEMPLATES.INTERVIEWER_ASSIGNMENT,
          recipient: interviewer.email,
          title: `Interview Rescheduled: ${updatedSession.candidateName} - ${updatedSession.roundName}`,
          message: `Interview with ${updatedSession.candidateName} has been rescheduled to ${newSlot}. Reason: ${reason}`
        });
      }
    }

    const updated = sessions.map(s => s.id === sessionId ? updatedSession : s);
    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    await this.logAuditEvent({
      actor,
      action: 'Interview Rescheduled',
      entity: 'Interview Session',
      entityId: sessionId,
      oldValue: oldSlot,
      newValue: newSlot,
      reason
    });

    return updatedSession;
  }

  async cancelInterviewSession(sessionId, reason, actor = 'Sarah Jenkins (Recruiter)') {
    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);
    let target = sessions.find(s => s.id === sessionId);
    if (!target) throw new Error('Interview session not found.');

    const updatedSession = {
      ...target,
      status: SESSION_STATUS.CANCELLED,
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `TL-${Date.now()}`,
          action: 'Interview Cancelled',
          actor,
          timestamp: new Date().toISOString(),
          notes: `Cancelled by ${actor}. Reason: ${reason}`
        },
        ...(target.timeline || [])
      ]
    };

    // Dispatch Cancellation Email
    const emailPayload = notificationProviderAdapter.generateInterviewEmail({
      type: EMAIL_TEMPLATES.INTERVIEW_CANCELLED,
      session: target,
      customInstructions: reason,
      recruiterName: actor
    });

    const emailResult = await notificationProviderAdapter.dispatchNotification({
      type: EMAIL_TEMPLATES.INTERVIEW_CANCELLED,
      recipient: emailPayload.recipient,
      title: emailPayload.subject,
      message: `Interview Cancelled: ${target.roundName}`,
      body: emailPayload.body,
      metadata: { sessionId, reason }
    });

    // Add communication & timeline entry
    await candidateService.addCandidateCommunication(target.candidateId, {
      type: 'EMAIL',
      category: 'INTERVIEW_CANCELLED',
      subject: emailPayload.subject,
      sender: `${actor} <recruitment@peopleworks.ai>`,
      recipient: emailPayload.recipient,
      body: emailPayload.body,
      snippet: `Interview Cancelled for ${target.roundName}. Reason: ${reason}`,
      status: emailResult.status,
      timestamp: new Date().toISOString()
    });

    await candidateService.addApplicationTimelineEvent(target.applicationId, {
      action: 'Interview Cancelled',
      user: actor,
      timestamp: new Date().toISOString(),
      details: `Interview cancelled by ${actor}. Reason: ${reason}. Notification dispatched to candidate (${emailResult.status}).`
    });

    // Notify Interviewers
    for (const interviewer of target.interviewers || []) {
      if (interviewer.email) {
        await notificationProviderAdapter.dispatchNotification({
          type: EMAIL_TEMPLATES.INTERVIEWER_ASSIGNMENT,
          recipient: interviewer.email,
          title: `Interview Cancelled: ${target.candidateName} - ${target.roundName}`,
          message: `Scheduled interview with ${target.candidateName} on ${target.scheduledDate} has been cancelled. Reason: ${reason}`
        });
      }
    }

    const updated = sessions.map(s => s.id === sessionId ? updatedSession : s);
    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    await this.logAuditEvent({
      actor,
      action: 'Interview Cancelled',
      entity: 'Interview Session',
      entityId: sessionId,
      oldValue: 'Active',
      newValue: 'Cancelled',
      reason
    });

    return true;
  }

  async deleteInterviewSession(sessionId, actor = 'Sarah Jenkins (Recruiter)') {
    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);
    const target = sessions.find(s => s.id === sessionId);
    const updated = sessions.filter(s => s.id !== sessionId);
    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    await this.logAuditEvent({
      actor,
      action: 'Interview Deleted',
      entity: 'Interview Session',
      entityId: sessionId,
      oldValue: target ? target.status : 'Active',
      newValue: 'Deleted',
      reason: 'Permanently deleted by user'
    });

    return updated;
  }

  async deleteInterviewSessions(sessionIds, actor = 'Sarah Jenkins (Recruiter)') {
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) return [];
    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);
    const updated = sessions.filter(s => !sessionIds.includes(s.id));
    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    for (const id of sessionIds) {
      await this.logAuditEvent({
        actor,
        action: 'Interview Bulk Deleted',
        entity: 'Interview Session',
        entityId: id,
        oldValue: 'Active',
        newValue: 'Deleted',
        reason: 'Bulk deleted by user'
      });
    }

    return updated;
  }


  async recordNoShow(sessionId, party, notes, actor = 'Sarah Jenkins (Recruiter)') {
    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);
    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          status: SESSION_STATUS.NO_SHOW,
          noShowParty: party,
          updatedAt: new Date().toISOString(),
          timeline: [
            {
              id: `TL-${Date.now()}`,
              action: `No Show Recorded (${party})`,
              actor,
              timestamp: new Date().toISOString(),
              notes: `No show recorded for ${party}. Notes: ${notes}`
            },
            ...(s.timeline || [])
          ]
        };
      }
      return s;
    });

    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    await this.logAuditEvent({
      actor,
      action: 'No Show Recorded',
      entity: 'Interview Session',
      entityId: sessionId,
      oldValue: 'Active',
      newValue: `NO_SHOW (${party})`,
      reason: notes
    });

    return true;
  }

  // --------------------------------------------------------------------------
  // Policy & Integrity Integration Engine
  // --------------------------------------------------------------------------
  updateCandidatePolicyStatus(sessionId, options = {}) {
    const opts = typeof options === 'boolean' ? { accepted: options } : (options || {});
    const {
      accepted = true,
      acceptedAt = new Date().toISOString(),
      evidenceId = null,
      policyVersion = null,
      actor = 'Candidate'
    } = opts;

    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);
    let target = sessions.find(s => s.id === sessionId);
    if (!target) throw new Error('Interview session not found.');

    const updatedSession = {
      ...target,
      candidatePolicyAccepted: accepted,
      candidatePolicyAcceptedAt: acceptedAt,
      candidatePolicyEvidenceId: evidenceId,
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `TL-${Date.now()}`,
          action: 'Candidate Policy Accepted',
          actor,
          timestamp: acceptedAt,
          notes: `Candidate completed policy acknowledgement and readiness verification for ${target.policyName || 'Interview Policy'} (${policyVersion || target.policyVersion || 'v1.0'}). Evidence: ${evidenceId || 'CLIENT-VERIFIED'}`
        },
        ...(target.timeline || [])
      ]
    };

    const updated = sessions.map(s => s.id === sessionId ? updatedSession : s);
    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    this.logAuditEvent({
      actor,
      action: 'Candidate Policy Accepted',
      entity: 'Interview Session',
      entityId: sessionId,
      newValue: `Accepted ${target.policyName || 'Policy'} ${target.policyVersion || ''} (Evidence: ${evidenceId || 'CLIENT-VERIFIED'})`
    });

    return updatedSession;
  }

  updateInterviewerPolicyStatus(sessionId, interviewerId, interviewerNameOrOptions = 'Interviewer', acceptedParam = true) {
    let opts = {};
    if (typeof interviewerNameOrOptions === 'object' && interviewerNameOrOptions !== null) {
      opts = interviewerNameOrOptions;
    } else {
      opts = {
        interviewerName: typeof interviewerNameOrOptions === 'string' ? interviewerNameOrOptions : 'Interviewer',
        accepted: typeof acceptedParam === 'boolean' ? acceptedParam : true
      };
    }

    const {
      accepted = true,
      acceptedAt = new Date().toISOString(),
      policyVersion = null,
      interviewerName = 'Interviewer',
      actor = null
    } = opts;

    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);
    let target = sessions.find(s => s.id === sessionId);
    if (!target) throw new Error('Interview session not found.');

    const effectiveActor = actor || interviewerName || `Interviewer (${interviewerId})`;
    const targetVersion = policyVersion || target.policyVersion || 'v1.0';

    // Record in central PolicyService
    PolicyService.recordInterviewerAcceptance({
      interviewerId,
      interviewerName,
      policyId: target.policyId,
      policyVersion: targetVersion,
      interviewId: target.id
    });

    const updatedAcceptances = {
      ...(target.interviewerPolicyAcceptances || {}),
      [interviewerId]: {
        accepted,
        acceptedAt,
        policyVersion: targetVersion,
        interviewerName
      }
    };

    const updatedSession = {
      ...target,
      interviewerPolicyAcceptances: updatedAcceptances,
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `TL-${Date.now()}`,
          action: 'Interviewer Policy Accepted',
          actor: effectiveActor,
          timestamp: acceptedAt,
          notes: `${interviewerName} acknowledged Interviewer Policy & Code of Conduct for ${target.policyName || 'Policy'} (${targetVersion}).`
        },
        ...(target.timeline || [])
      ]
    };

    const updated = sessions.map(s => s.id === sessionId ? updatedSession : s);
    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    this.logAuditEvent({
      actor: effectiveActor,
      action: 'Interviewer Policy Accepted',
      entity: 'Interview Session',
      entityId: sessionId,
      newValue: `${interviewerName} accepted ${target.policyName || 'Policy'} ${targetVersion}`
    });

    return updatedSession;
  }

  // --------------------------------------------------------------------------
  // Scorecard & Feedback Engine
  // --------------------------------------------------------------------------
  async submitScorecardFeedback(sessionId, interviewerId, feedbackData, actor = 'Interviewer') {
    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);
    let target = sessions.find(s => s.id === sessionId);
    if (!target) throw new Error('Interview session not found.');

    const targetScorecard = (target.scorecards || []).find(sc => sc.interviewerId === interviewerId);
    if (targetScorecard && targetScorecard.isLocked && targetScorecard.status === FEEDBACK_STATUS.SUBMITTED) {
      throw new Error('Security Violation: Submitted scorecards are permanently locked and cannot be overwritten.');
    }

    const sanitizedComments = SanitizerService.sanitizeText(feedbackData.comments || '');

    const updatedScorecards = (target.scorecards || []).map(sc => {
      if (sc.interviewerId === interviewerId) {
        return {
          ...sc,
          status: FEEDBACK_STATUS.SUBMITTED,
          submittedAt: new Date().toISOString(),
          recommendation: feedbackData.recommendation,
          overallRating: Number(feedbackData.overallRating) || 0,
          ratings: feedbackData.ratings || {},
          evidence: feedbackData.evidence || {},
          comments: sanitizedComments,
          isLocked: true
        };
      }
      return sc;
    });


    // Check if all interviewers submitted
    const allSubmitted = updatedScorecards.every(sc => sc.status === FEEDBACK_STATUS.SUBMITTED);
    const overallFeedbackStatus = allSubmitted ? FEEDBACK_STATUS.SUBMITTED : FEEDBACK_STATUS.PENDING;

    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          scorecards: updatedScorecards,
          feedbackStatus: overallFeedbackStatus,
          status: allSubmitted ? SESSION_STATUS.COMPLETED : s.status,
          updatedAt: new Date().toISOString(),
          timeline: [
            {
              id: `TL-${Date.now()}`,
              action: 'Scorecard Submitted',
              actor,
              timestamp: new Date().toISOString(),
              notes: `Recommendation: ${feedbackData.recommendation} (${feedbackData.overallRating}/5)`
            },
            ...(s.timeline || [])
          ]
        };
      }
      return s;
    });

    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    await this.logAuditEvent({
      actor,
      action: 'Scorecard Submitted',
      entity: 'Scorecard',
      entityId: sessionId,
      newValue: `${feedbackData.recommendation} (${feedbackData.overallRating}/5)`
    });

    return updated.find(s => s.id === sessionId);
  }

  // --------------------------------------------------------------------------
  // Round Outcome & 2-Tier Final Candidate Decision
  // --------------------------------------------------------------------------
  async decideRoundOutcome(sessionId, decision, notes, actor = 'Alex Chen (Hiring Manager)') {
    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);
    let target = sessions.find(s => s.id === sessionId);
    if (!target) throw new Error('Interview session not found.');

    if (target.feedbackStatus !== FEEDBACK_STATUS.SUBMITTED) {
      throw new Error('All interviewers must submit their scorecard feedback before a round outcome can be decided.');
    }

    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          roundOutcome: decision,
          updatedAt: new Date().toISOString(),
          timeline: [
            {
              id: `TL-${Date.now()}`,
              action: `Round Outcome: ${decision}`,
              actor,
              timestamp: new Date().toISOString(),
              notes: `Round marked as ${decision}. Notes: ${notes || 'None'}`
            },
            ...(s.timeline || [])
          ]
        };
      }
      return s;
    });

    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    await this.logAuditEvent({
      actor,
      action: 'Round Outcome Decided',
      entity: 'Interview Session',
      entityId: sessionId,
      oldValue: target.roundOutcome,
      newValue: decision,
      reason: notes
    });

    return updated.find(s => s.id === sessionId);
  }

  /**
   * Tier 1: Hiring Manager submits Final Selection Recommendation
   */
  async submitHMSelectionRecommendation(applicationId, { recommendation, justification, suggestedLevel = '', targetComp = '' }, actor = 'Alex Chen (Hiring Manager)') {
    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);
    
    // Update all sessions for this application
    const updated = sessions.map(s => {
      if (s.applicationId === applicationId) {
        return {
          ...s,
          finalSelectionRecommendation: {
            recommendation,
            justification,
            suggestedLevel,
            targetComp,
            recommendedBy: actor,
            recommendedAt: new Date().toISOString()
          },
          finalSelectionStatus: recommendation === FINAL_SELECTION_DECISION.APPROVE 
            ? FINAL_SELECTION_STATUS.RECOMMENDED_BY_HM 
            : (recommendation === FINAL_SELECTION_DECISION.HOLD ? FINAL_SELECTION_STATUS.HOLD : FINAL_SELECTION_STATUS.REJECTED),
          timeline: [
            {
              id: `TL-${Date.now()}`,
              action: `HM Final Recommendation: ${recommendation}`,
              actor,
              timestamp: new Date().toISOString(),
              notes: justification
            },
            ...(s.timeline || [])
          ]
        };
      }
      return s;
    });

    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    await this.logAuditEvent({
      actor,
      action: 'Hiring Manager Final Recommendation Submitted',
      entity: 'Application',
      entityId: applicationId,
      newValue: `${recommendation} (Tier 1 Completed)`,
      reason: justification
    });

    return {
      applicationId,
      recommendation,
      status: recommendation === FINAL_SELECTION_DECISION.APPROVE 
        ? FINAL_SELECTION_STATUS.RECOMMENDED_BY_HM 
        : (recommendation === FINAL_SELECTION_DECISION.HOLD ? FINAL_SELECTION_STATUS.HOLD : FINAL_SELECTION_STATUS.REJECTED)
    };
  }

  /**
   * Tier 2: HR / HRBP validates compliance checklist & promotes candidate to Ready for Offer
   */
  async validateHRFinalApproval(applicationId, { isProcessCompliant = true, isBackgroundVerified = true, isBudgetAuthorized = true, hrNotes = '', decision = 'APPROVE' }, actor = 'Priya Sharma (HR Admin)') {
    const sessions = this._getStorage(this.STORAGE_KEY_SESSIONS, INITIAL_INTERVIEW_SESSIONS);

    const isApproved = decision === 'APPROVE';
    if (isApproved && (!isProcessCompliant || !isBudgetAuthorized)) {
      throw new Error('Mandatory ATS process compliance and budget authorizations must be confirmed.');
    }

    const targetSession = sessions.find(s => s.applicationId === applicationId);
    const newStatus = isApproved 
      ? FINAL_SELECTION_STATUS.HR_APPROVED_READY_FOR_OFFER 
      : FINAL_SELECTION_STATUS.REJECTED;

    const updated = sessions.map(s => {
      if (s.applicationId === applicationId) {
        return {
          ...s,
          finalSelectionStatus: newStatus,
          hrValidationGate: {
            isProcessCompliant,
            isBackgroundVerified,
            isBudgetAuthorized,
            hrNotes,
            approvedBy: actor,
            approvedAt: new Date().toISOString(),
            decision
          },
          readyForOfferModule: isApproved,
          timeline: [
            {
              id: `TL-${Date.now()}`,
              action: isApproved 
                ? 'HR Final Compliance Gate Approved • Ready for Offer Module'
                : 'HR Final Validation Rejected',
              actor,
              timestamp: new Date().toISOString(),
              notes: hrNotes || (isApproved ? 'Compliance criteria confirmed.' : 'Candidate rejected by HR.')
            },
            ...(s.timeline || [])
          ]
        };
      }
      return s;
    });

    this._setStorage(this.STORAGE_KEY_SESSIONS, updated);

    await this.logAuditEvent({
      actor,
      action: isApproved ? 'HR Validation Approved' : 'HR Validation Rejected',
      entityType: 'Application',
      entityId: applicationId,
      newValue: isApproved ? 'HR Approved • Ready for Offer' : 'Rejected',
      reason: hrNotes,
      metadata: {
        applicationId,
        candidateId: targetSession?.candidateId,
        requisitionId: targetSession?.requisitionId,
        interviewId: targetSession?.id
      }
    });

    if (isApproved) {
      await this.logAuditEvent({
        actor,
        action: 'Candidate Marked Ready for Offer',
        entityType: 'Application',
        entityId: applicationId,
        newValue: 'Ready for Offer Module Handshake',
        reason: 'All interview gates passed & HR compliance verified.',
        metadata: {
          applicationId,
          candidateId: targetSession?.candidateId,
          requisitionId: targetSession?.requisitionId,
          interviewId: targetSession?.id
        }
      });
    }

    return {
      applicationId,
      status: newStatus,
      readyForOfferModule: isApproved
    };
  }

  // --------------------------------------------------------------------------
  // Dynamic KPI & Real-time Graph Analytics Engine
  // --------------------------------------------------------------------------
  async getKPIAnalytics(userRole = INTERVIEW_ROLES.ATS_ADMIN, userContext = {}) {
    const sessions = await this.getInterviewSessions({ page: 1, pageSize: 500, userRole, userContext });
    const todayStr = toLocalDateString(new Date());

    const todayInterviews = sessions.filter(s => s.scheduledDate === todayStr && s.status !== SESSION_STATUS.CANCELLED);
    const upcomingInterviews = sessions.filter(s => s.scheduledDate >= todayStr && s.status === SESSION_STATUS.SCHEDULED);
    const feedbackPending = sessions.filter(s => s.feedbackStatus === FEEDBACK_STATUS.PENDING && s.status !== SESSION_STATUS.CANCELLED);
    const completedSessions = sessions.filter(s => s.status === SESSION_STATUS.COMPLETED);
    const cancelledSessions = sessions.filter(s => s.status === SESSION_STATUS.CANCELLED || s.status === SESSION_STATUS.NO_SHOW);

    return {
      todayCount: todayInterviews.length,
      upcomingCount: upcomingInterviews.length,
      pendingFeedbackCount: feedbackPending.length,
      completedCount: completedSessions.length,
      cancelledCount: cancelledSessions.length,
      totalCount: sessions.length
    };
  }

  async getGraphAnalytics(kpiId) {
    // Generate realistic multi-day trend breakdown for EnterpriseKpiAnalyticsModal
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const distribution = [
      { name: 'Technical Interview', count: 18, pct: 45, color: '#3b82f6' },
      { name: 'System Design', count: 10, pct: 25, color: '#8b5cf6' },
      { name: 'Managerial & Leadership', count: 8, pct: 20, color: '#10b981' },
      { name: 'HR Alignment', count: 4, pct: 10, color: '#f59e0b' }
    ];

    const weeklyTrend = days.map((day, idx) => ({
      label: day,
      value: Math.floor(4 + Math.sin(idx + 1) * 3 + idx * 1.5)
    }));

    return {
      kpiId,
      distribution,
      weeklyTrend,
      summaryMetric: '94.2%',
      summaryLabel: 'On-Time Schedule Adherence'
    };
  }
}

export const interviewService = new InterviewService();
