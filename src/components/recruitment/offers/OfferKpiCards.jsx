import React from 'react';
import { 
  FileText, Clock, CheckCircle2, Send, 
  RefreshCw, Award, XCircle, AlertTriangle, ArrowUpRight 
} from 'lucide-react';

export const OfferKpiCards = ({ metrics = {}, onKpiClick, brandColor = 'var(--pw-brand)' }) => {
  const cards = [
    {
      id: 'active',
      title: 'Active Pipeline',
      value: (metrics.draft || 0) + (metrics.pendingApproval || 0) + (metrics.approved || 0) + (metrics.sent || 0) + (metrics.negotiation || 0),
      subtitle: `${metrics.sent || 0} extended to candidates`,
      icon: Send,
      color: '#3b82f6',
      bgLight: 'bg-blue-50 dark:bg-blue-950/30',
      textLight: 'text-blue-600 dark:text-blue-400',
      badgeText: '+18% vs last month',
      badgePositive: true
    },
    {
      id: 'pending_approval',
      title: 'Pending Sign-Off',
      value: metrics.pendingApproval || 0,
      subtitle: 'Awaiting HM / HR / Finance',
      icon: Clock,
      color: '#f59e0b',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      textLight: 'text-amber-600 dark:text-amber-400',
      badgeText: 'Avg 1.2d SLA',
      badgePositive: true
    },
    {
      id: 'negotiation',
      title: 'In Negotiation',
      value: metrics.negotiation || 0,
      subtitle: 'Candidate counter requests',
      icon: RefreshCw,
      color: '#f59e0b',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      textLight: 'text-amber-600 dark:text-amber-400',
      badgeText: 'Active revisions',
      badgePositive: false
    },
    {
      id: 'accepted',
      title: 'Offers Accepted',
      value: metrics.accepted || 0,
      subtitle: `${metrics.acceptanceRate || 88}% Acceptance Rate`,
      icon: CheckCircle2,
      color: '#10b981',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      textLight: 'text-emerald-600 dark:text-emerald-400',
      badgeText: 'Target 85%',
      badgePositive: true
    },
    {
      id: 'declined',
      title: 'Declined / Withdrawn',
      value: (metrics.declined || 0) + (metrics.withdrawn || 0),
      subtitle: `${metrics.declined || 0} declined, ${metrics.withdrawn || 0} withdrawn`,
      icon: XCircle,
      color: '#ef4444',
      bgLight: 'bg-rose-50 dark:bg-rose-950/30',
      textLight: 'text-rose-600 dark:text-rose-400',
      badgeText: 'Low attrition',
      badgePositive: true
    },
    {
      id: 'expired',
      title: 'Lapsed / Expired',
      value: metrics.expired || 0,
      subtitle: 'Eligible for extension/reissue',
      icon: AlertTriangle,
      color: '#64748b',
      bgLight: 'bg-slate-100 dark:bg-slate-800',
      textLight: 'text-slate-600 dark:text-slate-400',
      badgeText: 'Follow-up needed',
      badgePositive: false
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onKpiClick && onKpiClick(card.id)}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bgLight} ${card.textLight} transition-transform group-hover:scale-110`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-0.5">
                {card.badgeText}
              </span>
            </div>

            <div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                {card.value}
              </p>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                {card.title}
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {card.subtitle}
              </p>
            </div>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default OfferKpiCards;
