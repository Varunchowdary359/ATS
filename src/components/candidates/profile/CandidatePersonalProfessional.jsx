import React, { useContext } from 'react';
import { User, Briefcase, Mail, Phone, MapPin, Globe, Shield, Calendar, DollarSign, Award, Lock } from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { canViewCompensation } from '../candidatePermissions';

const CandidatePersonalProfessional = ({ candidate, type = 'all' }) => {
  const { activeRole } = useContext(ThemeContext);
  const showSalary = canViewCompensation(activeRole);

  if (!candidate) return null;

  const showPersonal = type === 'all' || type === 'personal';
  const showProfessional = type === 'all' || type === 'professional';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Personal Information */}
      {showPersonal && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Personal Information &amp; Contact Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Full Legal Name</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">{candidate.candidateName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Primary Email</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{candidate.email}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Primary Phone</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{candidate.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Alternate Phone</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{candidate.altPhone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Current Location</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.location || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Full Address</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.address || candidate.location || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nationality</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.nationality || 'United States'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Contact Preferences</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.contactPreference || 'Email & Phone'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Professional Information */}
      {showProfessional && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Professional Information &amp; Compensation
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Current Job Title</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">{candidate.currentTitle || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Current Organization</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.currentCompany || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Experience</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.totalExperience || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Notice Period</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.noticePeriod || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Current Compensation</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {showSalary ? (candidate.currentSalary || 'N/A') : <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]"><Lock className="w-3 h-3 text-amber-500" /> Restricted</span>}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Expected Compensation</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {showSalary ? (candidate.expectedSalary || 'N/A') : <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]"><Lock className="w-3 h-3 text-amber-500" /> Restricted</span>}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Preferred Location</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.preferredLocation || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Employment Type</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.employmentType || 'Full-Time'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Candidate Owner</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.candidateOwner || 'Sarah Jenkins'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Sourcing Channel</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.source || 'Direct'}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CandidatePersonalProfessional;
