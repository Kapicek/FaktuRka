using backend.DTOs.Auth;
using backend.Services;
using backend.Services.Abstraction;
using database;
using database.Models;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Moq;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Threading.Tasks;
using Xunit;

namespace backend.Tests.Unit.Services
{
    public class AuthServiceTests
    {
        private class TestAuthService : AuthService
        {
            private readonly GoogleJsonWebSignature.Payload _payload;

            public TestAuthService(
                IUserRepository userRepository,
                IConfiguration configuration,
                IEmailService emailService,
                GoogleJsonWebSignature.Payload payload)
                : base(userRepository, configuration, emailService)
            {
                _payload = payload;
            }

            protected override Task<GoogleJsonWebSignature.Payload> ValidateGoogleTokenAsync(string idToken, string googleClientId)
            {
                return Task.FromResult(_payload);
            }
        }

        private static IConfiguration CreateConfiguration()
        {
            var data = new Dictionary<string, string?>
            {
                ["GoogleAuth:ClientId"] = "test-google-client-id",
                ["Jwt:Key"] = "super_secret_test_key_1234567890abcd",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["Jwt:AccessTokenLifetimeMinutes"] = "60"
            };

            return new ConfigurationBuilder()
                .AddInMemoryCollection(data)
                .Build();
        }

        private static GoogleJsonWebSignature.Payload CreatePayload(
            string googleId = "google-123",
            string email = "user@test.com",
            string givenName = "John",
            string familyName = "Doe",
            string? name = null,
            string? picture = "http://example.com/avatar.png")
        {
            return new GoogleJsonWebSignature.Payload
            {
                Subject = googleId,
                Email = email,
                GivenName = givenName,
                FamilyName = familyName,
                Name = name,
                Picture = picture
            };
        }

        private static void EnsureUserRolesInitialized(User user)
        {
            user.UserRoles ??= new List<UserRole>();
        }

        #region LoginWithGoogle - MissingConfiguration

        [Fact]
        public async Task LoginWithGoogleAsync_Throws_WhenGoogleClientIdMissing()
        {
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>())
                .Build();

            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var payload = CreatePayload();

            var service = new TestAuthService(repoMock.Object, config, emailMock.Object, payload);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.LoginWithGoogleAsync("dummy-token"));
        }

        #endregion

        #region LoginWithGoogle - NewUser_Created

        [Fact]
        public async Task LoginWithGoogleAsync_CreatesNewUser_WhenNotFoundByGoogleOrEmail()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();

            repoMock.Setup(r => r.GetByGoogleIdAsync("google-123"))
                .ReturnsAsync((User?)null);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync((User?)null);

            User? addedUser = null;

            repoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u =>
                {
                    EnsureUserRolesInitialized(u);
                    addedUser = u;
                })
                .ReturnsAsync((User u) => u);

            var payload = CreatePayload();
            var service = new TestAuthService(repoMock.Object, config, emailMock.Object, payload);

            var result = await service.LoginWithGoogleAsync("dummy-token");

            Assert.NotNull(addedUser);
            Assert.Equal("user@test.com", addedUser!.Email);
            Assert.Equal("John", addedUser.FirstName);
            Assert.Equal("Doe", addedUser.LastName);
            Assert.Equal("google-123", addedUser.GoogleId);
            Assert.Equal("Google", addedUser.AuthProvider);
            Assert.Equal("http://example.com/avatar.png", addedUser.AvatarUrl);

            Assert.NotNull(result);
            Assert.False(string.IsNullOrWhiteSpace(result.Token));
            Assert.True(result.ExpiresAt > DateTime.UtcNow);

            Assert.NotNull(result.Profile);
            Assert.Equal(addedUser.Email, result.Profile.Email);
            Assert.NotNull(result.Profile.Roles);
        }

        #endregion

        #region LoginWithGoogle - ExistingByEmail_Updated

        [Fact]
        public async Task LoginWithGoogleAsync_UpdatesExistingUserByEmail_WhenNoGoogleId()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();

            var existing = new User
            {
                Id = 5,
                Email = "user@test.com",
                FirstName = "Old",
                LastName = "Name",
                GoogleId = null,
                AuthProvider = null,
                AvatarUrl = null,
                UserRoles = new List<UserRole>()
            };

            repoMock.Setup(r => r.GetByGoogleIdAsync("google-123"))
                .ReturnsAsync((User?)null);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync(existing);

            repoMock.Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            var payload = CreatePayload();
            var service = new TestAuthService(repoMock.Object, config, emailMock.Object, payload);

            var result = await service.LoginWithGoogleAsync("dummy-token");

            Assert.Equal("google-123", existing.GoogleId);
            Assert.Equal("Google", existing.AuthProvider);
            Assert.Equal("http://example.com/avatar.png", existing.AvatarUrl);

            repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);

            Assert.Equal(existing.Id, result.Profile.Id);
            Assert.Equal(existing.Email, result.Profile.Email);
            Assert.NotNull(result.Profile.Roles);
        }

        #endregion

        #region LoginWithGoogle - ExistingByGoogleId_Updated

        [Fact]
        public async Task LoginWithGoogleAsync_UpdatesExistingUserByGoogleId()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();

            var existing = new User
            {
                Id = 7,
                Email = "old@test.com",
                FirstName = "John",
                LastName = "Doe",
                GoogleId = "google-123",
                AuthProvider = "Google",
                AvatarUrl = "http://example.com/old.png",
                UserRoles = new List<UserRole>()
            };

            repoMock.Setup(r => r.GetByGoogleIdAsync("google-123"))
                .ReturnsAsync(existing);

            var payload = CreatePayload(
                googleId: "google-123",
                email: "new@test.com",
                givenName: "John",
                familyName: "Doe",
                name: null,
                picture: "http://example.com/new.png");

            repoMock.Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            var service = new TestAuthService(repoMock.Object, config, emailMock.Object, payload);

            var result = await service.LoginWithGoogleAsync("dummy-token");

            Assert.Equal("new@test.com", existing.Email);
            Assert.Equal("http://example.com/new.png", existing.AvatarUrl);

            repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);

            Assert.Equal(existing.Id, result.Profile.Id);
            Assert.Equal("new@test.com", result.Profile.Email);
            Assert.NotNull(result.Profile.Roles);
        }

        #endregion

        #region LoginWithGoogle - JwtContent

        [Fact]
        public async Task LoginWithGoogleAsync_GeneratesJwtWithExpectedClaims()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();

            var user = new User
            {
                Id = 42,
                Email = "user@test.com",
                FirstName = "John",
                LastName = "Doe",
                GoogleId = "google-123",
                AuthProvider = "Google",
                CompanyName = "Test s.r.o.",
                Ico = "12345678",
                Dic = "CZ12345678",
                VatPayer = true,
                AvatarUrl = "http://example.com/avatar.png",
                UserRoles = new List<UserRole>()
            };

            repoMock.Setup(r => r.GetByGoogleIdAsync("google-123"))
                .ReturnsAsync(user);

            repoMock.Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            var payload = CreatePayload();
            var service = new TestAuthService(repoMock.Object, config, emailMock.Object, payload);

            var result = await service.LoginWithGoogleAsync("dummy-token");

            Assert.NotNull(result);
            Assert.False(string.IsNullOrWhiteSpace(result.Token));

            var handler = new JwtSecurityTokenHandler();
            var token = handler.ReadJwtToken(result.Token);

            Assert.Equal("test-issuer", token.Issuer);
            Assert.Contains(token.Audiences, a => a == "test-audience");

            Assert.Contains(token.Claims, c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == "42");
            Assert.Contains(token.Claims, c => c.Type == JwtRegisteredClaimNames.Email && c.Value == "user@test.com");
            Assert.Contains(token.Claims, c => c.Type == "provider" && c.Value == "Google");
        }

        #endregion

        #region RegisterAsync - Validation

        [Fact]
        public async Task RegisterAsync_Throws_WhenEmailMissing()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            var request = new RegisterRequestDto
            {
                Email = "   ",
                Password = "Password123!",
                FirstName = "John",
                LastName = "Doe"
            };

            await Assert.ThrowsAsync<ArgumentException>(() => service.RegisterAsync(request));
        }

        [Fact]
        public async Task RegisterAsync_Throws_WhenPasswordMissing()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            var request = new RegisterRequestDto
            {
                Email = "user@test.com",
                Password = "   ",
                FirstName = "John",
                LastName = "Doe"
            };

            await Assert.ThrowsAsync<ArgumentException>(() => service.RegisterAsync(request));
        }

        [Fact]
        public async Task RegisterAsync_Throws_WhenPasswordTooShort()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            var request = new RegisterRequestDto
            {
                Email = "user@test.com",
                Password = "short",
                FirstName = "John",
                LastName = "Doe"
            };

            await Assert.ThrowsAsync<ArgumentException>(() => service.RegisterAsync(request));
        }

        #endregion

        #region RegisterAsync - ExistingUser

        [Fact]
        public async Task RegisterAsync_Throws_WhenLocalUserAlreadyExists()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            var existing = new User
            {
                Id = 5,
                Email = "user@test.com",
                PasswordHash = "somehash",
                PasswordSalt = "somesalt",
                AuthProvider = "Local",
                UserRoles = new List<UserRole>()
            };

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync(existing);

            var request = new RegisterRequestDto
            {
                Email = "user@test.com",
                Password = "Password123!",
                FirstName = "John",
                LastName = "Doe"
            };

            await Assert.ThrowsAsync<InvalidOperationException>(() => service.RegisterAsync(request));
        }

        [Fact]
        public async Task RegisterAsync_AddsLocalPasswordToExistingGoogleUser()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            var existing = new User
            {
                Id = 5,
                Email = "user@test.com",
                FirstName = "Google",
                LastName = "User",
                PasswordHash = null,
                PasswordSalt = null,
                AuthProvider = "Google",
                UserRoles = new List<UserRole>()
            };

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync(existing);

            repoMock.Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            var request = new RegisterRequestDto
            {
                Email = "user@test.com",
                Password = "Password123!",
                FirstName = "John",
                LastName = "Doe"
            };

            var result = await service.RegisterAsync(request);

            Assert.False(string.IsNullOrEmpty(existing.PasswordHash));
            Assert.False(string.IsNullOrEmpty(existing.PasswordSalt));
            Assert.Equal("Google,Local", existing.AuthProvider);

            Assert.NotNull(result);
            Assert.Equal(existing.Email, result.Profile.Email);
            Assert.NotNull(result.Profile.Roles);

            repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        #endregion

        #region RegisterAsync - NewLocalUser

        [Fact]
        public async Task RegisterAsync_CreatesNewLocalUser()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync((User?)null);

            User? addedUser = null;

            repoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u =>
                {
                    EnsureUserRolesInitialized(u);
                    addedUser = u;
                })
                .ReturnsAsync((User u) => u);

            var request = new RegisterRequestDto
            {
                Email = "  USER@test.com ",
                Password = "Password123!",
                FirstName = "John",
                LastName = "Doe"
            };

            var result = await service.RegisterAsync(request);

            Assert.NotNull(addedUser);
            Assert.Equal("user@test.com", addedUser!.Email);
            Assert.Equal("John", addedUser.FirstName);
            Assert.Equal("Doe", addedUser.LastName);
            Assert.Equal("Local", addedUser.AuthProvider);
            Assert.False(string.IsNullOrEmpty(addedUser.PasswordHash));
            Assert.False(string.IsNullOrEmpty(addedUser.PasswordSalt));

            Assert.NotNull(result);
            Assert.Equal("user@test.com", result.Profile.Email);
            Assert.NotNull(result.Profile.Roles);

            repoMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
            repoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        #endregion

        #region LoginAsync

        [Fact]
        public async Task LoginAsync_Throws_WhenEmailOrPasswordMissing()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            var request = new LoginRequestDto
            {
                Email = "user@test.com",
                Password = " "
            };

            await Assert.ThrowsAsync<ArgumentException>(() => service.LoginAsync(request));
        }

        [Fact]
        public async Task LoginAsync_Throws_WhenUserNotFound()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync((User?)null);

            var request = new LoginRequestDto
            {
                Email = "user@test.com",
                Password = "Password123!"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.LoginAsync(request));
        }

        [Fact]
        public async Task LoginAsync_Throws_WhenNoLocalPassword()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            var user = new User
            {
                Id = 5,
                Email = "user@test.com",
                PasswordHash = null,
                PasswordSalt = null,
                AuthProvider = "Google",
                UserRoles = new List<UserRole>()
            };

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync(user);

            var request = new LoginRequestDto
            {
                Email = "user@test.com",
                Password = "Password123!"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.LoginAsync(request));
        }

        [Fact]
        public async Task LoginAsync_Throws_WhenPasswordInvalid()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync((User?)null);

            User? addedUser = null;

            repoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u =>
                {
                    EnsureUserRolesInitialized(u);
                    addedUser = u;
                })
                .ReturnsAsync((User u) => u);

            var registerRequest = new RegisterRequestDto
            {
                Email = "user@test.com",
                Password = "CorrectPassword123!",
                FirstName = "John",
                LastName = "Doe"
            };

            await service.RegisterAsync(registerRequest);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync(addedUser!);

            var loginRequest = new LoginRequestDto
            {
                Email = "user@test.com",
                Password = "WrongPassword!"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.LoginAsync(loginRequest));
        }

        [Fact]
        public async Task LoginAsync_Succeeds_WithValidCredentials()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var service = new AuthService(repoMock.Object, config, emailMock.Object);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync((User?)null);

            User? addedUser = null;

            repoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u =>
                {
                    EnsureUserRolesInitialized(u);
                    addedUser = u;
                })
                .ReturnsAsync((User u) => u);

            var registerRequest = new RegisterRequestDto
            {
                Email = "user@test.com",
                Password = "CorrectPassword123!",
                FirstName = "John",
                LastName = "Doe"
            };

            await service.RegisterAsync(registerRequest);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync(addedUser!);

            repoMock.Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            var loginRequest = new LoginRequestDto
            {
                Email = "user@test.com",
                Password = "CorrectPassword123!"
            };

            var result = await service.LoginAsync(loginRequest);

            Assert.NotNull(result);
            Assert.False(string.IsNullOrWhiteSpace(result.Token));
            Assert.Equal("user@test.com", result.Profile.Email);
            Assert.NotNull(result.Profile.Roles);

            repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        #endregion
    }
}
