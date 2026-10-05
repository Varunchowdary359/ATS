import React, { useState, useContext, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronDown, CheckSquare, Square, LayoutTemplate, 
  Edit2, Trash2, ChevronLeft, ChevronRight, UserCheck, CheckCircle2, XCircle, Archive, Eye, X,
  Search, Columns3, RotateCcw, Check, SlidersHorizontal
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from './CustomSelect';

const DataTable = ({ 
  columns = [], 
  data = [], 
  title = "Requisitions Data Grid",
  selectable = true,
  onRowClick,
  onInspect,
  onEdit,
  onDelete,
  onDeleteSelected,
  onBulkAction,
  onSelectionChange,
  borderless = false
}) => {
  const { activeTheme } = useContext(ThemeContext);
  const [density, setDensity] = useState('compact');
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [showColPicker, setShowColPicker] = useState(false);
  const [colSearch, setColSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [colPickerStyle, setColPickerStyle] = useState({});
  const colPickerRef = useRef(null);

  const brandColor = activeTheme?.color || '#1A56DB';

  // Keep visibleColumns synced with columns prop
  useEffect(() => {
    if (columns && columns.length > 0) {
      setVisibleColumns(columns.map(c => c.accessor || c.key || c.id));
    }
  }, [columns]);

  // Reset row selection when data changes
  useEffect(() => {
    setSelectedRows([]);
  }, [data]);

  const updateColPickerPosition = () => {
    if (colPickerRef.current && showColPicker) {
      const rect = colPickerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popoverWidth = Math.min(260, viewportWidth - 24);
      const popoverHeight = 350;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const flip = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

      let calculatedRight = viewportWidth - rect.right;
      let calculatedLeft = undefined;

      if (rect.right - popoverWidth < 12) {
        calculatedLeft = 12;
        calculatedRight = undefined;
      }
      if (calculatedRight !== undefined && calculatedRight < 12) {
        calculatedRight = 12;
      }

      setColPickerStyle({
        position: 'fixed',
        top: flip ? undefined : rect.bottom + 6,
        bottom: flip ? viewportHeight - rect.top + 6 : undefined,
        right: calculatedRight,
        left: calculatedLeft,
        width: `${popoverWidth}px`,
        maxWidth: `calc(100vw - 24px)`,
        zIndex: 999999
      });
    }
  };

  useLayoutEffect(() => {
    if (showColPicker) {
      updateColPickerPosition();
      window.addEventListener('scroll', updateColPickerPosition, true);
      window.addEventListener('resize', updateColPickerPosition);
      return () => {
        window.removeEventListener('scroll', updateColPickerPosition, true);
        window.removeEventListener('resize', updateColPickerPosition);
      };
    }
  }, [showColPicker]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.closest('[data-portal-colpicker]')) return;
      if (colPickerRef.current && !colPickerRef.current.contains(e.target)) {
        setShowColPicker(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowColPicker(false);
    };
    if (showColPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showColPicker]);

  const toggleColumn = (accessor) => {
    setVisibleColumns(prev => 
      prev.includes(accessor) ? prev.filter(c => c !== accessor) : [...prev, accessor]
    );
  };

  const activeCols = columns.filter(c => visibleColumns.includes(c.accessor || c.key || c.id));

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (onSelectionChange) {
      const selectedItems = selectedRows.map(i => paginatedData[i]).filter(Boolean);
      onSelectionChange(selectedItems);
    }
  }, [selectedRows, currentPage, pageSize, data]);

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map((_, i) => i));
    }
  };

  const toggleRow = (index) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter(i => i !== index));
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

  const filteredColumnsForPicker = columns.filter(col => {
    const title = col.header || col.label || col.name || col.title || '';
    return title.toLowerCase().includes((colSearch || '').toLowerCase());
  });

  const cellPadding = density === 'compact' ? 'px-3 py-2' : 'px-3.5 py-3';
  const headerPadding = density === 'compact' ? 'px-3 py-2' : 'px-3.5 py-2.5';
  const hasCustomActions = columns.some(c => (c.accessor || c.key) === 'actions' || (c.header || c.label)?.toLowerCase() === 'actions');
  const shouldRenderDefaultActions = (onInspect || onEdit || onDelete) && !hasCustomActions;

  return (
    <div className={`w-full font-sans transition-all duration-200 ${borderless ? '' : 'bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'}`}>
      
      {/* Top Controls Toolbar */}
      <div className="p-3.5 sm:px-4 border-b border-[#E2E8F0] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]/60 dark:bg-slate-900/60 rounded-t-2xl">
        
        {/* Left Side: Title & Badge & Selection Count */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-white tracking-tight font-sans">
            {title}
          </h2>
          <span className="px-2 py-0.5 text-[10px] font-bold font-mono text-[#64748B] dark:text-slate-400 bg-[#E2E8F0]/70 dark:bg-slate-800 rounded-full">
            {data.length} Records
          </span>

          {selectedRows.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700"
            >
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                {selectedRows.length} selected
              </span>
              {onDeleteSelected && (
                <button
                  type="button"
                  onClick={() => onDeleteSelected(selectedRows.map(i => paginatedData[i]).filter(Boolean))}
                  className="px-2 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Trash2 size={12} />
                  <span>{selectedRows.length > 1 ? `Delete All (${selectedRows.length})` : 'Delete'}</span>
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0">
          
          {/* Density Toggle */}
          <div className="flex items-center p-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-lg text-xs font-medium border border-slate-200/80 dark:border-slate-700/80">
            <button 
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${density === 'compact' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
            >
              Compact
            </button>
            <button 
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${density === 'comfortable' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
            >
              Comfortable
            </button>
          </div>

          {/* Customize View / Column Picker */}
          <div className="relative" ref={colPickerRef}>
            <button 
              type="button"
              onClick={() => setShowColPicker(!showColPicker)}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal size={13} className="text-slate-500" />
              <span>Customize View</span>
            </button>

            {/* Column Picker Popover Portal */}
            {typeof document !== 'undefined' && createPortal(
              <AnimatePresence>
                {showColPicker && (
                  <motion.div 
                    data-portal-colpicker="true"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={colPickerStyle}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-3 space-y-2 font-sans"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Customize Columns</span>
                      <button 
                        type="button"
                        onClick={() => setVisibleColumns(columns.map(c => c.accessor || c.key || c.id))} 
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={10} />
                        <span>Reset</span>
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search columns..." 
                        value={colSearch}
                        onChange={(e) => setColSearch(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1.5 scrollbar-thin pb-1">
                      {filteredColumnsForPicker.map(col => {
                        const colKey = col.accessor || col.key || col.id;
                        const isVisible = visibleColumns.includes(colKey);
                        return (
                          <button
                            key={colKey}
                            type="button"
                            onClick={() => toggleColumn(colKey)}
                            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group cursor-pointer"
                          >
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                              {col.header || col.label || col.name || col.title || colKey}
                            </span>
                            
                            {/* Micro Toggle Switch */}
                            <div 
                              style={isVisible ? { backgroundColor: brandColor } : {}}
                              className={`w-6.5 h-3.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 flex items-center ${
                                isVisible ? '' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                                isVisible ? 'translate-x-3' : 'translate-x-0'
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[550px] relative scrollbar-thin rounded-b-xl">
        <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
          <thead className="sticky top-0 z-30 bg-[#F8FAFC] dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800">
            <tr className="border-b border-[#E2E8F0] dark:border-slate-800 text-[#64748B] dark:text-slate-400 font-semibold">
              {selectable && (
                <th className={`w-10 ${headerPadding} sticky left-0 z-30 bg-[#F8FAFC] dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]`}>
                  <button 
                    type="button"
                    onClick={toggleSelectAll} 
                    className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 shadow-2xs ${
                      selectedRows.length === paginatedData.length && paginatedData.length > 0
                        ? 'text-white border-transparent' 
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400'
                    }`}
                    style={selectedRows.length === paginatedData.length && paginatedData.length > 0 ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                    title={selectedRows.length === paginatedData.length && paginatedData.length > 0 ? "Deselect All" : "Select All"}
                  >
                    {selectedRows.length === paginatedData.length && paginatedData.length > 0 && (
                      <Check size={11} strokeWidth={3} className="text-white" />
                    )}
                  </button>
                </th>
              )}
              {activeCols.map((col) => {
                const colKey = col.accessor || col.key || col.id;
                const isActionsCol = colKey === 'actions' || (col.header || col.label)?.toLowerCase() === 'actions' || col.isStickyRight;
                const alignClass = isActionsCol || col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
                const justifyClass = isActionsCol || col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start';
                return (
                  <th 
                    key={colKey} 
                    className={`${headerPadding} text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400 whitespace-nowrap ${alignClass} ${
                      isActionsCol 
                        ? 'sticky right-0 z-30 bg-[#F8FAFC] dark:bg-slate-900 w-28 border-l border-slate-200/60 dark:border-slate-800/60 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)]' 
                        : ''
                    }`}
                  >
                    <div className={`flex items-center gap-1 cursor-pointer hover:text-[#0F172A] dark:hover:text-white transition-colors ${justifyClass}`}>
                      {col.header || col.label || col.name || col.title}
                      {!isActionsCol && <ChevronDown size={11} className="opacity-40" />}
                    </div>
                  </th>
                );
              })}
              {shouldRenderDefaultActions && (
                <th className={`w-28 ${headerPadding} text-center text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400 sticky right-0 z-30 bg-[#F8FAFC] dark:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800/60 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)]`}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]/80 dark:divide-slate-800/80 text-[#0F172A] dark:text-slate-200 font-sans">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => {
                const isSelected = selectedRows.includes(rowIndex);
                return (
                  <tr 
                    key={row.id || rowIndex}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`group transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''} ${
                      isSelected 
                        ? 'bg-[#F0F9FF] dark:bg-blue-950/20' 
                        : 'hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {selectable && (
                      <td 
                        className={`${cellPadding} align-middle sticky left-0 z-20 transition-colors border-r border-slate-200/60 dark:border-slate-800/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] ${
                          isSelected 
                            ? 'bg-[#F0F9FF] dark:bg-[#131f37]' 
                            : 'bg-white dark:bg-slate-900 group-hover:bg-[#F8FAFC] dark:group-hover:bg-slate-800/70'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          type="button"
                          onClick={() => toggleRow(rowIndex)} 
                          className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 shadow-2xs ${
                            isSelected
                              ? 'text-white border-transparent shadow-xs' 
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400'
                          }`}
                          style={isSelected ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                          title={isSelected ? "Deselect Row" : "Select Row"}
                        >
                          {isSelected && (
                            <Check size={11} strokeWidth={3} className="text-white" />
                          )}
                        </button>
                      </td>
                    )}
                    {activeCols.map((col) => {
                      const colKey = col.accessor || col.key || col.id;
                      const isActionsCol = colKey === 'actions' || (col.header || col.label)?.toLowerCase() === 'actions' || col.isStickyRight;
                      const alignClass = isActionsCol || col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
                      const rawVal = row[colKey];
                      const content = col.render ? col.render(rawVal, row) : rawVal;
                      return (
                        <td 
                          key={colKey} 
                          className={`${cellPadding} font-medium text-slate-800 dark:text-slate-200 align-middle ${alignClass} ${
                            isActionsCol 
                              ? `sticky right-0 z-20 transition-colors ${
                                  isSelected 
                                    ? 'bg-[#F0F9FF] dark:bg-[#131f37]' 
                                    : 'bg-white dark:bg-slate-900 group-hover:bg-[#F8FAFC] dark:group-hover:bg-slate-800/70'
                                } border-l border-slate-200/60 dark:border-slate-800/60 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)]` 
                              : 'bg-inherit'
                          }`}
                        >
                          {content}
                        </td>
                      );
                    })}
                    {shouldRenderDefaultActions && (
                      <td className={`${cellPadding} text-center sticky right-0 z-20 align-middle transition-colors ${
                        isSelected 
                          ? 'bg-[#F0F9FF] dark:bg-[#131f37]' 
                          : 'bg-white dark:bg-slate-900 group-hover:bg-[#F8FAFC] dark:group-hover:bg-slate-800/70'
                      } border-l border-slate-200/60 dark:border-slate-800/60 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)]`}>
                        <div className="flex items-center justify-center gap-1.5 py-0.5">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (onInspect) onInspect(row); else if (onRowClick) onRowClick(row); }} 
                            className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye size={13.5} />
                          </button>
                          {onEdit && (
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onEdit(row); }} 
                              className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit2 size={13.5} />
                            </button>
                          )}
                          {onDelete && (
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onDelete(row); }} 
                              className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 size={13.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
                <tr>
                  <td colSpan={columns.length + (selectable ? 2 : 1)} className="p-8 text-center text-slate-400 font-medium text-xs">
                    No matching requisition records found.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {/* Enterprise Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 rounded-b-xl">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <div className="w-20">
            <CustomSelect 
              value={pageSize} 
              onChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}
              options={[{label: '5', value: 5}, {label: '10', value: 10}, {label: '25', value: 25}, {label: '50', value: 50}]}
              size="sm"
            />
          </div>
          <span className="hidden sm:inline text-slate-400 font-mono">
            Showing {data.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, data.length)} of {data.length}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <span className="font-bold text-slate-700 dark:text-slate-300 font-mono text-xs">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bulk Action Toolbar */}
      <AnimatePresence>
        {onBulkAction && selectedRows.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-2xl z-50 flex items-center gap-2 sm:gap-3 border border-slate-700 dark:border-slate-200 max-w-[calc(100vw-24px)] overflow-x-auto scrollbar-none"
          >
            <span className="text-xs font-extrabold font-mono px-2 py-1 rounded bg-white/10 dark:bg-slate-900/10 shrink-0">
              {selectedRows.length} Selected
            </span>
            <div className="h-4 w-px bg-slate-700 dark:bg-slate-300 shrink-0" />
            
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold shrink-0">
              <button 
                onClick={() => onBulkAction && onBulkAction('assign', selectedRows)}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors flex items-center gap-1 shrink-0"
              >
                <UserCheck size={13} /> Assign
              </button>
              <button 
                onClick={() => onBulkAction && onBulkAction('approve', selectedRows)}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl text-emerald-400 dark:text-emerald-600 hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors flex items-center gap-1 shrink-0"
              >
                <CheckCircle2 size={13} /> Approve
              </button>
              <button 
                onClick={() => onBulkAction && onBulkAction('reject', selectedRows)}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl text-rose-400 dark:text-rose-600 hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors flex items-center gap-1 shrink-0"
              >
                <XCircle size={13} /> Reject
              </button>
              <button 
                onClick={() => onBulkAction && onBulkAction('archive', selectedRows)}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors flex items-center gap-1 shrink-0"
              >
                <Archive size={13} /> Archive
              </button>
            </div>

            <button 
              onClick={() => setSelectedRows([])}
              className="ml-1 sm:ml-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 hover:underline shrink-0"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataTable;
