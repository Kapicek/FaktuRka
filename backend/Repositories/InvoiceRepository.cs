using database;
using database.Models;
using database.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class InvoiceRepository : IInvoiceRepository
{
    private readonly AppDbContext _db;

    public InvoiceRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Invoice>> GetListAsync(
        int userId,
        int? customerId,
        InvoiceStatus? status,
        DateOnly? from,
        DateOnly? to)
    {
        var q = _db.Invoices
            .Include(i => i.Customer)
            .Where(i => i.UserId == userId && i.DeletedAt == null);

        if (customerId.HasValue)
            q = q.Where(i => i.CustomerId == customerId.Value);

        if (status.HasValue)
            q = q.Where(i => i.Status == status.Value);

        if (from.HasValue)
            q = q.Where(i => i.IssueDate >= from.Value);

        if (to.HasValue)
            q = q.Where(i => i.IssueDate <= to.Value);

        return await q
            .OrderByDescending(i => i.IssueDate)
            .ThenByDescending(i => i.Id)
            .ToListAsync();
    }

    public Task<Invoice?> GetByIdAsync(int userId, int id)
    {
        return _db.Invoices
            .Include(i => i.Items)
            .Include(i => i.Customer).ThenInclude(c => c.Address)
            .FirstOrDefaultAsync(i =>
                i.Id == id &&
                i.UserId == userId &&
                i.DeletedAt == null);
    }

    public async Task AddAsync(Invoice invoice)
    {
        await _db.Invoices.AddAsync(invoice);
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
