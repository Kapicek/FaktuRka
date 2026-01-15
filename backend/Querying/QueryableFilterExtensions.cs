using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace backend.Querying
{
    public static class QueryableFilterExtensions
    {
        public static IQueryable<T> WhereIf<T>(
            this IQueryable<T> source,
            bool condition,
            Expression<Func<T, bool>> predicate)
            => condition ? source.Where(predicate) : source;

        public static IQueryable<T> ApplyPaging<T>(this IQueryable<T> query, int page, int pageSize)
            => query.Skip((page - 1) * pageSize).Take(pageSize);

        public static IQueryable<T> WhereLikeIf<T>(
            this IQueryable<T> query,
            string? value,
            Expression<Func<T, string?>> property)
        {
            if (string.IsNullOrWhiteSpace(value))
                return query;

            var pattern = $"%{value.Trim()}%";

            var param = property.Parameters[0];
            var propBody = property.Body;

            var efFunctions = Expression.Property(null, typeof(EF), nameof(EF.Functions));
            var likeMethod = typeof(DbFunctionsExtensions)
                .GetMethods()
                .Single(m => m.Name == nameof(DbFunctionsExtensions.Like)
                             && m.GetParameters().Length == 3
                             && m.GetParameters()[1].ParameterType == typeof(string));

            var call = Expression.Call(
                likeMethod,
                efFunctions,
                propBody,
                Expression.Constant(pattern));

            var lambda = Expression.Lambda<Func<T, bool>>(call, param);
            return query.Where(lambda);
        }

        public static IQueryable<T> WhereContainsIf<T>(
            this IQueryable<T> query,
            string? value,
            Expression<Func<T, string?>> property)
        {
            if (string.IsNullOrWhiteSpace(value))
                return query;

            var needle = value.Trim();

            var param = property.Parameters[0];
            var body = property.Body;

            var contains = typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!;
            var notNull = Expression.NotEqual(body, Expression.Constant(null, typeof(string)));
            var call = Expression.Call(body, contains, Expression.Constant(needle));

            var predicate = Expression.AndAlso(notNull, call);
            return query.Where(Expression.Lambda<Func<T, bool>>(predicate, param));
        }
    }
}
