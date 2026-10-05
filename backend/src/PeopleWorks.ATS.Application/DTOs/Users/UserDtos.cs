using System;

namespace PeopleWorks.ATS.Application.DTOs.Users;

public record UserDto(
    Guid Id,
    string UserCode,
    string Name,
    string Email,
    string Role,
    string Department,
    string? Designation,
    Guid TenantId,
    bool IsActive
);
