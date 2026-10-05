using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Domain.Entities.Candidates;
using PeopleWorks.ATS.Domain.Entities.Requisitions;
using PeopleWorks.ATS.Domain.Entities.Tenants;
using PeopleWorks.ATS.Domain.Enums;
using PeopleWorks.ATS.Infrastructure.Data;
using Xunit;

namespace PeopleWorks.ATS.Tests;

public class TestTenantService : ICurrentTenantService
{
    public Guid TenantId { get; set; } = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public bool HasTenant => TenantId != Guid.Empty;
    public void SetTenant(Guid tenantId) => TenantId = tenantId;
}

public class DbContextCreationTests
{
    private AppDbContext CreateInMemoryContext(ICurrentTenantService tenantService)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options, tenantService);
    }

    [Fact]
    public async Task CanInitializeDbContextAndDbSets()
    {
        // Arrange
        var tenantService = new TestTenantService();
        using var context = CreateInMemoryContext(tenantService);

        // Act & Assert
        context.Tenants.Should().NotBeNull();
        context.Users.Should().NotBeNull();
        context.Candidates.Should().NotBeNull();
        context.Requisitions.Should().NotBeNull();
        context.Applications.Should().NotBeNull();
        context.InterviewSessions.Should().NotBeNull();
        context.AssessmentPolicies.Should().NotBeNull();

        var tenant = new Tenant
        {
            Id = tenantService.TenantId,
            Code = "TENANT-001",
            Name = "PeopleWorks Test Tenant",
            Domain = "test.peopleworks.local",
            Plan = "Enterprise",
            Status = "Active"
        };
        await context.Tenants.AddAsync(tenant);
        await context.SaveChangesAsync();

        var savedTenant = await context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantService.TenantId);
        savedTenant.Should().NotBeNull();
        savedTenant!.Name.Should().Be("PeopleWorks Test Tenant");
    }
}
