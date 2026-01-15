namespace backend.Models.Common;

public interface IPagedListQuery
{
    int Page { get; }
    int PageSize { get; }
    string? SortBy { get; }
    bool Desc { get; }
}
