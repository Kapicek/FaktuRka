using database.Models.Enums;

namespace backend.Models.Invoices;

public class InvoiceUpdateRequest : InvoiceCreateRequest
{
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.BankTransfer;
}
