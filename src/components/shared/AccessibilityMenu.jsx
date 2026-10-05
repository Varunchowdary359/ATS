import React, { useState, useRef, useEffect, useContext } from 'react';
import { ThemeContext } from '../../ThemeContext';
import { 
  RotateCcw, 
  X, 
  Check, 
  Type
} from 'lucide-react';

// ── Universal Accessibility Symbol (W3C Standard) ───────────────────────────
const UniversalAccessIcon = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="4.5" r="2" />
    <path d="M4.5 9h15" />
    <path d="M12 9v5.5" />
    <path d="M8.5 20.5l3.5-6 3.5 6" />
  </svg>
);

// ── 1. Voice Narration Icon ──────────────────────────────────────────────────
const VoiceReaderIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 5a9.5 9.5 0 0 1 0 14" />
  </svg>
);

// ── 2. Line Height Typography Icon ───────────────────────────────────────────
const LineHeightIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M5 4.5v15" />
    <path d="M2.5 7L5 4.5 7.5 7" />
    <path d="M2.5 17L5 19.5 7.5 17" />
    <path d="M11 6h10" />
    <path d="M11 12h10" />
    <path d="M11 18h10" />
  </svg>
);

// ── 3. Letter Spacing Typography Icon ─────────────────────────────────────────
const TextSpacingIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 18V6" />
    <path d="M20 18V6" />
    <path d="M8 12h8" />
    <path d="M10.5 9.5L8 12l2.5 2.5" />
    <path d="M13.5 9.5L16 12l-2.5 2.5" />
  </svg>
);

// ── 4. Highlight Interactive Links Icon ──────────────────────────────────────
const HighlightLinksIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <path d="M3 21h18" strokeWidth="2.5" stroke="currentColor" />
  </svg>
);

// ── 5. Declutter / Hide Images Icon ──────────────────────────────────────────
const HideImagesIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect width="18" height="16" x="3" y="4" rx="3" />
    <circle cx="8" cy="9" r="1.5" />
    <path d="M21 16l-5-5-5 5" />
    <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.5" />
  </svg>
);

// ── 6. Large Cursor Icon ─────────────────────────────────────────────────────
const LargeCursorIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 4l7.5 17 2.5-6.5 6.5-2.5L4 4z" fill="currentColor" fillOpacity="0.15" />
    <path d="M16 4l2 2-2 2" />
    <path d="M20 8l-2-2 2-2" />
  </svg>
);

/**
 * Apple macOS Control Center Style Accessibility Hub
 * Frosted glassmorphism, 2-column cards, tactile feedback & micro-interactions.
 */
const AccessibilityMenu = ({ variant = 'default' }) => {
  const {
    textSize,
    setTextSize,
    lineHeight,
    setLineHeight,
    highlightLinks,
    setHighlightLinks,
    textSpacing,
    setTextSpacing,
    hideImages,
    setHideImages,
    bigCursor,
    setBigCursor,
    textToSpeech,
    setTextToSpeech,
    resetAccessibility,
    activeAccessibilityCount
  } = useContext(ThemeContext);

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleSpeech = () => {
    if (!textToSpeech) {
      setTextToSpeech(true);
    } else {
      setTextToSpeech(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const featureCards = [
    {
      id: 'tts',
      title: 'Voice Reader',
      subtitle: 'Speaks on hover & tap',
      icon: VoiceReaderIcon,
      isActive: textToSpeech,
      onClick: toggleSpeech
    },
    {
      id: 'line-height',
      title: 'Line Spacing',
      subtitle: '1.85x height for ease',
      icon: LineHeightIcon,
      isActive: lineHeight,
      onClick: () => setLineHeight(!lineHeight)
    },
    {
      id: 'text-spacing',
      title: 'Text Spacing',
      subtitle: 'Wider tracking',
      icon: TextSpacingIcon,
      isActive: textSpacing,
      onClick: () => setTextSpacing(!textSpacing)
    },
    {
      id: 'highlight-links',
      title: 'Highlight Links',
      subtitle: 'Active palette guides',
      icon: HighlightLinksIcon,
      isActive: highlightLinks,
      onClick: () => setHighlightLinks(!highlightLinks)
    },
    {
      id: 'hide-images',
      title: 'Hide Images',
      subtitle: 'Decluttered view',
      icon: HideImagesIcon,
      isActive: hideImages,
      onClick: () => setHideImages(!hideImages)
    },
    {
      id: 'big-cursor',
      title: 'Large Cursor',
      subtitle: 'High contrast pointer',
      icon: LargeCursorIcon,
      isActive: bigCursor,
      onClick: () => setBigCursor(!bigCursor)
    }
  ];

  return (
    <div className={`relative inline-block ${isOpen ? 'z-50' : ''}`} ref={menuRef}>
      {/* Sleek Circular Header Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        data-a11y-ignore="true"
        aria-label="Accessibility Control Center"
        aria-expanded={isOpen}
        title="Accessibility Control Center"
        className={`relative flex items-center justify-center transition-all duration-200 cursor-pointer select-none ${
          variant === 'login'
            ? 'w-8 sm:w-10 h-8 sm:h-10 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            : 'w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        } ${isOpen ? 'ring-2 ring-[var(--pw-brand)]/50 shadow-md' : ''}`}
      >
        <UniversalAccessIcon size={16} className={variant === 'login' ? 'sm:w-[18px] sm:h-[18px]' : ''} />
        
        {/* Active Badge Count */}
        {activeAccessibilityCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[9px] font-black rounded-full shadow-md ring-2 ring-white dark:ring-slate-900 animate-fade-in"
            style={{ backgroundColor: 'var(--pw-brand)', color: 'var(--pw-brand-fg, #ffffff)' }}
          >
            {activeAccessibilityCount}
          </span>
        )}
      </button>

      {/* Apple macOS Control Center Style Hub */}
      {isOpen && (
        <div 
          role="dialog"
          aria-label="Accessibility Options"
          className="absolute end-0 mt-2.5 w-[350px] sm:w-[375px] bg-white/95 dark:bg-[#111624]/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.65)] border border-slate-200/90 dark:border-white/10 z-[100] overflow-hidden animate-fade-in origin-top-right text-slate-900 dark:text-slate-100"
          style={{ maxWidth: '94vw' }}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-7 h-7 rounded-xl flex items-center justify-center shadow-xs"
                style={{ backgroundColor: 'var(--pw-brand)', color: 'var(--pw-brand-fg, #ffffff)' }}
              >
                <UniversalAccessIcon size={15} />
              </div>
              <div>
                <h2 className="text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  Accessibility
                </h2>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                  Control Center
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-3.5 space-y-3">
            {/* Section 1: Hero Segmented Text Scale Pill */}
            <div className="p-2.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Type size={13} className="text-slate-400" />
                  Text Scale
                </span>
                <span 
                  className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--pw-brand) 15%, transparent)', color: 'var(--pw-brand-dark, var(--pw-brand))' }}
                >
                  {textSize === 'sm' ? '90% Compact' : textSize === 'lg' ? '110% Large' : '100% Default'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white dark:bg-[#1a2133] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTextSize('sm')}
                  style={textSize === 'sm' ? { backgroundColor: 'var(--pw-brand)', color: 'var(--pw-brand-fg, #ffffff)' } : {}}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    textSize === 'sm'
                      ? 'shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="font-black">A-</span>
                  <span className="text-[10px] font-medium opacity-80">90%</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTextSize('normal')}
                  style={textSize === 'normal' ? { backgroundColor: 'var(--pw-brand)', color: 'var(--pw-brand-fg, #ffffff)' } : {}}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    textSize === 'normal'
                      ? 'shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="font-black">A</span>
                  <span className="text-[10px] font-medium opacity-80">100%</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTextSize('lg')}
                  style={textSize === 'lg' ? { backgroundColor: 'var(--pw-brand)', color: 'var(--pw-brand-fg, #ffffff)' } : {}}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    textSize === 'lg'
                      ? 'shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="font-black">A+</span>
                  <span className="text-[10px] font-medium opacity-80">110%</span>
                </button>
              </div>
            </div>

            {/* Section 2: Apple Control Center 2-Column Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {featureCards.map((card) => {
                const Icon = card.icon;
                const isSelected = card.isActive;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={card.onClick}
                    aria-pressed={isSelected}
                    data-a11y-ignore="true"
                    className={`group relative flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? 'border-[var(--pw-brand)] bg-slate-100/90 dark:bg-slate-800/90 shadow-sm ring-1 ring-[var(--pw-brand)]/40'
                        : 'border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#161c2d]/70 hover:bg-slate-50 dark:hover:bg-[#1e263d] hover:border-slate-300 dark:hover:border-white/20 shadow-2xs'
                    }`}
                  >
                    {/* Active Status Check Badge */}
                    {isSelected && (
                      <span 
                        className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: 'var(--pw-brand)', color: 'var(--pw-brand-fg, #ffffff)' }}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}

                    {/* Left Icon Pill */}
                    <div 
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isSelected 
                          ? 'bg-[var(--pw-brand)] text-[var(--pw-brand-fg,#ffffff)] shadow-xs' 
                          : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-white/15'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Card Content */}
                    <div className="min-w-0 pr-1">
                      <p className={`text-xs leading-tight truncate ${
                        isSelected 
                          ? 'text-slate-900 dark:text-white font-extrabold' 
                          : 'text-slate-800 dark:text-slate-200 font-bold'
                      }`}>
                        {card.title}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate mt-0.5 font-medium">
                        {card.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Reset Capsule */}
          <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02] flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 px-1">
              {activeAccessibilityCount > 0 ? `${activeAccessibilityCount} active options` : 'Standard default'}
            </span>

            <button
              type="button"
              onClick={resetAccessibility}
              data-a11y-ignore="true"
              disabled={activeAccessibilityCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1a2133] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 shadow-2xs hover:shadow-xs active:scale-[0.98]"
            >
              <RotateCcw size={12} className="text-slate-400" />
              <span>Reset All</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityMenu;
