namespace PeopleWorks.ATS.Api.Configuration;

public class DatabaseOptions
{
    public const string SectionName = "ConnectionStrings";
    public string DefaultConnection { get; set; } = string.Empty;
}

public class JwtOptions
{
    public const string SectionName = "JwtSettings";
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 480;
}

public class CorsOptions
{
    public const string SectionName = "CorsSettings";
    public string[] AllowedOrigins { get; set; } = new[]
    {
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "https://ats-ui.vercel.app"
    };
}
