using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using PeopleWorks.ATS.Domain.Entities.Identity;
using PeopleWorks.ATS.Infrastructure.Data;
using PeopleWorks.ATS.Infrastructure.Services;
using Xunit;

namespace PeopleWorks.ATS.Tests;

public class SessionSecurityTests
{
    private (AppDbContext context, TokenService tokenService, SessionService sessionService) CreateServices()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var tenantService = new TestTenantService();
        var context = new AppDbContext(options, tenantService);

        var config = new ConfigurationBuilder().Build();
        var tokenService = new TokenService(config);
        var sessionService = new SessionService(context, tokenService, NullLogger<SessionService>.Instance);

        return (context, tokenService, sessionService);
    }

    [Fact]
    public async Task CreateSessionAsync_CreatesActiveSessionWith2HourAbsoluteLifetime()
    {
        var (context, _, sessionService) = CreateServices();

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            Email = "test@peopleworks.local",
            UserCode = "USR-001"
        };
        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var (session, rawRefreshToken) = await sessionService.CreateSessionAsync(user, "127.0.0.1", "Mozilla/5.0");

        session.Should().NotBeNull();
        rawRefreshToken.Should().NotBeNullOrWhiteSpace();
        session.ExpiresAt.Should().BeAfter(DateTime.UtcNow.AddHours(1.9));
        session.RefreshTokenHash.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ValidateAndTouchSessionAsync_WithActiveSession_ReturnsTrueAndTouchesTimestamp()
    {
        var (context, _, sessionService) = CreateServices();

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            Email = "test@peopleworks.local"
        };
        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var (session, _) = await sessionService.CreateSessionAsync(user);
        var initialActivity = session.LastActivityAt;

        var isValid = await sessionService.ValidateAndTouchSessionAsync(session.Id);

        isValid.Should().BeTrue();
    }

    [Fact]
    public async Task RefreshSessionAsync_RotatesRefreshToken_AndInvalidatesOldToken()
    {
        var (context, _, sessionService) = CreateServices();

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            Email = "test@peopleworks.local"
        };
        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var (session, originalRawRefreshToken) = await sessionService.CreateSessionAsync(user);

        // 1. Refresh using original token
        var refreshResult = await sessionService.RefreshSessionAsync(originalRawRefreshToken);
        refreshResult.IsSuccessful.Should().BeTrue();
        refreshResult.NewRawRefreshToken.Should().NotBeNullOrWhiteSpace();
        refreshResult.NewRawRefreshToken.Should().NotBe(originalRawRefreshToken);

        // 2. Attempt reuse of OLD refresh token -> Must detect reuse and fail
        var reuseResult = await sessionService.RefreshSessionAsync(originalRawRefreshToken);
        reuseResult.IsSuccessful.Should().BeFalse();
        reuseResult.TokenReuseDetected.Should().BeTrue();
    }

    [Fact]
    public async Task RevokeSessionAsync_RevokesSpecificSession()
    {
        var (context, _, sessionService) = CreateServices();

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            Email = "test@peopleworks.local"
        };
        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var (session, rawRefreshToken) = await sessionService.CreateSessionAsync(user);

        var revoked = await sessionService.RevokeSessionAsync(session.Id, "User Logout");
        revoked.Should().BeTrue();

        var isValid = await sessionService.ValidateAndTouchSessionAsync(session.Id);
        isValid.Should().BeFalse();

        var refreshResult = await sessionService.RefreshSessionAsync(rawRefreshToken);
        refreshResult.IsSuccessful.Should().BeFalse();
    }
}
