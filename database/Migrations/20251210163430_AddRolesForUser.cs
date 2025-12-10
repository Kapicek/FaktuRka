using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace database.Migrations
{
    /// <inheritdoc />
    public partial class AddRolesForUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Vložit role User / Admin, pokud neexistují
            migrationBuilder.Sql(@"
INSERT INTO ""Roles"" (""Name"")
SELECT 'User'
WHERE NOT EXISTS (SELECT 1 FROM ""Roles"" WHERE ""Name"" = 'User');

INSERT INTO ""Roles"" (""Name"")
SELECT 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM ""Roles"" WHERE ""Name"" = 'Admin');
");

            // 2) Přiřadit všem existujícím userům roli User, pokud ji ještě nemají
            migrationBuilder.Sql(@"
DO $$
DECLARE user_role_id integer;
BEGIN
    SELECT ""Id"" INTO user_role_id FROM ""Roles"" WHERE ""Name"" = 'User';

    IF user_role_id IS NULL THEN
        RAISE EXCEPTION 'Role User not found in Roles table.';
    END IF;

    INSERT INTO ""UserRoles"" (""UserId"", ""RoleId"")
    SELECT u.""Id"", user_role_id
    FROM ""Users"" u
    LEFT JOIN ""UserRoles"" ur 
        ON ur.""UserId"" = u.""Id"" 
       AND ur.""RoleId"" = user_role_id
    WHERE ur.""UserId"" IS NULL;
END $$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // smazat vazby v UserRoles
            migrationBuilder.Sql(@"
DELETE FROM ""UserRoles""
WHERE ""RoleId"" IN (
    SELECT ""Id"" FROM ""Roles"" WHERE ""Name"" IN ('User', 'Admin')
);
");

            // smazat samotné role
            migrationBuilder.Sql(@"
DELETE FROM ""Roles""
WHERE ""Name"" IN ('User', 'Admin');
");
        }
    }
}
