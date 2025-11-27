using System.Text.Json.Serialization;

namespace backend.DTOs.Ares
{
    public class AresSearchItemDto
    {
        [JsonPropertyName("companyId")]
        public string CompanyId { get; set; } = default!;

        [JsonPropertyName("businessName")]
        public string BusinessName { get; set; } = default!;

        [JsonPropertyName("fullAddress")]
        public string? FullAddress { get; set; }

        [JsonPropertyName("legalForm")]
        public string? LegalForm { get; set; }
    }
}
