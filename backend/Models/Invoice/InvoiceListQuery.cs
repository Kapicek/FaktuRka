using database.Models.Enums;

namespace backend.Models.Invoice
{
    public class InvoiceListQuery
    {
        public int? CustomerId { get; set; }
        public InvoiceStatus? Status { get; set; }

        public DateOnly? IssueDateFrom { get; set; }
        public DateOnly? IssueDateTo { get; set; }

        public DateOnly? DueDateFrom { get; set; }
        public DateOnly? DueDateTo { get; set; }

        public string? Number { get; set; }
        public string? CustomerName { get; set; }
        public string? Currency { get; set; }

        public decimal? TotalMin { get; set; }
        public decimal? TotalMax { get; set; }

        public string SortBy { get; set; } = "IssueDate";
        public bool Desc { get; set; } = true;

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }


}
