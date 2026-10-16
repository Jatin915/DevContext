/**
 * Token service — JWT-like token generation and verification.
 * NOTE: Uses a simplified base64 scheme for demo purposes.
 *       In production, use the jsonwebtoken library.
 */

const { APP_SECRET } = require('../config/env');

/**
 * Generates a signed token from a payload object.
 * @param {object} payload
 * @returns {string}
 */
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'demo', typ: 'TOKEN' })).toString('base64');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64');
  const signature = Buffer.from(`${header}.${body}.${APP_SECRET}`).toString('base64');
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies a token and returns its payload.
 * @param {string} token
 * @returns {object} payload
 */
function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format.');
  }

  const [header, body, signature] = parts;
  const expectedSig = Buffer.from(`${header}.${body}.${APP_SECRET}`).toString('base64');

  if (signature !== expectedSig) {
    throw new Error('Token signature mismatch.');
  }

  return JSON.parse(Buffer.from(body, 'base64').toString('utf8'));
}

module.exports = { generateToken, verifyToken };
