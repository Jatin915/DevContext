/**
 * Validation utilities — reusable input validators.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks whether a string is a valid email address.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

/**
 * Checks whether a string meets minimum password requirements.
 * @param {string} password
 * @returns {boolean}
 */
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

/**
 * Checks whether a value is a non-empty string.
 * @param {string} value
 * @returns {boolean}
 */
function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

module.exports = { isValidEmail, isValidPassword, isNonEmpty };
