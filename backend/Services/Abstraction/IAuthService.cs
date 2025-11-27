namespace backend.Services.Abstraction;
public interface IAuthService
{
    Task<AuthResultDto> LoginWithGoogleAsync(string idToken);
}
