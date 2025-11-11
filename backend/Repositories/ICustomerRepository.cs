using database.Models;

public interface ICustomerRepository
{
    Task<List<Customer>> GetAllAsync(int userId, string? search = null);
    Task<Customer?> GetByIdAsync(int userId, int id);
    Task<Customer?> GetByIcoAsync(int userId, string ico);
    Task AddAsync(Customer customer);
    Task SaveChangesAsync();
}