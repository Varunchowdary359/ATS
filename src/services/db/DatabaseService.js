/**
 * Enterprise ATS Database & State Persistence Engine
 * Unified source of truth with FLS response shaping, race-condition protection,
 * encryption at rest, and audit trail generation.
 */
import { INITIAL_CANDIDATES, INITIAL_APPLICATIONS } from '../../components/recruitment/candidates/candidateMockData.js';
import { INITIAL_JDS } from '../../components/recruitment/jd/jdMockData.js';
import { INITIAL_REQUISITIONS } from '../../components/recruitment/recruitmentMockData.js';
import { INITIAL_INTERVIEW_SESSIONS } from '../../components/recruitment/interviews/interviewMockData.js';
import { CANDIDATE_STATUS, APPLICATION_STATUS, EXCEPTION_STATUS, APPLICATION_STAGE } from '../../components/recruitment/candidates/candidateTypes.js';
import { SecurityManager } from './SecurityManager.js';
import { CryptoService } from '../security/CryptoService.js';
import { SanitizerService } from '../security/SanitizerService.js';
import { AuthService } from '../auth/AuthService.js';


const STORAGE_KEYS = {
  CANDIDATES: 'pw_db_candidates',
  APPLICATIONS: 'pw_db_applications',
  JDS: 'pw_db_jds',
  REQUISITIONS: 'pw_db_requisitions',
  POSTINGS: 'pw_db_job_postings',
  INTERVIEWS: 'pw_db_interviews',
  NOTIFICATIONS: 'pw_db_notifications',
  AUDIT_LOGS: 'pw_db_security_audit_logs'
};

export const INITIAL_POSTINGS = [
  {
    id: 'POST-2026-0001',
    reqId: 'REQ-2026-0001',
    jdId: 'JD-2026-0001',
    title: 'Senior Java Developer',
    department: 'Engineering',
    location: 'Bangalore, India',
    workMode: 'Hybrid',
    employmentType: 'Full-time',
    experience: '4–7 years',
    salaryRange: '₹24,00,000 - ₹32,00,000 / year',
    summary: 'Join our mission-critical distributed engineering team building next-generation enterprise HCM solutions using Java 21, Spring Boot, Kafka, and Kubernetes.',
    responsibilities: [
      'Architect and build highly available, scalable microservices in Java 21 and Spring Boot',
      'Optimize database queries and Kafka streaming pipelines for high-throughput enterprise event streams',
      'Lead sprint code reviews and maintain clean, secure, and production-tested code'
    ],
    qualifications: [
      "Bachelor's or Master's degree in Computer Science or related technical discipline",
      '4+ years of professional backend development with Java & Spring ecosystem',
      'Hands-on expertise with AWS, Docker, Kubernetes, and PostgreSQL'
    ],
    skills: ['Java', 'Spring Boot', 'Kafka', 'PostgreSQL', 'Kubernetes', 'AWS', 'Docker'],
    benefits: ['Comprehensive Medical Coverage', 'Flexible Hybrid Work Options', 'Annual Performance Bonus', 'Home Office Stipend'],
    applicationSettings: {
      applicationMethod: 'Direct Web Form',
      applicationUrl: 'https://careers.peopleworks.ai/jobs/REQ-2026-0001',
      publicVisibility: 'Public',
      candidateRequirements: ['Resume/CV', 'Contact Information', 'LinkedIn URL']
    },
    channels: ['careers_portal', 'linkedin', 'naukri', 'indeed'],
    channelStatuses: {
      careers_portal: 'Published',
      linkedin: 'Published',
      naukri: 'Published',
      indeed: 'Published',
      employee_referral: 'Published',
      internal_mobility: 'Published'
    },
    schedule: {
      publishDate: '2026-08-28',
      publishTime: '09:00 AM',
      timezone: 'IST (UTC+5:30)',
      expirationDate: '2026-09-28'
    },
    status: 'Published',
    createdAt: '2026-08-28T09:00:00Z',
    author: 'Sujith (Recruiter)'
  }
];

class DatabaseServiceImpl {
  constructor() {
    this.candidates = [];
    this.applications = [];
    this.jds = [];
    this.requisitions = [];
    this.postings = [];
    this.interviews = [];
    this.notifications = [];
    this.auditLogs = [];
    this.initialized = false;
    this._mutationLock = false;
  }

  init() {
    if (this.initialized) return;
    if (typeof window === 'undefined') return;

    try {
      const loadedCandidates = this._load(STORAGE_KEYS.CANDIDATES, []);
      this.candidates = (loadedCandidates || []).filter(c => c && c.id && !c.id.startsWith('CAND-10') && !c.id.startsWith('CND-100'));
      this._save(STORAGE_KEYS.CANDIDATES, this.candidates);

      const loadedApps = this._load(STORAGE_KEYS.APPLICATIONS, []);
      this.applications = (loadedApps || []).filter(a => a && a.id && !a.id.startsWith('APP-2026-00'));
      this._save(STORAGE_KEYS.APPLICATIONS, this.applications);

      this.jds = this._load(STORAGE_KEYS.JDS, INITIAL_JDS || []);
      this.requisitions = this._load(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS || []);
      this.postings = this._load(STORAGE_KEYS.POSTINGS, INITIAL_POSTINGS || []);
      
      // Load interviews and purge old mock seed sessions for clean state
      const loadedInterviews = this._load(STORAGE_KEYS.INTERVIEWS, null);
      if (!loadedInterviews || loadedInterviews.some(i => i.id?.startsWith('INT-SESS-MOCK-'))) {
        this.interviews = [];
        this._save(STORAGE_KEYS.INTERVIEWS, this.interviews);
      } else {
        this.interviews = loadedInterviews;
      }
      
      this.notifications = this._load(STORAGE_KEYS.NOTIFICATIONS, []);
      this.auditLogs = this._load(STORAGE_KEYS.AUDIT_LOGS, []);
      
      this.syncCandidateStatuses();
      this.initialized = true;
    } catch (e) {
      console.error('Database Initialization Error:', e);
    }
  }

  reset() {
    this.candidates = [...(INITIAL_CANDIDATES || [])];
    this.applications = [...(INITIAL_APPLICATIONS || [])];
    this.jds = [...(INITIAL_JDS || [])];
    this.requisitions = [...(INITIAL_REQUISITIONS || [])];
    this.postings = [...(INITIAL_POSTINGS || [])];
    this.interviews = [...(INITIAL_INTERVIEW_SESSIONS || [])];
    this.notifications = [];
    this.auditLogs = [];
    this.initialized = true;
  }

  _load(key, defaultData) {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn(`Failed to parse ${key}`, e);
      }
    }
    this._save(key, defaultData);
    return [...(defaultData || [])];
  }

  _save(key, data) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn(`[DatabaseService] Failed to save ${key} to localStorage:`, e);
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
          try {
            if (key === STORAGE_KEYS.CANDIDATES && Array.isArray(data)) {
              // Strip dataUrl to preserve candidate records without exceeding quota
              const lightweightData = data.map(cand => ({
                ...cand,
                documents: (cand.documents || []).map(doc => {
                  const { dataUrl, ...rest } = doc;
                  return rest;
                })
              }));
              localStorage.setItem(key, JSON.stringify(lightweightData));
              return;
            }
            if (key === STORAGE_KEYS.AUDIT_LOGS && Array.isArray(data)) {
              localStorage.setItem(key, JSON.stringify(data.slice(0, 50)));
              return;
            }
          } catch (retryErr) {
            console.warn(`[DatabaseService] Fallback save for ${key} failed:`, retryErr);
          }
        }
      }
    }
  }

  persistAll() {
    this._save(STORAGE_KEYS.CANDIDATES, this.candidates);
    this._save(STORAGE_KEYS.APPLICATIONS, this.applications);
    this._save(STORAGE_KEYS.JDS, this.jds);
    this._save(STORAGE_KEYS.REQUISITIONS, this.requisitions);
    this._save(STORAGE_KEYS.POSTINGS, this.postings);
    this._save(STORAGE_KEYS.INTERVIEWS, this.interviews);
    this._save(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this._save(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pw_db_updated'));
      } catch {
        // ignore in environments without CustomEvent
      }
    }
  }

  // --- Job Postings Access Methods ---

  getPostings() {
    this.init();
    return [...(this.postings || [])];
  }

  getPostingById(id) {
    this.init();
    if (!id) return null;
    const cleanId = String(id).toUpperCase().trim();
    return (this.postings || []).find(p => p.id?.toUpperCase() === cleanId || p.reqId?.toUpperCase() === cleanId) || null;
  }

  getPostingByJdId(jdId) {
    this.init();
    if (!jdId) return null;
    const cleanId = String(jdId).toUpperCase().trim();
    return (this.postings || []).find(p => p.jdId?.toUpperCase() === cleanId) || null;
  }

  savePosting(postingData) {
    this.init();
    const existingIndex = (this.postings || []).findIndex(p => p.id === postingData.id);
    if (existingIndex >= 0) {
      this.postings[existingIndex] = { ...this.postings[existingIndex], ...postingData };
    } else {
      this.postings = [postingData, ...(this.postings || [])];
    }
    this.persistAll();
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pw:posting_created', { detail: postingData }));
        window.dispatchEvent(new CustomEvent('pw_posting_published', { detail: postingData }));
      } catch {}
    }
    return postingData;
  }

  // --- Core Sync Logic ---

  syncCandidateStatuses() {
    this.candidates.forEach((cand, idx) => {
      const apps = this.applications.filter(a => a.candidateId === cand.id);
      if (apps.length === 0) return;
      
      const hasHired = apps.some(a => a.status === APPLICATION_STATUS.HIRED || a.stage === APPLICATION_STAGE.HIRED);
      if (hasHired) {
        this.candidates[idx].status = CANDIDATE_STATUS.HIRED;
        return;
      }

      const hasActive = apps.some(a => a.status === APPLICATION_STATUS.ACTIVE);
      if (hasActive) {
        this.candidates[idx].status = CANDIDATE_STATUS.ACTIVE;
        return;
      }

      const allRejected = apps.every(a => a.status === EXCEPTION_STATUS.REJECTED || a.status === EXCEPTION_STATUS.WITHDRAWN);
      if (allRejected) {
        this.candidates[idx].status = CANDIDATE_STATUS.REJECTED;
      }
    });
    this.persistAll();
  }

  // --- Security Audit Logger ---

  logSecurityEvent({ actor = 'System', action, resource, resourceId, details = '', status = 'SUCCESS' }) {
    this.init();
    const event = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      resource,
      resourceId,
      details,
      status
    };
    this.auditLogs.unshift(event);
    if (this.auditLogs.length > 200) this.auditLogs = this.auditLogs.slice(0, 200);
    this._save(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    return event;
  }

  // --- Secure Query APIs with Field-Level Security ---

  async getCandidates(userContext) {
    this.init();
    const ctx = userContext || AuthService.getSecurityContext();
    if (!ctx || !ctx.role) {
      throw new Error('401 Unauthorized: Valid authentication session is required to access candidates.');
    }

    let data = [...this.candidates];

    // Scope check: Hiring Manager only sees candidates for assigned requisitions
    if (ctx.role === 'hiring_manager') {
      const allowedReqs = ctx.userRequisitions || [];
      data = data.filter(c => {
        const apps = this.applications.filter(a => a.candidateId === c.id);
        return apps.some(a => allowedReqs.includes(a.requisitionId));
      });
    }

    // Employee cannot see global candidate directory
    if (ctx.role === 'employee') {
      return [];
    }

    // Apply Field-Level Security (FLS) to strip salary/private notes for unauthorized callers
    return data.map(c => SecurityManager.applyCandidateFLS(c, ctx)).filter(Boolean);
  }
  
  async getApplications(userContext) {
    this.init();
    const ctx = userContext || AuthService.getSecurityContext();
    if (!ctx || !ctx.role) {
      throw new Error('401 Unauthorized: Valid authentication session is required to access applications.');
    }

    let apps = [...this.applications];

    if (ctx.role === 'hiring_manager') {
      const allowedReqs = ctx.userRequisitions || [];
      apps = apps.filter(a => allowedReqs.includes(a.requisitionId));
    } else if (ctx.role === 'employee') {
      return [];
    }

    return apps;
  }

  async getRequisitions(userContext) {
    this.init();
    const ctx = userContext || AuthService.getSecurityContext();
    if (!ctx || !ctx.role) {
      throw new Error('401 Unauthorized: Valid authentication session is required to access requisitions.');
    }

    let reqs = [...this.requisitions];

    if (ctx.role === 'hiring_manager') {
      const allowedReqs = ctx.userRequisitions || [];
      reqs = reqs.filter(r => allowedReqs.includes(r.id));
    }

    return reqs.map(r => SecurityManager.applyRequisitionFLS(r, ctx)).filter(Boolean);
  }

  async getInterviews(userContext) {
    this.init();
    const ctx = userContext || AuthService.getSecurityContext();
    if (!ctx || !ctx.role) {
      throw new Error('401 Unauthorized: Valid authentication session is required to access interviews.');
    }

    let sessions = [...this.interviews];

    if (ctx.role === 'hiring_manager') {
      const allowedReqs = ctx.userRequisitions || [];
      sessions = sessions.filter(s => allowedReqs.includes(s.requisitionId));
    } else if (ctx.role === 'interviewer') {
      sessions = sessions.filter(s => 
        (s.interviewers || []).some(i => i.email?.toLowerCase() === ctx.email?.toLowerCase())
      );
    }

    return sessions.map(s => SecurityManager.applyInterviewFLS(s, ctx)).filter(Boolean);
  }

  // --- Secure State Mutation APIs ---

  async updateApplication(appId, updates, userContext) {
    this.init();
    const ctx = userContext || AuthService.getSecurityContext();
    if (!ctx || !ctx.role) {
      throw new Error('401 Unauthorized: Valid authentication session is required to update applications.');
    }

    const idx = this.applications.findIndex(a => a.id === appId);
    if (idx === -1) throw new Error('Application not found');
    
    // Security check
    if (ctx.role === 'employee') {
      throw new Error('403 Forbidden: Employees cannot modify application status.');
    }

    const app = this.applications[idx];
    if (!SecurityManager.verifyScope('application', app, ctx)) {
      throw new Error('403 Forbidden: You do not have permission to modify applications for this requisition.');
    }

    this.applications[idx] = { 
      ...this.applications[idx], 
      ...updates, 
      lastActivity: new Date().toISOString() 
    };
    
    this.syncCandidateStatuses();
    this.logSecurityEvent({
      actor: ctx.email || 'User',
      action: 'APPLICATION_UPDATED',
      resource: 'Application',
      resourceId: appId,
      details: `Updated fields: ${Object.keys(updates).join(', ')}`
    });

    return this.applications[idx];
  }

  async addCandidate(candidateData, applicationData, userContext) {
    this.init();
    const ctx = userContext || AuthService.getSecurityContext();
    if (!ctx || !ctx.role) {
      throw new Error('401 Unauthorized: Valid authentication session is required to add candidates.');
    }

    if (ctx.role === 'employee') {
      throw new Error('403 Forbidden: Employees are not authorized to create candidate records.');
    }

    // Sanitize user-provided text inputs
    const sanitizedCandidate = SanitizerService.sanitizeCandidateInput(candidateData);

    // Duplicate prevention
    const duplicateCheck = await this.checkDuplicate(
      sanitizedCandidate.email,
      sanitizedCandidate.phone,
      sanitizedCandidate.name
    );

    if (duplicateCheck.isDuplicate) {
      throw new Error(`Duplicate candidate detected: ${duplicateCheck.reason || 'Candidate already exists in repository.'}`);
    }

    this.candidates.unshift(sanitizedCandidate);
    if (applicationData) {
      this.applications.unshift(applicationData);
    }
    
    this.syncCandidateStatuses();

    this.logSecurityEvent({
      actor: ctx.email || 'User',
      action: 'CANDIDATE_CREATED',
      resource: 'Candidate',
      resourceId: sanitizedCandidate.id,
      details: `Created candidate ${sanitizedCandidate.name} (${sanitizedCandidate.email})`
    });

    return { 
      candidate: SecurityManager.applyCandidateFLS(sanitizedCandidate, ctx), 
      application: applicationData 
    };
  }

  async checkDuplicate(email, phone, name) {
    this.init();
    const normEmail = email ? email.trim().toLowerCase() : '';
    const normName = name ? name.trim().toLowerCase() : '';
    const incomingLast10 = phone ? phone.replace(/[^\d]/g, '').slice(-10) : '';

    for (const c of this.candidates) {
      if (normEmail && c.email && c.email.trim().toLowerCase() === normEmail) {
        return { 
          isDuplicate: true, 
          matchType: 'Email', 
          matchedCandidate: c,
          reason: `Exact email match with existing profile (${c.name} - ${c.id})`
        };
      }
      if (incomingLast10.length >= 8 && (c.phone || c.formattedPhone)) {
        const exist10 = (c.phone || c.formattedPhone).replace(/[^\d]/g, '').slice(-10);
        if (exist10.length >= 8 && incomingLast10 === exist10) {
          return { 
            isDuplicate: true, 
            matchType: 'Phone', 
            matchedCandidate: c,
            reason: `Phone match with existing profile (${c.name} - ${c.id})`
          };
        }
      }
      if (normName && c.name && c.name.trim().toLowerCase() === normName) {
        return { 
          isDuplicate: true, 
          matchType: 'Name', 
          matchedCandidate: c,
          reason: `Exact candidate name match with existing record (${c.name})`
        };
      }
    }
    return { isDuplicate: false, matchType: null, matchedCandidate: null, reason: '' };
  }

  // --- Notifications Security ---

  async createNotification(title, description, recipientRole, relatedEntityId) {
    this.init();
    const notif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: SanitizerService.sanitizeText(title),
      description: SanitizerService.sanitizeText(description),
      recipientRole,
      relatedEntityId,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    this.notifications.unshift(notif);
    this._save(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    return notif;
  }

  async getNotifications(userContext) {
    this.init();
    const ctx = userContext || AuthService.getSecurityContext();
    if (!ctx || !ctx.role) {
      return [];
    }
    const role = ctx.role;
    return this.notifications.filter(n => 
      n.recipientRole === 'All' || 
      n.recipientRole === role || 
      (role === 'ats_admin')
    );
  }

  async markNotificationRead(notifId, userContext) {
    this.init();
    const ctx = userContext || AuthService.getSecurityContext();
    if (!ctx || !ctx.role) {
      throw new Error('401 Unauthorized: Authentication required.');
    }

    const idx = this.notifications.findIndex(n => n.id === notifId);
    if (idx === -1) return null;

    this.notifications[idx].isRead = true;
    this._save(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    return this.notifications[idx];
  }
}

export const DatabaseService = new DatabaseServiceImpl();
