'use client';

import { useEffect, useState, useRef } from 'react';
import type { FileResponse } from '@/types';

interface CodeViewerProps {
  file: FileResponse | null;
  loading: boolean;
  error: string | null;
}

const LANG_MAP: Record<string, string> = {
  '.js':  'javascript',
  '.jsx': 'jsx',
  '.ts':  'typescript',
  '.tsx': 'tsx',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

/** One rendered line: a gutter number + pre-highlighted HTML content. */
interface RenderedLine {
  number: number;
  html: string;
}

// ── Shiki HTML post-processor ──────────────────────────────────────────────────

/**
 * Splits shiki's output HTML into per-line records.
 *
 * Shiki emits:
 *   <pre ...><code><span class="line">…</span>\n<span class="line">…</span>…</code></pre>
 *
 * Each <span class="line"> contains arbitrarily many nested <span style="…">token</span>
 * elements for syntax colouring.  A non-greedy regex like /([\s\S]*?)<\/span>/ stops at
 * the FIRST closing </span> it finds — which is the end of the first inner token span,
 * not the end of the .line span.  That drops everything after the first token on each line.
 *
 * The correct approach: split on the *opening* tag `<span class="line">`, then trim the
 * one trailing `</span>` from each resulting chunk.  This never looks for a matching close
 * tag, so nested spans are irrelevant.
 */
function splitShikiLines(html: string): RenderedLine[] | null {
  // Pull everything inside <code>…</code>.
  const codeInner = html.match(/<code>([\s\S]*?)<\/code>/)?.[1];
  if (!codeInner) return null;

  // Split on every occurrence of the opening line tag.
  // The first element is whatever precedes the first line (empty string) — discard it.
  const OPEN_TAG = '<span class="line">';
  const parts = codeInner.split(OPEN_TAG);
  parts.shift(); // drop the empty prefix

  if (parts.length === 0) return null;

  const lines: RenderedLine[] = parts.map((chunk, i) => {
    // Each chunk is:  …inner html…</span>\n
    // We want just the inner html, so strip the trailing </span> (and any newline after it).
    const closeIdx = chunk.lastIndexOf('</span>');
    const inner = closeIdx !== -1 ? chunk.slice(0, closeIdx) : chunk;
    return { number: i + 1, html: inner };
  });

  return lines;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CodeViewer({ file, loading, error }: CodeViewerProps) {
  const [lines, setLines]               = useState<RenderedLine[] | null>(null);
  const [highlightError, setHighlightError] = useState(false);
  const prevPath = useRef<string | null>(null);
  // Ref to the single scroll container so we can reset it on file change.
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) {
      setLines(null);
      return;
    }

    // File changed — clear stale state and reset scroll immediately.
    if (prevPath.current !== file.relativePath) {
      prevPath.current = file.relativePath;
      setLines(null);
      setHighlightError(false);
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = 0;
        scrollRef.current.scrollTop  = 0;
      }
    }

    // Already have lines for this file.
    if (lines !== null) return;

    const lang = LANG_MAP[file.extension] ?? 'javascript';

    import('shiki')
      .then(({ createHighlighter }) =>
        createHighlighter({
          themes: ['github-dark'],
          langs: ['javascript', 'typescript', 'jsx', 'tsx'],
        }),
      )
      .then((hl) => {
        const html     = hl.codeToHtml(file.content, { lang, theme: 'github-dark' });
        const rendered = splitShikiLines(html);
        if (rendered) {
          setLines(rendered);
        } else {
          setHighlightError(true);
        }
      })
      .catch(() => setHighlightError(true));
  }, [file, lines]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={outerStyle}>
        <Placeholder icon="⟳" text="Loading file…" spin />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={outerStyle}>
        <Placeholder icon="✕" text={error} color="var(--danger)" />
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!file) {
    return (
      <div style={outerStyle}>
        <Placeholder
          icon="◈"
          text="Select a file from the explorer to view its source code."
        />
      </div>
    );
  }

  const lang = LANG_MAP[file.extension] ?? 'text';

  return (
    <div style={{ ...outerStyle, alignItems: 'stretch', justifyContent: 'flex-start', flexDirection: 'column' }}>
      {/* ── File header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          background: 'var(--bg-elevated)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>
            {file.extension.replace('.', '').toUpperCase()}
          </span>
          <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
            {file.relativePath}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Meta label="Lines" value={file.lineCount} />
          <Meta label="Size"  value={formatBytes(file.sizeBytes)} />
          <Meta label="Lang"  value={lang} />
        </div>
      </div>

      {/* ── Code area ── */}
      {/*
        Single scroll container for both axes.
        overflow:auto + no nested overflow on children = one source of truth
        for scrollLeft/scrollTop, which we reset on every file change.
      */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#0d1117',
        }}
      >
        {lines && !highlightError ? (
          <HighlightedCode lines={lines} />
        ) : (
          <PlainCode content={file.content} />
        )}
      </div>
    </div>
  );
}

// ── Sub-renderers ──────────────────────────────────────────────────────────────

/**
 * Renders shiki-highlighted lines with a real DOM gutter.
 *
 * Layout strategy
 * ───────────────
 * We render a plain <div> (not <pre>) as the outer wrapper so we are not
 * fighting <pre>'s white-space rules.  Each line is a flex row:
 *
 *   [gutter span | code span]
 *
 * The code span contains the shiki-coloured inner HTML for that line.
 * Because we use dangerouslySetInnerHTML only on the inner span (not on a
 * <pre>), there are no white-space / inline-span / tabindex interactions.
 *
 * Horizontal scrolling is handled by the parent scroll container.
 * min-width: max-content on the wrapper ensures the container knows the true
 * content width immediately, so scrollLeft=0 always shows the start of lines.
 */
function HighlightedCode({ lines }: { lines: RenderedLine[] }) {
  return (
    <div
      style={{
        padding: '12px 0',
        minWidth: 'max-content', // expand to widest line; enables correct h-scroll
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        fontSize: 13,
        lineHeight: '1.5',
      }}
    >
      {lines.map(({ number, html }) => (
        <div
          key={number}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            minHeight: '1.5em',
            paddingRight: 24,
          }}
        >
          {/* Gutter */}
          <span
            style={{
              display: 'inline-block',
              width: 44,
              minWidth: 44,        // never shrink
              flexShrink: 0,
              paddingRight: 16,
              textAlign: 'right',
              color: '#484f58',
              userSelect: 'none',
              fontSize: 12,
              lineHeight: '1.5',
              pointerEvents: 'none',
            }}
          >
            {number}
          </span>
          {/* Code — shiki inner HTML (coloured <span>s, no wrapping <pre>) */}
          <span
            style={{ whiteSpace: 'pre' }}  // preserve spaces/tabs in code text
            dangerouslySetInnerHTML={{ __html: html || '\u200b' /* zero-width space keeps empty lines from collapsing */ }}
          />
        </div>
      ))}
    </div>
  );
}

/** Plain-text fallback used when shiki fails to load or parse. */
function PlainCode({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div
      style={{
        padding: '12px 0',
        minWidth: 'max-content',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        fontSize: 13,
        lineHeight: '1.5',
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            minHeight: '1.5em',
            paddingRight: 24,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 44,
              minWidth: 44,
              flexShrink: 0,
              paddingRight: 16,
              textAlign: 'right',
              color: 'var(--text-muted)',
              userSelect: 'none',
              fontSize: 12,
            }}
          >
            {i + 1}
          </span>
          <span style={{ color: 'var(--text-secondary)', whiteSpace: 'pre' }}>
            {line || '\u200b'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}: </span>
      {value}
    </span>
  );
}

function Placeholder({
  icon,
  text,
  spin,
  color,
}: {
  icon: string;
  text: string;
  spin?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        margin: 'auto',
        color: color ?? 'var(--text-muted)',
        textAlign: 'center',
        padding: 32,
      }}
    >
      <span
        style={{
          fontSize: 32,
          display: 'inline-block',
          animation: spin ? 'spin 1s linear infinite' : undefined,
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 13, maxWidth: 280, lineHeight: 1.6 }}>{text}</span>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// Outer wrapper — used for placeholder states (loading / error / empty).
// flex + center alignment turns it into a centering box.
const outerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-base)',
  overflow: 'hidden',
};
