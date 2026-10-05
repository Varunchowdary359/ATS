/**
 * Enterprise HRMS Handoff & Employee Conversion Service
 * PeopleWorks ATS SaaS
 */

import { HANDOFF_STATUS, PREBOARDING_STATUS } from './preboardingTypes';
import { evaluateJoiningReadiness } from './preboardingValidation';

class HrmsHandoffService {
  constructor() {
    this.storageKey = 'pw_hrms_handoff_registry';
  }

  _getStorage() {
    try {
      const data = sessionStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  _saveStorage(data) {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  /**
   * Pre-flight validation prior to initiating HRMS conversion
   */
  async validateHandoff(record) {
    if (!record) {
      return { canHandoff: false, errors: ['Invalid preboarding record'] };
    }

    const readiness = evaluateJoiningReadiness(record);
    if (!readiness.isReady) {
      return {
        canHandoff: false,
        readiness,
        errors: readiness.blockers
      };
    }

    return {
      canHandoff: true,
      readiness,
      errors: []
    };
  }

  /**
   * Compiles the normalized canonical JSON payload for Enterprise HRMS ingestion
   */
  prepareEmployeePayload(record) {
    if (!record) throw new Error('Cannot prepare payload: missing preboarding record.');

    return {
      integrationHeader: {
        sourceSystem: 'PeopleWorks_ATS',
        targetSystem: 'PeopleWorks_HRMS_Core',
        schemaVersion: '2026.1',
        timestamp: new Date().toISOString()
      },
      identifiers: {
        candidateId: record.candidateId,
        applicationId: record.applicationId,
        requisitionId: record.requisitionId,
        offerId: record.offerId,
        preboardingId: record.id
      },
      personalInfo: {
        firstName: record.candidateInfo?.firstName || record.candidateName?.split(' ')[0] || '',
        lastName: record.candidateInfo?.lastName || record.candidateName?.split(' ').slice(1).join(' ') || '',
        dateOfBirth: record.candidateInfo?.dob || null,
        nationality: record.candidateInfo?.nationality || 'India',
        gender: record.candidateInfo?.gender || 'Not Disclosed',
        email: record.candidateInfo?.email || record.candidateEmail,
        mobile: record.candidateInfo?.mobile || record.candidatePhone
      },
      address: {
        current: record.candidateInfo?.currentAddress || '',
        city: record.candidateInfo?.city || '',
        state: record.candidateInfo?.state || '',
        country: record.candidateInfo?.country || 'India',
        postalCode: record.candidateInfo?.postalCode || ''
      },
      emergencyContact: {
        name: record.candidateInfo?.emergencyContactName || '',
        relationship: record.candidateInfo?.emergencyContactRelationship || '',
        mobile: record.candidateInfo?.emergencyContactMobile || '',
        email: record.candidateInfo?.emergencyContactEmail || ''
      },
      employmentTerms: {
        designation: record.joiningDetails?.designation || record.jobTitle,
        department: record.joiningDetails?.department || record.department,
        businessUnit: record.joiningDetails?.businessUnit || 'Technology & Engineering',
        workLocation: record.joiningDetails?.location || record.location,
        workArrangement: record.joiningDetails?.workArrangement || 'Hybrid',
        employmentType: record.joiningDetails?.employmentType || 'Full Time',
        jobGrade: record.joiningDetails?.jobLevel || 'L4 - Senior',
        reportingManager: record.joiningDetails?.reportingManager || 'Marcus Vance',
        joiningDate: record.joiningDetails?.joiningDate || record.joiningDate,
        shiftSchedule: record.joiningDetails?.shift || 'General Day Shift (9 AM - 6 PM)',
        probationMonths: record.joiningDetails?.probationPeriod ? parseInt(record.joiningDetails.probationPeriod) : 3,
        noticePeriodDays: record.joiningDetails?.noticePeriod ? parseInt(record.joiningDetails.noticePeriod) : 30
      },
      compensation: {
        currency: record.compensation?.currency || 'INR',
        baseSalary: record.compensation?.baseSalary || 2400000,
        variablePay: record.compensation?.variablePay || 400000,
        totalCtc: record.compensation?.totalCtc || 2800000,
        payFrequency: record.compensation?.payFrequency || 'Annual',
        bankAccountVerified: true
      },
      complianceSummary: {
        mandatoryDocumentsCount: (record.documents || []).filter(d => d.required).length,
        verifiedDocumentsCount: (record.documents || []).filter(d => d.status === 'Verified').length,
        bgvClearanceStatus: 'Cleared',
        verifiedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Dispatches the Handoff Payload to Enterprise HRMS Core API
   */
  async createEmployee(record, options = {}) {
    await new Promise(r => setTimeout(r, 800)); // Network latency simulation

    const payload = this.prepareEmployeePayload(record);
    const store = this._getStorage();
    const history = store[record.id] || [];

    // Optional simulated error hook for testing resilience
    if (options.simulateFailure) {
      const failedEntry = {
        attemptId: `ATT-${Date.now().toString().slice(-6)}`,
        preboardingId: record.id,
        status: HANDOFF_STATUS.FAILED,
        timestamp: new Date().toISOString(),
        errorDetails: options.failureReason || 'HRMS API Gateway Timeout: Department code mapping missing in HRMS master table.',
        payloadSnapshot: payload
      };
      history.unshift(failedEntry);
      store[record.id] = history;
      this._saveStorage(store);

      return {
        success: false,
        status: HANDOFF_STATUS.FAILED,
        error: failedEntry.errorDetails,
        attemptId: failedEntry.attemptId
      };
    }

    // Success response: Assign corporate Employee ID
    const employeeId = options.customEmployeeId || `EMP-${Math.floor(10000 + Math.random() * 90000)}`;
    const successEntry = {
      attemptId: `ATT-${Date.now().toString().slice(-6)}`,
      preboardingId: record.id,
      status: HANDOFF_STATUS.CREATED,
      employeeId,
      timestamp: new Date().toISOString(),
      hrmsProvisioning: {
        corporateEmail: `${record.candidateInfo?.firstName?.toLowerCase() || 'employee'}.${record.candidateInfo?.lastName?.toLowerCase() || 'user'}@peopleworks.io`,
        adAccountProvisioned: true,
        payrollProfileCreated: true,
        benefitsEnrolled: true,
        welcomeEmailDispatched: true
      },
      payloadSnapshot: payload
    };

    history.unshift(successEntry);
    store[record.id] = history;
    this._saveStorage(store);

    return {
      success: true,
      status: HANDOFF_STATUS.CREATED,
      employeeId,
      employeeDetails: successEntry.hrmsProvisioning,
      timestamp: successEntry.timestamp
    };
  }

  /**
   * Retries a previously failed HRMS conversion
   */
  async retryEmployeeCreation(record, failureResolution = '') {
    return this.createEmployee(record, {
      simulateFailure: false,
      notes: `Retry executed. Resolution: ${failureResolution || 'HR administrator cleared data anomaly.'}`
    });
  }

  /**
   * Retrieves full conversion transaction history for an onboarding record
   */
  async getHandoffHistory(preboardingId) {
    await new Promise(r => setTimeout(r, 150));
    const store = this._getStorage();
    return store[preboardingId] || [];
  }

  /**
   * Fetches latest HRMS provisioning status
   */
  async getEmployeeCreationStatus(preboardingId) {
    const history = await this.getHandoffHistory(preboardingId);
    if (!history.length) {
      return { status: HANDOFF_STATUS.READY, employeeId: null };
    }
    const latest = history[0];
    return {
      status: latest.status,
      employeeId: latest.employeeId || null,
      errorDetails: latest.errorDetails || null,
      timestamp: latest.timestamp,
      hrmsProvisioning: latest.hrmsProvisioning || null
    };
  }
}

export const hrmsHandoffService = new HrmsHandoffService();
export default hrmsHandoffService;
