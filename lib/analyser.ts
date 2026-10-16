/**
 * analyser.ts
 * High-level orchestrator: given a project root directory, runs the full
 * discovery → parsing → graph construction pipeline and caches the result
 * in-process for the lifetime of the server.
 *
 * Caching avoids re-scanning the (static) sample repo on every request.
 * The cache is keyed by rootDir and can be invalidated by calling clearCache().
 */

import path from 'path';
import { discoverFiles, DiscoveredFile } from './fileDiscovery';
import { buildDependencyGraph, DependencyGraph } from './graphBuilder';
import { analyseImpact, ImpactResult, getDirectDependencies, getUnresolvedImports, getCyclesForFile } from './impactAnalysis';

export interface AnalysisCache {
  rootDir: string;
  files: DiscoveredFile[];
  graph: DependencyGraph;
  builtAt: number;
}

const cache = new Map<string, AnalysisCache>();

/**
 * Returns a cached analysis for rootDir, building it if not yet cached.
 */
export function getOrBuildAnalysis(rootDir: string): AnalysisCache {
  const existing = cache.get(rootDir);
  if (existing) return existing;

  const files = discoverFiles(rootDir);
  const graph = buildDependencyGraph(files);

  const entry: AnalysisCache = {
    rootDir,
    files,
    graph,
    builtAt: Date.now(),
  };

  cache.set(rootDir, entry);
  return entry;
}

/** Removes the cached analysis for rootDir, forcing a rebuild on next access. */
export function clearCache(rootDir: string): void {
  cache.delete(rootDir);
}

/** Clears all cached analyses. */
export function clearAllCaches(): void {
  cache.clear();
}

// ── Convenience re-exports ────────────────────────────────────────────────────

export { analyseImpact, getDirectDependencies, getUnresolvedImports, getCyclesForFile };
export type { ImpactResult };

/**
 * Returns a summary object suitable for the /api/graph route.
 */
export function buildGraphSummary(cache: AnalysisCache) {
  const { graph } = cache;

  // Serialise Sets to arrays for JSON transport.
  const nodes = graph.files.map((fp) => ({
    id: fp,
    dependencyCount: graph.forward.get(fp)?.size ?? 0,
    dependentCount: graph.reverse.get(fp)?.size ?? 0,
  }));

  const edges = graph.edges.map((e) => ({
    from: e.from,
    to: e.to,
    line: e.line,
    kind: e.kind,
  }));

  return {
    nodes,
    edges,
    unresolved: graph.unresolved,
    cycles: graph.cycles,
    stats: {
      totalFiles: graph.files.length,
      totalEdges: graph.edges.length,
      unresolvedCount: graph.unresolved.length,
      cycleCount: graph.cycles.length,
    },
  };
}
