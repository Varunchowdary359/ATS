using System;

namespace PeopleWorks.ATS.Application.DTOs.Candidates;

public record CandidateDto(
    Guid Id,
    string BusinessId,
    string FirstName,
    string LastName,
    string FullName,
    string Email,
    string Phone,
    string Location,
    string CurrentCompany,
    string CurrentTitle,
    decimal TotalExperienceYears,
    string Source,
    string Status
);
