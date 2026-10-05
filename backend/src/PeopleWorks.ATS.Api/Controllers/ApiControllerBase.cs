using Microsoft.AspNetCore.Mvc;

namespace PeopleWorks.ATS.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
}
