/**
 * graphBuilder.ts
 * Builds a directed dependency graph from a set of discovered files.
 *
 * Graph direction:  A → B  means "A imports B"  (A depends on B).
 *
 * Provides:
 *   - forward adjacency (file → its dependencies)
 *   - reverse adjacency (file → files that import it)
 *   - list of unresolved imports
 *   - list of detected cycles
 */

import path from 'path';
import { DiscoveredFile, readFileContent } from './fileDiscovery';
import { parseImports } from './importParser';
import { resolveImport } from './importResolver';

export interface UnresolvedImport {
  importerPath: string;
  specifier: string;
  reason: string;
  line: number;
}

export interface DependencyEdge {
  from: string; // relative path of the importer
  to: string;   // relative path of the dependency
  line: number; // line in `from` where the import appears
  kind: 'esm' | 'cjs';
}

export interface DependencyGraph {
  /** All relative paths in the project (includes files with no imports). */
  files: string[];
  /**
   * forward[file] = set of files that `file` directly imports.
   * Keys exist for every file in `files`.
   */
  forward: Map<string, Set<string>>;
  /**
   * reverse[file] = set of files that directly import `file`.
   * Keys exist for every file in `files`.
   */
  reverse: Map<string, Set<string>>;
  /** All resolved directed edges (with line numbers). */
  edges: DependencyEdge[];
  /** Imports that could not be resolved to a project file. */
  unresolved: UnresolvedImport[];
  /** Detected cycles, each represented as an ordered path of file names. */
  cycles: string[][];
}

// ── Cycle detection ───────────────────────────────────────────────────────────

/**
 * Finds all simple cycles in a directed graph using DFS + colouring.
 * Returns each cycle as an array of node names (path from start back to start).
 * Halts after MAX_CYCLES to avoid spending too long on pathological inputs.
 */
const MAX_CYCLES = 20;

function findCycles(forward: Map<string, Set<string>>): string[][] {
  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const cycles: string[][] = [];

  for (const node of forward.keys()) color.set(node, WHITE);

  function dfs(u: string): void {
    if (cycles.length >= MAX_CYCLES) return;
    color.set(u, GREY);

    for (const v of forward.get(u) ?? []) {
      if (cycles.length >= MAX_CYCLES) return;
      if (color.get(v) === GREY) {
        // Found a back edge u → v — reconstruct the cycle.
        const cycle: string[] = [v, u];
        let cur: string | null | undefined = parent.get(u);
        while (cur != null && cur !== v) {
          cycle.push(cur);
          cur = parent.get(cur);
        }
        cycle.reverse();
        cycles.push(cycle);
      } else if (color.get(v) === WHITE) {
        parent.set(v, u);
        dfs(v);
      }
    }

    color.set(u, BLACK);
  }

  for (const node of forward.keys()) {
    if (color.get(node) === WHITE) dfs(node);
  }

  return cycles;
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Builds a full DependencyGraph for the given set of discovered files.
 *
 * @param files   Output of discoverFiles().
 * @returns       DependencyGraph
 */
export function buildDependencyGraph(files: DiscoveredFile[]): DependencyGraph {
  const fileSet = new Set(files.map((f) => f.relativePath));
  const filePaths = files.map((f) => f.relativePath);

  const forward = new Map<string, Set<string>>();
  const reverse = new Map<string, Set<string>>();
  const edges: DependencyEdge[] = [];
  const unresolved: UnresolvedImport[] = [];

  // Initialise adjacency entries for every file.
  for (const fp of filePaths) {
    forward.set(fp, new Set());
    reverse.set(fp, new Set());
  }

  // Parse and resolve imports for each file.
  for (const file of files) {
    const source = readFileContent(file.absolutePath);
    if (source === null) continue;

    const imports = parseImports(source);

    for (const imp of imports) {
      const result = resolveImport(imp.specifier, file.relativePath, fileSet);

      if (result.isUnresolved || result.resolvedPath === null) {
        unresolved.push({
          importerPath: file.relativePath,
          specifier: imp.specifier,
          reason: result.unresolvedReason ?? 'Unknown',
          line: imp.line,
        });
        continue;
      }

      const target = result.resolvedPath;

      // Guard against self-imports.
      if (target === file.relativePath) continue;

      forward.get(file.relativePath)!.add(target);
      reverse.get(target)!.add(file.relativePath);

      edges.push({
        from: file.relativePath,
        to: target,
        line: imp.line,
        kind: imp.kind,
      });
    }
  }

  const cycles = findCycles(forward);

  return { files: filePaths, forward, reverse, edges, unresolved, cycles };
}
