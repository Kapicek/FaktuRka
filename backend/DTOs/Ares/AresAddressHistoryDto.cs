using System.Text.Json.Serialization;

namespace backend.DTOs.Ares
{
    public class AresAddressHistoryDto
    {
        [JsonPropertyName("sidlo")]
        public AresAddressDto Address { get; set; }

        [JsonPropertyName("primarniZaznam")]
        public bool IsPrimary { get; set; }

        [JsonPropertyName("platnostOd")]
        public DateTime? ValidFrom { get; set; }

        [JsonPropertyName("platnostDo")]
        public DateTime? ValidTo { get; set; }
    }
}
