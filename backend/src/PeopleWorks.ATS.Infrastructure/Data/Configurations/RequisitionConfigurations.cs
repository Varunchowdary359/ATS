using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeopleWorks.ATS.Domain.Entities.Requisitions;

namespace PeopleWorks.ATS.Infrastructure.Data.Configurations;

public class RequisitionConfiguration : IEntityTypeConfiguration<Requisition>
{
    public void Configure(EntityTypeBuilder<Requisition> builder)
    {
        builder.ToTable("Requisitions");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.RequisitionCode).IsRequired().HasMaxLength(50);
        builder.Property(r => r.ReqNumber).HasMaxLength(50);
        builder.Property(r => r.Title).IsRequired().HasMaxLength(200);
        builder.Property(r => r.Department).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Location).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Currency).HasMaxLength(10);
        builder.Property(r => r.CostCenter).HasMaxLength(50);
        builder.Property(r => r.RejectionComment).HasMaxLength(1000);

        builder.HasIndex(r => new { r.TenantId, r.RequisitionCode }).IsUnique();
        builder.HasIndex(r => r.TenantId);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.Department);
        builder.HasIndex(r => r.HiringManagerId);
        builder.HasIndex(r => r.LeadRecruiterId);

        builder.HasOne(r => r.Tenant)
            .WithMany(t => t.Requisitions)
            .HasForeignKey(r => r.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.HiringManager)
            .WithMany()
            .HasForeignKey(r => r.HiringManagerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.LeadRecruiter)
            .WithMany()
            .HasForeignKey(r => r.LeadRecruiterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class RequisitionApprovalStepConfiguration : IEntityTypeConfiguration<RequisitionApprovalStep>
{
    public void Configure(EntityTypeBuilder<RequisitionApprovalStep> builder)
    {
        builder.ToTable("RequisitionApprovalSteps");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.StepKey).IsRequired().HasMaxLength(50);
        builder.Property(s => s.RoleName).IsRequired().HasMaxLength(100);
        builder.Property(s => s.ApproverName).HasMaxLength(100);
        builder.Property(s => s.RejectionComment).HasMaxLength(1000);

        builder.HasIndex(s => new { s.RequisitionId, s.StepOrder }).IsUnique();
        builder.HasIndex(s => s.TenantId);
        builder.HasIndex(s => s.ApproverUserId);

        builder.HasOne(s => s.Requisition)
            .WithMany(r => r.ApprovalSteps)
            .HasForeignKey(s => s.RequisitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RequisitionApprovalAuditConfiguration : IEntityTypeConfiguration<RequisitionApprovalAudit>
{
    public void Configure(EntityTypeBuilder<RequisitionApprovalAudit> builder)
    {
        builder.ToTable("RequisitionApprovalAudits");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Actor).IsRequired().HasMaxLength(100);
        builder.Property(a => a.Action).IsRequired().HasMaxLength(50);
        builder.Property(a => a.Details).HasMaxLength(1000);

        builder.HasIndex(a => a.TenantId);
        builder.HasIndex(a => a.RequisitionId);
        builder.HasIndex(a => a.Timestamp);

        builder.HasOne(a => a.Requisition)
            .WithMany(r => r.ApprovalAudits)
            .HasForeignKey(a => a.RequisitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
