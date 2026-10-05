using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeopleWorks.ATS.Domain.Entities.Candidates;

namespace PeopleWorks.ATS.Infrastructure.Data.Configurations;

public class CandidateConfiguration : IEntityTypeConfiguration<Candidate>
{
    public void Configure(EntityTypeBuilder<Candidate> builder)
    {
        builder.ToTable("Candidates");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.BusinessId).IsRequired().HasMaxLength(50);
        builder.Property(c => c.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(c => c.LastName).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(256);
        builder.Property(c => c.Phone).HasMaxLength(50);
        builder.Property(c => c.Location).HasMaxLength(150);
        builder.Property(c => c.CurrentCompany).HasMaxLength(150);
        builder.Property(c => c.CurrentTitle).HasMaxLength(150);
        builder.Property(c => c.Source).HasMaxLength(100);

        builder.HasIndex(c => new { c.TenantId, c.BusinessId }).IsUnique();
        builder.HasIndex(c => c.TenantId);
        builder.HasIndex(c => c.Email);
        builder.HasIndex(c => c.Phone);
        builder.HasIndex(c => c.Status);
    }
}

public class CandidateSkillConfiguration : IEntityTypeConfiguration<CandidateSkill>
{
    public void Configure(EntityTypeBuilder<CandidateSkill> builder)
    {
        builder.ToTable("CandidateSkills");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.SkillName).IsRequired().HasMaxLength(100);
        builder.Property(s => s.ProficiencyLevel).HasMaxLength(50);

        builder.HasIndex(s => new { s.CandidateId, s.SkillName });
        builder.HasIndex(s => s.TenantId);

        builder.HasOne(s => s.Candidate)
            .WithMany(c => c.Skills)
            .HasForeignKey(s => s.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CandidateExperienceConfiguration : IEntityTypeConfiguration<CandidateExperience>
{
    public void Configure(EntityTypeBuilder<CandidateExperience> builder)
    {
        builder.ToTable("CandidateExperiences");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.CompanyName).IsRequired().HasMaxLength(150);
        builder.Property(e => e.JobTitle).IsRequired().HasMaxLength(150);
        builder.Property(e => e.Location).HasMaxLength(150);

        builder.HasIndex(e => e.CandidateId);
        builder.HasIndex(e => e.TenantId);

        builder.HasOne(e => e.Candidate)
            .WithMany(c => c.Experiences)
            .HasForeignKey(e => e.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CandidateEducationConfiguration : IEntityTypeConfiguration<CandidateEducation>
{
    public void Configure(EntityTypeBuilder<CandidateEducation> builder)
    {
        builder.ToTable("CandidateEducations");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Institution).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Degree).HasMaxLength(100);
        builder.Property(e => e.FieldOfStudy).HasMaxLength(100);

        builder.HasIndex(e => e.CandidateId);
        builder.HasIndex(e => e.TenantId);

        builder.HasOne(e => e.Candidate)
            .WithMany(c => c.Educations)
            .HasForeignKey(e => e.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CandidateDocumentConfiguration : IEntityTypeConfiguration<CandidateDocument>
{
    public void Configure(EntityTypeBuilder<CandidateDocument> builder)
    {
        builder.ToTable("CandidateDocuments");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.DocumentType).IsRequired().HasMaxLength(50);
        builder.Property(d => d.FileName).IsRequired().HasMaxLength(256);
        builder.Property(d => d.FileExtension).HasMaxLength(20);
        builder.Property(d => d.ContentType).HasMaxLength(100);
        builder.Property(d => d.StoragePathOrUri).IsRequired().HasMaxLength(1000);

        builder.HasIndex(d => d.CandidateId);
        builder.HasIndex(d => d.TenantId);

        builder.HasOne(d => d.Candidate)
            .WithMany(c => c.Documents)
            .HasForeignKey(d => d.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CandidateNoteConfiguration : IEntityTypeConfiguration<CandidateNote>
{
    public void Configure(EntityTypeBuilder<CandidateNote> builder)
    {
        builder.ToTable("CandidateNotes");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.NoteText).IsRequired();
        builder.Property(n => n.Category).HasMaxLength(50);

        builder.HasIndex(n => n.CandidateId);
        builder.HasIndex(n => n.TenantId);

        builder.HasOne(n => n.Candidate)
            .WithMany(c => c.Notes)
            .HasForeignKey(n => n.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CandidateCommunicationConfiguration : IEntityTypeConfiguration<CandidateCommunication>
{
    public void Configure(EntityTypeBuilder<CandidateCommunication> builder)
    {
        builder.ToTable("CandidateCommunications");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Channel).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Subject).IsRequired().HasMaxLength(256);
        builder.Property(c => c.SenderEmail).HasMaxLength(256);
        builder.Property(c => c.RecipientEmail).HasMaxLength(256);

        builder.HasIndex(c => c.CandidateId);
        builder.HasIndex(c => c.TenantId);
        builder.HasIndex(c => c.SentAt);

        builder.HasOne(c => c.Candidate)
            .WithMany(cand => cand.Communications)
            .HasForeignKey(c => c.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
