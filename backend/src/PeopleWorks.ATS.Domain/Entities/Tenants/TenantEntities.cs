using System;
using System.Collections.Generic;
using PeopleWorks.ATS.Domain.Common;
using PeopleWorks.ATS.Domain.Entities.Identity;
using PeopleWorks.ATS.Domain.Entities.Requisitions;

namespace PeopleWorks.ATS.Domain.Entities.Tenants;

public class Tenant : BaseEntity
{
    public string Code { get; set; } = string.Empty; // e.g., "TENANT-001"
    public string Name { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public string Plan { get; set; } = "Enterprise";
    public string Status { get; set; } = "Active";
    public string? AdminEmail { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiryDate { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Company> Companies { get; set; } = new List<Company>();
    public virtual ICollection<ApiKey> ApiKeys { get; set; } = new List<ApiKey>();
    public virtual ICollection<FeatureFlag> FeatureFlags { get; set; } = new List<FeatureFlag>();
    public virtual ICollection<User> Users { get; set; } = new List<User>();
    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
    public virtual ICollection<Requisition> Requisitions { get; set; } = new List<Requisition>();
}

public class Company : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Industry { get; set; }
    public string? Website { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? TaxIdentifier { get; set; }
    public string? Gstin { get; set; }
    public string? Cin { get; set; }
    public string? Address { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? Pincode { get; set; }
    public string? Timezone { get; set; }
    public string? LogoUrl { get; set; }

    public virtual Tenant Tenant { get; set; } = null!;
}

public class ApiKey : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string KeyPrefix { get; set; } = string.Empty;
    public string HashedKey { get; set; } = string.Empty;
    public string Scopes { get; set; } = string.Empty; // Comma separated scopes
    public string Status { get; set; } = "Active";
    public DateTime? LastUsedAt { get; set; }

    public virtual Tenant Tenant { get; set; } = null!;
}

public class FeatureFlag : BaseAuditableEntity
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsEnabled { get; set; } = false;

    public virtual Tenant Tenant { get; set; } = null!;
}
