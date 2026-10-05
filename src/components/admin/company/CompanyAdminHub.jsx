import React, { useState, useContext, useEffect } from 'react';
import { 
  Building2, CheckCircle2, ShieldAlert, MapPin, 
  Wallet, Award, Layers, Clock, CalendarDays, 
  GitPullRequest, Briefcase, FileCheck, RefreshCw, Filter
} from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import { useBreadcrumb } from '../../shared/BreadcrumbContext';

// Import sub-module views
import CompanySetupWizard from './CompanySetupWizard';
import CompanyProfileView from './CompanyProfileView';
import DepartmentManagement from './DepartmentManagement';
import BusinessUnitManagement from './BusinessUnitManagement';
import LocationManagement from './LocationManagement';
import CostCenterManagement from './CostCenterManagement';
import DesignationManagement from './DesignationManagement';
import GradeManagement from './GradeManagement';
import EmploymentTypeManagement from './EmploymentTypeManagement';
import WorkCalendarManagement from './WorkCalendarManagement';
import HolidayListManagement from './HolidayListManagement';
import ApprovalWorkflowManagement from './ApprovalWorkflowManagement';

const MODULE_CATEGORIES = [
  { id: 'all',          label: 'All Modules (12)' },
  { id: 'organization', label: 'Organization & Entities (6)' },
  { id: 'workforce',    label: 'Workforce Taxonomy (3)' },
  { id: 'policies',     label: 'Policies & Governance (3)' },
];

const MODULE_TABS = [
  { id: 'setup',           category: 'organization', label: 'Setup Wizard',        icon: CheckCircle2,     badge: '11/12' },
  { id: 'profile',         category: 'organization', label: 'Company Profile',     icon: Building2,        badge: 'Legal' },
  { id: 'departments',     category: 'organization', label: 'Departments',         icon: Layers,           badge: '7' },
  { id: 'business-units',  category: 'organization', label: 'Business Units',      icon: Briefcase,        badge: '3' },
  { id: 'locations',       category: 'organization', label: 'Locations',           icon: MapPin,           badge: '5' },
  { id: 'cost-centers',    category: 'organization', label: 'Cost Centers',        icon: Wallet,           badge: '6' },
  
  { id: 'designations',    category: 'workforce',    label: 'Designations',        icon: Award,            badge: '7' },
  { id: 'grades',          category: 'workforce',    label: 'Grades & Bands',      icon: FileCheck,        badge: '8' },
  { id: 'employment-types',category: 'workforce',    label: 'Employment Types',   icon: ShieldAlert,      badge: '5' },
  
  { id: 'work-calendars',  category: 'policies',     label: 'Work Calendars',      icon: Clock,            badge: '4' },
  { id: 'holiday-lists',   category: 'policies',     label: 'Holiday Lists',       icon: CalendarDays,     badge: '2026' },
  { id: 'approval-workflows',category: 'policies',  label: 'Approval Workflows',icon: GitPullRequest,   badge: '4' },
];

const CompanyAdminHub = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('setup');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const { extraCrumbs, setExtraCrumbs, clearExtraCrumbs } = useBreadcrumb();

  useEffect(() => {
    const currentTabDef = MODULE_TABS.find(t => t.id === activeTab);
    const tabLabel = currentTabDef ? currentTabDef.label : 'Setup Wizard';
    setExtraCrumbs([{ label: tabLabel }]);
  }, [activeTab]);

  useEffect(() => {
    if (extraCrumbs.length === 0 && activeTab !== 'setup') {
      setActiveTab('setup');
    }
  }, [extraCrumbs]);

  const brandColor = activeTheme?.color || '#1C51A1';

  const filteredTabs = selectedCategory === 'all' 
    ? MODULE_TABS 
    : MODULE_TABS.filter(t => t.category === selectedCategory);

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'setup':             return <CompanySetupWizard onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'profile':           return <CompanyProfileView />;
      case 'departments':       return <DepartmentManagement />;
      case 'business-units':    return <BusinessUnitManagement />;
      case 'locations':         return <LocationManagement />;
      case 'cost-centers':      return <CostCenterManagement />;
      case 'designations':      return <DesignationManagement />;
      case 'grades':            return <GradeManagement />;
      case 'employment-types':  return <EmploymentTypeManagement />;
      case 'work-calendars':    return <WorkCalendarManagement />;
      case 'holiday-lists':     return <HolidayListManagement />;
      case 'approval-workflows':return <ApprovalWorkflowManagement />;
      default:                  return <CompanySetupWizard onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-12">
      
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Company Administration</h1>
            <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              Enterprise Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage legal entities, corporate structure, locations, job ranks, calendars, and approval governance workflows.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Org Readiness: <strong className="font-mono font-bold">92% Complete</strong>
          </div>

          <button 
            onClick={() => {
              setIsSyncing(true);
              setTimeout(() => {
                setIsSyncing(false);
                addToast({ title: 'System Synced', message: 'Company settings cache updated.', type: 'success' });
              }, 800);
            }}
            disabled={isSyncing}
            className="h-9 px-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-500' : 'text-slate-500'}`} /> 
            {isSyncing ? 'Syncing...' : 'Sync Config'}
          </button>
        </div>
      </div>

      {/* ── 2. Navigation Bar & Tabs ── */}
      <div className="flex flex-col gap-3">
        {/* Category Domain Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0 uppercase tracking-wider text-[10px]">
            <Filter className="w-3.5 h-3.5" /> Domain:
          </span>
          {MODULE_CATEGORIES.map(cat => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isCatActive
                    ? 'text-white shadow-sm scale-102'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-400'
                }`}
                style={isCatActive ? { backgroundColor: brandColor } : {}}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Sub-Module Underlined Tabs with Glass Ambient Glow */}
        <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-800/80 overflow-x-auto scrollbar-none">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs whitespace-nowrap transition-all cursor-pointer border-b-2 -mb-px rounded-t-xl ${
                  isActive
                    ? 'font-bold shadow-2xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 font-semibold'
                }`}
                style={isActive ? { borderColor: brandColor, color: brandColor, backgroundColor: `${brandColor}14` } : {}}
              >
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" style={isActive ? { color: brandColor } : { color: '#94a3b8' }} />
                <span>{tab.label}</span>
                <span 
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isActive 
                      ? 'bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                  style={isActive ? { color: brandColor } : {}}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Active Sub-Module View Panel ── */}
      <div className="mt-2 animate-in fade-in duration-200">
        {renderActiveModule()}
      </div>

    </div>
  );
};

export default CompanyAdminHub;
