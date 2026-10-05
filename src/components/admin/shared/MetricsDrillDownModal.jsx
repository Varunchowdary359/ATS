import React, { useContext, useEffect, useState } from 'react';
import { X, TrendingUp, CalendarDays, Download } from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MetricsDrillDownModal({ isOpen, onClose, statContext }) {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#3b82f6';
  
  const [chartType, setChartType] = useState('line');

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !statContext) return null;

  // Generate mock data based on the stat context for visual demonstration
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dataPoints = Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 10);
  
  // Make the chart trend upwards if the value is positive context
  const trendingData = labels.map((_, i) => Math.floor(Math.random() * 20) + (i * 10));

  const data = {
    labels,
    datasets: [
      {
        label: statContext.label,
        data: statContext.label.toLowerCase().includes('total') ? trendingData : dataPoints,
        borderColor: brandColor,
        backgroundColor: `${brandColor}33`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: brandColor,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#0f111a',
        titleFont: { size: 13, family: "'Inter', sans-serif" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: '#64748b'
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: '#64748b'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-50"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700" style={{ color: brandColor }}>
                  {statContext.icon}
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{statContext.label}</h2>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{statContext.value}</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded text-xs font-bold">
                  <TrendingUp size={14} /> {statContext.sub}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Download size={18} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chart Controls */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${chartType === 'line' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Line Chart
              </button>
              <button 
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Bar Chart
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <CalendarDays size={14} /> 
              <span>Last 12 Months</span>
            </div>
          </div>

          {/* Chart Area */}
          <div className="p-6 h-[400px] w-full">
            {chartType === 'line' ? (
              <Line data={data} options={options} />
            ) : (
              <Bar data={{...data, datasets: [{...data.datasets[0], backgroundColor: brandColor, borderRadius: 6 }]}} options={options} />
            )}
          </div>
          
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
