/**
 * Enterprise Offer Management Pre-Seeded Realistic Data
 * PeopleWorks ATS SaaS
 */
import { 
  OFFER_STATUS, 
  APPROVAL_STATUS, 
  SIGNATURE_STATUS, 
  SIGNATURE_PROVIDERS, 
  EMPLOYMENT_TYPE, 
  WORK_ARRANGEMENT, 
  PAY_FREQUENCY, 
  COMPENSATION_TYPE, 
  BENEFIT_CATEGORIES 
} from './offerTypes';

export const INITIAL_OFFER_TEMPLATES = [
  {
    id: 'TMPL-IND-FT-01',
    name: 'India - Full Time Standard Offer',
    description: 'Standard employment agreement for India-based full-time permanent hires with statutory PF & gratuity terms.',
    category: 'Full Time',
    country: 'India',
    currency: 'INR',
    language: 'English',
    isDefault: true,
    lastUpdated: '2026-02-15',
    updatedBy: 'Marcus Vance (HRBP)',
    variables: [
      '{{candidate.fullName}}',
      '{{candidate.address}}',
      '{{job.title}}',
      '{{job.department}}',
      '{{job.location}}',
      '{{offer.startDate}}',
      '{{offer.baseSalaryFormatted}}',
      '{{offer.variablePayFormatted}}',
      '{{offer.totalCtcFormatted}}',
      '{{offer.expirationDate}}',
      '{{offer.probationPeriod}}',
      '{{offer.noticePeriod}}',
      '{{company.name}}',
      '{{company.signatoryName}}',
      '{{company.signatoryTitle}}'
    ],
    contentHtml: `
<div style="font-family: 'Inter', system-ui, sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 24px;">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
    <div>
      <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">{{company.name}}</h2>
      <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Enterprise Talent & Technology Solutions</p>
    </div>
    <div style="text-align: right; color: #64748b; font-size: 13px;">
      <p style="margin: 0;"><strong>Confidential Offer of Employment</strong></p>
      <p style="margin: 4px 0 0;">Date: {{offer.generatedDate}}</p>
    </div>
  </div>

  <p><strong>Dear {{candidate.fullName}},</strong></p>

  <p>On behalf of <strong>{{company.name}}</strong>, we are thrilled to extend this formal offer of employment for the position of <strong>{{job.title}}</strong> in our <strong>{{job.department}}</strong> division.</p>

  <p>We were thoroughly impressed with your technical expertise, track record, and alignment with our organizational culture during our interview process. We believe you will make a transformative impact on our mission.</p>

  <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px; font-size: 16px;">1. Key Employment Terms</h3>
  <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;">
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 8px 0; color: #64748b; width: 35%;"><strong>Position Title:</strong></td>
      <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">{{job.title}}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 8px 0; color: #64748b;"><strong>Department / Business Unit:</strong></td>
      <td style="padding: 8px 0; color: #0f172a;">{{job.department}}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 8px 0; color: #64748b;"><strong>Work Location:</strong></td>
      <td style="padding: 8px 0; color: #0f172a;">{{job.location}} ({{offer.workArrangement}})</td>
    </tr>
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 8px 0; color: #64748b;"><strong>Reporting Manager:</strong></td>
      <td style="padding: 8px 0; color: #0f172a;">{{offer.reportingManager}}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 8px 0; color: #64748b;"><strong>Expected Joining Date:</strong></td>
      <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">{{offer.startDate}}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 8px 0; color: #64748b;"><strong>Probation Period:</strong></td>
      <td style="padding: 8px 0; color: #0f172a;">{{offer.probationPeriod}}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #64748b;"><strong>Notice Period:</strong></td>
      <td style="padding: 8px 0; color: #0f172a;">{{offer.noticePeriod}}</td>
    </tr>
  </table>

  <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px; font-size: 16px;">2. Compensation & Benefits Structure</h3>
  <p style="margin-bottom: 12px;">Your total annual compensation package is structured as follows:</p>
  
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <th style="text-align: left; padding: 8px 0; color: #475569;">Compensation Component</th>
        <th style="text-align: right; padding: 8px 0; color: #475569;">Annual Amount ({{offer.currency}})</th>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #1e293b;">Fixed Base Salary (Basic + HRA + Special Allowance)</td>
        <td style="text-align: right; padding: 8px 0; font-weight: 600; color: #0f172a;">{{offer.baseSalaryFormatted}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #1e293b;">Annual Performance Incentive (Target)</td>
        <td style="text-align: right; padding: 8px 0; color: #0f172a;">{{offer.variablePayFormatted}}</td>
      </tr>
      <tr style="border-top: 2px solid #cbd5e1; font-weight: 700;">
        <td style="padding: 10px 0; color: #0f172a; font-size: 15px;">Total Cost to Company (CTC)</td>
        <td style="text-align: right; padding: 10px 0; color: #0f172a; font-size: 16px;">{{offer.totalCtcFormatted}}</td>
      </tr>
    </table>
  </div>

  <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px; font-size: 16px;">3. Pre-Employment Conditions & Acceptance</h3>
  <p>This offer is contingent upon successful completion of standard pre-employment background checks, reference verifications, and submission of authentic educational and relieving credentials.</p>

  <p>Please review and sign this offer letter prior to <strong>{{offer.expirationDate}}</strong>, after which this proposal shall automatically lapse unless formally extended in writing.</p>

  <div style="display: flex; justify-content: space-between; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
    <div>
      <p style="margin: 0 0 32px; color: #64748b; font-size: 13px;">Authorized Representative:</p>
      <div style="font-family: 'Brush Script MT', cursive; font-size: 22px; color: #1e40af; margin-bottom: 4px;">{{company.signatoryName}}</div>
      <p style="margin: 0; font-weight: 600; color: #0f172a;">{{company.signatoryName}}</p>
      <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">{{company.signatoryTitle}}</p>
    </div>
    <div style="text-align: right;">
      <p style="margin: 0 0 32px; color: #64748b; font-size: 13px;">Candidate Acceptance:</p>
      <div style="height: 30px; border-bottom: 1px dashed #94a3b8; width: 180px; margin-left: auto; margin-bottom: 4px;"></div>
      <p style="margin: 0; font-weight: 600; color: #0f172a;">{{candidate.fullName}}</p>
      <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">Signature & Date</p>
    </div>
  </div>
</div>
`
  },
  {
    id: 'TMPL-US-FT-01',
    name: 'US - Full Time Exempt Offer',
    description: 'FLSA Exempt offer letter template for United States hires with 401(k), health, and at-will employment clauses.',
    category: 'Full Time',
    country: 'United States',
    currency: 'USD',
    language: 'English',
    isDefault: false,
    lastUpdated: '2026-01-20',
    updatedBy: 'Sarah Jenkins',
    variables: [
      '{{candidate.fullName}}',
      '{{job.title}}',
      '{{job.department}}',
      '{{job.location}}',
      '{{offer.startDate}}',
      '{{offer.baseSalaryFormatted}}',
      '{{offer.variablePayFormatted}}',
      '{{offer.expirationDate}}',
      '{{company.name}}'
    ],
    contentHtml: `
<div style="font-family: 'Inter', system-ui, sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 24px;">
  <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800;">{{company.name}}</h2>
    <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Employment Offer Letter — At-Will Employment</p>
  </div>
  <p><strong>Dear {{candidate.fullName}},</strong></p>
  <p>We are delighted to offer you the position of <strong>{{job.title}}</strong> with {{company.name}}, reporting to your designated hiring manager in the <strong>{{job.department}}</strong> team.</p>
  <p>Your annualized base compensation will be <strong>{{offer.baseSalaryFormatted}}</strong> paid bi-weekly, subject to standard federal and state withholdings. Additionally, you will be eligible for our comprehensive benefits package including health coverage and 401(k) matching.</p>
  <p>This offer is valid until <strong>{{offer.expirationDate}}</strong>.</p>
</div>
`
  },
  {
    id: 'TMPL-EXEC-01',
    name: 'Executive / Leadership Agreement',
    description: 'Comprehensive executive agreement including equity grant schedules, governance sign-offs, and golden handcuffs.',
    category: 'Executive',
    country: 'Global',
    currency: 'USD',
    language: 'English',
    isDefault: false,
    lastUpdated: '2026-02-01',
    updatedBy: 'PeopleWorks Admin',
    variables: ['{{candidate.fullName}}', '{{job.title}}', '{{offer.baseSalaryFormatted}}', '{{company.name}}'],
    contentHtml: `
<div style="font-family: 'Inter', system-ui, sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 24px;">
  <h2>Executive Appointment & Equity Grant Agreement</h2>
  <p>Dear {{candidate.fullName}},</p>
  <p>We are honored to confirm your appointment as <strong>{{job.title}}</strong> at {{company.name}}.</p>
</div>
`
  }
];

export const INITIAL_APPROVAL_POLICIES = [
  {
    id: 'POL-STD-01',
    name: 'Standard Compensation Tier (Within Budget Range)',
    description: 'Applies to offers where the proposed CTC is at or below the approved requisition budget ceiling.',
    entity: 'All Entities',
    department: 'All Departments',
    criteria: 'Proposed CTC <= Requisition Max Budget',
    executionType: 'Sequential',
    levels: [
      { level: 1, role: 'hiring_manager', name: 'Hiring Manager Review & Sign-off', required: true, slaHours: 24 },
      { level: 2, role: 'hr_bp', name: 'HR Business Partner Validation', required: true, slaHours: 24 }
    ],
    isActive: true,
    createdDate: '2026-01-01'
  },
  {
    id: 'POL-EXC-02',
    name: 'Budget Exception & High Compensation Tier',
    description: 'Triggered when proposed CTC exceeds requisition budget ceiling by up to 20%, requiring Finance Director approval.',
    entity: 'All Entities',
    department: 'All Departments',
    criteria: 'Proposed CTC > Requisition Max Budget',
    executionType: 'Sequential',
    levels: [
      { level: 1, role: 'hiring_manager', name: 'Hiring Manager Endorsement', required: true, slaHours: 24 },
      { level: 2, role: 'hr_bp', name: 'HR Business Partner Assessment', required: true, slaHours: 24 },
      { level: 3, role: 'finance', name: 'Finance / FP&A Budget Override', required: true, slaHours: 48 }
    ],
    isActive: true,
    createdDate: '2026-01-01'
  },
  {
    id: 'POL-EXEC-03',
    name: 'Executive & Leadership Hiring Policy',
    description: 'Requires dual executive sign-offs (VP HR & CFO) for Director level (IC-6+) and above.',
    entity: 'All Entities',
    department: 'Engineering / Product / Management',
    criteria: 'Job Level >= IC-6 or Total CTC >= ₹45 LPA / $200k',
    executionType: 'Parallel',
    levels: [
      { level: 1, role: 'hr_admin', name: 'VP Global Talent & HR', required: true, slaHours: 48 },
      { level: 2, role: 'finance', name: 'Chief Financial Officer (CFO)', required: true, slaHours: 48 }
    ],
    isActive: true,
    createdDate: '2026-01-01'
  }
];

export const INITIAL_OFFERS = [];

