/**
 * app.js — Application entry point.
 *
 * Wires together middleware, routes, and starts the HTTP server.
 */

const { PORT } = require('./config/env');
const { requestLogger } = require('./middleware/logger');
const { mountAuthRoutes } = require('./routes/authRoutes');
const { mountPostRoutes } = require('./routes/postRoutes');

// In a real project this would be: const express = require('express');
// For demo purposes, we reference a hypothetical express-like factory.
const express = require('express');

const app = express();

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────────────────────────
const authRouter = express.Router();
mountAuthRoutes(authRouter);
app.use('/api/auth', authRouter);

const postRouter = express.Router();
mountPostRoutes(postRouter);
app.use('/api/posts', postRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
