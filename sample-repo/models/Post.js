/**
 * Post model — defines the shape of a blog post and its helpers.
 */

const { canEdit } = require('./User');
const { slugify } = require('../utils/string');

const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

/**
 * Creates a new Post object.
 * @param {object} fields
 * @returns {object} post
 */
function createPost({ id, title, body, author }) {
  if (!canEdit(author)) {
    throw new Error(`User ${author.id} does not have permission to create posts.`);
  }

  return {
    id,
    title,
    slug: slugify(title),
    body,
    authorId: author.id,
    status: POST_STATUS.DRAFT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Publishes a post by updating its status.
 * @param {object} post
 * @returns {object} updated post
 */
function publishPost(post) {
  return { ...post, status: POST_STATUS.PUBLISHED, updatedAt: new Date().toISOString() };
}

module.exports = { createPost, publishPost, POST_STATUS };
