/**
 * Auth routes — /api/auth endpoints.
 */

const { register, login } = require('../services/authService');
const { isValidEmail, isValidPassword } = require('../utils/validators');

/**
 * Registers route handlers on the given Express router.
 * @param {object} router — Express Router instance
 */
function mountAuthRoutes(router) {
  /**
   * POST /api/auth/register
   * Body: { name, email, password }
   */
  router.post('/register', async (req, res) => {
    const { name, email, password } = req.body ?? {};

    if (!name || !isValidEmail(email) || !isValidPassword(password)) {
      return res.status(400).json({ error: 'Invalid registration data.' });
    }

    try {
      const { user, token } = await register({ name, email, password });
      return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    } catch (err) {
      return res.status(409).json({ error: err.message });
    }
  });

  /**
   * POST /api/auth/login
   * Body: { email, password }
   * Header: uses a dummy stored user for demo purposes.
   */
  router.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};

    // In a real app, storedUser would come from a database lookup.
    const storedUser = req.app.locals.users?.find((u) => u.email === email) ?? null;

    try {
      const { user, token } = await login({ email, password }, storedUser);
      return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }
  });
}

module.exports = { mountAuthRoutes };
