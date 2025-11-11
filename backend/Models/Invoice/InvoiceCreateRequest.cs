using System.ComponentModel.DataAnnotations;
using database.Models.Enums;

namespace backend.Models.Invoices;

public class InvoiceCreateRequest
{
    [Required]
    public int CustomerId { get; set; }

    public int? SequenceId { get; set; }

    [Required]
    public DateOnly IssueDate { get; set; }

    [Required]
    public DateOnly DueDate { get; set; }

    public DateOnly? SupplyDate { get; set; }

    public string Currency { get; set; } = "CZK";

    public TaxMode TaxMode { get; set; } = TaxMode.VatExcluded;

    public decimal? VatRateDefault { get; set; } = 21m;

    public string? VariableSymbol { get; set; }

    public string? NotePublic { get; set; }
    public string? NoteInternal { get; set; }

    [MinLength(1, ErrorMessage = "At least one item is required")]
    public List<InvoiceItemRequest> Items { get; set; } = new();
}
