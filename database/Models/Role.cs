using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace database.Models;

public class Role
{
    [Key]
    public int Id { get; set; }

    public string Name { get; set; } = default!;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
