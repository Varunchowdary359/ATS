import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * Enterprise Glassmorphism SearchableSelect Component
 * Features inline search filter, glassmorphism popover via React Portal, and clear button.
 */
const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  prefix = '',
  searchPlaceholder = 'Search...',
  className = '',
  buttonClassName = '',
  disabled = false,
  icon: LeadingIcon = null,
  size = 'md', // 'sm' | 'md' | 'lg'
  align = 'left',
  allowClear = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Normalize options array into [{ label, value, subtext }]
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { 
        label: opt.label || opt.name || opt.value, 
        value: opt.value ?? opt.id ?? opt.name ?? opt.label,
        subtext: opt.subtext || opt.subtitle || opt.category || ''
      };
    }
    return { label: String(opt), value: String(opt), subtext: '' };
  });

  // Selected option object
  const selectedOption = normalizedOptions.find(o => String(o.value) === String(value));
  const rawText = selectedOption ? selectedOption.label : (value || placeholder);
  
  let displayText = rawText;
  if (prefix) {
    const cleanPrefix = prefix.trim();
    if (!String(rawText).toLowerCase().startsWith(cleanPrefix.toLowerCase())) {
      displayText = `${prefix}${rawText}`;
    }
  }

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter(opt => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const labelStr = String(opt.label || '').toLowerCase();
    const subtextStr = String(opt.subtext || '').toLowerCase();
    const valueStr = String(opt.value || '').toLowerCase();
    return (
      labelStr.includes(q) ||
      subtextStr.includes(q) ||
      valueStr.includes(q)
    );
  });

  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 260;

      const flip = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      let calculatedLeft = align === 'left' ? rect.left : undefined;
      let calculatedRight = align === 'right' ? viewportWidth - rect.right : undefined;

      if (align === 'left' && rect.left + rect.width > viewportWidth - 12) {
        calculatedLeft = Math.max(12, viewportWidth - rect.width - 12);
      }

      setDropdownStyle({
        position: 'fixed',
        top: flip ? undefined : rect.bottom + 4,
        bottom: flip ? window.innerHeight - rect.top + 4 : undefined,
        left: calculatedLeft,
        right: calculatedRight,
        width: rect.width,
        maxWidth: viewportWidth - 24,
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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest('[data-portal-searchable-menu]')) return;
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

  return (
    <>
      <div className={`inline-block w-full text-left font-sans ${className}`}>
        <motion.button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          whileHover={!disabled ? { y: -1 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          onClick={() => setIsOpen(prev => !prev)}
          className={`w-full ${heightClass} rounded-xl border flex items-center justify-between gap-2 font-semibold transition-colors duration-150 cursor-pointer outline-none ${
            isOpen
              ? 'bg-white dark:bg-slate-800 border-[var(--pw-brand)] ring-2 ring-[var(--pw-brand)]/20 shadow-xs text-[var(--pw-brand)]'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-[var(--pw-brand)] text-slate-800 dark:text-slate-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {LeadingIcon && <LeadingIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
            <span className={`truncate text-xs font-semibold ${!selectedOption ? 'text-slate-400' : ''}`}>
              {displayText}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {allowClear && selectedOption && !disabled && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
              >
                <X size={12} />
              </span>
            )}
            <div className={`p-0.5 rounded-md transition-colors ${isOpen ? 'bg-[var(--pw-brand)]/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--pw-brand)]' : ''}`} />
            </div>
          </div>
        </motion.button>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              data-portal-searchable-menu
              style={dropdownStyle}
              initial={{ opacity: 0, y: dropdownStyle.bottom ? 4 : -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: dropdownStyle.bottom ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="max-h-64 flex flex-col rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 font-sans"
            >
              {/* Search Bar */}
              <div className="relative mb-1.5 shrink-0 px-0.5 pt-0.5">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-2.5 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[var(--pw-brand)] focus:ring-1 focus:ring-[var(--pw-brand)]/20"
                />
              </div>

              {/* Options List */}
              <div className="flex-1 overflow-y-auto space-y-0.5 px-0.5 pb-0.5 max-h-48 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
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
                        <div className="truncate">
                          <div>{opt.label}</div>
                          {opt.subtext && <div className="text-[10px] text-slate-400 font-normal truncate">{opt.subtext}</div>}
                        </div>
                        {isSelected && <Check size={14} className="text-[var(--pw-brand)] shrink-0 ml-2" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-3 text-center text-xs font-medium text-slate-400">
                    No matching results
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default SearchableSelect;
