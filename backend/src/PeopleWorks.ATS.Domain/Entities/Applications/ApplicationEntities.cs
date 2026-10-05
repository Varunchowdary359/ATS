using System;
using System.Collections.Generic;
using PeopleWorks.ATS.Domain.Common;
using PeopleWorks.ATS.Domain.Enums;
using PeopleWorks.ATS.Domain.Entities.Candidates;
using PeopleWorks.ATS.Domain.Entities.Requisitions;
using PeopleWorks.ATS.Domain.Entities.Interviews;

namespace PeopleWorks.ATS.Domain.Entities.Applications;

public class Application : BaseAuditableEntity
{
    public string BusinessId { get; set; } = string.Empty; // e.g. "APP-2026-001"

    public Guid CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;

    public Guid RequisitionId { get; set; }
    public Requisition Requisition { get; set; } = null!;

    public ApplicationStage Stage { get; set; } = ApplicationStage.Screening;
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Active;

    public DateTime AppliedDate { get; set; } = DateTime.UtcNow;
    public string Source { get; set; } = "CareersPage";
    public string? RejectionReason { get; set; }
    public string? RejectionCategory { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? HoldReason { get; set; }
    public DateTime? PutOnHoldAt { get; set; }

    public ICollection<ApplicationTimelineEvent> TimelineEvents { get; set; } = new List<ApplicationTimelineEvent>();
    public ICollection<ScreeningEvaluation> ScreeningEvaluations { get; set; } = new List<ScreeningEvaluation>();
    public ICollection<InterviewSession> InterviewSessions { get; set; } = new List<InterviewSession>();
}

public class ApplicationTimelineEvent : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;

    public string EventType { get; set; } = string.Empty; // StageChanged, StatusChanged, InterviewScheduled, FeedbackSubmitted, NoteAdded
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? MetadataJson { get; set; }
}

public class ScreeningEvaluation : BaseAuditableEntity
{
    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;

    public Guid EvaluatorUserId { get; set; }
    public decimal OverallScore { get; set; } // 0 - 100
    public decimal ExperienceMatchScore { get; set; }
    public decimal SkillMatchScore { get; set; }
    public decimal EducationMatchScore { get; set; }
    public string Recommendation { get; set; } = "Proceed"; // Proceed, Hold, Reject
    public string SummaryNotes { get; set; } = string.Empty;
    public string? DetailedScoresJson { get; set; }
}
