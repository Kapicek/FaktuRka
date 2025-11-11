using database;
using database.Models;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public async Task<AuthResultDto> LoginWithGoogleAsync(string idToken)
    {
        var googleClientId = _configuration["GoogleAuth:ClientId"]
            ?? throw new InvalidOperationException("GoogleAuth:ClientId not configured");

        // Validace ze strany googlu
        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { googleClientId }
        });

        var googleId = payload.Subject;
        var email = payload.Email;
        var firstName = payload.GivenName ?? "";
        var lastName = payload.FamilyName ?? "";
        var fullName = payload.Name ?? $"{firstName} {lastName}".Trim();
        var picture = payload.Picture;

        // Pokud usera nemáme u nás, vytvoříme -> jinak použijeme existujícího
        var user = await _userRepository.GetByGoogleIdAsync(googleId);

        if (user == null)
        {
            user = await _userRepository.GetByEmailAsync(email);

            if (user == null)
            {
                user = new User
                {
                    Email = email,
                    FirstName = string.IsNullOrWhiteSpace(firstName) ? fullName : firstName,
                    LastName = lastName,
                    GoogleId = googleId,
                    AuthProvider = "Google",
                    AvatarUrl = picture
                };

                await _userRepository.AddAsync(user);
            }
            else
            {
                user.GoogleId = googleId;
                user.AuthProvider = "Google";
                user.AvatarUrl = picture;
                await _userRepository.SaveChangesAsync();
            }
        }
        else
        {
            if (user.Email != email)
                user.Email = email;

            user.AvatarUrl = picture ?? user.AvatarUrl;
            await _userRepository.SaveChangesAsync();
        }

        // vytvoří se JWT
        var jwtSection = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expires = DateTime.UtcNow.AddMinutes(int.Parse(jwtSection["AccessTokenLifetimeMinutes"] ?? "60"));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("name", $"{user.FirstName} {user.LastName}".Trim()),
            new("provider", user.AuthProvider)
            // tady pak dodělám claimy more
        };

        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthResultDto
        {
            Token = tokenString,
            ExpiresAt = expires,
            UserId = user.Id,
            Email = user.Email,
            FullName = $"{user.FirstName} {user.LastName}".Trim()
        };
    }
}
