/**
 * Enterprise Preboarding Management Service & Storage Engine
 * PeopleWorks ATS SaaS
 */

import { INITIAL_PREBOARDING_RECORDS } from './preboardingMockData';
import {
  PREBOARDING_STATUS,
  ACTION_STATUS,
  DOCUMENT_STATUS,
  DOCUMENT_CATEGORY,
  BGV_STATUS,
  BGV_CHECK_TYPE,
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_ASSIGNEE_ROLE,
  HANDOFF_STATUS,
  WORK_ARRANGEMENT,
  EMPLOYMENT_TYPE
} from './preboardingTypes';
import { evaluateJoiningReadiness, validateCandidateInfo, validateJoiningDetails } from './preboardingValidation';
import { bgvService } from './bgvService';
import { hrmsHandoffService } from './hrmsHandoffService';

class PreboardingService {
  constructor() {
    this.storageKey = 'pw_preboarding_records_v2';
    this.listeners = new Set();
    this._initStorage();
  }

  _initStorage() {
    if (typeof window === 'undefined') return;
    try {
      const existing = sessionStorage.getItem(this.storageKey);
      if (!existing) {
        sessionStorage.setItem(this.storageKey, JSON.stringify(INITIAL_PREBOARDING_RECORDS));
      }
    } catch {
      // Storage unavailable
    }
  }

  _getRecords() {
    if (typeof window === 'undefined') return INITIAL_PREBOARDING_RECORDS;
    try {
      const data = sessionStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : INITIAL_PREBOARDING_RECORDS;
    } catch {
      return INITIAL_PREBOARDING_RECORDS;
    }
  }

  _saveRecords(records) {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(this.storageKey, JSON.stringify(records));
      } catch (e) {
        console.error('Error saving preboarding records to storage:', e);
      }
    }
    this._notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify() {
    this.listeners.forEach(cb => {
      try {
        cb(this._getRecords());
      } catch (err) {
        console.error('Error in preboarding subscriber listener:', err);
      }
    });
  }

  /**
   * Retrieves all preboarding records with multi-facet filtering and search
   */
  async getPreboardings({
    search = '',
    preboardingStatus = 'ALL',
    actionStatus = 'ALL',
    department = 'ALL',
    location = 'ALL',
    owner = 'ALL',
    hiringManager = 'ALL',
    employmentType = 'ALL',
    dateRange = null
  } = {}) {
    await new Promise(r => setTimeout(r, 120));
    let list = this._getRecords();

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(item => 
        (item.candidateName && item.candidateName.toLowerCase().includes(q)) ||
        (item.candidateEmail && item.candidateEmail.toLowerCase().includes(q)) ||
        (item.candidateId && item.candidateId.toLowerCase().includes(q)) ||
        (item.applicationId && item.applicationId.toLowerCase().includes(q)) ||
        (item.requisitionId && item.requisitionId.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q)) ||
        (item.preboardingCode && item.preboardingCode.toLowerCase().includes(q)) ||
        (item.jobTitle && item.jobTitle.toLowerCase().includes(q))
      );
    }

    if (preboardingStatus && preboardingStatus !== 'ALL') {
      list = list.filter(item => item.status === preboardingStatus);
    }

    if (actionStatus && actionStatus !== 'ALL') {
      list = list.filter(item => item.actionStatus === actionStatus);
    }

    if (department && department !== 'ALL') {
      list = list.filter(item => item.department === department);
    }

    if (location && location !== 'ALL') {
      list = list.filter(item => item.location === location);
    }

    if (owner && owner !== 'ALL') {
      list = list.filter(item => item.ownerName === owner || item.ownerId === owner);
    }

    if (hiringManager && hiringManager !== 'ALL') {
      list = list.filter(item => item.hiringManagerName === hiringManager || item.hiringManagerId === hiringManager);
    }

    if (employmentType && employmentType !== 'ALL') {
      list = list.filter(item => item.joiningDetails?.employmentType === employmentType);
    }

    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      list = list.filter(item => {
        const jDate = new Date(item.joiningDate).getTime();
        if (dateRange.startDate && jDate < new Date(dateRange.startDate).getTime()) return false;
        if (dateRange.endDate && jDate > new Date(dateRange.endDate).getTime()) return false;
        return true;
      });
    }

    return list;
  }

  /**
   * Retrieves single preboarding record by ID with calculated readiness metrics
   */
  async getPreboardingById(id) {
    await new Promise(r => setTimeout(r, 80));
    const list = this._getRecords();
    const record = list.find(r => r.id === id || r.preboardingCode === id);
    if (!record) throw new Error(`Preboarding record '${id}' not found.`);

    // Recalculate dynamic readiness evaluation
    const readiness = evaluateJoiningReadiness(record);
    return {
      ...record,
      readiness
    };
  }

  /**
   * Computes the EXACT 4 KPI Metrics + Breakdown Analytics
   */
  async getMetrics() {
    const list = this._getRecords();
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    let total = list.length;
    let pendingActions = 0;
    let joiningThisWeek = 0;
    let readyToJoin = 0;

    list.forEach(r => {
      // 1. Pending Actions
      if (r.actionStatus === ACTION_STATUS.ACTION_REQUIRED || r.status === PREBOARDING_STATUS.HANDOFF_FAILED) {
        pendingActions++;
      } else {
        const readiness = evaluateJoiningReadiness(r);
        if (!readiness.isReady && r.status !== PREBOARDING_STATUS.EMPLOYEE_CREATED && r.status !== PREBOARDING_STATUS.CANCELLED) {
          pendingActions++;
        }
      }

      // 2. Joining This Week
      if (r.joiningDate && r.status !== PREBOARDING_STATUS.CANCELLED && r.status !== PREBOARDING_STATUS.WITHDRAWN) {
        const jDate = new Date(r.joiningDate);
        if (jDate >= now && jDate <= next7Days) {
          joiningThisWeek++;
        }
      }

      // 3. Ready to Join
      if (r.status === PREBOARDING_STATUS.READY_TO_JOIN || r.status === PREBOARDING_STATUS.HANDOFF_PENDING) {
        readyToJoin++;
      }
    });

    return {
      totalPreboarding: total,
      pendingActions,
      joiningThisWeek,
      readyToJoin
    };
  }

  /**
   * Aggregates real actionable issues for the "Attention Required" dashboard section
   */
  async getAttentionItems() {
    const list = this._getRecords();
    const items = [];
    const now = new Date();
    const next3Days = new Date();
    next3Days.setDate(now.getDate() + 3);

    list.forEach(record => {
      if (record.status === PREBOARDING_STATUS.EMPLOYEE_CREATED || record.status === PREBOARDING_STATUS.CANCELLED) {
        return;
      }

      // 1. Handoff Failed
      if (record.status === PREBOARDING_STATUS.HANDOFF_FAILED || record.handoff?.status === HANDOFF_STATUS.FAILED) {
        items.push({
          id: `ATT-FAIL-${record.id}`,
          preboardingId: record.id,
          candidateName: record.candidateName,
          jobTitle: record.jobTitle,
          type: 'HANDOFF_FAILED',
          severity: 'CRITICAL',
          title: 'HRMS Conversion Failed',
          description: record.handoff?.errorDetails || 'Failed to provision employee in core HRMS system.',
          actionText: 'Retry Handoff'
        });
      }

      // 2. Missing/Rejected Mandatory Documents
      (record.documents || []).forEach(doc => {
        if (doc.required && (doc.status === DOCUMENT_STATUS.REJECTED || doc.status === DOCUMENT_STATUS.REUPLOAD_REQUIRED)) {
          items.push({
            id: `ATT-DOC-${record.id}-${doc.id}`,
            preboardingId: record.id,
            candidateName: record.candidateName,
            jobTitle: record.jobTitle,
            type: 'DOCUMENT_REJECTED',
            severity: 'HIGH',
            title: `Document Rejected: ${doc.name}`,
            description: doc.rejectionReason || 'Mandatory document rejected during verification review.',
            actionText: 'Request Re-upload'
          });
        }
      });

      // 3. BGV Discrepancy
      (record.bgvChecks || []).forEach(bgv => {
        if (bgv.status === BGV_STATUS.DISCREPANCY || bgv.status === BGV_STATUS.FAILED) {
          items.push({
            id: `ATT-BGV-${record.id}-${bgv.id}`,
            preboardingId: record.id,
            candidateName: record.candidateName,
            jobTitle: record.jobTitle,
            type: 'BGV_DISCREPANCY',
            severity: 'HIGH',
            title: `BGV Discrepancy in ${bgv.type}`,
            description: bgv.result || 'Background check provider flagged discrepancy requiring review.',
            actionText: 'Review BGV'
          });
        }
      });

      // 4. Overdue Tasks
      (record.tasks || []).forEach(task => {
        if (task.status === TASK_STATUS.OVERDUE || (task.status !== TASK_STATUS.COMPLETED && task.dueDate && new Date(task.dueDate) < now)) {
          items.push({
            id: `ATT-TSK-${record.id}-${task.id}`,
            preboardingId: record.id,
            candidateName: record.candidateName,
            jobTitle: record.jobTitle,
            type: 'TASK_OVERDUE',
            severity: 'MEDIUM',
            title: `Overdue Task: ${task.name}`,
            description: `Assigned to ${task.assigneeRole} (${task.assigneeName || 'Unassigned'}). Due on ${task.dueDate}.`,
            actionText: 'View Task'
          });
        }
      });

      // 5. Joining Date Approaching & Not Ready
      if (record.joiningDate) {
        const jDate = new Date(record.joiningDate);
        if (jDate >= now && jDate <= next3Days && record.status !== PREBOARDING_STATUS.READY_TO_JOIN) {
          items.push({
            id: `ATT-DATE-${record.id}`,
            preboardingId: record.id,
            candidateName: record.candidateName,
            jobTitle: record.jobTitle,
            type: 'JOINING_APPROACHING',
            severity: 'HIGH',
            title: `Joining Date Imminent (${record.joiningDate})`,
            description: 'Candidate is scheduled to start in less than 3 days but has pending readiness checks.',
            actionText: 'Review Readiness'
          });
        }
      }
    });

    return items;
  }

  /**
   * AUTOMATIC PREBOARDING CREATION
   * Triggered when an offer is formally accepted.
   * Inherits candidate data, application data, requisition data, and compensation terms without duplicating.
   */
  async createPreboardingFromOffer(offer, actorName = 'PeopleWorks Automated Engine') {
    if (!offer || !offer.id) throw new Error('Cannot create preboarding: invalid offer data.');

    const list = this._getRecords();
    
    // Check if preboarding record already exists for this offer
    const existing = list.find(r => r.offerId === offer.id || r.applicationId === offer.applicationId);
    if (existing) {
      return existing;
    }

    const count = list.length + 1;
    const newId = `PRE-2026-${String(count).padStart(3, '0')}`;
    const preCode = `PW-PRE-${String(180 + count).padStart(5, '0')}`;

    const [firstName, ...lastNameParts] = (offer.candidateName || 'Candidate Name').split(' ');
    const lastName = lastNameParts.join(' ') || 'Candidate';

    const newRecord = {
      id: newId,
      preboardingCode: preCode,
      candidateId: offer.candidateId || `CAN-${Math.floor(100 + Math.random() * 900)}`,
      applicationId: offer.applicationId || `APP-${Math.floor(100 + Math.random() * 900)}`,
      requisitionId: offer.requisitionId || 'REQ-2026-001',
      offerId: offer.id,
      candidateName: offer.candidateName,
      candidateEmail: offer.candidateEmail,
      candidatePhone: offer.candidatePhone || '+1 555 0100',
      jobTitle: offer.jobTitle || 'Software Engineer',
      department: offer.department || 'Engineering',
      businessUnit: offer.businessUnit || 'Technology Solutions',
      location: offer.workLocation || 'Headquarters',
      ownerId: offer.recruiterId || 'USR-REC-01',
      ownerName: offer.recruiterName || 'Sarah Jenkins',
      hiringManagerId: offer.hiringManagerId || 'USR-HM-01',
      hiringManagerName: offer.hiringManagerName || 'Alex Chen',
      status: PREBOARDING_STATUS.INITIATED,
      actionStatus: ACTION_STATUS.ACTION_REQUIRED,
      joiningDate: offer.expectedStartDate || new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offerStatus: 'ACCEPTED',
      offerAccepted: true,

      candidateInfo: {
        firstName,
        lastName,
        dob: '1992-05-15',
        nationality: 'India',
        gender: 'Not Disclosed',
        email: offer.candidateEmail,
        mobile: offer.candidatePhone || '+91 98000 11223',
        alternateContact: '',
        currentAddress: offer.candidateLocation || 'Bangalore, India',
        permanentAddress: offer.candidateLocation || 'Bangalore, India',
        country: 'India',
        state: 'Karnataka',
        city: 'Bengaluru',
        postalCode: '560001',
        emergencyContactName: 'Family Contact',
        emergencyContactRelationship: 'Guardian',
        emergencyContactMobile: '+91 98000 99887',
        emergencyContactEmail: 'contact@example.com'
      },

      joiningDetails: {
        joiningDate: offer.expectedStartDate || new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
        location: offer.workLocation || 'Bengaluru',
        workArrangement: offer.workArrangement || WORK_ARRANGEMENT.HYBRID,
        department: offer.department || 'Engineering',
        businessUnit: offer.businessUnit || 'Technology',
        designation: offer.jobTitle || 'Software Engineer',
        employmentType: offer.employmentType || EMPLOYMENT_TYPE.FULL_TIME,
        jobLevel: offer.jobLevel || 'IC-4',
        reportingManager: offer.reportingManager || offer.hiringManagerName || 'Alex Chen',
        shift: 'General Day Shift (9 AM - 6 PM)',
        probationPeriod: offer.probationPeriod || '3 Months',
        noticePeriod: offer.noticePeriod || '30 Days'
      },

      compensation: {
        currency: offer.currency || 'INR',
        baseSalary: offer.totalBase || 2400000,
        variablePay: offer.totalVariable || 300000,
        totalCtc: offer.totalCtc || 2700000,
        payFrequency: offer.payFrequency || 'Annual'
      },

      documents: [
        {
          id: 'DOC-AUTO-01',
          name: 'Government Identification (Passport / National ID)',
          category: DOCUMENT_CATEGORY.IDENTITY,
          required: true,
          applicableCountry: 'All',
          applicableEmploymentType: 'All',
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: DOCUMENT_STATUS.REQUESTED,
          fileName: null,
          fileSize: null,
          uploadedAt: null,
          verifiedBy: null,
          verifiedAt: null,
          version: 0
        },
        {
          id: 'DOC-AUTO-02',
          name: 'Educational Degree Certificate & Transcripts',
          category: DOCUMENT_CATEGORY.EDUCATION,
          required: true,
          applicableCountry: 'All',
          applicableEmploymentType: 'All',
          dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          status: DOCUMENT_STATUS.REQUESTED,
          fileName: null,
          fileSize: null,
          uploadedAt: null,
          verifiedBy: null,
          verifiedAt: null,
          version: 0
        },
        {
          id: 'DOC-AUTO-03',
          name: 'Relieving & Experience Certificate from Prior Employer',
          category: DOCUMENT_CATEGORY.EMPLOYMENT,
          required: true,
          applicableCountry: 'All',
          applicableEmploymentType: 'Full Time',
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          status: DOCUMENT_STATUS.REQUESTED,
          fileName: null,
          fileSize: null,
          uploadedAt: null,
          verifiedBy: null,
          verifiedAt: null,
          version: 0
        },
        {
          id: 'DOC-AUTO-04',
          name: 'Direct Deposit / Bank Account Verification',
          category: DOCUMENT_CATEGORY.PAYROLL_BANK,
          required: true,
          applicableCountry: 'All',
          applicableEmploymentType: 'All',
          dueDate: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
          status: DOCUMENT_STATUS.REQUESTED,
          fileName: null,
          fileSize: null,
          uploadedAt: null,
          verifiedBy: null,
          verifiedAt: null,
          version: 0
        }
      ],

      bgvChecks: [
        {
          id: 'BGV-AUTO-01',
          type: BGV_CHECK_TYPE.IDENTITY,
          provider: 'AuthBridge',
          status: BGV_STATUS.NOT_STARTED,
          required: true,
          initiatedAt: null,
          completedAt: null,
          result: null
        },
        {
          id: 'BGV-AUTO-02',
          type: BGV_CHECK_TYPE.EMPLOYMENT,
          provider: 'AuthBridge',
          status: BGV_STATUS.NOT_STARTED,
          required: true,
          initiatedAt: null,
          completedAt: null,
          result: null
        }
      ],

      tasks: [
        {
          id: 'TSK-AUTO-01',
          name: 'Review and verify preboarding profile info',
          description: 'Ensure candidate addresses and statutory IDs are verified against original records.',
          assigneeRole: TASK_ASSIGNEE_ROLE.HR,
          assigneeName: offer.recruiterName || 'Sarah Jenkins',
          dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          priority: TASK_PRIORITY.HIGH,
          required: true,
          status: TASK_STATUS.NOT_STARTED,
          completedAt: null
        },
        {
          id: 'TSK-AUTO-02',
          name: 'IT Workstation & Software License Provisioning',
          description: 'Procure and image corporate laptop, configure VPN credentials and Slack/Google accounts.',
          assigneeRole: TASK_ASSIGNEE_ROLE.IT_ADMIN,
          assigneeName: 'Alex Thorne (IT Ops)',
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          priority: TASK_PRIORITY.HIGH,
          required: true,
          status: TASK_STATUS.NOT_STARTED,
          completedAt: null
        }
      ],

      handoff: {
        status: HANDOFF_STATUS.READY,
        employeeId: null,
        history: []
      },

      timeline: [
        {
          id: `EVT-AUTO-1`,
          timestamp: new Date().toISOString(),
          actor: actorName,
          action: 'Preboarding Created Automatically',
          details: `Preboarding record ${newId} initialized from Accepted Offer (${offer.id}).`
        }
      ]
    };

    list.unshift(newRecord);
    this._saveRecords(list);
    return newRecord;
  }

  /**
   * Updates Candidate Information (with audit event)
   */
  async updateCandidateInfo(id, candidateInfo, actor = 'HR Administrator') {
    const list = this._getRecords();
    let idx = list.findIndex(r => r.id === id || r.candidateId === id);
    if (idx === -1) {
      idx = 0;
    }

    const validation = validateCandidateInfo(candidateInfo);
    if (!validation.isValid) {
      throw new Error(`Candidate Information validation failed: ${Object.values(validation.errors)[0]}`);
    }

    const prev = list[idx].candidateInfo || {};
    list[idx].candidateInfo = { ...prev, ...candidateInfo };
    
    // Synchronize top-level record properties for seamless ATS list updates
    const fName = candidateInfo.firstName || prev.firstName || '';
    const lName = candidateInfo.lastName || prev.lastName || '';
    if (fName || lName) {
      list[idx].candidateName = `${fName} ${lName}`.trim();
    }
    if (candidateInfo.email) list[idx].candidateEmail = candidateInfo.email;
    if (candidateInfo.mobile) {
      list[idx].candidatePhone = typeof candidateInfo.mobile === 'object' && candidateInfo.mobile !== null
        ? (candidateInfo.mobile.rawInput || candidateInfo.mobile.e164 || '')
        : String(candidateInfo.mobile);
    }
    if (candidateInfo.city || candidateInfo.currentAddress) {
      list[idx].location = candidateInfo.city ? `${candidateInfo.city}, ${candidateInfo.country || 'India'}` : candidateInfo.currentAddress;
    }
    list[idx].updatedAt = new Date().toISOString();

    this._recordTimelineEvent(list[idx], actor, 'Candidate Profile Updated', 'Candidate personal, contact or residential address details modified.');
    this._saveRecords(list);
    return list[idx];
  }

  /**
   * Updates Joining Details (with audit event)
   */
  async updateJoiningDetails(id, joiningDetails, actor = 'HR Administrator') {
    const list = this._getRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found.`);

    const validation = validateJoiningDetails(joiningDetails);
    if (!validation.isValid) {
      throw new Error(`Joining details validation failed: ${Object.values(validation.errors)[0]}`);
    }

    list[idx].joiningDetails = { ...list[idx].joiningDetails, ...joiningDetails };
    list[idx].joiningDate = joiningDetails.joiningDate || list[idx].joiningDate;
    list[idx].department = joiningDetails.department || list[idx].department;
    list[idx].location = joiningDetails.location || list[idx].location;
    list[idx].jobTitle = joiningDetails.designation || list[idx].jobTitle;
    list[idx].updatedAt = new Date().toISOString();

    this._recordTimelineEvent(list[idx], actor, 'Joining Details Updated', `Expected joining date updated to ${joiningDetails.joiningDate}, designation: ${joiningDetails.designation}.`);
    this._saveRecords(list);
    return list[idx];
  }

  /**
   * Documents: Upload, Verify, Reject, Request Re-upload, Waive
   */
  async manageDocument(id, docId, action, payload = {}, actor = 'HR Administrator') {
    const list = this._getRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found.`);

    const record = list[idx];
    const doc = (record.documents || []).find(d => d.id === docId);
    if (!doc) throw new Error(`Document ${docId} not found.`);

    switch (action) {
      case 'UPLOAD':
        doc.status = DOCUMENT_STATUS.UNDER_REVIEW;
        doc.fileName = payload.fileName || 'Uploaded_Document.pdf';
        doc.fileSize = payload.fileSize || '1.5 MB';
        doc.uploadedAt = new Date().toISOString();
        doc.version = (doc.version || 0) + 1;
        this._recordTimelineEvent(record, actor, `Document Uploaded: ${doc.name}`, `Version ${doc.version} uploaded (${doc.fileName}).`);
        break;

      case 'VERIFY':
        doc.status = DOCUMENT_STATUS.VERIFIED;
        doc.verifiedBy = actor;
        doc.verifiedAt = new Date().toISOString();
        doc.rejectionReason = null;
        this._recordTimelineEvent(record, actor, `Document Verified: ${doc.name}`, `Document verified and approved by ${actor}.`);
        break;

      case 'REJECT':
        if (!payload.reason || !payload.reason.trim()) {
          throw new Error('Rejection reason is mandatory when rejecting a compliance document.');
        }
        doc.status = DOCUMENT_STATUS.REJECTED;
        doc.verifiedBy = actor;
        doc.verifiedAt = new Date().toISOString();
        doc.rejectionReason = payload.reason.trim();
        this._recordTimelineEvent(record, actor, `Document Rejected: ${doc.name}`, `Reason: ${doc.rejectionReason}`);
        break;

      case 'REQUEST_REUPLOAD':
        doc.status = DOCUMENT_STATUS.REUPLOAD_REQUIRED;
        doc.rejectionReason = payload.reason || doc.rejectionReason;
        this._recordTimelineEvent(record, actor, `Document Re-upload Requested: ${doc.name}`, payload.reason || 'Candidate notified to re-upload clear copy.');
        break;

      case 'WAIVE':
        doc.status = DOCUMENT_STATUS.WAIVED;
        doc.verifiedBy = actor;
        doc.verifiedAt = new Date().toISOString();
        this._recordTimelineEvent(record, actor, `Document Waived: ${doc.name}`, payload.notes || 'Document requirement waived by HR authority.');
        break;

      default:
        throw new Error(`Unknown document action '${action}'.`);
    }

    record.updatedAt = new Date().toISOString();
    this._saveRecords(list);
    return record;
  }

  /**
   * BGV: Start, Update Result, Cancel
   */
  async manageBgvCheck(id, checkId, action, payload = {}, actor = 'HR Administrator') {
    const list = this._getRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found.`);

    const record = list[idx];
    if (!record.bgvChecks) record.bgvChecks = [];

    if (action === 'INITIATE') {
      const res = await bgvService.startCheck(id, payload.type || BGV_CHECK_TYPE.IDENTITY, payload.provider || 'authbridge', payload);
      record.bgvChecks.push({
        id: res.id,
        type: res.type,
        provider: res.providerName,
        status: BGV_STATUS.IN_PROGRESS,
        required: true,
        initiatedAt: res.initiatedAt,
        completedAt: null,
        result: null,
        referenceNumber: res.referenceNumber
      });
      this._recordTimelineEvent(record, actor, `BGV Check Initiated: ${res.type}`, `Provider: ${res.providerName} (Ref: ${res.referenceNumber})`);
    } else {
      const check = record.bgvChecks.find(c => c.id === checkId);
      if (!check) throw new Error(`BGV check ${checkId} not found.`);

      if (action === 'UPDATE_STATUS') {
        check.status = payload.status;
        check.result = payload.result || (payload.status === BGV_STATUS.CLEAR ? 'Clear - No Adverse Findings' : 'Discrepancy Found');
        check.completedAt = new Date().toISOString();
        this._recordTimelineEvent(record, actor, `BGV Status Updated: ${check.type}`, `Status changed to ${payload.status}.`);
      } else if (action === 'CANCEL') {
        await bgvService.cancelCheck(id, checkId, payload.reason);
        check.status = BGV_STATUS.CANCELLED;
        check.completedAt = new Date().toISOString();
        this._recordTimelineEvent(record, actor, `BGV Check Cancelled: ${check.type}`, `Reason: ${payload.reason || 'Cancelled by HR'}`);
      }
    }

    record.updatedAt = new Date().toISOString();
    this._saveRecords(list);
    return record;
  }

  /**
   * Tasks: Create, Complete, Skip, Reassign
   */
  async manageTask(id, taskId, action, payload = {}, actor = 'HR Administrator') {
    const list = this._getRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found.`);

    const record = list[idx];
    if (!record.tasks) record.tasks = [];

    if (action === 'CREATE') {
      if (!payload.name || !payload.name.trim()) throw new Error('Task name is required.');
      const newTask = {
        id: `TSK-${Date.now().toString().slice(-6)}`,
        name: payload.name.trim(),
        description: payload.description || '',
        assigneeRole: payload.assigneeRole || TASK_ASSIGNEE_ROLE.HR,
        assigneeName: payload.assigneeName || 'HR Team',
        dueDate: payload.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        priority: payload.priority || TASK_PRIORITY.MEDIUM,
        required: payload.required !== false,
        status: TASK_STATUS.NOT_STARTED,
        completedAt: null,
        comments: payload.comments || ''
      };
      record.tasks.push(newTask);
      this._recordTimelineEvent(record, actor, `New Task Added: ${newTask.name}`, `Assigned to ${newTask.assigneeRole}. Due on ${newTask.dueDate}.`);
    } else {
      const task = record.tasks.find(t => t.id === taskId);
      if (!task) throw new Error(`Task ${taskId} not found.`);

      if (action === 'COMPLETE') {
        task.status = TASK_STATUS.COMPLETED;
        task.completedAt = new Date().toISOString();
        if (payload.comments) task.comments = payload.comments;
        this._recordTimelineEvent(record, actor, `Task Completed: ${task.name}`, payload.comments || 'Task completed successfully.');
      } else if (action === 'SKIP') {
        if (task.required && !payload.overridePermission) {
          throw new Error('Mandatory tasks cannot be skipped without administrative override.');
        }
        task.status = TASK_STATUS.SKIPPED;
        task.completedAt = new Date().toISOString();
        this._recordTimelineEvent(record, actor, `Task Skipped: ${task.name}`, payload.reason || 'Skipped by administrator.');
      } else if (action === 'REASSIGN') {
        const oldAssignee = task.assigneeName;
        task.assigneeRole = payload.assigneeRole || task.assigneeRole;
        task.assigneeName = payload.assigneeName || task.assigneeName;
        this._recordTimelineEvent(record, actor, `Task Reassigned: ${task.name}`, `Reassigned from ${oldAssignee} to ${task.assigneeName} [${task.assigneeRole}].`);
      }
    }

    record.updatedAt = new Date().toISOString();
    this._saveRecords(list);
    return record;
  }

  /**
   * Status lifecycle updates & holds
   */
  async updateStatus(id, newStatus, reason = '', actor = 'HR Administrator') {
    const list = this._getRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found.`);

    const record = list[idx];
    const oldStatus = record.status;
    record.status = newStatus;
    record.updatedAt = new Date().toISOString();

    this._recordTimelineEvent(record, actor, `Status Changed: ${newStatus}`, `Status updated from "${oldStatus}" to "${newStatus}". Reason: ${reason || 'Operational update.'}`);
    this._saveRecords(list);
    return record;
  }

  /**
   * Reassigns record ownership
   */
  async changeOwner(id, newOwnerId, newOwnerName, actor = 'HR Administrator') {
    const list = this._getRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found.`);

    const record = list[idx];
    const oldOwner = record.ownerName;
    record.ownerId = newOwnerId;
    record.ownerName = newOwnerName;
    record.updatedAt = new Date().toISOString();

    this._recordTimelineEvent(record, actor, 'Owner Reassigned', `Reassigned from ${oldOwner} to ${newOwnerName}.`);
    this._saveRecords(list);
    return record;
  }

  /**
   * Marks Ready to Join (Formally checks readiness gate first)
   */
  async markReadyToJoin(id, actor = 'HR Administrator') {
    const list = this._getRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found.`);

    const record = list[idx];
    const readiness = evaluateJoiningReadiness(record);
    if (!readiness.isReady) {
      throw new Error(`Cannot mark Ready to Join. Blockers present:\n- ${readiness.blockers.join('\n- ')}`);
    }

    record.status = PREBOARDING_STATUS.READY_TO_JOIN;
    record.actionStatus = ACTION_STATUS.COMPLETED;
    record.updatedAt = new Date().toISOString();

    this._recordTimelineEvent(record, actor, 'Marked Ready to Join', 'All 8 readiness checkpoints passed. Ready for HRMS employee conversion.');
    this._saveRecords(list);
    return record;
  }

  /**
   * HRMS Conversion Execution
   */
  async convertToEmployee(id, options = {}, actor = 'HR Administrator') {
    const list = this._getRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found.`);

    const record = list[idx];
    
    // Validate readiness
    const readiness = evaluateJoiningReadiness(record);
    if (!readiness.isReady && !options.overrideReadiness) {
      throw new Error(`Handoff blocked by readiness gate:\n- ${readiness.blockers.join('\n- ')}`);
    }

    // Call HRMS Integration Service
    const handoffRes = await hrmsHandoffService.createEmployee(record, options);

    if (handoffRes.success) {
      record.status = PREBOARDING_STATUS.EMPLOYEE_CREATED;
      record.actionStatus = ACTION_STATUS.COMPLETED;
      record.employeeId = handoffRes.employeeId;
      record.handoff = {
        status: HANDOFF_STATUS.CREATED,
        employeeId: handoffRes.employeeId,
        completedAt: handoffRes.timestamp,
        details: handoffRes.employeeDetails
      };
      this._recordTimelineEvent(record, actor, `Employee Converted: ${handoffRes.employeeId}`, `Successfully created employee record in Enterprise HRMS with ID: ${handoffRes.employeeId}.`);
    } else {
      record.status = PREBOARDING_STATUS.HANDOFF_FAILED;
      record.actionStatus = ACTION_STATUS.BLOCKED;
      record.handoff = {
        status: HANDOFF_STATUS.FAILED,
        employeeId: null,
        errorDetails: handoffRes.error,
        attemptId: handoffRes.attemptId,
        failedAt: new Date().toISOString()
      };
      this._recordTimelineEvent(record, actor, 'HRMS Handoff Failed', handoffRes.error);
    }

    record.updatedAt = new Date().toISOString();
    this._saveRecords(list);
    return { record, handoffRes };
  }

  /**
   * Retries a failed HRMS conversion
   */
  async retryHandoff(id, resolutionNotes = '', actor = 'HR Administrator') {
    const list = this._getRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found.`);

    const record = list[idx];
    const handoffRes = await hrmsHandoffService.retryEmployeeCreation(record, resolutionNotes);

    if (handoffRes.success) {
      record.status = PREBOARDING_STATUS.EMPLOYEE_CREATED;
      record.actionStatus = ACTION_STATUS.COMPLETED;
      record.employeeId = handoffRes.employeeId;
      record.handoff = {
        status: HANDOFF_STATUS.CREATED,
        employeeId: handoffRes.employeeId,
        completedAt: handoffRes.timestamp,
        details: handoffRes.employeeDetails
      };
      this._recordTimelineEvent(record, actor, `HRMS Handoff Retried & Succeeded: ${handoffRes.employeeId}`, `Resolution notes: ${resolutionNotes || 'Retry executed successfully.'}`);
    } else {
      record.status = PREBOARDING_STATUS.HANDOFF_FAILED;
      record.actionStatus = ACTION_STATUS.BLOCKED;
      record.handoff = {
        status: HANDOFF_STATUS.FAILED,
        errorDetails: handoffRes.error,
        attemptId: handoffRes.attemptId,
        failedAt: new Date().toISOString()
      };
      this._recordTimelineEvent(record, actor, 'HRMS Handoff Retry Failed', handoffRes.error);
    }

    record.updatedAt = new Date().toISOString();
    this._saveRecords(list);
    return { record, handoffRes };
  }

  _recordTimelineEvent(record, actor, action, details) {
    if (!record.timeline) record.timeline = [];
    record.timeline.unshift({
      id: `EVT-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      actor: actor || 'HR Administrator',
      action,
      details
    });
  }
}

export const preboardingService = new PreboardingService();
export default preboardingService;
