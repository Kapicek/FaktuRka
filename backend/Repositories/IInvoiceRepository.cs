using database.Models;
using database.Models.Enums;

namespace backend.Repositories;

public interface IInvoiceRepository
{
    Task<List<Invoice>> GetListAsync(
        int userId,
        int? customerId,
        InvoiceStatus? status,
        DateOnly? from,
        DateOnly? to);

    Task<Invoice?> GetByIdAsync(int userId, int id);
    Task AddAsync(Invoice invoice);
    Task SaveChangesAsync();
}
