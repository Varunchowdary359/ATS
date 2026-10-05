import React, { useState, useContext } from 'react';
import { MOCK_DEPARTMENTS } from '../companyAdminMockData';
import { Layers, Plus, Search, Edit3, Trash2, Users, Building2, Network, X, GitBranch, Save } from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import ModernCenterModal from '../shared/ModernCenterModal';
import ConfirmModal from '../shared/ConfirmModal';
import { ModernPageHeader,  ModernCardGrid,
  ModernEmptyState,
  DrawerSection,
  DrawerField,
} from '../shared/ModernAdminLayoutComponents';

const DepartmentManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [departments, setDepartments] = useState(MOCK_DEPARTMENTS);
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptToDelete, setDeptToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#1C51A1';

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    parentDept: 'Executive Leadership',
    headName: '',
    costCenterCode: 'CC-ENG-101',
    headcount: 0,
    status: 'Active'
  });
  const [initialFormData, setInitialFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const filtered = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase()) ||
    d.headName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = (parentName = 'Executive Leadership') => {
    setEditingDept(null);
    const newForm = { code: `DEP-NEW-0${departments.length + 1}`, name: '', parentDept: parentName, headName: '', costCenterCode: 'CC-ENG-101', headcount: 0, status: 'Active' };
    setFormData(newForm);
    setInitialFormData(newForm);
    setShowDrawer(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    const editForm = { ...dept };
    setFormData(editForm);
    setInitialFormData(editForm);
    setShowDrawer(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast({ title: 'Validation Error', message: 'Dept Code and Name are required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingDept) {
        setDepartments(departments.map(d => d.id === editingDept.id ? { ...d, ...formData } : d));
        addToast({ title: 'Department Updated', message: `${formData.name} updated successfully.`, type: 'success' });
      } else {
        const newObj = { id: Date.now(), ...formData, headAvatar: formData.headName ? formData.headName.split(' ').map(n=>n[0]).join('') : 'DP' };
        setDepartments([...departments, newObj]);
        addToast({ title: 'Department Created', message: `${formData.name} added to org hierarchy.`, type: 'success' });
      }
      setIsSaving(false);
      setShowDrawer(false);
    }, 600);
  };

  const confirmDeleteDept = () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setDepartments(departments.filter(d => d.id !== deptToDelete.id));
      addToast({ title: 'Department Deleted', message: `${deptToDelete.name} has been removed.`, type: 'success' });
      setDeptToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      <ModernPageHeader
        title="Department Management"
        subtitle="Define organizational divisions, parent hierarchies, heads of department and cost centers."
        icon={<Layers className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search departments..."
        primaryActionLabel="Add Department"
        onPrimaryAction={handleOpenAdd}
        themeColor={brandColor}
      />
      
      <ModernMetricsStrip
        stats={[
          { label: 'Total Departments', value: departments.length, sub: 'Active divisions', icon: <Building2 className="w-4 h-4" /> },
          { label: 'Total Headcount', value: departments.reduce((acc, d) => acc + d.headcount, 0), sub: 'Active employees', icon: <Users className="w-4 h-4" /> },
          { label: 'Active Cost Centers', value: new Set(departments.map(d=>d.costCenterCode)).size, sub: 'Budget allocations', icon: <Layers className="w-4 h-4" /> },
          { label: 'Sub-Departments', value: departments.filter(d=>d.parentDept !== 'Executive Leadership').length, sub: 'Nested divisions', icon: <GitBranch className="w-4 h-4" /> }
        ]}
      />
      
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowOrgChart(true)}
          className="flex items-center gap-2 h-9 px-3.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
        >
          <Network className="w-4 h-4" style={{ color: brandColor }} /> Org Chart Tree
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="px-6 py-3.5">Dept Code</th>
              <th className="px-6 py-3.5">Department Name</th>
              <th className="px-6 py-3.5">Parent Dept</th>
              <th className="px-6 py-3.5">Department Head</th>
              <th className="px-6 py-3.5">Cost Center</th>
              <th className="px-6 py-3.5">Headcount</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8">
                  <ModernEmptyState 
                    title="No departments found" 
                    subtitle="No organizational divisions match your search criteria." 
                    icon={Building2}
                  />
                </td>
              </tr>
            ) : (
            filtered.map((dept) => (
              <tr key={dept.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-3.5 font-mono font-bold" style={{ color: brandColor }}>{dept.code}</td>
                <td className="px-6 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{dept.name}</div>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-600 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                      {dept.parentDept}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full text-[10px] font-extrabold flex items-center justify-center" style={{ backgroundColor: `${brandColor}20`, color: brandColor }}>
                        {dept.headAvatar}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{dept.headName}</div>
                        <div className="text-[10px] text-slate-400">{dept.headRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {dept.costCenterCode}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{dept.headcount}</span>
                    <span className="text-[10px] text-slate-400 ml-1">emp</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                      {dept.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity font-normal py-0.5">
                      <button onClick={() => handleOpenAdd(dept.name)} title="Add Sub-Department" className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-200 dark:hover:border-indigo-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer">
                        <GitBranch className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleOpenEdit(dept)} title="Edit Department" className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeptToDelete(dept)} title="Delete Department" className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer">
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
        title={editingDept ? 'Edit Department' : 'Create Department'}
        subtitle="Configure organizational details, head of department and cost center"
        actions={
          <>
            <button type="button" onClick={() => setShowDrawer(false)} disabled={isSaving} className="h-9 px-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-50 cursor-pointer">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || (!hasChanges && !!editingDept)}
              className="h-9 px-4 rounded-xl font-bold text-white shadow-sm text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              style={{ backgroundColor: (!hasChanges && !!editingDept) ? '#94a3b8' : brandColor }}
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Processing...' : (editingDept ? (!hasChanges ? 'No Changes' : 'Save Changes') : 'Create Department')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <DrawerField label="Dept Code" required>
            <input type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
          <DrawerField label="Department Name" required>
            <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. Quality Assurance" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </DrawerField>
        </div>
      </ModernCenterModal>

      {/* Centered Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deptToDelete}
        onClose={() => setDeptToDelete(null)}
        onConfirm={confirmDeleteDept}
        isLoading={isDeleting}
        title="Delete Department"
        message={`Are you sure you want to delete ${deptToDelete?.name}? This action will remove the department from organizational hierarchy.`}
        confirmText="Delete Department"
        confirmVariant="danger"
      />
    </div>
  );
};

export default DepartmentManagement;
