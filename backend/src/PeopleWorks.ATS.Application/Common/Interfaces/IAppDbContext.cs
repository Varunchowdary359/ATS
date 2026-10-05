using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Domain.Entities.Tenants;
using PeopleWorks.ATS.Domain.Entities.Identity;
using PeopleWorks.ATS.Domain.Entities.Requisitions;
using PeopleWorks.ATS.Domain.Entities.JobDescriptions;
using PeopleWorks.ATS.Domain.Entities.JobPostings;
using PeopleWorks.ATS.Domain.Entities.Candidates;
using PeopleWorks.ATS.Domain.Entities.Applications;
using PeopleWorks.ATS.Domain.Entities.Interviews;
using PeopleWorks.ATS.Domain.Entities.Policies;
using PeopleWorks.ATS.Domain.Entities.Notifications;
using PeopleWorks.ATS.Domain.Entities.Audit;
using AtsApplication = PeopleWorks.ATS.Domain.Entities.Applications.Application;

namespace PeopleWorks.ATS.Application.Common.Interfaces;

public interface IAppDbContext
{
    // Tenant & Setup
    DbSet<Tenant> Tenants { get; }
    DbSet<Company> Companies { get; }
    DbSet<ApiKey> ApiKeys { get; }
    DbSet<FeatureFlag> FeatureFlags { get; }

    // Identity & Access
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<UserRequisitionAssignment> UserRequisitionAssignments { get; }
    DbSet<OtpChallenge> OtpChallenges { get; }
    DbSet<UserSession> UserSessions { get; }

    // Requisitions
    DbSet<Requisition> Requisitions { get; }
    DbSet<RequisitionApprovalStep> RequisitionApprovalSteps { get; }
    DbSet<RequisitionApprovalAudit> RequisitionApprovalAudits { get; }

    // Job Descriptions & Postings
    DbSet<JobDescription> JobDescriptions { get; }
    DbSet<JobDescriptionVersion> JobDescriptionVersions { get; }
    DbSet<JDWorkflowRule> JDWorkflowRules { get; }
    DbSet<JDWorkflowStep> JDWorkflowSteps { get; }
    DbSet<JobPosting> JobPostings { get; }
    DbSet<JobPostingChannel> JobPostingChannels { get; }

    // Candidates
    DbSet<Candidate> Candidates { get; }
    DbSet<CandidateSkill> CandidateSkills { get; }
    DbSet<CandidateExperience> CandidateExperiences { get; }
    DbSet<CandidateEducation> CandidateEducations { get; }
    DbSet<CandidateDocument> CandidateDocuments { get; }
    DbSet<CandidateNote> CandidateNotes { get; }
    DbSet<CandidateCommunication> CandidateCommunications { get; }

    // Applications & Screening
    DbSet<AtsApplication> Applications { get; }
    DbSet<ApplicationTimelineEvent> ApplicationTimelineEvents { get; }
    DbSet<ScreeningEvaluation> ScreeningEvaluations { get; }

    // Interviews & Assessment
    DbSet<InterviewPlan> InterviewPlans { get; }
    DbSet<InterviewRound> InterviewRounds { get; }
    DbSet<InterviewSession> InterviewSessions { get; }
    DbSet<InterviewPanelist> InterviewPanelists { get; }
    DbSet<InterviewScorecard> InterviewScorecards { get; }
    DbSet<ScorecardCriterionRating> ScorecardCriterionRatings { get; }
    DbSet<SessionViolation> SessionViolations { get; }

    // Policies & Integrity
    DbSet<AssessmentPolicy> AssessmentPolicies { get; }
    DbSet<PolicyRule> PolicyRules { get; }
    DbSet<PolicyAssignment> PolicyAssignments { get; }
    DbSet<CandidatePolicyAcceptance> CandidatePolicyAcceptances { get; }
    DbSet<InterviewerPolicyAcceptance> InterviewerPolicyAcceptances { get; }
    DbSet<TechnicalReadinessCheck> TechnicalReadinessChecks { get; }

    // Notifications & Audit
    DbSet<Notification> Notifications { get; }
    DbSet<NotificationRecipient> NotificationRecipients { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<SecurityEvent> SecurityEvents { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
