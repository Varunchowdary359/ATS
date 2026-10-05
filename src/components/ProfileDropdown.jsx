import React, { useState, useRef, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';

const ProfileDropdown = ({ onLogout, onViewProfile }) => {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';

  const [isOpen, setIsOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const dropdownRef = useRef(null);

  const email = sessionStorage.getItem('pw_userEmail') || 'user@gmail.com';
  const name = email.split('@')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmSignOut = () => {
    setShowSignOutModal(false);
    if (onLogout) onLogout();
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Profile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ backgroundColor: brandColor }}
          className="flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold text-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 shadow-md transform hover:scale-105"
          aria-label="User menu"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {formattedName.charAt(0)}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-xl z-50 py-1 transition-opacity duration-150 text-start overflow-hidden"
          >
            {/* User Info Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                {formattedName.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate">
                  {formattedName}
                </p>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {email}
                </p>
              </div>
            </div>

            {/* Action Links */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onViewProfile();
                }}
                className="flex items-center gap-3 w-full px-5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150 cursor-pointer font-medium"
              >
                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </button>

              <div className="border-t border-slate-100 dark:border-slate-700/80 mt-1 pt-1 mb-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowSignOutModal(true);
                  }}
                  className="flex items-center gap-3 w-full px-5 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors duration-150 cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommended Flow: Sign Out Confirmation Modal */}
      {showSignOutModal && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSignOutModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 font-sans text-start"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 pb-1">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Sign out of PeopleWorks?
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Are you sure you want to sign out of your account?
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSignOutModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSignOutModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignOut}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ProfileDropdown;
