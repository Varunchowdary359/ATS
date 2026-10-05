using System;
using System.Text.Json.Serialization;

namespace PeopleWorks.ATS.Application.DTOs.Auth;

public class OtpRequestDto
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string? TenantCode { get; set; }
}

public class OtpRequestResponseDto
{
    public string ChallengeId { get; set; } = string.Empty;
    public string Message { get; set; } = "If the phone number is registered, an OTP has been sent.";
    public int ExpiresInSeconds { get; set; } = 300;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DevOtp { get; set; } // Populated ONLY in Development when explicitly enabled
}

public class OtpVerifyDto
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string ChallengeId { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
    public string? TenantCode { get; set; }
}

public class RefreshTokenDto
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresInSeconds { get; set; }
    public UserProfileDto User { get; set; } = null!;
}

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string UserCode { get; set; } = string.Empty;
    public string? EmpId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? MaskedPhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public string? Avatar { get; set; }
    public string? AvatarBg { get; set; }
    public Guid TenantId { get; set; }
    public string? TenantName { get; set; }
    public string Status { get; set; } = "Active";
}
