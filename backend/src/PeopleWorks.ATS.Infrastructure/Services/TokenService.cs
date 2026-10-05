using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Domain.Entities.Identity;

namespace PeopleWorks.ATS.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly SymmetricSecurityKey _signingKey;
    private readonly int _accessTokenLifetimeSeconds;

    public int AccessTokenLifetimeSeconds => _accessTokenLifetimeSeconds;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;

        var jwtKey = _configuration["Jwt:Key"] ??
                     _configuration["JWT_SECRET_KEY"] ??
                     "PEOPLEWORKS_ATS_SUPER_SECRET_JWT_KEY_MINIMUM_32_BYTES_FOR_HS256_LOCAL_DEV";

        _issuer = _configuration["Jwt:Issuer"] ?? "PeopleWorks.ATS";
        _audience = _configuration["Jwt:Audience"] ?? "PeopleWorks.ATS.Client";
        _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

        var expiryMins = int.TryParse(_configuration["Jwt:AccessTokenLifetimeMinutes"], out var m) ? m : 15;
        _accessTokenLifetimeSeconds = expiryMins * 60;
    }

    public string GenerateAccessToken(User user, Guid sessionId, IEnumerable<string>? permissions = null)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddSeconds(_accessTokenLifetimeSeconds);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new("tenant_id", user.TenantId.ToString()),
            new("session_id", sessionId.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("user_code", user.UserCode),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        if (permissions != null)
        {
            foreach (var perm in permissions)
            {
                claims.Add(new Claim("permission", perm));
            }
        }

        var credentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _issuer,
            Audience = _audience,
            NotBefore = now,
            Expires = expires,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(token);
    }

    public (string rawRefreshToken, string hashedRefreshToken, string salt) GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        var rawRefreshToken = Convert.ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        var saltBytes = RandomNumberGenerator.GetBytes(32);
        var salt = Convert.ToBase64String(saltBytes);

        var hash = HashRefreshToken(rawRefreshToken, salt);
        return (rawRefreshToken, hash, salt);
    }

    public string HashRefreshToken(string rawRefreshToken, string salt)
    {
        var saltBytes = Convert.FromBase64String(salt);
        var tokenBytes = Encoding.UTF8.GetBytes(rawRefreshToken);

        var combined = new byte[saltBytes.Length + tokenBytes.Length];
        Buffer.BlockCopy(saltBytes, 0, combined, 0, saltBytes.Length);
        Buffer.BlockCopy(tokenBytes, 0, combined, saltBytes.Length, tokenBytes.Length);

        var hashBytes = SHA256.HashData(combined);
        return Convert.ToHexString(hashBytes);
    }

    public bool VerifyRefreshToken(string rawRefreshToken, string storedHash, string salt)
    {
        var computedHash = HashRefreshToken(rawRefreshToken, salt);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(storedHash),
            Encoding.UTF8.GetBytes(computedHash));
    }
}
