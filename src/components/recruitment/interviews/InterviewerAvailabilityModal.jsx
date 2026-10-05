import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2, UserCheck, AlertCircle, ChevronLeft, ChevronRight, Video, Users } from 'lucide-react';
import { INTERVIEWERS_ROSTER } from './interviewMockData';
import CustomSelect from '../../dashboard/shared/CustomSelect';

export const InterviewerAvailabilityModal = ({
  isOpen,
  onClose,
  sessions = [],
  onSelectSlot = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedInterviewer, setSelectedInterviewer] = useState('All');

  const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const interviewerOptions = useMemo(() => [
    { label: `All Panelists (${INTERVIEWERS_ROSTER.length})`, value: 'All' },
    ...INTERVIEWERS_ROSTER.map(i => ({
      label: `${i.name} (${i.title})`,
      value: i.id
    }))
  ], []);

  const interviewerRoster = useMemo(() => {
    if (selectedInterviewer === 'All') return INTERVIEWERS_ROSTER;
    return INTERVIEWERS_ROSTER.filter(i => i.id === selectedInterviewer);
  }, [selectedInterviewer]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] text-left"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="p-2 sm:p-2.5 rounded-xl text-white shadow-2xs flex items-center justify-center shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <UserCheck size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Interviewer Availability &amp; Free Slots
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Check panel availability across engineering, product, and leadership rosters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter / Date Navigation Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CustomSelect
              prefix="Interviewer: "
              value={selectedInterviewer}
              onChange={val => setSelectedInterviewer(val)}
              options={interviewerOptions}
              size="sm"
              className="w-full sm:w-72"
            />
          </div>
        </div>

        {/* Roster & Timeslot Matrix */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <div className="space-y-3">
            {interviewerRoster.map(int => {
              // Find busy slots for this interviewer on selectedDate
              const busySessions = sessions.filter(s => 
                s.scheduledDate === selectedDate &&
                (s.interviewers || []).some(i => i.id === int.id || i.name === int.name) &&
                s.status !== 'Cancelled'
              );

              return (
                <div 
                  key={int.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-lg text-white font-extrabold text-xs flex items-center justify-center shrink-0"
                        style={{ backgroundColor: int.avatarBg || '#6366f1' }}
                      >
                        {int.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{int.name}</div>
                        <div className="text-[10px] text-slate-500">{int.role} • {int.department}</div>
                      </div>
                    </div>

                    <div className="text-xs">
                      {busySessions.length === 0 ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          Available All Day
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                          {busySessions.length} Scheduled {busySessions.length === 1 ? 'Round' : 'Rounds'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hourly timeline slot pills */}
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 pt-1">
                    {TIME_SLOTS.map(slot => {
                      const hourNum = parseInt(slot.split(':')[0], 10);
                      const isBusy = busySessions.some(s => {
                        const startHour = parseInt(s.startTime?.split(':')[0], 10);
                        return startHour === hourNum;
                      });

                      return (
                        <div
                          key={slot}
                          className={`p-1.5 rounded-lg text-center text-[10px] font-mono font-bold transition-all border ${
                            isBusy
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer shadow-2xs'
                          }`}
                          title={isBusy ? 'Busy with scheduled interview' : 'Free slot available'}
                        >
                          <div>{slot}</div>
                          <div className="text-[9px] font-sans font-medium mt-0.5">
                            {isBusy ? 'Busy' : 'Free'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Free Slot
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Interview In Session
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
