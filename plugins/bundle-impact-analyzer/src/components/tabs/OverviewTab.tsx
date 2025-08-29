import React from 'react';
import { 
  Package, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap
} from 'lucide-react';
import type { BundleAnalyzerState } from '../../types';

interface OverviewTabProps {
  state: BundleAnalyzerState;
  eventClient: any;
}

export function OverviewTab({ state, eventClient }: OverviewTabProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Calculate compression ratio
  const compressionRatio = state.stats.totalSize > 0 
    ? (1 - state.stats.totalGzipSize / state.stats.totalSize) * 100
    : 0;

  // Get top modules by size
  const topModules = state.modules
    .slice()
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);

  // Get critical recommendations
  const criticalRecommendations = state.recommendations
    .filter(r => r.severity === 'critical')
    .slice(0, 3);

  // Calculate overall health score
  const getHealthScore = () => {
    let score = 100;
    
    // Deduct for large bundle size (>500KB)
    if (state.stats.totalSize > 500 * 1024) {
      score -= 20;
    } else if (state.stats.totalSize > 250 * 1024) {
      score -= 10;
    }
    
    // Deduct for poor tree-shaking
    if (state.stats.treeShakingEfficiency < 0.8) {
      score -= 15;
    }
    
    // Deduct for critical recommendations
    score -= criticalRecommendations.length * 10;
    
    // Deduct for unused code
    if (state.stats.unusedCodeSize > 50 * 1024) {
      score -= 15;
    }
    
    return Math.max(0, score);
  };

  const healthScore = getHealthScore();
  const getHealthColor = (score: number) => {
    if (score >= 80) return '#34a853';
    if (score >= 60) return '#fbbc04';
    return '#ea4335';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return TrendingDown;
  };

  const HealthIcon = getHealthIcon(healthScore);

  return (
    <div className="overview-tab">
      {/* Health Score */}
      <div className="health-section">
        <div className="health-score">
          <div className="score-circle" style={{ borderColor: getHealthColor(healthScore) }}>
            <HealthIcon size={24} color={getHealthColor(healthScore)} />
            <span className="score-value" style={{ color: getHealthColor(healthScore) }}>
              {healthScore}
            </span>
          </div>
          <div className="score-info">
            <h3>Bundle Health Score</h3>
            <p className="score-description">
              {healthScore >= 80 && 'Excellent! Your bundle is well optimized.'}
              {healthScore >= 60 && healthScore < 80 && 'Good, but there\'s room for improvement.'}
              {healthScore < 60 && 'Needs attention. Consider optimization.'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <Package size={16} />
            <span>Total Bundle Size</span>
          </div>
          <div className="metric-value">
            {formatSize(state.stats.totalSize)}
          </div>
          <div className="metric-secondary">
            {formatSize(state.stats.totalGzipSize)} gzipped
            <span className="compression-ratio">
              ({compressionRatio.toFixed(1)}% compression)
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <FileText size={16} />
            <span>Modules</span>
          </div>
          <div className="metric-value">
            {state.stats.moduleCount}
          </div>
          <div className="metric-secondary">
            {state.chunks.length} chunks
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <Activity size={16} />
            <span>Tree Shaking</span>
          </div>
          <div className="metric-value">
            {formatPercent(state.stats.treeShakingEfficiency)}
          </div>
          <div className="metric-secondary">
            {formatSize(state.stats.unusedCodeSize)} unused
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <AlertTriangle size={16} />
            <span>Issues Found</span>
          </div>
          <div className="metric-value">
            {state.recommendations.length}
          </div>
          <div className="metric-secondary">
            {criticalRecommendations.length} critical
          </div>
        </div>
      </div>

      {/* Top Modules */}
      {topModules.length > 0 && (
        <div className="section">
          <h3 className="section-title">Largest Modules</h3>
          <div className="module-list">
            {topModules.map((module, index) => (
              <div key={module.id} className="module-item">
                <div className="module-rank">{index + 1}</div>
                <div className="module-info">
                  <div className="module-name">{module.name}</div>
                  <div className="module-path">{module.path}</div>
                </div>
                <div className="module-size">
                  <div className="size-primary">{formatSize(module.size)}</div>
                  {module.gzipSize && (
                    <div className="size-secondary">
                      {formatSize(module.gzipSize)} gz
                    </div>
                  )}
                </div>
                <div className="module-actions">
                  <button
                    onClick={() => eventClient.selectModule(module.id)}
                    className="action-btn"
                    title="View Details"
                  >
                    <Activity size={12} />
                  </button>
                  {module.isDynamic && (
                    <span className="dynamic-badge" title="Dynamically Imported">
                      <Zap size={12} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Recommendations */}
      {criticalRecommendations.length > 0 && (
        <div className="section">
          <h3 className="section-title">Critical Issues</h3>
          <div className="recommendations-list">
            {criticalRecommendations.map((rec, index) => (
              <div key={index} className={`recommendation-item severity-${rec.severity}`}>
                <div className="recommendation-icon">
                  <AlertTriangle size={16} />
                </div>
                <div className="recommendation-content">
                  <div className="recommendation-title">{rec.description}</div>
                  <div className="recommendation-savings">
                    Potential savings: {formatSize(rec.estimatedSavings)}
                  </div>
                  <div className="recommendation-implementation">
                    {rec.implementation}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {state.recommendations.length > 3 && (
            <button 
              className="view-all-btn"
              onClick={() => eventClient.selectTab?.('recommendations')}
            >
              View all {state.recommendations.length} recommendations
            </button>
          )}
        </div>
      )}

      {/* Build Information */}
      {state.buildInfo && (
        <div className="section">
          <h3 className="section-title">Build Information</h3>
          <div className="build-info">
            <div className="build-detail">
              <span className="build-label">Build Tool:</span>
              <span className="build-value">{state.buildInfo.buildTool}</span>
            </div>
            <div className="build-detail">
              <span className="build-label">Environment:</span>
              <span className="build-value">{state.buildInfo.environment}</span>
            </div>
            <div className="build-detail">
              <span className="build-label">Optimizations:</span>
              <div className="optimization-badges">
                {state.buildInfo.optimization.minimize && (
                  <span className="opt-badge enabled">Minification</span>
                )}
                {state.buildInfo.optimization.treeShaking && (
                  <span className="opt-badge enabled">Tree Shaking</span>
                )}
                {state.buildInfo.optimization.splitChunks && (
                  <span className="opt-badge enabled">Code Splitting</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Analysis */}
      {state.lastAnalysisTime && (
        <div className="section">
          <div className="analysis-info">
            <span className="analysis-label">Last analyzed:</span>
            <span className="analysis-time">
              {new Date(state.lastAnalysisTime).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <style>{`
        .overview-tab {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .health-section {
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 20px;
        }

        .health-score {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .score-circle {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border: 3px solid;
          border-radius: 50%;
          gap: 4px;
        }

        .score-value {
          font-weight: bold;
          font-size: 16px;
        }

        .score-info h3 {
          margin: 0 0 4px 0;
          color: var(--text-primary);
          font-size: 16px;
        }

        .score-description {
          margin: 0;
          color: var(--text-secondary);
          font-size: 12px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .metric-card {
          background: var(--bg-secondary);
          border-radius: 6px;
          padding: 12px;
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 11px;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .metric-secondary {
          font-size: 10px;
          color: var(--text-secondary);
        }

        .compression-ratio {
          margin-left: 4px;
        }

        .section {
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 16px;
        }

        .section-title {
          margin: 0 0 12px 0;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
        }

        .module-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .module-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
        }

        .module-rank {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--accent-primary);
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .module-info {
          flex: 1;
          min-width: 0;
        }

        .module-name {
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .module-path {
          color: var(--text-secondary);
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .module-size {
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

        .module-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: 1px solid var(--border-primary);
          background: var(--bg-primary);
          border-radius: 3px;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .action-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .dynamic-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: var(--accent-secondary);
          border-radius: 3px;
          color: white;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .recommendation-item {
          display: flex;
          gap: 10px;
          padding: 10px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          border-left: 3px solid var(--accent-primary);
        }

        .recommendation-item.severity-critical {
          border-left-color: #ea4335;
        }

        .recommendation-icon {
          color: var(--text-secondary);
        }

        .recommendation-content {
          flex: 1;
        }

        .recommendation-title {
          color: var(--text-primary);
          font-size: 12px;
          margin-bottom: 4px;
        }

        .recommendation-savings {
          color: var(--accent-secondary);
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .recommendation-implementation {
          color: var(--text-secondary);
          font-size: 10px;
        }

        .view-all-btn {
          margin-top: 8px;
          padding: 6px 12px;
          border: 1px solid var(--border-primary);
          background: var(--bg-primary);
          border-radius: 4px;
          color: var(--accent-primary);
          font-size: 11px;
          cursor: pointer;
        }

        .view-all-btn:hover {
          background: var(--bg-hover);
        }

        .build-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .build-detail {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .build-label {
          color: var(--text-secondary);
          font-size: 11px;
          min-width: 80px;
        }

        .build-value {
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 500;
        }

        .optimization-badges {
          display: flex;
          gap: 4px;
        }

        .opt-badge {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 500;
        }

        .opt-badge.enabled {
          background: var(--accent-secondary);
          color: white;
        }

        .analysis-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
        }

        .analysis-label {
          color: var(--text-secondary);
          font-size: 11px;
        }

        .analysis-time {
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}