using System;
using System.Collections.Generic;
using PeopleWorks.ATS.Domain.Common;
using PeopleWorks.ATS.Domain.Enums;
using PeopleWorks.ATS.Domain.Entities.Interviews;

namespace PeopleWorks.ATS.Domain.Entities.Policies;

public class AssessmentPolicy : BaseAuditableEntity
{
    public string BusinessId { get; set; } = string.Empty; // e.g. "POL-INT-TECH-002"

    public string Name { get; set; } = string.Empty;
    public PolicyType PolicyType { get; set; } = PolicyType.Interview;
    public string Description { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public bool IsActiveVersion { get; set; } = true;
    public string PolicyStatus { get; set; } = "Active"; // Draft, Active, Deprecated

    // Requirements toggles
    public bool RequiresCamera { get; set; } = true;
    public bool RequiresMicrophone { get; set; } = true;
    public bool RequiresScreenShare { get; set; } = false;
    public bool RequiresCandidateAcceptance { get; set; } = true;
    public bool RequiresInterviewerAcceptance { get; set; } = true;
    public bool RequiresReadinessCheck { get; set; } = true;

    // Security & Integrity triggers
    public bool EnforceSingleScreen { get; set; } = false;
    public bool BlockTabSwitching { get; set; } = false;
    public bool BlockCopyPaste { get; set; } = false;
    public int MaxTabSwitchesAllowed { get; set; } = 3;

    public ICollection<PolicyRule> Rules { get; set; } = new List<PolicyRule>();
    public ICollection<PolicyAssignment> Assignments { get; set; } = new List<PolicyAssignment>();
    public ICollection<InterviewSession> LockedInterviewSessions { get; set; } = new List<InterviewSession>();
}

public class PolicyRule : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid AssessmentPolicyId { get; set; }
    public AssessmentPolicy AssessmentPolicy { get; set; } = null!;

    public string RuleCode { get; set; } = string.Empty; // e.g. "RULE_NO_COPY_PASTE"
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "Warning";
    public ViolationAction DefaultAction { get; set; } = ViolationAction.Warning;
    public string? ConfigurationJson { get; set; }
}

public class PolicyAssignment : BaseAuditableEntity
{
    public Guid AssessmentPolicyId { get; set; }
    public AssessmentPolicy AssessmentPolicy { get; set; } = null!;

    public string TargetType { get; set; } = "Requisition"; // Global, Department, Requisition, RoundType
    public string? TargetId { get; set; } // specific RequisitionId or Department name
    public int Priority { get; set; } = 1;
}

public class CandidatePolicyAcceptance : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid InterviewSessionId { get; set; }
    public InterviewSession InterviewSession { get; set; } = null!;

    public Guid AssessmentPolicyId { get; set; }
    public AssessmentPolicy AssessmentPolicy { get; set; } = null!;

    public int PolicyVersion { get; set; }
    public Guid CandidateId { get; set; }
    public string CandidateEmail { get; set; } = string.Empty;
    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public bool AcceptedCameraPolicy { get; set; } = true;
    public bool AcceptedRecordingPolicy { get; set; } = true;
    public bool AcceptedIntegrityPolicy { get; set; } = true;
}

public class InterviewerPolicyAcceptance : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid InterviewSessionId { get; set; }
    public InterviewSession InterviewSession { get; set; } = null!;

    public Guid AssessmentPolicyId { get; set; }
    public AssessmentPolicy AssessmentPolicy { get; set; } = null!;

    public int PolicyVersion { get; set; }
    public Guid InterviewerUserId { get; set; }
    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public bool AcceptedConfidentialityPolicy { get; set; } = true;
    public bool AcceptedUnbiasedEvaluationPolicy { get; set; } = true;
}

public class TechnicalReadinessCheck : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid InterviewSessionId { get; set; }
    public InterviewSession InterviewSession { get; set; } = null!;

    public string ParticipantType { get; set; } = "Candidate"; // Candidate, Interviewer
    public Guid ParticipantId { get; set; }
    public bool CameraPassed { get; set; }
    public bool MicrophonePassed { get; set; }
    public bool SpeakerPassed { get; set; }
    public bool NetworkPassed { get; set; }
    public decimal? NetworkBandwidthMbps { get; set; }
    public bool ScreenShareSupported { get; set; }
    public bool OverallPassed { get; set; }
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
    public string? DiagnosticDetailsJson { get; set; }
}
