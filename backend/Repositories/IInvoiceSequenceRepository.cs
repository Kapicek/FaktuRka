using database.Models;

namespace backend.Repositories;

public interface IInvoiceSequenceRepository
{
    Task<InvoiceSequence?> GetByIdAsync(int userId, int id);
    Task<InvoiceSequence?> GetDefaultAsync(int userId);
    Task AddAsync(InvoiceSequence sequence);
    Task SaveChangesAsync();
}
