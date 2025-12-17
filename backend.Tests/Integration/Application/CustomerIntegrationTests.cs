using backend.Controllers;
using backend.DTOs;
using backend.Infrastructure;
using backend.Models.Common;
using backend.Models.Customers;
using backend.Repositories;
using backend.Services;
using backend.Services.Abstraction;
using database;
using database.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace backend.Tests.Integration.Application
{
    public class CustomerIntegrationTests
    {
        private static AppDbContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            return new AppDbContext(options);
        }

        private static CustomersController CreateController(AppDbContext ctx, int userId)
        {
            ICustomerRepository repo = new CustomerRepository(ctx);
            ICustomerService service = new CustomerService(repo);
            var controller = new CustomersController(service);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                    new Claim("sub", userId.ToString())
                }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        #region CreateAndGet

        [Fact]
        public async Task Create_Then_Get_ReturnsFullCustomerWithAddress()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(Create_Then_Get_ReturnsFullCustomerWithAddress));
            var controller = CreateController(ctx, userId);

            var request = new CustomerCreateRequest
            {
                Name = "Test Company s.r.o.",
                Ico = "12345678",
                Email = "test@company.com",
                AddressLine1 = "Street 1",
                City = "Prague",
                Zip = "11000",
                CountryCode = "CZ"
            };

            var createResult = await controller.Create(request);

            var created = Assert.IsType<CreatedAtActionResult>(createResult);
            var createdDto = Assert.IsType<CustomerDto>(created.Value);

            var getResult = await controller.Get(createdDto.Id);
            var ok = Assert.IsType<OkObjectResult>(getResult);
            var detail = Assert.IsType<CustomerDto>(ok.Value);

            Assert.Equal("Test Company s.r.o.", detail.Name);
            Assert.Equal("12345678", detail.Ico);
            Assert.Equal("Prague", detail.City);

            var inDb = await ctx.Customers
                .Include(c => c.Address)
                .FirstOrDefaultAsync(c => c.Id == createdDto.Id && c.UserId == userId);

            Assert.NotNull(inDb);
            Assert.Equal("Prague", inDb!.Address!.City);
        }

        #endregion

        #region CreateValidation

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenNameMissing()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(Create_ReturnsBadRequest_WhenNameMissing));
            var controller = CreateController(ctx, userId);

            var request = new CustomerCreateRequest
            {
                Name = "   ",
                Ico = "12345678"
            };

            var result = await controller.Create(request);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            var prop = bad.Value!.GetType().GetProperty("message");
            var message = (string?)prop?.GetValue(bad.Value);

            Assert.Equal("Name is required.", message);
        }

        [Fact]
        public async Task Create_ReturnsConflict_WhenIcoAlreadyExistsForSameUser()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(Create_ReturnsConflict_WhenIcoAlreadyExistsForSameUser));

            ctx.Customers.Add(new Customer
            {
                UserId = userId,
                Name = "Existing",
                Ico = "11111111",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var controller = CreateController(ctx, userId);

            var request = new CustomerCreateRequest
            {
                Name = "New",
                Ico = "11111111"
            };

            var result = await controller.Create(request);

            var conflict = Assert.IsType<ConflictObjectResult>(result);
            var prop = conflict.Value!.GetType().GetProperty("message");
            var message = (string?)prop?.GetValue(conflict.Value);

            Assert.Equal("Customer with this IC already exists.", message);
        }

        #endregion

        #region UpdateAndDelete

        [Fact]
        public async Task Update_ChangesValues_AndPersistsToDatabase()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(Update_ChangesValues_AndPersistsToDatabase));

            var customer = new Customer
            {
                UserId = userId,
                Name = "Old Name",
                Ico = "11111111",
                Email = "old@test.com",
                Address = new Address
                {
                    AddressLine1 = "Old Street",
                    City = "OldCity",
                    CountryCode = "CZ",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            ctx.Customers.Add(customer);
            await ctx.SaveChangesAsync();

            var controller = CreateController(ctx, userId);

            var update = new CustomerUpdateRequest
            {
                Name = "New Name",
                Ico = "22222222",
                Email = "new@test.com",
                AddressLine1 = "New Street",
                City = "NewCity",
                CountryCode = "SK"
            };

            var result = await controller.Update(customer.Id, update);

            var ok = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<CustomerDto>(ok.Value);

            Assert.Equal("New Name", dto.Name);
            Assert.Equal("22222222", dto.Ico);
            Assert.Equal("NewCity", dto.City);
            Assert.Equal("SK", dto.CountryCode);

            var inDb = await ctx.Customers.Include(c => c.Address).FirstAsync(c => c.Id == customer.Id);
            Assert.Equal("New Name", inDb.Name);
            Assert.Equal("NewCity", inDb.Address!.City);
        }

        [Fact]
        public async Task Delete_SoftDeletesCustomer_AndControllerReturnsNoContent()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(Delete_SoftDeletesCustomer_AndControllerReturnsNoContent));

            var customer = new Customer
            {
                UserId = userId,
                Name = "To delete",
                Ico = "99999999",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            ctx.Customers.Add(customer);
            await ctx.SaveChangesAsync();

            var controller = CreateController(ctx, userId);

            var result = await controller.Delete(customer.Id);

            Assert.IsType<NoContentResult>(result);

            var inDb = await ctx.Customers.FirstAsync(c => c.Id == customer.Id);
            Assert.NotNull(inDb.DeletedAt);
        }

        #endregion

        #region GetListSearch

        [Fact]
        public async Task GetList_FiltersBySearchAcrossLayers()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(GetList_FiltersBySearchAcrossLayers));

            ctx.Customers.AddRange(
                new Customer
                {
                    UserId = userId,
                    Name = "Alpha s.r.o.",
                    Ico = "11111111",
                    Email = "alpha@test.com",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                new Customer
                {
                    UserId = userId,
                    Name = "Beta s.r.o.",
                    Ico = "22222222",
                    Email = "beta@test.com",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            );
            await ctx.SaveChangesAsync();

            var controller = CreateController(ctx, userId);

            var query = new CustomerListQuery
            {
                Name = "beta"
            };

            var result = await controller.GetList(query);

            var ok = Assert.IsType<OkObjectResult>(result);
            var paged = Assert.IsType<PagedResult<CustomerListItemDto>>(ok.Value);

            Assert.Single(paged.Items);
            Assert.Equal("Beta s.r.o.", paged.Items[0].Name);
        }

        #endregion
    }
}
