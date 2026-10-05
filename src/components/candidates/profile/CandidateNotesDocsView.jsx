import React, { useState } from 'react';
import { MessageSquarePlus, FileText, Download, Plus, Trash2, Upload, Paperclip } from 'lucide-react';

const CandidateNotesDocsView = ({ candidate, view = 'all', onAddNote, onUpdateCandidate }) => {
  if (!candidate) return null;

  const showNotes = view === 'all' || view === 'notes';
  const showDocs = view === 'all' || view === 'documents';

  const notes = candidate.notes || [];
  const documents = candidate.documents || [];

  const handleUploadDoc = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: 'Attachment',
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedBy: 'Recruiter',
        uploadedDate: new Date().toISOString().split('T')[0]
      };
      const updatedDocs = [...documents, newDoc];
      onUpdateCandidate({ ...candidate, documents: updatedDocs });
    }
  };

  const handleDeleteDoc = (docId) => {
    const updatedDocs = documents.filter(d => d.id !== docId);
    onUpdateCandidate({ ...candidate, documents: updatedDocs });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Recruiter Notes Section */}
      {showNotes && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Recruiter Notes &amp; Evaluations
              </h3>
            </div>
            <button
              onClick={onAddNote}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>

          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{note.author}</span>
                    <span className="text-[10px] font-mono text-slate-400">{note.date}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
              No recruiter notes recorded yet. Click "Add Note" to record feedback.
            </div>
          )}
        </div>
      )}

      {/* Documents Repository Section */}
      {showDocs && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Candidate Document Storage ({documents.length})
              </h3>
            </div>
            <label className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs">
              <Upload className="w-3.5 h-3.5" /> Upload Document
              <input type="file" onChange={handleUploadDoc} className="hidden" />
            </label>
          </div>

          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Paperclip className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{doc.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Type: {doc.type} • Size: {doc.fileSize} • Uploaded by {doc.uploadedBy} on {doc.uploadedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => alert(`Downloading document: ${doc.name}`)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
              No additional documents uploaded.
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CandidateNotesDocsView;
