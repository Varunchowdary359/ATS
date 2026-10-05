using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Application.Common.Exceptions;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Application.Common.Models;
using PeopleWorks.ATS.Domain.Entities.Interviews;

namespace PeopleWorks.ATS.Api.Controllers;

public class InterviewsController : ApiControllerBase
{
    private readonly IAppDbContext _context;

    public InterviewsController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] Guid? requisitionId,
        [FromQuery] Guid? candidateId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _context.InterviewSessions
            .Include(s => s.Application)
            .Include(s => s.Candidate)
            .Include(s => s.Requisition)
            .Include(s => s.Panelists)
            .Include(s => s.Policy)
            .AsNoTracking();

        if (requisitionId.HasValue)
        {
            query = query.Where(s => s.RequisitionId == requisitionId.Value);
        }

        if (candidateId.HasValue)
        {
            query = query.Where(s => s.CandidateId == candidateId.Value);
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<Domain.Enums.InterviewSessionStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(s => s.Status == parsedStatus);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(s => s.ScheduledStartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                s.Id,
                s.BusinessId,
                s.RoundName,
                s.Type,
                s.Status,
                s.ScheduledStartTime,
                s.ScheduledEndTime,
                s.MeetingProvider,
                s.MeetingLink,
                Candidate = new { s.Candidate.Id, s.Candidate.BusinessId, FullName = s.Candidate.FirstName + " " + s.Candidate.LastName, s.Candidate.Email },
                Requisition = new { s.Requisition.Id, s.Requisition.RequisitionCode, s.Requisition.Title },
                Panelists = s.Panelists.Select(p => new { p.Id, p.Name, p.Email, p.Role, p.IsLead }),
                Policy = s.Policy != null ? new { s.Policy.Id, s.Policy.BusinessId, s.Policy.Name, Version = s.LockedPolicyVersion } : null
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
        var session = await _context.InterviewSessions
            .Include(s => s.Application)
            .Include(s => s.Candidate)
            .Include(s => s.Requisition)
            .Include(s => s.Panelists)
            .Include(s => s.Scorecards)
                .ThenInclude(sc => sc.CriteriaRatings)
            .Include(s => s.Violations)
            .Include(s => s.CandidatePolicyAcceptances)
            .Include(s => s.InterviewerPolicyAcceptances)
            .Include(s => s.ReadinessChecks)
            .Include(s => s.Policy)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException(nameof(InterviewSession), id);
        }

        return Ok(ApiResponse<object>.Ok(session));
    }
}
