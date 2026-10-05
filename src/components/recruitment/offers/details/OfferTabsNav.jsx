import React from 'react';

export const OfferTabsNav = ({
  tabs = [],
  activeTab,
  onTabChange,
  brandColor = 'var(--pw-brand)'
}) => {
  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-1.5 shadow-xs overflow-x-auto scrollbar-none flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const TabIcon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={isActive ? {
              backgroundColor: brandColor,
              boxShadow: `0 2px 12px ${brandColor}35`
            } : {}}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              isActive
                ? 'text-white shadow-2xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
            }`}
          >
            <TabIcon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
