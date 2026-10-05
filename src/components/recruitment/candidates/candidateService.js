/**
 * Enterprise Candidate & Application Service Layer
 * Isolated Asynchronous API Boundary - PeopleWorks ATS
 */
import { 
  CANDIDATE_STATUS, 
  APPLICATION_STAGE, 
  APPLICATION_STATUS, 
  EXCEPTION_STATUS,
  validateStageTransition,
  normalizeCanonicalStage,
  PERMISSIONS,
  ATS_ROLES 
} from './candidateTypes';
import { DatabaseService } from '../../../services/db/DatabaseService';
import { SecurityManager } from '../../../services/db/SecurityManager';
import { SanitizerService } from '../../../services/security/SanitizerService';
import { AuthService } from '../../../services/auth/AuthService';

DatabaseService.init();


const repo = {
  get candidates() { return DatabaseService.candidates; },
  set candidates(val) { DatabaseService.candidates = val; },
  get applications() { return DatabaseService.applications; },
  set applications(val) { DatabaseService.applications = val; },
  persist: () => DatabaseService.persistAll(),
  enrichCandidate: function(candidate) {
    const apps = this.applications.filter(a => a.candidateId === candidate.id);
    // Sort applications by latest activity
    apps.sort((a, b) => new Date(b.lastActivity || b.appliedAt) - new Date(a.lastActivity || a.appliedAt));
    const primaryApp = apps[0] || null;

    return {
      ...candidate,
      applicationsCount: apps.length,
      primaryApplication: primaryApp,
      appliedRole: primaryApp?.jobTitle || (candidate.currentTitle ? candidate.currentTitle : 'Senior Automation Test Engineer'),
      requisitionId: primaryApp?.requisitionId || null,
      currentStage: primaryApp?.stage ? normalizeCanonicalStage(primaryApp.stage) : 'Talent Pool',
      applicationStatus: primaryApp?.status || 'Active',
      screeningScore: primaryApp?.screeningScore ?? null,
      assignedRecruiter: primaryApp?.assignedRecruiter || 'Unassigned',
      hiringManager: primaryApp?.hiringManager || null,
      source: primaryApp?.source || 'Direct',
      lastActivity: primaryApp?.lastActivity || candidate.updatedAt || candidate.createdAt
    };
  }
};

// Public Service API
export const candidateService = {
  /**
   * Fetch candidates with server-style pagination, search, and enterprise filtering
   */
  async getCandidates({
    page = 1,
    pageSize = 10,
    search = '',
    filters = {},
    sortBy = 'lastActivity',
    sortOrder = 'desc',
    userRole,
    userId,
    userRequisitions
  } = {}) {
    // Resolve dynamic security context
    const secCtx = AuthService.getSecurityContext();
    const effectiveRole = userRole || secCtx?.role || ATS_ROLES.EMPLOYEE;
    const effectiveUserId = userId || secCtx?.userId || 'ANONYMOUS';
    const effectiveReqs = userRequisitions || secCtx?.userRequisitions || [];

    // Simulate lightweight network latency for production feel
    await new Promise(r => setTimeout(r, 60));

    // Employee / Referrer / Unauthenticated: No direct candidate repository access
    if (effectiveRole === ATS_ROLES.EMPLOYEE || !secCtx) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 1
      };
    }

    let allEnriched = repo.candidates.map(c => repo.enrichCandidate(c));

    // Scoping for Hiring Manager: strictly candidates with applications in assigned requisitions
    if (userRole === ATS_ROLES.HIRING_MANAGER) {
      const normalizeReqId = (id) => (!id ? '' : String(id).trim().toUpperCase().replace(/REQ-(\d{4})-0*(\d+)/, 'REQ-$1-$2'));
      const rawAllowed = userRequisitions && userRequisitions.length > 0 
        ? userRequisitions 
        : ['REQ-2026-0001', 'REQ-2026-001'];
      const allowedReqs = rawAllowed.map(normalizeReqId);

      allEnriched = allEnriched.filter(c => {
        const cApps = repo.applications.filter(a => a.candidateId === c.id);
        if (cApps.length === 0) {
          return c.requisitionId ? allowedReqs.includes(normalizeReqId(c.requisitionId)) : false;
        }
        return cApps.some(a => 
          allowedReqs.includes(normalizeReqId(a.requisitionId)) ||
          (userId && a.hiringManager === userId)
        );
      });
    }

    // Scoping for Recruiter: option to restrict to assigned candidates
    if (userRole === ATS_ROLES.RECRUITER && filters.myCandidatesOnly) {
      allEnriched = allEnriched.filter(c => 
        c.assignedRecruiter === userId || 
        c.assignedRecruiter === 'Current User' || 
        !c.assignedRecruiter || 
        c.assignedRecruiter === 'Unassigned'
      );
    }

    // 1. Text Search (Debounced on caller)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allEnriched = allEnriched.filter(c => {
        return (
          c.name?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q) ||
          c.candidateNumber?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.appliedRole?.toLowerCase().includes(q) ||
          c.requisitionId?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.tags?.some(t => t.toLowerCase().includes(q))
        );
      });
    }

    // 2. Enterprise Filters
    if (filters.candidateStatus && filters.candidateStatus !== 'All') {
      allEnriched = allEnriched.filter(c => c.status === filters.candidateStatus);
    }

    if (filters.applicationStage && filters.applicationStage !== 'All') {
      allEnriched = allEnriched.filter(c => c.currentStage === filters.applicationStage);
    }

    if (filters.requisitionId && filters.requisitionId !== 'All') {
      allEnriched = allEnriched.filter(c => c.requisitionId === filters.requisitionId);
    }

    if (filters.source && filters.source !== 'All') {
      allEnriched = allEnriched.filter(c => c.source === filters.source);
    }

    if (filters.assignedRecruiter && filters.assignedRecruiter !== 'All') {
      allEnriched = allEnriched.filter(c => c.assignedRecruiter === filters.assignedRecruiter);
    }

    if (filters.location && filters.location !== 'All') {
      allEnriched = allEnriched.filter(c => c.location?.toLowerCase().includes(filters.location.toLowerCase()));
    }

    if (filters.hasResume === true) {
      allEnriched = allEnriched.filter(c => c.documents?.some(d => d.type === 'resume'));
    }

    if (filters.hasApplication === true) {
      allEnriched = allEnriched.filter(c => c.applicationsCount > 0);
    }

    if (filters.minScore !== undefined && filters.minScore !== null && filters.minScore !== '') {
      const min = Number(filters.minScore);
      allEnriched = allEnriched.filter(c => c.screeningScore !== null && c.screeningScore >= min);
    }

    // 3. Sorting
    allEnriched.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'lastActivity' || sortBy === 'createdAt') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = allEnriched.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = allEnriched.slice(startIndex, startIndex + pageSize);
    const safePaginatedData = paginatedData.map(c => 
      SecurityManager.applyCandidateFLS(c, { role: effectiveRole, userId: effectiveUserId, userRequisitions: effectiveReqs })
    );

    return {
      data: safePaginatedData,
      total,
      page,
      pageSize,
      totalPages
    };
  },

  /**
   * Get all active applications in the ATS repository
   */
  async getApplications(candidateId = null) {
    await new Promise(r => setTimeout(r, 20));
    if (candidateId) {
      return repo.applications.filter(a => a.candidateId === candidateId);
    }
    return [...repo.applications];
  },

  /**
   * Get single candidate by ID with all linked applications and full profile data
   */
  async getCandidateById(candidateId, userContext = { role: ATS_ROLES.ATS_ADMIN }) {
    await new Promise(r => setTimeout(r, 40));
    const candidate = repo.candidates.find(c => c.id === candidateId);
    if (!candidate) return null;

    const apps = repo.applications.filter(a => a.candidateId === candidateId);
    const rawResult = {
      ...candidate,
      applications: apps,
      enriched: repo.enrichCandidate(candidate)
    };

    return SecurityManager.applyCandidateFLS(rawResult, userContext);
  },


  /**
   * Fetch pipeline applications grouped by stage with calculated counts
   */
  async getPipelineData({ 
    requisitionId, 
    recruiter, 
    search = '',
    userRole = ATS_ROLES.ATS_ADMIN,
    userRequisitions = ['REQ-2026-001']
  } = {}) {
    await new Promise(r => setTimeout(r, 50));

    // Employee / Referrer: No access
    if (userRole === ATS_ROLES.EMPLOYEE) {
      return {
        columns: {},
        totalActive: 0,
        exceptionCounts: {}
      };
    }

    let apps = [...repo.applications];

    // Scoping for Hiring Manager: strictly applications for their assigned requisitions
    if (userRole === ATS_ROLES.HIRING_MANAGER) {
      const normalizeReqId = (id) => (!id ? '' : String(id).trim().toUpperCase().replace(/REQ-(\d{4})-0*(\d+)/, 'REQ-$1-$2'));
      const rawAllowed = userRequisitions && userRequisitions.length > 0 
        ? userRequisitions 
        : ['REQ-2026-0001', 'REQ-2026-001'];
      const allowedReqs = rawAllowed.map(normalizeReqId);

      apps = apps.filter(a => allowedReqs.includes(normalizeReqId(a.requisitionId)));
    }

    if (requisitionId && requisitionId !== 'All') {
      apps = apps.filter(a => a.requisitionId === requisitionId);
    }

    if (recruiter && recruiter !== 'All') {
      apps = apps.filter(a => a.assignedRecruiter === recruiter);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      apps = apps.filter(a => {
        const c = repo.candidates.find(item => item.id === a.candidateId);
        return (
          c?.name?.toLowerCase().includes(q) ||
          a.jobTitle?.toLowerCase().includes(q) ||
          a.requisitionId?.toLowerCase().includes(q)
        );
      });
    }

    // Attach candidate card snippet to each application
    const enrichedApps = apps.map(app => {
      const cand = repo.candidates.find(c => c.id === app.candidateId);
      return {
        ...app,
        candidateName: cand?.name || 'Unknown Candidate',
        candidateNumber: cand?.candidateNumber || cand?.id,
        currentTitle: cand?.currentTitle || app.jobTitle,
        currentCompany: cand?.currentCompany || '',
        experienceDisplay: cand?.experienceDisplay || `${cand?.totalExperience || 0} yrs`,
        location: cand?.location || 'Remote',
        avatar: cand?.avatar || 'CD',
        avatarBg: cand?.avatarBg || '#6366f1',
        candidateStatus: cand?.status || CANDIDATE_STATUS.ACTIVE
      };
    });

    const columns = {
      [APPLICATION_STAGE.APPLIED]: enrichedApps.filter(a => a.stage === APPLICATION_STAGE.APPLIED && a.status === APPLICATION_STATUS.ACTIVE),
      [APPLICATION_STAGE.SCREENING]: enrichedApps.filter(a => a.stage === APPLICATION_STAGE.SCREENING && a.status === APPLICATION_STATUS.ACTIVE),
      [APPLICATION_STAGE.SHORTLISTED]: enrichedApps.filter(a => a.stage === APPLICATION_STAGE.SHORTLISTED && a.status === APPLICATION_STATUS.ACTIVE),
      [APPLICATION_STAGE.INTERVIEW]: enrichedApps.filter(a => a.stage === APPLICATION_STAGE.INTERVIEW && a.status === APPLICATION_STATUS.ACTIVE),
      [APPLICATION_STAGE.OFFER]: enrichedApps.filter(a => a.stage === APPLICATION_STAGE.OFFER && a.status === APPLICATION_STATUS.ACTIVE),
      [APPLICATION_STAGE.HIRED]: enrichedApps.filter(a => a.stage === APPLICATION_STAGE.HIRED || a.status === APPLICATION_STATUS.HIRED)
    };

    const exceptionCounts = {
      [EXCEPTION_STATUS.REJECTED]: enrichedApps.filter(a => a.status === EXCEPTION_STATUS.REJECTED).length,
      [EXCEPTION_STATUS.WITHDRAWN]: enrichedApps.filter(a => a.status === EXCEPTION_STATUS.WITHDRAWN).length,
      [EXCEPTION_STATUS.ON_HOLD]: enrichedApps.filter(a => a.status === EXCEPTION_STATUS.ON_HOLD).length
    };

    return {
      columns,
      totalActive: enrichedApps.filter(a => a.status === APPLICATION_STATUS.ACTIVE).length,
      exceptionCounts
    };
  },

  /**
   * Actionable KPI Analytics computed from live application & candidate data
   */
  async getKPIAnalytics({ userRole, userRequisitions } = {}) {
    await new Promise(r => setTimeout(r, 30));

    let allCandidates = repo.candidates;
    let allApps = repo.applications;

    // Strictly scope for Hiring Manager
    if (userRole === ATS_ROLES.HIRING_MANAGER) {
      const normalizeReqId = (id) => (!id ? '' : String(id).trim().toUpperCase().replace(/REQ-(\d{4})-0*(\d+)/, 'REQ-$1-$2'));
      const rawAllowed = userRequisitions && userRequisitions.length > 0 
        ? userRequisitions 
        : ['REQ-2026-0001', 'REQ-2026-001'];
      const allowedReqs = rawAllowed.map(normalizeReqId);

      allApps = allApps.filter(a => allowedReqs.includes(normalizeReqId(a.requisitionId)));
      allCandidates = allCandidates.filter(c => {
        const cApps = repo.applications.filter(a => a.candidateId === c.id);
        if (cApps.length === 0) return c.requisitionId ? allowedReqs.includes(normalizeReqId(c.requisitionId)) : false;
        return cApps.some(a => allowedReqs.includes(normalizeReqId(a.requisitionId)));
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const totalCandidates = allCandidates.filter(c => c.status !== CANDIDATE_STATUS.ARCHIVED).length;
    const newCandidates = allCandidates.filter(c => new Date(c.createdAt) >= sevenDaysAgo).length;
    const activeApplications = allApps.filter(a => a.status === APPLICATION_STATUS.ACTIVE).length;
    const screeningPending = allApps.filter(a => a.stage === APPLICATION_STAGE.SCREENING && a.status === APPLICATION_STATUS.ACTIVE).length;

    const shortlisted = allApps.filter(a => a.stage === APPLICATION_STAGE.SHORTLISTED && a.status === APPLICATION_STATUS.ACTIVE).length;
    const interviews = allApps.filter(a => a.stage === APPLICATION_STAGE.INTERVIEW && a.status === APPLICATION_STATUS.ACTIVE).length;
    const offers = allApps.filter(a => a.stage === APPLICATION_STAGE.OFFER && a.status === APPLICATION_STATUS.ACTIVE).length;
    const hired = allApps.filter(a => a.stage === APPLICATION_STAGE.HIRED || a.status === APPLICATION_STATUS.HIRED).length;

    return {
      totalCandidates,
      newCandidates,
      activeApplications,
      screeningPending,
      shortlisted,
      interviews,
      offers,
      hired
    };
  },

  /**
   * Pre-creation duplicate detection across Email, Phone, and Name.
   * IMPORTANT: Always re-syncs from storage first so candidates created
   * in previous sessions (localStorage) are always checked.
   */
  async checkDuplicate({ email, phone, name }) {
    await new Promise(r => setTimeout(r, 40));

    // ── Re-sync handled by DatabaseService internally ──

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const normalizedName  = name  ? name.trim().toLowerCase()  : '';

    // Strip all non-digits and country-code prefixes, keep last 10 digits
    const digitsOnly = (str) => (str || '').replace(/[^\d]/g, '');
    const last10     = (str) => digitsOnly(str).slice(-10);
    const incomingLast10 = phone ? last10(phone) : '';

    for (const c of repo.candidates) {
      // 1. Exact Email match
      if (normalizedEmail && c.email && c.email.trim().toLowerCase() === normalizedEmail) {
        return {
          isDuplicate: true,
          matchType: 'Email',
          matchedCandidate: c,
          reason: `Exact email match with existing profile (${c.name} – ${c.candidateNumber || c.id})`
        };
      }

      // 2. Phone match — compare last 10 digits to handle +91/country-code variants
      if (incomingLast10.length >= 8 && (c.phone || c.formattedPhone)) {
        const existingLast10 = last10(c.phone || c.formattedPhone);
        if (existingLast10.length >= 8 && incomingLast10 === existingLast10) {
          return {
            isDuplicate: true,
            matchType: 'Phone',
            matchedCandidate: c,
            reason: `Phone number match with existing profile (${c.name} – ${c.candidateNumber || c.id})`
          };
        }
      }

      // 3. Exact full-name match
      if (normalizedName && c.name && c.name.trim().toLowerCase() === normalizedName) {
        return {
          isDuplicate: true,
          matchType: 'Name',
          matchedCandidate: c,
          reason: `Exact candidate name match with existing record (${c.name})`
        };
      }
    }

    return { isDuplicate: false, matchType: null, matchedCandidate: null, reason: '' };
  },

  /**
   * Create candidate record + optional initial application
   */
  async createCandidate(candidateData, applicationData = null) {
    await new Promise(r => setTimeout(r, 80));

    const nextIdNum = 100 + repo.candidates.length + 1;
    const candidateId = `CAND-${nextIdNum}`;
    const candidateNumber = `CD-${Math.floor(8800 + Math.random() * 200)}`;

    const initials = candidateData.name
      ? candidateData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'CD';

    const newCandidate = {
      id: candidateId,
      candidateNumber,
      name: candidateData.name,
      email: candidateData.email,
      phone: candidateData.phone || '',
      formattedPhone: candidateData.formattedPhone || candidateData.phone || '',
      countryCode: candidateData.countryCode || 'US',
      location: candidateData.location || 'Remote',
      currentTitle: candidateData.currentTitle || 'Candidate',
      currentCompany: candidateData.currentCompany || '',
      totalExperience: Number(candidateData.totalExperience) || 0,
      experienceDisplay: `${Number(candidateData.totalExperience) || 0} yrs`,
      noticePeriod: candidateData.noticePeriod || '30 Days',
      preferredLocation: candidateData.preferredLocation || candidateData.location || 'Remote',
      workAuthorization: candidateData.workAuthorization || 'Authorized',
      status: CANDIDATE_STATUS.ACTIVE,
      avatar: initials,
      avatarBg: '#6366f1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: candidateData.tags || [],
      skills: candidateData.skills || [],
      experience: candidateData.experience || [],
      education: candidateData.education || [],
      documents: candidateData.documents || [],
      communication: [],
      notes: []
    };

    repo.candidates.unshift(newCandidate);

    let newApp = null;
    if (applicationData && applicationData.requisitionId) {
      const appId = `APP-2026-${String(repo.applications.length + 1).padStart(3, '0')}`;
      newApp = {
        id: appId,
        candidateId,
        requisitionId: applicationData.requisitionId,
        jobTitle: applicationData.jobTitle || 'Requisition Role',
        department: applicationData.department || 'Engineering',
        stage: APPLICATION_STAGE.APPLIED,
        status: APPLICATION_STATUS.ACTIVE,
        source: applicationData.source || 'Careers Portal Direct',
        assignedRecruiter: applicationData.assignedRecruiter || 'Current User',
        hiringManager: applicationData.hiringManager || 'Hiring Manager',
        appliedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        screeningScore: applicationData.screeningScore ?? 85,
        screeningOutcome: applicationData.screeningOutcome || 'Strong Match',
        screeningBreakdown: applicationData.screeningBreakdown || null,
        timeline: [
          {
            id: `TL-${Date.now()}`,
            action: 'Application Created',
            user: 'Current User',
            timestamp: new Date().toISOString(),
            details: `Applied to ${applicationData.requisitionId} (${applicationData.jobTitle})`
          }
        ]
      };
      repo.applications.unshift(newApp);
    }

    repo.persist();
    return { candidate: newCandidate, application: newApp };
  },

  /**
   * Associate an existing candidate with a new requisition application
   */
  async addApplicationToCandidate(candidateId, applicationData) {
    await new Promise(r => setTimeout(r, 60));
    const candidate = repo.candidates.find(c => c.id === candidateId);
    if (!candidate) throw new Error('Candidate not found');

    const appId = `APP-2026-${String(repo.applications.length + 1).padStart(3, '0')}`;
    const newApp = {
      id: appId,
      candidateId,
      requisitionId: applicationData.requisitionId,
      jobTitle: applicationData.jobTitle || 'Requisition Role',
      department: applicationData.department || 'Engineering',
      stage: APPLICATION_STAGE.APPLIED,
      status: APPLICATION_STATUS.ACTIVE,
      source: applicationData.source || 'Direct Assignment',
      assignedRecruiter: applicationData.assignedRecruiter || 'Current User',
      hiringManager: applicationData.hiringManager || 'Hiring Manager',
      appliedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      screeningScore: applicationData.screeningScore ?? 80,
      screeningOutcome: applicationData.screeningOutcome || 'Pending Assessment',
      screeningBreakdown: applicationData.screeningBreakdown || null,
      timeline: [
        {
          id: `TL-${Date.now()}`,
          action: 'Associated to Requisition',
          user: applicationData.actor || 'Current User',
          timestamp: new Date().toISOString(),
          details: `Application initiated for ${applicationData.requisitionId} - ${applicationData.jobTitle}`
        }
      ]
    };

    repo.applications.unshift(newApp);
    repo.persist();
    return newApp;
  },

  /**
   * Validated Stage Transition with Audit Log
   */
  async transitionStage({
    applicationId,
    targetStage,
    reason = '',
    isOverride = false,
    actor = 'Current Recruiter'
  }) {
    await new Promise(r => setTimeout(r, 60));

    const appIndex = repo.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const app = repo.applications[appIndex];
    const validation = validateStageTransition(app.stage, targetStage);

    if (!validation.valid && !isOverride) {
      throw new Error(validation.message);
    }

    const prevStage = app.stage;
    const now = new Date().toISOString();

    // Determine application status (Active vs Exception statuses)
    let newStatus = APPLICATION_STATUS.ACTIVE;
    if (Object.values(EXCEPTION_STATUS).includes(targetStage)) {
      newStatus = targetStage;
    } else if (targetStage === APPLICATION_STAGE.HIRED) {
      newStatus = APPLICATION_STATUS.HIRED;
    }

    const updatedApp = {
      ...app,
      stage: targetStage,
      status: newStatus,
      lastActivity: now,
      timeline: [
        {
          id: `TL-${Date.now()}`,
          action: `Stage Changed: ${prevStage} → ${targetStage}`,
          user: actor,
          timestamp: now,
          details: reason || (isOverride ? `Managerial override from ${prevStage} to ${targetStage}` : `Stage advanced to ${targetStage}`),
          oldValue: prevStage,
          newValue: targetStage,
          isOverride
        },
        ...(app.timeline || [])
      ]
    };

    repo.applications[appIndex] = updatedApp;

    // Also update master candidate status if hired
    if (targetStage === APPLICATION_STAGE.HIRED) {
      const cIndex = repo.candidates.findIndex(c => c.id === app.candidateId);
      if (cIndex !== -1) {
        repo.candidates[cIndex] = {
          ...repo.candidates[cIndex],
          status: CANDIDATE_STATUS.HIRED,
          updatedAt: now
        };
      }
    }

    repo.persist();
    return updatedApp;
  },

  /**
   * Archive a single candidate
   */
  async archiveCandidate(candidateId) {
    await new Promise(r => setTimeout(r, 40));
    const idx = repo.candidates.findIndex(c => c.id === candidateId);
    if (idx !== -1) {
      repo.candidates[idx] = {
        ...repo.candidates[idx],
        status: CANDIDATE_STATUS.ARCHIVED,
        updatedAt: new Date().toISOString()
      };
      repo.persist();
      return repo.candidates[idx];
    }
    return null;
  },

  /**
   * Update candidate profile data
   */
  async updateCandidate(candidateId, updateData = {}) {
    await new Promise(r => setTimeout(r, 60));
    const idx = repo.candidates.findIndex(c => c.id === candidateId);
    if (idx === -1) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    const current = repo.candidates[idx];
    const updatedName = updateData.name || current.name;
    const initials = updatedName
      ? updatedName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : current.avatar;

    const totalExp = updateData.totalExperience !== undefined ? Number(updateData.totalExperience) : current.totalExperience;

    const updatedCandidate = {
      ...current,
      ...updateData,
      name: updatedName,
      avatar: initials,
      totalExperience: totalExp,
      experienceDisplay: `${totalExp || 0} yrs`,
      updatedAt: new Date().toISOString()
    };

    repo.candidates[idx] = updatedCandidate;
    repo.persist();

    return this.getCandidateById(candidateId);
  },

  /**
   * Permanently delete candidate record + applications
   */
  async deleteCandidate(candidateId) {
    await new Promise(r => setTimeout(r, 50));
    repo.candidates = repo.candidates.filter(c => c.id !== candidateId);
    repo.applications = repo.applications.filter(a => a.candidateId !== candidateId);
    repo.persist();
    return { success: true };
  },

  /**
   * Add internal note to candidate
   */
  async addNote(candidateId, noteData = {}) {
    await new Promise(r => setTimeout(r, 40));
    const idx = repo.candidates.findIndex(c => c.id === candidateId);
    if (idx === -1) throw new Error(`Candidate ${candidateId} not found`);

    const sanitizedContent = SanitizerService.sanitizeText(noteData.content || '');

    const newNote = {
      id: `NOTE-${Date.now()}`,
      author: SanitizerService.escapeHtml(noteData.author || 'Current User'),
      role: noteData.role || 'Recruiter',
      timestamp: new Date().toISOString(),
      content: sanitizedContent,
      isPrivate: noteData.isPrivate || false
    };

    const candidate = repo.candidates[idx];
    const updatedNotes = [newNote, ...(candidate.notes || [])];

    repo.candidates[idx] = {
      ...candidate,
      notes: updatedNotes,
      updatedAt: new Date().toISOString()
    };

    repo.persist();

    DatabaseService.logSecurityEvent({
      actor: noteData.author || 'User',
      action: 'CANDIDATE_NOTE_ADDED',
      resource: 'Candidate',
      resourceId: candidateId,
      details: `Added ${noteData.isPrivate ? 'private ' : ''}note to candidate ${candidate.name}`
    });

    return newNote;
  },


  /**
   * Add communication event to candidate profile history
   */
  async addCandidateCommunication(candidateId, commData = {}) {
    await new Promise(r => setTimeout(r, 40));
    const idx = repo.candidates.findIndex(c => c.id === candidateId);
    if (idx === -1) {
      console.warn(`Candidate ${candidateId} not found when adding communication.`);
      return null;
    }

    const newComm = {
      id: commData.id || `COMM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: commData.type || 'EMAIL',
      category: commData.category || 'INTERVIEW_INVITATION',
      subject: commData.subject || 'Interview Communication',
      sender: commData.sender || 'PeopleWorks Talent Acquisition <recruitment@peopleworks.ai>',
      recipient: commData.recipient || repo.candidates[idx].email,
      snippet: commData.snippet || (commData.body ? commData.body.substring(0, 160) + '...' : ''),
      body: commData.body || commData.message || '',
      status: commData.status || 'SENT',
      error: commData.error || null,
      timestamp: commData.timestamp || new Date().toISOString(),
      metadata: commData.metadata || {}
    };

    const candidate = repo.candidates[idx];
    const updatedComm = [newComm, ...(candidate.communication || [])];

    repo.candidates[idx] = {
      ...candidate,
      communication: updatedComm,
      updatedAt: new Date().toISOString()
    };

    repo.persist();
    return newComm;
  },

  /**
   * Add event to application timeline
   */
  async addApplicationTimelineEvent(applicationId, timelineEvent = {}) {
    await new Promise(r => setTimeout(r, 40));
    const appIndex = repo.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) {
      console.warn(`Application ${applicationId} not found when adding timeline event.`);
      return null;
    }

    const app = repo.applications[appIndex];
    const newEvent = {
      id: timelineEvent.id || `TL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: timelineEvent.action || 'Interview Notification',
      user: timelineEvent.user || 'System / Recruiter',
      timestamp: timelineEvent.timestamp || new Date().toISOString(),
      details: timelineEvent.details || ''
    };

    const updatedApp = {
      ...app,
      lastActivity: newEvent.timestamp,
      timeline: [newEvent, ...(app.timeline || [])]
    };

    repo.applications[appIndex] = updatedApp;
    repo.persist();
    return newEvent;
  },


  /**
   * Add document to candidate
   */
  async addDocument(candidateId, documentData = {}) {
    await new Promise(r => setTimeout(r, 50));
    const idx = repo.candidates.findIndex(c => c.id === candidateId);
    if (idx === -1) throw new Error(`Candidate ${candidateId} not found`);

    const newDoc = {
      id: `DOC-${Date.now()}`,
      name: documentData.name || 'Candidate Document',
      type: documentData.type || 'resume',
      size: documentData.size || '1.0 MB',
      uploadedAt: new Date().toISOString(),
      uploadedBy: documentData.uploadedBy || 'Current Recruiter',
      dataUrl: documentData.dataUrl || null
    };

    const candidate = repo.candidates[idx];
    const updatedDocs = [newDoc, ...(candidate.documents || [])];

    repo.candidates[idx] = {
      ...candidate,
      documents: updatedDocs,
      updatedAt: new Date().toISOString()
    };

    repo.persist();
    return newDoc;
  },

  /**
   * Delete document from candidate
   */
  async deleteDocument(candidateId, documentId) {
    await new Promise(r => setTimeout(r, 40));
    const idx = repo.candidates.findIndex(c => c.id === candidateId);
    if (idx === -1) throw new Error(`Candidate ${candidateId} not found`);

    const candidate = repo.candidates[idx];
    const updatedDocs = (candidate.documents || []).filter(d => d.id !== documentId);

    repo.candidates[idx] = {
      ...candidate,
      documents: updatedDocs,
      updatedAt: new Date().toISOString()
    };

    repo.persist();
    return { success: true };
  },

  /**
   * Bulk action updates
   */
  async bulkUpdate(candidateIds = [], action, payload = {}) {
    await new Promise(r => setTimeout(r, 80));
    if (!candidateIds || candidateIds.length === 0) return { updated: 0 };

    let count = 0;
    const now = new Date().toISOString();

    if (action === 'archive') {
      repo.candidates = repo.candidates.map(c => {
        if (candidateIds.includes(c.id)) {
          count++;
          return { ...c, status: CANDIDATE_STATUS.ARCHIVED, updatedAt: now };
        }
        return c;
      });
    } else if (action === 'assign_recruiter') {
      const { recruiter } = payload;
      repo.applications = repo.applications.map(a => {
        if (candidateIds.includes(a.candidateId)) {
          count++;
          return { 
            ...a, 
            assignedRecruiter: recruiter, 
            lastActivity: now,
            timeline: [
              { id: `TL-${Date.now()}-${count}`, action: 'Recruiter Reassigned', user: 'Admin', timestamp: now, details: `Assigned to ${recruiter}` },
              ...(a.timeline || [])
            ]
          };
        }
        return a;
      });
    } else if (action === 'add_tag') {
      const { tag } = payload;
      if (tag) {
        repo.candidates = repo.candidates.map(c => {
          if (candidateIds.includes(c.id)) {
            count++;
            const existingTags = c.tags || [];
            return {
              ...c,
              tags: existingTags.includes(tag) ? existingTags : [...existingTags, tag],
              updatedAt: now
            };
          }
          return c;
        });
      }
    }

    repo.persist();
    return { updated: count };
  },

  /**
   * Permission authorization helper
   */
  hasPermission(permission, userRole = 'super_admin') {
    // Super admins & ATS Admins hold all candidate permissions
    if (userRole === 'super_admin' || userRole === 'admin') return true;

    // Recruiter permissions
    if (userRole === 'recruiter' || userRole === 'lead_recruiter') {
      return [
        PERMISSIONS.CANDIDATE_READ,
        PERMISSIONS.CANDIDATE_CREATE,
        PERMISSIONS.CANDIDATE_UPDATE,
        PERMISSIONS.CANDIDATE_EXPORT,
        PERMISSIONS.CANDIDATE_HISTORY_READ,
        PERMISSIONS.CANDIDATE_DOCUMENTS_READ,
        PERMISSIONS.CANDIDATE_DOCUMENTS_MANAGE,
        PERMISSIONS.CANDIDATE_APPLICATION_CREATE,
        PERMISSIONS.CANDIDATE_APPLICATION_MOVE,
        PERMISSIONS.CANDIDATE_ASSIGN,
        PERMISSIONS.CANDIDATE_NOTES_READ,
        PERMISSIONS.CANDIDATE_NOTES_MANAGE
      ].includes(permission);
    }

    // Hiring Manager permissions
    if (userRole === 'hiring_manager') {
      return [
        PERMISSIONS.CANDIDATE_READ,
        PERMISSIONS.CANDIDATE_HISTORY_READ,
        PERMISSIONS.CANDIDATE_DOCUMENTS_READ,
        PERMISSIONS.CANDIDATE_NOTES_READ,
        PERMISSIONS.CANDIDATE_NOTES_MANAGE
      ].includes(permission);
    }

    return false;
  }
};
