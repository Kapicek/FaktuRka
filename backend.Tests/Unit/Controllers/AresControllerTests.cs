using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using backend.Controllers;
using backend.DTOs.Ares;
using backend.Services.Abstraction;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace backend.Tests.Unit.Controllers
{
    public class AresControllerTests
    {
        private readonly Mock<IAresService> _serviceMock;
        private readonly AresController _controller;

        public AresControllerTests()
        {
            _serviceMock = new Mock<IAresService>();
            _controller = new AresController(_serviceMock.Object);
        }

        private static string? GetMessage(object? value)
        {
            if (value == null)
                return null;

            if (value is string s)
                return s;

            var type = value.GetType();
            var prop = type.GetProperty("message") ?? type.GetProperty("Message");
            return prop?.GetValue(value)?.ToString();
        }

        #region GetByIco

        [Fact]
        public async Task GetByIco_ReturnsBadRequest_WhenIcoIsNullOrWhitespace()
        {
            var result = await _controller.GetByIco("   ", CancellationToken.None);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("ICO is required.", GetMessage(badRequest.Value));
            _serviceMock.Verify(s => s.GetByIcoAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Theory]
        [InlineData("1234567")]
        [InlineData("123456789")]
        [InlineData("abcdef12")]
        public async Task GetByIco_ReturnsBadRequest_WhenIcoHasInvalidFormat(string ico)
        {
            var result = await _controller.GetByIco(ico, CancellationToken.None);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("ICO must be 8 digits.", GetMessage(badRequest.Value));
            _serviceMock.Verify(s => s.GetByIcoAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task GetByIco_ReturnsNotFound_WhenSubjectIsNull()
        {
            _serviceMock
                .Setup(s => s.GetByIcoAsync("12345678", It.IsAny<CancellationToken>()))
                .ReturnsAsync((AresSubjectDto?)null);

            var result = await _controller.GetByIco("12345678", CancellationToken.None);

            Assert.IsType<NotFoundResult>(result);
            _serviceMock.Verify(s => s.GetByIcoAsync("12345678", It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task GetByIco_ReturnsOk_WithSubject_WhenIcoIsValid()
        {
            var dto = new AresSubjectDto();
            _serviceMock
                .Setup(s => s.GetByIcoAsync("12345678", It.IsAny<CancellationToken>()))
                .ReturnsAsync(dto);

            var result = await _controller.GetByIco(" 12345678 ", CancellationToken.None);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(dto, ok.Value);
            _serviceMock.Verify(s => s.GetByIcoAsync("12345678", It.IsAny<CancellationToken>()), Times.Once);
        }

        #endregion

        #region Search

        [Fact]
        public async Task Search_ReturnsBadRequest_WhenQueryIsNullOrWhitespace()
        {
            var result = await _controller.Search("   ", CancellationToken.None, 10);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Query is required.", GetMessage(badRequest.Value));
            _serviceMock.Verify(s =>
                s.SearchByNameAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact]
        public async Task Search_ReturnsOk_WithResults()
        {
            var list = new List<AresSearchItemDto>
            {
                new AresSearchItemDto(),
                new AresSearchItemDto()
            };

            _serviceMock
                .Setup(s => s.SearchByNameAsync("abc", 5, It.IsAny<CancellationToken>()))
                .ReturnsAsync(list);

            var result = await _controller.Search(" abc ", CancellationToken.None, 5);

            var ok = Assert.IsType<OkObjectResult>(result);
            var model = Assert.IsAssignableFrom<List<AresSearchItemDto>>(ok.Value);
            Assert.Equal(2, model.Count);

            _serviceMock.Verify(s => s.SearchByNameAsync("abc", 5, It.IsAny<CancellationToken>()), Times.Once);
        }

        #endregion
    }
}
