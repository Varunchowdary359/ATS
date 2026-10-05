import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Reusable Glassmorphism Custom Select Dropdown
 * Replaces native HTML <select> popups with modern translucent glassmorphism popovers.
 * Uses React Portals to guarantee z-index positioning above all elements and prevent clipping.
 */
const CustomSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select option...', 
  prefix = '',
  className = '', 
  buttonClassName = '',
  disabled = false,
  icon: LeadingIcon = null,
  size = 'md', // 'sm' | 'md' | 'lg'
  align = 'left' // 'left' | 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Normalize options array into [{ label, value }]
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { label: opt.label || opt.value, value: opt.value };
    }
    return { label: String(opt), value: String(opt) };
  });

  // Find active option label
  const selectedOption = normalizedOptions.find(o => String(o.value) === String(value));
  const rawLabel = selectedOption ? selectedOption.label : (value || placeholder);

  let displayText = rawLabel;
  if (prefix) {
    const cleanPrefix = prefix.trim();
    if (!String(rawLabel).toLowerCase().startsWith(cleanPrefix.toLowerCase())) {
      displayText = `${prefix}${rawLabel}`;
    }
  }

  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 240; 
      
      const flip = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      const minWidth = Math.max(rect.width, 160);
      let calculatedLeft = align === 'left' ? rect.left : undefined;
      let calculatedRight = align === 'right' ? viewportWidth - rect.right : undefined;

      if (align === 'left' && rect.left + minWidth > viewportWidth - 12) {
        calculatedLeft = Math.max(12, viewportWidth - minWidth - 12);
      }

      setDropdownStyle({
        position: 'fixed',
        top: flip ? undefined : rect.bottom + 4,
        bottom: flip ? window.innerHeight - rect.top + 4 : undefined,
        left: calculatedLeft,
        right: calculatedRight,
        minWidth: minWidth,
        maxWidth: Math.min(viewportWidth - 24, 340),
        zIndex: 999999
      });
    }
  };

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, align]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Allow clicking inside portal
      if (e.target.closest('[data-portal-menu]')) return;
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const heightClass = size === 'sm' ? 'h-8 text-xs px-2.5' : size === 'lg' ? 'h-10 text-sm px-3.5' : 'h-9 text-xs px-3';
  const hasExplicitWidth = className && (/\bw-(?!full\b)/.test(className) || /\b(min|max)-w-/.test(className));
  const containerWidthClass = hasExplicitWidth ? '' : (className && className.includes('w-full') ? '' : 'w-full');

  return (
    <>
      <div className={`inline-block ${containerWidthClass} text-left font-sans ${className}`.replace(/\s+/g, ' ').trim()}>
        {/* Trigger Button */}
        <motion.button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          whileHover={!disabled ? { y: -1 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          onClick={() => setIsOpen(prev => !prev)}
          className={`w-full ${heightClass} rounded-xl border flex items-center justify-between gap-2 font-semibold transition-colors duration-150 cursor-pointer outline-none [transform:translateZ(0)] [backface-visibility:hidden] ${
            isOpen
              ? 'bg-white dark:bg-slate-800 border-[var(--pw-brand)] ring-2 ring-[var(--pw-brand)]/20 shadow-sm text-[var(--pw-brand)]'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-[var(--pw-brand)] text-slate-800 dark:text-slate-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {LeadingIcon && <LeadingIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
            <span className={`truncate text-xs font-semibold ${!selectedOption ? 'text-slate-400' : ''}`}>
              {displayText}
            </span>
          </div>
          <div className={`p-0.5 rounded-md transition-colors ${isOpen ? 'bg-[var(--pw-brand)]/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[var(--pw-brand)]' : ''}`} />
          </div>
        </motion.button>
      </div>

      {/* Popover Menu */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              data-portal-menu
              style={dropdownStyle}
              initial={{ opacity: 0, y: dropdownStyle.bottom ? 4 : -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: dropdownStyle.bottom ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 space-y-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            >
              {normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[var(--pw-brand)]/10 text-[var(--pw-brand)] font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={14} className="text-[var(--pw-brand)] shrink-0 ml-2" />}
                  </button>
                );
              })}

              {normalizedOptions.length === 0 && (
                <div className="px-3 py-2 text-xs text-slate-400 text-center font-medium">
                  No options available
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default CustomSelect;
