/**
 * usePreboarding Custom Hook
 * PeopleWorks ATS SaaS
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import { preboardingService } from './preboardingService';
import { ThemeContext } from '../../../ThemeContext';

export function usePreboarding(initialFilters = {}) {
  const { themeColor } = useContext(ThemeContext);
  const brandColor = themeColor || 'var(--pw-brand)';

  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState({
    totalPreboarding: 0,
    pendingActions: 0,
    joiningThisWeek: 0,
    readyToJoin: 0
  });
  const [attentionItems, setAttentionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [recList, kpis, attention] = await Promise.all([
        preboardingService.getPreboardings(filters),
        preboardingService.getMetrics(),
        preboardingService.getAttentionItems()
      ]);
      setRecords(recList);
      setMetrics(kpis);
      setAttentionItems(attention);
    } catch (err) {
      console.error('Error fetching preboarding data:', err);
      setError(err.message || 'Failed to load preboarding records.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    const unsubscribe = preboardingService.subscribe(() => {
      fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    records,
    metrics,
    attentionItems,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refetch: fetchData,
    brandColor
  };
}
