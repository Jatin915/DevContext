/**
 * fileDiscovery.ts
 * Walks a directory tree and returns all supported source files,
 * excluding generated / non-source directories.
 */

import fs from 'fs';
import path from 'path';

// Directories that should never be traversed.
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  'coverage',
  '.turbo',
  '.cache',
  '__pycache__',
]);

// File extensions this tool can analyse.
export const SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

export interface DiscoveredFile {
  /** Absolute path on disk. */
  absolutePath: string;
  /** Path relative to the project root (uses forward slashes). */
  relativePath: string;
  /** File extension including the dot, e.g. ".js". */
  extension: string;
  /** File size in bytes. */
  sizeBytes: number;
}

/**
 * Recursively discovers all supported source files under `rootDir`.
 *
 * @param rootDir  Absolute path to the project root.
 * @param currentDir  Internal — used for recursion; defaults to rootDir.
 * @returns Flat array of discovered files, sorted by relative path.
 */
export function discoverFiles(
  rootDir: string,
  currentDir: string = rootDir,
): DiscoveredFile[] {
  const results: DiscoveredFile[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(currentDir, { withFileTypes: true });
  } catch {
    // Permission error or non-directory — skip silently.
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      results.push(...discoverFiles(rootDir, fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

      let sizeBytes = 0;
      try {
        sizeBytes = fs.statSync(fullPath).size;
      } catch {
        // Cannot stat — include the file anyway with size 0.
      }

      results.push({
        absolutePath: fullPath,
        relativePath: path.relative(rootDir, fullPath).split(path.sep).join('/'),
        extension: ext,
        sizeBytes,
      });
    }
  }

  return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/**
 * Reads the raw source text of a file.
 * Returns null if the file cannot be read (binary, permission error, etc.).
 */
export function readFileContent(absolutePath: string): string | null {
  try {
    return fs.readFileSync(absolutePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Returns a flat map of relativePath → absolutePath for all discovered files.
 */
export function buildFileMap(files: DiscoveredFile[]): Map<string, string> {
  return new Map(files.map((f) => [f.relativePath, f.absolutePath]));
}
