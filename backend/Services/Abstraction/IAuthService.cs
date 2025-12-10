using backend.DTOs.Auth;

namespace backend.Services.Abstraction;
public interface IAuthService
{
    Task<AuthResultDto> LoginWithGoogleAsync(string idToken);
    Task<AuthResultDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResultDto> LoginAsync(LoginRequestDto request);
}

