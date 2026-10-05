import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, AlertCircle, Award, CheckCircle2, RotateCcw, 
  XCircle, FileText, DollarSign, Calendar, Lock, ShieldCheck, Download 
} from 'lucide-react';
import { offerService } from './offerService';

export const CandidateOfferPortalModal = ({ isOpen, onClose, offer, onOfferUpdated, brandColor = 'var(--pw-brand)' }) => {
  const [activeAction, setActiveAction] = useState(null); // null | 'accept' | 'negotiate' | 'decline'
  const [signatureName, setSignatureName] = useState(offer?.candidateName || '');
  const [changeField, setChangeField] = useState('Base Salary & Start Date');
  const [requestedValue, setRequestedValue] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [declineReason, setDeclineReason] = useState('Accepted Another Offer');
  const [declineComments, setDeclineComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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

  const handleCandidateSubmit = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      if (activeAction === 'accept') {
        const res = await offerService.recordCandidateAction(offer.id, {
          action: 'ACCEPT',
          payload: { signatureType: 'Digital Verified Electronic Signature', signatureName }
        });
        if (onOfferUpdated) onOfferUpdated(res);
        setSuccessMessage('Congratulations! You have successfully accepted and eSigned your offer letter.');
      } else if (activeAction === 'negotiate') {
        const res = await offerService.recordCandidateAction(offer.id, {
          action: 'REQUEST_CHANGES',
          payload: { field: changeField, requestedValue, reason: changeReason }
        });
        if (onOfferUpdated) onOfferUpdated(res);
        setSuccessMessage('Your change request has been submitted to the talent acquisition team for review.');
      } else if (activeAction === 'decline') {
        const res = await offerService.recordCandidateAction(offer.id, {
          action: 'DECLINE',
          payload: { reason: declineReason, comments: declineComments }
        });
        if (onOfferUpdated) onOfferUpdated(res);
        setSuccessMessage('Your decision has been recorded. Thank you for your time.');
      }
    } catch (e) {
      setErrorMessage(e.message || 'Failed to record candidate action.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalClose = () => {
    setActiveAction(null);
    setSuccessMessage('');
    setErrorMessage('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200" dir="ltr">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Portal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs shadow-2xs"
              style={{ backgroundColor: brandColor }}
            >
              PW
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Candidate Offer Portal
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Secure Candidate Decision Gateway • Confidential
              </p>
            </div>
          </div>
          <button 
            onClick={handleModalClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {successMessage ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Action Confirmed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">{successMessage}</p>
              <button
                onClick={handleModalClose}
                style={{
                  backgroundColor: brandColor,
                  boxShadow: `0 2px 10px ${brandColor}40`
                }}
                className="mt-4 px-5 py-2 text-white text-xs font-bold rounded-xl shadow-sm hover:brightness-110 transition-all cursor-pointer"
              >
                Close Portal
              </button>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Position Extended</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{offer.jobTitle}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{offer.department} • {offer.workLocation} ({offer.workArrangement})</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Annual CTC</span>
                  <div className="text-xl font-black" style={{ color: brandColor }}>
                    {offer.currency === 'USD' ? '$' : '₹'}{Number(offer.totalCtc || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400">Expiry: {offer.offerExpirationDate}</span>
                </div>
              </div>

              {/* Offer Document Box */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-950 max-h-[250px] overflow-y-auto text-xs shadow-inner">
                {offer.documentVersions?.[0]?.contentHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: offer.documentVersions[0].contentHtml }} />
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    Formal offer letter document preview for {offer.candidateName}.
                  </div>
                )}
              </div>

              {/* Action Selector */}
              {!activeAction ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => setActiveAction('accept')}
                    className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500 transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Accept & eSign</h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">Accept offer and certify digitally</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveAction('negotiate')}
                    className="p-4 rounded-2xl border-2 border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500 transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 flex items-center justify-center mb-2">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Request Changes</h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">Submit counter proposal on CTC/Date</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveAction('decline')}
                    className="p-4 rounded-2xl border-2 border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-500 transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-600 flex items-center justify-center mb-2">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">Decline Offer</h4>
                      <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">Decline position with reason</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3 animate-in fade-in duration-150">
                  
                  {activeAction === 'accept' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Confirm Electronic Acceptance & Legal Signature
                      </h4>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Type Full Name to Sign <span className="text-red-500 font-bold ml-0.5">*</span>
                        </label>
                        <input
                          type="text"
                          value={signatureName}
                          onChange={(e) => setSignatureName(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-serif focus:ring-2 focus:ring-brand focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {activeAction === 'negotiate' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Submit Counter Proposal / Change Request</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Field</label>
                          <input
                            type="text"
                            value={changeField}
                            onChange={(e) => setChangeField(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Requested Value</label>
                          <input
                            type="text"
                            value={requestedValue}
                            onChange={(e) => setRequestedValue(e.target.value)}
                            placeholder="e.g. ₹28,00,000 Base Salary"
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Reason / Justification <span className="text-red-500 font-bold ml-0.5">*</span>
                        </label>
                        <textarea
                          value={changeReason}
                          onChange={(e) => setChangeReason(e.target.value)}
                          placeholder="Please provide details for the requested adjustments..."
                          rows="2"
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-brand focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {activeAction === 'decline' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-rose-600">Decline Offer Confirmation</h4>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Primary Reason <span className="text-red-500 font-bold ml-0.5">*</span>
                        </label>
                        <select
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="Accepted Another Offer">Accepted Another Offer</option>
                          <option value="Compensation Below Expectation">Compensation Below Expectation</option>
                          <option value="Location / Commute Constraints">Location / Commute Constraints</option>
                          <option value="Personal Reasons">Personal / Family Reasons</option>
                          <option value="Counter-Offer by Current Employer">Counter-Offer Accepted at Current Employer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Additional Feedback</label>
                        <textarea
                          value={declineComments}
                          onChange={(e) => setDeclineComments(e.target.value)}
                          placeholder="Optional feedback..."
                          rows="2"
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-brand focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setActiveAction(null)}
                      className="px-3 py-1.5 text-xs text-slate-500 font-semibold hover:text-slate-700 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCandidateSubmit}
                      disabled={isProcessing}
                      style={{
                        backgroundColor: brandColor,
                        boxShadow: `0 2px 10px ${brandColor}40`
                      }}
                      className="px-4 py-1.5 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer"
                    >
                      {isProcessing ? 'Processing...' : 'Confirm Action'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>,
    document.body
  );
};

export default CandidateOfferPortalModal;
