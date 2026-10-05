// ══════════════════════════════════════════════════════════════════════════════
// WIZARD STEPPER — 3-Step Guided Requisition Creation Wizard with Live Preview
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useContext } from 'react';
import { StatusBadge } from './SharedComponents';
import { ThemeContext } from '../../../ThemeContext';

const WizardStepper = ({ onRequestClose, onSubmitRequisition }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';
  const [currentStep, setCurrentStep] = useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState(1);
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);
  const [srAnnouncement, setSrAnnouncement] = useState('Step 1 of 3: Role Details and Department');

  // Form State
  const [formData, setFormData] = useState({
    role: '',
    dept: 'IT / Engineering',
    priority: 'High',
    targetHires: 1,
    salaryRange: '15L - 25L PA',
    noticePeriod: '30 Days',
  });

  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);

  const isDirty = formData.role.trim() !== '' || formData.targetHires !== 1;

  // Validation gates per step
  const isStep1Valid = formData.role.trim().length > 0 && formData.dept.trim().length > 0;
  const isStep2Valid = formData.targetHires >= 1;

  // Announce step change for accessibility and focus first element
  useEffect(() => {
    let title = '';
    if (currentStep === 1) {
      title = 'Step 1 of 3: Role Details and Department';
      setTimeout(() => step1Ref.current?.focus(), 50);
    } else if (currentStep === 2) {
      title = 'Step 2 of 3: Hiring Scope and Budget';
      setTimeout(() => step2Ref.current?.focus(), 50);
    } else {
      title = 'Step 3 of 3: Live Requisition Preview';
      setTimeout(() => step3Ref.current?.focus(), 50);
    }
    setSrAnnouncement(title);
  }, [currentStep]);

  const handleAttemptClose = () => {
    if (isDirty && currentStep < 3) {
      setShowDiscardPrompt(true);
    } else {
      onRequestClose();
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && isStep1Valid) {
      setCurrentStep(2);
      setMaxCompletedStep(prev => Math.max(prev, 2));
    } else if (currentStep === 2 && isStep2Valid) {
      setCurrentStep(3);
      setMaxCompletedStep(prev => Math.max(prev, 3));
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepIndicatorClick = (stepNum) => {
    if (stepNum <= maxCompletedStep) {
      setCurrentStep(stepNum);
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    onSubmitRequisition({
      role: formData.role,
      dept: formData.dept,
      targetHires: formData.targetHires,
      priority: formData.priority,
      salaryRange: formData.salaryRange,
      noticePeriod: formData.noticePeriod,
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 rounded-3xl relative overflow-hidden">
      {/* Screen Reader ARIA Live Region */}
      <div role="status" aria-live="polite" className="sr-only">
        {srAnnouncement}
      </div>

      {/* Discard Confirmation Modal Overlay */}
      {showDiscardPrompt && (
        <div className="absolute inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full">
            <span className="text-3xl">⚠️</span>
            <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 mt-2">Discard Unsaved Requisition?</h4>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">You have unsaved form entries that will be lost.</p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowDiscardPrompt(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowDiscardPrompt(false);
                  onRequestClose();
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 cursor-pointer"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Step Indicator */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-850 dark:text-slate-100 tracking-tight">Raise New Requisition</h2>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">3-Step guided approval wizard</p>
          </div>
          <button
            onClick={handleAttemptClose}
            aria-label="Close drawer"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Clickable Stepper Indicator */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: 1, label: '1. Role & Dept' },
            { num: 2, label: '2. Scope & Budget' },
            { num: 3, label: '3. Live Preview' },
          ].map((s) => {
            const isActive = currentStep === s.num;
            const isAccessible = s.num <= maxCompletedStep;

            return (
              <button
                key={s.num}
                disabled={!isAccessible}
                onClick={() => handleStepIndicatorClick(s.num)}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold text-center transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-500/30'
                    : isAccessible
                    ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body Content per Step */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {/* STEP 1: Role Details & Department */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">Step 1: Role & Department</h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Specify job title and target department</p>
            </div>

            <div className="flex flex-col gap-1 mt-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Job Title / Role *</label>
              <input
                ref={step1Ref}
                type="text"
                placeholder="e.g. Lead DevOps Engineer"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {!isStep1Valid && formData.role.length > 0 && (
                <span className="text-[11px] font-bold text-rose-500 mt-0.5">Role title cannot be empty</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department *</label>
              <div className="grid grid-cols-2 gap-2">
                {['IT / Engineering', 'Product & Design', 'Sales & Marketing', 'HR & Operations'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, dept: d }))}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      formData.dept === d
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hiring Priority</label>
              <div className="flex gap-2">
                {[
                  { id: 'Urgent', label: '⚡ Urgent', color: '#ef4444' },
                  { id: 'High', label: '🔥 High', color: '#f97316' },
                  { id: 'Normal', label: '🔹 Normal', color: '#3b82f6' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: p.id }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.priority === p.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Hiring Scope & Salary Budget */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">Step 2: Scope & Budget</h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Define headcount targets and compensation range</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Target Headcount Hires *</label>
                <p className="text-[11px] text-slate-400">Total approved open positions</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  ref={step2Ref}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, targetHires: Math.max(1, prev.targetHires - 1) }))}
                  className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-300 cursor-pointer"
                >
                  -
                </button>
                <span className="text-base font-black w-6 text-center">{formData.targetHires}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, targetHires: prev.targetHires + 1 }))}
                  className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-300 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Annual Salary Range</label>
              <div className="grid grid-cols-3 gap-2">
                {['12L - 18L PA', '15L - 25L PA', '25L - 38L PA'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, salaryRange: s }))}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      formData.salaryRange === s
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Notice Period</label>
              <div className="flex gap-2">
                {['Immediate', '30 Days', '60 Days'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, noticePeriod: n }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.noticePeriod === n
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Live Requisition Preview (Actual Table Row Component) */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">Step 3: Live Requisition Preview</h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">
                Review exact dashboard row preview before submission
              </p>
            </div>

            {/* Actual Requisition Row Component Preview */}
            <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-950/20 backdrop-blur-md shadow-sm">
              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
                Live Requisition Table Row Preview
              </div>

              <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">REQ-1060</span>
                    <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mt-0.5">{formData.role || 'New Role'}</h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formData.dept} · {formData.salaryRange}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status="Draft" />
                    <span className="text-xs font-black text-slate-500">0d</span>
                    <button
                      ref={step3Ref}
                      disabled
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-70"
                    >
                      Review JD
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Hiring Priority:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Headcount:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.targetHires} Positions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Notice Target:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.noticePeriod}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <button
          type="button"
          onClick={currentStep === 1 ? handleAttemptClose : handlePrevStep}
          className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          {currentStep === 1 ? 'Cancel' : '← Back'}
        </button>

        {currentStep < 3 ? (
          <button
            type="button"
            disabled={currentStep === 1 ? !isStep1Valid : !isStep2Valid}
            onClick={handleNextStep}
            style={{ backgroundColor: (currentStep === 1 ? isStep1Valid : isStep2Valid) ? brandColor : undefined }}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all ${
              (currentStep === 1 ? isStep1Valid : isStep2Valid)
                ? 'hover:brightness-110 cursor-pointer shadow-sm'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            Next Step →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md cursor-pointer transition-all hover:scale-102"
          >
            Submit Requisition ✨
          </button>
        )}
      </div>
    </div>
  );
};

export default WizardStepper;
