public interface IAuthService
{
    Task<AuthResultDto> LoginWithGoogleAsync(string idToken);
}
