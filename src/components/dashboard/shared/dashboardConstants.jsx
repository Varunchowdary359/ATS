// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD CONSTANTS — Non-component exports (KPI colors, icons)
// Separated to fix React fast refresh warnings in SharedComponents.jsx
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';

// ── Color palette for KPI cards ───────────────────────────────────────────────
export const KPI_COLORS = {
  blue:   { bg: '#eff6ff', text: '#1d4ed8', dark: '#1e3a5f', ring: '#3b82f6' },
  purple: { bg: '#f5f3ff', text: '#6d28d9', dark: '#3b1f6e', ring: '#7c3aed' },
  orange: { bg: '#fff7ed', text: '#c2410c', dark: '#7c2d12', ring: '#f97316' },
  green:  { bg: '#f0fdf4', text: '#15803d', dark: '#14532d', ring: '#22c55e' },
  teal:   { bg: '#f0fdfa', text: '#0f766e', dark: '#134e4a', ring: '#14b8a6' },
  indigo: { bg: '#eef2ff', text: '#4338ca', dark: '#1e1b4b', ring: '#6366f1' },
  rose:   { bg: '#fff1f2', text: '#be123c', dark: '#881337', ring: '#f43f5e' },
  navy:   { bg: '#eff6ff', text: '#1e3a8a', dark: '#172554', ring: '#1d4ed8' },
  amber:  { bg: '#fffbeb', text: '#b45309', dark: '#78350f', ring: '#f59e0b' },
};

// ── Shared Icon set ───────────────────────────────────────────────────────────
export const Icons = {
  Briefcase: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  Users:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Calendar:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Check:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  Percent:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  Clock:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Dollar:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  Doc:       <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  TrendUp:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  UserPlus:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Building:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3m4-3v3m4-3v3"/></svg>,
};
