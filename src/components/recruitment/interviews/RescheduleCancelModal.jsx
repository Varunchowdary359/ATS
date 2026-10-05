import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, Calendar, Clock, AlertTriangle, 
  RotateCcw, Ban, UserX, AlertCircle 
} from 'lucide-react';
import { NO_SHOW_PARTY } from './interviewTypes';
import { interviewService } from './interviewService';
import CustomSelect from '../../dashboard/shared/CustomSelect';

const MODAL_MODES = {
  RESCHEDULE: 'reschedule',
  CANCEL: 'cancel',
  NO_SHOW: 'no_show'
};

const DURATIONS = [30, 45, 60, 90, 120];

const RescheduleCancelModal = ({
  isOpen,
  mode = MODAL_MODES.RESCHEDULE, // reschedule | cancel | no_show
  session,
  onClose,
  onUpdated,
  brandColor = 'var(--pw-brand)'
}) => {
  const [reason, setReason] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    return session?.scheduledDate || new Date().toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState(session?.startTime || '14:00');
  const [duration, setDuration] = useState(session?.duration || 60);
  const [noShowParty, setNoShowParty] = useState(NO_SHOW_PARTY.CANDIDATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const endTime = useMemo(() => {
    if (!startTime) return '15:00';
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + Number(duration);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  }, [startTime, duration]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!reason.trim()) {
      setErrorMessage('Please provide a mandatory reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === MODAL_MODES.RESCHEDULE) {
        // Conflict check
        const conflict = await interviewService.checkAvailabilityAndConflicts({
          interviewerIds: (session.interviewers || []).map(i => i.id),
          date: scheduledDate,
          startTime,
          endTime,
          timezone: session.timezone,
          excludeSessionId: session.id
        });

        if (conflict.hasConflict) {
          throw new Error(conflict.conflicts[0]?.message || 'Scheduling conflict detected for new slot.');
        }

        const updated = await interviewService.rescheduleInterviewSession(
          session.id,
          { scheduledDate, startTime, endTime },
          reason.trim()
        );
        onUpdated(updated);
      } else if (mode === MODAL_MODES.CANCEL) {
        await interviewService.cancelInterviewSession(session.id, reason.trim());
        onUpdated({ ...session, status: 'Cancelled' });
      } else if (mode === MODAL_MODES.NO_SHOW) {
        await interviewService.recordNoShow(session.id, noShowParty, reason.trim());
        onUpdated({ ...session, status: 'No Show', noShowParty });
      }

      onClose();
    } catch (err) {
      console.error('Failed to update session', err);
      setErrorMessage(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (mode === MODAL_MODES.RESCHEDULE) return 'Reschedule Interview Session';
    if (mode === MODAL_MODES.CANCEL) return 'Cancel Interview Session';
    return 'Record No Show';
  };

  const getIcon = () => {
    if (mode === MODAL_MODES.RESCHEDULE) return RotateCcw;
    if (mode === MODAL_MODES.CANCEL) return Ban;
    return UserX;
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const Icon = getIcon();

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto" dir="ltr">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-8 text-slate-900 dark:text-slate-100 text-start max-h-[92vh] sm:max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs font-extrabold shrink-0"
              style={{ backgroundColor: mode === MODAL_MODES.CANCEL ? '#ef4444' : brandColor }}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                {getTitle()}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session.roundName} • {session.candidateName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Slot */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="text-slate-400 font-bold uppercase text-[10px]">Current Session Slot</div>
            <div className="font-bold text-slate-900 dark:text-white">
              {session.scheduledDate} at {session.startTime} - {session.endTime} ({session.timezone})
            </div>
          </div>

          {/* Reschedule Slot Controls */}
          {mode === MODAL_MODES.RESCHEDULE && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Date <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Start Time <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Duration
                </label>
                <CustomSelect
                  value={duration}
                  onChange={val => setDuration(Number(val))}
                  options={DURATIONS.map(d => ({
                    value: d,
                    label: `${d} Mins (${endTime})`
                  }))}
                  size="md"
                />
              </div>
            </div>
          )}

          {/* No Show Party Controls */}
          {mode === MODAL_MODES.NO_SHOW && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Absent / No Show Party <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <CustomSelect
                value={noShowParty}
                onChange={val => setNoShowParty(val)}
                options={[
                  { value: NO_SHOW_PARTY.CANDIDATE, label: 'Candidate Did Not Attend' },
                  { value: NO_SHOW_PARTY.INTERVIEWER, label: 'Interviewer Did Not Attend' },
                  { value: NO_SHOW_PARTY.BOTH, label: 'Both Parties Absent' }
                ]}
                size="md"
              />
            </div>
          )}

          {/* Reason text */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Reason / Justification Notes <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Mandatory reason logged into the permanent audit trail..."
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
              required
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: mode === MODAL_MODES.CANCEL ? '#ef4444' : brandColor }}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Action'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

export default RescheduleCancelModal;
