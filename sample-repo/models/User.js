/**
 * User model — defines the shape of a user record and validation helpers.
 */

const { hashPassword, comparePassword } = require('../utils/crypto');
const { isValidEmail } = require('../utils/validators');

const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

/**
 * Creates a new User object.
 * @param {object} fields
 * @returns {object} user
 */
function createUser({ id, name, email, password, role = USER_ROLES.VIEWER }) {
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email address: ${email}`);
  }

  return {
    id,
    name,
    email,
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validates a plaintext password against a stored hash.
 * @param {string} plaintext
 * @param {string} hash
 * @returns {boolean}
 */
function verifyUserPassword(plaintext, hash) {
  return comparePassword(plaintext, hash);
}

/**
 * Checks whether a user has at least editor-level access.
 * @param {object} user
 * @returns {boolean}
 */
function canEdit(user) {
  return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.EDITOR;
}

module.exports = { createUser, verifyUserPassword, canEdit, USER_ROLES };
