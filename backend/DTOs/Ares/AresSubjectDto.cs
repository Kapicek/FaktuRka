using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace backend.DTOs.Ares
{
    public class AresSubjectDto
    {
        [JsonPropertyName("ico")]
        public string CompanyId { get; set; }

        [JsonPropertyName("obchodniJmeno")]
        public string BusinessName { get; set; }

        [JsonPropertyName("sidlo")]
        public AresAddressDto Address { get; set; }

        [JsonPropertyName("pravniForma")]
        public string LegalForm { get; set; }

        [JsonPropertyName("financniUrad")]
        public string TaxOffice { get; set; }

        [JsonPropertyName("datumVzniku")]
        public DateTime? CreatedAt { get; set; }

        [JsonPropertyName("datumZaniku")]
        public DateTime? TerminatedAt { get; set; }

        [JsonPropertyName("datumAktualizace")]
        public DateTime? UpdatedAt { get; set; }

        [JsonPropertyName("dic")]
        public string VatId { get; set; }

        [JsonPropertyName("icoId")]
        public string InternalId { get; set; }

        [JsonPropertyName("adresaDorucovaci")]
        public AresDeliveryAddressDto DeliveryAddress { get; set; }

        [JsonPropertyName("seznamRegistraci")]
        public AresRegistrationStatusDto RegistrationStatus { get; set; }

        [JsonPropertyName("primarniZdroj")]
        public string PrimarySource { get; set; }

        [JsonPropertyName("dalsiUdaje")]
        public List<AresAdditionalDataDto> AdditionalData { get; set; }

        [JsonPropertyName("czNace")]
        public List<string> NaceCodes { get; set; }

        [JsonPropertyName("subRegistrSzr")]
        public string SubRegisterSzr { get; set; }

        [JsonPropertyName("dicSkDph")]
        public string SlovakVatId { get; set; }
    }
}
