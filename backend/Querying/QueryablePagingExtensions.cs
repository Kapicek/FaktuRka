using backend.Models.Common;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace backend.Querying
{
    public static class QueryablePagingExtensions
    {
        public static async Task<PagedResult<TDto>> ToPagedResultAsync<TEntity, TDto>(
            this IQueryable<TEntity> query,
            int page,
            int pageSize,
            Expression<Func<TEntity, TDto>> selector,
            CancellationToken ct = default)
        {
            if (page <= 0) throw new ArgumentOutOfRangeException(nameof(page));
            if (pageSize <= 0) throw new ArgumentOutOfRangeException(nameof(pageSize));

            var total = await query.CountAsync(ct);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(selector)
                .ToListAsync(ct);

            return new PagedResult<TDto>
            {
                Items = items,
                TotalCount = total
            };
        }
    }
}
