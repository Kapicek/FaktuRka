namespace backend.Services.Abstraction
{
    public interface IEmailService
    {
        Task SendAsync(string to, string subject, string body);
    }

}
