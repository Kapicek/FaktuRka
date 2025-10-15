using System.ComponentModel.DataAnnotations;

namespace database.Models;

public class Address
{
    [Key]
    public int Id { get; set; }
    public string AddressLine1 { get; set; } = default!;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = default!;
    public string? Zip { get; set; }
    [MaxLength(2)] public string CountryCode { get; set; } = "CZ";
    public string? NormalizedKey { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
}
