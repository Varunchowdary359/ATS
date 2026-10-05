using System;
using System.Collections.Generic;
using PeopleWorks.ATS.Domain.Common;
using PeopleWorks.ATS.Domain.Enums;
using PeopleWorks.ATS.Domain.Entities.Applications;

namespace PeopleWorks.ATS.Domain.Entities.Candidates;

public class Candidate : BaseAuditableEntity
{
    public string BusinessId { get; set; } = string.Empty; // e.g. "CAND-101"

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string CurrentCompany { get; set; } = string.Empty;
    public string CurrentTitle { get; set; } = string.Empty;
    public decimal TotalExperienceYears { get; set; }
    public string Source { get; set; } = string.Empty; // Referral, LinkedIn, Careers, Agency
    public CandidateStatus Status { get; set; } = CandidateStatus.Active;

    public string? LinkedInUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? PortfolioUrl { get; set; }

    public ICollection<CandidateSkill> Skills { get; set; } = new List<CandidateSkill>();
    public ICollection<CandidateExperience> Experiences { get; set; } = new List<CandidateExperience>();
    public ICollection<CandidateEducation> Educations { get; set; } = new List<CandidateEducation>();
    public ICollection<CandidateDocument> Documents { get; set; } = new List<CandidateDocument>();
    public ICollection<CandidateNote> Notes { get; set; } = new List<CandidateNote>();
    public ICollection<CandidateCommunication> Communications { get; set; } = new List<CandidateCommunication>();
    public ICollection<Application> Applications { get; set; } = new List<Application>();
}

public class CandidateSkill : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;

    public string SkillName { get; set; } = string.Empty;
    public decimal YearsExperience { get; set; }
    public string ProficiencyLevel { get; set; } = "Intermediate"; // Beginner, Intermediate, Expert
    public bool IsPrimary { get; set; } = true;
}

public class CandidateExperience : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;

    public string CompanyName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class CandidateEducation : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;

    public string Institution { get; set; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string FieldOfStudy { get; set; } = string.Empty;
    public int? GraduationYear { get; set; }
    public string? GradeOrGpa { get; set; }
}

public class CandidateDocument : BaseAuditableEntity
{
    public Guid CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;

    public string DocumentType { get; set; } = "Resume"; // Resume, CoverLetter, Certificate, IDProof, Portfolio
    public string FileName { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePathOrUri { get; set; } = string.Empty;
    public bool IsParsed { get; set; }
    public string? ParsedContentJson { get; set; }
}

public class CandidateNote : BaseAuditableEntity
{
    public Guid CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;

    public string NoteText { get; set; } = string.Empty;
    public string Category { get; set; } = "General"; // General, Sourcing, Screening, Interview
    public bool IsPrivate { get; set; } = false;
}

public class CandidateCommunication : BaseAuditableEntity
{
    public Guid CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;

    public string Channel { get; set; } = "Email"; // Email, SMS, WhatsApp
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string DeliveryStatus { get; set; } = "Sent"; // Queued, Sent, Delivered, Failed
}
