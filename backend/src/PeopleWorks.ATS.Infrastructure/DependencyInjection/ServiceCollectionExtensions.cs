using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Infrastructure.Data;
using PeopleWorks.ATS.Infrastructure.Data.Seed;
using PeopleWorks.ATS.Infrastructure.Identity;
using PeopleWorks.ATS.Infrastructure.Services;

namespace PeopleWorks.ATS.Infrastructure.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") ??
                               configuration["DATABASE_CONNECTION_STRING"] ??
                               "Host=localhost;Port=5432;Database=peopleworks_ats;Username=postgres;Password=postgres;";

        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorCodesToAdd: null);
            });
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<ICurrentTenantService, CurrentTenantService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IDateTimeProvider, DateTimeProvider>();
        services.AddScoped<IDatabaseInitializer, DatabaseInitializer>();

        // Authentication & Session Services
        services.AddSingleton<IPhoneNormalizer, PhoneNormalizer>();
        services.AddSingleton<IAuthRateLimiter, AuthRateLimiter>();
        services.AddSingleton<DevelopmentSmsSender>();
        services.AddSingleton<ISmsSender>(sp => sp.GetRequiredService<DevelopmentSmsSender>());
        services.AddSingleton<IDevOtpStore>(sp => sp.GetRequiredService<DevelopmentSmsSender>());
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ISessionService, SessionService>();

        return services;
    }
}
