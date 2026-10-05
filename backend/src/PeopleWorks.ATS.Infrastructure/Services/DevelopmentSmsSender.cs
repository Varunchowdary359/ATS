using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PeopleWorks.ATS.Application.Common.Interfaces;

namespace PeopleWorks.ATS.Infrastructure.Services;

public class DevelopmentSmsSender : ISmsSender, IDevOtpStore
{
    private readonly IHostEnvironment _environment;
    private readonly ILogger<DevelopmentSmsSender> _logger;
    private readonly IPhoneNormalizer _phoneNormalizer;

    // Thread-safe in-memory store for development testing (Phone -> Last OTP)
    private static readonly ConcurrentDictionary<string, string> DevOtpStore = new();

    public DevelopmentSmsSender(
        IHostEnvironment environment,
        ILogger<DevelopmentSmsSender> logger,
        IPhoneNormalizer phoneNormalizer)
    {
        _environment = environment;
        _logger = logger;
        _phoneNormalizer = phoneNormalizer;
    }

    public Task SendOtpAsync(string normalizedPhoneNumber, string otp, string message, CancellationToken cancellationToken = default)
    {
        var masked = _phoneNormalizer.MaskPhoneNumber(normalizedPhoneNumber);

        if (_environment.IsDevelopment() || _environment.IsEnvironment("Local") || _environment.IsEnvironment("Testing"))
        {
            DevOtpStore[normalizedPhoneNumber] = otp;
            _logger.LogInformation("[DEV SMS SIMULATOR] Dispatched OTP for recipient: {MaskedPhone}", masked);
        }
        else
        {
            _logger.LogInformation("[PRODUCTION SMS] Dispatched OTP notification to provider for: {MaskedPhone}", masked);
        }

        return Task.CompletedTask;
    }

    public string? GetLastOtp(string normalizedPhoneNumber)
    {
        if (!_environment.IsDevelopment() && !_environment.IsEnvironment("Local") && !_environment.IsEnvironment("Testing"))
        {
            return null; // Strictly disabled in Production
        }

        return DevOtpStore.TryGetValue(normalizedPhoneNumber, out var otp) ? otp : null;
    }
}
