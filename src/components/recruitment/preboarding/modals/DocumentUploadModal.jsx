/**
 * Document Upload Modal
 * PeopleWorks ATS SaaS
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UploadCloud, FileText, AlertCircle } from 'lucide-react';
import { validateDocumentUpload } from '../preboardingValidation';

export const DocumentUploadModal = ({
  isOpen = false,
  onClose = () => {},
  documentItem = null,
  onUpload = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !documentItem || typeof document === 'undefined') return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateDocumentUpload(file);
    if (!validation.isValid) {
      setError(validation.error);
      setSelectedFile(null);
    } else {
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      setError('Please choose a file to upload.');
      return;
    }

    setUploading(true);
    try {
      const fileSizeFormatted = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
      await onUpload(documentItem.id, {
        fileName: selectedFile.name,
        fileSize: fileSizeFormatted
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upload Document
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {documentItem.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Upload Zone */}
        <div className="py-5 space-y-4">
          <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50 group">
            <UploadCloud size={32} className="text-slate-400 group-hover:text-brand transition-colors mb-2" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">
              Click to browse or drag and drop
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              PDF, JPG, PNG (Max 10MB)
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl">
              <FileText size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs rounded-xl">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedFile || uploading}
            style={{ backgroundColor: brandColor }}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-2xs hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
          >
            {uploading ? 'Uploading...' : 'Confirm Upload'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default DocumentUploadModal;
