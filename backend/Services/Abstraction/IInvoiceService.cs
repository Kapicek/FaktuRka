using backend.Models.Common;
using backend.Models.Invoice;
using backend.Models.Invoices;
using database.Models.Enums;

namespace backend.Services.Abstraction;

public interface IInvoiceService
{
    Task<PagedResult<InvoiceListItemDto>> GetInvoicesAsync(int userId, InvoiceListQuery q);
    Task<InvoiceDetailDto?> GetInvoiceAsync(int userId, int id);
    Task<InvoiceDetailDto> CreateInvoiceAsync(int userId, InvoiceCreateRequest request);
    Task<InvoiceExportResult?> GetInvoiceExportAsync(int userId, int id);
    Task<InvoiceDetailDto?> UpdateInvoiceAsync(int userId, int id, InvoiceUpdateRequest request);
    Task DeleteInvoiceAsync(int userId, int id);
}
