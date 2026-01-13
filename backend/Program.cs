using backend.Repositories;
using backend.Services;
using backend.Services.Abstraction;
using database;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.IdentityModel.Tokens.Jwt;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FaktuRka API",
        Version = "v1"
    });

    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Zadej JWT token ve form�tu: Bearer {token}",
        Reference = new OpenApiReference
        {
            Id = "Bearer",
            Type = ReferenceType.SecurityScheme
        }
    };

    c.AddSecurityDefinition("Bearer", jwtSecurityScheme);

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, Array.Empty<string>() }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("JWT Key missing");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
var allowedOrigins = new[]
{
    "https://localhost:7121",
    "http://localhost:5232",
    "http://localhost:5173",
    "https://localhost:5173",
    "http://127.0.0.1:5173",
    "http://[::1]:5173"
};
QuestPDF.Settings.License = LicenseType.Community;


builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
.AddJwtBearer(options =>
{
    options.SaveToken = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidIssuer = jwtSection["Issuer"],
        ValidAudience = jwtSection["Audience"],
        IssuerSigningKey = signingKey,
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        RoleClaimType = ClaimTypes.Role,
    };

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var principal = context.Principal;
            if (principal is null)
            {
                context.Fail("No principal.");
                return;
            }

            var userIdStr =
                principal.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
                principal.FindFirstValue(ClaimTypes.NameIdentifier);

            var tvStr = principal.FindFirstValue("tv");

            if (string.IsNullOrWhiteSpace(userIdStr) || string.IsNullOrWhiteSpace(tvStr))
            {
                context.Fail("Missing required claims.");
                return;
            }

            if (!int.TryParse(userIdStr, out var userId) || !int.TryParse(tvStr, out var tokenVersion))
            {
                context.Fail("Invalid claims.");
                return;
            }

            var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();

            var currentVersion = await db.Users
                .Where(u => u.Id == userId)
                .Select(u => u.TokenVersion)
                .SingleOrDefaultAsync();

            var exists = await db.Users.AnyAsync(u => u.Id == userId);
            if (!exists)
            {
                context.Fail("User not found.");
                return;
            }

            if (currentVersion != tokenVersion)
            {
                context.Fail("Token revoked.");
                return;
            }
        }
    };
});

builder.Services.AddAuthorization();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<IInvoiceSequenceRepository, InvoiceSequenceRepository>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IUserAdminService, UserAdminService>();
builder.Services.AddScoped<IEmailService, EmailService>();

builder.Services.AddHttpClient<IAresService, AresService>((sp, client) =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    client.BaseAddress = new Uri(config["Ares:BaseUrl"]!);
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
