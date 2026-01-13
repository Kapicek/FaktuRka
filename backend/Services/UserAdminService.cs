    using database;
    using database.Models;
    using Microsoft.EntityFrameworkCore;
    using backend.Services.Abstraction;

    public class UserAdminService : IUserAdminService
    {
        private readonly AppDbContext _db;

        public UserAdminService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<UserProfileDto> UpdateUserRolesAsync(int userId, List<string> roleNames)
        {
            roleNames = roleNames
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var user = await _db.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new KeyNotFoundException("User not found.");

            var roles = await _db.Roles
                .Where(r => roleNames.Contains(r.Name))
                .ToListAsync();

            // kontrola, že všechny požadované role existují
            var missingRoles = roleNames
                .Except(roles.Select(r => r.Name), StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (missingRoles.Any())
                throw new ArgumentException($"Unknown roles: {string.Join(", ", missingRoles)}");

            // smažeme staré UserRole
            user.UserRoles.Clear();

            // přidáme nové vazby
            foreach (var role in roles)
            {
                user.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id,
                    Role = role
                });
            }

            user.TokenVersion++;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();

            var roleNamesResult = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();

            return new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = $"{user.FirstName} {user.LastName}".Trim(),
                CompanyName = user.CompanyName,
                Ico = user.Ico,
                Dic = user.Dic,
                VatPayer = user.VatPayer,
                AvatarUrl = user.AvatarUrl,
                Roles = roleNamesResult
            };
        }

        public async Task<List<string>> GetAllRoleNamesAsync()
        {
            return await _db.Roles
                .Select(r => r.Name)
                .OrderBy(r => r)
                .ToListAsync();
        }
    }