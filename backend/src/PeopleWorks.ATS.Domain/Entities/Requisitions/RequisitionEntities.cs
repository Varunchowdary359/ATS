using System;
using System.Collections.Generic;
using PeopleWorks.ATS.Domain.Common;
using PeopleWorks.ATS.Domain.Enums;
using PeopleWorks.ATS.Domain.Entities.Tenants;
using PeopleWorks.ATS.Domain.Entities.Identity;
using PeopleWorks.ATS.Domain.Entities.JobDescriptions;
using PeopleWorks.ATS.Domain.Entities.Applications;
using PeopleWorks.ATS.Domain.Entities.Interviews;
using AtsApplication = PeopleWorks.ATS.Domain.Entities.Applications.Application;

namespace PeopleWorks.ATS.Domain.Entities.Requisitions;

public class Requisition : BaseAuditableEntity
{
    public string RequisitionCode { get; set; } = string.Empty; // e.g. "REQ-2026-001"
    public string ReqNumber { get; set; } = string.Empty; // e.g. "REQ-001"
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string JobType { get; set; } = "Full-time";
    public int Openings { get; set; } = 1;
    public int HiredCount { get; set; } = 0;
    public Guid HiringManagerId { get; set; }
    public Guid LeadRecruiterId { get; set; }
    public RequisitionPriority Priority { get; set; } = RequisitionPriority.Medium;
    public RequisitionStatus Status { get; set; } = RequisitionStatus.Draft;
    public decimal? BudgetMin { get; set; }
    public decimal? BudgetMax { get; set; }
    public string Currency { get; set; } = "USD";
    public DateTime? TargetStartDate { get; set; }
    public string? Justification { get; set; }
    public string? CostCenter { get; set; }
    public string? RejectionComment { get; set; }

    public virtual Tenant Tenant { get; set; } = null!;
    public virtual User HiringManager { get; set; } = null!;
    public virtual User LeadRecruiter { get; set; } = null!;
    public virtual JobDescription? JobDescription { get; set; }
    public virtual InterviewPlan? InterviewPlan { get; set; }

    public virtual ICollection<RequisitionApprovalStep> ApprovalSteps { get; set; } = new List<RequisitionApprovalStep>();
    public virtual ICollection<RequisitionApprovalAudit> ApprovalAudits { get; set; } = new List<RequisitionApprovalAudit>();
    public virtual ICollection<UserRequisitionAssignment> UserAssignments { get; set; } = new List<UserRequisitionAssignment>();
    public virtual ICollection<AtsApplication> Applications { get; set; } = new List<AtsApplication>();
    public virtual ICollection<InterviewSession> InterviewSessions { get; set; } = new List<InterviewSession>();
}

public class RequisitionApprovalStep : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid RequisitionId { get; set; }
    public int StepOrder { get; set; }
    public string StepKey { get; set; } = string.Empty; // "hiring_manager", "finance", "dept_head"
    public string RoleName { get; set; } = string.Empty;
    public string ApproverName { get; set; } = string.Empty;
    public Guid? ApproverUserId { get; set; }
    public ApprovalStatus Status { get; set; } = ApprovalStatus.Waiting;
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionComment { get; set; }
    public string? Avatar { get; set; }

    public virtual Requisition Requisition { get; set; } = null!;
}

public class RequisitionApprovalAudit : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid RequisitionId { get; set; }
    public string Actor { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // "STEP_APPROVED", "STEP_REJECTED", "CHAIN_INITIALIZED"
    public string Details { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public virtual Requisition Requisition { get; set; } = null!;
}
