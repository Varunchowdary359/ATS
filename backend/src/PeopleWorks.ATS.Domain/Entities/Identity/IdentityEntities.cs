using PeopleWorks.ATS.Domain.Common;
using PeopleWorks.ATS.Domain.Enums;
using PeopleWorks.ATS.Domain.Entities.Tenants;
using PeopleWorks.ATS.Domain.Entities.Requisitions;

namespace PeopleWorks.ATS.Domain.Entities.Identity;

public class User : BaseAuditableEntity
{
    public string UserCode { get; set; } = string.Empty; // e.g. "USR-ADMIN-01"
    public string? EmpId { get; set; } // e.g. "EMP-042"
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? NormalizedPhoneNumber { get; set; }
    public string Name { get; set; } = string.Empty;
    public AtsRole Role { get; set; } = AtsRole.Recruiter;
    public string Department { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public string? Manager { get; set; }
    public string? Avatar { get; set; }
    public string? AvatarBg { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
    public bool MfaEnabled { get; set; } = false;
    public string? MfaSecret { get; set; }
    public string Status { get; set; } = "Active"; // "Active" | "Inactive" | "Locked" | "Suspended"
    public string AuthMethod { get; set; } = "Local"; // "Local" | "SAML (Okta)" | "OIDC (Azure)"
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? LockoutEnd { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastActiveAt { get; set; }
    public string? SecurityStamp { get; set; } = Guid.NewGuid().ToString();

    public virtual Tenant Tenant { get; set; } = null!;
    public virtual ICollection<UserRequisitionAssignment> RequisitionAssignments { get; set; } = new List<UserRequisitionAssignment>();
}

public class Role : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "System"; // "System" | "Custom"
    public string? Description { get; set; }
    public string? Color { get; set; }

    public virtual Tenant Tenant { get; set; } = null!;
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class Permission : BaseEntity
{
    public string Code { get; set; } = string.Empty; // e.g. "candidate.read", "requisition.create"
    public string Module { get; set; } = string.Empty; // e.g. "Candidates", "Requisitions"
    public string Action { get; set; } = string.Empty; // e.g. "Read", "Create", "Update", "Delete", "Export"
    public string? Description { get; set; }

    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class RolePermission : BaseEntity
{
    public Guid RoleId { get; set; }
    public Guid PermissionId { get; set; }

    public virtual Role Role { get; set; } = null!;
    public virtual Permission Permission { get; set; } = null!;
}

public class UserRequisitionAssignment : BaseEntity, ITenantScopedEntity
{
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public Guid RequisitionId { get; set; }
    public string? AssignedBy { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public virtual User User { get; set; } = null!;
    public virtual Requisition Requisition { get; set; } = null!;
}
