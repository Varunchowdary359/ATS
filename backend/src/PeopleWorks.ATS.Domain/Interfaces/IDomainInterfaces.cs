namespace PeopleWorks.ATS.Domain.Interfaces;

public interface IAggregateRoot
{
}

public interface IDomainEvent
{
    DateTime OccurredOn { get; }
}
