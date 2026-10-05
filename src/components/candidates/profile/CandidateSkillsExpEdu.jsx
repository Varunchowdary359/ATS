import React from 'react';
import { Sparkles, Briefcase, GraduationCap, Building2, Calendar, MapPin, CheckCircle2, Award } from 'lucide-react';

const CandidateSkillsExpEdu = ({ candidate, section = 'all' }) => {
  if (!candidate) return null;

  const showSkills = section === 'all' || section === 'skills';
  const showExp = section === 'all' || section === 'experience';
  const showEdu = section === 'all' || section === 'education';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Skills Matrix */}
      {showSkills && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Skills &amp; Competencies Matrix
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {(candidate.skills || []).length} Total Skills
            </span>
          </div>

          {(candidate.skillsBreakdown && candidate.skillsBreakdown.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidate.skillsBreakdown.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{s.name}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {s.proficiency || 'Advanced'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                    <span>Category: {s.category || 'General'}</span>
                    <span>{s.experience || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(candidate.skills || []).map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Chronological Experience History */}
      {showExp && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Work Experience History
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total Experience: {candidate.totalExperience || 'N/A'}
            </span>
          </div>

          {(candidate.experienceHistory && candidate.experienceHistory.length > 0) ? (
            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
              {candidate.experienceHistory.map((exp) => (
                <div key={exp.id || exp.title} className="relative group">
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 ${exp.isCurrent ? 'border-blue-600 bg-blue-600' : 'border-slate-400'}`} />
                  
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {exp.title}
                          {exp.isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-blue-600 text-white">
                              Current Role
                            </span>
                          )}
                        </h4>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {exp.company} • {exp.location}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-slate-500 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                        {exp.startDate} - {exp.endDate} ({exp.duration})
                      </span>
                    </div>

                    {exp.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                        {exp.description}
                      </p>
                    )}

                    {exp.technologies && exp.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {exp.technologies.map((tech, ti) => (
                          <span key={ti} className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 text-center">
              No formal experience history listed.
            </div>
          )}
        </div>
      )}

      {/* 2.5 Internship Experience History */}
      {showExp && candidate.internshipExperience && candidate.internshipExperience.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Internship Experience
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {candidate.internshipExperience.length} {candidate.internshipExperience.length === 1 ? 'Internship' : 'Internships'}
            </span>
          </div>

          <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
            {candidate.internshipExperience.map((exp) => (
              <div key={exp.id || exp.title} className="relative group">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 border-slate-400" />
                
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {exp.title}
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                          Internship
                        </span>
                      </h4>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {exp.company} • {exp.location}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>

                  {exp.description && exp.description !== 'N/A' && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Education Background */}
      {showEdu && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Education &amp; Academic Qualifications
            </h3>
          </div>

          {(candidate.educationHistory && candidate.educationHistory.length > 0) ? (
            <div className="space-y-3">
              {candidate.educationHistory.map((edu) => (
                <div key={edu.id || edu.degree} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{edu.degree}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{edu.institution}</p>
                    {edu.grade && (
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                        Grade / GPA: {edu.grade}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                    {edu.startYear} - {edu.endYear}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 text-center">
              No education records listed.
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CandidateSkillsExpEdu;
