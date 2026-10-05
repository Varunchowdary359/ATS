import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ path = [], onNavigate }) => {
  return (
    <nav className="flex items-center text-[13px] font-medium text-slate-500 dark:text-slate-400">
      <a 
        href="#" 
        onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('dashboard'); }} 
        className="flex items-center hover:text-slate-900 dark:hover:text-white transition-colors" 
        title="Home"
      >
        <Home size={14} />
      </a>
      {path.length === 0 && (
        <>
          <ChevronRight size={14} className="mx-1.5 opacity-50 shrink-0" />
          <span className="text-slate-900 dark:text-white font-semibold">Dashboard</span>
        </>
      )}
      {path.map((segment, index) => {
        const isString = typeof segment === 'string';
        const label = isString ? segment.replace(/-/g, ' ') : segment.label;
        const view = isString ? null : segment.view;
        const onClickHandler = isString ? null : segment.onClick;
        const isLast = index === path.length - 1;
        
        return (
          <React.Fragment key={index}>
            <ChevronRight size={14} className="mx-1.5 opacity-50 shrink-0" />
            {isLast ? (
              <span
                className="text-slate-900 dark:text-white font-bold cursor-default pointer-events-none truncate max-w-[200px] sm:max-w-[320px] md:max-w-[450px]"
                title={label}
              >
                {label}
              </span>
            ) : (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onClickHandler) {
                    onClickHandler();
                  } else if (view && onNavigate) {
                    onNavigate(view);
                  }
                }}
                className="hover:text-slate-900 dark:hover:text-white font-semibold truncate max-w-[150px] sm:max-w-[200px] transition-colors cursor-pointer"
                title={label}
              >
                {label}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;

