import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, FileUp, Files, FolderArchive, Mail, CheckCircle2, AlertTriangle, 
  XCircle, Loader2, ArrowRight, UploadCloud, RefreshCw, UserCheck, Building2, Briefcase, Eye, FileText, Download, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { INTAKE_SOURCES, checkDuplicateCandidate, calculateScreeningScore } from './resumeIntakeMockData';
import { extractTextFromFile, parseResumeText, mapParsedDataToCandidateModel } from './resumeParserEngine';
import { DocumentSecurityService } from '../../../services/security/DocumentSecurityService';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import SearchableSelect from '../../dashboard/shared/SearchableSelect';


const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const AddResumeModal = ({ isOpen, onClose, onSaveResumes, requisitions = [], jds = [], initialTab = 'single_upload' }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || 'var(--pw-brand)';

  const [activeTab, setActiveTab] = useState(initialTab); // single_upload | bulk_upload | email_import
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processingState, setProcessingState] = useState('idle'); // idle | uploading | processing | parsing | duplicate_check | completed
  const [processingProgress, setProcessingProgress] = useState(0);
  const [fileStatuses, setFileStatuses] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [previewingFile, setPreviewingFile] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Association options
  const [associationMode, setAssociationMode] = useState('unassigned'); // unassigned | requisition
  const [selectedReqId, setSelectedReqId] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');

  // Email Import state
  const [emailInbox, setEmailInbox] = useState('careers-inbound@peopleworks.com');
  const [isSyncingEmail, setIsSyncingEmail] = useState(false);
  const [emailSyncResult, setEmailSyncResult] = useState(null);

  const fileInputRef = useRef(null);

  // Create Object URL for actual uploaded file preview
  const actualFileUrl = useMemo(() => {
    if (previewingFile && previewingFile.file && previewingFile.file instanceof File) {
      try {
        return URL.createObjectURL(previewingFile.file);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  }, [previewingFile]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'single_upload');
      setSelectedFiles([]);
      setProcessingState('idle');
      setProcessingProgress(0);
      setFileStatuses([]);
      setValidationError('');
      setAssociationMode('unassigned');
      setSelectedReqId('');
      setSelectedJdId('');
      setEmailSyncResult(null);
    }
  }, [isOpen, initialTab]);

  const targetContainer = typeof document !== 'undefined' ? document.body : null;
  if (!isOpen || !targetContainer) return null;

  // Filter eligible requisitions (Approved, Open)
  const eligibleRequisitions = requisitions.filter(r => r.status === 'Open' || r.status === 'Approved');
  const availableJds = jds.filter(j => j.reqId === selectedReqId);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, message: `Unsupported file format (${ext}). Please upload PDF, DOC, or DOCX.` };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, message: `File exceeds maximum allowed size of 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB).` };
    }
    if (file.size === 0) {
      return { valid: false, message: 'Uploaded file is empty (0 bytes).' };
    }
    if (file.name.toLowerCase().includes('corrupt')) {
      return { valid: false, message: 'Document is corrupted and could not be read.' };
    }
    if (file.name.toLowerCase().includes('protected')) {
      return { valid: false, message: 'Password-protected documents cannot be processed automatically.' };
    }
    return { 
      valid: true, 
      message: 'Valid document',
      sanitizedName: DocumentSecurityService.sanitizeFilename(file.name)
    };
  };


  const handleFileSelect = (filesList) => {
    setValidationError('');
    const filesArray = Array.from(filesList);

    if (activeTab === 'single_upload' && filesArray.length > 1) {
      setValidationError('Please select a single resume document, or switch to Bulk Upload.');
      return;
    }

    if (activeTab === 'bulk_upload' && filesArray.length > 50) {
      setValidationError('Bulk upload count exceeds maximum allowed limit of 50 files per batch.');
      return;
    }

    if (activeTab === 'zip_upload') {
      const isZip = filesArray.some(f => f.name.endsWith('.zip') || f.name.endsWith('.tar.gz'));
      if (!isZip) {
        setValidationError('Invalid archive file. Please upload a valid .ZIP file.');
        return;
      }
    }

    // Validate files
    const validatedList = filesArray.map((file, idx) => {
      const v = validateFile(file);
      return {
        id: `FILE-${Date.now()}-${idx}`,
        file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        valid: v.valid,
        error: v.valid ? null : v.message,
        status: v.valid ? 'Ready' : 'Failed' // Ready | Uploading | Parsing | Completed | Failed | Duplicate
      };
    });

    setSelectedFiles(filesArray);
    setFileStatuses(validatedList);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const startProcessingPipeline = async () => {
    if (fileStatuses.length === 0 || fileStatuses.every(f => !f.valid)) {
      setValidationError('Please select at least one valid resume file before continuing.');
      return;
    }

    setProcessingState('uploading');
    setProcessingProgress(15);

    try {
      const validFileItems = fileStatuses.filter(f => f.valid);
      const newResumes = [];
      const totalCount = validFileItems.length;

      setProcessingState('processing');
      setFileStatuses(prev => prev.map(f => f.valid ? { ...f, status: 'Parsing' } : f));

      const reqObj = eligibleRequisitions.find(r => r.id === selectedReqId);
      const jdObj = availableJds.find(j => j.id === selectedJdId);

      for (let i = 0; i < validFileItems.length; i++) {
        const fItem = validFileItems[i];
        const progressVal = Math.min(90, 20 + Math.round(((i + 1) / totalCount) * 60));
        setProcessingProgress(progressVal);

        const rawText = await extractTextFromFile(fItem.file);
        const parsedData = parseResumeText(rawText, fItem.name);
        const candidateModel = mapParsedDataToCandidateModel(parsedData, selectedReqId);

        const candidateName = candidateModel.candidateName || candidateModel.name;
        const mockEmail = candidateModel.email;
        
        const dupCheck = checkDuplicateCandidate(mockEmail, candidateName, []);
        const isDuplicate = !!(dupCheck && dupCheck.isDuplicate);
        
        const candidateSkills = candidateModel.skills || [];
        const reqSkillsStr = reqObj?.skills || 'React, JavaScript, Testing';
        const screeningScoreVal = calculateScreeningScore(candidateSkills, reqSkillsStr);

        const fullResume = {
          ...candidateModel,
          id: `RES-${Date.now()}-${i}`,
          candidateId: candidateModel.id || `CAND-${Math.floor(100 + Math.random() * 900)}`,
          source: INTAKE_SOURCES.find(s => s.id === activeTab)?.name || 'Single File Upload',
          uploadedBy: 'Current User',
          uploadedAt: new Date().toISOString(),
          fileName: fItem.name,
          fileSize: fItem.size,
          fileType: fItem.file?.type || 'application/pdf',
          processingStatus: isDuplicate ? 'Duplicate Review' : (reqObj ? 'Screened' : 'Parsed'),
          requisitionId: reqObj ? reqObj.id : null,
          requisitionTitle: reqObj ? reqObj.jobTitle : 'Unassigned / Talent Pool',
          jdId: jdObj ? jdObj.id : null,
          jdTitle: jdObj ? jdObj.title : null,
          jdVersion: jdObj ? 'v1' : null,
          owner: 'Current User',
          isDuplicate: isDuplicate,
          duplicateInfo: isDuplicate ? {
            matchScore: 95,
            existingCandidateId: dupCheck?.matchedCandidate?.candidateId || 'CAND-101',
            existingCandidateName: dupCheck?.matchedCandidate?.candidateName || candidateName,
            existingEmail: mockEmail,
            existingPhone: candidateModel.phone || '+1 (555) 234-5678',
            existingRequisition: dupCheck?.matchedCandidate?.requisitionId || 'Unassigned',
            matchReasons: ['Matching candidate email']
          } : null,
          screeningScore: reqObj ? screeningScoreVal : (candidateModel.screeningScore || 85),
          screeningOutcome: screeningScoreVal >= 80 ? 'Strong Match' : (screeningScoreVal >= 60 ? 'Good Match' : 'Needs Review'),
          auditTrail: [
            { id: 1, action: 'Resume Uploaded', actor: 'Current User', role: 'Recruiter', timestamp: new Date().toISOString(), details: `Uploaded via ${activeTab}` },
            { id: 2, action: 'Parsing Completed', actor: 'AI Parser', role: 'System', timestamp: new Date().toISOString(), details: 'Parsed candidate skills and metadata' }
          ]
        };

        newResumes.push(fullResume);
      }

      setProcessingState('duplicate_check');
      setProcessingProgress(95);

      setProcessingProgress(100);
      setProcessingState('completed');

      setTimeout(() => {
        onSaveResumes(newResumes);
        onClose();
      }, 300);
    } catch (err) {
      console.error("Failed to parse resume files:", err);
      setValidationError("Failed to process resume files. Please ensure files are unencrypted.");
      setProcessingState('idle');
    }
  };

  const triggerEmailSync = () => {
    setIsSyncingEmail(true);
    setEmailSyncResult(null);
    setTimeout(() => {
      setIsSyncingEmail(false);
      setEmailSyncResult({
        count: 2,
        messages: ['Imported 2 resumes from inbound mailbox: Priya_Sharma_Resume.pdf, Alex_Rivera_Resume.pdf']
      });
    }, 1200);
  };


  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in" dir="ltr">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 border"
              style={{ backgroundColor: `${brandColor}15`, color: brandColor, borderColor: `${brandColor}30` }}
            >
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Add Candidate Resumes</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ingest, parse, and process candidate resumes into ATS repository</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Intake Source Option Tabs */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'single_upload', label: 'Single Upload', icon: <FileUp className="w-4 h-4" /> },
              { id: 'bulk_upload', label: 'Bulk Upload', icon: <Files className="w-4 h-4" /> },
              { id: 'zip_upload', label: 'ZIP Upload', icon: <FolderArchive className="w-4 h-4" /> },
              { id: 'email_import', label: 'Email Import', icon: <Mail className="w-4 h-4" /> }
            ].map((source) => {
              const isActive = activeTab === source.id;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(source.id);
                    setSelectedFiles([]);
                    setFileStatuses([]);
                    setValidationError('');
                  }}
                  style={isActive ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                  className={`flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                    isActive 
                      ? 'text-white shadow-2xs font-bold' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {source.icon}
                  <span>{source.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5">
          {/* Validation Alert */}
          {validationError && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs">
              <XCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Tab 1, 2, 3: File Dropzone */}
          {activeTab !== 'email_import' ? (
            <div className="space-y-4">
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer text-center ${
                  dragActive 
                    ? 'border-brand bg-brand/10 dark:bg-brand/20' 
                    : 'border-slate-300 dark:border-slate-700 hover:border-brand/60 bg-slate-50/50 dark:bg-slate-900/30'
                }`}
              >
                <input 
                  ref={fileInputRef}
                  type="file"
                  multiple={activeTab !== 'single_upload'}
                  accept={activeTab === 'zip_upload' ? '.zip,.tar.gz' : '.pdf,.doc,.docx'}
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                />
                
                <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {activeTab === 'single_upload' && 'Click to upload or drag & drop a resume'}
                  {activeTab === 'bulk_upload' && 'Click to upload multiple resumes (up to 50 files)'}
                  {activeTab === 'zip_upload' && 'Click to upload a ZIP archive containing resumes'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {activeTab === 'zip_upload' ? 'Supported formats: .ZIP, .TAR.GZ' : 'Supported formats: PDF, DOC, DOCX (Max 10MB per file)'}
                </p>
              </div>

              {/* Selected Files List & Per-File Status */}
              {fileStatuses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
                    <span>Selected Files ({fileStatuses.length})</span>
                    <span>Valid: {fileStatuses.filter(f => f.valid).length}</span>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {fileStatuses.map((item) => (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                          item.valid 
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' 
                            : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.valid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <div className="truncate">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-400">{item.size} {item.error && `• ${item.error}`}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.valid && (
                            <button
                              type="button"
                              onClick={() => {
                                setZoomLevel(100);
                                setPreviewingFile(item);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Preview Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                            item.status === 'Ready' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                            item.status === 'Parsing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse' :
                            item.status === 'Failed' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab 4: Email Import Config & Trigger */
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Inbound Mailbox Auto-Import</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Resumes sent to your designated ATS email are automatically parsed & screened</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <input 
                  type="email" 
                  value={emailInbox}
                  onChange={(e) => setEmailInbox(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
                <button
                  type="button"
                  onClick={triggerEmailSync}
                  disabled={isSyncingEmail}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSyncingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Sync Inbound Mailbox Now</span>
                </button>
              </div>

              {emailSyncResult && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Email Sync Successful</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">{emailSyncResult.messages[0]}</p>
                </div>
              )}
            </div>
          )}

          {/* Association Options: Talent Pool vs Requisition */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Requisition & Job Association (Optional)</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                onClick={() => setAssociationMode('unassigned')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  associationMode === 'unassigned' 
                    ? 'border-brand bg-brand/5 text-slate-900 dark:text-white shadow-xs' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <input 
                  type="radio" 
                  name="assocMode" 
                  checked={associationMode === 'unassigned'} 
                  onChange={() => setAssociationMode('unassigned')}
                  className="text-brand focus:ring-brand"
                />
                <div>
                  <p className="font-bold">Unassigned / Talent Pool</p>
                  <p className="text-[11px] text-slate-400 font-normal">Store for future sourcing across all open roles</p>
                </div>
              </label>

              <label 
                onClick={() => setAssociationMode('requisition')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  associationMode === 'requisition' 
                    ? 'border-brand bg-brand/5 text-slate-900 dark:text-white shadow-xs' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <input 
                  type="radio" 
                  name="assocMode" 
                  checked={associationMode === 'requisition'} 
                  onChange={() => setAssociationMode('requisition')}
                  className="text-brand focus:ring-brand"
                />
                <div>
                  <p className="font-bold">Associate with Requisition</p>
                  <p className="text-[11px] text-slate-400 font-normal">Link directly to a specific open job vacancy</p>
                </div>
              </label>
            </div>

            {associationMode === 'requisition' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Select Active Requisition</label>
                  <SearchableSelect
                    value={selectedReqId}
                    onChange={(val) => {
                      setSelectedReqId(val);
                      setSelectedJdId('');
                    }}
                    options={[
                      { value: '', label: '-- Choose Requisition --' },
                      ...eligibleRequisitions.map(r => ({
                        value: r.id,
                        label: `${r.id} - ${r.jobTitle}`,
                        subtext: r.department
                      }))
                    ]}
                    placeholder="Choose Requisition..."
                    size="md"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Associated Job Description</label>
                  <CustomSelect
                    value={selectedJdId}
                    onChange={(val) => setSelectedJdId(val)}
                    disabled={!selectedReqId}
                    options={[
                      { value: '', label: '-- Choose JD --' },
                      ...availableJds.map(j => ({ value: j.id, label: `${j.id} - ${j.title} (v3)` }))
                    ]}
                    placeholder="Choose JD..."
                    size="md"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Processing Progress Bar */}
          {processingState !== 'idle' && (
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  <span className="capitalize">{processingState.replace('_', ' ')}...</span>
                </span>
                <span>{processingProgress}%</span>
              </div>

              <div className="w-full h-2 bg-blue-200/60 dark:bg-blue-900/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand transition-all duration-300 rounded-full"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-center"
          >
            Cancel
          </button>

          {activeTab !== 'email_import' && (
            <button
              type="button"
              onClick={startProcessingPipeline}
              disabled={processingState !== 'idle' || fileStatuses.length === 0}
              style={{ backgroundColor: brandColor }}
              className="w-full sm:w-auto px-5 py-2.5 hover:brightness-110 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {processingState !== 'idle' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Process & Ingest Resumes</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Document Preview Modal */}
      {previewingFile && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-fade-in-up font-sans">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-950/90">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border"
                  style={{ backgroundColor: `${brandColor}15`, color: brandColor, borderColor: `${brandColor}30` }}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {previewingFile.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {previewingFile.size} • PDF Document Reader
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 rounded-xl p-0.5 text-xs font-semibold border border-slate-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(75, prev - 15))}
                    className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="px-2 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
                    className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewingFile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Preview Viewport */}
            <div className="flex-1 overflow-auto p-6 bg-slate-100/80 dark:bg-slate-950 flex justify-center items-start scrollbar-thin">
              {actualFileUrl && (previewingFile.name.toLowerCase().endsWith('.pdf') || previewingFile.file?.type === 'application/pdf') ? (
                <div 
                  className="w-full max-w-3xl h-[650px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/90 transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                >
                  <iframe 
                    src={actualFileUrl} 
                    className="w-full h-full border-0 rounded-2xl" 
                    title={previewingFile.name}
                  />
                </div>
              ) : actualFileUrl && previewingFile.file?.type?.startsWith('image/') ? (
                <div 
                  className="w-full max-w-3xl flex justify-center items-center p-4 bg-slate-900/50 rounded-2xl shadow-2xl transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                >
                  <img 
                    src={actualFileUrl} 
                    alt={previewingFile.name} 
                    className="max-w-full max-h-[650px] object-contain rounded-xl shadow-lg"
                  />
                </div>
              ) : (
                <div 
                  className="w-full max-w-2xl bg-white text-slate-900 shadow-2xl rounded-2xl p-8 border border-slate-200/90 space-y-5 transition-transform duration-200 font-sans"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                >
                  {/* Simulated Document Sheet */}
                  <div className="border-b border-slate-200 pb-4 flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        {previewingFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ").toUpperCase()}
                      </h1>
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        Filename: {previewingFile.name} • Size: {previewingFile.size} • Type: {previewingFile.file?.type || 'Resume Document'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      DOCUMENT READY
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">Parsed Document Contents</h2>
                    <p className="text-xs text-slate-700 leading-relaxed font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                      [Document Reader: Successfully ingested and verified "{previewingFile.name}" ({previewingFile.size}). Content parsed for candidate skills, experience years, contact info, and requisition matching.]
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">Extracted Candidate Profile</h2>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Candidate Name</span>
                        <span className="font-bold text-slate-900">{previewingFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ")}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                        <span className="font-bold text-emerald-600">Valid & Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">Extracted Key Skills</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {['Automated Testing', 'Quality Assurance', 'Software Engineering', 'CI/CD Pipelines', 'Problem Solving', 'Team Leadership'].map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-800 rounded border border-slate-200 font-mono">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Document verified & ready for ingest
              </span>
              <button
                type="button"
                onClick={() => setPreviewingFile(null)}
                style={{ backgroundColor: brandColor }}
                className="px-4 py-2 text-white font-bold text-xs rounded-xl shadow-2xs hover:brightness-110 cursor-pointer"
              >
                Done Previewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    targetContainer
  );
};

export default AddResumeModal;
