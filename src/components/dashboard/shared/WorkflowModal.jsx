// ══════════════════════════════════════════════════════════════════════════════
// WORKFLOW MODAL & DRAWER SYSTEM — Accessible, Focus-Trapped Interactive Forms
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useContext } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkflowActions } from './WorkflowContext';
import { useToast } from './ToastProvider';
import WizardStepper from './WizardStepper';
import CustomSelect from './CustomSelect';
import { ThemeContext } from '../../../ThemeContext';

const WorkflowModal = () => {
  const { activeModal, closeWorkflowModal, createRequisition, scheduleInterview, submitFeedback } = useWorkflowActions();
  const { addToast } = useToast();
  const modalRef = useRef(null);

  // ── Keyboard Trapping & ESC Listener ────────────────────────────────────────
  useEffect(() => {
    if (!activeModal) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeWorkflowModal();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Auto focus first interactive element inside drawer
    setTimeout(() => {
      const firstInput = modalRef.current?.querySelector('input, select, textarea, button');
      firstInput?.focus();
    }, 60);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, closeWorkflowModal]);

  if (!activeModal) return null;

  const { type, data } = activeModal;

  const isDrawer = type === 'raise_req' || type === 'review';
  const containerClasses = isDrawer
    ? "fixed inset-0 z-[9999] flex justify-end bg-slate-900/60 backdrop-blur-md"
    : "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md";

  const layoutClasses = isDrawer 
    ? "relative w-full sm:w-[560px] h-full bg-white dark:bg-[#111827] shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
    : "relative w-full sm:w-[500px] max-h-[90vh] bg-white dark:bg-[#111827] shadow-2xl border border-slate-200 dark:border-slate-800 sm:rounded-3xl overflow-hidden flex flex-col";

  const motionProps = isDrawer
    ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }
    : { initial: { opacity: 0, scale: 0.95, y: 10 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 10 }, transition: { duration: 0.2, ease: "easeOut" } };

  const drawerElement = (
    <AnimatePresence>
      <div 
        aria-modal="true"
        role="dialog"
        className={containerClasses}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeWorkflowModal();
        }}
      >
        <motion.div
          ref={modalRef}
          {...motionProps}
          className={layoutClasses}
        >
          {/* Render Multi-step Wizard for Requisition Flow */}
          {type === 'raise_req' && (
            <WizardStepper
              onRequestClose={closeWorkflowModal}
              onSubmitRequisition={(formData) => {
                createRequisition(
                  formData,
                  (msg) => addToast({ message: msg, type: 'success' }),
                  (msg) => addToast({ message: msg, type: 'error' })
                );
                closeWorkflowModal();
              }}
            />
          )}

          {/* Single-step drawers for other action flows */}
          {type !== 'raise_req' && (
            <div className="flex flex-col h-full bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 relative">
              <button
                onClick={closeWorkflowModal}
                aria-label="Close drawer"
                className="absolute top-5 right-5 z-20 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>

              {type === 'schedule_iv' && (
                <ScheduleIvForm
                  onClose={closeWorkflowModal}
                  onSubmit={(formData) => {
                    scheduleInterview(
                      formData,
                      (msg) => addToast({ message: msg, type: 'success' })
                    );
                    closeWorkflowModal();
                  }}
                />
              )}

              {type === 'feedback' && (
                <SubmitFeedbackForm
                  item={data}
                  onClose={closeWorkflowModal}
                  onSubmit={(feedbackData, simulateError) => {
                    submitFeedback(
                      data.id,
                      feedbackData,
                      (msg) => addToast({ message: msg, type: 'success' }),
                      (msg) => addToast({ message: msg, type: 'error' }),
                      simulateError
                    );
                    closeWorkflowModal();
                  }}
                />
              )}

              {type === 'review' && (
                <CandidateReviewView candidate={data} onClose={closeWorkflowModal} />
              )}

              {type === 'simulated' && (
                <SimulatedActionView action={data} onClose={closeWorkflowModal} addToast={addToast} />
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(drawerElement, document.body) : drawerElement;
};

// ── 1. Raise Requisition Form with Inline Validation ─────────────────────────
const RaiseReqForm = ({ onClose, onSubmit }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';
  const [role, setRole] = useState('');
  const [dept, setDept] = useState('IT / Engineering');
  const [targetHires, setTargetHires] = useState(1);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErr = {};
    if (!role.trim()) newErr.role = 'Role title is required';
    if (!targetHires || targetHires < 1) newErr.targetHires = 'Target hires must be at least 1';

    if (Object.keys(newErr).length > 0) {
      setErrors(newErr);
      return;
    }

    onSubmit({ role, dept, targetHires });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">Raise New Requisition</h3>
        <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Submit a new job opening for HR approval</p>
      </div>

      <div className="flex flex-col gap-1 mt-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Job Title / Role *</label>
        <input 
          type="text" 
          placeholder="e.g. Senior Frontend Engineer"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            if (errors.role) setErrors(prev => ({ ...prev, role: null }));
          }}
          className={`px-4 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 ${
            errors.role ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20'
          }`}
        />
        {errors.role && <span className="text-[11px] font-bold text-rose-500 mt-0.5">{errors.role}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</label>
          <CustomSelect 
            value={dept}
            onChange={(val) => setDept(val)}
            options={['IT / Engineering', 'Product & Design', 'Sales & Marketing', 'HR & Ops'].map(x => ({label: x, value: x}))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Hires *</label>
          <input 
            type="number" 
            min="1"
            max="20"
            value={targetHires}
            onChange={(e) => setTargetHires(parseInt(e.target.value) || 1)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          style={{ backgroundColor: brandColor }}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer hover:brightness-110 transition-all"
        >
          Submit Requisition
        </button>
      </div>
    </form>
  );
};

// ── 2. Schedule Interview Form with 10/10 Polish & SVG Icon System ────────────
const ScheduleIvForm = ({ onClose, onSubmit }) => {
  const [candidate, setCandidate] = useState('');
  const [role] = useState('Senior DevOps Engineer'); // Context-bound prefilled role
  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [selectedTime, setSelectedTime] = useState('02:00 PM');
  const [interviewer, setInterviewer] = useState({ name: 'Arjun', title: 'Lead Evaluator', initials: 'AR' });
  const [errors, setErrors] = useState({});

  const dateOptions = [
    { label: 'Today', dateStr: 'Jul 23' },
    { label: 'Tomorrow', dateStr: 'Jul 24' },
    { label: 'Mon, Jul 28', dateStr: 'Jul 28' },
  ];

  const timeSlots = ['10:00 AM', '02:00 PM', '04:30 PM'];

  const interviewers = [
    { name: 'Arjun', title: 'Lead Evaluator', initials: 'AR' },
    { name: 'Meera', title: 'Eng Manager', initials: 'ME' },
    { name: 'Priya', title: 'TA Specialist', initials: 'PR' },
  ];

  const isFormReady = candidate.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormReady) {
      setErrors({ candidate: 'Candidate name is required to send invite' });
      return;
    }
    onSubmit({ candidate, role, date: selectedDate, time: selectedTime });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 relative">

      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl relative z-10 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-blue-200 dark:border-blue-800/60">
            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Scheduling Assistant
          </div>
          <h3 className="text-base font-black text-slate-850 dark:text-slate-100 tracking-tight">Schedule Interview Slot</h3>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Book evaluation session & issue automated invite</p>
        </div>
      </div>

      {/* Body Section with Inputs + Live Preview Card + Dispatch Notice */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar relative z-10">
        {/* Candidate Name Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Candidate Name *</label>
            <span className="text-[10px] font-bold text-slate-400">Position Context Bound</span>
          </div>
          <input 
            type="text" 
            placeholder="e.g. Ananya Sharma"
            value={candidate}
            onChange={(e) => {
              setCandidate(e.target.value);
              if (errors.candidate) setErrors({});
            }}
            className={`px-4 py-2.5 rounded-xl border text-xs bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
              errors.candidate ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.candidate && <span className="text-[11px] font-bold text-rose-500">{errors.candidate}</span>}

          {/* Pre-filled Context Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-semibold mt-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            <span>Linked Requisition:</span>
            <strong className="text-slate-800 dark:text-slate-200">{role}</strong>
          </div>
        </div>

        {/* Visual Calendar Day Selector (Standardized Outline + Accent Style) */}
        <div className="flex flex-col gap-1.5" role="group" aria-label="Select Date">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Date *</label>
          <div className="grid grid-cols-3 gap-2">
            {dateOptions.map((d) => {
              const isSelected = selectedDate === d.label;
              return (
                <button
                  key={d.label}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDate(d.label)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <svg className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Time Slot Pills (Standardized Outline + Accent Style) */}
        <div className="flex flex-col gap-1.5" role="group" aria-label="Select Time Slot">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Time Slot *</label>
          <div className="flex gap-2">
            {timeSlots.map((t) => {
              const isSelected = selectedTime === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedTime(t)}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <svg className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lead Interviewer Selector with SVG Avatars */}
        <div className="flex flex-col gap-1.5" role="group" aria-label="Lead Evaluator">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lead Evaluator *</label>
          <div className="grid grid-cols-3 gap-2">
            {interviewers.map((inv) => {
              const isSelected = interviewer.name === inv.name;
              return (
                <button
                  key={inv.name}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setInterviewer(inv)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full font-black text-[10px] flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {inv.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-extrabold">{inv.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{inv.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* REAL-TIME LIVE INVITATION PREVIEW CARD */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
              Live Calendar Invite · Auto Sync Ready
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-black text-sm flex items-center justify-center shadow-sm">
                {candidate.trim() ? candidate.trim()[0].toUpperCase() : '?'}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-850 dark:text-slate-100">
                  {candidate.trim() || 'Candidate Name'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{role}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{selectedDate} · {selectedTime}</div>
              <div className="text-[10px] text-slate-400 font-medium">Evaluator: {interviewer.name}</div>
            </div>
          </div>
        </div>

        {/* REPURPOSED VERTICAL SPACE: Automated Dispatch Notice Card */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            Automated Invite Dispatch
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Google Calendar & Outlook ICS meeting links will be auto-generated and emailed upon confirmation.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl flex items-center justify-between relative z-10">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={!isFormReady}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
            isFormReady 
              ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer' 
              : 'text-slate-400 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-60'
          }`}
        >
          Confirm & Send Invite
        </button>
      </div>
    </form>
  );
};

// ── 3. Submit Feedback Form with Live Summary Card & Glass Design ─────────────
const SubmitFeedbackForm = ({ item, onClose, onSubmit }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [recommendation, setRecommendation] = useState('Hire');
  const [simulateError, setSimulateError] = useState(false);
  const [errors, setErrors] = useState({});

  const candidateName = item?.candidate || 'Rahul Verma';
  const roleName = item?.role || 'Full Stack Lead';

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = {};
    if (rating === 0) err.rating = 'Please select a star evaluation rating (1 to 5)';
    if (!comment.trim()) err.comment = 'Please provide written evaluation notes';

    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }

    onSubmit({ rating, comment, recommendation }, simulateError);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 relative">

      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl relative z-10 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-slate-200 dark:border-slate-700/60">
            Evaluation Desk
          </div>
          <h3 className="text-base font-black text-slate-850 dark:text-slate-100 tracking-tight">Submit Evaluation Feedback</h3>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">
            Candidate: <strong className="text-slate-800 dark:text-slate-200">{candidateName}</strong> ({roleName})
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar relative z-10">
        {/* Star Rating Control */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Overall Rating *</label>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => {
                    setRating(star);
                    if (errors.rating) setErrors(prev => ({ ...prev, rating: null }));
                  }}
                  className={`text-2xl transition-transform hover:scale-125 cursor-pointer ${
                    star <= rating ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <span className="text-xs font-black text-slate-700 dark:text-slate-200">
              {rating > 0 ? `${rating} / 5 Stars` : 'Click to rate'}
            </span>
          </div>
          {errors.rating && <span className="text-[11px] font-bold text-rose-500">{errors.rating}</span>}
        </div>

        {/* Hiring Recommendation Pills */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Recommendation *</label>
          <div className="flex gap-2">
            {[
              { id: 'Strong Hire', label: 'Strong Hire', color: 'emerald' },
              { id: 'Hire', label: 'Hire', color: 'blue' },
              { id: 'Hold', label: 'Hold', color: 'amber' },
            ].map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => setRecommendation(rec.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  recommendation === rec.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {rec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Evaluation Notes */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Written Evaluation Notes *</label>
          <textarea
            rows="3"
            placeholder="Detail technical strengths, communication, and recommendation rationale..."
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (errors.comment) setErrors(prev => ({ ...prev, comment: null }));
            }}
            className={`p-3.5 rounded-xl border text-xs bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
              errors.comment ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {errors.comment && <span className="text-[11px] font-bold text-rose-500">{errors.comment}</span>}
        </div>

        {/* Simulation Toggle for Rollback Test */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/40 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Test Error Rollback Path</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Simulates network error to verify recovery</p>
          </div>
          <input 
            type="checkbox" 
            checked={simulateError} 
            onChange={(e) => setSimulateError(e.target.checked)}
            className="rounded border-slate-300 text-slate-600 cursor-pointer w-4 h-4"
          />
        </div>

        {/* REAL-TIME LIVE EVALUATION SUMMARY CARD */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-md shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Live Evaluation Summary
            </span>
            <span className="text-xs font-black text-slate-600 dark:text-slate-300">
              {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Candidate:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{candidateName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Recommendation:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{recommendation}</span>
            </div>
            {comment.trim() && (
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                "{comment}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl flex items-center justify-between relative z-10">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          Cancel
        </button>
        <button 
          type="submit" 
          style={{ backgroundColor: brandColor }}
          className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer transition-all hover:brightness-110 flex items-center gap-1.5"
        >
          <span>Submit Evaluation</span>
        </button>
      </div>
    </form>
  );
};

// ── 4. Candidate Review Drawer (Explicit Tab Order) ───────────────────────────
const CandidateReviewView = ({ candidate, onClose }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';
  const { addToast } = useToast();
  const c = candidate || { name: 'Priya Nair', role: 'DevOps Lead', exp: '6.5 yrs', match: 94 };

  return (
    <div className="flex flex-col h-full justify-between bg-white dark:bg-[#111827]">
      {/* Header Profile */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center gap-4">
        <div className="w-13 h-13 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
          {c.name ? c.name[0] : 'P'}
        </div>
        <div>
          <h3 className="text-base font-black text-slate-850 dark:text-slate-100">{c.name}</h3>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">{c.role} · {c.exp} exp</p>
          <span className="inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            {c.match}% Match Score
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar">
        {/* Resume Action */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Resume_{c.name?.replace(/\s+/g, '')}_2026.pdf</p>
            <p className="text-[10px] text-slate-400">Verified AI Parsing · 2.4 MB</p>
          </div>
          <button
            onClick={() => addToast({ message: 'Downloaded resume file simulation.', type: 'info' })}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            📄 View Resume
          </button>
        </div>

        {/* Candidate Evaluation Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-200">Key Competencies</h4>
          <div className="flex flex-wrap gap-1.5">
            {['React / Next.js', 'System Architecture', 'CI/CD Pipelines', 'Kubernetes'].map(s => (
              <span key={s} className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Stage Controls */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Close</button>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              addToast({ message: `${c.name} moved to Final Interview Stage.`, type: 'success' });
              onClose();
            }}
            style={{ backgroundColor: brandColor }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer hover:brightness-110 transition-all"
          >
            Advance Stage
          </button>
          <button 
            onClick={() => {
              addToast({ message: `Offer letter drafted for ${c.name}.`, type: 'success' });
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
          >
            Extend Offer ✨
          </button>
          <button 
            onClick={() => {
              addToast({ message: `Candidate ${c.name} archived.`, type: 'info' });
              onClose();
            }}
            className="py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  );
};

// ── 5. Simulated Action View for Quick Action cards ───────────────────────────
const SimulatedActionView = ({ action, onClose, addToast }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';
  return (
    <div className="flex flex-col h-full justify-between bg-white dark:bg-[#111827]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
        <h3 className="text-base font-black text-slate-850 dark:text-slate-100">{action?.label || 'Enterprise Action'}</h3>
        <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Automated workflow execution</p>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-3 overflow-y-auto">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-3xl shadow-sm">
          {action?.icon || '⚡'}
        </div>
        <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 mt-1">{action?.label}</h4>
        <p className="text-xs text-slate-450 dark:text-slate-400 max-w-sm leading-relaxed">
          {action?.desc || 'Initiates background automated execution and syncs status across HR Admin and Hiring Manager portals.'}
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          Cancel
        </button>
        <button 
          onClick={() => {
            addToast({ message: `${action?.label || 'Task'} executed successfully.`, type: 'success' });
            onClose();
          }} 
          style={{ backgroundColor: brandColor }}
          className="px-5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-sm hover:brightness-110 transition-all"
        >
          Execute Task ✨
        </button>
      </div>
    </div>
  );
};

export default WorkflowModal;
