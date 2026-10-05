/**
 * Master AI Service Facade
 * Central entry point for all PeopleWorks AI Agent operations across the application.
 */

import { MockAIProvider } from './MockAIProvider.js';
import { AIContextService } from './AIContextService.js';
import { AIConversationService } from './AIConversationService.js';
import { AIDocumentService } from './AIDocumentService.js';
import { AIToolRegistry } from './AIToolRegistry.js';
import { AIToolExecutor } from './AIToolExecutor.js';
import { AIAuditService } from './AIAuditService.js';
import { AIMemoryService } from './AIMemoryService.js';
import { WorkflowRegistry } from './workflow/WorkflowRegistry.js';

class AIServiceImpl {
  constructor() {
    this._provider = new MockAIProvider();
    this._activeRequestPromise = null;
    this._activePrompt = '';
    this._lastSentPrompt = '';
    this._lastSentTimestamp = 0;
  }

  reset() {
    this._activeRequestPromise = null;
    this._activePrompt = '';
    this._lastSentPrompt = '';
    this._lastSentTimestamp = 0;
  }

  /**
   * Resets temporary conversational AI session and context (without deleting ATS business data)
   */
  resetAISession() {
    this.reset();
    AIMemoryService.reset();
    WorkflowRegistry.clearActiveSession();
    AIContextService.resetTemporarySessionContext();
  }

  /**
   * Clears temporary candidate intake workflow session and attachments
   */
  resetCandidateIntakeState() {
    const activeSession = WorkflowRegistry.getActiveSession();
    if (activeSession && activeSession.type === 'CREATE_CANDIDATE_FROM_RESUME') {
      WorkflowRegistry.clearActiveSession();
    }
    AIContextService.clearFileAttachment();
  }

  /**
   * Sets a custom AI provider (e.g. for future server LLM integration)
   */
  setProvider(provider) {
    this._provider = provider;
  }

  getProvider() {
    return this._provider;
  }

  /**
   * Sends a prompt to the AI Agent with robust idempotency and deduplication
   */
  async sendMessage(prompt, options = {}) {
    const cleanPrompt = typeof prompt === 'string' ? prompt.trim() : String(prompt || '').trim();
    if (!cleanPrompt) return null;

    // Guard: If an identical or active request is currently executing, reuse or wait
    if (this._activeRequestPromise) {
      if (this._activePrompt === cleanPrompt) {
        return await this._activeRequestPromise;
      }
      return await this._activeRequestPromise;
    }

    const now = Date.now();
    // Guard against rapid duplicate submission (within 300ms debounce)
    if (this._lastSentPrompt === cleanPrompt && (now - this._lastSentTimestamp) < 300) {
      if (this._activeRequestPromise) {
        return await this._activeRequestPromise;
      }
      return null;
    }

    this._activePrompt = cleanPrompt;
    this._lastSentPrompt = cleanPrompt;
    this._lastSentTimestamp = now;

    // Generate unique request and message IDs
    const userMsgId = `MSG-USR-${now}-${Math.floor(Math.random() * 1000000)}`;
    const assistantMsgId = `MSG-AI-${now}-${Math.floor(Math.random() * 1000000)}`;

    const executionPromise = (async () => {
      AIConversationService.setProcessing(true);
      
      // Add exactly ONE user message with deterministic ID
      AIConversationService.addMessage({
        id: userMsgId,
        role: 'user',
        content: cleanPrompt,
        timestamp: now
      });

      // 6-second timeout safety guard
      let timerId;
      const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => reject(new Error('AI_REQUEST_TIMEOUT')), 6000);
      });

      try {
        const baseContext = AIContextService.getContext();
        const context = {
          ...baseContext,
          ...options,
          ...(options.context || {}),
          file: options.file || options.attachment || options.uploadedFile || baseContext.file || baseContext.attachedFile,
          requisitionId: options.requisitionId || options.context?.requisitionId || baseContext.requisitionId
        };
        const history = AIConversationService.getMessages();
        const tools = AIToolRegistry.getAllTools();

        const providerPromise = this._provider.generateCompletion({
          prompt: cleanPrompt,
          history,
          context,
          tools
        });

        const response = await Promise.race([providerPromise, timeoutPromise]);
        clearTimeout(timerId);

        const responseText = (response && typeof response.text === 'string')
          ? response.text
          : ((response && typeof response.content === 'string') ? response.content : 'Hello! How can I help you today?');
        const cards = Array.isArray(response?.cards) ? response.cards : [];
        const toolCalls = Array.isArray(response?.toolCalls) ? response.toolCalls : [];

        // Add exactly ONE assistant message with deterministic ID
        AIConversationService.addMessage({
          id: assistantMsgId,
          role: 'assistant',
          content: responseText,
          cards,
          toolCalls,
          timestamp: Date.now()
        });

        return {
          id: assistantMsgId,
          role: 'assistant',
          text: responseText,
          content: responseText,
          cards,
          toolCalls,
          createdAt: new Date().toISOString()
        };
      } catch (err) {
        clearTimeout(timerId);
        console.error('AIService sendMessage error:', err);
        const isTimeout = err?.message === 'AI_REQUEST_TIMEOUT';
        const errorMsg = isTimeout
          ? '⏱️ The AI request timed out. Please check your connection and try again.'
          : '⚠️ I ran into a problem while processing that request. Please try again.';

        AIConversationService.addMessage({
          id: assistantMsgId,
          role: 'assistant',
          content: errorMsg,
          cards: [],
          toolCalls: [],
          timestamp: Date.now()
        });

        return {
          id: assistantMsgId,
          role: 'assistant',
          text: errorMsg,
          content: errorMsg,
          cards: [],
          toolCalls: [],
          createdAt: new Date().toISOString()
        };
      } finally {
        AIConversationService.setProcessing(false);
        this._activeRequestPromise = null;
        this._activePrompt = '';
      }
    })();

    this._activeRequestPromise = executionPromise;
    return await executionPromise;
  }

  /**
   * Ingests and processes an uploaded resume file within the conversational workflow
   */
  async processResumeUpload(file, requisitionId = '') {
    if (!file) return null;
    AIContextService.setContext({ file, attachedFile: file });
    return await this.sendMessage(`Uploaded resume: ${file.name}`, { file, requisitionId });
  }

  /**
   * Commits a parsed candidate record
   */
  async commitCandidate(candidateModel, requisitionId = '') {
    return await AIDocumentService.commitParsedCandidate(candidateModel, requisitionId);
  }

  /**
   * Context helper
   */
  setContext(partialCtx) {
    AIContextService.setContext(partialCtx);
  }

  getContext() {
    return AIContextService.getContext();
  }

  getRecentAuditLogs() {
    return AIAuditService.getRecentLogs();
  }
}

export const AIService = new AIServiceImpl();
