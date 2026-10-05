import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Headset } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatPanel from './AIChatPanel';

// ── Ultra-Modern Live Support Icon (Apple / Linear Aesthetic) ────────────────
const ModernSupportIcon = ({ className = "w-6 h-6" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-hidden="true"
  >
    {/* Main conversation bubble with subtle rounded tail */}
    <path
      d="M12 3C6.75329 3 2.5 6.91752 2.5 11.75C2.5 14.1842 3.56477 16.3853 5.30391 17.9711C5.10526 19.3401 4.39868 20.6552 3.3259 21.6508C3.10915 21.8519 3.22019 22.25 3.5146 22.25C6.18244 22.25 8.35478 20.8906 9.5375 19.8665C10.3294 20.2798 11.1448 20.5 12 20.5C17.2467 20.5 21.5 16.5825 21.5 11.75C21.5 6.91752 17.2467 3 12 3Z"
      fill="currentColor"
      fillOpacity="0.95"
    />
    {/* Dual conversational horizontal indicator bars */}
    <rect x="7" y="9.75" width="10" height="1.75" rx="0.875" fill="var(--pw-brand, #0284c7)" className="dark:fill-slate-900 opacity-90" />
    <rect x="7" y="13" width="6.5" height="1.75" rx="0.875" fill="var(--pw-brand, #0284c7)" className="dark:fill-slate-900 opacity-90" />
  </svg>
);

export default function PeopleWorksAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelpNudge, setShowHelpNudge] = useState(false);
  const isDraggingRef = useRef(false);
  const dragConstraintsRef = useRef(null);

  // Recurring nudge tooltip every 2 mins (120s) with 6s display duration
  useEffect(() => {
    let hideTimer = null;

    const triggerNudge = () => {
      setShowHelpNudge(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setShowHelpNudge(false);
      }, 6000);
    };

    // Initial nudge after 4 seconds
    const initialTimer = setTimeout(triggerNudge, 4000);

    // Recurring interval every 2 minutes (120000ms)
    const intervalTimer = setInterval(triggerNudge, 120000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  // Keyboard shortcut listener (Alt+A or Ctrl+Space to toggle)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Full-screen constraint bounds for smooth dragging */}
      <div 
        ref={dragConstraintsRef} 
        className="fixed inset-4 pointer-events-none z-40"
      />

      {/* Draggable Floating Action Button */}
      <motion.div
        drag
        dragConstraints={dragConstraintsRef}
        dragElastic={0.08}
        dragMomentum={false}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 120);
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-14 sm:bottom-16 end-5 sm:end-6 z-40 cursor-grab active:cursor-grabbing select-none group"
      >
        <button
          type="button"
          onClick={() => {
            if (isDraggingRef.current) return;
            setIsOpen(prev => !prev);
          }}
          aria-label={isOpen ? "Close Live Support" : "Open Live Support (Alt + A)"}
          title={isOpen ? "Close Support" : "Live Support • Drag to move (Alt + A)"}
          style={{
            background: 'linear-gradient(135deg, var(--pw-brand, #0284c7) 0%, color-mix(in srgb, var(--pw-brand, #0284c7) 80%, #000) 100%)',
            color: 'var(--pw-brand-fg, #ffffff)'
          }}
          className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-[0_10px_25px_-3px_rgba(0,0,0,0.28),0_4px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_14px_32px_-3px_rgba(0,0,0,0.36)] transition-shadow duration-200 flex items-center justify-center ring-1.5 ring-white/30 dark:ring-white/15 backdrop-blur-md"
        >
          {/* Subtle glossy top reflection */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-xl sm:rounded-t-2xl pointer-events-none" />

          {isOpen ? (
            <X size={18} strokeWidth={2.5} className="text-white relative z-10" />
          ) : (
            <ModernSupportIcon className="w-5 h-5 text-white relative z-10 drop-shadow-xs" />
          )}
        </button>

        {/* Recurring "I am here to help you!" Speech Bubble */}
        <AnimatePresence>
          {showHelpNudge && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.92 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
                setShowHelpNudge(false);
              }}
              className="absolute bottom-full mb-3 end-0 z-50 cursor-pointer pointer-events-auto select-none"
            >
              <div className="relative px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium shadow-[0_10px_25px_-4px_rgba(0,0,0,0.2),0_4px_10px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-slate-800 hover:border-[var(--pw-brand)] hover:scale-105 transition-transform">
                <span className="whitespace-nowrap tracking-tight text-[12px]">I am here to help you!</span>
                {/* Downward pointer notch */}
                <div className="absolute -bottom-1.5 end-4 w-2.5 h-2.5 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-800 transform rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle Tooltip on Hover */}
        {!showHelpNudge && (
          <div className="absolute bottom-full mb-2 end-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 dark:bg-slate-800/95 text-white text-[10px] font-bold shadow-xl border border-slate-700/60 backdrop-blur-md flex items-center gap-1.5">
              <span>{isOpen ? 'Close' : 'Live Support'}</span>
              <span className="text-[8.5px] opacity-60 font-mono">Drag to reposition</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Slide-over Live Support Panel Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-14 sm:bottom-16 end-4 sm:end-6 z-50 transition-all w-[calc(100vw-2rem)] sm:w-[410px] h-[560px] max-h-[82vh]"
          >
            <AIChatPanel
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
