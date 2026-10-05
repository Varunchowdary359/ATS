import React from 'react';
import SolarKPIs, { KPICustomizeDropdown } from './shared/SolarKPIs';
import { SectionTitle, ChartCard } from './shared/SharedComponents';
import DashboardErrorBoundary from './shared/DashboardErrorBoundary';
import SectionFilter from './shared/SectionFilter';
import { useDashboardPreferences } from '../../DashboardPreferencesContext';
import { useFilter } from '../../FilterContext';
import { getPeriodSeries, getQuarterlyLabels } from './shared/usePeriodData';
import { PW_CEO_METRICS, PW_CEO_GROWTH_INSIGHTS } from './data/mockData';
import { CJSLine, CJSBar, CJSDoughnut } from './shared/Charts';
import { formatMetric } from './shared/formatHelpers';

const PWCEODashboard = ({ themeColor }) => {
  const { isSectionVisible } = useDashboardPreferences();
  const { getSectionFilter } = useFilter() || {};

  // Revenue Trends filter
  const revFilter = getSectionFilter?.('pw_ceo', 'Revenue Trends') || {};
  const mrrSeries = getPeriodSeries(revFilter, { base: 310, growth: 18, amp: 12, offset: 10 });
  const qLabels   = getQuarterlyLabels(revFilter);

  // Quarterly data shifts with period
  const newARR     = qLabels.map((_, i) => Math.round(120 + i * 32 + (revFilter.period === 'YTD' ? 20 : revFilter.period === '6M' ? 10 : 0)));
  const churnARR   = qLabels.map((_, i) => Math.round(15 - i * 1.5 + (revFilter.period === 'YTD' ? 5 : 0)));
  const projected  = qLabels.map((_, i) => Math.round(200 + i * 50 + (revFilter.period === 'YTD' ? 30 : 0)));
  const actual     = qLabels.map((_, i) => Math.round(210 + i * 55 + (revFilter.period === 'YTD' ? 25 : revFilter.period === '6M' ? 15 : 0)));

  // Churn donut by region (proportions shift with period)
  const isLongPeriod = ['YTD', '6M', 'This Quarter'].includes(revFilter.period);
  const churnSlices = [
    { label: 'North America', value: isLongPeriod ? 38 : 45, color: '#3b82f6' },
    { label: 'EMEA',          value: isLongPeriod ? 35 : 30, color: '#f59e0b' },
    { label: 'APAC',          value: isLongPeriod ? 18 : 15, color: '#22c55e' },
    { label: 'Others',        value: isLongPeriod ? 9  : 10, color: '#94a3b8' },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-20 flex flex-col gap-8">
      
      {/* ── SAAS METRICS OVERVIEW ── */}
      {isSectionVisible("pw_ceo", "Business Metrics") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Business Metrics</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Global SaaS revenue and growth performance</p>
              </div>
              <div className="flex items-center gap-3">
                <KPICustomizeDropdown role="pw_ceo" />
                <SectionFilter
                  sectionKey="Business Metrics"
                  role="pw_ceo"
                  periodOptions={['Today', 'This Week', 'This Month', 'Last Month', 'This Quarter']}
                  secondaryFilters={[{ key: 'region', label: 'Region', options: ['Global', 'North America', 'EMEA', 'APAC'] }]}
                  themeColor={themeColor}
                />
              </div>
            </div>
            <SolarKPIs role="pw_ceo" themeColor={themeColor} hideDropdown={true} />
          </div>
        </DashboardErrorBoundary>
      )}

      {/* ── FINANCIAL STRIP ── */}
      {isSectionVisible("pw_ceo", "Financial Strip") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <SectionTitle title="Core Financials" sub="Key revenue and subscription health indicators" widgetKey="Financial Strip" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px bg-slate-200 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
            {PW_CEO_METRICS.map((m, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-5 bg-white dark:bg-[#17243A] hover:bg-slate-50 dark:hover:bg-[#1e2f4c] transition-colors duration-200 cursor-default group h-full">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">{m.label}</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 text-center group-hover:scale-105 transition-transform">{formatMetric(m.value, m.type)}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${m.trendUp ? 'text-emerald-500' : 'text-rose-500'} text-center`}>
                  {m.trend}
                </span>
              </div>
            ))}
            </div>
          </div>
        </DashboardErrorBoundary>
      )}

      {/* ── AI BUSINESS GROWTH INSIGHTS ── */}
      {isSectionVisible("pw_ceo", "AI Growth Insights") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <SectionTitle title="AI Business Growth Insights" sub="NLP executive analysis and platform intelligence alerts" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {PW_CEO_GROWTH_INSIGHTS.map((ins, i) => (
                <div key={i} className="flex flex-col justify-between p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-[#0F1117] transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-default group">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="text-2xl shrink-0">{ins.icon}</span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                      {ins.title}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                    {typeof ins.details === 'object' && ins.details !== null ? JSON.stringify(ins.details) : String(ins.details || '')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DashboardErrorBoundary>
      )}

      {/* ── REVENUE CHARTS ── */}
      {isSectionVisible("pw_ceo", "Revenue Trends") && (
        <DashboardErrorBoundary>
          <div className="bento-card-premium p-6">
            <div className="flex items-start justify-between mb-6">
              <SectionTitle title="Revenue & Growth Trends" sub="Quarterly performance and projection" widgetKey="Revenue Trends" />
              <SectionFilter
                sectionKey="Revenue Trends"
                role="pw_ceo"
                periodOptions={['1M', '3M', '6M', 'YTD', 'This Quarter']}
                secondaryFilters={[{ key: 'region', label: 'Region', options: ['Global', 'North America', 'EMEA', 'APAC'] }]}
                themeColor={themeColor}
                hideLayoutToggle={true}
              />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <ChartCard title={`MRR Growth (${revFilter.period || '1M'})`}>
                 <CJSLine themeColor={themeColor}
                   labels={mrrSeries.labels}
                   series={[{ label: 'MRR (₹ Lakhs)', data: mrrSeries.data }]}
                 />
               </ChartCard>
               <ChartCard title="New vs Churned ARR">
                 <CJSBar themeColor={themeColor} labels={qLabels}
                   series={[
                     { label: 'New ARR',     data: newARR,   color: '#22c55e' },
                     { label: 'Churned ARR', data: churnARR, color: '#ef4444' }
                   ]}
                 />
               </ChartCard>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
               <ChartCard title="Revenue vs Target">
                 <CJSBar themeColor={themeColor} labels={qLabels}
                   series={[
                     { label: 'Projected Target', data: projected, color: '#94a3b8' },
                     { label: 'Actual Revenue',   data: actual,    color: '#3b82f6' }
                   ]}
                 />
               </ChartCard>
               <ChartCard title="Churn by Region">
                 <CJSDoughnut slices={churnSlices}/>
               </ChartCard>
             </div>
          </div>
        </DashboardErrorBoundary>
      )}

    </div>
  );
};

export default PWCEODashboard;

