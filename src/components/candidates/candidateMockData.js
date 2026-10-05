import { calculateScreeningScore } from '../recruitment/intake/resumeIntakeMockData';

export const PIPELINE_STAGES = [
  { id: 'Applied', label: 'Applied', color: '#3b82f6', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { id: 'Screening', label: 'Screening', color: '#f59e0b', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { id: 'Shortlisted', label: 'Shortlisted', color: '#8b5cf6', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { id: 'Interview', label: 'Interview', color: '#ec4899', bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  { id: 'Offer', label: 'Offer', color: '#06b6d4', bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  { id: 'Joined', label: 'Joined', color: '#10b981', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { id: 'Rejected', label: 'Rejected', color: '#ef4444', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' }
];

export const INITIAL_CANDIDATES = [];

// Master Loader & Storage Sync
export const getStoredCandidates = () => {
  try {
    if (typeof window !== 'undefined') {
      const savedCand = localStorage.getItem('pw_candidates') || sessionStorage.getItem('pw_candidates');
      let candidateList = savedCand ? JSON.parse(savedCand) : [];
      // Filter out any old mock seed records
      candidateList = candidateList.filter(c => c && c.id && !c.id.startsWith('CND-100'));
      return candidateList;
    }
  } catch (e) {}
  return [];
};

export const persistCandidates = (candidates) => {
  try {
    if (typeof window !== 'undefined' && Array.isArray(candidates)) {
      const dataStr = JSON.stringify(candidates);
      sessionStorage.setItem('pw_candidates', dataStr);
      localStorage.setItem('pw_candidates', dataStr);
    }
  } catch (e) {}
};
