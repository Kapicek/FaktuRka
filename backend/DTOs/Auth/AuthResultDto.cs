public class AuthResultDto
{
    public string Token { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = default!;
    public string FullName { get; set; } = default!;
}
