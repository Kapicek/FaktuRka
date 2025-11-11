using backend.Infrastructure;
using backend.Models.Invoices;
using backend.Services;
using database.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _service;

    public InvoicesController(IInvoiceService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<InvoiceListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList(
        [FromQuery] int? customerId,
        [FromQuery] InvoiceStatus? status,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to)
    {
        var userId = User.GetUserId();
        var data = await _service.GetInvoicesAsync(userId, customerId, status, from, to);
        return Ok(data);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(InvoiceDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(int id)
    {
        var userId = User.GetUserId();
        var invoice = await _service.GetInvoiceAsync(userId, id);
        if (invoice == null) return NotFound();
        return Ok(invoice);
    }

    [HttpPost]
    [ProducesResponseType(typeof(InvoiceDetailDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] InvoiceCreateRequest request)
    {
        var userId = User.GetUserId();

        try
        {
            var created = await _service.CreateInvoiceAsync(userId, request);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
