using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Application.Common.Exceptions;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Application.Common.Models;
using PeopleWorks.ATS.Domain.Entities.Policies;

namespace PeopleWorks.ATS.Api.Controllers;

public class PoliciesController : ApiControllerBase
{
    private readonly IAppDbContext _context;

    public PoliciesController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(CancellationToken cancellationToken)
    {
        var policies = await _context.AssessmentPolicies
            .Include(p => p.Rules)
            .AsNoTracking()
            .OrderBy(p => p.BusinessId)
            .Select(p => new
            {
                p.Id,
                p.BusinessId,
                p.Name,
                p.Description,
                p.PolicyType,
                p.Version,
                p.IsActiveVersion,
                p.PolicyStatus,
                p.RequiresCamera,
                p.RequiresMicrophone,
                p.RequiresScreenShare,
                p.RequiresCandidateAcceptance,
                p.RequiresInterviewerAcceptance,
                p.RequiresReadinessCheck,
                p.EnforceSingleScreen,
                p.BlockTabSwitching,
                p.BlockCopyPaste,
                p.MaxTabSwitchesAllowed,
                RulesCount = p.Rules.Count
            })
            .ToListAsync(cancellationToken);

        return Ok(ApiResponse<object>.Ok(policies));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var policy = await _context.AssessmentPolicies
            .Include(p => p.Rules)
            .Include(p => p.Assignments)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (policy == null)
        {
            throw new NotFoundException(nameof(AssessmentPolicy), id);
        }

        return Ok(ApiResponse<object>.Ok(policy));
    }
}
