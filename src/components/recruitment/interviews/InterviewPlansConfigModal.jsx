import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, Plus, Trash2, MoveUp, MoveDown, Settings, 
  CheckCircle, Layers, Sparkles, AlertCircle, Copy
} from 'lucide-react';
import { 
  ROUND_CATEGORY, 
  ROUND_SUBTYPES, 
  EVALUATION_METHOD 
} from './interviewTypes';
import { interviewService } from './interviewService';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import SearchableSelect from '../../dashboard/shared/SearchableSelect';

const InterviewPlansConfigModal = ({
  isOpen,
  onClose,
  onPlanSaved,
  brandColor = 'var(--pw-brand)'
}) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [planName, setPlanName] = useState('');
  const [associatedRole, setAssociatedRole] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [plansRes, tRes] = await Promise.all([
          interviewService.getInterviewPlans(),
          interviewService.getScorecardTemplates()
        ]);
        setPlans(plansRes);
        setTemplates(tRes);
        if (plansRes.length > 0) {
          handleSelectPlan(plansRes[0]);
        }
      } catch (e) {
        console.error('Error loading plans config', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isOpen]);

  const handleSelectPlan = (p) => {
    setSelectedPlan(p);
    setPlanName(p.name || '');
    setAssociatedRole(p.associatedRole || '');
    setDepartment(p.department || 'Engineering');
    setDescription(p.description || '');
    setRounds(p.rounds || []);
  };

  const handleCreateNewPlan = () => {
    setSelectedPlan({ id: `PLAN-NEW-${Date.now()}` });
    setPlanName('New Custom Hiring Plan');
    setAssociatedRole('Software Engineer / Specialist');
    setDepartment('Engineering');
    setDescription('Custom N-Round hiring lifecycle plan');
    setRounds([
      {
        id: `RND-${Date.now()}-1`,
        sequence: 1,
        name: 'Technical Assessment',
        category: ROUND_CATEGORY.ASSESSMENT,
        subtype: ROUND_SUBTYPES.CODING_ASSESSMENT,
        required: true,
        duration: 60,
        evaluationMethod: EVALUATION_METHOD.HYBRID,
        scorecardTemplateId: 'SCT-TECH-01',
        prerequisiteRoundId: null,
        instructions: 'Live coding assessment'
      }
    ]);
  };

  const handleAddRound = () => {
    const newSeq = rounds.length + 1;
    const newRound = {
      id: `RND-${Date.now()}-${newSeq}`,
      sequence: newSeq,
      name: '',
      category: '',
      subtype: '',
      required: true,
      duration: '',
      evaluationMethod: EVALUATION_METHOD.SCORECARD,
      scorecardTemplateId: '',
      prerequisiteRoundId: rounds.length > 0 ? rounds[rounds.length - 1].id : null,
      instructions: ''
    };
    setRounds([...rounds, newRound]);
  };

  const handleRemoveRound = (idx) => {
    const updated = rounds.filter((_, i) => i !== idx).map((r, i) => ({
      ...r,
      sequence: i + 1
    }));
    setRounds(updated);
  };

  const handleMoveRound = (idx, direction) => {
    if ((direction === -1 && idx === 0) || (direction === 1 && idx === rounds.length - 1)) return;
    const targetIdx = idx + direction;
    const updated = [...rounds];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setRounds(updated.map((r, i) => ({ ...r, sequence: i + 1 })));
  };

  const handleRoundChange = (idx, field, value) => {
    const updated = [...rounds];
    updated[idx] = { ...updated[idx], [field]: value };
    setRounds(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!planName.trim()) return;

    setIsSaving(true);
    try {
      const saved = await interviewService.saveInterviewPlan({
        id: selectedPlan?.id,
        name: planName.trim(),
        associatedRole: associatedRole.trim(),
        department,
        description: description.trim(),
        rounds
      });
      const updatedPlans = await interviewService.getInterviewPlans();
      setPlans(updatedPlans);
      setSelectedPlan(saved);
      onPlanSaved(saved);
      onClose();
    } catch (err) {
      console.error('Failed to save interview plan', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto" dir="ltr">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-6 text-slate-900 dark:text-slate-100 flex flex-col max-h-[94vh] sm:max-h-[90vh] text-start"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs font-extrabold shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Interview Plan & N-Round Builder
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ATS Admin / Governance • Configure dynamic rounds, categories, and prerequisites
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

        {/* Master-Detail Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* Left Plans List */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/50 max-h-[220px] lg:max-h-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Configured Plans</span>
              <button
                type="button"
                onClick={handleCreateNewPlan}
                style={{ backgroundColor: brandColor }}
                className="px-2.5 py-1 text-[11px] font-bold text-white rounded-lg shadow-2xs hover:opacity-90 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>New Plan</span>
              </button>
            </div>

            <div className="space-y-2">
              {plans.map(p => {
                const isSelected = selectedPlan?.id === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => handleSelectPlan(p)}
                    style={isSelected ? { borderColor: brandColor, backgroundColor: 'color-mix(in srgb, var(--pw-brand) 8%, transparent)' } : {}}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{p.associatedRole}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {p.rounds?.length || 0} Rounds
                      </span>
                      <span className="text-[10px] text-slate-400">{p.department}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Plan Form & Dynamic Rounds Editor */}
          <form onSubmit={handleSave} className="lg:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex flex-col bg-white dark:bg-slate-900">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Plan Name <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Associated Role / Job Family
                  </label>
                  <input
                    type="text"
                    value={associatedRole}
                    onChange={e => setAssociatedRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Plan Description & Notes
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Dynamic Rounds Builder */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Configured Rounds ({rounds.length} Total)
                  </h3>
                  <p className="text-[11px] text-slate-400">Order, duration, evaluation rubric, and prerequisite dependency</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddRound}
                  style={{ backgroundColor: brandColor }}
                  className="px-3 py-1 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Round</span>
                </button>
              </div>

              {/* Rounds List */}
              <div className="space-y-3">
                {rounds.map((round, idx) => (
                  <div
                    key={round.id || idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    {/* Top Row: Reorder & Remove */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                          {round.sequence}
                        </span>
                        <input
                          type="text"
                          value={round.name}
                          onChange={e => handleRoundChange(idx, 'name', e.target.value)}
                          placeholder="Round Title..."
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveRound(idx, -1)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <MoveUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === rounds.length - 1}
                          onClick={() => handleMoveRound(idx, 1)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <MoveDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRound(idx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Category, Subtype, Duration, Template */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Category
                        </label>
                        <CustomSelect
                          value={round.category}
                          onChange={val => handleRoundChange(idx, 'category', val)}
                          options={Object.values(ROUND_CATEGORY).map(c => ({ value: c, label: c }))}
                          size="sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Subtype
                        </label>
                        <CustomSelect
                          value={round.subtype}
                          onChange={val => handleRoundChange(idx, 'subtype', val)}
                          options={Object.values(ROUND_SUBTYPES).map(st => ({ value: st, label: st }))}
                          size="sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Duration (Mins)
                        </label>
                        <input
                          type="number"
                          value={round.duration || 60}
                          onChange={e => handleRoundChange(idx, 'duration', Number(e.target.value))}
                          className="w-full h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Scorecard Rubric
                        </label>
                        <CustomSelect
                          value={round.scorecardTemplateId || ''}
                          onChange={val => handleRoundChange(idx, 'scorecardTemplateId', val)}
                          options={templates.map(t => ({ value: t.id, label: t.name }))}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Controls */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 mt-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                style={{ backgroundColor: brandColor }}
                className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving Plan...' : 'Save Plan Configuration'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default InterviewPlansConfigModal;
