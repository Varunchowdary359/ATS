// ══════════════════════════════════════════════════════════════════════════════
// CHART COMPONENTS — All Chart.js wrappers (shared across dashboards)
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Filler, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Filler, Tooltip, Legend,
);

// ── Chart.js helpers ──────────────────────────────────────────────────────────
import { isDark } from './chartHelpers';

const cjsTooltip = () => ({
  backgroundColor: isDark() ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
  titleColor: isDark() ? '#94a3b8' : '#64748b',
  bodyColor: isDark() ? '#f8fafc' : '#0f172a',
  borderColor: isDark() ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)',
  borderWidth: 1.5,
  padding: 12,
  cornerRadius: 16, // rounded tooltips
  titleFont: { size: 10, weight: '700', family: 'inherit' },
  bodyFont: { size: 13, weight: '800', family: 'inherit' },
  displayColors: true,
  boxWidth: 8,
  boxHeight: 8,
  boxPadding: 6,
  usePointStyle: true, // better legends in tooltip
  intersect: false,    // interactive crosshair tooltip
  mode: 'index',
});

// Grid fade: highly transparent grid lines
const cjsGrid  = () => isDark() ? 'rgba(71,85,105,0.08)' : 'rgba(226,232,240,0.4)';
const cjsTick  = () => isDark() ? '#64748b' : '#94a3b8';

// Today's indicator plugin (draws vertical dashed line if chart has todayIndex in config)
const TodayLinePlugin = {
  id: 'todayLine',
  afterDraw: (chart) => {
    const todayIndex = chart.config.options?.plugins?.todayLine?.index;
    if (typeof todayIndex !== 'number') return;
    
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
    const xPos = x.getPixelForValue(todayIndex);
    if (isNaN(xPos)) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(xPos, top);
    ctx.lineTo(xPos, bottom);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isDark() ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.5)';
    ctx.stroke();
    
    // Today Label
    ctx.fillStyle = isDark() ? '#94a3b8' : '#64748b';
    ctx.font = '700 9px inherit';
    ctx.textAlign = 'center';
    ctx.fillText('TODAY', xPos, top - 6);
    ctx.restore();
  }
};
ChartJS.register(TodayLinePlugin);

const getColorWithAlpha = (color, alphaHex = '33', fallbackRgba = 'rgba(59, 130, 246, 0.2)') => {
  if (!color || typeof color !== 'string') return fallbackRgba;
  if (color.startsWith('#')) {
    if (color.length === 7) return color + alphaHex;
    return color;
  }
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    return color;
  }
  return fallbackRgba;
};

// ── Vertical Bar Chart ────────────────────────────────────────────────────────
export const CJSBar = ({ data, labels, series, themeColor }) => {
  const color = themeColor || '#3b82f6';

  const chartLabels = labels || (data ? data.map(d => d.label) : []);
  
  const isMulti = !!series;

  const createBarGradient = (context, baseColor) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return getColorWithAlpha(baseColor, 'ee');
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, getColorWithAlpha(baseColor, 'dd'));
    gradient.addColorStop(1, getColorWithAlpha(baseColor, '22'));
    return gradient;
  };

  const datasets = isMulti ? series.map((s) => ({
    label: s.label,
    data: s.data,
    backgroundColor: (ctx) => createBarGradient(ctx, s.color || color),
    hoverBackgroundColor: s.color || color,
    borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
    borderSkipped: false,
    barPercentage: 0.7,
    categoryPercentage: 0.75,
  })) : (data ? [{
    data: data.map(d => d.value),
    backgroundColor: (ctx) => createBarGradient(ctx, color),
    hoverBackgroundColor: data.map(d => d.color || color),
    borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
    borderSkipped: false,
    barPercentage: 0.5,
    categoryPercentage: 0.7,
  }] : []);

  return (
    <div style={{ height: '176px' }}>
      <Bar
        data={{
          labels: chartLabels,
          datasets,
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            y: { duration: 1000, easing: 'easeOutQuart', from: 0 }
          },
          plugins: { 
            legend: { 
              display: isMulti,
              position: 'top',
              align: 'end',
              labels: {
                color: cjsTick(),
                font: { size: 10, weight: '700' },
                boxWidth: 8, boxHeight: 8,
                borderRadius: 4, useBorderRadius: true, padding: 12,
              }
            }, 
            tooltip: cjsTooltip() 
          },
          scales: {
            x: { 
              grid: { display: false }, 
              ticks: { color: cjsTick(), font: { size: 11, weight: '700' }, padding: 6 } 
            },
            y: { 
              grid: { color: cjsGrid(), borderDash: [4, 4] }, 
              ticks: { color: cjsTick(), font: { size: 10, weight: '600' }, padding: 8 },
              beginAtZero: true
            },
          },
        }}
      />
    </div>
  );
};

// ── Horizontal Bar Chart ──────────────────────────────────────────────────────
export const CJSHBar = ({ data, themeColor }) => {
  const color = themeColor || '#3b82f6';
  return (
    <div style={{ height: '208px' }}>
      <Bar
        data={{
          labels: data.map(d => `${d.label} (${d.value.toLocaleString()})`),
          datasets: [{
            data: data.map(d => d.value),
            backgroundColor: data.map(d => (d.color || color) + 'dd'),
            hoverBackgroundColor: data.map(d => d.color || color),
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 16,
          }],
        }}
        options={{
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false }, 
            tooltip: {
              ...cjsTooltip(),
              callbacks: {
                title: (ctx) => ctx[0].label.split(' (')[0],
              }
            } 
          },
          scales: {
            x: { beginAtZero: true, grid: { color: cjsGrid() }, ticks: { color: cjsTick(), font: { size: 10, weight: '600' } } },
            y: { grid: { display: false }, ticks: { color: cjsTick(), font: { size: 10, weight: '600' } } },
          },
        }}
      />
    </div>
  );
};

// ── Line Chart with Glowing Accent Gradient Fill ──────────────────────────────
export const CJSLine = ({ series = [], labels = [], themeColor }) => {
  const primaryColor = (typeof themeColor === 'string' && themeColor.startsWith('#')) ? themeColor : '#3b82f6';
  const palette = [primaryColor, '#94a3b8', '#6366f1', '#f59e0b', '#22c55e'];

  return (
    <div style={{ height: '176px' }}>
      <Line
        data={{
          labels,
          datasets: series.map((s, i) => {
            const seriesColor = s.color || palette[i % palette.length] || '#3b82f6';
            return {
              label: s.label || '',
              data: s.data || [],
              borderColor: seriesColor,
              backgroundColor: (context) => {
                try {
                  const chart = context.chart;
                  const { ctx, chartArea } = chart;
                  if (!chartArea) return getColorWithAlpha(seriesColor, '20');
                  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                  if (i === 0) {
                    gradient.addColorStop(0, getColorWithAlpha(seriesColor, '40', 'rgba(59, 130, 246, 0.3)'));
                    gradient.addColorStop(1, getColorWithAlpha(seriesColor, '00', 'rgba(59, 130, 246, 0.0)'));
                  } else {
                    gradient.addColorStop(0, 'rgba(148, 163, 184, 0.2)');
                    gradient.addColorStop(1, 'rgba(148, 163, 184, 0.0)');
                  }
                  return gradient;
                } catch (e) {
                  return 'rgba(59, 130, 246, 0.1)';
                }
              },
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 8,
              pointBackgroundColor: seriesColor,
              pointBorderColor: isDark() ? '#0f172a' : '#fff',
              pointBorderWidth: 2,
              pointHoverBorderWidth: 3,
              pointHoverBorderColor: isDark() ? '#f8fafc' : '#fff',
              borderWidth: i === 0 ? 3 : 2,
              borderDash: s.forecast ? [5, 5] : (i > 0 ? [5, 4] : undefined),
            };
          }),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            tension: {
              duration: 1000,
              easing: 'easeOutQuart',
              from: 0.8,
              to: 0.4,
            },
            y: {
              duration: 1000,
              easing: 'easeOutQuart',
              from: 0
            }
          },
          plugins: {
            legend: series.length > 1 ? {
              display: true,
              position: 'bottom',
              labels: {
                color: cjsTick(),
                font: { size: 10, weight: '700' },
                boxWidth: 12, boxHeight: 12,
                borderRadius: 6, useBorderRadius: true, padding: 12,
              },
            } : { display: false },
            tooltip: cjsTooltip(),
          },
          scales: {
            x: { grid: { color: cjsGrid() }, ticks: { color: cjsTick(), font: { size: 10, weight: '600' } } },
            y: { grid: { color: cjsGrid() }, ticks: { color: cjsTick(), font: { size: 10, weight: '600' } } },
          },
        }}
      />
    </div>
  );
};

// ── Doughnut Chart ────────────────────────────────────────────────────────────
export const CJSDoughnut = ({ slices, labels, data, colors }) => {
  const normSlices = (slices && slices.length > 0) 
    ? slices 
    : (labels && data) 
    ? labels.map((lbl, idx) => ({
        label: lbl,
        value: data[idx] || 0,
        color: (colors && colors[idx]) || '#3b82f6'
      })) 
    : [];

  const total = normSlices.reduce((s, d) => s + (d.value || 0), 0);
  const centerPlugin = {
    id: 'cjsCenter',
    beforeDraw(chart) {
      const { ctx, chartArea: { left, top, right, bottom } } = chart;
      const cx = (left + right) / 2, cy = (top + bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px Roboto, sans-serif';
      ctx.fillText('TOTAL', cx, cy - 8);
      ctx.fillStyle = isDark() ? '#f1f5f9' : '#0f172a';
      ctx.font = '800 18px Roboto, sans-serif';
      ctx.fillText(total.toLocaleString(), cx, cy + 12);
      ctx.restore();
    },
  };
  return (
    <div style={{ height: '176px', width: '100%' }}>
      <Doughnut
        plugins={[centerPlugin]}
        data={{
          labels: normSlices.map(s => s.label),
          datasets: [{
            data: normSlices.map(s => s.value),
            backgroundColor: normSlices.map(s => s.color),
            hoverBackgroundColor: normSlices.map(s => s.color),
            borderWidth: 2,
            borderColor: isDark() ? '#1e293b' : '#fff',
            hoverOffset: 6,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              display: true,
              position: 'right',
              labels: {
                color: cjsTick(),
                font: { size: 10, weight: '700' },
                boxWidth: 10, boxHeight: 10,
                borderRadius: 5, useBorderRadius: true, padding: 8,
              },
            },
            tooltip: {
              ...cjsTooltip(),
              callbacks: {
                label: ctx => ` ${ctx.label}: ${ctx.parsed} (${Math.round((ctx.parsed / total) * 100)}%)`,
              },
            },
          },
        }}
      />
    </div>
  );
};

// ── Funnel Chart (horizontal bar styled) ──────────────────────────────────────
export const CJSFunnel = ({ data, themeColor }) => {
  const color = themeColor || '#3b82f6';
  const max = data[0]?.value || 1;
  const bgColors = data.map((_, i) => {
    const hex = Math.round((1 - i * 0.09) * 220).toString(16).padStart(2, '0');
    return color + hex;
  });
  return (
    <div style={{ height: '224px' }}>
      <Bar
        data={{
          labels: data.map(d => `${d.label} (${d.value.toLocaleString()})`),
          datasets: [{
            data: data.map(d => d.value),
            backgroundColor: bgColors,
            hoverBackgroundColor: data.map(() => color),
            borderRadius: 6,
            borderSkipped: false,
          }],
        }}
        options={{
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...cjsTooltip(),
              callbacks: {
                title: (ctx) => ctx[0].label.split(' (')[0],
                label: ctx => ` ${ctx.parsed.x.toLocaleString()} (${Math.round((ctx.parsed.x / max) * 100)}%)`,
              },
            },
          },
          scales: {
            x: { display: false, max: max * 1.05, grid: { display: false } },
            y: { grid: { display: false }, ticks: { color: cjsTick(), font: { size: 10, weight: '700' } } },
          },
        }}
      />
    </div>
  );
};
