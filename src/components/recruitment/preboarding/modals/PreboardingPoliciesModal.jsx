import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldCheck, Clock, CheckCircle2, AlertTriangle, 
  Server, RefreshCw, Cpu, Database, Save, Check
} from 'lucide-react';
import { useToast } from '../../../shared/ToastContext';

export const PreboardingPoliciesModal = ({
  isOpen = false,
  onClose = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('bgv'); // 'bgv' | 'readiness' | 'hrms'

  // Form State
  const [bgvVendor, setBgvVendor] = useState('AuthBridge');
  const [bgvSlaDays, setBgvSlaDays] = useState('5');
  const [requireAllMandatoryDocs, setRequireAllMandatoryDocs] = useState(true);
  const [requireBgvBeforeHandoff, setRequireBgvBeforeHandoff] = useState(true);
  const [autoConvertOnReadiness, setAutoConvertOnReadiness] = useState(false);
  const [notifyHiringManagerDays, setNotifyHiringManagerDays] = useState('3');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSave = () => {
    addToast({
      title: 'Policies Updated',
      message: 'Preboarding verification SLA and HRMS sync policies updated successfully.',
      type: 'success'
    });
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Compliance, BGV & HRMS Integration Policies
                </h3>
                <p className="text-xs text-slate-500">
                  Configure preboarding SLAs, automated verification gates, and enterprise HRMS sync policies.
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

          {/* Navigation */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            {[
              { id: 'bgv', label: 'BGV & Vendor Rules', icon: ShieldCheck },
              { id: 'readiness', label: '8-Point Readiness Gate', icon: CheckCircle2 },
              { id: 'hrms', label: 'HRMS Conversion Sync', icon: Database }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={activeTab === tab.id ? { backgroundColor: brandColor, color: '#fff' } : {}}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id ? 'shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {activeTab === 'bgv' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-xs text-slate-600 dark:text-slate-300">
                  Preboarding automatically integrates with designated background verification partners via webhook adapters.
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Verification Vendor Partner
                    </label>
                    <select
                      value={bgvVendor}
                      onChange={(e) => setBgvVendor(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AuthBridge">AuthBridge Data Services (India & APAC)</option>
                      <option value="FirstAdvantage">First Advantage (Global & US)</option>
                      <option value="Sterling">Sterling Talent Solutions</option>
                      <option value="Checkr">Checkr Enterprise API</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target SLA Completion Window (Business Days)
                    </label>
                    <input
                      type="number"
                      value={bgvSlaDays}
                      onChange={(e) => setBgvSlaDays(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requireBgvBeforeHandoff}
                        onChange={(e) => setRequireBgvBeforeHandoff(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Strict BGV Gate: Block HRMS Conversion until BGV is fully CLEARED
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'readiness' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  The 8-point readiness gate evaluates preboarding health before permitting employee ID generation:
                </p>

                <div className="space-y-2">
                  {[
                    '1. Offer Accepted & eSigned by Candidate',
                    '2. All Mandatory Identification & Educational Documents Verified',
                    '3. Background Verification (BGV) Status Cleared',
                    '4. Confirmed Joining Date within Permitted Window',
                    '5. IT Asset / Hardware Requisition Approved',
                    '6. Reporting Manager & Department Cost Center Assigned',
                    '7. Bank Account & Compensation Structure Confirmed',
                    '8. Final HRBP Handoff Clearance Signed Off'
                  ].map((rule, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'hrms' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-xs text-slate-600 dark:text-slate-300">
                  When a preboarding record reaches 100% readiness, it creates the official Employee Record in PeopleWorks HRMS Core.
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoConvertOnReadiness}
                        onChange={(e) => setAutoConvertOnReadiness(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Auto-convert to Employee on 100% Readiness Clearance
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Manager Notification Trigger (Days Prior to Joining)
                    </label>
                    <input
                      type="number"
                      value={notifyHiringManagerDays}
                      onChange={(e) => setNotifyHiringManagerDays(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{ backgroundColor: brandColor }}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-2xs hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>Save & Apply Policies</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default PreboardingPoliciesModal;
