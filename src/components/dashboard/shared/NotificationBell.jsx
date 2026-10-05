// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION BELL — Dropdown notification center for all roles (Mobile Responsive)
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useContext } from 'react';
import { ThemeContext } from '../../../ThemeContext';
import { NOTIFICATIONS } from '../data/mockData';

const NotificationBell = () => {
  const { activeRole, activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const roleId = activeRole?.id || 'ceo';
    setNotifications(NOTIFICATIONS[roleId] || NOTIFICATIONS.ceo || []);
  }, [activeRole]);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div ref={ref} className="relative inline-block">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span 
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full text-white text-[9px] font-black shadow-xs ring-2 ring-white dark:ring-slate-900 animate-pulse"
            style={{ backgroundColor: brandColor }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown / Mobile Popup */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup Container */}
          <div 
            className="fixed sm:absolute top-[60px] sm:top-[calc(100%+8px)] left-2 right-2 sm:left-auto sm:right-0 sm:w-[360px] max-w-[calc(100vw-16px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-start"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
                {unreadCount > 0 && (
                  <span 
                    className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-extrabold"
                    style={{ backgroundColor: `${brandColor}18`, color: brandColor }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-bold hover:underline transition-all cursor-pointer"
                    style={{ color: brandColor }}
                  >
                    Mark all read
                  </button>
                )}
                {/* Mobile Close Icon */}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[65vh] sm:max-h-[340px] overflow-y-auto divide-y divide-slate-100/70 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      !n.read ? 'bg-slate-50/80 dark:bg-slate-800/30' : ''
                    }`}
                  >
                    {/* Indicator dot */}
                    <div className="mt-1.5 shrink-0">
                      <div
                        className={`w-2 h-2 rounded-full transition-all ${!n.read ? 'scale-100' : 'scale-0'}`}
                        style={{ backgroundColor: n.color || brandColor }}
                      />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${
                        !n.read
                          ? 'font-bold text-slate-800 dark:text-slate-100'
                          : 'font-semibold text-slate-500 dark:text-slate-400'
                      }`}>
                        {n.text}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 block">{n.time}</span>
                    </div>
                    {/* Type icon */}
                    <span
                      className="shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-2xs"
                      style={{ backgroundColor: (n.color || brandColor) + '15', color: n.color || brandColor }}
                    >
                      {n.type === 'approval' && '📋'}
                      {n.type === 'escalation' && '🚨'}
                      {n.type === 'insight' && '💡'}
                      {n.type === 'budget' && '💰'}
                      {n.type === 'interview' && '📅'}
                      {n.type === 'offer' && '🤝'}
                      {n.type === 'joiner' && '🎉'}
                      {n.type === 'candidate' && '⭐'}
                      {n.type === 'feedback' && '✍️'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full text-[11px] font-bold transition-all text-center py-1 hover:underline cursor-pointer"
                style={{ color: brandColor }}
              >
                View All Notifications →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
