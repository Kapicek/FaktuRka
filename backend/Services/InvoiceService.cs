using backend.Models.Common;
using backend.Models.Invoice;
using backend.Models.Invoices;
using backend.PDF;
using backend.Repositories;
using backend.Services.Abstraction;
using database;
using database.Models;
using database.Models.Enums;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;

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

    public async Task<PagedResult<InvoiceListItemDto>> GetInvoicesAsync(
        int userId,
        InvoiceListQuery q)
    {
        var query = _invoiceRepo.Query(userId);

        // TEXT
        if (!string.IsNullOrWhiteSpace(q.Number))
            query = query.Where(i =>
                i.NumberFull.ToLower().Contains(q.Number.ToLower()));

        if (!string.IsNullOrWhiteSpace(q.CustomerName))
            query = query.Where(i =>
                i.BillingName.ToLower().Contains(q.CustomerName.ToLower()));

        if (!string.IsNullOrWhiteSpace(q.Currency))
            query = query.Where(i =>
                i.Currency == q.Currency);

        // ISSUE DATE
        if (q.IssueDateFrom.HasValue)
            query = query.Where(i => i.IssueDate >= q.IssueDateFrom.Value);

        if (q.IssueDateTo.HasValue)
            query = query.Where(i => i.IssueDate <= q.IssueDateTo.Value);

        // DUE DATE
        if (q.DueDateFrom.HasValue)
            query = query.Where(i => i.DueDate >= q.DueDateFrom.Value);

        if (q.DueDateTo.HasValue)
            query = query.Where(i => i.DueDate <= q.DueDateTo.Value);

        // TOTAL RANGE
        if (q.TotalMin.HasValue)
            query = query.Where(i => i.Total >= q.TotalMin.Value);

        if (q.TotalMax.HasValue)
            query = query.Where(i => i.Total <= q.TotalMax.Value);

        // STATUS
        if (q.Status.HasValue)
            query = query.Where(i => i.Status == q.Status);


        // TOTAL COUNT 
        var total = await query.CountAsync();

        //️ SORT
        query = q.SortBy switch
        {
            "numberFull" => q.Desc
                ? query.OrderByDescending(i => i.NumberFull)
                : query.OrderBy(i => i.NumberFull),

            "status" => q.Desc
                ? query.OrderByDescending(i => i.Status)
                : query.OrderBy(i => i.Status),

            "issueDate" => q.Desc
                ? query.OrderByDescending(i => i.IssueDate)
                : query.OrderBy(i => i.IssueDate),

            "dueDate" => q.Desc
                ? query.OrderByDescending(i => i.DueDate)
                : query.OrderBy(i => i.DueDate),

            "customerName" => q.Desc
                ? query.OrderByDescending(i => i.BillingName)
                : query.OrderBy(i => i.BillingName),

            "total" => q.Desc
                ? query.OrderByDescending(i => i.Total)
                : query.OrderBy(i => i.Total),

            "currency" => q.Desc
                ? query.OrderByDescending(i => i.Currency)
                : query.OrderBy(i => i.Currency),

            _ => query.OrderByDescending(i => i.IssueDate)
        };

        // PAGING
        query = query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize);

        // PROJECTION
        var items = await query
            .Select(i => new InvoiceListItemDto
            {
                Id = i.Id,
                NumberFull = i.NumberFull,
                Status = i.Status,
                IssueDate = i.IssueDate,
                DueDate = i.DueDate,
                CustomerName = i.BillingName,
                Total = i.Total,
                Currency = i.Currency
            })
            .ToListAsync();

        return new PagedResult<InvoiceListItemDto>
        {
            Items = items,
            TotalCount = total
        };
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
            UserId = i.UserId,
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

    public async Task<InvoiceExportResult?> GetInvoiceExportAsync(int userId, int id)
    {
        var invoice = await _invoiceRepo.GetByIdAsync(userId, id);
        if (invoice == null)
            return null;

        var dto = MapToDetailDto(invoice);

        var document = new InvoiceDocument(dto);
        var pdfBytes = document.GeneratePdf();

        var safeNumber = string.IsNullOrWhiteSpace(dto.NumberFull)
            ? id.ToString()
            : dto.NumberFull.Replace("/", "-")
                            .Replace("\\", "-")
                            .Replace(" ", "_");

        return new InvoiceExportResult
        {
            FileName = $"invoice-{safeNumber}.pdf",
            ContentType = "application/pdf",
            Content = pdfBytes
        };
    }

    public async Task<InvoiceDetailDto?> UpdateInvoiceAsync(int userId, int id, InvoiceUpdateRequest request)
    {
        var invoice = await _invoiceRepo.GetByIdAsync(userId, id);
        if (invoice == null || invoice.DeletedAt != null)
            return null;

        if (invoice.Status != InvoiceStatus.Draft)
            throw new InvalidOperationException("Only draft invoices can be edited.");

        invoice.IssueDate = request.IssueDate;
        invoice.DueDate = request.DueDate;
        invoice.SupplyDate = request.SupplyDate;

        invoice.Currency = request.Currency;
        invoice.TaxMode = request.TaxMode;
        invoice.PaymentMethod = request.PaymentMethod;

        invoice.NotePublic = request.NotePublic;
        invoice.NoteInternal = request.NoteInternal;

        if (invoice.CustomerId != request.CustomerId)
        {
            var customer = await _customerRepo.GetByIdAsync(userId, request.CustomerId)
                ?? throw new ArgumentException("Customer not found.");

            invoice.CustomerId = customer.Id;
            invoice.Customer = customer;

            invoice.BillingName = customer.Name;
            invoice.BillingIco = customer.Ico;
            invoice.BillingDic = customer.Dic;

            if (customer.Address != null)
            {
                invoice.BillingAddress1 = customer.Address.AddressLine1;
                invoice.BillingAddress2 = customer.Address.AddressLine2;
                invoice.BillingCity = customer.Address.City;
                invoice.BillingZip = customer.Address.Zip;
                invoice.BillingCountry = customer.Address.CountryCode;
            }
        }

        invoice.Items.Clear();
        var orderNo = 1;
        foreach (var itemReq in request.Items)
        {
            var item = new InvoiceItem
            {
                OrderNo = orderNo++,
                Name = itemReq.Name,
                Description = itemReq.Description,
                Quantity = itemReq.Quantity,
                Unit = itemReq.Unit,
                UnitPrice = itemReq.UnitPrice,
                VatRate = itemReq.VatRate,
                Discount = itemReq.Discount
            };

            item.LineSubtotal = itemReq.Quantity * itemReq.UnitPrice - itemReq.Discount;
            var vatRate = itemReq.VatRate ?? invoice.VatRateDefault ?? 0m;
            item.LineVat = invoice.TaxMode == TaxMode.VatExcluded
                ? Math.Round(item.LineSubtotal * vatRate / 100m, 2)
                : 0m;
            item.LineTotal = item.LineSubtotal + item.LineVat;

            invoice.Items.Add(item);
        }

        invoice.Subtotal = invoice.Items.Sum(i => i.LineSubtotal);
        invoice.VatAmount = invoice.Items.Sum(i => i.LineVat);
        invoice.Total = invoice.Items.Sum(i => i.LineTotal);
        invoice.DiscountTotal = request.Items.Sum(i => i.Discount);

        invoice.UpdatedAt = DateTimeOffset.UtcNow;

        await _invoiceRepo.SaveChangesAsync();

        return await GetInvoiceAsync(userId, id);
    }

    public async Task DeleteInvoiceAsync(int userId, int id)
    {
        var invoice = await _invoiceRepo.GetByIdAsync(userId, id);
        if (invoice == null || invoice.DeletedAt != null)
            throw new KeyNotFoundException("Invoice not found.");

        if (invoice.Status != InvoiceStatus.Draft)
            throw new InvalidOperationException("Only draft invoices can be deleted.");

        invoice.DeletedAt = DateTimeOffset.UtcNow;
        invoice.UpdatedAt = DateTimeOffset.UtcNow;

        await _invoiceRepo.SaveChangesAsync();
    }
}
