import React from 'react';
import { Briefcase, Plus, Calendar, User, ExternalLink, Clock } from 'lucide-react';

const CandidateApplicationsView = ({ candidate, onOpenAddJob }) => {
  if (!candidate) return null;

  const applications = candidate.applications || [
    {
      id: 'APP-501',
      jobTitle: candidate.requisitionTitle || 'Senior React Developer',
      requisitionId: candidate.requisitionId || 'REQ-2024-089',
      appliedDate: candidate.uploadedDate || '2026-08-28',
      source: candidate.source || 'Direct',
      stage: candidate.stage || 'Applied',
      status: 'Active',
      recruiter: candidate.candidateOwner || 'Sarah Jenkins',
      lastUpdated: '2026-09-05'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Associated Job Applications
          </h3>
          <p className="text-xs text-slate-500">
            {applications.length} Requisition Application(s) for {candidate.candidateName}
          </p>
        </div>
        <button
          onClick={onOpenAddJob}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Candidate to Another Job
        </button>
      </div>

      <div className="space-y-4">
        {applications.map((app) => (
          <div
            key={app.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  {app.requisitionId}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                  {app.jobTitle}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${app.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-200 text-slate-700'}`}>
                  {app.status}
                </span>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-600 text-white">
                  {app.stage}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Applied Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{app.appliedDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Source</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{app.source}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Recruiter</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{app.recruiter}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Last Activity</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{app.lastUpdated}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default CandidateApplicationsView;
