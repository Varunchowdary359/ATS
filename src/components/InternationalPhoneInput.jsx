import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { 
  getCountries, 
  getCountryCallingCode, 
  isValidPhoneNumber, 
  isPossiblePhoneNumber,
  parsePhoneNumberWithError, 
  getExampleNumber,
  AsYouType 
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';
import * as Flags from 'country-flag-icons/react/3x2';

// Standard English display names for ISO 3166-1 alpha-2 country codes
const displayNames = typeof Intl !== 'undefined' && Intl.DisplayNames 
  ? new Intl.DisplayNames(['en'], { type: 'region' }) 
  : null;

// Helper to get friendly country name with fallback
const getCountryName = (isoCode) => {
  try {
    if (displayNames) {
      const name = displayNames.of(isoCode);
      if (name && name !== isoCode) return name;
    }
  } catch {
    // Fallback
  }
  return isoCode;
};

// Helper to detect default country based on user browser locale or time zone
const detectUserCountry = (fallback = 'IN') => {
  if (typeof window === 'undefined') return fallback;

  try {
    // 1. Try navigator.language / navigator.languages region code
    const languages = navigator.languages || [navigator.language];
    for (const lang of languages) {
      if (lang && lang.includes('-')) {
        const region = lang.split('-')[1]?.toUpperCase();
        if (region && region.length === 2 && getCountries().includes(region)) {
          return region;
        }
      }
    }

    // 2. Try Intl timeZone mapping fallback
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone) {
      if (timeZone.startsWith('Asia/Kolkata') || timeZone.startsWith('Asia/Calcutta')) return 'IN';
      if (timeZone.startsWith('America/')) return 'US';
      if (timeZone.startsWith('Europe/London')) return 'GB';
      if (timeZone.startsWith('Australia/')) return 'AU';
      if (timeZone.startsWith('Asia/Dubai')) return 'AE';
    }
  } catch {
    // Graceful fallback
  }

  return fallback;
};

// Render country flag SVG component with fallback
export const CountryFlag = ({ code, className = "w-5 h-3.5 shrink-0 object-cover rounded-2xs shadow-2xs" }) => {
  if (!code) return null;
  const FlagComponent = Flags[code];
  if (FlagComponent) {
    return <FlagComponent className={className} title={code} aria-hidden="true" />;
  }
  return (
    <span aria-hidden="true" className="text-[10px] font-bold px-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded shrink-0">
      {code}
    </span>
  );
};

const InternationalPhoneInput = ({
  value,
  onChange,
  defaultCountry,
  disabled = false,
  error = '',
  id,
  name = 'phone',
  placeholder,
  ariaLabel = 'Mobile Number'
}) => {
  const componentId = useId();
  const inputId = id || `phone-input-${componentId}`;
  const listboxId = `country-listbox-${componentId}`;
  const buttonId = `country-select-btn-${componentId}`;

  // Initial country resolution: prop -> browser locale -> 'IN'
  const initialCountry = useMemo(() => {
    if (defaultCountry && getCountries().includes(defaultCountry)) {
      return defaultCountry;
    }
    return detectUserCountry('IN');
  }, [defaultCountry]);

  // Build full dataset of countries once
  const countryList = useMemo(() => {
    const allIsoCodes = getCountries();
    const list = allIsoCodes.map((iso) => {
      let callingCode = '';
      try {
        callingCode = getCountryCallingCode(iso);
      } catch {
        callingCode = '';
      }
      const name = getCountryName(iso);
      return {
        iso,
        name,
        callingCode: callingCode ? `+${callingCode}` : '',
        rawCallingCode: callingCode,
        searchStr: `${name} ${iso} +${callingCode} ${callingCode}`.toLowerCase()
      };
    });

    // Sort alphabetically by English country name
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isTouched, setIsTouched] = useState(false);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const listRef = useRef(null);
  const optionRefs = useRef([]);

  // Active selected country object
  const activeCountryObj = useMemo(() => {
    return countryList.find((c) => c.iso === selectedCountry) || 
      countryList.find((c) => c.iso === 'IN') || 
      countryList[0];
  }, [countryList, selectedCountry]);

  // Dynamic pattern mask placeholder for selected country (e.g. XXXXX XXXXX, (XXX) XXX-XXXX)
  const patternPlaceholder = useMemo(() => {
    try {
      const example = getExampleNumber(selectedCountry, examples);
      if (example) {
        let formatted = example.formatNational();
        // Strip leading 0 or trunk prefix for clean mobile format
        formatted = formatted.replace(/^0/, '').trim();
        if (selectedCountry === 'IN' && (formatted.startsWith('81234') || formatted.startsWith('0'))) {
          formatted = '98765 43210';
        }
        if (formatted) {
          // Convert numeric digits into 'X' pattern characters
          return formatted.replace(/\d/g, 'X');
        }
      }
    } catch {
      // Fallback
    }
    if (placeholder && placeholder !== 'Enter mobile number' && !placeholder.includes('10-digit')) {
      return placeholder;
    }
    return selectedCountry === 'IN' ? 'XXXXX XXXXX' : 'XXXXXXXXXX';
  }, [selectedCountry, placeholder]);

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countryList;
    const q = searchQuery.trim().toLowerCase();
    const cleanQ = q.startsWith('+') ? q.slice(1) : q;
    return countryList.filter(
      (c) => c.searchStr.includes(q) || c.searchStr.includes(cleanQ)
    );
  }, [countryList, searchQuery]);

  // Reset highlight index when filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCountries]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const prevEmittedRef = useRef(null);
  const lastEmittedRawRef = useRef(null);
  const lastEmittedE164Ref = useRef(null);
  const lastPropValueRef = useRef(value);

  // Validate and notify parent on state change
  const evaluateAndNotify = (number, countryIso) => {
    let numStr = '';
    if (typeof number === 'string') {
      numStr = number;
    } else if (typeof number === 'number') {
      numStr = String(number);
    } else if (typeof number === 'object' && number !== null) {
      numStr = number.rawInput || number.e164 || number.digitsOnly || '';
    }

    const callingCode = getCountryCallingCode(countryIso);
    const digitsOnly = numStr.replace(/\D/g, '');
    const fullE164Candidate = `+${callingCode}${digitsOnly}`;

    let isValid = false;
    let isPossible = false;
    let formattedE164 = '';
    let validationError = '';

    if (!digitsOnly) {
      isValid = false;
      isPossible = false;
      validationError = '';
    } else {
      try {
        isValid = isValidPhoneNumber(fullE164Candidate, countryIso);
        isPossible = isPossiblePhoneNumber(fullE164Candidate, countryIso);

        if (isValid) {
          const parsed = parsePhoneNumberWithError(fullE164Candidate, countryIso);
          formattedE164 = parsed.format('E.164');
        } else {
          const countryName = getCountryName(countryIso);
          if (!isPossible) {
            if (digitsOnly.length < 5) {
              validationError = `Phone number is too short for ${countryName} (+${callingCode})`;
            } else {
              validationError = `Invalid mobile number length for ${countryName} (+${callingCode})`;
            }
          } else {
            validationError = `Please enter a valid mobile number for ${countryName} (+${callingCode})`;
          }
        }
      } catch {
        isValid = false;
        validationError = `Invalid mobile number for ${getCountryName(countryIso)}`;
      }
    }

    const payload = {
      rawInput: numStr,
      digitsOnly,
      e164: formattedE164 || (isValid ? fullE164Candidate : ''),
      country: countryIso,
      callingCode: `+${callingCode}`,
      isValid,
      isPossible,
      error: validationError
    };

    lastEmittedRawRef.current = payload.rawInput;
    lastEmittedE164Ref.current = payload.e164;

    const prev = prevEmittedRef.current;
    if (
      !prev ||
      prev.rawInput !== payload.rawInput ||
      prev.country !== payload.country ||
      prev.isValid !== payload.isValid ||
      prev.e164 !== payload.e164 ||
      prev.error !== payload.error
    ) {
      prevEmittedRef.current = payload;
      if (onChangeRef.current) {
        onChangeRef.current(payload);
      }
    }

    return { isValid, validationError };
  };

  const phoneNumberRef = useRef(phoneNumber);
  useEffect(() => {
    phoneNumberRef.current = phoneNumber;
  }, [phoneNumber]);

  // Initial evaluation on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    evaluateAndNotify(phoneNumber, selectedCountry);
  }, []);

  // Handle external value prop changes without clobbering active typing
  useEffect(() => {
    if (value === undefined || value === null) return;

    if (
      value === lastEmittedRawRef.current || 
      value === lastEmittedE164Ref.current || 
      value === phoneNumberRef.current
    ) {
      lastPropValueRef.current = value;
      return;
    }

    if (value !== lastPropValueRef.current) {
      lastPropValueRef.current = value;

      let newCountry = selectedCountry;
      let rawVal = value;
      if (typeof value === 'object' && value !== null) {
        rawVal = value.rawInput || value.e164 || value.digitsOnly || '';
        if (value.country) {
          newCountry = value.country;
        }
      } else if (typeof value === 'number') {
        rawVal = String(value);
      } else if (typeof value !== 'string') {
        rawVal = '';
      }

      let newNumber = rawVal;

      if (typeof rawVal === 'string' && rawVal.startsWith('+')) {
        try {
          const parsed = parsePhoneNumberWithError(rawVal);
          if (parsed && parsed.country) {
            newCountry = parsed.country;
            setSelectedCountry(newCountry);
            newNumber = parsed.nationalNumber ? new AsYouType(newCountry).input(parsed.nationalNumber) : '';
          }
        } catch {
          try {
            const callingCode = getCountryCallingCode(newCountry);
            const prefix = `+${callingCode}`;
            if (rawVal.startsWith(prefix)) {
              newNumber = rawVal.slice(prefix.length).trim();
            }
          } catch {
            // ignore
          }
        }
      }

      setPhoneNumber(newNumber);
      evaluateAndNotify(newNumber, newCountry);
    }
  }, [value, selectedCountry]);

  // Handle phone input change with character filtering and AsYouType formatting
  const handleInputChange = (e) => {
    let inputValue = typeof e.target.value === 'string' ? e.target.value : '';
    setIsTouched(true);

    // Filter invalid non-dialable characters (allow digits, spaces, hyphens, parens, and leading +)
    if (inputValue.startsWith('+')) {
      inputValue = '+' + inputValue.slice(1).replace(/[^\d\s\-()]/g, '');
    } else {
      inputValue = inputValue.replace(/[^\d\s\-()]/g, '');
    }

    // Smart backspace: if user deleted a non-digit symbol (e.g. parenthesis or dash),
    // remove the preceding digit instead of re-adding the formatting symbol
    const prevDigits = (typeof phoneNumber === 'string' ? phoneNumber : '').replace(/\D/g, '');
    let inputDigits = inputValue.replace(/\D/g, '');
    if (inputValue.length < phoneNumber.length && prevDigits === inputDigits && inputDigits.length > 0) {
      inputDigits = inputDigits.slice(0, -1);
      inputValue = inputDigits;
    }

    // If user typed or pasted '+' prefix, attempt international auto-detection
    if (inputValue.trim().startsWith('+')) {
      try {
        const parsed = parsePhoneNumberWithError(inputValue.trim());
        if (parsed && parsed.country) {
          setSelectedCountry(parsed.country);
          const formattedNational = new AsYouType(parsed.country).input(parsed.nationalNumber);
          setPhoneNumber(formattedNational);
          evaluateAndNotify(formattedNational, parsed.country);
          return;
        }
      } catch {
        // Fallthrough if partial '+' string
      }
    }

    // Standard national input formatting
    const formatted = new AsYouType(selectedCountry).input(inputValue);
    setPhoneNumber(formatted);
    evaluateAndNotify(formatted, selectedCountry);
  };

  // Handle paste events
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;

    const trimmed = pasted.trim();
    if (trimmed.startsWith('+')) {
      e.preventDefault();
      try {
        const parsed = parsePhoneNumberWithError(trimmed);
        if (parsed && parsed.country) {
          setSelectedCountry(parsed.country);
          const formattedNational = new AsYouType(parsed.country).input(parsed.nationalNumber);
          setPhoneNumber(formattedNational);
          setIsTouched(true);
          evaluateAndNotify(formattedNational, parsed.country);
          return;
        }
      } catch {
        // Continue fallback
      }
    }
  };

  // Handle Country selection
  const selectCountry = (iso) => {
    setSelectedCountry(iso);
    setIsOpen(false);
    setSearchQuery('');
    
    // Re-format existing digits with new country
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const newFormatted = digitsOnly ? new AsYouType(iso).input(digitsOnly) : '';
    setPhoneNumber(newFormatted);
    evaluateAndNotify(newFormatted, iso);

    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 50);
  };

  const [countryDropdownStyle, setCountryDropdownStyle] = useState({});

  const updateDropdownPosition = () => {
    if (containerRef.current && isOpen) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popoverWidth = Math.min(320, viewportWidth - 24);
      const popoverHeight = 320;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const flip = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

      let calculatedLeft = rect.left;
      if (calculatedLeft + popoverWidth > viewportWidth - 12) {
        calculatedLeft = Math.max(12, viewportWidth - popoverWidth - 12);
      }
      if (calculatedLeft < 12) {
        calculatedLeft = 12;
      }

      setCountryDropdownStyle({
        position: 'fixed',
        top: flip ? undefined : rect.bottom + 6,
        bottom: flip ? viewportHeight - rect.top + 6 : undefined,
        left: `${calculatedLeft}px`,
        width: `${popoverWidth}px`,
        maxWidth: `calc(100vw - 24px)`,
        zIndex: 999999
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('[data-portal-phone-country]')) return;
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && optionRefs.current[highlightedIndex]) {
      const el = optionRefs.current[highlightedIndex];
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation inside search dropdown
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredCountries.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev > 0 ? prev - 1 : filteredCountries.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCountries[highlightedIndex]) {
        selectCountry(filteredCountries[highlightedIndex].iso);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
      document.getElementById(buttonId)?.focus();
    }
  };

  // Calculate dynamic validation status
  const currentDigits = phoneNumber.replace(/\D/g, '');
  const isValid = currentDigits ? isValidPhoneNumber(`+${activeCountryObj.rawCallingCode}${currentDigits}`, selectedCountry) : false;
  const showSuccessState = isValid && isTouched;
  const currentError = error || (isTouched && currentDigits && !isValid ? evaluateAndNotify(phoneNumber, selectedCountry).validationError : '');

  return (
    <div className="flex flex-col gap-1.5 w-full text-start" ref={containerRef}>
      {/* Unified Form Control Container */}
      <div 
        className={`relative flex items-center h-11 w-full rounded-lg border transition-all duration-200 bg-white dark:bg-slate-800 ${
          currentError 
            ? 'border-red-500 ring-1 ring-red-500/50' 
            : showSuccessState
            ? 'border-emerald-500 dark:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500'
            : 'border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`}
      >
        {/* Country Selector Trigger Button: [ 🇮🇳 India ▼ ] */}
        <button
          id={buttonId}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-label={`Selected country: ${activeCountryObj.name}. Click to change country.`}
          className="flex items-center gap-2 px-3 h-full border-e border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-s-lg shrink-0 transition-colors focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700"
        >
          <CountryFlag code={activeCountryObj.iso} />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 select-none max-w-[90px] sm:max-w-[120px] truncate">
            {activeCountryObj.name}
          </span>
          <svg 
            className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* National Mobile Number Input: [ +91 | XXXXX XXXXX ] */}
        <div className="relative flex-1 flex items-center h-full">
          <span className="ps-3 pe-2 text-sm font-semibold text-slate-600 dark:text-slate-300 select-none shrink-0">
            {activeCountryObj.callingCode}
          </span>
          <span className="h-4 w-px bg-slate-300 dark:bg-slate-600 shrink-0 me-1" aria-hidden="true" />
          <input
            id={inputId}
            ref={phoneInputRef}
            type="tel"
            name={name}
            value={phoneNumber}
            onChange={handleInputChange}
            onPaste={handlePaste}
            onBlur={() => setIsTouched(true)}
            disabled={disabled}
            placeholder={patternPlaceholder}
            aria-label={ariaLabel}
            aria-invalid={currentError ? "true" : "false"}
            aria-describedby={currentError ? `${inputId}-error` : undefined}
            className="w-full h-full px-2 text-sm font-medium text-slate-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500 tracking-wide"
          />
        </div>

        {/* Searchable Country Dropdown Modal/Listbox */}
        {typeof document !== 'undefined' && isOpen && createPortal(
          <div 
            data-portal-phone-country="true"
            style={countryDropdownStyle}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[999999] flex flex-col overflow-hidden animate-fadeIn font-sans"
            dir="ltr"
          >
            {/* Search Header */}
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 start-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search countries or code..."
                  aria-label="Search countries"
                  className="w-full h-9 ps-8 pe-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
            </div>

            {/* Country List */}
            <ul
              id={listboxId}
              ref={listRef}
              role="listbox"
              aria-label="Countries list"
              className="flex-1 max-h-60 overflow-y-auto py-1 divide-y divide-slate-100/50 dark:divide-slate-800"
            >
              {filteredCountries.length === 0 ? (
                <li className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No matching countries found
                </li>
              ) : (
                filteredCountries.map((c, index) => {
                  const isSelected = c.iso === selectedCountry;
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <li
                      key={c.iso}
                      ref={(el) => (optionRefs.current[index] = el)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectCountry(c.iso)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`flex items-center justify-between px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-brand/10 dark:bg-brand/20 font-semibold text-brand dark:text-sky-400' 
                          : isHighlighted 
                          ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <CountryFlag code={c.iso} />
                        <span className="truncate">{c.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({c.iso})</span>
                      </div>
                      <span className="font-mono font-medium text-slate-500 dark:text-slate-400 ms-2 shrink-0">
                        {c.callingCode}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body
        )}
      </div>

      {/* Dynamic Validation Error Message */}
      {currentError && (
        <span id={`${inputId}-error`} className="text-red-500 text-[11px] font-medium ps-0.5">
          {currentError}
        </span>
      )}
    </div>
  );
};

export default InternationalPhoneInput;
