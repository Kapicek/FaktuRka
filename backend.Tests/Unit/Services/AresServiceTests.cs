using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using backend.DTOs.Ares;
using backend.Services;
using Moq;
using Moq.Protected;
using Xunit;

namespace backend.Tests.Unit.Services
{
    public class AresServiceTests
    {
        private static AresService CreateService(
            HttpResponseMessage response,
            out Mock<HttpMessageHandler> handlerMock,
            Action<HttpRequestMessage>? onRequest = null)
        {
            handlerMock = new Mock<HttpMessageHandler>();

            handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .Callback<HttpRequestMessage, CancellationToken>((req, ct) => onRequest?.Invoke(req))
                .ReturnsAsync(response);

            var client = new HttpClient(handlerMock.Object);
            return new AresService(client);
        }

        #region GetByIcoAsync

        [Fact]
        public async Task GetByIcoAsync_ReturnsNull_WhenStatusNotFound()
        {
            var response = new HttpResponseMessage(HttpStatusCode.NotFound);
            var service = CreateService(response, out _, null);

            var result = await service.GetByIcoAsync("12345678", CancellationToken.None);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetByIcoAsync_ThrowsArgumentException_WhenStatusBadRequest()
        {
            const string body = "some error from ARES";
            var response = new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent(body, Encoding.UTF8, "text/plain")
            };

            var service = CreateService(response, out _, null);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                service.GetByIcoAsync("12345678", CancellationToken.None));

            Assert.Contains("ARES returned 400 Bad Request", ex.Message);
            Assert.Contains(body, ex.Message);
        }

        [Fact]
        public async Task GetByIcoAsync_ReturnsSubject_WhenStatusOk()
        {
            var dto = new AresSubjectDto
            {
                CompanyId = "12345678",
                BusinessName = "Test Company"
            };

            var json = JsonSerializer.Serialize(dto, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            HttpRequestMessage? capturedRequest = null;

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            var service = CreateService(response, out var handlerMock, req => capturedRequest = req);

            var result = await service.GetByIcoAsync("12345678", CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("12345678", result!.CompanyId);
            Assert.Equal("Test Company", result.BusinessName);

            Assert.NotNull(capturedRequest);
            Assert.Equal(HttpMethod.Get, capturedRequest!.Method);
            Assert.Contains("/12345678", capturedRequest.RequestUri!.ToString());

            handlerMock.Protected().Verify(
                "SendAsync",
                Times.Once(),
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>());
        }

        [Fact]
        public async Task GetByIcoAsync_ThrowsHttpRequestException_OnOtherErrorStatus()
        {
            var response = new HttpResponseMessage(HttpStatusCode.InternalServerError)
            {
                Content = new StringContent("server error", Encoding.UTF8, "text/plain")
            };

            var service = CreateService(response, out _, null);

            await Assert.ThrowsAsync<HttpRequestException>(() =>
                service.GetByIcoAsync("12345678", CancellationToken.None));
        }

        #endregion

        #region SearchByNameAsync

        [Fact]
        public async Task SearchByNameAsync_NormalizesLimit_WhenOutOfRange()
        {
            var responseBody = JsonSerializer.Serialize(new
            {
                pocetCelkem = 0,
                ekonomickeSubjekty = Array.Empty<object>()
            });

            HttpRequestMessage? capturedRequest = null;

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseBody, Encoding.UTF8, "application/json")
            };

            var service = CreateService(response, out _, req => capturedRequest = req);

            var result = await service.SearchByNameAsync("Test", -5, CancellationToken.None);

            Assert.NotNull(result);
            Assert.Empty(result);

            Assert.NotNull(capturedRequest);
            Assert.Equal(HttpMethod.Post, capturedRequest!.Method);
            Assert.Contains("/vyhledat", capturedRequest.RequestUri!.ToString());
        }

        [Fact]
        public async Task SearchByNameAsync_ReturnsEmpty_WhenBadRequestTooManyResults()
        {
            var errorJson = JsonSerializer.Serialize(new
            {
                kod = "ERR",
                subKod = "VYSTUP_PRILIS_MNOHO_VYSLEDKU",
                popis = "Too many results"
            });

            var response = new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent(errorJson, Encoding.UTF8, "application/json")
            };

            var service = CreateService(response, out _, null);

            var result = await service.SearchByNameAsync("Test", 5, CancellationToken.None);

            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact]
        public async Task SearchByNameAsync_ThrowsArgumentException_WhenBadRequestWithOtherError()
        {
            const string message = "Some other error";
            var errorJson = JsonSerializer.Serialize(new
            {
                kod = "ERR",
                subKod = "NECO_JINEHO",
                popis = message
            });

            var response = new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent(errorJson, Encoding.UTF8, "application/json")
            };

            var service = CreateService(response, out _, null);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                service.SearchByNameAsync("Test", 5, CancellationToken.None));

            Assert.Contains("ARES search returned 400 Bad Request", ex.Message);
            Assert.Contains(errorJson, ex.Message);
        }

        [Fact]
        public async Task SearchByNameAsync_ReturnsMappedResults_WhenSuccess()
        {
            var subjects = new AresSubjectDto?[]
            {
                    new AresSubjectDto
                    {
                        CompanyId = "111",
                        BusinessName = "Firma 1"
                    },
                    null,
                    new AresSubjectDto
                    {
                        CompanyId = "222",
                        BusinessName = "Firma 2"
                    }
            };

            var responseObject = new
            {
                pocetCelkem = 3,
                ekonomickeSubjekty = subjects
            };

            var responseJson = JsonSerializer.Serialize(responseObject, new JsonSerializerOptions
            {
                PropertyNamingPolicy = null
            });

            HttpRequestMessage? capturedRequest = null;

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
            };

            var service = CreateService(response, out _, req => capturedRequest = req);

            var result = await service.SearchByNameAsync("Test", 5, CancellationToken.None);

            Assert.NotNull(result);
            var list = Assert.IsAssignableFrom<IReadOnlyList<AresSearchItemDto>>(result);
            Assert.Equal(2, list.Count);

            Assert.Equal("111", list[0].CompanyId);
            Assert.Equal("Firma 1", list[0].BusinessName);

            Assert.Equal("222", list[1].CompanyId);
            Assert.Equal("Firma 2", list[1].BusinessName);

            Assert.NotNull(capturedRequest);
            Assert.Equal(HttpMethod.Post, capturedRequest!.Method);
            Assert.Contains("/vyhledat", capturedRequest.RequestUri!.ToString());
        }

        #endregion
    }
}
