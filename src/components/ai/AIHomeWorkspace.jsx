import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, MessageSquare, ShieldCheck, History, UploadCloud, Play, CheckCircle2, ArrowRight, Zap, Award, FileText } from 'lucide-react';
import AIChatPanel from './AIChatPanel';
import AIInterviewPanel from './AIInterviewPanel';
import { AIService } from '../../services/ai/AIService.js';
import { AIAuditService } from '../../services/ai/AIAuditService.js';

export default function AIHomeWorkspace({ onNavigate }) {
  const [recentLogs, setRecentLogs] = useState([]);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  useEffect(() => {
    setRecentLogs(AIAuditService.getRecentLogs(6));
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-full min-h-[720px] font-sans text-start">
      {/* Left Column: Command Center & Activity Feed */}
      <div className="flex-1 flex flex-col gap-5">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-brand via-sky-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-3 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PeopleWorks AI Copilot Agent</span>
            </div>
            <h2 className="text-2xl font-black mb-1">Your Intelligent Recruitment Command Center</h2>
            <p className="text-xs text-white/80 max-w-xl leading-relaxed">
              Automate hiring workflows conversationally. Execute requisition creation, JD approvals, candidate resume screening, and simulated interview scheduling under your role permissions.
            </p>
          </div>
          <div className="absolute top-0 end-0 -mt-10 -me-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* Action Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            onClick={() => AIService.sendMessage('Approve this JD')}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand/50 dark:hover:border-sky-500/50 transition-all cursor-pointer shadow-xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Approve Job Descriptions</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Validate and approve pending JDs in one click.</p>
          </div>

          <div
            onClick={() => AIService.sendMessage('Schedule interview for Rahul tomorrow at 11 AM')}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand/50 dark:hover:border-sky-500/50 transition-all cursor-pointer shadow-xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Schedule Interviews</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Book rounds, check conflicts and send invites.</p>
          </div>

          <div
            onClick={() => setShowInterviewModal(true)}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand/50 dark:hover:border-sky-500/50 transition-all cursor-pointer shadow-xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Live AI Interview Room</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Interactive technical assessment simulation.</p>
          </div>
        </div>

        {/* Recent AI Activity Audit Stream */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-brand dark:text-sky-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recent AI Agent Actions & Audit Trail</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Immutable Local Log</span>
          </div>

          <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[280px]">
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-slate-400 text-xs my-auto">
                <Bot className="w-8 h-8 mb-1.5 opacity-40" />
                <span>No AI actions recorded yet. Start interacting on the right!</span>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{log.action}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {typeof log.details === 'object' && log.details !== null
                          ? (log.details.candidateName ? `Candidate: ${log.details.candidateName} (${log.details.email || log.details.destination || 'ATS'})` : JSON.stringify(log.details))
                          : String(log.details || '')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Full Integrated Chat Panel */}
      <div className="w-full lg:w-[460px] h-[720px] shrink-0">
        <AIChatPanel />
      </div>

      {/* Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl h-[600px] shadow-2xl">
            <AIInterviewPanel
              candidateName="Rahul Kumar"
              roleTitle="Senior Java Developer"
              onClose={() => setShowInterviewModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
