/**
 * AI Validation Service
 * Validates tool parameters, schema constraints, and lifecycle state rules
 * before executing state-changing operations.
 */

export class AIValidationService {
  /**
   * Validates requisition creation payload
   */
  static validateRequisition(data) {
    const errors = [];
    const title = data.jobTitle || data.title;
    if (!title || title.trim().length < 3) {
      errors.push('Requisition title is required and must be at least 3 characters.');
    }
    if (!data.department || data.department.trim().length === 0) {
      errors.push('Department is required.');
    }
    const openings = Number(data.openings || data.targetOpenings || data.headcount || 1);
    if (isNaN(openings) || openings < 1) {
      errors.push('Openings count must be at least 1.');
    }
    if (data.costCenter && !/^CC-\w+$/i.test(data.costCenter.trim())) {
      errors.push('Cost center format must be CC-XXXX.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates Job Description creation payload
   */
  static validateJD(data) {
    const errors = [];
    const title = data.title || data.jobTitle;
    if (!title || title.trim().length < 3) {
      errors.push('Job Description title is required and must be at least 3 characters.');
    }
    if (!data.department || data.department.trim().length === 0) {
      errors.push('Department is required.');
    }
    const expMin = Number(data.experienceMin !== undefined ? data.experienceMin : (data.minExperience || 0));
    const expMax = Number(data.experienceMax !== undefined ? data.experienceMax : (data.maxExperience || 0));
    if (isNaN(expMin) || expMin < 0) {
      errors.push('Minimum experience must be a non-negative number.');
    }
    if (isNaN(expMax) || expMax < 0) {
      errors.push('Maximum experience must be a non-negative number.');
    }
    if (!isNaN(expMin) && !isNaN(expMax) && expMax < expMin) {
      errors.push(`Maximum experience (${expMax} yrs) cannot be less than Minimum experience (${expMin} yrs).`);
    }
    if (!data.summary || data.summary.trim().length < 5) {
      errors.push('Job Summary is required and must be at least 5 characters.');
    }
    if (!data.responsibilities || (Array.isArray(data.responsibilities) ? data.responsibilities.length === 0 : data.responsibilities.trim().length < 5)) {
      errors.push('Key Responsibilities are required.');
    }
    const reqSkills = data.requiredSkills || data.mandatorySkills;
    if (!reqSkills || (Array.isArray(reqSkills) ? reqSkills.length === 0 : reqSkills.trim().length < 2)) {
      errors.push('Mandatory / Required skills are required.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates candidate update payload (email, phone, etc.)
   */
  static validateCandidateUpdate(field, value) {
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !emailRegex.test(value.trim())) {
        return { isValid: false, error: 'Please provide a valid email address (e.g. name@company.com).' };
      }
    }
    if (field === 'phone') {
      const clean = (value || '').replace(/[^\d+]/g, '');
      if (clean.length < 8) {
        return { isValid: false, error: 'Please provide a valid phone number with country/area code.' };
      }
    }
    return { isValid: true };
  }

  /**
   * Validates interview scheduling payload
   */
  static validateInterviewSchedule(data) {
    const errors = [];
    if (!data.candidateId && !data.candidateName) {
      errors.push('Candidate identifier is required.');
    }
    if (!data.scheduledDate) {
      errors.push('Interview date is required.');
    }
    if (!data.startTime) {
      errors.push('Interview start time is required.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates Job Posting creation & distribution payload
   */
  static validateJobPosting(data) {
    const errors = [];
    const title = data.title || data.postingTitle;
    if (!title || title.trim().length < 3) {
      errors.push('Job Posting title is required and must be at least 3 characters.');
    }
    if (!data.department || data.department.trim().length === 0) {
      errors.push('Department is required.');
    }
    if (!data.location || data.location.trim().length === 0) {
      errors.push('Location is required.');
    }
    if (!data.jdId) {
      errors.push('Approved Job Description association is required.');
    }
    if (data.channels && (!Array.isArray(data.channels) || data.channels.length === 0)) {
      errors.push('At least one distribution channel must be selected.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
