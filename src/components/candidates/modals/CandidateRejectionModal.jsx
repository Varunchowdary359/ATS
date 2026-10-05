import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquareWarning, AlertTriangle } from 'lucide-react';
import CustomSelect from '../../dashboard/shared/CustomSelect';

const REJECTION_REASONS = [
  'Skill Mismatch / Missing Required Skills',
  'Compensation Expectation Out of Budget Range',
  'Failed Technical / Architecture Round',
  'Insufficient Relevant Years of Experience',
  'Culture & Soft Skills Alignment',
  'Candidate Withdrew Application / Accepted Another Offer',
  'Notice Period Too Long / Immediate Availability Required',
  'Location & Relocation Constraints'
];

const CandidateRejectionModal = ({ isOpen, onClose, candidate, onConfirmReject }) => {
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !candidate) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Please select a valid rejection reason.');
      return;
    }
    setError('');
    onConfirmReject({
      reason: selectedReason,
      comments: comments.trim()
    });
    setSelectedReason(REJECTION_REASONS[0]);
    setComments('');
    onClose();
  };

  if (!isOpen || !candidate || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" dir="ltr">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/60 dark:bg-rose-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shrink-0">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Reject Candidate Application
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Candidate: {candidate.candidateName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Primary Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={selectedReason}
              onChange={(val) => setSelectedReason(val)}
              options={REJECTION_REASONS.map(r => ({ value: r, label: r }))}
              size="md"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Additional Notes / Recruiter Explanation
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide specific feedback or interview notes for rejecting this candidate..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20 resize-none font-sans"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 cursor-pointer text-center"
            >
              Confirm Rejection
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};

export default CandidateRejectionModal;
