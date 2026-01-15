using backend.DTOs.Auth;

namespace backend.Services.Abstraction;
public interface IAuthService
{
    Task<AuthResultDto> LoginWithGoogleAsync(string idToken);
    Task<RegisterResultDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResultDto> VerifyEmailAsync(string email, string code);
    Task<AuthResultDto> LoginAsync(LoginRequestDto request);
    Task ForgotPasswordAsync(string email);
    Task ResendVerificationAsync(string email);
}