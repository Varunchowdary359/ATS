using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Domain.Entities.Identity;
using PeopleWorks.ATS.Infrastructure.Data;

namespace PeopleWorks.ATS.Infrastructure.Services;

public class SessionService : ISessionService
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly ILogger<SessionService> _logger;

    private static readonly TimeSpan IdleTimeout = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan AbsoluteLifetime = TimeSpan.FromHours(2);

    public SessionService(
        AppDbContext context,
        ITokenService tokenService,
        ILogger<SessionService> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<(UserSession session, string rawRefreshToken)> CreateSessionAsync(
        User user,
        string? ipAddress = null,
        string? userAgent = null,
        string? deviceId = null,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var (rawRefreshToken, hashedRefreshToken, salt) = _tokenService.GenerateRefreshToken();

        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TenantId = user.TenantId,
            RefreshTokenHash = hashedRefreshToken,
            RefreshTokenSalt = salt,
            CreatedAt = now,
            LastActivityAt = now,
            ExpiresAt = now.Add(AbsoluteLifetime),
            IpAddress = ipAddress,
            UserAgent = userAgent,
            DeviceId = deviceId
        };

        await _context.UserSessions.AddAsync(session, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return (session, rawRefreshToken);
    }

    public async Task<bool> ValidateAndTouchSessionAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _context.UserSessions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null) return false;

        var now = DateTime.UtcNow;
        if (!session.IsActive(now, IdleTimeout))
        {
            if (session.RevokedAt == null && (now >= session.ExpiresAt || now - session.LastActivityAt > IdleTimeout))
            {
                session.RevokedAt = now;
                session.RevocationReason = now >= session.ExpiresAt ? "Absolute Session Expiration" : "Idle Timeout Expiration";
                await _context.SaveChangesAsync(cancellationToken);
            }
            return false;
        }

        // Touch session activity timestamp
        session.LastActivityAt = now;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<SessionRefreshResult> RefreshSessionAsync(string rawRefreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            return new SessionRefreshResult { IsSuccessful = false, ErrorMessage = "Invalid refresh token." };
        }

        var now = DateTime.UtcNow;

        // Fetch active non-revoked sessions
        var candidateSessions = await _context.UserSessions
            .IgnoreQueryFilters()
            .Include(s => s.User)
            .Where(s => s.RevokedAt == null && s.ExpiresAt > now)
            .ToListAsync(cancellationToken);

        UserSession? matchedSession = null;
        foreach (var session in candidateSessions)
        {
            if (!string.IsNullOrEmpty(session.RefreshTokenSalt) &&
                _tokenService.VerifyRefreshToken(rawRefreshToken, session.RefreshTokenHash, session.RefreshTokenSalt))
            {
                matchedSession = session;
                break;
            }
        }

        if (matchedSession == null)
        {
            _logger.LogWarning("[AUTH] Refresh token mismatch or possible reuse detected.");
            return new SessionRefreshResult
            {
                IsSuccessful = false,
                ErrorMessage = "Invalid or expired session.",
                TokenReuseDetected = true
            };
        }

        // Check idle timeout
        if (!matchedSession.IsActive(now, IdleTimeout))
        {
            matchedSession.RevokedAt = now;
            matchedSession.RevocationReason = "Session Inactive or Expired";
            await _context.SaveChangesAsync(cancellationToken);

            return new SessionRefreshResult
            {
                IsSuccessful = false,
                ErrorMessage = "Session has expired due to inactivity."
            };
        }

        // Rotate refresh token
        var (newRawRefreshToken, newHash, newSalt) = _tokenService.GenerateRefreshToken();
        matchedSession.RefreshTokenHash = newHash;
        matchedSession.RefreshTokenSalt = newSalt;
        matchedSession.LastActivityAt = now;

        await _context.SaveChangesAsync(cancellationToken);

        return new SessionRefreshResult
        {
            IsSuccessful = true,
            Session = matchedSession,
            User = matchedSession.User,
            NewRawRefreshToken = newRawRefreshToken
        };
    }

    public async Task<bool> RevokeSessionAsync(Guid sessionId, string reason = "User Logout", CancellationToken cancellationToken = default)
    {
        var session = await _context.UserSessions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null) return false;

        session.RevokedAt = DateTime.UtcNow;
        session.RevocationReason = reason;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> RevokeAllUserSessionsAsync(Guid userId, string reason = "User Logout All", CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var activeSessions = await _context.UserSessions
            .IgnoreQueryFilters()
            .Where(s => s.UserId == userId && s.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var s in activeSessions)
        {
            s.RevokedAt = now;
            s.RevocationReason = reason;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return activeSessions.Count;
    }
}
