using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.Controllers;
using backend.Models.Common;
using backend.Models.Invoice;
using backend.Models.Invoices;
using backend.Repositories;
using backend.Services;
using backend.Services.Abstraction;
using database;
using database.Models;
using database.Models.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Integration.Application
{
    public class InvoiceIntegrationTests
    {
        private static AppDbContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            return new AppDbContext(options);
        }

        private static InvoicesController CreateController(AppDbContext ctx, int userId)
        {
            IInvoiceRepository invoiceRepo = new InvoiceRepository(ctx);
            IInvoiceSequenceRepository seqRepo = new InvoiceSequenceRepository(ctx);
            ICustomerRepository customerRepo = new CustomerRepository(ctx);
            IUserRepository userRepo = new UserRepository(ctx);

            IInvoiceService service = new InvoiceService(invoiceRepo, seqRepo, customerRepo, userRepo);
            var controller = new InvoicesController(service);

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

        private static void SeedUserAndCustomer(AppDbContext ctx, int userId, int customerId)
        {
            var user = new User
            {
                Id = userId,
                Email = "user@test.com",
                FirstName = "John",
                LastName = "Doe",
                CompanyName = "Test s.r.o.",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            var customer = new Customer
            {
                Id = customerId,
                UserId = userId,
                Name = "Customer X",
                Ico = "12345678",
                Address = new Address
                {
                    AddressLine1 = "Street",
                    City = "Prague",
                    Zip = "11000",
                    CountryCode = "CZ",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            ctx.Users.Add(user);
            ctx.Customers.Add(customer);
            ctx.SaveChanges();
        }

        #region CreateInvoice

        [Fact]
        public async Task Create_CreatesInvoice_AndDefaultSequence_WhenNoneExists()
        {
            const int userId = 123;
            const int customerId = 10;

            await using var ctx = CreateContext(nameof(Create_CreatesInvoice_AndDefaultSequence_WhenNoneExists));
            SeedUserAndCustomer(ctx, userId, customerId);

            var controller = CreateController(ctx, userId);

            var request = new InvoiceCreateRequest
            {
                CustomerId = customerId,
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 10),
                SupplyDate = new DateOnly(2025, 1, 1),
                Currency = "CZK",
                TaxMode = TaxMode.VatExcluded,
                VatRateDefault = 21m,
                Items = new List<InvoiceItemRequest>
                {
                    new InvoiceItemRequest
                    {
                        Name = "Item 1",
                        Quantity = 2,
                        Unit = "ks",
                        UnitPrice = 100,
                        Discount = 0,
                        VatRate = 21
                    }
                }
            };

            var result = await controller.Create(request);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            var dto = Assert.IsType<InvoiceDetailDto>(created.Value);

            Assert.True(dto.Id > 0);
            Assert.False(string.IsNullOrWhiteSpace(dto.NumberFull));
            Assert.Equal("CZK", dto.Currency);
            Assert.Single(dto.Items);

            Assert.Equal(1, await ctx.InvoiceSequences.CountAsync());
            Assert.Equal(1, await ctx.Invoices.CountAsync());
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenNoItems()
        {
            const int userId = 123;
            const int customerId = 10;

            await using var ctx = CreateContext(nameof(Create_ReturnsBadRequest_WhenNoItems));
            SeedUserAndCustomer(ctx, userId, customerId);

            var controller = CreateController(ctx, userId);

            var request = new InvoiceCreateRequest
            {
                CustomerId = customerId,
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 10),
                Currency = "CZK",
                TaxMode = TaxMode.VatExcluded,
                Items = new List<InvoiceItemRequest>()
            };

            var result = await controller.Create(request);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            var prop = bad.Value!.GetType().GetProperty("message");
            var message = (string?)prop?.GetValue(bad.Value);

            Assert.Equal("At least one item is required.", message);
        }

        [Fact]
        public async Task Create_ReturnsBadRequest_WhenCustomerNotFound()
        {
            const int userId = 123;
            await using var ctx = CreateContext(nameof(Create_ReturnsBadRequest_WhenCustomerNotFound));

            ctx.Users.Add(new User
            {
                Id = userId,
                Email = "user@test.com",
                FirstName = "John",
                LastName = "Doe",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await ctx.SaveChangesAsync();

            var controller = CreateController(ctx, userId);

            var request = new InvoiceCreateRequest
            {
                CustomerId = 999,
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 10),
                Currency = "CZK",
                TaxMode = TaxMode.VatExcluded,
                Items = new List<InvoiceItemRequest>
                {
                    new InvoiceItemRequest
                    {
                        Name = "Item 1",
                        Quantity = 1,
                        Unit = "ks",
                        UnitPrice = 100,
                        VatRate = 21,
                        Discount = 0
                    }
                }
            };

            var result = await controller.Create(request);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            var prop = bad.Value!.GetType().GetProperty("message");
            var message = (string?)prop?.GetValue(bad.Value);

            Assert.Equal("Customer not found.", message);
        }

        #endregion

        #region GetAndList

        [Fact]
        public async Task Create_Then_Get_ReturnsInvoiceDetailWithItems()
        {
            const int userId = 123;
            const int customerId = 10;
            await using var ctx = CreateContext(nameof(Create_Then_Get_ReturnsInvoiceDetailWithItems));
            SeedUserAndCustomer(ctx, userId, customerId);

            var controller = CreateController(ctx, userId);

            var request = new InvoiceCreateRequest
            {
                CustomerId = customerId,
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 10),
                SupplyDate = new DateOnly(2025, 1, 1),
                Currency = "CZK",
                TaxMode = TaxMode.VatExcluded,
                VatRateDefault = 21m,
                Items = new List<InvoiceItemRequest>
                {
                    new InvoiceItemRequest
                    {
                        Name = "Item 1",
                        Quantity = 2,
                        Unit = "ks",
                        UnitPrice = 100,
                        Discount = 0,
                        VatRate = 21
                    }
                }
            };

            var createResult = await controller.Create(request);
            var created = Assert.IsType<CreatedAtActionResult>(createResult);
            var createdDto = Assert.IsType<InvoiceDetailDto>(created.Value);

            var getResult = await controller.Get(createdDto.Id);

            var ok = Assert.IsType<OkObjectResult>(getResult);
            var detail = Assert.IsType<InvoiceDetailDto>(ok.Value);

            Assert.Equal(createdDto.Id, detail.Id);
            Assert.Single(detail.Items);
            Assert.Equal("Item 1", detail.Items[0].Name);
        }

        [Fact]
        public async Task GetList_ReturnsPagedInvoices_ForUser()
        {
            const int userId = 123;
            const int customerId = 10;
            await using var ctx = CreateContext(nameof(GetList_ReturnsPagedInvoices_ForUser));
            SeedUserAndCustomer(ctx, userId, customerId);

            var controller = CreateController(ctx, userId);

            for (int i = 0; i < 3; i++)
            {
                var req = new InvoiceCreateRequest
                {
                    CustomerId = customerId,
                    IssueDate = new DateOnly(2025, 1, 1).AddDays(i),
                    DueDate = new DateOnly(2025, 1, 10).AddDays(i),
                    Currency = "CZK",
                    TaxMode = TaxMode.VatExcluded,
                    VatRateDefault = 21m,
                    Items = new List<InvoiceItemRequest>
                    {
                        new InvoiceItemRequest
                        {
                            Name = $"Item {i + 1}",
                            Quantity = 1,
                            Unit = "ks",
                            UnitPrice = 100,
                            Discount = 0,
                            VatRate = 21
                        }
                    }
                };

                var r = await controller.Create(req);
                Assert.IsType<CreatedAtActionResult>(r);
            }

            var query = new InvoiceListQuery
            {
                Page = 1,
                PageSize = 10
            };

            var listResult = await controller.GetList(query);

            var ok = Assert.IsType<OkObjectResult>(listResult);
            var paged = Assert.IsType<PagedResult<InvoiceListItemDto>>(ok.Value);

            Assert.Equal(3, paged.TotalCount);
            Assert.Equal(3, paged.Items.Count);
        }

        #endregion
    }
}
