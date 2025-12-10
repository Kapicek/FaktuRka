using System.Security.Claims;
using System.Threading.Tasks;
using backend.Controllers;
using backend.Infrastructure;
using backend.Services.Abstraction;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace backend.Tests.Unit.Controllers
{
    public class ProfileControllerTests
    {
        private readonly Mock<IUserService> _userServiceMock;
        private readonly ProfileController _controller;
        private const int CurrentUserId = 123;

        public ProfileControllerTests()
        {
            _userServiceMock = new Mock<IUserService>();
            _controller = new ProfileController(_userServiceMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("sub", CurrentUserId.ToString())
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        private void SetUser(bool isAdmin)
        {
            var claims = new[]
            {
                new Claim("sub", CurrentUserId.ToString()),
                new Claim(ClaimTypes.Role, isAdmin ? "Admin" : "User")
            };

            var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "mock"));

            _controller.ControllerContext.HttpContext = new DefaultHttpContext
            {
                User = user
            };
        }

        #region GetMyProfile

        [Fact]
        public async Task GetMyProfile_ReturnsNotFound_WhenProfileIsNull()
        {
            _userServiceMock
                .Setup(s => s.GetProfileAsync(CurrentUserId))
                .ReturnsAsync((UserProfileDto?)null);

            var result = await _controller.GetMyProfile();

            Assert.IsType<NotFoundResult>(result);
            _userServiceMock.Verify(s => s.GetProfileAsync(CurrentUserId), Times.Once);
        }

        [Fact]
        public async Task GetMyProfile_ReturnsOk_WhenProfileExists()
        {
            var profile = new UserProfileDto { Id = CurrentUserId };

            _userServiceMock
                .Setup(s => s.GetProfileAsync(CurrentUserId))
                .ReturnsAsync(profile);

            var result = await _controller.GetMyProfile();

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(profile, ok.Value);
            _userServiceMock.Verify(s => s.GetProfileAsync(CurrentUserId), Times.Once);
        }

        #endregion

        #region GetById

        [Fact]
        public async Task GetById_ReturnsForbid_WhenUserIsNotAdmin()
        {
            SetUser(isAdmin: false);

            var result = await _controller.GetById(999);

            Assert.IsType<ForbidResult>(result);
            _userServiceMock.Verify(s => s.GetProfileAsync(It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task GetById_ReturnsNotFound_WhenAdminAndProfileIsNull()
        {
            SetUser(isAdmin: true);

            _userServiceMock
                .Setup(s => s.GetProfileAsync(999))
                .ReturnsAsync((UserProfileDto?)null);

            var result = await _controller.GetById(999);

            Assert.IsType<NotFoundResult>(result);
            _userServiceMock.Verify(s => s.GetProfileAsync(999), Times.Once);
        }

        [Fact]
        public async Task GetById_ReturnsOk_WhenAdminAndProfileExists()
        {
            SetUser(isAdmin: true);

            var profile = new UserProfileDto { Id = 999 };

            _userServiceMock
                .Setup(s => s.GetProfileAsync(999))
                .ReturnsAsync(profile);

            var result = await _controller.GetById(999);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(profile, ok.Value);
            _userServiceMock.Verify(s => s.GetProfileAsync(999), Times.Once);
        }

        #endregion

        #region Update

        [Fact]
        public async Task Update_ReturnsForbid_WhenDtoIdDiffersFromUserId()
        {
            var dto = new UserProfileDto
            {
                Id = 999
            };

            var result = await _controller.Update(dto);

            Assert.IsType<ForbidResult>(result);
            _userServiceMock.Verify(s => s.UpdateProfileAsync(It.IsAny<int>(), It.IsAny<UserProfileDto>()), Times.Never);
        }

        [Fact]
        public async Task Update_UsesCurrentUserId_WhenDtoIdIsZero()
        {
            var dto = new UserProfileDto
            {
                Id = 0
            };

            var updated = new UserProfileDto { Id = CurrentUserId };

            _userServiceMock
                .Setup(s => s.UpdateProfileAsync(CurrentUserId, dto))
                .ReturnsAsync(updated);

            var result = await _controller.Update(dto);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(updated, ok.Value);
            _userServiceMock.Verify(s => s.UpdateProfileAsync(CurrentUserId, dto), Times.Once);
        }

        [Fact]
        public async Task Update_UsesDtoId_WhenMatchesUserId()
        {
            var dto = new UserProfileDto
            {
                Id = CurrentUserId
            };

            var updated = new UserProfileDto { Id = CurrentUserId };

            _userServiceMock
                .Setup(s => s.UpdateProfileAsync(CurrentUserId, dto))
                .ReturnsAsync(updated);

            var result = await _controller.Update(dto);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(updated, ok.Value);
            _userServiceMock.Verify(s => s.UpdateProfileAsync(CurrentUserId, dto), Times.Once);
        }

        #endregion
    }
}
