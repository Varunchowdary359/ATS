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

public class OtpSecurityTests
{
    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var tenantService = new TestTenantService();
        return new AppDbContext(options, tenantService);
    }

    private OtpService CreateOtpService(AppDbContext context)
    {
        var config = new ConfigurationBuilder().Build();
        return new OtpService(context, config, NullLogger<OtpService>.Instance);
    }

    [Fact]
    public async Task CreateChallengeAsync_GeneratesValid6DigitNumericOtpAndSecureChallenge()
    {
        var context = CreateInMemoryDbContext();
        var otpService = CreateOtpService(context);

        var phone = "+919123456780";
        var (challenge, rawOtp) = await otpService.CreateChallengeAsync(phone, null, null);

        rawOtp.Should().HaveLength(6);
        rawOtp.Should().MatchRegex(@"^\d{6}$");

        challenge.NormalizedPhoneNumber.Should().Be(phone);
        challenge.ChallengeId.Should().NotBeNullOrWhiteSpace();
        challenge.OtpHash.Should().NotBeNullOrWhiteSpace();
        challenge.OtpSalt.Should().NotBeNullOrWhiteSpace();
        challenge.ExpiresAt.Should().BeAfter(DateTime.UtcNow.AddMinutes(4));
        challenge.AttemptCount.Should().Be(0);
        challenge.MaxAttempts.Should().Be(5);
    }

    [Fact]
    public async Task VerifyChallengeAsync_WithCorrectOtp_Succeeds()
    {
        var context = CreateInMemoryDbContext();
        var otpService = CreateOtpService(context);

        var phone = "+919123456780";
        var (challenge, rawOtp) = await otpService.CreateChallengeAsync(phone, null, null);

        var result = await otpService.VerifyChallengeAsync(challenge.ChallengeId, rawOtp, phone);

        result.IsSuccessful.Should().BeTrue();
        result.Challenge.Should().NotBeNull();
        result.Challenge!.IsUsed.Should().BeTrue();
    }

    [Fact]
    public async Task VerifyChallengeAsync_WithWrongOtp_FailsAndIncrementsAttemptCount()
    {
        var context = CreateInMemoryDbContext();
        var otpService = CreateOtpService(context);

        var phone = "+919123456780";
        var (challenge, rawOtp) = await otpService.CreateChallengeAsync(phone, null, null);

        var wrongOtp = rawOtp == "123456" ? "654321" : "123456";
        var result = await otpService.VerifyChallengeAsync(challenge.ChallengeId, wrongOtp, phone);

        result.IsSuccessful.Should().BeFalse();
        result.Challenge!.AttemptCount.Should().Be(1);
    }

    [Fact]
    public async Task VerifyChallengeAsync_After5FailedAttempts_LocksOutChallenge()
    {
        var context = CreateInMemoryDbContext();
        var otpService = CreateOtpService(context);

        var phone = "+919123456780";
        var (challenge, rawOtp) = await otpService.CreateChallengeAsync(phone, null, null);

        var wrongOtp = "000000";
        for (int i = 0; i < 5; i++)
        {
            await otpService.VerifyChallengeAsync(challenge.ChallengeId, wrongOtp, phone);
        }

        // 6th attempt with CORRECT OTP must still fail because attempts were exhausted
        var lockedResult = await otpService.VerifyChallengeAsync(challenge.ChallengeId, rawOtp, phone);
        lockedResult.IsSuccessful.Should().BeFalse();
        lockedResult.AttemptsExhausted.Should().BeTrue();
    }

    [Fact]
    public async Task CreateChallengeAsync_InvalidatesPreviousPendingChallenge()
    {
        var context = CreateInMemoryDbContext();
        var otpService = CreateOtpService(context);

        var phone = "+919123456780";
        var (challenge1, rawOtp1) = await otpService.CreateChallengeAsync(phone, null, null);
        var (challenge2, rawOtp2) = await otpService.CreateChallengeAsync(phone, null, null);

        // Challenge 1 must be invalidated
        var result1 = await otpService.VerifyChallengeAsync(challenge1.ChallengeId, rawOtp1, phone);
        result1.IsSuccessful.Should().BeFalse();
        result1.ErrorMessage.Should().Contain("superseded");

        // Challenge 2 must be valid
        var result2 = await otpService.VerifyChallengeAsync(challenge2.ChallengeId, rawOtp2, phone);
        result2.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public async Task VerifyChallengeAsync_FreshChallenge_UsedAtIsNull_FirstVerifySetsUsedAt_SecondVerifyReturnsAlreadyUsed()
    {
        var context = CreateInMemoryDbContext();
        var otpService = CreateOtpService(context);

        var phone = "+917793988059";
        var (challenge, rawOtp) = await otpService.CreateChallengeAsync(phone, null, null);

        // 1. Fresh challenge must have UsedAt == null and InvalidatedAt == null
        challenge.UsedAt.Should().BeNull();
        challenge.InvalidatedAt.Should().BeNull();
        challenge.IsUsed.Should().BeFalse();
        challenge.IsInvalidated.Should().BeFalse();
        challenge.AttemptCount.Should().Be(0);

        // 2. First verify must succeed and set UsedAt
        var firstResult = await otpService.VerifyChallengeAsync(challenge.ChallengeId, rawOtp, phone);
        firstResult.IsSuccessful.Should().BeTrue();
        firstResult.Challenge.Should().NotBeNull();
        firstResult.Challenge!.UsedAt.Should().NotBeNull();
        firstResult.Challenge.IsUsed.Should().BeTrue();

        // 3. Second verify of the SAME challenge must fail with "already used"
        var secondResult = await otpService.VerifyChallengeAsync(challenge.ChallengeId, rawOtp, phone);
        secondResult.IsSuccessful.Should().BeFalse();
        secondResult.ErrorMessage.Should().Be("This OTP has already been used.");
    }

    [Fact]
    public async Task VerifyChallengeAsync_ExpiredChallenge_Fails()
    {
        var context = CreateInMemoryDbContext();
        var otpService = CreateOtpService(context);

        var phone = "+917793988059";
        var (challenge, rawOtp) = await otpService.CreateChallengeAsync(phone, null, null);

        // Manually set ExpiresAt in the past
        var dbChallenge = await context.OtpChallenges.FindAsync(challenge.Id);
        dbChallenge!.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        await context.SaveChangesAsync();

        var result = await otpService.VerifyChallengeAsync(challenge.ChallengeId, rawOtp, phone);
        result.IsSuccessful.Should().BeFalse();
        result.IsExpired.Should().BeTrue();
        result.ErrorMessage.Should().Contain("expired");
    }

    [Fact]
    public async Task VerifyChallengeAsync_NonExistentChallenge_ReturnsInvalidChallenge()
    {
        var context = CreateInMemoryDbContext();
        var otpService = CreateOtpService(context);

        var result = await otpService.VerifyChallengeAsync("non-existent-challenge-id", "123456", "+917793988059");
        result.IsSuccessful.Should().BeFalse();
        result.ErrorMessage.Should().Be("Invalid verification challenge.");
    }

    [Fact]
    public async Task CreateChallengeAsync_NewChallengeDoesNotBecomeInvalidOrUsedItself()
    {
        var context = CreateInMemoryDbContext();
        var otpService = CreateOtpService(context);

        var phone = "+917793988059";
        var (oldChallenge, _) = await otpService.CreateChallengeAsync(phone, null, null);
        var (newChallenge, newOtp) = await otpService.CreateChallengeAsync(phone, null, null);

        // Old challenge must be invalidated
        var oldDb = await context.OtpChallenges.FindAsync(oldChallenge.Id);
        oldDb!.InvalidatedAt.Should().NotBeNull();
        oldDb.IsInvalidated.Should().BeTrue();

        // New challenge must remain fresh and active
        var newDb = await context.OtpChallenges.FindAsync(newChallenge.Id);
        newDb!.UsedAt.Should().BeNull();
        newDb.InvalidatedAt.Should().BeNull();
        newDb.IsUsed.Should().BeFalse();
        newDb.IsInvalidated.Should().BeFalse();

        // New challenge can be successfully verified
        var result = await otpService.VerifyChallengeAsync(newChallenge.ChallengeId, newOtp, phone);
        result.IsSuccessful.Should().BeTrue();
    }
}
