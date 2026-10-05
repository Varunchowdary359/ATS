using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PeopleWorks.ATS.Application.Common.Interfaces;

namespace PeopleWorks.ATS.Api.Middleware;

public class SessionValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SessionValidationMiddleware> _logger;

    public SessionValidationMiddleware(RequestDelegate next, ILogger<SessionValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only validate if user is authenticated via JWT Bearer
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var sessionClaim = context.User.FindFirst("session_id")?.Value;
            if (Guid.TryParse(sessionClaim, out var sessionId))
            {
                var sessionService = context.RequestServices.GetRequiredService<ISessionService>();
                var isValid = await sessionService.ValidateAndTouchSessionAsync(sessionId, context.RequestAborted);

                if (!isValid)
                {
                    _logger.LogWarning("[SESSION] Terminating request due to revoked, timed out, or invalid session ID: {SessionId}", sessionId);

                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/problem+json";

                    await context.Response.WriteAsJsonAsync(new
                    {
                        type = "https://tools.ietf.org/html/rfc7235#section-3.1",
                        title = "Unauthorized",
                        status = 401,
                        detail = "Session has expired or was revoked. Please authenticate again with OTP.",
                        instance = context.Request.Path.Value
                    });

                    return;
                }
            }
        }

        await _next(context);
    }
}
