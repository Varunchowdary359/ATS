using System;
using PeopleWorks.ATS.Domain.Common;

namespace PeopleWorks.ATS.Domain.Entities.Identity;

public class OtpChallenge : BaseEntity
{
    public Guid? TenantId { get; set; }
    public Guid? UserId { get; set; }

    public string NormalizedPhoneNumber { get; set; } = string.Empty;
    public string Purpose { get; set; } = "Login";
    public string ChallengeId { get; set; } = Guid.NewGuid().ToString("N");

    // Secure verification data (HMAC-SHA256 hash & per-challenge salt)
    public string OtpHash { get; set; } = string.Empty;
    public string OtpSalt { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(5);

    public int AttemptCount { get; set; } = 0;
    public int MaxAttempts { get; set; } = 5;

    public int ResendCount { get; set; } = 0;
    public DateTime LastSentAt { get; set; } = DateTime.UtcNow;

    public DateTime? UsedAt { get; set; }
    public DateTime? InvalidatedAt { get; set; }
    public DateTime? LockoutUntil { get; set; }

    public bool IsExpired(DateTime utcNow) => utcNow >= ExpiresAt;
    public bool IsUsed => UsedAt.HasValue;
    public bool IsInvalidated => InvalidatedAt.HasValue;
    public bool IsLockedOut(DateTime utcNow) => LockoutUntil.HasValue && utcNow < LockoutUntil.Value;
    public bool HasExceededAttempts => AttemptCount >= MaxAttempts;
}
