using backend.Models.Common;

namespace backend.Models.Customers;

public class CustomerListQuery : IPagedListQuery
{
    public string? Name { get; set; }
    public string? Ico { get; set; }
    public string? Dic { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? CountryCode { get; set; }

    public string SortBy { get; set; } = "Name";
    public bool Desc { get; set; } = false;

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
