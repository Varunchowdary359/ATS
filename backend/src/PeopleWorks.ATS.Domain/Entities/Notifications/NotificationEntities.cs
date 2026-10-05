using System;
using System.Collections.Generic;
using PeopleWorks.ATS.Domain.Common;
using PeopleWorks.ATS.Domain.Enums;

namespace PeopleWorks.ATS.Domain.Entities.Notifications;

public class Notification : BaseAuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Category { get; set; } = "System"; // Requisition, Interview, Candidate, Policy, Security
    public string Priority { get; set; } = "Normal"; // Low, Normal, High, Urgent
    public string? ActionUrl { get; set; }
    public string? PayloadJson { get; set; }

    public ICollection<NotificationRecipient> Recipients { get; set; } = new List<NotificationRecipient>();
}

public class NotificationRecipient : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid NotificationId { get; set; }
    public Notification Notification { get; set; } = null!;

    public Guid UserId { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
    public bool IsDismissed { get; set; } = false;
    public DateTime? DismissedAt { get; set; }
}
