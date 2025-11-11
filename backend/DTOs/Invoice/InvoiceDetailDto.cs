using database.Models.Enums;

namespace backend.Models.Invoices;

public class InvoiceDetailDto
{
    public int Id { get; set; }
    public string NumberFull { get; set; } = default!;
    public string? VariableSymbol { get; set; }
    public InvoiceStatus Status { get; set; }

    public DateOnly IssueDate { get; set; }
    public DateOnly DueDate { get; set; }
    public DateOnly? SupplyDate { get; set; }

    public string Currency { get; set; } = "CZK";
    public TaxMode TaxMode { get; set; }
    public decimal? VatRateDefault { get; set; }

    // Billing snapshot
    public string BillingName { get; set; } = default!;
    public string? BillingAddress1 { get; set; }
    public string? BillingCity { get; set; }
    public string? BillingZip { get; set; }
    public string? BillingCountry { get; set; }
    public string? BillingIco { get; set; }
    public string? BillingDic { get; set; }

    // Issuer snapshot
    public string IssuerName { get; set; } = default!;
    public string? IssuerIco { get; set; }
    public string? IssuerDic { get; set; }

    public decimal Subtotal { get; set; }
    public decimal VatAmount { get; set; }
    public decimal Total { get; set; }

    public string? NotePublic { get; set; }
    public string? NoteInternal { get; set; }

    public List<InvoiceItemDto> Items { get; set; } = new();
}
