import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, User, X } from 'lucide-react';

/**
 * Enterprise Glassmorphism PeoplePicker Component
 * Renders user/employee selections with avatar badges, job titles, and live search.
 */
const DEFAULT_PEOPLE_LIST = [
  { id: '1', name: 'Alex Chen', role: 'Hiring Manager', dept: 'Engineering', avatar: 'AC' },
  { id: '2', name: 'Sarah Jenkins', role: 'HR Recruiter / HRBP', dept: 'Human Resources', avatar: 'SJ' },
  { id: '3', name: 'David Miller', role: 'Department Head / Finance Controller', dept: 'Finance & Ops', avatar: 'DM' }
];

const PeoplePicker = ({
  value,
  onChange,
  peopleList = DEFAULT_PEOPLE_LIST,
  placeholder = 'Select person...',
  searchPlaceholder = 'Search by name, role, or dept...',
  className = '',
  buttonClassName = '',
  disabled = false,
  size = 'md',
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Normalize people items
  const normalizedPeople = peopleList.map(p => {
    if (typeof p === 'object' && p !== null) {
      const name = p.name || p.label || p.value;
      const role = p.role || p.title || p.subtext || '';
      const avatar = p.avatar || (name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'US');
      return {
        id: p.id || p.value || name,
        name,
        role,
        dept: p.dept || p.department || '',
        avatar,
        raw: p
      };
    }
    return {
      id: String(p),
      name: String(p),
      role: '',
      dept: '',
      avatar: String(p).slice(0, 2).toUpperCase(),
      raw: p
    };
  });

  // Selected person
  const selectedPerson = normalizedPeople.find(p => String(p.name) === String(value) || String(p.id) === String(value));

  const filteredPeople = normalizedPeople.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.dept.toLowerCase().includes(q)
    );
  });

  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 280;

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
      if (e.target.closest('[data-portal-people-menu]')) return;
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
              ? 'bg-white dark:bg-slate-800 border-[var(--pw-brand)] ring-2 ring-[var(--pw-brand)]/20 shadow-sm text-[var(--pw-brand)]'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-[var(--pw-brand)] text-slate-800 dark:text-slate-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedPerson ? (
              <>
                <div className="w-5.5 h-5.5 rounded-full bg-[var(--pw-brand)]/10 text-[var(--pw-brand)] text-[10px] font-bold flex items-center justify-center shrink-0 border border-[var(--pw-brand)]/20">
                  {selectedPerson.avatar}
                </div>
                <span className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                  {selectedPerson.name}
                  {selectedPerson.role && <span className="text-slate-400 font-normal text-[11px] ml-1">({selectedPerson.role})</span>}
                </span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-xs font-semibold text-slate-400">
                  {placeholder}
                </span>
              </>
            )}
          </div>

          <div className={`p-0.5 rounded-md transition-colors ${isOpen ? 'bg-[var(--pw-brand)]/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--pw-brand)]' : ''}`} />
          </div>
        </motion.button>
      </div>

      {/* Popover Menu */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              data-portal-people-menu
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
                {filteredPeople.length > 0 ? (
                  filteredPeople.map((person) => {
                    const isSelected = String(person.name) === String(value) || String(person.id) === String(value);
                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          onChange(person.name);
                          setIsOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[var(--pw-brand)]/10 text-[var(--pw-brand)] font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {person.avatar}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{person.name}</div>
                            {person.role && <div className="text-[10px] text-slate-400 font-medium truncate">{person.role} • {person.dept}</div>}
                          </div>
                        </div>
                        {isSelected && <Check size={14} className="text-[var(--pw-brand)] shrink-0 ml-2" />}
                      </button>
                    );
                  })
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        onChange(searchQuery.trim());
                        setIsOpen(false);
                      }
                    }}
                    className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 text-[var(--pw-brand)] hover:bg-[var(--pw-brand)]/10 cursor-pointer text-left transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User size={13} />
                      <span className="truncate">Add "{searchQuery}"</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-[var(--pw-brand)]/10 px-1.5 py-0.5 rounded">Custom</span>
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

export default PeoplePicker;
