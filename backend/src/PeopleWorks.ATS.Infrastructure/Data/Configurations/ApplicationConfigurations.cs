using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeopleWorks.ATS.Domain.Entities.Applications;
using AtsApplication = PeopleWorks.ATS.Domain.Entities.Applications.Application;

namespace PeopleWorks.ATS.Infrastructure.Data.Configurations;

public class ApplicationConfiguration : IEntityTypeConfiguration<AtsApplication>
{
    public void Configure(EntityTypeBuilder<AtsApplication> builder)
    {
        builder.ToTable("Applications");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.BusinessId).IsRequired().HasMaxLength(50);
        builder.Property(a => a.Source).HasMaxLength(100);
        builder.Property(a => a.RejectionReason).HasMaxLength(500);
        builder.Property(a => a.RejectionCategory).HasMaxLength(100);
        builder.Property(a => a.HoldReason).HasMaxLength(500);

        builder.HasIndex(a => new { a.TenantId, a.BusinessId }).IsUnique();
        builder.HasIndex(a => new { a.TenantId, a.CandidateId, a.RequisitionId });
        builder.HasIndex(a => a.TenantId);
        builder.HasIndex(a => a.CandidateId);
        builder.HasIndex(a => a.RequisitionId);
        builder.HasIndex(a => a.Stage);
        builder.HasIndex(a => a.Status);
        builder.HasIndex(a => a.AppliedDate);

        builder.HasOne(a => a.Candidate)
            .WithMany(c => c.Applications)
            .HasForeignKey(a => a.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Requisition)
            .WithMany(r => r.Applications)
            .HasForeignKey(a => a.RequisitionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ApplicationTimelineEventConfiguration : IEntityTypeConfiguration<ApplicationTimelineEvent>
{
    public void Configure(EntityTypeBuilder<ApplicationTimelineEvent> builder)
    {
        builder.ToTable("ApplicationTimelineEvents");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.EventType).IsRequired().HasMaxLength(100);
        builder.Property(e => e.Title).IsRequired().HasMaxLength(200);
        builder.Property(e => e.PerformedBy).HasMaxLength(100);

        builder.HasIndex(e => e.ApplicationId);
        builder.HasIndex(e => e.TenantId);
        builder.HasIndex(e => e.Timestamp);

        builder.HasOne(e => e.Application)
            .WithMany(a => a.TimelineEvents)
            .HasForeignKey(e => e.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ScreeningEvaluationConfiguration : IEntityTypeConfiguration<ScreeningEvaluation>
{
    public void Configure(EntityTypeBuilder<ScreeningEvaluation> builder)
    {
        builder.ToTable("ScreeningEvaluations");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Recommendation).IsRequired().HasMaxLength(50);
        builder.Property(s => s.SummaryNotes).HasMaxLength(2000);

        builder.HasIndex(s => s.ApplicationId);
        builder.HasIndex(s => s.TenantId);
        builder.HasIndex(s => s.EvaluatorUserId);

        builder.HasOne(s => s.Application)
            .WithMany(a => a.ScreeningEvaluations)
            .HasForeignKey(s => s.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
