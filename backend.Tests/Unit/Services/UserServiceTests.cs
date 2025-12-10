using System;
using System.Threading.Tasks;
using backend.Services;
using backend.Services.Abstraction;
using backend.DTOs;
using database;
using database.Models;
using Moq;
using Xunit;

namespace backend.Tests.Unit.Services
{
    public class UserServiceTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly UserService _service;
        private const int UserId = 123;

        public UserServiceTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _service = new UserService(_userRepoMock.Object);
        }

        #region GetProfileAsync

        [Fact]
        public async Task GetProfileAsync_ReturnsNull_WhenUserNotFound()
        {
            _userRepoMock.Setup(r => r.GetByIdAsync(UserId))
                         .ReturnsAsync((User?)null);

            var result = await _service.GetProfileAsync(UserId);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetProfileAsync_MapsUserToDto()
        {
            var user = new User
            {
                Id = UserId,
                Email = "user@test.com",
                FirstName = "John",
                LastName = "Doe",
                CompanyName = "Company s.r.o.",
                Ico = "12345678",
                Dic = "CZ12345678",
                VatPayer = true,
                AvatarUrl = "http://example.com/avatar.png"
            };

            _userRepoMock.Setup(r => r.GetByIdAsync(UserId))
                         .ReturnsAsync(user);

            var dto = await _service.GetProfileAsync(UserId);

            Assert.NotNull(dto);
            Assert.Equal(UserId, dto!.Id);
            Assert.Equal("user@test.com", dto.Email);
            Assert.Equal("John Doe", dto.FullName);
            Assert.Equal("Company s.r.o.", dto.CompanyName);
            Assert.Equal("12345678", dto.Ico);
            Assert.Equal("CZ12345678", dto.Dic);
            Assert.True(dto.VatPayer);
            Assert.Equal("http://example.com/avatar.png", dto.AvatarUrl);
        }

        #endregion

        #region UpdateProfileAsync

        [Fact]
        public async Task UpdateProfileAsync_Throws_WhenUserNotFound()
        {
            var dto = new UserProfileDto
            {
                Id = UserId,
                Email = "new@test.com"
            };

            _userRepoMock.Setup(r => r.GetByIdAsync(UserId))
                         .ReturnsAsync((User?)null);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.UpdateProfileAsync(UserId, dto));
        }

        [Fact]
        public async Task UpdateProfileAsync_UpdatesNonGoogleUser_EmailNameAvatar()
        {
            var user = new User
            {
                Id = UserId,
                Email = "old@test.com",
                FirstName = "Old",
                LastName = "Name",
                CompanyName = "Old Co",
                Ico = "111",
                Dic = "CZ111",
                VatPayer = false,
                AvatarUrl = "http://example.com/old.png",
                AuthProvider = null,
                UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1)
            };

            var dto = new UserProfileDto
            {
                Id = UserId,
                Email = "new@test.com",
                FullName = "John Doe",
                CompanyName = "New Co",
                Ico = "222",
                Dic = "CZ222",
                VatPayer = true,
                AvatarUrl = "http://example.com/new.png"
            };

            _userRepoMock.Setup(r => r.GetByIdAsync(UserId))
                         .ReturnsAsync(user);

            _userRepoMock.Setup(r => r.SaveChangesAsync())
                         .Returns(Task.CompletedTask);

            var beforeUpdate = user.UpdatedAt;

            var result = await _service.UpdateProfileAsync(UserId, dto);

            Assert.Equal("new@test.com", user.Email);
            Assert.Equal("John", user.FirstName);
            Assert.Equal("Doe", user.LastName);
            Assert.Equal("New Co", user.CompanyName);
            Assert.Equal("222", user.Ico);
            Assert.Equal("CZ222", user.Dic);
            Assert.True(user.VatPayer);
            Assert.Equal("http://example.com/new.png", user.AvatarUrl);
            Assert.True(user.UpdatedAt > beforeUpdate);

            Assert.NotNull(result);
            Assert.Equal("new@test.com", result.Email);
            Assert.Equal("John Doe", result.FullName);
            Assert.Equal("New Co", result.CompanyName);

            _userRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateProfileAsync_AllowsSingleWordFullName_WithoutError()
        {
            var user = new User
            {
                Id = UserId,
                Email = "old@test.com",
                FirstName = "Old",
                LastName = "Name"
            };

            var dto = new UserProfileDto
            {
                Id = UserId,
                Email = "new@test.com",
                FullName = "John"
            };

            _userRepoMock.Setup(r => r.GetByIdAsync(UserId))
                         .ReturnsAsync(user);

            _userRepoMock.Setup(r => r.SaveChangesAsync())
                         .Returns(Task.CompletedTask);

            var result = await _service.UpdateProfileAsync(UserId, dto);

            Assert.NotNull(result);
        }

        [Fact]
        public async Task UpdateProfileAsync_DoesNotChangeGoogleUserEmailNameAvatar()
        {
            var user = new User
            {
                Id = UserId,
                Email = "google@test.com",
                FirstName = "Google",
                LastName = "User",
                CompanyName = "Old Co",
                Ico = "111",
                Dic = "CZ111",
                VatPayer = false,
                AvatarUrl = "http://example.com/old.png",
                AuthProvider = "Google",
                UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1)
            };

            var dto = new UserProfileDto
            {
                Id = UserId,
                Email = "shouldnot@change.com",
                FullName = "New Name",
                CompanyName = "New Co",
                Ico = "222",
                Dic = "CZ222",
                VatPayer = true,
                AvatarUrl = "http://example.com/new.png"
            };

            _userRepoMock.Setup(r => r.GetByIdAsync(UserId))
                         .ReturnsAsync(user);

            _userRepoMock.Setup(r => r.SaveChangesAsync())
                         .Returns(Task.CompletedTask);

            var beforeUpdate = user.UpdatedAt;

            var result = await _service.UpdateProfileAsync(UserId, dto);

            // Google user – tyto pole se NESMÍ změnit
            Assert.Equal("google@test.com", user.Email);
            Assert.Equal("Google", user.FirstName);
            Assert.Equal("User", user.LastName);
            Assert.Equal("http://example.com/old.png", user.AvatarUrl);

            // Tyto se mění normálně
            Assert.Equal("New Co", user.CompanyName);
            Assert.Equal("222", user.Ico);
            Assert.Equal("CZ222", user.Dic);
            Assert.True(user.VatPayer);
            Assert.True(user.UpdatedAt > beforeUpdate);

            Assert.Equal("google@test.com", result.Email);
            Assert.Equal("Google User", result.FullName);
            Assert.Equal("New Co", result.CompanyName);

            _userRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        #endregion
    }
}
