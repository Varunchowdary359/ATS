using System;

namespace PeopleWorks.ATS.Application.DTOs.Applications;

public record ApplicationDto(
    Guid Id,
    string BusinessId,
    Guid CandidateId,
    Guid RequisitionId,
    string Stage,
    string Status,
    DateTime AppliedDate,
    string Source
);
