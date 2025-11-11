using database.Models.Enums;

namespace backend.Models.Invoices;

public class InvoiceListItemDto
{
    public int Id { get; set; }
    public string NumberFull { get; set; } = default!;
    public InvoiceStatus Status { get; set; }
    public DateOnly IssueDate { get; set; }
    public DateOnly DueDate { get; set; }
    public string CustomerName { get; set; } = default!;
    public decimal Total { get; set; }
    public string Currency { get; set; } = "CZK";
}
