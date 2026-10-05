import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, 
  X, 
  Paperclip, 
  FileCheck2,
  Calendar,
  Layers,
  Video,
  MessagesSquare,
  Lightbulb
} from 'lucide-react';
import { AIService } from '../../services/ai/AIService.js';
import { AIConversationService } from '../../services/ai/AIConversationService.js';
import { AIContextService } from '../../services/ai/AIContextService.js';
import AIMessage from './AIMessage';
import AIInput from './AIInput';
import AISuggestionChips from './AISuggestionChips';
import AIFileUpload from './AIFileUpload';
import AIInterviewPanel from './AIInterviewPanel';

export default function AIChatPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initial messages & suggestions
    setMessages(AIConversationService.getMessages());
    const ctx = AIContextService.getContext();
    setSuggestions(AIConversationService.getSuggestions(ctx));

    const unsubscribeConv = AIConversationService.subscribe((msgs, processing) => {
      setMessages([...msgs]);
      setIsProcessing(processing);
    });

    const unsubscribeCtx = AIContextService.subscribe((ctx) => {
      setSuggestions(AIConversationService.getSuggestions(ctx));
    });

    return () => {
      unsubscribeConv();
      unsubscribeCtx();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSendMessage = async (text) => {
    const clean = typeof text === 'string' ? text.trim() : '';
    if (!clean || isProcessing) return;
    try {
      await AIService.sendMessage(clean);
    } catch (e) {
      console.error('AIChatPanel send error:', e);
    }
  };

  const handleActionClick = async (action) => {
    const act = action.actionIntent || action.action || '';
    if (act === 'trigger_file_upload') {
      setShowUpload(true);
      return;
    }
    if (act === 'send_text' || action.text) {
      await handleSendMessage(action.text || action.prompt || act);
      return;
    }
    if (act === 'skip_requisition' || act === 'skip_application' || act === 'add_to_talent_pool' || act === 'proceed_to_talent_pool') {
      await handleSendMessage('Skip');
      return;
    }
    if (act === 'go_back_to_req' || act === 'go_back') {
      await handleSendMessage('Back');
      return;
    }
    if (act === 'confirm_candidate_create') {
      await handleSendMessage('Create Candidate');
    } else if (act === 'use_existing_candidate') {
      await handleSendMessage('Use Existing Candidate');
    } else if (act === 'create_new_candidate') {
      await handleSendMessage('Create New Candidate');
    } else if (act === 'proceed_requisition_link') {
      await handleSendMessage('Proceed to Requisition Link');
    } else if (act === 'view_resume') {
      window.dispatchEvent(new CustomEvent('pw:view_resume', { detail: action }));
      if (typeof window !== 'undefined' && action.fileName) {
        window.dispatchEvent(new CustomEvent('pw:toast', { detail: { type: 'info', message: `Opening resume preview for ${action.fileName}...` } }));
      }
    } else if (act === 'proceed_to_review') {
      await handleSendMessage('Proceed to Candidate Details Review');
    } else if (act === 'proceed_to_final_review') {
      await handleSendMessage('Continue to Final Review');
    } else if (act === 'view_candidate_profile' && action.candidateId) {
      window.dispatchEvent(new CustomEvent('pw:navigate_to_candidate', { detail: { candidateId: action.candidateId } }));
    } else if (act === 'publish_posting' || act === 'confirm_publish') {
      await handleSendMessage('Publish Now');
    } else if (act === 'create_posting' || act === 'confirm_workflow_create' || act === 'save_draft') {
      await handleSendMessage('Save Draft');
    } else if (act === 'edit_posting' || act === 'edit_workflow_field' || act === 'edit_candidate_details') {
      await handleSendMessage('Edit details');
    } else if (act === 'cancel_posting' || act === 'cancel_workflow') {
      await handleSendMessage('Cancel');
    } else if (act === 'confirm_create_jd') {
      await handleSendMessage('Create JD');
    } else if (act === 'confirm_create_requisition') {
      await handleSendMessage('Create this requisition');
    } else if (act === 'schedule_interview') {
      await handleSendMessage('Schedule interview for this candidate tomorrow at 11 AM');
    } else if (act === 'publish_jd') {
      await handleSendMessage(action.jdId ? `Publish ${action.jdId} to LinkedIn and Careers Portal` : `Publish this JD to LinkedIn and Careers Portal`);
    } else if (act === 'move_stage') {
      await handleSendMessage('Move this candidate to Shortlisted stage');
    } else if (act === 'commit_candidate') {
      try {
        await AIService.commitCandidate(action.candidateData, action.requisitionId);
        AIConversationService.addMessage({
          role: 'assistant',
          content: `✅ Candidate **${action.candidateData.candidateName}** has been committed to the Candidate Pool and linked to requisition.`
        });
      } catch (e) {
        AIConversationService.addMessage({
          role: 'assistant',
          content: `⚠️ Failed to save candidate: ${e.message}`
        });
      }
    } else if (typeof act === 'string' && act.length > 0) {
      await handleSendMessage(action.text || action.prompt || act);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0f111a] border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden font-sans text-start">
      {/* Top Header - Clean SaaS Messenger */}
      <div className="px-3.5 py-2.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#131722] shrink-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs relative shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--pw-brand, #0284c7) 0%, color-mix(in srgb, var(--pw-brand, #0284c7) 80%, #000) 100%)'
            }}
          >
            <MessagesSquare className="w-4 h-4 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#131722]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight truncate">PeopleWorks AI</h3>
              <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                Online
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">Recruiting & ATS Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setInterviewCandidate({ name: 'Rahul Kumar', role: 'Senior Java Developer' });
              setShowInterviewModal(true);
            }}
            title="Launch AI Interview Room"
            className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-[var(--pw-brand)] dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-xs font-medium flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700/80 shrink-0 whitespace-nowrap"
          >
            <Video className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[11px] font-semibold">Interview</span>
          </button>

          <button
            type="button"
            onClick={() => AIConversationService.clearConversation()}
            title="Start New Conversation"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="New Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Assistant"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/40 shrink-0 max-w-full overflow-hidden min-w-0">
        <AISuggestionChips
          suggestions={suggestions}
          onSelect={(prompt) => handleSendMessage(prompt)}
        />
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col scrollbar-thin bg-slate-50/30 dark:bg-[#0f111a]/50">
        {messages.length === 0 && !isProcessing && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-2 my-auto">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white mb-3 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, var(--pw-brand, #0284c7) 0%, color-mix(in srgb, var(--pw-brand, #0284c7) 80%, #000) 100%)'
              }}
            >
              <MessagesSquare className="w-5 h-5 text-white" />
            </div>

            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
              How can I help you today?
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mb-4 leading-relaxed">
              Ask questions, approve JDs, schedule interviews, parse resumes, or query hiring analytics.
            </p>

            {/* Structured Prompt Starter Cards */}
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm text-xs">
              <button
                type="button"
                onClick={() => handleSendMessage('Approve this Job Description')}
                className="group p-2.5 rounded-xl bg-white dark:bg-slate-800/90 hover:border-[var(--pw-brand)] dark:hover:border-sky-500 border border-slate-200/90 dark:border-slate-700/80 text-start shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-[var(--pw-brand)] dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11.5px]">Approve Job Description</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Fast-track pending JD approval chains</span>
                  </div>
                </div>
                <span className="text-slate-300 dark:text-slate-600 group-hover:text-[var(--pw-brand)] transition-colors text-xs font-bold">→</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage('Schedule interview for Rahul tomorrow at 11 AM')}
                className="group p-2.5 rounded-xl bg-white dark:bg-slate-800/90 hover:border-[var(--pw-brand)] dark:hover:border-sky-500 border border-slate-200/90 dark:border-slate-700/80 text-start shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11.5px]">Schedule Candidate Interview</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Auto-book slot for candidate & panel</span>
                  </div>
                </div>
                <span className="text-slate-300 dark:text-slate-600 group-hover:text-[var(--pw-brand)] transition-colors text-xs font-bold">→</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage('Show all pending requisitions')}
                className="group p-2.5 rounded-xl bg-white dark:bg-slate-800/90 hover:border-[var(--pw-brand)] dark:hover:border-sky-500 border border-slate-200/90 dark:border-slate-700/80 text-start shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11.5px]">Pending Requisitions</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Review open hiring requests</span>
                  </div>
                </div>
                <span className="text-slate-300 dark:text-slate-600 group-hover:text-[var(--pw-brand)] transition-colors text-xs font-bold">→</span>
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <AIMessage key={msg.id || idx} message={msg} onActionClick={handleActionClick} />
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 my-2 px-1">
            <div 
              className="w-6 h-6 rounded-lg text-white flex items-center justify-center shadow-xs"
              style={{
                background: 'linear-gradient(135deg, var(--pw-brand, #0284c7) 0%, color-mix(in srgb, var(--pw-brand, #0284c7) 80%, #000) 100%)'
              }}
            >
              <MessagesSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-600 dark:text-slate-300">
              <span>PeopleWorks AI is thinking</span>
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" />
                <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse [animation-delay:200ms]" />
                <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse [animation-delay:400ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Modal Overlay if triggered */}
      {showUpload && (
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <AIFileUpload
            onComplete={() => setShowUpload(false)}
            onClose={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* Input Bar */}
      <AIInput
        onSend={handleSendMessage}
        onUploadClick={() => setShowUpload(!showUpload)}
        isProcessing={isProcessing}
      />

      {/* Interactive AI Interview Room Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl h-[600px] shadow-2xl">
            <AIInterviewPanel
              candidateName={interviewCandidate?.name || 'Rahul Kumar'}
              roleTitle={interviewCandidate?.role || 'Senior Java Developer'}
              onClose={() => setShowInterviewModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
