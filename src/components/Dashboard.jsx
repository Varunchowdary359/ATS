import React, { useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ThemeContext } from '../ThemeContext';
import { useFilter } from '../FilterContext';
import { useDashboardPreferences } from '../DashboardPreferencesContext';
import ClientCEODashboard from './dashboard/ClientCEODashboard';
import SuperAdminDashboard from './dashboard/SuperAdminDashboard';
import PWCEODashboard from './dashboard/PWCEODashboard';
import WorkspaceDashboard from './dashboard/WorkspaceDashboard';
import HeroCommandCenter from './dashboard/shared/HeroCommandCenter';
import { ToastProvider } from './dashboard/shared/ToastProvider';
import { WorkflowProvider } from './dashboard/shared/WorkflowContext';
import WorkflowModal from './dashboard/shared/WorkflowModal';
import { translations, ROLES } from '../constants';

const DashboardContent = ({ onNavigate, onLogout, onViewProfile }) => {
  const { activeRole, setActiveRole, activeTheme, activeLang } = useContext(ThemeContext);
  const { getOverrideCount, dashboardDateFilter } = useFilter() || {};
  const { preferences, toggleSection, reorderSections } = useDashboardPreferences();
  const themeColor = activeTheme?.color || '#3b82f6';
  const t = translations[activeLang] || translations['English'];

  // Compact reporting period dropdown
  const [isLoading] = useState(false);
  const [lastUpdated] = useState(t.db_just_now || 'just now');
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [isLiveSync, setIsLiveSync] = useState(true);

  const roleLabels = {
    super_admin: { title: 'PW Platform Admin', sub: 'Global tenant management and system health' },
    pw_ceo:      { title: 'PW CEO Dashboard',  sub: 'SaaS recurring revenue and business metrics' },
    client_ceo:  { title: t.db_ceo_title || 'CEO Command Center', sub: t.db_ceo_sub || 'Global talent acquisition intelligence and executive analytics' },
    workspace:   { title: 'Recruitment Workspace', sub: 'Recruitment operations, pipelines and team hiring' },
  };

  const info = roleLabels[activeRole?.id] || roleLabels.super_admin;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const scrollEl = document.querySelector('.overflow-y-auto');
    if (!scrollEl) return;
    const handleScroll = () => setIsScrolled(scrollEl.scrollTop > 150);
    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  const currentRole = activeRole?.id || 'super_admin';
  const roleDateFilter = dashboardDateFilter?.[currentRole] || { period: "1M" };
  const overrideCount = getOverrideCount ? getOverrideCount(currentRole) : 0;
  
  const bannerText = overrideCount > 0 
    ? `Dashboard Period: ${roleDateFilter.period} · ${overrideCount} section override${overrideCount > 1 ? 's' : ''}`
    : `Dashboard Period: ${roleDateFilter.period}`;

  return (
    <div className="w-full pb-12 font-sans selection:bg-brand/20 dark:selection:bg-brand/30 text-start relative" dir={activeLang === 'Arabic' ? 'rtl' : 'ltr'}>

      <HeroCommandCenter onNavigate={onNavigate} onLogout={onLogout} onViewProfile={onViewProfile} />

      {/* Role Switcher & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 py-2 animate-fade-in-up transition-all duration-300 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <div className="flex items-center bg-slate-100/80 dark:bg-[#0A0C10]/80 p-1 rounded-xl shadow-inner border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm w-max gap-1">
            {ROLES.map((role) => {
              const isActive = activeRole?.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive 
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700/50' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white shadow-sm shrink-0" style={{ backgroundColor: role.color }}>
                    {role.avatar}
                  </div>
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowWidgetConfig(true)}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0C10] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Customize
          </button>
          
          <button
            onClick={() => setIsLiveSync(!isLiveSync)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-[#0A0C10] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveSync ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}/>
            <span>{isLiveSync ? 'Live Sync' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Role-based dashboard */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRole?.id || 'super_admin'}
          initial={{ opacity: 0, y: 12, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.995 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={isLoading ? 'opacity-40 pointer-events-none' : ''}
        >
          {activeRole?.id === 'super_admin' && <SuperAdminDashboard themeColor={themeColor} onNavigate={onNavigate} />}
          {activeRole?.id === 'pw_ceo'      && <PWCEODashboard themeColor={themeColor} onNavigate={onNavigate} />}
          {activeRole?.id === 'client_ceo'  && <ClientCEODashboard themeColor={themeColor} onNavigate={onNavigate} />}
          {activeRole?.id === 'workspace'   && <WorkspaceDashboard themeColor={themeColor} onNavigate={onNavigate} />}
          {!activeRole?.id                  && <SuperAdminDashboard themeColor={themeColor} onNavigate={onNavigate} />}
        </motion.div>
      </AnimatePresence>

      {/* Customize Sidebar */}
      {showWidgetConfig && (
        <div className="fixed top-0 left-0 right-0 bottom-[40px] sm:bottom-[48px] z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 dark:bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowWidgetConfig(false)} />
          
          <div className="relative w-full max-w-[320px] h-full bg-white/95 dark:bg-[#0B1121]/95 backdrop-blur-2xl shadow-2xl border-l border-slate-200/50 dark:border-slate-800/50 flex flex-col animate-slide-in-right">
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Dashboard Layout</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Configure widgets for {activeRole?.label || 'Super Admin'}</p>
              </div>
              <button onClick={() => setShowWidgetConfig(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pb-12 scrollbar-none">
              <Reorder.Group 
                axis="y" 
                values={preferences[activeRole?.id || 'super_admin']?.sectionOrder || []} 
                onReorder={(newOrder) => reorderSections(activeRole?.id || 'super_admin', newOrder)}
                className="space-y-4"
              >
                {(preferences[activeRole?.id || 'super_admin']?.sectionOrder || []).map((sectionName) => {
                  const isVisible = preferences[activeRole?.id || 'super_admin']?.sectionVisibility?.[sectionName] !== false;
                  
                  return (
                    <Reorder.Item 
                      key={sectionName} 
                      value={sectionName}
                      className="rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-[#111C30]/50 backdrop-blur-md shadow-sm transition-all hover:shadow-md hover:border-brand/30 group relative"
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex flex-col gap-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-colors cursor-move">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" /></svg>
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{sectionName}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="pl-4 border-l border-slate-200 dark:border-slate-700">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isVisible}
                                onChange={() => toggleSection(activeRole?.id || 'super_admin', sectionName, !isVisible)}
                              />
                              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const Dashboard = (props) => (
  <ToastProvider>
    <WorkflowProvider>
      <DashboardContent {...props} />
      <WorkflowModal />
    </WorkflowProvider>
  </ToastProvider>
);

export default Dashboard;
