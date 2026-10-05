import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Save, Send, AlertCircle, FileUp, 
  UserCheck, DollarSign, Building, Calendar, CheckCircle2, ShieldCheck, Briefcase, MapPin, Eye, Flame, Layers, Award, Tag, Laptop, ShieldAlert, Check, X, FileText, HelpCircle, Clock, Sparkles, Loader2, FileSpreadsheet, UploadCloud, Download, Lock, Unlock
} from 'lucide-react';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import { ThemeContext } from '../../../ThemeContext';
import { useToast } from '../../shared/ToastContext';
import { validateCostCenterMapping, evaluateWorkflowForJd, hasJdPermission } from './jdMockData';

const WORKFLOW_STEPS = [
  { id: 0, title: 'Basic Info', subtitle: 'Role & Workplace' },
  { id: 1, title: 'Job Description', subtitle: 'Skills & Notice Period' },
  { id: 2, title: 'Compensation', subtitle: 'Salary & Org Codes' },
  { id: 3, title: 'Approval Workflow', subtitle: 'Dynamic Sign-Off' }
];

export default function JDCreator({ onClose, onSave, initialData, isEditMode, userRole = 'recruiter', existingJDs = [], workflows = [] }) {
  const { addToast } = useToast();
  const { activeTheme } = React.useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';
  const [activeTab, setActiveTab] = useState(0); // 0: Basic Info, 1: Job Description, 2: Compensation, 3: Approval Workflow
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [creationMethod, setCreationMethod] = useState('form'); // 'form' | 'excel' | 'document'
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [extractedDocData, setExtractedDocData] = useState(null);
  const [excelUploaded, setExcelUploaded] = useState(false);

  // Requisition Field Inheritance Governance Controls
  const [isSalaryOverrideEnabled, setIsSalaryOverrideEnabled] = useState(false);
  const [isDeptOverrideEnabled, setIsDeptOverrideEnabled] = useState(false);
  const [reqBackupData, setReqBackupData] = useState(null);

  const resetSalaryToReq = () => {
    if (reqBackupData) {
      setFormData(prev => ({
        ...prev,
        salaryMin: reqBackupData.salaryMin,
        salaryMax: reqBackupData.salaryMax,
        currency: reqBackupData.currency,
        payFrequency: reqBackupData.payFrequency || prev.payFrequency
      }));
      setIsSalaryOverrideEnabled(false);
      addToast({ title: 'Salary Budget Restored', message: `Reverted salary fields to approved ${formData.reqId} budget.`, type: 'info' });
    }
  };

  const resetDeptToReq = () => {
    if (reqBackupData) {
      setFormData(prev => ({
        ...prev,
        department: reqBackupData.department
      }));
      setIsDeptOverrideEnabled(false);
      addToast({ title: 'Department Restored', message: `Reverted department to approved ${formData.reqId} structure.`, type: 'info' });
    }
  };

  const reqOptions = useMemo(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('pw_requisitions');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return [
              { label: '-- Select Linked Requisition --', value: '' },
              ...parsed.map(r => ({
                label: `${r.id} (${r.jobTitle || r.title || r.role || 'Requisition'})`,
                value: r.id
              }))
            ];
          }
        }
      }
    } catch (e) {}
    return [{ label: '-- Select Linked Requisition --', value: '' }];
  }, []);

  const [formData, setFormData] = useState({
    id: '',
    reqId: initialData?.reqId || '',
    jobCode: '',
    title: '',
    department: 'Engineering',
    businessUnit: 'Cloud & AI Platform',
    subTeam: 'Core Infrastructure',
    jobFamily: 'Software Engineering',
    jobSubFamily: 'Software Development',
    jobLevel: 'L4 - Senior Engineer',
    careerLevel: 'IC4 - Senior Specialist',
    jobCategory: 'Core Technology',
    positionType: 'Replacement',
    isCriticalRole: 'Yes',
    isLeadershipRole: 'No',
    employmentType: 'Full-Time',

    // Workplace Mode Logic
    workMode: 'Hybrid',
    location: 'Bangalore, India',
    officeLocation: 'Bangalore HQ Campus',
    officeDaysPerWeek: 3,
    remoteDaysPerWeek: 2,
    remoteLocation: 'India / Remote',
    timeZone: 'IST (UTC+5:30)',

    experienceMin: 3,
    experienceMax: 6,
    positions: 1,

    summary: 'We are seeking an experienced professional to join our team, lead core project deliverables, and drive technical excellence across key business initiatives.',
    responsibilities: '• Lead execution of primary role duties and deliverables.\n• Collaborate with cross-functional team partners.\n• Enforce quality standards and operational best practices.',
    requiredSkills: 'Domain Expertise, Problem Solving, Technical Strategy, Team Collaboration',
    preferredSkills: 'Cloud Technologies, System Architecture, Agile Frameworks',
    qualifications: "Bachelor's Degree",
    technicalSkills: 'Technical Strategy, Problem Solving',
    softSkills: 'Team Leadership, Collaboration',

    // Notice Period Parameters
    noticePeriod: '30 Days',
    maxNoticePeriod: '60 Days',
    preferredNoticePeriod: '30 Days',
    immediateJoinerAccepted: 'Yes',
    buyoutAllowed: 'Yes',

    salaryMin: 1200000,
    salaryMax: 1800000,
    currency: 'INR',
    payFrequency: 'Annual CTC',
    bonusStructure: 'Performance Bonus',
    costCenter: 'CC-1024',
    variablePay: '15% Performance Bonus',
    benefits: 'Comprehensive Health Insurance, Learning Allowance',
    otherComp: 'Standard ESOP Package',

    // Structured Org Codes
    companyCode: 'COMP-100',
    businessUnitCode: 'BU-ENG',
    departmentCode: 'DEPT-ENG',
    jobFamilyCode: 'JF-SWE',
    gradeCode: 'GRADE-L4',
    locationCode: 'LOC-BLR',
    wpsCode: 'WPS-01'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        reqId: initialData.reqId || '',
        jobCode: initialData.jobCode || `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
        title: initialData.title || '',
        department: initialData.department || 'Engineering',
        businessUnit: initialData.businessUnit || 'Cloud & AI Platform',
        subTeam: initialData.subTeam || 'Core Infrastructure',
        jobFamily: initialData.jobFamily || 'Software Engineering',
        jobSubFamily: initialData.jobSubFamily || 'Software Development',
        jobLevel: initialData.jobLevel || 'L4 - Senior Engineer',
        careerLevel: initialData.careerLevel || 'IC4 - Senior Specialist',
        jobCategory: initialData.jobCategory || 'Core Technology',
        positionType: initialData.positionType || 'Replacement',
        isCriticalRole: initialData.isCriticalRole || 'Yes',
        isLeadershipRole: initialData.isLeadershipRole || 'No',
        employmentType: initialData.employmentType || 'Full-Time',

        workMode: initialData.workMode || 'Hybrid',
        location: initialData.location || 'Bangalore, India',
        officeLocation: initialData.officeLocation || 'Bangalore HQ Campus',
        officeDaysPerWeek: initialData.officeDaysPerWeek ?? 3,
        remoteDaysPerWeek: initialData.remoteDaysPerWeek ?? 2,
        remoteLocation: initialData.remoteLocation || 'India / Remote',
        timeZone: initialData.timeZone || 'IST (UTC+5:30)',

        experienceMin: initialData.experienceMin ?? 3,
        experienceMax: initialData.experienceMax ?? 6,
        positions: initialData.positions || 1,

        summary: initialData.summary || initialData.content || '',
        responsibilities: Array.isArray(initialData.responsibilities) ? initialData.responsibilities.join('\n') : (initialData.responsibilities || ''),
        requiredSkills: Array.isArray(initialData.requiredSkills) ? initialData.requiredSkills.join(', ') : (initialData.requiredSkills || ''),
        preferredSkills: Array.isArray(initialData.preferredSkills) ? initialData.preferredSkills.join(', ') : (initialData.preferredSkills || ''),
        qualifications: initialData.qualifications || "Bachelor's Degree",
        technicalSkills: Array.isArray(initialData.technicalSkills) ? initialData.technicalSkills.join(', ') : (initialData.technicalSkills || ''),
        softSkills: Array.isArray(initialData.softSkills) ? initialData.softSkills.join(', ') : (initialData.softSkills || ''),

        noticePeriod: initialData.noticePeriod || '30 Days',
        maxNoticePeriod: initialData.maxNoticePeriod || '60 Days',
        preferredNoticePeriod: initialData.preferredNoticePeriod || '30 Days',
        immediateJoinerAccepted: initialData.immediateJoinerAccepted || 'Yes',
        buyoutAllowed: initialData.buyoutAllowed || 'Yes',

        salaryMin: initialData.salaryMin ?? 1200000,
        salaryMax: initialData.salaryMax ?? 1800000,
        currency: initialData.currency || 'INR',
        payFrequency: initialData.payFrequency || 'Annual CTC',
        bonusStructure: initialData.bonusStructure || 'Performance Bonus',
        costCenter: initialData.costCenter || 'CC-1024',
        variablePay: initialData.variablePay || '',
        benefits: initialData.benefits || '',
        otherComp: initialData.otherComp || '',

        companyCode: initialData.companyCode || 'COMP-100',
        businessUnitCode: initialData.businessUnitCode || 'BU-ENG',
        departmentCode: initialData.departmentCode || 'DEPT-ENG',
        jobFamilyCode: initialData.jobFamilyCode || 'JF-SWE',
        gradeCode: initialData.gradeCode || 'GRADE-L4',
        locationCode: initialData.locationCode || 'LOC-BLR',
        wpsCode: initialData.wpsCode || 'WPS-01'
      });
    } else {
      setFormData(prev => ({
        ...prev,
        jobCode: `JOB-${Math.floor(1000 + Math.random() * 9000)}`
      }));
    }
  }, [initialData]);

  // Check for Duplicate JD (Job Title + Department)
  const checkForDuplicates = (title, dept) => {
    if (!title) return;
    const isDup = existingJDs.some(jd => 
      jd.id !== formData.id &&
      jd.title.toLowerCase().trim() === title.toLowerCase().trim() &&
      jd.department.toLowerCase().trim() === dept.toLowerCase().trim()
    );

    if (isDup) {
      setDuplicateWarning(`Warning: An existing JD already exists for "${title}" in "${dept}". Consider updating title or department.`);
    } else {
      setDuplicateWarning('');
    }
  };

  const updateField = (field, val) => {
    setFormData(prev => {
      let next = { ...prev, [field]: val };
      if (field === 'reqId' && val) {
        try {
          const stored = sessionStorage.getItem('pw_requisitions');
          if (stored) {
            const parsed = JSON.parse(stored);
            const req = Array.isArray(parsed) ? parsed.find(r => r.id === val) : null;
            if (req) {
              const backup = {
                title: req.jobTitle || req.title || req.role || next.title,
                department: req.department || req.dept || next.department,
                salaryMin: req.minSalary ?? req.salaryMin ?? next.salaryMin,
                salaryMax: req.maxSalary ?? req.salaryMax ?? next.salaryMax,
                currency: req.currency || next.currency,
                costCenter: req.costCenter || req.costCenterCode || next.costCenter,
                location: req.workLocation || req.location || next.location,
                positions: req.headcount || req.openings || req.positions || next.positions,
                companyCode: req.companyCode || 'COMP-100',
                businessUnitCode: req.businessUnitCode || 'BU-ENG',
                departmentCode: req.departmentCode || 'DEPT-ENG',
                wpsCode: req.wpsCode || 'WPS-01'
              };
              setReqBackupData(backup);
              setIsSalaryOverrideEnabled(false);
              setIsDeptOverrideEnabled(false);
              next = {
                ...next,
                ...backup
              };
              addToast({ title: 'Requisition Data Linked', message: `Inherited approved budget & structure from ${val}.`, type: 'success' });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (field === 'title' || field === 'department') {
        checkForDuplicates(next.title, next.department);
      }
      return next;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Evaluate dynamic workflow resolution
  const resolvedWorkflowResult = useMemo(() => {
    return evaluateWorkflowForJd(formData, workflows);
  }, [formData, workflows]);

  // Step Validation Logic
  const validateStep = (stepIdx) => {
    const errs = {};

    if (stepIdx === 0) {
      if (!formData.reqId || !formData.reqId.trim()) {
        errs.reqId = 'Please select an approved Linked Requisition';
      }
      if (!formData.title.trim() || formData.title.trim().length < 3) {
        errs.title = 'Job Title must be at least 3 characters';
      }
      if (!formData.jobCode.trim()) {
        errs.jobCode = 'Job Code is required';
      }
      if (!formData.department) {
        errs.department = 'Department is required';
      }
      if (!formData.businessUnit) {
        errs.businessUnit = 'Business Unit is required';
      }

      // Workplace Mode Specific Validations
      if (formData.workMode === 'On-Site') {
        if (!formData.location || !formData.location.trim()) {
          errs.location = 'Work Location is required for On-Site roles';
        }
      } else if (formData.workMode === 'Hybrid') {
        if (!formData.location || !formData.location.trim()) {
          errs.location = 'Office Location is required for Hybrid roles';
        }
        if (!formData.officeDaysPerWeek || Number(formData.officeDaysPerWeek) < 1) {
          errs.officeDaysPerWeek = 'Office days must be at least 1 day/wk';
        }
      } else if (formData.workMode === 'Remote') {
        if (!formData.remoteLocation || !formData.remoteLocation.trim()) {
          errs.remoteLocation = 'Remote Country / Location is required';
        }
        if (!formData.timeZone || !formData.timeZone.trim()) {
          errs.timeZone = 'Applicable Time Zone is required';
        }
      }

      if (!formData.positions || Number(formData.positions) < 1) {
        errs.positions = 'Vacancies must be at least 1';
      }
      if (Number(formData.experienceMin) < 0) {
        errs.experienceMin = 'Min Experience cannot be negative';
      }
      if (Number(formData.experienceMax) < Number(formData.experienceMin)) {
        errs.experienceMax = 'Max Exp must be ≥ Min Exp';
      }
    } else if (stepIdx === 1) {
      if (!formData.summary.trim() || formData.summary.trim().length < 10) {
        errs.summary = 'Job Summary is required (min 10 chars)';
      }
      if (!formData.responsibilities.trim()) {
        errs.responsibilities = 'Key Responsibilities are required';
      }
      if (!formData.requiredSkills.trim()) {
        errs.requiredSkills = 'Required skills are required';
      }
    } else if (stepIdx === 2) {
      if (!formData.salaryMin || Number(formData.salaryMin) <= 0) {
        errs.salaryMin = 'Min salary must be greater than 0';
      }
      if (!formData.salaryMax || Number(formData.salaryMax) <= 0) {
        errs.salaryMax = 'Max salary must be greater than 0';
      }
      if (Number(formData.salaryMax) < Number(formData.salaryMin)) {
        errs.salaryMax = 'Max salary must be ≥ Min salary';
      }
      if (!formData.costCenter || !formData.costCenter.trim() || !formData.costCenter.startsWith('CC-')) {
        errs.costCenter = 'Cost center format must be CC-XXXX';
      } else if (!validateCostCenterMapping(formData.department, formData.costCenter)) {
        errs.costCenter = 'Selected Cost Center is not mapped to the selected Department.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAllForm = () => {
    let valid = true;
    for (let i = 0; i <= 2; i++) {
      if (!validateStep(i)) {
        valid = false;
        setActiveTab(i);
        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      }
    }
    return valid;
  };

  // Compute Missing Required Fields Counter
  const missingValidationsCount = useMemo(() => {
    let count = 0;
    if (!formData.title.trim() || formData.title.trim().length < 3) count++;
    if (!formData.jobCode.trim()) count++;
    if (!formData.department) count++;
    if (!formData.businessUnit) count++;
    if (formData.workMode === 'On-Site' || formData.workMode === 'Hybrid') {
      if (!formData.location || !formData.location.trim()) count++;
    }
    if (formData.workMode === 'Remote') {
      if (!formData.remoteLocation || !formData.remoteLocation.trim()) count++;
    }
    if (!formData.positions || Number(formData.positions) < 1) count++;
    if (Number(formData.experienceMax) < Number(formData.experienceMin)) count++;
    if (!formData.summary.trim() || formData.summary.trim().length < 10) count++;
    if (!formData.responsibilities.trim()) count++;
    if (!formData.requiredSkills.trim()) count++;
    if (!formData.salaryMin || Number(formData.salaryMin) <= 0) count++;
    if (!formData.salaryMax || Number(formData.salaryMax) < Number(formData.salaryMin)) count++;
    if (!formData.costCenter || !formData.costCenter.trim() || !formData.costCenter.startsWith('CC-') || !validateCostCenterMapping(formData.department, formData.costCenter)) count++;
    return count;
  }, [formData]);

  const handleNextStep = () => {
    if (validateStep(activeTab)) {
      setActiveTab(prev => Math.min(prev + 1, WORKFLOW_STEPS.length - 1));
    } else {
      addToast({
        title: 'Validation Alert',
        message: 'Please fill required fields.',
        type: 'warning'
      });
    }
  };

  const handleStepClick = (targetStep) => {
    if (targetStep < activeTab) {
      setActiveTab(targetStep);
    } else if (targetStep > activeTab) {
      if (validateStep(activeTab)) {
        setActiveTab(targetStep);
      } else {
        addToast({
          title: 'Validation Alert',
          message: 'Please fill required fields.',
          type: 'warning'
        });
      }
    }
  };

  const persistJdToSession = (jdToSave, statusStr, workflowSnapshotData) => {
    try {
      const stored = sessionStorage.getItem('pw_jds');
      let currentList = [];
      if (stored) {
        currentList = JSON.parse(stored);
      }
      const fullJd = {
        ...jdToSave,
        id: jdToSave.id || `JD-2026-${Math.floor(100 + Math.random() * 900)}`,
        status: statusStr || 'Published',
        workflowSnapshot: workflowSnapshotData || jdToSave.workflowSnapshot,
        createdDate: jdToSave.createdDate || new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0]
      };
      const existingIdx = currentList.findIndex(j => j.id === fullJd.id);
      let updated;
      if (existingIdx >= 0) {
        updated = [...currentList];
        updated[existingIdx] = fullJd;
      } else {
        updated = [fullJd, ...currentList];
      }
      sessionStorage.setItem('pw_jds', JSON.stringify(updated));
      return fullJd;
    } catch (e) {
      console.error(e);
      return jdToSave;
    }
  };

  const handleSaveDraft = () => {
    if (!formData.title.trim()) {
      setErrors({ title: 'Job Title is required' });
      setActiveTab(0);
      addToast({
        title: 'Draft Alert',
        message: 'Please enter a Job Title to save draft.',
        type: 'warning'
      });
      return;
    }
    const savedJd = persistJdToSession(formData, 'Draft');
    onSave(savedJd, 'Draft');
    addToast({
      title: 'Draft Saved',
      message: `JD "${savedJd.title}" saved as Draft.`,
      type: 'info'
    });
    if (onClose) onClose();
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateFormDetailed = () => {
    const fieldErrors = {};
    const missingLabels = [];

    // Step 0: Basic Info & Workplace
    if (!formData.title || !formData.title.trim()) {
      fieldErrors.title = 'Job Title is required';
      missingLabels.push('Job Title');
    }
    if (!formData.jobCode || !formData.jobCode.trim()) {
      fieldErrors.jobCode = 'Job Code is required';
      missingLabels.push('Job Code');
    }
    if (!formData.department) {
      fieldErrors.department = 'Department is required';
      missingLabels.push('Department');
    }
    if (!formData.businessUnit) {
      fieldErrors.businessUnit = 'Business Unit is required';
      missingLabels.push('Business Unit');
    }

    if (formData.workMode === 'On-Site' || formData.workMode === 'Hybrid') {
      if (!formData.location || !formData.location.trim()) {
        fieldErrors.location = 'Work Location is required';
        missingLabels.push('Work Location');
      }
    }
    if (formData.workMode === 'Remote') {
      if (!formData.remoteLocation || !formData.remoteLocation.trim()) {
        fieldErrors.remoteLocation = 'Remote Location is required';
        missingLabels.push('Remote Location');
      }
      if (!formData.timeZone || !formData.timeZone.trim()) {
        fieldErrors.timeZone = 'Applicable Time Zone is required';
        missingLabels.push('Time Zone');
      }
    }

    if (!formData.positions || Number(formData.positions) < 1) {
      fieldErrors.positions = 'Vacancies must be at least 1';
      missingLabels.push('Vacancies');
    }
    if (Number(formData.experienceMin) < 0) {
      fieldErrors.experienceMin = 'Min Experience cannot be negative';
      missingLabels.push('Min Experience');
    }
    if (Number(formData.experienceMax) < Number(formData.experienceMin)) {
      fieldErrors.experienceMax = 'Max Exp must be ≥ Min Exp';
      missingLabels.push('Max Experience');
    }

    // Step 1: Content
    if (!formData.summary || !formData.summary.trim()) {
      fieldErrors.summary = 'Job Summary is required';
      missingLabels.push('Job Summary');
    }
    if (!formData.responsibilities || !formData.responsibilities.trim()) {
      fieldErrors.responsibilities = 'Responsibilities are required';
      missingLabels.push('Responsibilities');
    }
    if (!formData.requiredSkills || !formData.requiredSkills.trim()) {
      fieldErrors.requiredSkills = 'Required Skills are required';
      missingLabels.push('Required Skills');
    }

    // Step 2: Compensation
    if (formData.salaryMin && Number(formData.salaryMin) <= 0) {
      fieldErrors.salaryMin = 'Min salary must be greater than 0';
      missingLabels.push('Min Salary');
    }
    if (formData.salaryMax && Number(formData.salaryMax) <= 0) {
      fieldErrors.salaryMax = 'Max salary must be greater than 0';
      missingLabels.push('Max Salary');
    }
    if (formData.salaryMin && formData.salaryMax && Number(formData.salaryMax) < Number(formData.salaryMin)) {
      fieldErrors.salaryMax = 'Max salary must be ≥ Min salary';
      missingLabels.push('Salary Range');
    }
    if (formData.costCenter && formData.costCenter.trim()) {
      if (!formData.costCenter.startsWith('CC-')) {
        fieldErrors.costCenter = 'Cost center format must be CC-XXXX';
        missingLabels.push('Cost Center Format');
      } else if (!validateCostCenterMapping(formData.department, formData.costCenter)) {
        fieldErrors.costCenter = 'Selected Cost Center is not mapped to the selected Department.';
        missingLabels.push('Cost Center Mapping');
      }
    }

    return { valid: missingLabels.length === 0, errors: fieldErrors, missingLabels };
  };

  const handleSubmitForReview = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 2. Validate form
      const valResult = validateFormDetailed();
      if (!valResult.valid) {
        setErrors(valResult.errors);

        // Switch active tab to the step containing the first invalid field
        const errKeys = Object.keys(valResult.errors);
        if (errKeys.some(k => ['title', 'jobCode', 'department', 'businessUnit', 'location', 'remoteLocation', 'timeZone', 'positions', 'experienceMin', 'experienceMax'].includes(k))) {
          setActiveTab(0);
        } else if (errKeys.some(k => ['summary', 'responsibilities', 'requiredSkills'].includes(k))) {
          setActiveTab(1);
        } else if (errKeys.some(k => ['salaryMin', 'salaryMax', 'costCenter'].includes(k))) {
          setActiveTab(2);
        }

        addToast({
          title: 'Validation Failed',
          message: `Unable to submit JD. Please complete required fields: ${valResult.missingLabels.join(', ')}`,
          type: 'error'
        });

        // Focus and scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 3. Dynamic Workflow Engine Check
      const wfEval = evaluateWorkflowForJd(formData, workflows);
      if (wfEval.status === 'conflict') {
        addToast({
          title: 'Workflow Conflict',
          message: 'Unable to submit JD because multiple workflow rules match this JD configuration.',
          type: 'error'
        });
        setActiveTab(3);
        return;
      }

      const appliedWorkflow = wfEval.workflow;
      if (!appliedWorkflow || !appliedWorkflow.stages || appliedWorkflow.stages.length === 0) {
        addToast({
          title: 'Workflow Error',
          message: 'Unable to submit JD because the approval workflow is inactive or has no stages.',
          type: 'error'
        });
        return;
      }

      // 4. Approver Resolution Check
      const DEFAULT_APPROVERS = {
        recruiter:       'Sarah Chen (Recruiter)',
        hiring_manager:  'Alex Rivera (Hiring Manager)',
        hr_lead:         'Elena Rostova (HR & Compliance Lead)',
        hrbp:            'Elena Rostova (HR & Compliance Lead)',
        finance:         'Rachel Vance (Finance & Comp)',
        dept_head:       'David Zhang (Department Head)',
        hr_head:         'Elena Rostova (HR & Compliance Lead)',
        admin:           'System Admin'
      };

      for (const stg of appliedWorkflow.stages) {
        const approverName = DEFAULT_APPROVERS[stg.role];
        if (!approverName) {
          addToast({
            title: 'Approver Error',
            message: `Unable to submit JD because ${stg.roleName || stg.role} has no valid approver assigned.`,
            type: 'error'
          });
          return;
        }
      }

      // 5. Immutable Historical Workflow Snapshot
      const nowIso = new Date().toISOString();
      const workflowSnapshotData = {
        id: appliedWorkflow.id || 'WF-STD-001',
        name: appliedWorkflow.name || 'Standard Approval Workflow',
        version: appliedWorkflow.version || 'v1.0',
        matchedConditions: {
          department: formData.department,
          minExperience: formData.experienceMin,
          maxExperience: formData.experienceMax
        },
        stages: appliedWorkflow.stages.map(s => ({
          id: s.id,
          role: s.role,
          roleName: s.roleName,
          type: s.type || 'sequential',
          mandatory: s.mandatory !== false,
          slaHours: s.slaHours || 24,
          assignedApprover: DEFAULT_APPROVERS[s.role] || `${s.roleName} Reviewer`
        })),
        assignmentDateTime: nowIso
      };

      // 6. Dynamic Approval Chain Construction
      const dynamicApprovalChain = appliedWorkflow.stages.map((stg, idx) => ({
        stageId: stg.id,
        role: stg.role,
        roleName: stg.roleName,
        approverName: DEFAULT_APPROVERS[stg.role] || `${stg.roleName} Reviewer`,
        status: idx === 0 ? 'Pending' : 'Waiting',
        timestamp: null,
        comment: null,
        slaHours: stg.slaHours || 24
      }));

      const fullChain = [
        {
          stageId: 1,
          role: 'recruiter',
          roleName: 'Recruiter',
          approverName: DEFAULT_APPROVERS[userRole] || 'Recruiter / JD Owner',
          status: 'Submitted',
          timestamp: nowIso.replace('T', ' ').slice(0, 16),
          comment: 'Submitted for workflow approval'
        },
        ...dynamicApprovalChain
      ];

      const firstPendingApprover = dynamicApprovalChain[0];
      const targetStatus = 'Pending Approval';
      const submittedData = {
        ...formData,
        id: formData.id || `JD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        status: targetStatus,
        version: formData.version || 'v1.0',
        versionNum: formData.versionNum || 1.0,
        createdBy: formData.createdBy || DEFAULT_APPROVERS[userRole] || 'Sarah Chen (Recruiter)',
        creatorRole: userRole,
        submittedBy: DEFAULT_APPROVERS[userRole] || 'Recruiter',
        submittedDate: nowIso.split('T')[0],
        submittedDateTime: nowIso,
        workflowId: appliedWorkflow.id,
        workflowName: appliedWorkflow.name,
        workflowSnapshot: workflowSnapshotData,
        approvalChain: fullChain,
        currentApproverRole: firstPendingApprover?.role || 'hiring_manager',
        currentApproverName: firstPendingApprover?.approverName || 'Alex Rivera (Hiring Manager)'
      };

      // 7. Persist & Transition
      const publishedJd = persistJdToSession(submittedData, targetStatus, workflowSnapshotData);
      onSave(publishedJd, targetStatus);
      addToast({
        title: 'JD Submitted Successfully',
        message: `Job Description "${publishedJd.title}" submitted for approval under "${appliedWorkflow.name}". Status changed to Pending Approval.`,
        type: 'success'
      });
      if (onClose) onClose();
    } catch (err) {
      console.error('JD Submission error:', err);
      addToast({
        title: 'Submission Error',
        message: `Unable to submit JD: ${err.message || 'An unexpected error occurred.'}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Assistant generator
  const handleAIGenerate = () => {
    if (!formData.title || formData.title.trim().length < 3) {
      setErrors({ title: 'Enter a valid Job Title first for AI Copilot' });
      setActiveTab(0);
      addToast({
        title: 'Job Title Required',
        message: 'Please enter a Job Title before running AI generator.',
        type: 'warning'
      });
      return;
    }
    const title = formData.title.trim();
    const dept = formData.department || 'Engineering';

    setFormData(prev => ({
      ...prev,
      summary: `We are seeking an experienced and vision-driven ${title} to join our high-velocity ${dept} team. In this pivotal role, you will architect resilient solutions, spearhead end-to-end product features, and drive cross-functional alignment.`,
      responsibilities: `- Design, implement, and maintain enterprise-grade solutions for ${title} domain.\n- Collaborate closely with Product Management, Design, and QA partners to ship scalable capabilities.\n- Identify engineering bottlenecks, enforce automated testing standards, and drive operational excellence.\n- Mentor junior team members and foster a high-performance continuous learning culture.`,
      requiredSkills: `${title} Core Domain, System Design, Problem Solving, Agile Frameworks, RESTful Services`,
      preferredSkills: `Cloud Architecture (AWS/Azure), CI/CD Automation, Containerization (Docker/Kubernetes)`,
      qualifications: `Bachelor's or Master's degree in Computer Science, Engineering, or equivalent practical experience.`
    }));

    setErrors(prev => ({
      ...prev,
      summary: null,
      responsibilities: null,
      requiredSkills: null
    }));

    addToast({
      title: 'AI Copilot Success',
      message: `Generated specifications, responsibilities, and skills for "${title}".`,
      type: 'success'
    });
  };

  // Standardized Form Field Classes matching Requisition module
  const inputClass = (field) =>
    `w-full h-9 px-3.5 rounded-xl border text-xs font-semibold outline-none transition-all duration-150 bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
      errors[field] 
        ? 'border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
        : 'border-slate-200 dark:border-slate-700/80 hover:border-[var(--pw-brand)] focus:border-[var(--pw-brand)] focus:ring-2 focus:ring-[var(--pw-brand)]/20 shadow-2xs'
    }`;

  const textareaClass = (field) =>
    `w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition-all duration-150 bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
      errors[field] 
        ? 'border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
        : 'border-slate-200 dark:border-slate-700/80 hover:border-[var(--pw-brand)] focus:border-[var(--pw-brand)] focus:ring-2 focus:ring-[var(--pw-brand)]/20 shadow-2xs'
    }`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-[1600px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-5 [transform:translateZ(0)]"
    >
      
      {/* Layer 1: Header Bar */}
      <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4.5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isEditMode ? `Edit Job Description: ${formData.title || initialData?.title}` : 'Create Job Description'}
            </h1>
            {missingValidationsCount > 0 ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5 shadow-2xs">
                <AlertCircle size={13} /> {missingValidationsCount} Required {missingValidationsCount === 1 ? 'Field' : 'Fields'} Remaining
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 size={13} /> Specifications Complete
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define role parameters, responsibilities, compensation bands, and automated approval routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="h-9 px-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <X size={14} /> Cancel
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveDraft}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Save size={14} /> Save Draft
          </motion.button>
          <motion.button 
            whileHover={isSubmitting ? {} : { scale: 1.02 }}
            whileTap={isSubmitting ? {} : { scale: 0.98 }}
            onClick={handleSubmitForReview}
            disabled={isSubmitting}
            style={{ backgroundColor: brandColor }}
            className={`h-9.5 px-4.5 text-xs font-extrabold text-white rounded-xl border border-white/20 transition-all flex items-center gap-1.5 shadow-sm ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send size={14} strokeWidth={2.5} /> Submit JD for Approval
              </>
            )}
          </motion.button>
        </div>
      </div>

      {duplicateWarning && (
        <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <AlertCircle size={16} className="shrink-0 text-amber-500" />
          <span>{duplicateWarning}</span>
        </div>
      )}

      {/* 3-Mode JD Generation Selector Strip */}
      {!isEditMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <button 
            type="button"
            onClick={() => setCreationMethod('form')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${
              creationMethod === 'form' 
                ? 'bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 ring-2 ring-blue-500/20' 
                : 'hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div 
              style={{ backgroundColor: creationMethod === 'form' ? brandColor : undefined }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                creationMethod === 'form' ? 'text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <FileText size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">1. Form & AI Assistant</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Step-by-step form with AI skills</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setCreationMethod('excel')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${
              creationMethod === 'excel' 
                ? 'bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 ring-2 ring-emerald-500/20' 
                : 'hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
              creationMethod === 'excel' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">2. Bulk Excel Upload</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Import multiple JDs via CSV</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setCreationMethod('document')}
            style={creationMethod === 'document' ? { borderColor: brandColor } : {}}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${
              creationMethod === 'document' 
                ? 'bg-white dark:bg-slate-900 shadow-md border ring-2 ring-blue-500/20' 
                : 'hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div 
              style={{ backgroundColor: creationMethod === 'document' ? brandColor : undefined }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                creationMethod === 'document' ? 'text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">3. Upload JD Document</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">AI auto-parsing (PDF / Word)</span>
            </div>
          </button>
        </div>
      )}

      {/* Layer 2: Mode 2 (Excel) & Mode 3 (Document) Workspaces */}
      {creationMethod === 'excel' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={20} /> Mode 2: Bulk Excel / CSV Job Description Import
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload a structured CSV spreadsheet file to import multiple Job Descriptions into the repository simultaneously.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => addToast({ title: 'Template Downloaded', message: 'Sample_JD_Import_Template.csv saved to downloads.', type: 'success' })}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
            >
              <Download size={14} /> Download Sample .CSV Template
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/30 space-y-3 cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drag and drop your .csv / .xlsx spreadsheet
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Supports UTF-8 CSV, Excel Workbooks up to 10MB</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sample Parsed Import Records (5 Roles Mapped)</h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">Req ID</th>
                    <th className="p-3">Job Title</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Level</th>
                    <th className="p-3">Salary Band</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  <tr>
                    <td className="p-3 font-mono">REQ-2026-0001</td>
                    <td className="p-3 font-bold">Staff DevOps Engineer</td>
                    <td className="p-3">Engineering</td>
                    <td className="p-3">L5 - Staff</td>
                    <td className="p-3">₹24L - ₹32L</td>
                    <td className="p-3"><span className="text-emerald-600 font-bold">Valid</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono">REQ-2026-0002</td>
                    <td className="p-3 font-bold">Lead Product Manager</td>
                    <td className="p-3">Product Management</td>
                    <td className="p-3">L6 - Principal</td>
                    <td className="p-3">₹30L - ₹42L</td>
                    <td className="p-3"><span className="text-emerald-600 font-bold">Valid</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => setCreationMethod('form')} 
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={() => {
                addToast({ title: 'Import Successful', message: '5 Job Descriptions imported into Repository.', type: 'success' });
                onClose();
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 cursor-pointer shadow-xs"
            >
              Confirm & Import 5 JDs
            </button>
          </div>
        </div>
      )}

      {creationMethod === 'document' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles style={{ color: brandColor }} size={20} /> Mode 3: Upload Existing Job Description (PDF / Word)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload an existing JD document and let AI auto-extract key role details, requirements, and skill tags into the creation wizard.
            </p>
          </div>

          <div 
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/30 space-y-3 cursor-pointer"
          >
            <div 
              style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
            >
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to upload existing JD (.pdf, .docx, .txt)
              </p>
              <p className="text-[11px] text-slate-400 mt-1">AI engine parses document structure & extracts specifications instantly</p>
            </div>
          </div>

          <div 
            className="p-4 rounded-xl space-y-3 border bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80"
          >
            <div className="flex items-center justify-between">
              <span 
                style={{ color: brandColor }}
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Sparkles size={14} style={{ color: brandColor }} /> AI Extracted Role Specifications
              </span>
              <span 
                style={{ backgroundColor: `${brandColor}15`, color: brandColor, borderColor: `${brandColor}35` }}
                className="text-[10px] font-mono border px-2 py-0.5 rounded font-bold"
              >
                98% Accuracy Match
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-400 block">Extracted Title</span>
                <strong className="text-slate-800 dark:text-slate-200">Senior Cloud Solutions Architect</strong>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-400 block">Department</span>
                <strong className="text-slate-800 dark:text-slate-200">Cloud & AI Platform</strong>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-400 block">Experience</span>
                <strong className="text-slate-800 dark:text-slate-200">Senior-Level (5-8 yrs)</strong>
              </div>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <span className="text-[10px] text-slate-400 block mb-1">Extracted Technical Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {['AWS', 'Kubernetes', 'Terraform', 'Python', 'System Architecture'].map(sk => (
                  <span 
                    key={sk} 
                    style={{ backgroundColor: `${brandColor}12`, color: brandColor, borderColor: `${brandColor}25` }}
                    className="px-2 py-0.5 rounded border text-[10px] font-semibold"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => setCreationMethod('form')} 
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  title: 'Senior Cloud Solutions Architect',
                  department: 'Cloud & AI Platform',
                  experience: 'Senior-Level (5-8 yrs)',
                  primarySkills: ['AWS', 'Kubernetes', 'Terraform', 'Python', 'System Architecture']
                }));
                setCreationMethod('form');
                addToast({ title: 'AI Field Transfer Complete', message: 'Extracted specifications loaded into Creation Form Wizard.', type: 'success' });
              }}
              style={{ backgroundColor: brandColor }}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl hover:brightness-110 cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Sparkles size={14} /> Auto-Fill Wizard with Extracted Data
            </button>
          </div>
        </div>
      )}

      {/* Layer 2: Glassmorphism Step Navigator (Form Mode) */}
      {creationMethod === 'form' && (
        <>
          <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isActive = idx === activeTab;
            const isCompleted = idx < activeTab;

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

      {/* Layer 3: Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          
          {/* STEP 0: Basic Info */}
          {activeTab === 0 && (
            <div className="space-y-4">
              {/* Linked Requisition ID Selection */}
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                errors.reqId 
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800' 
                  : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/80'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div 
                    style={{ backgroundColor: brandColor }}
                    className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0"
                  >
                    REQ
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-blue-950 dark:text-blue-200 flex items-center gap-1">
                      Linked Requisition ID <span className="text-rose-500 font-bold">*</span>
                    </span>
                    <span className="text-[11px] text-blue-700/80 dark:text-blue-400">
                      Selecting an approved requisition is mandatory to inherit budget &amp; governance
                    </span>
                  </div>
                </div>
                <div className="w-full sm:w-72 shrink-0">
                  <CustomSelect 
                    value={formData.reqId || ''} 
                    onChange={(val) => updateField('reqId', val)} 
                    options={reqOptions} 
                    placeholder="-- Select Linked Requisition --"
                    className={errors.reqId ? 'ring-2 ring-rose-500 rounded-lg' : ''}
                  />
                  {errors.reqId && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.reqId}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Job Title <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => updateField('title', e.target.value)} 
                    placeholder="e.g. Senior Frontend Engineer" 
                    className={inputClass('title')} 
                  />
                  {errors.title && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.title}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Job Code <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.jobCode} 
                    onChange={(e) => updateField('jobCode', e.target.value)} 
                    placeholder="e.g. JOB-1049" 
                    className={inputClass('jobCode')} 
                  />
                  {errors.jobCode && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.jobCode}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Business Unit <span className="text-rose-500">*</span></label>
                  <CustomSelect 
                    value={formData.businessUnit} 
                    onChange={(val) => updateField('businessUnit', val)} 
                    options={['Cloud & AI Platform', 'Enterprise SaaS', 'Global Product Operations', 'Financial Services'].map(x => ({label: x, value: x}))} 
                    buttonClassName={errors.businessUnit ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : ''}
                  />
                  {errors.businessUnit && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.businessUnit}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Department <span className="text-rose-500">*</span></label>
                    {formData.reqId && (
                      <div className="flex items-center gap-1">
                        {!isDeptOverrideEnabled ? (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                              <Lock size={10} /> Inherited from {formData.reqId}
                            </span>
                            <button 
                              type="button"
                              onClick={() => setIsDeptOverrideEnabled(true)}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: brandColor }}
                            >
                              <Unlock size={10} className="inline mr-0.5" /> Override
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                              <ShieldAlert size={10} /> Override Active
                            </span>
                            <button 
                              type="button"
                              onClick={resetDeptToReq}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                            >
                              Reset to REQ
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <CustomSelect 
                    value={formData.department} 
                    onChange={(val) => updateField('department', val)} 
                    disabled={formData.reqId && !isDeptOverrideEnabled}
                    options={['Engineering', 'Sales', 'Marketing', 'Finance', 'Design', 'HR'].map(x => ({label: x, value: x}))} 
                    buttonClassName={`${errors.department ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : ''} ${formData.reqId && !isDeptOverrideEnabled ? 'opacity-80 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''}`}
                  />
                  {errors.department && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.department}
                    </span>
                  )}
                </div>
              </div>

              {/* Classification Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Job Family</label>
                  <CustomSelect value={formData.jobFamily} onChange={(val) => updateField('jobFamily', val)} options={[
                    { label: 'Software Engineering', value: 'Software Engineering' },
                    { label: 'Field Sales', value: 'Field Sales' },
                    { label: 'Product Marketing', value: 'Product Marketing' },
                    { label: 'Finance & Accounting', value: 'Finance & Accounting' },
                    { label: 'Human Resources', value: 'Human Resources' }
                  ]} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Job Sub-Family</label>
                  <input type="text" value={formData.jobSubFamily} onChange={(e) => updateField('jobSubFamily', e.target.value)} className={inputClass('jobSubFamily')} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Career Level</label>
                  <CustomSelect value={formData.careerLevel} onChange={(val) => updateField('careerLevel', val)} options={[
                    { label: 'IC1 - Entry Associate', value: 'IC1 - Entry Associate' },
                    { label: 'IC2 - Specialist', value: 'IC2 - Specialist' },
                    { label: 'IC3 - Senior Specialist', value: 'IC3 - Senior Specialist' },
                    { label: 'M1 - People Manager', value: 'M1 - People Manager' },
                    { label: 'M2 - Director / VP', value: 'M2 - Director / VP' }
                  ]} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Employment Type <span className="text-rose-500">*</span></label>
                  <CustomSelect value={formData.employmentType} onChange={(val) => updateField('employmentType', val)} options={[
                    { label: 'Full Time', value: 'Full-Time' },
                    { label: 'Part Time', value: 'Part-Time' },
                    { label: 'Contract', value: 'Contract' },
                    { label: 'Temporary', value: 'Temporary' },
                    { label: 'Internship', value: 'Internship' },
                    { label: 'Apprenticeship', value: 'Apprenticeship' }
                  ]} />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Workplace Mode <span className="text-rose-500">*</span></label>
                  <CustomSelect value={formData.workMode} onChange={(val) => updateField('workMode', val)} options={[
                    { label: 'On-site', value: 'On-Site' },
                    { label: 'Hybrid', value: 'Hybrid' },
                    { label: 'Remote', value: 'Remote' }
                  ]} />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Job Grade / Level</label>
                  <CustomSelect value={formData.jobLevel} onChange={(val) => updateField('jobLevel', val)} options={[
                    { label: 'L1 - Entry / Trainee', value: 'L1 - Entry / Trainee' },
                    { label: 'L2 - Junior Professional', value: 'L2 - Junior Professional' },
                    { label: 'L3 - Mid-Level Specialist', value: 'L3 - Mid-Level Specialist' },
                    { label: 'L4 - Senior Engineer / Specialist', value: 'L4 - Senior Engineer' },
                    { label: 'L5 - Staff / Lead Manager', value: 'L5 - Staff / Lead' },
                    { label: 'L6 - Principal Architect', value: 'L6 - Principal Architect' },
                    { label: 'L7 - Executive Director / VP', value: 'L7 - Executive Director' }
                  ]} />
                </div>
              </div>

              {/* Conditional Workplace Mode Fields */}
              {formData.workMode === 'On-Site' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Work Location <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={(e) => updateField('location', e.target.value)} 
                    placeholder="e.g. Bangalore HQ Campus, Building 4" 
                    className={inputClass('location')} 
                  />
                  {errors.location && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.location}
                    </span>
                  )}
                </div>
              )}

              {formData.workMode === 'Hybrid' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Office Location <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.location} 
                      onChange={(e) => updateField('location', e.target.value)} 
                      placeholder="e.g. Bangalore HQ Campus" 
                      className={inputClass('location')} 
                    />
                    {errors.location && (
                      <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.location}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Office Days / Wk <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      min={1} max={5}
                      value={formData.officeDaysPerWeek} 
                      onChange={(e) => updateField('officeDaysPerWeek', e.target.value)} 
                      className={inputClass('officeDaysPerWeek')} 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Remote Days / Wk</label>
                    <input 
                      type="number" 
                      min={0} max={4}
                      value={formData.remoteDaysPerWeek} 
                      onChange={(e) => updateField('remoteDaysPerWeek', e.target.value)} 
                      className={inputClass('remoteDaysPerWeek')} 
                    />
                  </div>
                </div>
              )}

              {formData.workMode === 'Remote' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Remote Location / Country <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.remoteLocation} 
                      onChange={(e) => updateField('remoteLocation', e.target.value)} 
                      placeholder="e.g. India / APAC Remote" 
                      className={inputClass('remoteLocation')} 
                    />
                    {errors.remoteLocation && (
                      <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.remoteLocation}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Applicable Time Zone <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.timeZone} 
                      onChange={(e) => updateField('timeZone', e.target.value)} 
                      placeholder="e.g. IST (UTC+5:30)" 
                      className={inputClass('timeZone')} 
                    />
                    {errors.timeZone && (
                      <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.timeZone}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Min Experience (Yrs)</label>
                  <input type="number" min={0} value={formData.experienceMin} onChange={(e) => updateField('experienceMin', e.target.value)} className={inputClass('experienceMin')} />
                  {errors.experienceMin && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.experienceMin}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Max Experience (Yrs)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={formData.experienceMax} 
                    onChange={(e) => updateField('experienceMax', e.target.value)} 
                    className={inputClass('experienceMax')} 
                  />
                  {errors.experienceMax && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.experienceMax}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Vacancies / Positions <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    min={1}
                    value={formData.positions} 
                    onChange={(e) => updateField('positions', e.target.value)} 
                    className={inputClass('positions')} 
                  />
                  {errors.positions && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.positions}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Job Description */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Educational Requirement <span className="text-rose-500">*</span></label>
                  <CustomSelect value={formData.qualifications} onChange={(val) => updateField('qualifications', val)} options={[
                    { label: "Bachelor's Degree", value: "Bachelor's Degree" },
                    { label: "Master's / Post Graduate", value: "Master's Degree" },
                    { label: 'Doctorate / PhD', value: 'Doctorate' },
                    { label: 'Diploma / Certification', value: 'Diploma' },
                    { label: 'Any Qualification', value: 'Any Qualification' }
                  ]} />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Max Acceptable Notice Period</label>
                  <CustomSelect value={formData.maxNoticePeriod} onChange={(val) => updateField('maxNoticePeriod', val)} options={[
                    { label: '15 Days / Immediate', value: '15 Days' },
                    { label: '30 Days Standard', value: '30 Days' },
                    { label: '60 Days', value: '60 Days' },
                    { label: '90 Days (Executive)', value: '90 Days' }
                  ]} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Immediate Joiner Accepted?</label>
                  <CustomSelect value={formData.immediateJoinerAccepted} onChange={(val) => updateField('immediateJoinerAccepted', val)} options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' }
                  ]} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Buyout Allowed?</label>
                  <CustomSelect value={formData.buyoutAllowed} onChange={(val) => updateField('buyoutAllowed', val)} options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' }
                  ]} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Preferred Notice Period</label>
                  <CustomSelect value={formData.preferredNoticePeriod} onChange={(val) => updateField('preferredNoticePeriod', val)} options={[
                    { label: 'Immediate / < 15 Days', value: '15 Days' },
                    { label: '30 Days', value: '30 Days' },
                    { label: '60 Days', value: '60 Days' }
                  ]} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Job Summary <span className="text-rose-500">*</span></label>
                <textarea 
                  value={formData.summary} 
                  onChange={(e) => updateField('summary', e.target.value)} 
                  rows={3} 
                  placeholder="Provide an executive summary of the role objectives..." 
                  className={textareaClass('summary')} 
                />
                {errors.summary && (
                  <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} /> {errors.summary}
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Responsibilities & Deliverables <span className="text-rose-500">*</span></label>
                <textarea 
                  value={formData.responsibilities} 
                  onChange={(e) => updateField('responsibilities', e.target.value)} 
                  rows={4} 
                  placeholder="Bullet points of key duties, deliverables, and team impact..." 
                  className={textareaClass('responsibilities')} 
                />
                {errors.responsibilities && (
                  <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} /> {errors.responsibilities}
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Required Skills (Comma Separated) <span className="text-rose-500">*</span></label>
                <textarea 
                  value={formData.requiredSkills} 
                  onChange={(e) => updateField('requiredSkills', e.target.value)} 
                  rows={2} 
                  placeholder="e.g. React, TypeScript, Node.js, GraphQL" 
                  className={textareaClass('requiredSkills')} 
                />
                {errors.requiredSkills && (
                  <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} /> {errors.requiredSkills}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Compensation & Org Codes */}
          {activeTab === 2 && (
            <div className="space-y-4">
              {/* Inherited Salary Budget Governance Banner */}
              {formData.reqId && (
                <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isSalaryOverrideEnabled ? (
                      <ShieldAlert className="text-amber-500 shrink-0" size={18} />
                    ) : (
                      <Lock className="text-blue-600 dark:text-blue-400 shrink-0" size={18} />
                    )}
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">
                        {isSalaryOverrideEnabled ? 'Salary Override Active (Recruiter Custom)' : `Salary Budget Protected (${formData.reqId})`}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {isSalaryOverrideEnabled 
                          ? 'Custom compensation range applied. You can reset to approved budget anytime.' 
                          : `Inherited pre-approved budget range from ${formData.reqId}.`}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {!isSalaryOverrideEnabled ? (
                      <button
                        type="button"
                        onClick={() => setIsSalaryOverrideEnabled(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90 transition-opacity shadow-xs"
                        style={{ backgroundColor: brandColor }}
                      >
                        <Unlock size={13} /> Enable Salary Override
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={resetSalaryToReq}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-colors"
                      >
                        Reset to REQ Budget
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Currency Code</label>
                  <CustomSelect 
                    value={formData.currency} 
                    onChange={(val) => updateField('currency', val)} 
                    disabled={formData.reqId && !isSalaryOverrideEnabled}
                    options={[
                      { label: 'INR - Indian Rupee (₹)', value: 'INR' },
                      { label: 'USD - US Dollar ($)', value: 'USD' },
                      { label: 'EUR - Euro (€)', value: 'EUR' },
                      { label: 'GBP - British Pound (£)', value: 'GBP' },
                      { label: 'SGD - Singapore Dollar (S$)', value: 'SGD' },
                      { label: 'AED - UAE Dirham', value: 'AED' }
                    ]} 
                    buttonClassName={formData.reqId && !isSalaryOverrideEnabled ? 'opacity-80 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Pay Frequency</label>
                  <CustomSelect 
                    value={formData.payFrequency} 
                    onChange={(val) => updateField('payFrequency', val)} 
                    disabled={formData.reqId && !isSalaryOverrideEnabled}
                    options={[
                      { label: 'Annual CTC (Per Annum)', value: 'Annual CTC' },
                      { label: 'Monthly Salary (Per Month)', value: 'Monthly Salary' },
                      { label: 'Daily Rate (Consultant)', value: 'Daily Rate' }
                    ]} 
                    buttonClassName={formData.reqId && !isSalaryOverrideEnabled ? 'opacity-80 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Minimum Salary / CTC <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    value={formData.salaryMin} 
                    disabled={formData.reqId && !isSalaryOverrideEnabled}
                    onChange={(e) => updateField('salaryMin', e.target.value)} 
                    placeholder="e.g. 1200000" 
                    className={`${inputClass('salaryMin')} ${formData.reqId && !isSalaryOverrideEnabled ? 'opacity-80 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''}`} 
                  />
                  {errors.salaryMin && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.salaryMin}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Maximum Salary / CTC <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    value={formData.salaryMax} 
                    disabled={formData.reqId && !isSalaryOverrideEnabled}
                    onChange={(e) => updateField('salaryMax', e.target.value)} 
                    placeholder="e.g. 1800000" 
                    className={`${inputClass('salaryMax')} ${formData.reqId && !isSalaryOverrideEnabled ? 'opacity-80 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''}`} 
                  />
                  {errors.salaryMax && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.salaryMax}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Bonus / Incentive Structure</label>
                  <CustomSelect value={formData.bonusStructure} onChange={(val) => updateField('bonusStructure', val)} options={[
                    { label: 'Performance Bonus Included', value: 'Performance Bonus' },
                    { label: 'Fixed CTC Only (No Bonus)', value: 'Fixed CTC Only' },
                    { label: 'Sales Commission Plan', value: 'Sales Commission' },
                    { label: 'Includes ESOPs / Stock Grants', value: 'ESOPs / Stock Grants' }
                  ]} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Finance Cost Center Code <span className="text-rose-500">*</span></label>
                    {formData.reqId && (
                      <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                        <Lock size={10} /> Governed by {formData.reqId}
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={formData.costCenter} 
                    disabled={Boolean(formData.reqId)}
                    onChange={(e) => updateField('costCenter', e.target.value)} 
                    placeholder="e.g. CC-1024" 
                    className={`${inputClass('costCenter')} ${formData.reqId ? 'opacity-80 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''}`} 
                  />
                  {errors.costCenter && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.costCenter}
                    </span>
                  )}
                </div>
              </div>

              {/* Structured Organizational Mapping Codes */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Building size={14} className="text-blue-500" /> Enterprise Organizational Mapping Codes
                  </span>
                  {formData.reqId && (
                    <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1">
                      <Lock size={10} /> Strictly Governance Locked
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Company Code</label>
                    <input type="text" value={formData.companyCode} disabled={Boolean(formData.reqId)} onChange={(e) => updateField('companyCode', e.target.value)} className={`${inputClass('companyCode')} ${formData.reqId ? 'opacity-80 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''}`} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">BU Code</label>
                    <input type="text" value={formData.businessUnitCode} disabled={Boolean(formData.reqId)} onChange={(e) => updateField('businessUnitCode', e.target.value)} className={`${inputClass('businessUnitCode')} ${formData.reqId ? 'opacity-80 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''}`} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Dept Code</label>
                    <input type="text" value={formData.departmentCode} disabled={Boolean(formData.reqId)} onChange={(e) => updateField('departmentCode', e.target.value)} className={`${inputClass('departmentCode')} ${formData.reqId ? 'opacity-80 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''}`} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">WPS Code</label>
                    <input type="text" value={formData.wpsCode} disabled={Boolean(formData.reqId)} onChange={(e) => updateField('wpsCode', e.target.value)} className={`${inputClass('wpsCode')} ${formData.reqId ? 'opacity-80 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''}`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Approval Workflow Preview */}
          {activeTab === 3 && (
            <div className="space-y-4">
              {resolvedWorkflowResult.status === 'conflict' ? (
                <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
                    <ShieldAlert size={18} /> Workflow Configuration Conflict
                  </div>
                  <p>{resolvedWorkflowResult.message}</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-500" /> Automated Multi-Stage Sign-off Chain
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {resolvedWorkflowResult.workflow?.name || 'Standard Enterprise Workflow'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {/* Stage 1: Initiator */}
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-0.5">
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Stage 1: Initiator</div>
                      <div className="font-bold text-slate-900 dark:text-white truncate">Sarah Chen</div>
                      <div className="text-[10px] text-slate-500">Recruiter / JD Owner (Draft &amp; Submit)</div>
                    </div>

                    {/* Stage 2: Technical Approver */}
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-0.5">
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Stage 2: Technical Approver</div>
                      <div className="font-bold text-slate-900 dark:text-white truncate">Alex Rivera</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock size={10} /> Hiring Manager • SLA: 48h
                      </div>
                    </div>

                    {/* Stage 3: HR & Compliance Gate */}
                    <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs space-y-0.5">
                      <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Stage 3: HR &amp; Compliance</div>
                      <div className="font-bold text-slate-900 dark:text-white truncate">Elena Rostova</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock size={10} /> HR &amp; Compliance Lead • SLA: 24h
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <button 
              type="button"
              onClick={() => activeTab > 0 && setActiveTab(t => t - 1)} 
              className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors ${
                activeTab === 0 
                  ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <ChevronLeft size={14} /> Back
            </button>
            {activeTab < 3 ? (
              <button 
                type="button"
                onClick={handleNextStep} 
                style={{ backgroundColor: brandColor }}
                className="h-9 px-4 text-xs font-bold text-white hover:brightness-110 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Next Step <ChevronRight size={14} />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmitForReview} 
                disabled={isSubmitting}
                className={`h-9 px-4 text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-xs flex items-center gap-1.5 transition-all ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-700 cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Submit JD for Approval
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: AI Assist Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-600 dark:text-blue-400 w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Copilot Specification Assist</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Instantly draft executive summaries, key deliverables, and recommended skill tags tailored for "{formData.title || 'this role'}".
            </p>
            <button 
              type="button"
              onClick={handleAIGenerate}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} /> Auto-Generate JD Content
            </button>
          </div>
        </div>
      </div>
      </>
    )}
    </motion.div>
  );
}

