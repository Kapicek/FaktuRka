using System.Linq.Expressions;

namespace backend.Querying
{
    public static class QueryableSortingExtensions
    {
        public static IQueryable<T> ApplySorting<T>(
            this IQueryable<T> query,
            string? sortBy,
            bool desc,
            IReadOnlyDictionary<string, LambdaExpression> map,
            string defaultSortKey)
        {
            if (string.IsNullOrWhiteSpace(defaultSortKey))
                throw new ArgumentException("defaultSortKey is required.", nameof(defaultSortKey));

            if (!map.ContainsKey(defaultSortKey))
                throw new ArgumentException($"defaultSortKey '{defaultSortKey}' is not present in map.");

            var key = (!string.IsNullOrWhiteSpace(sortBy) && map.ContainsKey(sortBy))
                ? sortBy!
                : defaultSortKey;

            var lambda = map[key];
            var keyType = lambda.ReturnType;

            var methodName = desc ? nameof(Queryable.OrderByDescending) : nameof(Queryable.OrderBy);

            var method = typeof(Queryable)
                .GetMethods()
                .Single(m => m.Name == methodName
                             && m.GetParameters().Length == 2);

            var generic = method.MakeGenericMethod(typeof(T), keyType);

            return (IQueryable<T>)generic.Invoke(null, new object[] { query, lambda })!;
        }
    }
}
