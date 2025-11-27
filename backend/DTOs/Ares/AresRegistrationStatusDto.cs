using System.Text.Json.Serialization;

namespace backend.DTOs.Ares
{
    public class AresRegistrationStatusDto
    {
        [JsonPropertyName("stavZdrojeVr")]
        public string VrStatus { get; set; }

        [JsonPropertyName("stavZdrojeRes")]
        public string ResStatus { get; set; }

        [JsonPropertyName("stavZdrojeRzp")]
        public string RzpStatus { get; set; }

        [JsonPropertyName("stavZdrojeNrpzs")]
        public string NrpzsStatus { get; set; }

        [JsonPropertyName("stavZdrojeRpsh")]
        public string RpshStatus { get; set; }

        [JsonPropertyName("stavZdrojeRcns")]
        public string RcnsStatus { get; set; }

        [JsonPropertyName("stavZdrojeSzr")]
        public string SzrStatus { get; set; }

        [JsonPropertyName("stavZdrojeDph")]
        public string VatStatus { get; set; }

        [JsonPropertyName("stavZdrojeSd")]
        public string SdStatus { get; set; }

        [JsonPropertyName("stavZdrojeIr")]
        public string IrStatus { get; set; }

        [JsonPropertyName("stavZdrojeCeu")]
        public string CeuStatus { get; set; }

        [JsonPropertyName("stavZdrojeRs")]
        public string RsStatus { get; set; }

        [JsonPropertyName("stavZdrojeRed")]
        public string RedStatus { get; set; }

        [JsonPropertyName("stavZdrojeMonitor")]
        public string MonitorStatus { get; set; }
    }
}
