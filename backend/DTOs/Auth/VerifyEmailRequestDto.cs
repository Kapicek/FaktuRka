namespace backend.DTOs.Auth;

public sealed class VerifyEmailRequestDto
{
    public string Email { get; set; } = default!;
    public string Code { get; set; } = default!;
}
