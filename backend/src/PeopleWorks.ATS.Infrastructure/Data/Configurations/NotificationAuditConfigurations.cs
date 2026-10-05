using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeopleWorks.ATS.Domain.Entities.Notifications;
using PeopleWorks.ATS.Domain.Entities.Audit;

namespace PeopleWorks.ATS.Infrastructure.Data.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title).IsRequired().HasMaxLength(200);
        builder.Property(n => n.Category).HasMaxLength(50);
        builder.Property(n => n.Priority).HasMaxLength(50);
        builder.Property(n => n.ActionUrl).HasMaxLength(500);

        builder.HasIndex(n => n.TenantId);
        builder.HasIndex(n => n.CreatedAt);
    }
}

public class NotificationRecipientConfiguration : IEntityTypeConfiguration<NotificationRecipient>
{
    public void Configure(EntityTypeBuilder<NotificationRecipient> builder)
    {
        builder.ToTable("NotificationRecipients");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.RecipientEmail).IsRequired().HasMaxLength(256);

        builder.HasIndex(r => new { r.NotificationId, r.UserId }).IsUnique();
        builder.HasIndex(r => r.TenantId);
        builder.HasIndex(r => r.UserId);
        builder.HasIndex(r => r.IsRead);

        builder.HasOne(r => r.Notification)
            .WithMany(n => n.Recipients)
            .HasForeignKey(r => r.NotificationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.EntityName).IsRequired().HasMaxLength(100);
        builder.Property(a => a.EntityId).IsRequired().HasMaxLength(100);
        builder.Property(a => a.Action).IsRequired().HasMaxLength(50);
        builder.Property(a => a.PerformedByUserId).HasMaxLength(100);
        builder.Property(a => a.PerformedByEmail).HasMaxLength(256);

        builder.HasIndex(a => a.TenantId);
        builder.HasIndex(a => a.Timestamp);
        builder.HasIndex(a => new { a.EntityName, a.EntityId });
    }
}

public class SecurityEventConfiguration : IEntityTypeConfiguration<SecurityEvent>
{
    public void Configure(EntityTypeBuilder<SecurityEvent> builder)
    {
        builder.ToTable("SecurityEvents");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.EventType).IsRequired().HasMaxLength(100);
        builder.Property(s => s.Severity).HasMaxLength(50);
        builder.Property(s => s.UserEmail).HasMaxLength(256);
        builder.Property(s => s.Description).IsRequired().HasMaxLength(1000);

        builder.HasIndex(s => s.TenantId);
        builder.HasIndex(s => s.Timestamp);
        builder.HasIndex(s => s.EventType);
    }
}
