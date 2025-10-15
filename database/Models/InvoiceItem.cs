using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace database.Models;

public class InvoiceItem
{
    [Key]
    public int Id { get; set; }

    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = default!;

    public int OrderNo { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    [Precision(12, 3)] public decimal Quantity { get; set; }
    public string Unit { get; set; } = "ks";
    [Precision(14, 2)] public decimal UnitPrice { get; set; }
    [Precision(5, 2)] public decimal? VatRate { get; set; }
    [Precision(14, 2)] public decimal Discount { get; set; }

    [Precision(14, 2)] public decimal LineSubtotal { get; set; }
    [Precision(14, 2)] public decimal LineVat { get; set; }
    [Precision(14, 2)] public decimal LineTotal { get; set; }
}
