using System;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using PeopleWorks.ATS.Application.DTOs.Auth;
using Xunit;

namespace PeopleWorks.ATS.IntegrationTests;

public class AuthApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthApiIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CompleteAuthFlow_RequestOtp_Verify_GetProfile_Refresh_Logout_Succeeds()
    {
        var phone = "+91 9123456780"; // Seeded Admin Phone

        // 1. Request OTP
        var requestResponse = await _client.PostAsJsonAsync("/api/v1/auth/otp/request", new OtpRequestDto
        {
            PhoneNumber = phone
        });
        requestResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var requestBody = await requestResponse.Content.ReadFromJsonAsync<OtpRequestResponseDto>();
        requestBody.Should().NotBeNull();
        requestBody!.ChallengeId.Should().NotBeNullOrWhiteSpace();

        // 2. Fetch simulated OTP via Dev endpoint
        _client.DefaultRequestHeaders.Remove("X-Dev-Secret");
        _client.DefaultRequestHeaders.Add("X-Dev-Secret", "dev-secret-pwats-local");

        var devOtpResponse = await _client.GetAsync($"/api/v1/auth/dev/last-otp?phoneNumber={Uri.EscapeDataString(phone)}");
        devOtpResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var devOtpDoc = await JsonDocument.ParseAsync(await devOtpResponse.Content.ReadAsStreamAsync());
        var rawOtp = devOtpDoc.RootElement.GetProperty("otp").GetString();
        rawOtp.Should().NotBeNullOrWhiteSpace();
        rawOtp!.Should().HaveLength(6);

        // 3. Verify OTP
        var verifyResponse = await _client.PostAsJsonAsync("/api/v1/auth/otp/verify", new OtpVerifyDto
        {
            PhoneNumber = phone,
            ChallengeId = requestBody.ChallengeId,
            Otp = rawOtp
        });
        verifyResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var authResult = await verifyResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        authResult.Should().NotBeNull();
        authResult!.AccessToken.Should().NotBeNullOrWhiteSpace();
        authResult.RefreshToken.Should().NotBeNullOrWhiteSpace();
        authResult.User.Email.Should().Be("admin@peopleworks.local");

        // 4. Call /me with Bearer token
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authResult.AccessToken);
        var meResponse = await _client.GetAsync("/api/v1/auth/me");
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var meProfile = await meResponse.Content.ReadFromJsonAsync<UserProfileDto>();
        meProfile.Should().NotBeNull();
        meProfile!.Email.Should().Be("admin@peopleworks.local");

        // 5. Call refresh token
        var refreshResponse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshTokenDto
        {
            RefreshToken = authResult.RefreshToken
        });
        refreshResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var newAuthResult = await refreshResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        newAuthResult.Should().NotBeNull();
        newAuthResult!.AccessToken.Should().NotBeNullOrWhiteSpace();
        newAuthResult.RefreshToken.Should().NotBe(authResult.RefreshToken);

        // 6. Call logout
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", newAuthResult.AccessToken);
        var logoutResponse = await _client.PostAsync("/api/v1/auth/logout", null);
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 7. Request to /me with revoked session token should fail with 401
        var meAfterLogout = await _client.GetAsync("/api/v1/auth/me");
        meAfterLogout.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCurrentUser_WithoutToken_ReturnsUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/v1/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task VerifyOtp_WithWrongOtp_ReturnsBadRequest()
    {
        var phone = "+91 9123456780";

        var requestResponse = await _client.PostAsJsonAsync("/api/v1/auth/otp/request", new OtpRequestDto
        {
            PhoneNumber = phone
        });
        var requestBody = await requestResponse.Content.ReadFromJsonAsync<OtpRequestResponseDto>();

        var verifyResponse = await _client.PostAsJsonAsync("/api/v1/auth/otp/verify", new OtpVerifyDto
        {
            PhoneNumber = phone,
            ChallengeId = requestBody!.ChallengeId,
            Otp = "000000"
        });

        verifyResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task VerifyOtp_FreshChallenge_FirstUseSucceeds_SecondUseReturnsAlreadyUsed()
    {
        var phone = "+91 7793988059";
        var tenantCode = "TENANT-001";

        // 1. Request fresh OTP
        var requestResponse = await _client.PostAsJsonAsync("/api/v1/auth/otp/request", new OtpRequestDto
        {
            PhoneNumber = phone,
            TenantCode = tenantCode
        });
        requestResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var requestBody = await requestResponse.Content.ReadFromJsonAsync<OtpRequestResponseDto>();
        requestBody.Should().NotBeNull();
        requestBody!.ChallengeId.Should().NotBeNullOrWhiteSpace();

        // 2. Fetch development OTP
        _client.DefaultRequestHeaders.Remove("X-Dev-Secret");
        _client.DefaultRequestHeaders.Add("X-Dev-Secret", "dev-secret-pwats-local");
        var devOtpResponse = await _client.GetAsync($"/api/v1/auth/dev/last-otp?phoneNumber={Uri.EscapeDataString(phone)}");
        devOtpResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var devOtpDoc = await JsonDocument.ParseAsync(await devOtpResponse.Content.ReadAsStreamAsync());
        var rawOtp = devOtpDoc.RootElement.GetProperty("otp").GetString();
        rawOtp.Should().NotBeNullOrWhiteSpace();

        // 3. First verify -> MUST RETURN 200 OK
        var firstVerifyResponse = await _client.PostAsJsonAsync("/api/v1/auth/otp/verify", new OtpVerifyDto
        {
            PhoneNumber = phone,
            TenantCode = tenantCode,
            ChallengeId = requestBody.ChallengeId,
            Otp = rawOtp!
        });
        firstVerifyResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var authResult = await firstVerifyResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        authResult.Should().NotBeNull();
        authResult!.AccessToken.Should().NotBeNullOrWhiteSpace();
        authResult.User.Email.Should().Be("sujith@peopleworks.local");

        // 4. Second verify with SAME challenge -> MUST RETURN 400 Bad Request with detail "This OTP has already been used."
        var secondVerifyResponse = await _client.PostAsJsonAsync("/api/v1/auth/otp/verify", new OtpVerifyDto
        {
            PhoneNumber = phone,
            TenantCode = tenantCode,
            ChallengeId = requestBody.ChallengeId,
            Otp = rawOtp!
        });
        secondVerifyResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var errorDoc = await JsonDocument.ParseAsync(await secondVerifyResponse.Content.ReadAsStreamAsync());
        var detail = errorDoc.RootElement.GetProperty("detail").GetString();
        detail.Should().Be("This OTP has already been used.");
    }
}
