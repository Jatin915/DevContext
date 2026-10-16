/**
 * Logger middleware — logs incoming HTTP requests.
 */

const { NODE_ENV } = require('../config/env');

/**
 * Simple request logger.
 * In production environments, structured JSON logging would replace this.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const line = `[${new Date().toISOString()}] ${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`;

    if (NODE_ENV === 'production') {
      process.stdout.write(JSON.stringify({ method: req.method, url: req.url, status: res.statusCode, duration }) + '\n');
    } else {
      console.log(line);
    }
  });

  next();
}

module.exports = { requestLogger };
