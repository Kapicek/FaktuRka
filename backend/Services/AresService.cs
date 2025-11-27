using backend.DTOs.Ares;
using backend.Services.Abstraction;
using System;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace backend.Services
{
    public class AresService : IAresService
    {
        private const string BaseUrl = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";

        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions;

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
            {
                return null;
            }

            if (response.StatusCode == HttpStatusCode.BadRequest)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new ArgumentException($"ARES returned 400 Bad Request: {errorBody}");
            }

            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);

            var subject = await JsonSerializer.DeserializeAsync<AresSubjectDto>(
                stream,
                _jsonOptions,
                cancellationToken
            );

            return subject;
        }
    }
}
