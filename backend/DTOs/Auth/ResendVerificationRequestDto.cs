namespace backend.DTOs.Auth;

public sealed class ResendVerificationRequestDto
{
    public string Email { get; set; } = default!;
}
