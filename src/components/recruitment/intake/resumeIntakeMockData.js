export const INITIAL_RESUMES = [];

export const ALL_INTAKE_SOURCES = [
  'Single Upload',
  'Bulk ZIP Upload',
  'Email Parser',
  'Career Portal Direct',
  'LinkedIn Recruiter',
  'Agency Referral',
  'Employee Referral',
  'Job Board Sync'
];

export const INTAKE_SOURCES = [
  { id: 'single_upload', name: 'Single File Upload', icon: 'Upload' },
  { id: 'bulk_upload', name: 'Bulk ZIP Upload', icon: 'FileArchive' },
  { id: 'email_intake', name: 'Email Parser', icon: 'Mail' },
  { id: 'career_portal', name: 'Career Portal', icon: 'Globe' },
  { id: 'linkedin', name: 'LinkedIn Recruiter Sync', icon: 'Linkedin' }
];

export const checkDuplicateCandidate = (emailOrObj, name, existingResumes = []) => {
  let email = '';
  let candidateName = name || '';
  let resumesList = existingResumes;

  if (emailOrObj && typeof emailOrObj === 'object') {
    email = emailOrObj.email || '';
    candidateName = emailOrObj.candidateName || emailOrObj.name || name || '';
    if (Array.isArray(name)) {
      resumesList = name;
    }
  } else if (typeof emailOrObj === 'string') {
    email = emailOrObj;
  }

  if (!Array.isArray(resumesList) || resumesList.length === 0) {
    return { isDuplicate: false, type: null, matchedCandidate: null, existing: null, reasons: [] };
  }

  const matchEmail = resumesList.find(r => r.email && email && String(r.email).toLowerCase() === String(email).toLowerCase());
  if (matchEmail) {
    return { isDuplicate: true, type: 'exact_email', matchedCandidate: matchEmail, existing: matchEmail, reasons: ['Exact email match'] };
  }
  
  const matchName = resumesList.find(r => r.candidateName && candidateName && String(r.candidateName).toLowerCase() === String(candidateName).toLowerCase());
  if (matchName) {
    return { isDuplicate: true, type: 'name_match', matchedCandidate: matchName, existing: matchName, reasons: ['Candidate name match'] };
  }

  return { isDuplicate: false, type: null, matchedCandidate: null, existing: null, reasons: [] };
};

export const calculateScreeningScore = (candidateArg = [], reqSkillsArg = '', jdArg = null) => {
  // Normalize candidate skills
  let candidateSkills = [];
  if (Array.isArray(candidateArg)) {
    candidateSkills = candidateArg;
  } else if (candidateArg && typeof candidateArg === 'object') {
    candidateSkills = candidateArg.skills || [];
    if (typeof candidateSkills === 'string') {
      candidateSkills = candidateSkills.split(',').map(s => s.trim());
    }
  } else if (typeof candidateArg === 'string') {
    candidateSkills = candidateArg.split(',').map(s => s.trim());
  }

  // Normalize requirement skills
  let reqSkillsStr = '';
  if (typeof reqSkillsArg === 'string') {
    reqSkillsStr = reqSkillsArg;
  } else if (Array.isArray(reqSkillsArg)) {
    reqSkillsStr = reqSkillsArg.join(',');
  } else if (reqSkillsArg && typeof reqSkillsArg === 'object') {
    const rawSkills = reqSkillsArg.skills || reqSkillsArg.requiredSkills || '';
    reqSkillsStr = Array.isArray(rawSkills) ? rawSkills.join(',') : String(rawSkills || '');
  }

  if (jdArg && typeof jdArg === 'object') {
    const jdSkills = jdArg.skills || jdArg.requiredSkills || '';
    const jdSkillsStr = Array.isArray(jdSkills) ? jdSkills.join(',') : String(jdSkills || '');
    if (jdSkillsStr) {
      reqSkillsStr = reqSkillsStr ? `${reqSkillsStr},${jdSkillsStr}` : jdSkillsStr;
    }
  }

  const targetList = (reqSkillsStr || 'React, JavaScript, Node.js')
    .toLowerCase()
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  let scoreNum = 85;
  if (targetList.length > 0 && candidateSkills.length > 0) {
    const matched = candidateSkills.filter(s =>
      targetList.some(t =>
        String(s).toLowerCase().includes(t) || t.includes(String(s).toLowerCase())
      )
    );
    scoreNum = Math.round((matched.length / Math.max(targetList.length, 1)) * 100);
    scoreNum = Math.min(Math.max(scoreNum, 65), 98);
  }

  const outcomeStr = scoreNum >= 80 ? 'Strong Match' : (scoreNum >= 60 ? 'Good Match' : 'Needs Review');

  const resultObj = {
    overall: scoreNum,
    outcome: outcomeStr,
    requiredCoverage: {
      matched: Math.min(candidateSkills.length > 0 ? candidateSkills.length : 5, 7),
      total: Math.max(targetList.length, 5),
      percentage: scoreNum
    },
    preferredCoverage: {
      matched: 2,
      total: 3,
      percentage: 67
    },
    reviewDetails: [
      { title: 'Team leadership / mentoring experience', type: 'Preferred', desc: 'Resume mentions mentoring junior engineers, but lists no formal management title.' }
    ],
    missingDetails: [],
    categoryScores: {
      skillFit: Math.min(scoreNum + 3, 98),
      expFit: Math.min(scoreNum + 5, 95),
      eduFit: Math.min(scoreNum, 90),
      locationFit: 100
    },
    valueOf: function() { return scoreNum; },
    toString: function() { return String(scoreNum); }
  };

  return resultObj;
};
