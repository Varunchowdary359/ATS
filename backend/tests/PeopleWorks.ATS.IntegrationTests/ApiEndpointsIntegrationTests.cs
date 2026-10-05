using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Xunit;

namespace PeopleWorks.ATS.IntegrationTests;

public class ApiEndpointsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ApiEndpointsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_Requisitions_ReturnsSuccessAndSeededData()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/requisitions");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);

        jsonDoc.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
        var data = jsonDoc.RootElement.GetProperty("data");
        data.GetProperty("totalCount").GetInt32().Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Get_Candidates_ReturnsSuccessAndSeededData()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/candidates");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);

        jsonDoc.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
        var data = jsonDoc.RootElement.GetProperty("data");
        data.GetProperty("totalCount").GetInt32().Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task Get_Applications_ReturnsSuccessAndSeededData()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/applications");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);

        jsonDoc.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
        var data = jsonDoc.RootElement.GetProperty("data");
        data.GetProperty("totalCount").GetInt32().Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task Get_Interviews_ReturnsSuccessAndSeededData()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/interviews");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);

        jsonDoc.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
        var data = jsonDoc.RootElement.GetProperty("data");
        data.GetProperty("totalCount").GetInt32().Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Get_Policies_ReturnsSuccessAndSeededData()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/policies");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);

        jsonDoc.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
        var data = jsonDoc.RootElement.GetProperty("data");
        data.GetArrayLength().Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Get_NonExistentResource_Returns404ProblemDetails()
    {
        var client = _factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        var response = await client.GetAsync($"/api/v1/requisitions/{nonExistentId}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);
        jsonDoc.RootElement.GetProperty("status").GetInt32().Should().Be(404);
        jsonDoc.RootElement.GetProperty("title").GetString().Should().Be("Not Found");
    }
}
