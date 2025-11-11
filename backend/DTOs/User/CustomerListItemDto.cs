public class CustomerListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Ico { get; set; }
    public string? Email { get; set; }
    public string? City { get; set; }
}