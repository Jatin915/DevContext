/**
 * Shared TypeScript types for the DevContext UI.
 * These mirror the API response shapes so the client stays type-safe.
 */

// ── File tree ─────────────────────────────────────────────────────────────────

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileTreeNode[];
}

export interface TreeStats {
  totalFiles: number;
  totalEdges: number;
  unresolvedCount: number;
  cycleCount: number;
}

export interface TreeResponse {
  root: FileTreeNode[];
  stats: TreeStats;
  builtAt: number;
}

// ── File content ──────────────────────────────────────────────────────────────

export interface FileResponse {
  relativePath: string;
  content: string;
  extension: string;
  sizeBytes: number;
  lineCount: number;
}

// ── Dependency graph ──────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  dependencyCount: number;
  dependentCount: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  line: number;
  kind: 'esm' | 'cjs';
}

export interface UnresolvedImport {
  importerPath: string;
  specifier: string;
  reason: string;
  line: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  unresolved: UnresolvedImport[];
  cycles: string[][];
  stats: TreeStats;
  builtAt: number;
}

export interface FileScopedGraphResponse {
  file: string;
  dependencies: string[];
  dependents: string[];
  unresolved: UnresolvedImport[];
  cycles: string[][];
}

// ── Impact analysis ───────────────────────────────────────────────────────────

export interface AffectedFile {
  path: string;
  relationship: 'direct' | 'transitive';
  depth: number;
  chain: string[];
}

export interface ImpactResponse {
  changedFile: string;
  affected: AffectedFile[];
  directDependents: string[];
  transitiveDependents: string[];
  truncated: boolean;
  totalAffected: number;
}

// ── UI state ──────────────────────────────────────────────────────────────────

export type LoadState = 'idle' | 'loading' | 'success' | 'error';
