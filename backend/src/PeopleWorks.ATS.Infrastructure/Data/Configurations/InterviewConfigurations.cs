using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeopleWorks.ATS.Domain.Entities.Interviews;

namespace PeopleWorks.ATS.Infrastructure.Data.Configurations;

public class InterviewPlanConfiguration : IEntityTypeConfiguration<InterviewPlan>
{
    public void Configure(EntityTypeBuilder<InterviewPlan> builder)
    {
        builder.ToTable("InterviewPlans");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name).IsRequired().HasMaxLength(150);
        builder.Property(p => p.Description).HasMaxLength(500);

        builder.HasIndex(p => p.TenantId);
        builder.HasIndex(p => p.RequisitionId).IsUnique();

        builder.HasOne(p => p.Requisition)
            .WithOne(r => r.InterviewPlan)
            .HasForeignKey<InterviewPlan>(p => p.RequisitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class InterviewRoundConfiguration : IEntityTypeConfiguration<InterviewRound>
{
    public void Configure(EntityTypeBuilder<InterviewRound> builder)
    {
        builder.ToTable("InterviewRounds");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Name).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Description).HasMaxLength(500);

        builder.HasIndex(r => new { r.InterviewPlanId, r.RoundOrder }).IsUnique();
        builder.HasIndex(r => r.TenantId);

        builder.HasOne(r => r.InterviewPlan)
            .WithMany(p => p.Rounds)
            .HasForeignKey(r => r.InterviewPlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class InterviewSessionConfiguration : IEntityTypeConfiguration<InterviewSession>
{
    public void Configure(EntityTypeBuilder<InterviewSession> builder)
    {
        builder.ToTable("InterviewSessions");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.BusinessId).IsRequired().HasMaxLength(50);
        builder.Property(s => s.RoundName).IsRequired().HasMaxLength(100);
        builder.Property(s => s.MeetingLink).HasMaxLength(500);
        builder.Property(s => s.MeetingId).HasMaxLength(100);
        builder.Property(s => s.MeetingPassword).HasMaxLength(100);
        builder.Property(s => s.DecisionNotes).HasMaxLength(1000);

        builder.HasIndex(s => new { s.TenantId, s.BusinessId }).IsUnique();
        builder.HasIndex(s => s.TenantId);
        builder.HasIndex(s => s.ApplicationId);
        builder.HasIndex(s => s.CandidateId);
        builder.HasIndex(s => s.RequisitionId);
        builder.HasIndex(s => s.PolicyId);
        builder.HasIndex(s => s.ScheduledStartTime);
        builder.HasIndex(s => s.Status);

        builder.HasOne(s => s.Application)
            .WithMany(a => a.InterviewSessions)
            .HasForeignKey(s => s.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Candidate)
            .WithMany()
            .HasForeignKey(s => s.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Requisition)
            .WithMany(r => r.InterviewSessions)
            .HasForeignKey(s => s.RequisitionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.InterviewRound)
            .WithMany(r => r.Sessions)
            .HasForeignKey(s => s.InterviewRoundId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.Policy)
            .WithMany(p => p.LockedInterviewSessions)
            .HasForeignKey(s => s.PolicyId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class InterviewPanelistConfiguration : IEntityTypeConfiguration<InterviewPanelist>
{
    public void Configure(EntityTypeBuilder<InterviewPanelist> builder)
    {
        builder.ToTable("InterviewPanelists");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Email).IsRequired().HasMaxLength(256);
        builder.Property(p => p.Role).IsRequired().HasMaxLength(50);

        builder.HasIndex(p => new { p.InterviewSessionId, p.UserId }).IsUnique();
        builder.HasIndex(p => p.TenantId);
        builder.HasIndex(p => p.UserId);

        builder.HasOne(p => p.InterviewSession)
            .WithMany(s => s.Panelists)
            .HasForeignKey(p => p.InterviewSessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class InterviewScorecardConfiguration : IEntityTypeConfiguration<InterviewScorecard>
{
    public void Configure(EntityTypeBuilder<InterviewScorecard> builder)
    {
        builder.ToTable("InterviewScorecards");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.EvaluatorName).IsRequired().HasMaxLength(100);
        builder.Property(c => c.EvaluatorRole).HasMaxLength(50);
        builder.Property(c => c.Strengths).HasMaxLength(2000);
        builder.Property(c => c.AreasOfImprovement).HasMaxLength(2000);
        builder.Property(c => c.SummaryNotes).HasMaxLength(2000);

        builder.HasIndex(c => new { c.InterviewSessionId, c.EvaluatorUserId });
        builder.HasIndex(c => c.TenantId);
        builder.HasIndex(c => c.EvaluatorUserId);

        builder.HasOne(c => c.InterviewSession)
            .WithMany(s => s.Scorecards)
            .HasForeignKey(c => c.InterviewSessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ScorecardCriterionRatingConfiguration : IEntityTypeConfiguration<ScorecardCriterionRating>
{
    public void Configure(EntityTypeBuilder<ScorecardCriterionRating> builder)
    {
        builder.ToTable("ScorecardCriterionRatings");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.CriterionCategory).IsRequired().HasMaxLength(100);
        builder.Property(r => r.CriterionName).IsRequired().HasMaxLength(150);
        builder.Property(r => r.Comments).HasMaxLength(1000);

        builder.HasIndex(r => r.InterviewScorecardId);
        builder.HasIndex(r => r.TenantId);

        builder.HasOne(r => r.InterviewScorecard)
            .WithMany(c => c.CriteriaRatings)
            .HasForeignKey(r => r.InterviewScorecardId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SessionViolationConfiguration : IEntityTypeConfiguration<SessionViolation>
{
    public void Configure(EntityTypeBuilder<SessionViolation> builder)
    {
        builder.ToTable("SessionViolations");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Severity).IsRequired().HasMaxLength(50);
        builder.Property(v => v.Description).IsRequired().HasMaxLength(500);

        builder.HasIndex(v => v.InterviewSessionId);
        builder.HasIndex(v => v.TenantId);
        builder.HasIndex(v => v.DetectedAt);

        builder.HasOne(v => v.InterviewSession)
            .WithMany(s => s.Violations)
            .HasForeignKey(v => v.InterviewSessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
