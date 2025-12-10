using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Services;
using backend.Services.Abstraction;
using backend.Repositories;
using backend.DTOs;
using database.Models;
using Moq;
using Xunit;

namespace backend.Tests.Unit.Services
{
    public class CustomerServiceTests
    {
        private readonly Mock<ICustomerRepository> _repoMock;
        private readonly CustomerService _service;
        private const int UserId = 123;

        public CustomerServiceTests()
        {
            _repoMock = new Mock<ICustomerRepository>();
            _service = new CustomerService(_repoMock.Object);
        }

        #region GetCustomersAsync

        [Fact]
        public async Task GetCustomersAsync_MapsResults()
        {
            var customers = new List<Customer>
            {
                new Customer
                {
                    Id = 1,
                    Name = "A",
                    Ico = "111",
                    Email = "a@test.com",
                    Address = new Address { City = "City1" }
                },
                new Customer
                {
                    Id = 2,
                    Name = "B",
                    Ico = "222",
                    Email = "b@test.com",
                    Address = null
                }
            };

            _repoMock
                .Setup(r => r.GetAllAsync(UserId, "abc"))
                .ReturnsAsync(customers);

            var result = await _service.GetCustomersAsync(UserId, "abc");

            Assert.Equal(2, result.Count);

            Assert.Equal(1, result[0].Id);
            Assert.Equal("A", result[0].Name);
            Assert.Equal("111", result[0].Ico);
            Assert.Equal("a@test.com", result[0].Email);
            Assert.Equal("City1", result[0].City);

            Assert.Equal(2, result[1].Id);
            Assert.Equal("B", result[1].Name);
            Assert.Equal("222", result[1].Ico);
            Assert.Equal("b@test.com", result[1].Email);
            Assert.Null(result[1].City);

            _repoMock.Verify(r => r.GetAllAsync(UserId, "abc"), Times.Once);
        }

        #endregion

        #region GetCustomerAsync

        [Fact]
        public async Task GetCustomerAsync_ReturnsNull_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                     .ReturnsAsync((Customer?)null);

            var result = await _service.GetCustomerAsync(UserId, 1);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetCustomerAsync_MapsCustomerToDto()
        {
            var customer = new Customer
            {
                Id = 5,
                Name = "Name",
                Ico = "123",
                Dic = "CZ123",
                LegalForm = "s.r.o.",
                Email = "x@test.com",
                Phone = "123",
                Note = "note",
                Address = new Address
                {
                    AddressLine1 = "Street 1",
                    AddressLine2 = "Apt",
                    City = "City",
                    Zip = "12345",
                    CountryCode = "CZ"
                }
            };

            _repoMock.Setup(r => r.GetByIdAsync(UserId, 5))
                     .ReturnsAsync(customer);

            var dto = await _service.GetCustomerAsync(UserId, 5);

            Assert.NotNull(dto);
            Assert.Equal(5, dto!.Id);
            Assert.Equal("Name", dto.Name);
            Assert.Equal("123", dto.Ico);
            Assert.Equal("CZ123", dto.Dic);
            Assert.Equal("s.r.o.", dto.LegalForm);
            Assert.Equal("x@test.com", dto.Email);
            Assert.Equal("123", dto.Phone);
            Assert.Equal("note", dto.Note);
            Assert.Equal("Street 1", dto.AddressLine1);
            Assert.Equal("Apt", dto.AddressLine2);
            Assert.Equal("City", dto.City);
            Assert.Equal("12345", dto.Zip);
            Assert.Equal("CZ", dto.CountryCode);
        }

        #endregion

        #region CreateCustomerAsync

        [Fact]
        public async Task CreateCustomerAsync_ThrowsArgumentException_WhenNameMissing()
        {
            var request = new CustomerCreateRequest
            {
                Name = "   "
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.CreateCustomerAsync(UserId, request));

            _repoMock.Verify(r => r.AddAsync(It.IsAny<Customer>()), Times.Never);
        }

        [Fact]
        public async Task CreateCustomerAsync_ThrowsInvalidOperation_WhenIcoExists()
        {
            var request = new CustomerCreateRequest
            {
                Name = "Test",
                Ico = "123"
            };

            _repoMock.Setup(r => r.GetByIcoAsync(UserId, "123"))
                     .ReturnsAsync(new Customer { Id = 10 });

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateCustomerAsync(UserId, request));

            _repoMock.Verify(r => r.AddAsync(It.IsAny<Customer>()), Times.Never);
        }

        [Fact]
        public async Task CreateCustomerAsync_CreatesCustomer_AndReturnsDto()
        {
            var request = new CustomerCreateRequest
            {
                Name = "  Customer  ",
                Ico = " 123 ",
                Dic = " CZ123 ",
                LegalForm = "s.r.o.",
                Email = "c@test.com",
                Phone = "123",
                Note = "note",
                AddressLine1 = "Street",
                AddressLine2 = "Apt",
                City = "City",
                Zip = "12345",
                CountryCode = null
            };

            _repoMock.Setup(r => r.GetByIcoAsync(UserId, "123"))
                     .ReturnsAsync((Customer?)null);

            Customer? added = null;

            _repoMock.Setup(r => r.AddAsync(It.IsAny<Customer>()))
                     .Callback<Customer>(c => added = c)
                     .Returns(Task.CompletedTask);

            _repoMock.Setup(r => r.SaveChangesAsync())
                     .Returns(Task.CompletedTask);

            var dto = await _service.CreateCustomerAsync(UserId, request);

            Assert.NotNull(added);
            Assert.Equal(UserId, added!.UserId);
            Assert.Equal("Customer", added.Name);
            Assert.Equal("123", added.Ico);
            Assert.Equal("CZ123", added.Dic);
            Assert.Equal("s.r.o.", added.LegalForm);
            Assert.Equal("c@test.com", added.Email);
            Assert.Equal("123", added.Phone);
            Assert.Equal("note", added.Note);
            Assert.NotNull(added.Address);
            Assert.Equal("Street", added.Address!.AddressLine1);
            Assert.Equal("Apt", added.Address.AddressLine2);
            Assert.Equal("City", added.Address.City);
            Assert.Equal("12345", added.Address.Zip);
            Assert.Equal("CZ", added.Address.CountryCode);

            Assert.NotNull(dto);
            Assert.Equal("Customer", dto.Name);
            Assert.Equal("123", dto.Ico);
            Assert.Equal("CZ123", dto.Dic);
            Assert.Equal("Street", dto.AddressLine1);
            Assert.Equal("City", dto.City);

            _repoMock.Verify(r => r.AddAsync(It.IsAny<Customer>()), Times.Once);
            _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        #endregion

        #region UpdateCustomerAsync

        [Fact]
        public async Task UpdateCustomerAsync_ReturnsNull_WhenCustomerNotFound()
        {
            var request = new CustomerUpdateRequest { Name = "X" };

            _repoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                     .ReturnsAsync((Customer?)null);

            var result = await _service.UpdateCustomerAsync(UserId, 1, request);

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateCustomerAsync_ThrowsArgumentException_WhenNameMissing()
        {
            var request = new CustomerUpdateRequest { Name = "  " };

            _repoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                     .ReturnsAsync(new Customer());

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.UpdateCustomerAsync(UserId, 1, request));

            _repoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UpdateCustomerAsync_ThrowsInvalidOperation_WhenIcoTakenByOtherCustomer()
        {
            var request = new CustomerUpdateRequest
            {
                Name = "X",
                Ico = "123"
            };

            var existing = new Customer
            {
                Id = 1,
                Ico = "999"
            };

            var other = new Customer
            {
                Id = 2,
                Ico = "123"
            };

            _repoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                     .ReturnsAsync(existing);

            _repoMock.Setup(r => r.GetByIcoAsync(UserId, "123"))
                     .ReturnsAsync(other);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.UpdateCustomerAsync(UserId, 1, request));

            _repoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UpdateCustomerAsync_UpdatesFieldsAndAddress_WhenValid()
        {
            var request = new CustomerUpdateRequest
            {
                Name = "  New Name ",
                Ico = " 123 ",
                Dic = " CZ123 ",
                LegalForm = "a.s.",
                Email = "new@test.com",
                Phone = "999",
                Note = "updated",
                AddressLine1 = "New street",
                AddressLine2 = "New apt",
                City = "New city",
                Zip = "54321",
                CountryCode = "SK"
            };

            var customer = new Customer
            {
                Id = 1,
                Ico = "111",
                Address = new Address
                {
                    AddressLine1 = "Old",
                    AddressLine2 = "Old",
                    City = "Old",
                    Zip = "000",
                    CountryCode = "CZ"
                }
            };

            _repoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                     .ReturnsAsync(customer);

            _repoMock.Setup(r => r.GetByIcoAsync(UserId, "123"))
                     .ReturnsAsync((Customer?)null);

            _repoMock.Setup(r => r.SaveChangesAsync())
                     .Returns(Task.CompletedTask);

            var dto = await _service.UpdateCustomerAsync(UserId, 1, request);

            Assert.NotNull(dto);
            Assert.Equal("New Name", customer.Name);
            Assert.Equal("123", customer.Ico);
            Assert.Equal("CZ123", customer.Dic);
            Assert.Equal("a.s.", customer.LegalForm);
            Assert.Equal("new@test.com", customer.Email);
            Assert.Equal("999", customer.Phone);
            Assert.Equal("updated", customer.Note);
            Assert.NotNull(customer.Address);
            Assert.Equal("New street", customer.Address!.AddressLine1);
            Assert.Equal("New apt", customer.Address.AddressLine2);
            Assert.Equal("New city", customer.Address.City);
            Assert.Equal("54321", customer.Address.Zip);
            Assert.Equal("SK", customer.Address.CountryCode);

            _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateCustomerAsync_CreatesAddress_WhenMissing()
        {
            var request = new CustomerUpdateRequest
            {
                Name = "X",
                AddressLine1 = "Street",
                City = "City"
            };

            var customer = new Customer
            {
                Id = 1,
                Address = null
            };

            _repoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                     .ReturnsAsync(customer);

            _repoMock.Setup(r => r.GetByIcoAsync(UserId, It.IsAny<string>()))
                     .ReturnsAsync((Customer?)null);

            _repoMock.Setup(r => r.SaveChangesAsync())
                     .Returns(Task.CompletedTask);

            var dto = await _service.UpdateCustomerAsync(UserId, 1, request);

            Assert.NotNull(dto);
            Assert.NotNull(customer.Address);
            Assert.Equal("Street", customer.Address!.AddressLine1);
            Assert.Equal("City", customer.Address.City);

            _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        #endregion

        #region DeleteCustomerAsync

        [Fact]
        public async Task DeleteCustomerAsync_ReturnsFalse_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                     .ReturnsAsync((Customer?)null);

            var result = await _service.DeleteCustomerAsync(UserId, 1);

            Assert.False(result);
            _repoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task DeleteCustomerAsync_SoftDeletesCustomer_AndReturnsTrue()
        {
            var customer = new Customer
            {
                Id = 1,
                DeletedAt = null
            };

            _repoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                     .ReturnsAsync(customer);

            _repoMock.Setup(r => r.SaveChangesAsync())
                     .Returns(Task.CompletedTask);

            var result = await _service.DeleteCustomerAsync(UserId, 1);

            Assert.True(result);
            Assert.NotNull(customer.DeletedAt);
            _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        #endregion
    }
}
