'use client';

import DependencyPanel from './DependencyPanel';
import ImpactPanel from './ImpactPanel';
import type {
  FileScopedGraphResponse,
  ImpactResponse,
} from '@/types';

interface AnalysisSidebarProps {
  graphData: FileScopedGraphResponse | null;
  graphLoading: boolean;
  graphError: string | null;
  impactData: ImpactResponse | null;
  impactLoading: boolean;
  impactError: string | null;
  selectedFile: string | null;
  onFileClick: (path: string) => void;
}

export default function AnalysisSidebar({
  graphData,
  graphLoading,
  graphError,
  impactData,
  impactLoading,
  impactError,
  selectedFile,
  onFileClick,
}: AnalysisSidebarProps) {
  return (
    <aside
      style={{
        width: 300,
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top half — dependency analysis */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DependencyPanel
          data={graphData}
          loading={graphLoading}
          error={graphError}
          selectedFile={selectedFile}
          onFileClick={onFileClick}
        />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', flexShrink: 0 }} />

      {/* Bottom half — impact analysis */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ImpactPanel
          data={impactData}
          loading={impactLoading}
          error={impactError}
          onFileClick={onFileClick}
        />
      </div>
    </aside>
  );
}
