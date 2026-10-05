import React, { createContext, useContext, useState, useCallback } from 'react';
import { ThemeContext } from '../../ThemeContext';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const themeContext = useContext(ThemeContext);
  const activeTheme = themeContext?.activeTheme;
  const brandColor = activeTheme?.color || '#1A56DB';

  const [toasts, setToasts] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  const addToast = useCallback(({ title, message, type = 'success', duration = 6000, action, details, actor, moduleName }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type, duration, action, details, actor, moduleName, timestamp: 'Just now' }]);
    
    if (duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getToastColors = (type) => {
    switch (type) {
      case 'warning':
        return {
          themeColor: brandColor,
          icon: (
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${brandColor}15`, borderColor: `${brandColor}35`, color: brandColor }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          )
        };
      case 'error':
        return {
          themeColor: '#f43f5e',
          icon: (
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
          )
        };
      case 'success':
        return {
          themeColor: '#10b981',
          icon: (
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            </div>
          )
        };
      default:
        return {
          themeColor: brandColor,
          icon: (
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${brandColor}15`, borderColor: `${brandColor}35`, color: brandColor }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          )
        };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div 
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] pointer-events-none flex flex-col justify-end max-w-[calc(100vw-32px)]"
        style={{ perspective: '1000px', width: 'auto' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {toasts.map((toast, index) => {
          const reverseIdx = toasts.length - 1 - index;
          if (reverseIdx > 3) return null; // Only show top 4

          const scale = isHovered ? 1 : 1 - reverseIdx * 0.05;
          const translateY = isHovered ? -(reverseIdx * 65) : -(reverseIdx * 10);
          const opacity = isHovered ? 1 : 1 - reverseIdx * 0.2;
          const duration = toast.duration !== undefined ? toast.duration : 6000;
          const { themeColor, icon } = getToastColors(toast.type);

          return (
            <div 
              key={toast.id} 
              className="absolute bottom-0 right-0 pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1.1)] flex justify-end max-w-full"
              style={{
                transform: `translateY(${translateY}px) scale(${scale})`,
                zIndex: 100 - reverseIdx,
                opacity: opacity,
                transformOrigin: 'bottom right'
              }}
            >
              <div 
                className="relative overflow-hidden flex items-center w-max min-w-[240px] sm:min-w-[320px] max-w-[calc(100vw-32px)] sm:max-w-[550px] pl-3.5 pr-2 py-3 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border text-slate-900 dark:text-white"
                style={{ borderColor: `${themeColor}50` }}
              >
                
                {/* Status Icon */}
                <div className="shrink-0 mr-3">
                  {icon}
                </div>

                {/* Core Message */}
                <div className="flex flex-col min-w-0 mr-4 py-0.5 justify-center">
                  <h4 className="text-[13px] font-bold tracking-tight leading-tight">{toast.title}</h4>
                  {toast.message && <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{toast.message}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 pl-3 border-l border-slate-200/80 dark:border-slate-800">
                  {toast.action && (
                    <button 
                      onClick={toast.action.onClick} 
                      style={{ color: themeColor }}
                      className="text-[12px] font-bold transition-colors uppercase tracking-wide px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {toast.action.label}
                    </button>
                  )}
                  <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Ultra-Thin Progress Animation Bar */}
                {duration > 0 && !isHovered && (
                  <div 
                    className="absolute bottom-0 left-0 h-[3px]"
                    style={{ 
                      backgroundColor: themeColor,
                      animation: `toast-progress ${duration}ms linear forwards` 
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
