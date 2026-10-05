/**
 * Resume & Candidate JD Matching Engine
 * Local deterministic matching service calculating explainable candidate-to-JD alignment scores.
 * Evaluates mandatory skills, preferred skills, experience, role title alignment, education,
 * and location constraints against approved Job Descriptions.
 */

import { DatabaseService } from '../../db/DatabaseService.js';
import { normalizeText, safeString } from '../AINormalizer.js';

export class ResumeMatchingService {
  /**
   * Calculates comprehensive matching score between candidate profile and JD/Requisition
   * @param {Object} candidateData
   * @param {Object|string} jdOrReq
   * @returns {Object} Structured match result with scores, breakdowns, and explainable lists
   */
  static calculateMatch(candidateData = {}, jdOrReq = null) {
    DatabaseService.init();

    // 1. Resolve JD Object
    let jd = null;
    if (typeof jdOrReq === 'string' && jdOrReq) {
      jd = (DatabaseService.jds || []).find(j => j.id === jdOrReq || j.title === jdOrReq || j.reqId === jdOrReq) ||
           (DatabaseService.requisitions || []).find(r => r.id === jdOrReq || r.title === jdOrReq);
    } else if (jdOrReq && typeof jdOrReq === 'object') {
      jd = jdOrReq;
    }

    // Default fallback if no specific JD is provided
    if (!jd) {
      jd = (DatabaseService.jds || []).find(j => (j.status || '').toUpperCase() === 'APPROVED' || (j.status || '').toUpperCase() === 'PUBLISHED') || {
        id: 'JD-GENERAL',
        title: 'General Technical Role',
        mandatorySkills: ['JavaScript', 'React', 'Problem Solving'],
        preferredSkills: ['TypeScript', 'Cloud'],
        experienceMin: 2,
        experienceMax: 6,
        department: 'Engineering'
      };
    }

    const jdTitle = jd.title || jd.jobTitle || 'Target Role';
    const jdId = jd.id || 'JD-2026-0001';

    // 2. Extract Candidate Data
    const candSkills = Array.isArray(candidateData.skills)
      ? candidateData.skills.map(s => (typeof s === 'string' ? s : s.name || ''))
      : (typeof candidateData.skills === 'string' ? candidateData.skills.split(',').map(s => s.trim()) : []);

    const candSkillsNorm = candSkills.map(s => normalizeText(s)).filter(Boolean);

    const candExpStr = String(candidateData.totalExperience || candidateData.experienceDisplay || '0');
    const candExpNum = parseFloat(candExpStr.replace(/[^\d.]/g, '')) || 0;

    const candTitle = String(candidateData.currentTitle || candidateData.title || '').trim();
    const candTitleNorm = normalizeText(candTitle);

    const candLocation = String(candidateData.location || candidateData.preferredLocation || '').trim();
    const candLocationNorm = normalizeText(candLocation);

    const candEduHistory = Array.isArray(candidateData.educationHistory) ? candidateData.educationHistory : [];
    const candEduText = candEduHistory.map(e => `${e.degree || ''} ${e.specialization || ''}`).join(' ') + ' ' + String(candidateData.education || '');
    const candEduNorm = normalizeText(candEduText);

    // 3. Extract JD Requirements
    const jdMandatorySkills = Array.isArray(jd.mandatorySkills)
      ? jd.mandatorySkills
      : (Array.isArray(jd.skills) ? jd.skills : ['Java', 'Spring Boot', 'SQL']);

    const jdPreferredSkills = Array.isArray(jd.preferredSkills)
      ? jd.preferredSkills
      : ['AWS', 'Docker', 'Kubernetes', 'Microservices'];

    const minExp = typeof jd.experienceMin === 'number' ? jd.experienceMin : 3;
    const maxExp = typeof jd.experienceMax === 'number' ? jd.experienceMax : 7;
    const jdLocationNorm = normalizeText(jd.location || 'Bangalore');

    // 4. Calculate Skill Match
    const matchedSkills = [];
    const missingMandatorySkills = [];
    const matchedPreferredSkills = [];

    jdMandatorySkills.forEach(reqSkill => {
      const norm = normalizeText(reqSkill);
      const isMatched = candSkillsNorm.some(cs => cs.includes(norm) || norm.includes(cs));
      if (isMatched) {
        matchedSkills.push(reqSkill);
      } else {
        missingMandatorySkills.push(reqSkill);
      }
    });

    jdPreferredSkills.forEach(prefSkill => {
      const norm = normalizeText(prefSkill);
      const isMatched = candSkillsNorm.some(cs => cs.includes(norm) || norm.includes(cs));
      if (isMatched) {
        matchedPreferredSkills.push(prefSkill);
      }
    });

    const mandatoryRatio = jdMandatorySkills.length > 0 ? (matchedSkills.length / jdMandatorySkills.length) : 1;
    const preferredRatio = jdPreferredSkills.length > 0 ? (matchedPreferredSkills.length / jdPreferredSkills.length) : 0.5;
    const skillScore = Math.min(100, Math.round((mandatoryRatio * 0.75 + preferredRatio * 0.25) * 100));

    // 5. Calculate Experience Match
    let experienceScore = 70;
    if (candExpNum >= minExp && candExpNum <= (maxExp + 2)) {
      experienceScore = 95;
    } else if (candExpNum >= minExp) {
      experienceScore = 88; // Slightly overqualified
    } else if (candExpNum >= (minExp - 1)) {
      experienceScore = 75; // Close to required minimum
    } else if (candExpNum > 0) {
      experienceScore = 60;
    } else {
      experienceScore = 40; // Fresher / no experience detected
    }

    // 6. Calculate Role / Title Alignment Match
    let roleScore = 65;
    const jdTitleKeywords = normalizeText(jdTitle).split(/\s+/).filter(w => !/senior|lead|junior|staff|principal|developer|engineer/i.test(w));
    const hasRoleKeywordMatch = jdTitleKeywords.some(kw => kw.length > 2 && candTitleNorm.includes(kw));
    if (candTitleNorm && (candTitleNorm.includes(normalizeText(jdTitle)) || hasRoleKeywordMatch)) {
      roleScore = 90;
    } else if (candSkills.length > 0 && matchedSkills.length > 0) {
      roleScore = 80;
    }

    // 7. Calculate Education Match
    let educationScore = 75;
    if (/b\.tech|b\.e|master|bachelor|mba|m\.tech|mca|bca/i.test(candEduNorm) || candEduHistory.length > 0) {
      educationScore = 85;
      if (/computer\s+science|information\s+technology|software/i.test(candEduNorm)) {
        educationScore = 95;
      }
    }

    // 8. Calculate Overall Weighted Match Score
    const overallScore = Math.round(
      (skillScore * 0.45) +
      (experienceScore * 0.25) +
      (roleScore * 0.15) +
      (educationScore * 0.15)
    );

    // 9. Generate Explainable Lists
    const matchedRequirements = [];
    const partiallyMatchedRequirements = [];
    const missingMandatoryRequirements = [];

    if (matchedSkills.length > 0) {
      matchedRequirements.push(`Core Skills Match: ${matchedSkills.join(', ')}`);
    }
    if (candExpNum >= minExp) {
      matchedRequirements.push(`Experience of ${candExpNum} yrs satisfies the required ${minExp}–${maxExp} yrs range`);
    } else if (candExpNum > 0) {
      partiallyMatchedRequirements.push(`Experience of ${candExpNum} yrs is slightly below requested ${minExp} yrs`);
    }

    if (matchedPreferredSkills.length > 0) {
      matchedRequirements.push(`Bonus Skills Match: ${matchedPreferredSkills.join(', ')}`);
    }

    if (candEduNorm && (candEduNorm.includes('b.tech') || candEduNorm.includes('bachelor') || candEduNorm.includes('computer'))) {
      matchedRequirements.push(`Educational background aligns with technical degree requirement`);
    }

    if (candLocationNorm && (candLocationNorm.includes(jdLocationNorm) || jdLocationNorm.includes(candLocationNorm) || candLocationNorm.includes('remote'))) {
      matchedRequirements.push(`Location (${candLocation || 'Bangalore'}) is compatible with role work mode`);
    } else if (candLocation) {
      partiallyMatchedRequirements.push(`Location: Candidate is in ${candLocation}, role is based in ${jd.location || 'Bangalore'}`);
    }

    if (missingMandatorySkills.length > 0) {
      missingMandatoryRequirements.push(`Missing mandatory requirements: ${missingMandatorySkills.join(', ')}`);
    }

    return {
      overallScore: Math.max(20, Math.min(99, overallScore)),
      breakdown: {
        skillMatch: skillScore,
        experienceMatch: experienceScore,
        roleMatch: roleScore,
        educationMatch: educationScore
      },
      matchedSkills,
      matchedPreferredSkills,
      missingMandatorySkills,
      matchedRequirements,
      partiallyMatchedRequirements,
      missingMandatoryRequirements,
      jdId,
      jdTitle,
      department: jd.department || 'Engineering',
      summary: `${overallScore >= 75 ? 'Strong candidate match' : overallScore >= 50 ? 'Moderate candidate match' : 'Partial match'} for ${jdTitle} with ${overallScore}% overall alignment.`
    };
  }
}
