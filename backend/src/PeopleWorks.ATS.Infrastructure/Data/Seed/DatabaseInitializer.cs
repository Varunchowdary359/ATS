using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PeopleWorks.ATS.Application.Common.Interfaces;
using PeopleWorks.ATS.Domain.Entities.Tenants;
using PeopleWorks.ATS.Domain.Entities.Identity;
using PeopleWorks.ATS.Domain.Entities.Requisitions;
using PeopleWorks.ATS.Domain.Entities.JobDescriptions;
using PeopleWorks.ATS.Domain.Entities.Candidates;
using PeopleWorks.ATS.Domain.Entities.Applications;
using PeopleWorks.ATS.Domain.Entities.Interviews;
using PeopleWorks.ATS.Domain.Entities.Policies;
using PeopleWorks.ATS.Domain.Enums;
using AtsApplication = PeopleWorks.ATS.Domain.Entities.Applications.Application;

namespace PeopleWorks.ATS.Infrastructure.Data.Seed;

public class DatabaseInitializer : IDatabaseInitializer
{
    private readonly AppDbContext _context;
    private readonly ICurrentTenantService _currentTenantService;

    public DatabaseInitializer(AppDbContext context, ICurrentTenantService currentTenantService)
    {
        _context = context;
        _currentTenantService = currentTenantService;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory" && _context.Database.IsRelational())
            {
                await _context.Database.MigrateAsync(cancellationToken);
            }
            else
            {
                await _context.Database.EnsureCreatedAsync(cancellationToken);
            }
        }
        catch
        {
            await _context.Database.EnsureCreatedAsync(cancellationToken);
        }

        await SeedDevelopmentDataAsync(cancellationToken);
    }

    public async Task SeedDevelopmentDataAsync(CancellationToken cancellationToken = default)
    {
        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        if (await _context.Tenants.AnyAsync(cancellationToken))
        {
            await EnsureDevUsersExistAsync(defaultTenantId, cancellationToken);
            return;
        }

        _currentTenantService.SetTenant(defaultTenantId);

        // 1. Seed Tenant
        var tenant = new Tenant
        {
            Id = defaultTenantId,
            Code = "TENANT-001",
            Name = "PeopleWorks Enterprise",
            Domain = "peopleworks.local",
            Plan = "Enterprise",
            Status = "Active",
            AdminEmail = "admin@peopleworks.local",
            CreatedAt = DateTime.UtcNow
        };
        await _context.Tenants.AddAsync(tenant, cancellationToken);

        // 2. Seed Company
        var company = new Company
        {
            Id = Guid.NewGuid(),
            TenantId = defaultTenantId,
            Name = "PeopleWorks Global Tech",
            Code = "PW-TECH",
            TaxIdentifier = "US-987654321",
            Country = "United States",
            Address = "100 Innovation Way, Suite 400, San Francisco, CA"
        };
        await _context.Companies.AddAsync(company, cancellationToken);

        // 3. Seed Roles & Permissions
        var roles = new List<Role>
        {
            new() { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "Super Administrator", Type = "System", Description = "System Super Admin" },
            new() { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "ATS Administrator", Type = "System", Description = "Full ATS administrative privileges" },
            new() { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "Recruiter", Type = "System", Description = "Manages candidates, requisitions, and scheduling" },
            new() { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "Hiring Manager", Type = "System", Description = "Reviews candidates, approves requisitions & evaluates scorecards" },
            new() { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "Interviewer", Type = "System", Description = "Conducts interviews and fills scorecards" },
            new() { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "HR Admin", Type = "System", Description = "HR operations and compliance management" }
        };
        await _context.Roles.AddRangeAsync(roles, cancellationToken);

        var permissions = new List<Permission>
        {
            new() { Id = Guid.NewGuid(), Code = "requisitions.view", Module = "Requisitions", Action = "View", Description = "View Requisitions" },
            new() { Id = Guid.NewGuid(), Code = "requisitions.manage", Module = "Requisitions", Action = "Manage", Description = "Manage Requisitions" },
            new() { Id = Guid.NewGuid(), Code = "requisitions.approve", Module = "Requisitions", Action = "Approve", Description = "Approve Requisitions" },
            new() { Id = Guid.NewGuid(), Code = "candidates.view", Module = "Candidates", Action = "View", Description = "View Candidates" },
            new() { Id = Guid.NewGuid(), Code = "candidates.manage", Module = "Candidates", Action = "Manage", Description = "Manage Candidates" },
            new() { Id = Guid.NewGuid(), Code = "interviews.schedule", Module = "Interviews", Action = "Schedule", Description = "Schedule Interviews" },
            new() { Id = Guid.NewGuid(), Code = "interviews.evaluate", Module = "Interviews", Action = "Evaluate", Description = "Submit Scorecard" },
            new() { Id = Guid.NewGuid(), Code = "policies.manage", Module = "Policies", Action = "Manage", Description = "Manage Policies" }
        };
        await _context.Permissions.AddRangeAsync(permissions, cancellationToken);

        // 4. Seed Development Users
        string HashDevPassword(string password)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password + "_PW_SALT_DEV"));
            return Convert.ToHexString(bytes);
        }

        var adminUser = new User
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            TenantId = defaultTenantId,
            UserCode = "USR-ADMIN-01",
            EmpId = "EMP-001",
            Name = "ATS Administrator",
            Email = "admin@peopleworks.local",
            PhoneNumber = "+91 9123456780",
            NormalizedPhoneNumber = "+919123456780",
            PasswordHash = HashDevPassword("AdminDev123!"),
            PasswordSalt = "PW_SALT_DEV",
            Role = AtsRole.AtsAdmin,
            Department = "People Operations",
            Designation = "Principal ATS Lead",
            Status = "Active",
            AuthMethod = "Local"
        };

        var recruiterUser = new User
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            TenantId = defaultTenantId,
            UserCode = "USR-REC-01",
            EmpId = "EMP-012",
            Name = "Sarah Jenkins",
            Email = "sarah.recruiter@peopleworks.local",
            PhoneNumber = "+91 9123456781",
            NormalizedPhoneNumber = "+919123456781",
            PasswordHash = HashDevPassword("RecruiterDev123!"),
            PasswordSalt = "PW_SALT_DEV",
            Role = AtsRole.Recruiter,
            Department = "Talent Acquisition",
            Designation = "Senior Technical Recruiter",
            Status = "Active",
            AuthMethod = "Local"
        };

        var hiringManagerUser = new User
        {
            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            TenantId = defaultTenantId,
            UserCode = "USR-HM-01",
            EmpId = "EMP-042",
            Name = "Marcus Vance",
            Email = "marcus.hm@peopleworks.local",
            PhoneNumber = "+91 9123456782",
            NormalizedPhoneNumber = "+919123456782",
            PasswordHash = HashDevPassword("ManagerDev123!"),
            PasswordSalt = "PW_SALT_DEV",
            Role = AtsRole.HiringManager,
            Department = "Core Platform Engineering",
            Designation = "Director of Engineering",
            Status = "Active",
            AuthMethod = "Local"
        };

        var interviewerUser = new User
        {
            Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            TenantId = defaultTenantId,
            UserCode = "USR-INT-01",
            EmpId = "EMP-088",
            Name = "Elena Rostova",
            Email = "elena.tech@peopleworks.local",
            PhoneNumber = "+91 9123456783",
            NormalizedPhoneNumber = "+919123456783",
            PasswordHash = HashDevPassword("InterviewerDev123!"),
            PasswordSalt = "PW_SALT_DEV",
            Role = AtsRole.Interviewer,
            Department = "Frontend Core",
            Designation = "Staff Frontend Architect",
            Status = "Active",
            AuthMethod = "Local"
        };

        var leadDevUser = new User
        {
            Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            TenantId = defaultTenantId,
            UserCode = "USR-DEV-01",
            EmpId = "EMP-007",
            Name = "Sujith Palanisamy",
            Email = "sujith@peopleworks.local",
            PhoneNumber = "+91 7793988059",
            NormalizedPhoneNumber = "+917793988059",
            PasswordHash = HashDevPassword("DevSecure123!"),
            PasswordSalt = "PW_SALT_DEV",
            Role = AtsRole.AtsAdmin,
            Department = "Engineering",
            Designation = "Lead ATS Architect",
            Status = "Active",
            AuthMethod = "Local"
        };

        await _context.Users.AddRangeAsync(new[] { adminUser, recruiterUser, hiringManagerUser, interviewerUser, leadDevUser }, cancellationToken);

        // 5. Seed Assessment Policies
        var policyId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var policy = new AssessmentPolicy
        {
            Id = policyId,
            TenantId = defaultTenantId,
            BusinessId = "POL-INT-TECH-002",
            Name = "Standard Technical Video Assessment Policy",
            Description = "Enforces active camera feed, single display screen, microphone verification, and strict tab switch detection during technical assessments.",
            PolicyType = PolicyType.TechnicalInterview,
            Version = 2,
            IsActiveVersion = true,
            PolicyStatus = "Active",
            RequiresCamera = true,
            RequiresMicrophone = true,
            RequiresScreenShare = false,
            RequiresCandidateAcceptance = true,
            RequiresInterviewerAcceptance = true,
            RequiresReadinessCheck = true,
            EnforceSingleScreen = true,
            BlockTabSwitching = true,
            BlockCopyPaste = false,
            MaxTabSwitchesAllowed = 3
        };
        await _context.AssessmentPolicies.AddAsync(policy, cancellationToken);

        var policyRules = new List<PolicyRule>
        {
            new()
            {
                Id = Guid.NewGuid(),
                TenantId = defaultTenantId,
                AssessmentPolicyId = policyId,
                RuleCode = "RULE_CAM_MANDATORY",
                Name = "Camera Feed Continuous",
                Description = "Candidate camera must remain streaming during the interview round.",
                Severity = "Critical",
                DefaultAction = ViolationAction.Warning
            },
            new()
            {
                Id = Guid.NewGuid(),
                TenantId = defaultTenantId,
                AssessmentPolicyId = policyId,
                RuleCode = "RULE_TAB_SWITCH_LIMIT",
                Name = "Tab Switch Monitoring",
                Description = "Candidate is flagged upon switching application focus more than 3 times.",
                Severity = "Warning",
                DefaultAction = ViolationAction.Warning
            }
        };
        await _context.PolicyRules.AddRangeAsync(policyRules, cancellationToken);

        // 6. Seed Sample Requisition
        var requisitionId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var requisition = new Requisition
        {
            Id = requisitionId,
            TenantId = defaultTenantId,
            RequisitionCode = "REQ-2026-001",
            ReqNumber = "REQ-001",
            Title = "Senior Fullstack / React Engineer",
            Department = "Core Platform Engineering",
            Location = "San Francisco, CA (Hybrid)",
            JobType = "Full-time",
            Priority = RequisitionPriority.High,
            Status = RequisitionStatus.Open,
            Openings = 2,
            HiredCount = 0,
            HiringManagerId = hiringManagerUser.Id,
            LeadRecruiterId = recruiterUser.Id,
            BudgetMin = 140000,
            BudgetMax = 175000,
            Currency = "USD",
            TargetStartDate = DateTime.UtcNow.AddDays(45)
        };
        await _context.Requisitions.AddAsync(requisition, cancellationToken);

        // 7. Seed Job Description
        var jd = new JobDescription
        {
            Id = Guid.NewGuid(),
            TenantId = defaultTenantId,
            BusinessId = "JD-2026-001",
            RequisitionId = requisitionId,
            Title = "Senior Fullstack / React Engineer",
            Department = "Core Platform Engineering",
            Location = "San Francisco, CA",
            EmploymentType = "Full-Time",
            ExperienceLevel = "Senior (5-8 Years)",
            Summary = "We are seeking a senior fullstack engineer with deep expertise in React 19, TypeScript, and modern backend services to build next-gen enterprise experiences.",
            Responsibilities = "- Design scalable frontend architectures using React and TypeScript.\n- Collaborate closely with product management and platform teams.\n- Maintain high unit and integration test coverage.",
            Requirements = "- 5+ years building complex web applications.\n- Strong expertise in React, modern JavaScript/TypeScript, and RESTful APIs.\n- Solid understanding of relational databases and system design.",
            Benefits = "- Comprehensive medical, dental, and vision coverage.\n- Flexible remote/hybrid working schedule.\n- 401(k) matching up to 5%.",
            Status = JobDescriptionStatus.Approved,
            CurrentVersion = 1
        };
        await _context.JobDescriptions.AddAsync(jd, cancellationToken);

        // 8. Seed Candidates
        var candidate1Id = Guid.Parse("33333333-3333-3333-3333-333333333331");
        var candidate1 = new Candidate
        {
            Id = candidate1Id,
            TenantId = defaultTenantId,
            BusinessId = "CAND-101",
            FirstName = "Alex",
            LastName = "Rivera",
            Email = "alex.rivera@example.com",
            Phone = "+1 (555) 234-5678",
            Location = "Austin, TX",
            CurrentCompany = "CloudScale Solutions",
            CurrentTitle = "Senior Frontend Engineer",
            TotalExperienceYears = 7.5m,
            Source = "LinkedIn InMail",
            Status = CandidateStatus.Active,
            LinkedInUrl = "https://linkedin.com/in/alexrivera-mock",
            GitHubUrl = "https://github.com/alexrivera-mock"
        };

        var candidate2Id = Guid.Parse("33333333-3333-3333-3333-333333333332");
        var candidate2 = new Candidate
        {
            Id = candidate2Id,
            TenantId = defaultTenantId,
            BusinessId = "CAND-102",
            FirstName = "Sarah",
            LastName = "Chen",
            Email = "sarah.chen@example.com",
            Phone = "+1 (555) 876-5432",
            Location = "Seattle, WA",
            CurrentCompany = "VentureTech",
            CurrentTitle = "Full Stack Developer",
            TotalExperienceYears = 5.0m,
            Source = "Company Careers Page",
            Status = CandidateStatus.Active,
            LinkedInUrl = "https://linkedin.com/in/sarahchen-mock"
        };
        await _context.Candidates.AddRangeAsync(new[] { candidate1, candidate2 }, cancellationToken);

        // Candidate 1 Skills
        await _context.CandidateSkills.AddRangeAsync(new[]
        {
            new CandidateSkill { Id = Guid.NewGuid(), TenantId = defaultTenantId, CandidateId = candidate1Id, SkillName = "React", YearsExperience = 6.0m, ProficiencyLevel = "Expert", IsPrimary = true },
            new CandidateSkill { Id = Guid.NewGuid(), TenantId = defaultTenantId, CandidateId = candidate1Id, SkillName = "TypeScript", YearsExperience = 5.0m, ProficiencyLevel = "Expert", IsPrimary = true },
            new CandidateSkill { Id = Guid.NewGuid(), TenantId = defaultTenantId, CandidateId = candidate1Id, SkillName = "Node.js", YearsExperience = 4.0m, ProficiencyLevel = "Intermediate", IsPrimary = false }
        }, cancellationToken);

        // 9. Seed Applications
        var application1Id = Guid.Parse("44444444-4444-4444-4444-444444444441");
        var app1 = new AtsApplication
        {
            Id = application1Id,
            TenantId = defaultTenantId,
            BusinessId = "APP-2026-001",
            CandidateId = candidate1Id,
            RequisitionId = requisitionId,
            Stage = ApplicationStage.Interview,
            Status = ApplicationStatus.Active,
            AppliedDate = DateTime.UtcNow.AddDays(-10),
            Source = "LinkedIn InMail"
        };

        var application2Id = Guid.Parse("44444444-4444-4444-4444-444444444442");
        var app2 = new AtsApplication
        {
            Id = application2Id,
            TenantId = defaultTenantId,
            BusinessId = "APP-2026-002",
            CandidateId = candidate2Id,
            RequisitionId = requisitionId,
            Stage = ApplicationStage.Screening,
            Status = ApplicationStatus.Active,
            AppliedDate = DateTime.UtcNow.AddDays(-3),
            Source = "Careers Page"
        };
        await _context.Applications.AddRangeAsync(new[] { app1, app2 }, cancellationToken);

        // 10. Seed Interview Session
        var sessionId = Guid.Parse("66666666-6666-6666-6666-666666666661");
        var session = new InterviewSession
        {
            Id = sessionId,
            TenantId = defaultTenantId,
            BusinessId = "INT-SESS-MOCK-001",
            ApplicationId = application1Id,
            CandidateId = candidate1Id,
            RequisitionId = requisitionId,
            RoundName = "Technical Deep Dive & Architecture",
            Type = InterviewType.Video,
            Status = InterviewSessionStatus.Scheduled,
            ScheduledStartTime = DateTime.UtcNow.AddHours(2),
            ScheduledEndTime = DateTime.UtcNow.AddHours(3),
            MeetingProvider = MeetingProvider.GoogleMeet,
            MeetingLink = "https://meet.google.com/xyz-pwats-mock",
            MeetingId = "xyz-pwats-mock",
            PolicyId = policyId,
            LockedPolicyVersion = 2
        };
        await _context.InterviewSessions.AddAsync(session, cancellationToken);

        var panelist = new InterviewPanelist
        {
            Id = Guid.NewGuid(),
            TenantId = defaultTenantId,
            InterviewSessionId = sessionId,
            UserId = interviewerUser.Id,
            Name = "Elena Rostova",
            Email = "elena.tech@peopleworks.local",
            Role = "Primary Technical Interviewer",
            IsLead = true
        };
        await _context.InterviewPanelists.AddAsync(panelist, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureDevUsersExistAsync(Guid defaultTenantId, CancellationToken cancellationToken)
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == defaultTenantId || t.Code == "TENANT-001", cancellationToken)
                     ?? await _context.Tenants.FirstOrDefaultAsync(cancellationToken);
        if (tenant == null)
        {
            Console.WriteLine("[SEED] No tenant found in database!");
            return;
        }

        Console.WriteLine($"[SEED] Found tenant: {tenant.Name}, Code: {tenant.Code}, Id: {tenant.Id}");
        _currentTenantService.SetTenant(tenant.Id);

        var devPhones = new (string Name, string Email, string Phone, string Normalized, AtsRole Role, string UserCode, string EmpId, string Dept, string Desig)[]
        {
            ("Sujith Palanisamy", "sujith@peopleworks.local", "+91 7793988059", "+917793988059", AtsRole.AtsAdmin, "USR-DEV-01", "EMP-007", "Engineering", "Lead ATS Architect"),
            ("ATS Administrator", "admin@peopleworks.local", "+91 9123456780", "+919123456780", AtsRole.AtsAdmin, "USR-ADMIN-01", "EMP-001", "People Operations", "Principal ATS Lead"),
            ("Sarah Jenkins", "sarah.recruiter@peopleworks.local", "+91 9123456781", "+919123456781", AtsRole.Recruiter, "USR-REC-01", "EMP-012", "Talent Acquisition", "Senior Technical Recruiter"),
            ("Marcus Vance", "marcus.hm@peopleworks.local", "+91 9123456782", "+919123456782", AtsRole.HiringManager, "USR-HM-01", "EMP-042", "Core Platform Engineering", "Director of Engineering"),
            ("Elena Rostova", "elena.tech@peopleworks.local", "+91 9123456783", "+919123456783", AtsRole.Interviewer, "USR-INT-01", "EMP-088", "Frontend Core", "Staff Frontend Architect")
        };

        foreach (var (name, email, phone, normalized, role, code, empId, dept, desig) in devPhones)
        {
            var user = await _context.Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => (u.TenantId == tenant.Id && u.Email == email) || u.NormalizedPhoneNumber == normalized, cancellationToken);

            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    UserCode = code,
                    EmpId = empId,
                    Name = name,
                    Email = email,
                    PhoneNumber = phone,
                    NormalizedPhoneNumber = normalized,
                    PasswordHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("DevSecure123!_PW_SALT_DEV"))),
                    PasswordSalt = "PW_SALT_DEV",
                    Role = role,
                    Department = dept,
                    Designation = desig,
                    Status = "Active",
                    AuthMethod = "Local"
                };

                await _context.Users.AddAsync(user, cancellationToken);
                Console.WriteLine($"[SEED] Added user {name} ({normalized}) to tenant {tenant.Code}");
            }
            else
            {
                // Ensure tenant, phone, and active status match
                user.TenantId = tenant.Id;
                user.PhoneNumber = phone;
                user.NormalizedPhoneNumber = normalized;
                user.Status = "Active";
                Console.WriteLine($"[SEED] Synced user {name} ({normalized}) in tenant {tenant.Code}");
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        Console.WriteLine("[SEED] Seed changes saved successfully.");
    }
}
