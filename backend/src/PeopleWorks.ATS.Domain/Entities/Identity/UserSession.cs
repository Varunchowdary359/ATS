using System;
using PeopleWorks.ATS.Domain.Common;

namespace PeopleWorks.ATS.Domain.Entities.Identity;

public class UserSession : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;

    public string RefreshTokenHash { get; set; } = string.Empty;
    public string? RefreshTokenSalt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(2); // Absolute lifetime (2 hours)

    public DateTime? RevokedAt { get; set; }
    public string? RevocationReason { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? DeviceId { get; set; }

    public bool IsActive(DateTime utcNow, TimeSpan idleTimeout)
    {
        if (RevokedAt.HasValue) return false;
        if (utcNow >= ExpiresAt) return false; // Absolute expiry
        if (utcNow - LastActivityAt > idleTimeout) return false; // Idle timeout (15 mins)
        return true;
    }
}
