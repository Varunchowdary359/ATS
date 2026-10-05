import React, { useState, useContext } from 'react';
import { MOCK_DESIGNATIONS } from '../companyAdminMockData';
import { Award, Plus, Search, Edit3, Trash2, Save, Users, Layers, Building2 } from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import ModernCenterModal from '../shared/ModernCenterModal';
import ConfirmModal from '../shared/ConfirmModal';
import { ModernPageHeader, ModernMetricsStrip, ModernEmptyState, DrawerSection, DrawerField } from '../shared/ModernAdminLayoutComponents';
import CustomSelect from '../../dashboard/shared/CustomSelect';

const DesignationManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [designations, setDesignations] = useState(MOCK_DESIGNATIONS);
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingDesg, setEditingDesg] = useState(null);
  const [desgToDelete, setDesgToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#1C51A1';

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    deptName: 'Software Engineering',
    jobFamily: 'Engineering',
    gradeName: 'Grade G4 (Senior)',
    minSalary: '₹ 1,500,000',
    maxSalary: '₹ 2,500,000',
    employeeCount: 0,
    status: 'Active'
  });
  const [initialFormData, setInitialFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const filtered = designations.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase()) ||
    d.jobFamily.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingDesg(null);
    const newForm = { code: `DESG-NEW-0${designations.length + 1}`, title: '', deptName: 'Software Engineering', jobFamily: 'Engineering', gradeName: 'Grade G4 (Senior)', minSalary: '₹ 1,500,000', maxSalary: '₹ 2,500,000', employeeCount: 0, status: 'Active' };
    setFormData(newForm);
    setInitialFormData(newForm);
    setShowDrawer(true);
  };

  const handleOpenEdit = (desg) => {
    setEditingDesg(desg);
    const editForm = { ...desg };
    setFormData(editForm);
    setInitialFormData(editForm);
    setShowDrawer(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.code) {
      addToast({ title: 'Validation Error', message: 'Code and Title are required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingDesg) {
        setDesignations(designations.map(d => d.id === editingDesg.id ? { ...d, ...formData } : d));
        addToast({ title: 'Designation Updated', message: `${formData.title} updated.`, type: 'success' });
      } else {
        setDesignations([...designations, { id: Date.now(), ...formData }]);
        addToast({ title: 'Designation Created', message: `${formData.title} added.`, type: 'success' });
      }
      setIsSaving(false);
      setShowDrawer(false);
    }, 600);
  };

  const confirmDeleteDesg = () => {
    if (!desgToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setDesignations(designations.filter(d => d.id !== desgToDelete.id));
      addToast({ title: 'Designation Removed', message: `${desgToDelete.title} deleted.`, type: 'success' });
      setDesgToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      <ModernPageHeader
        title="Designations & Job Titles"
        subtitle="Configure standardized job titles, job family taxonomies, and salary band limits."
        icon={<Award className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search designations..."
        primaryActionLabel="Add Designation"
        onPrimaryAction={handleOpenAdd}
        themeColor={brandColor}
      />

      <ModernMetricsStrip
        stats={[
          { label: 'Total Designations', value: designations.length, sub: 'Active job titles', icon: <Award className="w-4 h-4" /> },
          { label: 'Total Employees', value: designations.reduce((acc, d) => acc + d.employeeCount, 0), sub: 'Assigned staff', icon: <Users className="w-4 h-4" /> },
          { label: 'Job Families', value: new Set(designations.map(d=>d.jobFamily)).size, sub: 'Taxonomy categories', icon: <Layers className="w-4 h-4" /> },
          { label: 'Departments', value: new Set(designations.map(d=>d.deptName)).size, sub: 'Active divisions', icon: <Building2 className="w-4 h-4" /> }
        ]}
      />

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="px-6 py-3.5">Code</th>
              <th className="px-6 py-3.5">Designation Title</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Job Family</th>
              <th className="px-6 py-3.5">Grade Level</th>
              <th className="px-6 py-3.5">Standard Salary Band Range</th>
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
                    title="No designations found" 
                    subtitle="No job titles match your search criteria." 
                    icon={Award}
                  />
                </td>
              </tr>
            ) : (
            filtered.map((d) => (
              <tr key={d.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-3.5 font-mono font-bold" style={{ color: brandColor }}>{d.code}</td>
                <td className="px-6 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{d.title}</div>
                  </td>
                <td className="px-6 py-3.5 font-medium text-slate-700 dark:text-slate-300">{d.deptName}</td>
                <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{d.jobFamily}</td>
                <td className="px-6 py-3.5">
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {d.gradeName}
                  </span>
                </td>
                <td className="px-6 py-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                  {d.minSalary} – {d.maxSalary}
                </td>
                <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{d.employeeCount} emp</td>
                <td className="px-6 py-3.5">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                    {d.status}
                  </span>
                </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity font-normal py-0.5">
                      <button onClick={() => handleOpenEdit(d)} title="Edit Designation" className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDesgToDelete(d)} title="Delete Designation" className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer">
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
        title={editingDesg ? 'Edit Designation' : 'Create Designation'}
        subtitle="Manage job title taxonomy, grade level assignments, and salary band limits"
        actions={
          <>
            <button type="button" onClick={() => setShowDrawer(false)} disabled={isSaving} className="h-9 px-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-50 cursor-pointer">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || (!hasChanges && !!editingDesg)}
              className="h-9 px-4 rounded-xl font-bold text-white shadow-sm text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              style={{ backgroundColor: (!hasChanges && !!editingDesg) ? '#94a3b8' : brandColor }}
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Processing...' : (editingDesg ? (!hasChanges ? 'No Changes' : 'Save Changes') : 'Create Designation')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <DrawerField label="Code" required>
            <input type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Designation Title" required>
            <input type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="e.g. Principal Architect" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Status">
            <CustomSelect value={formData.status} onChange={val=>setFormData({...formData, status: val})} options={[{label: 'Active', value: 'Active'}, {label: 'Inactive', value: 'Inactive'}]} size="lg" />
          </DrawerField>
        </div>
      </ModernCenterModal>

      <ConfirmModal
        isOpen={!!desgToDelete}
        onClose={() => setDesgToDelete(null)}
        onConfirm={confirmDeleteDesg}
        isLoading={isDeleting}
        title="Delete Designation"
        message={`Are you sure you want to delete ${desgToDelete?.title}?`}
        confirmText="Delete Designation"
        confirmVariant="danger"
      />
    </div>
  );
};

export default DesignationManagement;
