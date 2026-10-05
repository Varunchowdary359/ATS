import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, UserCheck, ShieldCheck, FileText, CheckCircle2, Clock, 
  Upload, AlertTriangle, Building2, MapPin, Mail, Phone,
  Sparkles, ExternalLink, Download, Check, AlertCircle, ArrowRight
} from 'lucide-react';
import { useToast } from '../../../shared/ToastContext';

export const CandidatePreboardingPortalModal = ({
  isOpen = false,
  onClose = () => {},
  record = null,
  brandColor = 'var(--pw-brand)',
  onDocumentUpload = () => {},
  onTaskComplete = () => {}
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist' | 'documents' | 'bgv' | 'welcome'
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !record || typeof document === 'undefined') return null;

  const candidate = record.candidateInfo || {};
  const joining = record.joiningDetails || {};
  const documents = record.documents || [];
  const tasks = record.tasks || [];
  const bgvChecks = record.bgvChecks || [];

  const verifiedDocs = documents.filter(d => d.status === 'VERIFIED').length;
  const totalDocs = documents.length;
  const docProgress = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0;

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleSimulateUpload = (doc) => {
    onDocumentUpload(record.id, doc.id, 'UPLOAD', {
      fileName: `${doc.name.replace(/\s+/g, '_')}_Uploaded.pdf`,
      fileSize: '1.8 MB',
      fileUrl: '#',
      notes: 'Uploaded via Candidate Self-Service Preboarding Portal'
    });
    setUploadingDocId(null);
    setSelectedFile(null);
    addToast({
      title: 'Document Uploaded',
      message: `${doc.name} was successfully submitted for HR verification.`,
      type: 'success'
    });
  };

  const handleCandidateCheckTask = (task) => {
    if (task.status === 'COMPLETED') return;
    onTaskComplete(record.id, task.id, 'COMPLETE', {
      notes: 'Completed by Candidate via Self-Service Portal'
    });
    addToast({
      title: 'Task Completed',
      message: `"${task.title}" has been marked as complete.`,
      type: 'success'
    });
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Top Banner (Branded Candidate Experience Header) */}
          <div 
            className="p-6 text-white relative overflow-hidden shrink-0"
            style={{ 
              background: `linear-gradient(135deg, ${brandColor} 0%, #1e1b4b 100%)` 
            }}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl font-extrabold text-white shadow-inner">
                  {candidate.fullName ? candidate.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'PW'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30">
                      Candidate Portal Simulator
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                      Offer Accepted
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight mt-1">
                    Welcome to PeopleWorks, {candidate.fullName || 'Candidate'}!
                  </h2>
                  <p className="text-xs text-white/80 font-medium">
                    {joining.jobTitle || record.jobTitle} • {joining.department || record.department} • Expected Joining: {joining.joiningDate || record.joiningDate}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer self-end md:self-auto"
                title="Exit Portal Simulator"
              >
                <X size={20} />
              </button>
            </div>

            {/* Micro Progress Bar */}
            <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/70">Documents Verified</span>
                <p className="text-sm font-extrabold text-white">{verifiedDocs} / {totalDocs} ({docProgress}%)</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/70">Tasks Completed</span>
                <p className="text-sm font-extrabold text-white">{completedTasks} / {totalTasks} ({taskProgress}%)</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/70">BGV Status</span>
                <p className="text-sm font-extrabold text-emerald-300">{record.bgvStatus || 'IN_PROGRESS'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/70">Reporting Manager</span>
                <p className="text-sm font-extrabold text-white truncate">{joining.reportingManager || 'Assigned'}</p>
              </div>
            </div>
          </div>

          {/* Navigation Pill Bar */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto">
            {[
              { id: 'checklist', label: 'Onboarding Checklist', icon: CheckCircle2, count: totalTasks },
              { id: 'documents', label: 'Document Submission', icon: FileText, count: totalDocs },
              { id: 'bgv', label: 'Background Verification', icon: ShieldCheck, count: bgvChecks.length },
              { id: 'welcome', label: 'Welcome & Contacts', icon: Sparkles }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={isActive ? { backgroundColor: brandColor, color: '#ffffff' } : {}}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'shadow-xs font-extrabold' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Modal Tab Content Area */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            
            {/* TAB 1: ONBOARDING CHECKLIST */}
            {activeTab === 'checklist' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Action Items & Preparation Tasks
                  </h3>
                  <span className="text-xs text-slate-500">Click to complete candidate-owned action items</span>
                </div>

                <div className="space-y-2.5">
                  {tasks.map(task => {
                    const isCompleted = task.status === 'COMPLETED';
                    const isCandidateTask = task.assignedToRole === 'CANDIDATE' || task.assignedToRole === 'ALL';
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                          isCompleted
                            ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-80'
                            : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleCandidateCheckTask(task)}
                            disabled={isCompleted}
                            className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center transition-all cursor-pointer ${
                              isCompleted 
                                ? 'bg-emerald-500 text-white' 
                                : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                            }`}
                          >
                            {isCompleted && <Check size={14} strokeWidth={3} />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                {task.title}
                              </span>
                              {task.category && (
                                <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {task.category}
                                </span>
                              )}
                              <span className="px-2 py-0.2 rounded-md text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                Due: {task.dueDate || 'Day 1'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {task.description || 'Complete this preboarding task prior to your first day.'}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isCompleted ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200">
                              Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCandidateCheckTask(task)}
                              style={{ backgroundColor: brandColor }}
                              className="px-3 py-1 text-xs font-bold text-white rounded-lg shadow-2xs hover:brightness-110 cursor-pointer"
                            >
                              Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: DOCUMENTS SUBMISSION */}
            {activeTab === 'documents' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Mandatory & Compliance Documents
                    </h3>
                    <p className="text-xs text-slate-500">Please provide clear scanned copies or PDF documents</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{verifiedDocs}/{totalDocs} Verified</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map(doc => {
                    const isUploaded = !!doc.fileName || doc.status === 'VERIFIED' || doc.status === 'SUBMITTED';
                    const isVerified = doc.status === 'VERIFIED';
                    const isRejected = doc.status === 'REJECTED';

                    return (
                      <div
                        key={doc.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <FileText size={16} />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                  {doc.name} {doc.isMandatory && <span className="text-rose-500">*</span>}
                                </h4>
                                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                                  {doc.category}
                                </span>
                              </div>
                            </div>
                            
                            {isVerified && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200">
                                Verified
                              </span>
                            )}
                            {doc.status === 'SUBMITTED' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border border-indigo-200">
                                Under Review
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 border border-rose-200">
                                Re-upload Required
                              </span>
                            )}
                            {doc.status === 'PENDING_UPLOAD' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200">
                                Pending Upload
                              </span>
                            )}
                          </div>

                          {doc.rejectionReason && (
                            <div className="mt-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px]">
                              <strong>HR Feedback:</strong> {doc.rejectionReason}
                            </div>
                          )}

                          {doc.fileName && (
                            <p className="text-[11px] text-slate-500 mt-2 font-mono truncate">
                              📄 {doc.fileName} ({doc.fileSize || '1.2 MB'})
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">Max 10MB (PDF, JPG, PNG)</span>
                          <button
                            onClick={() => handleSimulateUpload(doc)}
                            style={{ backgroundColor: isVerified ? '#64748b' : brandColor }}
                            className="px-3 py-1 text-xs font-bold text-white rounded-lg shadow-2xs hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload size={12} />
                            <span>{isUploaded ? 'Re-upload' : 'Upload File'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: BGV STATUS */}
            {activeTab === 'bgv' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center gap-3">
                  <ShieldCheck size={24} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      Background Verification In Progress via {record.bgvVendor || 'AuthBridge Security'}
                    </h4>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      Standard employment, education, and identity verification is automatically managed. No extra action required unless requested by HR.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {bgvChecks.map(check => (
                    <div
                      key={check.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">{check.type} Check</h5>
                          <span className="text-[10px] text-slate-500 font-mono">Ref ID: {check.id}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        check.status === 'CLEARED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        check.status === 'DISCREPANCY' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                        'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {check.status || 'IN_PROGRESS'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: WELCOME & CONTACTS */}
            {activeTab === 'welcome' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-blue-950 border border-blue-100 dark:border-blue-900 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-blue-600 dark:text-blue-400" size={18} />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Day One Instructions & Onboarding Schedule</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    We are thrilled to welcome you to the team! On your first day ({joining.joiningDate || record.joiningDate}), our People Operations team will host a virtual orientation at 09:30 AM IST. Your IT credentials and hardware tracking details will be dispatched to your registered address.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Onboarding Specialist / Recruiter</span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{record.ownerName || 'Sarah Jenkins'}</h5>
                    <div className="text-[11px] text-slate-500 space-y-1">
                      <p className="flex items-center gap-1.5"><Mail size={12} /> recruiter@peopleworks.ind.in</p>
                      <p className="flex items-center gap-1.5"><Phone size={12} /> +91 98450 12345</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Hiring Manager</span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{joining.reportingManager || 'Alex Chen'}</h5>
                    <div className="text-[11px] text-slate-500 space-y-1">
                      <p className="flex items-center gap-1.5"><Mail size={12} /> manager@peopleworks.ind.in</p>
                      <p className="flex items-center gap-1.5"><Building2 size={12} /> {joining.department || record.department}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500">
              Interactive Candidate Self-Service Preview (Simulation Mode)
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
            >
              Exit Simulator
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default CandidatePreboardingPortalModal;
