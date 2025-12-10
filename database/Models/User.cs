using database.Models;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

[Index(nameof(GoogleId), IsUnique = true)]
[Index(nameof(Email), IsUnique = true)]
public class User
{
    [Key]
    public int Id { get; set; }

    [MaxLength(320)]
    public string Email { get; set; } = default!;

    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? CompanyName { get; set; }
    public string? Ico { get; set; }
    public string? Dic { get; set; }
    public bool VatPayer { get; set; }

    public string? GoogleId { get; set; }

    // "Local" = email/heslo, "Google" = Google login -> todo tohle by šlo a chtělo by přehodit na enum
    public string AuthProvider { get; set; } = "Local";

    public string? AvatarUrl { get; set; }

    // Local login
    public string? PasswordHash { get; set; }
    public string? PasswordSalt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<InvoiceSequence> InvoiceSequences { get; set; } = new List<InvoiceSequence>();
}
