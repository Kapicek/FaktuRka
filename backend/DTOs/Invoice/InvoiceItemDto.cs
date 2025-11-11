public class InvoiceItemDto
{
    public int Id { get; set; }
    public int OrderNo { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "ks";
    public decimal UnitPrice { get; set; }
    public decimal? VatRate { get; set; }
    public decimal Discount { get; set; }
    public decimal LineSubtotal { get; set; }
    public decimal LineVat { get; set; }
    public decimal LineTotal { get; set; }
}