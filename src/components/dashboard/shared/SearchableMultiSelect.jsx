import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, Plus, Tag } from 'lucide-react';

/**
 * Enterprise Glassmorphism SearchableMultiSelect Component
 * Renders multiple values as removable pill tags, with a portal search popover for picking/creating tags.
 */
const SearchableMultiSelect = ({
  value = [],
  onChange,
  options = [],
  placeholder = 'Add items...',
  searchPlaceholder = 'Search or add tag...',
  className = '',
  allowCustom = true,
  maxTags = 10
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Ensure value is array
  const currentValues = Array.isArray(value) 
    ? value 
    : typeof value === 'string' && value.trim() 
    ? value.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { label: opt.label || opt.name || opt.value, value: opt.value ?? opt.label };
    }
    return { label: String(opt), value: String(opt) };
  });

  const filteredOptions = normalizedOptions.filter(opt => {
    if (!searchQuery.trim()) return true;
    return opt.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 260;

      const flip = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownStyle({
        position: 'fixed',
        top: flip ? undefined : rect.bottom + 4,
        bottom: flip ? window.innerHeight - rect.top + 4 : undefined,
        left: rect.left,
        width: rect.width,
        maxWidth: viewportWidth - 24,
        zIndex: 9999
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
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest('[data-portal-multiselect-menu]')) return;
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleOption = (val) => {
    const exists = currentValues.some(v => String(v).toLowerCase() === String(val).toLowerCase());
    let next;
    if (exists) {
      next = currentValues.filter(v => String(v).toLowerCase() !== String(val).toLowerCase());
    } else {
      if (currentValues.length >= maxTags) return;
      next = [...currentValues, val];
    }
    onChange(next);
  };

  const handleAddCustom = () => {
    const trimmed = searchQuery.trim();
    if (trimmed && !currentValues.some(v => v.toLowerCase() === trimmed.toLowerCase())) {
      const next = [...currentValues, trimmed];
      onChange(next);
      setSearchQuery('');
    }
  };

  const removeTag = (val, e) => {
    e.stopPropagation();
    const next = currentValues.filter(v => String(v) !== String(val));
    onChange(next);
  };

  return (
    <>
      <div className={`w-full font-sans ${className}`}>
        <div
          ref={triggerRef}
          onClick={() => setIsOpen(true)}
          className={`w-full min-h-[42px] p-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-[var(--pw-brand)] transition-colors cursor-pointer flex flex-wrap items-center gap-1.5 ${
            isOpen ? 'ring-2 ring-[var(--pw-brand)]/20 border-[var(--pw-brand)]' : ''
          }`}
        >
          {currentValues.length > 0 ? (
            currentValues.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--pw-brand)]/10 text-[var(--pw-brand)] border border-[var(--pw-brand)]/20 text-xs font-bold transition-all hover:bg-[var(--pw-brand)]/20"
              >
                <span>{tag}</span>
                <span
                  onClick={(e) => removeTag(tag, e)}
                  className="hover:bg-[var(--pw-brand)]/30 p-0.5 rounded text-[var(--pw-brand)] transition-colors"
                >
                  <X size={12} />
                </span>
              </span>
            ))
          ) : (
            <span className="text-xs font-semibold text-slate-400 px-1 flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400" />
              {placeholder}
            </span>
          )}

          <button
            type="button"
            className="ml-auto text-[11px] font-bold text-[var(--pw-brand)] hover:underline flex items-center gap-1 px-2 py-0.5"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              data-portal-multiselect-menu
              style={dropdownStyle}
              initial={{ opacity: 0, y: dropdownStyle.bottom ? 6 : -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: dropdownStyle.bottom ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full max-h-72 flex flex-col rounded-2xl bg-white dark:bg-slate-900 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-2 font-sans"
            >
              {/* Search input */}
              <div className="relative mb-2 shrink-0">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && allowCustom) {
                      e.preventDefault();
                      handleAddCustom();
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Options list */}
              <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                    const isSelected = currentValues.some(v => String(v).toLowerCase() === String(opt.value).toLowerCase());
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => toggleOption(opt.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check size={14} className="text-blue-500 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-3 px-2 text-center text-xs text-slate-400">
                    No matching standard items.
                  </div>
                )}

                {allowCustom && searchQuery.trim() && !filteredOptions.some(o => o.label.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
                  >
                    <Plus size={13} />
                    <span>Add custom tag "{searchQuery.trim()}"</span>
                  </button>
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

export default SearchableMultiSelect;
