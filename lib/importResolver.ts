/**
 * importResolver.ts
 * Resolves a relative import specifier (e.g. '../utils/crypto') to the
 * canonical relative path of the target file within the project root
 * (e.g. 'utils/crypto.js').
 *
 * Resolution order mirrors Node.js / bundler conventions:
 *   1. Exact path match (specifier already has an extension).
 *   2. Try appending each supported extension.
 *   3. Try as a directory with /index.<ext>.
 */

import path from 'path';
import { SUPPORTED_EXTENSIONS } from './fileDiscovery';

export interface ResolveResult {
  /** Resolved relative path (forward slashes), or null if unresolved. */
  resolvedPath: string | null;
  /** True when the specifier could not be mapped to any known project file. */
  isUnresolved: boolean;
  /** Reason string when unresolved (for display in the UI). */
  unresolvedReason?: string;
}

/**
 * Resolves a single import specifier relative to its importer file.
 *
 * @param specifier     The raw import string, e.g. '../utils/crypto'.
 * @param importerPath  Relative path of the file that contains the import,
 *                      e.g. 'models/User.js'.
 * @param fileSet       Set of all relative paths known to exist in the project.
 * @returns             ResolveResult
 */
export function resolveImport(
  specifier: string,
  importerPath: string,
  fileSet: Set<string>,
): ResolveResult {
  // Non-relative specifiers (packages, node builtins, aliases) are unresolvable
  // at this layer without a full module resolver.
  if (!specifier.startsWith('.')) {
    return {
      resolvedPath: null,
      isUnresolved: true,
      unresolvedReason: `External package or built-in: "${specifier}"`,
    };
  }

  const importerDir = path.dirname(importerPath);
  // Join and normalise to forward-slash relative path.
  const joined = path
    .join(importerDir, specifier)
    .split(path.sep)
    .join('/');

  // 1. Exact match (specifier already includes extension).
  if (fileSet.has(joined)) {
    return { resolvedPath: joined, isUnresolved: false };
  }

  // 2. Try appending each supported extension.
  for (const ext of SUPPORTED_EXTENSIONS) {
    const candidate = joined + ext;
    if (fileSet.has(candidate)) {
      return { resolvedPath: candidate, isUnresolved: false };
    }
  }

  // 3. Try directory/index.<ext>.
  for (const ext of SUPPORTED_EXTENSIONS) {
    const candidate = joined + '/index' + ext;
    if (fileSet.has(candidate)) {
      return { resolvedPath: candidate, isUnresolved: false };
    }
  }

  return {
    resolvedPath: null,
    isUnresolved: true,
    unresolvedReason: `Could not find "${specifier}" from "${importerPath}"`,
  };
}
