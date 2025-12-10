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
    private IQueryable<User> UsersWithRoles =>
        _db.Users
           .Include(u => u.UserRoles)
               .ThenInclude(ur => ur.Role);

    public Task<User?> GetByGoogleIdAsync(string googleId)
        => UsersWithRoles.FirstOrDefaultAsync(u => u.GoogleId == googleId);

    public Task<User?> GetByEmailAsync(string email)
        => UsersWithRoles.FirstOrDefaultAsync(u => u.Email == email);

    public Task<User?> GetByIdAsync(int id)
        => UsersWithRoles.FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User> AddAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
