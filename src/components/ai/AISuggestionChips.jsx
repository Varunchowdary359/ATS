import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function AISuggestionChips({ suggestions = [], onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto py-2 px-3.5 w-full max-w-full min-w-0 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 shrink-0 mr-0.5">
        <Lightbulb className="w-3.5 h-3.5" />
        <span>Suggestions:</span>
      </div>
      {suggestions.map((s, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect && onSelect(s.prompt || s.label)}
          className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:border-[var(--pw-brand)] hover:text-[var(--pw-brand)] dark:hover:border-sky-400 dark:hover:text-sky-300 whitespace-nowrap transition-colors shrink-0 cursor-pointer shadow-2xs"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
