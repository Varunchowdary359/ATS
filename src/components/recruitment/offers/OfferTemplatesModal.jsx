import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, FileText, Check, Edit3, Eye, Copy, Sparkles } from 'lucide-react';
import { offerService } from './offerService';

export const OfferTemplatesModal = ({ isOpen, onClose, brandColor = 'var(--pw-brand)' }) => {
  const [templates, setTemplates] = useState(() => offerService.getTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleEdit = (tmpl) => {
    setSelectedTemplate(tmpl);
    setEditForm({ ...tmpl });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm) return;
    const updated = offerService.saveTemplate(editForm);
    setTemplates(updated);
    setSelectedTemplate(editForm);
    setIsEditing(false);
  };

  const insertVariable = (variable) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      contentHtml: (editForm.contentHtml || '') + ` ${variable} `
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200" dir="ltr">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              Offer Letter Templates Manager
            </h2>
            <p className="text-xs text-slate-500">
              Configure country-specific letter formats, legal clauses & dynamic placeholders
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Split: Left list, Right preview/editor */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Left Column: Template List */}
          <div className="md:col-span-4 p-4 overflow-y-auto space-y-2.5 max-h-[75vh]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Templates ({templates.length})</span>
            </div>

            {templates.map(tmpl => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl);
                    setIsEditing(false);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tmpl.name}</h4>
                    {tmpl.isDefault && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand/10 text-brand">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{tmpl.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2">
                    <span>{tmpl.country}</span> • <span>{tmpl.category}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Preview or Editor */}
          <div className="md:col-span-8 p-6 overflow-y-auto flex flex-col max-h-[75vh]">
            {selectedTemplate && (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedTemplate.name}</h3>
                    <p className="text-xs text-slate-500">Last updated by {selectedTemplate.updatedBy || 'Admin'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 text-xs text-slate-500 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          style={{
                            backgroundColor: brandColor,
                            boxShadow: `0 2px 10px ${brandColor}40`
                          }}
                          className="px-4 py-1.5 text-white text-xs font-bold rounded-xl shadow-sm hover:brightness-110 transition-all cursor-pointer"
                        >
                          Save Template
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEdit(selectedTemplate)}
                        className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Template
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Template Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Country</label>
                        <input
                          type="text"
                          value={editForm.country}
                          onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Insert Dynamic Placeholders</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '{{candidate.fullName}}', '{{job.title}}', '{{job.department}}', 
                          '{{job.location}}', '{{offer.startDate}}', '{{offer.totalCtcFormatted}}', 
                          '{{offer.expirationDate}}', '{{company.name}}'
                        ].map(varTag => (
                          <button
                            key={varTag}
                            type="button"
                            onClick={() => insertVariable(varTag)}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand/10 text-slate-600 dark:text-slate-300 text-[10px] font-mono border border-slate-200 dark:border-slate-700"
                          >
                            + {varTag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">HTML Template Body</label>
                      <textarea
                        value={editForm.contentHtml}
                        onChange={(e) => setEditForm({ ...editForm, contentHtml: e.target.value })}
                        rows="12"
                        className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand flex-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-950 shadow-inner overflow-y-auto max-h-[500px] text-xs">
                    <div dangerouslySetInnerHTML={{ __html: selectedTemplate.contentHtml }} />
                  </div>
                )}
              </>
            )}
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};
export default OfferTemplatesModal;
