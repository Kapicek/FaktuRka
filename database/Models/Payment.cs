using database.Models.Enums;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace database.Models;

[Index(nameof(InvoiceId), nameof(ReceivedAt))]
public class Payment
{
    [Key]
    public int Id { get; set; }

    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = default!;
    public DateTimeOffset ReceivedAt { get; set; }
    public bool Received { get; set; }

    [Precision(14, 2)]
    public decimal Amount { get; set; }

    public PaymentMethod Method { get; set; } = PaymentMethod.BankTransfer;
    public string? Note { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
