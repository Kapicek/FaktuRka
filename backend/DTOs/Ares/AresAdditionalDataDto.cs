using System.Text.Json.Serialization;

namespace backend.DTOs.Ares
{
    public class AresAdditionalDataDto
    {
        [JsonPropertyName("obchodniJmeno")]
        public List<AresBusinessNameHistoryDto> BusinessNameHistory { get; set; }

        [JsonPropertyName("sidlo")]
        public List<AresAddressHistoryDto> AddressHistory { get; set; }

        [JsonPropertyName("pravniForma")]
        public string LegalForm { get; set; }

        [JsonPropertyName("spisovaZnacka")]
        public string RegistryNumber { get; set; }

        [JsonPropertyName("datovyZdroj")]
        public string DataSource { get; set; }
    }
}
