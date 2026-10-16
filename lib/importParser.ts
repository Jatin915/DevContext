/**
 * importParser.ts
 * Extracts import/require specifiers from JavaScript and TypeScript source files
 * using regex-based static analysis (no execution, no eval).
 *
 * Handles:
 *   - ES module:  import x from './foo'
 *                 import { a, b } from './bar'
 *                 import * as ns from './baz'
 *                 import './side-effect'
 *                 export { x } from './qux'
 *                 export * from './qux'
 *   - CommonJS:   require('./foo')
 *                 require('../utils/bar')
 *
 * Intentionally ignores dynamic import() calls and non-relative specifiers
 * (package imports like 'react', 'express') — those are reported as unresolved.
 */

export interface ParsedImport {
  /** The raw specifier string as it appears in the source. */
  specifier: string;
  /** Whether this specifier starts with '.' or '..', i.e. is a local import. */
  isRelative: boolean;
  /** Line number (1-based) where the import appears. */
  line: number;
  /** Import style detected. */
  kind: 'esm' | 'cjs';
}

// ── Regex patterns ────────────────────────────────────────────────────────────

// Matches: import ... from 'specifier'  OR  export ... from 'specifier'
// Also matches bare: import 'specifier'
const ESM_FROM_RE =
  /(?:^|[\r\n])[ \t]*(?:import|export)(?:\s+(?:type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\}|\w+(?:\s*,\s*(?:\{[^}]*\}|\w+))*))?(?:\s+from)?\s+['"]([^'"]+)['"]/gm;

// Matches: require('specifier')  — including `= require(`, `require(` etc.
const CJS_REQUIRE_RE = /(?:^|[^\w$])require\(\s*['"]([^'"]+)['"]\s*\)/gm;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Counts the number of newlines before a given string index. */
function lineAtIndex(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (source[i] === '\n') line++;
  }
  return line;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Parses all import/require statements from source text.
 *
 * @param source  Raw source code as a string.
 * @returns       Array of ParsedImport records (may contain duplicates if the
 *                same module is imported more than once).
 */
export function parseImports(source: string): ParsedImport[] {
  const results: ParsedImport[] = [];
  const seen = new Set<string>(); // deduplicate by specifier

  // ESM imports / exports
  for (const match of source.matchAll(ESM_FROM_RE)) {
    const specifier = match[1];
    if (!specifier) continue;
    const line = lineAtIndex(source, match.index ?? 0);
    const key = `esm:${specifier}:${line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ specifier, isRelative: specifier.startsWith('.'), line, kind: 'esm' });
  }

  // CommonJS require()
  for (const match of source.matchAll(CJS_REQUIRE_RE)) {
    const specifier = match[1];
    if (!specifier) continue;
    const line = lineAtIndex(source, match.index ?? 0);
    const key = `cjs:${specifier}:${line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ specifier, isRelative: specifier.startsWith('.'), line, kind: 'cjs' });
  }

  return results;
}
