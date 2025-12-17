using backend.Controllers;
using backend.DTOs;
using backend.Infrastructure;
using backend.Models.Common;
using backend.Models.Customers;
using backend.Services.Abstraction;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace backend.Tests.Unit.Controllers
{
    public class CustomersControllerTests
    {
        private readonly Mock<ICustomerService> _serviceMock;
        private readonly CustomersController _controller;
        private const int UserId = 123;

        public CustomersControllerTests()
        {
            _serviceMock = new Mock<ICustomerService>();
            _controller = new CustomersController(_serviceMock.Object);

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
        public async Task GetList_ReturnsOk_WithCustomers()
        {
            var query = new CustomerListQuery
            {
                Name = "abc"
            };

            var pagedResult = new PagedResult<CustomerListItemDto>
            {
                Items = new List<CustomerListItemDto> { new(), new() },
                TotalCount = 2
            };

            _serviceMock
                .Setup(s => s.GetCustomersAsync(UserId, It.Is<CustomerListQuery>(
                    q => q.Name == "abc")))
                .ReturnsAsync(pagedResult);

            var result = await _controller.GetList(query);

            var ok = Assert.IsType<OkObjectResult>(result);
            var model = Assert.IsType<PagedResult<CustomerListItemDto>>(ok.Value);

            Assert.Equal(2, model.Items.Count);

            _serviceMock.Verify(
                s => s.GetCustomersAsync(UserId, It.IsAny<CustomerListQuery>()),
                Times.Once);
        }


        #endregion

        #region Get

        [Fact]
        public async Task Get_ReturnsNotFound_WhenCustomerDoesNotExist()
        {
            _serviceMock.Setup(s => s.GetCustomerAsync(UserId, 1))
                        .ReturnsAsync((CustomerDto?)null);

            var result = await _controller.Get(1);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Get_ReturnsOk_WhenCustomerExists()
        {
            var customer = new CustomerDto { Id = 1 };

            _serviceMock.Setup(s => s.GetCustomerAsync(UserId, 1))
                        .ReturnsAsync(customer);

            var result = await _controller.Get(1);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(customer, ok.Value);
        }

        #endregion

        #region Create

        [Fact]
        public async Task Create_ReturnsCreated_WhenSuccessful()
        {
            var request = new CustomerCreateRequest();
            var created = new CustomerDto { Id = 10 };

            _serviceMock.Setup(s => s.CreateCustomerAsync(UserId, request))
                        .ReturnsAsync(created);

            var result = await _controller.Create(request);

            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal("Get", createdResult.ActionName);
            Assert.Equal(10, createdResult.RouteValues["id"]);
            Assert.Same(created, createdResult.Value);
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_OnArgumentException()
        {
            var request = new CustomerCreateRequest();

            _serviceMock.Setup(s => s.CreateCustomerAsync(UserId, request))
                        .ThrowsAsync(new ArgumentException("Invalid"));

            var result = await _controller.Create(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid", GetMessage(badRequest.Value));
        }

        [Fact]
        public async Task Create_ReturnsConflict_OnInvalidOperationException()
        {
            var request = new CustomerCreateRequest();

            _serviceMock.Setup(s => s.CreateCustomerAsync(UserId, request))
                        .ThrowsAsync(new InvalidOperationException("Conflict"));

            var result = await _controller.Create(request);

            var conflict = Assert.IsType<ConflictObjectResult>(result);
            Assert.Equal("Conflict", GetMessage(conflict.Value));
        }

        #endregion

        #region Update

        [Fact]
        public async Task Update_ReturnsNotFound_WhenNullReturned()
        {
            var request = new CustomerUpdateRequest();

            _serviceMock.Setup(s => s.UpdateCustomerAsync(UserId, 1, request))
                        .ReturnsAsync((CustomerDto?)null);

            var result = await _controller.Update(1, request);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Update_ReturnsOk_WhenCustomerUpdated()
        {
            var request = new CustomerUpdateRequest();
            var updated = new CustomerDto { Id = 1 };

            _serviceMock.Setup(s => s.UpdateCustomerAsync(UserId, 1, request))
                        .ReturnsAsync(updated);

            var result = await _controller.Update(1, request);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(updated, ok.Value);
        }

        [Fact]
        public async Task Update_ReturnsBadRequest_OnArgumentException()
        {
            var request = new CustomerUpdateRequest();

            _serviceMock.Setup(s => s.UpdateCustomerAsync(UserId, 1, request))
                        .ThrowsAsync(new ArgumentException("Invalid"));

            var result = await _controller.Update(1, request);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid", GetMessage(bad.Value));
        }

        [Fact]
        public async Task Update_ReturnsConflict_OnInvalidOperationException()
        {
            var request = new CustomerUpdateRequest();

            _serviceMock.Setup(s => s.UpdateCustomerAsync(UserId, 1, request))
                        .ThrowsAsync(new InvalidOperationException("Conflict"));

            var result = await _controller.Update(1, request);

            var conflict = Assert.IsType<ConflictObjectResult>(result);
            Assert.Equal("Conflict", GetMessage(conflict.Value));
        }

        #endregion

        #region Delete

        [Fact]
        public async Task Delete_ReturnsNotFound_WhenDeleteFails()
        {
            _serviceMock.Setup(s => s.DeleteCustomerAsync(UserId, 1))
                        .ReturnsAsync(false);

            var result = await _controller.Delete(1);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Delete_ReturnsNoContent_WhenSuccessful()
        {
            _serviceMock.Setup(s => s.DeleteCustomerAsync(UserId, 1))
                        .ReturnsAsync(true);

            var result = await _controller.Delete(1);

            Assert.IsType<NoContentResult>(result);
        }

        #endregion
    }
}
