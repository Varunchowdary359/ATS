import React, { useState, useContext } from 'react';
import { MOCK_APPROVAL_WORKFLOWS } from '../companyAdminMockData';
import { 
  GitPullRequest, Plus, Clock, ShieldCheck, Save, PlusCircle, 
  Trash2, Edit3, ChevronRight, Play, CheckCircle2, Layers, Sliders, ArrowRight 
} from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import ConfirmModal from '../shared/ConfirmModal';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernCardGrid,
  ModernStatusBadge,
  ModernVisualChainBuilder,
  ModernEmptyState,
  DrawerField,
} from '../shared/ModernAdminLayoutComponents';
import CustomSelect from '../../dashboard/shared/CustomSelect';

const ApprovalWorkflowManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [workflows, setWorkflows] = useState(MOCK_APPROVAL_WORKFLOWS);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('All Modules');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingWf, setEditingWf] = useState(null);
  const [wfToDelete, setWfToDelete] = useState(null);
  
  // Simulator State
  const [simulatingWf, setSimulatingWf] = useState(null);
  const [simulatedResult, setSimulatedResult] = useState(null);

  const brandColor = activeTheme?.color || '#2563eb';

  const [formData, setFormData] = useState({
    code: '', name: '', module: 'Leave Management', triggerRule: 'Leave duration > 0 days', slaHours: 48,
    chainSummary: 'Direct Manager ➔ HR Admin', status: 'Active',
    steps: [
      { stepNumber: 1, approverType: 'DIRECT_MANAGER', roleName: 'Direct Manager', slaHours: 24, fallbackAction: 'Escalate' },
      { stepNumber: 2, approverType: 'ROLE_BASED', roleName: 'HR Admin', slaHours: 24, fallbackAction: 'Auto-Approve' },
    ]
  });
  const [initialFormData, setInitialFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const filtered = workflows.filter(w => {
    const matchSearch = search === '' ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      w.module.toLowerCase().includes(search.toLowerCase());
    const matchModule = filterModule === 'All Modules' || w.module === filterModule;
    return matchSearch && matchModule;
  });

  const handleOpenAdd = () => {
    setEditingWf(null);
    const newForm = {
      code: `WF-NEW-0${workflows.length + 1}`, name: '', module: 'Leave Management', triggerRule: 'Leave duration > 0 days', slaHours: 48,
      chainSummary: 'Direct Manager ➔ HR Admin', status: 'Active',
      steps: [
        { stepNumber: 1, approverType: 'DIRECT_MANAGER', roleName: 'Direct Manager', slaHours: 24, fallbackAction: 'Escalate' },
        { stepNumber: 2, approverType: 'ROLE_BASED', roleName: 'HR Admin', slaHours: 24, fallbackAction: 'Auto-Approve' },
      ]
    };
    setFormData(newForm);
    setInitialFormData(newForm);
    setShowDrawer(true);
  };

  const handleOpenEdit = (wf) => {
    setEditingWf(wf);
    const editForm = {
      ...wf,
      steps: wf.steps || [
        { stepNumber: 1, approverType: 'DIRECT_MANAGER', roleName: 'Direct Manager', slaHours: 24, fallbackAction: 'Escalate' },
        { stepNumber: 2, approverType: 'ROLE_BASED', roleName: 'HR Admin', slaHours: 24, fallbackAction: 'Auto-Approve' },
      ]
    };
    setFormData(editForm);
    setInitialFormData(editForm);
    setShowDrawer(true);
  };

  const handleAddStepNode = () => {
    const nextNum = formData.steps.length + 1;
    const newStep = {
      stepNumber: nextNum,
      approverType: 'DEPARTMENT_HEAD',
      roleName: 'Department Head',
      slaHours: 24,
      fallbackAction: 'Escalate'
    };
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep]
    });
    addToast({ title: 'Step Added', message: `Step ${nextNum} node inserted.`, type: 'info' });
  };

  const handleRemoveStepNode = (index) => {
    if (formData.steps.length <= 1) {
      addToast({ title: 'Minimum 1 Step Required', message: 'Workflow must have at least one approval node.', type: 'error' });
      return;
    }
    const updated = formData.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setFormData({ ...formData, steps: updated });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast({ title: 'Validation Error', message: 'Name and Code are required.', type: 'error' });
      return;
    }

    const summary = formData.steps.map(s => s.roleName).join(' ➔ ');
    const updatedObj = { ...formData, stepCount: formData.steps.length, chainSummary: summary };

    setIsSaving(true);
    setTimeout(() => {
      if (editingWf) {
        setWorkflows(workflows.map(w => w.id === editingWf.id ? { ...w, ...updatedObj } : w));
        addToast({ title: 'Workflow Updated', message: `${formData.name} updated successfully.`, type: 'success' });
      } else {
        setWorkflows([...workflows, { id: Date.now(), ...updatedObj }]);
        addToast({ title: 'Workflow Created', message: `${formData.name} configured.`, type: 'success' });
      }
      setIsSaving(false);
      setShowDrawer(false);
    }, 600);
  };

  const confirmDelete = () => {
    if (!wfToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setWorkflows(workflows.filter(w => w.id !== wfToDelete.id));
      addToast({ title: 'Workflow Removed', message: `${wfToDelete.name} deleted.`, type: 'success' });
      setWfToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  const handleRunSimulator = (wf) => {
    setSimulatingWf(wf);
    setSimulatedResult(null);
    setTimeout(() => {
      setSimulatedResult({
        routedTo: wf.steps ? wf.steps.map(s => s.roleName) : ['Direct Manager', 'HR Admin'],
        estimatedHours: wf.slaHours || 48,
        status: 'Route Validated',
      });
    }, 400);
  };

  if (showDrawer) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0f111a] animate-fade-in relative z-10 overflow-y-auto overflow-x-hidden scrollbar-none">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <div className="flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                <button onClick={() => setShowDrawer(false)} className="hover:text-blue-600 transition-colors">Approval Workflows</button>
                <span className="mx-2">/</span>
                <span className="text-slate-600 dark:text-slate-300">{editingWf ? 'Edit' : 'Create'}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{editingWf ? 'Edit Approval Workflow' : 'Create Approval Workflow'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure trigger rules, multi-tier approval steps and escalation SLA</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowDrawer(false)} disabled={isSaving} className="h-9 px-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs cursor-pointer disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving || (!hasChanges && !!editingWf)}
                className="h-9 px-4 rounded-xl font-bold text-white shadow-sm text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all" 
                style={{ backgroundColor: (!hasChanges && !!editingWf) ? '#94a3b8' : brandColor }}
              >
                {isSaving ? 'Processing...' : (editingWf ? (!hasChanges ? 'No Changes' : 'Save Workflow') : 'Create Workflow')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <DrawerSection title="Identity" description="Workflow configuration">
              <DrawerField label="Workflow Code" required>
                <input type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
              </DrawerField>
              <DrawerField label="Workflow Name" required>
                <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. Standard Leave Approval Workflow" className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
              </DrawerField>
              <DrawerField label="Module Category">
                <CustomSelect 
                  value={formData.module} 
                  onChange={val=>setFormData({...formData, module: val})} 
                  options={[{label: 'Leave Management', value: 'Leave Management'}, {label: 'Expense & Payouts', value: 'Expense & Payouts'}, {label: 'Recruitment Requisition', value: 'Recruitment Requisition'}, {label: 'Attendance & Shifts', value: 'Attendance & Shifts'}]} 
                />
              </DrawerField>
            </DrawerSection>

            <DrawerSection title="Approval Sequence" description="Define the sequence of approvers">
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-900 dark:text-white text-xs">Step Nodes</label>
                <button 
                  type="button" 
                  onClick={handleAddStepNode}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add Step Node
                </button>
              </div>
              <div className="space-y-2.5">
                {formData.steps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col gap-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Step {step.stepNumber} Node</span>
                      <button type="button" onClick={() => handleRemoveStepNode(idx)} className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer">Remove</button>
                    </div>
                    <input
                      type="text"
                      value={step.roleName}
                      onChange={(e) => {
                        const updated = [...formData.steps];
                        updated[idx].roleName = e.target.value;
                        setFormData({ ...formData, steps: updated });
                      }}
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                ))}
              </div>
            </DrawerSection>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Real-Time Enterprise Header */}
      <ModernPageHeader
        title="Approval Workflows & Route Governance"
        subtitle="Configure multi-stage approval chains, SLA escalation policies, and live execution routes"
        icon={<GitPullRequest className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter workflow rules..."
        filterOptions={['All Modules', 'Leave Management', 'Expense & Payouts', 'Recruitment Requisition', 'Attendance & Shifts']}
        activeFilter={filterModule}
        onFilterChange={setFilterModule}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Create Workflow"
        onPrimaryAction={handleOpenAdd}
        themeColor={brandColor}
      />

      {/* Modern KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Active Workflows', value: workflows.length, sub: 'Governance chains', icon: <GitPullRequest className="w-4 h-4" /> },
          { label: 'Operational Rules', value: workflows.filter(w=>w.status==='Active').length, sub: 'Auto-routing live', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Avg Approval SLA', value: '48 Hours', sub: 'Target SLA window', icon: <Clock className="w-4 h-4" /> },
          { label: 'Audited Modules', value: '4 Modules', sub: 'Leave, Expense, Hiring', icon: <Layers className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        filtered.length === 0 ? (
          <ModernEmptyState 
            title="No workflows found" 
            subtitle="No approval workflows match your current search and filters." 
            icon={GitPullRequest}
          />
        ) : (
        <ModernCardGrid totalCount={workflows.length} filteredCount={filtered.length} resourceName="approval workflows">
          {filtered.map((wf) => (
            <div
              key={wf.id}
              className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Subtle Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80">
                    {wf.code}
                  </span>
                  <ModernStatusBadge status={wf.status} />
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2.5 tracking-tight group-hover:text-blue-600 transition-colors">
                  {wf.name}
                </h3>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {wf.module}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono truncate">Rule: {wf.triggerRule}</span>
                </div>

                {/* Visual Sequence Chain Builder Widget */}
                <div className="mt-3">
                  <ModernVisualChainBuilder
                    steps={wf.steps}
                    chainSummary={wf.chainSummary}
                    slaHours={wf.slaHours}
                    themeColor={brandColor}
                  />
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <button
                  onClick={() => handleRunSimulator(wf)}
                  className="h-7 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all shadow-2xs hover:shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 text-emerald-500" /> Test Route
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(wf)}
                    title="Edit Workflow"
                    className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setWfToDelete(wf)}
                    title="Delete Workflow"
                    className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </ModernCardGrid>
        )
      ) : (
        /* ── COMPACT TABLE VIEW ── */
        filtered.length === 0 ? (
          <ModernEmptyState 
            title="No approval workflows found" 
            subtitle="No routing rules match your current query filter." 
            icon={GitMerge} 
          />
        ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Workflow Name & Trigger Module</th>
                <th className="px-5 py-3.5">Approval Hierarchy / Gate sequence</th>
                <th className="px-5 py-3.5">Default SLA</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.map((wf) => (
                <tr key={wf.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-5 py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GitMerge className="w-3.5 h-3.5 text-blue-500" />
                    <span>{wf.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">({wf.module})</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 max-w-sm truncate">
                      {wf.chainSummary || 'Direct Manager ➔ HR Admin'}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{wf.slaHours} Hours</td>
                  <td className="px-5 py-3">
                    <ModernStatusBadge status={wf.status || 'Active'} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 py-0.5">
                      <button 
                        onClick={() => handleRunSimulator(wf)} 
                        title="Simulate Workflow"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:border-emerald-200 dark:hover:border-emerald-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-emerald-500/20" />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(wf)} 
                        title="Edit Workflow"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setWfToDelete(wf)} 
                        title="Delete Workflow"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )
      )}

      {/* Simulator Modal */}
      {simulatingWf && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Live Route Simulator</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{simulatingWf.code} - {simulatingWf.name}</p>
              </div>
              <button onClick={() => setSimulatingWf(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {simulatedResult ? (
              <div className="flex flex-col gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Route Validated & Active
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Resolved Approval Sequence</span>
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    {simulatedResult.routedTo.map((node, i) => (
                      <React.Fragment key={i}>
                        <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          {node}
                        </span>
                        {i < simulatedResult.routedTo.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 font-medium">Running workflow route simulation...</div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={() => setSimulatingWf(null)} className="h-8.5 px-4 rounded-lg text-xs font-semibold text-white shadow-2xs" style={{ backgroundColor: brandColor }}>
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!wfToDelete}
        onClose={() => setWfToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Approval Workflow"
        message={`Are you sure you want to remove workflow ${wfToDelete?.name}?`}
        confirmText="Delete Workflow"
      />


    </div>
  );
};

export default ApprovalWorkflowManagement;
