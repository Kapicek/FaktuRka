using backend.DTOs.Auth;
using backend.Repositories;
using backend.Services;
using backend.Services.Abstraction;
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
                IEmailVerificationRepository emailVerificationRepo,
                GoogleJsonWebSignature.Payload payload)
                : base(userRepository, configuration, emailService, emailVerificationRepo)
            {
                _payload = payload;
            }

            protected override Task<GoogleJsonWebSignature.Payload> ValidateGoogleTokenAsync(string idToken, string googleClientId)
                => Task.FromResult(_payload);
        }

        private static IConfiguration CreateConfiguration()
        {
            var data = new Dictionary<string, string?>
            {
                ["GoogleAuth:ClientId"] = "test-google-client-id",
                ["Jwt:Key"] = "super_secret_test_key_1234567890abcd",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["Jwt:AccessTokenLifetimeMinutes"] = "60",

                // NEW: required for email verification
                ["Security:EmailCodePepper"] = "pepper_for_tests_very_secret"
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

        private static Mock<IEmailVerificationRepository> CreateEmailVerificationRepoMock()
        {
            var ev = new Mock<IEmailVerificationRepository>();

            ev.Setup(r => r.GetActiveByUserIdAsync(It.IsAny<int>()))
              .ReturnsAsync((EmailVerification?)null);

            ev.Setup(r => r.GetActiveByEmailAsync(It.IsAny<string>()))
              .ReturnsAsync((EmailVerification?)null);

            ev.Setup(r => r.AddAsync(It.IsAny<EmailVerification>()))
              .Returns(Task.CompletedTask);

            ev.Setup(r => r.SaveChangesAsync())
              .Returns(Task.CompletedTask);

            return ev;
        }

        #region LoginWithGoogle - MissingConfiguration

        [Fact]
        public async Task LoginWithGoogleAsync_Throws_WhenGoogleClientIdMissing()
        {
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Jwt:Key"] = "super_secret_test_key_1234567890abcd",
                    ["Jwt:Issuer"] = "test-issuer",
                    ["Jwt:Audience"] = "test-audience",
                    ["Jwt:AccessTokenLifetimeMinutes"] = "60",
                    ["Security:EmailCodePepper"] = "pepper"
                })
                .Build();

            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var payload = CreatePayload();

            var service = new TestAuthService(
                repoMock.Object,
                config,
                emailMock.Object,
                emailVerificationRepoMock.Object,
                payload);

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
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            repoMock.Setup(r => r.GetByGoogleIdAsync("google-123"))
                .ReturnsAsync((User?)null);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync((User?)null);

            User? addedUser = null;

            // NOTE: If your AddAsync returns Task (common), keep this:
            repoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u =>
                {
                    EnsureUserRolesInitialized(u);
                    u.Id = 123; 
                    addedUser = u;
                })
                .ReturnsAsync((User u) => u);


            // If your repository requires SaveChanges for Google create, allow it:
            repoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var payload = CreatePayload();
            var service = new TestAuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object, payload);

            var result = await service.LoginWithGoogleAsync("dummy-token");

            Assert.NotNull(addedUser);
            Assert.Equal("user@test.com", addedUser!.Email);
            Assert.Equal("John", addedUser.FirstName);
            Assert.Equal("Doe", addedUser.LastName);
            Assert.Equal("google-123", addedUser.GoogleId);
            Assert.Equal("Google", addedUser.AuthProvider);
            Assert.Equal("http://example.com/avatar.png", addedUser.AvatarUrl);
            Assert.True(addedUser.EmailVerified);

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
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var existing = new User
            {
                Id = 5,
                Email = "user@test.com",
                FirstName = "Old",
                LastName = "Name",
                GoogleId = null,
                AuthProvider = null,
                AvatarUrl = null,
                UserRoles = new List<UserRole>(),
                EmailVerified = false
            };

            repoMock.Setup(r => r.GetByGoogleIdAsync("google-123"))
                .ReturnsAsync((User?)null);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync(existing);

            repoMock.Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            var payload = CreatePayload();
            var service = new TestAuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object, payload);

            var result = await service.LoginWithGoogleAsync("dummy-token");

            Assert.Equal("google-123", existing.GoogleId);
            Assert.Equal("Google", existing.AuthProvider);
            Assert.Equal("http://example.com/avatar.png", existing.AvatarUrl);
            Assert.True(existing.EmailVerified);

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
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var existing = new User
            {
                Id = 7,
                Email = "old@test.com",
                FirstName = "John",
                LastName = "Doe",
                GoogleId = "google-123",
                AuthProvider = "Google",
                AvatarUrl = "http://example.com/old.png",
                UserRoles = new List<UserRole>(),
                EmailVerified = true
            };

            repoMock.Setup(r => r.GetByGoogleIdAsync("google-123"))
                .ReturnsAsync(existing);

            repoMock.Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            var payload = CreatePayload(
                googleId: "google-123",
                email: "new@test.com",
                givenName: "John",
                familyName: "Doe",
                name: null,
                picture: "http://example.com/new.png");

            var service = new TestAuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object, payload);

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
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

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
                UserRoles = new List<UserRole>(),
                EmailVerified = true
            };

            repoMock.Setup(r => r.GetByGoogleIdAsync("google-123"))
                .ReturnsAsync(user);

            repoMock.Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            var payload = CreatePayload();
            var service = new TestAuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object, payload);

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
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var service = new AuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object);

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
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var service = new AuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object);

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
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var service = new AuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object);

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

        #region RegisterAsync - NewLocalUser

        [Fact]
        public async Task RegisterAsync_CreatesNewLocalUser_AndSendsVerification()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var service = new AuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync((User?)null);

            User? addedUser = null;

            repoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u =>
                {
                    EnsureUserRolesInitialized(u);
                    u.Id = 10;
                    addedUser = u;
                })
                .ReturnsAsync((User u) => u);


            repoMock.Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);

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
            Assert.False(addedUser.EmailVerified);
            Assert.False(string.IsNullOrEmpty(addedUser.PasswordHash));
            Assert.False(string.IsNullOrEmpty(addedUser.PasswordSalt));

            Assert.NotNull(result);
            Assert.Equal("user@test.com", result.Email);
            Assert.Contains("Verification code", result.Message);
            Assert.True(result.CodeExpiresAt > DateTimeOffset.UtcNow);

            repoMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
            repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);

            emailVerificationRepoMock.Verify(r => r.AddAsync(It.IsAny<EmailVerification>()), Times.Once);
            emailMock.Verify(s => s.SendAsync("user@test.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        #endregion

        #region LoginAsync

        [Fact]
        public async Task LoginAsync_Throws_WhenEmailOrPasswordMissing()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var service = new AuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object);

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
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var service = new AuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object);

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
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var service = new AuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object);

            var user = new User
            {
                Id = 5,
                Email = "user@test.com",
                PasswordHash = null,
                PasswordSalt = null,
                AuthProvider = "Google",
                UserRoles = new List<UserRole>(),
                EmailVerified = true
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
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var service = new AuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync((User?)null);

            User? addedUser = null;
            repoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u =>
                {
                    EnsureUserRolesInitialized(u);
                    u.Id = 10;
                    addedUser = u;
                })
                .ReturnsAsync((User u) => u);


            repoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            await service.RegisterAsync(new RegisterRequestDto
            {
                Email = "user@test.com",
                Password = "CorrectPassword123!",
                FirstName = "John",
                LastName = "Doe"
            });

            Assert.NotNull(addedUser);
            addedUser!.EmailVerified = true; // simulate verification completed

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync(addedUser);

            var loginRequest = new LoginRequestDto
            {
                Email = "user@test.com",
                Password = "WrongPassword!"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.LoginAsync(loginRequest));
        }

        [Fact]
        public async Task LoginAsync_Succeeds_WithValidCredentials_WhenVerified()
        {
            var config = CreateConfiguration();
            var repoMock = new Mock<IUserRepository>();
            var emailMock = new Mock<IEmailService>();
            var emailVerificationRepoMock = CreateEmailVerificationRepoMock();

            var service = new AuthService(repoMock.Object, config, emailMock.Object, emailVerificationRepoMock.Object);

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync((User?)null);

            User? addedUser = null;
            repoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u =>
                {
                    EnsureUserRolesInitialized(u);
                    u.Id = 10;
                    addedUser = u;
                })
                .ReturnsAsync((User u) => u);


            repoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            await service.RegisterAsync(new RegisterRequestDto
            {
                Email = "user@test.com",
                Password = "CorrectPassword123!",
                FirstName = "John",
                LastName = "Doe"
            });

            Assert.NotNull(addedUser);
            addedUser!.EmailVerified = true; // simulate verification completed

            repoMock.Setup(r => r.GetByEmailAsync("user@test.com"))
                .ReturnsAsync(addedUser);

            var loginRequest = new LoginRequestDto
            {
                Email = "user@test.com",
                Password = "CorrectPassword123!"
            };

            var result = await service.LoginAsync(loginRequest);

            Assert.NotNull(result);
            Assert.False(string.IsNullOrWhiteSpace(result.Token));
            Assert.Equal("user@test.com", result.Profile.Email);

            repoMock.Verify(r => r.SaveChangesAsync(), Times.AtLeastOnce);
        }

        #endregion
    }
}
