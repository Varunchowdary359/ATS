/**
 * Enterprise Preboarding KPI Cards (EXACTLY 4 FROSTED GLASS CARDS)
 * PeopleWorks ATS SaaS - 100% Visual Uniformity with Offers & Candidate Hubs
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';

export const PreboardingKpis = ({
  metrics = {
    totalPreboarding: 0,
    pendingActions: 0,
    joiningThisWeek: 0,
    readyToJoin: 0
  },
  currentNav = 'all',
  onSelectKpi = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const cards = [
    {
      id: 'all',
      label: 'TOTAL PREBOARDING',
      value: metrics.totalPreboarding,
      subtitle: 'Active Onboarding Pipeline',
      icon: <Users className="w-4 h-4" style={{ color: brandColor }} />,
      iconBg: 'bg-slate-100/80 dark:bg-slate-800/80',
      trend: '+12%',
      trendUp: true,
      actionText: 'View All →',
      updatedAt: 'Just now'
    },
    {
      id: 'pending_actions',
      label: 'PENDING ACTIONS',
      value: metrics.pendingActions,
      subtitle: 'Awaiting HR, Docs or BGV',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60',
      trend: metrics.pendingActions > 0 ? `${metrics.pendingActions} need review` : 'All cleared',
      trendUp: false,
      actionText: 'Review Queue →',
      updatedAt: '5m ago'
    },
    {
      id: 'joining_this_week',
      label: 'JOINING THIS WEEK',
      value: metrics.joiningThisWeek,
      subtitle: 'Starts within 7 days',
      icon: <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      iconBg: 'bg-purple-50 dark:bg-purple-950/60',
      trend: 'Final readiness',
      trendUp: true,
      actionText: 'Track Joiners →',
      updatedAt: '1h ago'
    },
    {
      id: 'ready_to_join',
      label: 'READY TO JOIN',
      value: metrics.readyToJoin,
      subtitle: '100% Readiness Cleared',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      trend: 'Ready for Handoff',
      trendUp: true,
      actionText: 'View Pipeline →',
      updatedAt: 'Today'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((stat, idx) => {
        return (
          <motion.div 
            key={stat.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 + 0.1 }}
            whileHover={{ y: -3 }}
            onClick={() => onSelectKpi(stat.id, stat.label)}
            className="px-3.5 py-2.5 rounded-xl border transition-all duration-300 ease-out cursor-pointer relative overflow-hidden group flex flex-col justify-between bg-gradient-to-br from-white/85 to-blue-50/25 dark:from-slate-900/80 dark:to-blue-950/20 backdrop-blur-md border-blue-100/60 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700/80 hover:shadow-md hover:bg-gradient-to-br hover:from-white hover:via-blue-50/40 hover:to-blue-50/10 dark:hover:from-slate-900 dark:hover:via-blue-950/30 dark:hover:to-slate-900 shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans">
                  {stat.label}
                </span>
                <div className={`p-1 rounded-lg border border-slate-200 dark:border-slate-700 ${stat.iconBg}`}>
                  {stat.icon}
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-xl font-extrabold text-[#0F172A] dark:text-white tracking-tight font-sans">
                  {stat.value}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${
                  stat.trendUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <ArrowUpRight size={9} /> {stat.trend}
                </span>
              </div>

              {stat.subtitle && (
                <p className="text-[11px] font-medium text-[#475569] dark:text-slate-400 mb-1.5 truncate">
                  {stat.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] font-medium text-[#64748B] dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800 transition-colors">
              <span className="text-[10px] font-mono text-[#64748B]">{stat.updatedAt}</span>
              <span className="font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform" style={{ color: brandColor }}>
                {stat.actionText} 📊
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PreboardingKpis;
