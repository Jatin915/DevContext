/**
 * Post service — CRUD operations for blog posts.
 */

const { createPost, publishPost } = require('../models/Post');
const { isNonEmpty } = require('../utils/validators');

// In-memory store for demo purposes.
const posts = new Map();

/**
 * Creates and stores a new post.
 * @param {object} params  — { title, body, author }
 * @returns {object} post
 */
async function createNewPost({ title, body, author }) {
  if (!isNonEmpty(title)) {
    throw new Error('Post title must not be empty.');
  }
  if (!isNonEmpty(body)) {
    throw new Error('Post body must not be empty.');
  }

  const post = createPost({ id: Date.now().toString(), title, body, author });
  posts.set(post.id, post);
  return post;
}

/**
 * Retrieves a post by ID.
 * @param {string} id
 * @returns {object|null}
 */
async function getPost(id) {
  return posts.get(id) ?? null;
}

/**
 * Publishes a post by its ID.
 * @param {string} id
 * @returns {object} updated post
 */
async function publishPostById(id) {
  const post = posts.get(id);
  if (!post) {
    throw new Error(`Post ${id} not found.`);
  }
  const updated = publishPost(post);
  posts.set(id, updated);
  return updated;
}

/**
 * Lists all stored posts.
 * @returns {object[]}
 */
async function listPosts() {
  return Array.from(posts.values());
}

module.exports = { createNewPost, getPost, publishPostById, listPosts };
