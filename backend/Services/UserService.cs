using backend.Services.Abstraction;
using database;
using database.Models;

namespace backend.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<UserProfileDto?> GetProfileAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return null;

            return MapToDto(user);
        }

        public async Task<UserProfileDto> UpdateProfileAsync(int userId, UserProfileDto dto)
        {
            var user = await _userRepository.GetByIdAsync(userId)
                ?? throw new InvalidOperationException("User not found");

            var isGoogleUser = string.Equals(user.AuthProvider, "Google", StringComparison.OrdinalIgnoreCase);

            if (!isGoogleUser)
            {
                user.Email = dto.Email;

                if (!string.IsNullOrWhiteSpace(dto.FullName))
                {
                    var parts = dto.FullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                    user.FirstName = parts[0];
                    user.LastName = parts.Length > 1 ? parts[1] : "";
                }

                user.AvatarUrl = dto.AvatarUrl;
            }

            user.CompanyName = dto.CompanyName;
            user.Ico = dto.Ico;
            user.Dic = dto.Dic;
            user.VatPayer = dto.VatPayer;

            user.UpdatedAt = DateTimeOffset.UtcNow;

            await _userRepository.SaveChangesAsync();

            return MapToDto(user);
        }

        private static UserProfileDto MapToDto(User user)
        {
            return new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = $"{user.FirstName} {user.LastName}".Trim(),
                CompanyName = user.CompanyName,
                Ico = user.Ico,
                Dic = user.Dic,
                VatPayer = user.VatPayer,
                AvatarUrl = user.AvatarUrl
            };
        }
    }
}
