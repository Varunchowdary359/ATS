// ══════════════════════════════════════════════════════════════════════════════
// SOLAR & BENTO KPI SYSTEM — Dual Style KPI System with Customize Dropdown
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import { KPI_COLORS, Icons } from './SharedComponents';
import { useDashboardPreferences } from '../../../DashboardPreferencesContext';
import { formatMetric } from './formatHelpers';

// ── Corporate Vector Icons for Layout Selector ────────────────────────────────
const SolarGridIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3.5" fill="currentColor" className="opacity-90" />
    <circle cx="12" cy="12" r="7.5" strokeDasharray="2 2" opacity="0.6" />
    <circle cx="12" cy="4.5" r="1.5" fill="currentColor" />
    <circle cx="19.5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="19.5" r="1.5" fill="currentColor" />
    <circle cx="4.5" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

const BentoGridIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </svg>
);

const TargetIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
  </svg>
);
export const KPICustomizeDropdown = ({ role }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { getKpiStyle, setKpiStyle } = useDashboardPreferences() || {};
  const currentStyle = getKpiStyle ? getKpiStyle(role) : 'solar';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelect = (style) => {
    if (setKpiStyle) setKpiStyle(role, style);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left z-10" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        title="Customize KPI Layout Style"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {currentStyle === 'bento' ? (
            <BentoGridIcon className="w-3.5 h-3.5 text-blue-500" />
          ) : (
            <SolarGridIcon className="w-3.5 h-3.5 text-amber-500" />
          )}
        </span>
        <span>{currentStyle === 'bento' ? 'Bento Grid' : 'Solar Grid'}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              KPI Layout Style
            </span>
          </div>

          <div className="p-1.5 flex flex-col gap-1">
            <button
              onClick={() => handleSelect('solar')}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                currentStyle === 'solar'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-800/60 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-500 shrink-0 border border-amber-200/40 dark:border-amber-800/40">
                  <SolarGridIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Solar Grid</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">Orbital circular view</div>
                </div>
              </div>
              {currentStyle === 'solar' && (
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <button
              onClick={() => handleSelect('bento')}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                currentStyle === 'bento'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-800/60 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-500 shrink-0 border border-blue-200/40 dark:border-blue-800/40">
                  <BentoGridIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Bento Grid</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">Corporate box grid</div>
                </div>
              </div>
              {currentStyle === 'bento' && (
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Compact Corporate Bento Sub-Card ──────────────────────────────────────────
const BentoSubCard = ({ title, value, type, unit = '', sub, icon, color = 'blue', trend, trendUp = true }) => {
  const c = KPI_COLORS[color] || KPI_COLORS.blue;
  const formattedValue = formatMetric(value, type);
  return (
    <div 
      className="flex flex-col justify-between p-4 bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 transition-all duration-200 cursor-default group relative overflow-hidden min-h-[115px] gap-2.5"
    >
      {/* Subtle Top Accent Pill */}
      <div 
        className="absolute top-0 left-4 right-4 h-[3px] rounded-b-full opacity-80 transition-all duration-300 group-hover:h-[4px]"
        style={{ backgroundColor: c.text }}
      />
      
      <div>
        {/* Header Row: Title + Icon */}
        <div className="flex items-center justify-between mb-1.5 group/header cursor-pointer">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight truncate pr-2 group-hover/header:text-blue-500 transition-colors flex items-center gap-1">
            {title}
            <svg className="w-3 h-3 opacity-0 -translate-x-2 group-hover/header:opacity-100 group-hover/header:translate-x-0 transition-all duration-300 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
          </span>
          
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
            style={{ 
              backgroundColor: c.bg, 
              color: c.text,
              border: `1px solid ${c.ring}30`
            }}
          >
            <span className="text-xs">{icon}</span>
          </div>
        </div>
        
        {/* Metric Value Row */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
            {formattedValue}
          </span>
          {unit && <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{unit}</span>}
        </div>
      </div>
      
      {/* Footer Row: Trend Pill + Subtext */}
      <div className="flex items-center justify-between gap-1.5">
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md shadow-2xs ${
            trendUp 
              ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/60' 
              : 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/60 border border-rose-200/50 dark:border-rose-800/60'
          }`}>
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              {trendUp ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
            </svg>
            {trend}
          </span>
        )}
        {sub && <span className="text-[11px] text-slate-450 dark:text-slate-400 font-medium truncate">{sub}</span>}
      </div>
    </div>
  );
};

// ── Planet Card (Circular Planet Node for Solar Grid) ──────────────────────────
const PlanetCard = ({ title, value, type, unit = '', sub, color = 'blue', trend, trendUp = true }) => {
  const c = KPI_COLORS[color] || KPI_COLORS.blue;
  const formattedValue = formatMetric(value, type);
  return (
    <div 
      className="flex flex-col items-center justify-center w-[135px] h-[135px] rounded-full bg-white dark:bg-slate-900 border-2 transition-all duration-200 hover:scale-[1.03] relative group cursor-default"
      style={{ 
        borderColor: c.text,
        boxShadow: `0 0 12px ${c.ring}20`
      }}
    >
      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center px-2 leading-tight">
        {title.replace("Total ", "").replace("Acceptance Rate", "Acceptance")}
      </span>
      
      <div className="flex items-baseline gap-0.5 mt-0.5 mb-1">
        <span className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
          {formattedValue}
        </span>
        {unit && <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">{unit}</span>}
      </div>

      <div 
        className="w-2.5 h-2.5 rounded-full mb-1 shadow-inner transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: c.text }}
      />
      
      {sub && (
        <div className="text-[9.5px] font-bold text-slate-600 dark:text-slate-300 text-center px-1.5 truncate max-w-[120px] leading-tight flex items-center justify-center gap-1">
          {trend && (
            <span className="font-extrabold" style={{ color: c.text }}>
              {trendUp ? '↑' : '↓'}{trend}
            </span>
          )}
          <span>{sub.replace("vs ", "")}</span>
        </div>
      )}
    </div>
  );
};

// ── Sun Card (Central Core Node for Solar Grid) ───────────────────────────────
const SunCard = ({ title, value, type, unit = '', sub, themeColor }) => {
  const brandBg = themeColor || '#3b82f6';
  const formattedValue = formatMetric(value, type);
  return (
    <div 
      className="flex flex-col items-center justify-center w-[160px] h-[160px] rounded-full text-white transition-all duration-500 hover:scale-105 cursor-default relative z-10"
      style={{ 
        background: `radial-gradient(circle at 30% 30%, ${brandBg}, color-mix(in srgb, ${brandBg} 75%, black))`,
        boxShadow: `0 0 35px ${brandBg}60`
      }}
    >
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/70 text-center px-3 leading-tight">
        {title.toUpperCase()}
      </span>
      <span className="text-3xl font-black text-white my-1 tracking-tight">
        {formattedValue}{unit}
      </span>
      <span className="text-[10px] font-semibold text-white/95 text-center px-3 leading-tight">
        {sub}
      </span>
    </div>
  );
};

// ── Corporate Compact Bento Grid Layout Component ─────────────────────────────
const BentoKPIsGrid = ({ role, sunData, planetCards, themeColor, isSunVisible }) => {
  const brandColor = themeColor || '#3b82f6';

  const heroMetrics = {
    super_admin: [
      { label: "Uptime", value: "99.99%", badge: "Optimal" },
      { label: "API Latency", value: "185ms", badge: "Stable" },
      { label: "New Tenants", value: "12/mo", badge: "Growing" }
    ],
    pw_ceo: [
      { label: "ARR Run Rate", value: "₹54Cr", badge: "On Track" },
      { label: "CAC", value: "₹1.2L", badge: "Monitored" },
      { label: "Avg LTV", value: "₹18L", badge: "Optimal" }
    ],
    client_ceo: [
      { label: "Target Fill Rate", value: "88%", badge: "On Track" },
      { label: "Cost of Vacancy", value: "₹2.1L/wk", badge: "Monitored" },
      { label: "Executive SLA", value: "94%", badge: "Optimal" }
    ],
    workspace: [
      { label: "Open Jobs", value: "11 Active", badge: "High Load" },
      { label: "Interviews", value: "24 this week", badge: "Active" },
      { label: "Hiring Rate", value: "82% filled", badge: "On Track" }
    ]
  };

  const roleHeroStats = heroMetrics[role] || heroMetrics.super_admin;

  return (
    <div className="w-full flex flex-col gap-4 my-1 animate-in fade-in duration-200">
      
      {/* ── COMPACT HERO CORPORATE BANNER ── */}
      {isSunVisible && sunData && (
        <div 
          className="relative overflow-hidden rounded-2xl p-4 md:p-5 text-white border border-slate-700/80 shadow-[0_8px_30px_rgba(15,23,42,0.35)] transition-all duration-300"
          style={{
            background: `radial-gradient(ellipse at 85% 15%, color-mix(in srgb, ${brandColor} 30%, transparent), transparent 70%), linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0b0f19 100%)`
          }}
        >
          {/* Subtle Corporate Ambient Radial Glow */}
          <div 
            className="absolute -right-16 -top-16 w-80 h-80 rounded-full opacity-20 filter blur-3xl pointer-events-none"
            style={{ backgroundColor: brandColor }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left Primary Metric */}
            <div className="flex items-center gap-4">
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-lg border border-white/15 backdrop-blur-md"
                style={{ backgroundColor: `${brandColor}30`, color: '#60a5fa' }}
              >
                {sunData.icon || <TargetIcon className="w-5 h-5 text-blue-400" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                    CORE TARGET
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300">· {sunData.title}</span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">{sunData.value}</span>
                  {sunData.unit && <span className="text-sm font-semibold text-slate-300">{sunData.unit}</span>}
                  <span className="text-xs text-slate-300/80 font-medium ml-2">({sunData.sub})</span>
                </div>
              </div>
            </div>

            {/* Right Stat Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto shrink-0">
              {roleHeroStats.map((st, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/40 shrink-0 shadow-sm transition-all duration-200"
                >
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{st.label}</span>
                    <span className="text-sm font-extrabold text-white leading-tight">{st.value}</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {st.badge}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ── COMPACT SUB-CARDS GRID (Uniform Corporate Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
        {planetCards.map((card, idx) => (
          <div key={card.title || idx} className="w-full h-full">
            <BentoSubCard {...card} color={card.color || 'blue'} />
          </div>
        ))}
      </div>

    </div>
  );
};

import { DashboardDataService } from '../../../services/db/DashboardDataService';

// ── Solar KPI Data Supplier ───────────────────────────────────────────────────
const getSolarData = (role) => {
  const ws = DashboardDataService.getWorkspaceMetrics();
  const ceoApprovals = DashboardDataService.getCEOApprovals();

  const dataMap = {
    super_admin: {
      sun: { title: "System Uptime", value: 99.99, type: 'percentage', color: "blue", sub: "Global platform availability", icon: Icons.Building },
      planets: [
        { title: "Active Tenants", value: 342, type: 'count', color: "indigo", trend: "12", sub: "new this month", trendUp: true, icon: Icons.Users },
        { title: "Platform Users", value: 45200 + ws.totalCandidatesCount, type: 'count', color: "purple", trend: `${ws.totalCandidatesCount}`, sub: "registered candidates", trendUp: true, icon: Icons.Users },
        { title: "API Requests", value: 2400000, type: 'count', color: "amber", trend: "200K", sub: "daily avg", trendUp: true, icon: Icons.Doc },
        { title: "Response Time", value: 185, type: 'ms', color: "teal", trend: "12ms", sub: "improvement", trendUp: true, icon: Icons.TrendUp },
        { title: "System Errors", value: 0.04, type: 'percentage', color: "green", trend: "0.01%", sub: "error rate", trendUp: true, icon: Icons.Check },
        { title: "Security Events", value: ws.totalApplicationsCount + 12, type: 'count', color: "orange", trend: "Live", sub: "audit entries", trendUp: true, icon: Icons.Doc }
      ]
    },
    pw_ceo: {
      sun: { title: "Monthly Rev (MRR)", value: 45000000, type: 'currency', color: "green", sub: "Recurring SaaS revenue", icon: Icons.Dollar },
      planets: [
        { title: "Annual Rec. Rev", value: 540000000, type: 'currency', color: "indigo", trend: "8%", sub: "ARR growth", trendUp: true, icon: Icons.TrendUp },
        { title: "Customer Churn", value: 1.2, type: 'percentage', color: "teal", trend: "0.3%", sub: "vs last quarter", trendUp: true, icon: Icons.Check },
        { title: "Acquisition Cost", value: 120000, type: 'currency', color: "amber", trend: "₹10K", sub: "CAC reduced", trendUp: true, icon: Icons.Dollar },
        { title: "Active Subscriptions", value: 342, type: 'count', color: "purple", trend: "12", sub: "new accounts", trendUp: true, icon: Icons.Building },
        { title: "Plan Upgrades", value: 15, type: 'count', color: "orange", trend: "4", sub: "this month", trendUp: true, icon: Icons.TrendUp },
        { title: "Avg Rev Per User", value: 130000, type: 'currency', color: "blue", trend: "₹5K", sub: "ARPU growth", trendUp: true, icon: Icons.Users }
      ]
    },
    client_ceo: {
      sun: { title: "Revenue at Risk", value: ws.openJobsCount * 1500000, type: 'currency', color: "rose", sub: "Cost of unfilled roles YTD", icon: Icons.Dollar },
      planets: [
        { title: "Cost of Vacancy/Week", value: ws.openJobsCount * 75000,  type: 'currency', color: "rose",   trend: "Calculated",    sub: `${ws.openJobsCount} open roles`,    trendUp: false, icon: Icons.Dollar    },
        { title: "Hiring Health Score",  value: 84,      type: 'count',    color: "amber",  trend: "6pts",   sub: "vs last month",     trendUp: true,  icon: Icons.TrendUp   },
        { title: "Post-Offer Drop-off",  value: Math.max(2, 100 - ws.offerAcceptanceRate), type: 'percentage',color: "orange", trend: "3%",     sub: "vs last quarter",   trendUp: false, icon: Icons.Percent   },
        { title: "D&I Hire Ratio",       value: 38,      type: 'percentage',color: "teal",   trend: "4%",     sub: "female hires YTD",  trendUp: true,  icon: Icons.Users     },
        { title: "Pending Approvals",    value: ceoApprovals.length,       type: 'count',    color: "purple", trend: `${ceoApprovals.length} active`,  sub: "awaiting sign-off",     trendUp: false, icon: Icons.Briefcase },
        { title: "Budget Utilised",      value: 62,      type: 'percentage',color: "indigo", trend: "₹41.1L", sub: "of ₹66L FY budget",  trendUp: true,  icon: Icons.Building  },
      ]
    },
    workspace: {
      sun: { title: "Open Jobs", value: ws.openJobsCount, type: 'count', color: "indigo", sub: "active requisitions", icon: Icons.Briefcase },
      planets: [
        { title: "Pipeline Depth", value: ws.totalCandidatesCount, type: 'count', color: "purple", trend: `+${ws.totalCandidatesCount}`, sub: "registered talent", trendUp: true, icon: Icons.Users },
        { title: "Interviews Scheduled", value: ws.interviewsCount, type: 'count', color: "orange", trend: `${ws.interviewsCount}`, sub: "across pipelines", trendUp: true, icon: Icons.Calendar },
        { title: "Offer Acceptance", value: ws.offerAcceptanceRate, type: 'percentage', color: "green", trend: "Live", sub: "acceptance rate", trendUp: true, icon: Icons.Check },
        { title: "Time to Fill", value: ws.timeToFill, type: 'days', color: "amber", trend: "4d", sub: "faster than avg", trendUp: true, icon: Icons.TrendUp },
        { title: "SLA Compliance", value: ws.slaCompliance, type: 'percentage', color: "teal", trend: "2%", sub: "on-time targets", trendUp: true, icon: Icons.Percent },
        { title: "Pending Approvals", value: ws.pendingApprovalsCount, type: 'count', color: "rose", trend: `${ws.pendingApprovalsCount}`, sub: "awaiting action", trendUp: false, icon: Icons.Doc }
      ]
    }
  };
  return dataMap[role] || dataMap.super_admin;
};

const SECTION_KEYS = {
  super_admin: 'Platform Overview',
  pw_ceo: 'Business Metrics',
  client_ceo: 'Executive Overview',
  workspace: 'My Workspace'
};

// ── Main Solar KPIs Component ─────────────────────────────────────────────────
const SolarKPIs = ({ role, themeColor, hideDropdown = false }) => {
  const { isFieldVisible, getKpiStyle } = useDashboardPreferences() || {};
  const activeStyle = getKpiStyle ? getKpiStyle(role) : 'solar';
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('pw_db_updated', handleUpdate);
    const unsub = DashboardDataService.subscribe(handleUpdate);
    return () => {
      window.removeEventListener('pw_db_updated', handleUpdate);
      unsub();
    };
  }, []);
  
  const sectionKey = SECTION_KEYS[role] || 'Executive Overview';
  const currentData = getSolarData(role);
  
  const isSunVisible = isFieldVisible ? isFieldVisible(role, sectionKey, currentData.sun.title) : true;
  const visiblePlanets = currentData.planets.filter(planet => 
    isFieldVisible ? isFieldVisible(role, sectionKey, planet.title) : true
  );

  const allCards = [
    ...(isSunVisible ? [currentData.sun] : []),
    ...visiblePlanets
  ];

  const R = 200;
  const planetsWithCoords = visiblePlanets.map((card, i) => {
    const angleRad = (2 * Math.PI / (visiblePlanets.length || 1)) * i - Math.PI / 2;
    const x = Math.round(R * Math.cos(angleRad));
    const y = Math.round(R * Math.sin(angleRad));
    return { ...card, x, y };
  });

  return (
    <div className="w-full relative">
      {/* Optional Top Customize Bar inside container */}
      {!hideDropdown && (
        <div className="flex justify-end mb-2">
          <KPICustomizeDropdown role={role} />
        </div>
      )}

      {/* Render selected style */}
      {activeStyle === 'bento' ? (
        <BentoKPIsGrid 
          role={role}
          sunData={currentData.sun} 
          planetCards={visiblePlanets} 
          themeColor={themeColor}
          isSunVisible={isSunVisible}
        />
      ) : (
        <>
          {/* Mobile/Tablet: Fallback standard grid */}
          <div className="grid grid-cols-2 gap-3.5 lg:hidden">
            {allCards.map((card, i) => (
              <BentoSubCard key={i} {...card} />
            ))}
          </div>

          {/* Desktop: Premium Solar KPI System */}
          <div className="hidden lg:flex relative w-full min-h-[580px] items-center justify-center my-6 py-8 overflow-hidden group">
            {/* The Orbit layer taking the full background space */}
            <div 
              className="absolute inset-0 w-full h-full flex items-center justify-center animate-orbit group-hover:[animation-play-state:paused] overflow-hidden"
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {planetsWithCoords.map((p, i) => (
                  <line 
                    key={i} 
                    x1="50%" 
                    y1="50%" 
                    x2={`calc(50% + ${p.x}px)`} 
                    y2={`calc(50% + ${p.y}px)`} 
                    stroke="rgba(148, 163, 184, 0.15)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4"
                  />
                ))}
              </svg>

              {planetsWithCoords.map((card, i) => (
                <div 
                  key={i} 
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20" 
                  style={{ 
                    left: `calc(50% + ${card.x}px)`, 
                    top: `calc(50% + ${card.y}px)`
                  }}
                >
                  <div 
                    className="animate-orbit-reverse group-hover:[animation-play-state:paused]"
                  >
                    <PlanetCard {...card} />
                  </div>
                </div>
              ))}
            </div>

            {isSunVisible && (
              <div className="relative z-10 flex items-center justify-center">
                <SunCard {...currentData.sun} themeColor={themeColor} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SolarKPIs;
