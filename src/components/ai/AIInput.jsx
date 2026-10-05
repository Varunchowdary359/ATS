import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Sparkles, X } from 'lucide-react';
import { AIIntentEngine } from '../../services/ai/AIIntentEngine.js';

export default function AIInput({ onSend, onUploadClick, isProcessing = false, disabled = false }) {
  const [text, setText] = useState('');
  const [detectedLang, setDetectedLang] = useState('en');
  const inputRef = useRef(null);

  const isSubmittingRef = useRef(false);
  const prevProcessingRef = useRef(isProcessing);

  useEffect(() => {
    const lang = AIIntentEngine.detectLanguage(text);
    setDetectedLang(lang);
  }, [text]);

  useEffect(() => {
    if (prevProcessingRef.current && !isProcessing && !disabled) {
      inputRef.current?.focus();
    }
    prevProcessingRef.current = isProcessing;
  }, [isProcessing, disabled]);

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const clean = text.trim();
    if (!clean || isProcessing || disabled || isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setText('');
    
    try {
      onSend(clean);
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 300);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 bg-white dark:bg-[#131722] border-t border-slate-200/80 dark:border-slate-800 shrink-0 font-sans">
      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
        <div className="relative flex items-center bg-slate-100/90 dark:bg-[#0f111a] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-2.5 py-1.5 focus-within:border-[var(--pw-brand)] focus-within:ring-2 focus-within:ring-[var(--pw-brand)]/20 transition-all shadow-xs gap-1.5">
          <button
            type="button"
            onClick={onUploadClick}
            title="Upload Resume for AI analysis"
            className="p-1.5 text-slate-400 hover:text-[var(--pw-brand)] dark:hover:text-sky-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            data-focus-ignore="true"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing || disabled}
            placeholder={
              isProcessing
                ? 'PeopleWorks AI is thinking...'
                : 'Ask PeopleWorks AI anything...'
            }
            style={{
              outline: 'none',
              border: 'none',
              boxShadow: 'none'
            }}
            className="no-focus-ring flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none px-2 py-1 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 min-w-0"
          />

          {text && (
            <button
              type="button"
              onClick={() => setText('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md shrink-0"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {detectedLang !== 'en' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand/10 text-brand dark:bg-sky-950 dark:text-sky-400 uppercase shrink-0">
              {detectedLang === 'te' ? 'తెలుగు' : 'हिंदी'}
            </span>
          )}

          <button
            type="submit"
            disabled={!text.trim() || isProcessing || disabled}
            style={{
              backgroundColor: text.trim() && !isProcessing && !disabled ? 'var(--pw-brand, #0284c7)' : undefined,
              color: 'var(--pw-brand-fg, #ffffff)'
            }}
            className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center"
            title="Send message (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1">
          <span>Press <kbd className="font-mono px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[9.5px]">Enter ↵</kbd> to send</span>
          <span className="font-medium text-[9.5px] opacity-75">PeopleWorks AI</span>
        </div>
      </form>
    </div>
  );
}
