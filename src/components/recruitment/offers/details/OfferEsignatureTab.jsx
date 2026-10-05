import React from 'react';

export const OfferEsignatureTab = ({ offer }) => {
  if (!offer) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-fade-in-up">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">eSignature & Digital Certification</h3>
        <p className="text-xs text-slate-500">DocuSign envelope verification and cryptographic audit logs</p>
      </div>

      <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 text-xs">
        <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
          <span className="text-slate-400">Envelope ID:</span> 
          <strong className="font-mono text-slate-800 dark:text-slate-200">{offer.eSignature?.envelopeId || 'DOCU-ENV-2026-9021'}</strong>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
          <span className="text-slate-400">Provider:</span> 
          <span className="text-slate-800 dark:text-slate-200">{offer.eSignature?.provider || 'DocuSign Integration'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
          <span className="text-slate-400">Audit Status:</span> 
          <strong className="text-emerald-600 dark:text-emerald-400">{offer.eSignature?.status || offer.signatureStatus}</strong>
        </div>
        {offer.eSignature?.signedAt && (
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Signed At:</span> 
            <span className="text-slate-800 dark:text-slate-200">{new Date(offer.eSignature.signedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};
