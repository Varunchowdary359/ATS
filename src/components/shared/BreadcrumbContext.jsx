import React, { createContext, useContext, useState, useCallback } from 'react';

const BreadcrumbContext = createContext({
  extraCrumbs: [],
  setExtraCrumbs: () => {},
  clearExtraCrumbs: () => {}
});

export const BreadcrumbProvider = ({ children }) => {
  const [extraCrumbs, setExtraCrumbs] = useState([]);

  const clearExtraCrumbs = useCallback(() => {
    setExtraCrumbs([]);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ extraCrumbs, setExtraCrumbs, clearExtraCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumb = () => useContext(BreadcrumbContext);
