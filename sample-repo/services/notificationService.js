/**
 * Notification service — sends notifications to users.
 * NOTE: This file and userService.js form a deliberate circular dependency
 *       to demonstrate cycle detection in DevContext.
 */

const { getUserById } = require('./userService');
const { NODE_ENV } = require('../config/env');

/**
 * Sends an in-app notification to a user.
 * @param {string} userId
 * @param {string} message
 */
async function notifyUser(userId, message) {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error(`Cannot notify unknown user: ${userId}`);
  }

  if (NODE_ENV !== 'test') {
    console.log(`[NOTIFY] → ${user.email}: ${message}`);
  }

  return { userId, message, sentAt: new Date().toISOString() };
}

module.exports = { notifyUser };
