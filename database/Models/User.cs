using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace database.Models;

[Index(nameof(Email), IsUnique = true)]
public class User
{
    [Key]
    public int Id { get; set; }
    [MaxLength(320)] public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? CompanyName { get; set; }
    public string? Ico { get; set; }
    public string? Dic { get; set; }
    public bool VatPayer { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<InvoiceSequence> InvoiceSequences { get; set; } = new List<InvoiceSequence>();
}
