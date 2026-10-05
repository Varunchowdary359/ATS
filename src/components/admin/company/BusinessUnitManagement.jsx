import React, { useState, useContext } from 'react';
import { MOCK_BUSINESS_UNITS } from '../companyAdminMockData';
import { Briefcase, Plus, Save, Layers, Users, DollarSign, Edit3, Trash2, Eye } from 'lucide-react';
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

const BUInspectorDrawer = ({ unit, isOpen, onClose, brandColor }) => (
  <ModernCenterModal
    isOpen={isOpen}
    onClose={onClose}
    title="Business Unit Metadata"
    subtitle={unit?.code || '—'}
    actions={
      <button onClick={onClose} className="h-8.5 px-4 rounded-lg text-xs font-semibold text-white shadow-2xs cursor-pointer" style={{ backgroundColor: brandColor }}>
        Close Inspector
      </button>
    }
  >
    {unit && (
      <div className="flex flex-col gap-5 text-xs">
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Overview</h4>
          <div className="grid grid-cols-2 gap-4">
            <DrawerField label="BU Code">
              <div className="font-mono font-bold h-8 flex items-center text-sm" style={{ color: brandColor }}>{unit.code}</div>
            </DrawerField>
            <DrawerField label="Status">
              <div className="h-8 flex items-center">
                <ModernStatusBadge status={unit.status} />
              </div>
            </DrawerField>
          </div>
          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{unit.name}</h3>
          </div>
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Operational Structure</h4>
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'BU Unique Code', value: unit.code },
              { label: 'Business Unit Leader', value: unit.headName },
              { label: 'Operating Currency', value: unit.currency },
              { label: 'Active Departments', value: `${unit.deptsCount} Depts` },
              { label: 'Active Headcount', value: `${unit.headcount || 120} Employees` },
              { label: 'Operating Domain Status', value: unit.status },
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

const BusinessUnitManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [units, setUnits] = useState(MOCK_BUSINESS_UNITS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [viewMode, setViewMode] = useState('grid');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [inspectUnit, setInspectUnit] = useState(null);
  const [unitToDelete, setUnitToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#2563eb';

  const [formData, setFormData] = useState({
    code: '', name: '', headName: '', currency: 'INR (₹)', headcount: 0, deptsCount: 0, description: '', status: 'Active'
  });
  const [initialFormData, setInitialFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const filtered = units.filter(u => {
    const matchSearch = search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All Statuses' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingUnit(null);
    const newForm = { code: `BU-NEW-0${units.length + 1}`, name: '', headName: '', currency: 'INR (₹)', headcount: 0, deptsCount: 0, description: '', status: 'Active' };
    setFormData(newForm);
    setInitialFormData(newForm);
    setShowDrawer(true);
  };

  const handleOpenEdit = (unit) => {
    setEditingUnit(unit);
    const editForm = { ...unit };
    setFormData(editForm);
    setInitialFormData(editForm);
    setShowDrawer(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast({ title: 'Validation Error', message: 'BU Code and Name are required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingUnit) {
        setUnits(units.map(u => u.id === editingUnit.id ? { ...u, ...formData } : u));
        addToast({ title: 'Business Unit Updated', message: `${formData.name} updated.`, type: 'success' });
      } else {
        setUnits([...units, { id: Date.now(), ...formData }]);
        addToast({ title: 'Business Unit Created', message: `${formData.name} added.`, type: 'success' });
      }
      setIsSaving(false);
      setShowDrawer(false);
    }, 600);
  };

  const confirmDelete = () => {
    if (!unitToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setUnits(units.filter(u => u.id !== unitToDelete.id));
      addToast({ title: 'Business Unit Removed', message: `${unitToDelete.name} deleted.`, type: 'success' });
      setUnitToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="Business Unit Structure & P&L Segments"
        subtitle="Manage corporate business units, divisional heads, operational currency, and sub-department hierarchies"
        icon={<Briefcase className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search BU code or name..."
        filterOptions={['All Statuses', 'Active', 'Inactive']}
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Add Business Unit"
        onPrimaryAction={handleOpenAdd}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Active Business Units', value: units.length, sub: 'P&L operating units', icon: <Briefcase className="w-4 h-4" /> },
          { label: 'Operational Status', value: units.filter(u=>u.status==='Active').length, sub: 'Live active divisions', icon: <Layers className="w-4 h-4" /> },
          { label: 'Total Headcount', value: units.reduce((sum, u) => sum + (u.headcount || 0), 0), sub: 'Assigned workforce', icon: <Users className="w-4 h-4" /> },
          { label: 'Active Currencies', value: '3 Currencies', sub: 'INR, USD, EUR', icon: <DollarSign className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        filtered.length === 0 ? (
          <ModernEmptyState 
            title="No business units found" 
            subtitle="No operating segments match your search criteria." 
            icon={Briefcase}
          />
        ) : (
        <ModernCardGrid totalCount={units.length} filteredCount={filtered.length} resourceName="business units">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Subtle Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                    {u.code}
                  </span>
                  <ModernStatusBadge status={u.status} />
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  {u.name}
                </h3>
                
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Head: <strong className="text-slate-800 dark:text-slate-200 font-bold">{u.headName}</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>{u.deptsCount} Depts</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.headcount || 120} Staff</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Currency: {u.currency}</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setInspectUnit(u)}
                    className="h-7 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs hover:shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" /> Details
                  </button>
                  <button
                    onClick={() => handleOpenEdit(u)}
                    title="Edit Business Unit"
                    className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setUnitToDelete(u)}
                    title="Delete Business Unit"
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
            title="No business units found" 
            subtitle="No operating divisions match your search filter." 
            icon={Briefcase} 
          />
        ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Unit Code & Name</th>
                <th className="px-6 py-3.5">Leader / VP</th>
                <th className="px-6 py-3.5">Departments</th>
                <th className="px-6 py-3.5">Headcount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    <span>{u.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">({u.code})</span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-semibold">{u.headName}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-100">{u.deptsCount} Units</td>
                  <td className="px-6 py-3.5 font-extrabold text-slate-900 dark:text-white">{u.headcount || 120} Staff</td>
                  <td className="px-6 py-3.5">
                    <ModernStatusBadge status={u.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 py-0.5">
                      <button 
                        onClick={() => setInspectUnit(u)} 
                        title="View Details"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(u)} 
                        title="Edit Business Unit"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setUnitToDelete(u)} 
                        title="Delete Business Unit"
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

      <BUInspectorDrawer unit={inspectUnit} isOpen={!!inspectUnit} onClose={() => setInspectUnit(null)} brandColor={brandColor} />

      <ConfirmModal
        isOpen={!!unitToDelete}
        onClose={() => setUnitToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Business Unit"
        message={`Are you sure you want to delete ${unitToDelete?.name}?`}
        confirmText="Delete Business Unit"
      />

      <ModernCenterModal
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={editingUnit ? 'Edit Business Unit' : 'Create Business Unit'}
        subtitle="Configure P&L division name, BU head, and currency"
        actions={
          <>
            <button type="button" onClick={() => setShowDrawer(false)} disabled={isSaving} className="h-8.5 px-3.5 rounded-lg font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-50 cursor-pointer">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || (!hasChanges && !!editingUnit)}
              className="h-8.5 px-3.5 rounded-lg font-semibold text-white shadow-2xs text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              style={{ backgroundColor: (!hasChanges && !!editingUnit) ? '#94a3b8' : brandColor }}
            >
              <Save className="w-3.5 h-3.5" /> {isSaving ? 'Processing...' : (editingUnit ? (!hasChanges ? 'No Changes' : 'Save Business Unit') : 'Create Business Unit')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <DrawerField label="BU Code" required>
            <input type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Business Unit Name" required>
            <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. Technology & Product Solutions" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Division Head / Leader">
            <input type="text" value={formData.headName} onChange={e=>setFormData({...formData, headName: e.target.value})} placeholder="e.g. Rajesh Kumar" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </DrawerField>
        </div>
      </ModernCenterModal>
    </div>
  );
};

export default BusinessUnitManagement;
