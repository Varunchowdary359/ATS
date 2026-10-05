using System;
using PeopleWorks.ATS.Domain.Common;

namespace PeopleWorks.ATS.Domain.Entities.Audit;

public class AuditLog : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public string EntityName { get; set; } = string.Empty; // Requisition, Application, InterviewSession, Policy
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Create, Update, Delete, StatusChange, Approve, Reject
    public string PerformedByUserId { get; set; } = string.Empty;
    public string PerformedByEmail { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? OldValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}

public class SecurityEvent : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public string EventType { get; set; } = string.Empty; // LoginSuccess, LoginFailure, PolicyViolation, TokenRefresh, UnauthorizedAccess
    public string Severity { get; set; } = "Info"; // Info, Warning, Error, Critical
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? DetailsJson { get; set; }
}
