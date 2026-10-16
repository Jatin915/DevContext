/**
 * impactAnalysis.ts
 * Answers the question: "If file X changes, which other files are affected?"
 *
 * Uses the reverse adjacency from the dependency graph to perform a BFS
 * over the reverse graph, collecting all transitive dependents.
 *
 * Depth-limited to MAX_DEPTH to handle pathological graphs gracefully;
 * cycle-safe because visited nodes are tracked.
 */

import type { DependencyGraph } from './graphBuilder';

const MAX_DEPTH = 50;

export interface AffectedFile {
  /** Relative path of the affected file. */
  path: string;
  /** 'direct' if it immediately imports the changed file; 'transitive' otherwise. */
  relationship: 'direct' | 'transitive';
  /** How many hops away this file is from the changed file in the reverse graph. */
  depth: number;
  /**
   * Chain of relative paths from the changed file to this affected file,
   * i.e. changedFile → intermediary1 → … → affectedFile.
   */
  chain: string[];
}

export interface ImpactResult {
  /** The file whose change is being analysed. */
  changedFile: string;
  /** All files that are affected (directly or transitively). */
  affected: AffectedFile[];
  /** Files that directly import the changed file. */
  directDependents: string[];
  /** Files reachable only through at least one intermediate file. */
  transitiveDependents: string[];
  /** True when the traversal was truncated due to MAX_DEPTH. */
  truncated: boolean;
}

/**
 * Computes the impact of changing `changedFile`.
 *
 * @param changedFile  Relative path of the file being changed.
 * @param graph        DependencyGraph produced by buildDependencyGraph().
 * @returns            ImpactResult
 */
export function analyseImpact(
  changedFile: string,
  graph: DependencyGraph,
): ImpactResult {
  const affected: AffectedFile[] = [];
  const visited = new Set<string>();
  let truncated = false;

  // BFS queue entries: [nodePath, depth, chain]
  type QueueEntry = { node: string; depth: number; chain: string[] };
  const queue: QueueEntry[] = [];

  // Seed with direct reverse neighbours.
  const directNeighbours = graph.reverse.get(changedFile) ?? new Set<string>();
  for (const dep of directNeighbours) {
    queue.push({ node: dep, depth: 1, chain: [changedFile, dep] });
  }

  while (queue.length > 0) {
    const { node, depth, chain } = queue.shift()!;

    if (visited.has(node)) continue;
    visited.add(node);

    if (depth > MAX_DEPTH) {
      truncated = true;
      continue;
    }

    affected.push({
      path: node,
      relationship: depth === 1 ? 'direct' : 'transitive',
      depth,
      chain,
    });

    // Enqueue the next-level reverse neighbours.
    const nextNeighbours = graph.reverse.get(node) ?? new Set<string>();
    for (const next of nextNeighbours) {
      if (!visited.has(next)) {
        queue.push({ node: next, depth: depth + 1, chain: [...chain, next] });
      }
    }
  }

  const directDependents = affected
    .filter((a) => a.relationship === 'direct')
    .map((a) => a.path);

  const transitiveDependents = affected
    .filter((a) => a.relationship === 'transitive')
    .map((a) => a.path);

  return {
    changedFile,
    affected,
    directDependents,
    transitiveDependents,
    truncated,
  };
}

/**
 * Returns the direct dependencies of a file (what it imports).
 */
export function getDirectDependencies(
  filePath: string,
  graph: DependencyGraph,
): string[] {
  return Array.from(graph.forward.get(filePath) ?? []);
}

/**
 * Returns all unresolved imports for a given file.
 */
export function getUnresolvedImports(
  filePath: string,
  graph: DependencyGraph,
) {
  return graph.unresolved.filter((u) => u.importerPath === filePath);
}

/**
 * Returns all cycles that involve the given file.
 */
export function getCyclesForFile(
  filePath: string,
  graph: DependencyGraph,
): string[][] {
  return graph.cycles.filter((cycle) => cycle.includes(filePath));
}
