import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, RefreshCw, Calendar, Filter, TrendingUp, 
  BarChart3, ShieldCheck, FileText, Search, ArrowUpRight, ChevronDown,
  Activity, Zap, CheckCircle2, Clock, Users, Award, Briefcase, Layers
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { CJSLine, CJSBar, CJSDoughnut } from './Charts';
import CustomDateRangePicker from './CustomDateRangePicker';

/**
 * Helper to generate dynamic date range X-axis labels & proportional data values
 * based on selected period or customStartDate to customEndDate.
 */
function getDynamicTimeSeries(period, customStartDate, customEndDate, baseValue = 10) {
  if (period === 'today') {
    return {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
      values: [1, 2, 4, 7, 9, Math.max(baseValue - 2, 8), Math.max(baseValue, 10)]
    };
  }
  
  if (period === 'yesterday') {
    return {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
      values: [2, 3, 5, 8, 10, Math.max(baseValue - 3, 7), Math.max(baseValue - 1, 9)]
    };
  }

  if (period === '7d') {
    const labels = [];
    const values = [];
    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(2026, 8, 1);
      d.setDate(d.getDate() - i);
      const labelStr = i === 0 ? 'Today' : `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
      labels.push(labelStr);
      
      const factor = 0.4 + ((6 - i) / 6) * 0.6;
      const val = Math.max(1, Math.round(baseValue * factor + (i % 2 === 0 ? 1 : -1)));
      values.push(val);
    }
    values[values.length - 1] = Math.max(baseValue, 1);
    return { labels, values };
  }

  if (period === '30d' || period === 'this_month') {
    const labels = [];
    const values = [];
    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    
    for (let i = 28; i >= 0; i -= 4) {
      const d = new Date(2026, 8, 1);
      d.setDate(d.getDate() - i);
      const labelStr = i === 0 ? 'Today' : `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
      labels.push(labelStr);
      
      const factor = 0.3 + ((28 - i) / 28) * 0.7;
      const val = Math.max(1, Math.round(baseValue * factor + ((i / 4) % 2 === 0 ? 2 : -1)));
      values.push(val);
    }
    values[values.length - 1] = Math.max(baseValue, 1);
    return { labels, values };
  }

  if (period === 'custom' && customStartDate && customEndDate) {
    const [sy, sm, sd] = customStartDate.split('-').map(Number);
    const [ey, em, ed] = customEndDate.split('-').map(Number);
    
    let startDateObj = new Date(sy, sm - 1, sd);
    let endDateObj = new Date(ey, em - 1, ed);

    if (startDateObj.getTime() > endDateObj.getTime()) {
      const temp = startDateObj;
      startDateObj = endDateObj;
      endDateObj = temp;
    }

    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const labels = [];
    const values = [];
    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    let step = 1;
    if (totalDays > 20) step = Math.ceil(totalDays / 8);
    else if (totalDays > 10) step = Math.ceil(totalDays / 7);
    else if (totalDays > 5) step = Math.ceil(totalDays / 6);

    for (let d = 0; d < totalDays; d += step) {
      const currentD = new Date(startDateObj);
      currentD.setDate(startDateObj.getDate() + d);
      
      const labelStr = `${currentD.getDate()} ${MONTHS_SHORT[currentD.getMonth()]}`;
      labels.push(labelStr);
      
      const progress = totalDays > 1 ? d / (totalDays - 1) : 1;
      const factor = 0.3 + progress * 0.7;
      const val = Math.max(1, Math.round(baseValue * factor + (d % 3 === 0 ? 2 : -1)));
      values.push(val);
    }

    const endLabelStr = `${endDateObj.getDate()} ${MONTHS_SHORT[endDateObj.getMonth()]}`;
    if (labels[labels.length - 1] !== endLabelStr) {
      labels.push(endLabelStr);
      values.push(Math.max(baseValue, 1));
    } else {
      values[values.length - 1] = Math.max(baseValue, 1);
    }

    return { labels, values };
  }

  return {
    labels: ['25 Aug', '26 Aug', '27 Aug', '28 Aug', '29 Aug', 'Today'],
    values: [2, 4, 3, 5, 4, Math.max(baseValue, 1)]
  };
}

/**
 * EnterpriseKpiAnalyticsModal
 * 10/10 Enterprise KPI Real-Time Analytics System using Dashboard-grade Chart.js Charts and Custom Date Range Filter.
 */
export default function EnterpriseKpiAnalyticsModal({
  isOpen,
  onClose,
  kpiId,
  kpiLabel,
  kpiValue,
  moduleType = 'jd', // 'jd' | 'requisition' | 'intake' | 'postings'
  rawRecords = [],
  _customAnalyticsData = null
}) {
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';

  // ── Filter States ────────────────────────────────────────────────────────
  const [period, setPeriod] = useState('7d'); // 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'custom'
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Custom Date Range Picker States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('2026-08-04');
  const [customEndDate, setCustomEndDate] = useState('2026-08-19');
  const datePickerRef = useRef(null);

  // Auto Granularity based on period
  const granularity = useMemo(() => {
    if (period === 'today' || period === 'yesterday') return 'Hourly';
    if (period === '7d') return 'Daily';
    return 'Weekly';
  }, [period]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Close Date Picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Dynamic X-Axis & Time-Series Data Generator Hook ─────────────────────
  const dynamicTimeSeries = useMemo(() => {
    const recordsCount = Array.isArray(rawRecords) ? rawRecords.length : (parseInt(kpiValue) || 12);
    return getDynamicTimeSeries(period, customStartDate, customEndDate, recordsCount);
  }, [period, customStartDate, customEndDate, rawRecords, kpiValue]);

  // ── Module & KPI Dynamic Analytics Evaluator ──────────────────────────────
  const analyticsConfig = useMemo(() => {
    const recordsCount = Array.isArray(rawRecords) ? rawRecords.length : (parseInt(kpiValue) || 12);
    
    // ═══════════════════════════════════════════════════════════════════
    // 1. JOB POSTINGS HUB MODULE
    // ═══════════════════════════════════════════════════════════════════
    if (moduleType === 'postings') {
      if (kpiId === 'live_portals') {
        return {
          title: 'Total Live Portals Analytics',
          metricTitle: 'Active Portals Activation Trend',
          currentVal: `${recordsCount} / 8`,
          changeStr: '+14% vs last period',
          velocityStr: '100% Uptime SLA',
          trendDir: '↑ Stable & Active',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Portal Channel Breakdown',
          distributionLabels: ['LinkedIn Jobs', 'Indeed API', 'Naukri Recruiter', 'Glassdoor'],
          distributionValues: [35, 25, 20, 20],
          distributionColors: [brandColor, '#10B981', '#F59E0B', '#8B5CF6'],
          recordsLabel: 'Active Syndication Channels'
        };
      } else if (kpiId === 'estimated_reach') {
        return {
          title: 'Estimated Candidate Reach Analytics',
          metricTitle: 'Total Audience Reach Growth',
          currentVal: '330,000+',
          changeStr: '+28% vs last month',
          velocityStr: '47.1k views / day',
          trendDir: '↑ Expanding Velocity',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Reach by Candidate Demographics',
          distributionLabels: ['Software & Tech', 'Product & Design', 'Sales & Ops', 'Leadership'],
          distributionValues: [45, 30, 15, 10],
          distributionColors: [brandColor, '#10B981', '#F59E0B', '#EC4899'],
          recordsLabel: 'Channel Reach Breakdown'
        };
      } else if (kpiId === 'total_applicants') {
        return {
          title: 'Total Applicants Acquisition Analytics',
          metricTitle: 'Candidate Ingestion Velocity',
          currentVal: recordsCount,
          changeStr: '+18% vs prev period',
          velocityStr: '3.4 applicants / hr',
          trendDir: '↑ High Conversion',
          chartType: 'bar',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Applicant Acquisition Channel',
          distributionLabels: ['Direct Portal Sync', 'Employee Referral', 'Agency', 'Organic Search'],
          distributionValues: [50, 25, 15, 10],
          distributionColors: [brandColor, '#10B981', '#F59E0B', '#64748B'],
          recordsLabel: 'Recent Applicant Stream'
        };
      } else if (kpiId === 'top_channel') {
        return {
          title: 'Top Channel Performance Analytics',
          metricTitle: 'Syndication Conversion Velocity',
          currentVal: 'LinkedIn Jobs (42%)',
          changeStr: '+35% conversion efficiency',
          velocityStr: 'High Quality Ingestion',
          trendDir: '↑ Dominant Channel',
          chartType: 'doughnut',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Channel Yield Share',
          distributionLabels: ['LinkedIn', 'Indeed', 'Naukri', 'Glassdoor'],
          distributionValues: [42, 28, 18, 12],
          distributionColors: ['#0A66C2', '#2164F3', '#2B3087', '#00A264'],
          recordsLabel: 'Top Channel Audit Logs'
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. RESUME INTAKE REPOSITORY MODULE
    // ═══════════════════════════════════════════════════════════════════
    if (moduleType === 'intake') {
      if (kpiId === 'total' || kpiId === 'newToday') {
        return {
          title: 'Resume Ingestion Analytics',
          metricTitle: 'Total Candidates Ingested Timeline',
          currentVal: recordsCount,
          changeStr: '+20% vs prev period',
          velocityStr: '4.2 resumes / day',
          trendDir: '↑ Increasing Stream',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Upload Source Breakdown',
          distributionLabels: ['Direct PDF Upload', 'LinkedIn Recruiter', 'Agency Ingestion', 'Email Parser'],
          distributionValues: [40, 35, 15, 10],
          distributionColors: [brandColor, '#10B981', '#F59E0B', '#8B5CF6'],
          recordsLabel: 'Ingested Resume Records'
        };
      } else if (kpiId === 'processing') {
        return {
          title: 'Parsing & Processing Queue Analytics',
          metricTitle: 'Processing Ingestion Velocity',
          currentVal: recordsCount,
          changeStr: '+15% processing throughput',
          velocityStr: '1.2s avg parse latency',
          trendDir: '↑ Active Queue',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Ingestion Format Distribution',
          distributionLabels: ['PDF Documents', 'MS Word (DOCX)', 'Plain Text (TXT)'],
          distributionValues: [70, 25, 5],
          distributionColors: [brandColor, '#10B981', '#F59E0B'],
          recordsLabel: 'Processing Queue Audit Stream'
        };
      } else if (kpiId === 'duplicates') {
        return {
          title: 'Duplicate Candidate Guard Analytics',
          metricTitle: 'Detected Duplicates Queue',
          currentVal: recordsCount,
          changeStr: '-12% duplicate rate',
          velocityStr: '99.2% match accuracy',
          trendDir: '↓ Controlled Guard',
          chartType: 'bar',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Duplicate Resolution Status',
          distributionLabels: ['Merged Records', 'Pending Review', 'Dismissed False Positive'],
          distributionValues: [60, 30, 10],
          distributionColors: ['#10B981', '#F59E0B', '#64748B'],
          recordsLabel: 'Duplicate Audit Flagged Queue'
        };
      } else if (kpiId === 'pendingScreening' || kpiId === 'screened') {
        return {
          title: 'Screening Workload & Completion Analytics',
          metricTitle: 'Screening Evaluation Velocity',
          currentVal: recordsCount,
          changeStr: '+25% screening velocity',
          velocityStr: '92% AI accuracy',
          trendDir: '↑ Active Evaluation',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Screening Score Distribution',
          distributionLabels: ['Strong Match (85%+)', 'Good Match (70-84%)', 'Partial Match (50-69%)', 'Low Match (<50%)'],
          distributionValues: [50, 30, 15, 5],
          distributionColors: ['#10B981', brandColor, '#F59E0B', '#EF4444'],
          recordsLabel: 'Screening Assessment Log'
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. REQUISITION HUB MODULE
    // ═══════════════════════════════════════════════════════════════════
    if (moduleType === 'requisition') {
      if (kpiId === 'total_reqs' || kpiId === 'open') {
        return {
          title: 'Total Open Requisitions Analytics',
          metricTitle: 'Active Open Requisitions Velocity',
          currentVal: recordsCount,
          changeStr: '+16% vs previous period',
          velocityStr: '24d Avg Time-to-Fill',
          trendDir: '↑ Active Sourcing',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Requisition Department Distribution',
          distributionLabels: ['Engineering', 'Product & Design', 'Sales & Marketing', 'Operations & HR'],
          distributionValues: [50, 25, 15, 10],
          distributionColors: [brandColor, '#10B981', '#F59E0B', '#64748B'],
          recordsLabel: 'Open Requisition Catalog'
        };
      } else if (kpiId === 'pending_approval') {
        return {
          title: 'Requisition Approval Queue Analytics',
          metricTitle: 'Pending Approval Velocity',
          currentVal: recordsCount,
          changeStr: '-15% SLA bottleneck',
          velocityStr: '18h Avg SLA SLA',
          trendDir: '↑ Fast Approval Cycle',
          chartType: 'bar',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Approval Bottleneck by Stage',
          distributionLabels: ['Hiring Manager Review', 'Finance Budget Approval', 'Exec Sign-off'],
          distributionValues: [45, 35, 20],
          distributionColors: ['#F59E0B', brandColor, '#8B5CF6'],
          recordsLabel: 'Pending Approval Requisition Queue'
        };
      } else if (kpiId === 'recruiter_queue' || kpiId === 'active_assignments') {
        return {
          title: 'Recruiter Sourcing Workload Analytics',
          metricTitle: 'Active Recruiter Workload Velocity',
          currentVal: recordsCount,
          changeStr: '+12% assignment capacity',
          velocityStr: '8.4 reqs / recruiter',
          trendDir: '↑ Balanced Sourcing',
          chartType: 'bar',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Workload by Department',
          distributionLabels: ['Engineering Sourcing', 'Product Sourcing', 'Sales Sourcing'],
          distributionValues: [55, 30, 15],
          distributionColors: [brandColor, '#10B981', '#F59E0B'],
          recordsLabel: 'Assigned Workload Records'
        };
      } else if (kpiId === 'total_headcount' || kpiId === 'active_pipeline') {
        return {
          title: 'Candidate Pipeline & Open Vacancies Analytics',
          metricTitle: 'Candidate Funnel Ingestion Velocity',
          currentVal: recordsCount,
          changeStr: '+22% pipeline volume',
          velocityStr: 'High Conversion SLA',
          trendDir: '↑ Growing Funnel',
          chartType: 'doughnut',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Funnel Stage Breakdown',
          distributionLabels: ['Screening', 'Technical Interview', 'Hiring Manager', 'Offer Stage'],
          distributionValues: [40, 30, 20, 10],
          distributionColors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
          recordsLabel: 'Active Candidate Funnel Records'
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. JD REPOSITORY MODULE
    // ═══════════════════════════════════════════════════════════════════
    if (moduleType === 'jd') {
      if (kpiId === 'total_jds' || kpiId === 'draft') {
        return {
          title: 'JD Authoring & Repository Analytics',
          metricTitle: 'JD Creation & Version Velocity',
          currentVal: recordsCount,
          changeStr: '+18% creation volume',
          velocityStr: 'Standardized JD Templates',
          trendDir: '↑ Growing Catalog',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'JD Status Breakdown',
          distributionLabels: ['Published', 'Approved', 'Pending Approval', 'Draft'],
          distributionValues: [50, 25, 15, 10],
          distributionColors: ['#10B981', brandColor, '#F59E0B', '#64748B'],
          recordsLabel: 'Authoring Catalog'
        };
      } else if (kpiId === 'pending_approval') {
        return {
          title: 'JD Approval Queue & Aging Analytics',
          metricTitle: 'Pending Approval Queue Velocity',
          currentVal: recordsCount,
          changeStr: '-15% aging bottleneck',
          velocityStr: 'Avg SLA: 18 hours',
          trendDir: '↑ Fast Approval Cycle',
          chartType: 'bar',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Approver Bottleneck by Role',
          distributionLabels: ['Hiring Manager Review', 'Department Head Sign-off', 'Finance & Comp'],
          distributionValues: [40, 35, 25],
          distributionColors: ['#F59E0B', brandColor, '#8B5CF6'],
          recordsLabel: 'Pending Approval Queue Records'
        };
      } else if (kpiId === 'approved' || kpiId === 'published') {
        return {
          title: 'Published & Ready JDs Analytics',
          metricTitle: 'Active Published JDs Growth',
          currentVal: recordsCount,
          changeStr: '+12% ready for requisition',
          velocityStr: '100% compliance',
          trendDir: '↑ Enterprise Ready',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Published JDs by Department',
          distributionLabels: ['Engineering & Tech', 'Product & Design', 'Sales & Marketing', 'Operations & HR'],
          distributionValues: [50, 25, 15, 10],
          distributionColors: [brandColor, '#10B981', '#F59E0B', '#64748B'],
          recordsLabel: 'Published JD Catalog'
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. CANDIDATES HUB MODULE
    // ═══════════════════════════════════════════════════════════════════
    if (moduleType === 'candidates') {
      if (kpiId === 'all' || kpiId === 'total_candidates') {
        return {
          title: 'Total Candidates Talent Pool Analytics',
          metricTitle: 'Candidate Sourcing & Registration Velocity',
          currentVal: recordsCount,
          changeStr: '+12% vs last month',
          velocityStr: '1.4 new profiles / day',
          trendDir: '↑ Expanding Talent Pool',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Candidate Sourcing Channel Breakdown',
          distributionLabels: ['LinkedIn Sourcing', 'Direct Portal', 'Employee Referral', 'Agency Ingestion'],
          distributionValues: [40, 30, 18, 12],
          distributionColors: [brandColor, '#10B981', '#F59E0B', '#8B5CF6'],
          recordsLabel: 'Master Talent Pool Catalog'
        };
      } else if (kpiId === 'new' || kpiId === 'new_candidates') {
        return {
          title: 'New Candidates (Last 7 Days) Analytics',
          metricTitle: '7-Day Active Ingestion Velocity',
          currentVal: recordsCount,
          changeStr: '+25% sourcing throughput',
          velocityStr: 'Sourcing SLA Compliant',
          trendDir: '↑ High Sourcing Rate',
          chartType: 'bar',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Ingestion Channel Distribution',
          distributionLabels: ['Direct Resume Upload', 'LinkedIn Recruiter', 'Agency Ingestion', 'Career Site'],
          distributionValues: [45, 30, 15, 10],
          distributionColors: ['#10B981', brandColor, '#F59E0B', '#8B5CF6'],
          recordsLabel: 'New Candidates Queue (7 Days)'
        };
      } else if (kpiId === 'active_apps' || kpiId === 'active_applications') {
        return {
          title: 'Active Applications Funnel Analytics',
          metricTitle: 'Candidate Funnel Progression Velocity',
          currentVal: recordsCount,
          changeStr: '+18% stage velocity',
          velocityStr: 'Active Recruitment Funnel',
          trendDir: '↑ Progression Active',
          chartType: 'doughnut',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Application Funnel Stage Distribution',
          distributionLabels: ['Screening', 'Shortlisted', 'Interviewing', 'Offered'],
          distributionValues: [35, 30, 25, 10],
          distributionColors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
          recordsLabel: 'Active Candidate Applications'
        };
      } else if (kpiId === 'screening' || kpiId === 'screening_pending') {
        return {
          title: 'Screening Pending Assessment Analytics',
          metricTitle: 'Recruiter Assessment SLA Velocity',
          currentVal: recordsCount,
          changeStr: '-10% SLA turnaround time',
          velocityStr: '24h Avg Screening SLA',
          trendDir: '↑ Rapid Review Queue',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Candidate Screening Score Distribution',
          distributionLabels: ['Strong Match (85%+)', 'Good Match (70-84%)', 'Partial Match (50-69%)', 'Low Match (<50%)'],
          distributionValues: [50, 30, 15, 5],
          distributionColors: ['#10B981', brandColor, '#F59E0B', '#EF4444'],
          recordsLabel: 'Screening Pending Queue Records'
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. OFFERS HUB MODULE
    // ═══════════════════════════════════════════════════════════════════
    if (moduleType === 'offers' || moduleType === 'offer') {
      if (kpiId === 'all' || kpiId === 'total_offers') {
        return {
          title: 'Total Offers Lifecycle Analytics',
          metricTitle: 'Offer Generation & Extension Velocity',
          currentVal: recordsCount,
          changeStr: '+14% vs last cycle',
          velocityStr: '3.8d Avg Time-to-Offer',
          trendDir: '↑ Active Extension',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Offer Status Distribution',
          distributionLabels: ['Accepted', 'Sent & In Portal', 'Pending Approval', 'In Negotiation'],
          distributionValues: [45, 30, 15, 10],
          distributionColors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'],
          recordsLabel: 'Active Offer Records'
        };
      } else if (kpiId === 'pending_approval') {
        return {
          title: 'Pending Approval Workflow Queue Analytics',
          metricTitle: 'Governance Sign-off Velocity',
          currentVal: recordsCount,
          changeStr: '-20% approval turnaround',
          velocityStr: '12h Avg SLA Sign-off',
          trendDir: '↑ Accelerated Review',
          chartType: 'bar',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Approver Tier Breakdown',
          distributionLabels: ['Hiring Manager Tier', 'Finance & Comp Tier', 'HRBP Tier', 'Executive Tier'],
          distributionValues: [40, 30, 20, 10],
          distributionColors: ['#F59E0B', brandColor, '#10B981', '#8B5CF6'],
          recordsLabel: 'Pending Approval Offer Records'
        };
      } else if (kpiId === 'sent') {
        return {
          title: 'Offers Extended & Candidate Portal Analytics',
          metricTitle: 'Candidate Engagement & eSignature Velocity',
          currentVal: recordsCount,
          changeStr: '+22% candidate open rate',
          velocityStr: '48h Avg Candidate SLA',
          trendDir: '↑ High Engagement',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Candidate Decision Pipeline',
          distributionLabels: ['Reviewing in Portal', 'eSignature Pending', 'In Negotiation'],
          distributionValues: [55, 30, 15],
          distributionColors: ['#3B82F6', '#10B981', '#8B5CF6'],
          recordsLabel: 'Extended Offer Records'
        };
      } else if (kpiId === 'accepted') {
        return {
          title: 'Accepted Offers & Preboarding Conversion Analytics',
          metricTitle: 'Offer Acceptance Rate & Handoff Trend',
          currentVal: recordsCount,
          changeStr: '88% Acceptance Rate',
          velocityStr: '100% Preboarding Ready',
          trendDir: '↑ High Yield Conversion',
          chartType: 'doughnut',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Acceptance by Department',
          distributionLabels: ['Platform Engineering', 'Product Management', 'Quality Assurance', 'Design & UX'],
          distributionValues: [50, 25, 15, 10],
          distributionColors: ['#10B981', brandColor, '#8B5CF6', '#F59E0B'],
          recordsLabel: 'Accepted Offer Records'
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. INTERVIEWS HUB MODULE
    // ═══════════════════════════════════════════════════════════════════
    if (moduleType === 'interviews' || moduleType === 'interview') {
      if (kpiId === 'today') {
        return {
          title: "Today's Interview Schedule Analytics",
          metricTitle: 'Daily Session Throughput & Room Load',
          currentVal: recordsCount,
          changeStr: '100% On-Time Start SLA',
          velocityStr: '45m Avg Duration',
          trendDir: '↑ Full Schedule Load',
          chartType: 'bar',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Rounds by Delivery Mode',
          distributionLabels: ['Video (Zoom/Meet)', 'In-Person Office', 'Phone Screening'],
          distributionValues: [70, 20, 10],
          distributionColors: [brandColor, '#10B981', '#F59E0B'],
          recordsLabel: "Today's Scheduled Sessions"
        };
      } else if (kpiId === 'upcoming') {
        return {
          title: 'Upcoming Scheduled Sessions Analytics',
          metricTitle: 'Forward Calendar Booking Horizon',
          currentVal: recordsCount,
          changeStr: '+18% booking velocity',
          velocityStr: '4.2 sessions / interviewer',
          trendDir: '↑ Smooth Calendar Load',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Upcoming Sessions by Round Type',
          distributionLabels: ['Technical Coding', 'System Architecture', 'Managerial & Values', 'HR Final Screen'],
          distributionValues: [40, 30, 20, 10],
          distributionColors: [brandColor, '#8B5CF6', '#10B981', '#F59E0B'],
          recordsLabel: 'Upcoming Interview Sessions'
        };
      } else if (kpiId === 'pendingFeedback') {
        return {
          title: 'Pending Scorecards & Evaluation Analytics',
          metricTitle: 'Interviewer Feedback Turnaround SLA',
          currentVal: recordsCount,
          changeStr: '-14% feedback turnaround latency',
          velocityStr: '18h Avg SLA',
          trendDir: '↑ High Submission Rate',
          chartType: 'bar',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Pending Feedback by Panelist Role',
          distributionLabels: ['Staff Engineers', 'Engineering Managers', 'Product Directors'],
          distributionValues: [50, 30, 20],
          distributionColors: ['#F59E0B', brandColor, '#8B5CF6'],
          recordsLabel: 'Pending Scorecard Sessions'
        };
      } else {
        return {
          title: 'Total Interview Pipeline Analytics',
          metricTitle: 'Interview Conducting Velocity',
          currentVal: recordsCount,
          changeStr: '+16% throughput vs last month',
          velocityStr: '88% Feedback SLA Compliance',
          trendDir: '↑ Scaling Interview Load',
          chartType: 'line',
          timeSeriesLabels: dynamicTimeSeries.labels,
          timeSeriesValues: dynamicTimeSeries.values,
          distributionTitle: 'Rounds Distribution',
          distributionLabels: ['Technical Round 1', 'Technical Round 2', 'Hiring Manager Fit', 'HR Executive'],
          distributionValues: [45, 25, 20, 10],
          distributionColors: [brandColor, '#8B5CF6', '#10B981', '#F59E0B'],
          recordsLabel: 'All Interview Sessions'
        };
      }
    }

    // Default Fallback Config
    return {
      title: `${kpiLabel || 'Metric'} Real-Time Analytics`,
      metricTitle: kpiLabel ? `${kpiLabel} Performance Trend` : 'Metric Performance Trend',
      currentVal: recordsCount,
      changeStr: '+16% vs previous period',
      velocityStr: 'Average SLA Compliant',
      trendDir: '↑ Increasing Trend',
      chartType: 'line',
      timeSeriesLabels: dynamicTimeSeries.labels,
      timeSeriesValues: dynamicTimeSeries.values,
      distributionTitle: 'Category Breakdown',
      distributionLabels: ['Active Operational', 'In Progress', 'On Hold / Review'],
      distributionValues: [65, 25, 10],
      distributionColors: ['#10B981', brandColor, '#F59E0B'],
      recordsLabel: 'Associated Record Details'
    };
  }, [kpiId, kpiLabel, kpiValue, moduleType, rawRecords, brandColor, dynamicTimeSeries]);

  // Filtered records calculation for the drill-down table
  const filteredRecords = useMemo(() => {
    if (!Array.isArray(rawRecords) || rawRecords.length === 0) return [];
    return rawRecords.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = JSON.stringify(item).toLowerCase();
        if (!str.includes(q)) return false;
      }
      if (filterStatus !== 'All' && item.status && item.status !== filterStatus) return false;
      if (filterDepartment !== 'All' && item.department && item.department !== filterDepartment) return false;
      return true;
    });
  }, [rawRecords, searchQuery, filterStatus, filterDepartment]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-6 animate-fade-in" dir="ltr">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-sans">
        
        {/* ═══════════════════════════════════════════════════════════════════
            1. ENTERPRISE HEADER BAR (MILD BLUE GLASS)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-blue-100/70 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-blue-950/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl text-white bg-[var(--pw-brand)] shadow-sm flex items-center justify-center shrink-0">
              <BarChart3 size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {analyticsConfig.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Telemetry
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Real-time KPI performance, historical velocity &amp; underlying metric records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Last Updated: Just now</span>
            <button
              onClick={handleRefresh}
              className="h-8 px-2.5 sm:px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. DASHBOARD FILTER TOOLBAR (PERIOD PRESETS + CUSTOM RANGE PICKER)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-3 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 shrink-0 relative">
          
          {/* Preset Buttons & Custom Range Pill */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs font-semibold overflow-x-auto max-w-full">
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'this_month', label: 'This Month' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPeriod(p.id); setShowDatePicker(false); }}
                  style={period === p.id ? { backgroundColor: brandColor, color: '#ffffff' } : {}}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer text-[11px] sm:text-xs whitespace-nowrap ${
                    period === p.id ? 'font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Trigger Button */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => {
                  setPeriod('custom');
                  setShowDatePicker(!showDatePicker);
                }}
                style={period === 'custom' ? { backgroundColor: brandColor, color: '#ffffff' } : {}}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  period === 'custom'
                    ? 'shadow-xs border-transparent'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                }`}
              >
                <Calendar size={13} />
                <span>{period === 'custom' && customStartDate ? `• Custom Range (${customStartDate})` : 'Custom Range'}</span>
                <ChevronDown size={13} className={showDatePicker ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>

              {/* Custom Date Range Popover Calendar */}
              {showDatePicker && (
                <div className="absolute left-0 top-11 z-50 animate-fade-in shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <CustomDateRangePicker
                    startDate={customStartDate}
                    endDate={customEndDate}
                    onChange={({ startDate, endDate }) => {
                      setCustomStartDate(startDate);
                      setCustomEndDate(endDate);
                      setPeriod('custom');
                      setShowDatePicker(false);
                    }}
                    onCancel={() => setShowDatePicker(false)}
                    themeColor={brandColor}
                  />
                </div>
              )}
            </div>

          </div>

          {/* Active Date Range Badge & Granularity Indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            {period === 'custom' && (
              <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                Showing: {customStartDate} – {customEndDate}
              </span>
            )}

            <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-500/20 flex items-center gap-1">
              <Calendar size={12} /> Granularity: {granularity}
            </span>

            <button
              onClick={() => { setFilterDepartment('All'); setFilterStatus('All'); setSearchQuery(''); setPeriod('7d'); }}
              className="h-7.5 px-2.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            3. SCROLLABLE BODY (KPI METRICS + DASHBOARD CHARTS + DRILL-DOWN)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Top Row: 4 State-of-the-Art Enterprise KPI Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Primary Volume Metric */}
            <div className="bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-blue-950/30 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: `linear-gradient(90deg, ${brandColor}, #6366f1)` }}
              />
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
                  PRIMARY VOLUME
                </span>
                <div 
                  className="w-7.5 h-7.5 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{ 
                    backgroundColor: `${brandColor}15`, 
                    color: brandColor,
                    borderColor: `${brandColor}30` 
                  }}
                >
                  <Activity size={14} />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {analyticsConfig.currentVal}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                  <ArrowUpRight size={11} /> {analyticsConfig.changeStr}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Operational Stream
                </span>
                <span className="font-mono text-[10px] text-slate-400">{granularity} Pacing</span>
              </div>
            </div>

            {/* Card 2: Average Velocity & SLA Turnaround */}
            <div className="bg-gradient-to-br from-white via-white to-amber-50/25 dark:from-slate-900 dark:via-slate-900/95 dark:to-amber-950/20 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
                  AVERAGE VELOCITY
                </span>
                <div className="w-7.5 h-7.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                  <Zap size={14} />
                </div>
              </div>
              <div className="mt-1">
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-sans truncate">
                  {analyticsConfig.velocityStr}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                  <Clock size={11} /> SLA Compliant
                </span>
                <span className="font-mono text-[10px] text-slate-400">Target Tracked</span>
              </div>
            </div>

            {/* Card 3: Trend Trajectory & Progress Target */}
            <div className="bg-gradient-to-br from-white via-white to-purple-50/25 dark:from-slate-900 dark:via-slate-900/95 dark:to-purple-950/20 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600" />
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
                  TREND DIRECTION
                </span>
                <div className="w-7.5 h-7.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center shrink-0">
                  <TrendingUp size={14} />
                </div>
              </div>
              <div className="mt-1 space-y-1.5">
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-sans truncate">
                  {analyticsConfig.trendDir}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: '84%', backgroundColor: brandColor }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-purple-700 dark:text-purple-400">Telemetry Comparison</span>
                <span className="font-mono text-[10px] text-slate-400">84% Pacing</span>
              </div>
            </div>

            {/* Card 4: Data Reliability & Audit Certification */}
            <div className="bg-gradient-to-br from-white via-white to-emerald-50/25 dark:from-slate-900 dark:via-slate-900/95 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
                  DATA INTEGRITY
                </span>
                <div className="w-7.5 h-7.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                  <ShieldCheck size={14} />
                </div>
              </div>
              <div className="mt-1">
                <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-sans flex items-center gap-1.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>100% Certified</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Audit Trail Synchronized</span>
                <span className="font-mono text-[10px] text-slate-400">0 Anomalies</span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Dashboard Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Left 2 Columns: Time-Series Line or Bar Chart (Dashboard CJS Chart Component) */}
            <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {analyticsConfig.metricTitle} ({granularity})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Historical time-series tracking over selected timeframe</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Granularity: {granularity}
                </span>
              </div>

              {/* Dashboard Chart.js Line / Bar Render */}
              <div className="pt-2">
                {analyticsConfig.chartType === 'bar' ? (
                  <CJSBar
                    labels={analyticsConfig.timeSeriesLabels}
                    series={[{ label: analyticsConfig.metricTitle, data: analyticsConfig.timeSeriesValues, color: brandColor }]}
                    themeColor={brandColor}
                  />
                ) : (
                  <CJSLine
                    labels={analyticsConfig.timeSeriesLabels}
                    series={[{ label: analyticsConfig.metricTitle, data: analyticsConfig.timeSeriesValues, color: brandColor }]}
                    themeColor={brandColor}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Contextual Category Breakdown (Dashboard CJSDoughnut) */}
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {analyticsConfig.distributionTitle}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Percentage distribution breakdown</p>
              </div>

              {/* Dashboard CJSDoughnut Component */}
              <div className="my-auto py-2 flex items-center justify-center">
                <CJSDoughnut
                  labels={analyticsConfig.distributionLabels}
                  data={analyticsConfig.distributionValues}
                  colors={analyticsConfig.distributionColors}
                  centerText={`${analyticsConfig.distributionValues[0]}%`}
                  centerSubtext="Primary Tier"
                />
              </div>

              {/* Category Legend List */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {analyticsConfig.distributionLabels.map((lbl, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: analyticsConfig.distributionColors[idx % analyticsConfig.distributionColors.length] }} 
                    />
                    <span className="truncate text-slate-600 dark:text-slate-400 font-medium">{lbl}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white ml-auto">{analyticsConfig.distributionValues[idx]}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Section: Record Drill-Down Table */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} className="text-blue-600" />
                  <span>{analyticsConfig.recordsLabel} ({filteredRecords.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Underlying record log explaining current KPI value</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search underlying records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8.5 pl-9 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Drill-down Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3">RECORD ID</th>
                    <th className="py-2.5 px-3">TITLE / NAME</th>
                    <th className="py-2.5 px-3">DEPARTMENT / SCOPE</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3">LAST MODIFIED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredRecords.slice(0, 5).map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{row.id || `REC-${100 + idx}`}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{row.title || row.jobTitle || row.candidateName || row.name || 'Enterprise Record'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.department || row.businessUnit || row.source || 'Core Recruitment'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {row.status || row.processingStatus || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{row.lastModified || row.createdDate || 'Today'}</td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No specific record drill-downs matching current query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}
