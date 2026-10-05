import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../ThemeContext';
import { createPortal } from 'react-dom';
import { AuthService } from '../services/auth/AuthService';

const FloatingInput = ({ label, type = "text", value, onChange, placeholder, error, rightElement }) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div className="relative w-full mb-6">
      <div className={`relative border rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 ${
        error ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.15)]' : 
        focused ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700/50'
      }`}>
        <label 
          className={`absolute left-4 transition-all duration-300 pointer-events-none z-10
            ${isActive ? '-top-2.5 text-xs bg-white dark:bg-slate-900 px-1 font-semibold ' + (error ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400') 
            : 'top-3.5 text-sm text-slate-400 dark:text-slate-500 font-medium'}`}
        >
          {label}
        </label>
        <div className="flex items-center">
          <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full px-4 py-3.5 bg-transparent outline-none text-slate-800 dark:text-slate-100 text-sm font-medium z-0 placeholder-transparent"
            placeholder={placeholder}
          />
          {rightElement && <div className="pr-3">{rightElement}</div>}
        </div>
      </div>
      {error && (
        <p className="absolute -bottom-5 left-1 text-[11px] font-semibold text-rose-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </p>
      )}
    </div>
  );
};

const UserProfileDrawer = ({ isOpen, onClose }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'password'
  
  // User Details State
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState({
    name: '',
    phone: '',
    department: 'ATS Administration',
    location: 'Chennai, India'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...details });
  const [detailsErrors, setDetailsErrors] = useState({});
  const [detailsSuccess, setDetailsSuccess] = useState('');

  // Password Change State
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirmPass: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Slide animation state
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const storedEmail = sessionStorage.getItem('pw_userEmail') || 'user@gmail.com';
      setEmail(storedEmail);
      
      const storedDetails = localStorage.getItem(`pw_details_${storedEmail}`);
      if (storedDetails) {
        const parsed = JSON.parse(storedDetails);
        setDetails(parsed);
        setEditForm(parsed);
      } else {
        const namePart = storedEmail.split('@')[0];
        const defaultName = namePart.charAt(0).toUpperCase() + namePart.slice(1) + ' User';
        const defaultDetails = {
          name: defaultName,
          phone: '+91 98765 43210',
          department: 'ATS Administration',
          location: 'Chennai, India'
        };
        setDetails(defaultDetails);
        setEditForm(defaultDetails);
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300); // Wait for slide out animation
  };

  if (!isOpen && !isAnimating) return null;

  // Validation
  const validatePhone = (phone) => /^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s-]/g, ''));

  const checkPasswordStrength = (pass) => {
    return {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass),
    };
  };

  const strengthRules = checkPasswordStrength(passwords.newPass);
  const strengthScore = Object.values(strengthRules).filter(Boolean).length;
  let strengthColor = 'bg-slate-200 dark:bg-slate-700';
  let strengthLabel = 'Very Weak';
  if (strengthScore > 0) { strengthColor = 'bg-rose-500'; strengthLabel = 'Weak'; }
  if (strengthScore >= 3) { strengthColor = 'bg-amber-400'; strengthLabel = 'Moderate'; }
  if (strengthScore === 5) { strengthColor = 'bg-emerald-500'; strengthLabel = 'Strong'; }

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!editForm.name.trim()) errors.name = 'Name is required';
    if (!editForm.phone.trim()) errors.phone = 'Phone number is required';
    else if (!validatePhone(editForm.phone)) errors.phone = 'Invalid phone number format';

    if (Object.keys(errors).length > 0) {
      setDetailsErrors(errors);
      setDetailsSuccess('');
      return;
    }

    setDetailsErrors({});
    setDetails(editForm);
    localStorage.setItem(`pw_details_${email}`, JSON.stringify(editForm));
    setIsEditing(false);
    setDetailsSuccess('Profile details updated seamlessly.');
    setTimeout(() => setDetailsSuccess(''), 3000);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    
    if (!passwords.current) errors.current = 'Current password is required';
    if (!passwords.newPass) errors.newPass = 'New password is required';
    else if (strengthScore < 5) errors.newPass = 'Password does not meet all requirements';
    if (passwords.newPass !== passwords.confirmPass) errors.confirmPass = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      setPasswordSuccess('');
      return;
    }

    try {
      await AuthService.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.newPass
      });
      setPasswordErrors({});
      setPasswordSuccess('Password secured and updated!');
      setPasswords({ current: '', newPass: '', confirmPass: '' });
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordErrors({ current: err.message || 'Failed to update password.' });
      setPasswordSuccess('');
    }
  };

  const renderStrengthItem = (isMet, label) => (
    <div className={`flex items-center gap-2 text-xs transition-colors duration-300 ${isMet ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
      <div className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-300 ${isMet ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
        {isMet ? (
          <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 transform scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        )}
      </div>
      {label}
    </div>
  );

  return createPortal(
    <div className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" 
        onClick={handleClose} 
      />

      {/* Drawer */}
      <div 
        className={`absolute top-0 right-0 h-full w-full max-w-[440px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[-10px_0_30px_rgba(0,0,0,0.1)] dark:border-l dark:border-slate-700/50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isAnimating ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header Profile Section */}
        <div className="relative pt-8 sm:pt-12 pb-5 sm:pb-6 px-4 sm:px-8 bg-gradient-to-br from-indigo-50/80 to-white/0 dark:from-indigo-950/20 dark:to-transparent border-b border-white/20 dark:border-slate-800/50">
          <button 
            onClick={handleClose}
            className="absolute top-3 sm:top-4 right-3 sm:top-4 p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-all group"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 shadow-lg flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                {email.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm"></div>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white tracking-tight truncate">{details.name || email.split('@')[0]}</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Premium Segmented Control */}
        <div className="px-4 sm:px-8 py-3.5 sm:py-5">
          <div className="flex p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl backdrop-blur-sm relative border border-slate-200/50 dark:border-slate-700/50">
            <div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-700 rounded-lg shadow-sm transition-transform duration-300 ease-spring"
              style={{ transform: `translateX(${activeTab === 'details' ? '0' : '100%'})`, left: '4px' }}
            />
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg relative z-10 transition-colors duration-300 ${activeTab === 'details' ? 'text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg relative z-10 transition-colors duration-300 ${activeTab === 'password' ? 'text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Manage Password
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-6 sm:pb-8 custom-scrollbar">
          {activeTab === 'details' ? (
            <div className="animate-fadeIn">
              {detailsSuccess && (
                <div className="mb-6 px-4 py-3 bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-3 backdrop-blur-sm animate-slideDown">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{detailsSuccess}</p>
                </div>
              )}

              {!isEditing ? (
                <div className="space-y-6">
                  {/* Read Only Cards */}
                  <div className="bg-white/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-5 backdrop-blur-sm">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700/50">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Department</p>
                        <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 mt-1">{details.department}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Contact Number</p>
                      <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 mt-1">{details.phone || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Office Location</p>
                      <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 mt-1">{details.location}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => { setEditForm({ ...details }); setIsEditing(true); }}
                    style={{ backgroundColor: brandColor }}
                    className="w-full py-3.5 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:brightness-110 active:scale-[0.98] cursor-pointer"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDetailsSubmit} className="animate-fadeIn">
                  <FloatingInput label="Full Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} error={detailsErrors.name} placeholder="Enter your full name" />
                  <FloatingInput label="Phone Number" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} error={detailsErrors.phone} placeholder="e.g. +91 98765 43210" />
                  <FloatingInput label="Department" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="e.g. Engineering" />
                  <FloatingInput label="Office Location" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} placeholder="e.g. London, UK" />

                  <div className="flex gap-4 mt-8">
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      style={{ backgroundColor: brandColor }}
                      className="flex-1 py-3.5 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:brightness-110 active:scale-[0.98] cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="animate-fadeIn">
              {passwordSuccess && (
                <div className="mb-6 px-4 py-3 bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-3 backdrop-blur-sm animate-slideDown">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{passwordSuccess}</p>
                </div>
              )}

              <FloatingInput 
                label="Current Password" 
                type={showCurrent ? "text" : "password"} 
                value={passwords.current} 
                onChange={e => setPasswords({...passwords, current: e.target.value})} 
                error={passwordErrors.current} 
                placeholder="Enter current password"
                rightElement={
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none">
                    {showCurrent ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : 
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  </button>
                }
              />
              
              <div className="relative mb-2">
                <FloatingInput 
                  label="New Password" 
                  type={showNew ? "text" : "password"} 
                  value={passwords.newPass} 
                  onChange={e => setPasswords({...passwords, newPass: e.target.value})} 
                  error={passwordErrors.newPass} 
                  placeholder="Enter new password"
                  rightElement={
                    <button type="button" onClick={() => setShowNew(!showNew)} className="text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none">
                      {showNew ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : 
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    </button>
                  }
                />
              </div>

              {/* Dynamic Strength Meter */}
              <div className="bg-white/40 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5 mb-6 backdrop-blur-md">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Password Strength</p>
                  <p className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${passwords.newPass ? (strengthScore === 5 ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-300') : 'text-slate-400'}`}>
                    {passwords.newPass ? strengthLabel : 'Not Set'}
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden mb-5">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${strengthColor}`} 
                    style={{ width: `${passwords.newPass ? (strengthScore / 5) * 100 : 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {renderStrengthItem(strengthRules.length, 'At least 8 characters')}
                  {renderStrengthItem(strengthRules.uppercase, 'Contains uppercase letter (A-Z)')}
                  {renderStrengthItem(strengthRules.lowercase, 'Contains lowercase letter (a-z)')}
                  {renderStrengthItem(strengthRules.number, 'Contains number (0-9)')}
                  {renderStrengthItem(strengthRules.special, 'Contains special character')}
                </div>
              </div>

              <FloatingInput 
                label="Confirm New Password" 
                type={showConfirm ? "text" : "password"} 
                value={passwords.confirmPass} 
                onChange={e => setPasswords({...passwords, confirmPass: e.target.value})} 
                error={passwordErrors.confirmPass} 
                placeholder="Confirm new password"
                rightElement={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none">
                    {showConfirm ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : 
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={strengthScore < 5 && passwords.newPass.length > 0}
                style={{ backgroundColor: brandColor }}
                className="w-full mt-4 py-3.5 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .ease-spring { transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* Custom Scrollbar for Drawer */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
      `}</style>
    </div>,
    document.body
  );
};

export default UserProfileDrawer;
