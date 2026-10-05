using System;

namespace PeopleWorks.ATS.Application.DTOs.Interviews;

public record InterviewSessionDto(
    Guid Id,
    string BusinessId,
    string RoundName,
    string Type,
    string Status,
    DateTime ScheduledStartTime,
    DateTime ScheduledEndTime,
    string MeetingProvider,
    string? MeetingLink
);
