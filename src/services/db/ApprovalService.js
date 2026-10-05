import { DatabaseService } from './DatabaseService.js';
import { SanitizerService } from '../security/SanitizerService.js';


export const APPROVAL_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WAITING: 'Waiting', // Next in line
};

class ApprovalServiceImpl {
  /**
   * Initializes a sequential approval chain for a requisition
   */
  initializeRequisitionChain(requisition) {
    const chain = [
      {
        id: 'hiring_manager',
        role: 'Hiring Manager',
        name: requisition.hiringManager || 'Hiring Manager',
        status: APPROVAL_STATUS.APPROVED,
        date: new Date().toISOString(),
        avatar: (requisition.hiringManager || 'HM').slice(0, 2).toUpperCase()
      },
      {
        id: 'dept_head',
        role: 'Department Head',
        name: requisition.department ? `${requisition.department} Director` : 'Department Head',
        status: APPROVAL_STATUS.PENDING,
        date: null,
        avatar: 'DH'
      },
      {
        id: 'finance',
        role: 'Finance Controller',
        name: 'Finance Controller',
        status: APPROVAL_STATUS.WAITING,
        date: null,
        avatar: 'FC'
      },
      {
        id: 'hr',
        role: 'HR / Talent Acquisition',
        name: requisition.hrbp || 'HR Lead',
        status: APPROVAL_STATUS.WAITING,
        date: null,
        avatar: 'HR'
      }
    ];

    return chain;
  }

  /**
   * Approves a step in the chain sequentially with tamper-resistance
   */
  async approveStep(requisitionId, stepId, actor = 'Authorized Approver') {
    DatabaseService.init();
    const reqIndex = DatabaseService.requisitions.findIndex(r => r.id === requisitionId);
    if (reqIndex === -1) throw new Error('Requisition not found');

    const req = DatabaseService.requisitions[reqIndex];
    if (!req.approvalChain) {
      req.approvalChain = this.initializeRequisitionChain(req);
    }

    const chain = [...req.approvalChain];
    const stepIndex = chain.findIndex(s => s.id === stepId);
    
    if (stepIndex === -1) throw new Error('Approval step not found in chain.');
    if (chain[stepIndex].status !== APPROVAL_STATUS.PENDING) {
      throw new Error('Approval workflow violation: This step is not currently pending approval.');
    }

    // Approve current step atomically
    chain[stepIndex].status = APPROVAL_STATUS.APPROVED;
    chain[stepIndex].date = new Date().toISOString();
    chain[stepIndex].approverName = actor;

    DatabaseService.logSecurityEvent({
      actor,
      action: 'REQUISITION_STEP_APPROVED',
      resource: 'Requisition',
      resourceId: requisitionId,
      details: `Step ${chain[stepIndex].role} approved by ${actor}`
    });

    // Activate next step
    if (stepIndex + 1 < chain.length) {
      chain[stepIndex + 1].status = APPROVAL_STATUS.PENDING;
      
      // Dispatch notification to next approver
      await DatabaseService.createNotification(
        'Approval Required',
        `Requisition ${req.title} requires your approval.`,
        chain[stepIndex + 1].role,
        req.id
      );
    } else {
      // All steps approved -> Requisition Approved
      req.status = 'Approved';
      DatabaseService.logSecurityEvent({
        actor,
        action: 'REQUISITION_FULLY_APPROVED',
        resource: 'Requisition',
        resourceId: requisitionId,
        details: `Requisition ${req.title} completed all approval stages.`
      });

      await DatabaseService.createNotification(
        'Requisition Approved',
        `Requisition ${req.title} is fully approved.`,
        'All',
        req.id
      );
    }

    req.approvalChain = chain;
    DatabaseService.persistAll();
    return req;
  }

  /**
   * Rejects a step in the chain with sanitized comments
   */
  async rejectStep(requisitionId, stepId, reason, actor = 'Authorized Approver') {
    DatabaseService.init();
    const reqIndex = DatabaseService.requisitions.findIndex(r => r.id === requisitionId);
    if (reqIndex === -1) throw new Error('Requisition not found');

    const req = DatabaseService.requisitions[reqIndex];
    if (!req.approvalChain) return req;

    const chain = [...req.approvalChain];
    const stepIndex = chain.findIndex(s => s.id === stepId);
    
    if (stepIndex === -1) throw new Error('Approval step not found');

    const sanitizedReason = SanitizerService.sanitizeText(reason || 'Rejected during review');

    chain[stepIndex].status = APPROVAL_STATUS.REJECTED;
    chain[stepIndex].date = new Date().toISOString();
    chain[stepIndex].rejectionComment = sanitizedReason;
    chain[stepIndex].approverName = actor;

    req.status = 'Rejected';
    req.approvalChain = chain;
    req.rejectionComment = sanitizedReason;

    DatabaseService.logSecurityEvent({
      actor,
      action: 'REQUISITION_STEP_REJECTED',
      resource: 'Requisition',
      resourceId: requisitionId,
      details: `Requisition ${req.title} rejected by ${actor}. Reason: ${sanitizedReason}`
    });

    await DatabaseService.createNotification(
      'Requisition Rejected',
      `Requisition ${req.title} was rejected by ${actor}. Reason: ${sanitizedReason}`,
      'All',
      req.id
    );

    DatabaseService.persistAll();
    return req;
  }
}

export const ApprovalService = new ApprovalServiceImpl();

