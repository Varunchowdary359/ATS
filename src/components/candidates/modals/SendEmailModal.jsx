import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Send, Paperclip } from 'lucide-react';

const SendEmailModal = ({ isOpen, onClose, candidate, onSend }) => {
  if (!isOpen || !candidate) return null;

  const [subject, setSubject] = useState(`Update regarding your application — ${candidate.requisitionTitle || 'Recruitment Process'}`);
  const [body, setBody] = useState(`Hi ${candidate.candidateName},\n\nThank you for taking the time to speak with our hiring team regarding the ${candidate.currentTitle || 'open position'} role.\n\nWe would like to move forward with the next steps in our recruitment process.\n\nBest regards,\nRecruitment Team`);

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailObj = {
      id: `comm-${Date.now()}`,
      type: 'Email',
      direction: 'Sent',
      subject,
      sender: 'recruiter@company.com',
      recipient: candidate.email,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Delivered'
    };
    onSend(emailObj);
    onClose();
  };

  if (!isOpen || !candidate || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" dir="ltr">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              Compose Email to {candidate.candidateName}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">To</label>
            <input
              type="text"
              readOnly
              value={`${candidate.candidateName} <${candidate.email}>`}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message Body</label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none resize-none font-sans"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 justify-center sm:justify-start">
              <Paperclip className="w-3.5 h-3.5" /> Attachments supported
            </span>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Send className="w-3.5 h-3.5" /> Send Email
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default SendEmailModal;
