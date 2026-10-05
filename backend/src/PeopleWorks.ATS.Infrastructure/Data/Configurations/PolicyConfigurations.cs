using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeopleWorks.ATS.Domain.Entities.Policies;

namespace PeopleWorks.ATS.Infrastructure.Data.Configurations;

public class AssessmentPolicyConfiguration : IEntityTypeConfiguration<AssessmentPolicy>
{
    public void Configure(EntityTypeBuilder<AssessmentPolicy> builder)
    {
        builder.ToTable("AssessmentPolicies");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.BusinessId).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(150);
        builder.Property(p => p.Description).HasMaxLength(1000);
        builder.Property(p => p.PolicyStatus).HasMaxLength(50);

        builder.HasIndex(p => new { p.TenantId, p.BusinessId, p.Version }).IsUnique();
        builder.HasIndex(p => new { p.TenantId, p.BusinessId });
        builder.HasIndex(p => p.TenantId);
        builder.HasIndex(p => p.PolicyType);
    }
}

public class PolicyRuleConfiguration : IEntityTypeConfiguration<PolicyRule>
{
    public void Configure(EntityTypeBuilder<PolicyRule> builder)
    {
        builder.ToTable("PolicyRules");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.RuleCode).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Name).IsRequired().HasMaxLength(150);
        builder.Property(r => r.Description).HasMaxLength(500);
        builder.Property(r => r.Severity).HasMaxLength(50);

        builder.HasIndex(r => new { r.AssessmentPolicyId, r.RuleCode });
        builder.HasIndex(r => r.TenantId);

        builder.HasOne(r => r.AssessmentPolicy)
            .WithMany(p => p.Rules)
            .HasForeignKey(r => r.AssessmentPolicyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PolicyAssignmentConfiguration : IEntityTypeConfiguration<PolicyAssignment>
{
    public void Configure(EntityTypeBuilder<PolicyAssignment> builder)
    {
        builder.ToTable("PolicyAssignments");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.TargetType).IsRequired().HasMaxLength(50);
        builder.Property(a => a.TargetId).HasMaxLength(100);

        builder.HasIndex(a => new { a.AssessmentPolicyId, a.TargetType, a.TargetId });
        builder.HasIndex(a => a.TenantId);
        builder.HasIndex(a => a.TargetId);

        builder.HasOne(a => a.AssessmentPolicy)
            .WithMany(p => p.Assignments)
            .HasForeignKey(a => a.AssessmentPolicyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CandidatePolicyAcceptanceConfiguration : IEntityTypeConfiguration<CandidatePolicyAcceptance>
{
    public void Configure(EntityTypeBuilder<CandidatePolicyAcceptance> builder)
    {
        builder.ToTable("CandidatePolicyAcceptances");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.CandidateEmail).IsRequired().HasMaxLength(256);
        builder.Property(a => a.IpAddress).HasMaxLength(100);
        builder.Property(a => a.UserAgent).HasMaxLength(500);

        builder.HasIndex(a => new { a.InterviewSessionId, a.CandidateId, a.PolicyVersion });
        builder.HasIndex(a => a.TenantId);
        builder.HasIndex(a => a.CandidateId);

        builder.HasOne(a => a.InterviewSession)
            .WithMany(s => s.CandidatePolicyAcceptances)
            .HasForeignKey(a => a.InterviewSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.AssessmentPolicy)
            .WithMany()
            .HasForeignKey(a => a.AssessmentPolicyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class InterviewerPolicyAcceptanceConfiguration : IEntityTypeConfiguration<InterviewerPolicyAcceptance>
{
    public void Configure(EntityTypeBuilder<InterviewerPolicyAcceptance> builder)
    {
        builder.ToTable("InterviewerPolicyAcceptances");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.IpAddress).HasMaxLength(100);
        builder.Property(a => a.UserAgent).HasMaxLength(500);

        builder.HasIndex(a => new { a.InterviewSessionId, a.InterviewerUserId, a.PolicyVersion });
        builder.HasIndex(a => a.TenantId);
        builder.HasIndex(a => a.InterviewerUserId);

        builder.HasOne(a => a.InterviewSession)
            .WithMany(s => s.InterviewerPolicyAcceptances)
            .HasForeignKey(a => a.InterviewSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.AssessmentPolicy)
            .WithMany()
            .HasForeignKey(a => a.AssessmentPolicyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class TechnicalReadinessCheckConfiguration : IEntityTypeConfiguration<TechnicalReadinessCheck>
{
    public void Configure(EntityTypeBuilder<TechnicalReadinessCheck> builder)
    {
        builder.ToTable("TechnicalReadinessChecks");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.ParticipantType).IsRequired().HasMaxLength(50);

        builder.HasIndex(c => new { c.InterviewSessionId, c.ParticipantId });
        builder.HasIndex(c => c.TenantId);
        builder.HasIndex(c => c.CheckedAt);

        builder.HasOne(c => c.InterviewSession)
            .WithMany(s => s.ReadinessChecks)
            .HasForeignKey(c => c.InterviewSessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
