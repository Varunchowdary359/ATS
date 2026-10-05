import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../ThemeContext';
import Logo from './Logo';
import Footer from './Footer';
import Header from './Header';
import InternationalPhoneInput from './InternationalPhoneInput';

import { translations } from '../constants';
import { AuthService } from '../services/auth/AuthService';
import { DatabaseService } from '../services/db/DatabaseService';

const Login = ({ onLogin }) => {

  const { activeLang } = useContext(ThemeContext);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [authView, setAuthView] = useState('login'); // 'login' | 'forgot_password' | 'otp' | 'verify_otp'
  const [timer, setTimer] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef([]);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetType, setResetType] = useState('mobile'); // 'mobile' | 'email'
  const [resetPhoneData, setResetPhoneData] = useState({
    rawInput: '',
    digitsOnly: '',
    e164: '',
    country: 'IN',
    callingCode: '+91',
    isValid: false,
    isPossible: false,
    error: ''
  });
  const [otpType, setOtpType] = useState('mobile'); // 'mobile' | 'email'
  const [otpContact, setOtpContact] = useState('');
  const [otpError, setOtpError] = useState('');
  const [phoneData, setPhoneData] = useState({
    rawInput: '',
    digitsOnly: '',
    e164: '',
    country: 'IN',
    callingCode: '+91',
    isValid: false,
    isPossible: false,
    error: ''
  });
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const handleViewChange = (view) => {
    setEmail('');
    setPassword('');
    setErrors({});
    setResetEmail('');
    setResetError('');
    setResetType('mobile');
    setResetPhoneData({
      rawInput: '',
      digitsOnly: '',
      e164: '',
      country: 'IN',
      callingCode: '+91',
      isValid: false,
      isPossible: false,
      error: ''
    });
    setOtpType('mobile');
    setOtpContact('');
    setOtpError('');
    setPhoneData({
      rawInput: '',
      digitsOnly: '',
      e164: '',
      country: 'IN',
      callingCode: '+91',
      isValid: false,
      isPossible: false,
      error: ''
    });
    setOtp(['', '', '', '']);
    setTimer(0);
    setIsAcknowledged(false);
    setAuthView(view);
  };

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle OTP Input
  const handleOtpChange = (index, value) => {
    // Strip non-numeric
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue && value !== '') return; // Ignore if user typed a letter

    const newOtp = [...otp];
    newOtp[index] = numericValue.substring(numericValue.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (numericValue && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData) {
      const newOtp = ['', '', '', ''];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      // Focus the next empty box or the last box
      const nextIndex = pastedData.length < 4 ? pastedData.length : 3;
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Active translation dictionary
  const t = translations[activeLang] || translations['English'];

  const validateEmailOrUserId = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return t.email_required || 'Email or User ID is required';
    
    // If it contains '@', validate as strict email
    if (trimmed.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return 'Please enter a valid email address';
      }
      return ''; // Valid email
    }

    // No '@' found. Treat as User ID.
    // Check if it's a typo of an email (e.g., missing @ but has domain/provider)
    if (/\.(com|net|org|in|co|us|uk|io)$/i.test(trimmed) || /gmail|yahoo|outlook|hotmail/i.test(trimmed)) {
      return 'Please enter a valid email address'; 
    }

    // Check for spaces
    if (trimmed.includes(' ')) {
      return 'User ID cannot contain spaces';
    }

    // Min length check (before regex to give better error if too short)
    if (trimmed.length < 3) {
      return 'User ID must be at least 3 characters';
    }

    // Strict Employee ID Format: PW/1234
    if (!/^PW\/\d+$/i.test(trimmed)) {
      return 'User ID must be in the format PW/1234';
    }

    return ''; // Valid User ID
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    let newErrors = {};

    const emailError = validateEmailOrUserId(email);
    if (emailError) {
      newErrors.email = emailError;
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isAcknowledged) {
      newErrors.acknowledgement = 'Please acknowledge the Corporate Security Policy to sign in.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const session = await AuthService.login({ emailOrId: email, password });
      setErrors({});
      DatabaseService.logSecurityEvent({
        actor: session.email,
        action: 'AUTH_LOGIN_SUCCESS',
        resource: 'Session',
        resourceId: session.token,
        details: `User ${session.email} logged in with role ${session.role}`
      });
      if (onLogin) onLogin(session);
    } catch (err) {
      DatabaseService.logSecurityEvent({
        actor: email,
        action: 'AUTH_LOGIN_FAILED',
        resource: 'Session',
        resourceId: 'N/A',
        details: err.message,
        status: 'FAILED'
      });
      setErrors({ auth: err.message || 'Invalid email or password' });
    }
  };


  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if(otp.join('').length === 4) {
       alert('Verification Successful! (Mock)');
       handleViewChange('login');
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen w-full bg-slate-50 dark:bg-enterprise-dark font-sans overflow-hidden relative">
      {/* WCAG 2.2 Skip Navigation Link (SC 2.4.1 Level A) */}
      <a
        href="#login-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[99999] focus:px-4 focus:py-2 focus:bg-[var(--pw-brand)] focus:text-white focus:font-bold focus:text-xs focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to login form
      </a>

      <div className="flex flex-col lg:flex-row flex-1 w-full min-h-0 overflow-hidden">

      {/* LEFT PANEL - About Us & Features */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 bg-brand-panel p-6 xl:p-10 2xl:p-12 relative shrink-0 overflow-hidden">
        
        {/* Logo positioned top-left */}
        <div className="absolute top-6 start-8 xl:top-8 xl:start-12">
          <Logo className="w-[130px] xl:w-[160px]" />
        </div>

        <div className="max-w-xl mx-auto w-full text-start mt-8 xl:mt-0" dir={activeLang === 'Arabic' ? 'rtl' : 'ltr'}>
          <h2 className="text-2xl xl:text-3xl font-bold text-slate-900 dark:text-white mb-1 xl:mb-2 leading-tight">{t.about || 'About Us'}</h2>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-[var(--pw-brand-dark)] dark:text-sky-400 mb-3 xl:mb-6 leading-tight">{t.ats || 'PeopleWorks ATS'}</h1>
          
          <p className="text-slate-700 dark:text-slate-300 mb-4 xl:mb-6 leading-relaxed text-sm xl:text-base">
            {t.desc}
          </p>

          {/* Feature Cards */}
          <div className="flex flex-col gap-2.5 xl:gap-3.5">
            
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-800 p-3 xl:p-3.5 rounded-xl border border-white/20 dark:border-slate-700 shadow-xs flex items-start gap-3 xl:gap-4">
              <div className="bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-2 xl:p-2.5 rounded-lg mt-0.5 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-xs xl:text-sm mb-0.5 xl:mb-1">{t.t1_title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs xl:text-sm leading-relaxed">{t.t1_desc}</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-800 p-3 xl:p-3.5 rounded-xl border border-white/20 dark:border-slate-700 shadow-xs flex items-start gap-3 xl:gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2 xl:p-2.5 rounded-lg mt-0.5 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-xs xl:text-sm mb-0.5 xl:mb-1">{t.t2_title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs xl:text-sm leading-relaxed">{t.t2_desc}</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-800 p-3 xl:p-3.5 rounded-xl border border-white/20 dark:border-slate-700 shadow-xs flex items-start gap-3 xl:gap-4">
              <div className="bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 p-2 xl:p-2.5 rounded-lg mt-0.5 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-xs xl:text-sm mb-0.5 xl:mb-1">{t.t3_title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs xl:text-sm leading-relaxed">{t.t3_desc}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between flex-1 relative bg-slate-50 dark:bg-slate-900 py-2 sm:py-3 lg:py-4 min-h-0 overflow-hidden">

        {/* Top Controls */}
        <Header isLoginPage={true} className="flex items-center justify-between w-full px-4 sm:px-6 lg:absolute lg:top-4 lg:end-6 lg:p-0 lg:w-auto z-20 shrink-0" />

        <main id="login-content" role="main" tabIndex={-1} aria-label="Sign in form" className="flex-1 flex flex-col justify-center items-center w-full px-3.5 sm:px-6 py-2 min-h-0 my-auto">
          {/* Form Container */}
          <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 xl:p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 text-start transition-all shrink-0" dir={activeLang === 'Arabic' ? 'rtl' : 'ltr'}>
          
          {authView === 'login' && (
            <>
              <div className="mb-2.5 sm:mb-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-0.5">{t.welcome || 'Welcome back'}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-xs">{t.signin_desc || 'Sign in to your peopleworks account to continue'}</p>
              </div>

              <form className="flex flex-col gap-2.5 sm:gap-3" onSubmit={handleLogin} noValidate>
                
                {/* Email Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">
                    {t.email || 'Email or User ID'}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 start-0 flex items-center pl-3 rtl:pr-3 rtl:pl-0 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <input 
                      id="email"
                      type="text"
                      autoComplete="username"
                      aria-required="true"
                      aria-invalid={errors.email || errors.auth ? "true" : "false"}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email || errors.auth) setErrors({});
                      }}
                      placeholder={t.email_placeholder || 'you@company.com'}
                      className={`w-full h-9.5 sm:h-10 pl-9 sm:pl-9 pr-3 rtl:pr-9 rtl:pl-3 rounded-lg border ${errors.email || errors.auth ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-brand'} bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all text-start`}
                    />
                  </div>
                  {errors.email && <span id="email-error" role="alert" className="text-red-500 text-[11px] font-medium">{errors.email}</span>}
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
                    {t.password || 'Password'}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 start-0 flex items-center pl-3 rtl:pr-3 rtl:pl-0 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      aria-required="true"
                      aria-invalid={errors.password || errors.auth ? "true" : "false"}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password || errors.auth) setErrors({});
                      }}
                      placeholder={t.password_placeholder || 'Enter your password'}
                      className={`w-full h-9.5 sm:h-10 px-9 rounded-lg border ${errors.password || errors.auth ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-brand'} bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all text-start`}
                    />
                    <button 
                      type="button" 
                      className="absolute end-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" 
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <span id="password-error" role="alert" className="text-red-500 text-[11px] font-medium">{errors.password}</span>}
                  <div className="flex items-center justify-between mt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-brand focus:ring-brand accent-brand dark:border-slate-600 dark:bg-slate-700" />
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t.remember_me || 'Remember me'}</span>
                    </label>
                    <button 
                      type="button" 
                      className="text-xs font-semibold text-[var(--pw-brand-dark)] dark:text-sky-400 hover:underline"
                      onClick={() => handleViewChange('forgot_password')}
                    >
                      {t.forgot || 'Forgot password?'}
                    </button>
                  </div>
                </div>

                {/* Corporate Policy Acknowledgement Checkbox */}
                <div className="flex flex-col gap-0.5">
                  <label className="flex items-start gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={isAcknowledged}
                      onChange={(e) => {
                        setIsAcknowledged(e.target.checked);
                        if (errors.acknowledgement) {
                          setErrors(prev => ({ ...prev, acknowledgement: undefined }));
                        }
                      }}
                      className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-brand focus:ring-brand accent-brand dark:border-slate-600 dark:bg-slate-700 transition-colors shrink-0" 
                    />
                    <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-snug">
                      I acknowledge & agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowPolicyModal(true)}
                        className="text-[var(--pw-brand-dark)] dark:text-sky-400 font-semibold hover:underline inline-flex items-center"
                      >
                        Corporate Security Policy
                      </button>
                    </span>
                  </label>
                  {errors.acknowledgement && (
                    <span className="text-red-500 text-[11px] font-medium ps-5">{errors.acknowledgement}</span>
                  )}
                </div>

                {/* Action Buttons */}
                {errors.auth && (
                  <div className="p-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-xs font-medium">
                    {errors.auth}
                  </div>
                )}
                <div className="flex gap-2 mt-0.5">
                  <button 
                    type="submit" 
                    style={{ backgroundColor: 'var(--pw-brand)', color: 'var(--pw-brand-fg, #ffffff)' }}
                    className="flex-1 h-9.5 sm:h-10 hover:brightness-110 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center transition-all shadow-xs cursor-pointer"
                    aria-label="Sign In"
                  >
                    {t.signin_btn || 'Sign In'}
                    <svg className="w-4 h-4 ms-1.5 rtl:-scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => { setEmail(''); setPassword(''); setErrors({}); }}
                    className="w-9.5 sm:w-10 h-9.5 sm:h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                    title="Reset Form"
                    aria-label="Reset Form"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                
                {/* Divider */}
                <div className="flex items-center gap-3 my-1 sm:my-1.5" aria-hidden="true">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">{t.continue || 'or continue with'}</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                </div>

                {/* Alternative Login */}
                <button 
                  type="button" 
                  className="w-full h-9.5 sm:h-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  aria-label="Sign in with OTP"
                  onClick={() => handleViewChange('otp')}
                >
                  <svg className="w-4 h-4 me-2 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {t.otp_login_btn || 'OTP Login'}
                </button>
              </form>
            </>
          )}

          {authView === 'forgot_password' && (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t.reset_title || "Reset Password"}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {resetType === 'mobile' 
                    ? "Enter your registered mobile number to receive reset instructions."
                    : (t.reset_desc || "Enter your email or User ID to receive instructions")}
                </p>
              </div>

              {/* Segmented Selector for Reset Password: Mobile / Email */}
              <div className="grid grid-cols-2 gap-2 mb-3.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <button 
                  type="button"
                  onClick={() => {
                    setResetType('mobile');
                    setResetEmail('');
                    setResetError('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 select-none ${
                    resetType === 'mobile' 
                      ? 'bg-brand text-white shadow-md shadow-brand/25 dark:shadow-brand/40' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Mobile</span>
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setResetType('email');
                    setResetEmail('');
                    setResetError('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 select-none ${
                    resetType === 'email' 
                      ? 'bg-brand text-white shadow-md shadow-brand/25 dark:shadow-brand/40' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email</span>
                </button>
              </div>

              <form className="flex flex-col gap-3" onSubmit={(e) => {
                e.preventDefault();
                if (resetType === 'mobile') {
                  if (!resetPhoneData.digitsOnly) {
                    setResetError('Mobile number is required');
                    return;
                  }
                  if (!resetPhoneData.isValid) {
                    setResetError(resetPhoneData.error || 'Please enter a valid mobile number');
                    return;
                  }
                  setOtpContact(resetPhoneData.e164);
                } else {
                  const error = validateEmailOrUserId(resetEmail);
                  if (error) {
                    setResetError(error);
                    return;
                  }
                  setOtpContact(resetEmail);
                }

                setResetError('');
                setTimer(60);
                setOtp(['', '', '', '']);
                setAuthView('verify_otp');
              }} noValidate>
                {resetType === 'mobile' ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="resetMobileInput">
                      Mobile Number
                    </label>
                    <InternationalPhoneInput
                      id="resetMobileInput"
                      defaultCountry="IN"
                      value={resetPhoneData.rawInput}
                      error={resetError}
                      onChange={(data) => {
                        setResetPhoneData(data);
                        if (resetError) setResetError('');
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="reset-email">
                      {t.email || 'Email or User ID'}
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        id="reset-email"
                        type="text"
                        value={resetEmail}
                        onChange={(e) => { setResetEmail(e.target.value); if (resetError) setResetError(''); }}
                        placeholder={t.email_placeholder || 'you@company.com'}
                        className={`w-full h-10 px-3 rounded-lg border ${resetError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-brand'} bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all text-start`}
                      />
                    </div>
                    {resetError && <span className="text-red-500 text-[11px] font-medium">{resetError}</span>}
                  </div>
                )}

                <div className="mt-1">
                  <button 
                    type="submit" 
                    disabled={resetType === 'mobile' ? !resetPhoneData.isValid : !resetEmail.trim()}
                    className="w-full h-10 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t.send_link || "Send Reset Link"}
                  </button>
                </div>

                <div className="flex justify-center mt-1">
                  <button 
                    type="button" 
                    onClick={() => handleViewChange('login')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    {t.back_to_login || "Back to Login"}
                  </button>
                </div>
              </form>
            </>
          )}

          {authView === 'otp' && (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {otpType === 'mobile' ? (t.otp_title || "Mobile Login") : "Email Login"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {otpType === 'mobile' 
                    ? (t.otp_desc || "Enter your registered mobile number to receive a one-time password.")
                    : "Enter your registered email address to receive a one-time password."}
                </p>
              </div>

              {/* Unique Segmented Selector (No radio circle buttons) */}
              <div className="grid grid-cols-2 gap-2 mb-3.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <button 
                  type="button"
                  onClick={() => {
                    setOtpType('mobile');
                    setOtpContact('');
                    setOtpError('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 select-none ${
                    otpType === 'mobile' 
                      ? 'bg-brand text-white shadow-md shadow-brand/25 dark:shadow-brand/40' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Mobile</span>
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setOtpType('email');
                    setOtpContact('');
                    setOtpError('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 select-none ${
                    otpType === 'email' 
                      ? 'bg-brand text-white shadow-md shadow-brand/25 dark:shadow-brand/40' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email</span>
                </button>
              </div>

              <form className="flex flex-col gap-3" onSubmit={(e) => {
                e.preventDefault();
                if (otpType === 'mobile') {
                  if (!phoneData.digitsOnly) {
                    setOtpError('Mobile number is required');
                    return;
                  }
                  if (!phoneData.isValid) {
                    setOtpError(phoneData.error || 'Please enter a valid mobile number');
                    return;
                  }
                  setOtpContact(phoneData.e164);
                } else {
                  const contactTrimmed = otpContact.trim();
                  if (!contactTrimmed) {
                    setOtpError('Email address is required');
                    return;
                  }
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactTrimmed)) {
                    setOtpError('Please enter a valid email address');
                    return;
                  }
                }
                
                setOtpError('');
                setTimer(60);
                setOtp(['', '', '', '']);
                setAuthView('verify_otp');
              }} noValidate>
                {otpType === 'mobile' ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="otpMobileInput">
                      Mobile Number
                    </label>
                    <InternationalPhoneInput
                      id="otpMobileInput"
                      defaultCountry="IN"
                      value={phoneData.rawInput}
                      error={otpError}
                      onChange={(data) => {
                        setPhoneData(data);
                        setOtpContact(data.e164 || data.rawInput);
                        if (otpError) setOtpError('');
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="otpContact">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 start-0 flex items-center pl-3 rtl:pr-3 rtl:pl-0 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <input 
                        id="otpContact"
                        type="email"
                        value={otpContact}
                        onChange={(e) => { 
                          setOtpContact(e.target.value); 
                          if (otpError) setOtpError(''); 
                        }}
                        placeholder="Enter your email address"
                        aria-invalid={otpError ? "true" : "false"}
                        aria-describedby={otpError ? "otp-error" : undefined}
                        className={`w-full h-10 pl-9 pr-3 rtl:pr-9 rtl:pl-3 rounded-lg border ${otpError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-brand'} bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all text-start`}
                      />
                    </div>
                    {otpError && <span id="otp-error" className="text-red-500 text-[11px] font-medium">{otpError}</span>}
                  </div>
                )}

                <div className="mt-1">
                  <button 
                    type="submit" 
                    disabled={otpType === 'mobile' ? !phoneData.isValid : !otpContact.trim()}
                    className="w-full h-10 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t.send_otp || "Send OTP"}
                  </button>
                </div>

                <div className="flex justify-center mt-1">
                  <button 
                    type="button" 
                    onClick={() => handleViewChange('login')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    {t.back_to_login || "Back to Login"}
                  </button>
                </div>
              </form>
            </>
          )}



          {authView === 'verify_otp' && (
            <>
              <div className="mb-4 text-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t.verify_title || "Verify OTP"}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {otpType === 'mobile'
                    ? `Enter the 4-digit code sent to your mobile number (${otpContact})`
                    : `Enter the 4-digit code sent to your email (${otpContact})`}
                </p>
              </div>

              <form className="flex flex-col gap-3" onSubmit={handleVerifyOtp}>
                
                <div className="flex gap-2.5 sm:gap-3 justify-center my-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      aria-label={`Digit ${index + 1}`}
                      className="w-10 h-10 sm:w-11 sm:h-11 text-center text-base sm:text-lg font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                    />
                  ))}
                </div>

                <div className="mt-1">
                  <button 
                    type="submit" 
                    className="w-full h-10 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    disabled={otp.join('').length < 4}
                  >
                    {t.verify_btn || 'Verify Code'}
                  </button>
                </div>

                <div className="text-center mt-1">
                  {timer > 0 ? (
                    <p className="text-xs font-medium text-slate-500">
                      {t.resend_timer || 'Resend code in'} <span className="font-bold text-slate-900 dark:text-white">00:{timer < 10 ? `0${timer}` : timer}</span>
                    </p>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => {
                         setTimer(60);
                         setOtp(['', '', '', '']);
                         inputRefs.current[0]?.focus();
                      }}
                      className="text-xs font-bold text-brand hover:text-brand-hover hover:underline cursor-pointer"
                    >
                      <svg className="w-4 h-4 inline-block me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      {t.resend_otp || 'Resend OTP'}
                    </button>
                  )}
                </div>

                <div className="flex justify-center mt-1">
                  <button 
                    type="button" 
                    onClick={() => handleViewChange('login')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    {t.back_to_login || "Back to Login"}
                  </button>
                </div>

              </form>
            </>
          )}
          
          </div>
        </main>
      </div>
      </div>
      <Footer />

      {/* Corporate Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-start animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand/10 text-brand dark:text-sky-400 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Corporate Security & Usage Policy</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Standard System Access Terms</p>
                </div>
              </div>
              <button
                onClick={() => setShowPolicyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close Modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex gap-2">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Access strictly monitored under Enterprise Security & ISO/IEC 27001 compliance standards.</span>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">1. Authorized Access Only</h4>
                <p>This system is owned and operated by PeopleWorks. Access is restricted exclusively to authorized personnel for approved corporate tasks. Unauthorized access or attempt is prohibited by corporate policy and law.</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">2. Audit & Activity Logging</h4>
                <p>All activities, including user logins, IP addresses, session data, and records accessed are recorded and subject to regular security audit and compliance checks.</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">3. Confidentiality & Data Protection</h4>
                <p>Users must maintain the strict confidentiality of all recruitment data, applicant details, and internal communication accessed via this platform.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="px-4 h-9 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAcknowledged(true);
                  if (errors.acknowledgement) {
                    setErrors(prev => ({ ...prev, acknowledgement: undefined }));
                  }
                  setShowPolicyModal(false);
                }}
                className="px-4 h-9 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                I Accept & Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
