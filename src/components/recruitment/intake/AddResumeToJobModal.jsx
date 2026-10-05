import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Briefcase, FileText, UploadCloud, CheckCircle2, AlertTriangle, 
  Loader2, ArrowRight, ArrowLeft, Building2, Check, ShieldAlert
} from 'lucide-react';
import { checkDuplicateCandidate, calculateScreeningScore } from './resumeIntakeMockData';
import { ThemeContext } from '../../../ThemeContext';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const AddResumeToJobModal = ({ isOpen, onClose, onSaveResumes, requisitions: propRequisitions = [], jds: propJds = [], resume, onAssign }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || 'var(--pw-brand)';

  const [step, setStep] = useState(1); // 1: Select Requisition | 2: Select JD | 3: Upload & Process
  const [selectedReqId, setSelectedReqId] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');
  
  const [requisitions, setRequisitions] = useState(propRequisitions);
  const [jds, setJds] = useState(propJds);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState('');

  const fileInputRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedReqId('');
      setSelectedJdId('');
      setSelectedFiles([]);
      setValidationError('');
      setIsProcessing(false);

      if (propRequisitions.length === 0) {
         try {
           const stored = sessionStorage.getItem('pw_requisitions');
           if (stored) setRequisitions(JSON.parse(stored));
         } catch (e) {}
      } else {
         setRequisitions(propRequisitions);
      }
      if (propJds.length === 0) {
         try {
           const storedJds = sessionStorage.getItem('pw_jds');
           if (storedJds) setJds(JSON.parse(storedJds));
         } catch (e) {}
      } else {
         setJds(propJds);
      }
    }
  }, [isOpen, propRequisitions, propJds]);

  if (!isOpen) return null;

  // Filter ONLY eligible requisitions: Approved, Open
  const eligibleRequisitions = requisitions.filter(r => r.status === 'Open' || r.status === 'Approved');
  const selectedReqObj = requisitions.find(r => r.id === selectedReqId);

  // Filter JDs for selected Requisition
  const matchingJds = jds.filter(j => j.reqId === selectedReqId);
  const selectedJdObj = jds.find(j => j.id === selectedJdId);

  const handleFileSelect = (filesList) => {
    setValidationError('');
    const filesArray = Array.from(filesList);
    const valid = filesArray.filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return ALLOWED_EXTENSIONS.includes(ext) && f.size <= 10 * 1024 * 1024;
    });

    if (valid.length === 0) {
      setValidationError('Please select valid PDF, DOC, or DOCX resumes under 10MB.');
      return;
    }
    setSelectedFiles(valid);
  };

  const handleProcessJobResumes = () => {
    if (!selectedReqId || !selectedJdId || selectedFiles.length === 0) {
      setValidationError('Please complete all steps and select at least one valid resume.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const newResumes = selectedFiles.map((file, idx) => {
        const namePart = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ");
        const candidateName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const mockEmail = candidateName.toLowerCase().replace(/\s+/g, ".") + "@example.com";

        const dupResult = checkDuplicateCandidate({ email: mockEmail });
        const candidateObj = {
          candidateName,
          email: mockEmail,
          experienceYears: selectedReqObj?.experienceMin || 5.0,
          location: selectedReqObj?.location || 'Remote',
          skills: selectedReqObj?.skills ? selectedReqObj.skills.split(',') : ['React', 'JavaScript']
        };

        const screening = calculateScreeningScore(candidateObj, selectedReqObj, selectedJdObj);

        return {
          id: `RES-${Date.now()}-${idx}`,
          candidateId: `CAND-${Math.floor(100 + Math.random() * 900)}`,
          candidateName,
          email: mockEmail,
          phone: '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
          location: selectedReqObj?.location || 'San Francisco, CA',
          currentCompany: 'Technology Enterprise',
          currentTitle: selectedReqObj?.jobTitle || 'Software Engineer',
          totalExperience: '5.0 yrs',
          experienceYears: 5.0,
          skills: candidateObj.skills,
          education: 'B.S. Computer Science',
          certifications: ['Certified Professional'],
          source: 'Requisition Intake',
          uploadedBy: 'Current Recruiter',
          uploadedAt: new Date().toISOString(),
          fileName: file.name,
          fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          fileType: 'application/pdf',
          processingStatus: dupResult.isDuplicate ? 'Duplicate Review' : 'Screened',
          requisitionId: selectedReqObj.id,
          requisitionTitle: selectedReqObj.jobTitle,
          jdId: selectedJdObj.id,
          jdTitle: selectedJdObj.title,
          jdVersion: 'v3',
          owner: 'Current Recruiter',
          isDuplicate: dupResult.isDuplicate,
          duplicateInfo: dupResult.isDuplicate ? {
            matchScore: 96,
            existingCandidateId: dupResult.existing?.candidateId || 'CAND-101',
            existingCandidateName: dupResult.existing?.candidateName || candidateName,
            existingEmail: mockEmail,
            existingPhone: '+1 (555) 234-5678',
            existingRequisition: dupResult.existing?.requisitionId || selectedReqObj.id,
            matchReasons: dupResult.reasons
          } : null,
          screeningScore: screening.overall,
          screeningOutcome: screening.outcome,
          screeningBreakdown: screening,
          auditTrail: [
            { id: 1, action: 'Uploaded to Job Vacancy', actor: 'Current Recruiter', role: 'Recruiter', timestamp: new Date().toISOString(), details: `Direct intake for ${selectedReqObj.id} / ${selectedJdObj.id}` },
            { id: 2, action: 'Screened against JD', actor: 'Screening Engine', role: 'System', timestamp: new Date().toISOString(), details: `Generated ${screening.overall}% match score` }
          ]
        };
      });

      setIsProcessing(false);
      onSaveResumes(newResumes);
      onClose();
    }, 800);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in" dir="ltr">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-[#0f111a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 border"
              style={{ backgroundColor: `${brandColor}15`, color: brandColor, borderColor: `${brandColor}30` }}
            >
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Add Resume to Specific Job Vacancy</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Strict Recruiter Flow: Select Requisition → Select JD → Upload & Screen</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Header */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f111a]">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className={`flex items-center gap-1.5 sm:gap-2 text-xs font-bold ${step >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              <span 
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white`}
                style={step >= 1 ? { backgroundColor: brandColor } : { backgroundColor: '#cbd5e1' }}
              >
                1
              </span>
              <span>Requisition</span>
            </div>
            <div className={`h-0.5 flex-1 mx-2 sm:mx-3 ${step >= 2 ? 'bg-slate-700 dark:bg-slate-300' : 'bg-slate-200 dark:bg-slate-800'}`} style={step >= 2 ? { backgroundColor: brandColor } : {}} />
            <div className={`flex items-center gap-1.5 sm:gap-2 text-xs font-bold ${step >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              <span 
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white`}
                style={step >= 2 ? { backgroundColor: brandColor } : { backgroundColor: '#cbd5e1' }}
              >
                2
              </span>
              <span>Job Description</span>
            </div>
            <div className={`h-0.5 flex-1 mx-2 sm:mx-3 ${step >= 3 ? 'bg-slate-700 dark:bg-slate-300' : 'bg-slate-200 dark:bg-slate-800'}`} style={step >= 3 ? { backgroundColor: brandColor } : {}} />
            <div className={`flex items-center gap-1.5 sm:gap-2 text-xs font-bold ${step >= 3 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              <span 
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white`}
                style={step >= 3 ? { backgroundColor: brandColor } : { backgroundColor: '#cbd5e1' }}
              >
                3
              </span>
              <span>Upload & Ingest</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5">
          {validationError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: Select Requisition */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 1: Select Eligible Open Requisition</h3>
                <p className="text-xs text-slate-500">Only Approved or Open hiring requisitions are eligible for candidate assignment</p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {eligibleRequisitions.map((req) => {
                  const isSelected = selectedReqId === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => {
                        setSelectedReqId(req.id);
                        const safeJds = Array.isArray(jds) ? jds : [];
                        const matchingJd = safeJds.find(j => j.reqId === req.id);
                        if (matchingJd) setSelectedJdId(matchingJd.id);
                        else setSelectedJdId('');
                      }}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{req.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {req.status}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{req.jobTitle}</p>
                        <p className="text-[11px] text-slate-500">{req.department} • {req.location} • Hiring Mgr: {req.hiringManager}</p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Select Job Description */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 2: Select Approved Job Description</h3>
                <p className="text-xs text-slate-500">Connecting candidate to <span className="font-bold text-slate-800 dark:text-slate-200">{selectedReqObj?.id} — {selectedReqObj?.jobTitle}</span></p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {matchingJds.length > 0 ? (
                  matchingJds.map((jd) => {
                    const isSelected = selectedJdId === jd.id;
                    return (
                      <div
                        key={jd.id}
                        onClick={() => setSelectedJdId(jd.id)}
                        style={isSelected ? { borderColor: brandColor } : {}}
                        className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 shadow-xs' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{jd.id}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                              Active Version: {jd.version || 'v1'}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{jd.title}</p>
                          <p className="text-[11px] text-slate-500 font-mono">Skills: {jd.skills}</p>
                        </div>

                        <div 
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'text-white' : 'border-slate-300'}`}
                          style={isSelected ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center border border-dashed rounded-xl text-slate-400 text-xs">
                    No active JDs found for this requisition. System will automatically generate JD context during parsing.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Upload Resumes */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Target Assignment</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {selectedReqObj?.id} • {selectedReqObj?.jobTitle}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-mono">
                  {selectedJdObj?.id || 'Auto-generated JD'}
                </span>
              </div>

              {!resume ? (
                <>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-purple-500 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer text-center"
                  >
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      multiple 
                      accept=".pdf,.doc,.docx" 
                      onChange={handleFileSelect} 
                      className="hidden" 
                    />
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border"
                      style={{ backgroundColor: `${brandColor}15`, color: brandColor, borderColor: `${brandColor}30` }}
                    >
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Select Candidate Resume Files</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX up to 10MB per file</p>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Selected Resumes ({selectedFiles.length})
                      </p>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 sm:p-8 text-center border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
                   <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                   <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ready to Assign</h3>
                   <p className="text-xs text-slate-500">Candidate <strong>{resume.candidateName}</strong> will be assigned to <strong>{selectedReqObj?.jobTitle}</strong>.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !selectedReqId) {
                  setValidationError('Please select an active requisition to continue.');
                  return;
                }
                if (step === 2 && !selectedJdId) {
                  setValidationError('Please select a Job Description to continue.');
                  return;
                }
                setValidationError('');
                setStep(step + 1);
              }}
              style={{ backgroundColor: brandColor }}
              className="px-5 py-2 hover:brightness-110 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={resume ? () => { onAssign(selectedReqObj); onClose(); } : handleProcessJobResumes}
              disabled={isProcessing || (!resume && selectedFiles.length === 0)}
              style={{ backgroundColor: brandColor }}
              className="px-5 py-2.5 hover:brightness-110 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4" />
                  <span>{resume ? 'Assign Candidate' : 'Attach & Run Screening'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddResumeToJobModal;
