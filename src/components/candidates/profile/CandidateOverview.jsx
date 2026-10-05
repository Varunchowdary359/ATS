import React, { useState, useContext } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, Award, FileText, 
  Tag, Plus, X, Search, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, Sparkles, Lock
} from 'lucide-react';
import CircularScorecard from '../../recruitment/intake/CircularScorecard';
import { ThemeContext } from '../../../ThemeContext';
import { canViewCompensation } from '../candidatePermissions';

const CandidateOverview = ({ candidate, onUpdateCandidate, onSelectTab, onOpenAddJob }) => {
  const { activeRole } = useContext(ThemeContext);
  const showSalary = canViewCompensation(activeRole);

  const [newTag, setNewTag] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  if (!candidate) return null;

  const handleAddTagSubmit = (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const tag = newTag.trim();
    if (!candidate.tags?.includes(tag)) {
      const updatedTags = [...(candidate.tags || []), tag];
      onUpdateCandidate({ ...candidate, tags: updatedTags });
    }
    setNewTag('');
    setShowAddTag(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = (candidate.tags || []).filter(t => t !== tagToRemove);
    onUpdateCandidate({ ...candidate, tags: updatedTags });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top 2-Column Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Spans): Candidate Quick Metrics & Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. Candidate Summary Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Candidate Summary
              </h3>
              <button
                onClick={() => onSelectTab('personal')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Full Details <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Notice Period</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{candidate.noticePeriod || '30 Days'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Current Salary</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {showSalary ? (candidate.currentSalary || 'N/A') : <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]"><Lock className="w-3 h-3 text-amber-500" /> Restricted</span>}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Expected Salary</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {showSalary ? (candidate.expectedSalary || 'N/A') : <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]"><Lock className="w-3 h-3 text-amber-500" /> Restricted</span>}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Preferred Location</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{candidate.preferredLocation || candidate.location || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Employment Type</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{candidate.employmentType || 'Full-Time'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Availability</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{candidate.availability || 'Immediate'}</span>
              </div>
            </div>
          </div>

          {/* B. Tags Management Section */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Candidate Tags
              </h3>
              <button
                onClick={() => setShowAddTag(!showAddTag)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tag
              </button>
            </div>

            {showAddTag && (
              <form onSubmit={handleAddTagSubmit} className="flex gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Enter tag name (e.g. Senior, React, Immediate Joiner)..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700"
                >
                  Save
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {(candidate.tags || []).length > 0 ? (
                candidate.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50 group"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-purple-400 hover:text-purple-700 dark:hover:text-purple-200 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No tags assigned yet. Click "Add Tag" to label this candidate.</span>
              )}
            </div>
          </div>

          {/* C. Skills Summary Chips */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Extracted Skills &amp; Competencies
              </h3>
              <button
                onClick={() => onSelectTab('skills')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Skill Matrix <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(candidate.skills || []).map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* D. Current Active Application Card */}
          <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Primary Active Job Application
              </span>
              <button
                onClick={onOpenAddJob}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Add Candidate to Another Job
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {candidate.requisitionTitle || 'Senior React Developer'}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Req ID: {candidate.requisitionId || 'REQ-2024-089'} • Recruiter: {candidate.candidateOwner || 'Sarah Jenkins'}
                </p>
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-600 text-white shadow-xs">
                {candidate.stage || 'Applied'}
              </span>
            </div>
          </div>

        </div>

        {/* Right Column (1 Span): Circular Scorecard & Resume Summary */}
        <div className="space-y-6">
          
          {/* E. Screening Scorecard (Reusing CircularScorecard) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <CircularScorecard
              screeningResult={candidate.screeningResult}
              onToggleMethodology={() => onSelectTab('screening')}
            />
          </div>

          {/* F. Resume Quick Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Attached Resume
            </h3>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {candidate.fileName || 'Resume.pdf'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {candidate.fileSize || '2.4 MB'} • Uploaded {candidate.uploadedDate}
                </p>
              </div>
              <button
                onClick={() => onSelectTab('resume')}
                className="px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Preview
              </button>
            </div>
          </div>

          {/* G. Recent Recruiter Activity */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Recent Recruiter Activity
            </h3>
            <div className="space-y-2 text-xs">
              {(candidate.activities || []).slice(0, 3).map((act, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span>{act.type}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{act.timestamp}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{act.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CandidateOverview;
