using database;
using database.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class CustomerRepository : ICustomerRepository
{
    private readonly AppDbContext _db;

    public CustomerRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Customer>> GetAllAsync(int userId, string? search = null)
    {
        var query = _db.Customers
            .Include(c => c.Address)
            .Where(c => c.UserId == userId && c.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(term) ||
                (c.Ico != null && c.Ico.Contains(term)) ||
                (c.Email != null && c.Email.ToLower().Contains(term)));
        }

        return await query
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public Task<Customer?> GetByIdAsync(int userId, int id)
    {
        return _db.Customers
            .Include(c => c.Address)
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.UserId == userId &&
                c.DeletedAt == null);
    }

    public Task<Customer?> GetByIcoAsync(int userId, string ico)
    {
        return _db.Customers
            .FirstOrDefaultAsync(c =>
                c.UserId == userId &&
                c.Ico == ico &&
                c.DeletedAt == null);
    }

    public async Task AddAsync(Customer customer)
    {
        await _db.Customers.AddAsync(customer);
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
