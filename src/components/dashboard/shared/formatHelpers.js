// ══════════════════════════════════════════════════════════════════════════════
// FORMAT HELPERS — Centralized formatters for dashboard metrics
// ══════════════════════════════════════════════════════════════════════════════

export const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(1).replace('.0', '')}Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1).replace('.0', '')}L`;
  }
  if (val >= 1000) {
    return `₹${(val / 1000).toFixed(1).replace('.0', '')}K`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
};

export const formatDays = (val, short = true) => {
  if (val === null || val === undefined || isNaN(val)) return `0${short ? 'd' : ' Days'}`;
  return `${val}${short ? 'd' : ' Days'}`;
};

export const formatNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return val.toLocaleString('en-IN');
};

export const formatMetric = (val, type) => {
  if (type === 'currency') return formatCurrency(val);
  if (type === 'days') return formatDays(val, true);
  if (type === 'ms') return `${val}ms`;
  if (type === 'percentage') return `${val}%`;
  if (type === 'ratio') return `${val}x`;
  if (type === 'count') return formatNumber(val);
  return String(val);
};
