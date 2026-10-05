import React, { useState, useRef, useContext } from 'react';
import { MOCK_COMPANY_PROFILE } from '../companyAdminMockData';
import { Building2, Globe, Mail, Phone, MapPin, Edit3, Save, X, Upload, Check, ShieldCheck } from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import RightDrawer from '../shared/RightDrawer';
import { ModernPageHeader, DrawerSection, DrawerField } from '../shared/ModernAdminLayoutComponents';

const CompanyProfileView = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#2563eb';
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedLogo = sessionStorage.getItem('pw_companyLogo');
      return savedLogo ? { ...MOCK_COMPANY_PROFILE, logoUrl: savedLogo } : MOCK_COMPANY_PROFILE;
    }
    return MOCK_COMPANY_PROFILE;
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(profile);

  const set = (key) => (val) => setDraft(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setProfile(draft);
      setEditing(false);
      if (draft.logoUrl) {
        sessionStorage.setItem('pw_companyLogo', draft.logoUrl);
      }
      setIsSaving(false);
      addToast({ title: 'Profile Saved', message: 'Company legal registration details updated successfully.', type: 'success' });
    }, 600);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast({ title: 'File Too Large', message: 'Please select an image smaller than 5MB.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setProfile(prev => ({ ...prev, logoUrl: dataUrl }));
        setDraft(prev => ({ ...prev, logoUrl: dataUrl }));
        sessionStorage.setItem('pw_companyLogo', dataUrl);
        addToast({ title: 'Logo Uploaded', message: 'Company logo image updated successfully!', type: 'success' });
      }
    };
    reader.readAsDataURL(file);
  };

  if (editing) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0f111a] animate-fade-in relative z-10 overflow-y-auto overflow-x-hidden scrollbar-none">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <div className="flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                <button onClick={handleCancel} className="hover:text-blue-600 transition-colors">Company Profile</button>
                <span className="mx-2">/</span>
                <span className="text-slate-600 dark:text-slate-300">Edit Legal Profile</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Company Legal Profile</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update corporate details, tax IDs, and registered addresses</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleCancel} disabled={isSaving} className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer">
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving || !hasChanges}
                style={{ backgroundColor: brandColor }}
                className="h-9 px-4 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:brightness-110"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : (!hasChanges ? 'No Changes' : 'Save Profile')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <DrawerSection title="Company Identity" description="Legal and brand names">
            <DrawerField label="Legal Entity Name" required>
              <input type="text" value={draft.legalName} onChange={e=>set('legalName')(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </DrawerField>
            <DrawerField label="Trade / Brand Name">
              <input type="text" value={draft.tradeName} onChange={e=>set('tradeName')(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </DrawerField>
          </DrawerSection>
          
          <DrawerSection title="Tax & Registration IDs" description="Government identification numbers">
            <div className="grid grid-cols-2 gap-4">
              <DrawerField label="Corporate ID (CIN)">
                <input type="text" value={draft.cin} onChange={e=>set('cin')(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </DrawerField>
              <DrawerField label="PAN Number">
                <input type="text" value={draft.pan} onChange={e=>set('pan')(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </DrawerField>
              <DrawerField label="GSTIN">
                <input type="text" value={draft.gstin} onChange={e=>set('gstin')(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </DrawerField>
              <DrawerField label="TAN Code">
                <input type="text" value={draft.tan} onChange={e=>set('tan')(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </DrawerField>
            </div>
          </DrawerSection>

          <DrawerSection title="Contact & Address" description="Corporate office information">
            <DrawerField label="Primary Website">
              <input type="text" value={draft.website} onChange={e=>set('website')(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </DrawerField>
            <DrawerField label="Address Line 1" required>
              <input type="text" value={draft.addressLine1} onChange={e=>set('addressLine1')(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </DrawerField>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <DrawerField label="City" required>
                <input type="text" value={draft.city} onChange={e=>set('city')(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </DrawerField>
              <DrawerField label="Pincode" required>
                <input type="text" value={draft.pincode} onChange={e=>set('pincode')(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </DrawerField>
            </div>
          </DrawerSection>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      <ModernPageHeader
        title="Company Profile & Legal Registrations"
        subtitle="Manage legal entity name, tax IDs (PAN, GSTIN, CIN), corporate address and branding assets."
        icon={<Building2 className="w-5 h-5 text-white" />}
        primaryActionLabel="Edit Profile"
        primaryActionIcon={<Edit3 className="w-4 h-4" />}
        onPrimaryAction={() => { setDraft(profile); setEditing(true); }}
        themeColor={brandColor}
      />

      {/* Profile Summary Card */}
      <div className="relative overflow-hidden p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
        <div className="flex items-center gap-5">
          {profile.logoUrl ? (
            <div className="w-20 h-20 rounded-2xl border-2 border-blue-500/30 bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center overflow-hidden shadow-lg shrink-0">
              <img src={profile.logoUrl} alt="Company Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
              PW
            </div>
          )}

          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{profile.legalName}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Verified Enterprise
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-blue-500" /> {profile.website}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-blue-500" /> {profile.email}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-blue-500" /> {profile.phone}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleTriggerFileInput} 
            className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Upload className="w-4 h-4 text-blue-500" /> Upload Logo Image
          </button>
        </div>
      </div>

      {/* Grid Display of Legal Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Legal Registration & Entity */}
        <div className="relative overflow-hidden p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span>1. Legal Registration & Tax Identification</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-bold block mb-1">Legal Entity Name</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{profile.legalName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">Trade / Brand Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.tradeName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">Registration Type</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.entityType}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">Corporate ID (CIN)</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{profile.cin}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">PAN Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{profile.pan}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">GSTIN Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{profile.gstin}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">TAN Deduction Code</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{profile.tan}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">PF Code</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{profile.pfCode}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Corporate Address */}
        <div className="relative overflow-hidden p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span>2. Corporate Address & Location</span>
            <MapPin className="w-4 h-4 text-blue-500" />
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-bold block mb-1">Primary Currency</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{profile.currency}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">Fiscal Year Start</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.fiscalYearStart}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">Default Timezone</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{profile.timezone}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">Corporate Phone</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.phone}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-bold block mb-1">Registered Address</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{profile.addressLine1}, {profile.addressLine2}, {profile.city}, {profile.state} - {profile.pincode}, {profile.country}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileView;
