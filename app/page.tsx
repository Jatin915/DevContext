'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import FileExplorer from '@/components/FileExplorer';
import CodeViewer from '@/components/CodeViewer';
import AnalysisSidebar from '@/components/AnalysisSidebar';
import type {
  TreeResponse,
  FileResponse,
  FileScopedGraphResponse,
  ImpactResponse,
  TreeStats,
  FileTreeNode,
} from '@/types';

// ── State shape ────────────────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function idle<T>(): AsyncState<T> {
  return { data: null, loading: false, error: null };
}

function loading<T>(): AsyncState<T> {
  return { data: null, loading: true, error: null };
}

function success<T>(data: T): AsyncState<T> {
  return { data, loading: false, error: null };
}

function failure<T>(error: string): AsyncState<T> {
  return { data: null, loading: false, error };
}

// ── Fetch helpers ──────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
  return json as T;
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DevContextPage() {
  // Tree + global stats (loaded once on mount)
  const [treeState, setTreeState] = useState<AsyncState<TreeResponse>>(loading());

  // Per-file states (updated whenever selected file changes)
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileState, setFileState] = useState<AsyncState<FileResponse>>(idle());
  const [graphState, setGraphState] = useState<AsyncState<FileScopedGraphResponse>>(idle());
  const [impactState, setImpactState] = useState<AsyncState<ImpactResponse>>(idle());

  // ── Load file tree on mount ──────────────────────────────────────────────
  useEffect(() => {
    setTreeState(loading());
    fetchJSON<TreeResponse>('/api/tree')
      .then((data) => setTreeState(success(data)))
      .catch((err) => setTreeState(failure(err.message ?? 'Failed to load file tree.')));
  }, []);

  // ── Handle file selection ────────────────────────────────────────────────
  const handleFileSelect = useCallback((path: string) => {
    setSelectedPath(path);
    setFileState(loading());
    setGraphState(loading());
    setImpactState(loading());

    // All three requests fire in parallel.
    fetchJSON<FileResponse>(`/api/file?path=${encodeURIComponent(path)}`)
      .then((data) => setFileState(success(data)))
      .catch((err) => setFileState(failure(err.message ?? 'Failed to load file.')));

    fetchJSON<FileScopedGraphResponse>(`/api/graph?file=${encodeURIComponent(path)}`)
      .then((data) => setGraphState(success(data)))
      .catch((err) => setGraphState(failure(err.message ?? 'Failed to load graph.')));

    fetchJSON<ImpactResponse>(`/api/impact?file=${encodeURIComponent(path)}`)
      .then((data) => setImpactState(success(data)))
      .catch((err) => setImpactState(failure(err.message ?? 'Failed to load impact.')));
  }, []);

  // ── Derive render props ──────────────────────────────────────────────────
  const treeNodes: FileTreeNode[] = treeState.data?.root ?? [];
  const stats: TreeStats | null = treeState.data?.stats ?? null;

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-base)',
      }}
    >
      {/* Top bar */}
      <Header stats={stats} />

      {/* Main workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Left: file explorer */}
        {treeState.loading ? (
          <aside
            style={{
              width: 240,
              flexShrink: 0,
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LoadingSpinner label="Loading files…" />
          </aside>
        ) : treeState.error ? (
          <aside
            style={{
              width: 240,
              flexShrink: 0,
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border)',
              padding: 16,
            }}
          >
            <ErrorBanner message={treeState.error} />
          </aside>
        ) : (
          <FileExplorer
            nodes={treeNodes}
            selectedPath={selectedPath}
            onSelect={handleFileSelect}
          />
        )}

        {/* Centre: code viewer */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Welcome banner shown before any file is selected */}
          {!selectedPath && !fileState.loading ? (
            <WelcomeBanner
              stats={stats}
              onPickFile={() => {
                // Auto-select first file for convenience
                const first = findFirstFile(treeNodes);
                if (first) handleFileSelect(first);
              }}
            />
          ) : (
            <CodeViewer
              file={fileState.data}
              loading={fileState.loading}
              error={fileState.error}
            />
          )}
        </main>

        {/* Right: analysis panels */}
        <AnalysisSidebar
          graphData={graphState.data}
          graphLoading={graphState.loading}
          graphError={graphState.error}
          impactData={impactState.data}
          impactLoading={impactState.loading}
          impactError={impactState.error}
          selectedFile={selectedPath}
          onFileClick={handleFileSelect}
        />
      </div>
    </div>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        color: 'var(--text-muted)',
        fontSize: 12,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 20,
          height: 20,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: 'rgba(248,81,73,0.1)',
        border: '1px solid var(--danger)',
        borderRadius: 6,
        padding: '10px 12px',
        color: 'var(--danger)',
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <strong>Error</strong>
      <br />
      {message}
    </div>
  );
}

function WelcomeBanner({
  stats,
  onPickFile,
}: {
  stats: TreeStats | null;
  onPickFile: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        padding: 32,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          alignItems: 'flex-start',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #58a6ff 0%, #bc8cff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          D
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            DevContext
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            AI-powered codebase understanding. Explore source files, trace
            dependencies, and identify the blast radius of any change.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              width: '100%',
            }}
          >
            <StatCard label="Files" value={stats.totalFiles} color="var(--text-secondary)" />
            <StatCard label="Edges" value={stats.totalEdges} color="var(--accent)" />
            <StatCard label="Unresolved" value={stats.unresolvedCount} color="var(--warning)" />
            <StatCard
              label="Cycles"
              value={stats.cycleCount}
              color={stats.cycleCount > 0 ? 'var(--danger)' : 'var(--success)'}
            />
          </div>
        )}

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { n: '1', text: 'Select a file from the explorer on the left' },
            { n: '2', text: 'View its source code with syntax highlighting' },
            { n: '3', text: 'See what it imports and what imports it' },
            { n: '4', text: 'Understand the full impact of changing it' },
          ].map(({ n, text }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {n}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: '20px' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onPickFile}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Open first file →
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
  );
}

/** Returns the relativePath of the first file node in the tree (depth-first). */
function findFirstFile(nodes: FileTreeNode[]): string | null {
  for (const node of nodes) {
    if (node.type === 'file') return node.path;
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return null;
}
