using backend.Infrastructure;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _service;

    public CustomersController(ICustomerService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<CustomerListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList([FromQuery] string? search)
    {
        var userId = User.GetUserId();
        var customers = await _service.GetCustomersAsync(userId, search);
        return Ok(customers);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(int id)
    {
        var userId = User.GetUserId();
        var customer = await _service.GetCustomerAsync(userId, id);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpPost]
    [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CustomerCreateRequest request)
    {
        var userId = User.GetUserId();

        try
        {
            var created = await _service.CreateCustomerAsync(userId, request);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] CustomerUpdateRequest request)
    {
        var userId = User.GetUserId();

        try
        {
            var updated = await _service.UpdateCustomerAsync(userId, id, request);
            if (updated == null) return NotFound();
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var ok = await _service.DeleteCustomerAsync(userId, id);
        if (!ok) return NotFound();
        return NoContent();
    }
}
