import React, { useContext, useState, useEffect } from 'react';
import { 
  Plus, Calendar, Activity, FileText, CheckSquare, Layers
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { DashboardDataService } from '../../../services/db/DashboardDataService';

const HeroCommandCenter = ({ onNavigate, onLogout, onViewProfile }) => {
  const { themeColor, activeRole } = useContext(ThemeContext);
  const [metrics, setMetrics] = useState(() => DashboardDataService.getWorkspaceMetrics());

  useEffect(() => {
    const unsub = DashboardDataService.subscribe(() => {
      setMetrics(DashboardDataService.getWorkspaceMetrics());
    });
    const handleDbUpdate = () => {
      setMetrics(DashboardDataService.getWorkspaceMetrics());
    };
    window.addEventListener('pw_db_updated', handleDbUpdate);
    return () => {
      unsub();
      window.removeEventListener('pw_db_updated', handleDbUpdate);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleInfo = () => {
    if (activeRole?.id === 'super_admin') {
      return {
        name: 'Admin',
        title: 'Platform Administrator',
        badgeStyle: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
        snippet: 'Platform Health: 99.99% Uptime with 12 new tenants boarded this month.',
        primaryBtn: 'Add Tenant',
        primaryTarget: 'tenant-management',
        secondaryIcon: <Activity size={16} />,
        secondaryTitle: 'System Health',
      };
    }
    if (activeRole?.id === 'pw_ceo') {
      return {
        name: 'Varun',
        title: 'Chief Executive Officer',
        badgeStyle: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        snippet: 'Business Summary: ARR Run Rate at ₹54Cr with Customer Churn reduced by 0.3%.',
        primaryBtn: 'View Financials',
        primaryTarget: 'subscription-billing',
        secondaryIcon: <FileText size={16} />,
        secondaryTitle: 'Export Board Deck',
      };
    }
    if (activeRole?.id === 'client_ceo') {
      return {
        name: 'Priya',
        title: 'Enterprise CEO',
        badgeStyle: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
        snippet: `Executive Summary: ${metrics.pendingApprovalsCount} pending approvals. ${metrics.openJobsCount} active requisitions open.`,
        primaryBtn: 'Review Approvals',
        primaryTarget: 'requisitions',
        secondaryIcon: <CheckSquare size={16} />,
        secondaryTitle: 'Approvals Queue',
      };
    }
    // Workspace (HR / Manager)
    return {
      name: 'Arjun',
      title: 'HR Operations Manager',
      badgeStyle: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      snippet: `Workspace Overview: ${metrics.openJobsCount} active requisitions in pipeline, ${metrics.totalCandidatesCount} registered candidates, and ${metrics.interviewsCount} interviews scheduled.`,
      primaryBtn: 'Create Requisition',
      primaryTarget: 'requisitions',
      secondaryIcon: <Layers size={16} />,
      secondaryTitle: 'View Pipeline',
      secondaryTarget: 'requisitions',
    };
  };

  const roleData = getRoleInfo();

  return (
    <div className="w-full mt-2 mb-5 relative z-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0A0C10] p-4 lg:px-6 lg:py-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-[0_4px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        
        {/* Left side: Greeting & Professional Corporate Summary */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2.5 flex-wrap">
            <span>{getGreeting()}, {roleData.name}</span>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleData.badgeStyle}`}>
              {roleData.title}
            </span>
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
            <Activity size={16} style={{ color: themeColor || '#3b82f6' }} className="shrink-0" />
            <span>{roleData.snippet}</span>
          </div>
        </div>

        {/* Right side: Enterprise Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0">
          <button 
            onClick={() => onNavigate && roleData.primaryTarget && onNavigate(roleData.primaryTarget)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-white shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer" 
            style={{ backgroundColor: themeColor || '#3b82f6' }}
          >
            <Plus size={16} />
            <span>{roleData.primaryBtn}</span>
          </button>
          
          <button 
            onClick={() => onNavigate && roleData.secondaryTarget && onNavigate(roleData.secondaryTarget)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
            title={roleData.secondaryTitle}
          >
            {roleData.secondaryIcon}
            <span className="hidden sm:inline">{roleData.secondaryTitle}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroCommandCenter;
