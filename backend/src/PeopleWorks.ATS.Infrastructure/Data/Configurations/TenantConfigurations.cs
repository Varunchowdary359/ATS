using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeopleWorks.ATS.Domain.Entities.Tenants;

namespace PeopleWorks.ATS.Infrastructure.Data.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("Tenants");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Code).IsRequired().HasMaxLength(50);
        builder.Property(t => t.Name).IsRequired().HasMaxLength(200);
        builder.Property(t => t.Domain).IsRequired().HasMaxLength(150);
        builder.Property(t => t.Plan).IsRequired().HasMaxLength(50);
        builder.Property(t => t.Status).IsRequired().HasMaxLength(50);

        builder.HasIndex(t => t.Domain).IsUnique();
        builder.HasIndex(t => t.Code).IsUnique();
    }
}

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Code).HasMaxLength(50);
        builder.Property(c => c.Industry).HasMaxLength(100);

        builder.HasIndex(c => c.TenantId);

        builder.HasOne(c => c.Tenant)
            .WithMany(t => t.Companies)
            .HasForeignKey(c => c.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ApiKeyConfiguration : IEntityTypeConfiguration<ApiKey>
{
    public void Configure(EntityTypeBuilder<ApiKey> builder)
    {
        builder.ToTable("ApiKeys");
        builder.HasKey(k => k.Id);

        builder.Property(k => k.Name).IsRequired().HasMaxLength(100);
        builder.Property(k => k.HashedKey).IsRequired().HasMaxLength(256);
        builder.Property(k => k.KeyPrefix).IsRequired().HasMaxLength(20);

        builder.HasIndex(k => k.HashedKey).IsUnique();
        builder.HasIndex(k => k.TenantId);

        builder.HasOne(k => k.Tenant)
            .WithMany(t => t.ApiKeys)
            .HasForeignKey(k => k.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class FeatureFlagConfiguration : IEntityTypeConfiguration<FeatureFlag>
{
    public void Configure(EntityTypeBuilder<FeatureFlag> builder)
    {
        builder.ToTable("FeatureFlags");
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Key).IsRequired().HasMaxLength(100);
        builder.Property(f => f.Name).IsRequired().HasMaxLength(150);

        builder.HasIndex(f => new { f.TenantId, f.Key }).IsUnique();
        builder.HasIndex(f => f.TenantId);

        builder.HasOne(f => f.Tenant)
            .WithMany(t => t.FeatureFlags)
            .HasForeignKey(f => f.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
