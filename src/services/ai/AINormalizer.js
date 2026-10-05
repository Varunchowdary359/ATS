/**
 * Centralized Type-Safe Text Normalization and Entity String Extractor
 * Prevents TypeError: *.toLowerCase is not a function across all AI components.
 */

export function normalizeText(input) {
  if (input === null || input === undefined) return '';
  
  if (typeof input === 'string') {
    return input.trim().toLowerCase();
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input).toLowerCase();
  }

  if (Array.isArray(input)) {
    return input
      .map(item => normalizeText(item))
      .filter(Boolean)
      .join(' ');
  }

  if (typeof input === 'object') {
    const candidateField = input.name || input.title || input.text || input.value || input.content || input.label || '';
    if (candidateField) {
      return normalizeText(candidateField);
    }
    return '';
  }

  return '';
}

export function safeString(input, defaultValue = '') {
  if (input === null || input === undefined) return defaultValue;
  if (typeof input === 'string') return input;
  if (typeof input === 'number' || typeof input === 'boolean') return String(input);
  if (typeof input === 'object') {
    const val = input.name || input.title || input.text || input.value || input.label || '';
    return typeof val === 'string' ? val : defaultValue;
  }
  return defaultValue;
}

export function safeToLowerCase(input) {
  return normalizeText(input);
}

export function extractSkillNames(skills = []) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map(s => {
      if (!s) return '';
      if (typeof s === 'string') return s.trim();
      if (typeof s === 'object') return (s.name || s.skill || s.title || '').trim();
      return String(s).trim();
    })
    .filter(Boolean);
}
