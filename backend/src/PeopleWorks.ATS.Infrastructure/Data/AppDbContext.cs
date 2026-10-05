using System;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Domain.Common;
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

namespace PeopleWorks.ATS.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    private readonly ICurrentTenantService _currentTenantService;
    private readonly ICurrentUserService? _currentUserService;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        ICurrentTenantService currentTenantService,
        ICurrentUserService? currentUserService = null) : base(options)
    {
        _currentTenantService = currentTenantService;
        _currentUserService = currentUserService;
    }

    // Tenant & Setup
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<FeatureFlag> FeatureFlags => Set<FeatureFlag>();

    // Identity & Access
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserRequisitionAssignment> UserRequisitionAssignments => Set<UserRequisitionAssignment>();
    public DbSet<OtpChallenge> OtpChallenges => Set<OtpChallenge>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();

    // Requisitions
    public DbSet<Requisition> Requisitions => Set<Requisition>();
    public DbSet<RequisitionApprovalStep> RequisitionApprovalSteps => Set<RequisitionApprovalStep>();
    public DbSet<RequisitionApprovalAudit> RequisitionApprovalAudits => Set<RequisitionApprovalAudit>();

    // Job Descriptions & Postings
    public DbSet<JobDescription> JobDescriptions => Set<JobDescription>();
    public DbSet<JobDescriptionVersion> JobDescriptionVersions => Set<JobDescriptionVersion>();
    public DbSet<JDWorkflowRule> JDWorkflowRules => Set<JDWorkflowRule>();
    public DbSet<JDWorkflowStep> JDWorkflowSteps => Set<JDWorkflowStep>();
    public DbSet<JobPosting> JobPostings => Set<JobPosting>();
    public DbSet<JobPostingChannel> JobPostingChannels => Set<JobPostingChannel>();

    // Candidates
    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<CandidateSkill> CandidateSkills => Set<CandidateSkill>();
    public DbSet<CandidateExperience> CandidateExperiences => Set<CandidateExperience>();
    public DbSet<CandidateEducation> CandidateEducations => Set<CandidateEducation>();
    public DbSet<CandidateDocument> CandidateDocuments => Set<CandidateDocument>();
    public DbSet<CandidateNote> CandidateNotes => Set<CandidateNote>();
    public DbSet<CandidateCommunication> CandidateCommunications => Set<CandidateCommunication>();

    // Applications & Screening
    public DbSet<AtsApplication> Applications => Set<AtsApplication>();
    public DbSet<ApplicationTimelineEvent> ApplicationTimelineEvents => Set<ApplicationTimelineEvent>();
    public DbSet<ScreeningEvaluation> ScreeningEvaluations => Set<ScreeningEvaluation>();

    // Interviews & Assessment
    public DbSet<InterviewPlan> InterviewPlans => Set<InterviewPlan>();
    public DbSet<InterviewRound> InterviewRounds => Set<InterviewRound>();
    public DbSet<InterviewSession> InterviewSessions => Set<InterviewSession>();
    public DbSet<InterviewPanelist> InterviewPanelists => Set<InterviewPanelist>();
    public DbSet<InterviewScorecard> InterviewScorecards => Set<InterviewScorecard>();
    public DbSet<ScorecardCriterionRating> ScorecardCriterionRatings => Set<ScorecardCriterionRating>();
    public DbSet<SessionViolation> SessionViolations => Set<SessionViolation>();

    // Policies & Integrity
    public DbSet<AssessmentPolicy> AssessmentPolicies => Set<AssessmentPolicy>();
    public DbSet<PolicyRule> PolicyRules => Set<PolicyRule>();
    public DbSet<PolicyAssignment> PolicyAssignments => Set<PolicyAssignment>();
    public DbSet<CandidatePolicyAcceptance> CandidatePolicyAcceptances => Set<CandidatePolicyAcceptance>();
    public DbSet<InterviewerPolicyAcceptance> InterviewerPolicyAcceptances => Set<InterviewerPolicyAcceptance>();
    public DbSet<TechnicalReadinessCheck> TechnicalReadinessChecks => Set<TechnicalReadinessCheck>();

    // Notifications & Audit
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationRecipient> NotificationRecipients => Set<NotificationRecipient>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SecurityEvent> SecurityEvents => Set<SecurityEvent>();

    public Guid CurrentTenantId => _currentTenantService?.TenantId ?? Guid.Empty;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Configure Global Query Filters for ITenantScopedEntity
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ITenantScopedEntity).IsAssignableFrom(entityType.ClrType))
            {
                var parameter = Expression.Parameter(entityType.ClrType, "e");
                var tenantProperty = Expression.Property(parameter, nameof(ITenantScopedEntity.TenantId));

                // Reference dynamic DbContext instance property: this.CurrentTenantId
                var contextProperty = Expression.Property(
                    Expression.Constant(this),
                    nameof(CurrentTenantId));

                // If CurrentTenantId == Guid.Empty (bypass / system / unauthenticated), allow all
                var emptyGuid = Expression.Constant(Guid.Empty);
                var isBypass = Expression.Equal(contextProperty, emptyGuid);
                var matchesTenant = Expression.Equal(tenantProperty, contextProperty);

                var filterCondition = Expression.OrElse(isBypass, matchesTenant);
                var filterLambda = Expression.Lambda(filterCondition, parameter);

                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filterLambda);
            }
        }
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var currentUserId = _currentUserService?.UserId?.ToString() ?? "system";
        var currentTenantId = _currentTenantService.TenantId;
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<ITenantScopedEntity>())
        {
            if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty && currentTenantId != Guid.Empty)
            {
                entry.Entity.TenantId = currentTenantId;
            }
        }

        foreach (var entry in ChangeTracker.Entries<BaseAuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
                entry.Entity.CreatedBy ??= currentUserId;
                entry.Entity.UpdatedBy ??= currentUserId;
                if (entry.Entity.TenantId == Guid.Empty && currentTenantId != Guid.Empty)
                {
                    entry.Entity.TenantId = currentTenantId;
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedBy = currentUserId;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
