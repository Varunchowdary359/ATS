using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Application.Common.Exceptions;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Application.Common.Models;
using PeopleWorks.ATS.Application.DTOs.Users;

namespace PeopleWorks.ATS.Api.Controllers;

public class UsersController : ApiControllerBase
{
    private readonly IAppDbContext _context;

    public UsersController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<UserDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Users.AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(u => u.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto(
                u.Id,
                u.UserCode,
                u.Name,
                u.Email,
                u.Role.ToString(),
                u.Department,
                u.Designation,
                u.TenantId,
                u.IsActive
            ))
            .ToListAsync(cancellationToken);

        var result = new PagedResult<UserDto>
        {
            Items = items,
            PageNumber = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        return Ok(ApiResponse<PagedResult<UserDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", id);
        }

        var dto = new UserDto(
            user.Id,
            user.UserCode,
            user.Name,
            user.Email,
            user.Role.ToString(),
            user.Department,
            user.Designation,
            user.TenantId,
            user.IsActive
        );

        return Ok(ApiResponse<UserDto>.Ok(dto));
    }
}
