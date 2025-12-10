using System;
using System.Threading.Tasks;
using database;
using database.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Integration.Repositories
{
    public class UserRepositoryTests
    {
        private static AppDbContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            return new AppDbContext(options);
        }

        #region GetByGoogleIdAsync

        [Fact]
        public async Task GetByGoogleIdAsync_ReturnsUser_WhenExists()
        {
            await using var ctx = CreateContext(nameof(GetByGoogleIdAsync_ReturnsUser_WhenExists));

            ctx.Users.Add(new User
            {
                Id = 1,
                Email = "user@test.com",
                GoogleId = "google-123",
                FirstName = "John",
                LastName = "Doe",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var repo = new UserRepository(ctx);

            var result = await repo.GetByGoogleIdAsync("google-123");

            Assert.NotNull(result);
            Assert.Equal(1, result!.Id);
            Assert.Equal("user@test.com", result.Email);
        }

        [Fact]
        public async Task GetByGoogleIdAsync_ReturnsNull_WhenNotFound()
        {
            await using var ctx = CreateContext(nameof(GetByGoogleIdAsync_ReturnsNull_WhenNotFound));

            ctx.Users.Add(new User
            {
                Id = 1,
                Email = "user@test.com",
                GoogleId = "google-123",
                FirstName = "John",
                LastName = "Doe",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var repo = new UserRepository(ctx);

            var result = await repo.GetByGoogleIdAsync("other-google-id");

            Assert.Null(result);
        }

        #endregion

        #region GetByEmailAsync

        [Fact]
        public async Task GetByEmailAsync_ReturnsUser_WhenExists()
        {
            await using var ctx = CreateContext(nameof(GetByEmailAsync_ReturnsUser_WhenExists));

            ctx.Users.Add(new User
            {
                Id = 2,
                Email = "user2@test.com",
                GoogleId = "google-456",
                FirstName = "Jane",
                LastName = "Doe",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var repo = new UserRepository(ctx);

            var result = await repo.GetByEmailAsync("user2@test.com");

            Assert.NotNull(result);
            Assert.Equal(2, result!.Id);
            Assert.Equal("user2@test.com", result.Email);
        }

        [Fact]
        public async Task GetByEmailAsync_ReturnsNull_WhenNotFound()
        {
            await using var ctx = CreateContext(nameof(GetByEmailAsync_ReturnsNull_WhenNotFound));

            ctx.Users.Add(new User
            {
                Id = 2,
                Email = "user2@test.com",
                GoogleId = "google-456",
                FirstName = "Jane",
                LastName = "Doe",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var repo = new UserRepository(ctx);

            var result = await repo.GetByEmailAsync("other@test.com");

            Assert.Null(result);
        }

        #endregion

        #region GetByIdAsync

        [Fact]
        public async Task GetByIdAsync_ReturnsUser_WhenExists()
        {
            await using var ctx = CreateContext(nameof(GetByIdAsync_ReturnsUser_WhenExists));

            ctx.Users.Add(new User
            {
                Id = 10,
                Email = "id@test.com",
                FirstName = "Id",
                LastName = "User",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var repo = new UserRepository(ctx);

            var result = await repo.GetByIdAsync(10);

            Assert.NotNull(result);
            Assert.Equal(10, result!.Id);
            Assert.Equal("id@test.com", result.Email);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
        {
            await using var ctx = CreateContext(nameof(GetByIdAsync_ReturnsNull_WhenNotFound));

            ctx.Users.Add(new User
            {
                Id = 10,
                Email = "id@test.com",
                FirstName = "Id",
                LastName = "User",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var repo = new UserRepository(ctx);

            var result = await repo.GetByIdAsync(999);

            Assert.Null(result);
        }

        #endregion

        #region AddAsync_And_SaveChangesAsync

        [Fact]
        public async Task AddAsync_PersistsUser_AndGetByIdReturnsIt()
        {
            var dbName = nameof(AddAsync_PersistsUser_AndGetByIdReturnsIt);

            await using (var ctx = CreateContext(dbName))
            {
                var repo = new UserRepository(ctx);

                var user = new User
                {
                    Email = "new@test.com",
                    FirstName = "New",
                    LastName = "User",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                var added = await repo.AddAsync(user);

                Assert.NotNull(added);
                Assert.Equal("new@test.com", added.Email);
                Assert.True(added.Id > 0);
            }

            await using (var ctx = CreateContext(dbName))
            {
                var loaded = await ctx.Users.FirstOrDefaultAsync(u => u.Email == "new@test.com");

                Assert.NotNull(loaded);
                Assert.Equal("New", loaded!.FirstName);
            }
        }

        [Fact]
        public async Task SaveChangesAsync_PersistsModifiedUser()
        {
            var dbName = nameof(SaveChangesAsync_PersistsModifiedUser);

            await using (var ctx = CreateContext(dbName))
            {
                ctx.Users.Add(new User
                {
                    Id = 20,
                    Email = "edit@test.com",
                    FirstName = "Old",
                    LastName = "Name",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                });
                await ctx.SaveChangesAsync();
            }

            await using (var ctx = CreateContext(dbName))
            {
                var repo = new UserRepository(ctx);

                var user = await repo.GetByIdAsync(20);
                Assert.NotNull(user);

                user!.FirstName = "New";
                user.UpdatedAt = DateTimeOffset.UtcNow;

                await repo.SaveChangesAsync();
            }

            await using (var ctx = CreateContext(dbName))
            {
                var loaded = await ctx.Users.FirstOrDefaultAsync(u => u.Id == 20);

                Assert.NotNull(loaded);
                Assert.Equal("New", loaded!.FirstName);
            }
        }

        #endregion
    }
}
