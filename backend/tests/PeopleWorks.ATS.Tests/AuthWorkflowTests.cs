using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using PeopleWorks.ATS.Domain.Entities.Identity;
using PeopleWorks.ATS.Domain.Enums;
using PeopleWorks.ATS.Infrastructure.Data;
using PeopleWorks.ATS.Infrastructure.Services;
using Xunit;

namespace PeopleWorks.ATS.Tests;

public class AuthWorkflowTests
{
    private (AppDbContext context, PhoneNormalizer normalizer, OtpService otpService, TokenService tokenService, SessionService sessionService) CreateStack()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var tenantService = new TestTenantService();
        var context = new AppDbContext(options, tenantService);

        var config = new ConfigurationBuilder().Build();
        var normalizer = new PhoneNormalizer();
        var otpService = new OtpService(context, config, NullLogger<OtpService>.Instance);
        var tokenService = new TokenService(config);
        var sessionService = new SessionService(context, tokenService, NullLogger<SessionService>.Instance);

        return (context, normalizer, otpService, tokenService, sessionService);
    }

    [Fact]
    public async Task EndToEnd_PhoneOtpAuthentication_CompletesSuccessfully()
    {
        var (context, normalizer, otpService, tokenService, sessionService) = CreateStack();

        var tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserCode = "USR-DEV-01",
            Email = "developer@peopleworks.local",
            Name = "Dev User",
            PhoneNumber = "+91 9123456780",
            NormalizedPhoneNumber = "+919123456780",
            Role = AtsRole.Recruiter,
            Status = "Active"
        };
        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // 1. User submits raw phone number "+91 91234 56780"
        var normalized = normalizer.TryNormalize("+91 91234 56780", out var phone, out _);
        normalized.Should().BeTrue();
        phone.Should().Be("+919123456780");

        // 2. Request OTP
        var (challenge, rawOtp) = await otpService.CreateChallengeAsync(phone, tenantId, user.Id);
        rawOtp.Should().HaveLength(6);

        // 3. Verify OTP
        var verifyResult = await otpService.VerifyChallengeAsync(challenge.ChallengeId, rawOtp, phone);
        verifyResult.IsSuccessful.Should().BeTrue();

        // 4. Create Session
        var (session, rawRefreshToken) = await sessionService.CreateSessionAsync(user);
        session.Should().NotBeNull();
        rawRefreshToken.Should().NotBeNullOrWhiteSpace();

        // 5. Generate Access Token
        var accessToken = tokenService.GenerateAccessToken(user, session.Id);
        accessToken.Should().NotBeNullOrWhiteSpace();

        // 6. Refresh Token
        var refreshResult = await sessionService.RefreshSessionAsync(rawRefreshToken);
        refreshResult.IsSuccessful.Should().BeTrue();
        refreshResult.NewRawRefreshToken.Should().NotBe(rawRefreshToken);

        // 7. Revoke Session
        var revoked = await sessionService.RevokeSessionAsync(session.Id);
        revoked.Should().BeTrue();
    }
}
