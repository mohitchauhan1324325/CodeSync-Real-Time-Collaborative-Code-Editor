/**
 * Middleware to sanitize user input and prevent NoSQL Injection attacks.
 * Recursively strips keys beginning with '$' or containing '.' from req.body, req.query, and req.params.
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key of Object.keys(obj)) {
    // Prevent Prototype Pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    // Strip MongoDB operators like $gt, $where, $ne
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    sanitized[key] = sanitizeObject(obj[key]);
  }

  return sanitized;
};

export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};
