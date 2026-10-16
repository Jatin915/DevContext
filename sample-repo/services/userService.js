/**
 * User service — manages user records and profile updates.
 * NOTE: This file and notificationService.js form a deliberate circular dependency
 *       to demonstrate cycle detection in DevContext.
 */

const { createUser, canEdit } = require('../models/User');
const { notifyUser } = require('./notificationService');
const { isValidEmail } = require('../utils/validators');

// In-memory user store for demo purposes.
const users = new Map();

/**
 * Creates and stores a new user, then sends a welcome notification.
 * @param {object} params
 * @returns {object} user
 */
async function registerUser({ name, email, password }) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email.');
  }

  const user = createUser({ id: Date.now().toString(), name, email, password });
  users.set(user.id, user);

  // Triggers notificationService → userService circular reference.
  await notifyUser(user.id, `Welcome to the platform, ${name}!`);

  return user;
}

/**
 * Retrieves a user by ID.
 * @param {string} id
 * @returns {object|null}
 */
async function getUserById(id) {
  return users.get(id) ?? null;
}

/**
 * Promotes a user to editor role.
 * @param {string} id
 * @returns {object} updated user
 */
async function promoteToEditor(id) {
  const user = users.get(id);
  if (!user) throw new Error(`User ${id} not found.`);
  const updated = { ...user, role: 'editor', updatedAt: new Date().toISOString() };
  users.set(id, updated);
  await notifyUser(id, 'Your account has been upgraded to Editor.');
  return updated;
}

module.exports = { registerUser, getUserById, promoteToEditor };
