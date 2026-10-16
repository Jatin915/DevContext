/**
 * GET /api/file?path=<relativePath>
 *
 * Returns the raw source content of a single file from the sample repository.
 *
 * Response shape:
 * {
 *   relativePath: string,
 *   content: string,
 *   extension: string,
 *   sizeBytes: number,
 *   lineCount: number,
 * }
 *
 * Error responses:
 *   400 — missing or invalid `path` query parameter
 *   403 — path traversal attempt
 *   404 — file not found in the project
 *   500 — read error
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SAMPLE_REPO_ROOT, safePath, errorResponse } from '@/lib/serverUtils';
import { SUPPORTED_EXTENSIONS } from '@/lib/fileDiscovery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const relativePath = searchParams.get('path');

  if (!relativePath || relativePath.trim() === '') {
    return errorResponse('Missing required query parameter: path', 400);
  }

  // Security: reject unsupported extensions before touching the filesystem.
  const ext = path.extname(relativePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return errorResponse(`Unsupported file type: ${ext}`, 400);
  }

  let absolutePath: string;
  try {
    absolutePath = safePath(relativePath);
  } catch {
    return errorResponse('Path traversal not permitted.', 403);
  }

  if (!fs.existsSync(absolutePath)) {
    return errorResponse(`File not found: ${relativePath}`, 404);
  }

  let content: string;
  try {
    content = fs.readFileSync(absolutePath, 'utf-8');
  } catch (err) {
    console.error('[/api/file] read error', err);
    return errorResponse('Failed to read file.', 500);
  }

  const sizeBytes = Buffer.byteLength(content, 'utf-8');
  const lineCount = content.split('\n').length;

  return NextResponse.json({
    relativePath,
    content,
    extension: ext,
    sizeBytes,
    lineCount,
  });
}
