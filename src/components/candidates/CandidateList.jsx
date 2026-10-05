import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ArrowUpDown, Eye, Trash2, Mail, Phone, MapPin, 
  Briefcase, Star, Plus, Download, SlidersHorizontal, CheckCircle2, Award, UserPlus
} from 'lucide-react';
import ModernSearchInput from '../dashboard/shared/ModernSearchInput';
import CustomSelect from '../dashboard/shared/CustomSelect';
import { PIPELINE_STAGES } from './candidateMockData';

const CandidateList = ({ candidates, onSelectCandidate, onDeleteCandidate, onAddCandidate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  const filteredCandidates = useMemo(() => {
    return (candidates || []).filter(c => {
      const matchQuery = !searchQuery.trim() || 
        c.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.currentTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStage = stageFilter === 'All' || c.stage === stageFilter;
      const matchSource = sourceFilter === 'All' || c.source === sourceFilter;

      return matchQuery && matchStage && matchSource;
    });
  }, [candidates, searchQuery, stageFilter, sourceFilter]);

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Top Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="w-full max-w-md">
            <ModernSearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, email, skills, current role..."
            />
          </div>

          <div className="w-44 shrink-0">
            <CustomSelect
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Pipeline Stages' },
                ...PIPELINE_STAGES.map(s => ({ value: s.id, label: s.label }))
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono font-semibold text-slate-500">
            Showing {filteredCandidates.length} Candidate(s)
          </span>
          <button
            onClick={onAddCandidate}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> + Add Candidate
          </button>
        </div>

      </div>

      {/* Candidates Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Candidate &amp; Role</th>
                <th className="py-3.5 px-4">Contact &amp; Location</th>
                <th className="py-3.5 px-4">Experience</th>
                <th className="py-3.5 px-4">Screening Score</th>
                <th className="py-3.5 px-4">Pipeline Stage</th>
                <th className="py-3.5 px-4">Owner / Recruiter</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((cand) => (
                  <tr
                    key={cand.id}
                    onClick={() => onSelectCandidate(cand)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-500/20">
                          {cand.candidateName ? cand.candidateName.substring(0, 2).toUpperCase() : 'CN'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {cand.candidateName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {cand.currentTitle || 'Applicant'} • {cand.currentCompany || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">
                        {cand.email}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {cand.phone} • {cand.location}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {cand.totalExperience || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {cand.screeningResult?.overall || 85}% Match
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-600 text-white shadow-2xs">
                        {cand.stage || 'Applied'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs font-medium">
                      {cand.candidateOwner || 'Sarah Jenkins'}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectCandidate(cand)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer"
                          title="View Candidate Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCandidate(cand.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Delete Candidate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No candidates found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CandidateList;
