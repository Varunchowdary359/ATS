using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Application.Common.Exceptions;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Application.Common.Models;
using AtsApplication = PeopleWorks.ATS.Domain.Entities.Applications.Application;

namespace PeopleWorks.ATS.Api.Controllers;

public class ApplicationsController : ApiControllerBase
{
    private readonly IAppDbContext _context;

    public ApplicationsController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] Guid? requisitionId,
        [FromQuery] Guid? candidateId,
        [FromQuery] string? stage,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Applications
            .Include(a => a.Candidate)
            .Include(a => a.Requisition)
            .AsNoTracking();

        if (requisitionId.HasValue)
        {
            query = query.Where(a => a.RequisitionId == requisitionId.Value);
        }

        if (candidateId.HasValue)
        {
            query = query.Where(a => a.CandidateId == candidateId.Value);
        }

        if (!string.IsNullOrEmpty(stage) && Enum.TryParse<Domain.Enums.ApplicationStage>(stage, true, out var parsedStage))
        {
            query = query.Where(a => a.Stage == parsedStage);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.AppliedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.BusinessId,
                Candidate = new
                {
                    a.Candidate.Id,
                    a.Candidate.BusinessId,
                    FullName = a.Candidate.FirstName + " " + a.Candidate.LastName,
                    a.Candidate.Email,
                    a.Candidate.CurrentTitle
                },
                Requisition = new
                {
                    a.Requisition.Id,
                    a.Requisition.RequisitionCode,
                    a.Requisition.Title,
                    a.Requisition.Department
                },
                a.Stage,
                a.Status,
                a.AppliedDate,
                a.Source
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
        var app = await _context.Applications
            .Include(a => a.Candidate)
            .Include(a => a.Requisition)
            .Include(a => a.TimelineEvents)
            .Include(a => a.ScreeningEvaluations)
            .Include(a => a.InterviewSessions)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (app == null)
        {
            throw new NotFoundException("Application", id);
        }

        return Ok(ApiResponse<object>.Ok(app));
    }
}
