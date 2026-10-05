import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { AIService } from '../../services/ai/AIService.js';

export default function AIFileUpload({ onComplete, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const hasValidExt = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError('Please upload a valid resume in PDF, DOCX, DOC, or TXT format.');
      return;
    }

    setFile(selectedFile);
    setError('');
    setIsProcessing(true);

    try {
      const result = await AIService.processResumeUpload(selectedFile);
      setIsProcessing(false);
      if (onComplete) onComplete(result);
    } catch (err) {
      setIsProcessing(false);
      setError(err.message || 'Failed to parse resume document.');
    }
  };

  return (
    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md text-start font-sans">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <UploadCloud className="w-4 h-4 text-brand dark:text-sky-400" />
          <span>Upload Resume for AI Parsing & Screening</span>
        </span>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-brand bg-brand/5 dark:border-sky-500 dark:bg-sky-950/20'
            : 'border-slate-200 dark:border-slate-800 hover:border-brand/40 bg-slate-50/50 dark:bg-slate-950/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-2">
            <Loader2 className="w-6 h-6 text-brand dark:text-sky-400 animate-spin mb-1.5" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Extracting & Parsing with AI...</span>
            <span className="text-[10px] text-slate-400">Classifying skills, experience, education</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <FileText className="w-6 h-6 text-slate-400 dark:text-slate-500 mb-1" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Drag & Drop PDF or DOCX resume here, or <span className="text-brand dark:text-sky-400 underline">Browse</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Supports PDF (text/streams), DOCX, DOC, TXT (Max 10MB)</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
