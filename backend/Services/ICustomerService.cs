namespace backend.Services;

public interface ICustomerService
{
    Task<List<CustomerListItemDto>> GetCustomersAsync(int userId, string? search);
    Task<CustomerDto?> GetCustomerAsync(int userId, int id);
    Task<CustomerDto> CreateCustomerAsync(int userId, CustomerCreateRequest request);
    Task<CustomerDto?> UpdateCustomerAsync(int userId, int id, CustomerUpdateRequest request);
    Task<bool> DeleteCustomerAsync(int userId, int id);
}
