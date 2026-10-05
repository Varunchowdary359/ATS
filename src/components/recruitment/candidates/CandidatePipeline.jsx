import React, { useState } from 'react';
import { 
  Briefcase, ArrowRight, AlertCircle, XCircle, PauseCircle 
} from 'lucide-react';
import { PIPELINE_STAGES, EXCEPTION_STATUS, APPLICATION_STAGE } from './candidateTypes';

const CandidatePipeline = ({
  pipelineData = {},
  onOpenProfile,
  onOpenStageTransition,
  brandColor = 'var(--pw-brand)',
  isLoading = false
}) => {
  const [selectedExceptionStatus, setSelectedExceptionStatus] = useState(null);

  const columns = pipelineData.columns || {};
  const exceptionCounts = pipelineData.exceptionCounts || {};

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Exception Status Banner / Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Exception Applications:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedExceptionStatus(selectedExceptionStatus === EXCEPTION_STATUS.REJECTED ? null : EXCEPTION_STATUS.REJECTED)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                selectedExceptionStatus === EXCEPTION_STATUS.REJECTED
                  ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200'
                  : 'bg-white dark:bg-slate-800 text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50'
              }`}
            >
              <XCircle size={12} />
              <span>Rejected ({exceptionCounts[EXCEPTION_STATUS.REJECTED] || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedExceptionStatus(selectedExceptionStatus === EXCEPTION_STATUS.WITHDRAWN ? null : EXCEPTION_STATUS.WITHDRAWN)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                selectedExceptionStatus === EXCEPTION_STATUS.WITHDRAWN
                  ? 'bg-slate-200 text-slate-900 border-slate-400 dark:bg-slate-700 dark:text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertCircle size={12} />
              <span>Withdrawn ({exceptionCounts[EXCEPTION_STATUS.WITHDRAWN] || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedExceptionStatus(selectedExceptionStatus === EXCEPTION_STATUS.ON_HOLD ? null : EXCEPTION_STATUS.ON_HOLD)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                selectedExceptionStatus === EXCEPTION_STATUS.ON_HOLD
                  ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/80 dark:text-orange-200'
                  : 'bg-white dark:bg-slate-800 text-orange-600 border-orange-200 dark:border-orange-900/60 hover:bg-orange-50'
              }`}
            >
              <PauseCircle size={12} />
              <span>On Hold ({exceptionCounts[EXCEPTION_STATUS.ON_HOLD] || 0})</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Strict sequential pipeline enforcement active • Managerial override required for stage skipping
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageApps = columns[stage.id] || [];

          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-2.5 min-w-[240px] max-h-[800px]"
            >
              {/* Stage Column Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {stage.label}
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {stageApps.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5 overflow-y-auto pr-1 scrollbar-thin max-h-[700px]">
                {stageApps.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-[11px] font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No candidates
                  </div>
                ) : (
                  stageApps.map(app => (
                    <div
                      key={app.id}
                      onClick={() => onOpenProfile({ id: app.candidateId, name: app.candidateName })}
                      className="group p-3 rounded-xl bg-white dark:bg-[#121624] border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer space-y-2.5"
                    >
                      {/* Top Header: Candidate Name & Avatar */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div 
                            className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-[11px] shrink-0"
                            style={{ backgroundColor: app.avatarBg || brandColor }}
                          >
                            {app.avatar || 'CD'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                              {app.candidateName}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {app.candidateNumber}
                            </p>
                          </div>
                        </div>

                        {/* Screening Score Badge */}
                        {app.screeningScore !== null && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold shrink-0 ${
                            app.screeningScore >= 85 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : app.screeningScore >= 70
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {app.screeningScore}%
                          </span>
                        )}
                      </div>

                      {/* Job Title & Requisition */}
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {app.jobTitle}
                        </div>
                        <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                          <Briefcase size={10} />
                          <span>{app.requisitionId}</span>
                        </div>
                      </div>

                      {/* Details: Experience, Location */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="font-medium">{app.experienceDisplay}</span>
                        <span className="truncate max-w-[100px]">{app.location}</span>
                      </div>

                      {/* Footer: Recruiter & Stage Advance Action */}
                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold flex items-center justify-center">
                            {app.assignedRecruiter ? app.assignedRecruiter[0] : 'U'}
                          </div>
                          <span className="truncate max-w-[80px]">{app.assignedRecruiter}</span>
                        </div>

                        {stage.id !== APPLICATION_STAGE.HIRED && (
                          <button
                            type="button"
                            title="Advance Stage"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenStageTransition({ id: app.candidateId, name: app.candidateName }, app);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                          >
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CandidatePipeline;
