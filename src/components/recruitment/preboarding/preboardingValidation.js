/**
 * Enterprise Preboarding Validation Engine & Readiness Gate
 * PeopleWorks ATS SaaS
 */

import { DOCUMENT_STATUS, BGV_STATUS, TASK_STATUS } from './preboardingTypes';

export const validateCandidateInfo = (info = {}) => {
  const errors = {};

  // Personal
  const firstName = typeof info.firstName === 'string' ? info.firstName.trim() : '';
  const lastName = typeof info.lastName === 'string' ? info.lastName.trim() : '';
  
  if (!firstName) {
    errors.firstName = 'First name is required';
  }
  if (!lastName) {
    errors.lastName = 'Last name is required';
  }
  
  if (!info.dob) {
    errors.dob = 'Date of birth is required';
  } else {
    let dobStr = String(info.dob).trim();
    // Convert DD-MM-YYYY to YYYY-MM-DD if needed
    if (/^\d{2}-\d{2}-\d{4}$/.test(dobStr)) {
      const [d, m, y] = dobStr.split('-');
      dobStr = `${y}-${m}-${d}`;
    }
    const birthDate = new Date(dobStr);
    if (isNaN(birthDate.getTime())) {
      errors.dob = 'Please enter a valid date of birth';
    } else {
      const ageDiff = (new Date() - birthDate) / (1000 * 60 * 60 * 24 * 365.25);
      if (ageDiff < 18) {
        errors.dob = 'Candidate must be at least 18 years of age';
      }
    }
  }

  // Contact
  const email = typeof info.email === 'string' ? info.email.trim() : '';
  if (!email) {
    errors.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please provide a valid corporate or personal email';
  }

  // Mobile Phone
  const rawMobile = typeof info.mobile === 'object' && info.mobile !== null
    ? (info.mobile.rawInput || info.mobile.e164 || '')
    : String(info.mobile || '');
  const mobileDigits = rawMobile.replace(/\D/g, '');
  if (!rawMobile.trim() || mobileDigits.length === 0) {
    errors.mobile = 'Mobile phone number is required';
  } else if (mobileDigits.length < 7 || mobileDigits.length > 15) {
    errors.mobile = 'Please enter a valid international phone number (7 to 15 digits)';
  }

  // Alternate Contact (Optional, validate only if provided)
  if (info.alternateContact) {
    const rawAlt = typeof info.alternateContact === 'object' && info.alternateContact !== null
      ? (info.alternateContact.rawInput || info.alternateContact.e164 || '')
      : String(info.alternateContact || '');
    if (rawAlt.trim()) {
      const altDigits = rawAlt.replace(/\D/g, '');
      if (altDigits.length > 0 && (altDigits.length < 7 || altDigits.length > 15)) {
        errors.alternateContact = 'Please enter a valid alternate phone number (7 to 15 digits)';
      }
    }
  }

  // Address
  const currentAddress = typeof info.currentAddress === 'string' ? info.currentAddress.trim() : (typeof info.address === 'string' ? info.address.trim() : '');
  const city = typeof info.city === 'string' ? info.city.trim() : '';
  const state = typeof info.state === 'string' ? info.state.trim() : '';
  const country = typeof info.country === 'string' ? info.country.trim() : '';
  const postalCode = typeof info.postalCode === 'string' ? info.postalCode.trim() : (typeof info.zip === 'string' ? info.zip.trim() : '');

  if (!currentAddress) {
    errors.currentAddress = 'Current residential address is required';
  }
  if (!city) {
    errors.city = 'City is required';
  }
  if (!state) {
    errors.state = 'State / Province is required';
  }
  if (!country) {
    errors.country = 'Country is required';
  }
  if (!postalCode) {
    errors.postalCode = 'Postal / ZIP code is required';
  }

  // Emergency Contact Mobile (Optional, validate only if provided)
  if (info.emergencyContactMobile) {
    const rawEm = typeof info.emergencyContactMobile === 'object' && info.emergencyContactMobile !== null
      ? (info.emergencyContactMobile.rawInput || info.emergencyContactMobile.e164 || '')
      : String(info.emergencyContactMobile || '');
    if (rawEm.trim()) {
      const emDigits = rawEm.replace(/\D/g, '');
      if (emDigits.length > 0 && (emDigits.length < 7 || emDigits.length > 15)) {
        errors.emergencyContactMobile = 'Please enter a valid emergency phone number (7 to 15 digits)';
      }
    }
  }

  // Secondary Emergency Contact (Optional, validate only if provided)
  if (info.secondaryEmergencyContact) {
    const rawSec = typeof info.secondaryEmergencyContact === 'object' && info.secondaryEmergencyContact !== null
      ? (info.secondaryEmergencyContact.rawInput || info.secondaryEmergencyContact.e164 || '')
      : String(info.secondaryEmergencyContact || '');
    if (rawSec.trim()) {
      const secDigits = rawSec.replace(/\D/g, '');
      if (secDigits.length > 0 && (secDigits.length < 7 || secDigits.length > 15)) {
        errors.secondaryEmergencyContact = 'Please enter a valid secondary phone number (7 to 15 digits)';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateJoiningDetails = (details = {}) => {
  const errors = {};

  if (!details.joiningDate) {
    errors.joiningDate = 'Expected joining date is required';
  } else {
    const jDate = new Date(details.joiningDate);
    if (isNaN(jDate.getTime())) {
      errors.joiningDate = 'Invalid date format';
    }
  }

  if (!details.location || !details.location.trim()) {
    errors.location = 'Work location is required';
  }
  if (!details.workArrangement) {
    errors.workArrangement = 'Work arrangement model is required';
  }
  if (!details.department || !details.department.trim()) {
    errors.department = 'Department is required';
  }
  if (!details.designation || !details.designation.trim()) {
    errors.designation = 'Designation is required';
  }
  if (!details.employmentType) {
    errors.employmentType = 'Employment type is required';
  }
  if (!details.reportingManager || !details.reportingManager.trim()) {
    errors.reportingManager = 'Reporting manager is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateDocumentUpload = (file, docConfig = {}) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB

  if (!file) {
    return { isValid: false, error: 'Please select a file to upload' };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'Uploaded file is empty (0 bytes)' };
  }

  if (file.size > maxSizeBytes) {
    return { isValid: false, error: `File size exceeds maximum allowed limit (${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB)` };
  }

  if (file.type && !allowedTypes.includes(file.type)) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(ext)) {
      return { isValid: false, error: 'Unsupported file format. Please upload PDF, JPEG, PNG, or DOC/DOCX' };
    }
  }

  return { isValid: true };
};

/**
 * Evaluates the Formal Joining Readiness Gate (8 Essential Checks)
 * @param {Object} record - The complete preboarding record
 * @returns {Object} { isReady, readinessScore, blockers, checks }
 */
export const evaluateJoiningReadiness = (record) => {
  if (!record) {
    return { isReady: false, readinessScore: 0, blockers: ['Preboarding record not found'], checks: [] };
  }

  const blockers = [];
  const checks = [];

  // Check 1: Offer Acceptance
  const offerAccepted = record.offerStatus === 'ACCEPTED' || record.offerAccepted === true || !!record.offerId;
  checks.push({
    id: 'offer_accepted',
    label: 'Offer Letter Formally Signed & Accepted',
    category: 'Offer',
    passed: offerAccepted,
    details: offerAccepted ? `Offer ID ${record.offerId} accepted` : 'Offer has not been accepted'
  });
  if (!offerAccepted) blockers.push('Candidate offer is not yet formally signed/accepted');

  // Check 2: Candidate Info Completeness
  const candidateInfoValidation = validateCandidateInfo(record.candidateInfo || {});
  checks.push({
    id: 'candidate_info',
    label: 'Candidate Personal, Address & Emergency Contact Info',
    category: 'Candidate Profile',
    passed: candidateInfoValidation.isValid,
    details: candidateInfoValidation.isValid ? 'All mandatory profile fields verified' : Object.values(candidateInfoValidation.errors).join(', ')
  });
  if (!candidateInfoValidation.isValid) blockers.push(`Incomplete Candidate Information: ${Object.values(candidateInfoValidation.errors)[0]}`);

  // Check 3: Joining Details Completeness
  const joiningValidation = validateJoiningDetails(record.joiningDetails || {});
  checks.push({
    id: 'joining_details',
    label: 'Joining Structure, Location & Reporting Manager',
    category: 'Employment Terms',
    passed: joiningValidation.isValid,
    details: joiningValidation.isValid ? `${record.joiningDetails?.designation} in ${record.joiningDetails?.department}` : Object.values(joiningValidation.errors).join(', ')
  });
  if (!joiningValidation.isValid) blockers.push(`Incomplete Joining Details: ${Object.values(joiningValidation.errors)[0]}`);

  // Check 4: Mandatory Documents Verified
  const documents = record.documents || [];
  const mandatoryDocs = documents.filter(d => d.required);
  const unverifiedDocs = mandatoryDocs.filter(d => d.status !== DOCUMENT_STATUS.VERIFIED && d.status !== DOCUMENT_STATUS.WAIVED);
  const docsPassed = mandatoryDocs.length > 0 && unverifiedDocs.length === 0;
  checks.push({
    id: 'mandatory_documents',
    label: 'Mandatory Compliance Documents Verified',
    category: 'Compliance & Verification',
    passed: docsPassed,
    details: docsPassed 
      ? `All ${mandatoryDocs.length} required documents verified` 
      : `${unverifiedDocs.length} pending: ${unverifiedDocs.map(d => d.name).join(', ')}`
  });
  if (!docsPassed) {
    unverifiedDocs.forEach(d => {
      blockers.push(`Missing / Unverified mandatory document: "${d.name}" (${d.status})`);
    });
  }

  // Check 5: Required BGV Checks Completed & Clear
  const bgvChecks = record.bgvChecks || [];
  const requiredBgv = bgvChecks.filter(b => b.required !== false);
  const pendingBgv = requiredBgv.filter(b => b.status !== BGV_STATUS.CLEAR && b.status !== BGV_STATUS.COMPLETED);
  const bgvPassed = requiredBgv.length === 0 || pendingBgv.length === 0;
  checks.push({
    id: 'bgv_clearance',
    label: 'Background Verification (BGV) Clearance',
    category: 'Background Check',
    passed: bgvPassed,
    details: bgvPassed 
      ? `All ${requiredBgv.length} required background checks cleared` 
      : `${pendingBgv.length} checks pending or with discrepancy: ${pendingBgv.map(b => `${b.type} (${b.status})`).join(', ')}`
  });
  if (!bgvPassed) {
    pendingBgv.forEach(b => {
      blockers.push(`BGV check not clear: "${b.type}" is currently in "${b.status}" state`);
    });
  }

  // Check 6: Mandatory Tasks Completed
  const tasks = record.tasks || [];
  const mandatoryTasks = tasks.filter(t => t.required !== false);
  const incompleteTasks = mandatoryTasks.filter(t => t.status !== TASK_STATUS.COMPLETED && t.status !== TASK_STATUS.SKIPPED);
  const tasksPassed = incompleteTasks.length === 0;
  checks.push({
    id: 'mandatory_tasks',
    label: 'Mandatory Cross-Department Tasks Completed',
    category: 'Operational Tasks',
    passed: tasksPassed,
    details: tasksPassed 
      ? `All ${mandatoryTasks.length} mandatory tasks completed` 
      : `${incompleteTasks.length} task(s) incomplete: ${incompleteTasks.map(t => `${t.name} [${t.assigneeRole}]`).join(', ')}`
  });
  if (!tasksPassed) {
    incompleteTasks.forEach(t => {
      blockers.push(`Incomplete task: "${t.name}" assigned to ${t.assigneeRole}`);
    });
  }

  // Check 7: Valid Joining Date Policy
  const joiningDateStr = record.joiningDetails?.joiningDate;
  let datePassed = false;
  if (joiningDateStr) {
    const jDate = new Date(joiningDateStr);
    datePassed = !isNaN(jDate.getTime());
  }
  checks.push({
    id: 'joining_date_validity',
    label: 'Expected Joining Date Validation',
    category: 'Timeline',
    passed: datePassed,
    details: datePassed ? `Scheduled for ${joiningDateStr}` : 'Invalid joining date'
  });
  if (!datePassed) blockers.push('Invalid or missing expected joining date');

  // Check 8: Readiness Approvals
  const approvalsPassed = record.readinessApproval !== 'REJECTED';
  checks.push({
    id: 'approvals',
    label: 'HRBP / Hiring Manager Readiness Sign-off',
    category: 'Governance',
    passed: approvalsPassed,
    details: approvalsPassed ? 'No executive holds or rejections' : 'Readiness sign-off rejected by governance team'
  });
  if (!approvalsPassed) blockers.push('Readiness sign-off rejected');

  const passedCount = checks.filter(c => c.passed).length;
  const readinessScore = Math.round((passedCount / checks.length) * 100);
  const isReady = blockers.length === 0;

  return {
    isReady,
    readinessScore,
    blockers,
    checks,
    passedCount,
    totalCount: checks.length
  };
};
