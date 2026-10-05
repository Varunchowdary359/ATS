import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserCheck, CheckCircle2, Clock, AlertTriangle, FileText, 
  ShieldCheck, Sparkles, Building2, MapPin, Calendar, ArrowRight, Eye
} from 'lucide-react';
import { PREBOARDING_STATUS } from './preboardingTypes';
import { evaluateJoiningReadiness } from './preboardingValidation';

export const PreboardingKanbanBoard = ({
  records = [],
  onOpenRecord = () => {},
  brandColor = 'var(--pw-brand)'
}) => {
  const columns = [
    {
      id: 'initiated',
      title: 'Docs Collection',
      badge: 'Step 1',
      filter: (r) => r.status === PREBOARDING_STATUS.INITIATED || (r.documents?.some(d => d.status === 'PENDING_UPLOAD' || d.status === 'SUBMITTED') && r.status !== PREBOARDING_STATUS.READY_TO_JOIN && r.status !== PREBOARDING_STATUS.EMPLOYEE_CREATED),
      color: 'border-blue-500'
    },
    {
      id: 'bgv_active',
      title: 'BGV Verification',
      badge: 'Step 2',
      filter: (r) => r.bgvStatus === 'IN_PROGRESS' || r.bgvStatus === 'DISCREPANCY',
      color: 'border-indigo-500'
    },
    {
      id: 'provisioning',
      title: 'IT & Tasks Setup',
      badge: 'Step 3',
      filter: (r) => r.status === PREBOARDING_STATUS.IN_PROGRESS && r.tasks?.some(t => t.status === 'PENDING'),
      color: 'border-amber-500'
    },
    {
      id: 'ready',
      title: 'Ready to Join',
      badge: 'Step 4',
      filter: (r) => r.status === PREBOARDING_STATUS.READY_TO_JOIN || r.status === PREBOARDING_STATUS.HANDOFF_PENDING,
      color: 'border-emerald-500'
    },
    {
      id: 'converted',
      title: 'HRMS Converted',
      badge: 'Step 5',
      filter: (r) => r.status === PREBOARDING_STATUS.EMPLOYEE_CREATED,
      color: 'border-purple-500'
    }
  ];

  return (
    <div className="p-4 overflow-x-auto">
      <div className="flex gap-4 min-w-[1200px] pb-4">
        {columns.map(col => {
          const colRecords = records.filter(col.filter);
          return (
            <div
              key={col.id}
              className="flex-1 min-w-[260px] bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 flex flex-col max-h-[750px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{col.badge}</span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{col.title}</h4>
                </div>
                <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-2xs">
                  {colRecords.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                {colRecords.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    No candidates in this stage
                  </div>
                ) : (
                  colRecords.map(record => {
                    const readiness = evaluateJoiningReadiness(record);
                    const verifiedDocs = (record.documents || []).filter(d => d.status === 'VERIFIED').length;
                    const totalDocs = (record.documents || []).length;

                    return (
                      <motion.div
                        key={record.id}
                        whileHover={{ y: -2 }}
                        onClick={() => onOpenRecord(record)}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer space-y-2.5"
                      >
                        {/* Candidate Name & Initials */}
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: brandColor }}
                          >
                            {record.candidateName ? record.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'CD'}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {record.candidateName}
                            </h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {record.jobTitle}
                            </p>
                          </div>
                        </div>

                        {/* Joining & Dept */}
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 font-medium">
                          <div className="flex items-center justify-between">
                            <span>Joining:</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{record.joiningDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Documents:</span>
                            <span className="font-bold text-blue-600">{verifiedDocs}/{totalDocs} Verified</span>
                          </div>
                        </div>

                        {/* Readiness Meter */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                            <span className="text-slate-500">Readiness</span>
                            <span style={{ color: readiness.color }}>{readiness.readinessScore}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-300 rounded-full"
                              style={{ width: `${readiness.readinessScore}%`, backgroundColor: readiness.color }}
                            />
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400">{record.id}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenRecord(record);
                            }}
                            className="text-[11px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                            style={{ color: brandColor }}
                          >
                            <span>Open</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreboardingKanbanBoard;
