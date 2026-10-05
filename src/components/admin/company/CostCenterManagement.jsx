import React, { useState, useContext } from 'react';
import { MOCK_COST_CENTERS } from '../companyAdminMockData';
import { Wallet, Plus, Save, DollarSign, FileText, PieChart, ShieldCheck, Edit3, Trash2, Eye } from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import ModernCenterModal from '../shared/ModernCenterModal';
import ConfirmModal from '../shared/ConfirmModal';
import {
  ModernPageHeader,
  ModernMetricsStrip,
  ModernCardGrid,
  ModernStatusBadge,
  ModernEmptyState,
  DrawerSection,
  DrawerField,
} from '../shared/ModernAdminLayoutComponents';

const LedgerInspectorDrawer = ({ cc, isOpen, onClose, brandColor }) => (
  <ModernCenterModal
    isOpen={isOpen}
    onClose={onClose}
    title="Financial Ledger & Audit Trail"
    subtitle={cc?.code || '—'}
    actions={
      <button onClick={onClose} className="h-8.5 px-4 rounded-lg text-xs font-semibold text-white shadow-2xs cursor-pointer" style={{ backgroundColor: brandColor }}>
        Close Ledger
      </button>
    }
  >
    {cc && (
      <div className="flex flex-col gap-5 text-xs">
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Overview</h4>
          <div className="grid grid-cols-2 gap-4">
            <DrawerField label="Cost Center Code">
              <div className="font-mono font-bold h-8 flex items-center text-sm" style={{ color: brandColor }}>{cc.code}</div>
            </DrawerField>
            <DrawerField label="Status">
              <div className="h-8 flex items-center">
                <ModernStatusBadge status={cc.status} />
              </div>
            </DrawerField>
          </div>
          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{cc.name}</h3>
          </div>
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Budget Allocation & Spend</h4>
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'Cost Center Code', value: cc.code },
              { label: 'Account Owner / Approver', value: cc.ownerName },
              { label: 'Department Alignment', value: cc.deptName },
              { label: 'Annual FY Budget', value: cc.annualBudget },
              { label: 'YTD Executed Spend', value: cc.ytdSpend },
              { label: 'Spend Utilization Rate', value: `${cc.spendPct}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40 last:border-0">
                <span className="text-slate-500 font-medium">{label}:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </ModernCenterModal>
);

const CostCenterManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [costCenters, setCostCenters] = useState(MOCK_COST_CENTERS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [viewMode, setViewMode] = useState('grid');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingCc, setEditingCc] = useState(null);
  const [selectedLedgerCc, setSelectedLedgerCc] = useState(null);
  const [ccToDelete, setCcToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#2563eb';

  const [formData, setFormData] = useState({
    code: '', name: '', deptName: 'Software Engineering', ownerName: '',
    annualBudget: '₹ 25,000,000', ytdSpend: '₹ 12,000,000', spendPct: 48, currency: 'INR', status: 'Active'
  });
  const [initialFormData, setInitialFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const filtered = costCenters.filter(c => {
    const matchSearch = search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All Statuses' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingCc(null);
    const newForm = { code: `CC-NEW-0${costCenters.length + 1}`, name: '', deptName: 'Software Engineering', ownerName: '', annualBudget: '₹ 25,000,000', ytdSpend: '₹ 12,000,000', spendPct: 48, currency: 'INR', status: 'Active' };
    setFormData(newForm);
    setInitialFormData(newForm);
    setShowDrawer(true);
  };

  const handleOpenEdit = (cc) => {
    setEditingCc(cc);
    const editForm = { ...cc };
    setFormData(editForm);
    setInitialFormData(editForm);
    setShowDrawer(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast({ title: 'Validation Error', message: 'CC Code and Name are required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingCc) {
        setCostCenters(costCenters.map(c => c.id === editingCc.id ? { ...c, ...formData } : c));
        addToast({ title: 'Cost Center Updated', message: `${formData.name} updated.`, type: 'success' });
      } else {
        setCostCenters([...costCenters, { id: Date.now(), ...formData, ownerAvatar: formData.ownerName ? formData.ownerName.split(' ').map(n=>n[0]).join('') : 'CC' }]);
        addToast({ title: 'Cost Center Created', message: `${formData.name} added.`, type: 'success' });
      }
      setIsSaving(false);
      setShowDrawer(false);
    }, 600);
  };

  const confirmDelete = () => {
    if (!ccToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setCostCenters(costCenters.filter(c => c.id !== ccToDelete.id));
      addToast({ title: 'Cost Center Removed', message: `${ccToDelete.name} deleted.`, type: 'success' });
      setCcToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="Cost Centers & Financial Accounts"
        subtitle="Manage department budget allocations, YTD expenditure utilization, and ledger account owners"
        icon={<Wallet className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search cost centers by name, code, or owner..."
        filterOptions={['All Statuses', 'Active', 'Inactive']}
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Add Cost Center"
        onPrimaryAction={handleOpenAdd}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Total Cost Centers', value: costCenters.length, sub: 'Active financial ledgers', icon: <Wallet className="w-4 h-4" /> },
          { label: 'Active Financial Accounts', value: costCenters.filter(c=>c.status==='Active').length, sub: 'Operational accounts', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Aggregate Budget', value: '₹ 85,000,000', sub: 'FY2026 allocation', icon: <DollarSign className="w-4 h-4" /> },
          { label: 'Avg YTD Utilization', value: '54%', sub: 'Healthy spend velocity', icon: <PieChart className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        filtered.length === 0 ? (
          <ModernEmptyState 
            title="No cost centers found" 
            subtitle="No financial accounts match your search criteria." 
            icon={Wallet}
          />
        ) : (
        <ModernCardGrid totalCount={costCenters.length} filteredCount={filtered.length} resourceName="cost centers">
          {filtered.map((cc) => (
            <div
              key={cc.id}
              className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Subtle Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                    {cc.code}
                  </span>
                  <ModernStatusBadge status={cc.status} />
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-500" />
                  {cc.name}
                </h3>
                
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Owner: <strong className="text-slate-800 dark:text-slate-200 font-bold">{cc.ownerName}</strong>
                </div>

                {/* Spend Progress Bar */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>YTD Spend: {cc.ytdSpend}</span>
                    <span className="font-mono text-blue-600">{cc.spendPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${cc.spendPct}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">Annual Budget: {cc.annualBudget}</div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">{cc.deptName}</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedLedgerCc(cc)}
                    className="h-7 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs hover:shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" /> Details
                  </button>
                  <button
                    onClick={() => handleOpenEdit(cc)}
                    title="Edit Cost Center"
                    className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCcToDelete(cc)}
                    title="Delete Cost Center"
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
        /* ── COMPACT DATA TABLE VIEW ── */
        filtered.length === 0 ? (
          <ModernEmptyState 
            title="No cost centers found" 
            subtitle="No financial allocation buckets matched your active query filter." 
            icon={Building} 
          />
        ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Code & Cost Center</th>
                <th className="px-6 py-3.5">Assigned Owner</th>
                <th className="px-6 py-3.5">Total Budget</th>
                <th className="px-6 py-3.5">Burn Rate</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.map((cc) => (
                <tr key={cc.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-blue-500" />
                    <span>{cc.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">({cc.code})</span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-semibold">{cc.ownerName}</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-900 dark:text-white">{cc.annualBudget}</td>
                  <td className="px-6 py-3.5 font-mono font-extrabold text-blue-600 dark:text-blue-400">{cc.ytdSpend} ({cc.spendPct}%)</td>
                  <td className="px-6 py-3.5">
                    <ModernStatusBadge status={cc.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 py-0.5">
                      <button 
                        onClick={() => setSelectedLedgerCc(cc)} 
                        title="View Details"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(cc)} 
                        title="Edit Cost Center"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setCcToDelete(cc)} 
                        title="Delete Cost Center"
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

      <LedgerInspectorDrawer cc={selectedLedgerCc} isOpen={!!selectedLedgerCc} onClose={() => setSelectedLedgerCc(null)} brandColor={brandColor} />

      <ConfirmModal
        isOpen={!!ccToDelete}
        onClose={() => setCcToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Cost Center"
        message={`Are you sure you want to delete cost center ${ccToDelete?.name}?`}
        confirmText="Delete Cost Center"
      />

      <ModernCenterModal
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={editingCc ? 'Edit Cost Center' : 'Create Cost Center'}
        subtitle="Configure account budget, owner, and department code"
        actions={
          <>
            <button type="button" onClick={() => setShowDrawer(false)} disabled={isSaving} className="h-8.5 px-3.5 rounded-lg font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-50 cursor-pointer">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || (!hasChanges && !!editingCc)}
              className="h-8.5 px-3.5 rounded-lg font-semibold text-white shadow-2xs text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              style={{ backgroundColor: (!hasChanges && !!editingCc) ? '#94a3b8' : brandColor }}
            >
              <Save className="w-3.5 h-3.5" /> {isSaving ? 'Processing...' : (editingCc ? (!hasChanges ? 'No Changes' : 'Save Cost Center') : 'Create Cost Center')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <DrawerField label="Cost Center Code" required>
            <input type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Cost Center Name" required>
            <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. Engineering Cloud Infrastructure" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
        </div>
      </ModernCenterModal>
    </div>
  );
};

export default CostCenterManagement;
