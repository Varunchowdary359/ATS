import React, { useState, useContext, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Briefcase, Share2, Copy, Check, ExternalLink, RefreshCw, 
  Search, Filter, Plus, Clock, Users, ArrowUpRight, ShieldCheck, 
  TrendingUp, CheckCircle2, Eye, Sparkles, Building, Building2, UserCheck, Award,
  AlertTriangle, Calendar, History, Settings, Key, Zap, CheckCircle, X,
  Radio, Layers, Terminal, AlertCircle, Laptop, Wrench, LayoutGrid, Table,
  SlidersHorizontal, Download, Sliders, Trash2, ChevronRight, Crown, Lock
} from 'lucide-react';
import { ThemeContext } from '../../../ThemeContext';
import { useToast } from '../../shared/ToastContext';
import { INITIAL_REQUISITIONS } from '../recruitmentMockData';
import { INITIAL_JDS } from '../jd/jdMockData';
import { DatabaseService } from '../../../services/db/DatabaseService';
import CustomSelect from '../../dashboard/shared/CustomSelect';
import DataTable from '../../dashboard/shared/DataTable';
import EnterpriseKpiAnalyticsModal from '../../dashboard/shared/EnterpriseKpiAnalyticsModal';
import ConfirmModal from '../../admin/shared/ConfirmModal';
import { ModernStatusBadge } from '../../admin/shared/ModernAdminLayoutComponents';

// High-Resolution Authentic Brand SVG Logos
const LinkedInLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#0A66C2"/>
    <path d="M12.5 14.5v13h-4.3v-13h4.3zm.2-4.5c0 1.2-1 2.2-2.3 2.2-1.3 0-2.3-1-2.3-2.2 0-1.2 1-2.2 2.3-2.2 1.3 0 2.3 1 2.3 2.2zm15.6 9.7v7.8h-4.3v-7.3c0-1.8-.7-3-2.4-3-1.3 0-2.1.9-2.4 1.7-.1.3-.1.7-.1 1.1v7.5h-4.3s.06-11.8 0-13h4.3v1.8c.6-.9 1.6-2.2 3.9-2.2 2.9 0 5 1.9 5 5.9v7.7h.3z" fill="#FFFFFF"/>
  </svg>
);

const IndeedLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#2164F3"/>
    <path d="M21.8 8.2c-1.8.1-3.3.9-4.3 2.2l2.3 1.8c.6-.7 1.5-1.1 2.5-1.2 1.8 0 3.3 1.3 3.3 3.2 0 1.8-1.3 3.2-3.3 3.2h-2.4c-4.9 0-8.4 4.1-8.1 9.4.3 4.5 4.1 7.9 8.7 7.9 5 0 9.3-4.1 9.3-9.3 0-10-8.3-17.2-18.4-17.2-1.3 0-2.6.2-3.8.5l.7 2.9c.9-.2 2.1-.3 3.2-.3 6.8 0 12.6 5.7 12.6 12.5 0 3.3-2.6 6-5.9 6-3 0-5.5-2.3-5.7-5.2-.3-3.2 2.1-5.9 5.2-6.1l2.5-.2c.3 0 .5-.3.5-.6 0-.3-.3-.6-.6-.6z" fill="#FFFFFF"/>
  </svg>
);

const NaukriLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#002D62"/>
    <rect x="7" y="14" width="4.2" height="13" rx="1" fill="#FFFFFF"/>
    <circle cx="9.1" cy="9.5" r="2.2" fill="#FF7555"/>
    <path d="M14.5 14h4v2.1c.9-1.5 2.5-2.4 4.5-2.4 3.8 0 6 2.5 6 6.5V27h-4.2v-6.2c0-2.3-1-3.5-2.8-3.5-1.6 0-2.8 1.1-3.3 2.5v7.2h-4.2V14z" fill="#FFFFFF"/>
    <circle cx="27" cy="10" r="2" fill="#00C9A7"/>
  </svg>
);

const GlassdoorLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#0CAA41"/>
    <path d="M9 10h18v4H13v12h14v-5h-7v-3h11v11H9V10z" fill="#FFFFFF"/>
  </svg>
);

const MonsterLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#5624D0"/>
    <path d="M8 9h4.5l5.5 10 5.5-10H28v18h-4.2v-10.5L18 25.2 12.2 16.5V27H8V9z" fill="#FFFFFF"/>
  </svg>
);

const CareersPortalLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#1E40AF"/>
    <circle cx="18" cy="18" r="8.5" stroke="#FFFFFF" strokeWidth="2.2" fill="none"/>
    <ellipse cx="18" cy="18" rx="4" ry="8.5" stroke="#FFFFFF" strokeWidth="2" fill="none"/>
    <path d="M9.5 18h17" stroke="#FFFFFF" strokeWidth="2"/>
  </svg>
);

const ReferralLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#059669"/>
    <path d="M23 15.5c1.9 0 3.5-1.6 3.5-3.5S24.9 8.5 23 8.5 19.5 10.1 19.5 12s1.6 3.5 3.5 3.5zm-10 0C14.9 15.5 16.5 13.9 16.5 12S14.9 8.5 13 8.5 9.5 10.1 9.5 12s1.6 3.5 3.5 3.5zm0 2.5c-2.7 0-8 1.4-8 4.1V25h16v-2.9c0-2.7-5.3-4.1-8-4.1zm10 0c-.3 0-.7.02-1.1.06 1.3 1 2.1 2.3 2.1 4.04V25h7v-2.9c0-2.7-5.3-4.1-8-4.1z" fill="#FFFFFF"/>
  </svg>
);

const MobilityLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#DB2777"/>
    <path d="M18 8l-7 7h4.5v11h5V15H25L18 8z" fill="#FFFFFF"/>
  </svg>
);

// 7 Supported Built-in Standard Job Posting Channels
const STANDARD_PORTAL_CHANNELS = [
  {
    id: 'careers_portal',
    name: 'Careers Portal',
    badge: 'Official',
    icon: CareersPortalLogo,
    color: '#3b82f6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    description: 'Host on official company careers web page with customized branding and application forms.',
    estimatedReach: '5,000+ monthly visits',
    method: 'Direct Web Form',
    defaultActive: true,
    isCustom: false
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Jobs',
    badge: 'Enterprise',
    icon: LinkedInLogo,
    color: '#0a66c2',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    description: 'One-click sync to LinkedIn Recruiter enterprise job feed and candidate matching.',
    estimatedReach: '50,000+ passive professionals',
    method: 'REST API Feed',
    defaultActive: true,
    isCustom: false
  },
  {
    id: 'naukri',
    name: 'Naukri.com',
    badge: 'India Lead',
    icon: NaukriLogo,
    color: '#f97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    description: 'Direct distribution to India’s largest talent portal with automated resume matches.',
    estimatedReach: '80,000+ active job seekers',
    method: 'SuperSet API',
    defaultActive: true,
    isCustom: false
  },
  {
    id: 'indeed',
    name: 'Indeed',
    badge: 'Global Sync',
    icon: IndeedLogo,
    color: '#2557a7',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    description: 'Sponsored and organic job board syndication with quick-apply integration.',
    estimatedReach: '120,000+ global candidates',
    method: 'XML Syndication',
    defaultActive: true,
    isCustom: false
  },
  {
    id: 'monster',
    name: 'Monster / Foundry',
    badge: 'Global Feed',
    icon: MonsterLogo,
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    description: 'Syndicate job listings across Monster international job network.',
    estimatedReach: '30,000+ candidates',
    method: 'RSS Syndication',
    defaultActive: false,
    isCustom: false
  },
  {
    id: 'employee_referral',
    name: 'Employee Referral',
    badge: 'Internal Bonus',
    icon: ReferralLogo,
    color: '#10b981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    description: 'Publish on internal employee referral dashboard with cash bonus incentives.',
    estimatedReach: 'Internal Employees',
    method: 'Internal Webhook',
    defaultActive: true,
    isCustom: false
  },
  {
    id: 'internal_mobility',
    name: 'Internal Mobility',
    badge: 'Employees Only',
    icon: MobilityLogo,
    color: '#ec4899',
    bgColor: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    description: 'Enable internal team members to apply for transfers or promotions before external hiring.',
    estimatedReach: 'Internal Workforce',
    method: 'HRIS Portal Sync',
    defaultActive: true,
    isCustom: false
  }
];

// Pre-configured Global & Regional Real Job Boards Catalog (30+ Verified Real Platforms)
const REAL_CHANNEL_PRESETS = [
  // India & South Asia Leaders
  { name: 'TimesJobs', badge: 'India Enterprise Lead', reach: '35,000,000+ candidates', description: 'Times Group flagship recruitment platform across Corporate & IT.' },
  { name: 'Shine.com', badge: 'India Corporate', reach: '30,000,000+ candidates', description: 'HT Media network job portal for mid and senior hiring.' },
  { name: 'Naukri.com', badge: 'India Lead', reach: '80,000,000+ registered resumes', description: 'Largest recruitment portal in India across all industries.' },
  { name: 'Foundit (Monster India)', badge: 'India & SEA Sync', reach: '40,000,000+ candidates', description: 'Next-gen talent platform across APAC and South Asia.' },
  { name: 'Freshersworld', badge: 'Campus & Entry Level', reach: '18,000,000+ fresh graduates', description: 'India’s #1 portal for college hiring and entry-level talent.' },
  { name: 'Unstop (Dare2Compete)', badge: 'Students & Developers', reach: '10,000,000+ students & devs', description: 'College engagement, hackathons and early-talent recruitment.' },
  { name: 'WorkIndia', badge: 'Entry Level & Blue Collar', reach: '25,000,000+ candidates', description: 'Hyperlocal hiring platform for frontline and support staff.' },
  { name: 'Jobhai', badge: 'Regional India Lead', reach: '12,000,000+ applicants', description: 'Info Edge localized hiring network across Tier 1, 2 & 3 cities.' },
  { name: 'PlacementIndia', badge: 'Multi-Industry Feed', reach: '15,000,000+ candidates', description: 'B2B and enterprise job distribution across Indian states.' },

  // Global Enterprise Leaders
  { name: 'Glassdoor', badge: 'Global Reviews & Jobs', reach: '55,000,000+ job seekers', description: 'Global employer review and job board syndication.' },
  { name: 'Instahyre', badge: 'India Tech Lead', reach: '25,000,000+ engineers', description: 'AI-driven tech recruitment platform for India.' },
  { name: 'SEEK Australia', badge: 'APAC Lead', reach: '35,000,000+ applicants', description: 'Leading job marketplace in Australia, NZ & APAC.' },
  { name: 'ZipRecruiter', badge: 'US & Global Sync', reach: '45,000,000+ candidates', description: 'AI-matched job distribution network across N. America.' },
  { name: 'Snagajob', badge: 'Hourly & Retail', reach: '100,000,000+ registered workers', description: 'Largest US platform for hourly, hospitality and retail jobs.' },
  { name: 'CareerBuilder', badge: 'US Enterprise', reach: '35,000,000+ candidate profiles', description: 'Global HR tech and enterprise applicant syndication.' },
  { name: 'Google for Jobs', badge: 'Organic SEO Feed', reach: '100,000,000+ searchers', description: 'Direct structured data index on Google Search results.' },

  // Tech, Developer & Startup Networks
  { name: 'Wellfound (AngelList)', badge: 'Startups & Remote', reach: '15,000,000+ talent', description: 'Top platform for startup hiring, founders & remote roles.' },
  { name: 'Dice IT', badge: 'Niche Tech', reach: '12,000,000+ tech pros', description: 'Specialized technology and software engineering portal.' },
  { name: 'Stack Overflow Jobs', badge: 'Developer Network', reach: '18,000,000+ devs', description: 'Targeted tech job postings on global developer community.' },
  { name: 'Hired', badge: 'Curated Developers', reach: '10,000,000+ candidates', description: 'Curated marketplace connecting top engineers to employers.' },
  { name: 'Turing.com', badge: 'AI Remote Engineers', reach: '3,000,000+ vetted devs', description: 'AI-powered platform for remote software engineers.' },

  // Remote & Hybrid Networks
  { name: 'FlexJobs', badge: 'Remote & Hybrid', reach: '8,000,000+ remote workers', description: 'Vetted remote, flexible, and hybrid work network.' },
  { name: 'We Work Remotely', badge: 'Global Remote', reach: '6,000,000+ candidates', description: 'Largest remote work community for tech and design.' },
  { name: 'RemoteOK', badge: 'Tech Remote Feed', reach: '5,000,000+ monthly visitors', description: 'Popular global remote work board for software & digital roles.' },

  // European & UK Portals
  { name: 'Totaljobs UK', badge: 'UK & Europe', reach: '20,000,000+ applicants', description: 'One of the UK’s largest commercial job platforms.' },
  { name: 'Reed.co.uk', badge: 'UK Enterprise Lead', reach: '25,000,000+ job seekers', description: 'UK’s #1 commercial job site across corporate sectors.' },
  { name: 'Jooble', badge: 'Global Aggregator', reach: '50,000,000+ monthly users', description: 'International job search aggregator operating in 71 countries.' },

  // MENA & Middle East Portals
  { name: 'Bayt MENA', badge: 'Middle East Lead', reach: '45,000,000+ candidates', description: 'Premier job site in UAE, Saudi Arabia, and MENA region.' },
  { name: 'Naukrigulf', badge: 'Middle East NRI', reach: '15,000,000+ Gulf job seekers', description: 'Leading Middle East job portal for ex-pat & local hiring.' },
  { name: 'GulfTalent', badge: 'UAE & Qatar Lead', reach: '10,000,000+ professionals', description: 'Senior management & corporate job platform in Middle East.' }
];

export default function JobPostingsHub({ onNavigate, initialReqId }) {
  const { addToast } = useToast();
  const { activeTheme } = useContext(ThemeContext);
  const brandColor = activeTheme?.color || '#1A56DB';

  // Mount Guard for Safe SSR Hydration
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. RBAC Persona Simulator & View Mode
  const [simulatedRole, setSimulatedRole] = useState('Recruiter / Publisher');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [currentTab, setCurrentTab] = useState('overview'); // 'overview' | 'active' | 'scheduled' | 'custom' | 'offline'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeKpiModal, setActiveKpiModal] = useState(null);

  // Role Permission Scoping
  const isAdmin = simulatedRole === 'Company Admin / Integration Lead';
  const isPublisher = simulatedRole === 'Recruiter / Publisher' || isAdmin;
  const isHiringManager = simulatedRole === 'Hiring Manager / Approver';

  // Load Requisitions from DatabaseService with fallback to mock data
  const [requisitions, setRequisitions] = useState(() => {
    try {
      DatabaseService.init();
      if (DatabaseService.requisitions && DatabaseService.requisitions.length > 0) {
        return DatabaseService.requisitions;
      }
      const stored = sessionStorage.getItem('pw_requisitions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_REQUISITIONS;
    } catch (e) {
      return INITIAL_REQUISITIONS;
    }
  });

  // Real-time synchronization when AI creates or publishes postings/requisitions
  useEffect(() => {
    const handleSync = () => {
      DatabaseService.init();
      if (DatabaseService.requisitions && DatabaseService.requisitions.length > 0) {
        setRequisitions([...DatabaseService.requisitions]);
      }
    };
    window.addEventListener('pw_db_updated', handleSync);
    window.addEventListener('pw:posting_created', handleSync);
    window.addEventListener('pw_posting_published', handleSync);
    window.addEventListener('pw:requisition_created', handleSync);
    return () => {
      window.removeEventListener('pw_db_updated', handleSync);
      window.removeEventListener('pw:posting_created', handleSync);
      window.removeEventListener('pw_posting_published', handleSync);
      window.removeEventListener('pw:requisition_created', handleSync);
    };
  }, []);

  // Filter ONLY Approved, Open, or Active Requisitions ready for Job Distribution
  const approvedRequisitions = useMemo(() => {
    return requisitions.filter(r => r.status === 'Approved' || r.status === 'Open' || r.status === 'Published');
  }, [requisitions]);

  const [selectedReqId, setSelectedReqId] = useState(initialReqId || approvedRequisitions[0]?.id || '');

  useEffect(() => {
    if (initialReqId) {
      setSelectedReqId(initialReqId);
    } else if (!selectedReqId && approvedRequisitions.length > 0) {
      setSelectedReqId(approvedRequisitions[0]?.id);
    }
  }, [initialReqId, approvedRequisitions, selectedReqId]);

  const [copiedLink, setCopiedLink] = useState(false);

  // Active Channel States
  const [channelStatus, setChannelStatus] = useState({
    careers_portal: true,
    linkedin: true,
    naukri: true,
    indeed: true,
    monster: false,
    employee_referral: true,
    internal_mobility: true
  });

  // Custom Channels Added by Admin
  const [customChannels, setCustomChannels] = useState([
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      badge: 'Custom Sync',
      icon: GlassdoorLogo,
      color: '#059669',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      description: 'Employer brand syndication & direct job posting API.',
      estimatedReach: '45,000+ job seekers',
      method: 'Custom REST API',
      defaultActive: true,
      isCustom: true,
      apiKey: 'pk_live_glassdoor_99481'
    }
  ]);

  // Combined Portals Array
  const allPortals = useMemo(() => [...STANDARD_PORTAL_CHANNELS, ...customChannels], [customChannels]);

  // Filtered Channels for Grid / Table Views
  const filteredPortals = useMemo(() => {
    return allPortals.filter(portal => {
      const isLive = !!channelStatus[portal.id];

      // Nav Tab Filter
      if (currentTab === 'active' && !isLive) return false;
      if (currentTab === 'offline' && isLive) return false;
      if (currentTab === 'custom' && !portal.isCustom) return false;

      // Category Dropdown Filter
      if (categoryFilter !== 'All' && portal.badge !== categoryFilter) return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return portal.name.toLowerCase().includes(q) || portal.description.toLowerCase().includes(q) || portal.badge.toLowerCase().includes(q);
      }

      return true;
    });
  }, [allPortals, channelStatus, currentTab, categoryFilter, searchQuery]);

  // Modals & Drawers State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPortal, setPreviewPortal] = useState(null);
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [newChannelForm, setNewChannelForm] = useState({
    name: '',
    badge: 'Custom API',
    reach: '25,000+ job seekers',
    description: '',
    integrationType: 'API',
    apiKey: '',
    apiSecret: '',
    feedUrl: ''
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  // Scheduling State (12-Hour Format with AM/PM & Timezone)
  const [scheduleDate, setScheduleDate] = useState('2026-08-28');
  const [scheduleHour, setScheduleHour] = useState('09');
  const [scheduleMinute, setScheduleMinute] = useState('00');
  const [scheduleMeridiem, setScheduleMeridiem] = useState('AM');
  const [scheduleTimezone, setScheduleTimezone] = useState('IST (UTC+5:30)');
  const [postingLifecycle, setPostingLifecycle] = useState('Published');

  const formatScheduleBadgeDate = (dateStr) => {
    if (!dateStr) return '28 Aug 2026';
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(month, 10) - 1;
      return `${day} ${months[monthIndex] || month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Simulated API Error & Retry State
  const [apiErrorChannel, setApiErrorChannel] = useState(null);

  // Audit History Log State
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: '2026-08-25 10:30 AM', actor: 'Sujith (Recruiter)', action: 'Published REQ-2026-0001 to 6 Channels', channel: 'Multi-Portal Sync', status: 'Success ✅' },
    { id: 2, timestamp: '2026-08-25 11:15 AM', actor: 'Admin (System)', action: 'Connected Custom Channel: Glassdoor API', channel: 'Glassdoor', status: 'Active ⚡' }
  ]);

  // Keyboard Escape listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPreviewOpen(false);
        setIsAddChannelOpen(false);
        setIsScheduleOpen(false);
        setShowAuditTrail(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedReq = useMemo(() => {
    return approvedRequisitions.find(r => r.id === selectedReqId) || approvedRequisitions[0];
  }, [approvedRequisitions, selectedReqId]);

  const linkedJd = useMemo(() => {
    return INITIAL_JDS.find(j => j.reqId === selectedReqId || j.title === selectedReq?.jobTitle) || INITIAL_JDS[0];
  }, [selectedReqId, selectedReq]);

  const publicJobUrl = `https://careers.peopleworks.ai/jobs/${selectedReq?.id || 'REQ-2026-0001'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicJobUrl);
    setCopiedLink(true);
    addToast({
      title: 'Public Link Copied!',
      message: `Shareable application URL for ${selectedReq?.id} copied to clipboard.`,
      type: 'success'
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const toggleChannel = (channelId, channelName) => {
    if (!isPublisher) {
      addToast({
        title: 'Permission Restricted 🔒',
        message: 'Only Recruiters and Admins can toggle live channel distribution feeds.',
        type: 'warning'
      });
      return;
    }

    if (channelId === 'naukri' && apiErrorChannel === 'naukri') {
      addToast({
        title: 'API Authentication Error ⚠️',
        message: `Naukri.com API credentials expired (Error 401). Please click Retry Connection.`,
        type: 'error'
      });
      return;
    }

    const nextState = !channelStatus[channelId];
    setChannelStatus(prev => ({ ...prev, [channelId]: nextState }));
    
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      actor: simulatedRole,
      action: `${nextState ? 'Published' : 'Unpublished'} ${selectedReq?.id} on ${channelName}`,
      channel: channelName,
      status: nextState ? 'Live 🟢' : 'Offline ⚪'
    };
    setAuditLogs(prev => [logEntry, ...prev]);

    addToast({
      title: nextState ? 'Channel Published' : 'Channel Unpublished',
      message: `${selectedReq?.id} (${selectedReq?.jobTitle}) is now ${nextState ? 'LIVE on' : 'removed from'} ${channelName}.`,
      type: nextState ? 'success' : 'info'
    });
  };

  const handleBulkPublish = () => {
    if (!isPublisher) {
      addToast({
        title: 'Permission Restricted 🔒',
        message: 'Only Recruiters and Admins can bulk publish jobs across channels.',
        type: 'warning'
      });
      return;
    }
    const updated = {};
    allPortals.forEach(p => { updated[p.id] = true; });
    setChannelStatus(updated);
    setPostingLifecycle('Published');

    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      actor: simulatedRole,
      action: `Bulk Published ${selectedReq?.id} to all ${allPortals.length} active channels`,
      channel: 'All Distribution Portals',
      status: 'Success ✅'
    };
    setAuditLogs(prev => [logEntry, ...prev]);

    addToast({
      title: 'Bulk Publishing Complete! 🚀',
      message: `${selectedReq?.id} syndicated across all ${allPortals.length} channels simultaneously.`,
      type: 'success'
    });
  };

  const handleTestConnection = () => {
    if (!newChannelForm.name) {
      addToast({ title: 'Validation Error', message: 'Please enter a Channel Name first.', type: 'warning' });
      return;
    }
    setTestingConnection(true);
    setConnectionSuccess(false);
    setTimeout(() => {
      setTestingConnection(false);
      setConnectionSuccess(true);
      addToast({
        title: 'Connection Successful! ✅',
        message: `API Handshake with ${newChannelForm.name} endpoint verified (Status 200 OK · Latency 115ms).`,
        type: 'success'
      });
    }, 1200);
  };

  const resetChannelForm = () => {
    setNewChannelForm({
      name: '',
      badge: 'Custom API',
      reach: '25,000+ job seekers',
      description: '',
      integrationType: 'API',
      apiKey: '',
      apiSecret: '',
      feedUrl: ''
    });
    setFormErrors({});
    setIsChannelDropdownOpen(false);
    setConnectionSuccess(false);
  };

  const handleOpenAddChannel = () => {
    if (!isAdmin) {
      addToast({
        title: 'Permission Restricted 🔒',
        message: 'Only Company Admin / Integration Lead can connect new integration channels.',
        type: 'warning'
      });
      return;
    }
    resetChannelForm();
    setIsAddChannelOpen(true);
  };

  const handleOpenScheduleModal = () => {
    if (isHiringManager) {
      addToast({
        title: 'Read-Only Mode 🔒',
        message: 'Hiring Managers have view & preview permissions. Contact Recruiter to schedule/publish.',
        type: 'warning'
      });
      return;
    }
    setIsScheduleOpen(true);
  };

  const handleSaveCustomChannel = () => {
    if (!isAdmin) {
      addToast({
        title: 'Permission Restricted 🔒',
        message: 'Only Company Admin / Integration Lead can save channel integrations.',
        type: 'warning'
      });
      return;
    }
    const errors = {};
    const trimmedName = newChannelForm.name.trim();
    const trimmedApiKey = newChannelForm.apiKey.trim();

    if (!trimmedName) {
      errors.name = 'Channel / Portal name is required.';
    } else {
      const exists = allPortals.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
      if (exists) {
        errors.name = `"${trimmedName}" is already connected to your hub.`;
      }
    }

    if (!trimmedApiKey || trimmedApiKey.length < 5) {
      errors.apiKey = 'Please provide a valid API key or endpoint (min 5 chars).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast({ title: 'Validation Required ⚠️', message: Object.values(errors)[0], type: 'warning' });
      return;
    }

    setFormErrors({});

    const newId = trimmedName.toLowerCase().replace(/\s+/g, '_');
    const createdChannel = {
      id: newId,
      name: trimmedName,
      badge: newChannelForm.badge || 'Custom API',
      icon: GlassdoorLogo,
      color: '#0284c7',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      description: newChannelForm.description || 'Enterprise integration portal added by recruiter.',
      estimatedReach: newChannelForm.reach || '30,000+ candidates',
      method: `${newChannelForm.integrationType} Direct`,
      defaultActive: true,
      isCustom: true,
      apiKey: trimmedApiKey
    };

    setCustomChannels(prev => [...prev, createdChannel]);
    setChannelStatus(prev => ({ ...prev, [newId]: true }));
    setIsAddChannelOpen(false);

    setAuditLogs(prev => [{
      id: Date.now(),
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      actor: simulatedRole,
      action: `Connected Custom Channel: ${createdChannel.name}`,
      channel: createdChannel.name,
      status: 'Active ⚡'
    }, ...prev]);

    addToast({
      title: 'Channel Connected Successfully! 🎉',
      message: `${createdChannel.name} is now active in your Job Postings Hub.`,
      type: 'success'
    });

    resetChannelForm();
  };

  // Delete Channel Confirmation State
  const [channelToDelete, setChannelToDelete] = useState(null);

  const handleDeleteCustomChannel = (channelId, channelName) => {
    if (!isAdmin) {
      addToast({
        title: 'Permission Restricted 🔒',
        message: 'Only Company Admin / Integration Lead can delete or disconnect custom channels.',
        type: 'warning'
      });
      return;
    }
    setChannelToDelete({ id: channelId, name: channelName });
  };

  const handleConfirmDeleteChannel = () => {
    if (!channelToDelete) return;
    const { id, name } = channelToDelete;
    
    setCustomChannels(prev => prev.filter(c => c.id !== id));
    setChannelStatus(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    setAuditLogs(prev => [{
      id: Date.now(),
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      actor: simulatedRole,
      action: `Disconnected Custom Channel: ${name}`,
      channel: name,
      status: 'Disconnected ❌'
    }, ...prev]);

    addToast({
      title: 'Channel Disconnected 🗑️',
      message: `${name} integration permanently removed from your active channels.`,
      type: 'info'
    });

    setChannelToDelete(null);
  };

  const handleSimulateApiFailure = () => {
    setApiErrorChannel('naukri');
    setChannelStatus(prev => ({ ...prev, naukri: false }));
    addToast({
      title: 'API Warning Simulated ⚠️',
      message: 'Naukri.com API token expired (Error 401). Retry banner is now active.',
      type: 'warning'
    });
  };

  const handleRetryApi = () => {
    setApiErrorChannel(null);
    setChannelStatus(prev => ({ ...prev, naukri: true }));
    addToast({
      title: 'API Retried & Re-Authenticated! ✅',
      message: 'Naukri.com token refreshed. Job posting is back LIVE.',
      type: 'success'
    });
  };

  const activeChannelsCount = Object.values(channelStatus).filter(Boolean).length;
  const totalChannelsCount = allPortals.length;

  // Table Columns Definition for Table View Mode
  const tableColumns = useMemo(() => [
    {
      header: 'CHANNEL / PORTAL',
      accessor: 'name',
      align: 'left',
      render: (val, row) => {
        const Icon = row.icon;
        return (
          <div className="flex items-center gap-3 py-1">
            <Icon className="w-8 h-8 shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{row.name}</span>
                {row.isCustom && (
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase">CUSTOM</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{row.description}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'CATEGORY',
      accessor: 'badge',
      align: 'center',
      render: (val, row) => (
        <div className="flex justify-center">
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${row.bgColor}`}>
            {val}
          </span>
        </div>
      )
    },
    {
      header: 'INTEGRATION METHOD',
      accessor: 'method',
      align: 'center',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {val}
        </span>
      )
    },
    {
      header: 'ESTIMATED REACH',
      accessor: 'estimatedReach',
      align: 'center',
      render: (val) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          {val}
        </span>
      )
    },
    {
      header: 'STATUS',
      accessor: 'status',
      align: 'center',
      render: (val, row) => {
        const isLive = !!channelStatus[row.id];
        return (
          <div className="flex justify-center">
            <span className={`font-bold text-[11px] flex items-center gap-1.5 ${
              isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {isLive ? 'LIVE' : 'Offline'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'PUBLISH TOGGLE',
      accessor: 'toggle',
      align: 'center',
      render: (val, row) => {
        const isLive = !!channelStatus[row.id];
        return (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => toggleChannel(row.id, row.name)}
              className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isLive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={isLive}
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  isLive ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        );
      }
    },
    {
      header: 'ACTIONS',
      accessor: 'actions',
      align: 'center',
      render: (val, row) => (
        <div className="flex items-center justify-center gap-1.5 py-0.5">
          <button
            onClick={() => {
              setPreviewPortal(row);
              setIsPreviewOpen(true);
            }}
            className="w-7 h-7 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            title="Preview Job Description"
          >
            <Eye size={13.5} />
          </button>
          {row.isCustom && (
            <button
              onClick={() => handleDeleteCustomChannel(row.id, row.name)}
              className="h-7 px-2.5 rounded-lg border border-rose-200/80 dark:border-rose-800/80 bg-rose-50/80 dark:bg-rose-950/50 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
              title="Delete Custom Channel"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          )}
        </div>
      )
    }
  ], [channelStatus]);

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans space-y-5 animate-fade-in-up">
      {/* LAYER 1: COMPACT ENTERPRISE SAAS HEADER (2-ROW LOW-HEIGHT CONTAINER) */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-gradient-to-br from-blue-50/40 via-white/70 to-slate-50/40 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-blue-950/20 backdrop-blur-xl border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(26,86,219,0.04)] space-y-3"
      >
        {/* ROW 1: Hub Title & Top-Right Access Cluster */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Title & Live Status */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
              style={{ backgroundColor: `${brandColor}15`, border: `1px solid ${brandColor}30` }}
            >
              <Globe size={18} style={{ color: brandColor }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                  Job Distribution &amp; Postings Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {activeChannelsCount} of {totalChannelsCount} Portals Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Syndicate approved Job Descriptions across high-converting job portals &amp; internal networks.
              </p>
            </div>
          </div>

          {/* Connect Cluster */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap self-end sm:self-center">
            <CustomSelect
              prefix="Role: "
              value={simulatedRole}
              onChange={(val) => setSimulatedRole(val)}
              options={[
                { label: 'Recruiter / Publisher', value: 'Recruiter / Publisher' },
                { label: 'Hiring Manager / Approver', value: 'Hiring Manager / Approver' },
                { label: 'Company Admin / Integration Lead', value: 'Company Admin / Integration Lead' }
              ]}
              size="sm"
              className="w-full sm:w-56"
            />

            {/* Permission Access Badge */}
            {isAdmin && (
              <span className="px-2.5 py-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-lg flex items-center gap-1 shrink-0">
                <Crown size={12} className="text-amber-600 dark:text-amber-400" /> Admin
              </span>
            )}
            {simulatedRole === 'Recruiter / Publisher' && (
              <span className="px-2.5 py-1 text-[10px] font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 rounded-lg flex items-center gap-1 shrink-0">
                <Radio size={12} className="text-blue-600 dark:text-blue-400" /> Publisher
              </span>
            )}
            {isHiringManager && (
              <span className="px-2.5 py-1 text-[10px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700 rounded-lg flex items-center gap-1 shrink-0">
                <Lock size={12} className="text-purple-600 dark:text-purple-400" /> View Only
              </span>
            )}

            <button
              onClick={handleOpenAddChannel}
              style={{ backgroundColor: brandColor }}
              className={`h-8.5 px-3.5 text-xs font-bold text-white rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                !isAdmin ? 'opacity-70' : 'hover:brightness-110'
              }`}
              title={!isAdmin ? "Only Company Admin / Integration Lead can connect new channels" : "Connect Custom API Channel"}
            >
              {!isAdmin ? <Lock size={13} className="text-amber-200" /> : <Plus size={14} />}
              <span className="whitespace-nowrap">Connect New Channel</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Active Requisition Selector Context & Action Strip */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Active REQ Dropdown & Badges Strip */}
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 h-8.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Active REQ:</span>
              <CustomSelect
                value={selectedReqId}
                onChange={(val) => setSelectedReqId(val)}
                options={approvedRequisitions.map(r => ({ label: `${r.id} · ${r.jobTitle}`, value: r.id }))}
                size="sm"
                className="w-48 sm:w-56"
                buttonClassName="border-0 bg-transparent shadow-none hover:bg-transparent text-xs font-semibold"
              />
            </div>

            {selectedReq && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                  REQ: <strong>{selectedReq.id}</strong>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                  JD: <strong>{linkedJd?.id || 'JD-2026-001'}</strong> ({linkedJd?.version ? (linkedJd.version.startsWith('v') ? linkedJd.version : `v${linkedJd.version}`) : 'v1.0'})
                </span>
                <ModernStatusBadge status={selectedReq.status} />

                {/* Persistent Scheduled Status Badge */}
                {postingLifecycle === 'Scheduled' && (
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md flex items-center gap-1.5">
                    <Calendar size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Scheduled · {formatScheduleBadgeDate(scheduleDate)} · {scheduleHour}:{scheduleMinute} {scheduleMeridiem}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Requisition Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleCopyLink}
              style={{ backgroundColor: brandColor }}
              className="h-8.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {copiedLink ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Shareable URL'}</span>
            </button>

            <button
              onClick={() => {
                setPreviewPortal(STANDARD_PORTAL_CHANNELS[0]);
                setIsPreviewOpen(true);
              }}
              className="h-8.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={13} className="text-blue-500" />
              <span>Job Preview</span>
            </button>

            <button
              onClick={handleOpenScheduleModal}
              className={`h-8.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                isHiringManager
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title={isHiringManager ? "Hiring Managers have read-only preview permissions" : "Schedule & Publish"}
            >
              {isHiringManager ? <Lock size={13} className="text-slate-400" /> : <Calendar size={13} className="text-amber-500" />}
              <span>Schedule &amp; Publish</span>
            </button>

            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className={`h-8.5 w-8.5 rounded-lg border transition-colors shadow-2xs cursor-pointer flex items-center justify-center ${
                showAuditTrail 
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
              title="Publish History Audit Trail"
            >
              <History size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Simulated API Error Warning Banner */}
      {apiErrorChannel && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span><strong>Naukri.com API Authentication Warning:</strong> Recruiter API token expired (Error 401). Postings paused until credentials refreshed.</span>
          </div>
          <button
            onClick={handleRetryApi}
            className="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
          >
            <RefreshCw size={12} className="animate-spin" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* LAYER 2: STANDARDIZED 4 KPI ANALYTICS CARDS (EXACT MATCH TO JD & REQUISITION HUBS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          {
            id: 'live_portals',
            label: 'TOTAL LIVE PORTALS',
            value: `${activeChannelsCount} / ${totalChannelsCount}`,
            subtitle: 'Syndicated across web & social',
            icon: <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
            trend: '+14%',
            trendUp: true,
            actionText: 'Manage Portals →',
            updatedAt: 'Just now'
          },
          {
            id: 'estimated_reach',
            label: 'ESTIMATED REACH',
            value: '330,000+',
            subtitle: 'Monthly active job seekers',
            icon: <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
            iconBg: 'bg-purple-50 dark:bg-purple-950/60',
            trend: '+28%',
            trendUp: true,
            actionText: 'Reach Stats →',
            updatedAt: '1h ago'
          },
          {
            id: 'total_applicants',
            label: 'TOTAL APPLICANTS',
            value: selectedReq?.candidateCount || 24,
            subtitle: 'Direct candidates from channels',
            icon: <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
            trend: '+14 this week',
            trendUp: true,
            actionText: 'View Applicants →',
            updatedAt: '5m ago'
          },
          {
            id: 'top_channel',
            label: 'TOP CHANNEL',
            value: 'LinkedIn Jobs',
            subtitle: '62% of qualified applicants',
            icon: <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
            iconBg: 'bg-amber-50 dark:bg-amber-950/60',
            trend: '62% Lead',
            trendUp: true,
            actionText: 'Channel Analytics →',
            updatedAt: 'Live Feed'
          }
        ].map((stat, idx) => (
          <motion.div 
            key={stat.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 + 0.1 }}
            onClick={() => setActiveKpiModal(stat)}
            className="px-3.5 py-2.5 rounded-xl border bg-gradient-to-br from-white/85 to-blue-50/25 dark:from-slate-900/80 dark:to-blue-950/20 backdrop-blur-md border-blue-100/60 dark:border-blue-900/30 transition-all duration-300 ease-out cursor-pointer relative overflow-hidden group flex flex-col justify-between hover:-translate-y-1 hover:shadow-md hover:border-blue-200/70 shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans">
                  {stat.label}
                </span>
                <div className={`p-1 rounded-lg border border-slate-200 dark:border-slate-700 ${stat.iconBg}`}>
                  {stat.icon}
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-xl font-extrabold text-[#0F172A] dark:text-white tracking-tight font-sans">
                  {stat.value}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${
                  stat.trendUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <ArrowUpRight size={9} /> {stat.trend}
                </span>
              </div>

              {stat.subtitle && (
                <p className="text-[11px] font-medium text-[#475569] dark:text-slate-400 mb-1.5 truncate">
                  {stat.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] font-medium text-[#64748B] dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800 transition-colors">
              <span className="text-[10px] font-mono text-[#64748B]">{stat.updatedAt}</span>
              <span className="font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform" style={{ color: brandColor }}>
                {stat.actionText} 📊
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* LAYER 3: ADVANCED CONTROL BAR (Nav Tabs + Search + Filter + View Switcher) */}
      <div className="space-y-3.5">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'overview', label: 'Overview', count: allPortals.length },
              { id: 'active', label: 'Active', count: activeChannelsCount },
              { id: 'custom', label: 'Custom Portals', count: customChannels.length },
              { id: 'offline', label: 'Offline', count: totalChannelsCount - activeChannelsCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                style={currentTab === tab.id ? { backgroundColor: brandColor } : {}}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  currentTab === tab.id
                    ? 'text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  currentTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleBulkPublish}
              style={{ backgroundColor: brandColor }}
              className={`px-3.5 py-1.5 text-xs font-bold text-white rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                !isPublisher ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              title={!isPublisher ? "Only Recruiters & Admins can bulk publish jobs" : "Syndicate across all channels"}
            >
              {!isPublisher ? <Lock size={13} /> : <Zap size={13} />}
              <span>Bulk Publish All</span>
            </button>

            <button
              onClick={handleSimulateApiFailure}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
              title="Dev Tool: Simulate API Auth Warning"
            >
              <span>Simulate Error</span>
              <AlertTriangle size={12} className="text-amber-500" />
            </button>
          </div>
        </div>

        {/* Filter Strip: Search + Category Filter + View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search distribution channels by name, category, reach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-[var(--pw-brand)] focus:ring-2 focus:ring-[var(--pw-brand)]/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter size={13} />
              <span>Category:</span>
              <CustomSelect
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                options={[
                  { label: 'All Categories', value: 'All' },
                  { label: 'Official', value: 'Official' },
                  { label: 'Enterprise', value: 'Enterprise' },
                  { label: 'India Lead', value: 'India Lead' },
                  { label: 'Global Sync', value: 'Global Sync' },
                  { label: 'Internal Bonus', value: 'Internal Bonus' },
                  { label: 'Custom API', value: 'Custom API' }
                ]}
                size="sm"
                className="w-40"
              />
            </div>

            {/* View Switcher (Grid vs Table View) */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={13} />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Table size={13} />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LAYER 4: CHANNEL DATA CONTAINER (GRID VIEW vs TABLE VIEW) */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          /* GRID VIEW MODE: Premium Frosted Glass Brand Cards */
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {filteredPortals.map(portal => {
              const Icon = portal.icon;
              const isLive = !!channelStatus[portal.id];

              return (
                <motion.div 
                  key={portal.id}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className={`p-3.5 rounded-xl border transition-all duration-200 backdrop-blur-md flex flex-col justify-between space-y-2 ${
                    isLive 
                      ? 'bg-white/80 dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700' 
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-75'
                  }`}
                >
                  <div>
                    {/* Top Bar: Authentic Brand SVG Logo Badge + Name + Badge + Toggle */}
                    <div className="flex items-center justify-between gap-2.5 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0 shadow-2xs">
                          <Icon className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{portal.name}</h3>
                            {portal.isCustom && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
                                CUSTOM
                              </span>
                            )}
                          </div>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border mt-0.5 ${portal.bgColor}`}>
                            {portal.badge}
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => toggleChannel(portal.id, portal.name)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isLive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        role="switch"
                        aria-checked={isLive}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            isLive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug font-normal line-clamp-2">
                      {portal.description}
                    </p>
                  </div>

                  {/* Footer Meta & Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 dark:text-slate-500 text-[10px]">Reach: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{portal.estimatedReach}</strong></span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPreviewPortal(portal);
                          setIsPreviewOpen(true);
                        }}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Eye size={12} />
                        Preview
                      </button>

                      {portal.isCustom && (
                        <button
                          onClick={() => handleDeleteCustomChannel(portal.id, portal.name)}
                          className="px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Delete / Disconnect Custom Portal"
                        >
                          <Trash2 size={10} />
                          <span>Delete</span>
                        </button>
                      )}

                      <span className={`font-bold text-[10px] flex items-center gap-1 ${
                        isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {isLive ? 'LIVE' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* TABLE VIEW MODE: Structured Enterprise DataTable */
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-2xs overflow-hidden"
          >
            <DataTable
              title="Job Distribution Channels Grid"
              columns={tableColumns}
              data={filteredPortals}
              selectable={false}
              borderless={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit History Log Section (Modal Overlay via createPortal) */}
      {isMounted && showAuditTrail && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-4 p-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <History size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Publish History & Audit Trail Log</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Track all job distribution activities, status updates, and channel publishing logs in structured table format.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuditTrail(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 bg-slate-100/80 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all duration-200 cursor-pointer"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Table Formatted Audit Trail Log */}
              <div className="overflow-x-auto max-h-72 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Performed By</th>
                      <th className="py-2.5 px-3">Action Description</th>
                      <th className="py-2.5 px-3">Target Channel</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {auditLogs.length > 0 ? (
                      auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {log.timestamp}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                            {log.actor}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {log.action}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {log.channel || 'Multi-Portal'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              log.status.includes('Scheduled')
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400 text-xs">
                          No audit logs recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[10px] font-mono text-slate-400">{auditLogs.length} total entries recorded</span>
                <button
                  onClick={() => setShowAuditTrail(false)}
                  style={{ backgroundColor: brandColor }}
                  className="px-4 py-1.5 text-xs font-bold text-white rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Close History Log
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL 1: Real Candidate View Portal Simulation Modal */}
      {isMounted && isPreviewOpen && previewPortal && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsPreviewOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans"
            >
              {/* 1. Mild Blue Glass Header Bar */}
              <div className="px-6 py-4 border-b border-blue-100/70 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/30 backdrop-blur-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 shadow-2xs text-blue-600 dark:text-blue-400">
                    <previewPortal.icon className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        {previewPortal.name} Candidate View
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                        Official Syndication
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Live distribution simulation · Monthly Reach: <strong className="font-mono">{previewPortal.estimatedReach}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 2. Scrollable Candidate Job Body */}
              <div className="p-6 space-y-5 max-h-[500px] overflow-y-auto">
                
                {/* Job Title & Company Hero Strip */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
                  <div className="flex items-start gap-4">
                    {/* Brand Logo Icon */}
                    <div 
                      className="w-12 h-12 rounded-xl text-white font-black text-base flex items-center justify-center shadow-md shrink-0"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Building size={22} />
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {selectedReq?.jobTitle || 'Senior React Developer'}
                      </h2>
                      
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-wrap">
                        <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
                          PeopleWorks AI Systems <ShieldCheck size={13} className="text-blue-500 inline" />
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span>{selectedReq?.location || 'Remote'} ({selectedReq?.workMode || 'Hybrid'})</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-slate-400 font-normal">Posted 2 hours ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Apply Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      style={{ backgroundColor: brandColor }}
                      className="px-5 py-2.5 text-xs font-extrabold text-white rounded-xl shadow-md hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Zap size={14} />
                      <span>Apply Now</span>
                    </button>
                  </div>
                </div>

                {/* 4 Sleek Mild Blue Frosted Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-white/80 to-blue-50/20 dark:from-slate-900/80 dark:to-blue-950/20 backdrop-blur-md border border-blue-100/60 dark:border-blue-900/30 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Salary</span>
                    <strong className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5 block">$130,000 - $165,000 / yr</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-white/80 to-blue-50/20 dark:from-slate-900/80 dark:to-blue-950/20 backdrop-blur-md border border-blue-100/60 dark:border-blue-900/30 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department</span>
                    <strong className="text-xs text-slate-900 dark:text-slate-100 font-bold mt-0.5 block">{selectedReq?.department || 'Engineering'}</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-white/80 to-blue-50/20 dark:from-slate-900/80 dark:to-blue-950/20 backdrop-blur-md border border-blue-100/60 dark:border-blue-900/30 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Type</span>
                    <strong className="text-xs text-slate-900 dark:text-slate-100 font-bold mt-0.5 block">Full-Time Permanent</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-white/80 to-blue-50/20 dark:from-slate-900/80 dark:to-blue-950/20 backdrop-blur-md border border-blue-100/60 dark:border-blue-900/30 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Experience</span>
                    <strong className="text-xs text-slate-900 dark:text-slate-100 font-bold mt-0.5 block">5+ Years Required</strong>
                  </div>
                </div>

                {/* About Role & Responsibilities */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Briefcase size={14} className="text-blue-600 dark:text-blue-400" /> About the Role &amp; Key Responsibilities
                  </h4>
                  <div className="p-4.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 font-normal">
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      {linkedJd?.summary || 'We are seeking an experienced Senior React Engineer to lead the architecture and frontend implementation of our enterprise web platforms. You will collaborate directly with product managers, UX designers, and backend engineering teams to deliver high-performance, scalable web interfaces.'}
                    </p>
                    
                    <div className="space-y-2 pt-1">
                      <strong className="text-slate-900 dark:text-white font-bold block">Key Responsibilities:</strong>
                      <ul className="list-disc pl-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                        <li>Architect resilient React application state management and component design systems.</li>
                        <li>Optimize web application page rendering, bundle size, and runtime performance.</li>
                        <li>Integrate real-time REST and WebSocket endpoints with high data integrity.</li>
                        <li>Mentor junior developers and participate in code reviews to enforce software design standards.</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. Modal Footer Controls */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span>🔥 14 candidates applied today on {previewPortal.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Shareable Link'}</span>
                  </button>

                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL 2: Admin "+ Connect New Channel" Integration Modal */}
      {isMounted && isAddChannelOpen && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                resetChannelForm();
                setIsAddChannelOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect New Job Posting Channel</h3>
                </div>
                <button
                  onClick={() => {
                    resetChannelForm();
                    setIsAddChannelOpen(false);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 bg-slate-100/80 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all duration-200 cursor-pointer"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Searchable Channel Selector Combobox */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Channel / Portal Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Search or select real channel</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type to search (e.g. Glassdoor, Instahyre, SEEK)..."
                      value={newChannelForm.name}
                      onFocus={() => setIsChannelDropdownOpen(true)}
                      onChange={(e) => {
                        setNewChannelForm({ ...newChannelForm, name: e.target.value });
                        setIsChannelDropdownOpen(true);
                        if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                      }}
                      className={`w-full pl-3 pr-8 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-[var(--pw-brand)] focus:ring-2 focus:ring-[var(--pw-brand)]/20 transition-all ${
                        formErrors.name ? 'border-rose-500 ring-1 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    />
                    <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Inline Validation Error */}
                  {formErrors.name && (
                    <span className="text-[11px] text-rose-500 font-bold mt-1 block flex items-center gap-1">
                      <AlertTriangle size={11} className="shrink-0" /> {formErrors.name}
                    </span>
                  )}

                  {/* Search Autocomplete Floating Dropdown */}
                  {isChannelDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[100]" 
                        onClick={() => setIsChannelDropdownOpen(false)} 
                      />
                      <div className="absolute left-0 right-0 top-full mt-1 z-[101] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 scrollbar-thin">
                        <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-md z-10 flex items-center justify-between">
                          <span>Verified Enterprise Real Portals</span>
                          <span className="font-mono text-[9px] text-slate-400">Scroll to view all ({REAL_CHANNEL_PRESETS.length})</span>
                        </div>
                        {REAL_CHANNEL_PRESETS
                          .filter(preset => preset.name.toLowerCase().includes(newChannelForm.name.toLowerCase()))
                          .map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setNewChannelForm({
                                  ...newChannelForm,
                                  name: preset.name,
                                  badge: preset.badge,
                                  reach: preset.reach,
                                  description: preset.description
                                });
                                setIsChannelDropdownOpen(false);
                                if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                              }}
                              className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between gap-2.5 transition-colors cursor-pointer group"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block text-xs truncate">
                                  {preset.name}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate block mt-0.5">{preset.description}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 block">
                                  {preset.badge}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{preset.reach}</span>
                              </div>
                            </button>
                          ))}
                        {REAL_CHANNEL_PRESETS.filter(preset => preset.name.toLowerCase().includes(newChannelForm.name.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-slate-400 text-xs font-medium">
                            No pre-configured portal matches "{newChannelForm.name}".<br />
                            <span className="text-[10px] text-blue-500 font-bold">You can continue to use custom channel name "{newChannelForm.name}".</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Badge Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Niche Tech, Regional"
                      value={newChannelForm.badge}
                      onChange={(e) => setNewChannelForm({ ...newChannelForm, badge: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Estimated Reach</label>
                    <input
                      type="text"
                      placeholder="e.g. 45,000+ applicants"
                      value={newChannelForm.reach}
                      onChange={(e) => setNewChannelForm({ ...newChannelForm, reach: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Integration Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['API', 'XML', 'Webhook'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewChannelForm({ ...newChannelForm, integrationType: type })}
                        className={`py-1.5 px-3 rounded-lg border font-bold text-center transition-all ${
                          newChannelForm.integrationType === type
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {type} Method
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    API Key / Integration Endpoint <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="pk_live_************************"
                    value={newChannelForm.apiKey}
                    onChange={(e) => {
                      setNewChannelForm({ ...newChannelForm, apiKey: e.target.value });
                      if (formErrors.apiKey) setFormErrors(prev => ({ ...prev, apiKey: null }));
                    }}
                    className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[var(--pw-brand)] focus:ring-2 focus:ring-[var(--pw-brand)]/20 transition-all ${
                      formErrors.apiKey ? 'border-rose-500 ring-1 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {formErrors.apiKey && (
                    <span className="text-[11px] text-rose-500 font-bold mt-1 block flex items-center gap-1">
                      <AlertTriangle size={11} className="shrink-0" /> {formErrors.apiKey}
                    </span>
                  )}
                </div>

                {/* Handshake Connection Test Button */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {testingConnection ? <RefreshCw size={14} className="animate-spin text-blue-500" /> : <ShieldCheck size={14} />}
                    <span>{testingConnection ? 'Testing Handshake...' : connectionSuccess ? 'Connection Verified ✅' : 'Test API Handshake'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        resetChannelForm();
                        setIsAddChannelOpen(false);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCustomChannel}
                      style={{ backgroundColor: brandColor }}
                      className="px-4 py-2 text-xs font-bold text-white rounded-lg hover:opacity-90 shadow-sm cursor-pointer"
                    >
                      Connect & Activate
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL 3: Schedule & Lifecycle Publishing Modal (Enterprise 8px Standard) */}
      {isMounted && isScheduleOpen && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-5 font-sans flex flex-col"
            >
              {/* Top Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Automated Job Schedule Engine</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Syndicate {selectedReq?.id} ({selectedReq?.jobTitle}) automatically on a target date & time.</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsScheduleOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all duration-200 cursor-pointer"
                  title="Close Modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Clean Horizontal Pipeline Stepper */}
              <div className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Automated Distribution Pipeline</span>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
                    <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 font-extrabold text-[10px] mx-auto flex items-center justify-center border border-amber-200 dark:border-amber-800">1</div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Set Target Time</span>
                    <span className="text-[10px] text-slate-400 block">Pick date & 12h time</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
                    <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 font-extrabold text-[10px] mx-auto flex items-center justify-center border border-blue-200 dark:border-blue-800">2</div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Stage Portals</span>
                    <span className="text-[10px] text-slate-400 block">{activeChannelsCount} active channels</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 font-extrabold text-[10px] mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">3</div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Auto-Syndicate</span>
                    <span className="text-[10px] text-slate-400 block">API push & log</span>
                  </div>
                </div>
              </div>

              {/* Spacious Date & Time Selection Area */}
              <div className="space-y-4 text-xs">
                
                {/* Date Selection */}
                <div>
                  <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1.5">Target Launch Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[var(--pw-brand)] focus:ring-2 focus:ring-[var(--pw-brand)]/20 shadow-2xs transition-all"
                  />
                </div>

                {/* Time + AM/PM + Timezone Controls Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                  
                  {/* HH:MM Selects (5 cols) */}
                  <div className="sm:col-span-5">
                    <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1.5">Time (HH : MM)</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <CustomSelect
                          value={scheduleHour}
                          onChange={(val) => setScheduleHour(val)}
                          options={['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => ({ value: h, label: h }))}
                          size="sm"
                        />
                      </div>
                      <span className="font-bold text-slate-400 text-sm">:</span>
                      <div className="flex-1">
                        <CustomSelect
                          value={scheduleMinute}
                          onChange={(val) => setScheduleMinute(val)}
                          options={['00','15','30','45'].map(m => ({ value: m, label: m }))}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AM / PM Segmented Control - NO EMOJIS (3 cols) */}
                  <div className="sm:col-span-3">
                    <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1.5">Period</label>
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setScheduleMeridiem('AM')}
                        style={scheduleMeridiem === 'AM' ? { backgroundColor: brandColor } : {}}
                        className={`flex-1 py-1.5 text-xs font-extrabold rounded-md transition-all text-center cursor-pointer ${
                          scheduleMeridiem === 'AM'
                            ? 'text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleMeridiem('PM')}
                        style={scheduleMeridiem === 'PM' ? { backgroundColor: brandColor } : {}}
                        className={`flex-1 py-1.5 text-xs font-extrabold rounded-md transition-all text-center cursor-pointer ${
                          scheduleMeridiem === 'PM'
                            ? 'text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>

                  {/* Timezone (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1.5">Timezone</label>
                    <CustomSelect
                      value={scheduleTimezone}
                      onChange={(val) => setScheduleTimezone(val)}
                      options={[
                        { value: 'IST (UTC+5:30)', label: 'IST (UTC+5:30)' },
                        { value: 'EST (UTC-5:00)', label: 'EST (UTC-5:00)' },
                        { value: 'PST (UTC-8:00)', label: 'PST (UTC-8:00)' },
                        { value: 'GMT / UTC (+0:00)', label: 'GMT / UTC (+0:00)' },
                        { value: 'CET (UTC+1:00)', label: 'CET (UTC+1:00)' }
                      ]}
                      size="sm"
                    />
                  </div>
                </div>

                {/* High-End Schedule Confirmation Summary Box */}
                <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-slate-800 dark:text-amber-200 text-xs flex items-center justify-between font-mono shadow-2xs">
                  <span className="flex items-center gap-2 font-bold">
                    <Clock size={15} className="text-amber-600 shrink-0" />
                    <span>Trigger Time: <strong>{scheduleDate}</strong> at <strong>{scheduleHour}:{scheduleMinute} {scheduleMeridiem}</strong> ({scheduleTimezone})</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 uppercase tracking-wider">
                    STAGED
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setPostingLifecycle('Published');
                      setIsScheduleOpen(false);
                      addToast({ title: 'Published Immediately 🚀', message: `${selectedReq?.id} is now live on active channels.`, type: 'success' });
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Publish Immediately
                  </button>

                  <button
                    onClick={() => {
                      setPostingLifecycle('Scheduled');
                      setIsScheduleOpen(false);

                      const formattedDate = formatScheduleBadgeDate(scheduleDate);
                      const targetTimeString = `${formattedDate} · ${scheduleHour}:${scheduleMinute} ${scheduleMeridiem} ${scheduleTimezone.split(' ')[0]}`;

                      // 2. Persistent Publish History Audit Entry
                      const auditEntry = {
                        id: Date.now(),
                        timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
                        actor: simulatedRole.includes('Admin') ? 'Admin' : 'Sujith (Recruiter)',
                        action: `Scheduled Job Distribution for ${selectedReq?.id || 'REQ-2026-0001'} (${activeChannelsCount} Channels)`,
                        channel: `${activeChannelsCount} Channels`,
                        status: `Scheduled 📅`
                      };
                      setAuditLogs(prev => [auditEntry, ...prev]);

                      // 3. Instant Toast Feedback
                      addToast({ 
                        title: 'Job Scheduled! 📅', 
                        message: `${selectedReq?.id} scheduled for ${targetTimeString}.`, 
                        type: 'success' 
                      });
                    }}
                    style={{ backgroundColor: brandColor }}
                    className="px-5 py-2 text-xs font-bold text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                  >
                    Save & Activate Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* CONFIRMATION MODAL: Custom Portal Delete Guard */}
      <ConfirmModal
        isOpen={!!channelToDelete}
        onClose={() => setChannelToDelete(null)}
        onConfirm={handleConfirmDeleteChannel}
        title={`Delete Custom Channel: ${channelToDelete?.name || ''}`}
        message={`Are you sure you want to disconnect and delete "${channelToDelete?.name || 'this portal'}"? This custom integration channel will be permanently removed from your Job Postings Hub.`}
        confirmText="Delete Channel"
        confirmVariant="danger"
        brandColor={brandColor}
      />

      {/* 10/10 Enterprise KPI Real-Time Analytics System Modal */}
      {activeKpiModal && (
        <EnterpriseKpiAnalyticsModal
          isOpen={!!activeKpiModal}
          onClose={() => setActiveKpiModal(null)}
          kpiId={activeKpiModal.id}
          kpiLabel={activeKpiModal.label}
          kpiValue={activeKpiModal.value}
          moduleType="postings"
          rawRecords={approvedRequisitions}
        />
      )}

    </div>
  );
}
