using backend.DTOs.Auth;
using backend.Services.Abstraction;
using database;
using database.Models;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace backend.Services;
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    // Parametry pro hashování hesel
    // Password hash je PBKDF2 (Rfc2898DeriveBytes) s HMAC-SHA256,
    // 100 000 iterací, 16 bajtů náhodné soli a 32 bajtů výsledného klíče.
    // Ukládáme Base64(hash) a Base64(salt), heslo v plaintextu NIKDY.
    private const int PasswordSaltSize = 16;        // 16 bytes = 128 bit
    private const int PasswordKeySize = 32;         // 32 bytes = 256 bit
    private const int PasswordIterations = 100_000;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    protected virtual Task<GoogleJsonWebSignature.Payload> ValidateGoogleTokenAsync(string idToken, string googleClientId)
    {
        return GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { googleClientId }
        });
    }

    public async Task<AuthResultDto> LoginWithGoogleAsync(string idToken)
    {
        var googleClientId = _configuration["GoogleAuth:ClientId"]
            ?? throw new InvalidOperationException("GoogleAuth:ClientId not configured");

        // Validace ze strany googlu
        var payload = await ValidateGoogleTokenAsync(idToken, googleClientId);

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

        return GenerateAuthResult(user);
    }

    public async Task<AuthResultDto> RegisterAsync(RegisterRequestDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        // základní validace – můžeš zpřísnit (min délka hesla, regexp na email atd.)
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.");
        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Password is required.");
        if (request.Password.Length < 8)
            throw new ArgumentException("Password must be at least 8 characters long.");

        var existingUser = await _userRepository.GetByEmailAsync(email);

        if (existingUser != null)
        {
            // Lokál existuje
            if (!string.IsNullOrEmpty(existingUser.PasswordHash))
                throw new InvalidOperationException("User with this email already exists.");

            // Uživatel existuje jen přes Google -> přidáme mu lokální heslo
            var (hash, salt) = HashPassword(request.Password);
            existingUser.PasswordHash = hash;
            existingUser.PasswordSalt = salt;

            // Todo jak jsem psal u usera, tady je potřeba to předělat potom na enum -> teď jsem na to byl moc línej
            existingUser.AuthProvider = "Google,Local";

            await _userRepository.SaveChangesAsync();

            return GenerateAuthResult(existingUser);
        }

        // Nový user
        var (passwordHash, passwordSalt) = HashPassword(request.Password);

        var user = new User
        {
            Email = email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            PasswordHash = passwordHash,
            PasswordSalt = passwordSalt,
            AuthProvider = "Local",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await _userRepository.AddAsync(user);

        return GenerateAuthResult(user);
    }

    public async Task<AuthResultDto> LoginAsync(LoginRequestDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Email and password are required.");

        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null)
            throw new UnauthorizedAccessException("Invalid credentials.");

        if (string.IsNullOrEmpty(user.PasswordHash) || string.IsNullOrEmpty(user.PasswordSalt))
            throw new UnauthorizedAccessException("This account does not have a local password. Use Google login.");

        if (!VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt))
            throw new UnauthorizedAccessException("Invalid credentials.");

        // aktualizace UpdatedAt
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _userRepository.SaveChangesAsync();

        return GenerateAuthResult(user);
    }

    #region helpers
    private AuthResultDto GenerateAuthResult(User user)
    {
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
            // todo sem pak hodim rolex (nebo taky role)
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
            Profile = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = $"{user.FirstName} {user.LastName}".Trim(),
                CompanyName = user.CompanyName,
                Ico = user.Ico,
                Dic = user.Dic,
                VatPayer = user.VatPayer,
                AvatarUrl = user.AvatarUrl
            }
        };
    }

    private (string hash, string salt) HashPassword(string password)
    {
        using var rng = RandomNumberGenerator.Create();
        var saltBytes = new byte[PasswordSaltSize];
        rng.GetBytes(saltBytes);

        using var pbkdf2 = new Rfc2898DeriveBytes(
            password,
            saltBytes,
            PasswordIterations,
            HashAlgorithmName.SHA256);

        var keyBytes = pbkdf2.GetBytes(PasswordKeySize);

        var hash = Convert.ToBase64String(keyBytes);
        var salt = Convert.ToBase64String(saltBytes);

        return (hash, salt);
    }

    private bool VerifyPassword(string password, string storedHash, string storedSalt)
    {
        var saltBytes = Convert.FromBase64String(storedSalt);

        using var pbkdf2 = new Rfc2898DeriveBytes(
            password,
            saltBytes,
            PasswordIterations,
            HashAlgorithmName.SHA256);

        var keyBytes = pbkdf2.GetBytes(PasswordKeySize);
        var computedHash = Convert.ToBase64String(keyBytes);

        // fixní čas kvůli side-channel útokům
        return CryptographicOperations.FixedTimeEquals(
            Convert.FromBase64String(storedHash),
            Convert.FromBase64String(computedHash));
    }

    #endregion

}
