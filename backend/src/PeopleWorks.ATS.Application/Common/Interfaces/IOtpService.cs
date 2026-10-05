using System;
using System.Threading;
using System.Threading.Tasks;
using PeopleWorks.ATS.Domain.Entities.Identity;

namespace PeopleWorks.ATS.Application.Common.Interfaces;

public interface IOtpService
{
    /// <summary>
    /// Generates a cryptographically secure 6-digit numeric OTP and creates an OtpChallenge.
    /// </summary>
    Task<(OtpChallenge challenge, string rawOtp)> CreateChallengeAsync(
        string normalizedPhoneNumber,
        Guid? tenantId,
        Guid? userId,
        string purpose = "Login",
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Verifies the provided OTP against the challenge using constant-time comparison.
    /// </summary>
    Task<OtpVerificationResult> VerifyChallengeAsync(
        string challengeId,
        string rawOtp,
        string normalizedPhoneNumber,
        CancellationToken cancellationToken = default);
}

public class OtpVerificationResult
{
    public bool IsSuccessful { get; set; }
    public string? ErrorMessage { get; set; }
    public OtpChallenge? Challenge { get; set; }
    public bool AttemptsExhausted { get; set; }
    public bool IsExpired { get; set; }
}
