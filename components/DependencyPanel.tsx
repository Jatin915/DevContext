'use client';

import type { FileScopedGraphResponse, UnresolvedImport } from '@/types';

interface DependencyPanelProps {
  data: FileScopedGraphResponse | null;
  loading: boolean;
  error: string | null;
  selectedFile: string | null;
  onFileClick: (path: string) => void;
}

export default function DependencyPanel({
  data,
  loading,
  error,
  selectedFile,
  onFileClick,
}: DependencyPanelProps) {
  return (
    <section style={panelStyle}>
      <PanelHeader title="Dependency Analysis" icon="⟳" />

      {loading && <StatusMessage text="Analysing dependencies…" type="loading" />}
      {error && <StatusMessage text={error} type="error" />}

      {!loading && !error && !data && (
        <StatusMessage text="Select a file to see its dependencies." type="empty" />
      )}

      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'auto', flex: 1 }}>
          {/* This file imports */}
          <Section
            title={`Imports (${data.dependencies.length})`}
            color="var(--accent)"
            empty={data.dependencies.length === 0 ? 'No local imports.' : undefined}
          >
            {data.dependencies.map((dep) => (
              <FileChip
                key={dep}
                path={dep}
                badge="DEP"
                badgeColor="var(--accent)"
                onClick={() => onFileClick(dep)}
              />
            ))}
          </Section>

          {/* Imported by */}
          <Section
            title={`Imported by (${data.dependents.length})`}
            color="var(--purple)"
            empty={data.dependents.length === 0 ? 'No files import this one.' : undefined}
          >
            {data.dependents.map((dep) => (
              <FileChip
                key={dep}
                path={dep}
                badge="BY"
                badgeColor="var(--purple)"
                onClick={() => onFileClick(dep)}
              />
            ))}
          </Section>

          {/* Cycles */}
          {data.cycles.length > 0 && (
            <Section title={`Circular Dependencies (${data.cycles.length})`} color="var(--danger)">
              {data.cycles.map((cycle, i) => (
                <CycleChip key={i} cycle={cycle} />
              ))}
            </Section>
          )}

          {/* Unresolved */}
          {data.unresolved.length > 0 && (
            <Section
              title={`Unresolved Imports (${data.unresolved.length})`}
              color="var(--warning)"
            >
              {data.unresolved.map((u, i) => (
                <UnresolvedChip key={i} item={u} />
              ))}
            </Section>
          )}
        </div>
      )}
    </section>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PanelHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {title}
      </span>
    </div>
  );
}

function Section({
  title,
  color,
  empty,
  children,
}: {
  title: string;
  color: string;
  empty?: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div
        style={{
          padding: '8px 14px 6px',
          fontSize: 11,
          fontWeight: 600,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          background: 'var(--bg-elevated)',
        }}
      >
        {title}
      </div>
      {empty ? (
        <div style={{ padding: '8px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{empty}</div>
      ) : (
        <div style={{ padding: '4px 0' }}>{children}</div>
      )}
    </div>
  );
}

function FileChip({
  path,
  badge,
  badgeColor,
  onClick,
}: {
  path: string;
  badge: string;
  badgeColor: string;
  onClick: () => void;
}) {
  const parts = path.split('/');
  const file = parts.pop() ?? path;
  const dir = parts.join('/');

  return (
    <button
      onClick={onClick}
      title={`Select ${path}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 14px',
        width: '100%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: badgeColor,
          background: 'transparent',
          border: `1px solid ${badgeColor}`,
          borderRadius: 3,
          padding: '1px 4px',
          letterSpacing: '0.5px',
          flexShrink: 0,
        }}
      >
        {badge}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {dir && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{dir}/</span>}
        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{file}</span>
      </span>
    </button>
  );
}

function CycleChip({ cycle }: { cycle: string[] }) {
  return (
    <div style={{ padding: '6px 14px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: 'var(--danger)',
          background: 'rgba(248,81,73,0.08)',
          border: '1px solid rgba(248,81,73,0.25)',
          borderRadius: 4,
          padding: '5px 8px',
        }}
      >
        {cycle.map((node, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{node.split('/').pop()}</span>
            {i < cycle.length - 1 && <span style={{ color: 'var(--danger)' }}>→</span>}
          </span>
        ))}
        <span style={{ color: 'var(--danger)' }}>→ ⟳</span>
      </div>
    </div>
  );
}

function UnresolvedChip({ item }: { item: UnresolvedImport }) {
  return (
    <div style={{ padding: '5px 14px' }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--warning)',
          background: 'rgba(210,153,34,0.08)',
          border: '1px solid rgba(210,153,34,0.2)',
          borderRadius: 4,
          padding: '5px 8px',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>line {item.line}  </span>
        <code style={{ color: 'var(--warning)' }}>{item.specifier}</code>
        <div style={{ color: 'var(--text-muted)', marginTop: 2, fontSize: 10 }}>{item.reason}</div>
      </div>
    </div>
  );
}

function StatusMessage({ text, type }: { text: string; type: 'loading' | 'error' | 'empty' }) {
  const color =
    type === 'error' ? 'var(--danger)' : type === 'loading' ? 'var(--accent)' : 'var(--text-muted)';
  return (
    <div style={{ padding: '20px 14px', color, fontSize: 12 }}>{text}</div>
  );
}

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderBottom: '1px solid var(--border)',
  overflow: 'hidden',
  flex: 1,
  minHeight: 0,
};
