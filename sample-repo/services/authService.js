/**
 * Auth service — handles registration, login, and token management.
 */

const { createUser, verifyUserPassword } = require('../models/User');
const { isValidEmail, isValidPassword } = require('../utils/validators');
const { generateToken, verifyToken } = require('./tokenService');

/**
 * Registers a new user.
 * @param {object} params
 * @returns {object} { user, token }
 */
async function register({ name, email, password }) {
  if (!isValidEmail(email)) {
    throw new Error('Registration failed: invalid email.');
  }
  if (!isValidPassword(password)) {
    throw new Error('Registration failed: password must be at least 8 characters.');
  }

  const user = createUser({ id: Date.now().toString(), name, email, password });
  const token = generateToken({ userId: user.id, role: user.role });

  return { user, token };
}

/**
 * Authenticates a user and returns a token.
 * @param {object} params
 * @param {object} storedUser  — the user record retrieved from the data store
 * @returns {object} { user, token }
 */
async function login({ email, password }, storedUser) {
  if (!storedUser || storedUser.email !== email) {
    throw new Error('Login failed: user not found.');
  }

  const valid = verifyUserPassword(password, storedUser.passwordHash);
  if (!valid) {
    throw new Error('Login failed: incorrect password.');
  }

  const token = generateToken({ userId: storedUser.id, role: storedUser.role });
  return { user: storedUser, token };
}

/**
 * Decodes and validates a session token.
 * @param {string} token
 * @returns {object} decoded payload
 */
function validateSession(token) {
  return verifyToken(token);
}

module.exports = { register, login, validateSession };
