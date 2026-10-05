/**
 * Task Creation Modal
 * PeopleWorks ATS SaaS
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckSquare, AlertCircle } from 'lucide-react';
import { TASK_ASSIGNEE_ROLE, TASK_PRIORITY } from '../preboardingTypes';

export const TaskCreateModal = ({
  isOpen = false,
  onClose = () => {},
  onCreate = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeRole, setAssigneeRole] = useState(TASK_ASSIGNEE_ROLE.IT_ADMIN);
  const [assigneeName, setAssigneeName] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState(TASK_PRIORITY.MEDIUM);
  const [required, setRequired] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async () => {
    if (!taskName.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }

    try {
      await onCreate({
        name: taskName.trim(),
        description: description.trim(),
        assigneeRole,
        assigneeName: assigneeName.trim() || `${assigneeRole} Team`,
        dueDate,
        priority,
        required
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <CheckSquare size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Preboarding Task
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Assign operational checklist action</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-3.5">
          {/* Task Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Task Title <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => { setTaskName(e.target.value); setError(null); }}
              placeholder="e.g. Provision AWS Access & Corporate Email"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Description / Action Instructions
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Provide exact prerequisites or checklist details..."
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Assignee Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Assignee Department <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={assigneeRole}
                onChange={(e) => setAssigneeRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              >
                {Object.values(TASK_ASSIGNEE_ROLE).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Assignee Person / Team
              </label>
              <input
                type="text"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                placeholder="e.g. Alex Thorne"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Due Date & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Due Date <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              >
                {Object.values(TASK_PRIORITY).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mandatory Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="req-task-chk"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="rounded border-slate-300 text-brand focus:ring-brand"
            />
            <label htmlFor="req-task-chk" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mandatory task (Required for Joining Readiness clearance)
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-transform active:scale-95"
            style={{ backgroundColor: brandColor }}
          >
            Create Task
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default TaskCreateModal;
