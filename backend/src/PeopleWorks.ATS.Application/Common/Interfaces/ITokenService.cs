using System;
using System.Collections.Generic;
using System.Security.Claims;
using PeopleWorks.ATS.Domain.Entities.Identity;

namespace PeopleWorks.ATS.Application.Common.Interfaces;

public interface ITokenService
{
    /// <summary>
    /// Generates a signed JWT Access Token with claims (sub, tenant_id, session_id, role, email).
    /// </summary>
    string GenerateAccessToken(User user, Guid sessionId, IEnumerable<string>? permissions = null);

    /// <summary>
    /// Generates a cryptographically random refresh token.
    /// </summary>
    (string rawRefreshToken, string hashedRefreshToken, string salt) GenerateRefreshToken();

    /// <summary>
    /// Hashes a raw refresh token with a salt for secure database comparison.
    /// </summary>
    string HashRefreshToken(string rawRefreshToken, string salt);

    /// <summary>
    /// Validates a raw refresh token against a stored hash and salt.
    /// </summary>
    bool VerifyRefreshToken(string rawRefreshToken, string storedHash, string salt);

    /// <summary>
    /// Lifetime of access tokens in seconds.
    /// </summary>
    int AccessTokenLifetimeSeconds { get; }
}
