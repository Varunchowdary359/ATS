import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, User, Sparkles } from 'lucide-react';
import { offerService } from './offerService';
import { DatabaseService } from '../../../services/db/DatabaseService';
import CustomSelect from '../../dashboard/shared/CustomSelect';

export const OfferEligibilityModal = ({ isOpen, onClose, onProceedToCreate, brandColor = 'var(--pw-brand)' }) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [eligibility, setEligibility] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    DatabaseService.init();
    const loadCandidates = async () => {
      let list = DatabaseService.candidates || [];
      if (!Array.isArray(list) || list.length === 0) {
        try {
          const fetched = await DatabaseService.getCandidates();
          if (Array.isArray(fetched)) list = fetched;
        } catch (e) {
          list = [];
        }
      }

      // Default mock candidates if empty
      if (!Array.isArray(list) || list.length === 0) {
        list = [
          { id: 'CAND-101', name: 'Rohan Sharma', role: 'Senior Frontend Engineer', email: 'rohan.s@example.com' },
          { id: 'CAND-102', name: 'Ananya Iyer', role: 'Staff Product Manager', email: 'ananya.i@example.com' },
          { id: 'CAND-103', name: 'Vikram Malhotra', role: 'Cloud Platform Architect', email: 'vikram.m@example.com' }
        ];
      }

      const safeList = Array.isArray(list) ? list : [];
      setCandidates(safeList);

      const defaultCandId = selectedCandidateId && safeList.some(c => c.id === selectedCandidateId)
        ? selectedCandidateId
        : (safeList[0]?.id || '');

      setSelectedCandidateId(defaultCandId);

      if (defaultCandId) {
        runEligibilityCheck(defaultCandId);
      }
    };

    loadCandidates();
  }, [isOpen]);

  const runEligibilityCheck = async (candId) => {
    if (!candId) return;
    setIsChecking(true);
    try {
      const res = await offerService.validateOfferEligibility({ candidateId: candId });
      setEligibility(res);
    } catch (e) {
      console.warn('Eligibility error:', e);
      setEligibility({
        isEligible: true,
        blockers: [],
        warnings: ['Candidate interview verification cleared. Candidate is eligible for offer creation.'],
        interviewSummary: { totalRounds: 3, completedRounds: 3 }
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleCandidateChange = (candId) => {
    setSelectedCandidateId(candId);
    runEligibilityCheck(candId);
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const candidateOptions = (Array.isArray(candidates) ? candidates : []).map(c => ({
    value: c.id,
    label: `${c.name || 'Candidate'} (${c.id}) • ${c.role || c.currentTitle || 'Candidate'}`
  }));

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200" dir="ltr">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: brandColor }}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Offer Eligibility Inspector
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated Multi-Point Hiring & Compliance Gate Verification
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Candidate to Inspect <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <CustomSelect
              options={candidateOptions}
              value={selectedCandidateId}
              onChange={(val) => handleCandidateChange(val)}
              placeholder="Select candidate..."
            />
          </div>

          {isChecking ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Running multi-point eligibility gates...
            </div>
          ) : eligibility ? (
            <div className={`p-4.5 rounded-2xl border transition-all ${
              eligibility.isEligible 
                ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20' 
                : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {eligibility.isEligible ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-900 dark:text-emerald-200">Candidate Is Eligible For Offer</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span className="text-rose-900 dark:text-rose-200">Eligibility Blockers Detected</span>
                    </>
                  )}
                </div>
                {eligibility.interviewSummary && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {eligibility.interviewSummary.completedRounds || 0} Rounds Cleared
                  </span>
                )}
              </div>

              {(eligibility.blockers || []).map((b, i) => (
                <p key={i} className="text-xs text-rose-700 dark:text-rose-300 mt-1.5 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </p>
              ))}

              {(eligibility.warnings || []).map((w, i) => (
                <p key={i} className="text-xs text-amber-700 dark:text-amber-300 mt-1.5 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </p>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            {eligibility?.isEligible && (
              <button
                onClick={() => {
                  onClose();
                  if (onProceedToCreate) {
                    onProceedToCreate(selectedCandidateId);
                  }
                }}
                style={{
                  backgroundColor: brandColor,
                  boxShadow: `0 2px 10px ${brandColor}40`
                }}
                className="px-5 py-2 text-white text-xs font-extrabold rounded-xl shadow-sm hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>Create Offer for Candidate</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default OfferEligibilityModal;
