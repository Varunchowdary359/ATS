using System;
using System.Collections.Generic;
using PeopleWorks.ATS.Domain.Common;
using PeopleWorks.ATS.Domain.Enums;
using PeopleWorks.ATS.Domain.Entities.Requisitions;
using PeopleWorks.ATS.Domain.Entities.JobPostings;

namespace PeopleWorks.ATS.Domain.Entities.JobDescriptions;

public class JobDescription : BaseAuditableEntity
{
    public string BusinessId { get; set; } = string.Empty; // e.g. "JD-2026-001"
    public Guid RequisitionId { get; set; }
    public Requisition Requisition { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = string.Empty;
    public string ExperienceLevel { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Responsibilities { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string PreferredQualifications { get; set; } = string.Empty;
    public string Benefits { get; set; } = string.Empty;

    public int CurrentVersion { get; set; } = 1;
    public JobDescriptionStatus Status { get; set; } = JobDescriptionStatus.Draft;

    public ICollection<JobDescriptionVersion> Versions { get; set; } = new List<JobDescriptionVersion>();
    public ICollection<JDWorkflowStep> WorkflowSteps { get; set; } = new List<JDWorkflowStep>();
    public ICollection<JobPosting> Postings { get; set; } = new List<JobPosting>();
}

public class JobDescriptionVersion : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid JobDescriptionId { get; set; }
    public JobDescription JobDescription { get; set; } = null!;

    public int VersionNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Responsibilities { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string ChangeSummary { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}

public class JDWorkflowRule : BaseAuditableEntity
{
    public string Department { get; set; } = string.Empty;
    public string BandLevel { get; set; } = string.Empty;
    public int RequiredApprovalCount { get; set; } = 2;
    public bool RequiresHrReview { get; set; } = true;
    public bool RequiresFinanceReview { get; set; } = false;
}

public class JDWorkflowStep : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid JobDescriptionId { get; set; }
    public JobDescription JobDescription { get; set; } = null!;

    public int StepOrder { get; set; }
    public string StepName { get; set; } = string.Empty;
    public string ApproverRole { get; set; } = string.Empty;
    public Guid? AssignedUserId { get; set; }
    public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
    public string? Comments { get; set; }
    public DateTime? ActionedAt { get; set; }
}
