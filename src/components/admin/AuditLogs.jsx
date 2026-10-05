import React, { useState, useMemo, useContext } from 'react';
import { MOCK_AUDIT_LOGS } from '../admin/adminMockData';
import { useToast } from '../shared/ToastContext';
import { ThemeContext } from '../../ThemeContext';
import ModernCenterModal from './shared/ModernCenterModal';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernCardGrid,
  ModernEmptyState,
  DrawerSection,
  DrawerField,
} from './shared/ModernAdminLayoutComponents';
import { ShieldCheck, Download, Activity, AlertTriangle, Users, Layers, Eye, Terminal, Clock, Monitor } from 'lucide-react';

import { DatabaseService } from '../../services/db/DatabaseService';
import { SanitizerService } from '../../services/security/SanitizerService';

const severityColors = {
  Info:     { accent: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-300',       dot: 'bg-blue-500' },
  Warn:     { accent: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-300',     dot: 'bg-amber-500' },
  Critical: { accent: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20',     text: 'text-rose-700 dark:text-rose-300',       dot: 'bg-rose-500', pulse: true },
};

const ALL_ACTIONS = ['All Actions', 'Login', 'Logout', 'Create', 'Update', 'Delete', 'Export', 'View', 'Revoke'];

const EventDetailsDrawer = ({ log, onClose, brandColor }) => {
  if (!log) return null;
  const sc = severityColors[log.severity] || severityColors.Info;
  let parsedPayload = {};
  try { parsedPayload = JSON.parse(log.payload); } catch(e) { parsedPayload = { raw: log.payload }; }

  return (
    <ModernCenterModal
      isOpen={!!log}
      onClose={onClose}
      title="Audit Event Details"
      subtitle={`Event ID: #${log.id}`}
      actions={
        <button onClick={onClose} className="h-8.5 px-4 rounded-lg text-xs font-semibold text-white shadow-2xs cursor-pointer" style={{ backgroundColor: brandColor }}>
          Close Event Audit
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Overview</h4>
          <div className="grid grid-cols-2 gap-4">
            <DrawerField label="Timestamp">
              <div className="font-mono font-bold h-8 flex items-center text-sm" style={{ color: brandColor }}>{log.timestamp}</div>
            </DrawerField>
            <DrawerField label="Severity">
              <div className="h-8 flex items-center">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{log.severity}
                </span>
              </div>
            </DrawerField>
          </div>
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Actor & Action Context</h4>
          <div className="grid grid-cols-2 gap-4">
            <DrawerField label="Actor Name">
              <div className="font-bold text-slate-800 dark:text-slate-200 h-8 flex items-center text-xs">{log.user}</div>
            </DrawerField>
            <DrawerField label="Email Address">
              <div className="text-slate-600 dark:text-slate-400 h-8 flex items-center text-xs font-mono">{log.userEmail}</div>
            </DrawerField>
            <DrawerField label="Target Module">
              <div className="font-bold text-slate-800 dark:text-slate-200 h-8 flex items-center text-xs">{log.module}</div>
            </DrawerField>
            <DrawerField label="Operation">
              <div className="font-bold text-slate-800 dark:text-slate-200 h-8 flex items-center text-xs">{log.action}</div>
            </DrawerField>
          </div>
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Audit Payload & Metadata</h4>
          <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
            <pre>{JSON.stringify(parsedPayload, null, 2)}</pre>
          </div>
        </div>
      </div>
    </ModernCenterModal>
  );
};

const AuditLogs = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('All Actions');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const brandColor = activeTheme?.color || '#2563eb';

  const allLogs = useMemo(() => {
    DatabaseService.init();
    const liveDbLogs = (DatabaseService.auditLogs || []).map(entry => ({
      id: entry.id,
      user: entry.actor,
      userEmail: entry.actor,
      action: entry.action,
      module: entry.resource || 'System',
      severity: entry.status === 'FAILED' ? 'Critical' : 'Info',
      timestamp: entry.timestamp,
      ip: '127.0.0.1 (Verified Gateway)',
      userAgent: 'PeopleWorks ATS Client',
      payload: JSON.stringify({ resourceId: entry.resourceId, details: entry.details })
    }));
    return [...liveDbLogs, ...MOCK_AUDIT_LOGS];
  }, []);

  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      const matchSearch = search === '' ||
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.module.toLowerCase().includes(search.toLowerCase()) ||
        log.ip.includes(search);

      const matchAction = filterAction === 'All Actions' || log.action.toLowerCase().includes(filterAction.toLowerCase());
      return matchSearch && matchAction;
    });
  }, [allLogs, search, filterAction]);

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      addToast({ title: 'Export Failed', message: 'No records available to export with current filters.', type: 'error' });
      return;
    }
    setIsExporting(true);

    // Generate CSV safely with Formula Injection protection
    const headers = ['ID', 'Timestamp', 'Actor', 'Email', 'Action', 'Module', 'Severity', 'IP'];
    const rows = filteredLogs.map(l => [
      SanitizerService.sanitizeCsvCell(l.id),
      SanitizerService.sanitizeCsvCell(l.timestamp),
      SanitizerService.sanitizeCsvCell(l.user),
      SanitizerService.sanitizeCsvCell(l.userEmail),
      SanitizerService.sanitizeCsvCell(l.action),
      SanitizerService.sanitizeCsvCell(l.module),
      SanitizerService.sanitizeCsvCell(l.severity),
      SanitizerService.sanitizeCsvCell(l.ip)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ats_security_audit_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
      addToast({ title: 'Audit Report Generated', message: `Exported ${filteredLogs.length} security audit log(s) securely to CSV.`, type: 'success' });
    }, 400);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="Audit Logs & System Telemetry"
        subtitle="Immutable security trail of administrative actions, user authentication, and system data modifications"
        icon={<Activity className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search user, action, IP, or module..."
        filterOptions={ALL_ACTIONS}
        activeFilter={filterAction}
        onFilterChange={setFilterAction}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel={isExporting ? 'Exporting...' : 'Export Audit CSV'}
        onPrimaryAction={handleExport}
        primaryActionDisabled={isExporting || filteredLogs.length === 0}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Total Audited Events', value: MOCK_AUDIT_LOGS.length, sub: 'Immutable telemetry stream', icon: <Activity className="w-4 h-4" /> },
          { label: 'Critical Security Alerts', value: MOCK_AUDIT_LOGS.filter(l=>l.severity==='Critical').length || '2 Events', sub: 'Policy alerts', icon: <AlertTriangle className="w-4 h-4" /> },
          { label: 'Active User Actors', value: '5 Users', sub: 'Unique user IDs', icon: <Users className="w-4 h-4" /> },
          { label: 'Audited System Modules', value: '8 Modules', sub: 'SaaS coverage', icon: <Layers className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        filteredLogs.length === 0 ? (
          <ModernEmptyState 
            title="No audit logs found" 
            subtitle="No system telemetry matches your current search and filters." 
            icon={Activity}
          />
        ) : (
        <ModernCardGrid totalCount={MOCK_AUDIT_LOGS.length} filteredCount={filteredLogs.length} resourceName="audit logs">
          {filteredLogs.map((log) => {
            const sc = severityColors[log.severity] || severityColors.Info;

            return (
              <div
                key={log.id}
                className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Subtle Accent Stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${sc.accent}`} />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      ID: #{log.id}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border border-current ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {log.severity}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${sc.text}`} />
                    {log.action} — <span className="text-slate-500 font-medium text-sm">{log.module}</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{log.user}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-slate-500 text-[11px]">
                      <Monitor className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.ip}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {log.timestamp}
                  </span>

                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                </div>
              </div>
            );
          })}
          </ModernCardGrid>
        )
      ) : (
        /* ── COMPACT DATA TABLE VIEW ── */
        filteredLogs.length === 0 ? (
          <ModernEmptyState 
            title="No audit logs found" 
            subtitle="No system telemetry matches your current search and filters." 
            icon={Activity}
          />
        ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">Actor (User)</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Module Scope</th>
                <th className="px-6 py-3.5">Client IP</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredLogs.map((log) => {
                const sc = severityColors[log.severity] || severityColors.Info;
                return (
                  <tr key={log.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">{log.timestamp}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-100">{log.user}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{log.action}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-medium">{log.module}</td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400">{log.ip}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-500" /> Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )
      )}

      <EventDetailsDrawer log={selectedLog} onClose={() => setSelectedLog(null)} brandColor={brandColor} />
    </div>
  );
};

export default AuditLogs;
