/**
 * Candidate Stage Transition Business Rules Engine
 * 
 * Flow:
 * Applied -> Screening -> Shortlisted -> Interview -> Offer -> Joined
 * Outcome: Rejected (reachable from any stage with rejection reason)
 */

export const ALLOWED_TRANSITIONS = {
  Applied: ['Screening', 'Shortlisted', 'Rejected'],
  Screening: ['Shortlisted', 'Interview', 'Rejected'],
  Shortlisted: ['Interview', 'Offer', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Joined', 'Rejected'],
  Joined: [], // Terminal stage
  Rejected: ['Applied', 'Screening', 'Shortlisted', 'Interview'] // Allow reopen
};

export const validateStageTransition = (candidate, currentStage, newStage, jd = null) => {
  if (!currentStage || !newStage || currentStage === newStage) {
    return { allowed: true, reason: '' };
  }

  // Moving to Rejected is always allowed with a valid rejection reason
  if (newStage === 'Rejected') {
    return { allowed: true, reason: '' };
  }

  // Check allowed stage transitions
  const allowedNext = ALLOWED_TRANSITIONS[currentStage] || [];
  if (!allowedNext.includes(newStage)) {
    return {
      allowed: false,
      reason: `Invalid Stage Transition: Candidates cannot move directly from "${currentStage}" to "${newStage}". Standard workflow progression: Applied → Screening → Shortlisted → Interview → Offer → Joined.`
    };
  }

  // Screening validation: Requires completed resume parsing & screening score
  if (newStage === 'Screening' && !candidate.screeningResult) {
    return {
      allowed: false,
      reason: 'Screening evaluation cannot be completed because screening scores have not been calculated.'
    };
  }

  // Shortlisted validation: Requires minimum fit or recruiter review
  if (newStage === 'Shortlisted' && candidate.screeningResult?.overall < 50) {
    return {
      allowed: true,
      warning: 'Note: Candidate screening score is below 50%. Proceeding to Shortlisted upon recruiter override.'
    };
  }

  return { allowed: true, reason: '' };
};
