using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace database.Models;

[Index(nameof(UserId), nameof(Name), IsUnique = true)]
public class InvoiceSequence
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = default!;

    public string Name { get; set; } = "default";
    public string? Prefix { get; set; }
    public int NextNumber { get; set; } = 1;
    public string? ResetRule { get; set; }
    public bool IsDefault { get; set; } = true;
}
