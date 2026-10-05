// ══════════════════════════════════════════════════════════════════════════════
// WORKFLOW CONTEXT & ACTIONS — State Layer & Optimistic Mutations
// ══════════════════════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MGR_FEEDBACK_PENDING, 
  MGR_CANDIDATES 
} from '../data/mockData';
import { DatabaseService } from '../../../services/db/DatabaseService';

const WorkflowContext = createContext(null);

const getLiveRequisitions = () => {
  DatabaseService.init();
  const raw = DatabaseService.requisitions || [];
  const apps = DatabaseService.applications || [];

  if (raw.length === 0) return [];

  return raw.map(r => {
    const rApps = apps.filter(a => a.requisitionId === r.id);
    return {
      id: r.id,
      role: r.jobTitle || r.title || r.role || 'Senior Engineer',
      dept: r.department || r.dept || 'Engineering',
      recruiter: r.assignedRecruiter || r.recruiter || 'Sarah Jenkins',
      priority: r.priority || 'medium',
      budget: r.budget || 6500000,
      status: r.status || 'Active',
      slaStatus: r.slaStatus || 'on-track',
      daysOpen: r.daysOpen || 1,
      candidates: rApps.length || r.candidates || 0,
      nextAction: r.status === 'Draft' ? 'Review JD' : r.status === 'Pending Approval' ? 'Approve' : 'Review Applicants',
      syncStatus: 'settled'
    };
  });
};

const getLiveInterviews = () => {
  DatabaseService.init();
  const raw = DatabaseService.interviews || [];
  return raw.map(i => ({
    id: i.id,
    candidate: i.candidateName || i.candidate || 'Candidate',
    role: i.jobTitle || i.role || 'Senior Developer',
    time: i.time || i.startTime || '10:00 AM',
    date: i.date || 'Today',
    round: i.round || i.interviewType || 'Technical',
    link: i.meetingLink || i.link || 'https://meet.google.com/abc-defg-hij',
    syncStatus: 'settled'
  }));
};

export const WorkflowProvider = ({ children }) => {
  const [requisitions, setRequisitions] = useState(() => getLiveRequisitions());
  const [interviews, setInterviews] = useState(() => getLiveInterviews());
  const [feedbackPending, setFeedbackPending] = useState(
    MGR_FEEDBACK_PENDING.map(f => ({ ...f, syncStatus: 'settled' }))
  );
  const [candidates, setCandidates] = useState(MGR_CANDIDATES);

  useEffect(() => {
    const handleDbUpdate = () => {
      setRequisitions(getLiveRequisitions());
      setInterviews(getLiveInterviews());
    };
    window.addEventListener('pw_db_updated', handleDbUpdate);
    return () => window.removeEventListener('pw_db_updated', handleDbUpdate);
  }, []);

  // Active modal state
  const [activeModal, setActiveModal] = useState(null);

  // Open modal helper remembering trigger element for accessibility focus return
  const openWorkflowModal = (type, data = null, triggerRef = null) => {
    const activeEl = triggerRef?.current || document.activeElement;
    setActiveModal({ type, data, triggerEl: activeEl });
  };

  const closeWorkflowModal = () => {
    if (activeModal?.triggerEl && typeof activeModal.triggerEl.focus === 'function') {
      activeModal.triggerEl.focus();
    }
    setActiveModal(null);
  };

  // 1. Optimistic Requisition Creation
  const createRequisition = (newReqData, onSuccessToast, onErrorToast) => {
    const newId = `REQ-${2026 + requisitions.length + 1}`;
    const optimisticReq = {
      id: newId,
      jobTitle: newReqData.role || newReqData.jobTitle,
      role: newReqData.role || newReqData.jobTitle,
      department: newReqData.dept || newReqData.department || 'Engineering',
      dept: newReqData.dept || newReqData.department || 'Engineering',
      status: 'Pending Approval',
      daysOpen: 0,
      candidates: 0,
      nextAction: 'Approve',
      syncStatus: 'settled',
      createdAt: new Date().toISOString()
    };

    // Save to DatabaseService and persist
    DatabaseService.requisitions.unshift(optimisticReq);
    DatabaseService.persistAll();
    setRequisitions(getLiveRequisitions());

    onSuccessToast?.(`Requisition ${newId} created and submitted for approval.`);
  };

  // 2. Optimistic Interview Scheduling
  const scheduleInterview = (ivData, onSuccessToast) => {
    const newIv = {
      id: `IV-${Date.now()}`,
      candidateName: ivData.candidate,
      candidate: ivData.candidate,
      jobTitle: ivData.role || 'Senior Developer',
      role: ivData.role || 'Senior Developer',
      startTime: ivData.time || '10:00 AM',
      time: ivData.time || '10:00 AM',
      date: ivData.date || 'Today',
      round: ivData.round || 'Technical',
      meetingLink: ivData.link || 'https://meet.google.com/abc-defg-hij',
      link: ivData.link || 'https://meet.google.com/abc-defg-hij',
      status: 'Scheduled'
    };

    DatabaseService.interviews.unshift(newIv);
    DatabaseService.persistAll();
    setInterviews(getLiveInterviews());

    onSuccessToast?.(`Interview scheduled with ${ivData.candidate}.`);
  };

  // 3. Optimistic Feedback Submission with Reconciliation Rollback Path
  const submitFeedback = (feedbackId, feedbackData, onSuccessToast, onErrorToast, shouldSimulateError = false) => {
    const targetItem = feedbackPending.find(f => f.id === feedbackId);
    if (!targetItem) return;

    // Optimistically remove from list immediately
    setFeedbackPending(prev => prev.filter(f => f.id !== feedbackId));

    setTimeout(() => {
      if (shouldSimulateError) {
        // Rollback reconciliation: restore soft-deleted item with error toast
        setFeedbackPending(prev => [targetItem, ...prev]);
        onErrorToast?.(`Submission error! Feedback for ${targetItem.candidate} restored to pending list.`);
      } else {
        onSuccessToast?.(`Interview feedback for ${targetItem.candidate} submitted successfully.`);
      }
    }, 600);
  };

  // 4. Update Requisition Status (HR Action)
  const updateRequisitionStatus = (reqId, newStatus, onSuccessToast) => {
    setRequisitions(prev => 
      prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r)
    );
    onSuccessToast?.(`Requisition ${reqId} status updated to ${newStatus}.`);
  };

  return (
    <WorkflowContext.Provider value={{
      requisitions,
      interviews,
      feedbackPending,
      candidates,
      activeModal,
      openWorkflowModal,
      closeWorkflowModal,
      createRequisition,
      scheduleInterview,
      submitFeedback,
      updateRequisitionStatus
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};

const fallbackWorkflowContext = {
  requisitions: [],
  interviews: [],
  feedbackPending: [],
  candidates: [],
  activeModal: null,
  openWorkflowModal: () => {},
  closeWorkflowModal: () => {},
  createRequisition: () => {},
  scheduleInterview: () => {},
  submitFeedback: () => {},
  updateRequisitionStatus: () => {}
};

export const useWorkflowActions = () => {
  const ctx = useContext(WorkflowContext);
  return ctx || fallbackWorkflowContext;
};
