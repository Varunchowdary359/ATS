/**
 * WorkflowRegistry
 * Central registry and session manager for all conversational AI workflows.
 */

import { WorkflowSession } from './WorkflowSession.js';
import { RequisitionWorkflow } from './RequisitionWorkflow.js';
import { JDWorkflow } from './JDWorkflow.js';
import { JobPostingWorkflow } from './JobPostingWorkflow.js';
import { CandidateIntakeWorkflow } from './CandidateIntakeWorkflow.js';

class WorkflowRegistryImpl {
  constructor() {
    this._workflows = new Map();
    this._activeSession = null;

    // Register initial core workflows
    this.registerWorkflow(new RequisitionWorkflow());
    this.registerWorkflow(new JDWorkflow());
    this.registerWorkflow(new JobPostingWorkflow());
    this.registerWorkflow(new CandidateIntakeWorkflow());
  }

  registerWorkflow(workflow) {
    this._workflows.set(workflow.type, workflow);
  }

  getWorkflow(type) {
    return this._workflows.get(type) || null;
  }

  hasActiveSession() {
    return this._activeSession !== null && (this._activeSession.isCollecting() || this._activeSession.isPreview());
  }

  getActiveSession() {
    return this._activeSession;
  }

  startSession(type, initialData = {}) {
    if (this._activeSession) {
      this._activeSession.setStatus('CANCELLED');
    }
    const session = new WorkflowSession(type, initialData);
    this._activeSession = session;
    return session;
  }

  clearActiveSession() {
    if (this._activeSession) {
      this._activeSession.setStatus('CANCELLED');
    }
    this._activeSession = null;
  }

  reset() {
    this.clearActiveSession();
  }
}

export const WorkflowRegistry = new WorkflowRegistryImpl();
