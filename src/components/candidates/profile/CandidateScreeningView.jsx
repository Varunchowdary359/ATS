import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Sparkles, Award, MapPin, Briefcase } from 'lucide-react';
import CircularScorecard from '../../recruitment/intake/CircularScorecard';

const CandidateScreeningView = ({ candidate }) => {
  if (!candidate) return null;

  const result = candidate.screeningResult || {};
  const categoryScores = result.categoryScores || {
    skillFit: result.overall || 85,
    expFit: 90,
    eduFit: 88,
    locationFit: 100
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Screening Score Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <CircularScorecard screeningResult={result} />
      </div>

      {/* Detailed Match Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skill Alignment</span>
          <p className="text-xl font-black text-slate-900 dark:text-white font-serif">{categoryScores.skillFit}%</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">High Match against JD</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experience Alignment</span>
          <p className="text-xl font-black text-slate-900 dark:text-white font-serif">{categoryScores.expFit}%</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{candidate.totalExperience} vs 5+ yrs req.</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Education Alignment</span>
          <p className="text-xl font-black text-slate-900 dark:text-white font-serif">{categoryScores.eduFit}%</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">BS CS / Equivalent Degree</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location &amp; Remote Fit</span>
          <p className="text-xl font-black text-slate-900 dark:text-white font-serif">{categoryScores.locationFit}%</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Matched Target City</p>
        </div>
      </div>

      {/* Strengths & Potential Gaps Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Strengths */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Candidate Key Strengths
          </h3>
          <ul className="space-y-2 text-xs">
            <li className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Strong hands-on experience in full-stack architecture, microservices scaling, and cloud deployment pipelines.</span>
            </li>
            <li className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Extensive knowledge of target required skills: {(candidate.skills || []).slice(0, 4).join(', ')}.</span>
            </li>
          </ul>
        </div>

        {/* Potential Gaps / Review Notes */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Recommended Clarifications / Potential Gaps
          </h3>
          <ul className="space-y-2 text-xs">
            <li className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-slate-800 dark:text-slate-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Verify direct engineering management or formal lead experience during the technical round.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
};

export default CandidateScreeningView;
