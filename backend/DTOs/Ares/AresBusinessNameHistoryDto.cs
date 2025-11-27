using System.Text.Json.Serialization;

namespace backend.DTOs.Ares
{
    public class AresBusinessNameHistoryDto
    {
        [JsonPropertyName("platnostOd")]
        public DateTime? ValidFrom { get; set; }

        [JsonPropertyName("platnostDo")]
        public DateTime? ValidTo { get; set; }

        [JsonPropertyName("obchodniJmeno")]
        public string? BusinessName { get; set; }

        [JsonPropertyName("primarniZaznam")]
        public bool IsPrimary { get; set; }
    }
}
