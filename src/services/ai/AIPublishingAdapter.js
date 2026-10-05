/**
 * Enterprise AI Job Posting Publishing Adapter
 * Simulated Multi-Channel Publishing Architecture for PeopleWorks ATS.
 * 
 * Supports 7 standard channels:
 * 1. Company Careers Portal (Direct Web Form)
 * 2. LinkedIn Jobs (REST API Feed)
 * 3. Naukri.com (SuperSet API)
 * 4. Indeed Apply (XML Syndication)
 * 5. Glassdoor (Custom REST API)
 * 6. Employee Referral (Internal Webhook)
 * 7. Internal Mobility (HRIS Portal Sync)
 */

export const PUBLISHING_CHANNELS = [
  {
    id: 'careers_portal',
    name: 'Company Careers Portal',
    badge: 'Official Portal',
    color: '#1a56db',
    method: 'Direct Web Form',
    estimatedReach: '5,000+ monthly visits',
    description: 'Host on official company careers web page with customized branding and application forms.',
    aliases: ['careers portal', 'careers', 'portal', 'career site', 'company website', 'career page', 'careers_portal'],
    urlTemplate: (id) => `https://careers.peopleworks.ai/jobs/${id || 'REQ-2026-0001'}`
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Jobs',
    badge: 'Enterprise Feed',
    color: '#0a66c2',
    method: 'REST API Feed',
    estimatedReach: '50,000+ passive professionals',
    description: 'One-click sync to LinkedIn Recruiter enterprise job feed and candidate matching.',
    aliases: ['linkedin', 'linkedin jobs', 'linked in', 'linkedin feed'],
    urlTemplate: (id) => `https://www.linkedin.com/jobs/view/pw-${String(id || '').toLowerCase()}`
  },
  {
    id: 'naukri',
    name: 'Naukri.com',
    badge: 'India Lead',
    color: '#f97316',
    method: 'SuperSet API',
    estimatedReach: '80,000+ active job seekers',
    description: 'Direct distribution to India’s largest talent portal with automated resume matches.',
    aliases: ['naukri', 'naukri.com', 'naukri portal', 'naukari'],
    urlTemplate: (id) => `https://www.naukri.com/job-listings-pw-${String(id || '').toLowerCase()}`
  },
  {
    id: 'indeed',
    name: 'Indeed Apply',
    badge: 'Global Sync',
    color: '#2557a7',
    method: 'XML Syndication',
    estimatedReach: '120,000+ global candidates',
    description: 'Sponsored and organic job board syndication with quick-apply integration.',
    aliases: ['indeed', 'indeed apply', 'indeed jobs', 'indeed syndication'],
    urlTemplate: (id) => `https://www.indeed.com/viewjob?jk=pw_${String(id || '').toLowerCase()}`
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor',
    badge: 'Custom Sync',
    color: '#059669',
    method: 'Custom REST API',
    estimatedReach: '45,000+ job seekers',
    description: 'Employer brand syndication & direct job posting API.',
    aliases: ['glassdoor', 'glass door', 'glassdoor jobs'],
    urlTemplate: (id) => `https://www.glassdoor.com/job-listing/pw-${String(id || '').toLowerCase()}`
  },
  {
    id: 'employee_referral',
    name: 'Employee Referral',
    badge: 'Internal Bonus',
    color: '#10b981',
    method: 'Internal Webhook',
    estimatedReach: 'Internal Workforce',
    description: 'Publish on internal employee referral dashboard with cash bonus incentives.',
    aliases: ['employee referral', 'referral', 'referrals', 'internal referral', 'employee_referral'],
    urlTemplate: (id) => `https://internal.peopleworks.ai/referrals/${id || 'REQ-2026-0001'}`
  },
  {
    id: 'internal_mobility',
    name: 'Internal Mobility',
    badge: 'Employees Only',
    color: '#ec4899',
    method: 'HRIS Portal Sync',
    estimatedReach: 'Internal Workforce',
    description: 'Enable internal team members to apply for transfers or promotions before external hiring.',
    aliases: ['internal mobility', 'mobility', 'internal transfers', 'internal_mobility', 'internal'],
    urlTemplate: (id) => `https://internal.peopleworks.ai/mobility/${id || 'REQ-2026-0001'}`
  }
];

class AIPublishingAdapterImpl {
  constructor() {
    this._publishedRegistry = new Map(); // Idempotency tracker
  }

  /**
   * Returns all 7 standard supported channels
   */
  getAvailableChannels() {
    return [...PUBLISHING_CHANNELS];
  }

  /**
   * Resolves channel aliases from natural language query
   */
  resolveChannels(text) {
    if (!text) return ['careers_portal', 'linkedin', 'naukri'];
    const lower = String(text).toLowerCase().trim();

    // Universal / all channels matching
    if (
      /\b(all|everywhere|all\s+channels|all\s+platforms|every\s+channel|complete|all\s+portals|every\s+portal)\b/i.test(lower) ||
      /అన్ని\s+ఛానెల్స్|అన్నింటిలో/i.test(lower) ||
      /सभी\s+चैनलों|हर\s+जगह/i.test(lower)
    ) {
      return PUBLISHING_CHANNELS.map(c => c.id);
    }

    const matched = new Set();

    PUBLISHING_CHANNELS.forEach(ch => {
      for (const alias of ch.aliases) {
        const regex = new RegExp(`\\b${alias.replace('.', '\\.')}\\b`, 'i');
        if (regex.test(lower) || lower.includes(alias)) {
          matched.add(ch.id);
          break;
        }
      }
    });

    if (matched.size === 0) {
      // Default standard trio if not specified
      return ['careers_portal', 'linkedin', 'naukri'];
    }

    return Array.from(matched);
  }

  /**
   * Validates channel-specific constraints
   */
  validateChannel(channelId, postingData) {
    const channel = PUBLISHING_CHANNELS.find(c => c.id === channelId);
    if (!channel) {
      return { isValid: false, error: `Unsupported channel identifier '${channelId}'.` };
    }

    if (channelId === 'linkedin') {
      if (!postingData.title || postingData.title.trim().length < 3) {
        return { isValid: false, error: 'LinkedIn requires a valid job title.' };
      }
      if (!postingData.location) {
        return { isValid: false, error: 'LinkedIn requires a job location.' };
      }
    }

    if (channelId === 'naukri') {
      if (!postingData.skills || (Array.isArray(postingData.skills) && postingData.skills.length === 0)) {
        return { isValid: false, error: 'Naukri.com requires at least one primary skill for search indexing.' };
      }
    }

    if (channelId === 'careers_portal') {
      if (!postingData.department) {
        return { isValid: false, error: 'Careers Portal requires department classification.' };
      }
    }

    return { isValid: true };
  }

  /**
   * Simulates publishing a job posting to a specific channel
   */
  async publishToChannel(channelId, postingData, options = {}) {
    const channel = PUBLISHING_CHANNELS.find(c => c.id === channelId);
    if (!channel) {
      throw new Error(`Channel '${channelId}' is not supported in PeopleWorks ATS.`);
    }

    const valResult = this.validateChannel(channelId, postingData);
    if (!valResult.isValid) {
      return {
        channelId,
        channelName: channel.name,
        badge: channel.badge,
        color: channel.color,
        method: channel.method,
        status: 'Failed',
        error: valResult.error,
        simulated: true,
        publishedAt: null
      };
    }

    // Idempotency: return existing publication state if already published
    const idempotencyKey = `${postingData.id || postingData.reqId || 'POST'}_${channelId}`;
    if (this._publishedRegistry.has(idempotencyKey) && !options.force) {
      return this._publishedRegistry.get(idempotencyKey);
    }

    // Simulated network processing latency (10-30ms)
    await new Promise(resolve => setTimeout(resolve, 20));

    const result = {
      channelId,
      channelName: channel.name,
      badge: channel.badge,
      color: channel.color,
      method: channel.method,
      status: 'Published',
      reach: channel.estimatedReach,
      liveUrl: channel.urlTemplate(postingData.id || postingData.reqId || 'REQ-2026-0001'),
      publishedAt: new Date().toISOString(),
      simulated: true,
      transactionId: `TXN-${channelId.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-6)}`
    };

    this._publishedRegistry.set(idempotencyKey, result);
    return result;
  }

  /**
   * Publishes across multiple channels concurrently with error isolation
   */
  async publishMultiChannel(channelIds, postingData, options = {}) {
    const targets = Array.isArray(channelIds) && channelIds.length > 0
      ? channelIds
      : ['careers_portal', 'linkedin', 'naukri'];

    const results = await Promise.all(
      targets.map(chId => this.publishToChannel(chId, postingData, options))
    );

    const successful = results.filter(r => r.status === 'Published');
    const failed = results.filter(r => r.status === 'Failed');

    return {
      success: successful.length > 0,
      totalChannels: targets.length,
      publishedCount: successful.length,
      failedCount: failed.length,
      results,
      publishedChannels: successful.map(r => r.channelId),
      liveUrls: successful.reduce((acc, r) => ({ ...acc, [r.channelId]: r.liveUrl }), {}),
      summaryText: successful.map(r => `• **${r.channelName}**: ✓ Published (${r.method})`).join('\n')
    };
  }

  /**
   * Resets internal registry (useful for testing)
   */
  reset() {
    this._publishedRegistry.clear();
  }
}

export const AIPublishingAdapter = new AIPublishingAdapterImpl();
