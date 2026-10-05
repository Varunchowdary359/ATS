using FluentAssertions;
using PeopleWorks.ATS.Infrastructure.Services;
using Xunit;

namespace PeopleWorks.ATS.Tests;

public class PhoneNormalizerTests
{
    private readonly PhoneNormalizer _normalizer = new();

    [Theory]
    [InlineData("9123456789", "+919123456789")]
    [InlineData("09123456789", "+919123456789")]
    [InlineData("919123456789", "+919123456789")]
    [InlineData("+919123456789", "+919123456789")]
    [InlineData("+91 91234 56789", "+919123456789")]
    [InlineData("+91-9123456789", "+919123456789")]
    [InlineData("091234-56789", "+919123456789")]
    [InlineData("9876543210", "+919876543210")]
    public void TryNormalize_ValidIndianPhoneNumbers_NormalizesToCanonicalFormat(string raw, string expected)
    {
        var success = _normalizer.TryNormalize(raw, out var normalized, out var error);

        success.Should().BeTrue();
        normalized.Should().Be(expected);
        error.Should().BeNull();
    }

    [Theory]
    [InlineData("+14155552671", "+14155552671")]
    [InlineData("+44 20 7183 8750", "+442071838750")]
    [InlineData("+61 2 9876 5432", "+61298765432")]
    public void TryNormalize_ValidInternationalE164_NormalizesCorrectly(string raw, string expected)
    {
        var success = _normalizer.TryNormalize(raw, out var normalized, out var error);

        success.Should().BeTrue();
        normalized.Should().Be(expected);
        error.Should().BeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    [InlineData("123")]
    [InlineData("abcde")]
    [InlineData("12345678901234567890")]
    [InlineData("+0123")]
    public void TryNormalize_InvalidPhoneNumbers_ReturnsFalseWithError(string? raw)
    {
        var success = _normalizer.TryNormalize(raw, out var normalized, out var error);

        success.Should().BeFalse();
        normalized.Should().BeEmpty();
        error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void MaskPhoneNumber_MasksDigitsSafely()
    {
        var masked = _normalizer.MaskPhoneNumber("+919123456789");
        masked.Should().Be("+91 ******6789");
    }
}
