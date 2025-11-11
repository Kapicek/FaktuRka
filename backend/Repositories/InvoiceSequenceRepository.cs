using database;
using database.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class InvoiceSequenceRepository : IInvoiceSequenceRepository
{
    private readonly AppDbContext _db;

    public InvoiceSequenceRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<InvoiceSequence?> GetByIdAsync(int userId, int id)
        => _db.InvoiceSequences.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

    public Task<InvoiceSequence?> GetDefaultAsync(int userId)
        => _db.InvoiceSequences.FirstOrDefaultAsync(s => s.UserId == userId && s.IsDefault);

    public async Task AddAsync(InvoiceSequence sequence)
    {
        await _db.InvoiceSequences.AddAsync(sequence);
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
