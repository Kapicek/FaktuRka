using backend.DTOs.Ares;
using backend.Services.Abstraction;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AresController : ControllerBase
{
    private readonly IAresService _service;

    public AresController(IAresService service)
    {
        _service = service;
    }

    [HttpGet("{ico}")]
    [ProducesResponseType(typeof(AresSubjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIco(string ico, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(ico))
            return BadRequest(new { message = "ICO is required." });

        ico = ico.Trim();

        if (ico.Length != 8 || !ico.All(char.IsDigit))
            return BadRequest(new { message = "ICO must be 8 digits." });

        var subject = await _service.GetByIcoAsync(ico, cancellationToken);

        if (subject == null)
            return NotFound();

        return Ok(subject);
    }

    [HttpGet("search")]
    [ProducesResponseType(typeof(List<AresSearchItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] string query,
        CancellationToken cancellationToken,
        [FromQuery] int limit)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest(new { message = "Query is required." });

        var results = await _service.SearchByNameAsync(query.Trim(), limit, cancellationToken);
        return Ok(results);
    }
}
