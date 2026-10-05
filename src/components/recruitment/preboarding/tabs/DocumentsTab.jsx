/**
 * Preboarding Workspace - Compliance Documents Tab
 * PeopleWorks ATS SaaS - Enterprise Document Verification & Audit Matrix
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Download, 
  Eye, 
  MoreVertical,
  Plus,
  Calendar,
  UserCheck,
  FileCheck2,
  X
} from 'lucide-react';
import { DOCUMENT_STATUS, DOCUMENT_CATEGORY } from '../preboardingTypes';
import DocumentUploadModal from '../modals/DocumentUploadModal';
import DocumentVerifyModal from '../modals/DocumentVerifyModal';

export const DocumentsTab = ({
  record = {},
  onManageDocument = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [selectedDocForUpload, setSelectedDocForUpload] = useState(null);
  const [selectedDocForReview, setSelectedDocForReview] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [previewDoc, setPreviewDoc] = useState(null);

  const documents = record.documents || [];
  const mandatoryDocs = documents.filter(d => d.required);
  const verifiedMandatory = mandatoryDocs.filter(d => d.status === DOCUMENT_STATUS.VERIFIED);

  const filteredDocs = selectedCategory === 'ALL'
    ? documents
    : documents.filter(d => d.category === selectedCategory);

  const getStatusBadge = (status) => {
    switch (status) {
      case DOCUMENT_STATUS.VERIFIED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <CheckCircle2 size={12} className="shrink-0" /> Verified
          </span>
        );
      case DOCUMENT_STATUS.UNDER_REVIEW:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
            <Clock size={12} className="shrink-0 animate-pulse" /> Under Review
          </span>
        );
      case DOCUMENT_STATUS.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-2xs">
            <XCircle size={12} className="shrink-0" /> Rejected
          </span>
        );
      case DOCUMENT_STATUS.REUPLOAD_REQUIRED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-2xs">
            <RefreshCw size={12} className="shrink-0" /> Re-upload Required
          </span>
        );
      case DOCUMENT_STATUS.WAIVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <ShieldCheck size={12} className="shrink-0" /> Waived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Pending Upload
          </span>
        );
    }
  };

  const handleUploadSubmit = async (docId, fileData) => {
    await onManageDocument(record.id, docId, 'UPLOAD', fileData);
    setSelectedDocForUpload(null);
  };

  const handleReviewSubmit = async (docId, action, payload) => {
    await onManageDocument(record.id, docId, action, payload);
    setSelectedDocForReview(null);
  };

  return (
    <div className="space-y-5">
      
      {/* Category Pills & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'text-white shadow-xs font-extrabold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={{ backgroundColor: selectedCategory === 'ALL' ? brandColor : undefined }}
          >
            All Documents ({documents.length})
          </button>
          {Object.values(DOCUMENT_CATEGORY).map(cat => {
            const count = documents.filter(d => d.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'text-white shadow-xs font-extrabold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                style={{ backgroundColor: selectedCategory === cat ? brandColor : undefined }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Verification Summary Counter Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs shrink-0 self-start md:self-auto">
          <FileCheck2 size={15} className="text-emerald-500" />
          <span className="text-slate-600 dark:text-slate-300">
            Mandatory Clearance: <strong className="text-slate-900 dark:text-white font-bold">{verifiedMandatory.length} / {mandatoryDocs.length} Verified</strong>
          </span>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 text-left">Document Type</th>
                <th className="py-3.5 px-4 text-left">Category</th>
                <th className="py-3.5 px-4 text-center">Requirement</th>
                <th className="py-3.5 px-4 text-left">Uploaded File</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-left">Verification Audit</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors">
                  
                  {/* Document Name */}
                  <td className="py-3.5 px-4 text-left">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center">
                      <span>{doc.name}</span>
                      {doc.required && <span className="text-rose-500 font-bold ml-1 text-sm leading-none">*</span>}
                    </div>
                    {doc.rejectionReason && (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium bg-rose-50/80 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/40">
                        <AlertTriangle size={12} className="shrink-0" />
                        <span>{doc.rejectionReason}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                      <Calendar size={11} /> Due: {doc.dueDate || 'Day 1'}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 text-left text-slate-600 dark:text-slate-300">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold border border-slate-200/60 dark:border-slate-700/60">
                      {doc.category}
                    </span>
                  </td>

                  {/* Required Flag */}
                  <td className="py-3.5 px-4 text-center">
                    {doc.required ? (
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/40">
                        Mandatory
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                  </td>

                  {/* Upload Details */}
                  <td className="py-3.5 px-4 text-left">
                    {doc.fileName ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/40">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            {doc.fileName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {doc.fileSize} • v{doc.version || 1}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No file uploaded</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(doc.status)}
                  </td>

                  {/* Verification Info */}
                  <td className="py-3.5 px-4 text-left text-slate-600 dark:text-slate-300">
                    {doc.verifiedBy ? (
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <UserCheck size={12} className="text-emerald-500" />
                          <span>{doc.verifiedBy}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(doc.verifiedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      
                      {/* Upload CTA */}
                      <button
                        onClick={() => setSelectedDocForUpload(doc)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
                        title="Upload File"
                      >
                        <Upload size={14} />
                      </button>

                      {/* Review CTA (if file exists) */}
                      {doc.fileName && (
                        <>
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
                            title="Preview File"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => setSelectedDocForReview(doc)}
                            className="px-3 py-1 text-xs font-bold rounded-lg text-white shadow-xs hover:brightness-110 cursor-pointer transition-transform active:scale-95"
                            style={{ backgroundColor: brandColor }}
                            title="Review & Verify"
                          >
                            Review
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedDocForUpload && (
        <DocumentUploadModal
          isOpen={true}
          documentItem={selectedDocForUpload}
          onClose={() => setSelectedDocForUpload(null)}
          onUpload={handleUploadSubmit}
          brandColor={brandColor}
        />
      )}

      {selectedDocForReview && (
        <DocumentVerifyModal
          isOpen={true}
          documentItem={selectedDocForReview}
          onClose={() => setSelectedDocForReview(null)}
          onAction={handleReviewSubmit}
          brandColor={brandColor}
        />
      )}

      {/* Mock Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{previewDoc.name}</h4>
                  <p className="text-[11px] text-slate-400">{previewDoc.fileName} • {previewDoc.fileSize}</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
              <FileCheck2 size={40} className="mx-auto text-blue-500" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Secure Document Viewer & OCR Extract</p>
                <p className="text-[11px] text-slate-400 mt-1">Verified against PeopleWorks ATS Document Security Policies</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentsTab;
