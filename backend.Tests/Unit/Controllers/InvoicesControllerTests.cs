using System.Security.Claims;
using System.Threading.Tasks;
using backend.Controllers;
using backend.Infrastructure;
using backend.Models.Common;
using backend.Models.Invoice;
using backend.Models.Invoices;
using backend.Services.Abstraction;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace backend.Tests.Unit.Controllers
{
    public class InvoicesControllerTests
    {
        private readonly Mock<IInvoiceService> _serviceMock;
        private readonly InvoicesController _controller;
        private const int UserId = 123;

        public InvoicesControllerTests()
        {
            _serviceMock = new Mock<IInvoiceService>();
            _controller = new InvoicesController(_serviceMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("sub", UserId.ToString())
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
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

        #region GetList

        [Fact]
        public async Task GetList_ReturnsOk_WithResult()
        {
            var query = new InvoiceListQuery();
            var pagedResult = new PagedResult<InvoiceListItemDto>();

            _serviceMock
                .Setup(s => s.GetInvoicesAsync(UserId, query))
                .ReturnsAsync(pagedResult);

            var result = await _controller.GetList(query);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(pagedResult, ok.Value);
            _serviceMock.Verify(s => s.GetInvoicesAsync(UserId, query), Times.Once);
        }

        #endregion

        #region Get

        [Fact]
        public async Task Get_ReturnsNotFound_WhenInvoiceIsNull()
        {
            _serviceMock
                .Setup(s => s.GetInvoiceAsync(UserId, 1))
                .ReturnsAsync((InvoiceDetailDto?)null);

            var result = await _controller.Get(1);

            Assert.IsType<NotFoundResult>(result);
            _serviceMock.Verify(s => s.GetInvoiceAsync(UserId, 1), Times.Once);
        }

        [Fact]
        public async Task Get_ReturnsOk_WhenInvoiceExists()
        {
            var invoice = new InvoiceDetailDto();

            _serviceMock
                .Setup(s => s.GetInvoiceAsync(UserId, 1))
                .ReturnsAsync(invoice);

            var result = await _controller.Get(1);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(invoice, ok.Value);
            _serviceMock.Verify(s => s.GetInvoiceAsync(UserId, 1), Times.Once);
        }

        #endregion

        #region Create

        [Fact]
        public async Task Create_ReturnsCreated_WhenSuccessful()
        {
            var request = new InvoiceCreateRequest();
            var created = new InvoiceDetailDto { Id = 10 };

            _serviceMock
                .Setup(s => s.CreateInvoiceAsync(UserId, request))
                .ReturnsAsync(created);

            var result = await _controller.Create(request);

            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal("Get", createdResult.ActionName);
            Assert.Equal(10, createdResult.RouteValues["id"]);
            Assert.Same(created, createdResult.Value);
            _serviceMock.Verify(s => s.CreateInvoiceAsync(UserId, request), Times.Once);
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_OnArgumentException()
        {
            var request = new InvoiceCreateRequest();

            _serviceMock
                .Setup(s => s.CreateInvoiceAsync(UserId, request))
                .ThrowsAsync(new ArgumentException("Invalid data"));

            var result = await _controller.Create(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid data", GetMessage(badRequest.Value));
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_OnInvalidOperationException()
        {
            var request = new InvoiceCreateRequest();

            _serviceMock
                .Setup(s => s.CreateInvoiceAsync(UserId, request))
                .ThrowsAsync(new InvalidOperationException("Invalid operation"));

            var result = await _controller.Create(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid operation", GetMessage(badRequest.Value));
        }

        #endregion
    }
}
