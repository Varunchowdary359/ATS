namespace PeopleWorks.ATS.Domain.Enums;

public enum AtsRole
{
    Recruiter = 1,
    HiringManager = 2,
    Interviewer = 3,
    HrAdmin = 4,
    AtsAdmin = 5,
    Employee = 6,
    SuperAdmin = 7
}

public enum CandidateStatus
{
    Active = 1,
    Hired = 2,
    Archived = 3,
    Rejected = 4
}

public enum ApplicationStage
{
    Applied = 1,
    Screening = 2,
    Shortlisted = 3,
    Interview = 4,
    Offer = 5,
    Hired = 6
}

public enum ApplicationStatus
{
    Active = 1,
    Rejected = 2,
    Withdrawn = 3,
    OnHold = 4,
    Hired = 5
}

public enum RequisitionPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Urgent = 4
}

public enum RequisitionStatus
{
    Draft = 1,
    PendingApproval = 2,
    Approved = 3,
    Open = 4,
    OnHold = 5,
    Filled = 6,
    Cancelled = 7,
    Rejected = 8
}

public enum ApprovalStatus
{
    Waiting = 1,
    Pending = 2,
    Approved = 3,
    Rejected = 4
}

public enum JobDescriptionStatus
{
    Draft = 1,
    PendingApproval = 2,
    Approved = 3,
    Published = 4,
    Archived = 5
}

public enum InterviewSessionStatus
{
    Scheduled = 1,
    Confirmed = 2,
    InProgress = 3,
    Completed = 4,
    Rescheduled = 5,
    Cancelled = 6,
    NoShow = 7
}

public enum InterviewType
{
    Video = 1,
    Phone = 2,
    InPerson = 3
}

public enum MeetingProvider
{
    None = 0,
    MicrosoftTeams = 1,
    GoogleMeet = 2,
    Zoom = 3,
    CustomLink = 4
}

public enum NoShowParty
{
    None = 0,
    Candidate = 1,
    Interviewer = 2,
    Both = 3
}

public enum FeedbackStatus
{
    NotStarted = 1,
    Pending = 2,
    Submitted = 3,
    Returned = 4,
    Locked = 5
}

public enum ScorecardRecommendation
{
    StrongNo = 1,
    No = 2,
    Neutral = 3,
    Yes = 4,
    StrongYes = 5
}

public enum RoundOutcomeDecision
{
    NotEvaluated = 0,
    Pass = 1,
    Fail = 2,
    Hold = 3,
    Continue = 4
}

public enum FinalSelectionStatus
{
    NotApplicable = 0,
    PendingHmRecommendation = 1,
    RecommendedByHm = 2,
    HrApprovedReadyForOffer = 3,
    OnHold = 4,
    Rejected = 5
}

public enum PolicyType
{
    Interview = 1,
    TechnicalInterview = 2,
    Assessment = 3,
    Test = 4,
    Exam = 5,
    ProctoredAssessment = 6
}

public enum ViolationType
{
    CameraUnavailable = 1,
    CameraStopped = 2,
    MicrophoneUnavailable = 3,
    ScreenShareStopped = 4,
    FullscreenExited = 5,
    TabSwitch = 6,
    WindowBlur = 7,
    CopyAttempt = 8,
    PasteAttempt = 9,
    RightClickAttempt = 10,
    TimeExpired = 11,
    TechnicalInterruption = 12
}

public enum ViolationAction
{
    Warning = 1,
    AllowContinuation = 2,
    Pause = 3,
    RecheckReadiness = 4,
    RequireAcknowledgement = 5,
    End = 6,
    AutoSubmit = 7
}
