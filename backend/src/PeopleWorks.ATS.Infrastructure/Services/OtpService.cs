using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Domain.Entities.Identity;
using PeopleWorks.ATS.Infrastructure.Data;

namespace PeopleWorks.ATS.Infrastructure.Services;

public class OtpService : IOtpService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OtpService> _logger;
    private readonly byte[] _serverKey;

    public OtpService(AppDbContext context, IConfiguration configuration, ILogger<OtpService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;

        var configuredSecret = _configuration["Authentication:OtpSecret"] ??
                               _configuration["OTP_SECRET_KEY"] ??
                               "PEOPLEWORKS_ATS_SECURE_HMAC_DEFAULT_DEV_KEY_9876543210_CHANGE_IN_PROD";

        _serverKey = Encoding.UTF8.GetBytes(configuredSecret);
    }

    public async Task<(OtpChallenge challenge, string rawOtp)> CreateChallengeAsync(
        string normalizedPhoneNumber,
        Guid? tenantId,
        Guid? userId,
        string purpose = "Login",
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        // 1. Invalidate any existing pending/active challenges for this phone number
        var existingPendingChallenges = await _context.OtpChallenges
            .Where(c => c.NormalizedPhoneNumber == normalizedPhoneNumber && c.UsedAt == null && c.InvalidatedAt == null && c.ExpiresAt > now)
            .ToListAsync(cancellationToken);

        foreach (var old in existingPendingChallenges)
        {
            old.InvalidatedAt = now;
        }

        // 2. Generate cryptographically random 6-digit numeric OTP (100000 - 999999)
        var numericOtp = RandomNumberGenerator.GetInt32(100000, 1000000);
        var rawOtp = numericOtp.ToString("D6");

        // 3. Generate per-challenge random salt (32 bytes)
        var saltBytes = RandomNumberGenerator.GetBytes(32);
        var saltBase64 = Convert.ToBase64String(saltBytes);

        // 4. Compute HMAC-SHA256 hash using server key and salt
        var otpHash = ComputeHmacHash(rawOtp, saltBytes);

        // 5. Create new challenge
        var challenge = new OtpChallenge
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = userId,
            NormalizedPhoneNumber = normalizedPhoneNumber,
            Purpose = purpose,
            ChallengeId = Guid.NewGuid().ToString("N"),
            OtpHash = otpHash,
            OtpSalt = saltBase64,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(5), // 5 minute validity
            LastSentAt = now,
            AttemptCount = 0,
            MaxAttempts = 5
        };

        await _context.OtpChallenges.AddAsync(challenge, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return (challenge, rawOtp);
    }

    public async Task<OtpVerificationResult> VerifyChallengeAsync(
        string challengeId,
        string rawOtp,
        string normalizedPhoneNumber,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var challenge = await _context.OtpChallenges
            .FirstOrDefaultAsync(c => c.ChallengeId == challengeId && c.NormalizedPhoneNumber == normalizedPhoneNumber, cancellationToken);

        if (challenge == null)
        {
            return new OtpVerificationResult
            {
                IsSuccessful = false,
                ErrorMessage = "Invalid verification challenge."
            };
        }

        // Check if already used
        if (challenge.IsUsed)
        {
            return new OtpVerificationResult
            {
                IsSuccessful = false,
                ErrorMessage = "This OTP has already been used.",
                Challenge = challenge
            };
        }

        // Check lockout or max attempts exceeded
        if (challenge.HasExceededAttempts || challenge.IsLockedOut(now))
        {
            challenge.InvalidatedAt = now;
            await _context.SaveChangesAsync(cancellationToken);

            return new OtpVerificationResult
            {
                IsSuccessful = false,
                AttemptsExhausted = true,
                ErrorMessage = "Maximum verification attempts exceeded. Please request a new OTP.",
                Challenge = challenge
            };
        }

        // Check if invalidated
        if (challenge.IsInvalidated)
        {
            return new OtpVerificationResult
            {
                IsSuccessful = false,
                ErrorMessage = "This OTP challenge has been superseded by a newer request.",
                Challenge = challenge
            };
        }

        // Check if expired
        if (challenge.IsExpired(now))
        {
            challenge.InvalidatedAt = now;
            await _context.SaveChangesAsync(cancellationToken);

            return new OtpVerificationResult
            {
                IsSuccessful = false,
                IsExpired = true,
                ErrorMessage = "This OTP has expired. Please request a new code.",
                Challenge = challenge
            };
        }

        // Verify OTP securely using constant-time comparison
        var saltBytes = Convert.FromBase64String(challenge.OtpSalt);
        var expectedHash = challenge.OtpHash;
        var computedHash = ComputeHmacHash(rawOtp, saltBytes);

        var isMatch = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expectedHash),
            Encoding.UTF8.GetBytes(computedHash));

        if (!isMatch)
        {
            challenge.AttemptCount++;
            if (challenge.AttemptCount >= challenge.MaxAttempts)
            {
                challenge.LockoutUntil = now.AddMinutes(15);
                challenge.InvalidatedAt = now;
            }

            await _context.SaveChangesAsync(cancellationToken);

            return new OtpVerificationResult
            {
                IsSuccessful = false,
                AttemptsExhausted = challenge.AttemptCount >= challenge.MaxAttempts,
                ErrorMessage = challenge.AttemptCount >= challenge.MaxAttempts
                    ? "Maximum verification attempts exceeded. Please request a new OTP."
                    : $"Invalid OTP. {challenge.MaxAttempts - challenge.AttemptCount} attempts remaining.",
                Challenge = challenge
            };
        }

        // Mark as used
        challenge.UsedAt = now;
        await _context.SaveChangesAsync(cancellationToken);

        return new OtpVerificationResult
        {
            IsSuccessful = true,
            Challenge = challenge
        };
    }

    private string ComputeHmacHash(string rawOtp, byte[] saltBytes)
    {
        using var hmac = new HMACSHA256(_serverKey);
        var otpBytes = Encoding.UTF8.GetBytes(rawOtp);

        // Combined payload: salt + otp
        var combined = new byte[saltBytes.Length + otpBytes.Length];
        Buffer.BlockCopy(saltBytes, 0, combined, 0, saltBytes.Length);
        Buffer.BlockCopy(otpBytes, 0, combined, saltBytes.Length, otpBytes.Length);

        var hashBytes = hmac.ComputeHash(combined);
        return Convert.ToHexString(hashBytes);
    }
}
