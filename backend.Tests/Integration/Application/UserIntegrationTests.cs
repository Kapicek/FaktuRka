using System;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.Controllers;
using backend.Infrastructure;
using backend.Services;
using backend.Services.Abstraction;
using database;
using database.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Integration.Application
{
    public class UserIntegrationTests
    {
        private static AppDbContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            return new AppDbContext(options);
        }

        private static ProfileController CreateController(AppDbContext ctx, int userId, bool isAdmin = false)
        {
            IUserRepository repo = new UserRepository(ctx);
            IUserService service = new UserService(repo);
            var controller = new ProfileController(service);

            var claims = new[]
            {
                new Claim("sub", userId.ToString()),
                isAdmin
                    ? new Claim(ClaimTypes.Role, "Admin")
                    : null
            };

            var identity = new ClaimsIdentity();
            foreach (var c in claims)
            {
                if (c != null) identity.AddClaim(c);
            }

            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        #region GetMyProfile

        [Fact]
        public async Task GetMyProfile_ReturnsOk_WhenUserExists()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(GetMyProfile_ReturnsOk_WhenUserExists));

            ctx.Users.Add(new User
            {
                Id = userId,
                Email = "user@test.com",
                FirstName = "John",
                LastName = "Doe",
                CompanyName = "Test s.r.o.",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var controller = CreateController(ctx, userId);

            var result = await controller.GetMyProfile();

            var ok = Assert.IsType<OkObjectResult>(result);
            var profile = Assert.IsType<UserProfileDto>(ok.Value);

            Assert.Equal(userId, profile.Id);
            Assert.Equal("user@test.com", profile.Email);
            Assert.Equal("John Doe", profile.FullName);
        }

        [Fact]
        public async Task GetMyProfile_ReturnsNotFound_WhenUserDoesNotExist()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(GetMyProfile_ReturnsNotFound_WhenUserDoesNotExist));

            var controller = CreateController(ctx, userId);

            var result = await controller.GetMyProfile();

            Assert.IsType<NotFoundResult>(result);
        }

        #endregion

        #region GetById

        [Fact]
        public async Task GetById_ReturnsProfile_WhenAdminAndUserExists()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(GetById_ReturnsProfile_WhenAdminAndUserExists));

            ctx.Users.Add(new User
            {
                Id = 999,
                Email = "other@test.com",
                FirstName = "Other",
                LastName = "User",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var controller = CreateController(ctx, userId, isAdmin: true);

            var result = await controller.GetById(999);

            var ok = Assert.IsType<OkObjectResult>(result);
            var profile = Assert.IsType<UserProfileDto>(ok.Value);

            Assert.Equal(999, profile.Id);
            Assert.Equal("other@test.com", profile.Email);
        }

        #endregion

        #region Update

        [Fact]
        public async Task Update_ChangesProfile_ForLocalUser()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(Update_ChangesProfile_ForLocalUser));

            ctx.Users.Add(new User
            {
                Id = userId,
                Email = "old@test.com",
                FirstName = "Old",
                LastName = "Name",
                AuthProvider = "Local",
                CompanyName = "OldCo",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var controller = CreateController(ctx, userId);

            var dto = new UserProfileDto
            {
                Id = userId,
                Email = "new@test.com",
                FullName = "John Doe",
                CompanyName = "NewCo",
                Ico = "12345678",
                Dic = "CZ12345678",
                VatPayer = true,
                AvatarUrl = "http://example.com/avatar.png"
            };

            var result = await controller.Update(dto);

            var ok = Assert.IsType<OkObjectResult>(result);
            var profile = Assert.IsType<UserProfileDto>(ok.Value);

            Assert.Equal("new@test.com", profile.Email);
            Assert.Equal("John Doe", profile.FullName);
            Assert.Equal("NewCo", profile.CompanyName);

            var user = await ctx.Users.FirstAsync(u => u.Id == userId);
            Assert.Equal("new@test.com", user.Email);
            Assert.Equal("John", user.FirstName);
            Assert.Equal("Doe", user.LastName);
            Assert.Equal("NewCo", user.CompanyName);
        }

        [Fact]
        public async Task Update_DoesNotChangeEmailOrName_ForGoogleUser()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(Update_DoesNotChangeEmailOrName_ForGoogleUser));

            ctx.Users.Add(new User
            {
                Id = userId,
                Email = "google@test.com",
                FirstName = "Google",
                LastName = "User",
                AuthProvider = "Google",
                CompanyName = "OldCo",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var controller = CreateController(ctx, userId);

            var dto = new UserProfileDto
            {
                Id = userId,
                Email = "newlocal@test.com",
                FullName = "New Name",
                CompanyName = "NewCo",
                Ico = "12345678",
                Dic = "CZ12345678",
                VatPayer = true,
                AvatarUrl = "http://example.com/new-avatar.png"
            };

            var result = await controller.Update(dto);

            var ok = Assert.IsType<OkObjectResult>(result);
            var profile = Assert.IsType<UserProfileDto>(ok.Value);

            var user = await ctx.Users.FirstAsync(u => u.Id == userId);

            Assert.Equal("google@test.com", user.Email);
            Assert.Equal("Google", user.FirstName);
            Assert.Equal("User", user.LastName);
            Assert.Equal("NewCo", user.CompanyName);
        }

        #endregion
    }
}
