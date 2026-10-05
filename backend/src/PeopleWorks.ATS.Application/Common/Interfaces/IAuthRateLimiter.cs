using System;

namespace PeopleWorks.ATS.Application.Common.Interfaces;

public interface IAuthRateLimiter
{
    /// <summary>
    /// Checks if an OTP request is permitted for the phone number (60s cooldown, max 5 in 15 mins).
    /// </summary>
    RateLimitCheckResult CheckOtpRequestLimit(string normalizedPhoneNumber, string? ipAddress = null);

    /// <summary>
    /// Records a successful OTP dispatch for rate tracking.
    /// </summary>
    void RecordOtpRequest(string normalizedPhoneNumber, string? ipAddress = null);

    /// <summary>
    /// Checks if verification attempts are within allowable limits.
    /// </summary>
    RateLimitCheckResult CheckOtpVerificationLimit(string challengeId, string? ipAddress = null);

    /// <summary>
    /// Records a verification attempt.
    /// </summary>
    void RecordOtpVerificationAttempt(string challengeId, string? ipAddress = null);
}

public class RateLimitCheckResult
{
    public bool IsAllowed { get; set; }
    public TimeSpan? RetryAfter { get; set; }
    public string? Reason { get; set; }
}
