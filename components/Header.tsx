'use client';

import type { TreeStats } from '@/types';

interface HeaderProps {
  stats: TreeStats | null;
}

export default function Header({ stats }: HeaderProps) {
  return (
    <header
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #58a6ff 0%, #bc8cff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          D
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          DevContext
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--accent)',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            borderRadius: 4,
            padding: '1px 6px',
            letterSpacing: '0.5px',
          }}
        >
          PHASE 1
        </span>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Stat label="Files" value={stats.totalFiles} color="var(--text-secondary)" />
          <Stat label="Edges" value={stats.totalEdges} color="var(--accent)" />
          <Stat label="Unresolved" value={stats.unresolvedCount} color="var(--warning)" />
          <Stat
            label="Cycles"
            value={stats.cycleCount}
            color={stats.cycleCount > 0 ? 'var(--danger)' : 'var(--success)'}
          />
        </div>
      )}
    </header>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span style={{ fontSize: 15, fontWeight: 600, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
  );
}
