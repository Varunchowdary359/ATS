import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  Plus, UserCheck, Mail, Users, ShieldCheck, Video, MapPin, 
  ArrowUpRight, CheckCircle2 
} from 'lucide-react';
import { getCategoryCardTheme } from './InterviewCalendarView';
import { toLocalDateString } from './interviewTypes';

export const InterviewCalendarSidebar = ({
  currentDate = new Date(),
  onDateChange = () => {},
  sessions = [],
  onSelectSession = () => {},
  onScheduleClick = () => {},
  onCheckAvailability = () => {},
  onSendInvites = () => {},
  onManagePanels = () => {},
  onAssessmentPolicies = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [miniMonthDate, setMiniMonthDate] = useState(new Date(currentDate));

  // Sync mini calendar when external date changes
  const activeSelectedIso = toLocalDateString(currentDate);
  const todayIso = toLocalDateString(new Date());

  const handlePrevMonth = () => {
    const d = new Date(miniMonthDate);
    d.setMonth(d.getMonth() - 1);
    setMiniMonthDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(miniMonthDate);
    d.setMonth(d.getMonth() + 1);
    setMiniMonthDate(d);
  };

  // Mini calendar grid generation
  const miniCalendarDays = useMemo(() => {
    const year = miniMonthDate.getFullYear();
    const month = miniMonthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon as 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Map of session counts by date
    const sessionDateMap = {};
    sessions.forEach(s => {
      if (s.scheduledDate) {
        sessionDateMap[s.scheduledDate] = (sessionDateMap[s.scheduledDate] || 0) + 1;
      }
    });

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push({ key: `empty-${i}`, isCurrentMonth: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const isoStr = toLocalDateString(dateObj);
      days.push({
        key: isoStr,
        dayNumber: d,
        dateObj,
        isoStr,
        isCurrentMonth: true,
        isToday: isoStr === todayIso,
        isSelected: isoStr === activeSelectedIso,
        hasEvents: (sessionDateMap[isoStr] || 0) > 0,
        eventCount: sessionDateMap[isoStr] || 0
      });
    }

    return days;
  }, [miniMonthDate, sessions, todayIso, activeSelectedIso]);

  // Filter sessions for currently active selected date (or Today if none selected)
  const isSelectedDateToday = activeSelectedIso === todayIso;

  const displaySessions = useMemo(() => {
    const targetIso = activeSelectedIso || todayIso;
    return sessions
      .filter(s => s.scheduledDate === targetIso && s.status !== 'Cancelled')
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [sessions, activeSelectedIso, todayIso]);

  const selectedDateLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [currentDate]);

  return (
    <div className="space-y-4 font-sans text-left">
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: MINI INTERACTIVE CALENDAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
            {miniMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Day Name Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="py-0.5">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {miniCalendarDays.map((d) => {
            if (!d.isCurrentMonth) {
              return <div key={d.key} className="h-7 w-7 mx-auto" />;
            }

            return (
              <button
                key={d.key}
                onClick={() => onDateChange(d.dateObj)}
                className={`h-7 w-7 mx-auto rounded-lg text-[11px] font-bold relative flex flex-col items-center justify-center transition-all cursor-pointer ${
                  d.isSelected
                    ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                    : d.isToday
                    ? 'border border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50/50 dark:bg-blue-950/40'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{d.dayNumber}</span>
                {d.hasEvents && !d.isSelected && (
                  <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: DAY / TODAY SCHEDULE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={13} className="text-blue-500" />
            <span>{isSelectedDateToday ? `Today's Schedule` : `Schedule`} ({displaySessions.length})</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            {selectedDateLabel}
          </span>
        </div>

        <div className="space-y-2">
          {displaySessions.slice(0, 4).map(sess => {
            const theme = getCategoryCardTheme(sess);
            const interviewerName = (sess.interviewers || [])[0]?.name || 'Panel';

            return (
              <motion.div
                key={sess.id}
                whileHover={{ scale: 1.02, x: 2 }}
                onClick={() => onSelectSession(sess)}
                className={`p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 border-l-[4px] ${theme.borderAccent} ${theme.cardBg} shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-1 text-left`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className={`font-extrabold text-[11.5px] truncate ${theme.textColor}`}>
                    {sess.roundName}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                    {sess.startTime}–{sess.endTime}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate flex items-center justify-between">
                  <span>{sess.candidateName}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{interviewerName}</span>
                </div>
              </motion.div>
            );
          })}

          {displaySessions.length === 0 && (
            <div className="p-4 text-center text-slate-400 text-xs space-y-1">
              <CalendarIcon size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-1 opacity-70" />
              <p className="font-semibold">No interviews scheduled for this date.</p>
              {!isSelectedDateToday && (
                <button
                  onClick={() => onDateChange(new Date())}
                  className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Jump to Today
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: QUICK ACTIONS (MATCHING APPROVED SPEC)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
          Quick Actions
        </h3>

        <div className="space-y-1.5">
          <button
            onClick={onScheduleClick}
            style={{ backgroundColor: brandColor }}
            className="w-full h-9 px-3 text-xs font-bold text-white rounded-xl shadow-2xs hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Schedule Interview</span>
          </button>

          <button
            onClick={onCheckAvailability}
            className="w-full h-8.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <UserCheck size={14} className="text-blue-500" />
            <span>Check Availability</span>
          </button>

          <button
            onClick={onSendInvites}
            className="w-full h-8.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Mail size={14} className="text-emerald-500" />
            <span>Send Invites</span>
          </button>

          <button
            onClick={onManagePanels}
            className="w-full h-8.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Users size={14} className="text-purple-500" />
            <span>Manage Panels</span>
          </button>

          <button
            onClick={onAssessmentPolicies}
            className="w-full h-8.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <ShieldCheck size={14} className="text-indigo-500" />
            <span>Assessment Policies</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCalendarSidebar;
