import React, { createContext, useContext, useState, useCallback } from 'react';

const FilterContext = createContext(null);

export const DATA_THROUGH = { month: 8, year: 2026 }; // September 2026

export const DASHBOARD_DEFAULT = { period: "1M", endMonth: 8, endYear: 2026, compare: "none" };

export const FilterProvider = ({ children }) => {
  // Global States
  const [dashboardDateFilter, setDashboardDateFilter] = useState({
    super_admin: DASHBOARD_DEFAULT,
    pw_ceo: DASHBOARD_DEFAULT,
    client_ceo: DASHBOARD_DEFAULT,
    workspace: DASHBOARD_DEFAULT,
  });
  
  const [globalScopeFilters, setGlobalScopeFilters] = useState({});

  // Local Overrides
  const [sectionDateOverrides, setSectionDateOverrides] = useState({});
  const [sectionSpecificFilters, setSectionSpecificFilters] = useState({});

  // ── Modifiers ──
  const setGlobalDateFilter = useCallback((role, newFilter) => {
    setDashboardDateFilter(prev => ({
      ...prev,
      [role]: { ...prev[role], ...newFilter }
    }));
  }, []);

  const setSectionOverride = useCallback((role, sectionKey, newFilter) => {
    setSectionDateOverrides(prev => ({
      ...prev,
      [role]: { ...(prev[role] || {}), [sectionKey]: newFilter }
    }));
  }, []);

  const resetSectionOverride = useCallback((role, sectionKey) => {
    setSectionDateOverrides(prev => {
      const updated = { ...(prev[role] || {}) };
      delete updated[sectionKey];
      return { ...prev, [role]: updated };
    });
  }, []);

  const resetAllOverrides = useCallback((role) => {
    setSectionDateOverrides(prev => ({ ...prev, [role]: {} }));
  }, []);

  // Returns the effective filter (override ?? dashboardDateFilter)
  const getSectionFilter = useCallback((role, sectionKey) => {
    const override = sectionDateOverrides[role]?.[sectionKey];
    if (override) return { ...override, overridden: true };
    return { ...dashboardDateFilter[role], overridden: false };
  }, [sectionDateOverrides, dashboardDateFilter]);

  const getOverrideCount = useCallback((role) => {
    return Object.keys(sectionDateOverrides[role] || {}).length;
  }, [sectionDateOverrides]);

  return (
    <FilterContext.Provider value={{
      dashboardDateFilter,
      globalScopeFilters,
      sectionDateOverrides,
      sectionSpecificFilters,
      setGlobalDateFilter,
      setSectionOverride,
      resetSectionOverride,
      resetAllOverrides,
      getSectionFilter,
      getOverrideCount,
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);
export default FilterContext;
