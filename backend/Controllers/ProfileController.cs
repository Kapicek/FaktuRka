using backend.Infrastructure;
using backend.Services.Abstraction;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
            var userId = User.GetUserId();

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
            var userId = User.GetUserId();

            if (dto.Id != 0 && dto.Id != userId)
                return Forbid();

            var updated = await _userService.UpdateProfileAsync(userId, dto);
            return Ok(updated);
        }
    }
}
