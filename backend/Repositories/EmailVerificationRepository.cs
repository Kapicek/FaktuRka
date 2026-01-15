using database;
using database.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class EmailVerificationRepository : IEmailVerificationRepository
{
    private readonly AppDbContext _db;
    public EmailVerificationRepository(AppDbContext db) => _db = db;

    public Task<EmailVerification?> GetActiveByUserIdAsync(int userId)
        => _db.EmailVerifications
            .Where(v => v.UserId == userId && v.VerifiedAt == null && v.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(v => v.Id)
            .FirstOrDefaultAsync();

    public Task<EmailVerification?> GetActiveByEmailAsync(string email)
        => _db.EmailVerifications
            .Where(v => v.Email == email && v.VerifiedAt == null && v.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(v => v.Id)
            .FirstOrDefaultAsync();

    public Task AddAsync(EmailVerification verification)
        => _db.EmailVerifications.AddAsync(verification).AsTask();

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
