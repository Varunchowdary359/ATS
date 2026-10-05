/**
 * WorkflowSession
 * Represents an active multi-turn conversational form session with state management,
 * collected field values, step history, and execution status.
 */

export class WorkflowSession {
  constructor(workflowType, initialData = {}) {
    this.id = `WFS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.sessionId = this.id;
    this.type = workflowType;
    this.status = 'COLLECTING'; // 'COLLECTING' | 'PREVIEW' | 'COMPLETED' | 'CANCELLED'
    this.data = { ...initialData };
    this.currentFieldIndex = 0;
    this.history = [];
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.lastEditedField = null;
    this.isEditingFromPreview = false;
    this.activeFileId = null;
    this.userProvidedFields = new Set();
  }

  setField(key, value) {
    this.data[key] = value;
    this.updatedAt = Date.now();
    this.history.push({ key, value, timestamp: Date.now() });
  }

  getField(key, defaultValue = undefined) {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  hasField(key) {
    return this.data[key] !== undefined && this.data[key] !== null && this.data[key] !== '';
  }

  deleteField(key) {
    delete this.data[key];
    this.updatedAt = Date.now();
  }

  clearFields(keys = []) {
    if (Array.isArray(keys) && keys.length > 0) {
      for (const k of keys) {
        delete this.data[k];
      }
    } else {
      this.data = {};
    }
    this.updatedAt = Date.now();
  }

  getAllData() {
    return { ...this.data };
  }

  setStatus(status) {
    this.status = status;
    this.updatedAt = Date.now();
  }

  isCollecting() {
    return this.status === 'COLLECTING';
  }

  isPreview() {
    return this.status === 'PREVIEW';
  }

  isCompleted() {
    return this.status === 'COMPLETED';
  }

  isCancelled() {
    return this.status === 'CANCELLED';
  }
}

