/**
 * Enterprise Notification & Email Provider Adapter
 * Handles email template interpolation, email dispatch simulation, and delivery auditing
 */

export const EMAIL_TEMPLATES = {
  INTERVIEW_INVITATION: 'INTERVIEW_INVITATION',
  INTERVIEW_RESCHEDULED: 'INTERVIEW_RESCHEDULED',
  INTERVIEW_CANCELLED: 'INTERVIEW_CANCELLED',
  INTERVIEWER_ASSIGNMENT: 'INTERVIEWER_ASSIGNMENT'
};

export const notificationProviderAdapter = {
  /**
   * Builds rich email content and subject based on the session and recipient context
   */
  generateInterviewEmail({
    type = EMAIL_TEMPLATES.INTERVIEW_INVITATION,
    session,
    candidate,
    customInstructions = '',
    companyName = 'PeopleWorks Inc.',
    recruiterName = 'Sarah Jenkins'
  }) {
    const candidateName = candidate?.name || session.candidateName || 'Candidate';
    const roundName = session.roundName || 'Interview Round';
    const requisitionTitle = session.requisitionTitle || 'Position';
    const requisitionId = session.requisitionId || '';
    const date = session.scheduledDate;
    const time = `${session.startTime} - ${session.endTime}`;
    const timezone = session.timezone || 'PST';
    const interviewersList = (session.interviewers || []).map(i => `${i.name} (${i.title || 'Interviewer'})`).join(', ');

    let meetingLocationText = '';
    if (session.interviewType === 'In-Person') {
      meetingLocationText = `Location: ${session.location || 'PeopleWorks HQ'}${session.room ? ` (Room: ${session.room})` : ''}`;
    } else if (session.interviewType === 'Phone') {
      meetingLocationText = `Delivery: Phone Call Screen (Our interviewer will call you at ${candidate?.phone || session.candidatePhone || 'your registered phone number'})`;
    } else {
      meetingLocationText = `Meeting Provider: ${session.meetingProvider || 'Video Conference'}\nJoin Link: ${session.meetingUrl || 'https://teams.microsoft.com/l/meetup-join/mock'}`;
    }

    if (type === EMAIL_TEMPLATES.INTERVIEW_RESCHEDULED) {
      const subject = `Rescheduled: ${roundName} - ${requisitionTitle} | ${companyName}`;
      const body = `Dear ${candidateName},

Please note that your upcoming ${roundName} for the ${requisitionTitle} (${requisitionId}) role has been rescheduled.

NEW INTERVIEW DETAILS:
• Date: ${date}
• Time: ${time} (${timezone})
• ${meetingLocationText}
• Interviewer(s): ${interviewersList || 'Recruitment Team'}

${customInstructions ? `SPECIAL INSTRUCTIONS:\n${customInstructions}\n\n` : ''}If you have any questions or require further adjustments, please reply directly to this email.

Best regards,
${recruiterName}
Talent Acquisition Team | ${companyName}`;

      return {
        subject,
        body,
        recipient: candidate?.email || session.candidateEmail,
        type
      };
    }

    if (type === EMAIL_TEMPLATES.INTERVIEW_CANCELLED) {
      const subject = `Cancelled: ${roundName} - ${requisitionTitle} | ${companyName}`;
      const body = `Dear ${candidateName},

This is to notify you that the scheduled ${roundName} for ${requisitionTitle} on ${date} at ${time} has been cancelled.

Our recruitment team will reach out to you with further updates regarding the next steps in your application.

Best regards,
${recruiterName}
Talent Acquisition Team | ${companyName}`;

      return {
        subject,
        body,
        recipient: candidate?.email || session.candidateEmail,
        type
      };
    }

    const policySection = session.policyName ? `
ASSESSMENT & INTEGRITY POLICY:
• Applicable Policy: ${session.policyName} (${session.policyId || 'ID-Locked'} v${session.policyVersion || '1.0'})
• Readiness & Integrity Gate: Please complete your system technical readiness check and policy acknowledgement prior to session start.
` : '';

    // Default: INTERVIEW_INVITATION
    const subject = `Interview Invitation: ${roundName} - ${requisitionTitle} | ${companyName}`;
    const body = `Dear ${candidateName},

Thank you for your interest in joining ${companyName}. We are pleased to invite you to the next stage of our selection process: ${roundName} for the position of ${requisitionTitle} (${requisitionId}).

INTERVIEW DETAILS:
• Date: ${date}
• Time: ${time} (${timezone})
• Duration: ${session.duration || 60} Minutes
• ${meetingLocationText}
• Panelists: ${interviewersList || 'Hiring Team'}
${policySection}
${customInstructions ? `NOTE FROM RECRUITER:\n${customInstructions}\n\n` : ''}PREPARATION GUIDELINES:
• Please ensure you have a quiet environment and stable internet connection.
• We recommend joining the session 5 minutes prior to the scheduled start time.
• If you need to reschedule or have technical questions, please contact us immediately.

We look forward to speaking with you!

Warm regards,
${recruiterName}
Talent Acquisition Team | ${companyName}
recruitment@peopleworks.ai`;

    return {
      subject,
      body,
      recipient: candidate?.email || session.candidateEmail,
      type
    };
  },

  /**
   * Dispatches email / in-app notification and logs audit trail
   */
  async dispatchNotification({ type, recipient, title, message, body = null, metadata = {} }) {
    // Validate recipient
    if (!recipient || !recipient.includes('@')) {
      return {
        id: `NOTIF-${Date.now()}`,
        type,
        recipient,
        title,
        message,
        body: body || message,
        metadata,
        sentAt: new Date().toISOString(),
        delivered: false,
        status: 'FAILED',
        error: 'Invalid or missing recipient email address.'
      };
    }

    const event = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      recipient,
      title,
      message,
      body: body || message,
      metadata,
      sentAt: new Date().toISOString(),
      delivered: true,
      status: 'SENT'
    };

    // Store in session log for auditing
    try {
      if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem('pw_interview_notifications');
        const list = saved ? JSON.parse(saved) : [];
        sessionStorage.setItem('pw_interview_notifications', JSON.stringify([event, ...list].slice(0, 50)));
      }
    } catch (e) {
      console.warn('Could not save notification to session storage', e);
    }

    return event;
  }
};

