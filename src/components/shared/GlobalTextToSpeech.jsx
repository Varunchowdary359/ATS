import React, { useEffect, useRef, useContext, useCallback } from 'react';
import { ThemeContext } from '../../ThemeContext';

/**
 * Enterprise Application-Wide Text-to-Speech Engine
 * Automatically explains and speaks any text the user hovers, touches, clicks, or focuses.
 * Operates seamlessly in background without floating modal windows.
 */
const GlobalTextToSpeech = () => {
  const { textToSpeech, activeLang } = useContext(ThemeContext);

  const activeElementRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const lastSpokenTextRef = useRef('');

  // Clean visual highlight from previously spoken element
  const clearHighlight = useCallback(() => {
    if (activeElementRef.current) {
      activeElementRef.current.classList.remove('pw-speaking-active');
      activeElementRef.current = null;
    }
  }, []);

  // Universal speak function
  const speakText = useCallback((text, targetElement = null) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!text || typeof text !== 'string') return;

    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean || clean.length < 1) return;

    // Prevent immediate repeat of exact same snippet if already spoken
    if (lastSpokenTextRef.current === clean && window.speechSynthesis.speaking) {
      return;
    }

    lastSpokenTextRef.current = clean;
    window.speechSynthesis.cancel();
    clearHighlight();

    if (targetElement && targetElement.classList) {
      targetElement.classList.add('pw-speaking-active');
      activeElementRef.current = targetElement;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Match appropriate browser voice for active language
    const availVoices = window.speechSynthesis.getVoices() || [];
    if (availVoices.length > 0) {
      const langPrefix = activeLang === 'Arabic' ? 'ar' : activeLang === 'Spanish' ? 'es' : 'en';
      const match = availVoices.find(v => v.lang.toLowerCase().startsWith(langPrefix)) ||
                    availVoices.find(v => v.default) ||
                    availVoices[0];
      if (match) utterance.voice = match;
    }

    utterance.onend = () => {
      clearHighlight();
    };

    utterance.onerror = () => {
      clearHighlight();
    };

    window.speechSynthesis.speak(utterance);
  }, [activeLang, clearHighlight]);

  // Extract meaningful accessible text from any DOM element
  const extractAccessibleText = useCallback((element) => {
    if (!element || element.nodeType !== 1) return '';

    // Ignore accessibility controls menu or hidden elements
    if (element.closest('[data-a11y-ignore="true"]') || element.offsetParent === null) {
      return '';
    }

    // 1. Check aria-label or aria-description
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

    // 2. Check title or placeholder
    const title = element.getAttribute('title');
    if (title && title.trim()) return title.trim();
    const placeholder = element.getAttribute('placeholder');
    if (placeholder && placeholder.trim()) return `Input field: ${placeholder.trim()}`;

    // 3. Check for specific interactive element types
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    const isButton = role === 'button' || element.tagName === 'BUTTON';
    const isHeading = /^H[1-6]$/.test(element.tagName);
    const isLink = element.tagName === 'A' || role === 'link';

    let inner = element.innerText || element.textContent || '';
    inner = inner.replace(/\s+/g, ' ').trim();

    if (!inner) return '';

    if (isButton) {
      return `${inner} button`;
    }
    if (isHeading) {
      return inner;
    }
    if (isLink) {
      return `${inner} link`;
    }

    // For paragraphs or table cells or cards, limit length so it speaks concisely
    if (inner.length > 300) {
      return inner.substring(0, 300) + '...';
    }

    return inner;
  }, []);

  // Global Automatic Hover / Touch / Click / Selection Listener
  useEffect(() => {
    if (!textToSpeech || typeof window === 'undefined') return;

    // Initial voice greeting announcement
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const welcome = new SpeechSynthesisUtterance("Text to speech enabled. Move or tap on any text to listen.");
      welcome.rate = 1.05;
      window.speechSynthesis.speak(welcome);
    }

    // 1. Click / Touch anywhere
    const handleGlobalClick = (e) => {
      const selection = window.getSelection()?.toString()?.trim();
      if (selection && selection.length > 0) {
        speakText(selection);
        return;
      }

      const target = e.target;
      if (!target) return;

      const interactive = target.closest('button, a, [role="button"], input, select, textarea, h1, h2, h3, h4, h5, h6, p, span, tr, td, li') || target;
      const textToRead = extractAccessibleText(interactive);

      if (textToRead) {
        speakText(textToRead, interactive);
      }
    };

    // 2. Text Selection
    const handleGlobalSelection = () => {
      const selection = window.getSelection()?.toString()?.trim();
      if (selection && selection.length > 0) {
        speakText(selection);
      }
    };

    // 3. Keyboard Focus (`Tab` navigation)
    const handleFocusIn = (e) => {
      const target = e.target;
      if (!target) return;
      const text = extractAccessibleText(target);
      if (text) {
        speakText(text, target);
      }
    };

    // 4. Hover / Touch reader (Automatic explanation when pointer moves over text)
    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const meaningful = target.closest('button, a, [role="button"], h1, h2, h3, h4, p, label, th, td, [role="tab"], .glass-card, .bento-card-premium') || target;
      if (!meaningful || meaningful.closest('[data-a11y-ignore="true"]')) return;

      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        const text = extractAccessibleText(meaningful);
        if (text && text !== lastSpokenTextRef.current) {
          speakText(text, meaningful);
        }
      }, 350); // Responsive 350ms debounce
    };

    const handleMouseOut = () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('mouseup', handleGlobalSelection);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('mouseup', handleGlobalSelection);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      clearHighlight();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [textToSpeech, speakText, extractAccessibleText, clearHighlight]);

  // Runs purely in background — no floating popup modal
  return null;
};

export default GlobalTextToSpeech;
