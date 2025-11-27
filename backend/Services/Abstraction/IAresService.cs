using backend.DTOs.Ares;

namespace backend.Services.Abstraction
{
    public interface IAresService
    {
        Task<AresSubjectDto?> GetByIcoAsync(string ico, CancellationToken cancellationToken = default);
    }
}
