import React from 'react';
import { History, Clock, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

const CandidateTimelineView = ({ candidate }) => {
  if (!candidate) return null;

  const timeline = candidate.timeline || [
    { id: 'tl-1', event: 'Candidate Added', description: `Ingested via ${candidate.source || 'Upload'}`, user: 'System Parser', timestamp: candidate.uploadedDate || '2026-08-28' },
    { id: 'tl-2', event: 'Screening Completed', description: 'Automated AI screening score calculated', user: 'AI Screening Engine', timestamp: candidate.uploadedDate || '2026-08-28' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Chronological Audit Trail &amp; Candidate History
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{timeline.length} Recorded Events</span>
        </div>

        <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
          {timeline.map((item) => (
            <div key={item.id} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-blue-600 bg-blue-600 shadow-xs" />
              
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {item.event}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 font-sans">
                  {item.description}
                </p>

                <p className="text-[10px] text-slate-400 font-mono pt-1">
                  Actor: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.user}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CandidateTimelineView;
