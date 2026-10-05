/**
 * AI Conversation Service
 * Manages active conversation messages, reactive event broadcasting,
 * suggestion chip generation based on current route, and chat session state.
 */

import { AIMemoryService } from './AIMemoryService.js';
import { AIContextService } from './AIContextService.js';
import { WorkflowRegistry } from './workflow/WorkflowRegistry.js';

class AIConversationServiceImpl {
  constructor() {
    this._listeners = new Set();
    this._isProcessing = false;
  }

  getMessages() {
    return AIMemoryService.getHistory();
  }

  isProcessing() {
    return this._isProcessing;
  }

  setProcessing(status) {
    this._isProcessing = !!status;
    this._notify();
  }

  addMessage(msg) {
    const created = AIMemoryService.addMessage(msg);
    this._notify();
    return created;
  }

  clearConversation() {
    AIMemoryService.reset();
    WorkflowRegistry.clearActiveSession();
    AIContextService.resetTemporarySessionContext();
    this._isProcessing = false;
    this._notify();
  }

  /**
   * Generates dynamic contextual suggestion chips based on active ATS page & entity
   */
  getSuggestions(context = {}) {
    const view = context.activeView || 'dashboard';

    switch (view) {
      case 'requisitions':
      case 'requisition/create':
        return [
          { label: 'Create new Java Requisition', prompt: 'Create requisition for Senior Java Developer with 2 openings in Bangalore' },
          { label: 'Show pending requisitions', prompt: 'Show all pending requisitions' },
          { label: 'Approve current requisition', prompt: 'Approve this requisition' }
        ];

      case 'job descriptions':
        return [
          { label: 'Approve this JD', prompt: 'Approve this JD' },
          { label: 'Publish to LinkedIn & Careers', prompt: 'Publish this JD to LinkedIn and Careers Portal' },
          { label: 'Draft new React JD', prompt: 'Draft a Job Description for Senior React Engineer' }
        ];

      case 'candidates':
      case 'candidate management':
        return [
          { label: 'Find React candidates', prompt: 'Find candidates with React and 4 years experience' },
          { label: 'Screen candidate', prompt: 'Screen this candidate against the active requisition' },
          { label: 'Update candidate email', prompt: "Change candidate's email to user@company.com" }
        ];

      case 'interviews':
        return [
          { label: 'Schedule interview tomorrow', prompt: "Schedule Rahul's interview tomorrow at 11 AM" },
          { label: 'Generate interview questions', prompt: 'Generate 3 technical interview questions for this role' },
          { label: 'Show scheduled interviews', prompt: 'Show all scheduled interviews for this week' }
        ];

      case 'dashboard':
      default:
        return [
          { label: 'Show pending approvals', prompt: 'What approvals are pending right now?' },
          { label: 'Recruitment funnel breakdown', prompt: 'Give me the full recruitment funnel breakdown' },
          { label: 'Help & Supported Actions', prompt: 'What actions can you execute for me?' }
        ];
    }
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    const msgs = this.getMessages();
    for (const l of this._listeners) {
      try {
        l(msgs, this._isProcessing);
      } catch (e) {
        console.error('AI conversation listener error:', e);
      }
    }
  }
}

export const AIConversationService = new AIConversationServiceImpl();
