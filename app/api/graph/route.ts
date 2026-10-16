/**
 * GET /api/graph
 *
 * Returns the full dependency graph of the sample repository.
 *
 * Response shape:
 * {
 *   nodes: Array<{ id, dependencyCount, dependentCount }>,
 *   edges: Array<{ from, to, line, kind }>,
 *   unresolved: Array<{ importerPath, specifier, reason, line }>,
 *   cycles: string[][],
 *   stats: { totalFiles, totalEdges, unresolvedCount, cycleCount },
 *   builtAt: number,
 * }
 *
 * GET /api/graph?file=<relativePath>
 *
 * When a `file` parameter is provided, the response is scoped to that file:
 * {
 *   file: string,
 *   dependencies: string[],         // what this file imports
 *   dependents: string[],           // what imports this file
 *   unresolved: UnresolvedImport[],
 *   cycles: string[][],
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_REPO_ROOT } from '@/lib/serverUtils';
import { getOrBuildAnalysis, buildGraphSummary } from '@/lib/analyser';
import {
  getDirectDependencies,
  getUnresolvedImports,
  getCyclesForFile,
} from '@/lib/impactAnalysis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  try {
    const analysis = getOrBuildAnalysis(SAMPLE_REPO_ROOT);
    const { graph } = analysis;

    // ── Scoped response for a single file ──────────────────────────────────
    if (file) {
      if (!graph.files.includes(file)) {
        return NextResponse.json({ error: `File not found in graph: ${file}` }, { status: 404 });
      }

      const dependencies = getDirectDependencies(file, graph);
      const dependents = Array.from(graph.reverse.get(file) ?? []);
      const unresolved = getUnresolvedImports(file, graph);
      const cycles = getCyclesForFile(file, graph);

      return NextResponse.json({ file, dependencies, dependents, unresolved, cycles });
    }

    // ── Full graph response ────────────────────────────────────────────────
    const summary = buildGraphSummary(analysis);
    return NextResponse.json({ ...summary, builtAt: analysis.builtAt });

  } catch (err) {
    console.error('[/api/graph]', err);
    return NextResponse.json({ error: 'Failed to build dependency graph.' }, { status: 500 });
  }
}
