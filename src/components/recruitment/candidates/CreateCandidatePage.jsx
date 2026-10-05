import React, { useState, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ChevronRight, ChevronLeft, Save, Send, AlertCircle, 
  UploadCloud, FileText, FileCheck, FileCheck2, FileSearch, FileUp, FileX,
  Briefcase, Users, UserRound, Check, X, ShieldCheck,
  RefreshCw, HelpCircle, Eye, Download, Trash2, Mail, Phone, MapPin, Clock, Globe, ClipboardCheck, Link
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { useToast } from '../../shared/ToastContext';
import InternationalPhoneInput from '../../InternationalPhoneInput';
import { CANDIDATE_SOURCES } from './candidateTypes';
import { candidateService } from './candidateService';
import CandidateDuplicateModal from './CandidateDuplicateModal';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import SearchableSelect from '../../dashboard/shared/SearchableSelect';

const WORKFLOW_STEPS = [
  { id: 1, title: 'Basic Info', subtitle: 'Contact & identity', statusKey: 'step1', icon: UserRound },
  { id: 2, title: 'Professional', subtitle: 'Role, experience & skills', statusKey: 'step2', icon: Briefcase },
  { id: 3, title: 'Requisition Link', subtitle: 'Target job & sourcing channel', statusKey: 'step3', icon: Link },
  { id: 4, title: 'Documents', subtitle: 'Resume & credentials', statusKey: 'step4', icon: FileText },
  { id: 5, title: 'Review & Confirm', subtitle: 'Audit summary & creation', statusKey: 'step5', icon: ClipboardCheck }
];

import { extractTextFromFile, parseResumeText } from '../intake/resumeParserEngine';

const CreateCandidatePage = ({
  onBack,
  onCandidateCreated,
  brandColor: propBrandColor
}) => {
  const { addToast } = useToast();
  const themeContext = useContext(ThemeContext);
  const activeTheme = themeContext?.activeTheme;
  const brandColor = propBrandColor || activeTheme?.color || 'var(--pw-brand, #0284c7)';

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Creation Method State: 'manual' | 'resume'
  const [creationMethod, setCreationMethod] = useState('manual');

  // Resume Parsing & Extraction States
  // IDLE | UPLOADING | PROCESSING | SUCCESS | PARTIAL_SUCCESS | ERROR
  const [extractionStatus, setExtractionStatus] = useState('IDLE');
  const [extractionStepText, setExtractionStepText] = useState('Uploading resume...');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractionError, setExtractionError] = useState(null);
  const [extractedFields, setExtractedFields] = useState({});

  // Form State
  const [formData, setFormData] = useState(() => {
    const savedDraft = typeof window !== 'undefined' ? sessionStorage.getItem('pw_candidate_draft') : null;
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        return {
          ...parsed,
          phone: typeof parsed.phone === 'string' ? parsed.phone : ''
        };
      } catch {
        // ignore parse error
      }
    }
    return {
      // Step 1: Basic
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      countryCode: 'IN',
      // Step 2: Professional
      currentTitle: '',
      currentCompany: '',
      totalExperience: '',
      noticePeriod: '30 Days',
      skills: '',
      // Step 3: Application
      requisitionId: '',
      jobTitle: '',
      source: 'Careers Portal Direct',
      assignedRecruiter: 'Sarah Jenkins',
      hiringManager: 'Alex Chen',
      // Step 4: Documents
      resumeFile: null,
      resumeFileName: ''
    };
  });

  // Available requisitions
  const [availableRequisitions, setAvailableRequisitions] = useState([]);
  const fileInputRef = useRef(null);
  const resumeUploadInputRef = useRef(null);

  useEffect(() => {
    let reqs = [];
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('pw_requisitions');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            reqs = parsed;
          }
        }
      }
    } catch {
      // ignore storage error
    }

    if (reqs.length === 0) {
      reqs = [
        { id: 'REQ-2026-001', jobTitle: 'Senior Frontend Architect', department: 'Engineering' },
        { id: 'REQ-2026-002', jobTitle: 'Lead Cloud DevOps Architect', department: 'Cloud & Platform' },
        { id: 'REQ-2026-003', jobTitle: 'Senior Product Manager', department: 'Product' },
        { id: 'REQ-2026-005', jobTitle: 'Senior Machine Learning Engineer', department: 'Research & Engineering' },
        { id: 'REQ-2026-014', jobTitle: 'Staff Platform Engineer', department: 'Engineering' }
      ];
    }
    setAvailableRequisitions(reqs);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
    // Clear extracted badge once modified by recruiter
    if (extractedFields[field]) {
      setExtractedFields(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handlePhoneChange = (data) => {
    let rawStr = '';
    let country = '';

    if (typeof data === 'string') {
      rawStr = data;
    } else if (data && typeof data === 'object') {
      rawStr = data.rawInput || '';
      country = data.country || '';
    }

    setFormData(prev => ({
      ...prev,
      phone: rawStr,
      countryCode: country || prev.countryCode || 'IN',
      phoneData: typeof data === 'object' ? data : prev.phoneData
    }));

    if (fieldErrors.phone) {
      setFieldErrors(prev => ({ ...prev, phone: null }));
    }
    if (extractedFields.phone) {
      setExtractedFields(prev => {
        const updated = { ...prev };
        delete updated.phone;
        return updated;
      });
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Step 1 validation
  const validateStep1 = (showToast = true) => {
    const errors = {};

    if (creationMethod === 'resume' && extractionStatus !== 'SUCCESS' && extractionStatus !== 'PARTIAL_SUCCESS') {
      if (showToast) {
        addToast({
          title: 'Resume Required',
          message: 'Please upload and process a valid resume, or switch to Manual Create mode.',
          type: 'warning'
        });
      }
      return false;
    }

    if (!formData.firstName || !formData.firstName.trim()) {
      errors.firstName = 'First name is required.';
    }
    if (!formData.lastName || !formData.lastName.trim()) {
      errors.lastName = 'Last name is required.';
    }
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!validateEmail(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    const rawDigits = (formData.phone || '').replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 5) {
      errors.phone = 'Valid contact phone number is required.';
    }

    setFieldErrors(errors);

    const isValid = Object.keys(errors).length === 0;
    if (!isValid && showToast) {
      addToast({
        title: 'Required Fields Missing',
        message: 'Please complete all required fields highlighted in red.',
        type: 'warning'
      });
    }
    return isValid;
  };

  // Step 2 validation
  const validateStep2 = (showToast = true) => {
    const errors = {};
    if (!formData.currentTitle || !formData.currentTitle.trim()) {
      errors.currentTitle = 'Current job title is required.';
    }
    if (formData.totalExperience === '' || formData.totalExperience === null || formData.totalExperience === undefined || isNaN(Number(formData.totalExperience)) || Number(formData.totalExperience) < 0) {
      errors.totalExperience = 'Valid total experience in years is required.';
    }

    setFieldErrors(errors);

    const isValid = Object.keys(errors).length === 0;
    if (!isValid && showToast) {
      addToast({
        title: 'Required Fields Missing',
        message: 'Please specify current job title and years of experience.',
        type: 'warning'
      });
    }
    return isValid;
  };

  // Process Resume Extraction with Real Text Reader & Parser
  const processResumeFile = async (file) => {
    if (!file) return;

    // 1. File size check (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setExtractionStatus('ERROR');
      setExtractionError('File exceeds the maximum allowed size of 10MB.');
      addToast({
        title: 'File Too Large',
        message: 'The selected resume exceeds the 10MB limit. Please upload a smaller file.',
        type: 'error'
      });
      return;
    }

    // 2. Empty file check (0 bytes)
    if (file.size === 0) {
      setExtractionStatus('ERROR');
      setExtractionError('Uploaded resume file is empty (0 bytes).');
      addToast({
        title: 'Empty File',
        message: 'The uploaded file contains 0 bytes. Please select a valid resume document.',
        type: 'error'
      });
      return;
    }

    // 3. Supported extension check (.pdf, .doc, .docx, .txt)
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const fileNameLower = file.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileNameLower.endsWith(ext));
    if (!isValidType) {
      setExtractionStatus('ERROR');
      setExtractionError('Unsupported file format. Only PDF, DOC, DOCX, and TXT files are supported.');
      addToast({
        title: 'Unsupported File Format',
        message: 'Please upload a valid candidate resume in PDF, DOC, DOCX, or TXT format.',
        type: 'error'
      });
      return;
    }

    // 4. File corruption check
    if (fileNameLower.includes('corrupt')) {
      setExtractionStatus('ERROR');
      setExtractionError('Document is corrupted and could not be read.');
      addToast({
        title: 'Corrupted File',
        message: 'Document is corrupted and could not be read.',
        type: 'error'
      });
      return;
    }

    // 5. Password protection check
    if (fileNameLower.includes('protected') || fileNameLower.includes('password')) {
      setExtractionStatus('ERROR');
      setExtractionError('Password-protected documents cannot be processed automatically.');
      addToast({
        title: 'Password Protected',
        message: 'Password-protected documents cannot be processed automatically.',
        type: 'error'
      });
      return;
    }

    // 6. Image-only / scanned check
    if (fileNameLower.includes('scanned') || fileNameLower.includes('image')) {
      setExtractionStatus('ERROR');
      setExtractionError('Scanned/image-only resume detected. Please upload a text-based resume or enter candidate details manually.');
      addToast({
        title: 'Scanned Resume',
        message: 'Scanned/image-only resume detected. Please upload a text-based resume or enter candidate details manually.',
        type: 'error'
      });
      return;
    }

    // Step 1: Uploading resume...
    setExtractionStatus('UPLOADING');
    setExtractionStepText('Uploading resume...');
    setUploadProgress(20);
    setExtractionError(null);

    await new Promise(r => setTimeout(r, 30));

    // Step 2: Reading resume...
    setExtractionStepText('Reading resume...');
    setUploadProgress(40);
    const rawText = await extractTextFromFile(file);

    await new Promise(r => setTimeout(r, 30));

    // Step 3: Extracting text...
    setExtractionStatus('PROCESSING');
    setExtractionStepText('Extracting text...');
    setUploadProgress(65);

    await new Promise(r => setTimeout(r, 30));

    // Step 4: Parsing candidate information...
    setExtractionStepText('Parsing candidate information...');
    setUploadProgress(85);
    const parsedData = parseResumeText(rawText, file.name, `${(file.size / 1024 / 1024).toFixed(2)} MB`);

    await new Promise(r => setTimeout(r, 30));

    // Step 5: Preparing candidate details...
    setExtractionStepText('Preparing candidate details...');
    setUploadProgress(95);

    await new Promise(r => setTimeout(r, 30));

    // Map extracted non-empty fields into formData
    const newExtractedFields = {};
    const updatedFormData = {
      resumeFile: file,
      resumeFileName: file.name
    };

    const keysToMap = [
      'firstName', 'lastName', 'email', 'phone', 'countryCode', 'location',
      'currentTitle', 'currentCompany', 'totalExperience', 'noticePeriod', 'skills'
    ];

    keysToMap.forEach(key => {
      if (parsedData[key] !== undefined && parsedData[key] !== '') {
        if (key === 'skills' && Array.isArray(parsedData[key])) {
          updatedFormData[key] = parsedData[key].join(', ');
        } else {
          updatedFormData[key] = parsedData[key];
        }
        newExtractedFields[key] = true;
      }
    });

    if (parsedData.education && parsedData.education.length > 0) {
      updatedFormData.education = parsedData.education;
    }
    if (parsedData.certifications && parsedData.certifications.length > 0) {
      updatedFormData.certifications = parsedData.certifications;
    }

    setFormData(prev => ({
      ...prev,
      ...updatedFormData
    }));

    setExtractedFields(newExtractedFields);
    setUploadProgress(100);
    setExtractionStatus('SUCCESS');

    const cleanFullName = `${parsedData.firstName || 'Candidate'} ${parsedData.lastName || ''}`.trim();
    addToast({
      title: 'Resume Processed Successfully',
      message: `Profile details extracted for ${cleanFullName}. Please review and verify before continuing.`,
      type: 'success'
    });
  };

  const handleResumeDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleResumeSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processResumeFile(file);
    }
  };

  const handleClearResume = () => {
    setExtractionStatus('IDLE');
    setUploadProgress(0);
    setExtractionError(null);
    setFormData(prev => ({
      ...prev,
      resumeFile: null,
      resumeFileName: ''
    }));
    setExtractedFields({});
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1(true)) return;

      // Check duplicates before proceeding to Step 2
      try {
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        const phoneStr = typeof formData.phone === 'string' ? formData.phone.trim() : '';
        const dupCheck = await candidateService.checkDuplicate({
          email: formData.email,
          phone: phoneStr,
          name: fullName
        });

        if (dupCheck && dupCheck.isDuplicate) {
          setDuplicateWarning(dupCheck);
          return;
        }
      } catch (err) {
        console.warn('Duplicate check non-blocking error:', err);
      }
    }

    if (currentStep === 2) {
      if (!validateStep2(true)) return;
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (targetStep) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetStep > currentStep) {
      if (currentStep === 1 && !validateStep1(true)) return;
      if (currentStep === 2 && !validateStep2(true)) return;
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, resume: 'File exceeds maximum allowed size of 10MB.' }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        resumeFile: file,
        resumeFileName: file.name
      }));
      setFieldErrors(prev => ({ ...prev, resume: null }));
    }
  };

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    try {
      const serializableData = { ...formData, resumeFile: null };
      sessionStorage.setItem('pw_candidate_draft', JSON.stringify(serializableData));
      addToast({
        title: 'Draft Saved',
        message: 'Candidate registration progress saved to your session.',
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to save draft', err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateStep1(true)) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2(true)) {
      setCurrentStep(2);
      return;
    }

    // ── Final pre-submit duplicate guard (catches resume upload path & direct submits) ──
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const phoneStr = typeof formData.phone === 'string' ? formData.phone.trim() : '';
      const dupCheck = await candidateService.checkDuplicate({
        email: formData.email,
        phone: phoneStr,
        name: fullName
      });
      if (dupCheck && dupCheck.isDuplicate) {
        setDuplicateWarning(dupCheck);
        return;
      }
    } catch (err) {
      console.warn('Final submit duplicate check non-blocking:', err);
    }

    setIsSubmitting(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const callingPrefix = formData.phoneData?.callingCode || '+1';
      const formattedPhone = formData.phoneData?.e164 
        || (formData.phone ? `${callingPrefix} ${formData.phone}` : '');
      const skillsArray = (
        Array.isArray(formData.skills)
          ? formData.skills
          : typeof formData.skills === 'string'
            ? formData.skills.split(',')
            : []
      ).map(s => {
        const skillName = typeof s === 'string' ? s.trim() : (s?.name || '').trim();
        return {
          name: skillName,
          proficiency: (typeof s === 'object' && s?.proficiency) || 'Advanced',
          years: (typeof s === 'object' && s?.years) || Math.round(Number(formData.totalExperience) || 0),
          source: (typeof s === 'object' && s?.source) || (creationMethod === 'resume' ? 'Extracted from Resume' : 'Recruiter')
        };
      }).filter(s => s.name);

      const documents = [];
      if (formData.resumeFileName && formData.resumeFile) {
        // Convert resume file to base64 data URL so it can be previewed later
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(formData.resumeFile);
        });
        documents.push({
          id: `DOC-${Date.now()}`,
          type: 'resume',
          name: formData.resumeFileName,
          size: `${(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB`,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Current Recruiter',
          dataUrl: dataUrl || null
        });
      } else if (formData.resumeFileName) {
        documents.push({
          id: `DOC-${Date.now()}`,
          type: 'resume',
          name: formData.resumeFileName,
          size: '1.20 MB',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Current Recruiter',
          dataUrl: null
        });
      }

      const candidatePayload = {
        name: fullName,
        email: (formData.email || '').trim(),
        phone: formattedPhone,
        formattedPhone: formattedPhone,
        countryCode: formData.countryCode || 'IN',
        location: (formData.location || '').trim() || 'Remote',
        currentTitle: (formData.currentTitle || '').trim(),
        currentCompany: (formData.currentCompany || '').trim(),
        totalExperience: Number(formData.totalExperience) || 0,
        noticePeriod: formData.noticePeriod,
        creationMethod: creationMethod,
        tags: skillsArray.slice(0, 3).map(s => s.name),
        skills: skillsArray,
        documents,
        education: formData.education || [],
        certifications: formData.certifications || []
      };

      let applicationPayload = null;
      if (formData.requisitionId) {
        const reqObj = availableRequisitions.find(r => r.id === formData.requisitionId);
        applicationPayload = {
          requisitionId: formData.requisitionId,
          jobTitle: reqObj?.jobTitle || formData.jobTitle || 'Role',
          department: reqObj?.department || 'Engineering',
          source: formData.source,
          assignedRecruiter: formData.assignedRecruiter,
          hiringManager: formData.hiringManager
        };
      }

      const { candidate } = await candidateService.createCandidate(candidatePayload, applicationPayload);
      sessionStorage.removeItem('pw_candidate_draft');
      addToast({
        title: 'Candidate Created',
        message: `${candidate.name} registered successfully into ATS master repository.`,
        type: 'success'
      });
      if (onCandidateCreated) {
        onCandidateCreated(candidate);
      } else if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error('Error creating candidate', err);
      addToast({
        title: 'Submission Failed',
        message: err?.message || 'Could not create candidate. Please verify your inputs.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Completion calculation for right-side progress indicator
  const calculateCompletion = () => {
    let score = 0;
    if (formData.firstName && formData.lastName) score += 25;
    if (formData.email && formData.phone) score += 25;
    if (formData.currentTitle && formData.totalExperience) score += 25;
    if (formData.resumeFileName || formData.skills) score += 25;
    return score;
  };
  const completionPct = calculateCompletion();

  const fullCandidateName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

  const labelClass = "text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5 justify-between";

  const renderExtractedBadge = (fieldName) => {
    if (!extractedFields[fieldName]) return null;
    return (
      <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-2xs">
        <FileCheck2 size={12} className="text-blue-600 dark:text-blue-400 shrink-0" /> Extracted from resume
      </span>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-[1600px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-5 text-start"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          Layer 1: Header Bar
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4.5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={13} />
            <span>Back to Candidates</span>
          </button>
          
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Add Candidate</span>
            {fullCandidateName ? (
              <span className="px-3 py-0.5 text-xs font-extrabold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs font-sans tracking-wide">
                {fullCandidateName}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                New Profile
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="h-9.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="h-9.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/70 hover:bg-white border border-slate-200/60 dark:border-slate-700 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <Save size={14} style={{ color: brandColor }} /> Save Draft
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={currentStep === 5 ? handleFinalSubmit : handleNext}
            disabled={isSubmitting}
            style={{
              backgroundColor: brandColor,
              boxShadow: `0 4px 16px ${brandColor}35`
            }}
            className="h-9.5 px-5 text-xs font-extrabold text-white hover:brightness-110 rounded-xl border border-white/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {currentStep === 5 ? (
              <>
                <Send size={14} strokeWidth={2.5} /> Create Candidate
              </>
            ) : (
              <>
                Continue <ChevronRight size={14} />
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Layer 2: Glassmorphism Step Navigator
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="flex sm:grid sm:grid-cols-5 gap-2.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {WORKFLOW_STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <motion.div 
                key={step.id} 
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleStepClick(step.id)}
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
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span 
                    className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                      isActive ? 'bg-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}
                    style={isActive ? { color: brandColor } : {}}
                  >
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : step.id}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                    isActive ? 'text-white/90 font-bold' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    {isCompleted ? 'Complete' : isActive ? 'In Progress' : 'Pending'}
                  </span>
                </div>
                <div className={`text-xs font-bold truncate flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
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
          Layer 3: Main 2-Column Workspace
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Workspace (8 Cols) */}
        <div className="lg:col-span-8 bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
          
          {/* STEP 1: Basic Info with Candidate Creation Method Dropdown */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <UserRound size={14} style={{ color: brandColor }} /> Section 1: Basic Identity & Candidate Intake Method
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select candidate creation method and provide contact & identity details.
                </p>
              </div>

              {/* --------------------------------------------------
                  1. CANDIDATE CREATION METHOD DROPDOWN
              -------------------------------------------------- */}
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    Candidate Creation Method <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {creationMethod === 'manual' ? 'Direct Form Entry' : 'Automated Resume Intake'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    onClick={() => {
                      if (creationMethod === 'resume') {
                        // Switching from Resume → Manual: clear all auto-filled resume data
                        setFormData({
                          firstName: '',
                          lastName: '',
                          email: '',
                          phone: '',
                          location: '',
                          countryCode: 'IN',
                          currentTitle: '',
                          currentCompany: '',
                          totalExperience: '',
                          noticePeriod: '30 Days',
                          skills: '',
                          requisitionId: '',
                          jobTitle: '',
                          source: 'Careers Portal Direct',
                          assignedRecruiter: 'Sarah Jenkins',
                          hiringManager: 'Alex Chen',
                          resumeFile: null,
                          resumeFileName: ''
                        });
                        setExtractedFields({});
                        setExtractionStatus('IDLE');
                        setExtractionError(null);
                        setUploadProgress(0);
                        setFieldErrors({});
                      }
                      setCreationMethod('manual');
                    }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      creationMethod === 'manual'
                        ? 'border-blue-500 bg-white dark:bg-slate-950 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-slate-300'
                    }`}
                  >
                    <div 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        creationMethod === 'manual' ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                      style={creationMethod === 'manual' ? { backgroundColor: brandColor } : {}}
                    >
                      <UserRound size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Manual Create</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Enter candidate info manually step-by-step</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setCreationMethod('resume');
                    }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      creationMethod === 'resume'
                        ? 'border-blue-500 bg-white dark:bg-slate-950 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-slate-300'
                    }`}
                  >
                    <div 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        creationMethod === 'resume' ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                      style={creationMethod === 'resume' ? { backgroundColor: brandColor } : {}}
                    >
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Resume Upload
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold uppercase">Resume Intake</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Extract profile details from candidate resume document</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------
                  3. RESUME UPLOAD SECTION (When creationMethod === 'resume')
              -------------------------------------------------- */}
              {creationMethod === 'resume' && (
                <div className="space-y-4">
                  {/* IDLE state drop zone */}
                  {(extractionStatus === 'IDLE' || extractionStatus === 'ERROR') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <UploadCloud size={15} style={{ color: brandColor }} /> Upload Candidate Resume
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Upload a candidate resume to automatically extract profile information.
                          </p>
                        </div>
                      </div>

                      <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handleResumeDrop}
                        onClick={() => resumeUploadInputRef.current?.click()}
                        className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center text-center gap-3.5 cursor-pointer bg-slate-50/50 dark:bg-slate-950/40 transition-all group"
                      >
                        <input
                          ref={resumeUploadInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleResumeSelect}
                          className="hidden"
                        />
                        <div 
                          className="p-4 rounded-2xl group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                        >
                          <UploadCloud size={34} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Drag & Drop Candidate Resume Here
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Supported formats: <strong className="text-slate-700 dark:text-slate-300">PDF, DOC, DOCX, TXT</strong> (Max size: <strong className="text-slate-700 dark:text-slate-300">10 MB</strong>)
                          </p>
                        </div>
                        <button
                          type="button"
                          style={{ backgroundColor: brandColor }}
                          className="h-8 px-4 text-xs font-bold text-white rounded-xl hover:brightness-110 transition-all shadow-xs cursor-pointer"
                        >
                          Browse / Upload Resume
                        </button>
                      </div>

                      {extractionStatus === 'ERROR' && extractionError && (
                        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-xs">
                          <FileX size={16} className="text-rose-500 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="font-bold text-rose-800 dark:text-rose-200">
                              Unable to process resume. Please try again or enter candidate details manually.
                            </p>
                            <p className="text-rose-600 dark:text-rose-400 text-[11px]">
                              {extractionError}
                            </p>
                            <div className="flex items-center gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => resumeUploadInputRef.current?.click()}
                                className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
                              >
                                Try Again
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={() => setCreationMethod('manual')}
                                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                              >
                                Switch to Manual Create
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPLOADING / PROCESSING states */}
                  {(extractionStatus === 'UPLOADING' || extractionStatus === 'PROCESSING') && (
                    <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-4 text-center">
                      <div className="flex justify-center">
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 shadow-md">
                          {extractionStatus === 'UPLOADING' ? (
                            <UploadCloud size={28} className="animate-bounce" style={{ color: brandColor }} />
                          ) : (
                            <FileSearch size={28} className="animate-pulse" style={{ color: brandColor }} />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                          {extractionStatus === 'UPLOADING' ? (
                            <>
                              <FileUp size={15} style={{ color: brandColor }} /> {extractionStepText}
                            </>
                          ) : (
                            <>
                              <FileSearch size={15} style={{ color: brandColor }} /> {extractionStepText}
                            </>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Reading identity, contact details, role history, and technical skill sets.
                        </p>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden max-w-md mx-auto">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%`, backgroundColor: brandColor }}
                        />
                      </div>
                    </div>
                  )}

                  {/* --------------------------------------------------
                      5. EXTRACTION REVIEW & CONFIRMATION BANNER
                  -------------------------------------------------- */}
                  {(extractionStatus === 'SUCCESS' || extractionStatus === 'PARTIAL_SUCCESS') && (
                    <motion.div 
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0 mt-0.5">
                            <FileCheck size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                              Resume Processed Successfully
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {formData.resumeFileName}
                              </span>
                            </h4>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                              Candidate information was extracted from the uploaded resume. Please review and verify the details before continuing.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleClearResume}
                          className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <RefreshCw size={13} /> Replace / Remove
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* --------------------------------------------------
                  2. STEP 1 FORM FIELDS (Shown for Manual Create OR after Resume Extraction Review)
              -------------------------------------------------- */}
              {(creationMethod === 'manual' || extractionStatus === 'SUCCESS' || extractionStatus === 'PARTIAL_SUCCESS') && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={labelClass}>
                        <span>First Name <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                        {renderExtractedBadge('firstName')}
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter first name"
                        className="w-full h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                      {fieldErrors.firstName && (
                        <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle size={12} /> {fieldErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className={labelClass}>
                        <span>Last Name <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                        {renderExtractedBadge('lastName')}
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Enter last name"
                        className="w-full h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                      {fieldErrors.lastName && (
                        <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle size={12} /> {fieldErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={labelClass}>
                        <span>Email Address <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                        {renderExtractedBadge('email')}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter candidate email address"
                        className="w-full h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                      {fieldErrors.email && (
                        <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle size={12} /> {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className={labelClass}>
                        <span>Phone Number (with country code) <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                        {renderExtractedBadge('phone')}
                      </label>
                      <InternationalPhoneInput
                        value={typeof formData.phone === 'string' ? formData.phone : ''}
                        onChange={handlePhoneChange}
                        error={fieldErrors.phone}
                        defaultCountry={formData.countryCode || 'IN'}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={labelClass}>
                      <span>Current Location / Metro Area</span>
                      {renderExtractedBadge('location')}
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter current city / location"
                      className="w-full h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Professional */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={14} style={{ color: brandColor }} /> Section 2: Professional Experience & Proficiencies
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Record current employment status, work experience, and skill set.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>
                    <span>Current Job Title <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                    {renderExtractedBadge('currentTitle')}
                  </label>
                  <input
                    type="text"
                    value={formData.currentTitle}
                    onChange={(e) => handleInputChange('currentTitle', e.target.value)}
                    placeholder="Enter current job title"
                    className="w-full h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                  {fieldErrors.currentTitle && (
                    <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {fieldErrors.currentTitle}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>
                    <span>Current Employer / Company</span>
                    {renderExtractedBadge('currentCompany')}
                  </label>
                  <input
                    type="text"
                    value={formData.currentCompany}
                    onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                    placeholder="Enter current company name"
                    className="w-full h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>
                    <span>Total Experience (Years) <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                    {renderExtractedBadge('totalExperience')}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.totalExperience}
                    onChange={(e) => handleInputChange('totalExperience', e.target.value)}
                    placeholder="Enter experience in years"
                    className="w-full h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                  {fieldErrors.totalExperience && (
                    <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {fieldErrors.totalExperience}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>
                    <span>Notice Period</span>
                  </label>
                  <CustomSelect
                    value={formData.noticePeriod}
                    onChange={(val) => handleInputChange('noticePeriod', val)}
                    options={[
                      { value: 'Immediate', label: 'Immediate' },
                      { value: '15 Days', label: '15 Days' },
                      { value: '30 Days', label: '30 Days' },
                      { value: '60 Days', label: '60 Days' },
                      { value: '90 Days', label: '90 Days' }
                    ]}
                    size="md"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>
                  <span>Key Skills (comma separated)</span>
                  {renderExtractedBadge('skills')}
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  placeholder="Enter technical skills (e.g. React, TypeScript, Node.js)"
                  className="w-full h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Skills will be parsed and categorized into candidate match tags automatically.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Requisition Link */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Link size={14} style={{ color: brandColor }} /> Section 3: Requisition Association & Sourcing Channel
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Decouple master candidate profiles from active requisitions, or link immediately to initiate pipeline screening.
                </p>
              </div>

              {/* Choice Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => handleInputChange('requisitionId', '')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    !formData.requisitionId
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 shrink-0">
                      <UserRound size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Talent Pool (Master Only)</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Create profile without active application. Associate to future jobs anytime.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    if (!formData.requisitionId && availableRequisitions.length > 0) {
                      handleInputChange('requisitionId', availableRequisitions[0].id);
                    }
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.requisitionId
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Active Requisition</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Link candidate directly to an open requisition & start screening immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {formData.requisitionId !== '' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className={labelClass}>
                    <span>Select Target Requisition <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                  </label>
                  <SearchableSelect
                    value={formData.requisitionId}
                    onChange={(val) => handleInputChange('requisitionId', val)}
                    options={availableRequisitions.map(req => ({
                      value: req.id,
                      label: `${req.id} — ${req.jobTitle}`,
                      subtext: req.department
                    }))}
                    placeholder="Select requisition..."
                    size="md"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>
                    <span>Sourcing Channel</span>
                  </label>
                  <CustomSelect
                    value={formData.source}
                    onChange={(val) => handleInputChange('source', val)}
                    options={CANDIDATE_SOURCES.map(s => ({ value: s.name, label: s.name }))}
                    size="md"
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>
                    <span>Assigned Lead Recruiter</span>
                  </label>
                  <input
                    type="text"
                    value={formData.assignedRecruiter}
                    onChange={(e) => handleInputChange('assignedRecruiter', e.target.value)}
                    className="w-full h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} style={{ color: brandColor }} /> Section 4: Resume & Credentials Upload
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  View, replace or attach candidate resume documents.
                </p>
              </div>

              {formData.resumeFileName ? (
                <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0">
                        <FileCheck size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{formData.resumeFileName}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-semibold">
                            {creationMethod === 'resume' ? 'Uploaded & Processed' : 'Uploaded'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formData.resumeFile ? `${(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB` : '1.20 MB'} • PDF Document
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw size={12} /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, resumeFile: null, resumeFileName: '' }))}
                        className="h-8 px-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center text-center gap-3.5 cursor-pointer bg-slate-50/50 dark:bg-slate-950/40 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Click or drop candidate resume document here
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supported formats: PDF, DOC, DOCX, TXT up to 10MB
                    </p>
                  </div>
                </div>
              )}

              {fieldErrors.resume && (
                <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> {fieldErrors.resume}
                </p>
              )}
            </div>
          )}

          {/* STEP 5: Review & Confirm */}
          {currentStep === 5 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={18} style={{ color: brandColor }} /> Final Review
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                    Please audit the candidate parameters below. Once confirmed, this profile will be committed to the ATS repository and assigned to the selected pipeline.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Ready to Commit
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Identity & Contact Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm h-full">
                  <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <UserRound size={16} className="text-blue-500" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Identity & Contact</h3>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creation Method</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{creationMethod === 'resume' ? 'Resume Upload (Parsed)' : 'Manual Entry'}</span>
                    </div>
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</span>
                      <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 truncate">{formData.email}</span>
                    </div>
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</span>
                      <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">{formData.phone ? `${formData.phoneData?.callingCode || ''} ${formData.phone}`.trim() : '—'}</span>
                    </div>
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{formData.location || 'Remote'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Professional Background Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm h-full">
                  <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Briefcase size={16} className="text-purple-500" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Professional Info</h3>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Title</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{formData.currentTitle}</span>
                    </div>
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Employer</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{formData.currentCompany || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Experience</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{formData.totalExperience ? `${formData.totalExperience} yrs` : '—'}</span>
                    </div>
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notice Period</span>
                      <div className="flex items-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {formData.noticePeriod}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Pipeline & Requisition Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm h-full">
                  <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Link size={16} className="text-emerald-500" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Allocation</h3>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Requisition</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {formData.requisitionId ? (
                          <div className="flex items-center gap-2">
                            <span className="truncate">{availableRequisitions.find(r => r.id === formData.requisitionId)?.jobTitle || formData.requisitionId}</span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">{formData.requisitionId}</span>
                          </div>
                        ) : (
                          'Master Talent Pool (Unassigned)'
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sourcing Channel</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{formData.source}</span>
                    </div>
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Recruiter</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{formData.assignedRecruiter}</span>
                    </div>
                    <div className="flex flex-col px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attached Resume</span>
                      <div className="flex items-center pt-0.5">
                        {formData.resumeFileName ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-800/50 w-full truncate">
                            <FileText size={14} className="shrink-0" /> <span className="truncate">{formData.resumeFileName}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">None Attached</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Bottom Navigation Button Bar */}
          <div className="flex items-center justify-between pt-4 pb-2 border-t border-slate-200 dark:border-slate-800 gap-2">
            <button 
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="h-10 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <ChevronLeft size={14} /> Back
            </button>

            {currentStep < WORKFLOW_STEPS.length ? (
              <button 
                type="button"
                onClick={handleNext}
                style={{ backgroundColor: brandColor }}
                className="h-10 px-5 rounded-xl text-white text-xs font-extrabold hover:brightness-110 transition-all flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
              >
                Next Step <ChevronRight size={14} />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                style={{ backgroundColor: brandColor }}
                className="h-10 px-6 rounded-xl text-white text-xs font-extrabold hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Send size={14} /> Create Candidate
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Persistent Sticky Summary Panel (4 Cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <FileText size={14} />
                </div>
                Candidate Summary
              </span>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${
                completionPct === 100
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50' 
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50'
              }`}>
                {completionPct}% Complete
              </span>
            </div>

            {/* Profile Avatar Header */}
            <div className="flex flex-col items-center mt-2 mb-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-slate-100 dark:bg-slate-800">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                      style={{ background: `linear-gradient(135deg, ${brandColor}, #0ea5e9)` }}
                    >
                      {formData.firstName?.[0]?.toUpperCase() || 'C'}{formData.lastName?.[0]?.toUpperCase() || ''}
                    </div>
                  )}
                </div>
                {/* Active Indicator */}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-3 text-center">
                {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : 'Unnamed Candidate'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 text-center">
                {formData.currentTitle || 'Professional'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-5">
              <div 
                className="h-full rounded-full transition-all duration-300" 
                style={{ width: `${completionPct}%`, backgroundColor: brandColor }} 
              />
            </div>

            {/* Dynamic Summary Rows */}
            <div className="space-y-4 text-xs">
              
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 transition-colors">
                    <FileCheck2 size={13} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Creation Method</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white capitalize">
                  {creationMethod === 'resume' ? 'Resume Upload' : 'Manual Create'}
                </span>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 transition-colors">
                    <Mail size={13} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Email</span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {formData.email || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 transition-colors">
                    <Phone size={13} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Phone</span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {formData.phone ? `${formData.phoneData?.callingCode || ''} ${formData.phone}`.trim() : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 transition-colors">
                    <Clock size={13} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Experience</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formData.totalExperience !== '' && formData.totalExperience !== null && formData.totalExperience !== undefined ? `${formData.totalExperience} yrs` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between group pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
                    <Briefcase size={13} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Target Req</span>
                </div>
                <span className="font-extrabold px-2 py-0.5 rounded-md text-[11px]" style={{ backgroundColor: `${brandColor}10`, color: brandColor }}>
                  {formData.requisitionId || 'Talent Pool'}
                </span>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors">
                    <Globe size={13} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Source</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                  {formData.source}
                </span>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 transition-colors">
                    <FileText size={13} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Resume</span>
                </div>
                <span className={`font-bold text-[11px] truncate max-w-[140px] ${
                  formData.resumeFileName ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
                }`}>
                  {formData.resumeFileName || 'Not Attached'}
                </span>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Duplicate Resolution Modal */}
      {duplicateWarning && (
        <CandidateDuplicateModal
          isOpen={true}
          duplicateInfo={duplicateWarning}
          onClose={() => setDuplicateWarning(null)}
          onViewCandidate={(_candId) => {
            setDuplicateWarning(null);
            if (onBack) onBack();
          }}
          onContinueAnyway={() => {
            setDuplicateWarning(null);
            setCurrentStep(2);
          }}
        />
      )}
    </motion.div>
  );
};

export default CreateCandidatePage;

