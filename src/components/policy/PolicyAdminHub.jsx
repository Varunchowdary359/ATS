import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Plus, Search, Filter, Edit3, Copy, Trash2, Eye, 
  CheckCircle2, XCircle, Camera, Mic, Monitor, Maximize, AlertTriangle, 
  Lock, Clock, Play, FileText, CheckSquare, Layers, Sparkles, RefreshCw
} from 'lucide-react';
import { 
  PolicyService, POLICY_TYPES, VIOLATION_ACTIONS, VIOLATION_TYPES 
} from '../../services/policy/PolicyService';
import { CandidatePolicyGate } from './CandidatePolicyGate';
import { AssessmentSessionContainer } from './AssessmentSessionContainer';
import CustomSelect from '../dashboard/shared/CustomSelect';

export const PolicyAdminHub = () => {
  const [policies, setPolicies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedPolicyForEdit, setSelectedPolicyForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewPolicy, setPreviewPolicy] = useState(null);
  const [activeSimulator, setActiveSimulator] = useState(null); // 'gate' | 'session' | null
  const [simulatorPolicy, setSimulatorPolicy] = useState(null);

  const loadPolicies = () => {
    setPolicies(PolicyService.getPolicies());
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const filteredPolicies = policies.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'ALL' || p.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleToggleStatus = (policyId) => {
    PolicyService.togglePolicyStatus(policyId);
    loadPolicies();
  };

  const handleDuplicate = (policyId) => {
    PolicyService.duplicatePolicy(policyId);
    loadPolicies();
  };

  const handleDelete = (policyId) => {
    if (window.confirm('Are you sure you want to delete this custom policy?')) {
      PolicyService.deletePolicy(policyId);
      loadPolicies();
    }
  };

  const handleOpenCreate = () => {
    setSelectedPolicyForEdit({
      id: '',
      name: '',
      type: POLICY_TYPES.INTERVIEW,
      version: 'v1.0',
      enabled: true,
      required: true,
      description: '',
      rules: {
        camera: { required: true, livePreview: true, recording: false, strict: false },
        microphone: { required: true, audioLevelCheck: true, recording: false },
        screenShare: { required: false, entireScreenOnly: false },
        fullscreen: { required: false, autoPrompt: false },
        tabSwitch: { detection: false, maxSwitches: 5, strict: false },
        clipboard: { preventCopy: false, preventPaste: false, preventContextMenu: false },
        identityVerification: { required: false, type: 'none' },
        timeLimit: { enabled: true, durationMinutes: 60, autoSubmitOnExpiry: false, warningIntervalMinutes: [10, 5] },
        recording: { enabled: false, consentRequired: false, retentionDays: 0, storageNotice: '' },
        violationHandling: { maxViolations: 3, actionOnThreshold: VIOLATION_ACTIONS.WARNING, candidateWarningToast: true },
        candidateAcknowledgement: { required: true, explicitCheckbox: true, privacyConsentRequired: false }
      }
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (policy) => {
    setSelectedPolicyForEdit(JSON.parse(JSON.stringify(policy)));
    setIsEditModalOpen(true);
  };

  const handleSavePolicy = (e) => {
    e.preventDefault();
    if (!selectedPolicyForEdit.name.trim()) return;
    PolicyService.savePolicy(selectedPolicyForEdit);
    setIsEditModalOpen(false);
    loadPolicies();
  };

  const handleStartSimulation = (policy) => {
    setSimulatorPolicy(policy);
    setActiveSimulator('gate');
  };

  if (activeSimulator === 'gate' && simulatorPolicy) {
    return (
      <div className="w-full">
        <CandidatePolicyGate
          policy={simulatorPolicy}
          isSimulator={true}
          onStartSession={() => setActiveSimulator('session')}
          onCancel={() => setActiveSimulator(null)}
        />
      </div>
    );
  }

  if (activeSimulator === 'session' && simulatorPolicy) {
    return (
      <div className="w-full">
        <AssessmentSessionContainer
          policy={simulatorPolicy}
          onExit={() => setActiveSimulator(null)}
          onComplete={() => setActiveSimulator(null)}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand/10 text-brand">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Interview & Assessment Policy Center
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure reusable proctoring, hardware requirements, integrity rules, and automated violation triggers.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Policy
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search policies by name, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['ALL', ...Object.values(POLICY_TYPES)].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTypeFilter === type
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type === 'ALL' ? 'All Policies' : type.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPolicies.map((p) => {
          const rules = p.rules || {};
          return (
            <div
              key={p.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                p.enabled
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200/50 dark:border-slate-800/40 opacity-75'
              }`}
            >
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-slate-400">{p.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                        {p.version}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {p.type?.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.name}</h3>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(p.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border transition-colors ${
                      p.enabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300'
                    }`}
                  >
                    {p.enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {p.enabled ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">{p.description}</p>

                {/* Device & Rule Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {rules.camera?.required && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/40">
                      <Camera className="w-3 h-3" /> Camera
                    </span>
                  )}
                  {rules.microphone?.required && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/40">
                      <Mic className="w-3 h-3" /> Microphone
                    </span>
                  )}
                  {rules.screenShare?.required && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200/40">
                      <Monitor className="w-3 h-3" /> Screen Share
                    </span>
                  )}
                  {rules.fullscreen?.required && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-violet-200/40">
                      <Maximize className="w-3 h-3" /> Fullscreen
                    </span>
                  )}
                  {rules.tabSwitch?.detection && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/40">
                      <AlertTriangle className="w-3 h-3" /> Tab Switch ({rules.violationHandling?.maxViolations || 3} max)
                    </span>
                  )}
                  {rules.clipboard?.preventCopy && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/40">
                      <Lock className="w-3 h-3" /> Anti-Copy
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Clock className="w-3 h-3 text-slate-400" /> {rules.timeLimit?.durationMinutes || 60}m
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleStartSimulation(p)}
                  className="px-3 py-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Test Policy as Candidate
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(p.id)}
                    title="Duplicate Policy"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    title="Edit Policy"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    title="Delete Policy"
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-500 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Policy Modal */}
      {isEditModalOpen && selectedPolicyForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" />
                {selectedPolicyForEdit.id ? 'Edit Assessment Policy' : 'Create New Assessment Policy'}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4 text-xs">
              {/* General Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Policy Name</label>
                  <input
                    type="text"
                    required
                    value={selectedPolicyForEdit.name}
                    onChange={(e) => setSelectedPolicyForEdit(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    placeholder="e.g. Senior Tech Interview Policy"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Policy Type</label>
                  <CustomSelect
                    value={selectedPolicyForEdit.type}
                    onChange={(val) => setSelectedPolicyForEdit(prev => ({ ...prev, type: val }))}
                    options={Object.values(POLICY_TYPES).map(t => ({
                      label: t.replace('_', ' ').toUpperCase(),
                      value: t
                    }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={selectedPolicyForEdit.description || ''}
                  onChange={(e) => setSelectedPolicyForEdit(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="Describe the scope and purpose of this policy..."
                />
              </div>

              {/* Hardware & Proctoring Rules Grid */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Hardware & Proctoring Rules
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPolicyForEdit.rules.camera?.required || false}
                      onChange={(e) => setSelectedPolicyForEdit(prev => ({
                        ...prev,
                        rules: { ...prev.rules, camera: { ...prev.rules.camera, required: e.target.checked } }
                      }))}
                      className="rounded text-brand"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Webcam / Camera</span>
                      <p className="text-[11px] text-slate-500">Live camera stream required</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPolicyForEdit.rules.microphone?.required || false}
                      onChange={(e) => setSelectedPolicyForEdit(prev => ({
                        ...prev,
                        rules: { ...prev.rules, microphone: { ...prev.rules.microphone, required: e.target.checked } }
                      }))}
                      className="rounded text-brand"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Microphone</span>
                      <p className="text-[11px] text-slate-500">Audio input monitoring required</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPolicyForEdit.rules.screenShare?.required || false}
                      onChange={(e) => setSelectedPolicyForEdit(prev => ({
                        ...prev,
                        rules: { ...prev.rules, screenShare: { ...prev.rules.screenShare, required: e.target.checked } }
                      }))}
                      className="rounded text-brand"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Screen Sharing</span>
                      <p className="text-[11px] text-slate-500">Candidate desktop stream required</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPolicyForEdit.rules.fullscreen?.required || false}
                      onChange={(e) => setSelectedPolicyForEdit(prev => ({
                        ...prev,
                        rules: { ...prev.rules, fullscreen: { ...prev.rules.fullscreen, required: e.target.checked } }
                      }))}
                      className="rounded text-brand"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Fullscreen Lock</span>
                      <p className="text-[11px] text-slate-500">Enforce browser full-screen focus</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPolicyForEdit.rules.tabSwitch?.detection || false}
                      onChange={(e) => setSelectedPolicyForEdit(prev => ({
                        ...prev,
                        rules: { ...prev.rules, tabSwitch: { ...prev.rules.tabSwitch, detection: e.target.checked } }
                      }))}
                      className="rounded text-brand"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Tab Switch Detection</span>
                      <p className="text-[11px] text-slate-500">Flag candidate window switches</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPolicyForEdit.rules.clipboard?.preventCopy || false}
                      onChange={(e) => setSelectedPolicyForEdit(prev => ({
                        ...prev,
                        rules: { ...prev.rules, clipboard: { ...prev.rules.clipboard, preventCopy: e.target.checked, preventPaste: e.target.checked, preventContextMenu: e.target.checked } }
                      }))}
                      className="rounded text-brand"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Clipboard & Anti-Copy</span>
                      <p className="text-[11px] text-slate-500">Block copy, paste, and right-click</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Timing & Violation Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={selectedPolicyForEdit.rules.timeLimit?.durationMinutes || 60}
                    onChange={(e) => setSelectedPolicyForEdit(prev => ({
                      ...prev,
                      rules: { ...prev.rules, timeLimit: { ...prev.rules.timeLimit, durationMinutes: parseInt(e.target.value, 10) || 60 } }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Action on Max Violations</label>
                  <CustomSelect
                    value={selectedPolicyForEdit.rules.violationHandling?.actionOnThreshold || VIOLATION_ACTIONS.WARNING}
                    onChange={(val) => setSelectedPolicyForEdit(prev => ({
                      ...prev,
                      rules: { ...prev.rules, violationHandling: { ...prev.rules.violationHandling, actionOnThreshold: val } }
                    }))}
                    options={Object.values(VIOLATION_ACTIONS).map(a => ({
                      label: a.replace('_', ' ').toUpperCase(),
                      value: a
                    }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
