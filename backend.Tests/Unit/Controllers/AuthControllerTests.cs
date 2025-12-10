using System.Threading.Tasks;
using backend.Controllers;
using backend.Services.Abstraction;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace backend.Tests.Unit.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _authServiceMock;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _authServiceMock = new Mock<IAuthService>();
            _controller = new AuthController(_authServiceMock.Object);
        }

        #region Google

        [Fact]
        public async Task Google_ReturnsBadRequest_WhenIdTokenIsNullOrWhitespace()
        {
            var request = new AuthController.GoogleLoginRequest
            {
                IdToken = "   "
            };

            var result = await _controller.Google(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Missing idToken.", badRequest.Value);
            _authServiceMock.Verify(s => s.LoginWithGoogleAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Google_ReturnsOk_WhenIdTokenIsValid()
        {
            var request = new AuthController.GoogleLoginRequest
            {
                IdToken = "validToken"
            };

            var expected = new AuthResultDto();
            _authServiceMock
                .Setup(s => s.LoginWithGoogleAsync("validToken"))
                .ReturnsAsync(expected);

            var result = await _controller.Google(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(expected, ok.Value);
            _authServiceMock.Verify(s => s.LoginWithGoogleAsync("validToken"), Times.Once);
        }

        #endregion
    }
}
