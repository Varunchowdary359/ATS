using System;
using System.Collections.Generic;
using PeopleWorks.ATS.Domain.Common;
using PeopleWorks.ATS.Domain.Entities.JobDescriptions;

namespace PeopleWorks.ATS.Domain.Entities.JobPostings;

public class JobPosting : BaseAuditableEntity
{
    public string BusinessId { get; set; } = string.Empty; // e.g. "POST-001"
    public Guid JobDescriptionId { get; set; }
    public JobDescription JobDescription { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = true;
    public bool IsExternal { get; set; } = true;
    public DateTime? PublishedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string PostingStatus { get; set; } = "Published"; // Draft, Published, Paused, Closed

    public ICollection<JobPostingChannel> Channels { get; set; } = new List<JobPostingChannel>();
}

public class JobPostingChannel : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid JobPostingId { get; set; }
    public JobPosting JobPosting { get; set; } = null!;

    public string ChannelName { get; set; } = string.Empty; // LinkedIn, Indeed, CareersPage, ReferralPortal
    public string ExternalPostId { get; set; } = string.Empty;
    public string ExternalUrl { get; set; } = string.Empty;
    public string ChannelStatus { get; set; } = "Active";
    public DateTime? PostedAt { get; set; }
}
