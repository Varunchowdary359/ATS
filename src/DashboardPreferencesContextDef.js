import { createContext, useContext } from 'react';

export const DashboardPreferencesContext = createContext();

export const useDashboardPreferences = () => {
  const context = useContext(DashboardPreferencesContext);
  if (!context) {
    console.warn("useDashboardPreferences must be used within a DashboardPreferencesProvider");
    return null;
  }
  return context;
};
