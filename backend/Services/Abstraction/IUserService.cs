namespace backend.Services.Abstraction
{
    public interface IUserService
    {
        Task<UserProfileDto?> GetProfileAsync(int userId);
        Task<UserProfileDto> UpdateProfileAsync(int userId, UserProfileDto dto);
    }
}
