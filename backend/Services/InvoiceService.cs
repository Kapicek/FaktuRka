using backend.Models.Invoices;
using backend.Repositories;
using database;
using database.Models;
using database.Models.Enums;

namespace backend.Services;

// vygenerovaný od bota zatim, pak projdu a předělám

public class InvoiceService : IInvoiceService
{
    private readonly IInvoiceRepository _invoiceRepo;
    private readonly IInvoiceSequenceRepository _seqRepo;
    private readonly ICustomerRepository _customerRepo;
    private readonly IUserRepository _userRepo;

    public InvoiceService(
        IInvoiceRepository invoiceRepo,
        IInvoiceSequenceRepository seqRepo,
        ICustomerRepository customerRepo,
        IUserRepository userRepo)
    {
        _invoiceRepo = invoiceRepo;
        _seqRepo = seqRepo;
        _customerRepo = customerRepo;
        _userRepo = userRepo;
    }

    public async Task<List<InvoiceListItemDto>> GetInvoicesAsync(
        int userId,
        int? customerId,
        InvoiceStatus? status,
        DateOnly? from,
        DateOnly? to)
    {
        var invoices = await _invoiceRepo.GetListAsync(userId, customerId, status, from, to);

        return invoices.Select(i => new InvoiceListItemDto
        {
            Id = i.Id,
            NumberFull = i.NumberFull,
            Status = i.Status,
            IssueDate = i.IssueDate,
            DueDate = i.DueDate,
            CustomerName = i.BillingName, // snapshot, jistota
            Total = i.Total,
            Currency = i.Currency
        }).ToList();
    }

    public async Task<InvoiceDetailDto?> GetInvoiceAsync(int userId, int id)
    {
        var invoice = await _invoiceRepo.GetByIdAsync(userId, id);
        if (invoice == null) return null;

        return MapToDetailDto(invoice);
    }

    public async Task<InvoiceDetailDto> CreateInvoiceAsync(int userId, InvoiceCreateRequest request)
    {
        if (request.Items == null || !request.Items.Any())
            throw new ArgumentException("At least one item is required.");

        if (request.DueDate < request.IssueDate)
            throw new ArgumentException("DueDate cannot be before IssueDate.");

        var customer = await _customerRepo.GetByIdAsync(userId, request.CustomerId);
        if (customer == null)
            throw new InvalidOperationException("Customer not found.");

        var user = await _userRepo.GetByIdAsync(userId)
                   ?? throw new InvalidOperationException("User not found.");

        // 1) Najdi nebo vytvoř číselnou řadu
        var sequence = await ResolveSequenceAsync(userId, request.SequenceId);

        // 2) Vygeneruj číslo faktury
        var numberFull = GenerateInvoiceNumber(sequence);

        // 3) Snapshot odběratele
        var billingName = customer.Name;
        var addr = customer.Address;
        var issuerName = !string.IsNullOrWhiteSpace(user.CompanyName)
            ? user.CompanyName
            : $"{user.FirstName} {user.LastName}".Trim();

        var invoice = new Invoice
        {
            UserId = userId,
            CustomerId = customer.Id,
            SequenceId = sequence?.Id,
            Sequence = sequence,
            NumberFull = numberFull,
            VariableSymbol = request.VariableSymbol ?? numberFull,
            Status = InvoiceStatus.Draft,
            IssueDate = request.IssueDate,
            DueDate = request.DueDate,
            SupplyDate = request.SupplyDate,
            Currency = request.Currency,
            TaxMode = request.TaxMode,
            VatRateDefault = request.VatRateDefault,
            DiscountTotal = 0, // dopočítáme přes items

            BillingName = billingName,
            BillingAddress1 = addr?.AddressLine1,
            BillingAddress2 = addr?.AddressLine2,
            BillingCity = addr?.City,
            BillingZip = addr?.Zip,
            BillingCountry = addr?.CountryCode,
            BillingIco = customer.Ico,
            BillingDic = customer.Dic,

            IssuerName = issuerName,
            IssuerIco = user.Ico,
            IssuerDic = user.Dic,

            PaymentMethod = PaymentMethod.BankTransfer,
            NotePublic = request.NotePublic,
            NoteInternal = request.NoteInternal,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            Items = new List<InvoiceItem>()
        };

        // 4) Položky + výpočty
        ComputeItemsAndTotals(invoice, request.Items);

        await _invoiceRepo.AddAsync(invoice);
        await _invoiceRepo.SaveChangesAsync();

        // posuň sequence.NextNumber
        if (sequence != null)
        {
            sequence.NextNumber++;
            await _seqRepo.SaveChangesAsync();
        }

        return MapToDetailDto(invoice);
    }

    private async Task<InvoiceSequence?> ResolveSequenceAsync(int userId, int? sequenceId)
    {
        if (sequenceId.HasValue)
        {
            var seq = await _seqRepo.GetByIdAsync(userId, sequenceId.Value);
            if (seq == null)
                throw new InvalidOperationException("Invoice sequence not found.");
            return seq;
        }

        var def = await _seqRepo.GetDefaultAsync(userId);
        if (def != null) return def;

        // pokud user nemá žádnou řadu, vytvoříme default
        var created = new InvoiceSequence
        {
            UserId = userId,
            Name = "default",
            Prefix = "",
            NextNumber = 1,
            IsDefault = true
        };

        await _seqRepo.AddAsync(created);
        await _seqRepo.SaveChangesAsync();
        return created;
    }

    private string GenerateInvoiceNumber(InvoiceSequence? seq)
    {
        if (seq == null)
        {
            // fallback (neměl by moc nastávat)
            return DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        }

        // jednoduchý formát: PREFIX + 00001
        return $"{seq.Prefix}{seq.NextNumber:00000}";
    }

    private void ComputeItemsAndTotals(Invoice invoice, List<InvoiceItemRequest> items)
    {
        decimal subtotal = 0;
        decimal vatTotal = 0;
        decimal discountTotal = 0;

        var order = 1;

        foreach (var itemReq in items)
        {
            var rate = itemReq.VatRate ?? invoice.VatRateDefault ?? 0m;

            var lineBase = itemReq.Quantity * itemReq.UnitPrice;
            var lineDiscount = itemReq.Discount;
            if (lineDiscount > lineBase)
                lineDiscount = lineBase;

            var lineSubtotal = lineBase - lineDiscount;
            decimal lineVat;
            decimal lineTotal;

            switch (invoice.TaxMode)
            {
                case TaxMode.VatExcluded:
                    lineVat = Math.Round(lineSubtotal * (rate / 100m), 2);
                    lineTotal = lineSubtotal + lineVat;
                    break;

                case TaxMode.VatIncluded:
                    var divisor = 1 + (rate / 100m);
                    var baseWithoutVat = divisor == 0 ? lineSubtotal : Math.Round(lineSubtotal / divisor, 2);
                    lineVat = lineSubtotal - baseWithoutVat;
                    lineSubtotal = baseWithoutVat;
                    lineTotal = lineSubtotal + lineVat;
                    break;

                case TaxMode.None:
                default:
                    lineVat = 0;
                    lineTotal = lineSubtotal;
                    break;
            }

            var line = new InvoiceItem
            {
                OrderNo = order++,
                Name = itemReq.Name,
                Description = itemReq.Description,
                Quantity = itemReq.Quantity,
                Unit = itemReq.Unit,
                UnitPrice = itemReq.UnitPrice,
                VatRate = rate,
                Discount = lineDiscount,
                LineSubtotal = lineSubtotal,
                LineVat = lineVat,
                LineTotal = lineTotal
            };

            invoice.Items.Add(line);

            subtotal += lineSubtotal;
            vatTotal += lineVat;
            discountTotal += lineDiscount;
        }

        invoice.Subtotal = subtotal;
        invoice.VatAmount = vatTotal;
        invoice.Total = subtotal + vatTotal;
        invoice.DiscountTotal = discountTotal;
    }

    private static InvoiceDetailDto MapToDetailDto(Invoice i)
    {
        return new InvoiceDetailDto
        {
            Id = i.Id,
            NumberFull = i.NumberFull,
            VariableSymbol = i.VariableSymbol,
            Status = i.Status,
            IssueDate = i.IssueDate,
            DueDate = i.DueDate,
            SupplyDate = i.SupplyDate,
            Currency = i.Currency,
            TaxMode = i.TaxMode,
            VatRateDefault = i.VatRateDefault,
            BillingName = i.BillingName,
            BillingAddress1 = i.BillingAddress1,
            BillingCity = i.BillingCity,
            BillingZip = i.BillingZip,
            BillingCountry = i.BillingCountry,
            BillingIco = i.BillingIco,
            BillingDic = i.BillingDic,
            IssuerName = i.IssuerName,
            IssuerIco = i.IssuerIco,
            IssuerDic = i.IssuerDic,
            Subtotal = i.Subtotal,
            VatAmount = i.VatAmount,
            Total = i.Total,
            NotePublic = i.NotePublic,
            NoteInternal = i.NoteInternal,
            Items = i.Items
                .OrderBy(x => x.OrderNo)
                .Select(x => new InvoiceItemDto
                {
                    Id = x.Id,
                    OrderNo = x.OrderNo,
                    Name = x.Name,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    UnitPrice = x.UnitPrice,
                    VatRate = x.VatRate,
                    Discount = x.Discount,
                    LineSubtotal = x.LineSubtotal,
                    LineVat = x.LineVat,
                    LineTotal = x.LineTotal
                }).ToList()
        };
    }
}
