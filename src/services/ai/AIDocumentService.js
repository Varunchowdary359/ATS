/**
 * AI Document & Resume Service
 * Bridges client-side PDF/DOCX resume parser to AI candidate auto-fill,
 * skills extraction, and JD matching workflows.
 */

import { extractTextFromFile, parseResumeText, mapParsedDataToCandidateModel } from '../../components/recruitment/intake/resumeParserEngine.js';
import { DatabaseService } from '../db/DatabaseService.js';
import { AIAuditService } from './AIAuditService.js';
import { AIPermissionService } from './AIPermissionService.js';

export class AIDocumentService {
  /**
   * Parses an uploaded resume file and returns normalized candidate data
   * @param {File} file 
   * @param {string} [targetRequisitionId]
   */
  static async processResumeFile(file, targetRequisitionId = '') {
    DatabaseService.init();
    if (!file) throw new Error('No file provided for AI document processing.');

    // 1. Text extraction from PDF / DOCX
    const extractedText = await extractTextFromFile(file);
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(`Could not extract readable text from '${file.name}'. File may be encrypted or scanned image.`);
    }

    // 2. Section-aware NLU Parsing
    const parsedData = parseResumeText(extractedText, file.name, `${(file.size / (1024 * 1024)).toFixed(1)} MB`);

    // 3. Map into candidate model
    const candidateModel = mapParsedDataToCandidateModel(parsedData, targetRequisitionId);

    return {
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      rawTextPreview: extractedText.slice(0, 300),
      parsedData,
      candidateModel
    };
  }

  /**
   * Commits the parsed candidate into DatabaseService repository
   */
  static async commitParsedCandidate(candidateModel, requisitionId = null) {
    DatabaseService.init();
    const actor = AIPermissionService.getUserContext();

    const newCand = {
      ...candidateModel,
      id: `CND-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    DatabaseService.candidates.unshift(newCand);

    if (requisitionId) {
      const newApp = {
        id: `APP-2026-${(DatabaseService.applications.length + 1).toString().padStart(3, '0')}`,
        candidateId: newCand.id,
        requisitionId,
        stage: 'Applied',
        status: 'Active',
        appliedAt: new Date().toISOString().split('T')[0],
        lastActivity: new Date().toISOString()
      };
      DatabaseService.applications.unshift(newApp);
    }

    DatabaseService.persistAll();

    AIAuditService.logAction({
      action: 'RESUME_INGESTION_CREATE_CANDIDATE',
      intent: 'parse_resume',
      entityType: 'Candidate',
      entityId: newCand.id,
      details: `Parsed and created candidate '${newCand.candidateName}' from resume '${newCand.fileName || 'Resume'}'`,
      actor
    });

    return newCand;
  }
}
