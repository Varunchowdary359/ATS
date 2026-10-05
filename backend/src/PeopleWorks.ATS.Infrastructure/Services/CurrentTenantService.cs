using System;
using Microsoft.AspNetCore.Http;
using PeopleWorks.ATS.Application.Common.Interfaces;

namespace PeopleWorks.ATS.Infrastructure.Services;

public class CurrentTenantService : ICurrentTenantService
{
    private Guid _tenantId = Guid.Empty;

    public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext != null)
        {
            // 1. Prioritize authenticated JWT Claims (tenant_id)
            var tenantClaim = httpContext.User?.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var claimTenantId))
            {
                _tenantId = claimTenantId;
                return;
            }
        }

        // Default Development Tenant ID for initial development & testing when unauthenticated
        _tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    }

    public Guid TenantId => _tenantId;
    public bool HasTenant => _tenantId != Guid.Empty;

    public void SetTenant(Guid tenantId)
    {
        _tenantId = tenantId;
    }
}
