using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using PeopleWorks.ATS.Application.Common.Interfaces;

namespace PeopleWorks.ATS.Infrastructure.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var basePath = Directory.GetCurrentDirectory();

        // Dynamically resolve the API directory to read appsettings.json and appsettings.Development.json
        var apiPath = basePath;
        if (!File.Exists(Path.Combine(apiPath, "appsettings.json")))
        {
            var candidate1 = Path.Combine(basePath, "backend", "src", "PeopleWorks.ATS.Api");
            var candidate2 = Path.Combine(basePath, "src", "PeopleWorks.ATS.Api");
            var candidate3 = Path.Combine(basePath, "..", "PeopleWorks.ATS.Api");

            if (File.Exists(Path.Combine(candidate1, "appsettings.json")))
                apiPath = candidate1;
            else if (File.Exists(Path.Combine(candidate2, "appsettings.json")))
                apiPath = candidate2;
            else if (File.Exists(Path.Combine(candidate3, "appsettings.json")))
                apiPath = candidate3;
        }

        var configurationBuilder = new ConfigurationBuilder()
            .SetBasePath(apiPath);

        if (File.Exists(Path.Combine(apiPath, "appsettings.json")))
        {
            configurationBuilder.AddJsonFile("appsettings.json", optional: true, reloadOnChange: false);
        }

        if (File.Exists(Path.Combine(apiPath, $"appsettings.{environment}.json")))
        {
            configurationBuilder.AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: false);
        }

        configurationBuilder.AddEnvironmentVariables();

        var configuration = configurationBuilder.Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection") ??
                               configuration["DATABASE_CONNECTION_STRING"] ??
                               "Host=localhost;Port=5432;Database=peopleworks_ats;Username=postgres;";

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
        });

        var dummyTenantService = new DesignTimeTenantService();
        return new AppDbContext(optionsBuilder.Options, dummyTenantService);
    }

    private class DesignTimeTenantService : ICurrentTenantService
    {
        public Guid TenantId => Guid.Parse("11111111-1111-1111-1111-111111111111");
        public bool HasTenant => true;
        public void SetTenant(Guid tenantId) { }
    }
}
