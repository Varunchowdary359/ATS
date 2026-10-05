using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Domain.Entities.Candidates;
using PeopleWorks.ATS.Domain.Entities.Requisitions;
using PeopleWorks.ATS.Domain.Enums;
using PeopleWorks.ATS.Infrastructure.Data;
using Xunit;

namespace PeopleWorks.ATS.Tests;

public class TenantIsolationTests
{
    private (AppDbContext context, TestTenantService tenantService) CreateSharedInMemoryContext(string dbName)
    {
        var tenantService = new TestTenantService();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        var context = new AppDbContext(options, tenantService);
        return (context, tenantService);
    }

    [Fact]
    public async Task GlobalQueryFilter_IsolatesDataBetweenTenants()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantA = Guid.Parse("aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa");
        var tenantB = Guid.Parse("bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb");

        // 1. Seed candidate for Tenant A
        var (contextA, tenantServiceA) = CreateSharedInMemoryContext(dbName);
        tenantServiceA.SetTenant(tenantA);

        var candidateA = new Candidate
        {
            Id = Guid.NewGuid(),
            TenantId = tenantA,
            BusinessId = "CAND-TENANT-A",
            FirstName = "Alice",
            LastName = "TenantA",
            Email = "alice@tenanta.com",
            Status = CandidateStatus.Active
        };
        await contextA.Candidates.AddAsync(candidateA);
        await contextA.SaveChangesAsync();

        // 2. Seed candidate for Tenant B
        var (contextB, tenantServiceB) = CreateSharedInMemoryContext(dbName);
        tenantServiceB.SetTenant(tenantB);

        var candidateB = new Candidate
        {
            Id = Guid.NewGuid(),
            TenantId = tenantB,
            BusinessId = "CAND-TENANT-B",
            FirstName = "Bob",
            LastName = "TenantB",
            Email = "bob@tenantb.com",
            Status = CandidateStatus.Active
        };
        await contextB.Candidates.AddAsync(candidateB);
        await contextB.SaveChangesAsync();

        // 3. Query under Tenant A context -> Should ONLY see Candidate A
        var queryForA = await contextA.Candidates.ToListAsync();
        queryForA.Should().HaveCount(1);
        queryForA.First().BusinessId.Should().Be("CAND-TENANT-A");
        queryForA.First().Email.Should().Be("alice@tenanta.com");

        // 4. Query under Tenant B context -> Should ONLY see Candidate B
        var queryForB = await contextB.Candidates.ToListAsync();
        queryForB.Should().HaveCount(1);
        queryForB.First().BusinessId.Should().Be("CAND-TENANT-B");
        queryForB.First().Email.Should().Be("bob@tenantb.com");
    }

    [Fact]
    public async Task SaveChangesAsync_AutomaticallySetsTenantId_WhenNotExplicitlyProvided()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantA = Guid.Parse("aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa");

        var (context, tenantService) = CreateSharedInMemoryContext(dbName);
        tenantService.SetTenant(tenantA);

        var candidate = new Candidate
        {
            Id = Guid.NewGuid(),
            BusinessId = "CAND-AUTO-TENANT",
            FirstName = "Charlie",
            LastName = "Auto",
            Email = "charlie@auto.com",
            Status = CandidateStatus.Active
        };

        await context.Candidates.AddAsync(candidate);
        await context.SaveChangesAsync();

        var savedCandidate = await context.Candidates.FirstOrDefaultAsync(c => c.BusinessId == "CAND-AUTO-TENANT");
        savedCandidate.Should().NotBeNull();
        savedCandidate!.TenantId.Should().Be(tenantA);
        savedCandidate.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }
}
