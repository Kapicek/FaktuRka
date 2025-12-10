using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Repositories;
using database;
using database.Models;
using database.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Integration.Repositories
{
    public class InvoiceRepositoryTests
    {
        private static AppDbContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            return new AppDbContext(options);
        }

        private static Invoice CreateInvoice(
            int id,
            int userId,
            int customerId,
            InvoiceStatus status,
            DateOnly issueDate,
            bool deleted = false)
        {
            return new Invoice
            {
                Id = id,
                UserId = userId,
                CustomerId = customerId,
                Status = status,
                IssueDate = issueDate,
                NumberFull = $"INV-{id}",
                Currency = "CZK",
                Total = 100 + id,
                DeletedAt = deleted ? DateTimeOffset.UtcNow : null,

                // required properties na modelu
                BillingName = $"Customer {customerId}",
                IssuerName = "Issuer",

                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
        }

        #region GetListAsync

        [Fact]
        public async Task GetListAsync_FiltersByUser_AndNotDeleted()
        {
            await using var ctx = CreateContext(nameof(GetListAsync_FiltersByUser_AndNotDeleted));

            // customers kvůli Include(i => i.Customer)
            ctx.Customers.AddRange(
                new Customer
                {
                    Id = 1,
                    UserId = 123,
                    Name = "Cust 1",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                new Customer
                {
                    Id = 2,
                    UserId = 999,
                    Name = "Other user customer",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            );

            ctx.Invoices.AddRange(
                CreateInvoice(1, 123, 1, InvoiceStatus.Draft, new DateOnly(2025, 1, 1)),
                CreateInvoice(2, 123, 1, InvoiceStatus.Sent, new DateOnly(2025, 1, 2), deleted: true),
                CreateInvoice(3, 999, 2, InvoiceStatus.Paid, new DateOnly(2025, 1, 3))
            );
            await ctx.SaveChangesAsync();

            var repo = new InvoiceRepository(ctx);

            var result = await repo.GetListAsync(123, null, null, null, null);

            Assert.Single(result);
            Assert.Equal(1, result[0].Id);
            Assert.NotNull(result[0].Customer);
            Assert.Equal("Cust 1", result[0].Customer!.Name);
        }

        [Fact]
        public async Task GetListAsync_FiltersByCustomerStatusAndDateRange()
        {
            await using var ctx = CreateContext(nameof(GetListAsync_FiltersByCustomerStatusAndDateRange));

            // customers pro customerId 10 a 20
            ctx.Customers.AddRange(
                new Customer
                {
                    Id = 10,
                    UserId = 123,
                    Name = "Customer 10",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                new Customer
                {
                    Id = 20,
                    UserId = 123,
                    Name = "Customer 20",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            );

            ctx.Invoices.AddRange(
                CreateInvoice(1, 123, 10, InvoiceStatus.Draft, new DateOnly(2025, 1, 1)),
                CreateInvoice(2, 123, 10, InvoiceStatus.Sent, new DateOnly(2025, 1, 5)),
                CreateInvoice(3, 123, 20, InvoiceStatus.Sent, new DateOnly(2025, 1, 10)),
                CreateInvoice(4, 123, 10, InvoiceStatus.Sent, new DateOnly(2025, 2, 1))
            );
            await ctx.SaveChangesAsync();

            var repo = new InvoiceRepository(ctx);

            var from = new DateOnly(2025, 1, 2);
            var to = new DateOnly(2025, 1, 31);

            var result = await repo.GetListAsync(
                userId: 123,
                customerId: 10,
                status: InvoiceStatus.Sent,
                from: from,
                to: to);

            // Měl by projít jen invoice Id=2
            Assert.Single(result);
            Assert.Equal(2, result[0].Id);
        }

        [Fact]
        public async Task GetListAsync_OrdersByIssueDateThenIdDescending()
        {
            await using var ctx = CreateContext(nameof(GetListAsync_OrdersByIssueDateThenIdDescending));

            ctx.Customers.Add(new Customer
            {
                Id = 1,
                UserId = 123,
                Name = "Cust 1",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });

            ctx.Invoices.AddRange(
                CreateInvoice(1, 123, 1, InvoiceStatus.Draft, new DateOnly(2025, 1, 1)),
                CreateInvoice(2, 123, 1, InvoiceStatus.Draft, new DateOnly(2025, 1, 2)),
                CreateInvoice(3, 123, 1, InvoiceStatus.Draft, new DateOnly(2025, 1, 2)),
                CreateInvoice(4, 123, 1, InvoiceStatus.Draft, new DateOnly(2024, 12, 31))
            );
            await ctx.SaveChangesAsync();

            Assert.Equal(4, await ctx.Invoices.CountAsync());

            var repo = new InvoiceRepository(ctx);

            var result = await repo.GetListAsync(123, null, null, null, null);

            var ids = result.Select(i => i.Id).ToArray();
            Assert.Equal(new[] { 3, 2, 1, 4 }, ids);
        }

        #endregion

        #region GetByIdAsync

        [Fact]
        public async Task GetByIdAsync_ReturnsNull_WhenDeletedOrOtherUser()
        {
            await using var ctx = CreateContext(nameof(GetByIdAsync_ReturnsNull_WhenDeletedOrOtherUser));

            // různé customerId, aby nebyly kolize Customer Id
            ctx.Invoices.AddRange(
                CreateInvoice(1, 123, 1, InvoiceStatus.Draft, new DateOnly(2025, 1, 1), deleted: true),
                CreateInvoice(2, 999, 2, InvoiceStatus.Draft, new DateOnly(2025, 1, 1))
            );
            await ctx.SaveChangesAsync();

            var repo = new InvoiceRepository(ctx);

            var r1 = await repo.GetByIdAsync(123, 1); // deleted
            var r2 = await repo.GetByIdAsync(123, 2); // jiný user

            Assert.Null(r1);
            Assert.Null(r2);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsInvoice_WithItemsAndCustomerAddress()
        {
            await using var ctx = CreateContext(nameof(GetByIdAsync_ReturnsInvoice_WithItemsAndCustomerAddress));

            var customer = new Customer
            {
                Id = 10,
                UserId = 123,
                Name = "Customer X",
                Address = new Address
                {
                    AddressLine1 = "Street",
                    City = "City",
                    Zip = "12345",
                    CountryCode = "CZ",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            ctx.Customers.Add(customer);

            var invoice = new Invoice
            {
                Id = 1,
                UserId = 123,
                CustomerId = 10,
                Customer = customer,
                Status = InvoiceStatus.Draft,
                IssueDate = new DateOnly(2025, 1, 1),
                NumberFull = "INV-1",
                Currency = "CZK",
                BillingName = "Customer X",
                IssuerName = "Issuer",
                Items = new List<InvoiceItem>
                {
                    new InvoiceItem
                    {
                        Id = 100,
                        OrderNo = 1,
                        Name = "Item 1",
                        Quantity = 2,
                        Unit = "ks",
                        UnitPrice = 100,
                        LineSubtotal = 200,
                        LineVat = 42,
                        LineTotal = 242
                    }
                },
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            ctx.Invoices.Add(invoice);
            await ctx.SaveChangesAsync();

            var repo = new InvoiceRepository(ctx);

            var result = await repo.GetByIdAsync(123, 1);

            Assert.NotNull(result);
            Assert.Equal(1, result!.Id);
            Assert.NotNull(result.Items);
            Assert.Single(result.Items);
            Assert.Equal("Item 1", result.Items.First().Name);

            Assert.NotNull(result.Customer);
            Assert.NotNull(result.Customer!.Address);
            Assert.Equal("City", result.Customer.Address!.City);
        }

        #endregion

        #region AddAsync_And_SaveChangesAsync

        [Fact]
        public async Task AddAsync_And_SaveChanges_PersistsInvoice()
        {
            var dbName = nameof(AddAsync_And_SaveChanges_PersistsInvoice);

            await using (var ctx = CreateContext(dbName))
            {
                var repo = new InvoiceRepository(ctx);

                var customer = new Customer
                {
                    Id = 5,
                    UserId = 123,
                    Name = "Customer",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };
                ctx.Customers.Add(customer);
                await ctx.SaveChangesAsync();

                var invoice = new Invoice
                {
                    UserId = 123,
                    CustomerId = 5,
                    Status = InvoiceStatus.Draft,
                    IssueDate = new DateOnly(2025, 1, 1),
                    NumberFull = "INV-NEW",
                    Currency = "CZK",
                    Total = 123,
                    BillingName = "Customer",
                    IssuerName = "Issuer",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                await repo.AddAsync(invoice);
                await repo.SaveChangesAsync();

                Assert.True(invoice.Id > 0);
            }

            await using (var ctx = CreateContext(dbName))
            {
                var loaded = await ctx.Invoices.FirstOrDefaultAsync(i => i.NumberFull == "INV-NEW");

                Assert.NotNull(loaded);
                Assert.Equal(123, loaded!.UserId);
                Assert.Equal(5, loaded.CustomerId);
                Assert.Equal("Customer", loaded.BillingName);
                Assert.Equal("Issuer", loaded.IssuerName);
            }
        }

        #endregion

        #region Query

        [Fact]
        public async Task Query_FiltersByUserAndNotDeleted()
        {
            await using var ctx = CreateContext(nameof(Query_FiltersByUserAndNotDeleted));

            ctx.Invoices.AddRange(
                CreateInvoice(1, 123, 1, InvoiceStatus.Draft, new DateOnly(2025, 1, 1)),
                CreateInvoice(2, 123, 1, InvoiceStatus.Draft, new DateOnly(2025, 1, 2), deleted: true),
                CreateInvoice(3, 999, 1, InvoiceStatus.Draft, new DateOnly(2025, 1, 3))
            );
            await ctx.SaveChangesAsync();

            var repo = new InvoiceRepository(ctx);

            var query = repo.Query(123);
            var list = await query.ToListAsync();

            Assert.Single(list);
            Assert.Equal(1, list[0].Id);
        }

        #endregion
    }
}
