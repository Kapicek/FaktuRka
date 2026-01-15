using backend.Models.Common;
using System.Linq.Expressions;

namespace backend.Querying
{
    public static class QueryPipeline
    {
        public static Task<PagedResult<TDto>> ExecuteAsync<TEntity, TDto>(
            IQueryable<TEntity> query,
            IPagedListQuery q,
            IReadOnlyDictionary<string, LambdaExpression> sortMap,
            string defaultSortKey,
            Expression<Func<TEntity, TDto>> selector,
            CancellationToken ct = default)
        {
            query = query.ApplySorting(q.SortBy, q.Desc, sortMap, defaultSortKey);
            return query.ToPagedResultAsync(q.Page, q.PageSize, selector, ct);
        }
    }
}
