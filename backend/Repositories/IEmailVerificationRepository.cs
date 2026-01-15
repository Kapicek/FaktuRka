using database.Models;

namespace backend.Repositories;

public interface IEmailVerificationRepository
{
    Task<EmailVerification?> GetActiveByUserIdAsync(int userId);
    Task<EmailVerification?> GetActiveByEmailAsync(string email);
    Task AddAsync(EmailVerification verification);
    Task SaveChangesAsync();
}
