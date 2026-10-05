/**
 * Preboarding Workspace - Joining Details Tab
 * PeopleWorks ATS SaaS - Enterprise Standard Field Formats & Zero-Waste Layout
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Building2, Calendar, MapPin, User, Save, 
  Edit2, AlertCircle, CheckCircle, Clock, ShieldCheck, Layers, Award,
  Check, DollarSign
} from 'lucide-react';
import { validateJoiningDetails } from '../preboardingValidation';
import { WORK_ARRANGEMENT, EMPLOYMENT_TYPE } from '../preboardingTypes';

export const JoiningDetailsTab = ({
  record = {},
  onSave = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    joiningDate: record.joiningDetails?.joiningDate || record.joiningDate || '2026-04-01',
    location: record.joiningDetails?.location || record.location || 'Bangalore, India (Hybrid)',
    workArrangement: record.joiningDetails?.workArrangement || WORK_ARRANGEMENT.HYBRID,
    department: record.joiningDetails?.department || record.department || 'Platform Engineering',
    designation: record.joiningDetails?.designation || record.jobTitle || 'Staff DevOps & Cloud Platform Engineer',
    reportingManager: record.joiningDetails?.reportingManager || record.hiringManagerName || 'Alex Chen',
    employmentType: record.joiningDetails?.employmentType || EMPLOYMENT_TYPE.FULL_TIME,
    businessUnit: record.joiningDetails?.businessUnit || 'Core Platform',
    jobLevel: record.joiningDetails?.jobLevel || 'IC-5',
    shift: record.joiningDetails?.shift || 'General Day Shift (9 AM - 6 PM)',
    probationPeriod: record.joiningDetails?.probationPeriod || '3 Months'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (record) {
      setFormData(prev => ({
        ...prev,
        joiningDate: record.joiningDetails?.joiningDate || record.joiningDate || prev.joiningDate,
        location: record.joiningDetails?.location || record.location || prev.location,
        workArrangement: record.joiningDetails?.workArrangement || prev.workArrangement,
        department: record.joiningDetails?.department || record.department || prev.department,
        designation: record.joiningDetails?.designation || record.jobTitle || prev.designation,
        reportingManager: record.joiningDetails?.reportingManager || record.hiringManagerName || prev.reportingManager,
        employmentType: record.joiningDetails?.employmentType || prev.employmentType,
        businessUnit: record.joiningDetails?.businessUnit || prev.businessUnit,
        jobLevel: record.joiningDetails?.jobLevel || prev.jobLevel,
        shift: record.joiningDetails?.shift || prev.shift,
        probationPeriod: record.joiningDetails?.probationPeriod || prev.probationPeriod
      }));
    }
  }, [record]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrors({});

    const validation = validateJoiningDetails(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      if (typeof onSave === 'function') {
        await onSave(record.id || record.candidateId || 'PRE-2026-001', formData);
      }
      setIsEditing(false);
      setSuccessMsg('Joining terms updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setErrors({ global: err.message || 'Failed to save joining terms.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (record) {
      setFormData({
        joiningDate: record.joiningDetails?.joiningDate || record.joiningDate || '2026-04-01',
        location: record.joiningDetails?.location || record.location || 'Bangalore, India (Hybrid)',
        workArrangement: record.joiningDetails?.workArrangement || WORK_ARRANGEMENT.HYBRID,
        department: record.joiningDetails?.department || record.department || 'Platform Engineering',
        designation: record.joiningDetails?.designation || record.jobTitle || 'Staff DevOps & Cloud Platform Engineer',
        reportingManager: record.joiningDetails?.reportingManager || record.hiringManagerName || 'Alex Chen',
        employmentType: record.joiningDetails?.employmentType || EMPLOYMENT_TYPE.FULL_TIME,
        businessUnit: record.joiningDetails?.businessUnit || 'Core Platform',
        jobLevel: record.joiningDetails?.jobLevel || 'IC-5',
        shift: record.joiningDetails?.shift || 'General Day Shift (9 AM - 6 PM)',
        probationPeriod: record.joiningDetails?.probationPeriod || '3 Months'
      });
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-xs shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            <Briefcase size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Joining & Employment Parameters
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                Offer Ref: {record.offerId || 'OFF-2026-001'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Check size={12} /> Terms Locked
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Corporate designation, reporting manager, work location, and organizational structure
            </p>
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <Edit2 size={13} className="text-slate-500" />
            <span>Edit Joining Terms</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: brandColor }}
            >
              <Save size={13} />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium animate-in fade-in">
          <CheckCircle size={15} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Validation Error Alert Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-600 dark:text-rose-400 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>Please correct the following before saving:</span>
          </div>
          <ul className="list-disc list-inside pl-2 space-y-0.5 text-[11px]">
            {Object.entries(errors).map(([key, msg]) => msg && (
              <li key={key}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ═══════════════════════════════════════════════════════════════
            CARD 1: SCHEDULE, LOCATION & WORK ARRANGEMENT
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Calendar size={14} />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Joining Schedule & Location
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Day 1</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Expected Joining Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Joining Date <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.joiningDate || ''}
                  onChange={(e) => handleChange('joiningDate', e.target.value)}
                  className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.joiningDate ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <Calendar size={13} className="text-blue-500 shrink-0" />
                  <span className="truncate">{formData.joiningDate || '—'}</span>
                </div>
              )}
            </div>

            {/* Work Arrangement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Arrangement <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <select
                  value={formData.workArrangement || WORK_ARRANGEMENT.HYBRID}
                  onChange={(e) => handleChange('workArrangement', e.target.value)}
                  className="w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {Object.values(WORK_ARRANGEMENT).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {formData.workArrangement || 'Hybrid'}
                  </span>
                </div>
              )}
            </div>

            {/* Work Location */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Work Location <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Bangalore, India (Hybrid)"
                  className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.location ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.location || '—'}</span>
                </div>
              )}
            </div>

            {/* Work Shift */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Shift Schedule
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.shift || ''}
                  onChange={(e) => handleChange('shift', e.target.value)}
                  placeholder="Shift Schedule"
                  className="w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <Clock size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.shift || 'General Day Shift'}</span>
                </div>
              )}
            </div>

            {/* Probation Period */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Probation Period
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.probationPeriod || ''}
                  onChange={(e) => handleChange('probationPeriod', e.target.value)}
                  placeholder="Probation duration"
                  className="w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formData.probationPeriod || '3 Months'}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CARD 2: ORGANIZATIONAL HIERARCHY & POSITION
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Building2 size={14} />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Department & Role Hierarchy
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Structure</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Designation */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Designation <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.designation || ''}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  placeholder="e.g. Senior Frontend Architect"
                  className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.designation ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formData.designation || record.jobTitle || '—'}
                </div>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Department <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="Department"
                  className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.department ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <Building2 size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.department || '—'}</span>
                </div>
              )}
            </div>

            {/* Business Unit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Business Unit (BU)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.businessUnit || ''}
                  onChange={(e) => handleChange('businessUnit', e.target.value)}
                  placeholder="Business Unit"
                  className="w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formData.businessUnit || 'Core Platform'}
                </div>
              )}
            </div>

            {/* Reporting Manager */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Reporting Manager <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.reportingManager || ''}
                  onChange={(e) => handleChange('reportingManager', e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.reportingManager ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <User size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.reportingManager || 'Alex Chen'}</span>
                </div>
              )}
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Employment Type <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <select
                  value={formData.employmentType || EMPLOYMENT_TYPE.FULL_TIME}
                  onChange={(e) => handleChange('employmentType', e.target.value)}
                  className="w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {Object.values(EMPLOYMENT_TYPE).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formData.employmentType || 'Full-Time Regular'}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default JoiningDetailsTab;
