import React from 'react';
import { Globe, TrendingUp, ExternalLink } from 'lucide-react';
import type { BundleAnalyzerState } from '../../types';

interface CDNAnalysisTabProps {
  state: BundleAnalyzerState;
  eventClient: any;
}

export function CDNAnalysisTab({ state, eventClient }: CDNAnalysisTabProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="cdn-analysis-tab">
      <div className="cdn-header">
        <div className="header-info">
          <h3>CDN Opportunities Analysis</h3>
          <p>Identify modules that could be loaded from CDN instead of bundled</p>
        </div>
        <button 
          className="analyze-btn"
          onClick={() => eventClient.startCDNAnalysis()}
        >
          <Globe size={14} />
          Analyze CDN Opportunities
        </button>
      </div>

      {state.cdnAnalysis.length === 0 ? (
        <div className="empty-state">
          <Globe size={48} color="var(--text-secondary)" />
          <h3>No CDN Analysis Available</h3>
          <p>Run CDN analysis to see potential optimizations.</p>
        </div>
      ) : (
        <div className="cdn-opportunities">
          {state.cdnAnalysis.map((analysis, index) => (
            <div key={index} className="cdn-opportunity">
              <div className="opportunity-header">
                <div className="module-info">
                  <div className="module-name">{analysis.module}</div>
                  <div className="recommendation-badge">
                    {analysis.recommendation.replace('-', ' ').toUpperCase()}
                  </div>
                </div>
                <div className="savings-info">
                  {analysis.savingsPotential > 0 ? (
                    <div className="savings positive">
                      <TrendingUp size={14} />
                      <span>{formatSize(analysis.savingsPotential)} savings</span>
                    </div>
                  ) : (
                    <div className="savings negative">
                      <span>No savings</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="opportunity-details">
                <div className="size-comparison">
                  <div className="size-item">
                    <span className="size-label">Bundle Size:</span>
                    <span className="size-value">{formatSize(analysis.bundleSize)}</span>
                  </div>
                  <div className="size-item">
                    <span className="size-label">CDN Size:</span>
                    <span className="size-value">{formatSize(analysis.cdnSize)}</span>
                  </div>
                  <div className="size-item">
                    <span className="size-label">Compatibility:</span>
                    <span className={`compatibility-value ${analysis.compatibility}`}>
                      {analysis.compatibility.toUpperCase()}
                    </span>
                  </div>
                </div>

                {analysis.cdnUrl && (
                  <div className="cdn-info">
                    <span className="cdn-label">CDN URL:</span>
                    <a 
                      href={analysis.cdnUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="cdn-url"
                    >
                      {analysis.cdnUrl}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .cdn-analysis-tab {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .cdn-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
        }

        .header-info h3 {
          margin: 0 0 4px 0;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
        }

        .header-info p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 11px;
        }

        .analyze-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid var(--border-primary);
          background: var(--accent-primary);
          color: white;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        }

        .analyze-btn:hover {
          background: var(--accent-secondary);
        }

        .cdn-opportunities {
          flex: 1;
          overflow: auto;
          padding: 8px;
        }

        .cdn-opportunity {
          background: var(--bg-secondary);
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .opportunity-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .module-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .module-name {
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 500;
          font-family: monospace;
        }

        .recommendation-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 500;
          width: fit-content;
        }

        .savings {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .savings.positive {
          color: var(--accent-secondary);
        }

        .savings.negative {
          color: var(--text-secondary);
        }

        .opportunity-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .size-comparison {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-tertiary);
          border-radius: 4px;
          padding: 8px;
        }

        .size-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .size-label {
          color: var(--text-secondary);
          font-size: 10px;
        }

        .size-value {
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 600;
        }

        .compatibility-value {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .compatibility-value.high {
          background: var(--accent-secondary);
          color: white;
        }

        .compatibility-value.medium {
          background: #fbbc04;
          color: white;
        }

        .compatibility-value.low {
          background: #ea4335;
          color: white;
        }

        .cdn-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }

        .cdn-label {
          color: var(--text-secondary);
          min-width: 60px;
        }

        .cdn-url {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--accent-primary);
          text-decoration: none;
          font-family: monospace;
        }

        .cdn-url:hover {
          text-decoration: underline;
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