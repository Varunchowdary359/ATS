import React, { useState } from 'react';
import { MOCK_COMPANY } from '../admin/adminMockData';
import { useToast } from '../shared/ToastContext';
import { ModernPageHeader, ModernMetricsStrip } from './shared/ModernAdminLayoutComponents';
import { Building2, Save, X, Edit3, Calendar, Users, Briefcase, ShieldCheck } from 'lucide-react';

const Field = ({ label, value, editing, onChange, type = 'text', span = false }) => (
  <div className={span ? 'sm:col-span-2' : ''}>
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
    {editing ? (
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
    ) : (
      <div className="h-10 px-3 flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-200 border border-transparent">{value || <span className="text-slate-400">—</span>}</div>
    )}
  </div>
);

const CompanyManagement = () => {
  const { addToast } = useToast();
  const [data, setData] = useState(MOCK_COMPANY);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [saved, setSaved] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const set = (key) => (val) => setDraft(d => ({ ...d, [key]: val }));
  
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(data);

  const handleSave = () => { 
    if (!draft.name || !draft.email) {
      addToast({ title: 'Validation Error', message: 'Name and Email are required fields.', type: 'error' });
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setData(draft); 
      setEditing(false); 
      setSaved(true); 
      setIsSaving(false);
      addToast({ title: 'Profile Updated', message: 'Company settings have been updated.', type: 'success' });
      setTimeout(() => setSaved(false), 3000); 
    }, 600);
  };
  const handleCancel = () => { setDraft(data); setEditing(false); };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      <ModernPageHeader
        title="Company Profile & Settings"
        subtitle="View and update your organization's identity, official contact info, legal compliance, and subscription tier"
        icon={<Building2 className="w-5 h-5 text-white" />}
        primaryActionLabel={editing ? (isSaving ? "Saving..." : (!hasChanges ? "No Changes" : "Save Changes")) : "Edit Profile"}
        onPrimaryAction={editing ? handleSave : () => setEditing(true)}
        primaryActionDisabled={editing && (isSaving || !hasChanges)}
        secondaryActionLabel={editing && !isSaving ? "Cancel" : null}
        onSecondaryAction={editing && !isSaving ? handleCancel : undefined}
      />

      <ModernMetricsStrip
        stats={[
          { label: 'Founded', value: data.founded, sub: 'Established', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Employees', value: data.employees, sub: 'Total workforce', icon: <Users className="w-4 h-4" /> },
          { label: 'Industry', value: data.industry, sub: 'Primary sector', icon: <Briefcase className="w-4 h-4" /> },
          { label: 'Compliance', value: data.accountStatus, sub: 'Status', icon: <ShieldCheck className="w-4 h-4" /> }
        ]}
      />

      <div className="flex flex-col gap-6 max-w-5xl">
        {/* Logo + Identity */}
        <div className="relative overflow-hidden p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/25 shrink-0">
            PW
          </div>
          {editing && (
            <button className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </button>
          )}
        </div>
        <div className="flex-1">
          {editing
            ? <input value={draft.name} onChange={e => set('name')(e.target.value)} className="text-xl font-bold w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 mb-2" />
            : <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{data.name}</h2>}
          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>{data.industry}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>Founded {data.founded}</span>
            <span>·</span>
            <span>{data.employees} employees</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{data.accountStatus}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">{data.plan} Plan</span>
        </div>
      </div>

      {/* Contact Details */}
      <div className="relative overflow-hidden p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-5">Contact & Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Official Email"   value={editing ? draft.email   : data.email}   editing={editing} onChange={set('email')}   type="email" />
          <Field label="Phone Number"     value={editing ? draft.phone   : data.phone}   editing={editing} onChange={set('phone')}   type="tel"   />
          <Field label="Website"          value={editing ? draft.website : data.website} editing={editing} onChange={set('website')} type="url"   />
          <Field label="Timezone"         value={editing ? draft.timezone: data.timezone}editing={editing} onChange={set('timezone')}/>
          <Field label="Address"          value={editing ? draft.address : data.address} editing={editing} onChange={set('address')} span />
          <Field label="State / Province" value={editing ? draft.state   : data.state}   editing={editing} onChange={set('state')}   />
          <Field label="Country"          value={editing ? draft.country : data.country} editing={editing} onChange={set('country')} />
          <Field label="PIN / ZIP Code"   value={editing ? draft.pincode : data.pincode} editing={editing} onChange={set('pincode')} />
        </div>
      </div>

      {/* Legal */}
      <div className="relative overflow-hidden p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-5">Legal & Compliance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="GSTIN"   value={editing ? draft.gstin : data.gstin} editing={editing} onChange={set('gstin')} />
          <Field label="CIN"     value={editing ? draft.cin   : data.cin}   editing={editing} onChange={set('cin')}   />
        </div>
      </div>

      {/* Subscription */}
      <div className="relative overflow-hidden p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-5">Subscription Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[['Plan', data.plan, 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'],['Expiry', data.planExpiry, 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'],['Account Status', data.accountStatus, 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300']].map(([label, val, cls]) => (
            <div key={label} className={`p-4 rounded-2xl ${cls}`}>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</div>
              <div className="text-sm font-extrabold">{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};

export default CompanyManagement;
