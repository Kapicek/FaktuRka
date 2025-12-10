namespace backend.Models.Invoice
{
    public class InvoiceExportResult
    {
        public string FileName { get; set; } = default!;
        public string ContentType { get; set; } = "application/pdf";
        public byte[] Content { get; set; } = default!;
    }
}
