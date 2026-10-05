/**
 * AI Audit Service
 * Maintains an immutable chronological audit trail of all AI-initiated operations,
 * storing events directly into DatabaseService and in-memory local AI log buffer.
 */

import { DatabaseService } from '../db/DatabaseService.js';
import { AIPermissionService } from './AIPermissionService.js';

const STORAGE_KEY_AI_AUDIT = 'pw_ai_audit_stream';

class AIAuditServiceImpl {
  constructor() {
    this._recentLogs = [];
    this._loadLogs();
  }

  _loadLogs() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY_AI_AUDIT);
        if (stored) {
          this._recentLogs = JSON.parse(stored);
        }
      }
    } catch {}
  }

  _saveLogs() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_AI_AUDIT, JSON.stringify(this._recentLogs.slice(0, 100)));
      }
    } catch {}
  }

  /**
   * Records an audit event for an AI action
   */
  logAction({
    action,
    intent,
    entityType,
    entityId,
    details,
    beforeState = null,
    afterState = null,
    status = 'SUCCESS',
    language = 'en',
    actor = null
  }) {
    const user = actor || AIPermissionService.getUserContext();
    const detailsStr = typeof details === 'object' && details !== null
      ? (details.candidateName ? `Candidate: ${details.candidateName} (${details.email || details.destination || 'ATS'})` : JSON.stringify(details))
      : String(details || `Executed ${action} on ${entityType}`);

    const event = {
      id: `AI-AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor: user.name || user.email || 'PeopleWorks User',
      actorRole: user.role || 'recruiter',
      executor: 'PeopleWorks AI Agent (Copilot)',
      action,
      intent,
      entityType,
      entityId: entityId || 'N/A',
      details: detailsStr,
      beforeState,
      afterState,
      status,
      language
    };

    // 1. Add to local AI Audit Stream
    this._recentLogs.unshift(event);
    if (this._recentLogs.length > 100) {
      this._recentLogs = this._recentLogs.slice(0, 100);
    }
    this._saveLogs();

    // 2. Also record in centralized DatabaseService security audit trail
    try {
      DatabaseService.logSecurityEvent({
        actor: `${user.name || user.email} (via PeopleWorks AI)`,
        action: `AI_${action.toUpperCase()}`,
        resource: entityType,
        resourceId: String(entityId),
        details: `${detailsStr} [Intent: ${intent}, Lang: ${language}]`,
        status
      });
    } catch (e) {
      console.warn('AIAuditService database logging notice:', e);
    }

    return event;
  }

  /**
   * Retrieves recent AI actions
   */
  getRecentLogs(limit = 20) {
    this._loadLogs();
    return this._recentLogs.slice(0, limit);
  }

  /**
   * Clears audit logs (Admin only)
   */
  clearLogs() {
    this._recentLogs = [];
    this._saveLogs();
  }
}

export const AIAuditService = new AIAuditServiceImpl();
