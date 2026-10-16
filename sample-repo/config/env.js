/**
 * Environment configuration — centralised access to environment variables.
 */

const APP_SECRET = process.env.APP_SECRET || 'dev-secret-do-not-use-in-production';
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

module.exports = { APP_SECRET, PORT, NODE_ENV, BASE_URL };
