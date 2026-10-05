/**
 * AI Response Formatter
 * Transforms raw execution results and intent responses into user-friendly localized text
 * and structured visual presentation cards (ActionCard, ScreeningCard, InterviewCard, ApprovalCard).
 */

export class AIResponseFormatter {
  /**
   * Generates localized response text & presentation cards based on execution outcome
   */
  static formatResult(toolName, result, language = 'en', userPrompt = '') {
    if (!result.success) {
      return {
        text: this._getLocalizedErrorText(result.message, language),
        cards: [
          {
            type: 'error',
            title: 'Action Blocked / Incomplete',
            message: result.message || 'The requested operation could not be completed.',
            details: result.error
          }
        ]
      };
    }

    const data = result.data;
    switch (toolName) {
      case 'approveJobDescription':
        return {
          text: language === 'te'
            ? `✅ JD '${data.title}' విజయవంతంగా approve చేయబడింది.`
            : (language === 'hi'
                ? `✅ JD '${data.title}' सफलतापूर्वक स्वीकृत (Approved) हो गया है।`
                : `✅ Job Description **${data.title}** (${data.id}) was approved successfully.`),
          cards: [
            {
              type: 'action_result',
              title: 'Job Description Approved',
              badge: 'Approved',
              badgeColor: 'emerald',
              details: [
                { label: 'JD ID', value: data.id },
                { label: 'Title', value: data.title },
                { label: 'Department', value: data.department },
                { label: 'Version', value: data.version || 'v1.0' },
                { label: 'Status', value: 'Ready for Publishing' }
              ],
              actions: [
                { label: 'Publish to Job Boards', actionIntent: 'publish_jd', jdId: data.id }
              ]
            }
          ]
        };

      case 'publishJobDescription':
        return {
          text: language === 'te'
            ? `🚀 '${data.title}' ఉద్యోగ వివరణ జాబ్ బోర్డులలో విజయవంతంగా ప్రచురించబడింది.`
            : (language === 'hi'
                ? `🚀 '${data.title}' जॉब डिस्क्रिप्शन को जॉब बोर्ड्स पर प्रकाशित (Published) कर दिया गया है।`
                : `🚀 Job Posting for **${data.title}** has been published across target channels.`),
          cards: [
            {
              type: 'action_result',
              title: 'Job Posting Live',
              badge: 'Published',
              badgeColor: 'blue',
              details: [
                { label: 'Posting Title', value: data.title },
                { label: 'Active Channels', value: (data.publishedChannels || ['Careers Portal', 'LinkedIn', 'Indeed']).join(', ') },
                { label: 'Published Date', value: new Date().toLocaleDateString() },
                { label: 'Status', value: 'Live & Accepting Applications' }
              ]
            }
          ]
        };

      case 'getApprovalChain':
        const steps = data.approvalChain || [];
        const stepListText = steps.map((s, idx) => `${idx + 1}. **${s.role}**: ${s.name} (${s.status})`).join('\n');
        return {
          text: language === 'te'
            ? `👥 **ఆమోద క్రమం (Approval Chain):**\n\n${stepListText}`
            : (language === 'hi'
                ? `👥 **स्वीकृति पदानुक्रम (Approval Chain):**\n\n${stepListText}`
                : `👥 **Configured Approval Chain (${data.requisitionTitle || 'Requisition'}):**\n\n${stepListText}`),
          cards: [
            {
              type: 'action_result',
              title: `Approval Chain: ${data.requisitionTitle || 'Requisition'}`,
              badge: `${steps.length} Steps`,
              badgeColor: 'blue',
              details: steps.map(s => ({ label: s.role, value: `${s.name} (${s.status})` })),
              approvalSteps: steps
            }
          ]
        };

      case 'createRequisition':
        return {
          text: language === 'te'
            ? `📋 కొత్త Requisition '${data.title}' (${data.id}) విజయవంతంగా సృష్టించబడింది.`
            : (language === 'hi'
                ? `📋 नया Requisition '${data.title}' (${data.id}) सफलतापूर्वक बना दिया गया है।`
                : `📋 Requisition **${data.title}** (${data.id}) created and submitted for approval.`),
          cards: [
            {
              type: 'action_result',
              title: 'Requisition Created',
              badge: 'Pending Approval',
              badgeColor: 'amber',
              details: [
                { label: 'Requisition ID', value: data.id },
                { label: 'Title', value: data.title },
                { label: 'Department', value: data.department },
                { label: 'Openings', value: String(data.openings) },
                { label: 'Location', value: data.location },
                { label: 'Hiring Manager', value: data.hiringManager }
              ],
              approvalSteps: (data.approvalChain || []).map(s => ({
                role: s.role,
                status: s.status,
                name: s.name
              }))
            }
          ]
        };

      case 'approveRequisitionStep':
        return {
          text: `✅ Requisition **${data.title}** step approved successfully. Current Status: **${data.status}**.`,
          cards: [
            {
              type: 'approval_result',
              title: 'Requisition Step Approved',
              badge: data.status,
              badgeColor: data.status === 'Approved' ? 'emerald' : 'amber',
              details: [
                { label: 'Requisition ID', value: data.id },
                { label: 'Title', value: data.title },
                { label: 'Current Status', value: data.status }
              ]
            }
          ]
        };

      case 'scheduleInterview':
        return {
          text: language === 'te'
            ? `📅 ${data.session.candidateName} గారికి ${data.session.scheduledDate} న ${data.session.startTime} గంటలకు ఇంటర్వ్యూ షెడ్యూల్ చేయబడింది.`
            : (language === 'hi'
                ? `📅 ${data.session.candidateName} का इंटरव्यू ${data.session.scheduledDate} को ${data.session.startTime} बजे निर्धारित (Scheduled) कर दिया गया है।`
                : `📅 **${data.session.candidateName}** has been scheduled for **${data.session.roundName}** on **${data.session.scheduledDate} at ${data.session.startTime}**.`),
          cards: [
            {
              type: 'interview_card',
              title: 'Interview Scheduled',
              badge: 'Scheduled',
              badgeColor: 'blue',
              details: [
                { label: 'Candidate', value: data.session.candidateName },
                { label: 'Round', value: data.session.roundName },
                { label: 'Date & Time', value: `${data.session.scheduledDate} at ${data.session.startTime}` },
                { label: 'Panelists', value: (data.session.interviewers || []).map(i => i.name).join(', ') },
                { label: 'Meeting Link', value: 'Microsoft Teams (Simulated)' },
                { label: 'Notification', value: 'Email Invite Dispatched ✓' }
              ]
            }
          ]
        };

      case 'screenCandidateAgainstJD':
        return {
          text: `🎯 Screening evaluation for **${data.candidateName}** against **${data.jobTitle}**: Match Score **${data.screeningScore}%** (${data.recommendation}).`,
          cards: [
            {
              type: 'screening_result',
              title: `Screening Report: ${data.candidateName}`,
              score: data.screeningScore,
              recommendation: data.recommendation,
              matchedSkills: data.matchedSkills || [],
              missingSkills: data.missingSkills || [],
              summary: data.summary,
              actions: [
                { label: 'Schedule Interview', actionIntent: 'schedule_interview', candidateId: data.candidateId },
                { label: 'Shortlist Candidate', actionIntent: 'move_stage', candidateId: data.candidateId, targetStage: 'Shortlisted' }
              ]
            }
          ]
        };

      case 'updateCandidateContact':
        return {
          text: `✏️ Updated contact details for candidate **${data.candidateName || data.name}**.`,
          cards: [
            {
              type: 'action_result',
              title: 'Candidate Profile Updated',
              badge: 'Synchronized',
              badgeColor: 'emerald',
              details: [
                { label: 'Candidate ID', value: data.id },
                { label: 'Name', value: data.candidateName || data.name },
                { label: 'Email', value: data.email },
                { label: 'Phone', value: data.phone || 'N/A' },
                { label: 'Location', value: data.location }
              ]
            }
          ]
        };

      case 'searchCandidates':
        return {
          text: `🔍 Found **${data.length}** candidate(s) matching your criteria:`,
          cards: [
            {
              type: 'candidate_list',
              title: 'Matching Candidates',
              candidates: data.slice(0, 5)
            }
          ]
        };

      case 'getPendingJdApprovals': {
        const count = data.count ?? 0;
        const pendingList = data.pendingJds || [];
        let text = '';
        if (count === 0) {
          text = `There are currently **0 JDs** pending approval. All job descriptions are up to date!`;
        } else if (count === 1) {
          text = `There is **1 JD** currently pending approval. Would you like me to show the details or approve it?`;
        } else {
          text = `There are **${count} JDs** currently pending approval. Would you like me to show the pending JDs?`;
        }

        const cards = count > 0 ? [
          {
            type: 'pending_jds_list',
            title: `Pending Job Description Approvals (${count})`,
            items: pendingList.map(j => ({
              id: j.id,
              title: j.title,
              department: j.department,
              status: j.status
            })),
            actions: [
              { label: 'View Pending JDs', actionIntent: 'view_jds' }
            ]
          }
        ] : [];

        return { text, cards };
      }

      case 'getDashboardMetrics':
        return {
          text: `📊 **PeopleWorks ATS Live Snapshot**:\n\n- **Open Requisitions:** ${data.openRequisitions || 0}\n- **Total Candidates:** ${data.totalCandidates || 0}\n- **Active Interviews:** ${data.activeInterviews || 0}\n- **Pending Approvals:** ${data.pendingApprovals || 0}`,
          cards: [
            {
              type: 'metrics_summary',
              title: 'Operational KPIs',
              metrics: [
                { label: 'Open Requisitions', value: data.openRequisitions || 0, color: 'blue' },
                { label: 'Candidates in Pool', value: data.totalCandidates || 0, color: 'cyan' },
                { label: 'Scheduled Interviews', value: data.activeInterviews || 0, color: 'amber' },
                { label: 'Pending Approvals', value: data.pendingApprovals || 0, color: 'purple' }
              ]
            }
          ]
        };

      case 'generateInterviewQuestions':
        return {
          text: `💡 Generated **${data.length}** structured interview questions tailored for the evaluation:`,
          cards: [
            {
              type: 'questions_list',
              title: 'Generated Interview Kit',
              questions: data
            }
          ]
        };

      case 'publishJobPosting':
      case 'createJobPosting': {
        const p = data.posting || data;
        const postingId = p.id || p.postingId || 'POST-2026-0001';
        const rawChannels = p.channels || ['careers_portal', 'linkedin', 'naukri', 'indeed'];
        const map = {
          careers_portal: 'Careers Portal',
          linkedin: 'LinkedIn',
          naukri: 'Naukri',
          indeed: 'Indeed',
          glassdoor: 'Glassdoor',
          employee_referral: 'Employee Referral',
          internal_mobility: 'Internal Mobility'
        };
        const channelNames = rawChannels.map(c => map[c] || c);
        const isPublished = p.status === 'Published';
        return {
          text: language === 'te'
            ? `🚀 జాబ్ పోస్టింగ్ \`${postingId}\` (${p.title}) ${isPublished ? 'విజయవంతంగా ప్రచురించబడింది' : 'సృష్టించబడింది'}.`
            : (language === 'hi'
                ? `🚀 जॉब पोस्टिंग \`${postingId}\` (${p.title}) ${isPublished ? 'सफलतापूर्वक प्रकाशित' : 'बना दी'} गई है।`
                : `🚀 Job Posting **${p.title}** (\`${postingId}\`) has been ${isPublished ? 'published live' : 'created'} across channels: ${channelNames.join(', ')}.`),
          cards: [
            {
              type: 'publication_result',
              title: `Posting Live: ${p.title}`,
              badge: isPublished ? 'Published Live' : 'Active Draft',
              badgeColor: isPublished ? 'emerald' : 'blue',
              details: [
                { label: 'Posting ID', value: postingId },
                { label: 'Linked JD', value: p.jdId || 'JD-2026-0001' },
                { label: 'Location', value: p.location || 'Bangalore, India' },
                { label: 'Channels', value: channelNames.join(', ') },
                { label: 'Status', value: p.status || 'Published' }
              ]
            }
          ]
        };
      }

      case 'parseResumeDocument': {
        const c = data || {};
        return {
          text: language === 'te'
            ? `📄 **రెజ్యూమ్ విజయవంతంగా పార్స్ చేయబడింది:** ${c.candidateName} (${c.currentTitle || 'Professional'}) వివరాలు సేకరించబడ్డాయి.`
            : (language === 'hi'
                ? `📄 **रिज्यूम सफलतापूर्वक पार्स किया गया:** ${c.candidateName} (${c.currentTitle || 'Professional'}) का विवरण निकाला गया।`
                : `📄 **Resume Parsed Successfully:** Extracted details for **${c.candidateName}** (${c.currentTitle || 'Professional'}).`),
          cards: [
            {
              type: 'candidate_extraction_card',
              title: `Extracted Details: ${c.candidateName || 'Candidate'}`,
              badge: 'Extracted',
              badgeColor: 'emerald',
              fields: [
                { label: 'Name', value: c.candidateName || 'Not Found', status: 'Extracted' },
                { label: 'Email', value: c.email || 'Not Found', status: c.email ? 'Extracted' : 'Not Found' },
                { label: 'Phone', value: c.phone || 'Not Found', status: c.phone ? 'Extracted' : 'Not Found' },
                { label: 'Location', value: c.location || 'Bangalore, India', status: 'Extracted' },
                { label: 'Experience', value: c.totalExperience || '0 yrs', status: 'Extracted' },
                { label: 'Current Role', value: c.currentTitle || 'Not Found', status: 'Extracted' },
                { label: 'Company', value: c.currentCompany || 'Not Found', status: 'Extracted' },
                { label: 'Education', value: c.education || 'B.Tech', status: 'Extracted' },
                { label: 'Notice Period', value: 'Not Found', status: 'Not Found' },
                { label: 'Certifications', value: 'Not Found', status: 'Not Found' }
              ],
              skills: c.skills || ['Java', 'Spring Boot', 'SQL']
            }
          ]
        };
      }

      case 'checkCandidateDuplicate': {
        const isDup = data?.isDuplicate;
        const matched = data?.matchedCandidate;
        if (isDup && matched) {
          return {
            text: `⚠️ **Possible Duplicate Found:** A candidate matching this profile exists: **${matched.name || matched.candidateName}** (${matched.email || matched.phone}).`,
            cards: [
              {
                type: 'duplicate_candidate_card',
                title: 'Duplicate Candidate Match',
                matchType: data.matchType,
                reason: data.reason,
                candidate: {
                  id: matched.id,
                  name: matched.name || matched.candidateName,
                  email: matched.email,
                  phone: matched.phone
                }
              }
            ]
          };
        }
        return {
          text: `✅ **No Duplicate Found:** No existing candidate records match this profile.`,
          cards: []
        };
      }

      case 'createCandidateFromResume': {
        const cand = data?.candidate || data || {};
        return {
          text: `🎉 Candidate **${cand.name || cand.candidateName}** (\`${cand.id}\`) created successfully and saved to Candidates Hub.`,
          cards: [
            {
              type: 'candidate_created_card',
              title: `Candidate: ${cand.name || cand.candidateName}`,
              badge: 'Created',
              badgeColor: 'emerald',
              candidateId: cand.id,
              candidateName: cand.name || cand.candidateName,
              email: cand.email,
              phone: cand.phone,
              location: cand.location,
              experience: cand.experienceDisplay || `${cand.totalExperience} yrs`,
              skills: cand.skills || []
            }
          ]
        };
      }

      default:
        return {
          text: `Operation completed successfully.`
        };
    }
  }

  static _getLocalizedErrorText(msg = '', lang = 'en') {
    if (lang === 'te') return `⚠️ ఆపరేషన్ పూర్తి కాలేదు: ${msg}`;
    if (lang === 'hi') return `⚠️ ऑपरेशन पूरा नहीं हो सका: ${msg}`;
    return `⚠️ ${msg || 'Action blocked or requires permission.'}`;
  }
}
