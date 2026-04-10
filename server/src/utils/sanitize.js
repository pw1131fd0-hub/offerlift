import DOMPurify from 'isomorphic-dompurify';

export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
}

export function sanitizeAll(obj) {
  if (typeof obj === 'string') return sanitize(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeAll);
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeAll(value);
    }
    return result;
  }
  return obj;
}
