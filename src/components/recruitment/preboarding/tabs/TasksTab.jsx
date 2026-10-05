/**
 * Preboarding Workspace - Cross-Departmental Tasks Tab
 * PeopleWorks ATS SaaS - Enterprise Task Checklist & SLA Tracking
 */

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  User, 
  Calendar, 
  MessageSquare, 
  AlertTriangle,
  Laptop,
  Briefcase,
  ShieldAlert,
  Building2,
  Check
} from 'lucide-react';
import { TASK_STATUS, TASK_PRIORITY } from '../preboardingTypes';
import TaskCreateModal from '../modals/TaskCreateModal';
import TaskCompleteModal from '../modals/TaskCompleteModal';

export const TasksTab = ({
  record = {},
  onManageTask = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskForComplete, setSelectedTaskForComplete] = useState(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  const tasks = record.tasks || [];
  const roles = Array.from(new Set(tasks.map(t => t.assigneeRole).filter(Boolean)));

  const filteredTasks = selectedRoleFilter === 'ALL'
    ? tasks
    : tasks.filter(t => t.assigneeRole === selectedRoleFilter);

  const completedCount = tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
  const pendingCount = tasks.filter(t => t.status !== TASK_STATUS.COMPLETED).length;
  const overdueCount = tasks.filter(t => {
    const isPastDue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TASK_STATUS.COMPLETED;
    return isPastDue || t.status === TASK_STATUS.OVERDUE;
  }).length;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case TASK_PRIORITY.CRITICAL:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">Critical</span>;
      case TASK_PRIORITY.HIGH:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">High</span>;
      case TASK_PRIORITY.LOW:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Low</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">Medium</span>;
    }
  };

  const getStatusBadge = (status, dueDate) => {
    const isPastDue = dueDate && new Date(dueDate) < new Date() && status !== TASK_STATUS.COMPLETED;
    if (isPastDue || status === TASK_STATUS.OVERDUE) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 shadow-2xs">
          <AlertCircle size={12} className="shrink-0" /> Overdue
        </span>
      );
    }

    switch (status) {
      case TASK_STATUS.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <CheckCircle2 size={12} className="shrink-0" /> Completed
          </span>
        );
      case TASK_STATUS.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
            <Clock size={12} className="shrink-0 animate-pulse" /> In Progress
          </span>
        );
      case TASK_STATUS.SKIPPED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
            Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Pending
          </span>
        );
    }
  };

  const handleCreateSubmit = async (taskData) => {
    await onManageTask(record.id, null, 'CREATE', taskData);
    setShowCreateModal(false);
  };

  const handleCompleteSubmit = async (taskId, comments) => {
    await onManageTask(record.id, taskId, 'COMPLETE', { comments });
    setSelectedTaskForComplete(null);
  };

  const handleSkipTask = async (task) => {
    if (task.required) {
      if (!window.confirm('This is a MANDATORY task required for joining readiness. Skipping will require administrative clearance. Proceed?')) {
        return;
      }
    }
    await onManageTask(record.id, task.id, 'SKIP', { overridePermission: true, reason: 'Skipped with administrative confirmation' });
  };

  return (
    <div className="space-y-5">
      
      {/* Header & Role Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
            style={{ backgroundColor: brandColor }}
          >
            <CheckSquare size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Cross-Departmental Preboarding Tasks</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Coordinated workflow across IT Provisioning, Hiring Manager, HRBP, Recruiter & Candidate
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 transition-transform active:scale-95 cursor-pointer self-start md:self-auto"
          style={{ backgroundColor: brandColor }}
        >
          <Plus size={14} />
          <span>Add Task</span>
        </button>
      </div>

      {/* KPI Summary & Role Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        
        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedRoleFilter === 'ALL'
                ? 'text-white shadow-xs font-extrabold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={{ backgroundColor: selectedRoleFilter === 'ALL' ? brandColor : undefined }}
          >
            All Roles ({tasks.length})
          </button>
          {roles.map(r => {
            const count = tasks.filter(t => t.assigneeRole === r).length;
            return (
              <button
                key={r}
                onClick={() => setSelectedRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedRoleFilter === r
                    ? 'text-white shadow-xs font-extrabold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                style={{ backgroundColor: selectedRoleFilter === r ? brandColor : undefined }}
              >
                {r} ({count})
              </button>
            );
          })}
        </div>

        {/* Task Counts Summary */}
        <div className="flex items-center gap-3 text-xs shrink-0 self-start sm:self-auto">
          <span className="text-slate-500 dark:text-slate-400">
            Completed: <strong className="text-emerald-600 dark:text-emerald-400">{completedCount}</strong> / {tasks.length}
          </span>
          {overdueCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900/40 text-[11px]">
              {overdueCount} Overdue
            </span>
          )}
        </div>
      </div>

      {/* Task Checklist Items */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === TASK_STATUS.COMPLETED;
            return (
              <div
                key={task.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-850/60 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  
                  {/* Interactive Checkbox */}
                  <button 
                    onClick={() => {
                      if (!isCompleted) {
                        setSelectedTaskForComplete(task);
                      }
                    }}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all mt-0.5 shrink-0 ${
                      isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-2xs'
                        : 'border-slate-300 dark:border-slate-600 hover:border-brand bg-white dark:bg-slate-800'
                    }`}
                    title={isCompleted ? 'Task Completed' : 'Click to complete task'}
                  >
                    {isCompleted && <Check size={14} className="stroke-[3]" />}
                  </button>

                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${
                        isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'
                      }`}>
                        {task.name}
                      </span>
                      {task.required && <span className="text-rose-500 font-bold -ml-1 text-sm leading-none">*</span>}
                      {getPriorityBadge(task.priority)}
                      {task.required && (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/40">
                          Mandatory
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {task.comments && (
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2">
                        <MessageSquare size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="font-medium">{task.comments}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                        <User size={11} />
                        <span>{task.assigneeRole}</span>
                        {task.assigneeName && <span className="text-slate-400 font-normal">({task.assigneeName})</span>}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Calendar size={11} /> Due: {task.dueDate || 'Day 1'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  {getStatusBadge(task.status, task.dueDate)}

                  {!isCompleted && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTaskForComplete(task)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl text-white shadow-xs hover:brightness-110 transition-transform active:scale-95 cursor-pointer"
                        style={{ backgroundColor: brandColor }}
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleSkipTask(task)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <TaskCreateModal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSubmit}
          brandColor={brandColor}
        />
      )}

      {selectedTaskForComplete && (
        <TaskCompleteModal
          isOpen={true}
          task={selectedTaskForComplete}
          onClose={() => setSelectedTaskForComplete(null)}
          onComplete={handleCompleteSubmit}
          brandColor={brandColor}
        />
      )}

    </div>
  );
};

export default TasksTab;
