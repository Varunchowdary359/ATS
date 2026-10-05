import React, { useState } from 'react';
import { 
  Building as BuildingOfficeIcon, 
  Users as UserGroupIcon, 
  Clock as ClockIcon, 
  CheckCircle2 as CheckCircleIcon, 
  Plus as PlusIcon, 
  Trash2 as TrashIcon, 
  ShieldCheck as ShieldCheckIcon,
  Settings as Cog6ToothIcon
} from 'lucide-react';
import { ROLES } from './jdMockData';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import { useToast } from '../../shared/ToastContext';

export default function JDWorkflowConfig({ workflows, setWorkflows, brandColor = '#1A56DB' }) {
  const { addToast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflows[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const handleSelectWorkflow = (wf) => {
    setSelectedWorkflow(wf);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditForm(JSON.parse(JSON.stringify(selectedWorkflow)));
    setIsEditing(true);
  };

  const handleSave = () => {
    // 1. Name required
    if (!editForm.name || !editForm.name.trim()) {
      addToast({ title: 'Validation Alert', message: 'Workflow Name is required.', type: 'warning' });
      return;
    }
    // 2. At least 1 stage required
    if (!Array.isArray(editForm.stages) || editForm.stages.length === 0) {
      addToast({ title: 'Validation Alert', message: 'At least one approval stage is required.', type: 'warning' });
      return;
    }
    // 3. Min Experience <= Max Experience
    if (Number(editForm.minExperience) > Number(editForm.maxExperience)) {
      addToast({ title: 'Validation Alert', message: 'Minimum Experience must be less than or equal to Maximum Experience.', type: 'warning' });
      return;
    }
    // 4. Overlapping experience rules for active workflows
    if (editForm.status !== 'Inactive' && !editForm.isDefault) {
      const otherActive = workflows.filter(w => w.id !== editForm.id && w.status !== 'Inactive' && !w.isDefault);
      const isOverlap = otherActive.some(w => {
        const sameDept = w.department === 'All Departments' || editForm.department === 'All Departments' || w.department === editForm.department;
        if (!sameDept) return false;
        const minA = Number(editForm.minExperience || 0);
        const maxA = Number(editForm.maxExperience || 99);
        const minB = Number(w.minExperience || 0);
        const maxB = Number(w.maxExperience || 99);
        return Math.max(minA, minB) <= Math.min(maxA, maxB);
      });

      if (isOverlap) {
        addToast({
          title: 'Rule Conflict',
          message: 'This workflow rule overlaps with an existing active rule for the same department. Please adjust experience ranges.',
          type: 'error'
        });
        return;
      }
    }

    let updatedWorkflows = workflows.map(w => {
      if (w.id === editForm.id) return editForm;
      if (editForm.isDefault) return { ...w, isDefault: false };
      return w;
    });

    if (!updatedWorkflows.some(w => w.isDefault)) {
      updatedWorkflows = updatedWorkflows.map((w, idx) => idx === 0 ? { ...w, isDefault: true } : w);
    }

    setWorkflows(updatedWorkflows);
    try {
      localStorage.setItem('pw_workflow_configs_v2', JSON.stringify(updatedWorkflows));
      localStorage.removeItem('pw_workflow_configs');
    } catch (e) {
      console.error(e);
    }
    setSelectedWorkflow(editForm);
    setIsEditing(false);
    addToast({ title: 'Configuration Saved', message: `Workflow rule "${editForm.name}" saved successfully.`, type: 'success' });
  };

  const handleCreateNewWorkflow = () => {
    const newWf = {
      id: `WF-CUSTOM-${Date.now().toString().slice(-4)}`,
      name: 'Custom Department Approval Rule',
      department: 'Engineering',
      minExperience: 0,
      maxExperience: 15,
      isDefault: false,
      stages: [
        { id: 1, role: 'hiring_manager', roleName: 'Hiring Manager', type: 'sequential', mandatory: true, slaHours: 48 },
        { id: 2, role: 'hr_lead', roleName: 'HR & Compliance Lead', type: 'sequential', mandatory: true, slaHours: 24 }
      ]
    };
    setWorkflows([...workflows, newWf]);
    setSelectedWorkflow(newWf);
    setEditForm(newWf);
    setIsEditing(true);
  };

  const addStageToEditForm = () => {
    const newStage = {
      id: editForm.stages.length + 1,
      role: 'hr_lead',
      roleName: 'HR & Compliance Lead',
      type: 'sequential',
      mandatory: true,
      slaHours: 24
    };
    setEditForm({
      ...editForm,
      stages: [...editForm.stages, newStage]
    });
  };

  const removeStageFromEditForm = (index) => {
    if (editForm.stages.length <= 1) return;
    const updatedStages = editForm.stages.filter((_, idx) => idx !== index)
      .map((stg, i) => ({ ...stg, id: i + 1 }));
    setEditForm({ ...editForm, stages: updatedStages });
  };

  const updateStageField = (index, field, value) => {
    const updatedStages = [...editForm.stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    if (field === 'role') {
      const matchedRole = ROLES.find(r => r.id === value);
      if (matchedRole) updatedStages[index].roleName = matchedRole.name;
    }
    setEditForm({ ...editForm, stages: updatedStages });
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cog6ToothIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Approval Workflow Configuration</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure multi-stage approval chains, role permissions, and SLAs based on Department and Experience levels.
          </p>
        </div>
        <button
          onClick={handleCreateNewWorkflow}
          className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all hover:brightness-110 flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          style={{ backgroundColor: brandColor }}
        >
          <PlusIcon className="w-4 h-4" /> Add Workflow Rule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column: Workflows List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Active Rules ({workflows.length})
          </h3>
          {workflows.map((wf) => {
            const isSelected = selectedWorkflow?.id === wf.id;
            return (
              <div
                key={wf.id}
                onClick={() => handleSelectWorkflow(wf)}
                style={isSelected ? { borderColor: brandColor } : {}}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 shadow-sm font-bold'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{wf.name}</span>
                  {wf.isDefault && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><BuildingOfficeIcon className="w-3.5 h-3.5" /> {wf.department}</span>
                  <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> {wf.stages.length} Stages</span>
                </div>
              </div>
            );
          })}

          {/* Roles Directory Reference */}
          <div className="mt-8 p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-500" /> Configured Approver Roles
            </h4>
            <div className="space-y-2 mt-3">
              {ROLES.map(r => (
                <div key={r.id} className="text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{r.name}</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Stage Builder Details */}
        <div className="lg:col-span-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6">
          {selectedWorkflow && !isEditing && (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedWorkflow.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Target Department: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedWorkflow.department}</span> | Experience Range: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedWorkflow.minExperience} - {selectedWorkflow.maxExperience} yrs</span>
                  </p>
                </div>
                <button
                  onClick={handleStartEdit}
                  style={{ color: brandColor, backgroundColor: `${brandColor}15` }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Edit Configuration
                </button>
              </div>

              {/* Stage Flow visualizer */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                  Sequential Approval Stages ({selectedWorkflow.stages.length})
                </h4>
                
                <div className="space-y-4 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {selectedWorkflow.stages.map((stg, idx) => (
                    <div key={stg.id} className="relative flex items-start gap-4 pl-10">
                      <div 
                        style={{ borderColor: brandColor, color: brandColor }}
                        className="absolute left-1.5 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{stg.roleName}</div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="capitalize">Type: {stg.type}</span>
                            <span>SLA: {stg.slaHours} hours</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${
                          stg.mandatory ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {stg.mandatory ? 'Mandatory Stage' : 'Optional Stage'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Edit Mode Form */}
          {isEditing && editForm && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Approval Workflow Rule</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-all shadow-sm cursor-pointer"
                    style={{ backgroundColor: brandColor }}
                  >
                    Save Configuration
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Workflow Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Department Applicability</label>
                  <CustomSelect
                    value={editForm.department}
                    onChange={(val) => setEditForm({ ...editForm, department: val })}
                    options={['All Departments', 'Engineering', 'Sales', 'Marketing', 'Product', 'Finance'].map(d => ({ label: d, value: d }))}
                  />
                </div>
              </div>

              {/* Editable Stages List */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Configured Stages Flow
                  </label>
                  <button
                    onClick={addStageToEditForm}
                    style={{ color: brandColor }}
                    className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Add Stage
                  </button>
                </div>

                <div className="space-y-3">
                  {editForm.stages.map((stg, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      <div className="flex-1 min-w-[140px]">
                        <CustomSelect
                          value={stg.role}
                          onChange={(val) => updateStageField(idx, 'role', val)}
                          options={ROLES.filter(r => r.id !== 'viewer' && r.id !== 'admin').map(r => ({ label: r.name, value: r.id }))}
                        />
                      </div>

                      <div className="w-28">
                        <CustomSelect
                          value={stg.type}
                          onChange={(val) => updateStageField(idx, 'type', val)}
                          options={[
                            { label: 'Sequential', value: 'sequential' },
                            { label: 'Parallel', value: 'parallel' }
                          ]}
                        />
                      </div>

                      <div className="w-28 flex items-center gap-1 text-xs">
                        <input
                          type="number"
                          value={stg.slaHours}
                          onChange={(e) => updateStageField(idx, 'slaHours', parseInt(e.target.value) || 24)}
                          className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        />
                        <span className="text-[11px] text-slate-500">hrs SLA</span>
                      </div>

                      <button
                        onClick={() => removeStageFromEditForm(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                        title="Remove Stage"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

