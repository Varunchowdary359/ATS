/**
 * AI Context Service
 * Captures, manages, and distributes the active application state & context
 * (current route, selected entities, visible form fields, active user role).
 */

import { AIPermissionService } from './AIPermissionService.js';

class AIContextServiceImpl {
  constructor() {
    this._context = {
      activeView: 'dashboard',
      selectedCandidateId: null,
      selectedCandidate: null,
      selectedJdId: null,
      selectedJd: null,
      selectedRequisitionId: null,
      selectedRequisition: null,
      selectedInterviewId: null,
      selectedInterview: null,
      selectedOfferId: null,
      selectedOffer: null,
      activeFilters: {},
      visibleFormState: {},
      recentEntities: [],
      timestamp: Date.now()
    };
    this._listeners = new Set();
  }

  /**
   * Updates the current application context
   * @param {Object} partialContext 
   */
  setContext(partialContext) {
    this._context = {
      ...this._context,
      ...partialContext,
      timestamp: Date.now()
    };

    // If an entity was selected, add to recent entities list for pronoun/reference resolution
    if (partialContext.selectedCandidate) {
      this._addRecentEntity('candidate', partialContext.selectedCandidate);
    }
    if (partialContext.selectedJd) {
      this._addRecentEntity('jd', partialContext.selectedJd);
    }
    if (partialContext.selectedRequisition) {
      this._addRecentEntity('requisition', partialContext.selectedRequisition);
    }

    this._notifyListeners();
  }

  _addRecentEntity(type, entity) {
    if (!entity) return;
    const item = {
      type,
      id: entity.id || entity._id,
      name: entity.name || entity.candidateName || entity.title || entity.jobTitle || 'Item',
      entity,
      timestamp: Date.now()
    };
    this._context.recentEntities = [
      item,
      ...this._context.recentEntities.filter(e => !(e.type === type && e.id === item.id))
    ].slice(0, 10);
  }

  /**
   * Returns a snapshot of the current context along with user profile
   */
  getContext() {
    const user = AIPermissionService.getUserContext();
    return {
      ...this._context,
      user
    };
  }

  /**
   * Finds the most relevant entity for contextual references like "this candidate", "he", "this JD", "that requisition"
   */
  resolveContextualEntity(entityType) {
    const ctx = this.getContext();
    if (entityType === 'candidate') {
      if (ctx.selectedCandidate) return ctx.selectedCandidate;
      const recent = ctx.recentEntities.find(e => e.type === 'candidate');
      if (recent) return recent.entity;
    }
    if (entityType === 'jd') {
      if (ctx.selectedJd) return ctx.selectedJd;
      const recent = ctx.recentEntities.find(e => e.type === 'jd');
      if (recent) return recent.entity;
    }
    if (entityType === 'requisition') {
      if (ctx.selectedRequisition) return ctx.selectedRequisition;
      const recent = ctx.recentEntities.find(e => e.type === 'requisition');
      if (recent) return recent.entity;
    }
    return null;
  }

  clearFileAttachment() {
    delete this._context.file;
    delete this._context.attachedFile;
    delete this._context.uploadedFile;
    delete this._context.activeFile;
    this._context.timestamp = Date.now();
    this._notifyListeners();
  }

  resetTemporarySessionContext() {
    this.clearFileAttachment();
    this._context.selectedCandidateId = null;
    this._context.selectedCandidate = null;
    this._context.selectedJdId = null;
    this._context.selectedJd = null;
    this._context.selectedRequisitionId = null;
    this._context.selectedRequisition = null;
    this._context.recentEntities = [];
    this._context.visibleFormState = {};
    this._context.timestamp = Date.now();
    this._notifyListeners();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners() {
    for (const listener of this._listeners) {
      try {
        listener(this.getContext());
      } catch (e) {
        console.error('AI Context listener error:', e);
      }
    }
  }
}

export const AIContextService = new AIContextServiceImpl();

