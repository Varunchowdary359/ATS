import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Video, Users, Phone, MapPin, AlertCircle, AlertTriangle,
  Plus, ShieldCheck, Sparkles, Building2, Briefcase, X,
  Search, Filter, RotateCcw, CheckCircle2, UserCheck, Award
} from 'lucide-react';
import { SESSION_STATUS, INTERVIEW_TYPE, toLocalDateString, INTERVIEW_ROLES, hasInterviewPermission, INTERVIEW_PERMISSIONS } from './interviewTypes';
import CustomSelect from '../../dashboard/shared/CustomSelect';

export const CALENDAR_VIEW_MODES = {
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month',
  AGENDA: 'Agenda'
};

export const BASE_HOUR = 8; // 8:00 AM
export const TOTAL_HOURS = 10; // 8:00 AM to 6:00 PM (10 hours)
export const ROW_HEIGHT_PX = 96; // Pixel height per 1-hour slot
export const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => i + BASE_HOUR); // 8..18

/**
 * Enterprise category classifier for event cards, badges, and legend pills
 * Uses subtle border accents and small dot indicators for a clean SaaS aesthetic.
 */
export const getCategoryCardTheme = (session = {}) => {
  const roundName = (session.roundName || '').toLowerCase();
  const category = (session.roundCategory || '').toLowerCase();
  const subtype = (session.roundSubtype || '').toLowerCase();

  // 1. Assessment (Cognitive / Aptitude) - Emerald
  if (category.includes('assessment') && !roundName.includes('coding') && !subtype.includes('coding')) {
    return {
      type: 'Assessment',
      dotColor: '#10b981',
      dotClass: 'bg-emerald-500',
      borderAccent: 'border-l-[3.5px] border-l-emerald-500 dark:border-l-emerald-400',
      cardBg: 'bg-gradient-to-br from-emerald-50/90 via-white/95 to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-900/90 dark:to-emerald-950/20 border-emerald-200/90 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.12)] hover:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.22)]',
      badgeBg: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30',
      titleColor: 'text-slate-900 dark:text-slate-50',
      subColor: 'text-emerald-900/80 dark:text-emerald-200/90',
      timeColor: 'text-slate-600 dark:text-slate-300',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    };
  }

  // 2. Coding Assessment / Interview - Violet
  if (roundName.includes('coding') || subtype.includes('coding') || roundName.includes('algorithm')) {
    return {
      type: 'Coding',
      dotColor: '#8b5cf6',
      dotClass: 'bg-violet-500',
      borderAccent: 'border-l-[3.5px] border-l-violet-500 dark:border-l-violet-400',
      cardBg: 'bg-gradient-to-br from-violet-50/90 via-white/95 to-violet-50/40 dark:from-violet-950/40 dark:via-slate-900/90 dark:to-violet-950/20 border-violet-200/90 dark:border-violet-800/60 hover:border-violet-400 dark:hover:border-violet-500 shadow-[0_2px_8px_-2px_rgba(139,92,246,0.12)] hover:shadow-[0_6px_16px_-4px_rgba(139,92,246,0.22)]',
      badgeBg: 'bg-violet-500/15 text-violet-800 dark:text-violet-200 border-violet-500/30',
      titleColor: 'text-slate-900 dark:text-slate-50',
      subColor: 'text-violet-900/80 dark:text-violet-200/90',
      timeColor: 'text-slate-600 dark:text-slate-300',
      iconColor: 'text-violet-600 dark:text-violet-400'
    };
  }

  // 3. Technical Interview / System Design - Blue
  if (roundName.includes('technical') || subtype.includes('technical') || roundName.includes('system design') || subtype.includes('system_design')) {
    return {
      type: 'Technical',
      dotColor: '#2563eb',
      dotClass: 'bg-blue-600',
      borderAccent: 'border-l-[3.5px] border-l-blue-600 dark:border-l-blue-400',
      cardBg: 'bg-gradient-to-br from-blue-50/90 via-white/95 to-blue-50/40 dark:from-blue-950/40 dark:via-slate-900/90 dark:to-blue-950/20 border-blue-200/90 dark:border-blue-800/60 hover:border-blue-400 dark:hover:border-blue-500 shadow-[0_2px_8px_-2px_rgba(37,99,235,0.12)] hover:shadow-[0_6px_16px_-4px_rgba(37,99,235,0.22)]',
      badgeBg: 'bg-blue-500/15 text-blue-800 dark:text-blue-200 border-blue-500/30',
      titleColor: 'text-slate-900 dark:text-slate-50',
      subColor: 'text-blue-900/80 dark:text-blue-200/90',
      timeColor: 'text-slate-600 dark:text-slate-300',
      iconColor: 'text-blue-600 dark:text-blue-400'
    };
  }

  // 4. Managerial / Behavioral - Amber
  if (roundName.includes('managerial') || subtype.includes('managerial') || roundName.includes('behavioral')) {
    return {
      type: 'Managerial',
      dotColor: '#f59e0b',
      dotClass: 'bg-amber-500',
      borderAccent: 'border-l-[3.5px] border-l-amber-500 dark:border-l-amber-400',
      cardBg: 'bg-gradient-to-br from-amber-50/90 via-white/95 to-amber-50/40 dark:from-amber-950/40 dark:via-slate-900/90 dark:to-amber-950/20 border-amber-200/90 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-500 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.12)] hover:shadow-[0_6px_16px_-4px_rgba(245,158,11,0.22)]',
      badgeBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30',
      titleColor: 'text-slate-900 dark:text-slate-50',
      subColor: 'text-amber-900/80 dark:text-amber-200/90',
      timeColor: 'text-slate-600 dark:text-slate-300',
      iconColor: 'text-amber-600 dark:text-amber-400'
    };
  }

  // 5. HR / Discussion / Culture - Teal
  if (roundName.includes('hr') || subtype.includes('hr') || roundName.includes('culture') || roundName.includes('fit') || category.includes('hr')) {
    return {
      type: 'HR',
      dotColor: '#0d9488',
      dotClass: 'bg-teal-600',
      borderAccent: 'border-l-[3.5px] border-l-teal-600 dark:border-l-teal-400',
      cardBg: 'bg-gradient-to-br from-teal-50/90 via-white/95 to-teal-50/40 dark:from-teal-950/40 dark:via-slate-900/90 dark:to-teal-950/20 border-teal-200/90 dark:border-teal-800/60 hover:border-teal-400 dark:hover:border-teal-500 shadow-[0_2px_8px_-2px_rgba(13,148,136,0.12)] hover:shadow-[0_6px_16px_-4px_rgba(13,148,136,0.22)]',
      badgeBg: 'bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/30',
      titleColor: 'text-slate-900 dark:text-slate-50',
      subColor: 'text-teal-900/80 dark:text-teal-200/90',
      timeColor: 'text-slate-600 dark:text-slate-300',
      iconColor: 'text-teal-600 dark:text-teal-400'
    };
  }

  // 6. Panel / Leadership - Fuchsia
  return {
    type: 'Panel',
    dotColor: '#d946ef',
    dotClass: 'bg-fuchsia-500',
    borderAccent: 'border-l-[3.5px] border-l-fuchsia-500 dark:border-l-fuchsia-400',
    cardBg: 'bg-gradient-to-br from-fuchsia-50/90 via-white/95 to-fuchsia-50/40 dark:from-fuchsia-950/40 dark:via-slate-900/90 dark:to-fuchsia-950/20 border-fuchsia-200/90 dark:border-fuchsia-800/60 hover:border-fuchsia-400 dark:hover:border-fuchsia-500 shadow-[0_2px_8px_-2px_rgba(217,70,239,0.12)] hover:shadow-[0_6px_16px_-4px_rgba(217,70,239,0.22)]',
    badgeBg: 'bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-200 border-fuchsia-500/30',
    titleColor: 'text-slate-900 dark:text-slate-50',
    subColor: 'text-fuchsia-900/80 dark:text-fuchsia-200/90',
    timeColor: 'text-slate-600 dark:text-slate-300',
    iconColor: 'text-fuchsia-600 dark:text-fuchsia-400'
  };
};

/**
 * Helper to detect conflicts between sessions
 * Distinguishes between Interviewer Conflict, Candidate Conflict, and Normal Parallel Team Activity.
 */
export const detectSessionConflicts = (sessions = []) => {
  const conflictMap = new Map();

  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i];
      const b = sessions[j];

      if (a.scheduledDate === b.scheduledDate && a.status !== 'Cancelled' && b.status !== 'Cancelled') {
        const [aStartH, aStartM] = (a.startTime || '00:00').split(':').map(Number);
        const [aEndH, aEndM] = (a.endTime || '00:00').split(':').map(Number);
        const [bStartH, bStartM] = (b.startTime || '00:00').split(':').map(Number);
        const [bEndH, bEndM] = (b.endTime || '00:00').split(':').map(Number);

        const aStart = aStartH * 60 + aStartM;
        const aEnd = aEndH * 60 + aEndM;
        const bStart = bStartH * 60 + bStartM;
        const bEnd = bEndH * 60 + bEndM;

        const overlaps = Math.max(aStart, bStart) < Math.min(aEnd, bEnd);

        if (overlaps) {
          const aInterviewerIds = (a.interviewers || []).map(int => int.id).filter(Boolean);
          const bInterviewerIds = (b.interviewers || []).map(int => int.id).filter(Boolean);
          const sharedInterviewers = (a.interviewers || []).filter(int => int.id && bInterviewerIds.includes(int.id));
          const sharedCandidate = Boolean(a.candidateId && b.candidateId && a.candidateId === b.candidateId);

          if (sharedInterviewers.length > 0) {
            const intNames = sharedInterviewers.map(i => i.name).join(', ');
            conflictMap.set(a.id, {
              type: 'INTERVIEWER_CONFLICT',
              title: 'Interviewer Conflict',
              message: `${intNames} is already scheduled from ${b.startTime} to ${b.endTime} with ${b.candidateName}.`,
              conflictingSession: b,
              sharedInterviewers
            });
            conflictMap.set(b.id, {
              type: 'INTERVIEWER_CONFLICT',
              title: 'Interviewer Conflict',
              message: `${intNames} is already scheduled from ${a.startTime} to ${a.endTime} with ${a.candidateName}.`,
              conflictingSession: a,
              sharedInterviewers
            });
          } else if (sharedCandidate) {
            conflictMap.set(a.id, {
              type: 'CANDIDATE_CONFLICT',
              title: 'Candidate Schedule Conflict',
              message: `Candidate ${a.candidateName} is already scheduled for '${b.roundName}' from ${b.startTime} to ${b.endTime}.`,
              conflictingSession: b
            });
            conflictMap.set(b.id, {
              type: 'CANDIDATE_CONFLICT',
              title: 'Candidate Schedule Conflict',
              message: `Candidate ${b.candidateName} is already scheduled for '${a.roundName}' from ${a.startTime} to ${a.endTime}.`,
              conflictingSession: a
            });
          }
        }
      }
    }
  }

  return conflictMap;
};

/**
 * Computes exact coordinate layout for sessions on a single calendar day.
 * - Duration controls vertical height.
 * - Start time controls vertical top offset.
 * - Overlap controls horizontal width division without altering day column width.
 * - Sequential non-overlapping sessions appear vertically taking 100% width.
 * - Multi-hour events (e.g. 08:00–11:00) render as one continuous tall card.
 */
export const calculateDayEventLayouts = (
  sessions = [], 
  rowHeight = ROW_HEIGHT_PX, 
  baseHour = BASE_HOUR, 
  totalHours = TOTAL_HOURS
) => {
  const validSessions = sessions
    .filter(s => s && s.status !== 'Cancelled')
    .map(s => {
      const [startH, startM] = (s.startTime || '08:00').split(':').map(Number);
      const [endH, endM] = (s.endTime || '09:00').split(':').map(Number);
      const startMin = (isNaN(startH) ? 8 : startH) * 60 + (isNaN(startM) ? 0 : startM);
      let endMin = (isNaN(endH) ? startH + 1 : endH) * 60 + (isNaN(endM) ? 0 : endM);
      if (endMin <= startMin) {
        endMin = startMin + (s.duration || 60);
      }
      return {
        session: s,
        startMin,
        endMin,
        duration: endMin - startMin
      };
    })
    .sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

  if (validSessions.length === 0) return [];

  // Group into connected components (clusters of overlapping intervals)
  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  for (const item of validSessions) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMin;
    } else {
      if (item.startMin < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endMin);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.endMin;
      }
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // For each cluster, assign sub-columns (greedy graph coloring)
  const positionedEvents = [];

  for (const cluster of clusters) {
    const columns = []; // tracks end time for each sub-column

    const clusterItemsWithCol = cluster.map(item => {
      let colIdx = -1;
      for (let c = 0; c < columns.length; c++) {
        if (columns[c] <= item.startMin) {
          colIdx = c;
          columns[c] = item.endMin;
          break;
        }
      }
      if (colIdx === -1) {
        colIdx = columns.length;
        columns.push(item.endMin);
      }
      return {
        ...item,
        colIdx
      };
    });

    const totalColumns = columns.length;

    for (const item of clusterItemsWithCol) {
      const baseMin = baseHour * 60;
      const startRel = Math.max(0, item.startMin - baseMin);
      const endRel = Math.min(totalHours * 60, item.endMin - baseMin);
      const durRel = Math.max(15, endRel - startRel);

      const topPx = (startRel / 60) * rowHeight;
      const heightPx = Math.max(28, (durRel / 60) * rowHeight - 4);
      const widthPct = 100 / totalColumns;
      const leftPct = item.colIdx * widthPct;

      positionedEvents.push({
        session: item.session,
        top: topPx,
        height: heightPx,
        leftPct,
        widthPct,
        colIdx: item.colIdx,
        totalColumns,
        duration: item.duration
      });
    }
  }

  return positionedEvents;
};

const InterviewCalendarView = ({ 
  sessions = [], 
  brandColor = 'var(--pw-brand)',
  currentDate = new Date(),
  onDateChange = () => {},
  viewMode = CALENDAR_VIEW_MODES.MONTH,
  onViewModeChange = () => {},
  onSelectSession = () => {},
  onScheduleClick = () => {},
  isLoading = false,
  isError = false,
  onRetry = () => {},
  currentRole = INTERVIEW_ROLES.RECRUITER
}) => {
  // Live Time Clock for dynamic time line
  const [now, setNow] = useState(new Date());

  // Hover Tooltip State
  const [hoveredSession, setHoveredSession] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // "+N more" Overflow Popover State
  const [overflowDate, setOverflowDate] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute Conflict IDs across loaded sessions
  const conflictIds = useMemo(() => detectSessionConflicts(sessions), [sessions]);

  // Format active navigation date range text
  const dateRangeLabel = useMemo(() => {
    const curr = new Date(currentDate);

    if (viewMode === CALENDAR_VIEW_MODES.DAY) {
      return curr.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    if (viewMode === CALENDAR_VIEW_MODES.WEEK) {
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(curr.getFullYear(), curr.getMonth(), diff);
      const sunday = new Date(curr.getFullYear(), curr.getMonth(), diff + 6);

      const monMonth = monday.toLocaleDateString('en-US', { month: 'short' });
      const sunMonth = sunday.toLocaleDateString('en-US', { month: 'short' });
      const year = sunday.getFullYear();

      if (monMonth === sunMonth) {
        return `${monday.getDate()} – ${sunday.getDate()} ${sunday.toLocaleDateString('en-US', { month: 'long' })} ${year}`;
      }
      return `${monday.getDate()} ${monMonth} – ${sunday.getDate()} ${sunMonth} ${year}`;
    }

    if (viewMode === CALENDAR_VIEW_MODES.MONTH) {
      return curr.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    return `Agenda — ${curr.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  }, [currentDate, viewMode]);

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === CALENDAR_VIEW_MODES.DAY) next.setDate(next.getDate() - 1);
    else if (viewMode === CALENDAR_VIEW_MODES.WEEK) next.setDate(next.getDate() - 7);
    else if (viewMode === CALENDAR_VIEW_MODES.MONTH) next.setMonth(next.getMonth() - 1);
    else next.setDate(next.getDate() - 7);
    onDateChange(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === CALENDAR_VIEW_MODES.DAY) next.setDate(next.getDate() + 1);
    else if (viewMode === CALENDAR_VIEW_MODES.WEEK) next.setDate(next.getDate() + 7);
    else if (viewMode === CALENDAR_VIEW_MODES.MONTH) next.setMonth(next.getMonth() + 1);
    else next.setDate(next.getDate() + 7);
    onDateChange(next);
  };

  const handleToday = () => onDateChange(new Date());

  // Check if viewing current today
  const isCurrentDateToday = useMemo(() => {
    const today = new Date();
    if (viewMode === CALENDAR_VIEW_MODES.DAY) {
      return toLocalDateString(currentDate) === toLocalDateString(today);
    }
    if (viewMode === CALENDAR_VIEW_MODES.WEEK) {
      const curr = new Date(currentDate);
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(curr.getFullYear(), curr.getMonth(), diff);
      const sunday = new Date(curr.getFullYear(), curr.getMonth(), diff + 6, 23, 59, 59);
      return today >= monday && today <= sunday;
    }
    if (viewMode === CALENDAR_VIEW_MODES.MONTH) {
      return currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    }
    return toLocalDateString(currentDate) === toLocalDateString(today);
  }, [currentDate, viewMode]);

  // Week days calculation
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(curr.getFullYear(), curr.getMonth(), diff);
    const todayStr = toLocalDateString(new Date());

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const isoStr = toLocalDateString(d);
      return {
        date: d,
        isoStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: isoStr === todayStr
      };
    });
  }, [currentDate]);

  // Live Time Indicator Calculation
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isTimeInWorkingHours = currentHour >= BASE_HOUR && currentHour < (BASE_HOUR + TOTAL_HOURS);
  const timeIndicatorTop = ((currentHour - BASE_HOUR) + (currentMinute / 60)) * ROW_HEIGHT_PX;
  const formattedCurrentTime = `${currentHour > 12 ? currentHour - 12 : currentHour === 0 ? 12 : currentHour}:${currentMinute.toString().padStart(2, '0')} ${currentHour >= 12 ? 'PM' : 'AM'}`;

  // Hover Tooltip Handlers
  const handleMouseEnterSession = (e, sess) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
    setHoveredSession(sess);
  };

  const handleMouseLeaveSession = () => {
    setHoveredSession(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col font-sans text-left transition-all relative">
      
      {/* ═══════════════════════════════════════════════════════════════════
          1. CLEAN SAAS CALENDAR TOOLBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-3 sm:p-4 border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: [Today] [Previous] [Next] + Date Range */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleToday}
              title={isCurrentDateToday ? "Currently on today" : "Jump to Today"}
              style={!isCurrentDateToday ? { borderColor: `${brandColor}40`, color: brandColor } : {}}
              className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isCurrentDateToday
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-default'
                  : 'bg-white dark:bg-slate-800 hover:brightness-105 border hover:shadow-xs active:scale-98'
              }`}
            >
              <CalendarIcon size={13} />
              <span>Today</span>
            </button>

            {/* Prev / Next Chevrons */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
              <button
                onClick={handlePrev}
                title="Previous Period"
                className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700" />
              <button
                onClick={handleNext}
                title="Next Period"
                className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Active Date Range */}
            <div className="flex items-center gap-2 ml-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {dateRangeLabel}
              </h2>
              {isCurrentDateToday && (
                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Today
                </span>
              )}
            </div>
          </div>

          {/* Right: View Switcher (Day / Week / Month / Agenda) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            {Object.values(CALENDAR_VIEW_MODES).map(mode => {
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  style={isActive ? { backgroundColor: brandColor, color: 'var(--pw-brand-fg, #ffffff)' } : {}}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isActive 
                      ? 'shadow-xs font-bold' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. RESTRAINED CATEGORY LEGEND
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-4 pt-1 border-t border-slate-200/40 dark:border-slate-800/40 overflow-x-auto scrollbar-none text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 shrink-0">
            Legend:
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Assessment
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-violet-500" /> Coding
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Technical
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Managerial
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-teal-600" /> HR
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-fuchsia-500" /> Panel
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LOADING & ERROR STATES
      ═══════════════════════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-7 h-7 mx-auto border-2 border-slate-200 border-t-[var(--pw-brand)] rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading interview schedule...</p>
        </div>
      ) : isError ? (
        <div className="p-10 text-center space-y-3">
          <AlertCircle size={30} className="mx-auto text-rose-500" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Unable to load interview schedule.</p>
          <button
            onClick={onRetry}
            style={{ backgroundColor: brandColor }}
            className="h-8 px-4 text-xs font-bold text-white rounded-lg shadow-xs hover:opacity-90 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              3. MONTH VIEW (COMPACT EQUAL-WIDTH DATE GRID)
          ═══════════════════════════════════════════════════════════════════ */}
          {viewMode === CALENDAR_VIEW_MODES.MONTH && (
            <div className="p-3 sm:p-4 overflow-x-auto scrollbar-thin">
              <div className="min-w-[560px] sm:min-w-full">
                {/* Weekday Header */}
                <div className="grid grid-cols-7 border-b border-slate-200/70 dark:border-slate-800/80 text-center text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 pb-2 mb-1 uppercase tracking-wider">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="py-0.5">{d}</div>
                  ))}
                </div>

                {/* Month 7xN Grid with Subtle Hairline Borders */}
                <div className="grid grid-cols-7 border-t border-l border-slate-200/70 dark:border-slate-800/80 rounded-xl overflow-hidden bg-slate-100/40 dark:bg-slate-800/40 gap-[1px]">
                {(() => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const firstDayIndex = new Date(year, month, 1).getDay();
                  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
                  const totalDays = new Date(year, month + 1, 0).getDate();
                  const todayStr = toLocalDateString(new Date());

                  const cells = [];
                  for (let i = 0; i < startOffset; i++) {
                    cells.push(
                      <div 
                        key={`empty-${i}`} 
                        className="min-h-[105px] min-w-0 p-2 bg-slate-50/30 dark:bg-slate-900/20 text-slate-300" 
                      />
                    );
                  }

                  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
                    const dayDate = new Date(year, month, dayNum);
                    const isoStr = toLocalDateString(dayDate);
                    const isToday = isoStr === todayStr;
                    const daySessions = sessions
                      .filter(s => s.scheduledDate === isoStr && s.status !== 'Cancelled')
                      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

                    const visibleCount = 2;
                    const overflowCount = daySessions.length - visibleCount;

                    cells.push(
                      <div
                        key={isoStr}
                        className={`min-h-[105px] min-w-0 p-2 transition-colors flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 ${
                          isToday ? 'bg-blue-50/20 dark:bg-blue-950/15' : ''
                        }`}
                      >
                        {/* Day Cell Header: Number + Event Count */}
                        <div className="flex items-center justify-between">
                          <div
                            style={isToday ? { backgroundColor: brandColor, color: 'var(--pw-brand-fg, #ffffff)' } : {}}
                            className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isToday 
                                ? 'shadow-2xs font-extrabold ring-2 ring-white dark:ring-slate-900' 
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {dayNum}
                          </div>

                          {daySessions.length > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {daySessions.length}
                            </span>
                          )}
                        </div>

                        {/* Compact Floating Event Pills in Month View */}
                        <div className="space-y-1 mt-1.5 flex-1 min-w-0">
                          {daySessions.slice(0, visibleCount).map(sess => {
                            const theme = getCategoryCardTheme(sess);
                            const hasConflict = conflictIds.has(sess.id);

                            return (
                              <div
                                key={sess.id}
                                onClick={() => onSelectSession(sess)}
                                onMouseEnter={(e) => handleMouseEnterSession(e, sess)}
                                onMouseLeave={handleMouseLeaveSession}
                                className={`px-2 py-1 rounded-md text-[10.5px] font-medium flex items-center gap-1.5 truncate border transition-all cursor-pointer shadow-2xs hover:shadow-xs bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 min-w-0 ${
                                  hasConflict ? 'border-amber-400 bg-amber-50/80 text-amber-900' : ''
                                }`}
                              >
                                <span 
                                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                                  style={{ backgroundColor: theme.dotColor }}
                                />
                                <span className="font-mono text-[9.5px] text-slate-500 dark:text-slate-400 shrink-0">
                                  {sess.startTime}
                                </span>
                                <span className="truncate font-semibold text-slate-800 dark:text-slate-200 min-w-0">
                                  {sess.candidateName}
                                </span>
                              </div>
                            );
                          })}

                          {/* +N More Overflow Pill */}
                          {overflowCount > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOverflowDate({ date: dayDate, sessions: daySessions });
                              }}
                              className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
                            >
                              +{overflowCount} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return cells;
                })()}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              4. WEEK VIEW (MODERN ENTERPRISE TIMELINE CALENDAR)
              - Subtle horizontal timeline guides
              - Clean day headers with restrained active indicator
              - Floating SaaS event objects elevated from timeline
          ═══════════════════════════════════════════════════════════════════ */}
          {viewMode === CALENDAR_VIEW_MODES.WEEK && (
            <div className="overflow-x-auto relative scrollbar-thin">
              <div className="min-w-[960px] select-none">
                
                {/* Clean Week Header */}
                <div className="grid grid-cols-[68px_repeat(7,minmax(0,1fr))] border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 sticky top-0 z-30 backdrop-blur-md">
                  <div className="border-r border-slate-200/70 dark:border-slate-800/80 flex items-center justify-end pr-3 text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 py-2.5">
                    Time
                  </div>
                  {weekDays.map(day => {
                    const daySessionsCount = sessions.filter(s => s.scheduledDate === day.isoStr && s.status !== 'Cancelled').length;

                    return (
                      <div 
                        key={day.isoStr} 
                        className={`border-r border-slate-200/70 dark:border-slate-800/80 last:border-r-0 py-2.5 px-2 text-center transition-colors relative min-w-0 ${
                          day.isToday ? 'bg-slate-100/40 dark:bg-slate-800/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider ${
                            day.isToday ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {day.dayName}
                          </span>
                          {daySessionsCount > 0 && (
                            <span 
                              style={day.isToday ? { backgroundColor: `${brandColor}20`, color: brandColor } : {}}
                              className="w-4 h-4 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center"
                            >
                              {daySessionsCount}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center justify-center">
                          <div 
                            style={day.isToday ? { backgroundColor: brandColor, color: 'var(--pw-brand-fg, #ffffff)' } : {}}
                            className={`text-xs font-bold w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all ${
                              day.isToday 
                                ? 'shadow-xs font-extrabold ring-2 ring-white dark:ring-slate-900' 
                                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            {day.dayNumber}
                          </div>
                        </div>

                        {day.isToday && (
                          <div 
                            style={{ backgroundColor: brandColor }}
                            className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-t-full shadow-2xs" 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Timeline Matrix: Subtle Guide Lines + Floating Event Objects */}
                <div className="relative grid grid-cols-[68px_repeat(7,minmax(0,1fr))] bg-white dark:bg-slate-900">
                  
                  {/* LIVE CURRENT TIME INDICATOR */}
                  {isTimeInWorkingHours && (
                    <div 
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      style={{ top: `${timeIndicatorTop}px` }}
                    >
                      <div className="w-[68px] text-right pr-2">
                        <span 
                          style={{ backgroundColor: brandColor, color: '#fff' }}
                          className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shadow-xs"
                        >
                          {formattedCurrentTime}
                        </span>
                      </div>
                      <div 
                        style={{ backgroundColor: brandColor }}
                        className="flex-1 h-[1.5px] shadow-xs relative opacity-90"
                      >
                        <div 
                          style={{ backgroundColor: brandColor }}
                          className="w-2 h-2 rounded-full absolute -left-1 -top-[3.5px] ring-2 ring-blue-500/20" 
                        />
                      </div>
                    </div>
                  )}

                  {/* Left Fixed Time Axis */}
                  <div className="border-r border-slate-200/70 dark:border-slate-800/80 flex flex-col">
                    {HOURS.slice(0, TOTAL_HOURS).map(hour => {
                      const displayTime = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
                      return (
                        <div 
                          key={hour} 
                          style={{ height: `${ROW_HEIGHT_PX}px` }}
                          className="border-b border-slate-100/80 dark:border-slate-800/40 text-right pr-3 pt-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none flex flex-col justify-start"
                        >
                          <span>{displayTime}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 7 Day Timeline Columns */}
                  {weekDays.map(day => {
                    const daySessions = sessions.filter(s => s.scheduledDate === day.isoStr && s.status !== 'Cancelled');
                    const positionedEvents = calculateDayEventLayouts(daySessions, ROW_HEIGHT_PX, BASE_HOUR, TOTAL_HOURS);

                    return (
                      <div 
                        key={day.isoStr}
                        className={`relative border-r border-slate-100/80 dark:border-slate-800/40 last:border-r-0 min-w-0 ${
                          day.isToday ? 'bg-blue-50/10 dark:bg-blue-950/5' : ''
                        }`}
                      >
                        {/* Subtle Horizontal Timeline Guides */}
                        {HOURS.slice(0, TOTAL_HOURS).map(hour => (
                          <div 
                            key={hour}
                            style={{ height: `${ROW_HEIGHT_PX}px` }}
                            className="border-b border-slate-100/80 dark:border-slate-800/40 relative group"
                          >
                            {/* Subtle on-hover schedule trigger */}
                            <button
                              onClick={() => onScheduleClick()}
                              className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-[var(--pw-brand)] cursor-pointer"
                            >
                              <Plus size={11} />
                              <span>Schedule</span>
                            </button>
                          </div>
                        ))}

                        {/* Elevated Event Cards Layer */}
                        <div className="absolute inset-0 pointer-events-none p-1">
                          {positionedEvents.map(item => {
                            const sess = item.session;
                            const theme = getCategoryCardTheme(sess);
                            const hasConflict = conflictIds.has(sess.id);
                            const conflictMeta = conflictIds.get(sess.id);
                            const isPanel = (sess.interviewers || []).length > 1;

                            return (
                              <div
                                key={sess.id}
                                style={{
                                  top: `${item.top}px`,
                                  height: `${item.height}px`,
                                  left: `${item.leftPct}%`,
                                  width: `${item.widthPct}%`
                                }}
                                className="absolute pointer-events-auto p-0.5 z-10"
                              >
                                <motion.div
                                  whileHover={{ scale: 1.015, y: -1 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => onSelectSession(sess)}
                                  onMouseEnter={(e) => handleMouseEnterSession(e, sess)}
                                  onMouseLeave={handleMouseLeaveSession}
                                  className={`w-full h-full p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden text-left bg-white dark:bg-slate-900 backdrop-blur-xs ${theme.borderAccent} ${theme.cardBg} ${
                                    hasConflict 
                                      ? 'border-amber-400 ring-1 ring-amber-400/50 bg-amber-50/80 dark:bg-amber-950/40' 
                                      : ''
                                  }`}
                                >
                                  {/* Top Row: Category Pill & Badges */}
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between gap-1 min-w-0">
                                      <div className="flex items-center gap-1 text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate min-w-0">
                                        <span 
                                          className="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs" 
                                          style={{ backgroundColor: theme.dotColor }}
                                        />
                                        <span className="truncate">{theme.type}</span>
                                      </div>

                                      {hasConflict ? (
                                        <span 
                                          title={conflictMeta?.message || "Scheduling Conflict"} 
                                          className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-500 text-white flex items-center gap-0.5 shrink-0 shadow-2xs"
                                        >
                                          <AlertTriangle size={8} /> Conflict
                                        </span>
                                      ) : isPanel ? (
                                        <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-500/30 shrink-0">
                                          Panel ({sess.interviewers.length})
                                        </span>
                                      ) : null}
                                    </div>

                                    {/* 1. Candidate Name (Strongest text) */}
                                    <h4 className="text-[11.5px] font-extrabold text-slate-900 dark:text-slate-100 truncate min-w-0 tracking-tight leading-snug">
                                      {(sess.candidateName || '').replace(/\s*\((?:Candidate|Candid\w*)\)/gi, '').trim() || sess.candidateName}
                                    </h4>

                                    {/* 2. Round Name (Secondary) */}
                                    <div className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate min-w-0">
                                      {sess.roundName}
                                    </div>

                                    {/* 3. Interviewer (Muted) */}
                                    <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate min-w-0">
                                      {(sess.interviewers || []).map(i => i.name).join(', ') || 'Unassigned'}
                                    </div>
                                  </div>

                                  {/* 4. Time Range (Clear mono) */}
                                  <div className="pt-1 mt-auto text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 truncate shrink-0 flex items-center gap-1 border-t border-slate-200/40 dark:border-slate-700/40">
                                    <Clock size={9.5} className="shrink-0 opacity-60" />
                                    <span>{sess.startTime} – {sess.endTime}</span>
                                  </div>
                                </motion.div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              5. DAY VIEW (CLEAN TIMELINE ALIGNED WITH TIME AXIS)
          ═══════════════════════════════════════════════════════════════════ */}
          {viewMode === CALENDAR_VIEW_MODES.DAY && (
            <div className="flex flex-col">
              {/* Day Header */}
              <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {sessions.filter(s => s.scheduledDate === toLocalDateString(currentDate) && s.status !== 'Cancelled').length} Scheduled Sessions
                  </p>
                </div>

                <button
                  onClick={onScheduleClick}
                  style={{ backgroundColor: brandColor }}
                  className="h-8 px-3.5 text-xs font-bold text-white rounded-lg shadow-xs hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>+ Schedule Interview</span>
                </button>
              </div>

              {/* Day View Grid Layout: TIME (68px) | SINGLE DAY TIMELINE */}
              <div className="relative grid grid-cols-[68px_minmax(0,1fr)] bg-white dark:bg-slate-900 min-h-[960px]">
                
                {/* LIVE CURRENT TIME INDICATOR */}
                {isTimeInWorkingHours && toLocalDateString(currentDate) === toLocalDateString(new Date()) && (
                  <div 
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{ top: `${timeIndicatorTop}px` }}
                  >
                    <div className="w-[68px] text-right pr-2">
                      <span 
                        style={{ backgroundColor: brandColor, color: '#fff' }}
                        className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shadow-xs"
                      >
                        {formattedCurrentTime}
                      </span>
                    </div>
                    <div 
                      style={{ backgroundColor: brandColor }}
                      className="flex-1 h-[1.5px] shadow-xs relative opacity-90"
                    >
                      <div 
                        style={{ backgroundColor: brandColor }}
                        className="w-2 h-2 rounded-full absolute -left-1 -top-[3.5px] ring-2 ring-blue-500/20" 
                      />
                    </div>
                  </div>
                )}

                {/* Left Fixed Time Column */}
                <div className="border-r border-slate-200/70 dark:border-slate-800/80 flex flex-col">
                  {HOURS.slice(0, TOTAL_HOURS).map(hour => {
                    const displayTime = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
                    return (
                      <div 
                        key={hour} 
                        style={{ height: `${ROW_HEIGHT_PX}px` }}
                        className="border-b border-slate-100/80 dark:border-slate-800/40 text-right pr-3 pt-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none flex flex-col justify-start"
                      >
                        <span>{displayTime}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Single Day Area */}
                <div className="relative min-w-0">
                  {/* Subtle Horizontal Timeline Guides */}
                  {HOURS.slice(0, TOTAL_HOURS).map(hour => (
                    <div 
                      key={hour}
                      style={{ height: `${ROW_HEIGHT_PX}px` }}
                      className="border-b border-slate-100/80 dark:border-slate-800/40 relative group"
                    >
                      <button
                        onClick={() => onScheduleClick()}
                        className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[var(--pw-brand)] cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Schedule at {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`}</span>
                      </button>
                    </div>
                  ))}

                  {/* Foreground Floating Event Layer */}
                  <div className="absolute inset-0 pointer-events-none p-2">
                    {(() => {
                      const dayIso = toLocalDateString(currentDate);
                      const daySessions = sessions.filter(s => s.scheduledDate === dayIso && s.status !== 'Cancelled');
                      const positionedEvents = calculateDayEventLayouts(daySessions, ROW_HEIGHT_PX, BASE_HOUR, TOTAL_HOURS);

                      return positionedEvents.map(item => {
                        const sess = item.session;
                        const theme = getCategoryCardTheme(sess);
                        const hasConflict = conflictIds.has(sess.id);
                        const conflictMeta = conflictIds.get(sess.id);
                        const isPanel = (sess.interviewers || []).length > 1;

                        return (
                          <div
                            key={sess.id}
                            style={{
                              top: `${item.top}px`,
                              height: `${item.height}px`,
                              left: `${item.leftPct}%`,
                              width: `${item.widthPct}%`
                            }}
                            className="absolute pointer-events-auto p-1 z-10"
                          >
                            <motion.div
                              whileHover={{ scale: 1.005 }}
                              onClick={() => onSelectSession(sess)}
                              className={`w-full h-full p-3 sm:p-4 rounded-xl border shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden text-left bg-white dark:bg-slate-800/95 ${theme.borderAccent} ${theme.cardBg} ${
                                hasConflict 
                                  ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/30' 
                                  : ''
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    <span 
                                      className="w-2 h-2 rounded-full shrink-0" 
                                      style={{ backgroundColor: theme.dotColor }}
                                    />
                                    <span>{theme.type} • Round {sess.roundSequence || 1}</span>
                                  </div>
                                  <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
                                    <Clock size={11} /> {sess.startTime} – {sess.endTime} ({sess.duration}m)
                                  </span>
                                  {isPanel && (
                                    <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-500/20">
                                      Panel ({sess.interviewers.length})
                                    </span>
                                  )}
                                  {hasConflict && (
                                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white flex items-center gap-1">
                                      <AlertTriangle size={11} /> {conflictMeta?.title || 'Conflict'}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate min-w-0">
                                  {sess.roundName}
                                </h4>

                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap min-w-0">
                                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 min-w-0">
                                    <span 
                                      style={{ backgroundColor: sess.candidateAvatarBg || '#0284c7' }}
                                      className="w-4.5 h-4.5 rounded-full text-[8.5px] font-bold text-white flex items-center justify-center shrink-0 shadow-2xs"
                                    >
                                      {sess.candidateAvatar || 'CD'}
                                    </span>
                                    <span className="truncate min-w-0">{sess.candidateName}</span>
                                  </span>
                                  {sess.requisitionTitle && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-500 truncate min-w-0">{sess.requisitionTitle}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span className="text-slate-400 truncate min-w-0">
                                    Interviewers: {(sess.interviewers || []).map(i => i.name).join(', ') || 'Unassigned'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 shrink-0">
                                <span className="text-xs font-medium text-slate-500">
                                  Status: <strong className="text-slate-700 dark:text-slate-300">{sess.status}</strong>
                                </span>
                                <div className="flex items-center gap-2">
                                  {sess.meetingUrl && (
                                    <a
                                      href={sess.meetingUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      style={{ backgroundColor: brandColor, color: 'var(--pw-brand-fg, #ffffff)' }}
                                      className="h-7 px-3 text-xs font-semibold rounded-md shadow-2xs hover:brightness-110 flex items-center gap-1"
                                    >
                                      <Video size={11} />
                                      <span>Join</span>
                                    </a>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectSession(sess);
                                    }}
                                    className="h-7 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                                  >
                                    Details
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              6. AGENDA VIEW (CLEAN CHRONOLOGICAL TIMELINE)
          ═══════════════════════════════════════════════════════════════════ */}
          {viewMode === CALENDAR_VIEW_MODES.AGENDA && (
            <div className="p-4 sm:p-5 space-y-5">
              {(() => {
                const sortedSessions = [...sessions]
                  .filter(s => s.status !== 'Cancelled')
                  .sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || '') || (a.startTime || '').localeCompare(b.startTime || ''));

                if (sortedSessions.length === 0) {
                  return (
                    <div className="p-10 text-center text-slate-400 space-y-2.5 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <CalendarIcon size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No upcoming interviews found.</p>
                      <button
                        onClick={onScheduleClick}
                        style={{ backgroundColor: brandColor }}
                        className="h-7.5 px-3 text-xs font-bold text-white rounded-lg shadow-2xs hover:brightness-110 cursor-pointer"
                      >
                        + Schedule Interview
                      </button>
                    </div>
                  );
                }

                // Group by date key
                const groups = {};
                const todayStr = toLocalDateString(new Date());
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = toLocalDateString(tomorrow);

                sortedSessions.forEach(sess => {
                  const d = sess.scheduledDate;
                  if (!groups[d]) groups[d] = [];
                  groups[d].push(sess);
                });

                return Object.entries(groups).map(([dateKey, groupSessions]) => {
                  let headerTitle = '';
                  if (dateKey === todayStr) {
                    headerTitle = 'TODAY';
                  } else if (dateKey === tomorrowStr) {
                    headerTitle = 'TOMORROW';
                  } else {
                    const dObj = new Date(dateKey + 'T00:00:00');
                    headerTitle = dObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
                  }

                  return (
                    <div key={dateKey} className="space-y-2.5">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                          {headerTitle}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {groupSessions.length} sessions
                        </span>
                      </div>

                      <div className="space-y-2">
                        {groupSessions.map(sess => {
                          const theme = getCategoryCardTheme(sess);

                          return (
                            <div
                              key={sess.id}
                              onClick={() => onSelectSession(sess)}
                              className={`p-3 rounded-xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-800/95 border-slate-200/80 dark:border-slate-700 ${theme.borderAccent}`}
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                    {sess.startTime}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                                    {sess.candidateName}
                                  </span>
                                  <span className="flex items-center gap-1 text-[9.5px] font-semibold text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.dotColor }} />
                                    {sess.roundCategory}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                                  <span>{sess.roundName}</span>
                                  <span>•</span>
                                  <span>Interviewer: {(sess.interviewers || []).map(i => i.name).join(', ') || 'Unassigned'}</span>
                                  <span>•</span>
                                  <span className="font-medium text-slate-600 dark:text-slate-300">{sess.status}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {sess.meetingUrl && (
                                  <a
                                    href={sess.meetingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    style={{ backgroundColor: brandColor, color: 'var(--pw-brand-fg, #ffffff)' }}
                                    className="h-7 px-2.5 text-xs font-bold rounded-md shadow-2xs hover:brightness-110 flex items-center gap-1"
                                  >
                                    <Video size={11} />
                                    <span>Join</span>
                                  </a>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectSession(sess);
                                  }}
                                  className="h-7 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          7. HOVER TOOLTIP PREVIEW
      ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {hoveredSession && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'fixed',
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: 'translate(-50%, -100%)'
            }}
            className="z-[9999] pointer-events-none w-64 p-3 bg-slate-900/95 text-white rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md space-y-1.5 text-start"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold truncate text-white">
                {hoveredSession.candidateName}
              </span>
              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {hoveredSession.status}
              </span>
            </div>
            <div className="text-[10.5px] text-slate-300 space-y-1">
              <div><span className="text-slate-500">Round:</span> {hoveredSession.roundName}</div>
              <div><span className="text-slate-500">Time:</span> {hoveredSession.startTime} – {hoveredSession.endTime} ({hoveredSession.duration}m)</div>
              <div>
                <span className="text-slate-500">Interviewer:</span> {(hoveredSession.interviewers || []).map(i => i.name).join(', ') || 'Unassigned'}
              </div>
              {conflictIds.has(hoveredSession.id) && (
                <div className="pt-1 mt-1 border-t border-amber-500/30 text-amber-300 font-semibold flex items-start gap-1">
                  <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{conflictIds.get(hoveredSession.id)?.message}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          8. "+N MORE" OVERFLOW MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {overflowDate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {overflowDate.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-xs text-slate-500">
                  {overflowDate.sessions.length} Scheduled Interviews
                </p>
              </div>
              <button
                onClick={() => setOverflowDate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {overflowDate.sessions.map(sess => {
                const theme = getCategoryCardTheme(sess);

                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      setOverflowDate(null);
                      onSelectSession(sess);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer hover:shadow-xs transition-all flex items-center justify-between gap-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${theme.borderAccent}`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {sess.candidateName}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.dotColor }} />
                          {sess.roundCategory}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {sess.roundName} • {sess.startTime} - {sess.endTime}
                      </div>
                    </div>

                    <button
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InterviewCalendarView;
