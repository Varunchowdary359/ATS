using System;

namespace PeopleWorks.ATS.Application.DTOs.Policies;

public record AssessmentPolicyDto(
    Guid Id,
    string BusinessId,
    string Name,
    string Description,
    string PolicyType,
    int Version,
    bool IsActiveVersion,
    string Status,
    bool RequiresCamera,
    bool RequiresMicrophone,
    bool RequiresScreenShare
);
