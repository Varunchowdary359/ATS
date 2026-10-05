import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Check, ChevronRight, ChevronLeft, AlertCircle, 
  ShieldCheck, DollarSign, Briefcase, Calendar, 
  User, Plus, Trash2, ShieldAlert, Sparkles, CheckCircle2,
  Save, Send
} from 'lucide-react';
import { 
  EMPLOYMENT_TYPE, 
  WORK_ARRANGEMENT, 
  PAY_FREQUENCY, 
  COMPENSATION_TYPE, 
  BENEFIT_CATEGORIES, 
  PRE_EMPLOYMENT_CONDITIONS
} from './offerTypes';
import { offerService } from './offerService';
import { DatabaseService } from '../../../services/db/DatabaseService';
import CustomSelect from '../../dashboard/shared/CustomSelect';

const WORKFLOW_STEPS = [
  { id: 1, title: 'Candidate & Position', subtitle: 'Target Requisition & Eligibility', icon: User },
  { id: 2, title: 'Employment Details', subtitle: 'Location, Terms & Reporting', icon: Briefcase },
  { id: 3, title: 'Compensation', subtitle: 'Component Structure & CTC', icon: DollarSign },
  { id: 4, title: 'Benefits & Perks', subtitle: 'Insurance, Allowances & Leave', icon: Sparkles },
  { id: 5, title: 'Terms & Conditions', subtitle: 'Expiry, Start Date & BGV', icon: Calendar },
  { id: 6, title: 'Review & Routing', subtitle: 'Template & Approval Workflow', icon: CheckCircle2 }
];

export const CreateOfferPage = ({ 
  onBack, 
  onOfferCreated, 
  initialCandidateId = null, 
  brandColor = 'var(--pw-brand)' 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // DB Lists
  const [candidatesList, setCandidatesList] = useState([]);
  const [requisitionsList, setRequisitionsList] = useState([]);
  const [templatesList, setTemplatesList] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    candidateId: initialCandidateId || '',
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    candidateLocation: '',
    applicationId: '',
    requisitionId: '',
    jobTitle: '',
    department: '',
    businessUnit: 'Core Engineering',
    legalEntity: 'PeopleWorks Technologies India Pvt Ltd',
    workLocation: 'Bengaluru - Outer Ring Road Hub',
    workArrangement: WORK_ARRANGEMENT.HYBRID,
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    jobLevel: 'Senior Level (IC-4)',
    hiringManagerName: 'Alex Chen',
    reportingManager: 'Alex Chen',
    recruiterName: 'Sarah Jenkins',
    expectedStartDate: '',
    offerExpirationDate: '',
    probationPeriod: '3 Months',
    noticePeriod: '60 Days',
    currency: 'INR',
    payFrequency: PAY_FREQUENCY.ANNUAL,
    components: [
      { id: 'c1', name: 'Fixed Base Salary (Basic + HRA + Special)', type: COMPENSATION_TYPE.BASE_SALARY, amount: 2200000, frequency: PAY_FREQUENCY.ANNUAL, taxable: true, guaranteed: true },
      { id: 'c2', name: 'Annual Performance Incentive', type: COMPENSATION_TYPE.VARIABLE_PAY, amount: 300000, frequency: PAY_FREQUENCY.ANNUAL, taxable: true, guaranteed: false, notes: 'Paid quarterly based on OKRs' },
      { id: 'c3', name: 'One-Time Joining Bonus', type: COMPENSATION_TYPE.JOINING_BONUS, amount: 150000, frequency: PAY_FREQUENCY.ONE_TIME, taxable: true, guaranteed: true, notes: 'Payable in month 1' }
    ],
    benefits: [
      { id: 'b1', name: 'Comprehensive Health Insurance (₹10 Lakhs Coverage)', category: BENEFIT_CATEGORIES.HEALTH, selected: true },
      { id: 'b2', name: 'Term Life Cover (3x CTC)', category: BENEFIT_CATEGORIES.LIFE_DISABILITY, selected: true },
      { id: 'b3', name: 'Annual Learning & Certifications Stipend (₹75,000)', category: BENEFIT_CATEGORIES.ALLOWANCES, selected: true },
      { id: 'b4', name: '28 Annual Paid Leaves + 12 Holidays', category: BENEFIT_CATEGORIES.TIME_OFF, selected: true }
    ],
    conditions: PRE_EMPLOYMENT_CONDITIONS.map(c => ({ ...c, status: 'Required' })),
    templateId: 'TMPL-IND-FT-01',
    templateName: 'India - Full Time Standard Offer',
    submitForApproval: true
  });

  // Eligibility Validation State
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  useEffect(() => {
    DatabaseService.init();
    
    const loadInitialData = async () => {
      let candidates = DatabaseService.candidates || [];
      if (!Array.isArray(candidates) || candidates.length === 0) {
        try {
          candidates = await DatabaseService.getCandidates();
        } catch (e) {
          candidates = [];
        }
      }

      let reqs = DatabaseService.requisitions || [];
      if (!Array.isArray(reqs) || reqs.length === 0) {
        try {
          reqs = await DatabaseService.getRequisitions();
        } catch (e) {
          reqs = [];
        }
      }

      // Fallback requisitions if empty
      if (!Array.isArray(reqs) || reqs.length === 0) {
        reqs = [
          { id: 'REQ-2026-001', reqCode: 'REQ-2026-001', title: 'Senior Frontend Architect', department: 'Engineering', hiringManager: 'Alex Chen' },
          { id: 'REQ-2026-002', reqCode: 'REQ-2026-002', title: 'Lead Cloud DevOps Architect', department: 'Platform Engineering', hiringManager: 'Alex Chen' },
          { id: 'REQ-2026-003', reqCode: 'REQ-2026-003', title: 'Senior Product Manager', department: 'Product Management', hiringManager: 'Priya Sundaram' },
          { id: 'REQ-2026-004', reqCode: 'REQ-2026-004', title: 'QA Automation Lead', department: 'Quality Assurance', hiringManager: 'Alex Chen' },
          { id: 'REQ-2026-005', reqCode: 'REQ-2026-005', title: 'Lead UI/UX Designer', department: 'Design & User Experience', hiringManager: 'Alex Chen' }
        ];
      }

      const safeCandidates = Array.isArray(candidates) ? candidates : [];
      const safeReqs = Array.isArray(reqs) ? reqs : [];
      const tmpls = offerService.getTemplates();

      setCandidatesList(safeCandidates);
      setRequisitionsList(safeReqs);
      setTemplatesList(Array.isArray(tmpls) ? tmpls : []);

      // Default dates
      const now = new Date();
      const expDate = new Date();
      expDate.setDate(now.getDate() + 14);
      const startDate = new Date();
      startDate.setDate(now.getDate() + 45);

      setFormData(prev => ({
        ...prev,
        offerExpirationDate: expDate.toISOString().split('T')[0],
        expectedStartDate: startDate.toISOString().split('T')[0]
      }));

      if (initialCandidateId) {
        handleCandidateSelect(initialCandidateId, safeCandidates, safeReqs);
      }
    };

    loadInitialData();
  }, [initialCandidateId]);

  const handleCandidateSelect = async (candId, candidates = candidatesList, reqs = requisitionsList) => {
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    const safeReqs = Array.isArray(reqs) ? reqs : [];
    const cand = safeCandidates.find(c => c.id === candId);
    if (!cand) return;

    const allApps = DatabaseService.applications || [];
    const applications = allApps.filter(a => a.candidateId === candId);
    const primaryApp = applications[0];
    const req = safeReqs.find(r => r.id === primaryApp?.requisitionId) || safeReqs[0];

    const updatedForm = {
      ...formData,
      candidateId: cand.id,
      candidateName: cand.name,
      candidateEmail: cand.email,
      candidatePhone: cand.phone || '+91 98450 11223',
      candidateLocation: cand.location || 'Bengaluru, India',
      applicationId: primaryApp?.id || `APP-${cand.id}`,
      requisitionId: req?.id || 'REQ-2026-001',
      jobTitle: req?.title || cand.role || cand.currentTitle || 'Senior Engineer',
      department: req?.department || 'Engineering',
      hiringManagerName: req?.hiringManager || 'Alex Chen',
      reportingManager: req?.hiringManager || 'Alex Chen'
    };

    setFormData(updatedForm);

    // Run eligibility check
    setIsCheckingEligibility(true);
    try {
      const elRes = await offerService.validateOfferEligibility({
        candidateId: cand.id,
        applicationId: updatedForm.applicationId,
        requisitionId: updatedForm.requisitionId
      });
      setEligibilityResult(elRes);
    } catch (e) {
      console.warn('Eligibility check error:', e);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  // Live Compensation Totals
  const compTotals = useMemo(() => {
    let base = 0;
    let variable = 0;
    let oneTime = 0;
    formData.components.forEach(c => {
      const val = Number(c.amount) || 0;
      if (c.type === COMPENSATION_TYPE.BASE_SALARY) base += val;
      else if (c.type === COMPENSATION_TYPE.VARIABLE_PAY) variable += val;
      else oneTime += val;
    });
    return {
      base,
      variable,
      oneTime,
      totalCtc: base + variable + oneTime
    };
  }, [formData.components]);

  // Selected Requisition
  const activeRequisition = useMemo(() => {
    return Array.isArray(requisitionsList) ? requisitionsList.find(r => r.id === formData.requisitionId) : null;
  }, [requisitionsList, formData.requisitionId]);

  const handleAddComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [
        ...prev.components,
        {
          id: `c-${Date.now()}`,
          name: 'Custom Special Allowance',
          type: COMPENSATION_TYPE.CUSTOM,
          amount: 100000,
          frequency: PAY_FREQUENCY.ANNUAL,
          taxable: true,
          guaranteed: true
        }
      ]
    }));
  };

  const handleRemoveComponent = (id) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== id)
    }));
  };

  const handleComponentChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  // Step Validations
  const validateCurrentStep = (stepIdx = currentStep) => {
    const errors = {};
    if (stepIdx === 0) {
      if (!formData.candidateId) errors.candidateId = 'Please select a candidate.';
      if (!formData.requisitionId) errors.requisitionId = 'Please select a linked job requisition.';
      if (eligibilityResult && !eligibilityResult.isEligible) {
        errors.eligibility = 'Eligibility blockers must be resolved before generating an offer.';
      }
    } else if (stepIdx === 1) {
      if (!formData.jobTitle.trim()) errors.jobTitle = 'Position title is required.';
      if (!formData.department.trim()) errors.department = 'Department is required.';
      if (!formData.workLocation.trim()) errors.workLocation = 'Work location is required.';
      if (!formData.reportingManager.trim()) errors.reportingManager = 'Reporting manager is required.';
    } else if (stepIdx === 2) {
      if (compTotals.base <= 0) errors.base = 'Base salary must be greater than zero.';
      if (compTotals.totalCtc <= 0) errors.ctc = 'Total compensation must be calculated.';
    } else if (stepIdx === 4) {
      if (!formData.expectedStartDate) errors.expectedStartDate = 'Expected joining date is required.';
      if (!formData.offerExpirationDate) errors.offerExpirationDate = 'Offer expiration date is required.';
      if (new Date(formData.offerExpirationDate) >= new Date(formData.expectedStartDate)) {
        errors.offerExpirationDate = 'Offer expiration date must precede the expected start date.';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, WORKFLOW_STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (idx) => {
    if (idx < currentStep || validateCurrentStep(currentStep)) {
      setCurrentStep(idx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = async (submitForApproval = true) => {
    if (!validateCurrentStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        submitForApproval,
        selectedBenefits: formData.benefits.filter(b => b.selected)
      };
      const createdOffer = await offerService.createOffer(payload, 'Sarah Jenkins');
      if (onOfferCreated) {
        onOfferCreated(createdOffer);
      }
    } catch (e) {
      console.error('Failed to create offer:', e);
      setFormErrors({ submit: e.message || 'Failed to generate offer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12 font-sans space-y-5 animate-fade-in-up">
      
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP ACTION BAR (MATCHING CREATE REQUISITION PAGE)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
            title="Back to Offer Hub"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Generate Employment Offer</span>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                OFF-2026-DRAFT
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enterprise Offer Creation, Component Compensation Builder & Governance Routing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="h-9.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleFinalSubmit(false)}
            disabled={isSubmitting}
            className="h-9.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <Save size={14} style={{ color: brandColor }} />
            <span>Save Draft</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleFinalSubmit(true)}
            disabled={isSubmitting}
            style={{
              backgroundColor: brandColor,
              boxShadow: `0 4px 16px ${brandColor}35`
            }}
            className="h-9.5 px-5 text-xs font-extrabold text-white hover:brightness-110 rounded-xl border border-white/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send size={14} strokeWidth={2.5} />
            <span>Submit for Approval</span>
          </motion.button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. GLASSMORPHISM STEP NAVIGATOR BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;

            return (
              <motion.div 
                key={step.id} 
                whileHover={(isCompleted || isActive) ? { scale: 1.01, y: -1 } : {}}
                whileTap={(isCompleted || isActive) ? { scale: 0.99 } : {}}
                onClick={() => handleStepClick(idx)}
                style={isActive ? {
                  backgroundColor: brandColor,
                  borderColor: brandColor,
                  boxShadow: `0 4px 16px ${brandColor}40`
                } : {}}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive 
                    ? 'text-white font-bold ring-2 ring-white/30' 
                    : isCompleted 
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span 
                    className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                      isActive ? 'bg-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}
                    style={isActive ? { color: brandColor } : {}}
                  >
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : (idx + 1)}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                    isActive ? 'text-white/90 font-bold' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    {isCompleted ? 'Complete' : isActive ? 'In Progress' : 'Pending'}
                  </span>
                </div>
                <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {step.title}
                </div>
                <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                  {step.subtitle}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. MAIN 2-COLUMN WORKSPACE (FORM: 8 COLS | SUMMARY SIDEBAR: 4 COLS)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Workspace (8 Cols) */}
        <div className="lg:col-span-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
          
          {/* STEP 0: CANDIDATE & POSITION */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                  1. Candidate & Target Requisition
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select candidate and position. System will automatically verify interview completion and eligibility gates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Select Candidate <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <CustomSelect
                    options={(candidatesList || []).map(c => ({ value: c.id, label: `${c.name} (${c.id}) • ${c.role || c.currentTitle || 'Candidate'}` }))}
                    value={formData.candidateId}
                    onChange={(val) => handleCandidateSelect(val)}
                    placeholder="Choose candidate to extend offer..."
                  />
                  {formErrors.candidateId && <p className="text-xs text-rose-500 mt-1">{formErrors.candidateId}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Linked Job Requisition <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <CustomSelect
                    options={(requisitionsList || []).map(r => ({ value: r.id, label: `${r.reqCode || r.id} - ${r.title || r.jobTitle || 'Requisition'} (${r.department || 'General'})` }))}
                    value={formData.requisitionId}
                    onChange={(val) => {
                      const req = (requisitionsList || []).find(r => r.id === val);
                      setFormData(prev => ({
                        ...prev,
                        requisitionId: val,
                        jobTitle: req?.title || req?.jobTitle || prev.jobTitle,
                        department: req?.department || prev.department,
                        hiringManagerName: req?.hiringManager || prev.hiringManagerName,
                        reportingManager: req?.hiringManager || prev.reportingManager
                      }));
                    }}
                    placeholder="Select approved requisition..."
                  />
                  {formErrors.requisitionId && <p className="text-xs text-rose-500 mt-1">{formErrors.requisitionId}</p>}
                </div>
              </div>

              {/* Real-time Eligibility Gate Assessment Card */}
              {isCheckingEligibility ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500 animate-pulse">
                  Verifying candidate interview completion, HR validation & offer eligibility...
                </div>
              ) : eligibilityResult && (
                <div className={`p-4.5 rounded-xl border transition-all ${
                  eligibilityResult.isEligible 
                    ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20' 
                    : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2 rounded-lg shrink-0 ${eligibilityResult.isEligible ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300'}`}>
                      {eligibilityResult.isEligible ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-bold ${eligibilityResult.isEligible ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'}`}>
                          {eligibilityResult.isEligible ? '✓ Candidate Is Fully Eligible For Offer Generation' : '⚠️ Offer Generation Blocker Detected'}
                        </h4>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {eligibilityResult.interviewSummary?.completedRounds || 0} Rounds Completed
                        </span>
                      </div>

                      {Array.isArray(eligibilityResult.blockers) && eligibilityResult.blockers.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {eligibilityResult.blockers.map((b, i) => (
                            <p key={i} className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {b}
                            </p>
                          ))}
                        </div>
                      )}

                      {Array.isArray(eligibilityResult.warnings) && eligibilityResult.warnings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {eligibilityResult.warnings.map((w, i) => (
                            <p key={i} className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {w}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: EMPLOYMENT DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                  2. Employment Details & Terms
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure corporate legal entity, designation level, location, and reporting manager.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Position Title <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                  {formErrors.jobTitle && <p className="text-xs text-rose-500 mt-1">{formErrors.jobTitle}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Department / Division <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                  {formErrors.department && <p className="text-xs text-rose-500 mt-1">{formErrors.department}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Legal Entity <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.legalEntity}
                    onChange={(e) => setFormData({ ...formData, legalEntity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Work Location <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.workLocation}
                    onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                  {formErrors.workLocation && <p className="text-xs text-rose-500 mt-1">{formErrors.workLocation}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Work Arrangement
                  </label>
                  <CustomSelect
                    options={Object.values(WORK_ARRANGEMENT).map(v => ({ value: v, label: v }))}
                    value={formData.workArrangement}
                    onChange={(val) => setFormData({ ...formData, workArrangement: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Employment Type
                  </label>
                  <CustomSelect
                    options={Object.values(EMPLOYMENT_TYPE).map(v => ({ value: v, label: v }))}
                    value={formData.employmentType}
                    onChange={(val) => setFormData({ ...formData, employmentType: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Job Grade / Level
                  </label>
                  <input
                    type="text"
                    value={formData.jobLevel}
                    onChange={(e) => setFormData({ ...formData, jobLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Reporting Manager <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.reportingManager}
                    onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                  {formErrors.reportingManager && <p className="text-xs text-rose-500 mt-1">{formErrors.reportingManager}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COMPENSATION BUILDER */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                    3. Component-Based Compensation Structure
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define fixed base, variable incentives, joining bonuses, and allowances.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddComponent}
                  className="px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/10 rounded-xl border border-brand/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Component</span>
                </button>
              </div>

              {/* Currency & Frequency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Currency
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'INR', label: 'INR (₹) - Indian Rupee' },
                      { value: 'USD', label: 'USD ($) - US Dollar' },
                      { value: 'EUR', label: 'EUR (€) - Euro' },
                      { value: 'GBP', label: 'GBP (£) - British Pound' }
                    ]}
                    value={formData.currency}
                    onChange={(val) => setFormData({ ...formData, currency: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Pay Frequency
                  </label>
                  <CustomSelect
                    options={Object.values(PAY_FREQUENCY).map(v => ({ value: v, label: v }))}
                    value={formData.payFrequency}
                    onChange={(val) => setFormData({ ...formData, payFrequency: val })}
                  />
                </div>
              </div>

              {/* Component Rows */}
              <div className="space-y-3 pt-2">
                {formData.components.map((comp) => (
                  <div key={comp.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => handleComponentChange(comp.id, 'name', e.target.value)}
                        placeholder="Component name..."
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">{formData.currency === 'USD' ? '$' : '₹'}</span>
                        <input
                          type="number"
                          value={comp.amount}
                          onChange={(e) => handleComponentChange(comp.id, 'amount', e.target.value)}
                          className="w-32 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-extrabold text-right font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(comp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: BENEFITS & PERKS */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                  4. Configurable Benefits & Corporate Perks
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select applicable health insurance, allowances, wellness subsidies, and leave entitlements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.benefits.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        benefits: prev.benefits.map(item => item.id === b.id ? { ...item, selected: !item.selected } : item)
                      }));
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      b.selected 
                        ? 'border-brand bg-brand/5 dark:bg-brand/10 text-slate-900 dark:text-white shadow-2xs' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{b.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase mt-0.5">{b.category}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      b.selected ? 'bg-brand text-white border-brand' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                    }`}>
                      {b.selected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: TERMS & CONDITIONS */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                  5. Offer Expiration, Joining Date & Pre-Employment Checks
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set expiration SLA, expected start date, probation timeline, and background verification requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Expected Joining Date <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expectedStartDate}
                    onChange={(e) => setFormData({ ...formData, expectedStartDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                  {formErrors.expectedStartDate && <p className="text-xs text-rose-500 mt-1">{formErrors.expectedStartDate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Offer Expiration Date <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.offerExpirationDate}
                    onChange={(e) => setFormData({ ...formData, offerExpirationDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                  {formErrors.offerExpirationDate && <p className="text-xs text-rose-500 mt-1">{formErrors.offerExpirationDate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Probation Period
                  </label>
                  <input
                    type="text"
                    value={formData.probationPeriod}
                    onChange={(e) => setFormData({ ...formData, probationPeriod: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Notice Period
                  </label>
                  <input
                    type="text"
                    value={formData.noticePeriod}
                    onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & POLICY ROUTING */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                  6. Review Offer Package & Approval Chain
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select offer letter template and preview the automated multi-tier approval routing chain.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Offer Letter Template
                </label>
                <CustomSelect
                  options={(templatesList || []).map(t => ({ value: t.id, label: `${t.name} (${t.country} - ${t.currency})` }))}
                  value={formData.templateId}
                  onChange={(val) => {
                    const tmpl = templatesList.find(t => t.id === val);
                    setFormData(prev => ({
                      ...prev,
                      templateId: val,
                      templateName: tmpl?.name || prev.templateName
                    }));
                  }}
                />
              </div>

              {/* Approval Workflow Preview */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Automated Multi-Tier Approval Chain Preview
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">1</span>
                    <span className="font-bold text-slate-900 dark:text-white">Level 1: Hiring Manager Sign-off</span>
                    <span className="text-slate-400 ml-auto">Alex Chen</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px]">2</span>
                    <span className="font-bold text-slate-900 dark:text-white">Level 2: HRBP Validation</span>
                    <span className="text-slate-400 ml-auto">Marcus Vance</span>
                  </div>
                  {compTotals.totalCtc > 3500000 && (
                    <div className="flex items-center gap-3 text-xs p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 font-bold flex items-center justify-center text-[10px]">3</span>
                      <span className="font-bold text-amber-900 dark:text-amber-200">Level 3: Finance / Compensation Override</span>
                      <span className="text-amber-700 dark:text-amber-300 ml-auto">Elena Rostova (FP&A)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft size={14} />
              <span>Previous Step</span>
            </button>

            {currentStep < WORKFLOW_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{ backgroundColor: brandColor }}
                className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue to {WORKFLOW_STEPS[currentStep + 1]?.title}</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinalSubmit(true)}
                disabled={isSubmitting}
                style={{ backgroundColor: brandColor }}
                className="px-6 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Submitting Offer...' : 'Submit Offer for Approval'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Summary & Validation Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
          
          {/* Candidate Card */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-sm space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Selected Candidate
            </div>
            {formData.candidateName ? (
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-xs shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  {formData.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                    {formData.candidateName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {formData.jobTitle || 'Target Role'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No candidate selected yet.</p>
            )}
          </div>

          {/* Real-Time Total Compensation Summary Card */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Compensation (CTC)
              </span>
              <span className="text-xs font-bold font-mono text-brand">
                {formData.currency}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Fixed Base Salary:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formData.currency === 'USD' ? '$' : '₹'}{Number(compTotals.base || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Target Variable Incentive:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formData.currency === 'USD' ? '$' : '₹'}{Number(compTotals.variable || 0).toLocaleString('en-IN')}
                </span>
              </div>
              {compTotals.oneTime > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>One-Time Joining Bonus:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formData.currency === 'USD' ? '$' : '₹'}{Number(compTotals.oneTime || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 dark:text-white text-xs">Total Annual CTC:</span>
                <span className="text-lg font-extrabold font-sans text-brand">
                  {formData.currency === 'USD' ? '$' : '₹'}{Number(compTotals.totalCtc || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Budget Ceiling Guardrail */}
            {activeRequisition && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Requisition Allocation:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{activeRequisition.reqCode || activeRequisition.id}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Hiring Manager:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{formData.hiringManagerName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOfferPage;
