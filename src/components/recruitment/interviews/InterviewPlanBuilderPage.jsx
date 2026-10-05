import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Trash2, MoveUp, MoveDown, Settings, 
  CheckCircle2, Layers, Sparkles, AlertCircle, Copy, Save, 
  Clock, ShieldCheck, FileText, Check, ChevronRight, Search, 
  HelpCircle, Sliders, Briefcase, Eye, Lock, Unlock, Compass,
  Award, ArrowRight, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { 
  ROUND_CATEGORY, 
  ROUND_SUBTYPES, 
  EVALUATION_METHOD,
  INTERVIEW_ROLES,
  INTERVIEW_PERMISSIONS,
  hasInterviewPermission
} from './interviewTypes';
import { interviewService } from './interviewService';
import { SCORECARD_TEMPLATES, INITIAL_INTERVIEW_PLANS } from './interviewMockData';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import SearchableSelect from '../../dashboard/shared/SearchableSelect';
import ModernSearchInput from '../../dashboard/shared/ModernSearchInput';
import { useToast } from '../../shared/ToastContext';

const DURATION_PRESETS = [30, 45, 60, 90, 120];

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design & Creative',
  'Sales & Marketing',
  'People & HR',
  'Finance & Legal',
  'Operations'
];

const CATEGORY_COLORS = {
  [ROUND_CATEGORY.ASSESSMENT]: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    accent: '#f59e0b'
  },
  [ROUND_CATEGORY.INTERVIEW]: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    accent: '#3b82f6'
  },
  [ROUND_CATEGORY.PANEL]: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
    accent: '#8b5cf6'
  },
  [ROUND_CATEGORY.TAKE_HOME]: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/20',
    accent: '#14b8a6'
  },
  [ROUND_CATEGORY.HR_CULTURE]: {
    bg: 'bg-pink-500/10 dark:bg-pink-500/15',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500/20',
    accent: '#ec4899'
  }
};

const MandatoryStar = () => (
  <span className="text-red-500 font-bold ml-0.5">*</span>
);

const InterviewPlanBuilderPage = ({
  onBack,
  currentRole = INTERVIEW_ROLES.ATS_ADMIN,
  currentUserContext = {},
  brandColor = 'var(--pw-brand)'
}) => {
  const { addToast } = useToast();
  const actorName = currentUserContext.name ? `${currentUserContext.name} (${currentUserContext.title || 'Admin'})` : 'ATS Admin';
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [activeRubricPreview, setActiveRubricPreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Load plans & rubric templates on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [loadedPlans, loadedTemplates] = await Promise.all([
          interviewService.getInterviewPlans(),
          interviewService.getScorecardTemplates()
        ]);
        const planList = loadedPlans && loadedPlans.length > 0 ? loadedPlans : INITIAL_INTERVIEW_PLANS;
        const templateList = loadedTemplates && loadedTemplates.length > 0 ? loadedTemplates : SCORECARD_TEMPLATES;
        setPlans(planList);
        setTemplates(templateList);
        if (planList.length > 0) {
          setSelectedPlanId(planList[0].id);
          setSelectedPlan(JSON.parse(JSON.stringify(planList[0])));
        }
      } catch (e) {
        console.error('Failed loading plans', e);
        setPlans(INITIAL_INTERVIEW_PLANS);
        setTemplates(SCORECARD_TEMPLATES);
        setSelectedPlanId(INITIAL_INTERVIEW_PLANS[0].id);
        setSelectedPlan(JSON.parse(JSON.stringify(INITIAL_INTERVIEW_PLANS[0])));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Handle switching active plan
  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    setValidationErrors({});
    const target = plans.find(p => p.id === planId);
    if (target) {
      setSelectedPlan(JSON.parse(JSON.stringify(target)));
    }
  };

  // Live Plan Field Updater (updates active plan + list item simultaneously)
  const handleUpdatePlanField = (field, value) => {
    setSelectedPlan(prev => {
      const updated = { ...prev, [field]: value };
      setPlans(list => list.map(p => p.id === updated.id ? { ...p, [field]: value } : p));
      return updated;
    });

    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Create brand new plan
  const handleCreateNewPlan = () => {
    const newId = `PLAN-${Date.now().toString(36).toUpperCase()}`;
    const newPlanObj = {
      id: newId,
      name: '',
      jobFamily: '',
      department: 'Engineering',
      description: '',
      isActive: true,
      roundsCount: 0,
      rounds: []
    };

    setPlans(prev => [newPlanObj, ...prev]);
    setSelectedPlanId(newPlanObj.id);
    setSelectedPlan(newPlanObj);
    setValidationErrors({});
    addToast({ title: 'New Plan Initialized', message: 'Enter plan details and add evaluation rounds.', type: 'info' });
  };

  const [planToDelete, setPlanToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Duplicate currently selected plan
  const handleDuplicatePlan = () => {
    if (!selectedPlan) return;
    const clonedId = `PLAN-${Date.now().toString(36).toUpperCase()}`;
    const cloned = {
      ...JSON.parse(JSON.stringify(selectedPlan)),
      id: clonedId,
      name: `${selectedPlan.name ? selectedPlan.name : 'Custom Plan'} (Copy)`,
      createdAt: new Date().toISOString()
    };
    // Rename round ids
    cloned.rounds = (cloned.rounds || []).map((r, i) => ({
      ...r,
      id: `RND-${clonedId}-${(i + 1).toString().padStart(2, '0')}`,
      prerequisiteRoundId: i > 0 ? `RND-${clonedId}-${i.toString().padStart(2, '0')}` : null
    }));

    setPlans(prev => [cloned, ...prev]);
    setSelectedPlanId(cloned.id);
    setSelectedPlan(cloned);
    setValidationErrors({});
    addToast({ title: 'Plan Cloned', message: `Created clone: ${cloned.name}`, type: 'success' });
  };

  // Delete plan handler
  const handleDeletePlan = async (plan) => {
    if (!plan) return;
    setIsDeleting(true);
    try {
      const updatedPlans = await interviewService.deleteInterviewPlan(plan.id, actorName);
      setPlans(updatedPlans);
      setPlanToDelete(null);
      addToast({
        title: 'Plan Deleted',
        message: `Hiring plan "${plan.name || 'Untitled Plan'}" has been deleted.`,
        type: 'success'
      });

      // If active plan was deleted, select another plan
      if (selectedPlan?.id === plan.id) {
        if (updatedPlans && updatedPlans.length > 0) {
          setSelectedPlanId(updatedPlans[0].id);
          setSelectedPlan(JSON.parse(JSON.stringify(updatedPlans[0])));
        } else {
          setSelectedPlanId(null);
          setSelectedPlan(null);
        }
      }
    } catch (err) {
      console.error('Failed deleting plan', err);
      addToast({ title: 'Delete Failed', message: err.message || 'Could not delete plan.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Add round to active plan (Starts Clean & Empty as requested)
  const handleAddRound = () => {
    if (!selectedPlan) return;
    const nextSeq = (selectedPlan.rounds?.length || 0) + 1;
    const prevRound = selectedPlan.rounds?.[selectedPlan.rounds.length - 1];
    const newRoundId = `RND-${selectedPlan.id}-${Date.now().toString(36).slice(-4)}`;

    const newRound = {
      id: newRoundId,
      sequence: nextSeq,
      name: '', // Empty fresh title for user input
      category: '', // Empty category to be selected
      subtype: '', // Empty subtype
      duration: '', // Empty duration
      scorecardTemplateId: '', // Empty rubric
      evaluationMethod: EVALUATION_METHOD.RUBRIC_SCORED,
      prerequisiteRoundId: prevRound ? prevRound.id : null,
      requiredToPass: true
    };

    setSelectedPlan(prev => {
      const updatedRounds = [...(prev.rounds || []), newRound];
      const updated = {
        ...prev,
        rounds: updatedRounds,
        roundsCount: updatedRounds.length
      };
      setPlans(list => list.map(p => p.id === updated.id ? updated : p));
      return updated;
    });
  };

  // Remove round from active plan
  const handleRemoveRound = (idx) => {
    if (!selectedPlan) return;
    const updatedRounds = selectedPlan.rounds.filter((_, i) => i !== idx).map((r, i) => ({
      ...r,
      sequence: i + 1,
      prerequisiteRoundId: i === 0 ? null : (r.prerequisiteRoundId || null)
    }));

    setSelectedPlan(prev => {
      const updated = {
        ...prev,
        rounds: updatedRounds,
        roundsCount: updatedRounds.length
      };
      setPlans(list => list.map(p => p.id === updated.id ? updated : p));
      return updated;
    });

    // Clear removed round validation errors
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy[`round_${idx}_name`];
      delete copy[`round_${idx}_category`];
      delete copy[`round_${idx}_duration`];
      delete copy[`round_${idx}_rubric`];
      return copy;
    });
  };

  // Reorder round (Move up / down)
  const handleMoveRound = (idx, direction) => {
    if (!selectedPlan) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= selectedPlan.rounds.length) return;

    const list = [...selectedPlan.rounds];
    const [moved] = list.splice(idx, 1);
    list.splice(targetIdx, 0, moved);

    const reordered = list.map((r, i) => ({
      ...r,
      sequence: i + 1,
      prerequisiteRoundId: i === 0 ? null : list[i - 1].id
    }));

    setSelectedPlan(prev => {
      const updated = { ...prev, rounds: reordered };
      setPlans(pList => pList.map(p => p.id === updated.id ? updated : p));
      return updated;
    });
  };

  // Update round attribute
  const handleUpdateRound = (idx, field, value) => {
    if (!selectedPlan) return;
    const updatedRounds = [...selectedPlan.rounds];
    updatedRounds[idx] = { ...updatedRounds[idx], [field]: value };

    setSelectedPlan(prev => {
      const updated = { ...prev, rounds: updatedRounds };
      setPlans(pList => pList.map(p => p.id === updated.id ? updated : p));
      return updated;
    });

    const errKey = `round_${idx}_${field}`;
    if (validationErrors[errKey]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[errKey];
        return copy;
      });
    }
  };

  // Comprehensive Validation
  const validatePlan = () => {
    const errors = {};
    if (!selectedPlan) return false;

    if (!selectedPlan.name || !selectedPlan.name.trim()) {
      errors.name = 'Plan Name is required.';
    }

    if (!selectedPlan.jobFamily || !selectedPlan.jobFamily.trim()) {
      errors.jobFamily = 'Associated Role / Job Family is required.';
    }

    if (!selectedPlan.department) {
      errors.department = 'Target Department is required.';
    }

    if (!selectedPlan.rounds || selectedPlan.rounds.length === 0) {
      errors.rounds = 'At least 1 evaluation round must be added to the plan.';
    } else {
      selectedPlan.rounds.forEach((r, idx) => {
        if (!r.name || !r.name.trim()) {
          errors[`round_${idx}_name`] = `Round ${idx + 1} Name is required.`;
        }
        if (!r.category) {
          errors[`round_${idx}_category`] = `Round ${idx + 1} Category is required.`;
        }
        if (!r.duration || Number(r.duration) <= 0) {
          errors[`round_${idx}_duration`] = `Round ${idx + 1} Duration must be greater than 0 mins.`;
        }
        if (!r.scorecardTemplateId) {
          errors[`round_${idx}_scorecardTemplateId`] = `Round ${idx + 1} Scorecard Rubric must be selected.`;
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save changes to storage & API
  const handleSavePlan = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPlan) return;

    const isValid = validatePlan();
    if (!isValid) {
      addToast({ 
        title: 'Validation Incomplete', 
        message: 'Please resolve all required fields highlighted in red before saving.', 
        type: 'error' 
      });
      return;
    }

    setIsSaving(true);
    try {
      await interviewService.saveInterviewPlan(selectedPlan, actorName);
      setPlans(prev => prev.map(p => p.id === selectedPlan.id ? selectedPlan : p));
      setValidationErrors({});
      addToast({ 
        title: 'Plan Saved & Published', 
        message: `Hiring workflow for "${selectedPlan.name}" is now active across requisitions.`, 
        type: 'success' 
      });
    } catch (err) {
      console.error('Failed saving plan', err);
      addToast({ title: 'Save Failed', message: err.message || 'Could not save plan.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Total Plan Duration Calculation
  const totalDurationMinutes = useMemo(() => {
    if (!selectedPlan?.rounds) return 0;
    return selectedPlan.rounds.reduce((acc, r) => acc + Number(r.duration || 0), 0);
  }, [selectedPlan]);

  const totalDurationDisplay = useMemo(() => {
    const hours = Math.floor(totalDurationMinutes / 60);
    const mins = totalDurationMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hrs`;
    return `${mins} mins`;
  }, [totalDurationMinutes]);

  // Filtered plans list
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchesSearch = !searchQuery.trim() || 
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (p.jobFamily && p.jobFamily.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.department && p.department.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDept = selectedDeptFilter === 'All' || p.department === selectedDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [plans, searchQuery, selectedDeptFilter]);

  if (isLoading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--pw-brand)] border-t-transparent animate-spin" />
        <span className="text-xs font-semibold">Loading Interview Governance & Plan Designer...</span>
      </div>
    );
  }

  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-24 text-slate-900 dark:text-slate-100 font-sans space-y-6 text-start">
      
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP GOVERNANCE HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4.5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-3.5"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Left: Back Action + Title + Live Stats */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Return to Interviews Hub"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="p-2.5 rounded-xl text-white bg-[var(--pw-brand)] shadow-sm flex items-center justify-center shrink-0">
              <Sliders size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Interview Plan & N-Round Workflow Designer
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                  <ShieldCheck size={12} /> ATS Governance & Rubric Engine
                </span>
              </div>
              <p className="text-xs text-slate-500/90 dark:text-slate-400 mt-0.5">
                Configure dynamic N-stage hiring plans, prerequisite stage gates, evaluation duration budgets, and weighted scoring rubrics.
              </p>
            </div>
          </div>

          {/* Right: Top Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleDuplicatePlan}
              disabled={!selectedPlan}
              className="h-9.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Copy size={14} />
              <span>Clone Plan</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNewPlan}
              className="h-9.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus size={14} />
              <span>New Plan</span>
            </button>

            {selectedPlan && (
              <button
                type="button"
                onClick={() => setPlanToDelete(selectedPlan)}
                className="h-9.5 px-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/60 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Delete this Plan"
              >
                <Trash2 size={14} />
                <span>Delete Plan</span>
              </button>
            )}

            <motion.button 
              type="button"
              onClick={handleSavePlan}
              disabled={isSaving || !selectedPlan}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ backgroundColor: brandColor }}
              className="h-9.5 px-5 text-xs font-extrabold text-white shadow-md shadow-[var(--pw-brand)]/20 hover:brightness-110 rounded-xl border border-white/20 flex items-center gap-2 shrink-0 cursor-pointer transition-all disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSaving ? 'Publishing Plan...' : 'Save Plan Configuration'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Global Validation Alert Banner */}
      {hasErrors && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
          <ShieldAlert size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold block">Cannot Save Plan — Required Information Missing:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-600 dark:text-rose-400">
              {Object.values(validationErrors).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          2. MAIN SPLIT CANVAS (LEFT: NARROW COMPACT SIDEBAR | RIGHT: FULL DESIGNER)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* ─── LEFT COLUMN: COMPACT CONFIGURED PLANS SIDEBAR (w-[290px]) ───────── */}
        <div className="w-full lg:w-[290px] shrink-0 space-y-3">
          
          {/* Plans Search & Department Filters */}
          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Plans Library ({plans.length})
              </span>
              <button
                type="button"
                onClick={handleCreateNewPlan}
                style={{ color: brandColor }}
                className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Plan
              </button>
            </div>

            <ModernSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search plans..."
              size="sm"
            />

            <CustomSelect
              value={selectedDeptFilter}
              onChange={setSelectedDeptFilter}
              options={[
                { label: 'All Departments', value: 'All' },
                ...DEPARTMENTS.map(d => ({ label: d, value: d }))
              ]}
              size="sm"
            />
          </div>

          {/* Plan Cards List - Compact, Scrollable & Dense */}
          <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {filteredPlans.map(plan => {
              const isSelected = selectedPlan?.id === plan.id;
              const roundCount = plan.rounds?.length || plan.roundsCount || 0;
              const planMins = (plan.rounds || []).reduce((acc, r) => acc + Number(r.duration || 0), 0);

              return (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectPlan(plan.id)}
                  style={{
                    borderColor: isSelected ? brandColor : undefined,
                    boxShadow: isSelected ? `0 0 0 1.5px ${brandColor}` : undefined
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden group space-y-1.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Left Accent Strip for active plan */}
                  {isSelected && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: brandColor }}
                    />
                  )}

                  {/* Top Row: Plan Title + Active/Inactive Badge + Trash */}
                  <div className="flex items-center justify-between gap-1.5 pl-1">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {plan.name || 'Untitled Plan'}
                    </h3>

                    <div className="flex items-center gap-1 shrink-0">
                      {plan.isActive !== false ? (
                        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded">
                          Inactive
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanToDelete(plan);
                        }}
                        title="Delete Plan"
                        className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors opacity-50 hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Role • Department */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate pl-1 font-medium">
                    {plan.jobFamily || 'Unassigned Role'} • {plan.department || 'Engineering'}
                  </div>

                  {/* Bottom Row: Rounds Count & Duration Budget */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px] pl-1 font-semibold text-slate-400">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {roundCount} {roundCount === 1 ? 'Round' : 'Rounds'}
                    </span>
                    {planMins > 0 ? (
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
                        <Clock size={10} /> {planMins}m
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">0m</span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {filteredPlans.length === 0 && (
              <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No plans match search.
              </div>
            )}
          </div>

          {/* Governance Info Box */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-[11px]">
              <ShieldCheck size={13} className="text-blue-600 dark:text-blue-400" />
              <span>ATS Governance</span>
            </div>
            <p className="text-[10px] text-blue-700 dark:text-blue-300/90 leading-relaxed">
              Job requisitions inherit configured interview stages and rubrics.
            </p>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: INTERACTIVE PLAN DESIGNER CANVAS (FLEX-1) ─── */}
        <div className="flex-1 min-w-0 space-y-5">
          {selectedPlan ? (
            <div className="space-y-6">
              
              {/* ── SECTION 1: PLAN METADATA & PROMINENT SAVE ACTION ─────── */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs font-extrabold text-xs"
                      style={{ backgroundColor: brandColor }}
                    >
                      {selectedPlan.rounds?.length || 0}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">Plan Specifications & Target Role</h2>
                      <p className="text-xs text-slate-400">Define the title, target department, and operational guidelines</p>
                    </div>
                  </div>

                  {/* Prominent Actions in Section Header */}
                  <div className="flex items-center gap-2.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 cursor-pointer">
                      <span>Status:</span>
                      <input
                        type="checkbox"
                        checked={selectedPlan.isActive !== false}
                        onChange={(e) => handleUpdatePlanField('isActive', e.target.checked)}
                        className="rounded text-[var(--pw-brand)] focus:ring-[var(--pw-brand)] w-4 h-4 cursor-pointer"
                      />
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        selectedPlan.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {selectedPlan.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setPlanToDelete(selectedPlan)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Delete this Plan"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={handleSavePlan}
                      disabled={isSaving}
                      style={{ backgroundColor: brandColor }}
                      className="px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save size={13} />
                      <span>{isSaving ? 'Saving...' : 'Save Plan'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Plan Name <MandatoryStar />
                    </label>
                    <input
                      type="text"
                      value={selectedPlan.name}
                      onChange={(e) => handleUpdatePlanField('name', e.target.value)}
                      placeholder="e.g., Software Engineer Standard Hiring Plan"
                      className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none transition-colors ${
                        validationErrors.name 
                          ? 'border-rose-400 ring-2 ring-rose-400/20' 
                          : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    {validationErrors.name && (
                      <span className="text-[10px] font-bold text-rose-500 mt-1 block">{validationErrors.name}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Associated Role / Job Family <MandatoryStar />
                    </label>
                    <input
                      type="text"
                      value={selectedPlan.jobFamily || ''}
                      onChange={(e) => handleUpdatePlanField('jobFamily', e.target.value)}
                      placeholder="e.g., Senior Frontend Architect / Staff Engineer"
                      className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none transition-colors ${
                        validationErrors.jobFamily 
                          ? 'border-rose-400 ring-2 ring-rose-400/20' 
                          : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    {validationErrors.jobFamily && (
                      <span className="text-[10px] font-bold text-rose-500 mt-1 block">{validationErrors.jobFamily}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Department <MandatoryStar />
                    </label>
                    <CustomSelect
                      value={selectedPlan.department || 'Engineering'}
                      onChange={(val) => handleUpdatePlanField('department', val)}
                      options={DEPARTMENTS.map(d => ({ label: d, value: d }))}
                      size="md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Total Interview Budget
                    </label>
                    <div className="px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400">Calculated Time Budget:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{totalDurationDisplay} ({totalDurationMinutes} mins)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Plan Description & Interviewer Guidelines
                  </label>
                  <textarea
                    rows={2}
                    value={selectedPlan.description || ''}
                    onChange={(e) => handleUpdatePlanField('description', e.target.value)}
                    placeholder="Describe the candidate qualification objectives, panel expectations, and scoring philosophy..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  />
                </div>
              </div>

              {/* ── SECTION 2: INTERACTIVE VISUAL PIPELINE FLOW ───────── */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass size={16} className="text-blue-500" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Visual Hiring Stage Gate Pipeline ({selectedPlan.rounds?.length || 0} Stages)
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Chronological Execution Path
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto scrollbar-none">
                  <div className="flex items-center gap-3 min-w-max py-2">
                    {(selectedPlan.rounds || []).map((round, idx) => {
                      const colorCfg = CATEGORY_COLORS[round.category] || CATEGORY_COLORS[ROUND_CATEGORY.INTERVIEW];
                      const isLast = idx === (selectedPlan.rounds.length - 1);

                      return (
                        <React.Fragment key={round.id || idx}>
                          <div className="flex flex-col items-center gap-1.5 group cursor-default">
                            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs group-hover:border-blue-400 transition-all">
                              <span 
                                className="w-5 h-5 rounded-full text-white font-extrabold text-[10px] flex items-center justify-center shrink-0"
                                style={{ backgroundColor: colorCfg.accent }}
                              >
                                {round.sequence || (idx + 1)}
                              </span>
                              <div className="text-left">
                                <div className="text-xs font-bold text-slate-900 dark:text-white max-w-[140px] truncate">
                                  {round.name || `Round ${idx + 1}`}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {round.duration ? `${round.duration}m` : '0m'} • {round.subtype || round.category || 'Pending Setup'}
                                </div>
                              </div>
                            </div>

                            {/* Prerequisite Tag */}
                            {round.prerequisiteRoundId && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded text-slate-400 flex items-center gap-0.5">
                                <Lock size={9} /> Gate Passed
                              </span>
                            )}
                          </div>

                          {!isLast && (
                            <ArrowRight size={14} className="text-slate-300 dark:text-slate-700 shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}

                    {(!selectedPlan.rounds || selectedPlan.rounds.length === 0) && (
                      <div className="text-xs text-slate-400 font-medium py-3 px-4 italic">
                        No rounds added yet. Click "+ Add Round" below to build your evaluation pipeline.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECTION 3: CONFIGURABLE ROUND CARDS ───────────────── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={18} style={{ color: brandColor }} />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Configured Evaluation Rounds ({selectedPlan.rounds?.length || 0} Total) <MandatoryStar />
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRound}
                    style={{ backgroundColor: brandColor }}
                    className="px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Round</span>
                  </button>
                </div>

                {validationErrors.rounds && (
                  <span className="text-xs font-bold text-rose-500 block">{validationErrors.rounds}</span>
                )}

                <div className="space-y-3.5">
                  {(selectedPlan.rounds || []).map((round, idx) => {
                    const colorCfg = CATEGORY_COLORS[round.category] || CATEGORY_COLORS[ROUND_CATEGORY.INTERVIEW];
                    const selectedRubric = templates.find(t => t.id === round.scorecardTemplateId);
                    const nameErr = validationErrors[`round_${idx}_name`];
                    const catErr = validationErrors[`round_${idx}_category`];
                    const durErr = validationErrors[`round_${idx}_duration`];
                    const rubErr = validationErrors[`round_${idx}_scorecardTemplateId`];

                    return (
                      <motion.div
                        key={round.id || idx}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm space-y-4 text-start relative overflow-hidden"
                      >
                        {/* Top Accent Strip */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{ backgroundColor: colorCfg.accent }}
                        />

                        {/* Round Header Bar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pl-1 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span 
                              className="w-7 h-7 rounded-xl text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                              style={{ backgroundColor: colorCfg.accent }}
                            >
                              {round.sequence || (idx + 1)}
                            </span>

                            <div className="flex-1">
                              <input
                                type="text"
                                value={round.name}
                                onChange={(e) => handleUpdateRound(idx, 'name', e.target.value)}
                                placeholder={`Enter Round ${idx + 1} Name (e.g. Technical Deep-Dive, System Architecture)...`}
                                className={`text-sm font-extrabold text-slate-900 dark:text-white bg-transparent border-b outline-none w-full sm:w-96 px-1 py-0.5 transition-colors ${
                                  nameErr ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                                }`}
                              />
                              {nameErr && (
                                <span className="text-[10px] font-bold text-rose-500 block mt-0.5">{nameErr}</span>
                              )}
                            </div>
                          </div>

                          {/* Reorder & Delete Toolbar */}
                          <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleMoveRound(idx, 'up')}
                              disabled={idx === 0}
                              title="Move Round Earlier"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              <MoveUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveRound(idx, 'down')}
                              disabled={idx === selectedPlan.rounds.length - 1}
                              title="Move Round Later"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              <MoveDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveRound(idx)}
                              title="Remove Round"
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ml-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Round Form Controls (4 Responsive Columns) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-1">
                          
                          {/* 1. Category */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Round Category <MandatoryStar />
                            </label>
                            <CustomSelect
                              value={round.category}
                              placeholder="Select Category..."
                              onChange={(val) => handleUpdateRound(idx, 'category', val)}
                              options={[
                                { label: 'Assessment / Online Test', value: ROUND_CATEGORY.ASSESSMENT },
                                { label: '1:1 Interview', value: ROUND_CATEGORY.INTERVIEW },
                                { label: 'Panel Interview', value: ROUND_CATEGORY.PANEL },
                                { label: 'Take-Home Project', value: ROUND_CATEGORY.TAKE_HOME },
                                { label: 'HR / Culture Alignment', value: ROUND_CATEGORY.HR_CULTURE }
                              ]}
                              size="sm"
                              className={catErr ? 'border-rose-400 ring-2 ring-rose-400/20' : ''}
                            />
                            {catErr && (
                              <span className="text-[10px] font-bold text-rose-500 mt-1 block">{catErr}</span>
                            )}
                          </div>

                          {/* 2. Subtype */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Interview Subtype
                            </label>
                            <CustomSelect
                              value={round.subtype}
                              placeholder="Select Subtype..."
                              onChange={(val) => handleUpdateRound(idx, 'subtype', val)}
                              options={[
                                { label: 'Aptitude & Cognitive', value: ROUND_SUBTYPES.APTITUDE_TEST },
                                { label: 'Coding Assessment', value: ROUND_SUBTYPES.CODING_ASSESSMENT },
                                { label: 'Technical Deep-Dive', value: ROUND_SUBTYPES.TECHNICAL_INTERVIEW },
                                { label: 'System Architecture', value: ROUND_SUBTYPES.SYSTEM_DESIGN },
                                { label: 'Managerial & Behavioral', value: ROUND_SUBTYPES.MANAGERIAL },
                                { label: 'Cultural & HR Fit', value: ROUND_SUBTYPES.CULTURAL_FIT },
                                { label: 'Executive Panel', value: ROUND_SUBTYPES.EXECUTIVE_PANEL }
                              ]}
                              size="sm"
                            />
                          </div>

                          {/* 3. Duration */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Duration (Minutes) <MandatoryStar />
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={15}
                                max={240}
                                step={15}
                                value={round.duration}
                                placeholder="e.g. 60"
                                onChange={(e) => handleUpdateRound(idx, 'duration', e.target.value === '' ? '' : Number(e.target.value))}
                                className={`w-full px-3 py-1.5 text-xs font-bold rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none transition-colors ${
                                  durErr ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-200 dark:border-slate-700'
                                }`}
                              />
                            </div>
                            {durErr && (
                              <span className="text-[10px] font-bold text-rose-500 mt-1 block">{durErr}</span>
                            )}
                          </div>

                          {/* 4. Scorecard Rubric Template */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                              <span>Evaluation Rubric <MandatoryStar /></span>
                              {selectedRubric && (
                                <button
                                  type="button"
                                  onClick={() => setActiveRubricPreview(selectedRubric)}
                                  className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Eye size={10} /> Preview
                                </button>
                              )}
                            </label>
                            <SearchableSelect
                              value={round.scorecardTemplateId}
                              placeholder="Select Scorecard Rubric..."
                              onChange={(val) => handleUpdateRound(idx, 'scorecardTemplateId', val)}
                              options={templates.map(t => ({
                                value: t.id,
                                label: t.name,
                                subtext: `${t.category} • ${t.criteria?.length || 0} Criteria`
                              }))}
                              size="sm"
                              className={rubErr ? 'border-rose-400 ring-2 ring-rose-400/20' : ''}
                            />
                            {rubErr && (
                              <span className="text-[10px] font-bold text-rose-500 mt-1 block">{rubErr}</span>
                            )}
                          </div>
                        </div>

                        {/* Prerequisite Stage Gate Selector */}
                        <div className="pl-1 pt-2 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Lock size={12} className="text-slate-400" /> Prerequisite Gate:
                            </span>

                            {idx === 0 ? (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                None (Initial Entrance Round)
                              </span>
                            ) : (
                              <div className="w-64">
                                <CustomSelect
                                  value={round.prerequisiteRoundId || ''}
                                  onChange={(val) => handleUpdateRound(idx, 'prerequisiteRoundId', val || null)}
                                  options={[
                                    { label: 'No Prerequisite (Direct)', value: '' },
                                    ...selectedPlan.rounds.slice(0, idx).map((prevR, pIdx) => ({
                                      label: `Pass: R${prevR.sequence || (pIdx + 1)} (${prevR.name || 'Round'})`,
                                      value: prevR.id
                                    }))
                                  ]}
                                  size="sm"
                                />
                              </div>
                            )}
                          </div>

                          <span className="text-[11px] font-semibold text-slate-400">
                            Outcome Required: <strong>Pass / Strong Yes</strong>
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom Add Round Button */}
                <button
                  type="button"
                  onClick={handleAddRound}
                  className="w-full py-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Another Evaluation Round to {selectedPlan.name || 'this plan'}</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
              Select or create a hiring plan from the left library to start configuring.
            </div>
          )}
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. STICKY BOTTOM ACTION FOOTER FOR FAST SAVING
      ═══════════════════════════════════════════════════════════════════ */}
      {selectedPlan && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex items-center justify-between px-6 sm:px-12">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Configuring: <strong className="text-[var(--pw-brand)]">{selectedPlan.name || 'Untitled Plan'}</strong>
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {selectedPlan.rounds?.length || 0} Stages ({totalDurationDisplay})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlanToDelete(selectedPlan)}
              className="px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Delete Plan</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>

            <motion.button 
              type="button"
              onClick={handleSavePlan}
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ backgroundColor: brandColor }}
              className="px-6 py-2 text-xs font-extrabold text-white shadow-md shadow-[var(--pw-brand)]/20 hover:brightness-110 rounded-xl border border-white/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSaving ? 'Publishing Plan...' : 'Save Plan Configuration'}</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          4. SCORECARD RUBRIC PREVIEW MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {activeRubricPreview && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" dir="ltr">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden text-start">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeRubricPreview.name}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Category: {activeRubricPreview.category} • {activeRubricPreview.criteria?.length || 0} Weighted Criteria
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveRubricPreview(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {activeRubricPreview.description}
              </p>

              <div className="space-y-2.5 pt-2">
                {(activeRubricPreview.criteria || []).map((crit, idx) => (
                  <div key={crit.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">{crit.name}</span>
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        Weight: {crit.weight}%
                      </span>
                    </div>
                    {crit.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {crit.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveRubricPreview(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. DELETE PLAN CONFIRMATION DIALOG MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {planToDelete && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" dir="ltr">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-start"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Interview Plan?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-extrabold text-slate-900 dark:text-white truncate">
                {planToDelete.name || 'Untitled Plan'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {planToDelete.jobFamily || 'Unassigned Role'} • {planToDelete.rounds?.length || planToDelete.roundsCount || 0} configured rounds • {planToDelete.department || 'Engineering'}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this interview hiring plan from the ATS repository? Any new job requisition will no longer be able to select this workflow.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleDeletePlan(planToDelete)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={13} />
                <span>{isDeleting ? 'Deleting Plan...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default InterviewPlanBuilderPage;
