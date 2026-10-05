using System;

namespace PeopleWorks.ATS.Application.Common.Interfaces;

public interface ICurrentTenantService
{
    Guid TenantId { get; }
    bool HasTenant { get; }
    void SetTenant(Guid tenantId);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    Guid? TenantId { get; }
    Guid? SessionId { get; }
    string? UserEmail { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
}

public interface IDatabaseInitializer
{
    Task InitializeAsync(CancellationToken cancellationToken = default);
    Task SeedDevelopmentDataAsync(CancellationToken cancellationToken = default);
}
