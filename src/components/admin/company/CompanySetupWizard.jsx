import React, { useState } from 'react';
import { MOCK_SETUP_CHECKLIST } from '../companyAdminMockData';
import { CheckCircle2, Clock, AlertCircle, ArrowRight, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import { useToast } from '../../shared/ToastContext';

const CompanySetupWizard = ({ onNavigateTab }) => {
  const { addToast } = useToast();
  const [checklist, setChecklist] = useState(MOCK_SETUP_CHECKLIST);

  const completedCount = checklist.filter(c => c.status === 'Completed').length;
  const progressPct = Math.round((completedCount / checklist.length) * 100);

  const [isChecking, setIsChecking] = useState(false);

  const handleRunVerification = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      addToast({ title: 'System Audit Completed', message: '11 of 12 Company Administration modules verified successfully!', type: 'success' });
    }, 1000);
  };

  const getTabKeyFromStep = (stepKey) => {
    switch(stepKey) {
      case 'legal_profile': return 'profile';
      case 'departments': return 'departments';
      case 'business_units': return 'business-units';
      case 'locations': return 'locations';
      case 'cost_centers': return 'cost-centers';
      case 'designations': return 'designations';
      case 'grades': return 'grades';
      case 'employment_types': return 'employment-types';
      case 'work_calendars': return 'work-calendars';
      case 'holiday_lists': return 'holiday-lists';
      case 'approval_workflows': return 'approval-workflows';
      default: return 'profile';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Progress Card */}
      <div className="relative overflow-hidden p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 36 36">
              <path className="text-slate-100 dark:text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-blue-600 dark:text-blue-400" strokeDasharray={`${progressPct}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute text-sm font-extrabold text-slate-800 dark:text-white">{progressPct}%</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Enterprise Onboarding Readiness</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {completedCount} of {checklist.length} configuration steps completed. Ensure all mandatory modules are active before opening employee portal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRunVerification}
            disabled={isChecking}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isChecking ? 'Running Audit...' : 'Run Compliance Check'}
          </button>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            Company Administration Setup Checklist
          </h3>
          <span className="text-xs text-slate-500 font-medium">12 Core Administrative Modules</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="px-5 py-3.5 w-12 text-center">Step #</th>
                <th className="px-5 py-3.5">Administrative Module</th>
                <th className="px-5 py-3.5">Requirement</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Last Updated</th>
                <th className="px-5 py-3.5">Configured By</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {checklist.map((item) => (
                <tr key={item.stepNo} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-5 py-3 text-center font-bold text-slate-500">{item.stepNo}</td>
                  <td className="px-5 py-3">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{item.moduleName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">key: {item.stepKey}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      item.requirement === 'Mandatory' 
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {item.requirement}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {item.status === 'Completed' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}
                    {item.status === 'In Progress' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress
                      </span>
                    )}
                    {item.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                        <AlertCircle className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-500">{item.updatedAt}</td>
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{item.updatedBy}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => onNavigateTab(getTabKeyFromStep(item.stepKey))}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <span>Configure</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompanySetupWizard;
