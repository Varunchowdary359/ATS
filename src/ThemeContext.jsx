import React, { useState, useEffect } from 'react';
import { themes, ROLES } from './constants';

import { ThemeContext } from './ThemeContextDef';
export { ThemeContext };



export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pw_isDarkMode');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [activeTheme, setActiveTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pw_activeTheme');
      return saved ? JSON.parse(saved) : themes[0];
    }
    return themes[0];
  });
  const [activeLang, setActiveLang] = useState('English');
  const [textSize, setTextSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pw_textSize');
      return saved || 'normal';
    }
    return 'normal';
  });
  const [lineHeight, setLineHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pw_lineHeight') === 'true';
    }
    return false;
  });
  const [highlightLinks, setHighlightLinks] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pw_highlightLinks') === 'true';
    }
    return false;
  });
  const [textSpacing, setTextSpacing] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pw_textSpacing') === 'true';
    }
    return false;
  });
  const [hideImages, setHideImages] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pw_hideImages') === 'true';
    }
    return false;
  });
  const [bigCursor, setBigCursor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pw_bigCursor') === 'true';
    }
    return false;
  });
  const [textToSpeech, setTextToSpeech] = useState(false);
  const [activeRole, setActiveRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pw_activeRole');
      return saved ? JSON.parse(saved) : ROLES[0];
    }
    return ROLES[0];
  });

  const resetAccessibility = () => {
    setTextSize('normal');
    setLineHeight(false);
    setHighlightLinks(false);
    setTextSpacing(false);
    setHideImages(false);
    setBigCursor(false);
    setTextToSpeech(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const activeAccessibilityCount = 
    (textSize !== 'normal' ? 1 : 0) +
    (lineHeight ? 1 : 0) +
    (highlightLinks ? 1 : 0) +
    (textSpacing ? 1 : 0) +
    (hideImages ? 1 : 0) +
    (bigCursor ? 1 : 0) +
    (textToSpeech ? 1 : 0);

  const val = {
    isDarkMode,
    setIsDarkMode,
    activeTheme,
    setActiveTheme,
    activeLang,
    setActiveLang,
    activeRole,
    setActiveRole,
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
  };

  useEffect(() => {
    localStorage.setItem('pw_isDarkMode', JSON.stringify(isDarkMode));
    localStorage.setItem('pw_activeTheme', JSON.stringify(activeTheme));
    localStorage.setItem('pw_activeRole', JSON.stringify(activeRole));
    localStorage.setItem('pw_textSize', textSize);
    localStorage.setItem('pw_lineHeight', String(lineHeight));
    localStorage.setItem('pw_highlightLinks', String(highlightLinks));
    localStorage.setItem('pw_textSpacing', String(textSpacing));
    localStorage.setItem('pw_hideImages', String(hideImages));
    localStorage.setItem('pw_bigCursor', String(bigCursor));

    if (textSize === 'sm') {
      document.documentElement.style.fontSize = '90%';
      document.documentElement.setAttribute('data-text-size', 'sm');
    } else if (textSize === 'lg') {
      document.documentElement.style.fontSize = '110%';
      document.documentElement.setAttribute('data-text-size', 'lg');
    } else {
      document.documentElement.style.fontSize = '100%';
      document.documentElement.setAttribute('data-text-size', 'normal');
    }

    document.documentElement.setAttribute('data-line-height', lineHeight ? 'loose' : 'normal');
    document.documentElement.setAttribute('data-highlight-links', highlightLinks ? 'true' : 'false');
    document.documentElement.setAttribute('data-text-spacing', textSpacing ? 'expanded' : 'normal');
    document.documentElement.setAttribute('data-hide-images', hideImages ? 'true' : 'false');
    document.documentElement.setAttribute('data-big-cursor', bigCursor ? 'true' : 'false');
  }, [isDarkMode, activeTheme, activeRole, textSize, lineHeight, highlightLinks, textSpacing, hideImages, bigCursor]);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    root.className = `flex flex-col lg:flex-row flex-wrap min-h-[100dvh] overflow-hidden bg-[var(--pw-right-bg)] text-slate-900 transition-colors duration-300 dark:text-slate-50 ${isDarkMode ? "dark" : ""} ${activeLang === 'Arabic' ? 'lang-arabic' : ''}`;


    // Compute WCAG 2.2 contrast foreground text color (for text ON TOP of brand background)
    const getContrastFg = (hex) => {
      if (!hex) return '#ffffff';
      const clean = hex.replace('#', '');
      const r = parseInt(clean.substring(0, 2), 16) || 0;
      const g = parseInt(clean.substring(2, 4), 16) || 0;
      const b = parseInt(clean.substring(4, 6), 16) || 0;
      const [sR, sG, sB] = [r / 255, g / 255, b / 255].map(v => 
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      );
      const luminance = 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
      // High luminance backgrounds (like Yellow L > 0.40) require dark slate text for AAA contrast
      return luminance > 0.40 ? '#0f172a' : '#ffffff';
    };

    // Compute accessible high-contrast text tone (for text on light/white surfaces)
    const getAccessibleDarkTone = (theme) => {
      if (theme.name === 'Yellow') return '#855800'; // High contrast accessible gold/amber on white (5.5:1 ratio)
      if (theme.name === 'Olive') return '#4d5d1c';
      if (theme.name === 'Orange') return '#a34800';
      return theme.color || '#1C51A1';
    };

    const brandFg = getContrastFg(activeTheme.color);
    const brandDark = getAccessibleDarkTone(activeTheme);

    document.documentElement.style.setProperty('--pw-brand', activeTheme.color);
    document.documentElement.style.setProperty('--pw-brand-fg', brandFg);
    document.documentElement.style.setProperty('--pw-brand-dark', brandDark);
    document.documentElement.style.setProperty('--pw-brand-hover', activeTheme.hover);
    document.documentElement.style.setProperty('--pw-brand-light', activeTheme.lightest || `color-mix(in srgb, ${activeTheme.color} 10%, transparent)`);
    document.documentElement.style.setProperty('--pw-brand-panel', isDarkMode ? '#0b1120' : (activeTheme.lightest || activeTheme.color));
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => {
      root.className = '';
    };
  }, [activeTheme, isDarkMode, activeLang]);

  useEffect(() => {
    document.documentElement.dir = 'ltr';
  }, []);

  return (
    <ThemeContext.Provider value={val}>
      {children}
    </ThemeContext.Provider>
  );
};
