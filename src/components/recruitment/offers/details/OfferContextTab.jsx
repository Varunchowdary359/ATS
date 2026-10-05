import React from 'react';

export const OfferContextTab = ({ offer }) => {
  if (!offer) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 animate-fade-in-up">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Candidate & Requisition Context</h3>
        <p className="text-xs text-slate-500">Target role, applicant identity, and hiring team details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Applicant Details</h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">Full Name:</span> <strong className="text-slate-900 dark:text-white">{offer.candidateName}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">Email:</span> <span className="text-slate-800 dark:text-slate-200">{offer.candidateEmail}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Phone:</span> <span className="text-slate-800 dark:text-slate-200">{offer.candidatePhone}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Current Location:</span> <span className="text-slate-800 dark:text-slate-200">{offer.candidateLocation}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Application ID:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{offer.applicationId}</span></div>
          </div>
        </div>

        <div className="p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Position & Team</h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">Target Role:</span> <strong className="text-slate-900 dark:text-white">{offer.jobTitle}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">Department:</span> <span className="text-slate-800 dark:text-slate-200">{offer.department}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Requisition ID:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{offer.requisitionId}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Hiring Manager:</span> <span className="text-slate-800 dark:text-slate-200">{offer.hiringManagerName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Recruiter:</span> <span className="text-slate-800 dark:text-slate-200">{offer.recruiterName}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
