using System;
using System.Text.RegularExpressions;
using PeopleWorks.ATS.Application.Common.Interfaces;

namespace PeopleWorks.ATS.Infrastructure.Services;

public partial class PhoneNormalizer : IPhoneNormalizer
{
    // Regex for cleaning non-digit and non-plus characters
    private static readonly Regex CleanRegex = new(@"[^\d+]", RegexOptions.Compiled);

    public bool TryNormalize(string? rawPhoneNumber, out string normalizedPhoneNumber, out string? errorMessage)
    {
        normalizedPhoneNumber = string.Empty;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(rawPhoneNumber))
        {
            errorMessage = "Phone number cannot be empty.";
            return false;
        }

        // 1. Remove all spaces, dashes, parentheses, dots
        var cleaned = CleanRegex.Replace(rawPhoneNumber.Trim(), "");

        // 2. Handle Indian Phone Formats
        // Case A: 10-digit standard Indian mobile (starts with 6-9) e.g., "9123456789"
        if (cleaned.Length == 10 && Regex.IsMatch(cleaned, @"^[6-9]\d{9}$"))
        {
            normalizedPhoneNumber = "+91" + cleaned;
            return true;
        }

        // Case B: 11-digit starting with 0 e.g., "09123456789"
        if (cleaned.Length == 11 && cleaned.StartsWith("0") && Regex.IsMatch(cleaned.Substring(1), @"^[6-9]\d{9}$"))
        {
            normalizedPhoneNumber = "+91" + cleaned.Substring(1);
            return true;
        }

        // Case C: 12-digit starting with 91 e.g., "919123456789"
        if (cleaned.Length == 12 && cleaned.StartsWith("91") && Regex.IsMatch(cleaned.Substring(2), @"^[6-9]\d{9}$"))
        {
            normalizedPhoneNumber = "+" + cleaned;
            return true;
        }

        // Case D: 13-digit starting with +91 e.g., "+919123456789"
        if (cleaned.Length == 13 && cleaned.StartsWith("+91") && Regex.IsMatch(cleaned.Substring(3), @"^[6-9]\d{9}$"))
        {
            normalizedPhoneNumber = cleaned;
            return true;
        }

        // 3. Handle Generic International E.164 Formats (+ followed by 7 to 15 digits)
        if (cleaned.StartsWith("+") && cleaned.Length >= 8 && cleaned.Length <= 16 && Regex.IsMatch(cleaned, @"^\+\d{7,15}$"))
        {
            normalizedPhoneNumber = cleaned;
            return true;
        }

        errorMessage = "Invalid phone number format. Please provide a valid 10-digit mobile number or standard international format with country code.";
        return false;
    }

    public string MaskPhoneNumber(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber)) return string.Empty;

        var phone = phoneNumber.Trim();
        if (phone.Length <= 4) return "****";

        var lastFour = phone.Substring(phone.Length - 4);
        var prefix = phone.StartsWith("+91") ? "+91 " : (phone.StartsWith("+") ? phone.Substring(0, Math.Min(3, phone.Length - 4)) + " " : "");

        return $"{prefix}******{lastFour}";
    }
}
