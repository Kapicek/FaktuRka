using backend.Models.Common;
using backend.Models.Customers;
using backend.Querying;
using backend.Repositories;
using backend.Services.Abstraction;
using database;
using database.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace backend.Services;

public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _repo;

    public CustomerService(ICustomerRepository repo)
    {
        _repo = repo;
    }

    private static readonly IReadOnlyDictionary<string, LambdaExpression> CustomerSortMap =
        new Dictionary<string, LambdaExpression>(StringComparer.OrdinalIgnoreCase)
        {
            ["name"] = (Expression<Func<Customer, string>>)(c => c.Name),
            ["ico"] = (Expression<Func<Customer, string?>>)(c => c.Ico),
            ["email"] = (Expression<Func<Customer, string?>>)(c => c.Email),
            ["city"] = (Expression<Func<Customer, string?>>)(c => c.Address!.City),
            ["createdAt"] = (Expression<Func<Customer, DateTimeOffset>>)(c => c.CreatedAt),
        };

    public async Task<PagedResult<CustomerListItemDto>> GetCustomersAsync(int userId, CustomerListQuery q)
    {
        var query = _repo.Query(userId);

        query = query
            .WhereLikeIf(q.Name, c => c.Name)
            .WhereContainsIf(q.Ico, c => c.Ico)
            .WhereContainsIf(q.Dic, c => c.Dic)
            .WhereLikeIf(q.Email, c => c.Email)
            .WhereContainsIf(q.Phone, c => c.Phone)
            .WhereLikeIf(q.City, c => c.Address != null ? c.Address.City : null)
            .WhereIf(!string.IsNullOrWhiteSpace(q.CountryCode),
                c => c.Address != null && c.Address.CountryCode == q.CountryCode!.Trim());

        return await QueryPipeline.ExecuteAsync(
            query,
            q,
            CustomerSortMap,
            defaultSortKey: "name",
            selector: c => new CustomerListItemDto
            {
                Id = c.Id,
                Name = c.Name,
                Ico = c.Ico,
                Email = c.Email,
                City = c.Address != null ? c.Address.City : null
            });
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
