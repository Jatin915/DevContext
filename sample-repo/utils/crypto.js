/**
 * Crypto utilities — lightweight password hashing helpers.
 * NOTE: Uses a simple deterministic transform for demo purposes only.
 *       In production, use bcrypt or argon2.
 */

const { APP_SECRET } = require('../config/env');

/**
 * Produces a deterministic "hash" of a password using the app secret.
 * @param {string} password
 * @returns {string}
 */
function hashPassword(password) {
  // Simplified demo hash — not cryptographically secure.
  const combined = `${APP_SECRET}:${password}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `demo_${Math.abs(hash).toString(16)}`;
}

/**
 * Compares a plaintext password against a stored hash.
 * @param {string} plaintext
 * @param {string} storedHash
 * @returns {boolean}
 */
function comparePassword(plaintext, storedHash) {
  return hashPassword(plaintext) === storedHash;
}

module.exports = { hashPassword, comparePassword };
