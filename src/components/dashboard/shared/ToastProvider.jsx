// ══════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM — Accessible, Max-3 Stacked Notification Provider
// ══════════════════════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'success', duration = 3500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    const newToast = { id, message, type };

    setToasts((prev) => {
      // Max 3 visible toasts, FIFO dismissal
      const updated = [...prev, newToast];
      if (updated.length > 3) {
        return updated.slice(updated.length - 3);
      }
      return updated;
    });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastElement = (
    <div 
      role="region" 
      aria-live="polite" 
      aria-label="Notifications"
      className="fixed bottom-16 right-6 sm:bottom-20 sm:right-6 z-[999999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isInfo = t.type === 'info';

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md text-xs font-bold ${
                isError
                  ? 'bg-rose-900/90 text-rose-100 border-rose-700/60 shadow-rose-950/40'
                  : isInfo
                  ? 'bg-blue-900/90 text-blue-100 border-blue-700/60 shadow-blue-950/40'
                  : 'bg-emerald-900/90 text-emerald-100 border-emerald-700/60 shadow-emerald-950/40'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-base shrink-0">
                  {isError ? '⚠️' : isInfo ? 'ℹ️' : '✅'}
                </span>
                <span className="leading-snug truncate">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
                className="opacity-70 hover:opacity-100 transition-opacity text-sm p-1 rounded-md cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {typeof document !== 'undefined' ? ReactDOM.createPortal(toastElement, document.body) : toastElement}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
