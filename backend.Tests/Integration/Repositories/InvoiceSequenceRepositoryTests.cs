using System;
using System.Threading.Tasks;
using backend.Repositories;
using database;
using database.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Integration.Repositories
{
    public class InvoiceSequenceRepositoryTests
    {
        private static AppDbContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            return new AppDbContext(options);
        }

        private static InvoiceSequence CreateSequence(
            int id,
            int userId,
            string name,
            string prefix,
            int nextNumber,
            bool isDefault = false)
        {
            return new InvoiceSequence
            {
                Id = id,
                UserId = userId,
                Name = name,
                Prefix = prefix,
                NextNumber = nextNumber,
                IsDefault = isDefault
            };
        }

        #region GetByIdAsync

        [Fact]
        public async Task GetByIdAsync_ReturnsSequence_WhenMatchesUserAndId()
        {
            await using var ctx = CreateContext(nameof(GetByIdAsync_ReturnsSequence_WhenMatchesUserAndId));

            ctx.InvoiceSequences.AddRange(
                CreateSequence(1, 123, "S1", "A-", 1),
                CreateSequence(2, 999, "S2", "B-", 1)
            );
            await ctx.SaveChangesAsync();

            var repo = new InvoiceSequenceRepository(ctx);

            var result = await repo.GetByIdAsync(123, 1);

            Assert.NotNull(result);
            Assert.Equal(1, result!.Id);
            Assert.Equal(123, result.UserId);
            Assert.Equal("S1", result.Name);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsNull_WhenWrongUserOrId()
        {
            await using var ctx = CreateContext(nameof(GetByIdAsync_ReturnsNull_WhenWrongUserOrId));

            ctx.InvoiceSequences.AddRange(
                CreateSequence(1, 123, "S1", "A-", 1),
                CreateSequence(2, 999, "S2", "B-", 1)
            );
            await ctx.SaveChangesAsync();

            var repo = new InvoiceSequenceRepository(ctx);

            var r1 = await repo.GetByIdAsync(123, 999); // neexistuje id
            var r2 = await repo.GetByIdAsync(123, 2);   // jiný user

            Assert.Null(r1);
            Assert.Null(r2);
        }

        #endregion

        #region GetDefaultAsync

        [Fact]
        public async Task GetDefaultAsync_ReturnsNull_WhenNoDefaultForUser()
        {
            await using var ctx = CreateContext(nameof(GetDefaultAsync_ReturnsNull_WhenNoDefaultForUser));

            ctx.InvoiceSequences.AddRange(
                CreateSequence(1, 123, "S1", "A-", 1, isDefault: false),
                CreateSequence(2, 999, "S2", "B-", 1, isDefault: true)
            );
            await ctx.SaveChangesAsync();

            var repo = new InvoiceSequenceRepository(ctx);

            var result = await repo.GetDefaultAsync(123);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetDefaultAsync_ReturnsDefaultSequence_ForUser()
        {
            await using var ctx = CreateContext(nameof(GetDefaultAsync_ReturnsDefaultSequence_ForUser));

            ctx.InvoiceSequences.AddRange(
                CreateSequence(1, 123, "S1", "A-", 1, isDefault: false),
                CreateSequence(2, 123, "Default", "D-", 10, isDefault: true),
                CreateSequence(3, 999, "OtherUserDefault", "X-", 5, isDefault: true)
            );
            await ctx.SaveChangesAsync();

            var repo = new InvoiceSequenceRepository(ctx);

            var result = await repo.GetDefaultAsync(123);

            Assert.NotNull(result);
            Assert.Equal(2, result!.Id);
            Assert.True(result.IsDefault);
            Assert.Equal(123, result.UserId);
        }

        #endregion

        #region AddAsync_And_SaveChangesAsync

        [Fact]
        public async Task AddAsync_And_SaveChanges_PersistsSequence()
        {
            var dbName = nameof(AddAsync_And_SaveChanges_PersistsSequence);

            await using (var ctx = CreateContext(dbName))
            {
                var repo = new InvoiceSequenceRepository(ctx);

                var seq = new InvoiceSequence
                {
                    UserId = 123,
                    Name = "NewSeq",
                    Prefix = "NS-",
                    NextNumber = 1,
                    IsDefault = true
                };

                await repo.AddAsync(seq);
                await repo.SaveChangesAsync();

                Assert.True(seq.Id > 0);
            }

            await using (var ctx = CreateContext(dbName))
            {
                var loaded = await ctx.InvoiceSequences.FirstOrDefaultAsync(s => s.Name == "NewSeq");

                Assert.NotNull(loaded);
                Assert.Equal(123, loaded!.UserId);
                Assert.Equal("NS-", loaded.Prefix);
                Assert.True(loaded.IsDefault);
            }
        }

        #endregion
    }
}
