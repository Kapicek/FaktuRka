using backend.DTOs.Ares;
using backend.Services.Abstraction;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace backend.Services
{
    public class AresService : IAresService
    {
        private const string BaseUrl = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";

        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions;

        private const int MaxAllowedResults = 1000;
        private const int DefaultLimit = 10;

        public AresService(HttpClient httpClient)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<AresSubjectDto?> GetByIcoAsync(string ico, CancellationToken cancellationToken = default)
        {
            var response = await _httpClient.GetAsync($"{BaseUrl}/{ico}", cancellationToken);

            if (response.StatusCode == HttpStatusCode.NotFound)
                return null;

            if (response.StatusCode == HttpStatusCode.BadRequest)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new ArgumentException($"ARES returned 400 Bad Request: {errorBody}");
            }

            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);

            var subject = await JsonSerializer.DeserializeAsync<AresSubjectDto>(stream, _jsonOptions, cancellationToken);

            return subject;
        }

        public async Task<IReadOnlyList<AresSearchItemDto>> SearchByNameAsync(string name, int limit = DefaultLimit, CancellationToken cancellationToken = default)
        {
            if (limit <= 0 || limit > MaxAllowedResults)
                limit = DefaultLimit;

            var requestObject = new
            {
                start = 0,
                pocet = limit,
                obchodniJmeno = name
            };

            var json = JsonSerializer.Serialize(requestObject, _jsonOptions);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{BaseUrl}/vyhledat", content, cancellationToken);

            if (response.StatusCode == HttpStatusCode.BadRequest)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);

                var error = JsonSerializer.Deserialize<AresErrorResponseDto>(errorBody, _jsonOptions);

                if (string.Equals(error?.SubCode, "VYSTUP_PRILIS_MNOHO_VYSLEDKU", StringComparison.OrdinalIgnoreCase))
                    return Array.Empty<AresSearchItemDto>();

                throw new ArgumentException($"ARES search returned 400 Bad Request: {errorBody}");
            }


            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);

            var searchResponse = await JsonSerializer.DeserializeAsync<AresSearchResponseDto>(stream, _jsonOptions, cancellationToken);

            var result = new List<AresSearchItemDto>();

            if (searchResponse?.Subjects != null)
            {
                foreach (var s in searchResponse.Subjects)
                {
                    if (s == null) continue;

                    result.Add(new AresSearchItemDto
                    {
                        CompanyId = s.CompanyId,
                        BusinessName = s.BusinessName,
                        FullAddress = s.Address?.FullAddress,
                        LegalForm = s.LegalForm
                    });
                }
            }

            return result;
        }
        #region AresDtos
        private class AresErrorResponseDto
        {
            [JsonPropertyName("kod")]
            public string? Code { get; set; }

            [JsonPropertyName("subKod")]
            public string? SubCode { get; set; }

            [JsonPropertyName("popis")]
            public string? Description { get; set; }
        }

        private class AresSearchResponseDto
        {
            [JsonPropertyName("pocetCelkem")]
            public int TotalCount { get; set; }

            [JsonPropertyName("ekonomickeSubjekty")]
            public List<AresSubjectDto>? Subjects { get; set; }
        }
        #endregion
    }
}
