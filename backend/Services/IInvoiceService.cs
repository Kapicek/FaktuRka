using backend.Models.Invoices;
using database.Models.Enums;

namespace backend.Services;

public interface IInvoiceService
{
    Task<List<InvoiceListItemDto>> GetInvoicesAsync(
        int userId,
        int? customerId,
        InvoiceStatus? status,
        DateOnly? from,
        DateOnly? to);

    Task<InvoiceDetailDto?> GetInvoiceAsync(int userId, int id);
    Task<InvoiceDetailDto> CreateInvoiceAsync(int userId, InvoiceCreateRequest request);
}
