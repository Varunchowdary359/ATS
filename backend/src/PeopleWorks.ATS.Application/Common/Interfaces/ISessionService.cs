using System;
using System.Threading;
using System.Threading.Tasks;
using PeopleWorks.ATS.Domain.Entities.Identity;

namespace PeopleWorks.ATS.Application.Common.Interfaces;

public interface ISessionService
{
    /// <summary>
    /// Creates a new active UserSession and generates initial refresh token.
    /// </summary>
    Task<(UserSession session, string rawRefreshToken)> CreateSessionAsync(
        User user,
        string? ipAddress = null,
        string? userAgent = null,
        string? deviceId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates an active session against idle timeout (15 min) and absolute timeout (2 hr), and touches LastActivityAt.
    /// </summary>
    Task<bool> ValidateAndTouchSessionAsync(Guid sessionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Rotates refresh token for an active session and issues a new refresh token. Detects token reuse.
    /// </summary>
    Task<SessionRefreshResult> RefreshSessionAsync(string rawRefreshToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// Revokes a specific active session (Logout).
    /// </summary>
    Task<bool> RevokeSessionAsync(Guid sessionId, string reason = "User Logout", CancellationToken cancellationToken = default);

    /// <summary>
    /// Revokes all active sessions for a specific user (Logout All).
    /// </summary>
    Task<int> RevokeAllUserSessionsAsync(Guid userId, string reason = "User Logout All", CancellationToken cancellationToken = default);
}

public class SessionRefreshResult
{
    public bool IsSuccessful { get; set; }
    public string? ErrorMessage { get; set; }
    public UserSession? Session { get; set; }
    public User? User { get; set; }
    public string? NewRawRefreshToken { get; set; }
    public bool TokenReuseDetected { get; set; }
}
