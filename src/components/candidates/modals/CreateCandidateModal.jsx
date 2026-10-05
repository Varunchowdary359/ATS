import React, { useState, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, Mail, Phone, MapPin, Briefcase, Building, DollarSign, 
  Calendar, FileText, Upload, Sparkles, AlertTriangle, CheckCircle2, Copy, FileUp, Plus, Lock, HelpCircle
} from 'lucide-react';
import { checkDuplicateCandidate } from '../../recruitment/intake/resumeIntakeMockData';
import { extractTextFromFile, parseResumeText, mapParsedDataToCandidateModel } from '../../recruitment/intake/resumeParserEngine';
import { INITIAL_REQUISITIONS } from '../../recruitment/recruitmentMockData';
import DuplicateResolutionModal from '../../recruitment/intake/DuplicateResolutionModal';
import { ThemeContext } from '../../../ThemeContext';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import SearchableSelect from '../../dashboard/shared/SearchableSelect';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const CreateCandidateModal = ({ isOpen, onClose, candidates = [], onSaveCandidate }) => {
  const { activeRole } = useContext(ThemeContext);

  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'resume'
  
  // Manual Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [location, setLocation] = useState('San Francisco, CA');
  const [address, setAddress] = useState('');
  
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [totalExperience, setTotalExperience] = useState('5.5 yrs');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [currentSalary, setCurrentSalary] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('San Francisco, CA');
  const [employmentType, setEmploymentType] = useState('Full-Time Permanent');
  
  const [skillsStr, setSkillsStr] = useState('React, JavaScript, Node.js');
  const [source, setSource] = useState('Direct Application');
  const [candidateOwner, setCandidateOwner] = useState(activeRole?.label || 'Sarah Jenkins');
  const [tagsStr, setTagsStr] = useState('Senior, High Priority');
  
  const [selectedReqId, setSelectedReqId] = useState('');
  const [manualFile, setManualFile] = useState(null);

  // Resume Upload State
  const [resumeFile, setResumeFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);

  // Validation & Duplicate State
  const [errors, setErrors] = useState({});
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validateManualForm = () => {
    const errs = {};
    if (!firstName.trim()) errs.firstName = 'First Name is required.';
    if (!lastName.trim()) errs.lastName = 'Last Name is required.';
    if (!email.trim()) {
      errs.email = 'Email Address is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errs.email = 'Enter a valid email address (e.g. name@company.com).';
    }
    if (phone && phone.trim().length < 7) {
      errs.phone = 'Enter a valid phone number.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleDuplicateCheck = (candEmail, candName) => {
    const checkResult = checkDuplicateCandidate({ email: candEmail, candidateName: candName }, candidates);
    if (checkResult.isDuplicate) {
      setDuplicateMatch(checkResult.matchedCandidate);
      return true;
    }
    setDuplicateMatch(null);
    return false;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!validateManualForm()) return;

    const candidateName = `${firstName.trim()} ${lastName.trim()}`;
    const isDup = handleDuplicateCheck(email.trim(), candidateName);
    if (isDup) return;

    const parsedData = {
      candidateName,
      email: email.trim(),
      phone: phone.trim() || '+1 (555) 234-5678',
      altPhone: altPhone.trim() || null,
      location: location.trim(),
      address: address.trim() || null,
      currentTitle: currentTitle.trim() || 'Software Engineer',
      currentCompany: currentCompany.trim() || 'Tech Corp',
      totalExperience: totalExperience.trim(),
      noticePeriod: noticePeriod.trim() || null,
      currentSalary: currentSalary.trim() ? `$${currentSalary.trim()}` : null,
      expectedSalary: expectedSalary.trim() ? `$${expectedSalary.trim()}` : null,
      preferredLocation: preferredLocation.trim() || null,
      employmentType,
      skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
      source,
      candidateOwner,
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
      fileName: manualFile ? manualFile.name : 'Candidate_Manual_Entry.pdf',
      fileSize: manualFile ? `${(manualFile.size / 1024 / 1024).toFixed(1)} MB` : '1.2 MB'
    };

    const newCandidateObj = mapParsedDataToCandidateModel(parsedData, selectedReqId);
    onSaveCandidate(newCandidateObj);
    onClose();
  };

  const handleResumeFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrors({ resume: `Unsupported file format (${ext}). Please upload PDF, DOC, DOCX, or TXT.` });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors({ resume: `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).` });
      return;
    }

    setErrors({});
    setResumeFile(file);
    setIsParsing(true);

    try {
      // 1. Real Text Extraction
      const rawText = await extractTextFromFile(file);
      
      // 2. Real Natural Language Parsing
      const fileSizeStr = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
      const parsed = parseResumeText(rawText, file.name, fileSizeStr);

      // 3. Create a persistent objectURL so the resume viewer can render the actual file
      const objectUrl = URL.createObjectURL(file);
      parsed.resumeObjectUrl = objectUrl;
      parsed.resumeMimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : '');

      if (!rawText || rawText.trim().length === 0) {
        setErrors({ resume: 'Uploaded file appears to be a scanned image or contains encrypted text. You can fill in the candidate details in the review fields below.' });
      }

      setParsedPreview(parsed);
      setIsParsing(false);

      // 4. Duplicate Check
      if (parsed.email && parsed.email !== 'N/A') {
        handleDuplicateCheck(parsed.email, parsed.candidateName);
      }
    } catch (err) {
      console.error(err);
      setIsParsing(false);
      setErrors({ resume: 'Unable to extract text from this file. Please verify file format or add candidate manually.' });
    }
  };

  const handleResumeSubmit = (e) => {
    e.preventDefault();
    if (!parsedPreview) return;

    // Validate mandatory candidate fields
    const errs = {};
    if (!parsedPreview.candidateName || parsedPreview.candidateName.trim() === 'N/A' || !parsedPreview.candidateName.trim()) {
      errs.resume = 'Candidate Name is required. Please fill in Full Name.';
    }
    if (!parsedPreview.email || parsedPreview.email.trim() === 'N/A' || !parsedPreview.email.trim()) {
      errs.resume = 'Email Address is required. Please fill in a valid Email.';
    } else if (parsedPreview.email !== 'N/A' && !EMAIL_REGEX.test(parsedPreview.email.trim())) {
      errs.resume = 'Enter a valid email address.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const isDup = handleDuplicateCheck(parsedPreview.email, parsedPreview.candidateName);
    if (isDup) return;

    const newCandidateObj = mapParsedDataToCandidateModel(parsedPreview, selectedReqId);
    // Carry the objectURL and mime type through to the candidate model so the resume viewer works
    newCandidateObj.resumeObjectUrl = parsedPreview.resumeObjectUrl || null;
    newCandidateObj.resumeMimeType = parsedPreview.resumeMimeType || 'application/pdf';
    onSaveCandidate(newCandidateObj);
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      dir="ltr"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Banner */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Create New Candidate Profile
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Extract candidate metadata from resume text or add manually
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('manual'); setDuplicateMatch(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${activeTab === 'manual' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            Add Candidate Manually
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('resume'); setDuplicateMatch(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${activeTab === 'resume' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            Add from Resume File Upload
          </button>
        </div>

        {/* Duplicate Warning Banner */}
        {duplicateMatch && (
          <div className="m-6 mb-0 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-center justify-between gap-3 animate-fade-in shrink-0">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold text-amber-900 dark:text-amber-200 block">
                  Possible Duplicate Candidate Detected!
                </span>
                <span className="text-amber-800 dark:text-amber-300">
                  Matching record: <strong className="font-semibold">{duplicateMatch.candidateName}</strong> ({duplicateMatch.email}).
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDuplicateModal(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Copy className="w-3.5 h-3.5" /> Resolve Duplicate
            </button>
          </div>
        )}

        {/* Modal Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB A: MANUAL ADD FORM */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-6">
              
              {/* Personal Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  1. Personal &amp; Contact Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {errors.firstName && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Rivera"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {errors.lastName && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.rivera@example.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {errors.email && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {errors.phone && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City &amp; Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Address (Optional)</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="456 Tech Blvd, San Francisco, CA"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Section */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  2. Professional Information &amp; Compensation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Job Title</label>
                    <input
                      type="text"
                      value={currentTitle}
                      onChange={(e) => setCurrentTitle(e.target.value)}
                      placeholder="e.g. Senior Full Stack Engineer"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Organization</label>
                    <input
                      type="text"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="e.g. CloudScale Inc."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Experience</label>
                    <input
                      type="text"
                      value={totalExperience}
                      onChange={(e) => setTotalExperience(e.target.value)}
                      placeholder="e.g. 5.5 yrs"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notice Period (Optional)</label>
                    <input
                      type="text"
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      placeholder="e.g. 30 Days"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Salary (Optional)</label>
                    <input
                      type="text"
                      value={currentSalary}
                      onChange={(e) => setCurrentSalary(e.target.value)}
                      placeholder="145,000 / yr"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Salary (Optional)</label>
                    <input
                      type="text"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      placeholder="165,000 / yr"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Career & Skills */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  3. Skills, Source &amp; Job Requisition Link
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Skills (Comma Separated)</label>
                    <input
                      type="text"
                      value={skillsStr}
                      onChange={(e) => setSkillsStr(e.target.value)}
                      placeholder="React, Node.js, AWS, TypeScript"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Candidate Source</label>
                    <CustomSelect
                      value={source}
                      onChange={(val) => setSource(val)}
                      options={[
                        { value: 'Direct Application', label: 'Direct Application' },
                        { value: 'LinkedIn Recruiter', label: 'LinkedIn Recruiter' },
                        { value: 'Career Portal Direct', label: 'Career Portal Direct' },
                        { value: 'Employee Referral', label: 'Employee Referral' },
                        { value: 'Single Upload', label: 'Single Upload' }
                      ]}
                      size="md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Apply to Job Requisition (Optional)</label>
                    <SearchableSelect
                      value={selectedReqId}
                      onChange={(val) => setSelectedReqId(val)}
                      options={[
                        { value: '', label: 'Unassigned Talent Pool' },
                        ...INITIAL_REQUISITIONS.map(r => ({ value: r.id, label: `${r.id} — ${r.title}` }))
                      ]}
                      placeholder="Select Requisition..."
                      size="md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Upload Resume Attachment (Optional)</label>
                    <input
                      type="file"
                      onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Create Candidate Profile
                </button>
              </div>

            </form>
          )}

          {/* TAB B: ADD FROM RESUME UPLOAD */}
          {activeTab === 'resume' && (
            <form onSubmit={handleResumeSubmit} className="space-y-6">
              
              {errors.resume && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errors.resume}</span>
                </div>
              )}

              {/* Upload Box */}
              <div 
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleResumeFileSelect({ target: { files: e.dataTransfer.files } });
                  }
                }}
                className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/70 text-center space-y-3 hover:border-blue-500 transition-colors"
              >
                <FileUp className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Drop candidate resume file here or click to browse
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports PDF, DOC, DOCX, TXT up to 10MB
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleResumeFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md cursor-pointer"
                >
                  Select Resume File
                </button>
              </div>

              {isParsing && (
                <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center space-y-2 animate-pulse">
                  <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto animate-spin" />
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    Extracting text and parsing candidate profile from resume...
                  </p>
                </div>
              )}

              {/* PARSED RESUME REVIEW SCREEN */}
              {parsedPreview && !isParsing && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Extracted Parsed Candidate Review
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">Review &amp; Edit Before Saving</span>
                  </div>

                  {/* Confidence Indicators Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className={`p-2 rounded-lg font-semibold flex items-center gap-1 ${parsedPreview.candidateName && parsedPreview.candidateName !== 'N/A' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'}`}>
                      {parsedPreview.candidateName && parsedPreview.candidateName !== 'N/A' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} Name: {parsedPreview.candidateName && parsedPreview.candidateName !== 'N/A' ? 'Parsed' : 'N/A (Required)'}
                    </div>
                    <div className={`p-2 rounded-lg font-semibold flex items-center gap-1 ${parsedPreview.email && parsedPreview.email !== 'N/A' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'}`}>
                      {parsedPreview.email && parsedPreview.email !== 'N/A' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} Email: {parsedPreview.email && parsedPreview.email !== 'N/A' ? 'Parsed' : 'N/A (Required)'}
                    </div>
                    <div className={`p-2 rounded-lg font-semibold flex items-center gap-1 ${parsedPreview.phone && parsedPreview.phone !== 'N/A' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {parsedPreview.phone && parsedPreview.phone !== 'N/A' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <HelpCircle className="w-3.5 h-3.5 text-slate-400" />} Phone: {parsedPreview.phone && parsedPreview.phone !== 'N/A' ? 'Parsed' : 'N/A'}
                    </div>
                    <div className={`p-2 rounded-lg font-semibold flex items-center gap-1 ${parsedPreview.currentSalary && parsedPreview.currentSalary !== 'N/A' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {parsedPreview.currentSalary && parsedPreview.currentSalary !== 'N/A' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <HelpCircle className="w-3.5 h-3.5 text-slate-400" />} Salary: {parsedPreview.currentSalary && parsedPreview.currentSalary !== 'N/A' ? 'Parsed' : 'N/A'}
                    </div>
                  </div>

                  {/* Editable Parsed Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                        Full Legal Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={parsedPreview.candidateName}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, candidateName: e.target.value })}
                        placeholder="Required Candidate Name"
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                        Primary Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={parsedPreview.email}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, email: e.target.value })}
                        placeholder="candidate@example.com"
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Parsed Phone</label>
                      <input
                        type="text"
                        value={parsedPreview.phone}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Parsed Location</label>
                      <input
                        type="text"
                        value={parsedPreview.location}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, location: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Current Job Title</label>
                      <input
                        type="text"
                        value={parsedPreview.currentTitle}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, currentTitle: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Current Organization</label>
                      <input
                        type="text"
                        value={parsedPreview.currentCompany}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, currentCompany: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Total Experience</label>
                      <input
                        type="text"
                        value={parsedPreview.totalExperience}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, totalExperience: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Notice Period</label>
                      <input
                        type="text"
                        value={parsedPreview.noticePeriod}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, noticePeriod: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                      />
                    </div>
                    {parsedPreview.internshipExperience && parsedPreview.internshipExperience.length > 0 && (
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Internship Experience</label>
                        <input
                          type="text"
                          readOnly
                          value={parsedPreview.internshipExperience.map(i => `${i.title} - ${i.company} (${i.startDate} - ${i.endDate})`).join(' | ')}
                          className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold opacity-80 cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>

                  {/* Extracted Skills Chips */}
                  <div className="space-y-2">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">
                      Extracted Key Skills ({ (parsedPreview.skills || []).length })
                    </label>
                    {(parsedPreview.skills || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {parsedPreview.skills.map((sk, idx) => (
                          <span key={idx} className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {sk}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic block">No specific technical skills extracted. You can edit skills in profile after creation.</span>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setParsedPreview(null)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Reset &amp; Upload Different File
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
                    >
                      Confirm &amp; Create Candidate Profile
                    </button>
                  </div>
                </div>
              )}

            </form>
          )}

        </div>

      </div>

      <DuplicateResolutionModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        newCandidate={duplicateMatch}
        existingCandidate={duplicateMatch}
        onResolve={() => setShowDuplicateModal(false)}
      />
    </div>,
    document.body
  );
};

export default CreateCandidateModal;
