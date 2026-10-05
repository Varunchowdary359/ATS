import React, { useState, useContext } from 'react';
import { MOCK_GRADES } from '../companyAdminMockData';
import { FileCheck, Plus, Search, Edit3, Trash2, Save, Users, Shield, Calendar } from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import ModernCenterModal from '../shared/ModernCenterModal';
import ConfirmModal from '../shared/ConfirmModal';
import { ModernPageHeader, ModernMetricsStrip, ModernEmptyState, DrawerSection, DrawerField } from '../shared/ModernAdminLayoutComponents';
import CustomSelect from '../../dashboard/shared/CustomSelect';

const GradeManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [grades, setGrades] = useState(MOCK_GRADES);
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [gradeToDelete, setGradeToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#1C51A1';

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    rankOrder: 1,
    minExpYears: 2.0,
    noticePeriodDays: 60,
    probationDays: 90,
    benefitsTier: 'Tier 2 Premium',
    travelTier: 'Economy Class',
    employeeCount: 0,
    status: 'Active'
  });
  const [initialFormData, setInitialFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const filtered = grades.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingGrade(null);
    const newForm = { code: `G${grades.length + 1}`, name: '', rankOrder: grades.length + 1, minExpYears: 2.0, noticePeriodDays: 60, probationDays: 90, benefitsTier: 'Tier 2 Premium', travelTier: 'Economy Class', employeeCount: 0, status: 'Active' };
    setFormData(newForm);
    setInitialFormData(newForm);
    setShowDrawer(true);
  };

  const handleOpenEdit = (grade) => {
    setEditingGrade(grade);
    const editForm = { ...grade };
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
      if (editingGrade) {
        setGrades(grades.map(g => g.id === editingGrade.id ? { ...g, ...formData } : g));
        addToast({ title: 'Grade Updated', message: `${formData.name} updated successfully.`, type: 'success' });
      } else {
        setGrades([...grades, { id: Date.now(), ...formData }]);
        addToast({ title: 'Grade Created', message: `${formData.name} added.`, type: 'success' });
      }
      setIsSaving(false);
      setShowDrawer(false);
    }, 600);
  };

  const confirmDeleteGrade = () => {
    if (!gradeToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setGrades(grades.filter(g => g.id !== gradeToDelete.id));
      addToast({ title: 'Grade Removed', message: `${gradeToDelete.name} deleted.`, type: 'success' });
      setGradeToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      <ModernPageHeader
        title="Grades & Salary Bands"
        subtitle="Configure organizational compensation ranks, notice periods, and benefits entitlements."
        icon={<FileCheck className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search grades..."
        primaryActionLabel="Add Grade Band"
        onPrimaryAction={handleOpenAdd}
        themeColor={brandColor}
      />

      <ModernMetricsStrip
        stats={[
          { label: 'Total Grades', value: grades.length, sub: 'Active rank bands', icon: <FileCheck className="w-4 h-4" /> },
          { label: 'Total Employees', value: grades.reduce((acc, g) => acc + g.employeeCount, 0), sub: 'Assigned staff', icon: <Users className="w-4 h-4" /> },
          { label: 'Highest Tier', value: 'Tier 1', sub: 'Executive benefits', icon: <Shield className="w-4 h-4" /> },
          { label: 'Probation Avg', value: '90 Days', sub: 'Standard duration', icon: <Calendar className="w-4 h-4" /> }
        ]}
      />

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="px-6 py-3.5">Code</th>
              <th className="px-6 py-3.5">Grade Band Name</th>
              <th className="px-6 py-3.5">Rank Order</th>
              <th className="px-6 py-3.5">Notice Period</th>
              <th className="px-6 py-3.5">Probation Days</th>
              <th className="px-6 py-3.5">Benefits Tier</th>
              <th className="px-6 py-3.5">Employees</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-8">
                  <ModernEmptyState 
                    title="No grades found" 
                    subtitle="No salary bands match your search criteria." 
                    icon={FileCheck}
                  />
                </td>
              </tr>
            ) : (
            filtered.map((g) => (
              <tr key={g.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-3.5 font-mono font-bold" style={{ color: brandColor }}>{g.code}</td>
                <td className="px-6 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{g.name}</div>
                  </td>
                  <td className="px-6 py-3.5 font-mono font-semibold text-slate-800 dark:text-slate-200">Rank #{g.rankOrder}</td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{g.noticePeriodDays} Days</td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{g.probationDays} Days</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {g.benefitsTier}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{g.employeeCount} emp</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      {g.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity font-normal py-0.5">
                      <button onClick={() => handleOpenEdit(g)} title="Edit Grade" className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setGradeToDelete(g)} title="Delete Grade" className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer">
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
        title={editingGrade ? 'Edit Grade Band' : 'Create Grade Band'}
        subtitle="Manage rank ordering, notice periods, and benefits entitlements"
        actions={
          <>
            <button type="button" onClick={() => setShowDrawer(false)} disabled={isSaving} className="h-9 px-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-50 cursor-pointer">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || (!hasChanges && !!editingGrade)}
              className="h-9 px-4 rounded-xl font-bold text-white shadow-sm text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              style={{ backgroundColor: (!hasChanges && !!editingGrade) ? '#94a3b8' : brandColor }}
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Processing...' : (editingGrade ? (!hasChanges ? 'No Changes' : 'Save Changes') : 'Create Grade')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <DrawerField label="Code" required>
            <input type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Grade Band Name" required>
            <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. Grade G4 (Senior Professional)" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Status">
            <CustomSelect value={formData.status} onChange={val=>setFormData({...formData, status: val})} options={[{label: 'Active', value: 'Active'}, {label: 'Inactive', value: 'Inactive'}]} size="lg" />
          </DrawerField>
        </div>
      </ModernCenterModal>

      <ConfirmModal
        isOpen={!!gradeToDelete}
        onClose={() => setGradeToDelete(null)}
        onConfirm={confirmDeleteGrade}
        isLoading={isDeleting}
        title="Delete Grade Band"
        message={`Are you sure you want to delete ${gradeToDelete?.name}?`}
        confirmText="Delete Grade"
        confirmVariant="danger"
      />
    </div>
  );
};

export default GradeManagement;
