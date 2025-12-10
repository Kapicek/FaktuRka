using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Repositories;
using database;
using database.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Integration.Repositories
{
    public class CustomerRepositoryTests
    {
        private static AppDbContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            return new AppDbContext(options);
        }

        private static Customer CreateCustomer(
            int id,
            int userId,
            string name,
            string? ico = null,
            string? email = null,
            bool deleted = false)
        {
            return new Customer
            {
                Id = id,
                UserId = userId,
                Name = name,
                Ico = ico,
                Email = email,
                DeletedAt = deleted ? DateTimeOffset.UtcNow : null,
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
        }

        #region GetAllAsync

        [Fact]
        public async Task GetAllAsync_ReturnsOnlyCurrentUser_NotDeleted()
        {
            await using var ctx = CreateContext(nameof(GetAllAsync_ReturnsOnlyCurrentUser_NotDeleted));

            ctx.Customers.AddRange(
                CreateCustomer(1, 123, "A"),
                CreateCustomer(2, 123, "B", deleted: true),
                CreateCustomer(3, 999, "C")
            );
            await ctx.SaveChangesAsync();

            var repo = new CustomerRepository(ctx);

            var result = await repo.GetAllAsync(123, null);

            Assert.Single(result);
            Assert.Equal(1, result[0].Id);
            Assert.Equal("A", result[0].Name);
            Assert.NotNull(result[0].Address); // Include funguje
        }

        [Fact]
        public async Task GetAllAsync_FiltersBySearch_InNameIcoOrEmail()
        {
            await using var ctx = CreateContext(nameof(GetAllAsync_FiltersBySearch_InNameIcoOrEmail));

            ctx.Customers.AddRange(
                CreateCustomer(1, 123, "Alpha s.r.o.", ico: "11111111", email: "a@test.com"),
                CreateCustomer(2, 123, "Beta s.r.o.", ico: "22222222", email: "beta@company.com"),
                CreateCustomer(3, 123, "Gamma s.r.o.", ico: "33333333", email: "gamma@test.com")
            );
            await ctx.SaveChangesAsync();

            var repo = new CustomerRepository(ctx);

            // podle jména
            var byName = await repo.GetAllAsync(123, "beta");
            Assert.Single(byName);
            Assert.Equal(2, byName[0].Id);

            // podle ICO (část)
            var byIco = await repo.GetAllAsync(123, "333");
            Assert.Single(byIco);
            Assert.Equal(3, byIco[0].Id);

            // podle emailu – Contains => "a@test.com" matchne i "gamma@test.com"
            var byEmail = await repo.GetAllAsync(123, "a@test.com");
            Assert.Equal(2, byEmail.Count);
            Assert.Contains(byEmail, c => c.Id == 1);
            Assert.Contains(byEmail, c => c.Id == 3);
        }

        #endregion

        #region GetByIdAsync

        [Fact]
        public async Task GetByIdAsync_ReturnsNull_WhenDeletedOrOtherUserOrNotFound()
        {
            await using var ctx = CreateContext(nameof(GetByIdAsync_ReturnsNull_WhenDeletedOrOtherUserOrNotFound));

            ctx.Customers.AddRange(
                CreateCustomer(1, 123, "A", deleted: true),
                CreateCustomer(2, 999, "B")
            );
            await ctx.SaveChangesAsync();

            var repo = new CustomerRepository(ctx);

            var r1 = await repo.GetByIdAsync(123, 1);   // deleted
            var r2 = await repo.GetByIdAsync(123, 2);   // jiný user
            var r3 = await repo.GetByIdAsync(123, 999); // neexistuje

            Assert.Null(r1);
            Assert.Null(r2);
            Assert.Null(r3);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsCustomer_WithAddress()
        {
            await using var ctx = CreateContext(nameof(GetByIdAsync_ReturnsCustomer_WithAddress));

            var customer = CreateCustomer(1, 123, "A");
            ctx.Customers.Add(customer);
            await ctx.SaveChangesAsync();

            var repo = new CustomerRepository(ctx);

            var result = await repo.GetByIdAsync(123, 1);

            Assert.NotNull(result);
            Assert.Equal(1, result!.Id);
            Assert.NotNull(result.Address); // Include(c => c.Address)
            Assert.Equal("City", result.Address!.City);
        }

        #endregion

        #region GetByIcoAsync

        [Fact]
        public async Task GetByIcoAsync_ReturnsNull_WhenDeletedOrOtherUserOrNotFound()
        {
            await using var ctx = CreateContext(nameof(GetByIcoAsync_ReturnsNull_WhenDeletedOrOtherUserOrNotFound));

            ctx.Customers.AddRange(
                CreateCustomer(1, 123, "A", ico: "111", deleted: true),
                CreateCustomer(2, 999, "B", ico: "222"),
                CreateCustomer(3, 123, "C", ico: "333")
            );
            await ctx.SaveChangesAsync();

            var repo = new CustomerRepository(ctx);

            var r1 = await repo.GetByIcoAsync(123, "111"); // deleted
            var r2 = await repo.GetByIcoAsync(123, "222"); // jiný user
            var r3 = await repo.GetByIcoAsync(123, "999"); // neexistuje

            Assert.Null(r1);
            Assert.Null(r2);
            Assert.Null(r3);
        }

        [Fact]
        public async Task GetByIcoAsync_ReturnsCustomer_WhenExists()
        {
            await using var ctx = CreateContext(nameof(GetByIcoAsync_ReturnsCustomer_WhenExists));

            ctx.Customers.AddRange(
                CreateCustomer(1, 123, "A", ico: "111"),
                CreateCustomer(2, 123, "B", ico: "222")
            );
            await ctx.SaveChangesAsync();

            var repo = new CustomerRepository(ctx);

            var result = await repo.GetByIcoAsync(123, "222");

            Assert.NotNull(result);
            Assert.Equal(2, result!.Id);
            Assert.Equal("222", result.Ico);
        }

        #endregion

        #region AddAsync_And_SaveChangesAsync

        [Fact]
        public async Task AddAsync_And_SaveChanges_PersistsCustomer()
        {
            var dbName = nameof(AddAsync_And_SaveChanges_PersistsCustomer);

            await using (var ctx = CreateContext(dbName))
            {
                var repo = new CustomerRepository(ctx);

                var customer = CreateCustomer(1, 123, "New Customer", ico: "99999999");

                await repo.AddAsync(customer);
                await repo.SaveChangesAsync();
            }

            await using (var ctx = CreateContext(dbName))
            {
                var loaded = await ctx.Customers
                    .Include(c => c.Address)
                    .FirstOrDefaultAsync(c => c.Id == 1);

                Assert.NotNull(loaded);
                Assert.Equal("New Customer", loaded!.Name);
                Assert.Equal("99999999", loaded.Ico);
                Assert.NotNull(loaded.Address);
            }
        }

        #endregion
    }
}
