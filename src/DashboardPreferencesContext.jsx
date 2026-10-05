import React, { useState, useEffect } from 'react';
import { DashboardPreferencesContext } from './DashboardPreferencesContextDef';
export { useDashboardPreferences, DashboardPreferencesContext } from './DashboardPreferencesContextDef';

const generateFieldOrder = (visibilityMap) => {
  const order = {};
  for (const [section, fields] of Object.entries(visibilityMap)) {
    order[section] = Object.keys(fields);
  }
  return order;
};

// ─── Schema version ── bump this whenever defaultPreferences structure changes ─
const SCHEMA_VERSION = 'v5';
const STORAGE_KEY    = 'pw_dashboardPreferences';
const VERSION_KEY    = 'pw_dashboardPreferences_ver';

const defaultPreferences = {
  super_admin: {
    kpiStyle: 'solar',
    sectionVisibility: {
      "Platform Overview": true,
      "System Metrics": true,
      "Recent Tenants": true
    },
    sectionOrder: ["Platform Overview", "System Metrics", "Recent Tenants"],
    fieldVisibility: {
      "Platform Overview": { "Uptime": true, "API Latency": true, "New Tenants": true },
      "System Metrics": { "Active Tenants": true, "Platform Users": true, "API Requests": true, "Avg Response Time": true, "System Error Rate": true, "Open Support Tickets": true, "Server Status": true, "DB Query Health": true, "Backup Status": true },
      "Recent Tenants": { "Tenant Name": true, "Plan": true, "Users": true, "MRR Contribution": true, "Billing Cycle": true, "Disk Space": true, "API Calls": true, "Status": true, "Date": true }
    }
  },
  pw_ceo: {
    kpiStyle: 'solar',
    sectionVisibility: {
      "Business Metrics": true,
      "Financial Strip": true,
      "AI Growth Insights": true,
      "Revenue Trends": true
    },
    sectionOrder: ["Business Metrics", "Financial Strip", "AI Growth Insights", "Revenue Trends"],
    fieldVisibility: {
      "Business Metrics": { "ARR Run Rate": true, "CAC": true, "Avg LTV": true },
      "Financial Strip": { "Annual Rec. Rev": true, "Customer Churn": true, "Acquisition Cost": true },
      "Revenue Trends": { "MRR Growth": true, "New vs Churned ARR": true }
    }
  },
  client_ceo: {
    kpiStyle: 'solar',
    sectionVisibility: {
      "Executive Overview": true,
      "Board-Ready Metrics": true,
      "Executive Quick Actions": true,
      "Critical Hiring Risks": true,
      "AI Executive Insights": true,
      "Org-Wide Hiring Heatmap": true,
      "Hiring Funnel": true,
      "Hiring Forecast": true,
      "Executive Approvals Queue": true,
      "Diversity & Inclusion Progress": true
    },
    sectionOrder: ["Executive Overview", "Board-Ready Metrics", "Executive Quick Actions", "Critical Hiring Risks", "AI Executive Insights", "Org-Wide Hiring Heatmap", "Hiring Funnel", "Hiring Forecast", "Executive Approvals Queue", "Diversity & Inclusion Progress"],
    fieldVisibility: {
      "Executive Overview": { "Revenue at Risk": true, "Cost of Vacancy/Week": true, "Hiring Health Score": true, "Post-Offer Drop-off": true, "D&I Hire Ratio": true, "Succession Gaps": true, "Budget Utilised": true, "Offer Acceptance": true },
      "Board-Ready Metrics": { "Cost Per Hire": true, "Time to Fill": true, "Quality of Hire": true, "Attrition Risk": true, "Offer-to-Join": true, "Pipeline Health": true, "Total Employees": true, "Open Positions": true },
      "Executive Quick Actions": { "Approve All Pending": true, "Download Board Report": true, "Review Critical Risks": true, "Schedule Sync": true },
      "Org-Wide Hiring Heatmap": { "Map View": true, "Region Stats": true },
      "Hiring Funnel": { "Funnel Chart": true, "Stage Metrics": true },
      "AI Executive Insights": { "Risk Alerts": true, "Opportunities": true },
      "Critical Hiring Risks": { "High Priority": true, "SLA Breaches": true },
      "Hiring Forecast": { "Headcount Projection": true, "Budget Projection": true },
      "Executive Approvals Queue": { "Role / Dept": true, "Budget": true, "Requester": true, "Aging": true, "Priority": true, "Status": true, "Hiring Manager": true, "Employment Type": true, "Work Location": true },
      "Diversity & Inclusion Progress": { "Gender Diversity": true, "Inclusion Score": true, "Representation": true }
    }
  },
  workspace: {
    kpiStyle: 'solar',
    sectionVisibility: {
      "My Workspace": true,
      "Quick Actions": true,
      "Today's Action Items": true,
      "Pipeline Overview": true,
      "Requisition Pipeline": true,
      "My Requisitions": true,
      "Interview Schedule": true,
      "Feedback Pending": true,
      "Candidate Comparison": true,
      "My Assigned Candidates": true,
      "Department & Source Analytics": true,
      "Compliance & SLA Monitor": true,
      "Recent Activities": true,
      "Top AI Candidate Recommendations": true
    },
    sectionOrder: ["My Workspace", "Quick Actions", "Today's Action Items", "Pipeline Overview", "Requisition Pipeline", "My Requisitions", "Interview Schedule", "Feedback Pending", "Candidate Comparison", "My Assigned Candidates", "Department & Source Analytics", "Compliance & SLA Monitor", "Recent Activities", "Top AI Candidate Recommendations"],
    fieldVisibility: {
      "My Workspace": { "Active Requisitions": true, "Open Positions": true, "Candidates In Process": true, "Interviews Today": true, "Offers Pending": true, "New Joiners This Month": true },
      "Quick Actions": { "Raise New Requisition": true, "Schedule Interview": true, "Send to HR": true, "Download Report": true },
      "Today's Action Items": { "Approvals": true, "Reviews": true },
      "Requisition Pipeline": { "Draft": true, "Pending Approval": true, "Approved": true, "JD Published": true, "Hiring": true, "Closed": true },
      "Pipeline Overview": { "Requisition Funnel": true, "Source Mix": true },
      "My Requisitions": { "Role": true, "Department": true, "Status": true, "Days Open": true, "Candidates": true, "Next Action": true, "Assigned Recruiter": true, "Priority": true, "Approved Budget": true, "SLA Status": true },
      "Interview Schedule": { "Morning": true, "Afternoon": true },
      "Feedback Pending": { "Recent Interviews": true, "Overdue": true },
      "Candidate Comparison": { "Skills Score": true, "Experience": true, "Technical Score": true, "Culture Fit": true, "Location": true, "AI Summary": true, "Hiring Probability": true, "Notice Risk": true, "Salary Fit": true },
      "My Assigned Candidates": { "Active": true, "Archived": true },
      "Department & Source Analytics": { "Department Metrics": true, "Source Metrics": true },
      "Compliance & SLA Monitor": { "Requisition Approval": true, "JD Creation": true, "Sourcing": true, "Screening": true, "Interview Scheduling": true, "Offer Release": true },
      "Recent Activities": { "System Events": true, "User Actions": true },
      "Top AI Candidate Recommendations": { "Top Matches": true, "Alternative Candidates": true }
    }
  }
};

defaultPreferences.super_admin.fieldOrder = generateFieldOrder(defaultPreferences.super_admin.fieldVisibility);
defaultPreferences.pw_ceo.fieldOrder = generateFieldOrder(defaultPreferences.pw_ceo.fieldVisibility);
defaultPreferences.client_ceo.fieldOrder = generateFieldOrder(defaultPreferences.client_ceo.fieldVisibility);
defaultPreferences.workspace.fieldOrder = generateFieldOrder(defaultPreferences.workspace.fieldVisibility);

export const DashboardPreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      // If schema version doesn't match, clear and use defaults
      const savedVersion = localStorage.getItem(VERSION_KEY);
      if (savedVersion !== SCHEMA_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(VERSION_KEY, SCHEMA_VERSION);
        return defaultPreferences;
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse dashboard preferences", e);
        }
      }
    }
    return defaultPreferences;
  });

  // UI Layout Density: 'compact' | 'normal' | 'comfortable'
  const [density, setDensity] = useState('normal');

  // Column Visibility per Table
  const [columnVisibility, setColumnVisibility] = useState({
    candidateTable: { candidate: true, role: true, matchScore: true, stage: true, exp: true, action: true }
  });

  const toggleColumnVisibility = (tableId, columnKey) => {
    setColumnVisibility(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        [columnKey]: !prev[tableId]?.[columnKey]
      }
    }));
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    localStorage.setItem(VERSION_KEY, SCHEMA_VERSION);
  }, [preferences]);


  // Master Layout Controls
  const toggleSection = (role, sectionName, isVisible) => {
    setPreferences(prev => {
      const rolePrefs = prev[role] || {};
      const secVis = rolePrefs.sectionVisibility || {};
      return {
        ...prev,
        [role]: {
          ...rolePrefs,
          sectionVisibility: {
            ...secVis,
            [sectionName]: isVisible
          }
        }
      };
    });
  };

  const resetDashboardLayout = (role) => {
    setPreferences(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        sectionVisibility: { ...defaultPreferences[role].sectionVisibility },
        sectionOrder: [...defaultPreferences[role].sectionOrder]
      }
    }));
  };

  // Field-level Layout Controls
  const toggleField = (role, sectionName, fieldName, isVisible) => {
    setPreferences(prev => {
      const rolePrefs = prev[role] || {};
      const fieldVis = rolePrefs.fieldVisibility || {};
      const secFields = fieldVis[sectionName] || {};
      
      return {
        ...prev,
        [role]: {
          ...rolePrefs,
          fieldVisibility: {
            ...fieldVis,
            [sectionName]: {
              ...secFields,
              [fieldName]: isVisible
            }
          }
        }
      };
    });
  };

  const resetSection = (role, sectionName) => {
    setPreferences(prev => {
      const rolePrefs = prev[role] || {};
      const fieldVis = rolePrefs.fieldVisibility || {};
      const fieldOrd = rolePrefs.fieldOrder || {};
      return {
        ...prev,
        [role]: {
          ...rolePrefs,
          fieldVisibility: {
            ...fieldVis,
            [sectionName]: { ...defaultPreferences[role].fieldVisibility[sectionName] }
          },
          fieldOrder: {
            ...fieldOrd,
            [sectionName]: [...defaultPreferences[role].fieldOrder[sectionName]]
          }
        }
      };
    });
  };

  const reorderFields = (role, sectionName, newOrder) => {
    setPreferences(prev => {
      const rolePrefs = prev[role] || {};
      const fieldOrd = rolePrefs.fieldOrder || {};
      return {
        ...prev,
        [role]: {
          ...rolePrefs,
          fieldOrder: {
            ...fieldOrd,
            [sectionName]: newOrder
          }
        }
      };
    });
  };

  const reorderSections = (role, newOrder) => {
    setPreferences(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        sectionOrder: newOrder
      }
    }));
  };

  const getSectionConfig = (role, sectionName) => {
    const rolePrefs = preferences[role] || {};
    const secVis = rolePrefs.sectionVisibility || {};
    const fieldVis = rolePrefs.fieldVisibility || {};
    const fieldOrd = rolePrefs.fieldOrder || {};
    
    return {
      isVisible: secVis[sectionName] !== false,
      fields: fieldVis[sectionName] || {},
      fieldOrder: fieldOrd[sectionName] || Object.keys(fieldVis[sectionName] || {})
    };
  };

  const isFieldVisible = (role, sectionName, fieldName) => {
    const config = getSectionConfig(role, sectionName);
    return config.fields[fieldName] !== false; // true by default if not set
  };

  const isSectionVisible = (role, sectionName) => {
    return getSectionConfig(role, sectionName).isVisible;
  };

  const getSectionIndex = (role, sectionName) => {
    const orderArr = preferences[role]?.sectionOrder || [];
    const idx = orderArr.indexOf(sectionName);
    return idx !== -1 ? idx : 999;
  };

  const getKpiStyle = (role) => {
    return preferences[role]?.kpiStyle || 'solar';
  };

  const setKpiStyle = (role, style) => {
    setPreferences(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        kpiStyle: style
      }
    }));
  };

  const val = {
    preferences,
    density,
    setDensity,
    columnVisibility,
    toggleColumnVisibility,
    toggleSection,
    resetDashboardLayout,
    toggleField,
    resetSection,
    reorderFields,
    reorderSections,
    getSectionConfig,
    isFieldVisible,
    isSectionVisible,
    getSectionIndex,
    getKpiStyle,
    setKpiStyle,
    defaultPreferences // Exposed for reset logic checks
  };

  return (
    <DashboardPreferencesContext.Provider value={val}>
      {children}
    </DashboardPreferencesContext.Provider>
  );
};
