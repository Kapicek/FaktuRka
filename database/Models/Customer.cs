using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace database.Models;

[Index(nameof(UserId), nameof(Ico), IsUnique = true)]
public class Customer
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string? Ico { get; set; }
    public string? Dic { get; set; }
    public string? LegalForm { get; set; }

    public int? AddressId { get; set; }
    public Address? Address { get; set; }

    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Note { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
