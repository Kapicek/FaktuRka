using backend.DTOs.Auth;
using backend.Services.Abstraction;
using Microsoft.AspNetCore.Authorization;
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

    [HttpPost("register")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPost("login")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword(
    [FromBody] ForgotPasswordRequestDto request)
    {
        await _authService.ForgotPasswordAsync(request.Email);

        return Ok(new
        {
            message = "If the account exists, a new password has been sent to the email address."
        });
    }
}
