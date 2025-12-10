using backend.DTOs.User;
using backend.Services.Abstraction;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")] // jen admin může měnit role
public class AdminUsersController : ControllerBase
{
    private readonly IUserAdminService _userAdminService;

    public AdminUsersController(IUserAdminService userAdminService)
    {
        _userAdminService = userAdminService;
    }

    // vrátí všechny role v systému – pro dropdown na FE
    [HttpGet("roles")]
    [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _userAdminService.GetAllRoleNamesAsync();
        return Ok(roles);
    }

    // nastaví role konkrétnímu userovi
    [HttpPut("{userId:int}/roles")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateUserRoles(int userId, [FromBody] UpdateUserRolesDto request)
    {
        if (request.Roles == null)
            return BadRequest("Roles are required.");

        var result = await _userAdminService.UpdateUserRolesAsync(userId, request.Roles);
        return Ok(result);
    }
}
