import React, { useState, useContext } from 'react';
import { MOCK_EMPLOYMENT_TYPES } from '../companyAdminMockData';
import { Plus, Search, Edit3, Trash2, Save, Users, Shield, Heart } from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import ModernCenterModal from '../shared/ModernCenterModal';
import ConfirmModal from '../shared/ConfirmModal';
import { ModernPageHeader, ModernMetricsStrip, ModernEmptyState, DrawerSection, DrawerField } from '../shared/ModernAdminLayoutComponents';
import CustomSelect from '../../dashboard/shared/CustomSelect';

const EmploymentTypeManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [types, setTypes] = useState(MOCK_EMPLOYMENT_TYPES);
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#1C51A1';

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    isStatutory: true,
    isBenefits: true,
    isOvertime: false,
    weeklyHours: 40.0,
    employeeCount: 0,
    description: ''
  });
  const [initialFormData, setInitialFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const filtered = types.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingType(null);
    const newForm = { code: `EMP-TYPE-0${types.length + 1}`, name: '', isStatutory: true, isBenefits: true, isOvertime: false, weeklyHours: 40.0, employeeCount: 0, status: 'Active', description: '' };
    setFormData(newForm);
    setInitialFormData(newForm);
    setShowDrawer(true);
  };

  const handleOpenEdit = (type) => {
    setEditingType(type);
    const editForm = { ...type };
    setFormData(editForm);
    setInitialFormData(editForm);
    setShowDrawer(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast({ title: 'Validation Error', message: 'Code and Name are required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingType) {
        setTypes(types.map(t => t.id === editingType.id ? { ...t, ...formData } : t));
        addToast({ title: 'Employment Type Updated', message: `${formData.name} updated.`, type: 'success' });
      } else {
        setTypes([...types, { id: Date.now(), ...formData }]);
        addToast({ title: 'Employment Type Created', message: `${formData.name} added.`, type: 'success' });
      }
      setIsSaving(false);
      setShowDrawer(false);
    }, 600);
  };

  const confirmDeleteType = () => {
    if (!typeToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setTypes(types.filter(t => t.id !== typeToDelete.id));
      addToast({ title: 'Employment Type Deleted', message: `${typeToDelete.name} deleted.`, type: 'success' });
      setTypeToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      <ModernPageHeader
        title="Employment Types"
        subtitle="Configure employment classifications, benefits eligibility, and statutory compliance defaults."
        icon={<Plus className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employment types..."
        primaryActionLabel="Add Employment Type"
        onPrimaryAction={handleOpenAdd}
        themeColor={brandColor}
      />

      <ModernMetricsStrip
        stats={[
          { label: 'Total Types', value: types.length, sub: 'Active classifications', icon: <Plus className="w-4 h-4" /> },
          { label: 'Total Employees', value: types.reduce((acc, d) => acc + d.employeeCount, 0), sub: 'Assigned staff', icon: <Users className="w-4 h-4" /> },
          { label: 'Statutory Eligible', value: types.filter(t=>t.isStatutory).length, sub: 'PF/ESI applicable', icon: <Shield className="w-4 h-4" /> },
          { label: 'Benefits Eligible', value: types.filter(t=>t.isBenefits).length, sub: 'Full benefits package', icon: <Heart className="w-4 h-4" /> }
        ]}
      />

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="px-6 py-3.5">Code</th>
              <th className="px-6 py-3.5">Classification Name</th>
              <th className="px-6 py-3.5">Weekly Hours</th>
              <th className="px-6 py-3.5">Benefits Eligible</th>
              <th className="px-6 py-3.5">Statutory PF/ESI</th>
              <th className="px-6 py-3.5">Employees</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8">
                  <ModernEmptyState 
                    title="No employment types found" 
                    subtitle="No classifications match your search criteria." 
                    icon={Users}
                  />
                </td>
              </tr>
            ) : (
            filtered.map((t) => (
              <tr key={t.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-3.5 font-mono font-bold" style={{ color: brandColor }}>{t.code}</td>
                <td className="px-6 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</div>
                  </td>
                  <td className="px-6 py-3.5 font-mono font-semibold text-slate-800 dark:text-slate-200">{t.weeklyHours} hrs/wk</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${t.isBenefits ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {t.isBenefits ? 'Eligible' : 'Ineligible'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${t.isStatutory ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {t.isStatutory ? 'Applicable' : 'Exempt'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{t.employeeCount} emp</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity font-normal py-0.5">
                      <button onClick={() => handleOpenEdit(t)} title="Edit Classification" className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setTypeToDelete(t)} title="Delete Classification" className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>

      {/* Center Modal */}
      <ModernCenterModal
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={editingType ? 'Edit Employment Type' : 'Create Employment Type'}
        subtitle="Configure work hours, benefits eligibility, and statutory flags"
        actions={
          <>
            <button type="button" onClick={() => setShowDrawer(false)} disabled={isSaving} className="h-9 px-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-50 cursor-pointer">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || (!hasChanges && !!editingType)}
              className="h-9 px-4 rounded-xl font-bold text-white shadow-sm text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              style={{ backgroundColor: (!hasChanges && !!editingType) ? '#94a3b8' : brandColor }}
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Processing...' : (editingType ? (!hasChanges ? 'No Changes' : 'Save Changes') : 'Create Type')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <DrawerField label="Code" required>
            <input type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Classification Name" required>
            <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. Full-Time Regular" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Status">
            <CustomSelect value={formData.status} onChange={val=>setFormData({...formData, status: val})} options={[{label: 'Active', value: 'Active'}, {label: 'Inactive', value: 'Inactive'}]} size="lg" />
          </DrawerField>
        </div>
      </ModernCenterModal>

      <ConfirmModal
        isOpen={!!typeToDelete}
        onClose={() => setTypeToDelete(null)}
        onConfirm={confirmDeleteType}
        isLoading={isDeleting}
        title="Delete Employment Type"
        message={`Are you sure you want to delete ${typeToDelete?.name}?`}
        confirmText="Delete Classification"
        confirmVariant="danger"
      />
    </div>
  );
};

export default EmploymentTypeManagement;
