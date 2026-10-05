using System.Threading;
using System.Threading.Tasks;

namespace PeopleWorks.ATS.Application.Common.Interfaces;

public interface ISmsSender
{
    /// <summary>
    /// Sends an OTP via SMS or delivery channel.
    /// </summary>
    Task SendOtpAsync(string normalizedPhoneNumber, string otp, string message, CancellationToken cancellationToken = default);
}

public interface IDevOtpStore
{
    /// <summary>
    /// Development-only method to inspect the last simulated OTP for testing. Disabled in Production.
    /// </summary>
    string? GetLastOtp(string normalizedPhoneNumber);
}
