using backend.Repositories;
using database;
using database.Models;

namespace backend.Services;

public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _repo;

    public CustomerService(ICustomerRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<CustomerListItemDto>> GetCustomersAsync(int userId, string? search)
    {
        var customers = await _repo.GetAllAsync(userId, search);

        return customers.Select(c => new CustomerListItemDto
        {
            Id = c.Id,
            Name = c.Name,
            Ico = c.Ico,
            Email = c.Email,
            City = c.Address?.City
        }).ToList();
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
