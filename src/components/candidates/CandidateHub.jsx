import React, { useState, useEffect } from 'react';
import { Users, Layers, UserPlus, Sparkles, Filter, SlidersHorizontal } from 'lucide-react';
import { ModernPageHeader } from '../admin/shared/ModernAdminLayoutComponents';
import CandidateList from './CandidateList';
import CandidateProfile from './CandidateProfile';
import CandidatePipeline from './CandidatePipeline';
import { getStoredCandidates, persistCandidates } from './candidateMockData';
import CreateCandidateModal from './modals/CreateCandidateModal';

const CandidateHub = ({ onNavigate }) => {
  // Master State
  const [candidates, setCandidates] = useState(() => getStoredCandidates());
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Top View Toggle: 'management' (List/Profile) | 'pipeline' (Kanban Board)
  const [currentView, setCurrentView] = useState('management');

  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);

  // Auto-persist candidates on change
  useEffect(() => {
    persistCandidates(candidates);
  }, [candidates]);

  const handleUpdateCandidate = (updatedCand) => {
    setCandidates(prev => prev.map(c => c.id === updatedCand.id ? updatedCand : c));
    if (selectedCandidate && selectedCandidate.id === updatedCand.id) {
      setSelectedCandidate(updatedCand);
    }
  };

  const handleDeleteCandidate = (candId) => {
    setCandidates(prev => prev.filter(c => c.id !== candId));
    if (selectedCandidate && selectedCandidate.id === candId) {
      setSelectedCandidate(null);
    }
  };

  const handleSaveCandidateSuccess = (newCand) => {
    setCandidates(prev => [newCand, ...prev]);
    setSelectedCandidate(newCand); // Auto-open newly created candidate profile
    setShowAddCandidateModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <ModernPageHeader
        icon={<Users className="w-5 h-5 text-white" />}
        title="Candidate Management & Recruitment Pipeline"
        subtitle="360-degree candidate repository, candidate profile, application history, screening evaluations, and pipeline workflow"
        actions={
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => { setCurrentView('management'); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${currentView === 'management' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Candidate Management
              </button>
              <button
                onClick={() => { setCurrentView('pipeline'); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${currentView === 'pipeline' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Candidate Pipeline
              </button>
            </div>

            <button
              onClick={() => setShowAddCandidateModal(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> + Add New Candidate
            </button>
          </div>
        }
      />

      {/* 2. Main Content Body */}
      {selectedCandidate ? (
        <CandidateProfile
          candidate={selectedCandidate}
          onBack={() => setSelectedCandidate(null)}
          onUpdateCandidate={handleUpdateCandidate}
          onDeleteCandidate={handleDeleteCandidate}
        />
      ) : (
        <>
          {currentView === 'management' && (
            <CandidateList
              candidates={candidates}
              onSelectCandidate={(cand) => setSelectedCandidate(cand)}
              onDeleteCandidate={handleDeleteCandidate}
              onAddCandidate={() => setShowAddCandidateModal(true)}
            />
          )}

          {currentView === 'pipeline' && (
            <CandidatePipeline
              candidates={candidates}
              onSelectCandidate={(cand) => setSelectedCandidate(cand)}
              onUpdateCandidate={handleUpdateCandidate}
            />
          )}
        </>
      )}

      {/* Unified Add Candidate Modal */}
      <CreateCandidateModal
        isOpen={showAddCandidateModal}
        onClose={() => setShowAddCandidateModal(false)}
        candidates={candidates}
        onSaveCandidate={handleSaveCandidateSuccess}
      />

    </div>
  );
};

export default CandidateHub;
