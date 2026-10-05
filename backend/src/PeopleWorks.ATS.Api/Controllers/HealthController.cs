using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Application.Common.Models;

namespace PeopleWorks.ATS.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Produces("application/json")]
public class HealthController : ControllerBase
{
    private readonly IAppDbContext _context;

    public HealthController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet("/health")]
    public IActionResult GetLiveness()
    {
        return Ok(new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            service = "PeopleWorks.ATS.Api",
            version = "1.0.0"
        });
    }

    [HttpGet("/health/ready")]
    public async Task<IActionResult> GetReadiness(CancellationToken cancellationToken)
    {
        try
        {
            var canConnect = await _context.Tenants.AnyAsync(cancellationToken);
            return Ok(new
            {
                status = "Ready",
                database = "Connected (PostgreSQL)",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                status = "Unhealthy",
                database = "Unavailable",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}
