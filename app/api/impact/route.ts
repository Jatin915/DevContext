/**
 * GET /api/impact?file=<relativePath>
 *
 * Returns impact analysis for the given file: which files would be affected
 * if this file changed.
 *
 * Response shape:
 * {
 *   changedFile: string,
 *   affected: Array<{
 *     path: string,
 *     relationship: 'direct' | 'transitive',
 *     depth: number,
 *     chain: string[],
 *   }>,
 *   directDependents: string[],
 *   transitiveDependents: string[],
 *   truncated: boolean,
 *   totalAffected: number,
 * }
 *
 * Error responses:
 *   400 — missing `file` parameter
 *   404 — file not found in the graph
 *   500 — analysis error
 */

import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_REPO_ROOT } from '@/lib/serverUtils';
import { getOrBuildAnalysis, analyseImpact } from '@/lib/analyser';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  if (!file || file.trim() === '') {
    return NextResponse.json(
      { error: 'Missing required query parameter: file' },
      { status: 400 },
    );
  }

  try {
    const analysis = getOrBuildAnalysis(SAMPLE_REPO_ROOT);
    const { graph } = analysis;

    if (!graph.files.includes(file)) {
      return NextResponse.json(
        { error: `File not found in analysis: ${file}` },
        { status: 404 },
      );
    }

    const result = analyseImpact(file, graph);

    return NextResponse.json({
      ...result,
      totalAffected: result.affected.length,
    });

  } catch (err) {
    console.error('[/api/impact]', err);
    return NextResponse.json(
      { error: 'Failed to run impact analysis.' },
      { status: 500 },
    );
  }
}
