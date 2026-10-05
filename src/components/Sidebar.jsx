import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  LayoutDashboard, Users, Briefcase, CalendarCheck, Award,
  UserPlus, UserCheck, BarChart3, Settings, Shield, ChevronLeft, ChevronRight,
  Star, History, FolderOpen, UserCog, ShieldCheck, KeyRound,
  Building2, Layers, ClipboardList, Key, ChevronDown, Activity, ToggleLeft, Cpu, FileText, Megaphone, PanelLeftClose, PanelLeftOpen, Pin, Menu, X, Globe, FileUp, Smartphone, Sparkles, Bot
} from 'lucide-react';
import Logo from './Logo';
import collapseLogo from '../assets/collapse_logo.png';
import pwLogo from '../assets/pw_logo.png';
import { ThemeContext } from '../ThemeContext';

// High-Resolution SVG QR Code for ATS Mobile App Scanner
const MobileAppQrCode = ({ className = "w-24 h-24" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="8" fill="white"/>
    {/* Corner Finder 1 (Top-Left) */}
    <rect x="8" y="8" width="28" height="28" rx="4" fill="#0f172a"/>
    <rect x="14" y="14" width="16" height="16" rx="2" fill="white"/>
    <rect x="18" y="18" width="8" height="8" rx="1" fill="#0f172a"/>
    
    {/* Corner Finder 2 (Top-Right) */}
    <rect x="64" y="8" width="28" height="28" rx="4" fill="#0f172a"/>
    <rect x="70" y="14" width="16" height="16" rx="2" fill="white"/>
    <rect x="74" y="18" width="8" height="8" rx="1" fill="#0f172a"/>
    
    {/* Corner Finder 3 (Bottom-Left) */}
    <rect x="8" y="64" width="28" height="28" rx="4" fill="#0f172a"/>
    <rect x="14" y="70" width="16" height="16" rx="2" fill="white"/>
    <rect x="18" y="74" width="8" height="8" rx="1" fill="#0f172a"/>
    
    {/* Authentic Data Patterns */}
    <rect x="42" y="10" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="52" y="10" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="42" y="20" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="52" y="30" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="10" y="42" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="20" y="52" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="30" y="42" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="42" y="42" width="16" height="16" rx="3" fill="#1d4ed8"/>
    <rect x="47" y="47" width="6" height="6" rx="1" fill="white"/>
    <rect x="64" y="42" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="74" y="52" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="84" y="42" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="42" y="64" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="52" y="74" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="42" y="84" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="64" y="64" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="74" y="74" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="84" y="84" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="64" y="84" width="6" height="6" rx="1" fill="#0f172a"/>
    <rect x="84" y="64" width="6" height="6" rx="1" fill="#0f172a"/>
  </svg>
);

const Sidebar = ({ themeColor, activeView, onNavigate, isMobileOpen = false, onCloseMobile }) => {
  const { activeRole } = useContext(ThemeContext);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(true);
  const role = activeRole?.id || 'super_admin';

  const isExpanded = isHovered || isPinned;

  const getNavGroups = () => {
    switch (role) {
      case 'super_admin':
        return [
          {
            title: 'Favorites',
            items: [
              { name: 'Audit Logs', icon: ClipboardList, color: '#8b5cf6', id: 'audit-logs' },
            ]
          },
          {
            title: 'Recently Visited',
            items: [
              { name: 'System Config', icon: Settings, color: '#64748b', id: 'system-config' },
            ]
          },
          {
            title: 'Platform',
            items: [
              { name: 'Dashboard', icon: LayoutDashboard, color: '#3b82f6', id: 'dashboard' },
            ]
          }
        ];
      case 'pw_ceo':
        return [
          {
            title: 'Recently Visited',
            items: [
              { name: 'Company Admin', icon: Building2, color: '#3b82f6', id: 'company-management' },
            ]
          },
          {
            title: 'SaaS Metrics',
            items: [
              { name: 'Dashboard', icon: LayoutDashboard, color: '#10b981', id: 'dashboard' },
            ]
          }
        ];
      case 'client_ceo':
        return [
          {
            title: 'Executive',
            items: [
              { name: 'Dashboard', icon: LayoutDashboard, color: '#3b82f6', id: 'dashboard' },
            ]
          }
        ];
      case 'workspace':
      default:
        return [
          {
            title: 'Recruitment',
            items: [
              { name: 'Dashboard', icon: LayoutDashboard, color: '#3b82f6', id: 'dashboard' },
              { name: 'Requisitions', icon: Briefcase, color: '#8b5cf6', id: 'requisitions' },
              { name: 'Job Descriptions', icon: FileText, color: '#10b981', id: 'job descriptions' },
              { name: 'Job Postings', icon: Globe, color: '#ec4899', id: 'job postings' },
              { name: 'Resume Intake', icon: FileUp, color: '#f59e0b', id: 'resume intake' },
              { name: 'Candidates', icon: Users, color: '#06b6d4', id: 'candidates' },
              { name: 'Interviews', icon: CalendarCheck, color: '#f59e0b', id: 'interviews' },
              { name: 'Offer Management', icon: Award, color: '#10b981', id: 'offers' },
              { name: 'Preboarding', icon: UserCheck, color: '#6366f1', id: 'preboarding' },
            ]
          }
        ];
    }
  };

  const [activeGroups, setActiveGroups] = useState([]);
  useEffect(() => {
    setActiveGroups(getNavGroups());
  }, [role]);

  const allAdminItems = [
    { name: 'user-management',     label: 'User Management',     icon: UserCog,     color: '#6366f1' },
    { name: 'role-management',     label: 'Role Management',     icon: ShieldCheck, color: '#14b8a6' },
    { name: 'permission-management',label: 'Permissions',        icon: KeyRound,    color: '#f97316' },
    { name: 'policy-management',   label: 'Assessment Policies', icon: Shield,      color: '#3b82f6' },
    { name: 'company-management',  label: 'Company Admin',       icon: Building2,   color: '#3b82f6' },
    { name: 'audit-logs',          label: 'Audit Logs',          icon: ClipboardList,color: '#8b5cf6' },
    { name: 'api-keys',            label: 'API Keys',            icon: Key,         color: '#ec4899' },
  ];

  const platformAdminItems = [
    { name: 'tenant-management',     label: 'Tenants / Customers',   icon: Layers, color: '#3b82f6' },
    { name: 'subscription-billing', label: 'Subscription & Billing', icon: Layers, color: '#10b981' },
    { name: 'feature-flags',         label: 'Feature Flags',         icon: ToggleLeft, color: '#f59e0b' },
    { name: 'ai-usage',              label: 'AI Usage',              icon: Cpu, color: '#8b5cf6' },
    { name: 'health-dashboard',      label: 'Health Dashboard',      icon: Activity, color: '#ef4444' },
    { name: 'system-config',         label: 'System Config',         icon: Settings, color: '#64748b' },
  ];

  const adminItems = allAdminItems;

  return (
    <>
      <div className={`hidden md:block shrink-0 h-full relative z-30 transition-all duration-300 ${isPinned ? 'w-[260px]' : 'w-[72px]'}`}>
      <aside 
        onMouseEnter={() => !isPinned && setIsHovered(true)}
        onMouseLeave={() => !isPinned && setIsHovered(false)}
        className={`fixed top-0 left-0 bottom-[40px] sm:bottom-[48px] z-30 flex flex-col bg-white dark:bg-[#0f111a] border-r border-slate-200/60 dark:border-slate-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none transition-all duration-300 ease-out overflow-hidden group
          ${isExpanded ? 'w-[260px]' : 'w-[72px]'}`}
      >
        {/* Logo Area */}
        <div className={`h-[64px] flex items-center shrink-0 border-b border-slate-100 dark:border-slate-800/60 transition-all duration-300 ${isExpanded ? 'px-5 justify-between' : 'px-0 justify-center'}`}>
          
          {/* Collapsed: show small logo centered */}
          {!isExpanded && (
            <img 
              src={collapseLogo} 
              alt="Logo" 
              onError={(e) => { e.currentTarget.src = '/collapse_logo.png'; }}
              className="w-[32px] h-auto shrink-0" 
            />
          )}

          {/* Expanded: show full logo + pin button */}
          {isExpanded && (
            <>
              <Logo className="w-[140px] h-auto shrink-0" />
              <button 
                onClick={() => setIsPinned(!isPinned)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300 shadow-sm shrink-0
                  ${isPinned 
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:shadow-md' 
                    : 'border-brand/30 bg-brand/5 text-brand hover:bg-brand/10 hover:border-brand/50'
                  }
                `}
                title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                {isPinned ? (
                  <ChevronLeft size={16} strokeWidth={2.5} className="transition-transform duration-200 hover:-translate-x-0.5" />
                ) : (
                  <Menu size={16} strokeWidth={2.5} className="transition-transform duration-200 hover:scale-105" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main Navigation" className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 scrollbar-none">
          {/* When collapsed, show only icons centered */}
          {!isExpanded ? (
            <div className="flex flex-col gap-1 px-2">
              {activeGroups.flatMap(g => g.items).map((item) => {
                const Icon = item.icon;
                const viewId = item.id || item.name.toLowerCase();
                const isActive = activeView === viewId;
                return (
                  <button
                    key={item.name}
                    onClick={() => onNavigate && onNavigate(viewId)}
                    title={item.name}
                    className={`flex items-center justify-center w-full h-10 rounded-lg transition-all duration-150 ease-out group/icon
                      ${isActive 
                        ? 'bg-brand/10 text-brand' 
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-brand'
                      }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 w-[3px] h-6 bg-brand rounded-r-full" />
                    )}
                    <Icon size={18} strokeWidth={1.75} />
                  </button>
                );
              })}

              {/* Admin section icons */}
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1">
                <button
                  title="Administration"
                  className="flex items-center justify-center w-full h-10 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-brand transition-all duration-150 ease-out"
                >
                  <Shield size={16} strokeWidth={1.75} />
                </button>
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => onNavigate && onNavigate(item.name)}
                      title={item.label}
                      className={`flex items-center justify-center w-full h-10 rounded-lg transition-all duration-150 ease-out relative
                        ${isActive 
                          ? 'bg-brand/10 text-brand' 
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-brand'
                        }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 w-[3px] h-6 bg-brand rounded-r-full" />
                      )}
                      <Icon size={16} strokeWidth={1.75} />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Expanded view
            <div className="flex flex-col gap-1 px-3">
              {activeGroups.map((group, groupIdx) => (
                <div key={group.title || groupIdx} className="flex flex-col mb-5 last:mb-0">
                  <div className="px-3 mt-1 mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {group.title}
                  </div>
                  
                  <Reorder.Group 
                    axis="y" 
                    values={group.items} 
                    onReorder={(newItems) => {
                      const newGroups = [...activeGroups];
                      newGroups[groupIdx].items = newItems;
                      setActiveGroups(newGroups);
                    }}
                    className="flex flex-col gap-0.5"
                  >
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const viewId = item.id || item.name.toLowerCase();
                      const isActive = activeView === viewId;
                      
                      return (
                        <Reorder.Item key={item.name} value={item} className="w-full relative">
                          <button
                            onClick={() => onNavigate && onNavigate(viewId)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 ease-out relative whitespace-nowrap w-full overflow-hidden border group
                              ${isActive 
                                ? 'bg-brand/10 dark:bg-brand/15 text-slate-800 dark:text-slate-100 border-brand/20 dark:border-brand/20' 
                                : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand rounded-r-sm" />
                            )}
                            
                            <div 
                              className={`flex items-center justify-center shrink-0 transition-all duration-150 ease-out cursor-grab active:cursor-grabbing
                                ${isActive ? 'w-8 h-8 bg-brand/15 dark:bg-brand/20 rounded-lg text-brand' : 'w-8 h-8 text-slate-500 group-hover:text-brand dark:group-hover:text-brand'}`}
                            >
                              <Icon 
                                size={18} 
                                strokeWidth={1.75}
                              />
                            </div>
                            
                            <span className={`text-[13px] opacity-100 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                              {item.name}
                            </span>
                          </button>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                </div>
              ))}

              {/* ── Administration (Collapsible) ── */}
              <div className="flex flex-col mb-5 mt-1">
                {/* Section Header / Toggle */}
                <button
                  onClick={() => setAdminOpen(o => !o)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md transition-all duration-150 ease-out relative whitespace-nowrap w-full hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 cursor-pointer group`}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={16} strokeWidth={1.75} className="shrink-0 transition-colors group-hover:text-brand dark:group-hover:text-brand" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em]">
                      Administration
                    </span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-150 ease-out ${adminOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Admin Items */}
                <div className={`flex flex-col gap-0.5 overflow-hidden transition-all duration-150 ease-out ${adminOpen ? 'mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => onNavigate && onNavigate(item.name)}
                        className={`flex items-center gap-3 pl-8 pr-3 py-2 rounded-md transition-all duration-150 ease-out relative whitespace-nowrap w-full overflow-hidden border group
                          ${isActive
                            ? 'bg-brand/10 dark:bg-brand/15 text-slate-800 dark:text-slate-100 border-brand/20 dark:border-brand/20'
                            : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand rounded-r-sm" />
                        )}
                        
                        <div 
                          className={`flex items-center justify-center shrink-0 transition-all duration-150 ease-out
                            ${isActive ? 'w-8 h-8 bg-brand/15 dark:bg-brand/20 rounded-lg text-brand' : 'w-8 h-8 text-slate-500 group-hover:text-brand dark:group-hover:text-brand'}`}
                        >
                          <Icon
                            size={18}
                            strokeWidth={1.75}
                          />
                        </div>
                        
                        <span className={`text-[13px] opacity-100 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Platform Administration (Collapsible) ── */}
              {(role === 'super_admin' || role === 'pw_ceo') && (
                <div className="flex flex-col mb-5 mt-1">
                  {/* Section Header / Toggle */}
                  <button
                    onClick={() => setPlatformOpen(o => !o)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md transition-all duration-150 ease-out relative whitespace-nowrap w-full hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 cursor-pointer group`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers size={16} strokeWidth={1.75} className="shrink-0 transition-colors group-hover:text-brand dark:group-hover:text-brand" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em]">
                        Platform Admin
                      </span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-150 ease-out ${platformOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Platform Admin Items */}
                  <div className={`flex flex-col gap-0.5 overflow-hidden transition-all duration-150 ease-out ${platformOpen ? 'mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {platformAdminItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.name;
                      return (
                        <button
                          key={item.name}
                          onClick={() => onNavigate && onNavigate(item.name)}
                          className={`flex items-center gap-3 pl-8 pr-3 py-2 rounded-md transition-all duration-150 ease-out relative whitespace-nowrap w-full overflow-hidden border group
                            ${isActive
                              ? 'bg-brand/10 dark:bg-brand/15 text-slate-800 dark:text-slate-100 border-brand/20 dark:border-brand/20'
                              : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand rounded-r-sm" />
                          )}
                          
                          <div 
                            className={`flex items-center justify-center shrink-0 transition-all duration-150 ease-out
                              ${isActive ? 'w-8 h-8 bg-brand/15 dark:bg-brand/20 rounded-lg text-brand' : 'w-8 h-8 text-slate-500 group-hover:text-brand dark:group-hover:text-brand'}`}
                          >
                            <Icon
                              size={18}
                              strokeWidth={1.75}
                            />
                          </div>
                          
                          <span className={`text-[13px] opacity-100 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* ── MOBILE APP SCANNER WIDGET (COLLAPSIBLE QR CODE - COMPACT) ── */}
        <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/80 mt-auto bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          {!isExpanded ? (
            <button
              type="button"
              onClick={() => setIsQrOpen(prev => !prev)}
              title="Install Mobile App"
              className="w-9 h-9 mx-auto rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-2xs"
            >
              <Smartphone size={16} />
            </button>
          ) : (
            <div className="bg-gradient-to-br from-white/90 via-slate-50/60 to-blue-50/30 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-blue-950/30 border border-blue-100/80 dark:border-blue-900/40 rounded-xl p-2.5 shadow-2xs space-y-2 transition-all">
              {/* Header Row with Dropdown Arrow */}
              <button
                type="button"
                onClick={() => setIsQrOpen(prev => !prev)}
                className="w-full flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Smartphone size={13} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 block tracking-tight leading-tight">
                      Install Mobile App
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-medium block leading-tight">Scan QR Code</span>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <ChevronDown size={13} className={`transition-transform duration-200 ${isQrOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Collapsable QR Code Body */}
              <AnimatePresence initial={false}>
                {isQrOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center shadow-2xs">
                      <MobileAppQrCode className="w-20 h-20" />
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 mt-1 text-center">
                        iOS &amp; Android ATS Scanner
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </aside>
    </div>

    {/* ── MOBILE NAVIGATION DRAWER (Targeting 340px+ Viewports) ─────────────── */}
    <AnimatePresence>
      {isMobileOpen && (
        <div className="fixed inset-0 z-[250] md:hidden flex">
          {/* Backdrop Blur Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={onCloseMobile}
          />

          {/* Mobile Drawer (Max Width 280px to fit 340px screens perfectly) */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[280px] max-w-[85vw] h-full bg-white dark:bg-[#0f111a] border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="h-[64px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
              <Logo className="w-[130px] h-auto" />
              <button 
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 font-sans text-xs">
              {/* Dynamic Role Nav Groups */}
              {activeGroups.map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {group.title}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                          isActive 
                            ? 'bg-[var(--pw-brand)] text-white font-bold shadow-md shadow-[var(--pw-brand)]/20' 
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Admin Shortcuts */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Admin & Config
                </div>
                <div className="space-y-0.5 mt-1">
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          onNavigate(item.name);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                          isActive 
                            ? 'bg-[var(--pw-brand)] text-white font-bold shadow-md shadow-[var(--pw-brand)]/20' 
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  );
};

export default Sidebar;
