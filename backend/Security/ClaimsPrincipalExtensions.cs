using System.Security.Claims;

namespace backend.Infrastructure;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue("sub");

        if (string.IsNullOrEmpty(sub))
            throw new InvalidOperationException("User id missing in token.");

        return int.Parse(sub);
    }
}
