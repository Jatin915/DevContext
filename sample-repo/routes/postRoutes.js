/**
 * Post routes — /api/posts endpoints.
 */

const { createNewPost, getPost, publishPostById, listPosts } = require('../services/postService');
const { requireAuth } = require('../middleware/auth');

/**
 * Registers route handlers on the given Express router.
 * @param {object} router — Express Router instance
 */
function mountPostRoutes(router) {
  /**
   * GET /api/posts
   * Returns all posts.
   */
  router.get('/', async (req, res) => {
    try {
      const all = await listPosts();
      return res.status(200).json(all);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/posts/:id
   * Returns a single post by ID.
   */
  router.get('/:id', async (req, res) => {
    try {
      const post = await getPost(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found.' });
      return res.status(200).json(post);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/posts
   * Creates a new post. Requires authentication.
   */
  router.post('/', requireAuth, async (req, res) => {
    const { title, body } = req.body ?? {};
    try {
      const post = await createNewPost({ title, body, author: req.user });
      return res.status(201).json(post);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * POST /api/posts/:id/publish
   * Publishes a post. Requires authentication.
   */
  router.post('/:id/publish', requireAuth, async (req, res) => {
    try {
      const post = await publishPostById(req.params.id);
      return res.status(200).json(post);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });
}

module.exports = { mountPostRoutes };
