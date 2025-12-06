using backend.Infrastructure;
using backend.Models.Common;
using backend.Models.Invoice;
using backend.Models.Invoices;
using backend.Services.Abstraction;
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
    [ProducesResponseType(typeof(PagedResult<InvoiceListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList([FromQuery] InvoiceListQuery q)
    {
        var userId = User.GetUserId();
        var result = await _service.GetInvoicesAsync(userId, q);
        return Ok(result);
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
