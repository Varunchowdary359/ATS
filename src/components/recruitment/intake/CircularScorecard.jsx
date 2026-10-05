import React from 'react';
import { ArrowUpRight } from 'lucide-react';

/**
 * Screenshot-replica Overall Fit Component
 */
const CircularScorecard = ({ screeningResult, onToggleMethodology }) => {
  if (!screeningResult) return null;

  const overall = screeningResult.overall || 0;
  const skills = screeningResult.skills ?? 98;
  const experience = screeningResult.experience ?? 95;
  const education = screeningResult.education ?? 92;
  const location = screeningResult.location ?? 100;
  const domainFit = screeningResult.domainFit ?? 92;

  const outcome = screeningResult.outcome || (overall >= 85 ? 'Strong match' : overall >= 70 ? 'Good match' : overall >= 50 ? 'Partial match' : 'Low match');

  const reviewCount = screeningResult.reviewDetails?.length || 1;

  // Single Donut Chart Calculations (Overall Match Score)
  const donutSize = 140;
  const strokeWidth = 12;
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, overall))) / 100;

  const getScoreColor = (score) => {
    if (score >= 85) return '#059669'; // deeper green as in screenshot
    if (score >= 70) return '#4338ca'; // indigo
    if (score >= 50) return '#d97706'; // amber
    return '#dc2626'; // red
  };

  const scoreColor = getScoreColor(overall);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-bold text-slate-900 font-serif dark:text-white">
          Overall fit
        </h3>
        {onToggleMethodology && (
          <button
            type="button"
            onClick={onToggleMethodology}
            className="text-[13px] font-bold text-[#4338ca] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Methodology <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Box */}
      <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row items-center gap-10">
        
        {/* Left Side: Donut & Badges */}
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center shrink-0" style={{ width: donutSize, height: donutSize }}>
            <svg width={donutSize} height={donutSize} className="transform -rotate-90">
              {/* Base Track */}
              <circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress Arc */}
              <circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={radius}
                stroke={scoreColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center mt-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white leading-none font-serif flex items-start">
                {overall}<span className="text-lg font-bold mt-0.5">%</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                Score
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#059669] border border-[#d1fae5] self-start">
              {outcome}
            </span>
            {reviewCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#b45309]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b45309]"></span>
                {reviewCount} {reviewCount === 1 ? 'area' : 'areas'} flagged for review
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Factor Bars */}
        <div className="flex-1 w-full space-y-3.5">
          {[
            { label: 'Skills match', score: skills },
            { label: 'Experience', score: experience },
            { label: 'Role / domain fit', score: domainFit },
            { label: 'Education', score: education },
            { label: 'Location', score: location },
          ].map((factor, idx) => (
            <div key={idx} className="flex items-center gap-4 text-[13px]">
              <span className="w-32 text-slate-500 font-medium">
                {factor.label}
              </span>
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out bg-[#4338ca]"
                  style={{ width: `${factor.score}%` }}
                />
              </div>
              <span className="w-10 text-right font-bold text-slate-900 dark:text-white">
                {factor.score}%
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CircularScorecard;
