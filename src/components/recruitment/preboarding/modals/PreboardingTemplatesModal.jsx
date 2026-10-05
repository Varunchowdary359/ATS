import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, FileText, CheckCircle2, Copy, Plus, Layers, 
  Sparkles, Check, Download, ShieldCheck
} from 'lucide-react';
import { useToast } from '../../../shared/ToastContext';

export const PreboardingTemplatesModal = ({
  isOpen = false,
  onClose = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const { addToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('tech');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const templates = [
    {
      id: 'tech_standard',
      category: 'tech',
      title: 'Engineering & Technology Standard Checklist',
      description: 'Standard checklist for Software Developers, DevOps, QA, and Data Engineering roles.',
      docCount: 6,
      taskCount: 7,
      bgvChecks: ['Identity', 'Employment', 'Education', 'Criminal Check'],
      docs: [
        'Government ID / Passport / Aadhaar',
        'Academic Degree & Highest Qualification Certificate',
        'Previous 3 Months Pay Slips & Experience Letter',
        'Relieving Letter from Previous Employer',
        'Direct Deposit Bank Statement / Cancelled Cheque',
        'Signed NDA & Code of Conduct Acknowledgment'
      ],
      tasks: [
        'GitHub Enterprise & Cloud SSO Provisioning (IT)',
        'DevOps Laptop Provisioning (MacBook Pro / ThinkPad) (IT)',
        'Assigned Technical Buddy & Welcome Session (HM)',
        'Complete InfoSec & ISO 27001 Security Training (Candidate)',
        'Benefits & Medical Insurance Nomination (HR)'
      ]
    },
    {
      id: 'sales_business',
      category: 'sales',
      title: 'Sales, GTM & Business Operations Checklist',
      description: 'Optimized onboarding track for Account Executives, SDRs, and Customer Success Managers.',
      docCount: 5,
      taskCount: 6,
      bgvChecks: ['Identity', 'Employment', 'Education', 'Reference Check'],
      docs: [
        'Government Photo ID',
        'Highest Education Transcript',
        'Relieving Letter & Resignation Acceptance',
        'Cancelled Cheque / Bank Details',
        'Non-Solicitation & Confidentiality Agreement'
      ],
      tasks: [
        'Salesforce CRM & Gong.io License Assignment',
        'Sales Enablement Deck & Product Playbook Delivery',
        'Call Shadowing Schedule with Team Lead'
      ]
    },
    {
      id: 'leadership_exec',
      category: 'leadership',
      title: 'Executive & Leadership Fast-Track Onboarding',
      description: 'Tailored VIP onboarding package for Directors, VPs, and Executive hires.',
      docCount: 7,
      taskCount: 8,
      bgvChecks: ['Comprehensive Global BGV', 'Directorship Check', 'Credit & Financial Check'],
      docs: [
        'Passport & PAN Card / SSN',
        'Comprehensive Employment History (10 Years)',
        'Directorship Disclosure Form',
        'Conflict of Interest & Board Declaration',
        'Executive Compensation & Equity Grant Agreement'
      ],
      tasks: [
        'Executive IT Suite & Encrypted Hardware Handover',
        '1:1 Briefing with CEO and Board of Directors',
        'Department Strategy & Financials Onboarding Kit'
      ]
    }
  ];

  const activeTemplates = templates.filter(t => t.category === selectedCategory || selectedCategory === 'all');

  const handleApplyTemplate = (tmpl) => {
    addToast({
      title: 'Template Activated',
      message: `"${tmpl.title}" has been set as the default onboarding pack for this department.`,
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
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Preboarding Document & Task Checklist Templates
                </h3>
                <p className="text-xs text-slate-500">
                  Manage standardized department checklists, required documentation, and verification requirements.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            {[
              { id: 'tech', label: 'Tech & Engineering' },
              { id: 'sales', label: 'Sales & GTM' },
              { id: 'leadership', label: 'Executive & Leadership' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                style={selectedCategory === tab.id ? { backgroundColor: brandColor, color: '#fff' } : {}}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === tab.id 
                    ? 'shadow-2xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Template List */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {activeTemplates.map(tmpl => (
              <div
                key={tmpl.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-4 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tmpl.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{tmpl.description}</p>
                  </div>
                  <button
                    onClick={() => handleApplyTemplate(tmpl)}
                    style={{ backgroundColor: brandColor }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-2xs hover:brightness-110 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Copy size={13} />
                    <span>Apply to Next Onboardings</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {/* Docs */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={13} className="text-blue-500" /> Mandatory Documents ({tmpl.docs.length})
                    </span>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pl-2">
                      {tmpl.docs.map((doc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" /> Automated Onboarding Tasks ({tmpl.tasks.length})
                    </span>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pl-2">
                      {tmpl.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default PreboardingTemplatesModal;
