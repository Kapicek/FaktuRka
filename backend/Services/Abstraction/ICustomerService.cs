using backend.Models.Common;
using backend.Models.Customers;

namespace backend.Services.Abstraction;

public interface ICustomerService
{
    Task<PagedResult<CustomerListItemDto>> GetCustomersAsync(int userId, CustomerListQuery q);
    Task<CustomerDto?> GetCustomerAsync(int userId, int id);
    Task<CustomerDto> CreateCustomerAsync(int userId, CustomerCreateRequest request);
    Task<CustomerDto?> UpdateCustomerAsync(int userId, int id, CustomerUpdateRequest request);
    Task<bool> DeleteCustomerAsync(int userId, int id);
}
