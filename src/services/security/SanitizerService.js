/**
 * Enterprise Sanitizer & Input Neutralization Service
 * Protects against XSS, HTML Injection, Email Header Injection, and Formula Injection.
 */

class SanitizerServiceImpl {
  /**
   * HTML entity encoding for untrusted strings
   */
  escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitizes rich text or notes, removing dangerous script tags and event handlers
   */
  sanitizeText(input) {
    if (typeof input !== 'string') return input;
    // Strip script tags and their content
    let clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Strip javascript: and data: URI schemes in links
    clean = clean.replace(/href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'href="#"');
    clean = clean.replace(/src\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'src=""');
    // Strip on* event handlers (e.g. onload, onerror, onclick)
    clean = clean.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    clean = clean.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');
    return clean.trim();
  }

  /**
   * Protects against Email Header Injection (CRLF) in subject and recipient lines
   */
  sanitizeEmailHeader(headerValue) {
    if (typeof headerValue !== 'string') return '';
    // Strip carriage returns, line feeds, and null bytes
    return headerValue.replace(/[\r\n\0]/g, '').trim();
  }

  /**
   * Protects CSV/Excel exports from Formula Injection (CSV Injection)
   */
  sanitizeCsvCell(value) {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    // If string starts with formula characters (=, +, -, @, tab, CR), prefix with single quote
    if (/^[=+\-@\t\r]/.test(str)) {
      return `'${str}`;
    }
    return str;
  }

  /**
   * Sanitizes text inputs before AI processing / parsing to neutralize prompt injection attacks
   */
  sanitizePromptText(text) {
    if (typeof text !== 'string') return '';
    let clean = text;
    // Strip delimiter tricks and system override patterns
    clean = clean.replace(/ignore\s+previous\s+instructions/gi, '[neutralized instruction]');
    clean = clean.replace(/system\s*:\s*override/gi, '[neutralized instruction]');
    clean = clean.replace(/\[\/?INST\]/gi, '');
    clean = clean.replace(/<<\/?SYS>>/gi, '');
    clean = clean.replace(/<\|im_start\|>|<\|im_end\|>/gi, '');
    return clean;
  }

  /**
   * Validates and sanitizes a candidate object inputs before saving
   */
  sanitizeCandidateInput(candidateData) {
    if (!candidateData || typeof candidateData !== 'object') return candidateData;
    return {
      ...candidateData,
      name: this.escapeHtml(candidateData.name || ''),
      email: this.sanitizeEmailHeader(candidateData.email || ''),
      phone: this.escapeHtml(candidateData.phone || ''),
      location: this.escapeHtml(candidateData.location || ''),
      currentTitle: this.escapeHtml(candidateData.currentTitle || ''),
      currentCompany: this.escapeHtml(candidateData.currentCompany || ''),
      notes: (candidateData.notes || []).map(n => ({
        ...n,
        content: this.sanitizeText(n.content || '')
      }))
    };
  }
}

export const SanitizerService = new SanitizerServiceImpl();
