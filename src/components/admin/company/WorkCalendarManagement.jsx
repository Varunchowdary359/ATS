import React, { useState, useContext } from 'react';
import { MOCK_WORK_CALENDARS } from '../companyAdminMockData';
import { Clock, Plus, Search, Edit3, Trash2, CalendarDays, Star, CheckCircle2, X, Save, Users, MapPin, Briefcase } from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import ModernCenterModal from '../shared/ModernCenterModal';
import ConfirmModal from '../shared/ConfirmModal';
import { ModernPageHeader,  ModernMetricsStrip,
  ModernEmptyState,
  DrawerSection,
  DrawerField,
} from '../shared/ModernAdminLayoutComponents';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WorkCalendarManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#2563eb';
  const [calendars, setCalendars] = useState(MOCK_WORK_CALENDARS);
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingCal, setEditingCal] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    locationName: 'Bangalore HQ',
    workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    shiftTiming: '09:00 AM – 06:00 PM',
    flexiBand: '08:00 AM – 10:00 AM',
    dailyHours: 8.0,
    employeeCount: 0,
    isDefault: false,
    status: 'Active'
  });
  const [initialFormData, setInitialFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [calToDelete, setCalToDelete] = useState(null);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const filtered = calendars.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCal(null);
    const newForm = { code: `CAL-NEW-0${calendars.length + 1}`, name: '', locationName: 'Bangalore HQ', workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], shiftTiming: '09:00 AM – 06:00 PM', flexiBand: '08:00 AM – 10:00 AM', dailyHours: 8.0, employeeCount: 0, isDefault: false, status: 'Active' };
    setFormData(newForm);
    setInitialFormData(newForm);
    setShowDrawer(true);
  };

  const handleOpenEdit = (cal) => {
    setEditingCal(cal);
    const editForm = { ...cal };
    setFormData(editForm);
    setInitialFormData(editForm);
    setShowDrawer(true);
  };

  const toggleDay = (day) => {
    const current = formData.workDays || [];
    if (current.includes(day)) {
      setFormData({ ...formData, workDays: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, workDays: [...current, day] });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast({ title: 'Validation Error', message: 'Calendar Code and Name are required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingCal) {
        setCalendars(calendars.map(c => c.id === editingCal.id ? { ...c, ...formData } : c));
        addToast({ title: 'Calendar Updated', message: `${formData.name} updated successfully.`, type: 'success' });
      } else {
        setCalendars([...calendars, { id: Date.now(), ...formData }]);
        addToast({ title: 'Calendar Created', message: `${formData.name} added.`, type: 'success' });
      }
      setIsSaving(false);
      setShowDrawer(true);
    }, 600);
  };

  const confirmDelete = () => {
    if (!calToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setCalendars(calendars.filter(c => c.id !== calToDelete.id));
      addToast({ title: 'Calendar Deleted', message: `${calToDelete.name} deleted.`, type: 'success' });
      setCalToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      <ModernPageHeader
        title="Work Calendars & Shift Hours"
        subtitle="Configure weekly work schedules, shift timings, flexi-time windows, and location calendar defaults."
        icon={<Clock className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search schedules..."
        primaryActionLabel="Add Work Calendar"
        onPrimaryAction={handleOpenAdd}
        themeColor={brandColor}
      />

      <ModernMetricsStrip
        stats={[
          { label: 'Total Calendars', value: calendars.length, sub: 'Active work schedules', icon: <CalendarDays className="w-4 h-4" /> },
          { label: 'Total Employees', value: calendars.reduce((acc, c) => acc + c.employeeCount, 0), sub: 'Assigned staff', icon: <Users className="w-4 h-4" /> },
          { label: 'Locations Covered', value: new Set(calendars.map(c=>c.locationName)).size, sub: 'Global offices', icon: <MapPin className="w-4 h-4" /> },
          { label: 'Default Calendar', value: calendars.find(c=>c.isDefault)?.code || 'None', sub: 'Standard assignment', icon: <Briefcase className="w-4 h-4" /> }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full">
            <ModernEmptyState 
              title="No calendars found" 
              subtitle="No work schedules match your search criteria." 
              icon={CalendarDays}
            />
          </div>
        ) : (
        filtered.map((cal) => (
          <div key={cal.id} className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {cal.code}
                </span>
                {cal.isDefault && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Default Calendar
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">{cal.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cal.locationName}</p>

              {/* Day Chips */}
              <div className="flex items-center gap-1.5 mt-3">
                {ALL_DAYS.map(day => {
                  const active = cal.workDays.includes(day);
                  return (
                    <span key={day} className={`px-2 py-1 rounded-md text-[10px] font-extrabold ${
                      active 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through'
                    }`}>
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Shift Timing:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{cal.shiftTiming}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Flexi-time Window:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{cal.flexiBand}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Assigned Employees:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{cal.employeeCount} employees</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => handleOpenEdit(cal)} className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => setCalToDelete(cal)} className="h-8 px-3 rounded-lg border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Center Modal for Calendar Add / Edit */}
      <ModernCenterModal
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={editingCal ? 'Edit Work Calendar' : 'Create Work Calendar'}
        subtitle="Configure active working days, shift timings, and flexi-band windows"
        actions={
          <>
            <button type="button" onClick={() => setShowDrawer(false)} disabled={isSaving} className="h-9 px-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-50 cursor-pointer">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || (!hasChanges && !!editingCal)}
              className="h-9 px-4 rounded-xl font-bold text-white shadow-sm text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: (!hasChanges && !!editingCal) ? '#94a3b8' : brandColor }}
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Processing...' : (editingCal ? (!hasChanges ? 'No Changes' : 'Save Changes') : 'Create Schedule')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Identity</h4>
            <DrawerField label="Calendar ID" required>
              <input type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
            </DrawerField>
            <DrawerField label="Calendar Schedule Name" required>
              <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. India General 5-Day Work Week" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
            </DrawerField>
          </div>
          
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Schedule Config</h4>
            <div className="col-span-2">
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1.5 text-xs">Active Working Days (Click to toggle)</label>
              <div className="flex flex-wrap items-center gap-2">
                {ALL_DAYS.map(day => {
                  const isSelected = formData.workDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {day} {isSelected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
            <DrawerField label="Shift Timings">
              <input type="text" value={formData.shiftTiming} onChange={e=>setFormData({...formData, shiftTiming: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </DrawerField>
            <DrawerField label="Flexi-band Window">
              <input type="text" value={formData.flexiBand} onChange={e=>setFormData({...formData, flexiBand: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </DrawerField>
          </div>
        </div>
      </ModernCenterModal>

      <ConfirmModal
        isOpen={!!calToDelete}
        onClose={() => setCalToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Work Calendar"
        message={`Are you sure you want to delete ${calToDelete?.name}?`}
        confirmText="Delete Calendar"
        confirmVariant="danger"
      />
    </div>
  );
};

export default WorkCalendarManagement;
