import React, { useState, useContext } from 'react';
import { MOCK_LOCATIONS } from '../companyAdminMockData';
import { MapPin, Plus, Globe, Building2, Users, Radar, Edit3, Trash2, Save, Eye } from 'lucide-react';
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

const LocationManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const [locations, setLocations] = useState(MOCK_LOCATIONS);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [viewMode, setViewMode] = useState('grid');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [locToDelete, setLocToDelete] = useState(null);

  const brandColor = activeTheme?.color || '#2563eb';

  const [formData, setFormData] = useState({
    code: '', name: '', type: 'Headquarters', city: '', state: '', country: 'India',
    timezone: 'Asia/Kolkata (UTC+05:30)', geofence: 150, capacity: 200, headcount: 0, status: 'Active'
  });
  const [initialFormData, setInitialFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const filtered = locations.filter(l => {
    const matchSearch = search === '' ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All Types' || l.type === filterType;
    return matchSearch && matchType;
  });

  const handleOpenAdd = () => {
    setEditingLoc(null);
    const newForm = { code: `LOC-NEW-0${locations.length + 1}`, name: '', type: 'Headquarters', city: '', state: '', country: 'India', timezone: 'Asia/Kolkata (UTC+05:30)', geofence: 150, capacity: 200, headcount: 0, status: 'Active' };
    setFormData(newForm);
    setInitialFormData(newForm);
    setShowDrawer(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingLoc(loc);
    const editForm = { ...loc };
    setFormData(editForm);
    setInitialFormData(editForm);
    setShowDrawer(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast({ title: 'Validation Error', message: 'Location Code and Name are required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingLoc) {
        setLocations(locations.map(l => l.id === editingLoc.id ? { ...l, ...formData } : l));
        addToast({ title: 'Location Updated', message: `${formData.name} updated.`, type: 'success' });
      } else {
        setLocations([...locations, { id: Date.now(), ...formData }]);
        addToast({ title: 'Location Created', message: `${formData.name} added.`, type: 'success' });
      }
      setIsSaving(false);
      setShowDrawer(false);
    }, 600);
  };

  const confirmDelete = () => {
    if (!locToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setLocations(locations.filter(l => l.id !== locToDelete.id));
      addToast({ title: 'Location Removed', message: `${locToDelete.name} deleted.`, type: 'success' });
      setLocToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Mid-Level Balanced Header */}
      <ModernPageHeader
        title="Location & Corporate Work Sites"
        subtitle="Manage physical corporate offices, site seat capacity, geofence radius, and regional timezones"
        icon={<MapPin className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search site code, city, or name..."
        filterOptions={['All Types', 'Headquarters', 'Branch Office', 'R&D Center', 'Regional Hub']}
        activeFilter={filterType}
        onFilterChange={setFilterType}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Add Work Site"
        onPrimaryAction={handleOpenAdd}
        themeColor={brandColor}
      />

      {/* Mid-Level Balanced KPI Metrics Strip */}
      <ModernMetricsStrip
        stats={[
          { label: 'Total Work Sites', value: locations.length, sub: 'Global footprint', icon: <Building2 className="w-4 h-4" /> },
          { label: 'Active Facilities', value: locations.filter(l=>l.status==='Active').length, sub: 'Operational hubs', icon: <MapPin className="w-4 h-4" /> },
          { label: 'Total Seat Capacity', value: locations.reduce((sum, l) => sum + (l.capacity || 0), 0), sub: 'Seat inventory', icon: <Users className="w-4 h-4" /> },
          { label: 'Operating Timezones', value: '4 Timezones', sub: 'Regional calendars', icon: <Globe className="w-4 h-4" /> },
        ]}
      />

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' ? (
        filtered.length === 0 ? (
          <ModernEmptyState 
            title="No locations found" 
            subtitle="No work sites match your search criteria." 
            icon={MapPin}
          />
        ) : (
        <ModernCardGrid totalCount={locations.length} filteredCount={filtered.length} resourceName="work sites">
          {filtered.map((loc) => (
            <div
              key={loc.id}
              className="relative overflow-hidden p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Subtle Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                    {loc.code}
                  </span>
                  <ModernStatusBadge status={loc.status} />
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {loc.name}
                </h3>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {loc.type}
                  </span>
                  <span className="text-[11px] text-slate-500">{loc.city}, {loc.country}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                    <Radar className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{loc.geofence}m Radius</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{loc.headcount} / {loc.capacity} Seats</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">{loc.timezone}</span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(loc)}
                    title="Edit Location"
                    className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setLocToDelete(loc)}
                    title="Delete Location"
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
            title="No locations found" 
            subtitle="Try changing your search term or add a new office branch." 
            icon={MapPin}
          />
        ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Branch Location</th>
                <th className="px-6 py-3.5">Workforce Region</th>
                <th className="px-6 py-3.5">Capacity & Util</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.map((loc) => (
                <tr key={loc.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>{loc.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">({loc.code})</span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-semibold">{loc.country} ({loc.timezone})</td>
                  <td className="px-6 py-3.5 font-extrabold text-slate-900 dark:text-white">{loc.headcount} / {loc.capacity} Seats</td>
                  <td className="px-6 py-3.5">
                    <ModernStatusBadge status={loc.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 py-0.5">
                      <button 
                        onClick={() => handleOpenEdit(loc)} 
                        title="Edit Location"
                        className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setLocToDelete(loc)} 
                        title="Delete Location"
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!locToDelete}
        onClose={() => setLocToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Work Site"
        message={`Are you sure you want to remove site ${locToDelete?.name}?`}
        confirmText="Delete Site"
      />

      {/* Center Modal for Location Add / Edit */}
      <ModernCenterModal
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={editingLoc ? 'Edit Location Site' : 'Create Location Site'}
        subtitle="Configure site address, capacity, timezone and geofence radius"
        actions={
          <>
            <button type="button" onClick={() => setShowDrawer(false)} disabled={isSaving} className="h-8.5 px-3.5 rounded-lg font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-50 cursor-pointer">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || (!hasChanges && !!editingLoc)}
              className="h-8.5 px-3.5 rounded-lg font-semibold text-white shadow-2xs text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              style={{ backgroundColor: (!hasChanges && !!editingLoc) ? '#94a3b8' : brandColor }}
            >
              <Save className="w-3.5 h-3.5" /> {isSaving ? 'Processing...' : (editingLoc ? (!hasChanges ? 'No Changes' : 'Save Location') : 'Create Location')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Identity</h4>
            <DrawerField label="Location Code" required>
              <input type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
            </DrawerField>
            <DrawerField label="Location / Site Name" required>
              <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. Bangalore Global HQ" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
            </DrawerField>
          </div>
          
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>
          
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Address</h4>
            <div className="grid grid-cols-2 gap-4">
              <DrawerField label="City">
                <input type="text" value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </DrawerField>
              <DrawerField label="State / Province">
                <input type="text" value={formData.state} onChange={e=>setFormData({...formData, state: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </DrawerField>
            </div>
          </div>
        </div>
      </ModernCenterModal>
    </div>
  );
};

export default LocationManagement;
