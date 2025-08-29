import React from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import type { BundleAnalyzerState, OptimizationRecommendation } from '../../types';

interface RecommendationsTabProps {
  state: BundleAnalyzerState;
  eventClient: any;
}

export function RecommendationsTab({ state, eventClient }: RecommendationsTabProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getSeverityIcon = (severity: OptimizationRecommendation['severity']) => {
    switch (severity) {
      case 'critical':
        return AlertTriangle;
      case 'high':
        return TrendingUp;
      case 'medium':
        return Lightbulb;
      case 'low':
        return CheckCircle;
      default:
        return Lightbulb;
    }
  };

  const getSeverityColor = (severity: OptimizationRecommendation['severity']) => {
    switch (severity) {
      case 'critical':
        return '#ea4335';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#fbbc04';
      case 'low':
        return '#34a853';
      default:
        return '#9aa0a6';
    }
  };

  const totalSavings = state.recommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0);

  return (
    <div className="recommendations-tab">
      <div className="recommendations-header">
        <div className="header-stats">
          <div className="stat">
            <span className="stat-label">Total Issues:</span>
            <span className="stat-value">{state.recommendations.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Potential Savings:</span>
            <span className="stat-value savings">{formatSize(totalSavings)}</span>
          </div>
        </div>
        
        <button 
          className="refresh-btn"
          onClick={() => eventClient.generateRecommendations?.()}
        >
          Refresh Analysis
        </button>
      </div>

      <div className="recommendations-list">
        {state.recommendations.map((recommendation, index) => {
          const SeverityIcon = getSeverityIcon(recommendation.severity);
          const severityColor = getSeverityColor(recommendation.severity);
          
          return (
            <div key={index} className={`recommendation-item severity-${recommendation.severity}`}>
              <div className="recommendation-header">
                <div className="severity-indicator">
                  <SeverityIcon size={16} color={severityColor} />
                  <span className="severity-label" style={{ color: severityColor }}>
                    {recommendation.severity.toUpperCase()}
                  </span>
                </div>
                <div className="recommendation-type">
                  {recommendation.type.replace('-', ' ').toUpperCase()}
                </div>
              </div>

              <div className="recommendation-content">
                <div className="recommendation-description">
                  {recommendation.description}
                </div>
                
                <div className="recommendation-details">
                  <div className="savings-info">
                    <span className="savings-label">Estimated Savings:</span>
                    <span className="savings-value">{formatSize(recommendation.estimatedSavings)}</span>
                  </div>
                  
                  {recommendation.module && (
                    <div className="module-info">
                      <span className="module-label">Module:</span>
                      <span className="module-name">{recommendation.module}</span>
                    </div>
                  )}
                  
                  {recommendation.chunks && recommendation.chunks.length > 0 && (
                    <div className="chunks-info">
                      <span className="chunks-label">Chunks:</span>
                      <div className="chunks-list">
                        {recommendation.chunks.map((chunk, idx) => (
                          <span key={idx} className="chunk-name">{chunk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="implementation-guide">
                  <div className="implementation-label">How to fix:</div>
                  <div className="implementation-text">{recommendation.implementation}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.recommendations.length === 0 && (
        <div className="empty-state">
          <CheckCircle size={48} color="var(--accent-secondary)" />
          <h3>No Issues Found</h3>
          <p>Your bundle appears to be well optimized!</p>
        </div>
      )}

      <style jsx>{`
        .recommendations-tab {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .recommendations-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
        }

        .header-stats {
          display: flex;
          gap: 20px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-label {
          color: var(--text-secondary);
          font-size: 10px;
        }

        .stat-value {
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
        }

        .stat-value.savings {
          color: var(--accent-secondary);
        }

        .refresh-btn {
          padding: 6px 12px;
          border: 1px solid var(--border-primary);
          background: var(--bg-primary);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 11px;
          cursor: pointer;
        }

        .refresh-btn:hover {
          background: var(--bg-hover);
        }

        .recommendations-list {
          flex: 1;
          overflow: auto;
          padding: 8px;
        }

        .recommendation-item {
          background: var(--bg-secondary);
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
          border-left: 4px solid;
        }

        .recommendation-item.severity-critical {
          border-left-color: #ea4335;
        }

        .recommendation-item.severity-high {
          border-left-color: #ff9800;
        }

        .recommendation-item.severity-medium {
          border-left-color: #fbbc04;
        }

        .recommendation-item.severity-low {
          border-left-color: #34a853;
        }

        .recommendation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .severity-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .severity-label {
          font-size: 10px;
          font-weight: 600;
        }

        .recommendation-type {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 500;
        }

        .recommendation-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-description {
          color: var(--text-primary);
          font-size: 12px;
          line-height: 1.4;
        }

        .recommendation-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .savings-info, .module-info, .chunks-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }

        .savings-label, .module-label, .chunks-label {
          color: var(--text-secondary);
          min-width: 80px;
        }

        .savings-value {
          color: var(--accent-secondary);
          font-weight: 600;
        }

        .module-name {
          color: var(--text-primary);
          font-weight: 500;
          font-family: monospace;
        }

        .chunks-list {
          display: flex;
          gap: 4px;
        }

        .chunk-name {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-family: monospace;
        }

        .implementation-guide {
          background: var(--bg-tertiary);
          border-radius: 4px;
          padding: 12px;
        }

        .implementation-label {
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .implementation-text {
          color: var(--text-secondary);
          font-size: 11px;
          line-height: 1.4;
          font-family: monospace;
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