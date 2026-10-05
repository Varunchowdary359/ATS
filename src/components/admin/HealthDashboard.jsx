import React, { useState, useMemo, useContext } from 'react';
import { useToast } from '../shared/ToastContext';
import { ThemeContext } from '../../ThemeContext';
import ModernCenterModal from './shared/ModernCenterModal';
import ConfirmModal from './shared/ConfirmModal';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernCardGrid,
  ModernStatusBadge,
  ModernEmptyState,
  DrawerSection,
  DrawerField,
} from './shared/ModernAdminLayoutComponents';
import { Activity, ShieldCheck, Cpu, Clock, Terminal, Trash2, Eye, Server, Database, HardDrive, Search } from 'lucide-react';

const MOCK_SERVICES = [
  { name: 'API Server Gateway', status: 'Healthy', load: '14%', latency: '85ms', version: 'v3.2.1', uptime: '99.98%', region: 'ap-south-1', icon: <Server className="w-4 h-4 text-blue-500" /> },
  { name: 'Relational Database (PostgreSQL)', status: 'Healthy', load: '28%', latency: '12ms', version: 'v15.4', uptime: '99.99%', region: 'ap-south-1', icon: <Database className="w-4 h-4 text-emerald-500" /> },
  { name: 'Cache Layer (Redis Cluster)', status: 'Healthy', load: '8%', latency: '1ms', version: 'v7.0.5', uptime: '100%', region: 'ap-south-1', icon: <HardDrive className="w-4 h-4 text-purple-500" /> },
  { name: 'Elastic Search Node', status: 'Healthy', load: '45%', latency: '68ms', version: 'v8.11', uptime: '99.95%', region: 'ap-south-1', icon: <Search className="w-4 h-4 text-amber-500" /> },
];

const INITIAL_LOGS = [
  { id: 1, time: '13:30:05', type: 'INFO', msg: 'SaaS Gateway listening on port 443', traceId: 'trace-7f2a9b', service: 'API Gateway', method: 'GET', path: '/api/v3/health', status: 200, duration: '12ms' },
  { id: 2, time: '13:30:12', type: 'INFO', msg: 'Active websocket handshake completed for tenant "infosysbpm"', traceId: 'trace-3d91cc', service: 'WebSocket Server', method: 'WS', path: '/ws/connect', status: 101, duration: '4ms' },
  { id: 3, time: '13:30:24', type: 'WARN', msg: 'DB connection pool pool-size near limit (82/100)', traceId: 'trace-9a12de', service: 'PostgreSQL', method: 'POOL', path: 'connection-pool', status: 429, duration: '—' },
  { id: 4, time: '13:30:45', type: 'INFO', msg: 'Job Queue: processed 12 background resume parsing events', traceId: 'trace-bc7a12', service: 'Job Queue Worker', method: 'QUEUE', path: 'resume-parser-queue', status: 200, duration: '340ms' },
  { id: 5, time: '13:31:02', type: 'ERROR', msg: 'Webhook delivery failed to webhook.mindtree.com (Retrying in 5 mins)', traceId: 'trace-f04c1b', service: 'Webhook Dispatcher', method: 'POST', path: 'https://webhook.mindtree.com/notify', status: 503, duration: '5200ms' },
];

const LogInspectorDrawer = ({ log, isOpen, onClose, brandColor }) => (
  <ModernCenterModal isOpen={isOpen} onClose={onClose}
    title="System Log Inspector"
    subtitle={`Trace ID: ${log?.traceId || '—'}`}
    actions={
      <button onClick={onClose} className="h-8.5 px-4 rounded-lg text-xs font-semibold text-white shadow-2xs cursor-pointer" style={{ backgroundColor: brandColor }}>
        Close Inspector
      </button>
    }
  >
    {log && (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Overview</h4>
          <div className="grid grid-cols-2 gap-4">
            <DrawerField label="Log Type">
              <div className="h-8 flex items-center">
                <ModernStatusBadge status={log.type} />
              </div>
            </DrawerField>
            <DrawerField label="Time">
              <div className="font-mono font-bold h-8 flex items-center text-sm" style={{ color: brandColor }}>{log.time}</div>
            </DrawerField>
          </div>
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Trace Metadata</h4>
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'Service Component', value: log.service },
              { label: 'HTTP Method', value: log.method },
              { label: 'Request Path', value: log.path },
              { label: 'HTTP Status Code', value: log.status },
              { label: 'Execution Duration', value: log.duration },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40 last:border-0">
                <span className="text-slate-500 font-medium text-xs">{label}:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Log Message</h4>
          <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
            {log.msg}
          </pre>
        </div>
      </div>
    )}
  </ModernCenterModal>
);

const HealthDashboard = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [viewMode, setViewMode] = useState('grid');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const brandColor = activeTheme?.color || '#2563eb';

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = search === '' ||
        l.msg.toLowerCase().includes(search.toLowerCase()) ||
        l.service.toLowerCase().includes(search.toLowerCase()) ||
        l.traceId.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'All Types' || l.type === filterType;
      return matchSearch && matchType;
    });
  }, [logs, search, filterType]);

  const confirmClearLogs = () => {
    setIsClearing(true);
    setTimeout(() => {
      setLogs([]);
      addToast({ title: 'Logs Cleared', message: 'All live stream log events cleared.', type: 'info' });
      setShowClearConfirm(false);
      setIsClearing(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="System Health & Operational Status"
        subtitle="Monitor cluster node health, database connection pools, CPU load, and real-time execution stream logs"
        icon={<Activity className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search log message, trace ID, or service..."
        filterOptions={['All Types', 'INFO', 'WARN', 'ERROR']}
        activeFilter={filterType}
        onFilterChange={setFilterType}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Clear Log Stream"
        onPrimaryAction={() => setShowClearConfirm(true)}
        primaryActionDisabled={logs.length === 0}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Cluster Status', value: '100% Healthy', sub: '4/4 Services operational', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Avg API Response Time', value: '42ms', sub: 'P99 SLA: 120ms', icon: <Clock className="w-4 h-4" /> },
          { label: 'Aggregate System Load', value: '23%', sub: 'Healthy CPU utilization', icon: <Cpu className="w-4 h-4" /> },
          { label: 'Global Uptime', value: '99.98%', sub: '30-day window', icon: <Activity className="w-4 h-4" /> },
        ]}
      />

      {/* Services Health Grid */}
      <div className="mb-6">
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Operational Microservices</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {MOCK_SERVICES.map((s, idx) => (
            <div key={idx} className="relative overflow-hidden p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 group hover:border-slate-300 dark:hover:border-slate-700">
              {/* Subtle Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {s.icon}
                  </div>
                  <ModernStatusBadge status={s.status} />
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-2.5 leading-snug">{s.name}</h4>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">{s.version} · {s.region}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 font-normal">Latency: <strong className="text-slate-800 dark:text-slate-200">{s.latency}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">{s.uptime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Stream Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            Live Execution Stream Logs
          </h3>
          <span className="text-xs font-mono font-bold text-slate-500">{filteredLogs.length} Events</span>
        </div>

        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="px-6 py-3.5">Timestamp</th>
              <th className="px-6 py-3.5">Type</th>
              <th className="px-6 py-3.5">Service</th>
              <th className="px-6 py-3.5">Log Message</th>
              <th className="px-6 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8">
                  <ModernEmptyState 
                    title="No logs found" 
                    subtitle="No system telemetry matches your current search and filters." 
                    icon={Terminal}
                  />
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{log.time}</td>
                  <td className="px-6 py-3">
                    <ModernStatusBadge status={log.type} />
                  </td>
                  <td className="px-6 py-3 font-bold text-slate-800 dark:text-slate-100">{log.service}</td>
                  <td className="px-6 py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 max-w-md truncate">{log.msg}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center py-0.5">
                      <button
                        onClick={() => setSelectedLog(log)}
                        title="View Log Details"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LogInspectorDrawer log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} brandColor={brandColor} />

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearLogs}
        isLoading={isClearing}
        title="Clear Execution Log Stream"
        message="Are you sure you want to clear all active telemetry log events?"
        confirmText="Clear Log Events"
      />
    </div>
  );
};

export default HealthDashboard;
