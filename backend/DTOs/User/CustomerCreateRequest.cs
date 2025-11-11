public class CustomerCreateRequest
{
    public string Name { get; set; } = default!;
    public string? Ico { get; set; }
    public string? Dic { get; set; }
    public string? LegalForm { get; set; }

    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Note { get; set; }

    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? Zip { get; set; }
    public string? CountryCode { get; set; } = "CZ";
}