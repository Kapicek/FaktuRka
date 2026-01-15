namespace backend.DTOs.Auth
{
    public sealed class RegisterResultDto
    {
        public string Message { get; set; } = default!;
        public string Email { get; set; } = default!;
        public DateTimeOffset CodeExpiresAt { get; set; }
    }

}
