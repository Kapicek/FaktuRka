using System;
using System.Text.Json.Serialization;

namespace backend.DTOs.Ares
{
    public class AresAddressDto
    {
        [JsonPropertyName("kodStatu")]
        public string? CountryCode { get; set; }

        [JsonPropertyName("nazevStatu")]
        public string? CountryName { get; set; }

        [JsonPropertyName("kodKraje")]
        public int? RegionCode { get; set; }

        [JsonPropertyName("nazevKraje")]
        public string? RegionName { get; set; }

        [JsonPropertyName("kodOkresu")]
        public int? DistrictCode { get; set; }

        [JsonPropertyName("nazevOkresu")]
        public string? DistrictName { get; set; }

        [JsonPropertyName("kodObce")]
        public int? MunicipalityCode { get; set; }

        [JsonPropertyName("nazevObce")]
        public string? MunicipalityName { get; set; }

        [JsonPropertyName("kodSpravnihoObvodu")]
        public int? AdministrativeAreaCode { get; set; }

        [JsonPropertyName("nazevSpravnihoObvodu")]
        public string? AdministrativeAreaName { get; set; }

        [JsonPropertyName("kodMestskehoObvodu")]
        public int? CityDistrictCode { get; set; }

        [JsonPropertyName("nazevMestskehoObvodu")]
        public string? CityDistrictName { get; set; }

        [JsonPropertyName("kodMestskeCastiObvodu")]
        public int? CityPartCode { get; set; }

        [JsonPropertyName("kodUlice")]
        public int? StreetCode { get; set; }

        [JsonPropertyName("nazevMestskeCastiObvodu")]
        public string? CityPartName { get; set; }

        [JsonPropertyName("nazevUlice")]
        public string? StreetName { get; set; }

        [JsonPropertyName("cisloDomovni")]
        public int? HouseNumber { get; set; }

        [JsonPropertyName("doplnekAdresy")]
        public string? AddressSupplement { get; set; }

        [JsonPropertyName("kodCastiObce")]
        public int? LocalityCode { get; set; }

        [JsonPropertyName("cisloOrientacni")]
        public int? OrientationNumber { get; set; }

        [JsonPropertyName("cisloOrientacniPismeno")]
        public string? OrientationLetter { get; set; }

        [JsonPropertyName("nazevCastiObce")]
        public string? LocalityName { get; set; }

        [JsonPropertyName("kodAdresnihoMista")]
        public long? AddressPlaceCode { get; set; }

        [JsonPropertyName("psc")]
        public int? ZipCode { get; set; }

        [JsonPropertyName("textovaAdresa")]
        public string? FullAddress { get; set; }

        [JsonPropertyName("cisloDoAdresy")]
        public string? AddressNumber { get; set; }

        [JsonPropertyName("standardizaceAdresy")]
        public bool? IsStandardized { get; set; }

        [JsonPropertyName("pscTxt")]
        public string? ZipCodeText { get; set; }

        [JsonPropertyName("typCisloDomovni")]
        public int? HouseNumberType { get; set; }
    }
}
