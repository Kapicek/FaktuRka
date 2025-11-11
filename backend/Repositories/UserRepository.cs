using database;
using database.Models;
using Microsoft.EntityFrameworkCore;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<User?> GetByGoogleIdAsync(string googleId)
        => _db.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);

    public Task<User?> GetByEmailAsync(string email)
        => _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<User> AddAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
