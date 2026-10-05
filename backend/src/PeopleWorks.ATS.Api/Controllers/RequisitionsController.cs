using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Application.Common.Exceptions;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Application.Common.Models;
using PeopleWorks.ATS.Domain.Entities.Requisitions;

namespace PeopleWorks.ATS.Api.Controllers;

public class RequisitionsController : ApiControllerBase
{
    private readonly IAppDbContext _context;

    public RequisitionsController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? department,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Requisitions
            .Include(r => r.HiringManager)
            .Include(r => r.LeadRecruiter)
            .Include(r => r.ApprovalSteps)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<Domain.Enums.RequisitionStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(r => r.Status == parsedStatus);
        }

        if (!string.IsNullOrEmpty(department))
        {
            query = query.Where(r => r.Department == department);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.RequisitionCode,
                r.ReqNumber,
                r.Title,
                r.Department,
                r.Location,
                r.JobType,
                r.Openings,
                r.HiredCount,
                r.Priority,
                r.Status,
                r.BudgetMin,
                r.BudgetMax,
                r.Currency,
                r.TargetStartDate,
                HiringManager = new { r.HiringManager.Id, r.HiringManager.Name, r.HiringManager.Email },
                LeadRecruiter = new { r.LeadRecruiter.Id, r.LeadRecruiter.Name, r.LeadRecruiter.Email },
                ApprovalStepsCount = r.ApprovalSteps.Count,
                r.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var paged = new PagedResult<object>
        {
            Items = items,
            PageNumber = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        return Ok(ApiResponse<PagedResult<object>>.Ok(paged));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var req = await _context.Requisitions
            .Include(r => r.HiringManager)
            .Include(r => r.LeadRecruiter)
            .Include(r => r.ApprovalSteps)
            .Include(r => r.ApprovalAudits)
            .Include(r => r.JobDescription)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (req == null)
        {
            throw new NotFoundException(nameof(Requisition), id);
        }

        return Ok(ApiResponse<object>.Ok(req));
    }
}
