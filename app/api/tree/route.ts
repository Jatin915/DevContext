/**
 * GET /api/tree
 *
 * Returns the nested file tree of the sample repository together with
 * aggregate statistics from the dependency graph.
 *
 * Response shape:
 * {
 *   root: FileTreeNode[],       // nested tree (dirs first, then files)
 *   stats: {
 *     totalFiles: number,
 *     totalEdges: number,
 *     unresolvedCount: number,
 *     cycleCount: number,
 *   },
 *   builtAt: number             // epoch ms when the graph was last built
 * }
 */

import { NextResponse } from 'next/server';
import { SAMPLE_REPO_ROOT } from '@/lib/serverUtils';
import { getOrBuildAnalysis, buildGraphSummary } from '@/lib/analyser';
import { buildFileTree } from '@/lib/fileTree';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analysis = getOrBuildAnalysis(SAMPLE_REPO_ROOT);
    const summary = buildGraphSummary(analysis);
    const tree = buildFileTree(analysis.files.map((f) => f.relativePath));

    return NextResponse.json({
      root: tree,
      stats: summary.stats,
      builtAt: analysis.builtAt,
    });
  } catch (err) {
    console.error('[/api/tree]', err);
    return NextResponse.json(
      { error: 'Failed to build file tree.' },
      { status: 500 },
    );
  }
}
