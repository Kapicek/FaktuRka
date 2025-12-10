using backend.Models.Invoice;
using backend.Models.Invoices;
using backend.Repositories;
using backend.Services;
using database.Models;
using database.Models.Enums;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace backend.Tests.Unit.Services
{
    public class InvoiceServiceTests
    {
        private readonly Mock<IInvoiceRepository> _invoiceRepoMock;
        private readonly Mock<IInvoiceSequenceRepository> _seqRepoMock;
        private readonly Mock<ICustomerRepository> _customerRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly InvoiceService _service;
        private const int UserId = 123;

        public InvoiceServiceTests()
        {
            _invoiceRepoMock = new Mock<IInvoiceRepository>();
            _seqRepoMock = new Mock<IInvoiceSequenceRepository>();
            _customerRepoMock = new Mock<ICustomerRepository>();
            _userRepoMock = new Mock<IUserRepository>();

            _service = new InvoiceService(
                _invoiceRepoMock.Object,
                _seqRepoMock.Object,
                _customerRepoMock.Object,
                _userRepoMock.Object);
        }

        #region GetInvoiceAsync

        [Fact]
        public async Task GetInvoiceAsync_ReturnsNull_WhenNotFound()
        {
            _invoiceRepoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                            .ReturnsAsync((Invoice?)null);

            var result = await _service.GetInvoiceAsync(UserId, 1);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetInvoiceAsync_MapsInvoiceToDetailDto()
        {
            var invoice = new Invoice
            {
                Id = 10,
                NumberFull = "F-2025-00001",
                VariableSymbol = "202500001",
                Status = InvoiceStatus.Draft,
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 15),
                SupplyDate = new DateOnly(2025, 1, 5),
                Currency = "CZK",
                TaxMode = TaxMode.VatExcluded,
                VatRateDefault = 21,
                BillingName = "Customer s.r.o.",
                BillingAddress1 = "Street 1",
                BillingCity = "City",
                BillingZip = "12345",
                BillingCountry = "CZ",
                BillingIco = "12345678",
                BillingDic = "CZ12345678",
                IssuerName = "My s.r.o.",
                IssuerIco = "87654321",
                IssuerDic = "CZ87654321",
                Subtotal = 100,
                VatAmount = 21,
                Total = 121,
                NotePublic = "public",
                NoteInternal = "internal",
                Items = new List<InvoiceItem>
                {
                    new InvoiceItem
                    {
                        Id = 1,
                        OrderNo = 1,
                        Name = "Item 1",
                        Description = "desc",
                        Quantity = 2,
                        Unit = "ks",
                        UnitPrice = 50,
                        VatRate = 21,
                        Discount = 0,
                        LineSubtotal = 100,
                        LineVat = 21,
                        LineTotal = 121
                    }
                }
            };

            _invoiceRepoMock.Setup(r => r.GetByIdAsync(UserId, 10))
                            .ReturnsAsync(invoice);

            var dto = await _service.GetInvoiceAsync(UserId, 10);

            Assert.NotNull(dto);
            Assert.Equal(invoice.Id, dto!.Id);
            Assert.Equal(invoice.NumberFull, dto.NumberFull);
            Assert.Equal(invoice.VariableSymbol, dto.VariableSymbol);
            Assert.Equal(invoice.Status, dto.Status);
            Assert.Equal(invoice.IssueDate, dto.IssueDate);
            Assert.Equal(invoice.DueDate, dto.DueDate);
            Assert.Equal(invoice.SupplyDate, dto.SupplyDate);
            Assert.Equal(invoice.Currency, dto.Currency);
            Assert.Equal(invoice.TaxMode, dto.TaxMode);
            Assert.Equal(invoice.VatRateDefault, dto.VatRateDefault);
            Assert.Equal(invoice.BillingName, dto.BillingName);
            Assert.Equal(invoice.BillingAddress1, dto.BillingAddress1);
            Assert.Equal(invoice.BillingCity, dto.BillingCity);
            Assert.Equal(invoice.BillingZip, dto.BillingZip);
            Assert.Equal(invoice.BillingCountry, dto.BillingCountry);
            Assert.Equal(invoice.BillingIco, dto.BillingIco);
            Assert.Equal(invoice.BillingDic, dto.BillingDic);
            Assert.Equal(invoice.IssuerName, dto.IssuerName);
            Assert.Equal(invoice.IssuerIco, dto.IssuerIco);
            Assert.Equal(invoice.IssuerDic, dto.IssuerDic);
            Assert.Equal(invoice.Subtotal, dto.Subtotal);
            Assert.Equal(invoice.VatAmount, dto.VatAmount);
            Assert.Equal(invoice.Total, dto.Total);
            Assert.Single(dto.Items);
            Assert.Equal(1, dto.Items[0].OrderNo);
        }

        #endregion

        #region CreateInvoiceAsync_Validation

        [Fact]
        public async Task CreateInvoiceAsync_Throws_WhenNoItems()
        {
            var request = new InvoiceCreateRequest
            {
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 10),
                Items = new List<InvoiceItemRequest>()
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.CreateInvoiceAsync(UserId, request));

            _invoiceRepoMock.Verify(r => r.AddAsync(It.IsAny<Invoice>()), Times.Never);
        }

        [Fact]
        public async Task CreateInvoiceAsync_Throws_WhenItemsNull()
        {
            var request = new InvoiceCreateRequest
            {
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 10),
                Items = null
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.CreateInvoiceAsync(UserId, request));

            _invoiceRepoMock.Verify(r => r.AddAsync(It.IsAny<Invoice>()), Times.Never);
        }

        [Fact]
        public async Task CreateInvoiceAsync_Throws_WhenDueDateBeforeIssueDate()
        {
            var request = new InvoiceCreateRequest
            {
                IssueDate = new DateOnly(2025, 1, 10),
                DueDate = new DateOnly(2025, 1, 5),
                Items = new List<InvoiceItemRequest> { new() { Name = "X", Quantity = 1, UnitPrice = 100 } }
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.CreateInvoiceAsync(UserId, request));

            _invoiceRepoMock.Verify(r => r.AddAsync(It.IsAny<Invoice>()), Times.Never);
        }

        [Fact]
        public async Task CreateInvoiceAsync_Throws_WhenCustomerNotFound()
        {
            var request = new InvoiceCreateRequest
            {
                CustomerId = 1,
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 10),
                Items = new List<InvoiceItemRequest> { new() { Name = "X", Quantity = 1, UnitPrice = 100 } }
            };

            _customerRepoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                             .ReturnsAsync((Customer?)null);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateInvoiceAsync(UserId, request));
        }

        [Fact]
        public async Task CreateInvoiceAsync_Throws_WhenUserNotFound()
        {
            var request = new InvoiceCreateRequest
            {
                CustomerId = 1,
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 10),
                Items = new List<InvoiceItemRequest> { new() { Name = "X", Quantity = 1, UnitPrice = 100 } }
            };

            _customerRepoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                             .ReturnsAsync(new Customer { Id = 1 });

            _userRepoMock.Setup(r => r.GetByIdAsync(UserId))
                         .ReturnsAsync((User?)null);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateInvoiceAsync(UserId, request));
        }

        [Fact]
        public async Task CreateInvoiceAsync_Throws_WhenSequenceIdNotFound()
        {
            var request = new InvoiceCreateRequest
            {
                CustomerId = 1,
                SequenceId = 99,
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 10),
                Items = new List<InvoiceItemRequest> { new() { Name = "X", Quantity = 1, UnitPrice = 100 } }
            };

            _customerRepoMock.Setup(r => r.GetByIdAsync(UserId, 1))
                             .ReturnsAsync(new Customer { Id = 1 });

            _userRepoMock.Setup(r => r.GetByIdAsync(UserId))
                         .ReturnsAsync(new User { Id = UserId });

            _seqRepoMock.Setup(r => r.GetByIdAsync(UserId, 99))
                        .ReturnsAsync((InvoiceSequence?)null);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateInvoiceAsync(UserId, request));
        }

        #endregion

        #region CreateInvoiceAsync_Success

        [Fact]
        public async Task CreateInvoiceAsync_CreatesInvoice_UsesDefaultSequence_WhenNoId()
        {
            var customer = new Customer
            {
                Id = 5,
                Name = "Customer s.r.o.",
                Ico = "12345678",
                Dic = "CZ12345678",
                Address = new Address
                {
                    AddressLine1 = "Street",
                    AddressLine2 = "Apt",
                    City = "City",
                    Zip = "12345",
                    CountryCode = "CZ"
                }
            };

            var user = new User
            {
                Id = UserId,
                FirstName = "John",
                LastName = "Doe",
                CompanyName = "My Company",
                Ico = "87654321",
                Dic = "CZ87654321"
            };

            var seq = new InvoiceSequence
            {
                Id = 7,
                UserId = UserId,
                Name = "default",
                Prefix = "F-2025-",
                NextNumber = 5,
                IsDefault = true
            };

            var request = new InvoiceCreateRequest
            {
                CustomerId = customer.Id,
                IssueDate = new DateOnly(2025, 1, 1),
                DueDate = new DateOnly(2025, 1, 10),
                SupplyDate = new DateOnly(2025, 1, 5),
                Currency = "CZK",
                TaxMode = TaxMode.VatExcluded,
                VatRateDefault = 21,
                NotePublic = "pub",
                NoteInternal = "int",
                Items = new List<InvoiceItemRequest>
                {
                    new()
                    {
                        Name = "Item 1",
                        Quantity = 2,
                        Unit = "ks",
                        UnitPrice = 100,
                        VatRate = null,
                        Discount = 0
                    }
                }
            };

            _customerRepoMock.Setup(r => r.GetByIdAsync(UserId, customer.Id))
                             .ReturnsAsync(customer);

            _userRepoMock.Setup(r => r.GetByIdAsync(UserId))
                         .ReturnsAsync(user);

            _seqRepoMock.Setup(r => r.GetDefaultAsync(UserId))
                        .ReturnsAsync(seq);

            _seqRepoMock.Setup(r => r.SaveChangesAsync())
                        .Returns(Task.CompletedTask);

            Invoice? addedInvoice = null;

            _invoiceRepoMock.Setup(r => r.AddAsync(It.IsAny<Invoice>()))
                            .Callback<Invoice>(i => addedInvoice = i)
                            .Returns(Task.CompletedTask);

            _invoiceRepoMock.Setup(r => r.SaveChangesAsync())
                            .Returns(Task.CompletedTask);

            var dto = await _service.CreateInvoiceAsync(UserId, request);

            Assert.NotNull(addedInvoice);
            Assert.Equal(UserId, addedInvoice!.UserId);
            Assert.Equal(customer.Id, addedInvoice.CustomerId);
            Assert.Equal(seq.Id, addedInvoice.SequenceId);
            Assert.Equal("F-2025-00005", addedInvoice.NumberFull);
            Assert.Equal(InvoiceStatus.Draft, addedInvoice.Status);
            Assert.Equal(request.IssueDate, addedInvoice.IssueDate);
            Assert.Equal(request.DueDate, addedInvoice.DueDate);
            Assert.Equal(request.SupplyDate, addedInvoice.SupplyDate);
            Assert.Equal("CZK", addedInvoice.Currency);
            Assert.Equal(TaxMode.VatExcluded, addedInvoice.TaxMode);
            Assert.Equal(21, addedInvoice.VatRateDefault);
            Assert.Equal(customer.Name, addedInvoice.BillingName);
            Assert.Equal(customer.Address.AddressLine1, addedInvoice.BillingAddress1);
            Assert.Equal(customer.Address.City, addedInvoice.BillingCity);
            Assert.Equal(customer.Address.Zip, addedInvoice.BillingZip);
            Assert.Equal(customer.Address.CountryCode, addedInvoice.BillingCountry);
            Assert.Equal(customer.Ico, addedInvoice.BillingIco);
            Assert.Equal(customer.Dic, addedInvoice.BillingDic);
            Assert.Equal(user.CompanyName, addedInvoice.IssuerName);
            Assert.Equal(user.Ico, addedInvoice.IssuerIco);
            Assert.Equal(user.Dic, addedInvoice.IssuerDic);
            Assert.Equal(request.NotePublic, addedInvoice.NotePublic);
            Assert.Equal(request.NoteInternal, addedInvoice.NoteInternal);

            var line = Assert.Single(addedInvoice.Items);
            Assert.Equal(1, line.OrderNo);
            Assert.Equal("Item 1", line.Name);
            Assert.Equal(2, line.Quantity);
            Assert.Equal(100, line.UnitPrice);
            Assert.Equal(21, line.VatRate);
            Assert.Equal(0, line.Discount);

            // VAT excluded: 2 * 100 = 200, VAT 42, total 242
            Assert.Equal(200m, addedInvoice.Subtotal);
            Assert.Equal(42m, addedInvoice.VatAmount);
            Assert.Equal(242m, addedInvoice.Total);

            Assert.NotNull(dto);
            Assert.Equal(addedInvoice.NumberFull, dto.NumberFull);
            Assert.Equal(addedInvoice.Subtotal, dto.Subtotal);
            Assert.Equal(addedInvoice.VatAmount, dto.VatAmount);
            Assert.Equal(addedInvoice.Total, dto.Total);

            Assert.Equal(6, seq.NextNumber);
            _seqRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
            _invoiceRepoMock.Verify(r => r.AddAsync(It.IsAny<Invoice>()), Times.Once);
            _invoiceRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        #endregion
    }
}
