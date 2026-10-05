using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeopleWorks.ATS.Domain.Entities.Identity;

namespace PeopleWorks.ATS.Infrastructure.Data.Configurations;

public class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("UserSessions");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.RefreshTokenHash).IsRequired().HasMaxLength(256);
        builder.Property(s => s.RefreshTokenSalt).HasMaxLength(128);
        builder.Property(s => s.RevocationReason).HasMaxLength(256);
        builder.Property(s => s.IpAddress).HasMaxLength(100);
        builder.Property(s => s.UserAgent).HasMaxLength(500);
        builder.Property(s => s.DeviceId).HasMaxLength(100);

        builder.HasIndex(s => s.RefreshTokenHash);
        builder.HasIndex(s => s.TenantId);
        builder.HasIndex(s => s.UserId);
        builder.HasIndex(s => s.ExpiresAt);
        builder.HasIndex(s => s.LastActivityAt);

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
