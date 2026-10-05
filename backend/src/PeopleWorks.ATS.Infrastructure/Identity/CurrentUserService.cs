using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using PeopleWorks.ATS.Application.Common.Interfaces;

namespace PeopleWorks.ATS.Infrastructure.Identity;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value ??
                             _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return Guid.TryParse(userIdClaim, out var id) ? id : null;
        }
    }

    public Guid? TenantId
    {
        get
        {
            var tenantClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("tenant_id")?.Value;
            return Guid.TryParse(tenantClaim, out var id) ? id : null;
        }
    }

    public Guid? SessionId
    {
        get
        {
            var sessionClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("session_id")?.Value;
            return Guid.TryParse(sessionClaim, out var id) ? id : null;
        }
    }

    public string? UserEmail =>
        _httpContextAccessor.HttpContext?.User?.FindFirst("email")?.Value ??
        _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value ??
        "system@peopleworks.local";

    public string? Role =>
        _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value ??
        _httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value ??
        "AtsAdmin";

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
