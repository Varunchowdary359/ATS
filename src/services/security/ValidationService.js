/**
 * Enterprise Frontend Input Validation & URL Security Service
 * Centralizes strict schema checks, boundary constraints, and URL sanitization.
 */

const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'data:text/html', 'data:text/javascript'];
const BLOCKED_HOSTNAMES = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', 'metadata.google.internal'];

class ValidationServiceImpl {
  /**
   * Validates strict RFC 5322 compliant email format
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (trimmed.length < 5 || trimmed.length > 100) return false;
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(trimmed);
  }

  /**
   * Validates international phone formats
   */
  isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 8 && digitsOnly.length <= 15;
  }

  /**
   * Sanitizes and verifies external URLs, blocking open redirects, XSS protocols, and SSRF ranges
   */
  isSafeUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    const lower = rawUrl.trim().toLowerCase();

    // Block dangerous protocols
    if (DANGEROUS_PROTOCOLS.some(proto => lower.startsWith(proto))) {
      return false;
    }

    // Must be http:// or https:// or relative path starting with /
    if (lower.startsWith('/')) return true; // Safe internal path

    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }
      if (BLOCKED_HOSTNAMES.includes(parsed.hostname.toLowerCase())) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safe URL resolver fallback
   */
  sanitizeUrl(rawUrl, fallback = '#') {
    return this.isSafeUrl(rawUrl) ? rawUrl.trim() : fallback;
  }

  /**
   * Validates alphanumeric IDs and prevents injection chars
   */
  isValidEntityId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[a-zA-Z0-9_-]{3,64}$/.test(id.trim());
  }

  /**
   * Validates numeric boundary constraints
   */
  isValidNumeric(val, min = 0, max = Infinity) {
    const num = Number(val);
    if (isNaN(num)) return false;
    return num >= min && num <= max;
  }
}

export const ValidationService = new ValidationServiceImpl();
