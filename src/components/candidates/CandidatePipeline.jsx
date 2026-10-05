import React, { useState, useContext } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, Star, ChevronRight, 
  CheckCircle2, ArrowRight, Sparkles, Filter, Search 
} from 'lucide-react';
import { PIPELINE_STAGES } from './candidateMockData';
import ModernSearchInput from '../dashboard/shared/ModernSearchInput';
import CandidateRejectionModal from './modals/CandidateRejectionModal';
import { ThemeContext } from '../../ThemeContext';
import { canChangeStage } from './candidatePermissions';
import { validateStageTransition } from './candidateStageRules';
import CustomSelect from '../dashboard/shared/CustomSelect';

const CandidatePipeline = ({ candidates, onSelectCandidate, onUpdateCandidate }) => {
  const { activeRole } = useContext(ThemeContext);
  const allowStageChange = canChangeStage(activeRole);

  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingCandidate, setRejectingCandidate] = useState(null);

  const filteredCandidates = (candidates || []).filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.candidateName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.currentTitle?.toLowerCase().includes(q) ||
      c.skills?.some(s => s.toLowerCase().includes(q))
    );
  });

  const handleMoveStage = (candidate, newStageId) => {
    const prevStage = candidate.stage || 'Applied';
    if (prevStage === newStageId) return;

    const validation = validateStageTransition(candidate, prevStage, newStageId);
    if (!validation.allowed) {
      alert(validation.reason);
      return;
    }

    if (newStageId === 'Rejected') {
      setRejectingCandidate(candidate);
      return;
    }

    const newTimelineItem = {
      id: `tl-${Date.now()}`,
      event: 'Pipeline Stage Changed',
      description: `Candidate moved from ${prevStage} to ${newStageId} via Pipeline Board`,
      user: activeRole?.label || 'Recruiter',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedApps = (candidate.applications || []).map(app => ({
      ...app,
      stage: newStageId,
      lastUpdated: new Date().toISOString().split('T')[0]
    }));

    const updated = {
      ...candidate,
      stage: newStageId,
      applications: updatedApps,
      timeline: [newTimelineItem, ...(candidate.timeline || [])]
    };

    onUpdateCandidate(updated);
  };

  const handleConfirmRejection = ({ reason, comments }) => {
    if (!rejectingCandidate) return;

    const prevStage = rejectingCandidate.stage;
    const newStageId = 'Rejected';

    const newTimelineItem = {
      id: `tl-${Date.now()}`,
      event: 'Candidate Rejected',
      description: `Rejected from ${prevStage} via Pipeline Board. Reason: ${reason}${comments ? ` (${comments})` : ''}`,
      user: activeRole?.label || 'Recruiter',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedApps = (rejectingCandidate.applications || []).map(app => ({
      ...app,
      stage: newStageId,
      status: 'Rejected',
      lastUpdated: new Date().toISOString().split('T')[0]
    }));

    const updated = {
      ...rejectingCandidate,
      stage: newStageId,
      processingStatus: 'Rejected',
      applications: updatedApps,
      timeline: [newTimelineItem, ...(rejectingCandidate.timeline || [])]
    };

    onUpdateCandidate(updated);
    setRejectingCandidate(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full max-w-md">
          <ModernSearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates in pipeline..."
          />
        </div>
        <div className="text-xs font-mono text-slate-500 font-semibold">
          {filteredCandidates.length} Active Candidate(s) in Recruitment Funnel
        </div>
      </div>

      {/* Interactive Kanban Columns Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto scrollbar-none pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageCandidates = filteredCandidates.filter(c => (c.stage || 'Applied') === stage.id);

          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 min-w-[240px] h-full"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: stage.color }} />
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {stage.label}
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[650px] scrollbar-none">
                {stageCandidates.length > 0 ? (
                  stageCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      onClick={() => onSelectCandidate(cand)}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-500/40 transition-all cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                            {cand.candidateName ? cand.candidateName.substring(0, 2).toUpperCase() : 'CN'}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {cand.candidateName}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate max-w-[130px]">
                              {cand.currentTitle || 'Applicant'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        <p className="truncate font-semibold">{cand.currentCompany || 'Previous Co.'}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{cand.location}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {cand.screeningResult?.overall || 85}% Match
                        </span>

                        {/* Quick Stage Move Dropdown */}
                        {allowStageChange ? (
                          <div className="w-28" onClick={(e) => e.stopPropagation()}>
                            <CustomSelect
                              value={cand.stage || 'Applied'}
                              onChange={(val) => handleMoveStage(cand, val)}
                              options={PIPELINE_STAGES.map(s => ({ value: s.id, label: s.label }))}
                              size="sm"
                            />
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {cand.stage}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-[11px] italic">
                    No candidates in {stage.label}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CandidateRejectionModal
        isOpen={Boolean(rejectingCandidate)}
        onClose={() => setRejectingCandidate(null)}
        candidate={rejectingCandidate}
        onConfirmReject={handleConfirmRejection}
      />

    </div>
  );
};

export default CandidatePipeline;
