using System;

namespace PeopleWorks.ATS.Domain.ValueObjects;

public record Address(
    string Street,
    string City,
    string State,
    string Country,
    string PostalCode
);

public record Money(
    decimal Amount,
    string Currency
);

public record DateRange(
    DateTime StartDate,
    DateTime? EndDate
);
