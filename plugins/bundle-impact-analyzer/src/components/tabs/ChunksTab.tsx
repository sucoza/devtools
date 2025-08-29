import React from 'react';
import { FileText, Package, Activity } from 'lucide-react';
import type { BundleAnalyzerState } from '../../types';

interface ChunksTabProps {
  state: BundleAnalyzerState;
  eventClient: any;
}

export function ChunksTab({ state, eventClient }: ChunksTabProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="chunks-tab">
      <div className="chunks-header">
        <div className="chunks-stats">
          <span className="stat">{state.chunks.length} chunks</span>
          <span className="stat">
            Total: {formatSize(state.chunks.reduce((sum, c) => sum + c.size, 0))}
          </span>
        </div>
      </div>

      {state.chunks.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} color="var(--text-secondary)" />
          <h3>No chunks found</h3>
          <p>Start analyzing your bundle to see chunk information.</p>
        </div>
      ) : (
        <div className="chunks-list">
          {state.chunks.map((chunk) => (
            <div key={chunk.id} className="chunk-item">
              <div className="chunk-header">
                <div className="chunk-icon">
                  <FileText size={16} />
                </div>
                <div className="chunk-info">
                  <div className="chunk-name">{chunk.name}</div>
                  <div className="chunk-details">
                    {chunk.isEntry && <span className="chunk-badge entry">Entry</span>}
                    {chunk.isAsync && <span className="chunk-badge async">Async</span>}
                  </div>
                </div>
                <div className="chunk-size">
                  <div className="size-primary">{formatSize(chunk.size)}</div>
                  {chunk.gzipSize && (
                    <div className="size-secondary">
                      {formatSize(chunk.gzipSize)} gz
                    </div>
                  )}
                </div>
              </div>
              
              {chunk.modules.length > 0 && (
                <div className="chunk-modules">
                  <div className="modules-header">
                    <Package size={14} />
                    <span>{chunk.modules.length} modules</span>
                  </div>
                  <div className="modules-preview">
                    {chunk.modules.slice(0, 3).map(module => (
                      <span key={module.id} className="module-preview">
                        {module.name}
                      </span>
                    ))}
                    {chunk.modules.length > 3 && (
                      <span className="modules-more">
                        +{chunk.modules.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .chunks-tab {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .chunks-header {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
        }

        .chunks-stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          color: var(--text-secondary);
          font-size: 11px;
        }

        .chunks-list {
          flex: 1;
          overflow: auto;
          padding: 8px;
        }

        .chunk-item {
          background: var(--bg-secondary);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .chunk-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .chunk-icon {
          color: var(--text-secondary);
        }

        .chunk-info {
          flex: 1;
        }

        .chunk-name {
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .chunk-details {
          display: flex;
          gap: 6px;
        }

        .chunk-badge {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 500;
        }

        .chunk-badge.entry {
          background: var(--accent-primary);
          color: white;
        }

        .chunk-badge.async {
          background: var(--accent-secondary);
          color: white;
        }

        .chunk-size {
          text-align: right;
        }

        .size-primary {
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
        }

        .size-secondary {
          color: var(--text-secondary);
          font-size: 10px;
        }

        .chunk-modules {
          border-top: 1px solid var(--border-primary);
          padding-top: 8px;
        }

        .modules-header {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 11px;
          margin-bottom: 6px;
        }

        .modules-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .module-preview {
          padding: 2px 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          font-size: 10px;
          color: var(--text-primary);
        }

        .modules-more {
          color: var(--text-secondary);
          font-size: 10px;
          font-style: italic;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-secondary);
        }

        .empty-state h3 {
          margin: 16px 0 8px 0;
          color: var(--text-primary);
        }

        .empty-state p {
          margin: 0;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}