/**
 * serverUtils.ts
 * Server-side helpers shared across API routes.
 *
 * Security: all file access is restricted to the sample-repo directory.
 * Any request attempting to reach outside that boundary returns a 403.
 */

import path from 'path';

/** Absolute path to the sample repository that this app analyses. */
export const SAMPLE_REPO_ROOT = path.resolve(process.cwd(), 'sample-repo');

/**
 * Resolves `relativePath` against SAMPLE_REPO_ROOT and verifies the result
 * stays inside it (prevents path traversal attacks).
 *
 * @returns The safe absolute path.
 * @throws  Error with message 'PATH_TRAVERSAL' if the path escapes the root.
 */
export function safePath(relativePath: string): string {
  // Normalise to forward slashes and strip any leading slash.
  const normalised = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const resolved = path.resolve(SAMPLE_REPO_ROOT, normalised);

  if (!resolved.startsWith(SAMPLE_REPO_ROOT + path.sep) && resolved !== SAMPLE_REPO_ROOT) {
    throw new Error('PATH_TRAVERSAL');
  }

  return resolved;
}

/** Standard JSON error response helper. */
export function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
