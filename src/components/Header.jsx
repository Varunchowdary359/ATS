import React, { useState, useContext, useEffect, useRef } from 'react';
import Logo from './Logo';
import { themes, regions, translations, LANG_FLAG_CODES } from '../constants';
import { ThemeContext } from '../ThemeContext';
import NotificationBell from './dashboard/shared/NotificationBell';
import ProfileDropdown from './ProfileDropdown';
import CommandPalette from './CommandPalette';
import AccessibilityMenu from './shared/AccessibilityMenu';
import { Search, Menu, Globe, ChevronRight, ChevronDown, ArrowLeft, Sun, Moon, Palette } from 'lucide-react';
import * as Flags from 'country-flag-icons/react/3x2';

// Real-world Vector Flag Icons for Enterprise SaaS Locale Selector
const GBFlag = ({ className = "w-5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 60 30" fill="none">
    <clipPath id="gb-flag-clip"><rect width="60" height="30" rx="2"/></clipPath>
    <g clipPath="url(#gb-flag-clip)">
      <rect width="60" height="30" fill="#012169"/>
      <path d="M0 0l60 30M60 0L0 30" stroke="#FFF" strokeWidth="6"/>
      <path d="M0 0l60 30M60 0L0 30" stroke="#C8102E" strokeWidth="2"/>
      <path d="M30 0v30M0 15h60" stroke="#FFF" strokeWidth="10"/>
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

const SAFlag = ({ className = "w-5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 60 30" fill="none">
    <clipPath id="sa-flag-clip"><rect width="60" height="30" rx="2"/></clipPath>
    <g clipPath="url(#sa-flag-clip)">
      <rect width="60" height="30" fill="#006C35"/>
      <path d="M14 20h32v2H14z" fill="#FFF"/>
      <path d="M38 18l4 2-4 2v-4z" fill="#FFF"/>
      <path d="M15 13h30v2H15z" fill="#FFF"/>
    </g>
  </svg>
);

const ESFlag = ({ className = "w-5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 60 30" fill="none">
    <clipPath id="es-flag-clip"><rect width="60" height="30" rx="2"/></clipPath>
    <g clipPath="url(#es-flag-clip)">
      <rect width="60" height="7.5" fill="#AA1529"/>
      <rect y="7.5" width="60" height="15" fill="#F1BF00"/>
      <rect y="22.5" width="60" height="7.5" fill="#AA1529"/>
      <rect x="12" y="11.5" width="4" height="7" rx="1" fill="#AA1529"/>
    </g>
  </svg>
);

const FRFlag = ({ className = "w-5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 60 30" fill="none">
    <clipPath id="fr-flag-clip"><rect width="60" height="30" rx="2"/></clipPath>
    <g clipPath="url(#fr-flag-clip)">
      <rect width="20" height="30" fill="#002395"/>
      <rect x="20" width="20" height="30" fill="#FFFFFF"/>
      <rect x="40" width="20" height="30" fill="#ED2939"/>
    </g>
  </svg>
);

const DEFlag = ({ className = "w-5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 60 30" fill="none">
    <clipPath id="de-flag-clip"><rect width="60" height="30" rx="2"/></clipPath>
    <g clipPath="url(#de-flag-clip)">
      <rect width="60" height="10" fill="#000000"/>
      <rect y="10" width="60" height="10" fill="#DD0000"/>
      <rect y="20" width="60" height="10" fill="#FFCC00"/>
    </g>
  </svg>
);

const INFlag = ({ className = "w-5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 60 30" fill="none">
    <clipPath id="in-flag-clip"><rect width="60" height="30" rx="2"/></clipPath>
    <g clipPath="url(#in-flag-clip)">
      <rect width="60" height="10" fill="#FF9933"/>
      <rect y="10" width="60" height="10" fill="#FFFFFF"/>
      <rect y="20" width="60" height="10" fill="#128807"/>
      <circle cx="30" cy="15" r="3.5" fill="none" stroke="#000080" strokeWidth="1"/>
      <circle cx="30" cy="15" r="0.8" fill="#000080"/>
    </g>
  </svg>
);

const renderFlag = (flagCodeOrLangId, className = "w-5 h-3.5 rounded-[2px] object-cover border border-slate-200/80 dark:border-slate-700/80 shrink-0 shadow-2xs") => {
  const code = LANG_FLAG_CODES[flagCodeOrLangId] || flagCodeOrLangId || 'US';
  const FlagComponent = Flags[code];
  if (FlagComponent) {
    return <FlagComponent className={className} />;
  }
  return <Globe className="w-4 h-4 text-slate-400 shrink-0" />;
};

const renderRegionIcon = (r, className = "w-5 h-3.5 rounded-[2px] object-cover border border-slate-200/80 dark:border-slate-700/80 shrink-0 shadow-2xs") => {
  if (!r) return <Globe className="w-4 h-4 text-slate-400 shrink-0" />;
  if (r.name && r.name.includes("Global")) {
    return <Globe className="w-4 h-4 text-blue-500 shrink-0" />;
  }
  if (r.flag) {
    return renderFlag(r.flag, className);
  }
  return <Globe className="w-4 h-4 text-slate-400 shrink-0" />;
};

const Header = ({ className, children, isLoginPage, onMenuClick, onNavigate, onLogout, onViewProfile, breadcrumbs }) => {
  const { isDarkMode, setIsDarkMode, activeTheme, setActiveTheme, activeLang, setActiveLang, textSize, setTextSize } = useContext(ThemeContext);
  const t = translations?.[activeLang] || translations?.['English'] || {};
  
  const [showPalette, setShowPalette] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [menuView, setMenuView] = useState('regions');
  const [activeRegion, setActiveRegion] = useState(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const langRef = useRef(null);
  const paletteRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setShowLang(false);
        setMenuView('regions');
        setLangSearch('');
      }
      if (paletteRef.current && !paletteRef.current.contains(event.target)) {
        setShowPalette(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle ⌘K shortcut globally for dashboard
  useEffect(() => {
    if (isLoginPage) return;
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginPage]);

  // Open language dropdown and reset to region list view every time
  const toggleLangDropdown = () => {
    setShowPalette(false);
    if (!showLang) {
      setMenuView('regions');
      setLangSearch('');
      if (!activeRegion) {
        const foundRegion = regions.find(r => r.languages.some(l => l.id === activeLang)) || regions[0];
        setActiveRegion(foundRegion);
      }
    }
    setShowLang(!showLang);
  };

  const renderLanguageDropdown = () => {
    const filteredLangs = activeRegion?.languages.filter(l => 
      l.name.toLowerCase().includes(langSearch.toLowerCase()) || 
      l.native.toLowerCase().includes(langSearch.toLowerCase()) ||
      activeRegion.name.toLowerCase().includes(langSearch.toLowerCase())
    );

    return (
      <div 
        className="fixed sm:absolute top-[60px] sm:top-12 right-2 sm:right-0 w-72 sm:w-80 max-w-[calc(100vw-16px)] overflow-hidden bg-white border border-slate-200/90 rounded-xl shadow-2xl z-50 dark:bg-slate-800 dark:border-slate-700 text-start select-none" 
        dir={activeLang === 'Arabic' ? 'rtl' : 'ltr'}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setShowLang(false);
            setMenuView('regions');
            setLangSearch('');
          }
        }}
      >
        <div 
          style={{
            display: 'flex', width: '200%',
            alignItems: 'flex-start',
            transform: menuView === 'regions' ? 'translateX(0)' : `translateX(${activeLang === 'Arabic' ? '50%' : '-50%'})`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Panel 1: Region Selection */}
          <div style={{ width: '50%', flexShrink: 0, boxSizing: 'border-box' }}>
            <div className="px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80 border-b border-slate-200/80 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-400">
              Select Region
            </div>
            <div className="py-1 max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
              {regions.map(r => (
                <button 
                  key={r.name}
                  type="button"
                  className={`flex items-center justify-between w-full px-3.5 py-2.5 text-left text-xs font-medium cursor-pointer transition-colors duration-150 ${
                    activeRegion?.name === r.name 
                      ? 'bg-slate-100/90 dark:bg-slate-700/60 font-semibold' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                  }`}
                  onClick={() => { setActiveRegion(r); setMenuView('languages'); setLangSearch(''); }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {renderRegionIcon(r)}
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">
                      {r.languages.length} {r.languages.length === 1 ? 'language' : 'languages'}
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Panel 2: Languages inside Region */}
          <div style={{ width: '50%', flexShrink: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            {/* Top Bar with Search & Back Arrow */}
            <div className="flex items-center px-3 py-2 border-b border-slate-100 bg-slate-50/90 dark:bg-slate-900/80 dark:border-slate-700">
              <button 
                type="button"
                className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer" 
                onClick={() => { setMenuView('regions'); setLangSearch(''); }}
                title="Back to Regions"
                aria-label="Back to Regions"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="relative flex-1 ml-2">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  value={langSearch} 
                  onChange={(e) => setLangSearch(e.target.value)} 
                  placeholder="Search language..." 
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-none text-slate-900 dark:text-slate-50 focus:ring-1 focus:ring-brand focus:border-brand" 
                  autoFocus={menuView === 'languages'}
                />
              </div>
            </div>

            {/* Region Title Banner */}
            {activeRegion && (
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-100/80 dark:bg-slate-800/90 border-b border-slate-200/70 dark:border-slate-700/70 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {renderRegionIcon(activeRegion)}
                  <span className="truncate uppercase tracking-wider font-bold">{activeRegion.name}</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 shrink-0 ml-1">
                  {filteredLangs?.length || 0} {filteredLangs?.length === 1 ? 'language' : 'languages'}
                </span>
              </div>
            )}

            {/* Scrollable Language List */}
            <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredLangs && filteredLangs.length > 0 ? (
                filteredLangs.map(lang => (
                  <button 
                    key={lang.id}
                    type="button"
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 text-left text-xs font-medium cursor-pointer transition-colors duration-150 border-b border-slate-100/50 dark:border-slate-800/40 last:border-0 ${
                      activeLang === lang.id 
                        ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-sky-400 font-semibold' 
                        : 'text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'
                    }`}
                    onClick={() => { 
                      setActiveLang(lang.id); 
                      setShowLang(false); 
                      setMenuView('regions');
                      setLangSearch('');
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderFlag(lang.flag || lang.id)}
                      <span className="truncate font-medium text-slate-900 dark:text-slate-100">{lang.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 ml-2 text-right font-normal font-sans">{lang.native}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No languages found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If we are on the login page, render the floating header
  if (isLoginPage) {
    return (
      <header className={className || "flex items-center justify-between w-full px-3.5 py-3 sm:px-6 sm:py-5 lg:absolute lg:top-6 lg:end-8 lg:p-0 lg:w-auto lg:justify-end z-20"}>
        {/* Mobile Logo */}
        <div className="block lg:hidden">
          <Logo className="w-[110px] sm:w-[130px] lg:w-[140px]" />
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 relative">
          {/* WCAG 2.2 Accessibility Options Menu */}
          <AccessibilityMenu variant="login" />

          {/* Global Enterprise Language Switcher Trigger */}
          <div ref={langRef} style={{ position: 'relative' }}>
            <button 
              className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-2xs hover:shadow-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40 cursor-pointer select-none"
              onClick={toggleLangDropdown}
              aria-label="Select Language"
              aria-expanded={showLang}
            >
              {renderFlag(activeRegion?.languages?.find(l => l.id === activeLang)?.flag || LANG_FLAG_CODES[activeLang] || 'US')}
              <span>{activeLang}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${showLang ? 'rotate-180' : ''}`} />
            </button>

            {showLang && renderLanguageDropdown()}
          </div>

          {/* Theme / Palette Switcher */}
          <div ref={paletteRef} style={{ position: 'relative' }}>
            <button 
              className="flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full border border-slate-200 bg-white text-slate-700 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => { setShowLang(false); setShowPalette(!showPalette); }}
              aria-label="Change Theme"
            >
              <Palette size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>

            {showPalette && (
              <div 
                className="fixed sm:absolute top-[56px] sm:top-12 right-2 sm:right-0 grid grid-cols-2 gap-1.5 p-3 w-[260px] max-w-[calc(100vw-16px)] bg-white border border-slate-200 rounded-2xl shadow-xl z-30 dark:bg-slate-900 dark:border-slate-800 text-start"
                dir={activeLang === 'Arabic' ? 'rtl' : 'ltr'}
              >
                {themes.map((theme) => (
                  <button 
                    key={theme.name}
                    className="flex items-center gap-2 p-2 w-full text-start text-xs sm:text-sm font-medium text-slate-900 bg-transparent rounded-xl cursor-pointer transition-colors duration-200 hover:bg-slate-50 dark:text-slate-50 dark:hover:bg-slate-800"
                    onClick={() => { setActiveTheme(theme); setShowPalette(false); }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]" style={{ backgroundColor: theme.color }}></div>
                    <span className="truncate">{t[theme.name.toLowerCase()] || theme.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button 
            className="flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full border border-slate-200 bg-white text-slate-700 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Moon size={16} className="sm:w-[18px] sm:h-[18px]" />}
          </button>
          
          {children}
        </div>
      </header>
    );
  }

  // Enterprise Dashboard Header
  const fallbackPath = window.location.pathname.split('/').filter(Boolean);
  const breadcrumbPath = breadcrumbs || (fallbackPath.length > 0 ? fallbackPath : ['Dashboard']);

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-white dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-800 transition-all duration-200 shadow-sm">
        <header className="w-full min-h-[56px] sm:min-h-[64px] py-2 sm:py-2.5 flex items-center justify-between px-2.5 sm:px-6">
        
        {/* Left: Mobile Menu Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-none">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Center: Title / Marquee */}
        <div className="flex-1 min-w-0 overflow-hidden mx-1.5 sm:mx-4 flex items-center">
          <marquee scrollamount="4" className="text-slate-800 dark:text-slate-100 font-extrabold text-xs sm:text-sm tracking-wide font-sans w-full block">
            Welcome to PeopleWorks - ATS
          </marquee>
        </div>

        {/* Right: Search, Quick Actions & Profile */}
        <div className="flex items-center gap-1 sm:gap-2.5 md:gap-3 flex-none justify-end">
          
          {/* Search Button (Expandable or Command Palette) */}
          <div className="w-auto">
            <button 
              onClick={() => setShowCommandPalette(true)}
              className="relative flex items-center justify-center sm:justify-start w-8 sm:w-[220px] lg:w-[260px] h-9 bg-slate-100 dark:bg-[#151822] rounded-full sm:rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer sm:cursor-text text-left group"
            >
              <Search size={16} className="text-slate-500 sm:absolute sm:left-3 group-hover:text-slate-700 transition-colors" />
              <span className="hidden sm:inline w-full pl-9 pr-12 text-xs text-slate-400 truncate">Search candidates, jobs...</span>
              <div className="hidden sm:flex absolute right-2 items-center gap-1">
                <kbd className="flex items-center justify-center h-5 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-medium text-slate-400">
                  ⌘K
                </kbd>
              </div>
            </button>
          </div>
          
          {/* Notification Bell */}
          <NotificationBell />

          {/* Theme / Palette Button */}
          <div ref={paletteRef} style={{ position: 'relative' }}>
            <button 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
              onClick={() => { setShowLang(false); setShowPalette(!showPalette); }}
            >
              <Palette size={16} />
            </button>
            {showPalette && (
              <div 
                className="fixed sm:absolute top-[60px] sm:top-10 right-2 sm:right-0 grid grid-cols-2 gap-x-2 gap-y-1 p-3 w-[260px] max-w-[calc(100vw-16px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 dark:bg-slate-800 dark:border-slate-700 text-start"
                dir={activeLang === 'Arabic' ? 'rtl' : 'ltr'}
              >
                {themes.map((theme) => (
                  <button 
                    key={theme.name}
                    className="flex items-center gap-2.5 p-1.5 w-full text-start text-xs font-semibold text-slate-900 bg-transparent rounded-lg cursor-pointer transition-colors duration-200 hover:bg-slate-50 dark:text-slate-50 dark:hover:bg-slate-700"
                    onClick={() => { setActiveTheme(theme); setShowPalette(false); }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]" style={{ backgroundColor: theme.color }}></div>
                    <span className="truncate">{t[theme.name.toLowerCase()] || theme.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* WCAG 2.2 Accessibility Options Menu */}
          <AccessibilityMenu variant="default" />

          {/* Language Toggle */}
          <div ref={langRef} style={{ position: 'relative' }}>
            <button 
              className="flex items-center justify-center sm:px-2.5 h-8 w-8 sm:w-auto rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer gap-1.5 border border-slate-200/80 dark:border-slate-700/80"
              onClick={toggleLangDropdown}
              aria-label="Select Language"
              aria-expanded={showLang}
            >
              {renderFlag(activeRegion?.languages?.find(l => l.id === activeLang)?.flag || LANG_FLAG_CODES[activeLang] || 'US')}
              <span className="hidden xl:inline font-semibold text-slate-800 dark:text-slate-200">
                {activeLang}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden xl:inline" />
            </button>
            {showLang && renderLanguageDropdown()}
          </div>

          {/* User Profile Avatar Dropdown */}
          <ProfileDropdown onLogout={onLogout} onViewProfile={onViewProfile} />
        </div>
        </header>
      </div>

      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
        onNavigate={onNavigate}
      />
    </>
  );
};

export default Header;
