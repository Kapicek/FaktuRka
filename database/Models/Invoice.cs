using database.Models.Enums;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace database.Models;

[Index(nameof(UserId), nameof(NumberFull), IsUnique = true)]
[Index(nameof(UserId), nameof(CustomerId), nameof(Status), nameof(IssueDate))]
public class Invoice
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = default!;

    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = default!;

    public int? SequenceId { get; set; }
    public InvoiceSequence? Sequence { get; set; }

    public string NumberFull { get; set; } = default!;
    public string? VariableSymbol { get; set; }

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

    public DateOnly IssueDate { get; set; }
    public DateOnly DueDate { get; set; }
    public DateOnly? SupplyDate { get; set; }

    public string Currency { get; set; } = "CZK";
    public TaxMode TaxMode { get; set; } = TaxMode.VatExcluded;

    [Precision(5, 2)]
    public decimal? VatRateDefault { get; set; } = 21m;

    [Precision(14, 2)]
    public decimal DiscountTotal { get; set; }

    // snapshot odběratele
    public string BillingName { get; set; } = default!;
    public string? BillingAddress1 { get; set; }
    public string? BillingAddress2 { get; set; }
    public string? BillingCity { get; set; }
    public string? BillingZip { get; set; }
    public string? BillingCountry { get; set; }
    public string? BillingIco { get; set; }
    public string? BillingDic { get; set; }

    // snapshot vystavovatele
    public string IssuerName { get; set; } = default!;
    public string? IssuerIco { get; set; }
    public string? IssuerDic { get; set; }
    public string? IssuerAddress1 { get; set; }
    public string? IssuerAddress2 { get; set; }
    public string? IssuerCity { get; set; }
    public string? IssuerZip { get; set; }
    public string? IssuerCountry { get; set; }
    public string? BankAccountIban { get; set; }
    public string? BankName { get; set; }

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.BankTransfer;

    [Precision(14, 2)] public decimal Subtotal { get; set; }
    [Precision(14, 2)] public decimal VatAmount { get; set; }
    [Precision(14, 2)] public decimal Total { get; set; }
    [Precision(14, 2)] public decimal PaidAmount { get; set; }

    public string? PdfUrl { get; set; }
    public string? NotePublic { get; set; }
    public string? NoteInternal { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
