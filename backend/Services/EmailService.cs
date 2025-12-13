using backend.Services.Abstraction;
using System.Net;
using System.Net.Mail;

namespace backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendAsync(string to, string subject, string body)
        {
                var smtp = _config.GetSection("Smtp");

                using var client = new SmtpClient
                {
                    Host = smtp["Host"],
                    Port = 587,
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(
                        smtp["User"],
                        smtp["Password"]
                    ),
                    Timeout = 10_000
                };

                using var message = new MailMessage
                {
                    From = new MailAddress(smtp["From"]!),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = false
                };

                message.To.Add(to);

                await client.SendMailAsync(message);
        }


    }
}
