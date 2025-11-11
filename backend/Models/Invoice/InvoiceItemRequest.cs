using System.ComponentModel.DataAnnotations;

public class InvoiceItemRequest
{
    [Required]
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    [Range(0.0001, 999999999)]
    public decimal Quantity { get; set; }

    [Required]
    public string Unit { get; set; } = "ks";

    [Range(0, 999999999)]
    public decimal UnitPrice { get; set; }

    public decimal? VatRate { get; set; }

    [Range(0, 999999999)]
    public decimal Discount { get; set; } = 0;
}