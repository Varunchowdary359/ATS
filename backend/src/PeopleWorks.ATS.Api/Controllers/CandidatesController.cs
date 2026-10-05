using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Application.Common.Exceptions;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Application.Common.Models;
using PeopleWorks.ATS.Domain.Entities.Candidates;

namespace PeopleWorks.ATS.Api.Controllers;

public class CandidatesController : ApiControllerBase
{
    private readonly IAppDbContext _context;

    public CandidatesController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Candidates
            .Include(c => c.Skills)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(c => c.FirstName.ToLower().Contains(s) ||
                                     c.LastName.ToLower().Contains(s) ||
                                     c.Email.ToLower().Contains(s) ||
                                     c.BusinessId.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new
            {
                c.Id,
                c.BusinessId,
                c.FirstName,
                c.LastName,
                FullName = c.FirstName + " " + c.LastName,
                c.Email,
                c.Phone,
                c.Location,
                c.CurrentCompany,
                c.CurrentTitle,
                c.TotalExperienceYears,
                c.Source,
                c.Status,
                Skills = c.Skills.Select(s => new { s.SkillName, s.ProficiencyLevel, s.YearsExperience, s.IsPrimary }),
                c.CreatedAt
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
        var candidate = await _context.Candidates
            .Include(c => c.Skills)
            .Include(c => c.Experiences)
            .Include(c => c.Educations)
            .Include(c => c.Documents)
            .Include(c => c.Notes)
            .Include(c => c.Applications)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (candidate == null)
        {
            throw new NotFoundException(nameof(Candidate), id);
        }

        return Ok(ApiResponse<object>.Ok(candidate));
    }
}
