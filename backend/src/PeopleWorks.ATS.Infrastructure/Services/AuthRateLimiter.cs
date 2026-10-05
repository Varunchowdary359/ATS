using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using PeopleWorks.ATS.Application.Common.Interfaces;

namespace PeopleWorks.ATS.Infrastructure.Services;

public class AuthRateLimiter : IAuthRateLimiter
{
    private static readonly ConcurrentDictionary<string, List<DateTime>> PhoneRequestHistory = new();
    private static readonly ConcurrentDictionary<string, int> ChallengeAttemptHistory = new();

    private static readonly TimeSpan CooldownPeriod = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan WindowPeriod = TimeSpan.FromMinutes(15);
    private const int MaxRequestsPerWindow = 5;

    public RateLimitCheckResult CheckOtpRequestLimit(string normalizedPhoneNumber, string? ipAddress = null)
    {
        var now = DateTime.UtcNow;
        var key = normalizedPhoneNumber.Trim();

        var history = PhoneRequestHistory.GetOrAdd(key, _ => new List<DateTime>());
        lock (history)
        {
            // Remove requests outside sliding window (15 mins)
            history.RemoveAll(timestamp => now - timestamp > WindowPeriod);

            // 1. Check 60-second cooldown from last request
            var lastRequest = history.LastOrDefault();
            if (lastRequest != default && now - lastRequest < CooldownPeriod)
            {
                var remainingCooldown = CooldownPeriod - (now - lastRequest);
                return new RateLimitCheckResult
                {
                    IsAllowed = false,
                    RetryAfter = remainingCooldown,
                    Reason = $"Please wait {Math.Ceiling(remainingCooldown.TotalSeconds)} seconds before requesting another OTP."
                };
            }

            // 2. Check maximum requests in sliding window (max 5 in 15 mins)
            if (history.Count >= MaxRequestsPerWindow)
            {
                var oldestInWindow = history.First();
                var remainingWindow = WindowPeriod - (now - oldestInWindow);
                return new RateLimitCheckResult
                {
                    IsAllowed = false,
                    RetryAfter = remainingWindow,
                    Reason = "Maximum OTP requests reached for this phone number. Please try again later."
                };
            }
        }

        return new RateLimitCheckResult { IsAllowed = true };
    }

    public void RecordOtpRequest(string normalizedPhoneNumber, string? ipAddress = null)
    {
        var now = DateTime.UtcNow;
        var key = normalizedPhoneNumber.Trim();

        var history = PhoneRequestHistory.GetOrAdd(key, _ => new List<DateTime>());
        lock (history)
        {
            history.Add(now);
        }
    }

    public RateLimitCheckResult CheckOtpVerificationLimit(string challengeId, string? ipAddress = null)
    {
        if (ChallengeAttemptHistory.TryGetValue(challengeId, out var attempts) && attempts >= 5)
        {
            return new RateLimitCheckResult
            {
                IsAllowed = false,
                Reason = "Verification attempt limit reached for this OTP."
            };
        }

        return new RateLimitCheckResult { IsAllowed = true };
    }

    public void RecordOtpVerificationAttempt(string challengeId, string? ipAddress = null)
    {
        ChallengeAttemptHistory.AddOrUpdate(challengeId, 1, (_, count) => count + 1);
    }
}
