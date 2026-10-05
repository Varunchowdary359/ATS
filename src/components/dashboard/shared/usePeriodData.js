/**
 * usePeriodData — shared chart data resolver
 * Returns period-appropriate labels + data for any chart section.
 * All dashboards import from here so filter wiring is consistent.
 */

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Deterministic pseudo-random so values are stable across renders */
const seed = (n, offset = 0) => {
  const x = Math.sin(n + offset + 1) * 10000;
  return x - Math.floor(x);
};

const jitter = (base, n, amp = 20, offset = 0) =>
  Math.round(base + seed(n, offset) * amp - amp / 2);

/**
 * Returns { labels, data } for a single series given the active filter.
 * @param {object} filter  - { period, endMonth, endYear, customStart, customEnd }
 * @param {object} options - { base, growth, amp, unit }
 *   base   — starting value
 *   growth — approx increment per step
 *   amp    — random jitter amplitude
 */
export const getPeriodSeries = (filter, { base = 100, growth = 10, amp = 15, offset = 0 } = {}) => {
  const period = filter?.period || '1M';
  const endM   = filter?.endMonth ?? 6;  // 0-indexed (6 = July)
  const endY   = filter?.endYear  ?? 2026;

  if (period === 'Today') {
    const labels = ['6AM','8AM','10AM','12PM','2PM','4PM','6PM','8PM'];
    const data   = labels.map((_, i) => jitter(base + i * (growth * 0.15), i, amp * 0.5, offset));
    return { labels, data };
  }

  if (period === 'This Week') {
    const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const data   = labels.map((_, i) => jitter(base + i * growth * 0.3, i + 50, amp, offset));
    return { labels, data };
  }

  if (period === '1M') {
    // Last 30 days — weekly buckets for readability
    const labels = ['Week 1','Week 2','Week 3','Week 4'];
    const data   = labels.map((_, i) => jitter(base + i * growth * 0.5, i + 100, amp, offset));
    return { labels, data };
  }

  if (period === 'Last Month') {
    const prevM = endM === 0 ? 11 : endM - 1;
    const prevY = endM === 0 ? endY - 1 : endY;
    const labels = ['Week 1','Week 2','Week 3','Week 4'];
    const data   = labels.map((_, i) => jitter(base * 0.9 + i * growth * 0.4, i + 200, amp, offset));
    return { labels: labels.map(l => `${MONTH_SHORT[prevM]} ${l}`), data };
  }

  if (period === '3M' || period === 'This Month') {
    const months = [];
    for (let i = 2; i >= 0; i--) {
      let m = endM - i; let y = endY;
      if (m < 0) { m += 12; y -= 1; }
      months.push(`${MONTH_SHORT[m]} ${y}`);
    }
    const data = months.map((_, i) => jitter(base + i * growth * 2, i + 300, amp, offset));
    return { labels: months, data };
  }

  if (period === '6M') {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      let m = endM - i; let y = endY;
      if (m < 0) { m += 12; y -= 1; }
      months.push(`${MONTH_SHORT[m]}`);
    }
    const data = months.map((_, i) => jitter(base + i * growth * 1.5, i + 400, amp, offset));
    return { labels: months, data };
  }

  if (period === 'YTD' || period === 'This Quarter') {
    const count = period === 'This Quarter' ? 3 : endM + 1;
    const months = [];
    for (let i = 0; i < count; i++) {
      months.push(MONTH_SHORT[i]);
    }
    const data = months.map((_, i) => jitter(base + i * growth, i + 500, amp, offset));
    return { labels: months, data };
  }

  if (period === 'Custom') {
    const startStr = filter?.customStart;
    const endStr   = filter?.customEnd;
    if (startStr && endStr) {
      const startD = new Date(startStr);
      const endD   = new Date(endStr);
      const diffDays = Math.ceil(Math.abs(endD - startD) / 86400000) || 1;
      const labels = [];
      const data   = [];

      if (diffDays <= 45) {
        // Daily
        const cur = new Date(startD);
        let idx = 0;
        while (cur <= endD) {
          labels.push(`${MONTH_SHORT[cur.getMonth()]} ${cur.getDate()}`);
          data.push(jitter(base + idx * growth * 0.1, idx + 600, amp * 0.6, offset));
          cur.setDate(cur.getDate() + 1);
          idx++;
        }
      } else {
        // Monthly
        let y = startD.getFullYear(), m = startD.getMonth();
        const ey = endD.getFullYear(), em = endD.getMonth();
        let idx = 0;
        while (y < ey || (y === ey && m <= em)) {
          labels.push(`${MONTH_SHORT[m]} ${y}`);
          data.push(jitter(base + idx * growth, idx + 700, amp, offset));
          idx++; m++;
          if (m > 11) { m = 0; y++; }
        }
      }
      return { labels, data };
    }
  }

  // Fallback — YTD style
  const labels = MONTH_SHORT.slice(0, endM + 1);
  const data   = labels.map((_, i) => jitter(base + i * growth, i + 800, amp, offset));
  return { labels, data };
};

/**
 * Returns quarterly labels based on filter period
 */
export const getQuarterlyLabels = (filter) => {
  const period = filter?.period || '1M';
  if (['Today', 'This Week', '1M', 'Last Month'].includes(period)) return ['Wk1','Wk2','Wk3','Wk4'];
  if (period === '3M' || period === 'This Month') return ['Month 1','Month 2','Month 3'];
  return ['Q1','Q2','Q3','Q4'];
};
