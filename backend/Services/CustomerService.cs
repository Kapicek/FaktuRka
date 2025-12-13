using backend.Models.Common;
using backend.Models.Customers;
using backend.Repositories;
using backend.Services.Abstraction;
using database;
using database.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _repo;

    public CustomerService(ICustomerRepository repo)
    {
        _repo = repo;
    }

public async Task<PagedResult<CustomerListItemDto>> GetCustomersAsync(
    int userId,
    CustomerListQuery q)
{
    var query = _repo.Query(userId);

    // TEXT FILTERS
    if (!string.IsNullOrWhiteSpace(q.Name))
        query = query.Where(c =>
            c.Name.ToLower().Contains(q.Name.ToLower()));

    if (!string.IsNullOrWhiteSpace(q.Ico))
        query = query.Where(c =>
            c.Ico != null && c.Ico.Contains(q.Ico));

    if (!string.IsNullOrWhiteSpace(q.Dic))
        query = query.Where(c =>
            c.Dic != null && c.Dic.Contains(q.Dic));

    if (!string.IsNullOrWhiteSpace(q.Email))
        query = query.Where(c =>
            c.Email != null && c.Email.ToLower().Contains(q.Email.ToLower()));

    if (!string.IsNullOrWhiteSpace(q.Phone))
        query = query.Where(c =>
            c.Phone != null && c.Phone.Contains(q.Phone));

    if (!string.IsNullOrWhiteSpace(q.City))
        query = query.Where(c =>
            c.Address != null &&
            c.Address.City != null &&
            c.Address.City.ToLower().Contains(q.City.ToLower()));

    if (!string.IsNullOrWhiteSpace(q.CountryCode))
        query = query.Where(c =>
            c.Address != null &&
            c.Address.CountryCode == q.CountryCode);

    // TOTAL COUNT
    var total = await query.CountAsync();

    // SORT
    query = q.SortBy switch
    {
        "name" => q.Desc
            ? query.OrderByDescending(c => c.Name)
            : query.OrderBy(c => c.Name),

        "ico" => q.Desc
            ? query.OrderByDescending(c => c.Ico)
            : query.OrderBy(c => c.Ico),

        "email" => q.Desc
            ? query.OrderByDescending(c => c.Email)
            : query.OrderBy(c => c.Email),

        "city" => q.Desc
            ? query.OrderByDescending(c => c.Address!.City)
            : query.OrderBy(c => c.Address!.City),

        "createdAt" => q.Desc
            ? query.OrderByDescending(c => c.CreatedAt)
            : query.OrderBy(c => c.CreatedAt),

        _ => query.OrderBy(c => c.Name)
    };

    // PAGING
    query = query
        .Skip((q.Page - 1) * q.PageSize)
        .Take(q.PageSize);

    // PROJECTION
    var items = await query
        .Select(c => new CustomerListItemDto
        {
            Id = c.Id,
            Name = c.Name,
            Ico = c.Ico,
            Email = c.Email,
            City = c.Address != null ? c.Address.City : null
        })
        .ToListAsync();

    return new PagedResult<CustomerListItemDto>
    {
        Items = items,
        TotalCount = total
    };
}


public async Task<CustomerDto?> GetCustomerAsync(int userId, int id)
    {
        var c = await _repo.GetByIdAsync(userId, id);
        if (c == null) return null;

        return MapToDto(c);
    }

    public async Task<CustomerDto> CreateCustomerAsync(int userId, CustomerCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required.");

        if (!string.IsNullOrWhiteSpace(request.Ico))
        {
            var existing = await _repo.GetByIcoAsync(userId, request.Ico);
            if (existing != null)
                throw new InvalidOperationException("Customer with this IC already exists.");
        }

        if (!string.IsNullOrWhiteSpace(request.CountryCode) && request.CountryCode.Trim().Length > 2)
            throw new ArgumentException("Country Code must be max 2 characters.");

        var customer = new Customer
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Ico = request.Ico?.Trim(),
            Dic = request.Dic?.Trim(),
            LegalForm = request.LegalForm,
            Email = request.Email,
            Phone = request.Phone,
            Note = request.Note,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        if (!string.IsNullOrWhiteSpace(request.AddressLine1) &&
            !string.IsNullOrWhiteSpace(request.City))
        {
            customer.Address = new Address
            {
                AddressLine1 = request.AddressLine1!,
                AddressLine2 = request.AddressLine2,
                City = request.City!,
                Zip = request.Zip,
                CountryCode = request.CountryCode ?? "CZ",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
        }

        await _repo.AddAsync(customer);
        await _repo.SaveChangesAsync();

        return MapToDto(customer);
    }

    public async Task<CustomerDto?> UpdateCustomerAsync(int userId, int id, CustomerUpdateRequest request)
    {
        var c = await _repo.GetByIdAsync(userId, id);
        if (c == null) return null;

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required.");

        if (!string.IsNullOrWhiteSpace(request.Ico) && request.Ico != c.Ico)
        {
            var existing = await _repo.GetByIcoAsync(userId, request.Ico);
            if (existing != null && existing.Id != id)
                throw new InvalidOperationException("Customer with this IC already exists.");
        }

        c.Name = request.Name.Trim();
        c.Ico = request.Ico?.Trim();
        c.Dic = request.Dic?.Trim();
        c.LegalForm = request.LegalForm;
        c.Email = request.Email;
        c.Phone = request.Phone;
        c.Note = request.Note;
        c.UpdatedAt = DateTimeOffset.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.AddressLine1) &&
            !string.IsNullOrWhiteSpace(request.City))
        {
            if (c.Address == null)
            {
                c.Address = new Address
                {
                    AddressLine1 = request.AddressLine1!,
                    AddressLine2 = request.AddressLine2,
                    City = request.City!,
                    Zip = request.Zip,
                    CountryCode = request.CountryCode ?? "CZ",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };
            }
            else
            {
                c.Address.AddressLine1 = request.AddressLine1!;
                c.Address.AddressLine2 = request.AddressLine2;
                c.Address.City = request.City!;
                c.Address.Zip = request.Zip;
                c.Address.CountryCode = request.CountryCode ?? c.Address.CountryCode;
                c.Address.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        await _repo.SaveChangesAsync();

        return MapToDto(c);
    }

    public async Task<bool> DeleteCustomerAsync(int userId, int id)
    {
        var c = await _repo.GetByIdAsync(userId, id);
        if (c == null) return false;

        c.DeletedAt = DateTimeOffset.UtcNow;
        await _repo.SaveChangesAsync();
        return true;
    }

    private static CustomerDto MapToDto(Customer c)
    {
        return new CustomerDto
        {
            Id = c.Id,
            Name = c.Name,
            Ico = c.Ico,
            Dic = c.Dic,
            LegalForm = c.LegalForm,
            Email = c.Email,
            Phone = c.Phone,
            Note = c.Note,
            AddressLine1 = c.Address?.AddressLine1,
            AddressLine2 = c.Address?.AddressLine2,
            City = c.Address?.City,
            Zip = c.Address?.Zip,
            CountryCode = c.Address?.CountryCode
        };
    }
}
