namespace PeopleWorks.ATS.Domain.Common;

public interface ITenantScopedEntity
{
    Guid TenantId { get; set; }
}
