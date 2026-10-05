using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using PeopleWorks.ATS.Api.Middleware;
using PeopleWorks.ATS.Api.Swagger;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Infrastructure.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Controllers & API Explorer
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();

// 2. Centralized Exception Handling & RFC 7807 ProblemDetails
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// 3. Infrastructure & PostgreSQL EF Core Context
builder.Services.AddInfrastructure(builder.Configuration);

// 4. JWT Bearer Authentication & Authorization
var jwtKey = builder.Configuration["Jwt:Key"] ??
             builder.Configuration["JWT_SECRET_KEY"] ??
             "PEOPLEWORKS_ATS_SUPER_SECRET_JWT_SIGNING_KEY_MINIMUM_32_BYTES_FOR_HS256_LOCAL_DEV";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PeopleWorks.ATS";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PeopleWorks.ATS.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Allow local HTTP development
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});

builder.Services.AddAuthorization();

// 5. OpenAPI / Swagger Setup
builder.Services.AddAtsSwagger();

// 6. CORS Configuration for React Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return uri.Host == "localhost" || uri.Host == "127.0.0.1" || uri.Host == "ats-ui.vercel.app";
                }
                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// 7. Exception Handler & Request Logging Middleware
app.UseExceptionHandler();
app.UseMiddleware<RequestLoggingMiddleware>();

// 8. Swagger API Documentation (Development and Local environments)
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Local"))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PeopleWorks ATS API v1");
        c.RoutePrefix = "swagger";
    });
}

// 9. CORS & Routing Pipeline
app.UseCors("AllowFrontend");
app.UseRouting();

// 10. Authentication & Session Validation Pipeline (Strict order)
app.UseAuthentication();
app.UseMiddleware<SessionValidationMiddleware>();
app.UseAuthorization();

app.MapControllers();

// 11. Run Migrations & Seed Data in Development Mode
if (app.Environment.IsDevelopment())
{
    try
    {
        using var scope = app.Services.CreateScope();
        var initializer = scope.ServiceProvider.GetRequiredService<IDatabaseInitializer>();
        await initializer.InitializeAsync();
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<Microsoft.Extensions.Logging.ILogger<Program>>();
        logger.LogWarning(ex, "Note: Could not run automatic migration on startup (Database might not be running locally yet).");
    }
}

app.Run();

// For Integration Test WebApplicationFactory support
public partial class Program { }
