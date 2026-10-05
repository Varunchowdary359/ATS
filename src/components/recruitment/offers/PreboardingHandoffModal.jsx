import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Award, CheckCircle2, ArrowRight, UserCheck, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { offerService } from './offerService';

export const PreboardingHandoffModal = ({ isOpen, onClose, offer, onHandoffCompleted, brandColor = 'var(--pw-brand)' }) => {
  const [isTransferred, setIsTransferred] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !offer || typeof document === 'undefined') return null;

  const handleConfirmHandoff = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const res = await offerService.moveCandidateToPreboarding(offer.id);
      setIsTransferred(true);
      if (onHandoffCompleted) onHandoffCompleted(res);
    } catch (e) {
      setErrorMessage(e.message || 'Failed to complete preboarding handoff.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalClose = () => {
    setIsTransferred(false);
    setErrorMessage('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200" dir="ltr">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Handoff to Preboarding
            </h3>
          </div>
          <button 
            onClick={handleModalClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isTransferred ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Candidate Transferred Successfully!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {offer.candidateName} has been transitioned into the Preboarding Pipeline. Onboarding checklists & welcome workflows are initiated.
              </p>
              <button
                onClick={handleModalClose}
                style={{
                  backgroundColor: brandColor,
                  boxShadow: `0 2px 10px ${brandColor}40`
                }}
                className="mt-3 px-5 py-2 text-white text-xs font-bold rounded-xl shadow-sm hover:brightness-110 transition-all cursor-pointer"
              >
                Close & Return to Hub
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                You are about to transition <strong>{offer.candidateName}</strong> into the PeopleWorks Preboarding system. The accepted offer package and certified eSignature documents will be securely transferred.
              </p>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Position / Role:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{offer.jobTitle}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Joining Date:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{offer.expectedStartDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reporting Manager:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{offer.reportingManager}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Certified Offer Letter:</span>
                  <strong className="text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    eSigned (v{offer.version})
                  </strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button 
                  onClick={handleModalClose} 
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmHandoff}
                  disabled={isProcessing}
                  style={{
                    backgroundColor: brandColor,
                    boxShadow: `0 2px 10px ${brandColor}40`
                  }}
                  className="px-5 py-2 text-white text-xs font-bold rounded-xl shadow-sm hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isProcessing ? 'Transferring...' : 'Confirm Handoff'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default PreboardingHandoffModal;
