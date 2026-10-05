import React from 'react';
import { User, MessagesSquare } from 'lucide-react';
import AIActionCard from './AIActionCard';
import AIResultCard from './AIResultCard';

export default function AIMessage({ message, onActionClick }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 my-2.5 ${isUser ? 'justify-end' : 'justify-start'} text-start font-sans`}>
      {!isUser && (
        <div 
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 text-white"
          style={{
            background: 'linear-gradient(135deg, var(--pw-brand, #0284c7) 0%, color-mix(in srgb, var(--pw-brand, #0284c7) 80%, #000) 100%)'
          }}
        >
          <MessagesSquare className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div 
        style={isUser ? {
          backgroundColor: 'var(--pw-brand, #0284c7)',
          color: 'var(--pw-brand-fg, #ffffff)'
        } : undefined}
        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
          isUser
            ? 'rounded-br-xs'
            : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-bl-xs'
        }`}
      >
        <div className="whitespace-pre-wrap font-sans">
          {message.content}
        </div>

        {/* Structured Cards */}
        {message.cards && message.cards.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-1.5">
            {message.cards.map((card, idx) => {
              if (card.type === 'action_result' || card.type === 'approval_result' || card.type === 'interview_card') {
                return <AIActionCard key={idx} card={card} onActionClick={onActionClick} />;
              }
              return <AIResultCard key={idx} card={card} onActionClick={onActionClick} />;
            })}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}
