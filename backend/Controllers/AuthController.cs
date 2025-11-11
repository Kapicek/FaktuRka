using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    public class GoogleLoginRequest
    {
        public string IdToken { get; set; } = default!;
    }

    [HttpPost("google")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Google([FromBody] GoogleLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
            return BadRequest("Missing idToken.");

        var result = await _authService.LoginWithGoogleAsync(request.IdToken);
        return Ok(result);
    }
}
