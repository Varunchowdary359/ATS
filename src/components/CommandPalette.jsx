import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, User, Briefcase, FileText, Settings, X, ArrowRight, Key, 
  Shield, Building, LayoutDashboard, ShieldCheck, Sparkles, Command, 
  Compass, Clock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommandPalette = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('All');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setScope('All');
    }
  }, [isOpen]);

  // Handle keyboard shortcut (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const categoryTabs = [
    { id: 'All', label: 'All Results', icon: Compass },
    { id: 'Users', label: 'Users & Roles', icon: User },
    { id: 'Jobs', label: 'Jobs & ATS', icon: Briefcase },
    { id: 'Reports', label: 'Analytics', icon: FileText },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ];

  const recentSearches = [
    { type: 'Policy', category: 'Settings', icon: ShieldCheck, name: 'Interview & Assessment Policies', desc: 'Hardware rules, proctoring & integrity guidelines', view: 'policy-management' },
    { type: 'Admin', category: 'Settings', icon: Building, name: 'Company Administration', desc: 'Departments, locations, grades & workflows', view: 'company-management' },
    { type: 'Security', category: 'Settings', icon: Key, name: 'API Security Keys', desc: 'Manage programmatic API keys & tokens', view: 'api-keys' },
    { type: 'User', category: 'Users', icon: User, name: 'User Management', desc: 'Manage enterprise accounts & access', view: 'user-management' },
    { type: 'Security', category: 'Settings', icon: Shield, name: 'Roles & Permissions', desc: 'Configure matrix access control', view: 'role-management' },
    { type: 'System', category: 'All', icon: LayoutDashboard, name: 'Global Dashboard', desc: 'Return to home metrics overview', view: 'dashboard' },
  ];

  const suggestedActions = [
    { category: 'Settings', icon: ShieldCheck, name: 'Assessment Policies', badge: 'Policy', shortcut: 'O', view: 'policy-management' },
    { category: 'Settings', icon: Building, name: 'Company Administration', badge: 'System', shortcut: 'C', view: 'company-management' },
    { category: 'Users', icon: User, name: 'Provision New User', badge: 'Action', shortcut: 'U', view: 'user-management' },
    { category: 'Settings', icon: Key, name: 'Generate API Key', badge: 'Security', shortcut: 'K', view: 'api-keys' },
    { category: 'Reports', icon: FileText, name: 'View Audit Logs', badge: 'Logs', shortcut: 'A', view: 'audit-logs' },
    { category: 'Users', icon: ShieldCheck, name: 'Edit Permissions Matrix', badge: 'Security', shortcut: 'P', view: 'permission-management' },
  ];

  const handleSelect = (view) => {
    if (onNavigate && view) {
      onNavigate(view);
    }
    onClose();
  };

  // Filter items dynamically
  const filterList = (items) => {
    return items.filter(item => {
      const matchesQuery = query === '' || 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        (item.desc && item.desc.toLowerCase().includes(query.toLowerCase())) ||
        (item.type && item.type.toLowerCase().includes(query.toLowerCase()));
      
      const matchesScope = scope === 'All' || item.category === scope;
      return matchesQuery && matchesScope;
    });
  };

  const filteredRecents = filterList(recentSearches);
  const filteredActions = filterList(suggestedActions);
  const hasResults = filteredRecents.length > 0 || filteredActions.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          
          {/* Command Palette Shell */}
          <div className="fixed inset-0 pointer-events-none z-[101] flex items-start justify-center pt-4 sm:pt-[14vh] px-2.5 sm:px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="w-full max-w-[540px] bg-white dark:bg-[#151822] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-slate-800 pointer-events-auto overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[70vh]"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Search Input Section */}
              <div className="relative flex items-center px-3.5 py-3 border-b border-slate-200/80 dark:border-slate-800">
                <Search size={16} className="text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search candidates, jobs, settings or type a command..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none"
                />

                {query ? (
                  <button 
                    onClick={() => setQuery('')}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 mr-1"
                  >
                    <X size={15} />
                  </button>
                ) : null}

                <button 
                  onClick={onClose}
                  className="flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 transition-colors shrink-0"
                >
                  ESC
                </button>
              </div>

              {/* Scoped Filter Tabs */}
              <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 overflow-x-auto scrollbar-none">
                {categoryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = scope === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setScope(tab.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon size={12} className={isActive ? 'opacity-100' : 'opacity-60'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content / Results List Area */}
              <div className="flex-1 overflow-y-auto p-2 scrollbar-none space-y-3">
                
                {hasResults ? (
                  <>
                    {/* Recent Items Section */}
                    {filteredRecents.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Clock size={11} className="text-slate-400" />
                            Recent Searches
                          </span>
                          <span className="text-[10px] font-normal text-slate-400">{filteredRecents.length}</span>
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          {filteredRecents.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelect(item.view)}
                              className="group flex items-center gap-3 p-2 w-full text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-150"
                            >
                              {/* Neutral Icon Avatar */}
                              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-800 dark:group-hover:text-slate-200 flex items-center justify-center shrink-0 transition-colors">
                                <item.icon size={14} />
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                                    {item.name}
                                  </span>
                                  <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    {item.type}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.2">
                                  {item.desc}
                                </p>
                              </div>

                              {/* Arrow Action */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500">
                                <ArrowRight size={14} />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Actions Section */}
                    {filteredActions.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Zap size={11} className="text-slate-400" />
                            Quick Commands
                          </span>
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          {filteredActions.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelect(item.view)}
                              className="group flex items-center gap-3 p-2 w-full text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-150"
                            >
                              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-800 dark:group-hover:text-slate-200 flex items-center justify-center shrink-0 transition-colors">
                                <item.icon size={13} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                                  {item.name}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <kbd className="flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                  {item.shortcut}
                                </kbd>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Empty State when no query matches */
                  <div className="py-8 px-4 text-center">
                    <Search size={20} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">No results found for "{query}"</h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs mx-auto">
                      Try searching with different keywords or clear your query.
                    </p>
                  </div>
                )}
                
              </div>
              
              {/* Footer Legend */}
              <div className="px-3.5 py-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[9px]">↑↓</kbd> navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[9px]">↵</kbd> select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[9px]">esc</kbd> close
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-[10px] font-medium">
                  <Command size={11} />
                  <span>PeopleWorks</span>
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
