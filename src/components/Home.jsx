import React, { useState, useContext, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Dashboard from './Dashboard';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import { ThemeContext } from '../ThemeContext';
import { translations } from '../constants';
import ProfileDropdown from './ProfileDropdown';
import UserProfileModal from './UserProfileModal';
import UserManagement from './admin/UserManagement';
import RoleManagement from './admin/RoleManagement';
import PermissionManagement from './admin/PermissionManagement';
import CompanyAdminHub from './admin/company/CompanyAdminHub';
import TenantManagement from './admin/TenantManagement';
import AuditLogs from './admin/AuditLogs';
import ApiKeys from './admin/ApiKeys';
import FeatureFlags from './admin/FeatureFlags';
import SubscriptionBilling from './admin/SubscriptionBilling';
import AIUsage from './admin/AIUsage';
import HealthDashboard from './admin/HealthDashboard';
import SystemConfig from './admin/SystemConfig';
import RequisitionHub from './recruitment/RequisitionHub';
import CreateRequisitionPage from './recruitment/requisition/CreateRequisitionPage';
import JDRepository from './recruitment/jd/JDRepository';
import JobPostingsHub from './recruitment/postings/JobPostingsHub';
import ResumeIntakeHub from './recruitment/intake/ResumeIntakeHub';
import CandidatesHub from './recruitment/candidates/CandidatesHub';
import InterviewsHub from './recruitment/interviews/InterviewsHub';
import OffersHub from './recruitment/offers/OffersHub';
import PreboardingHub from './recruitment/preboarding/PreboardingHub';
import { PolicyAdminHub } from './policy/PolicyAdminHub';
import DashboardErrorBoundary from './dashboard/shared/DashboardErrorBoundary';
import { BreadcrumbProvider, useBreadcrumb } from './shared/BreadcrumbContext';
import PeopleWorksAI from './ai/PeopleWorksAI';

// Administration Domain (Retains Administration Security Scope)
const DOMAIN_BREADCRUMBS = {
  'user-management':        [{ label: 'Administration', view: 'user-management' }, { label: 'User Management', view: 'user-management' }],
  'role-management':        [{ label: 'Administration', view: 'user-management' }, { label: 'Role Management', view: 'role-management' }],
  'permission-management':  [{ label: 'Administration', view: 'user-management' }, { label: 'Permissions', view: 'permission-management' }],
  'policy-management':      [{ label: 'Administration', view: 'user-management' }, { label: 'Assessment Policies', view: 'policy-management' }],
  'company-management':     [{ label: 'Administration', view: 'user-management' }, { label: 'Company Admin', view: 'company-management' }],
  'audit-logs':             [{ label: 'Administration', view: 'user-management' }, { label: 'Audit Logs', view: 'audit-logs' }],
  'api-keys':               [{ label: 'Administration', view: 'user-management' }, { label: 'API Keys', view: 'api-keys' }],

  // Platform Admin Domain (Super Admin Scope)
  'tenant-management':      [{ label: 'Platform Admin', view: 'tenant-management' }, { label: 'Tenants / Customers', view: 'tenant-management' }],
  'subscription-billing':   [{ label: 'Platform Admin', view: 'tenant-management' }, { label: 'Subscription & Billing', view: 'subscription-billing' }],
  'feature-flags':          [{ label: 'Platform Admin', view: 'tenant-management' }, { label: 'Feature Flags', view: 'feature-flags' }],
  'ai-usage':               [{ label: 'Platform Admin', view: 'tenant-management' }, { label: 'AI Usage', view: 'ai-usage' }],
  'health-dashboard':       [{ label: 'Platform Admin', view: 'tenant-management' }, { label: 'Health Dashboard', view: 'health-dashboard' }],
  'system-config':          [{ label: 'Platform Admin', view: 'tenant-management' }, { label: 'System Config', view: 'system-config' }],
};

// Core Business Modules (Directly under Home - 'Recruitment' prefix removed)
const CORE_MODULE_BREADCRUMBS = {
  'dashboard':              [{ label: 'Dashboard', view: 'dashboard' }],
  'requisitions':           [{ label: 'Requisitions', view: 'requisitions' }],
  'requisition/create':     [{ label: 'Requisitions', view: 'requisitions' }],
  'job descriptions':       [{ label: 'Job Descriptions', view: 'job descriptions' }],
  'job postings':           [{ label: 'Job Postings', view: 'job postings' }],
  'job postings/publish':   [{ label: 'Job Postings', view: 'job postings' }, { label: 'Publish Job' }],
  'resume intake':          [{ label: 'Resume Intake', view: 'resume intake' }],
  'resume repository':      [{ label: 'Resume Intake', view: 'resume intake' }],
  'candidates':             [{ label: 'Candidates', view: 'candidates' }],
  'candidate management':   [{ label: 'Candidates', view: 'candidates' }],
  'candidate/import':       [{ label: 'Candidates', view: 'candidates' }, { label: 'Import Candidates' }],
  'interviews':             [{ label: 'Interviews', view: 'interviews' }],
  'interview management':   [{ label: 'Interviews', view: 'interviews' }],
  'offers':                 [{ label: 'Offer Management', view: 'offers' }],
  'offer management':       [{ label: 'Offer Management', view: 'offers' }],
  'preboarding':            [{ label: 'Preboarding', view: 'preboarding' }],
  'preboarding management': [{ label: 'Preboarding', view: 'preboarding' }],
};

import { AuthService } from '../services/auth/AuthService';

const ADMIN_VIEWS = [
  'user-management',
  'role-management',
  'permission-management',
  'policy-management',
  'company-management',
  'tenant-management',
  'audit-logs',
  'api-keys',
  'subscription-billing',
  'feature-flags',
  'ai-usage',
  'health-dashboard',
  'system-config'
];

const AccessDeniedView = ({ onBack }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/30 shadow-sm max-w-lg mx-auto my-auto">
    <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">403 - Access Restricted</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
      You do not have administrative privileges to access this configuration module.
    </p>
    <button 
      onClick={onBack}
      className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-all"
    >
      Return to Dashboard
    </button>
  </div>
);

const HomeContent = ({ onLogout }) => {
  const { activeLang, themeColor, isDarkMode } = useContext(ThemeContext);
  const { extraCrumbs, clearExtraCrumbs } = useBreadcrumb();
  const t = translations[activeLang] || translations['English'];
  const userContext = AuthService.getSecurityContext();
  const isAdminRole = userContext?.role === 'ats_admin' || userContext?.role === 'hr_admin' || userContext?.role === 'super_admin';

  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('pw_activeView');
      return saved ? JSON.parse(saved) : 'dashboard';
    }
    return 'dashboard';
  });
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('pw_activeView', JSON.stringify(activeView));
  }, [activeView]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getBreadcrumbs = () => {
    let base = DOMAIN_BREADCRUMBS[activeView] || CORE_MODULE_BREADCRUMBS[activeView];
    if (!base) {
      if (activeView === 'ai-workspace' || activeView === 'ai-copilot') {
        base = [{ label: 'AI Copilot Workspace', view: 'ai-workspace' }];
      } else {
        base = [{ label: activeView.charAt(0).toUpperCase() + activeView.slice(1), view: activeView }];
      }
    }
    if (extraCrumbs && extraCrumbs.length > 0) {
      const combined = [...base];
      extraCrumbs.forEach(extra => {
        const last = combined[combined.length - 1];
        if (!last || last.label.toLowerCase() !== (extra.label || '').toLowerCase()) {
          combined.push(extra);
        }
      });
      return combined;
    }
    return base;
  };

  const [postingReqId, setPostingReqId] = useState(null);

  const handleNavigate = (view, extraData = null) => {
    clearExtraCrumbs();
    if (view === 'job postings' && extraData) {
      setPostingReqId(extraData);
    }
    setActiveView(view);
  };

  const renderView = () => {
    // RBAC Route Guard: Admin modules require administrative role
    if (ADMIN_VIEWS.includes(activeView) && !isAdminRole) {
      return <AccessDeniedView onBack={() => setActiveView('dashboard')} />;
    }

    switch (activeView) {
      case 'user-management':      return <UserManagement />;
      case 'role-management':      return <RoleManagement />;
      case 'permission-management':return <PermissionManagement />;
      case 'policy-management':    return <PolicyAdminHub />;
      case 'company-management':   return <CompanyAdminHub />;
      case 'tenant-management':    return <TenantManagement />;
      case 'audit-logs':           return <AuditLogs />;
      case 'api-keys':             return <ApiKeys />;
      case 'subscription-billing': return <SubscriptionBilling />;
      case 'feature-flags':        return <FeatureFlags />;
      case 'ai-usage':             return <AIUsage />;
      case 'health-dashboard':     return <HealthDashboard />;
      case 'system-config':        return <SystemConfig />;
      case 'ai-workspace':
      case 'ai-copilot':           return <AIHomeWorkspace onNavigate={handleNavigate} />;
      case 'requisitions':         return <RequisitionHub onNavigate={handleNavigate} />;
      case 'requisition/create':   return <CreateRequisitionPage onNavigate={handleNavigate} onSaveRequisition={() => setActiveView('requisitions')} />;
      case 'job descriptions':     return <JDRepository onNavigate={handleNavigate} />;
      case 'job postings':         return <JobPostingsHub initialReqId={postingReqId} onNavigate={handleNavigate} />;
      case 'resume intake':        return <ResumeIntakeHub onNavigate={handleNavigate} />;
      case 'resume repository':    return <ResumeIntakeHub initialTab="repository" onNavigate={handleNavigate} />;
      case 'candidates':           return <CandidatesHub onNavigate={handleNavigate} />;
      case 'candidate management': return <CandidatesHub onNavigate={handleNavigate} />;
      case 'interviews':           return <InterviewsHub onNavigate={handleNavigate} />;
      case 'offers':               return <OffersHub onNavigate={handleNavigate} />;
      case 'offer management':     return <OffersHub onNavigate={handleNavigate} />;
      case 'preboarding':          return <PreboardingHub onNavigate={handleNavigate} />;
      case 'preboarding management': return <PreboardingHub onNavigate={handleNavigate} />;
      case 'dashboard':            return <Dashboard onNavigate={handleNavigate} onLogout={onLogout} onViewProfile={() => setShowProfileModal(true)} />;
      default:                     return (
        <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
          <EmptyState 
            icon="🚧" 
            title="Under Construction" 
            subtitle={`The ${getBreadcrumbs().join(' > ')} module is currently being built.`}
            themeColor={themeColor}
          />
        </div>
      );
    }
  };

  return (
    <div 
      className="flex flex-col h-full w-full text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300 overflow-hidden relative"
      style={{ 
        backgroundColor: isDarkMode ? '#0A0C10' : '#F8FAFC',
        backgroundImage: `radial-gradient(circle at 10% 10%, color-mix(in srgb, var(--pw-brand) ${isDarkMode ? '15%' : '8%'}, transparent), transparent 50%), radial-gradient(circle at 90% 90%, color-mix(in srgb, var(--pw-brand) ${isDarkMode ? '10%' : '5%'}, transparent), transparent 50%)`
      }}
    >
      {/* WCAG 2.2 Skip Navigation Link (SC 2.4.1 Level A) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[99999] focus:px-4 focus:py-2 focus:bg-[var(--pw-brand)] focus:text-white focus:font-bold focus:text-xs focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <div className="noise-overlay"></div>
      
      {/* Main Area (Sidebar + Content) */}
      <div className="flex flex-1 min-h-0 overflow-hidden w-full">
        
        {/* Sidebar Component */}
        <Sidebar 
          themeColor={themeColor} 
          activeView={activeView} 
          onNavigate={(view) => {
            setActiveView(view);
            setMobileMenuOpen(false);
          }} 
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
          <Header 
            breadcrumbs={getBreadcrumbs()}
            onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            isDashboard={activeView === 'dashboard'}
            onNavigate={handleNavigate}
            onLogout={onLogout}
            onViewProfile={() => setShowProfileModal(true)}
          />

          {/* Scrollable Main Content Landmark */}
          <main 
            id="main-content" 
            role="main" 
            tabIndex={-1} 
            className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col scrollbar-none outline-none"
            aria-label="Main Application Content"
          >
            <div className="flex-1 w-full max-w-[1800px] mx-auto p-2.5 sm:p-4 md:p-6 lg:p-8 pb-24 sm:pb-16 flex flex-col">
              <div className="mb-3 sm:mb-4 shrink-0">
                <Breadcrumb path={getBreadcrumbs()} onNavigate={handleNavigate} />
              </div>
              <div className="flex-1 pb-6 w-full">
                <DashboardErrorBoundary key={activeView} title="Module Temporarily Unavailable">
                  {renderView()}
                </DashboardErrorBoundary>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Floating PeopleWorks AI Chatbot & Trigger */}
      <PeopleWorksAI />

      {/* Fixed Full-Width Footer */}
      <div className="shrink-0 w-full z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] relative">
        <Footer />
      </div>

      <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
};

const Home = ({ onLogout }) => (
  <BreadcrumbProvider>
    <HomeContent onLogout={onLogout} />
  </BreadcrumbProvider>
);

export default Home;
