import React from 'react';
import { Download } from 'lucide-react';

export const OfferLetterTab = ({
  offer,
  onGenerateLetter
}) => {
  if (!offer) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Offer Letter Document Preview</h3>
          <p className="text-xs text-slate-500">Formally rendered document v{offer.version} ({offer.templateName})</p>
        </div>
        <button
          onClick={() => {
            const doc = offer.documentVersions?.[0];
            if (doc?.contentHtml) {
              const printWindow = window.open('', '_blank');
              printWindow.document.write(doc.contentHtml);
              printWindow.document.close();
              printWindow.print();
            } else {
              onGenerateLetter();
            }
          }}
          className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Download size={14} />
          <span>Download PDF / Print</span>
        </button>
      </div>

      <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 bg-white dark:bg-slate-950 shadow-inner max-h-[550px] overflow-y-auto">
        {offer.documentVersions?.[0]?.contentHtml ? (
          <div dangerouslySetInnerHTML={{ __html: offer.documentVersions[0].contentHtml }} />
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs">
            Offer letter has not been compiled yet. Click "Generate Offer Letter" above to compile the document.
          </div>
        )}
      </div>
    </div>
  );
};
