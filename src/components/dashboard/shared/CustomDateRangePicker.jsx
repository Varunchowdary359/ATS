import React, { useState, useMemo } from 'react';
import { DATA_THROUGH } from '../../../FilterContext';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Date math helpers
const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getDate() === d2.getDate();
};

const isBefore = (d1, d2) => {
  if (!d1 || !d2) return false;
  return d1.getTime() < d2.getTime();
};

const isAfter = (d1, d2) => {
  if (!d1 || !d2) return false;
  return d1.getTime() > d2.getTime();
};

const isBetween = (d, start, end) => {
  if (!d || !start || !end) return false;
  return d.getTime() > start.getTime() && d.getTime() < end.getTime();
};

const parseDateString = (dateString) => {
  if (!dateString) return null;
  const [y, m, d] = dateString.split('-');
  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
};

const formatDateString = (dateObj) => {
  if (!dateObj) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateVerbose = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysForMonth = (year, month) => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const days = [];
  
  // Padding: Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false
    });
  }
  
  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  // Padding: Next month days (fill out the 42 cell grid)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }
  return days;
};

const CustomDateRangePicker = ({ startDate, endDate, onChange, onCancel, themeColor }) => {
  const parsedStart = parseDateString(startDate);
  const parsedEnd = parseDateString(endDate);
  
  const maxDate = new Date(DATA_THROUGH.year, DATA_THROUGH.month + 1, 0); 
  
  const [viewDate, setViewDate] = useState(() => {
    let anchor = parsedEnd || new Date(DATA_THROUGH.year, DATA_THROUGH.month, 1);
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  const [selectionMode, setSelectionMode] = useState('idle'); // 'idle' | 'selecting'
  const [tempStart, setTempStart] = useState(parsedStart);
  const [tempEnd, setTempEnd] = useState(parsedEnd);
  const [hoverDate, setHoverDate] = useState(null);

  const monthDays = useMemo(() => getDaysForMonth(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);

  const handlePrevMonth = (e) => {
    e.preventDefault();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDayClick = (dayObj) => {
    if (isAfter(dayObj.date, maxDate)) return;

    // Smart navigation: if clicking adjacent month day, jump to it
    if (!dayObj.isCurrentMonth) {
      setViewDate(new Date(dayObj.date.getFullYear(), dayObj.date.getMonth(), 1));
    }

    if (selectionMode === 'idle' || selectionMode === 'done') {
      // Start selecting a new range
      setTempStart(dayObj.date);
      setTempEnd(null);
      setSelectionMode('selecting');
      setHoverDate(null);
    } else if (selectionMode === 'selecting') {
      // Finish selection
      const start = tempStart;
      const end = dayObj.date;
      const finalStart = isBefore(start, end) ? start : end;
      const finalEnd = isBefore(start, end) ? end : start;
      
      setTempStart(finalStart);
      setTempEnd(finalEnd);
      setSelectionMode('done');
      setHoverDate(null);
    }
  };

  const handleDayHover = (dayObj) => {
    if (selectionMode === 'selecting' && !isAfter(dayObj.date, maxDate)) {
      setHoverDate(dayObj.date);
    }
  };

  const getDayStyles = (dayObj) => {
    const d = dayObj.date;
    const isFuture = isAfter(d, maxDate);
    const color = themeColor || '#6366f1';
    
    if (isFuture) {
      return { className: 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40 rounded-lg', style: {} };
    }

    let isSelectedStart = isSameDay(d, tempStart);
    let isSelectedEnd = isSameDay(d, tempEnd);
    let isInRange = isBetween(d, tempStart, tempEnd);
    let isHoverRange = false;

    if (selectionMode === 'selecting' && hoverDate) {
      const min = isBefore(tempStart, hoverDate) ? tempStart : hoverDate;
      const max = isBefore(tempStart, hoverDate) ? hoverDate : tempStart;
      isHoverRange = isBetween(d, min, max);
      if (isSameDay(d, hoverDate) && !isSameDay(d, tempStart)) {
        isSelectedEnd = true; 
      }
      if (isSameDay(d, hoverDate) && isSameDay(d, tempStart)) {
        isSelectedStart = true;
        isSelectedEnd = true;
      }
    }

    const isToday = isSameDay(d, new Date());

    let textClass = dayObj.isCurrentMonth 
      ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700' 
      : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800';
    
    if (isToday) {
      textClass += ' border border-slate-300 dark:border-slate-500'; // subtle outline for today
    }
    
    let bgStyle = {};
    let borderClass = '';
    
    if (isSelectedStart || isSelectedEnd) {
      textClass = 'text-white font-extrabold shadow-lg relative z-10 scale-105 transition-transform';
      bgStyle = { 
        backgroundImage: `linear-gradient(135deg, ${color}, ${color}cc)`,
        backgroundColor: color
      };
    } else if (isInRange) {
      textClass = 'text-slate-800 dark:text-slate-100 font-bold relative z-0';
      bgStyle = { backgroundColor: color + '22' }; 
      borderClass = 'rounded-none';
    } else if (isHoverRange) {
      textClass = 'text-slate-800 dark:text-slate-100 font-semibold relative z-0';
      bgStyle = { backgroundColor: color + '14' }; 
      borderClass = 'rounded-none';
    }

    // Connect endpoints visually
    if (isSelectedStart && !isSelectedEnd && (isInRange || isHoverRange)) {
      borderClass = isBefore(d, tempEnd || hoverDate) ? 'rounded-l-xl rounded-r-none' : 'rounded-r-xl rounded-l-none';
    } else if (isSelectedEnd && !isSelectedStart && (isInRange || isHoverRange)) {
      borderClass = isAfter(d, tempStart) ? 'rounded-r-xl rounded-l-none' : 'rounded-l-xl rounded-r-none';
    } else if (isSelectedStart && isSelectedEnd) {
      borderClass = 'rounded-xl';
    } else if (!borderClass) {
      borderClass = isToday ? 'rounded-xl' : 'rounded-lg';
    }

    return { className: `${textClass} ${borderClass}`, style: bgStyle };
  };

  const renderMonth = (monthDate, days) => (
    <div className="w-full">
      <div className="text-center text-[11px] font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
        {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
      </div>
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((dayObj, i) => {
          const { className, style } = getDayStyles(dayObj);
          return (
            <button
              key={i}
              onClick={() => handleDayClick(dayObj)}
              onMouseEnter={() => handleDayHover(dayObj)}
              className={`h-6 w-full flex items-center justify-center text-[10px] transition-all cursor-pointer focus:outline-none hover:scale-[1.05] active:scale-[0.95] ${className}`}
              style={style}
              disabled={isAfter(dayObj.date, maxDate)}
            >
              {dayObj.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  const isNextFuture = viewDate.getFullYear() > maxDate.getFullYear() || 
    (viewDate.getFullYear() === maxDate.getFullYear() && viewDate.getMonth() >= maxDate.getMonth());

  let summaryText = 'Select a range';
  if (selectionMode === 'selecting') {
    summaryText = 'Select an end date';
  } else if (tempStart && tempEnd) {
    if (isSameDay(tempStart, tempEnd)) {
      summaryText = `Showing: ${formatDateVerbose(tempStart)}`;
    } else {
      summaryText = `Showing: ${formatDateVerbose(tempStart)} – ${formatDateVerbose(tempEnd)}`;
    }
  }

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange(formatDateString(tempStart), formatDateString(tempEnd));
    }
  };

  return (
    <div className="p-2.5 bg-white dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800" onMouseLeave={() => setHoverDate(null)}>
      {/* Month Navigation Row */}
      <div className="flex justify-between items-center mb-0.5 absolute w-[calc(100%-20px)] pointer-events-none mt-0.5">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all focus:outline-none hover:scale-110 active:scale-95 pointer-events-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button
          onClick={handleNextMonth}
          disabled={isNextFuture}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-25 transition-all focus:outline-none hover:scale-110 active:scale-95 pointer-events-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Single Month Grid */}
      <div className="pt-0.5">
        {renderMonth(viewDate, monthDays)}
      </div>
      
      {/* Footer: Draft Summary & Actions */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="text-[10px] font-semibold text-slate-500">
          {summaryText}
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={onCancel}
            className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-none shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleApply}
            disabled={!tempStart || !tempEnd}
            className="px-2.5 py-1 text-[11px] font-bold text-white rounded-lg disabled:opacity-50 transition-all focus:outline-none shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
            style={{ backgroundColor: themeColor || '#6366f1' }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDateRangePicker;
