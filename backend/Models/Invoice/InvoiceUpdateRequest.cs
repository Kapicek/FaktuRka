using database.Models.Enums;

namespace backend.Models.Invoices;

public class InvoiceUpdateRequest
{
    public DateOnly? IssueDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public DateOnly? SupplyDate { get; set; }
    public string? NotePublic { get; set; }
    public string? NoteInternal { get; set; }
    public InvoiceStatus? Status { get; set; }
}
