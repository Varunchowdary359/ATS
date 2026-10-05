import React, { useState } from 'react';
import { Calendar, Clock, Video, Plus, CheckCircle2, User, ExternalLink, ShieldCheck, ShieldAlert, Laptop } from 'lucide-react';
import { CandidateInterviewPortalModal } from '../../recruitment/interviews/CandidateInterviewPortalModal';

const CandidateInterviewsView = ({ candidate, onScheduleInterview }) => {
  const [selectedSessionForPortal, setSelectedSessionForPortal] = useState(null);

  if (!candidate) return null;

  const interviews = candidate.interviews || [];
  const upcoming = interviews.filter(i => i.status === 'Upcoming');
  const past = interviews.filter(i => i.status !== 'Upcoming');

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Interview Management &amp; Schedules
          </h3>
          <p className="text-xs text-slate-500">
            {interviews.length} Total Interview Record(s)
          </p>
        </div>
        <button
          onClick={onScheduleInterview}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Schedule New Interview Round
        </button>
      </div>

      {/* Upcoming Interviews */}
      <div className="space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          Upcoming Scheduled Rounds ({upcoming.length})
        </h4>

        {upcoming.length > 0 ? (
          upcoming.map((int) => (
            <div key={int.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-500/30 shadow-md space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">{int.round}</h5>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5" /> Interviewer: {int.interviewer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {int.policyId && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" /> {int.policyName || int.policyId}
                    </span>
                  )}
                  <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-purple-600 text-white shadow-xs">
                    {int.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{int.scheduledDate} ({int.scheduledTime})</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedSessionForPortal({
                      id: int.id,
                      candidateName: candidate.name || 'Candidate',
                      candidateEmail: candidate.email,
                      requisitionTitle: candidate.appliedRole || 'Position',
                      requisitionId: candidate.requisitionId || 'REQ-2026-001',
                      roundName: int.round,
                      roundCategory: 'Technical',
                      scheduledDate: int.scheduledDate,
                      startTime: int.scheduledTime?.split('-')?.[0]?.trim() || '10:00 AM',
                      endTime: int.scheduledTime?.split('-')?.[1]?.trim() || '11:00 AM',
                      duration: 60,
                      policyId: int.policyId || 'POL-INT-TECH-002',
                      policyVersion: int.policyVersion || 'v1.2',
                      policyName: int.policyName || 'Enterprise Technical Assessment Policy',
                      candidatePolicyRequired: true,
                      candidatePolicyAccepted: int.candidatePolicyAccepted || false,
                      interviewers: [{ name: int.interviewer || 'Hiring Lead' }]
                    })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Laptop className="w-3.5 h-3.5" /> Launch Candidate Portal
                  </button>
                  {int.meetingLink && (
                    <a
                      href={int.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs truncate"
                    >
                      <Video className="w-4 h-4" /> Join Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
            No upcoming interviews scheduled. Click "Schedule New Interview Round" to set up a meeting.
          </div>
        )}
      </div>

      {/* Past Completed Interviews */}
      {past.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Past Completed Rounds ({past.length})
          </h4>

          {past.map((int) => (
            <div key={int.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{int.round}</h5>
                  <p className="text-[11px] text-slate-400">Interviewer: {int.interviewer} • Date: {int.scheduledDate}</p>
                </div>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {int.status}
                </span>
              </div>

              {int.feedback && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-[10px] uppercase text-slate-400 block mb-0.5">Feedback &amp; Evaluation</span>
                  {int.feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      {/* Candidate Interview Portal Modal */}
      {selectedSessionForPortal && (
        <CandidateInterviewPortalModal
          isOpen={!!selectedSessionForPortal}
          onClose={() => setSelectedSessionForPortal(null)}
          session={selectedSessionForPortal}
        />
      )}
    </div>
  );
};

export default CandidateInterviewsView;
