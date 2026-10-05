using System;
using System.Collections.Generic;
using PeopleWorks.ATS.Domain.Common;
using PeopleWorks.ATS.Domain.Enums;
using PeopleWorks.ATS.Domain.Entities.Applications;
using PeopleWorks.ATS.Domain.Entities.Requisitions;
using PeopleWorks.ATS.Domain.Entities.Candidates;
using PeopleWorks.ATS.Domain.Entities.Policies;

namespace PeopleWorks.ATS.Domain.Entities.Interviews;

public class InterviewPlan : BaseAuditableEntity
{
    public Guid RequisitionId { get; set; }
    public Requisition Requisition { get; set; } = null!;

    public string Name { get; set; } = "Standard Technical Plan";
    public string Description { get; set; } = string.Empty;
    public int TotalRounds { get; set; } = 3;

    public ICollection<InterviewRound> Rounds { get; set; } = new List<InterviewRound>();
}

public class InterviewRound : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid InterviewPlanId { get; set; }
    public InterviewPlan InterviewPlan { get; set; } = null!;

    public int RoundOrder { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. "Screening", "Technical Deep Dive", "Managerial & Culture Fit"
    public InterviewType Type { get; set; } = InterviewType.Video;
    public int DurationMinutes { get; set; } = 45;
    public bool IsMandatory { get; set; } = true;
    public string Description { get; set; } = string.Empty;

    public ICollection<InterviewSession> Sessions { get; set; } = new List<InterviewSession>();
}

public class InterviewSession : BaseAuditableEntity
{
    public string BusinessId { get; set; } = string.Empty; // e.g. "INT-SESS-MOCK-001"

    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;

    public Guid CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;

    public Guid RequisitionId { get; set; }
    public Requisition Requisition { get; set; } = null!;

    public Guid? InterviewRoundId { get; set; }
    public InterviewRound? InterviewRound { get; set; }

    public string RoundName { get; set; } = string.Empty;
    public InterviewType Type { get; set; } = InterviewType.Video;
    public InterviewSessionStatus Status { get; set; } = InterviewSessionStatus.Scheduled;

    public DateTime ScheduledStartTime { get; set; }
    public DateTime ScheduledEndTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }

    public MeetingProvider MeetingProvider { get; set; } = MeetingProvider.GoogleMeet;
    public string? MeetingLink { get; set; }
    public string? MeetingId { get; set; }
    public string? MeetingPassword { get; set; }

    // Locked Assessment Policy for this session
    public Guid? PolicyId { get; set; }
    public AssessmentPolicy? Policy { get; set; }
    public int? LockedPolicyVersion { get; set; }

    // Aggregate Round Outcome & Decision
    public RoundOutcomeDecision? RoundDecision { get; set; }
    public string? DecisionNotes { get; set; }
    public DateTime? DecisionDate { get; set; }
    public Guid? DecisionMakerUserId { get; set; }

    public ICollection<InterviewPanelist> Panelists { get; set; } = new List<InterviewPanelist>();
    public ICollection<InterviewScorecard> Scorecards { get; set; } = new List<InterviewScorecard>();
    public ICollection<SessionViolation> Violations { get; set; } = new List<SessionViolation>();
    public ICollection<CandidatePolicyAcceptance> CandidatePolicyAcceptances { get; set; } = new List<CandidatePolicyAcceptance>();
    public ICollection<InterviewerPolicyAcceptance> InterviewerPolicyAcceptances { get; set; } = new List<InterviewerPolicyAcceptance>();
    public ICollection<TechnicalReadinessCheck> ReadinessChecks { get; set; } = new List<TechnicalReadinessCheck>();
}

public class InterviewPanelist : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid InterviewSessionId { get; set; }
    public InterviewSession InterviewSession { get; set; } = null!;

    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Primary Interviewer"; // Primary Interviewer, Co-Interviewer, Shadow, Observer
    public bool IsLead { get; set; } = false;
    public bool HasAttended { get; set; } = false;
}

public class InterviewScorecard : BaseAuditableEntity
{
    public Guid InterviewSessionId { get; set; }
    public InterviewSession InterviewSession { get; set; } = null!;

    public Guid EvaluatorUserId { get; set; }
    public string EvaluatorName { get; set; } = string.Empty;
    public string EvaluatorRole { get; set; } = string.Empty;

    public ScorecardRecommendation Recommendation { get; set; } = ScorecardRecommendation.StrongYes;
    public decimal OverallRating { get; set; } // 1.0 - 5.0
    public string Strengths { get; set; } = string.Empty;
    public string AreasOfImprovement { get; set; } = string.Empty;
    public string SummaryNotes { get; set; } = string.Empty;
    public FeedbackStatus FeedbackStatus { get; set; } = FeedbackStatus.Pending;
    public DateTime? SubmittedAt { get; set; }

    public ICollection<ScorecardCriterionRating> CriteriaRatings { get; set; } = new List<ScorecardCriterionRating>();
}

public class ScorecardCriterionRating : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid InterviewScorecardId { get; set; }
    public InterviewScorecard InterviewScorecard { get; set; } = null!;

    public string CriterionCategory { get; set; } = "TechnicalSkills"; // TechnicalSkills, ProblemSolving, Communication, CultureAlignment
    public string CriterionName { get; set; } = string.Empty;
    public decimal Rating { get; set; } // 1 - 5
    public string? Comments { get; set; }
    public decimal Weight { get; set; } = 1.0m;
}

public class SessionViolation : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid InterviewSessionId { get; set; }
    public InterviewSession InterviewSession { get; set; } = null!;

    public ViolationType ViolationType { get; set; }
    public string Severity { get; set; } = "Warning"; // Info, Warning, Critical
    public string Description { get; set; } = string.Empty;
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
    public ViolationAction ActionTaken { get; set; } = ViolationAction.Warning;
    public string? AdditionalDetailsJson { get; set; }
}
