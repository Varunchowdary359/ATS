import React from 'react';
import { Eye, ArrowRight } from 'lucide-react';
import { APPLICATION_STAGE, EXCEPTION_STATUS } from './candidateTypes';

const getStageBadgeStyles = (stage) => {
  switch (stage) {
    case APPLICATION_STAGE.APPLIED:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    case APPLICATION_STAGE.SCREENING:
      return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800';
    case APPLICATION_STAGE.SHORTLISTED:
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case APPLICATION_STAGE.INTERVIEW:
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case APPLICATION_STAGE.OFFER:
      return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
    case APPLICATION_STAGE.HIRED:
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case EXCEPTION_STATUS.REJECTED:
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    case EXCEPTION_STATUS.WITHDRAWN:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    case EXCEPTION_STATUS.ON_HOLD:
      return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};

const CandidateTable = ({
  candidates = [],
  selectedIds = [],
  onSelectCandidate,
  onSelectAll,
  onOpenProfile,
  onOpenStageTransition,
  brandColor = 'var(--pw-brand)',
  visibleColumns = {},
  density = 'normal',
  isLoading = false
}) => {

  const isAllSelected = candidates.length > 0 && selectedIds.length === candidates.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < candidates.length;

  const cellPadding = density === 'compact' ? 'py-2 px-3' : density === 'spacious' ? 'py-4 px-4' : 'py-3 px-3.5';

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-b-2xl">
      <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
        <thead>
          <tr className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {/* Checkbox Column */}
            <th className="py-3 px-3.5 w-10 text-center sticky left-0 z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[var(--pw-brand)] focus:ring-[var(--pw-brand)] cursor-pointer"
              />
            </th>

            {visibleColumns.candidate !== false && (
              <th className="py-3 px-3.5 text-left whitespace-nowrap">Candidate</th>
            )}

            {visibleColumns.phone !== false && (
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Phone Number</th>
            )}

            {visibleColumns.candidateId !== false && (
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Candidate ID</th>
            )}

            {visibleColumns.appliedRole !== false && (
              <th className="py-3 px-3.5 text-left whitespace-nowrap">Applied Role & Req</th>
            )}

            {visibleColumns.source !== false && (
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Source</th>
            )}

            {visibleColumns.stage !== false && (
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Current Stage</th>
            )}

            {visibleColumns.score !== false && (
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Match Score</th>
            )}

            {visibleColumns.experience !== false && (
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Experience</th>
            )}

            {visibleColumns.location !== false && (
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Location</th>
            )}

            {visibleColumns.recruiter !== false && (
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Assigned Recruiter</th>
            )}

            {visibleColumns.lastActivity !== false && (
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Last Activity</th>
            )}

            <th className="py-3 px-3.5 text-center w-24 sticky right-0 z-30 bg-slate-50 dark:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800/60 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0f111a]">
          {candidates.map((candidate) => {
            const isSelected = selectedIds.includes(candidate.id);
            const primaryApp = candidate.primaryApplication;

            return (
              <tr
                key={candidate.id}
                onClick={() => onOpenProfile(candidate)}
                className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                  isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                }`}
              >
                {/* Select checkbox */}
                <td 
                  className={`${cellPadding} text-center sticky left-0 z-20 transition-colors ${
                    isSelected 
                      ? 'bg-blue-50/60 dark:bg-blue-950/40' 
                      : 'bg-white dark:bg-[#0f111a] group-hover:bg-slate-50 dark:group-hover:bg-slate-800'
                  } border-r border-slate-200/60 dark:border-slate-800/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]`} 
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectCandidate(candidate.id)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[var(--pw-brand)] focus:ring-[var(--pw-brand)] cursor-pointer"
                  />
                </td>

                {/* Candidate Info */}
                {visibleColumns.candidate !== false && (
                  <td className={cellPadding}>
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: candidate.avatarBg || brandColor }}
                      >
                        {candidate.avatar || 'CD'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate hover:underline">
                            {candidate.name}
                          </span>
                          {candidate.applicationsCount > 1 && (
                            <span 
                              className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 whitespace-nowrap shrink-0"
                              title={`${candidate.applicationsCount} active applications`}
                            >
                              {candidate.applicationsCount} Reqs
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          <span className="truncate">{candidate.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                )}

                {/* Phone Number */}
                {visibleColumns.phone !== false && (
                  <td className={`${cellPadding} text-center whitespace-nowrap`}>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {candidate.formattedPhone || candidate.phone || '—'}
                    </span>
                  </td>
                )}

                {/* Candidate ID */}
                {visibleColumns.candidateId !== false && (
                  <td className={`${cellPadding} text-center whitespace-nowrap`}>
                    <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap inline-flex items-center shrink-0">
                      {candidate.candidateNumber || candidate.id}
                    </span>
                  </td>
                )}

                {/* Applied Role & Req */}
                {visibleColumns.appliedRole !== false && (
                  <td className={cellPadding}>
                    <div className="min-w-[150px]">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {candidate.appliedRole}
                      </div>
                      {candidate.requisitionId ? (
                        <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                          <span>{candidate.requisitionId}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic whitespace-nowrap">Talent Pool</span>
                      )}
                    </div>
                  </td>
                )}

                {/* Source */}
                {visibleColumns.source !== false && (
                  <td className={`${cellPadding} text-center whitespace-nowrap`}>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0">
                      {candidate.source}
                    </span>
                  </td>
                )}

                {/* Current Stage */}
                {visibleColumns.stage !== false && (
                  <td className={`${cellPadding} text-center whitespace-nowrap`}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap shrink-0 ${getStageBadgeStyles(candidate.currentStage)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      <span>{candidate.currentStage}</span>
                    </span>
                  </td>
                )}

                {/* Match Score */}
                {visibleColumns.score !== false && (
                  <td className={`${cellPadding} text-center whitespace-nowrap`}>
                    {candidate.screeningScore !== null ? (
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <div className="w-14 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                          <div 
                            className={`h-full rounded-full ${
                              candidate.screeningScore >= 85 
                                ? 'bg-emerald-500' 
                                : candidate.screeningScore >= 70 
                                  ? 'bg-blue-500' 
                                  : 'bg-amber-500'
                            }`}
                            style={{ width: `${candidate.screeningScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0">
                          {candidate.screeningScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic whitespace-nowrap">Unscreened</span>
                    )}
                  </td>
                )}

                {/* Experience */}
                {visibleColumns.experience !== false && (
                  <td className={`${cellPadding} text-center whitespace-nowrap`}>
                    <div className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {candidate.experienceDisplay || `${candidate.totalExperience || 0} yrs`}
                    </div>
                    {candidate.currentCompany && (
                      <div className="text-[11px] text-slate-400 truncate max-w-[130px] mx-auto">
                        {candidate.currentCompany}
                      </div>
                    )}
                  </td>
                )}

                {/* Location */}
                {visibleColumns.location !== false && (
                  <td className={`${cellPadding} text-center`}>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px] block mx-auto">
                      {candidate.location}
                    </span>
                  </td>
                )}

                {/* Assigned Recruiter */}
                {visibleColumns.recruiter !== false && (
                  <td className={`${cellPadding} text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {candidate.assignedRecruiter ? candidate.assignedRecruiter[0] : 'U'}
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                        {candidate.assignedRecruiter}
                      </span>
                    </div>
                  </td>
                )}

                {/* Last Activity */}
                {visibleColumns.lastActivity !== false && (
                  <td className={`${cellPadding} text-center`}>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(candidate.lastActivity).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                )}

                {/* Actions */}
                <td 
                  className={`${cellPadding} text-center sticky right-0 z-20 transition-colors ${
                    isSelected 
                      ? 'bg-blue-50/60 dark:bg-blue-950/40' 
                      : 'bg-white dark:bg-[#0f111a] group-hover:bg-slate-50 dark:group-hover:bg-slate-800'
                  } border-l border-slate-200/60 dark:border-slate-800/60 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)]`} 
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center gap-1.5 relative py-0.5">
                    <button
                      type="button"
                      title="Inspect Candidate"
                      onClick={() => onOpenProfile(candidate)}
                      className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Eye size={13.5} />
                    </button>

                    {primaryApp && (
                      <button
                        type="button"
                        title="Advance / Change Stage"
                        onClick={() => onOpenStageTransition(candidate, primaryApp)}
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <ArrowRight size={13.5} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CandidateTable;
