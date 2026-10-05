/**
 * Enterprise Background Verification (BGV) Integration Service & Mock Adapter
 * PeopleWorks ATS SaaS
 */

import { BGV_STATUS, BGV_PROVIDERS } from './preboardingTypes';

class BgvService {
  constructor() {
    this.storageKey = 'pw_bgv_registry';
  }

  _getStorage() {
    try {
      const data = sessionStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  _saveStorage(data) {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  /**
   * Initiates a background check with an external verification partner
   */
  async startCheck(preboardingId, checkType, providerId = 'authbridge', metadata = {}) {
    await new Promise(r => setTimeout(r, 450));

    const checkId = `BGV-${Date.now().toString().slice(-6)}`;
    const providerObj = BGV_PROVIDERS.find(p => p.id === providerId) || BGV_PROVIDERS[0];

    const checkRecord = {
      id: checkId,
      preboardingId,
      type: checkType,
      providerId: providerObj.id,
      providerName: providerObj.name,
      status: BGV_STATUS.IN_PROGRESS,
      initiatedAt: new Date().toISOString(),
      completedAt: null,
      result: null,
      referenceNumber: `EXT-${providerId.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: metadata.notes || 'Automated background check verification dispatched.',
      turnaroundDays: 2
    };

    const store = this._getStorage();
    if (!store[preboardingId]) store[preboardingId] = [];
    store[preboardingId].push(checkRecord);
    this._saveStorage(store);

    return checkRecord;
  }

  /**
   * Fetches the current execution status of a check
   */
  async getStatus(preboardingId, checkId) {
    await new Promise(r => setTimeout(r, 200));
    const store = this._getStorage();
    const list = store[preboardingId] || [];
    const check = list.find(c => c.id === checkId);
    if (!check) {
      return { status: BGV_STATUS.NOT_STARTED, checkId };
    }
    return {
      status: check.status,
      initiatedAt: check.initiatedAt,
      completedAt: check.completedAt,
      providerName: check.providerName
    };
  }

  /**
   * Retrieves full verification result findings and reports
   */
  async getResult(preboardingId, checkId) {
    await new Promise(r => setTimeout(r, 250));
    const store = this._getStorage();
    const list = store[preboardingId] || [];
    const check = list.find(c => c.id === checkId);
    if (!check) throw new Error(`BGV check '${checkId}' not found.`);

    return {
      checkId: check.id,
      type: check.type,
      status: check.status,
      result: check.result || 'Pending evaluation from provider partner',
      findings: check.findings || [],
      reportUrl: check.reportUrl || null,
      completedAt: check.completedAt
    };
  }

  /**
   * Cancels an active or pending background check
   */
  async cancelCheck(preboardingId, checkId, reason = 'Cancelled by HR Administrator') {
    await new Promise(r => setTimeout(r, 300));
    const store = this._getStorage();
    const list = store[preboardingId] || [];
    const check = list.find(c => c.id === checkId);
    if (!check) throw new Error(`BGV check '${checkId}' not found.`);

    check.status = BGV_STATUS.CANCELLED;
    check.completedAt = new Date().toISOString();
    check.notes = `Check cancelled: ${reason}`;
    this._saveStorage(store);

    return check;
  }

  /**
   * Simulates provider result webhook callback for testing
   */
  async simulatePartnerResolution(preboardingId, checkId, resolution = BGV_STATUS.CLEAR, findings = []) {
    const store = this._getStorage();
    const list = store[preboardingId] || [];
    const check = list.find(c => c.id === checkId);
    if (!check) return null;

    check.status = resolution;
    check.completedAt = new Date().toISOString();
    check.result = resolution === BGV_STATUS.CLEAR ? 'Clear - No Adverse Findings' : 'Discrepancy - Discrepancy Found in Records';
    check.findings = findings.length ? findings : (resolution === BGV_STATUS.CLEAR ? ['Identity matched with government database', 'Prior tenure verified with payroll slips'] : ['Past employment duration discrepancy of 4 months']);
    this._saveStorage(store);
    return check;
  }
}

export const bgvService = new BgvService();
export default bgvService;
