import React from 'react';
import { Mail, Phone, Activity, Send, CheckCircle2, Clock, Plus } from 'lucide-react';

const CandidateActivitiesCommView = ({ candidate, type = 'all', onSendEmail }) => {
  if (!candidate) return null;

  const showActivities = type === 'all' || type === 'activities';
  const showComm = type === 'all' || type === 'communication';

  const activities = candidate.activities || [];
  const communications = candidate.communications || [];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Communication History */}
      {showComm && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Communication History
              </h3>
            </div>
            <button
              onClick={onSendEmail}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Compose Email
            </button>
          </div>

          {communications.length > 0 ? (
            <div className="space-y-3">
              {communications.map((comm) => (
                <div key={comm.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${comm.direction === 'Sent' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {comm.direction}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{comm.subject}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{comm.timestamp}</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 font-mono">
                    <span>From: {comm.sender} $\rightarrow$ To: {comm.recipient}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{comm.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
              No communication history logged yet.
            </div>
          )}
        </div>
      )}

      {/* Recruiter Activity Log */}
      {showActivities && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Recruiter Activities &amp; Actions Log
            </h3>
          </div>

          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{act.type}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono block">{act.timestamp}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">By: {act.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
              No activity logs recorded.
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CandidateActivitiesCommView;
