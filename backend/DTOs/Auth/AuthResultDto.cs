public class AuthResultDto
{
    public string Token { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }

    public UserProfileDto Profile { get; set; } = default!;
}