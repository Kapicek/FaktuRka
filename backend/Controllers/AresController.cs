using backend.DTOs.Ares;
using backend.Services;
using backend.Services.Abstraction;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    public async Task<IActionResult> GetByIco(string ico)
    {
        if (string.IsNullOrWhiteSpace(ico))
            return BadRequest(new { message = "ICO is required." });

        ico = ico.Trim();

        if (ico.Length != 8 || !ico.All(char.IsDigit))
            return BadRequest(new { message = "ICO must be 8 digits." });

        var subject = await _service.GetByIcoAsync(ico);

        if (subject == null)
            return NotFound();

        return Ok(subject);
    }
}
