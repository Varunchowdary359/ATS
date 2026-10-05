/**
 * Preboarding Workspace - Candidate Master Information Tab
 * PeopleWorks ATS SaaS - Enterprise Standard Field Formats & Zero-Waste Bento Dashboard
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, HeartHandshake, Save, 
  Edit2, AlertCircle, CheckCircle, Calendar, Globe, UserCheck,
  ShieldCheck, Home, Check
} from 'lucide-react';
import { validateCandidateInfo } from '../preboardingValidation';
import InternationalPhoneInput from '../../../InternationalPhoneInput';

// Helper to safely format dates into YYYY-MM-DD for standard HTML date input
const formatIsoDate = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m}-${d}`;
  }
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {}
  return str;
};

export const CandidateInfoTab = ({
  record = {},
  onSave = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: record.candidateInfo?.firstName || record.candidateName?.split(' ')[0] || 'Vikram',
    lastName: record.candidateInfo?.lastName || record.candidateName?.split(' ').slice(1).join(' ') || 'Sethi',
    dob: formatIsoDate(record.candidateInfo?.dob || '1992-06-14'),
    gender: record.candidateInfo?.gender || 'Male',
    nationality: record.candidateInfo?.nationality || 'Indian',
    maritalStatus: record.candidateInfo?.maritalStatus || 'Single',
    email: record.candidateInfo?.email || record.candidateEmail || 'vikram.sethi@gmail.com',
    mobile: record.candidateInfo?.mobile || record.candidatePhone || '+91 98450 11223',
    alternateContact: record.candidateInfo?.alternateContact || '+91 98450 99887',
    currentAddress: record.candidateInfo?.currentAddress || record.location || 'Flat 402, Oakwood Palms, Sarjapur Road',
    city: record.candidateInfo?.city || 'Bengaluru',
    state: record.candidateInfo?.state || 'Karnataka',
    country: record.candidateInfo?.country || 'India',
    postalCode: record.candidateInfo?.postalCode || '560102',
    emergencyContactName: record.candidateInfo?.emergencyContactName || 'Ananya Sethi',
    emergencyContactRelationship: record.candidateInfo?.emergencyContactRelationship || 'Spouse',
    emergencyContactMobile: record.candidateInfo?.emergencyContactMobile || '+91 98450 66778',
    secondaryEmergencyContact: record.candidateInfo?.secondaryEmergencyContact || '+91 98450 55443'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Sync with incoming record changes
  useEffect(() => {
    if (record) {
      setFormData(prev => ({
        ...prev,
        firstName: record.candidateInfo?.firstName || record.candidateName?.split(' ')[0] || prev.firstName,
        lastName: record.candidateInfo?.lastName || record.candidateName?.split(' ').slice(1).join(' ') || prev.lastName,
        dob: formatIsoDate(record.candidateInfo?.dob || prev.dob),
        gender: record.candidateInfo?.gender || prev.gender,
        nationality: record.candidateInfo?.nationality || prev.nationality,
        maritalStatus: record.candidateInfo?.maritalStatus || prev.maritalStatus,
        email: record.candidateInfo?.email || record.candidateEmail || prev.email,
        mobile: record.candidateInfo?.mobile || record.candidatePhone || prev.mobile,
        alternateContact: record.candidateInfo?.alternateContact || prev.alternateContact,
        currentAddress: record.candidateInfo?.currentAddress || record.location || prev.currentAddress,
        city: record.candidateInfo?.city || prev.city,
        state: record.candidateInfo?.state || prev.state,
        country: record.candidateInfo?.country || prev.country,
        postalCode: record.candidateInfo?.postalCode || prev.postalCode,
        emergencyContactName: record.candidateInfo?.emergencyContactName || prev.emergencyContactName,
        emergencyContactRelationship: record.candidateInfo?.emergencyContactRelationship || prev.emergencyContactRelationship,
        emergencyContactMobile: record.candidateInfo?.emergencyContactMobile || prev.emergencyContactMobile,
        secondaryEmergencyContact: record.candidateInfo?.secondaryEmergencyContact || prev.secondaryEmergencyContact
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
    
    const validation = validateCandidateInfo(formData);
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
      setSuccessMsg('Candidate master profile updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrors({ global: err.message || 'Failed to save changes. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    // Revert form data to current record
    if (record) {
      setFormData({
        firstName: record.candidateInfo?.firstName || record.candidateName?.split(' ')[0] || 'Vikram',
        lastName: record.candidateInfo?.lastName || record.candidateName?.split(' ').slice(1).join(' ') || 'Sethi',
        dob: formatIsoDate(record.candidateInfo?.dob || '1992-06-14'),
        gender: record.candidateInfo?.gender || 'Male',
        nationality: record.candidateInfo?.nationality || 'Indian',
        maritalStatus: record.candidateInfo?.maritalStatus || 'Single',
        email: record.candidateInfo?.email || record.candidateEmail || 'vikram.sethi@gmail.com',
        mobile: record.candidateInfo?.mobile || record.candidatePhone || '+91 98450 11223',
        alternateContact: record.candidateInfo?.alternateContact || '+91 98450 99887',
        currentAddress: record.candidateInfo?.currentAddress || record.location || 'Flat 402, Oakwood Palms, Sarjapur Road',
        city: record.candidateInfo?.city || 'Bengaluru',
        state: record.candidateInfo?.state || 'Karnataka',
        country: record.candidateInfo?.country || 'India',
        postalCode: record.candidateInfo?.postalCode || '560102',
        emergencyContactName: record.candidateInfo?.emergencyContactName || 'Ananya Sethi',
        emergencyContactRelationship: record.candidateInfo?.emergencyContactRelationship || 'Spouse',
        emergencyContactMobile: record.candidateInfo?.emergencyContactMobile || '+91 98450 66778',
        secondaryEmergencyContact: record.candidateInfo?.secondaryEmergencyContact || '+91 98450 55443'
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
            <User size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Candidate Master Profile
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                {record.candidateId || 'CAND-102'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck size={12} /> Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personal demographics, verified contact channels, residential address, and emergency network
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
            <span>Edit Profile</span>
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

      {/* Zero-Waste Bento Dashboard 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ═══════════════════════════════════════════════════════════════
            CARD 1: PERSONAL DEMOGRAPHICS
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <User size={14} />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Personal Demographics
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">6 Items</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            
            {/* First Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                First Name <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="First name"
                  className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.firstName ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formData.firstName || '—'}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Last Name <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Last name"
                  className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.lastName ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formData.lastName || '—'}
                </div>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Date of Birth <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.dob ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <Calendar size={13} className="text-blue-500 shrink-0" />
                  <span className="truncate">{formData.dob || '—'}</span>
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              {isEditing ? (
                <select
                  value={formData.gender || 'Male'}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Not Disclosed">Not Disclosed</option>
                </select>
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formData.gender || 'Male'}
                </div>
              )}
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nationality
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.nationality || ''}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  placeholder="Nationality"
                  className="w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <Globe size={13} className="text-emerald-500 shrink-0" />
                  <span className="truncate">{formData.nationality || 'Indian'}</span>
                </div>
              )}
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Marital Status
              </label>
              {isEditing ? (
                <select
                  value={formData.maritalStatus || 'Single'}
                  onChange={(e) => handleChange('maritalStatus', e.target.value)}
                  className="w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formData.maritalStatus || 'Single'}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CARD 2: CONTACT CHANNELS
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Mail size={14} />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Contact Channels
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Verified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Primary Email */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Email Address <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="candidate@example.com"
                  className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.email ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.email || '—'}</span>
                </div>
              )}
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile Phone <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <InternationalPhoneInput
                  id="candidate-mobile-input"
                  value={formData.mobile || ''}
                  onChange={(val) => handleChange('mobile', typeof val === 'object' && val !== null ? (val.e164 || val.rawInput || '') : val)}
                  defaultCountry="IN"
                  brandColor={brandColor}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.mobile || '—'}</span>
                </div>
              )}
            </div>

            {/* Alternate Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Alternate Contact
              </label>
              {isEditing ? (
                <InternationalPhoneInput
                  id="candidate-alternate-phone-input"
                  value={formData.alternateContact || ''}
                  onChange={(val) => handleChange('alternateContact', typeof val === 'object' && val !== null ? (val.e164 || val.rawInput || '') : val)}
                  defaultCountry="IN"
                  brandColor={brandColor}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.alternateContact || '—'}</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CARD 3: RESIDENTIAL ADDRESS
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Home size={14} />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Residential Address
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Current</span>
          </div>

          <div className="space-y-3.5">
            {/* Street Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Street Address <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.currentAddress || ''}
                  onChange={(e) => handleChange('currentAddress', e.target.value)}
                  placeholder="House / Flat No., Street, Locality"
                  className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.currentAddress ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.currentAddress || '—'}</span>
                </div>
              )}
            </div>

            {/* City, State, Country, Postal Code */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  City <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                    className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.city ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                ) : (
                  <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                    {formData.city || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  State <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="State"
                    className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.state ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                ) : (
                  <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                    {formData.state || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Country <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.country || ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Country"
                    className={`w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.country ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                ) : (
                  <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                    {formData.country || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ZIP Code <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.postalCode || ''}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    placeholder="ZIP / Postal"
                    className={`w-full h-9.5 px-3.5 py-2 text-xs font-mono font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.postalCode ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                ) : (
                  <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                    {formData.postalCode || '—'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CARD 4: EMERGENCY NETWORK
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <HeartHandshake size={14} />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Emergency Network
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Next of Kin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Contact Person */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Person
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContactName || ''}
                  onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                  placeholder="Full name of contact"
                  className="w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <UserCheck size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.emergencyContactName || '—'}</span>
                </div>
              )}
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Relationship
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContactRelationship || ''}
                  onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
                  placeholder="e.g. Spouse, Parent, Sibling"
                  className="w-full h-9.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formData.emergencyContactRelationship || 'Spouse'}
                </div>
              )}
            </div>

            {/* Primary Emergency Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Phone
              </label>
              {isEditing ? (
                <InternationalPhoneInput
                  id="candidate-emergency-phone-input"
                  value={formData.emergencyContactMobile || ''}
                  onChange={(val) => handleChange('emergencyContactMobile', typeof val === 'object' && val !== null ? (val.e164 || val.rawInput || '') : val)}
                  defaultCountry="IN"
                  brandColor={brandColor}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.emergencyContactMobile || '—'}</span>
                </div>
              )}
            </div>

            {/* Secondary Emergency Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Secondary Phone
              </label>
              {isEditing ? (
                <InternationalPhoneInput
                  id="candidate-emergency-secondary-phone-input"
                  value={formData.secondaryEmergencyContact || ''}
                  onChange={(val) => handleChange('secondaryEmergencyContact', typeof val === 'object' && val !== null ? (val.e164 || val.rawInput || '') : val)}
                  defaultCountry="IN"
                  brandColor={brandColor}
                />
              ) : (
                <div className="w-full h-9.5 px-3.5 flex items-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white gap-2 truncate">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.secondaryEmergencyContact || '—'}</span>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CandidateInfoTab;
