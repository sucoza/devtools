import React from 'react';
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import type { BundleAnalyzerState } from '../../types';

interface SettingsTabProps {
  state: BundleAnalyzerState;
  eventClient: any;
}

export function SettingsTab({ state, eventClient }: SettingsTabProps) {
  const config = state.config;

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    eventClient.updateConfig({ [key]: value });
  };

  const handleThresholdChange = (key: keyof typeof config.thresholds, value: number) => {
    eventClient.updateConfig({
      thresholds: {
        ...config.thresholds,
        [key]: value
      }
    });
  };

  const formatSize = (bytes: number) => {
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="settings-tab">
      <div className="settings-section">
        <h3>Analysis Settings</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Enable Real-time Tracking</label>
            <p>Continuously monitor bundle changes during development</p>
          </div>
          <button 
            className="toggle-btn"
            onClick={() => handleConfigChange('enableRealTimeTracking', !config.enableRealTimeTracking)}
          >
            {config.enableRealTimeTracking ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Track Dynamic Imports</label>
            <p>Monitor dynamically imported modules and code splitting</p>
          </div>
          <button 
            className="toggle-btn"
            onClick={() => handleConfigChange('trackDynamicImports', !config.trackDynamicImports)}
          >
            {config.trackDynamicImports ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Analyze Tree Shaking</label>
            <p>Detect unused exports and tree-shaking opportunities</p>
          </div>
          <button 
            className="toggle-btn"
            onClick={() => handleConfigChange('analyzeTreeShaking', !config.analyzeTreeShaking)}
          >
            {config.analyzeTreeShaking ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Detect Duplicates</label>
            <p>Find duplicate modules across different chunks</p>
          </div>
          <button 
            className="toggle-btn"
            onClick={() => handleConfigChange('detectDuplicates', !config.detectDuplicates)}
          >
            {config.detectDuplicates ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>CDN Analysis</label>
            <p>Analyze opportunities to load modules from CDN</p>
          </div>
          <button 
            className="toggle-btn"
            onClick={() => handleConfigChange('cdnAnalysis', !config.cdnAnalysis)}
          >
            {config.cdnAnalysis ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Enable Visualization</label>
            <p>Show interactive bundle visualizations</p>
          </div>
          <button 
            className="toggle-btn"
            onClick={() => handleConfigChange('visualizationEnabled', !config.visualizationEnabled)}
          >
            {config.visualizationEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Analysis Thresholds</h3>
        
        <div className="threshold-item">
          <div className="threshold-info">
            <label>Large Module Size</label>
            <p>Modules larger than this size are flagged as large</p>
          </div>
          <div className="threshold-control">
            <input
              type="range"
              min="10240"
              max="1048576"
              step="10240"
              value={config.thresholds.largeModuleSize}
              onChange={(e) => handleThresholdChange('largeModuleSize', parseInt(e.target.value))}
              className="threshold-slider"
            />
            <span className="threshold-value">
              {formatSize(config.thresholds.largeModuleSize)}
            </span>
          </div>
        </div>

        <div className="threshold-item">
          <div className="threshold-info">
            <label>Critical Recommendation Threshold</label>
            <p>Size threshold for critical optimization recommendations</p>
          </div>
          <div className="threshold-control">
            <input
              type="range"
              min="102400"
              max="2097152"
              step="51200"
              value={config.thresholds.criticalRecommendationThreshold}
              onChange={(e) => handleThresholdChange('criticalRecommendationThreshold', parseInt(e.target.value))}
              className="threshold-slider"
            />
            <span className="threshold-value">
              {formatSize(config.thresholds.criticalRecommendationThreshold)}
            </span>
          </div>
        </div>

        <div className="threshold-item">
          <div className="threshold-info">
            <label>Tree-shaking Efficiency Threshold</label>
            <p>Minimum efficiency percentage before flagging issues</p>
          </div>
          <div className="threshold-control">
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={config.thresholds.treeShakingEfficiencyThreshold}
              onChange={(e) => handleThresholdChange('treeShakingEfficiencyThreshold', parseFloat(e.target.value))}
              className="threshold-slider"
            />
            <span className="threshold-value">
              {(config.thresholds.treeShakingEfficiencyThreshold * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Actions</h3>
        
        <div className="actions-grid">
          <button 
            className="action-btn"
            onClick={() => eventClient.startAnalysis()}
          >
            Run Full Analysis
          </button>
          
          <button 
            className="action-btn"
            onClick={() => eventClient.generateSampleData()}
          >
            Generate Sample Data
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => {
              // Reset to defaults
              eventClient.updateConfig({
                enableRealTimeTracking: true,
                trackDynamicImports: true,
                analyzeTreeShaking: true,
                detectDuplicates: true,
                cdnAnalysis: false,
                visualizationEnabled: true,
                thresholds: {
                  largeModuleSize: 100 * 1024,
                  criticalRecommendationThreshold: 500 * 1024,
                  treeShakingEfficiencyThreshold: 0.8,
                },
              });
            }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <style>{`
        .settings-tab {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          overflow: auto;
        }

        .settings-section {
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 16px;
        }

        .settings-section h3 {
          margin: 0 0 16px 0;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-primary);
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-info {
          flex: 1;
        }

        .setting-info label {
          display: block;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .setting-info p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 11px;
          line-height: 1.4;
        }

        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--accent-primary);
          padding: 0;
          margin-left: 16px;
        }

        .toggle-btn:hover {
          color: var(--accent-secondary);
        }

        .threshold-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-primary);
        }

        .threshold-item:last-child {
          border-bottom: none;
        }

        .threshold-info {
          flex: 1;
        }

        .threshold-info label {
          display: block;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .threshold-info p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 11px;
          line-height: 1.4;
        }

        .threshold-control {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: 16px;
        }

        .threshold-slider {
          width: 120px;
        }

        .threshold-value {
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 600;
          min-width: 50px;
          text-align: right;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .action-btn {
          padding: 10px 16px;
          border: 1px solid var(--border-primary);
          background: var(--accent-primary);
          color: white;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }

        .action-btn:hover {
          background: var(--accent-secondary);
        }

        .action-btn.secondary {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .action-btn.secondary:hover {
          background: var(--bg-hover);
        }
      `}</style>
    </div>
  );
}