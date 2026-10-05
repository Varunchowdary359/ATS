import React, { useState, useMemo, useContext } from 'react';
import { useToast } from '../shared/ToastContext';
import { ThemeContext } from '../../ThemeContext';
import ModernCenterModal from './shared/ModernCenterModal';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernCardGrid,
} from './shared/ModernAdminLayoutComponents';
import { Cpu, Sparkles, DollarSign, Clock, Eye, Terminal, Zap } from 'lucide-react';

const MOCK_AI_LOGS = [
  { id: 1, tenant: 'Infosys BPM', model: 'gpt-4o', action: 'Resume Parsing', tokens: '14,200', cost: '$0.21', time: '2 mins ago', inputTokens: '8,400', outputTokens: '5,800', latency: '1,240ms', promptPreview: 'Extract structured candidate profile from the provided resume PDF including name, experience, skills, and education...', responsePreview: '{ "name": "Ankit Sharma", "experience": 6, "skills": ["React", "Node.js", "PostgreSQL"], "education": "B.Tech CSE" }', requestId: 'req-ff291a' },
  { id: 2, tenant: 'Tata Consultancy', model: 'claude-3-5-sonnet', action: 'Interview Screening', tokens: '45,000', cost: '$1.35', time: '12 mins ago', inputTokens: '28,000', outputTokens: '17,000', latency: '3,800ms', promptPreview: 'Conduct a structured interview screening evaluation based on the following job description and candidate resume. Provide a structured score...', responsePreview: '{ "score": 82, "recommendation": "Proceed to technical round", "strengths": ["Communication", "Domain knowledge"], "gaps": ["System design experience"] }', requestId: 'req-bb921d' },
  { id: 3, tenant: 'Wipro HR Division', model: 'gemini-1.5-pro', action: 'Email Drafting', tokens: '8,400', cost: '$0.06', time: '35 mins ago', inputTokens: '3,200', outputTokens: '5,200', latency: '920ms', promptPreview: 'Draft a professional candidate rejection email for the position of Senior React Developer. Tone should be empathetic and encouraging...', responsePreview: 'Dear Candidate, Thank you for your interest in the Senior React Developer position at Wipro...', requestId: 'req-ca4512' },
  { id: 4, tenant: 'Infosys BPM', model: 'gpt-4o', action: 'Candidate Matching', tokens: '22,100', cost: '$0.33', time: '1 hr ago', inputTokens: '14,500', outputTokens: '7,600', latency: '1,780ms', promptPreview: 'Given the job description and pool of 15 resumes, rank candidates by relevance score and provide justification for top 3...', responsePreview: '{ "ranked": [{ "rank": 1, "name": "Priya R.", "score": 91 }, { "rank": 2, "name": "Rohan S.", "score": 87 }] }', requestId: 'req-09de77' },
  { id: 5, tenant: 'Mindtree Talent', model: 'claude-3-5-sonnet', action: 'Resume Parsing', tokens: '12,000', cost: '$0.36', time: '3 hrs ago', inputTokens: '7,000', outputTokens: '5,000', latency: '1,100ms', promptPreview: 'Parse the following resume and return structured JSON with candidate details...', responsePreview: '{ "name": "Kavya M.", "experience": 4, "skills": ["Python", "ML", "TensorFlow"] }', requestId: 'req-3c8ab1' },
];

const InspectorDrawer = ({ log, isOpen, onClose, brandColor }) => (
  <ModernCenterModal isOpen={isOpen} onClose={onClose}
    title="AI Usage Inspector"
    subtitle={`${log?.model} · ${log?.requestId || '—'}`}
    actions={
      <button onClick={onClose} className="h-8.5 px-4 rounded-lg text-xs font-semibold text-white shadow-2xs cursor-pointer" style={{ backgroundColor: brandColor }}>
        Close Inspector
      </button>
    }
  >
    {log && (
      <div className="flex flex-col gap-5 text-xs">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Tokens', value: log.tokens },
            { label: 'Est. Cost', value: log.cost },
            { label: 'Latency', value: log.latency },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-sm font-extrabold" style={{ color: brandColor }}>{value}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

        <div className="flex flex-col gap-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1">Request Parameters</div>
          {[
            { label: 'Tenant Workspace', value: log.tenant },
            { label: 'AI Model', value: log.model },
            { label: 'Action Type', value: log.action },
            { label: 'Request ID', value: log.requestId },
            { label: 'Latency', value: log.latency },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
              <span className="text-slate-500 font-medium text-xs">{label}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{value}</span>
            </div>
          ))}
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5 text-xs">
            <Terminal className="w-4 h-4 text-blue-500" /> Prompt Payload Preview
          </h4>
          <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800">
            {log.promptPreview}
          </pre>
        </div>
      </div>
    )}
  </ModernCenterModal>
);

const AIUsage = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [logs] = useState(MOCK_AI_LOGS);
  const [search, setSearch] = useState('');
  const [filterModel, setFilterModel] = useState('All Models');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedLog, setSelectedLog] = useState(null);

  const brandColor = activeTheme?.color || '#2563eb';

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = search === '' ||
        l.tenant.toLowerCase().includes(search.toLowerCase()) ||
        l.model.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase());
      const matchModel = filterModel === 'All Models' || l.model === filterModel;
      return matchSearch && matchModel;
    });
  }, [logs, search, filterModel]);

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="AI Token Usage & LLM Analytics"
        subtitle="Monitor LLM model token consumption, inference latency, cost attribution per tenant, and prompt execution traces"
        icon={<Cpu className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tenant, model, or action..."
        filterOptions={['All Models', 'gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro']}
        activeFilter={filterModel}
        onFilterChange={setFilterModel}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Export AI Usage CSV"
        onPrimaryAction={() => addToast({ title: 'AI Report Exported', message: 'Exported AI LLM analytics to CSV.', type: 'success' })}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Total Tokens Consumed', value: '101,700', sub: '24h inference volume', icon: <Cpu className="w-4 h-4" /> },
          { label: 'Total LLM Cost (24h)', value: '$2.31', sub: 'Aggregated AI spend', icon: <DollarSign className="w-4 h-4" /> },
          { label: 'Active LLM Models', value: '3 Models', sub: 'GPT-4o, Claude, Gemini', icon: <Sparkles className="w-4 h-4" /> },
          { label: 'Avg Inference Latency', value: '1,768ms', sub: 'P95 latency target', icon: <Clock className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        <ModernCardGrid totalCount={logs.length} filteredCount={filteredLogs.length} resourceName="AI API executions">
          {filteredLogs.map((l) => (
            <div
              key={l.id}
              className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Subtle Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                    {l.model}
                  </span>
                  <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400">
                    {l.tokens} Tokens
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  {l.action}
                </h3>
                
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Tenant: <strong className="text-slate-800 dark:text-slate-200 font-bold">{l.tenant}</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Cost: {l.cost}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{l.latency}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">{l.time}</span>

                <button
                  onClick={() => setSelectedLog(l)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-500" /> Details
                </button>
              </div>
            </div>
          ))}
        </ModernCardGrid>
      ) : (
        /* ── COMPACT DATA TABLE VIEW ── */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="px-6 py-3.5">Client Tenant</th>
                <th className="px-6 py-3.5">AI Model</th>
                <th className="px-6 py-3.5">Action Executed</th>
                <th className="px-6 py-3.5">Token Usage</th>
                <th className="px-6 py-3.5">Est. Cost</th>
                <th className="px-6 py-3.5">Latency</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-blue-500" />
                    <span>{l.tenant}</span>
                  </td>
                  <td className="px-6 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">{l.model}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-100">{l.action}</td>
                  <td className="px-6 py-3.5 font-mono font-extrabold text-slate-900 dark:text-white">{l.tokens} Tokens</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{l.cost}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">{l.latency}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedLog(l)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InspectorDrawer log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} brandColor={brandColor} />
    </div>
  );
};

export default AIUsage;
