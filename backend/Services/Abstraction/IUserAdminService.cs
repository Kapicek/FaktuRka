namespace backend.Services.Abstraction
{
    public interface IUserAdminService
    {
        Task<UserProfileDto> UpdateUserRolesAsync(int userId, List<string> roleNames);
        Task<List<string>> GetAllRoleNamesAsync();
    }
}
