import React from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient, Experiment } from '../types';

interface ExperimentsTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
}

export const ExperimentsTab: React.FC<ExperimentsTabProps> = ({
  state,
  client
}) => {
  const experiments = state.experiments;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#10b981';
      case 'paused': return '#f59e0b';
      case 'completed': return '#6b7280';
      case 'draft': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const calculateConversionRate = (conversions: number, exposures: number) => {
    if (exposures === 0) return 0;
    return ((conversions / exposures) * 100).toFixed(2);
  };

  const getSignificanceLevel = (significance?: number) => {
    if (!significance) return 'No data';
    if (significance >= 0.95) return 'High';
    if (significance >= 0.80) return 'Medium';
    return 'Low';
  };

  if (experiments.length === 0) {
    return (
      <div className="experiments-tab">
        <div className="empty-state">
          <div className="empty-icon">🧪</div>
          <h3>No Experiments</h3>
          <p>
            A/B tests and experiments will appear here when they are configured.
            Experiments help you measure the impact of feature flag changes.
          </p>
        </div>

        <style>{`
          .experiments-tab {
            padding: 32px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .empty-state {
            text-align: center;
            max-width: 400px;
            color: #6b7280;
          }
          
          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          
          .empty-state h3 {
            margin: 0 0 12px 0;
            font-size: 20px;
            color: #374151;
          }
          
          .empty-state p {
            line-height: 1.5;
          }
          
          /* Dark theme */
          :global(.dark) .empty-state h3 {
            color: #f3f4f6;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="experiments-tab">
      {/* Header */}
      <div className="tab-header">
        <h3>Experiments & A/B Tests ({experiments.length})</h3>
        <p>Monitor and analyze your feature flag experiments</p>
      </div>

      {/* Experiments List */}
      <div className="experiments-list">
        {experiments.map((experiment) => {
          const flag = state.flags.get(experiment.flagId);
          const totalExposures = experiment.variants.reduce((sum, v) => sum + v.exposures, 0);
          const totalConversions = experiment.variants.reduce((sum, v) => sum + v.conversions, 0);
          const overallConversionRate = calculateConversionRate(totalConversions, totalExposures);

          return (
            <div key={experiment.id} className="experiment-card">
              {/* Experiment Header */}
              <div className="experiment-header">
                <div className="experiment-info">
                  <h4 className="experiment-name">{experiment.name}</h4>
                  <div className="experiment-meta">
                    <span className="experiment-id">ID: {experiment.id}</span>
                    <span>•</span>
                    <span>Flag: {flag?.name || experiment.flagId}</span>
                  </div>
                  {experiment.description && (
                    <p className="experiment-description">{experiment.description}</p>
                  )}
                </div>
                
                <div className="experiment-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(experiment.status), color: 'white' }}
                  >
                    {experiment.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Experiment Stats */}
              <div className="experiment-stats">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">Total Exposures</div>
                    <div className="stat-value">{totalExposures.toLocaleString()}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Total Conversions</div>
                    <div className="stat-value">{totalConversions.toLocaleString()}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Conversion Rate</div>
                    <div className="stat-value">{overallConversionRate}%</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Duration</div>
                    <div className="stat-value">
                      {experiment.startDate && experiment.endDate 
                        ? Math.ceil((new Date(experiment.endDate).getTime() - new Date(experiment.startDate).getTime()) / (1000 * 60 * 60 * 24)) + ' days'
                        : 'Ongoing'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Variants Performance */}
              <div className="variants-section">
                <h5>Variant Performance</h5>
                <div className="variants-grid">
                  {experiment.variants.map((variant) => {
                    const conversionRate = calculateConversionRate(variant.conversions, variant.exposures);
                    const isWinning = variant.conversions / variant.exposures === 
                      Math.max(...experiment.variants.map(v => v.conversions / v.exposures));
                    
                    return (
                      <div 
                        key={variant.id} 
                        className={`variant-card ${isWinning ? 'winning' : ''}`}
                      >
                        <div className="variant-header">
                          <span className="variant-name">{variant.name}</span>
                          {isWinning && <span className="winner-badge">🏆</span>}
                        </div>
                        
                        <div className="variant-stats">
                          <div className="variant-metric">
                            <span className="metric-label">Allocation</span>
                            <span className="metric-value">{variant.allocation}%</span>
                          </div>
                          <div className="variant-metric">
                            <span className="metric-label">Exposures</span>
                            <span className="metric-value">{variant.exposures.toLocaleString()}</span>
                          </div>
                          <div className="variant-metric">
                            <span className="metric-label">Conversions</span>
                            <span className="metric-value">{variant.conversions.toLocaleString()}</span>
                          </div>
                          <div className="variant-metric">
                            <span className="metric-label">Conv. Rate</span>
                            <span className="metric-value">{conversionRate}%</span>
                          </div>
                        </div>

                        {/* Conversion Rate Bar */}
                        <div className="conversion-bar">
                          <div 
                            className="conversion-fill"
                            style={{ 
                              width: `${Math.min(parseFloat(String(conversionRate)) * 2, 100)}%`,
                              backgroundColor: isWinning ? '#10b981' : '#6b7280'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Experiment Metrics */}
              {experiment.metrics && experiment.metrics.length > 0 && (
                <div className="metrics-section">
                  <h5>Key Metrics</h5>
                  <div className="metrics-grid">
                    {experiment.metrics.map((metric) => (
                      <div key={metric.id} className="metric-card">
                        <div className="metric-header">
                          <span className="metric-name">{metric.name}</span>
                          <span className="metric-type">{metric.type}</span>
                        </div>
                        <div className="metric-value-large">
                          {metric.type === 'conversion' ? `${(metric.value * 100).toFixed(2)}%` : metric.value.toLocaleString()}
                        </div>
                        {metric.significance && (
                          <div className="metric-significance">
                            <span className="significance-label">Significance:</span>
                            <span className={`significance-value ${getSignificanceLevel(metric.significance).toLowerCase()}`}>
                              {getSignificanceLevel(metric.significance)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experiment Dates */}
              <div className="experiment-dates">
                {experiment.startDate && (
                  <span>Started: {new Date(experiment.startDate).toLocaleDateString()}</span>
                )}
                {experiment.endDate && (
                  <span>Ended: {new Date(experiment.endDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .experiments-tab {
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: #fafafa;
        }
        
        .tab-header {
          padding: 16px;
          background-color: white;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .tab-header h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        
        .tab-header p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }
        
        .experiments-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .experiment-card {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .experiment-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        
        .experiment-info {
          flex: 1;
        }
        
        .experiment-name {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .experiment-meta {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        
        .experiment-id {
          font-family: monospace;
        }
        
        .experiment-description {
          margin: 0;
          font-size: 14px;
          color: #4b5563;
          line-height: 1.4;
        }
        
        .experiment-status {
          flex-shrink: 0;
        }
        
        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .experiment-stats {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .variants-section {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .variants-section h5 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .variants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        
        .variant-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background-color: #fafafa;
        }
        
        .variant-card.winning {
          border-color: #10b981;
          background-color: #f0fdf4;
        }
        
        .variant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .variant-name {
          font-weight: 600;
          color: #1f2937;
        }
        
        .winner-badge {
          font-size: 16px;
        }
        
        .variant-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .variant-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .metric-label {
          font-size: 12px;
          color: #6b7280;
        }
        
        .metric-value {
          font-weight: 600;
          color: #1f2937;
        }
        
        .conversion-bar {
          height: 4px;
          background-color: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .conversion-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .metrics-section {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .metrics-section h5 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .metric-card {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: #fafafa;
        }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .metric-name {
          font-weight: 600;
          color: #1f2937;
        }
        
        .metric-type {
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
          background-color: #e5e7eb;
          padding: 2px 6px;
          border-radius: 10px;
        }
        
        .metric-value-large {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .metric-significance {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .significance-label {
          font-size: 12px;
          color: #6b7280;
        }
        
        .significance-value {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px;
        }
        
        .significance-value.high {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .significance-value.medium {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .significance-value.low {
          background-color: #fee2e2;
          color: #991b1b;
        }
        
        .experiment-dates {
          padding: 16px 20px;
          background-color: #f9fafb;
          border-top: 1px solid #f3f4f6;
          display: flex;
          gap: 24px;
          font-size: 12px;
          color: #6b7280;
        }
        
        /* Dark theme */
        :global(.dark) .experiments-tab {
          background-color: #1f2937;
        }
        
        :global(.dark) .tab-header {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .tab-header h3 {
          color: #f3f4f6;
        }
        
        :global(.dark) .experiment-card {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .experiment-header {
          background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        }
        
        :global(.dark) .experiment-name {
          color: #f3f4f6;
        }
        
        :global(.dark) .stat-value {
          color: #f3f4f6;
        }
        
        :global(.dark) .variant-card {
          background-color: #4b5563;
          border-color: #6b7280;
        }
        
        :global(.dark) .variant-card.winning {
          background-color: #064e3b;
          border-color: #10b981;
        }
        
        :global(.dark) .variant-name {
          color: #f3f4f6;
        }
        
        :global(.dark) .metric-value {
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};