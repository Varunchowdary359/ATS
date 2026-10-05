import React, { useState, useContext } from 'react';
import { MOCK_HOLIDAY_LISTS, MOCK_HOLIDAY_EVENTS } from '../companyAdminMockData';
import { CalendarDays, Plus, Search, Edit3, Trash2, ChevronDown, ChevronUp, MapPin, Download, Save, Filter, X } from 'lucide-react';
import { useToast } from '../../shared/ToastContext';
import { ThemeContext } from '../../../ThemeContext';
import ConfirmModal from '../shared/ConfirmModal';
import { ModernPageHeader, ModernMetricsStrip, ModernEmptyState, DrawerSection, DrawerField } from '../shared/ModernAdminLayoutComponents';
import { FileCheck, Calendar } from 'lucide-react';
import CustomSelect from '../../dashboard/shared/CustomSelect';

const HolidayListManagement = () => {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#2563eb';
  const [lists, setLists] = useState(MOCK_HOLIDAY_LISTS);
  const [events, setEvents] = useState(MOCK_HOLIDAY_EVENTS);
  const [expandedListId, setExpandedListId] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  const [showListDrawer, setShowListDrawer] = useState(false);
  const [showEventDrawer, setShowEventDrawer] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    year: 2026,
    restrictedLimit: 4,
    locationNames: ['Bangalore HQ'],
    status: 'Active'
  });

  const [eventForm, setEventForm] = useState({
    date: '2026-10-02',
    name: '',
    dayOfWeek: 'Friday',
    type: 'Mandatory',
    region: 'All Locations'
  });

  const [initialFormData, setInitialFormData] = useState(formData);
  const [initialEventForm, setInitialEventForm] = useState(eventForm);

  const [isSavingList, setIsSavingList] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const hasListChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
  const hasEventChanges = JSON.stringify(eventForm) !== JSON.stringify(initialEventForm);

  const filteredLists = lists.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeEvents = events
    .filter(e => e.listId === expandedListId)
    .filter(e => filterType === 'All' || e.type.includes(filterType));

  const handleAddList = (e) => {
    e.preventDefault();
    if (!formData.name) {
      addToast({ title: 'Validation Error', message: 'List name is required.', type: 'error' });
      return;
    }
    
    setIsSavingList(true);
    setTimeout(() => {
      const newObj = {
        id: Date.now(),
        name: formData.name,
        year: formData.year,
        totalHolidays: 0,
        mandatoryCount: 0,
        optionalLimit: formData.restrictedLimit,
        locationNames: formData.locationNames,
        status: 'Active'
      };
      setLists([...lists, newObj]);
      setExpandedListId(newObj.id);
      setIsSavingList(false);
      setShowListDrawer(false);
      addToast({ title: 'Holiday List Created', message: `${formData.name} created successfully.`, type: 'success' });
    }, 600);
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!eventForm.name) {
      addToast({ title: 'Validation Error', message: 'Event name is required.', type: 'error' });
      return;
    }

    setIsSavingEvent(true);
    setTimeout(() => {
      const newEvt = {
        id: Date.now(),
        listId: expandedListId,
        ...eventForm
      };
      setEvents([...events, newEvt]);
      setLists(lists.map(l => l.id === expandedListId ? {
        ...l,
        totalHolidays: l.totalHolidays + 1,
        mandatoryCount: eventForm.type === 'Mandatory' ? l.mandatoryCount + 1 : l.mandatoryCount
      } : l));

      setIsSavingEvent(false);
      setShowEventDrawer(false);
      addToast({ title: 'Holiday Entry Saved', message: `${eventForm.name} added to calendar.`, type: 'success' });
    }, 600);
  };

  const confirmDeleteEvent = () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setEvents(events.filter(e => e.id !== eventToDelete.id));
      addToast({ title: 'Holiday Entry Removed', message: `${eventToDelete.name} deleted.`, type: 'success' });
      setEventToDelete(null);
      setIsDeleting(false);
    }, 600);
  };

  const handleExportCSV = (listName) => {
    setIsExporting(true);
    setTimeout(() => {
      const csvRows = ['Date,Day,Holiday Name,Type,Region'];
      activeEvents.forEach(e => csvRows.push(`"${e.date}","${e.dayOfWeek}","${e.name}","${e.type}","${e.region}"`));
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${listName.replace(/\s+/g, '_')}_2026.csv`;
      a.click();
      setIsExporting(false);
      addToast({ title: 'Calendar Exported', message: `Downloaded CSV for ${listName}.`, type: 'success' });
    }, 800);
  };

  if (showListDrawer) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0f111a] animate-fade-in relative z-10 overflow-y-auto overflow-x-hidden scrollbar-none">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <div className="flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                <button onClick={() => setShowListDrawer(false)} className="hover:text-blue-600 transition-colors">Holiday Lists</button>
                <span className="mx-2">/</span>
                <span className="text-slate-600 dark:text-slate-300">Create List</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Create Holiday List</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure annual holiday list for target office locations</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowListDrawer(false)} disabled={isSavingList} className="h-9 px-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
              <button 
                onClick={handleAddList} 
                disabled={isSavingList || !hasListChanges}
                style={{ backgroundColor: brandColor }}
                className="h-9 px-4 rounded-xl font-bold text-white text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all hover:brightness-110"
              >
                <Save className="w-4 h-4" /> {isSavingList ? 'Creating...' : (!hasListChanges ? 'No Changes' : 'Create List')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <DrawerSection title="Identity" description="Holiday list name">
              <DrawerField label="Holiday List Name" required>
                <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. India Corporate Holidays 2026" className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
              </DrawerField>
            </DrawerSection>
            <DrawerSection title="Configuration" description="Year and optional limits">
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Applicable Year">
                  <input type="number" value={formData.year} onChange={e=>setFormData({...formData, year: parseInt(e.target.value)||2026})} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </DrawerField>
                <DrawerField label="Optional Holiday Limit">
                  <input type="number" value={formData.restrictedLimit} onChange={e=>setFormData({...formData, restrictedLimit: parseInt(e.target.value)||0})} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </DrawerField>
              </div>
            </DrawerSection>
          </div>
        </div>
      </div>
    );
  }

  if (showEventDrawer) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0f111a] animate-fade-in relative z-10 overflow-y-auto overflow-x-hidden scrollbar-none">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <div className="flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                <button onClick={() => setShowEventDrawer(false)} className="hover:text-blue-600 transition-colors">Holiday List Events</button>
                <span className="mx-2">/</span>
                <span className="text-slate-600 dark:text-slate-300">Add Entry</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add Holiday Date Entry</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add a mandatory or optional holiday entry to list calendar</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowEventDrawer(false)} disabled={isSavingEvent} className="h-9 px-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
              <button 
                onClick={handleAddEvent} 
                disabled={isSavingEvent || !hasEventChanges}
                style={{ backgroundColor: brandColor }}
                className="h-9 px-4 rounded-xl font-bold text-white text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all hover:brightness-110"
              >
                <Save className="w-4 h-4" /> {isSavingEvent ? 'Saving...' : (!hasEventChanges ? 'No Changes' : 'Save Entry')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <DrawerSection title="Event Details" description="Date and type of holiday">
              <DrawerField label="Holiday Event Name" required>
                <input type="text" value={eventForm.name} onChange={e=>setEventForm({...eventForm, name: e.target.value})} placeholder="e.g. Gandhi Jayanti" className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
              </DrawerField>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Date" required>
                  <input type="date" value={eventForm.date} onChange={e=>setEventForm({...eventForm, date: e.target.value})} className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
                </DrawerField>
                <DrawerField label="Holiday Type">
                  <CustomSelect value={eventForm.type} onChange={val=>setEventForm({...eventForm, type: val})} options={[{label: 'Mandatory', value: 'Mandatory'}, {label: 'Restricted / Optional', value: 'Restricted / Optional'}]} />
                </DrawerField>
              </div>
            </DrawerSection>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      <ModernPageHeader
        title="Holiday Lists & Regional Events"
        subtitle="Configure annual mandatory and restricted / optional holiday calendars for office locations."
        icon={<CalendarDays className="w-5 h-5 text-white" />}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search holiday lists..."
        primaryActionLabel="Add Holiday List"
        onPrimaryAction={() => {
          const newForm = { name: '', year: 2026, restrictedLimit: 4, locationNames: ['Bangalore HQ'], status: 'Active' };
          setFormData(newForm);
          setInitialFormData(newForm);
          setShowListDrawer(true);
        }}
        themeColor={brandColor}
      />

      <ModernMetricsStrip
        stats={[
          { label: 'Total Lists', value: lists.length, sub: 'Active holiday sets', icon: <CalendarDays className="w-4 h-4" /> },
          { label: 'Total Holidays', value: events.length, sub: 'Across all regions', icon: <MapPin className="w-4 h-4" /> },
          { label: 'Mandatory', value: events.filter(e=>e.type==='Mandatory').length, sub: 'Global off days', icon: <FileCheck className="w-4 h-4" /> },
          { label: 'Restricted', value: events.filter(e=>e.type!=='Mandatory').length, sub: 'Optional days', icon: <Calendar className="w-4 h-4" /> }
        ]}
      />

      {/* Holiday Lists Stack */}
      <div className="flex flex-col gap-4">
        {filteredLists.length === 0 ? (
          <ModernEmptyState 
            title="No holiday lists found" 
            subtitle="No calendars match your search criteria." 
            icon={CalendarDays}
          />
        ) : (
        filteredLists.map((list) => {
          const isExpanded = expandedListId === list.id;
          return (
            <div key={list.id} className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
              {/* Header */}
              <div 
                onClick={() => setExpandedListId(isExpanded ? null : list.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-sm shrink-0">
                    {list.year}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{list.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {list.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {list.locationNames.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {list.mandatoryCount} Mandatory
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {list.optionalLimit} Optional Max
                    </span>
                  </div>

                  <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Sub-table Drawer (Holiday Entries) */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-blue-500" />
                        Individual Event Entries ({activeEvents.length})
                      </h4>

                      {/* Filter Tabs */}
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 ml-2">
                        {['All', 'Mandatory', 'Restricted'].map(t => (
                          <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            style={{ backgroundColor: filterType === t ? brandColor : undefined }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              filterType === t ? 'text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportCSV(list.name)}
                        disabled={isExporting || activeEvents.length === 0}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-500" /> {isExporting ? 'Exporting...' : 'Export CSV'}
                      </button>

                      <button 
                        onClick={(e) => { 
                          e.stopPropagation();
                          const evtForm = { date: '2026-10-02', name: '', dayOfWeek: 'Friday', type: 'Mandatory', region: 'All Locations' };
                          setEventForm(evtForm);
                          setInitialEventForm(evtForm);
                          setShowEventDrawer(true); 
                        }} 
                        style={{ backgroundColor: brandColor }}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold text-white shadow-sm transition-all cursor-pointer hover:brightness-110"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Date Entry
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <th className="px-6 py-3.5">Date</th>
                          <th className="px-6 py-3.5">Day of Week</th>
                          <th className="px-6 py-3.5">Holiday Name</th>
                          <th className="px-6 py-3.5">Holiday Type</th>
                          <th className="px-6 py-3.5">Applicable Region</th>
                          <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        {activeEvents.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-8">
                              <ModernEmptyState 
                                title="No holiday events" 
                                subtitle="No entries match your current filters." 
                                icon={CalendarDays}
                              />
                            </td>
                          </tr>
                        ) : (
                        activeEvents.map((evt) => (
                          <tr key={evt.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-6 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">{evt.date}</td>
                            <td className="px-6 py-3.5 font-medium text-slate-600 dark:text-slate-400">{evt.dayOfWeek}</td>
                            <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white text-sm">{evt.name}</td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                evt.type === 'Mandatory'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              }`}>
                                {evt.type}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-500">{evt.region}</td>
                            <td className="px-6 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-normal">
                                <button onClick={() => setEventToDelete(evt)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })
        )}
      </div>



      <ConfirmModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={confirmDeleteEvent}
        isLoading={isDeleting}
        title="Delete Holiday Event"
        message={`Are you sure you want to delete ${eventToDelete?.name}?`}
        confirmText="Delete Event"
        confirmVariant="danger"
      />
    </div>
  );
};

export default HolidayListManagement;
