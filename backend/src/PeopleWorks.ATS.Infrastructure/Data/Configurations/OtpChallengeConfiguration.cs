using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeopleWorks.ATS.Domain.Entities.Identity;

namespace PeopleWorks.ATS.Infrastructure.Data.Configurations;

public class OtpChallengeConfiguration : IEntityTypeConfiguration<OtpChallenge>
{
    public void Configure(EntityTypeBuilder<OtpChallenge> builder)
    {
        builder.ToTable("OtpChallenges");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.NormalizedPhoneNumber).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Purpose).IsRequired().HasMaxLength(50);
        builder.Property(c => c.ChallengeId).IsRequired().HasMaxLength(64);
        builder.Property(c => c.OtpHash).IsRequired().HasMaxLength(256);
        builder.Property(c => c.OtpSalt).IsRequired().HasMaxLength(128);

        builder.HasIndex(c => c.ChallengeId).IsUnique();
        builder.HasIndex(c => new { c.NormalizedPhoneNumber, c.CreatedAt });
        builder.HasIndex(c => c.TenantId);
        builder.HasIndex(c => c.UserId);
        builder.HasIndex(c => c.ExpiresAt);
    }
}
