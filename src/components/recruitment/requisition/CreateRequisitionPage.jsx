import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Save, Send, AlertCircle, FileUp, 
  UserCheck, DollarSign, Building, Calendar, CheckCircle2, ShieldCheck, Briefcase, MapPin, Eye, Flame, Layers, Award, Tag, Laptop, ShieldAlert, Check, X, FileText, HelpCircle, Clock, Sparkles, Search, Download, Lock
} from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import SearchableSelect from '../../dashboard/shared/SearchableSelect';
import PeoplePicker from '../../dashboard/shared/PeoplePicker';
import SearchableMultiSelect from '../../dashboard/shared/SearchableMultiSelect';
import { INITIAL_JDS } from '../jd/jdMockData';
import { INITIAL_REQUISITIONS } from '../recruitmentMockData';
import { useBreadcrumb } from '../../shared/BreadcrumbContext';

const WORKFLOW_STEPS = [
  { id: 0, title: 'Business Need', subtitle: 'Define hiring request & origin', statusKey: 'step0' },
  { id: 1, title: 'Job Details', subtitle: 'Role, skills & responsibilities', statusKey: 'step1' },
  { id: 2, title: 'Budget & Compensation', subtitle: 'Salary band & cost center', statusKey: 'step2' },
  { id: 3, title: 'Provisioning', subtitle: 'IT hardware & licensing', statusKey: 'step3' },
  { id: 4, title: 'Approvals & Review', subtitle: 'Routing policy & business case', statusKey: 'step4' }
];

const getNextSequentialReqId = () => {
  try {
    let allReqs = [];
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('pw_requisitions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allReqs = parsed;
        }
      }
    }

    let maxNum = 0;
    allReqs.forEach(req => {
      if (req?.id) {
        const match = req.id.match(/\d+/g);
        if (match && match.length > 0) {
          const lastNum = parseInt(match[match.length - 1], 10);
          if (!isNaN(lastNum) && lastNum > maxNum) {
            maxNum = lastNum;
          }
        }
      }
    });

    const nextNum = maxNum + 1;
    return `REQ-2026-${String(nextNum).padStart(4, '0')}`;
  } catch (e) {
    return 'REQ-2026-0001';
  }
};

const formatAmountLocale = (val, currency = 'INR') => {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/,/g, ''));
  if (isNaN(num)) return '';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return num.toLocaleString(locale);
};

const getIndianLakhsHelper = (val, currency = 'INR') => {
  if (!val || isNaN(String(val).replace(/,/g, ''))) return '';
  const num = Number(String(val).replace(/,/g, ''));
  if (num <= 0) return '';

  if (currency === 'INR') {
    if (num >= 10000000) {
      const cr = (num / 10000000).toFixed(2).replace(/\.00$/, '');
      return `₹ ${num.toLocaleString('en-IN')} (${cr} Cr)`;
    } else if (num >= 100000) {
      const lakh = (num / 100000).toFixed(2).replace(/\.00$/, '');
      return `₹ ${num.toLocaleString('en-IN')} (${lakh} Lakhs)`;
    } else {
      return `₹ ${num.toLocaleString('en-IN')}`;
    }
  } else {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
    return `${symbol} ${num.toLocaleString('en-US')}`;
  }
};

const CreateRequisitionPage = ({ onNavigate, onSaveRequisition }) => {
  const { addToast } = useToast();
  const { activeTheme } = React.useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showJdPickerModal, setShowJdPickerModal] = useState(false);
  const [jdSearchQuery, setJdSearchQuery] = useState('');

  const [formData, setFormData] = useState(() => ({
    id: getNextSequentialReqId(),
    jobTitle: '',
    jobFamily: 'Software Engineering',
    businessUnit: 'Cloud & AI Platform',
    department: 'Engineering',
    subTeam: 'Core Infrastructure',
    location: 'Bangalore',
    country: 'India',
    headcount: 1,
    targetHireDate: '',
    employmentType: 'Full-Time',
    workMode: 'Remote',
    experience: 'Mid-Level (3-5 yrs)',
    jobGrade: 'L4 - Senior Engineer',
    education: "Bachelor's Degree",
    certifications: ['AWS Certified Solutions Architect'],
    noticePeriod: '30 Days',
    travelRequirement: 'No Travel Required',
    shiftSchedule: 'General Shift (9 AM - 6 PM)',
    jobCategory: 'Technology',
    hireType: 'New Position',
    previousEmployee: '',
    previousEmployeeId: '',
    separationReason: 'Resignation',
    expectedLastWorkingDate: '',
    minSalary: '',
    maxSalary: '',
    currency: 'INR',
    payFrequency: 'Annual CTC',
    budgetType: 'Approved Budget',
    budgetAmount: '',
    compensationType: 'Fixed + Performance Bonus',
    bonusStructure: 'Performance Bonus',
    equityBenefits: 'Health Insurance, Learning Allowance, ESOP Package',
    budgetJustification: '',
    costCenter: 'CC-1024',
    hiringManager: 'Alex Chen',
    recruiter: 'Sarah Miller',
    hrbp: 'David Miller',
    hiringPriority: 'Medium',
    justificationNote: '',
    description: '',
    skills: ['React', 'TypeScript', 'Node.js'],
    preferredSkills: ['GraphQL', 'Tailwind CSS', 'Docker'],
    hardwareList: ['MacBook Pro M3 (Apple Silicon)', 'Dual 27" 4K Monitors'],
    softwareList: ['Slack Enterprise', 'GitHub Copilot Enterprise', 'Jira & Confluence'],
    emailLicense: 'Microsoft 365 E5',
    vpnAccess: true,
    mfaSecurity: true,
    mobileDevice: 'None',
    provisioningNotes: '',
    hardware: 'MacBook Pro M3 (Apple Silicon), Dual 27" 4K Monitors',
    software: 'Slack Enterprise, GitHub Copilot Enterprise, Jira & Confluence',
    approvalWorkflow: 'Standard Manager + Finance Approval',
    attachments: []
  }));

  const { setExtraCrumbs, clearExtraCrumbs } = useBreadcrumb();

  useEffect(() => {
    const editData = sessionStorage.getItem('pw_req_edit');
    if (editData) {
      try {
        const parsed = JSON.parse(editData);
        setFormData(parsed);
        setExtraCrumbs([{ label: `Edit ${parsed.id}` }]);
      } catch (e) {
        console.error(e);
        setExtraCrumbs([{ label: 'Create Requisition' }]);
      }
    } else {
      setExtraCrumbs([{ label: 'Create Requisition' }]);
    }
    return () => {
      clearExtraCrumbs();
    };
  }, []);

  const update = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const getAvailableJds = () => {
    try {
      const storedLocal = localStorage.getItem('pw_job_descriptions');
      const storedSession = sessionStorage.getItem('pw_jds');
      const customJds = storedLocal ? JSON.parse(storedLocal) : (storedSession ? JSON.parse(storedSession) : []);
      return Array.isArray(customJds) ? customJds : [];
    } catch (e) {
      return [];
    }
  };

  const handleImportJd = (selectedJd) => {
    setFormData(prev => ({
      ...prev,
      jobTitle: selectedJd.title || prev.jobTitle,
      department: selectedJd.department || prev.department,
      businessUnit: selectedJd.businessUnit || prev.businessUnit,
      subTeam: selectedJd.subTeam || prev.subTeam,
      employmentType: selectedJd.employmentType || prev.employmentType,
      workMode: selectedJd.workMode || prev.workMode,
      location: selectedJd.location || prev.location,
      experience: selectedJd.experienceMin ? `${selectedJd.experienceMin}-${selectedJd.experienceMax} yrs` : prev.experience,
      jobGrade: selectedJd.jobLevel || prev.jobGrade,
      education: selectedJd.qualifications || prev.education,
      noticePeriod: selectedJd.noticePeriod || prev.noticePeriod,
      skills: selectedJd.requiredSkills || prev.skills,
      description: selectedJd.summary || prev.description,
      minSalary: selectedJd.salaryMin ? String(selectedJd.salaryMin) : prev.minSalary,
      maxSalary: selectedJd.salaryMax ? String(selectedJd.salaryMax) : prev.maxSalary,
      currency: selectedJd.currency || prev.currency,
      payFrequency: selectedJd.payFrequency || prev.payFrequency,
      bonusStructure: selectedJd.bonusStructure || prev.bonusStructure,
      costCenter: selectedJd.costCenter || prev.costCenter,
      headcount: selectedJd.positions || prev.headcount
    }));
    setShowJdPickerModal(false);
    addToast({
      title: 'JD Specifications Imported',
      message: `Successfully populated "${selectedJd.title}" (${selectedJd.employmentType || 'Full-Time'}, ${selectedJd.workMode || 'Hybrid'}, ${selectedJd.currency || 'INR'} Band, ${selectedJd.costCenter || 'CC-1024'}).`,
      type: 'success'
    });
  };

  const handleAutoGenerateAI = () => {
    const title = formData.jobTitle.trim() || 'Software Engineer';
    const generatedDesc = `We are seeking an experienced ${title} to join our high-velocity team. In this role, you will lead end-to-end features, drive architectural scalability, collaborate with product stakeholders, and ensure top-tier software reliability across enterprise applications.`;
    const generatedSkills = formData.skills.trim() 
      ? formData.skills 
      : title.toLowerCase().includes('design') 
        ? 'Figma, Design Systems, User Research, Wireframing, Prototyping'
        : title.toLowerCase().includes('sales')
        ? 'B2B Sales, Outbound Prospecting, Salesforce, Pipeline Mgmt'
        : 'React, TypeScript, Node.js, GraphQL, REST APIs, Tailwind CSS';

    setFormData(prev => ({
      ...prev,
      description: generatedDesc,
      skills: generatedSkills
    }));
    addToast({ title: 'AI Copilot Assist', message: `Generated job summary and skills tags for "${title}".`, type: 'success' });
  };

  const validateStep = (stepIdx) => {
    const errs = {};

    if (stepIdx === 0) {
      if (!formData.businessUnit) errs.businessUnit = 'Business Unit is required';
      if (!formData.department) errs.department = 'Department is required';
      if (!formData.location) errs.location = 'Location is required';
      if (formData.hireType === 'Replacement') {
        if (!formData.previousEmployee || !formData.previousEmployee.trim()) errs.previousEmployee = 'Previous Employee Name is required for replacements';
      }
    } else if (stepIdx === 1) {
      if (!formData.jobTitle.trim() || formData.jobTitle.length < 3) errs.jobTitle = 'Job Title must be at least 3 characters';
      if (!formData.headcount || Number(formData.headcount) < 1) errs.headcount = 'Number of vacancies must be at least 1';
      if (!formData.targetHireDate) errs.targetHireDate = 'Target hire date is required';
      const hasSkills = Array.isArray(formData.skills) ? formData.skills.length > 0 : Boolean(formData.skills && formData.skills.trim());
      if (!hasSkills) errs.skills = 'Key skills are required';
      if (!formData.description.trim()) errs.description = 'Job description is required';
    } else if (stepIdx === 2) {
      if (!formData.minSalary || Number(formData.minSalary) <= 0) errs.minSalary = 'Minimum salary must be greater than 0';
      if (!formData.maxSalary || Number(formData.maxSalary) <= 0) errs.maxSalary = 'Maximum salary must be greater than 0';
      if (Number(formData.maxSalary) <= Number(formData.minSalary)) errs.maxSalary = 'Maximum salary must be greater than Minimum salary';
      if (!formData.costCenter || !formData.costCenter.trim() || !formData.costCenter.startsWith('CC-')) errs.costCenter = 'Cost center format must be CC-XXXX';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Compute Missing Required Fields
  const missingValidationsCount = useMemo(() => {
    let count = 0;
    if (!formData.jobTitle.trim()) count++;
    if (!formData.targetHireDate) count++;
    const hasSkills = Array.isArray(formData.skills) ? formData.skills.length > 0 : Boolean(formData.skills && formData.skills.trim());
    if (!hasSkills) count++;
    if (!formData.description.trim()) count++;
    if (!formData.minSalary) count++;
    if (!formData.maxSalary) count++;
    if (!formData.costCenter || !formData.costCenter.trim()) count++;
    if (formData.hireType === 'Replacement') {
      if (!formData.previousEmployee || !formData.previousEmployee.trim()) count++;
    }
    return count;
  }, [formData]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      addToast({ title: 'Validation Alert', message: 'Please fill required fields.', type: 'warning' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (targetStep) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
    } else if (targetStep > currentStep) {
      if (validateStep(currentStep)) {
        setCurrentStep(targetStep);
      } else {
        addToast({
          title: 'Validation Alert',
          message: 'Please fill required fields.',
          type: 'warning'
        });
      }
    }
  };

  const saveToSessionStorage = (req) => {
    try {
      const stored = sessionStorage.getItem('pw_requisitions');
      let currentList = INITIAL_REQUISITIONS;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentList = parsed;
        }
      }
      const existingIdx = currentList.findIndex(r => r.id === req.id);
      let updatedList;
      if (existingIdx >= 0) {
        updatedList = [...currentList];
        updatedList[existingIdx] = req;
      } else {
        updatedList = [req, ...currentList];
      }
      sessionStorage.setItem('pw_requisitions', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }
  };

  const getCurrencySymbol = (curr) => {
    switch (curr) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'SGD': return 'S$';
      case 'AED': return 'AED ';
      default: return '₹';
    }
  };

  const handleSaveDraft = () => {
    if (!formData.jobTitle.trim()) {
      setErrors({ jobTitle: 'Job Title is required' });
      addToast({ title: 'Draft Alert', message: 'Please enter a Job Title to save draft.', type: 'warning' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const symbol = getCurrencySymbol(formData.currency);
      const newReq = {
        ...formData,
        id: formData.id || getNextSequentialReqId(),
        status: 'Draft',
        daysOpen: 1,
        candidateCount: 0,
        salaryBand: `${symbol}${Number(formData.minSalary || 0).toLocaleString()} - ${symbol}${Number(formData.maxSalary || 0).toLocaleString()}`,
        history: [
          ...(formData.history || []),
          { action: 'Draft Saved', by: formData.hiringManager, date: new Date().toISOString() }
        ]
      };

      saveToSessionStorage(newReq);
      if (onSaveRequisition) onSaveRequisition(newReq);
      sessionStorage.removeItem('pw_req_edit');
      addToast({ title: 'Draft Saved', message: `Requisition "${newReq.id}" saved as Draft.`, type: 'info' });
      setIsSaving(false);
      if (onNavigate) onNavigate('requisitions');
    }, 400);
  };

  const handleSubmit = () => {
    const isStep0Valid = validateStep(0);
    const isStep1Valid = validateStep(1);
    const isStep2Valid = validateStep(2);

    if (!isStep0Valid || !isStep1Valid || !isStep2Valid) {
      addToast({ title: 'Form Incomplete', message: 'Please fix all missing validations across wizard steps.', type: 'error' });
      if (!isStep0Valid) setCurrentStep(0);
      else if (!isStep1Valid) setCurrentStep(1);
      else if (!isStep2Valid) setCurrentStep(2);
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const reqId = formData.id || getNextSequentialReqId();
      const symbol = getCurrencySymbol(formData.currency);

      const submittedReq = {
        ...formData,
        id: reqId,
        status: 'Pending Approval',
        salaryBand: `${symbol}${Number(formData.minSalary).toLocaleString()} - ${symbol}${Number(formData.maxSalary).toLocaleString()}`,
        approvalChain: [
          { id: 'hiring_manager', role: 'Hiring Manager', status: 'Submitted', name: formData.hiringManager || 'Hiring Manager', date: new Date().toISOString(), avatar: 'HM' },
          { id: 'dept_head', role: 'Department Head', status: 'Pending', name: formData.department ? `${formData.department} Director` : 'Department Head', date: null, avatar: 'DH' },
          { id: 'finance', role: 'Finance Controller', status: 'Waiting', name: 'Finance Controller', date: null, avatar: 'FC' },
          { id: 'hr', role: 'HR / Talent Acquisition', status: 'Waiting', name: formData.hrbp || 'HR Lead', date: null, avatar: 'HR' }
        ],
        history: [
          ...(formData.history || []),
          { action: 'Submitted for Approval', by: formData.hiringManager, date: new Date().toISOString() }
        ]
      };

      saveToSessionStorage(submittedReq);
      if (onSaveRequisition) onSaveRequisition(submittedReq);
      sessionStorage.removeItem('pw_req_edit');
      addToast({ title: 'Requisition Submitted', message: `${reqId} submitted for Department Head sign-off.`, type: 'success' });
      setIsSaving(false);
      if (onNavigate) onNavigate('requisitions');
    }, 600);
  };

  // Standardized 36px enterprise form input class
  const inputClass = (field) =>
    `w-full h-9 px-3.5 rounded-xl border text-xs font-medium outline-none transition-colors duration-150 bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
      errors[field] 
        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
        : 'border-slate-200 dark:border-slate-700/80 focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-2xs'
    }`;

  const selectClass = (field) =>
    `w-full h-9 px-3.5 rounded-xl border text-xs font-medium outline-none transition-colors duration-150 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer ${
      errors[field] 
        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
        : 'border-slate-200 dark:border-slate-700/80 focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-2xs'
    }`;

  const labelClass = "text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1";

  const ErrMsg = ({ field }) => 
    errors[field] ? (
      <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
        <AlertCircle size={12} /> {errors[field]}
      </span>
    ) : null;

  const completionPct = Math.round(((5 - Math.min(missingValidationsCount, 5)) / 5) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-[1600px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-5 [transform:translateZ(0)]"
    >
      
      {/* Layer 1: Ultra-Clean Glassmorphism Header Bar */}
      <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4.5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Create Enterprise Requisition</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {formData.id}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { sessionStorage.removeItem('pw_req_edit'); onNavigate && onNavigate('requisitions'); }}
            className="h-9.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="h-9.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/70 hover:bg-white border border-slate-200/60 dark:border-slate-700 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <Save size={14} style={{ color: brandColor }} /> Save Draft
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              backgroundColor: brandColor,
              boxShadow: `0 4px 16px ${brandColor}35`
            }}
            className="h-9.5 px-5 text-xs font-extrabold text-white hover:brightness-110 rounded-xl border border-white/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send size={14} strokeWidth={2.5} /> Submit Requisition
          </motion.button>
        </div>
      </div>

      {/* Layer 2: Glassmorphism Step Navigator */}
      <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="flex sm:grid sm:grid-cols-5 gap-2.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
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
                <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{step.title}</div>
                <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{step.subtitle}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Layer 3: Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form (8 Cols) */}
        <div className="lg:col-span-8 bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
          
          {/* STEP 0: Business Need */}
          {currentStep === 0 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={14} style={{ color: brandColor }} /> Section 1: Business Need & Position Origin
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Specify whether this request is a new headcount expansion or replacement backfill.</p>
              </div>

              {/* Auto-Generated System Requisition ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Requisition ID <span className="text-slate-400 font-normal ml-1">(System Assigned)</span></label>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Lock size={10} /> Auto-Generated & Locked
                  </span>
                </div>
                <input 
                  type="text" 
                  readOnly
                  value={formData.id || 'REQ-2026-AUTO'} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 text-xs font-mono font-extrabold text-slate-700 dark:text-slate-200 cursor-not-allowed select-none"
                />
              </div>

              {/* Hire Type Options Cards */}
              <div>
                <label className={labelClass}>Position Origin <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                  <label 
                    style={formData.hireType === 'New Position' ? {
                      borderColor: brandColor,
                      backgroundColor: `${brandColor}10`,
                      boxShadow: `0 0 0 3px ${brandColor}20`
                    } : {}}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                      formData.hireType === 'New Position' 
                        ? 'shadow-sm font-bold' 
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="hireType" 
                      value="New Position" 
                      checked={formData.hireType === 'New Position'} 
                      onChange={(e) => update('hireType', e.target.value)} 
                      style={{ accentColor: brandColor }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">New Expansion Headcount</div>
                      <div className="text-[11px] text-slate-500 font-medium">Approved business growth position</div>
                    </div>
                  </label>

                  <label className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                    formData.hireType === 'Replacement' 
                      ? 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500 ring-4 ring-amber-500/10 text-amber-900 dark:text-amber-200 shadow-sm font-bold' 
                      : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-slate-300'
                  }`}>
                    <input 
                      type="radio" 
                      name="hireType" 
                      value="Replacement" 
                      checked={formData.hireType === 'Replacement'} 
                      onChange={(e) => update('hireType', e.target.value)} 
                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">Replacement / Backfill</div>
                      <div className="text-[11px] text-slate-500 font-medium">Replacing an existing employee departure</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Replacement Fields */}
              {formData.hireType === 'Replacement' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <UserCheck size={14} /> Replacement / Backfill Specifics
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Employee Being Replaced <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                      <PeoplePicker 
                        value={formData.previousEmployee} 
                        onChange={(val) => update('previousEmployee', val)}
                        placeholder="Search employee..."
                      />
                      <ErrMsg field="previousEmployee" />
                    </div>
                    <div>
                      <label className={labelClass}>Replacement Reason <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                      <CustomSelect 
                        value={formData.separationReason} 
                        onChange={(val) => update('separationReason', val)}
                        options={[
                          { label: 'Resignation / Attrition', value: 'Resignation' },
                          { label: 'Internal Transfer', value: 'Internal Transfer' },
                          { label: 'Promotion Backfill', value: 'Promotion' },
                          { label: 'Termination', value: 'Termination' }
                        ]}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Expected Last Working Date</label>
                      <input 
                        type="date" 
                        value={formData.expectedLastWorkingDate} 
                        onChange={(e) => update('expectedLastWorkingDate', e.target.value)}
                        className={inputClass('expectedLastWorkingDate')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Organizational Structure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Business Unit <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <SearchableSelect 
                    value={formData.businessUnit} 
                    onChange={(val) => update('businessUnit', val)}
                    searchPlaceholder="Search business unit..."
                    options={[
                      { label: 'Cloud & AI Platform', value: 'Cloud & AI Platform', subtext: 'Infrastructure & AI Services' },
                      { label: 'Enterprise SaaS', value: 'Enterprise SaaS', subtext: 'B2B Software Suite' },
                      { label: 'Global Product Operations', value: 'Global Product Operations', subtext: 'Operations & Strategy' },
                      { label: 'Financial Services', value: 'Financial Services', subtext: 'Fintech & Payments' },
                      { label: 'Data & Analytics', value: 'Data & Analytics', subtext: 'BI & Machine Learning' },
                      { label: 'Cybersecurity Solutions', value: 'Cybersecurity Solutions', subtext: 'SecOps & Compliance' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Department <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <SearchableSelect 
                    value={formData.department} 
                    onChange={(val) => update('department', val)}
                    searchPlaceholder="Search department..."
                    options={[
                      { label: 'Engineering', value: 'Engineering' },
                      { label: 'Design & UX', value: 'Design' },
                      { label: 'Product Management', value: 'Product' },
                      { label: 'Sales & Business Dev', value: 'Sales' },
                      { label: 'Marketing', value: 'Marketing' },
                      { label: 'Human Resources', value: 'HR' },
                      { label: 'Finance & Accounting', value: 'Finance' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Sub-Team / Division</label>
                  <SearchableSelect 
                    value={formData.subTeam} 
                    onChange={(val) => update('subTeam', val)}
                    searchPlaceholder="Search sub-team..."
                    options={[
                      { label: 'Core Infrastructure', value: 'Core Infrastructure' },
                      { label: 'Frontend Applications', value: 'Frontend Applications' },
                      { label: 'AI & Data Intelligence', value: 'AI & Data Intelligence' },
                      { label: 'Mobile Engineering', value: 'Mobile Engineering' },
                      { label: 'Security & Compliance', value: 'Security & Compliance' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Job Grade / Banding</label>
                  <CustomSelect 
                    value={formData.jobGrade} 
                    onChange={(val) => update('jobGrade', val)}
                    options={[
                      { label: 'L1 - Entry / Trainee', value: 'L1 - Entry / Trainee' },
                      { label: 'L2 - Junior Professional', value: 'L2 - Junior Professional' },
                      { label: 'L3 - Mid-Level Specialist', value: 'L3 - Mid-Level Specialist' },
                      { label: 'L4 - Senior Engineer / Specialist', value: 'L4 - Senior Engineer' },
                      { label: 'L5 - Staff / Lead Manager', value: 'L5 - Staff / Lead' },
                      { label: 'L6 - Principal Architect', value: 'L6 - Principal Architect' },
                      { label: 'L7 - Executive Director / VP', value: 'L7 - Executive Director' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Primary Work Location <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <SearchableSelect 
                    value={formData.location} 
                    onChange={(val) => update('location', val)}
                    searchPlaceholder="Search location city..."
                    options={[
                      { label: 'Remote (Anywhere)', value: 'Remote', subtext: 'Global Work' },
                      { label: 'Bangalore, India', value: 'Bangalore', subtext: 'Tech Hub Office' },
                      { label: 'Chennai, India', value: 'Chennai', subtext: 'Development Center' },
                      { label: 'New York, USA', value: 'New York', subtext: 'US HQ Office' },
                      { label: 'London, UK', value: 'London', subtext: 'EMEA Office' },
                      { label: 'Singapore', value: 'Singapore', subtext: 'APAC Office' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Country Location</label>
                  <SearchableSelect 
                    value={formData.country} 
                    onChange={(val) => update('country', val)}
                    searchPlaceholder="Search country..."
                    options={[
                      { label: 'India', value: 'India' },
                      { label: 'United States', value: 'United States' },
                      { label: 'United Kingdom', value: 'United Kingdom' },
                      { label: 'Singapore', value: 'Singapore' },
                      { label: 'United Arab Emirates', value: 'United Arab Emirates' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Hiring Urgency / Priority</label>
                  <CustomSelect 
                    value={formData.hiringPriority} 
                    onChange={(val) => update('hiringPriority', val)}
                    options={[
                      { label: 'Low Priority', value: 'Low' },
                      { label: 'Medium Priority', value: 'Medium' },
                      { label: 'High Priority', value: 'High' },
                      { label: 'Urgent Backfill (SLA < 24h)', value: 'Urgent' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Requesting Hiring Manager <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <PeoplePicker 
                    value={formData.hiringManager} 
                    onChange={(val) => update('hiringManager', val)}
                    placeholder="Search manager..."
                  />
                </div>

                <div>
                  <label className={labelClass}>Assigned Recruiter / HRBP</label>
                  <PeoplePicker 
                    value={formData.recruiter} 
                    onChange={(val) => update('recruiter', val)}
                    placeholder="Search recruiter..."
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Business Justification Rationale</label>
                <textarea 
                  rows={2}
                  value={formData.justificationNote} 
                  onChange={(e) => update('justificationNote', e.target.value)}
                  placeholder="State project goals, team coverage, or revenue targets justifying this headcount..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 1: Job Details */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Section 2: Job Specifications & Requirements
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Define job title, classification, target start date, and candidate skill requirements.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowJdPickerModal(true)}
                  style={{ backgroundColor: brandColor }}
                  className="px-3.5 py-2 text-xs font-extrabold text-white rounded-xl flex items-center gap-2 shadow-md hover:brightness-110 transition-all cursor-pointer shrink-0 active:scale-95 border border-white/20"
                >
                  <FileText size={14} />
                  <span>Import from Approved JD</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Job Title <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input 
                    type="text" 
                    value={formData.jobTitle} 
                    onChange={(e) => update('jobTitle', e.target.value)}
                    placeholder="e.g. Senior React Developer"
                    className={inputClass('jobTitle')}
                  />
                  <ErrMsg field="jobTitle" />
                </div>

                <div>
                  <label className={labelClass}>Job Family</label>
                  <SearchableSelect 
                    value={formData.jobFamily} 
                    onChange={(val) => update('jobFamily', val)}
                    searchPlaceholder="Search job family..."
                    options={[
                      { label: 'Software Engineering', value: 'Software Engineering' },
                      { label: 'Data & Machine Learning', value: 'Data & Machine Learning' },
                      { label: 'Cloud Infrastructure & DevOps', value: 'Cloud Infrastructure & DevOps' },
                      { label: 'Product Management', value: 'Product Management' },
                      { label: 'UI/UX Product Design', value: 'UI/UX Product Design' },
                      { label: 'Sales & Customer Success', value: 'Sales & Customer Success' },
                      { label: 'Corporate HR & Talent', value: 'Corporate HR & Talent' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Requested Vacancies / Headcount <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.headcount} 
                    onChange={(e) => update('headcount', e.target.value)}
                    className={inputClass('headcount')}
                  />
                  <ErrMsg field="headcount" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Employment Type <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <CustomSelect 
                    value={formData.employmentType} 
                    onChange={(val) => update('employmentType', val)}
                    options={[
                      { label: 'Permanent / Full-Time', value: 'Full-Time' },
                      { label: 'Contract / Fixed-Term', value: 'Contract' },
                      { label: 'Consultant / Advisor', value: 'Consultant' },
                      { label: 'Part-Time', value: 'Part-Time' },
                      { label: 'Internship / Trainee', value: 'Internship' },
                      { label: 'Freelance / Vendor', value: 'Freelance' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Workplace Mode <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <CustomSelect 
                    value={formData.workMode} 
                    onChange={(val) => update('workMode', val)}
                    options={[
                      { label: 'Full Remote', value: 'Remote' },
                      { label: 'Hybrid (Office + Remote)', value: 'Hybrid' },
                      { label: 'On-Site (Office)', value: 'On-Site' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Experience Level</label>
                  <CustomSelect 
                    value={formData.experience} 
                    onChange={(val) => update('experience', val)}
                    options={[
                      { label: 'Entry Level (0-2 yrs)', value: 'Entry Level (0-2 yrs)' },
                      { label: 'Mid-Level (3-5 yrs)', value: 'Mid-Level (3-5 yrs)' },
                      { label: 'Senior (5-8 yrs)', value: 'Senior (5-8 yrs)' },
                      { label: 'Lead / Principal (8+ yrs)', value: 'Lead (8+ yrs)' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Notice Period Requirement</label>
                  <CustomSelect 
                    value={formData.noticePeriod} 
                    onChange={(val) => update('noticePeriod', val)}
                    options={[
                      { label: 'Immediate / < 15 Days', value: 'Immediate' },
                      { label: '30 Days Standard', value: '30 Days' },
                      { label: '60 Days', value: '60 Days' },
                      { label: '90 Days (Executive)', value: '90 Days' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Travel Requirement</label>
                  <CustomSelect 
                    value={formData.travelRequirement} 
                    onChange={(val) => update('travelRequirement', val)}
                    options={[
                      { label: 'No Travel Required', value: 'No Travel Required' },
                      { label: '10-25% Domestic Travel', value: '10-25% Domestic Travel' },
                      { label: '25-50% International Travel', value: '25-50% International Travel' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Target Hire Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    max="2030-12-31"
                    value={formData.targetHireDate} 
                    onChange={(e) => update('targetHireDate', e.target.value)}
                    className={inputClass('targetHireDate')}
                  />
                  <ErrMsg field="targetHireDate" />
                </div>
              </div>

              {/* Skills Multi-select Tagging */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Required Candidate Skills <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <SearchableMultiSelect 
                    value={formData.skills}
                    onChange={(val) => update('skills', val)}
                    placeholder="Search and select required skills..."
                    options={[
                      'React', 'TypeScript', 'Node.js', 'Next.js', 'Python', 'Java', 'Go', 
                      'GraphQL', 'REST APIs', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Tailwind CSS'
                    ]}
                  />
                  <ErrMsg field="skills" />
                </div>

                <div>
                  <label className={labelClass}>Preferred / Bonus Skills</label>
                  <SearchableMultiSelect 
                    value={formData.preferredSkills}
                    onChange={(val) => update('preferredSkills', val)}
                    placeholder="Search and select preferred skills..."
                    options={[
                      'GraphQL', 'Tailwind CSS', 'Docker', 'System Design', 'CI/CD Pipelines', 'Figma', 'Redis', 'Kafka'
                    ]}
                  />
                </div>
              </div>

              {/* Education & Certifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Education Requirement</label>
                  <CustomSelect 
                    value={formData.education} 
                    onChange={(val) => update('education', val)}
                    options={[
                      { label: "Bachelor's Degree", value: "Bachelor's Degree" },
                      { label: "Master's / Post Graduate", value: "Master's Degree" },
                      { label: 'Doctorate / PhD', value: 'Doctorate' },
                      { label: 'Diploma / Certification', value: 'Diploma' },
                      { label: 'Any Qualification', value: 'Any Qualification' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Certifications Required</label>
                  <SearchableMultiSelect 
                    value={formData.certifications}
                    onChange={(val) => update('certifications', val)}
                    placeholder="Search or add certifications..."
                    options={[
                      'AWS Certified Solutions Architect', 'Google Cloud Engineer', 'Certified Kubernetes Administrator', 'PMP', 'Scrum Master'
                    ]}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Job Summary & Duties <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <button 
                    type="button"
                    onClick={handleAutoGenerateAI}
                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <FileText size={11} /> Auto-Generate Specs
                  </button>
                </div>
                <textarea 
                  rows={4}
                  value={formData.description} 
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Describe key responsibilities, deliverables, and team impact..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-slate-900 dark:text-white resize-none"
                />
                <ErrMsg field="description" />
              </div>
            </div>
          )}

          {/* STEP 2: Budget & Compensation */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Section 3: Financial Budget & Salary Banding
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Assign finance cost center, budget type, compensation range, and bonus structure.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Currency Code</label>
                  <CustomSelect 
                    value={formData.currency} 
                    onChange={(val) => update('currency', val)}
                    options={[
                      { label: 'INR - Indian Rupee (₹)', value: 'INR' },
                      { label: 'USD - US Dollar ($)', value: 'USD' },
                      { label: 'EUR - Euro (€)', value: 'EUR' },
                      { label: 'GBP - British Pound (£)', value: 'GBP' },
                      { label: 'SGD - Singapore Dollar (S$)', value: 'SGD' },
                      { label: 'AED - UAE Dirham', value: 'AED' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Pay Frequency / Model</label>
                  <CustomSelect 
                    value={formData.payFrequency} 
                    onChange={(val) => update('payFrequency', val)}
                    options={[
                      { label: 'Annual CTC (Per Annum)', value: 'Annual CTC' },
                      { label: 'Monthly Salary (Per Month)', value: 'Monthly Salary' },
                      { label: 'Daily Rate (Consultant / Contractor)', value: 'Daily Rate' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Budget Approval Status</label>
                  <CustomSelect 
                    value={formData.budgetType} 
                    onChange={(val) => update('budgetType', val)}
                    options={[
                      { label: 'Approved Budget (Annual Plan)', value: 'Approved Budget' },
                      { label: 'New Expansion Budget Request', value: 'New Expansion Budget' },
                      { label: 'Incremental Exception Request', value: 'Incremental Exception' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Minimum Salary / CTC ({getCurrencySymbol(formData.currency)}) <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input 
                    type="text" 
                    value={formData.minSalary ? formatAmountLocale(formData.minSalary, formData.currency) : ''} 
                    onChange={(e) => {
                      const rawDigits = e.target.value.replace(/\D/g, '');
                      update('minSalary', rawDigits);
                    }}
                    placeholder={formData.currency === 'INR' ? "e.g. 2,50,000" : "e.g. 95,000"}
                    className={inputClass('minSalary')}
                  />
                  {formData.minSalary && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                      Equivalent: {getIndianLakhsHelper(formData.minSalary, formData.currency)}
                    </span>
                  )}
                  <ErrMsg field="minSalary" />
                </div>

                <div>
                  <label className={labelClass}>Maximum Salary / CTC ({getCurrencySymbol(formData.currency)}) <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input 
                    type="text" 
                    value={formData.maxSalary ? formatAmountLocale(formData.maxSalary, formData.currency) : ''} 
                    onChange={(e) => {
                      const rawDigits = e.target.value.replace(/\D/g, '');
                      update('maxSalary', rawDigits);
                    }}
                    placeholder={formData.currency === 'INR' ? "e.g. 18,00,000" : "e.g. 1,40,000"}
                    className={inputClass('maxSalary')}
                  />
                  {formData.maxSalary && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                      Equivalent: {getIndianLakhsHelper(formData.maxSalary, formData.currency)}
                    </span>
                  )}
                  <ErrMsg field="maxSalary" />
                </div>
              </div>

              {/* Salary & Budget Policy Validation Banner */}
              {formData.maxSalary && (
                (() => {
                  const maxVal = Number(formData.maxSalary);
                  const isINR = formData.currency === 'INR';
                  const threshold = isINR ? 3500000 : 180000;
                  const isExceeded = maxVal > threshold;

                  if (!isExceeded) return null;

                  return (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Salary Policy &amp; Budget Threshold Warning</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/90 pl-6">
                        The requested maximum salary of <strong>{getCurrencySymbol(formData.currency)}{maxVal.toLocaleString()}</strong> exceeds the standard budget threshold ({getCurrencySymbol(formData.currency)}{threshold.toLocaleString()}) for grade <strong>{formData.jobGrade}</strong> in {formData.department}. Executive Finance approval will be required.
                      </p>
                    </div>
                  );
                })()
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Finance Cost Center Code <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <SearchableSelect 
                    value={formData.costCenter} 
                    onChange={(val) => update('costCenter', val)}
                    searchPlaceholder="Search cost center..."
                    options={[
                      { label: 'CC-1024 - Core Engineering', value: 'CC-1024', subtext: 'Tech R&D Allocation' },
                      { label: 'CC-2048 - Design & Product', value: 'CC-2048', subtext: 'Product Operations' },
                      { label: 'CC-3090 - Data & AI Intelligence', value: 'CC-3090', subtext: 'AI Sandbox Budget' },
                      { label: 'CC-4010 - Global Sales & BizDev', value: 'CC-4010', subtext: 'Sales Org Budget' },
                      { label: 'CC-5000 - Executive & General HR', value: 'CC-5000', subtext: 'Corporate Ops' }
                    ]}
                  />
                  <ErrMsg field="costCenter" />
                </div>

                <div>
                  <label className={labelClass}>Incentive / Bonus Structure</label>
                  <CustomSelect 
                    value={formData.bonusStructure} 
                    onChange={(val) => update('bonusStructure', val)}
                    options={[
                      { label: 'Performance Bonus Included', value: 'Performance Bonus' },
                      { label: 'Fixed CTC Only (No Bonus)', value: 'Fixed CTC Only' },
                      { label: 'Sales Commission Plan', value: 'Sales Commission' },
                      { label: 'Includes ESOPs / Stock Grants', value: 'ESOPs / Stock Grants' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Equity, Stock Grants & Health Benefits</label>
                <input 
                  type="text" 
                  value={formData.equityBenefits} 
                  onChange={(e) => update('equityBenefits', e.target.value)}
                  placeholder="e.g. Comprehensive Health Insurance, 5,000 Stock Units, Learning Stipend"
                  className={inputClass('equityBenefits')}
                />
              </div>

              {formData.budgetType !== 'Approved Budget' && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                  <label className={labelClass}>Budget Exception Rationale / Justification</label>
                  <textarea 
                    rows={2}
                    value={formData.budgetJustification} 
                    onChange={(e) => update('budgetJustification', e.target.value)}
                    placeholder="Provide financial rationale for off-budget or unapproved headcount allocation..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-slate-900 dark:text-white resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Provisioning */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Section 4: IT Asset & Software Provisioning Catalog
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pre-allocate hardware workstations, software licenses, and access rights for Day-1 onboarding readiness.</p>
              </div>

              {/* Hardware Selection Catalog */}
              <div className="space-y-1.5">
                <label className={labelClass}>Workstation Hardware Catalog</label>
                <SearchableMultiSelect 
                  value={formData.hardwareList}
                  onChange={(val) => {
                    update('hardwareList', val);
                    update('hardware', val.join(', '));
                  }}
                  placeholder="Search and select hardware items..."
                  options={[
                    'MacBook Pro M3 (Apple Silicon)',
                    'Dell XPS 15 (Windows Workstation)',
                    'Lenovo ThinkPad P-Series',
                    'Dual 27" 4K Monitors',
                    'Noise-Canceling Wireless Headset',
                    'Mobile Test Device (iOS/Android)',
                    'Docking Station & Ergonomic Keyboard'
                  ]}
                />
              </div>

              {/* Software License Catalog */}
              <div className="space-y-1.5">
                <label className={labelClass}>Pre-Approved Software Licenses</label>
                <SearchableMultiSelect 
                  value={formData.softwareList}
                  onChange={(val) => {
                    update('softwareList', val);
                    update('software', val.join(', '));
                  }}
                  placeholder="Search and select software licenses..."
                  options={[
                    'Slack Enterprise',
                    'GitHub Copilot Enterprise',
                    'Figma Professional',
                    'Jira & Confluence',
                    'Salesforce CRM',
                    'SAP / Oracle ERP Access',
                    'AWS / GCP Dev Cloud Sandbox',
                    'Datadog / New Relic Monitoring'
                  ]}
                />
              </div>

              {/* Account & Access Provisioning Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className={labelClass}>Email / Enterprise M365 Suite</label>
                  <CustomSelect 
                    value={formData.emailLicense} 
                    onChange={(val) => update('emailLicense', val)}
                    options={[
                      { label: 'Microsoft 365 E5 (Developer & Voice)', value: 'Microsoft 365 E5' },
                      { label: 'Microsoft 365 E3 (Standard Enterprise)', value: 'Microsoft 365 E3' },
                      { label: 'Google Workspace Enterprise Plus', value: 'Google Workspace Enterprise' }
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Corporate Mobile Device</label>
                  <CustomSelect 
                    value={formData.mobileDevice} 
                    onChange={(val) => update('mobileDevice', val)}
                    options={[
                      { label: 'None (BYOD Policy)', value: 'None' },
                      { label: 'Corporate iPhone 15 Pro', value: 'iPhone 15 Pro' },
                      { label: 'Corporate Samsung S24 Ultra', value: 'Samsung S24' }
                    ]}
                  />
                </div>
              </div>

              {/* Access Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Secure VPN Access</div>
                    <div className="text-[10px] text-slate-400">Pre-configure Zero Trust VPN tunnel</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.vpnAccess} 
                    onChange={(e) => update('vpnAccess', e.target.checked)}
                    className="w-4 h-4 rounded accent-brand cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Security & Hardware MFA</div>
                    <div className="text-[10px] text-slate-400">YubiKey / Duo Security token</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.mfaSecurity} 
                    onChange={(e) => update('mfaSecurity', e.target.checked)}
                    className="w-4 h-4 rounded accent-brand cursor-pointer"
                  />
                </label>
              </div>

              <div>
                <label className={labelClass}>Special IT Provisioning Notes</label>
                <textarea 
                  rows={2}
                  value={formData.provisioningNotes} 
                  onChange={(e) => update('provisioningNotes', e.target.value)}
                  placeholder="Enter custom setup requests for IT Helpdesk onboarding..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Approvals & Review */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Section 5: Approval Routing & Documentation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review automated sign-off policy and attach supporting business case files.</p>
              </div>

              {/* Multi-Stage Routing Visualizer */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Automated Multi-Stage Sign-off Chain</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Stage 1: Initiator</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">{formData.hiringManager || 'Hiring Manager'}</div>
                    <div className="text-[10px] text-slate-500">Hiring Manager</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs">
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Stage 2: Department Head</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">VP of {formData.department || 'Department'}</div>
                    <div className="text-[10px] text-slate-500">L1 Headcount Sign-off</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Stage 3: Finance</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">{formData.costCenter || 'CC-1024'} Admin</div>
                    <div className="text-[10px] text-slate-500">L2 Budget Clearance</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
                    <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Stage 4: HRBP</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">{formData.recruiter || 'HR Lead'}</div>
                    <div className="text-[10px] text-slate-500">L3 Final Clearance</div>
                  </div>
                </div>
              </div>

              {/* Supporting Document Uploader */}
              <div>
                <label className={labelClass}>Business Case File Attachment</label>
                <div 
                  onClick={() => {
                    const sampleFiles = ['Business_Case_Headcount_FY26.pdf', 'Budget_Approval_Doc.pdf'];
                    const randomFile = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
                    if (!formData.attachments.includes(randomFile)) {
                      update('attachments', [...formData.attachments, randomFile]);
                      addToast({ title: 'File Attached', message: `Attached "${randomFile}" successfully.`, type: 'success' });
                    }
                  }}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <FileUp size={22} className="text-brand mb-1" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Click to Upload Financial Rationale / JD Draft (PDF/DOCX)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, XLSX (Max size: 10MB)</p>
                </div>

                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Attached Files ({formData.attachments.length})</span>
                    {formData.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <FileText size={14} className="text-blue-500" /> {file}
                        </span>
                        <button
                          type="button"
                          onClick={() => update('attachments', formData.attachments.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Button Bar */}
          <div className="flex items-center justify-between pt-4 pb-4 border-t border-slate-200 dark:border-slate-800 gap-2">
            <button 
              onClick={handleBack}
              disabled={currentStep === 0}
              className="h-10 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <ChevronLeft size={14} /> Back
            </button>

            {currentStep < WORKFLOW_STEPS.length - 1 ? (
              <button 
                onClick={handleNext}
                style={{ backgroundColor: brandColor }}
                className="h-10 px-5 rounded-xl text-white text-xs font-extrabold hover:brightness-110 transition-all flex items-center gap-1 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
              >
                Next Step <ChevronRight size={14} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSaving}
                style={{ backgroundColor: brandColor }}
                className="h-10 px-6 rounded-xl text-white text-xs font-extrabold hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Send size={14} /> Submit Requisition
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Persistent Sticky Progress Summary Panel (4 Cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-4">
          <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText size={15} style={{ color: brandColor }} /> Requisition Summary
              </span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                missingValidationsCount === 0 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}>
                {completionPct}% Complete
              </span>
            </div>

            {/* Validation Progress Indicator */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4 p-0.5 border border-slate-200/50 dark:border-slate-700/50">
              <div className="h-full rounded-full transition-all duration-300 shadow-xs" style={{ width: `${completionPct}%`, backgroundColor: brandColor }} />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-medium">Requisition ID:</span>
                <span className="font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px]">{formData.id || 'REQ-2026-DRAFT'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-medium">Job Title:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">{formData.jobTitle || 'Untitled Role'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-medium">Employment Type:</span>
                <span 
                  className="font-extrabold px-2 py-0.5 rounded-md text-[11px]"
                  style={{
                    backgroundColor: `${brandColor}15`,
                    color: brandColor
                  }}
                >
                  {formData.employmentType}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-medium">Workplace Mode:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.workMode}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-medium">Business Unit:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{formData.businessUnit}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.department}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-medium">Vacancies:</span>
                <span 
                  className="font-extrabold px-2 py-0.5 rounded-md text-[11px]"
                  style={{
                    backgroundColor: `${brandColor}15`,
                    color: brandColor
                  }}
                >
                  {formData.headcount} Openings
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-medium">Target Start:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">{formData.targetHireDate || 'Pending'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-medium">Salary Band ({formData.currency}):</span>
                <span className="font-extrabold text-slate-900 dark:text-white font-mono text-[11px]">
                  {formData.minSalary && formData.maxSalary 
                    ? `${getCurrencySymbol(formData.currency)}${Number(formData.minSalary).toLocaleString()} - ${getCurrencySymbol(formData.currency)}${Number(formData.maxSalary).toLocaleString()}`
                    : 'Unassigned'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-medium">Cost Center:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">{formData.costCenter || 'CC-XXXX'}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 font-medium">Missing Validations:</span>
                <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-[11px] border ${
                  missingValidationsCount === 0 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse'
                }`}>
                  {missingValidationsCount} Required Fields
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── APPROVED JD REPOSITORY PICKER MODAL ─────────────────────────── */}
      {showJdPickerModal && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir="ltr">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col font-sans"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
                <div className="flex items-center gap-2.5">
                  <div 
                    style={{ backgroundColor: `${brandColor}18`, color: brandColor }}
                    className="p-2 rounded-xl"
                  >
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Import from Approved JD Repository</h3>
                    <p className="text-xs text-slate-500">Select an approved job description template to auto-populate specifications.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowJdPickerModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    value={jdSearchQuery}
                    onChange={(e) => setJdSearchQuery(e.target.value)}
                    placeholder="Search by job title, department, or skills..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--pw-brand)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* JD List */}
              <div className="p-3 flex-1 overflow-y-auto space-y-2.5">
                {getAvailableJds()
                  .filter(jd => {
                    const q = jdSearchQuery.toLowerCase();
                    return !q || (jd.title && jd.title.toLowerCase().includes(q)) || (jd.department && jd.department.toLowerCase().includes(q)) || (jd.requiredSkills && jd.requiredSkills.toLowerCase().includes(q));
                  })
                  .map(jd => (
                    <div 
                      key={jd.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[var(--pw-brand)] transition-colors">
                            {jd.title}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {jd.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {jd.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {jd.summary}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-wrap pt-0.5">
                          <span>🏢 {jd.department}</span>
                          <span>💼 {jd.experienceMin}-{jd.experienceMax} yrs exp</span>
                          {jd.salaryMin && <span>💰 ${Number(jd.salaryMin).toLocaleString()} - ${Number(jd.salaryMax).toLocaleString()}</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportJd(jd)}
                        style={{ backgroundColor: brandColor }}
                        className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <Download size={13} />
                        <span>Import JD</span>
                      </button>
                    </div>
                  ))}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowJdPickerModal(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};

export default CreateRequisitionPage;
