using System.Text.Json.Serialization;

namespace backend.DTOs.Ares
{
    public class AresDeliveryAddressDto
    {
        [JsonPropertyName("radekAdresy1")]
        public string Line1 { get; set; }

        [JsonPropertyName("radekAdresy2")]
        public string Line2 { get; set; }

        [JsonPropertyName("radekAdresy3")]
        public string Line3 { get; set; }
    }
}
