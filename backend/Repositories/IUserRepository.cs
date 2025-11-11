using database;
using database.Models;

public interface IUserRepository
{
    Task<User?> GetByGoogleIdAsync(string googleId);
    Task<User?> GetByEmailAsync(string email);
    Task<User> AddAsync(User user);
    Task SaveChangesAsync();
}
