using System;

namespace PeopleWorks.ATS.Application.DTOs.Requisitions;

public record RequisitionDto(
    Guid Id,
    string RequisitionCode,
    string ReqNumber,
    string Title,
    string Department,
    string Location,
    string JobType,
    int Openings,
    int HiredCount,
    string Priority,
    string Status,
    decimal? BudgetMin,
    decimal? BudgetMax,
    string Currency,
    DateTime? TargetStartDate
);
