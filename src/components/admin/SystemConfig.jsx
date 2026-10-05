import React, { useState, useContext } from 'react';
import { useToast } from '../shared/ToastContext';
import { ThemeContext } from '../../ThemeContext';
import ConfirmModal from './shared/ConfirmModal';
import {
  ModernPageHeader,
  ModernMetricsStrip,
} from './shared/ModernAdminLayoutComponents';
import { Settings, Save, RotateCcw, Shield, HardDrive, Mail, Server } from 'lucide-react';

const DEFAULTS = {
  sessionTimeout: '30',
  maxRetries: '5',
  mfaEnforced: true,
  maxUpload: '10',
  allowedExtensions: 'pdf, docx, png, jpg',
  smtpHost: 'smtp.postmarkapp.com',
  smtpPort: '587',
  smtpUser: 'smtp-auth-user@peopleworks.in',
};

const SystemConfig = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const brandColor = activeTheme?.color || '#2563eb';

  const [savedSettings, setSavedSettings] = useState(DEFAULTS);
  
  // Security Config
  const [sessionTimeout, setSessionTimeout] = useState(DEFAULTS.sessionTimeout);
  const [maxRetries, setMaxRetries] = useState(DEFAULTS.maxRetries);
  const [mfaEnforced, setMfaEnforced] = useState(DEFAULTS.mfaEnforced);

  // Storage Config
  const [maxUpload, setMaxUpload] = useState(DEFAULTS.maxUpload);
  const [allowedExtensions, setAllowedExtensions] = useState(DEFAULTS.allowedExtensions);

  // SMTP Configuration
  const [smtpHost, setSmtpHost] = useState(DEFAULTS.smtpHost);
  const [smtpPort, setSmtpPort] = useState(DEFAULTS.smtpPort);
  const [smtpUser, setSmtpUser] = useState(DEFAULTS.smtpUser);
  
  const [isSaving, setIsSaving] = useState({ security: false, storage: false, smtp: false });

  const hasSecurityChanges = sessionTimeout !== savedSettings.sessionTimeout || maxRetries !== savedSettings.maxRetries || mfaEnforced !== savedSettings.mfaEnforced;
  const hasStorageChanges = maxUpload !== savedSettings.maxUpload || allowedExtensions !== savedSettings.allowedExtensions;
  const hasSmtpChanges = smtpHost !== savedSettings.smtpHost || smtpPort !== savedSettings.smtpPort || smtpUser !== savedSettings.smtpUser;

  const handleSave = (section) => {
    let key = '';
    if (section === 'Security Policy') key = 'security';
    else if (section === 'Storage Settings') key = 'storage';
    else if (section === 'SMTP Gateway') key = 'smtp';

    setIsSaving(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSavedSettings({
        sessionTimeout, maxRetries, mfaEnforced,
        maxUpload, allowedExtensions,
        smtpHost, smtpPort, smtpUser
      });
      setIsSaving(prev => ({ ...prev, [key]: false }));
      addToast({ title: 'Configuration Saved', message: `Settings for "${section}" were updated successfully.`, type: 'success' });
    }, 600);
  };

  const handleResetDefaults = () => {
    setSessionTimeout(DEFAULTS.sessionTimeout);
    setMaxRetries(DEFAULTS.maxRetries);
    setMfaEnforced(DEFAULTS.mfaEnforced);
    setMaxUpload(DEFAULTS.maxUpload);
    setAllowedExtensions(DEFAULTS.allowedExtensions);
    setSmtpHost(DEFAULTS.smtpHost);
    setSmtpPort(DEFAULTS.smtpPort);
    setSmtpUser(DEFAULTS.smtpUser);
    setShowResetConfirm(false);
    addToast({ title: 'Defaults Restored', message: 'All system parameters reset to factory defaults.', type: 'info' });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="System Configuration & Network Parameters"
        subtitle="Configure global SaaS security policies, SMTP relay gateways, file upload limits, and session timeouts"
        icon={<Settings className="w-5 h-5 text-white" />}
        primaryActionLabel="Reset Factory Defaults"
        onPrimaryAction={() => setShowResetConfirm(true)}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Security Enforcement', value: 'MFA Enforced', sub: 'Multi-factor authentication', icon: <Shield className="w-4 h-4" /> },
          { label: 'Session Inactivity Limit', value: `${sessionTimeout} Mins`, sub: 'Auto-logout threshold', icon: <Server className="w-4 h-4" /> },
          { label: 'Max File Attachment', value: `${maxUpload} MB`, sub: 'Per document upload', icon: <HardDrive className="w-4 h-4" /> },
          { label: 'SMTP Relay Host', value: 'Postmark', sub: 'Port 587 (TLS)', icon: <Mail className="w-4 h-4" /> },
        ]}
      />

      {/* Configuration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Security Policy Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Shield className="w-4 h-4 text-blue-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Security & Authentication Policy</h3>
            </div>

            <div className="flex flex-col gap-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Session Inactivity Timeout (Minutes)</label>
                <input type="number" value={sessionTimeout} onChange={e=>setSessionTimeout(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Failed Password Retries Before Lockout</label>
                <input type="number" value={maxRetries} onChange={e=>setMaxRetries(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Mandatory Multi-Factor Authentication</div>
                  <div className="text-[11px] text-slate-400">Enforce TOTP / SMS MFA on all admin accounts</div>
                </div>
                <input type="checkbox" checked={mfaEnforced} onChange={e=>setMfaEnforced(e.target.checked)} className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              onClick={() => handleSave('Security Policy')} 
              disabled={isSaving.security || !hasSecurityChanges}
              className="h-8.5 px-4 rounded-lg text-xs font-bold text-white shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
              style={{ backgroundColor: !hasSecurityChanges ? '#94a3b8' : brandColor }}
            >
              {isSaving.security ? (
                'Processing...'
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> {!hasSecurityChanges ? 'No Changes' : 'Save Security Policy'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* File Storage Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <HardDrive className="w-4 h-4 text-purple-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Storage & Document Attachments</h3>
            </div>

            <div className="flex flex-col gap-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Upload Limit per Document (MB)</label>
                <input type="number" value={maxUpload} onChange={e=>setMaxUpload(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Allowed Extension Whitelist</label>
                <input type="text" value={allowedExtensions} onChange={e=>setAllowedExtensions(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              onClick={() => handleSave('Storage Settings')} 
              disabled={isSaving.storage || !hasStorageChanges}
              className="h-8.5 px-4 rounded-lg text-xs font-bold text-white shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
              style={{ backgroundColor: !hasStorageChanges ? '#94a3b8' : brandColor }}
            >
              {isSaving.storage ? (
                'Processing...'
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> {!hasStorageChanges ? 'No Changes' : 'Save Storage Limits'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* SMTP Gateway Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-5 md:col-span-2">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Mail className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">SMTP Outbound Mail Relay Gateway</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">SMTP Server Host</label>
                <input type="text" value={smtpHost} onChange={e=>setSmtpHost(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Relay Port</label>
                <input type="text" value={smtpPort} onChange={e=>setSmtpPort(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Authentication Sender Account</label>
                <input type="text" value={smtpUser} onChange={e=>setSmtpUser(e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              onClick={() => handleSave('SMTP Gateway')} 
              disabled={isSaving.smtp || !hasSmtpChanges}
              className="h-8.5 px-4 rounded-lg text-xs font-bold text-white shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
              style={{ backgroundColor: !hasSmtpChanges ? '#94a3b8' : brandColor }}
            >
              {isSaving.smtp ? (
                'Processing...'
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> {!hasSmtpChanges ? 'No Changes' : 'Save SMTP Parameters'}
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetDefaults}
        title="Reset Factory Defaults"
        message="Are you sure you want to reset all system parameters to default values?"
        confirmText="Reset Defaults"
      />
    </div>
  );
};

export default SystemConfig;
