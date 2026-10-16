/**
 * Auth middleware — validates incoming request tokens.
 */

const { validateSession } = require('../services/authService');

/**
 * Express-style middleware that checks for a valid Bearer token.
 * Attaches the decoded payload to req.user if valid.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  try {
    req.user = validateSession(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Middleware that allows requests to proceed without a token,
 * but still decodes and attaches the user if one is present.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      req.user = validateSession(token);
    } catch {
      // Non-fatal — proceed without user context.
    }
  }

  next();
}

module.exports = { requireAuth, optionalAuth };
