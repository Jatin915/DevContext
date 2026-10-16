'use client';

import { useState } from 'react';
import type { ImpactResponse, AffectedFile } from '@/types';

interface ImpactPanelProps {
  data: ImpactResponse | null;
  loading: boolean;
  error: string | null;
  onFileClick: (path: string) => void;
}

export default function ImpactPanel({ data, loading, error, onFileClick }: ImpactPanelProps) {
  return (
    <section style={panelStyle}>
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Impact Analysis
        </span>
      </div>

      {loading && <StatusMsg text="Computing impact…" color="var(--accent)" />}
      {error && <StatusMsg text={error} color="var(--danger)" />}

      {!loading && !error && !data && (
        <StatusMsg text="Select a file to see what it would affect if changed." color="var(--text-muted)" />
      )}

      {data && !loading && (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Summary row */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: '10px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
            }}
          >
            <ImpactBadge
              value={data.directDependents.length}
              label="Direct"
              color="var(--orange)"
            />
            <ImpactBadge
              value={data.transitiveDependents.length}
              label="Transitive"
              color="var(--warning)"
            />
            <ImpactBadge
              value={data.totalAffected}
              label="Total"
              color={data.totalAffected > 0 ? 'var(--danger)' : 'var(--success)'}
            />
            {data.truncated && (
              <span style={{ fontSize: 10, color: 'var(--warning)', alignSelf: 'center' }}>
                ⚠ truncated
              </span>
            )}
          </div>

          {data.totalAffected === 0 ? (
            <div style={{ padding: '16px 14px', color: 'var(--success)', fontSize: 12 }}>
              ✓ No other files depend on this one. Safe to change.
            </div>
          ) : (
            <div>
              {data.affected.map((a) => (
                <AffectedRow key={a.path} item={a} onClick={() => onFileClick(a.path)} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ImpactBadge({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48 }}>
      <span style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</span>
    </div>
  );
}

function AffectedRow({ item, onClick }: { item: AffectedFile; onClick: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isDirect = item.relationship === 'direct';

  const parts = item.path.split('/');
  const file = parts.pop() ?? item.path;
  const dir = parts.join('/');

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 14px',
        }}
      >
        {/* Relationship badge */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: isDirect ? 'var(--orange)' : 'var(--warning)',
            border: `1px solid ${isDirect ? 'var(--orange)' : 'var(--warning)'}`,
            borderRadius: 3,
            padding: '1px 4px',
            letterSpacing: '0.5px',
            flexShrink: 0,
          }}
        >
          {isDirect ? 'DIRECT' : `+${item.depth}`}
        </span>

        {/* File name — click to select */}
        <button
          onClick={onClick}
          title={`Select ${item.path}`}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            padding: 0,
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {dir && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{dir}/</span>}
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{file}</span>
        </button>

        {/* Chain toggle */}
        {item.chain.length > 2 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            title="Show dependency chain"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 3,
              padding: '1px 5px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 10,
              flexShrink: 0,
            }}
          >
            {expanded ? '▲ chain' : '▼ chain'}
          </button>
        )}
      </div>

      {/* Expanded chain */}
      {expanded && (
        <div
          style={{
            padding: '6px 14px 8px 36px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            {item.chain.map((node, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <code
                  style={{
                    fontSize: 11,
                    color: i === 0 ? 'var(--accent)' : i === item.chain.length - 1 ? 'var(--orange)' : 'var(--text-secondary)',
                    background: 'var(--bg-elevated)',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  {node.split('/').pop()}
                </code>
                {i < item.chain.length - 1 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusMsg({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ padding: '16px 14px', color, fontSize: 12 }}>{text}</div>
  );
}

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
};
