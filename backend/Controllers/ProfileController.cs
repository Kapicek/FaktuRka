using backend.Services.Abstraction;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IUserService _userService;

        public ProfileController(IUserService userService)
        {
            _userService = userService;
        }

        // GET api/profile/me  -> profil aktuálně přihlášeného uživatele
        [HttpGet("me")]
        [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetUserIdFromToken();

            var profile = await _userService.GetProfileAsync(userId);
            if (profile == null)
                return NotFound();

            return Ok(profile);
        }

        [HttpGet("{userId:int}")]
        [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetById(int userId)
        {
            // tady by ideálně měl být check na roli admina
            // např. [Authorize(Roles = "Admin")] nebo manuální kontrola claimu:

            if (!User.IsInRole("Admin"))
                return Forbid();

            var profile = await _userService.GetProfileAsync(userId);
            if (profile == null)
                return NotFound();

            return Ok(profile);
        }

        [HttpPut]
        [Consumes("application/json")]
        [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> Update([FromBody] UserProfileDto dto)
        {
            var userId = GetUserIdFromToken();

            if (dto.Id != 0 && dto.Id != userId)
                return Forbid();

            var updated = await _userService.UpdateProfileAsync(userId, dto);
            return Ok(updated);
        }

        private int GetUserIdFromToken()
        {
            var claim =
                User.FindFirst(ClaimTypes.NameIdentifier) ??
                User.FindFirst(JwtRegisteredClaimNames.Sub) ??
                User.FindFirst("sub");

            if (claim == null)
                throw new InvalidOperationException("User id claim not found in token claims.");

            if (!int.TryParse(claim.Value, out var userId))
                throw new InvalidOperationException("User id claim is not a valid integer.");

            return userId;
        }
    }
}
