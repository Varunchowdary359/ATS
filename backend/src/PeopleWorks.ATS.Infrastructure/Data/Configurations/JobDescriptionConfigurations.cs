using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeopleWorks.ATS.Domain.Entities.JobDescriptions;
using PeopleWorks.ATS.Domain.Entities.JobPostings;

namespace PeopleWorks.ATS.Infrastructure.Data.Configurations;

public class JobDescriptionConfiguration : IEntityTypeConfiguration<JobDescription>
{
    public void Configure(EntityTypeBuilder<JobDescription> builder)
    {
        builder.ToTable("JobDescriptions");
        builder.HasKey(j => j.Id);

        builder.Property(j => j.BusinessId).IsRequired().HasMaxLength(50);
        builder.Property(j => j.Title).IsRequired().HasMaxLength(200);
        builder.Property(j => j.Department).HasMaxLength(100);
        builder.Property(j => j.Location).HasMaxLength(100);

        builder.HasIndex(j => new { j.TenantId, j.BusinessId }).IsUnique();
        builder.HasIndex(j => j.TenantId);
        builder.HasIndex(j => j.RequisitionId).IsUnique();

        builder.HasOne(j => j.Requisition)
            .WithOne(r => r.JobDescription)
            .HasForeignKey<JobDescription>(j => j.RequisitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class JobDescriptionVersionConfiguration : IEntityTypeConfiguration<JobDescriptionVersion>
{
    public void Configure(EntityTypeBuilder<JobDescriptionVersion> builder)
    {
        builder.ToTable("JobDescriptionVersions");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Title).IsRequired().HasMaxLength(200);
        builder.Property(v => v.ChangedBy).HasMaxLength(100);

        builder.HasIndex(v => new { v.JobDescriptionId, v.VersionNumber }).IsUnique();
        builder.HasIndex(v => v.TenantId);

        builder.HasOne(v => v.JobDescription)
            .WithMany(j => j.Versions)
            .HasForeignKey(v => v.JobDescriptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class JDWorkflowRuleConfiguration : IEntityTypeConfiguration<JDWorkflowRule>
{
    public void Configure(EntityTypeBuilder<JDWorkflowRule> builder)
    {
        builder.ToTable("JDWorkflowRules");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Department).HasMaxLength(100);
        builder.Property(r => r.BandLevel).HasMaxLength(50);

        builder.HasIndex(r => r.TenantId);
    }
}

public class JDWorkflowStepConfiguration : IEntityTypeConfiguration<JDWorkflowStep>
{
    public void Configure(EntityTypeBuilder<JDWorkflowStep> builder)
    {
        builder.ToTable("JDWorkflowSteps");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.StepName).IsRequired().HasMaxLength(100);
        builder.Property(s => s.ApproverRole).IsRequired().HasMaxLength(50);

        builder.HasIndex(s => new { s.JobDescriptionId, s.StepOrder }).IsUnique();
        builder.HasIndex(s => s.TenantId);

        builder.HasOne(s => s.JobDescription)
            .WithMany(j => j.WorkflowSteps)
            .HasForeignKey(s => s.JobDescriptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class JobPostingConfiguration : IEntityTypeConfiguration<JobPosting>
{
    public void Configure(EntityTypeBuilder<JobPosting> builder)
    {
        builder.ToTable("JobPostings");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.BusinessId).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.Property(p => p.PostingStatus).HasMaxLength(50);

        builder.HasIndex(p => new { p.TenantId, p.BusinessId }).IsUnique();
        builder.HasIndex(p => p.TenantId);
        builder.HasIndex(p => p.JobDescriptionId);

        builder.HasOne(p => p.JobDescription)
            .WithMany(j => j.Postings)
            .HasForeignKey(p => p.JobDescriptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class JobPostingChannelConfiguration : IEntityTypeConfiguration<JobPostingChannel>
{
    public void Configure(EntityTypeBuilder<JobPostingChannel> builder)
    {
        builder.ToTable("JobPostingChannels");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.ChannelName).IsRequired().HasMaxLength(100);
        builder.Property(c => c.ChannelStatus).HasMaxLength(50);

        builder.HasIndex(c => c.JobPostingId);
        builder.HasIndex(c => c.TenantId);

        builder.HasOne(c => c.JobPosting)
            .WithMany(p => p.Channels)
            .HasForeignKey(c => c.JobPostingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
