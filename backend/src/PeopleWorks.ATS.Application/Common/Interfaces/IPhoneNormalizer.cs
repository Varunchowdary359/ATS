namespace PeopleWorks.ATS.Application.Common.Interfaces;

public interface IPhoneNormalizer
{
    /// <summary>
    /// Normalizes input phone string to canonical E.164-compatible format (e.g., +919123456789).
    /// </summary>
    bool TryNormalize(string? rawPhoneNumber, out string normalizedPhoneNumber, out string? errorMessage);

    /// <summary>
    /// Masks a phone number for safe external display (e.g., "+91 ******6789").
    /// </summary>
    string MaskPhoneNumber(string? phoneNumber);
}
