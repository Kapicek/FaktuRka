public class UserProfileDto
{
    public int Id { get; set; }
    public string Email { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string? CompanyName { get; set; }
    public string? Ico { get; set; }
    public string? Dic { get; set; }
    public bool VatPayer { get; set; }
    public string? AvatarUrl { get; set; }
}
