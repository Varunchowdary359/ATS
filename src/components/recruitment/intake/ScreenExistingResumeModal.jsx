import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, ChevronDown, ChevronUp, ArrowUpRight, AlertTriangle, RefreshCw
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { calculateScreeningScore } from './resumeIntakeMockData';
import CircularScorecard from './CircularScorecard';

const ScreenExistingResumeModal = ({ isOpen, onClose, resume, requisitions = [], jds = [], onSaveScreening }) => {
  const { activeTheme } = useContext(ThemeContext);
  
  const [selectedReqId, setSelectedReqId] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');
  const [isScreening, setIsScreening] = useState(false);
  const [screeningResult, setScreeningResult] = useState(null);
  
  const [activeEvidenceFilter, setActiveEvidenceFilter] = useState('matched');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    requiredSkills: true,
    preferredSkills: true,
    relevantExperience: true,
    educationFit: true,
    locationEligibility: true
  });

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && resume) {
      const initialReq = resume.requisitionId || '';
      setSelectedReqId(initialReq);
      const initialJd = resume.jdId || (jds.find(j => j.reqId === initialReq)?.id || '');
      setSelectedJdId(initialJd);
      
      // Auto-run screening for the replica layout, as the screenshot shows the result already loaded
      const reqObj = requisitions.find(r => r.id === initialReq) || requisitions[0] || {};
      const jdObj = jds.find(j => j.id === initialJd) || jds[0] || {};
      const result = calculateScreeningScore(resume, reqObj, jdObj);
      setScreeningResult(result);
      
      setActiveEvidenceFilter('matched');
    }
  }, [isOpen, resume, requisitions, jds]);

  const targetContainer = typeof document !== 'undefined' ? document.body : null;
  if (!isOpen || !resume || !targetContainer) return null;

  const reqObj = requisitions.find(r => r.id === selectedReqId) || { id: selectedReqId || 'N/A', jobTitle: 'Requisition' };
  const jdObj = jds.find(j => j.id === selectedJdId) || { id: selectedJdId || 'N/A', title: 'Job Description' };

  const handleApplyResult = () => {
    if (!screeningResult) return;
    onSaveScreening(resume.id, {
      requisitionId: reqObj.id,
      requisitionTitle: reqObj.jobTitle,
      jdId: jdObj.id,
      jdTitle: jdObj.title,
      screeningScore: screeningResult.overall,
      screeningOutcome: screeningResult.outcome,
      screeningBreakdown: screeningResult
    });
    onClose();
  };

  const matchedCount = screeningResult?.requiredCoverage?.matched || 7;
  const reviewCount = screeningResult?.reviewDetails?.length || 1;
  const missingCount = screeningResult?.missingDetails?.length || 0;

  const initials = resume.candidateName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/70 backdrop-blur-md" dir="ltr">
      <div 
        className="relative w-full max-w-6xl h-full max-h-[92vh] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-start font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section (Full Width) */}
        <div className="px-4 sm:px-8 py-3.5 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-start justify-between gap-3 bg-white dark:bg-slate-950 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white font-serif mb-0.5 sm:mb-1 truncate">
              Resume screening assessment
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 font-medium truncate">
              <strong className="text-slate-800 dark:text-slate-200">{resume.candidateName}</strong> — {resume.fileName} • Uploaded {new Date(resume.uploadedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 mt-0.5 border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 dark:border-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Split Columns - stacked on mobile) */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
          
          {/* Left Sidebar (~25-30%) */}
          <div className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-900 shrink-0 flex flex-col p-4 sm:p-5 space-y-4">
            
            {/* Candidate Profile Box */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#4338ca] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {initials}
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                  {resume.candidateName}
                </h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Senior Frontend Engineer candidate
                </p>
                <button className="mt-1 text-[11px] font-bold text-[#4338ca] hover:underline flex items-center gap-0.5">
                  View resume PDF <ArrowUpRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Screening Context */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Screening context
              </h4>
              
              <div>
                <p className="text-[10px] text-slate-400">Target requisition</p>
                <p className="text-[12px] font-bold text-slate-900 dark:text-white">{reqObj.id}</p>
                <p className="text-[12px] text-slate-600 dark:text-slate-300">{reqObj.jobTitle}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400">Associated job description</p>
                <p className="text-[12px] font-bold text-slate-900 dark:text-white">{jdObj.id}</p>
                <p className="text-[12px] text-slate-600 dark:text-slate-300">{jdObj.title}</p>
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Advanced Controls Accordion */}
            <div className="space-y-2">
              <button 
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="w-full flex items-center justify-between text-[12px] font-bold text-slate-700 dark:text-slate-300"
              >
                Advanced screening controls
                {showAdvancedOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAdvancedOptions && (
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  {[
                    { key: 'requiredSkills', label: 'Req. Skills' },
                    { key: 'preferredSkills', label: 'Pref. Skills' },
                    { key: 'relevantExperience', label: 'Experience' },
                    { key: 'locationEligibility', label: 'Location' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setAdvancedFilters(prev => ({ ...prev, [filter.key]: !prev[filter.key] }))}
                      className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                        advancedFilters[filter.key] !== false
                          ? 'bg-[#4338ca] border-[#4338ca] text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {advancedFilters[filter.key] !== false && (
                        <svg className="w-2 h-2" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Requirement Coverage */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Requirement coverage
              </h4>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-500">Required</span>
                  <span className="font-bold text-slate-900 dark:text-white">5 / 5 • 100%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-[#059669] rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-500">Preferred</span>
                  <span className="font-bold text-slate-900 dark:text-white">2 / 3 • 67%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-[#b45309] rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Main Content (~70%) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-slate-950 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* Overall Fit Component (Replica) */}
            <CircularScorecard 
              screeningResult={screeningResult} 
              onToggleMethodology={() => {}} 
            />

            {/* Match Analysis & Evidence Section */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                Match analysis & qualification evidence
              </h3>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-5">
                {[
                  { key: 'matched', label: 'Matched', count: matchedCount, activeColor: 'bg-[#e0e7ff] text-[#4338ca]' },
                  { key: 'review', label: 'Needs review', count: reviewCount, activeColor: 'bg-[#fef3c7] text-[#b45309]' },
                  { key: 'missing', label: 'Missing', count: missingCount, activeColor: 'bg-slate-100 text-slate-500' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveEvidenceFilter(tab.key)}
                    className={`pb-2 text-[13px] font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                      activeEvidenceFilter === tab.key
                        ? 'border-[#4338ca] text-[#4338ca]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeEvidenceFilter === tab.key ? tab.activeColor : 'bg-slate-100 text-slate-500'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Compact Evidence List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                {activeEvidenceFilter === 'matched' && [
                  { title: '7+ years frontend engineering experience', type: 'Required', desc: 'Resume shows 7.5 years across roles at Google and Stripe (requirement: 5+ years).' },
                  { title: 'Expert in React, TypeScript and state management', type: 'Required', desc: 'Led the Redux Toolkit migration at Stripe; TypeScript used across every listed role.' },
                  { title: 'Demonstrated web performance optimization', type: 'Required', desc: 'Cut bundle size by 38% and improved LCP by 1.2s in the Stripe checkout rewrite.' },
                  { title: 'B.S. Computer Science degree', type: 'Required', desc: 'B.S. Computer Science, University of Toronto, 2016.' },
                  { title: 'Remote / San Francisco location match', type: 'Required', desc: 'Currently remote, based in the SF Bay Area — matches the requisition\'s location preference.' },
                  { title: 'AWS / cloud infrastructure exposure', type: 'Preferred', desc: 'Deployed and maintained services on AWS Lambda and S3 during the Stripe tenure.' },
                  { title: 'Design systems experience', type: 'Preferred', desc: 'Built and maintained an internal component library adopted by four product teams.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border-l-[3px] border-l-[#059669] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-4 h-4 rounded-full bg-[#ecfdf5] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-[#059669]" strokeWidth={3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{item.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide uppercase shrink-0 ${item.type === 'Required' ? 'bg-[#e0e7ff] text-[#4338ca]' : 'bg-slate-100 text-slate-500'}`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}

                {activeEvidenceFilter === 'review' && (
                  <div className="flex items-start gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border-l-[3px] border-l-[#d97706] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-4 h-4 rounded-full bg-[#fffbeb] flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-2.5 h-2.5 text-[#d97706]" strokeWidth={3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Team leadership / mentoring experience</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide uppercase bg-slate-100 text-slate-500 shrink-0">Preferred</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Resume mentions mentoring two junior engineers, but lists no formal management title — confirm scope with the candidate before scoring this as fully met.</p>
                    </div>
                  </div>
                )}

                {activeEvidenceFilter === 'missing' && (
                  <div className="px-4 py-6 text-center text-[13px] text-slate-400 bg-white dark:bg-slate-900">
                    No missing mandatory requirements detected.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}

        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <button
            onClick={onClose}
            className="text-[14px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {}}
              className="px-5 py-2.5 text-[14px] font-bold text-slate-700 border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Recalculate score
            </button>
            <button
              onClick={handleApplyResult}
              className="px-6 py-2.5 bg-[#4338ca] text-white text-[14px] font-bold rounded-lg hover:bg-[#3730a3] transition-colors"
            >
              Save & apply result
            </button>
          </div>
        </div>

      </div>
    </div>,
    targetContainer
  );
};

export default ScreenExistingResumeModal;
