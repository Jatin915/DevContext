'use client';

import { useState } from 'react';
import type { FileTreeNode } from '@/types';

interface FileExplorerProps {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

const EXT_COLORS: Record<string, string> = {
  '.js':  '#ffa657',
  '.jsx': '#ffa657',
  '.ts':  '#58a6ff',
  '.tsx': '#58a6ff',
  '.mjs': '#ffa657',
  '.cjs': '#ffa657',
};

function fileIcon(ext: string): string {
  if (ext === '.ts' || ext === '.tsx') return '⬡';
  if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') return '⬡';
  return '·';
}

function FileNode({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const isSelected = node.path === selectedPath;
  const indent = depth * 14;

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            width: '100%',
            padding: `3px 12px 3px ${12 + indent}px`,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: 12,
            textAlign: 'left',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1, width: 10 }}>
            {open ? '▾' : '▸'}
          </span>
          <span style={{ fontSize: 13 }}>{open ? '📂' : '📁'}</span>
          <span style={{ fontWeight: 500 }}>{node.name}</span>
        </button>
        {open && node.children && (
          <div>
            {node.children.map((child) => (
              <FileNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const ext = node.extension ?? '';
  const extColor = EXT_COLORS[ext] ?? 'var(--text-muted)';

  return (
    <button
      onClick={() => onSelect(node.path)}
      title={node.path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        width: '100%',
        padding: `3px 12px 3px ${12 + indent}px`,
        background: isSelected ? 'var(--accent-dim)' : 'none',
        border: 'none',
        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
        cursor: 'pointer',
        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 12,
        textAlign: 'left',
        userSelect: 'none',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'none';
      }}
    >
      <span style={{ color: extColor, fontSize: 10, fontWeight: 700, width: 20, textAlign: 'center', flexShrink: 0 }}>
        {ext.replace('.', '').toUpperCase()}
      </span>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        {node.name}
      </span>
    </button>
  );
}

export default function FileExplorer({ nodes, selectedPath, onSelect }: FileExplorerProps) {
  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar header */}
      <div
        style={{
          padding: '10px 14px 8px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}
        >
          Sample Repository
        </span>
      </div>

      {/* Tree */}
      <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 8, paddingTop: 4 }}>
        {nodes.length === 0 ? (
          <div style={{ padding: '20px 14px', color: 'var(--text-muted)', fontSize: 12 }}>
            No files found.
          </div>
        ) : (
          nodes.map((node) => (
            <FileNode
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  );
}
