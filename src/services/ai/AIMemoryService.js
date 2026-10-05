/**
 * AI Memory Service
 * Manages conversation history, dialog state machines, coreference resolution,
 * pronoun binding ("him", "this candidate", "that JD"), and multi-step plan checkpoints.
 */

class AIMemoryServiceImpl {
  constructor() {
    this._conversationId = `CONV-${Date.now()}`;
    this._history = [];
    this._seenIds = new Set();
    this._slots = {}; // Persistent slot values across turns (e.g. candidateId, targetDate, targetTime)
    this._activeFormFlow = null; // When building a form conversationally
    this._lastMentionedEntity = null;
  }

  reset() {
    this._conversationId = `CONV-${Date.now()}`;
    this._history = [];
    this._seenIds = new Set();
    this._slots = {};
    this._activeFormFlow = null;
    this._lastMentionedEntity = null;
  }

  getConversationId() {
    return this._conversationId;
  }

  addMessage(message) {
    if (!message) return null;
    if (!this._seenIds) this._seenIds = new Set();
    if (!Array.isArray(this._history)) this._history = [];
    
    // Generate stable ID if not provided
    const msgId = message.id || `MSG-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    
    // Idempotency check 1: Exact ID match
    if (this._seenIds.has(msgId)) {
      const existing = this._history.find(m => m.id === msgId);
      if (existing) return existing;
    }

    // Idempotency check 2: Deduplicate identical role + content sent within 1500ms
    const now = Date.now();
    const recentDuplicate = this._history.slice(-3).find(m => 
      m.role === message.role && 
      m.content === message.content && 
      (now - (m.timestamp || now)) < 1500
    );
    if (recentDuplicate) {
      return recentDuplicate;
    }

    const msg = {
      id: msgId,
      timestamp: message.timestamp || now,
      ...message
    };

    this._seenIds.add(msg.id);
    this._history.push(msg);
    return msg;
  }

  getHistory(limit = 50) {
    return this._history.slice(-limit);
  }

  setSlot(key, value) {
    this._slots[key] = value;
  }

  getSlot(key) {
    return this._slots[key];
  }

  clearSlot(key) {
    delete this._slots[key];
  }

  getSlots() {
    return { ...this._slots };
  }

  setLastMentionedEntity(entityType, entity) {
    this._lastMentionedEntity = { type: entityType, entity, timestamp: Date.now() };
    this.setSlot(`last_${entityType}`, entity);
  }

  getLastMentionedEntity(entityType = null) {
    if (!entityType) return this._lastMentionedEntity;
    if (this._lastMentionedEntity?.type === entityType) return this._lastMentionedEntity.entity;
    return this.getSlot(`last_${entityType}`) || null;
  }

  // Multi-turn conversational form session
  startFormFlow(formType, initialData = {}, requiredFields = []) {
    this._activeFormFlow = {
      formType,
      data: { ...initialData },
      requiredFields,
      currentStep: 0,
      startedAt: Date.now()
    };
    return this._activeFormFlow;
  }

  updateFormFlow(partialData) {
    if (!this._activeFormFlow) return null;
    this._activeFormFlow.data = {
      ...this._activeFormFlow.data,
      ...partialData
    };
    return this._activeFormFlow;
  }

  getActiveFormFlow() {
    return this._activeFormFlow;
  }

  clearFormFlow() {
    const flow = this._activeFormFlow;
    this._activeFormFlow = null;
    return flow;
  }
}

export const AIMemoryService = new AIMemoryServiceImpl();
