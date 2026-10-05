using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Application.DTOs.Auth;
using PeopleWorks.ATS.Domain.Entities.Audit;
using PeopleWorks.ATS.Domain.Entities.Identity;
using PeopleWorks.ATS.Infrastructure.Data;

namespace PeopleWorks.ATS.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IPhoneNormalizer _phoneNormalizer;
    private readonly IOtpService _otpService;
    private readonly ISmsSender _smsSender;
    private readonly IDevOtpStore _devOtpStore;
    private readonly ITokenService _tokenService;
    private readonly ISessionService _sessionService;
    private readonly IAuthRateLimiter _rateLimiter;
    private readonly ICurrentUserService _currentUserService;
    private readonly AppDbContext _context;
    private readonly IHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IPhoneNormalizer phoneNormalizer,
        IOtpService otpService,
        ISmsSender smsSender,
        IDevOtpStore devOtpStore,
        ITokenService tokenService,
        ISessionService sessionService,
        IAuthRateLimiter rateLimiter,
        ICurrentUserService currentUserService,
        AppDbContext context,
        IHostEnvironment environment,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _phoneNormalizer = phoneNormalizer;
        _otpService = otpService;
        _smsSender = smsSender;
        _devOtpStore = devOtpStore;
        _tokenService = tokenService;
        _sessionService = sessionService;
        _rateLimiter = rateLimiter;
        _currentUserService = currentUserService;
        _context = context;
        _environment = environment;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Requests a secure 6-digit OTP for phone login.
    /// </summary>
    [HttpPost("otp/request")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(OtpRequestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> RequestOtp([FromBody] OtpRequestDto request, CancellationToken cancellationToken)
    {
        if (!_phoneNormalizer.TryNormalize(request.PhoneNumber, out var normalizedPhone, out var error))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Phone Number",
                Detail = error,
                Status = StatusCodes.Status400BadRequest
            });
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        // 1. Rate Limiting Check (60s cooldown, max 5 per 15 min)
        var rateCheck = _rateLimiter.CheckOtpRequestLimit(normalizedPhone, ip);
        if (!rateCheck.IsAllowed)
        {
            await RecordSecurityEventAsync("OTP_RATE_LIMITED", null, null, $"Rate limit hit for phone: {_phoneNormalizer.MaskPhoneNumber(normalizedPhone)}. {rateCheck.Reason}", cancellationToken);
            return StatusCode(StatusCodes.Status429TooManyRequests, new ProblemDetails
            {
                Title = "Too Many Requests",
                Detail = rateCheck.Reason,
                Status = StatusCodes.Status429TooManyRequests
            });
        }

        // 2. Lookup user by normalized phone number across tenants (or specific tenant if tenantCode provided)
        var query = _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .Where(u => u.NormalizedPhoneNumber == normalizedPhone && u.Status == "Active");

        if (!string.IsNullOrWhiteSpace(request.TenantCode))
        {
            query = query.Where(u => u.Tenant.Code == request.TenantCode.Trim());
        }

        var matchedUsers = await query.ToListAsync(cancellationToken);
        User? user = null;
        Guid? tenantId = null;

        if (matchedUsers.Count == 1)
        {
            user = matchedUsers[0];
            tenantId = user.TenantId;
        }
        else if (matchedUsers.Count > 1 && string.IsNullOrWhiteSpace(request.TenantCode))
        {
            // Disambiguation required: multiple organizations exist for this number
            return BadRequest(new ProblemDetails
            {
                Title = "Organization Selection Required",
                Detail = "This phone number is associated with multiple organizations. Please specify tenantCode in your request.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        // 3. Generate OTP Challenge
        var (challenge, rawOtp) = await _otpService.CreateChallengeAsync(
            normalizedPhone,
            tenantId,
            user?.Id,
            "Login",
            cancellationToken);

        _rateLimiter.RecordOtpRequest(normalizedPhone, ip);

        // 4. Dispatch simulated or real SMS via SMS sender abstraction
        var message = $"Your PeopleWorks ATS login verification code is {rawOtp}. Valid for 5 minutes.";
        await _smsSender.SendOtpAsync(normalizedPhone, rawOtp, message, cancellationToken);

        await RecordSecurityEventAsync(
            "OTP_REQUESTED",
            tenantId ?? Guid.Empty,
            user?.Email,
            $"OTP requested for {user?.UserCode ?? "Guest"} ({_phoneNormalizer.MaskPhoneNumber(normalizedPhone)})",
            cancellationToken);

        // 5. Build response
        var response = new OtpRequestResponseDto
        {
            ChallengeId = challenge.ChallengeId,
            Message = "If the phone number is registered, an OTP verification code has been sent.",
            ExpiresInSeconds = 300
        };

        // If in Development and explicitly configured to expose dev OTP in response for Swagger convenience:
        var exposeDevOtp = bool.TryParse(_configuration["Authentication:ExposeDevOtpInResponse"], out var exp) && exp;
        if ((_environment.IsDevelopment() || _environment.IsEnvironment("Local")) && exposeDevOtp)
        {
            response.DevOtp = rawOtp;
        }

        return Ok(response);
    }

    /// <summary>
    /// Verifies the OTP and issues JWT Access &amp; Refresh tokens.
    /// </summary>
    [HttpPost("otp/verify")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyOtp([FromBody] OtpVerifyDto request, CancellationToken cancellationToken)
    {
        if (!_phoneNormalizer.TryNormalize(request.PhoneNumber, out var normalizedPhone, out var error))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Phone Number",
                Detail = error,
                Status = StatusCodes.Status400BadRequest
            });
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        // 1. Rate Limiting Check
        var limitCheck = _rateLimiter.CheckOtpVerificationLimit(request.ChallengeId, ip);
        if (!limitCheck.IsAllowed)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new ProblemDetails
            {
                Title = "Too Many Attempts",
                Detail = limitCheck.Reason,
                Status = StatusCodes.Status429TooManyRequests
            });
        }

        _rateLimiter.RecordOtpVerificationAttempt(request.ChallengeId, ip);

        // 2. Verify OTP cryptographically
        var verificationResult = await _otpService.VerifyChallengeAsync(
            request.ChallengeId,
            request.Otp.Trim(),
            normalizedPhone,
            cancellationToken);

        if (!verificationResult.IsSuccessful)
        {
            await RecordSecurityEventAsync("OTP_VERIFICATION_FAILURE", null, null, $"Failed OTP attempt for challenge {request.ChallengeId}", cancellationToken);
            return BadRequest(new ProblemDetails
            {
                Title = "Verification Failed",
                Detail = verificationResult.ErrorMessage ?? "Unable to verify the OTP. Please check the code and try again.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        // 3. Resolve eligible active user for this phone
        var userQuery = _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .Where(u => u.NormalizedPhoneNumber == normalizedPhone);

        if (!string.IsNullOrWhiteSpace(request.TenantCode))
        {
            userQuery = userQuery.Where(u => u.Tenant.Code == request.TenantCode.Trim());
        }

        var user = await userQuery.FirstOrDefaultAsync(cancellationToken);
        if (user == null || user.Status != "Active")
        {
            await RecordSecurityEventAsync("LOGIN_FAILURE", null, null, $"Inactive or unknown account for verified phone: {_phoneNormalizer.MaskPhoneNumber(normalizedPhone)}", cancellationToken);
            return Unauthorized(new ProblemDetails
            {
                Title = "Account Inactive",
                Detail = "Unable to authenticate. Please contact your system administrator.",
                Status = StatusCodes.Status401Unauthorized
            });
        }

        // 4. Create Active Authenticated User Session
        var (session, rawRefreshToken) = await _sessionService.CreateSessionAsync(
            user,
            ip,
            userAgent,
            null,
            cancellationToken);

        // 5. Generate signed JWT Access Token
        var accessToken = _tokenService.GenerateAccessToken(user, session.Id);

        // Update user activity
        user.LastLoginAt = DateTime.UtcNow;
        user.LastActiveAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        await RecordSecurityEventAsync("LOGIN_SUCCESS", user.TenantId, user.Email, $"User {user.UserCode} successfully logged in via Phone OTP", cancellationToken);

        var profile = new UserProfileDto
        {
            Id = user.Id,
            UserCode = user.UserCode,
            EmpId = user.EmpId,
            Name = user.Name,
            Email = user.Email,
            MaskedPhoneNumber = _phoneNormalizer.MaskPhoneNumber(user.PhoneNumber),
            Role = user.Role.ToString(),
            Department = user.Department,
            Designation = user.Designation,
            Avatar = user.Avatar,
            AvatarBg = user.AvatarBg,
            TenantId = user.TenantId,
            TenantName = user.Tenant?.Name,
            Status = user.Status
        };

        return Ok(new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            TokenType = "Bearer",
            ExpiresInSeconds = _tokenService.AccessTokenLifetimeSeconds,
            User = profile
        });
    }

    /// <summary>
    /// Rotates the refresh token and issues a new access token.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto request, CancellationToken cancellationToken)
    {
        var result = await _sessionService.RefreshSessionAsync(request.RefreshToken, cancellationToken);

        if (!result.IsSuccessful || result.Session == null || result.User == null)
        {
            if (result.TokenReuseDetected)
            {
                await RecordSecurityEventAsync("TOKEN_REUSE_DETECTED", null, null, "Potential token theft detected; session revoked.", cancellationToken);
            }

            return Unauthorized(new ProblemDetails
            {
                Title = "Unauthorized",
                Detail = result.ErrorMessage ?? "Invalid or expired session.",
                Status = StatusCodes.Status401Unauthorized
            });
        }

        var newAccessToken = _tokenService.GenerateAccessToken(result.User, result.Session.Id);
        await RecordSecurityEventAsync("TOKEN_REFRESH", result.User.TenantId, result.User.Email, $"Token refreshed for session {result.Session.Id}", cancellationToken);

        var profile = new UserProfileDto
        {
            Id = result.User.Id,
            UserCode = result.User.UserCode,
            EmpId = result.User.EmpId,
            Name = result.User.Name,
            Email = result.User.Email,
            MaskedPhoneNumber = _phoneNormalizer.MaskPhoneNumber(result.User.PhoneNumber),
            Role = result.User.Role.ToString(),
            Department = result.User.Department,
            Designation = result.User.Designation,
            Avatar = result.User.Avatar,
            AvatarBg = result.User.AvatarBg,
            TenantId = result.User.TenantId,
            Status = result.User.Status
        };

        return Ok(new AuthResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = result.NewRawRefreshToken!,
            TokenType = "Bearer",
            ExpiresInSeconds = _tokenService.AccessTokenLifetimeSeconds,
            User = profile
        });
    }

    /// <summary>
    /// Returns the profile of the currently authenticated user.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Unauthorized",
                Detail = "Unable to identify current user.",
                Status = StatusCodes.Status401Unauthorized
            });
        }

        var user = await _context.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken);

        if (user == null || user.Status != "Active")
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Unauthorized",
                Detail = "User account not active or found.",
                Status = StatusCodes.Status401Unauthorized
            });
        }

        return Ok(new UserProfileDto
        {
            Id = user.Id,
            UserCode = user.UserCode,
            EmpId = user.EmpId,
            Name = user.Name,
            Email = user.Email,
            MaskedPhoneNumber = _phoneNormalizer.MaskPhoneNumber(user.PhoneNumber),
            Role = user.Role.ToString(),
            Department = user.Department,
            Designation = user.Designation,
            Avatar = user.Avatar,
            AvatarBg = user.AvatarBg,
            TenantId = user.TenantId,
            TenantName = user.Tenant?.Name,
            Status = user.Status
        });
    }

    /// <summary>
    /// Revokes the current authenticated session (Logout).
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var sessionId = _currentUserService.SessionId;
        if (sessionId.HasValue)
        {
            await _sessionService.RevokeSessionAsync(sessionId.Value, "User Logout", cancellationToken);
            await RecordSecurityEventAsync("LOGOUT", _currentUserService.TenantId, _currentUserService.UserEmail, $"User logged out session {sessionId}", cancellationToken);
        }

        return Ok(new { message = "Logged out successfully." });
    }

    /// <summary>
    /// Revokes all active sessions for the current authenticated user (Logout All).
    /// </summary>
    [HttpPost("logout-all")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LogoutAll(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId.HasValue)
        {
            var revokedCount = await _sessionService.RevokeAllUserSessionsAsync(userId.Value, "User Logout All", cancellationToken);
            await RecordSecurityEventAsync("LOGOUT_ALL", _currentUserService.TenantId, _currentUserService.UserEmail, $"User revoked all {revokedCount} active sessions", cancellationToken);
        }

        return Ok(new { message = "All active sessions have been revoked." });
    }

    /// <summary>
    /// Development-only helper endpoint to inspect simulated OTP for testing. Strictly disabled in Production.
    /// </summary>
    [HttpGet("dev/last-otp")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetLastDevOtp([FromQuery] string phoneNumber, [FromHeader(Name = "X-Dev-Secret")] string? devSecret)
    {
        if (!_environment.IsDevelopment() && !_environment.IsEnvironment("Local") && !_environment.IsEnvironment("Testing"))
        {
            return NotFound();
        }

        // Check configured dev secret if provided
        var expectedSecret = _configuration["Authentication:DevSecret"] ?? "dev-secret-pwats-local";
        if (!string.IsNullOrEmpty(expectedSecret) && devSecret != expectedSecret)
        {
            return Unauthorized(new { message = "Invalid development secret header (X-Dev-Secret)." });
        }

        if (!_phoneNormalizer.TryNormalize(phoneNumber, out var normalizedPhone, out _))
        {
            return BadRequest(new { message = "Invalid phone number." });
        }

        var lastOtp = _devOtpStore.GetLastOtp(normalizedPhone);
        if (string.IsNullOrEmpty(lastOtp))
        {
            return NotFound(new { message = "No recent OTP found for this phone number." });
        }

        return Ok(new
        {
            phoneNumber = normalizedPhone,
            otp = lastOtp,
            note = "Development simulator only. Disabled in Production."
        });
    }

    private async Task RecordSecurityEventAsync(string eventType, Guid? tenantId, string? userEmail, string description, CancellationToken cancellationToken)
    {
        try
        {
            var securityEvent = new SecurityEvent
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId ?? Guid.Empty,
                EventType = eventType,
                UserEmail = userEmail,
                Description = description,
                Timestamp = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers.UserAgent.ToString()
            };

            await _context.SecurityEvents.AddAsync(securityEvent, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[SECURITY] Failed to persist security event {EventType}", eventType);
        }
    }
}
