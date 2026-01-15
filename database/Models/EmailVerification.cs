using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace database.Models
{
    public class EmailVerification
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = default!;

        [MaxLength(320)]
        public string Email { get; set; } = default!;

        [MaxLength(200)]
        public string CodeHash { get; set; } = default!;

        public DateTimeOffset ExpiresAt { get; set; }

        public int Attempts { get; set; }
        public int MaxAttempts { get; set; } = 5;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset? VerifiedAt { get; set; }
    }
}
