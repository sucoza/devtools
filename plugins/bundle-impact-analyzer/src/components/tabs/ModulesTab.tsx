import React from 'react';
import { 
  Package, 
  FileText, 
  Activity,
  TreePine,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';
import type { BundleAnalyzerState, BundleModule } from '../../types';

interface ModulesTabProps {
  state: BundleAnalyzerState;
  eventClient: any;
}

export function ModulesTab({ state, eventClient }: ModulesTabProps) {
  const filteredModules = eventClient.getFilteredModules();

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getModuleTypeIcon = (module: BundleModule) => {
    if (module.isDynamic) return Zap;
    if (module.isTreeShakeable) return TreePine;
    return Package;
  };

  const getUnusedExportsPercentage = (module: BundleModule) => {
    if (!module.unusedExports || module.exports.length === 0) return 0;
    return (module.unusedExports.length / module.exports.length) * 100;
  };

  const handleModuleClick = (module: BundleModule) => {
    eventClient.selectModule(module.id === state.selectedModule ? null : module.id);
  };

  const handleAnalyzeImport = (module: BundleModule) => {
    eventClient.analyzeImport(module.path);
  };

  return (
    <div className="modules-tab">
      <div className="modules-header">
        <div className="modules-stats">
          <span className="stat">
            {filteredModules.length} of {state.modules.length} modules
          </span>
          <span className="stat">
            Total: {formatSize(filteredModules.reduce((sum, m) => sum + m.size, 0))}
          </span>
        </div>
        
        <div className="sort-controls">
          <select 
            defaultValue="size-desc"
            className="sort-select"
          >
            <option value="size-desc">Size (Largest)</option>
            <option value="size-asc">Size (Smallest)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="unused-desc">Most Unused</option>
          </select>
        </div>
      </div>

      <div className="modules-list">
        {filteredModules.map((module) => {
          const ModuleIcon = getModuleTypeIcon(module);
          const unusedPercentage = getUnusedExportsPercentage(module);
          const isSelected = state.selectedModule === module.id;
          
          return (
            <div key={module.id} className="module-item-container">
              <div 
                className={`module-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleModuleClick(module)}
              >
                <div className="module-icon">
                  <ModuleIcon size={16} />
                </div>
                
                <div className="module-info">
                  <div className="module-name">
                    {module.name}
                    {module.isDynamic && (
                      <span className="dynamic-badge" title="Dynamic Import">
                        <Zap size={12} />
                      </span>
                    )}
                  </div>
                  <div className="module-path">{module.path}</div>
                </div>

                <div className="module-metrics">
                  <div className="size-info">
                    <div className="size-primary">{formatSize(module.size)}</div>
                    {module.gzipSize && (
                      <div className="size-secondary">
                        {formatSize(module.gzipSize)} gz
                      </div>
                    )}
                  </div>
                  
                  {module.exports.length > 0 && (
                    <div className="exports-info">
                      <div className="exports-count">
                        {module.exports.length} exports
                      </div>
                      {unusedPercentage > 0 && (
                        <div className="unused-exports">
                          {unusedPercentage.toFixed(0)}% unused
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="module-indicators">
                  {module.isTreeShakeable ? (
                    <span title="Tree-shakeable"><CheckCircle size={14} color="#34a853" /></span>
                  ) : (
                    <span title="Not tree-shakeable"><AlertTriangle size={14} color="#fbbc04" /></span>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAnalyzeImport(module);
                    }}
                    className="analyze-btn"
                    title="Analyze Import Impact"
                  >
                    <Activity size={12} />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isSelected && (
                <div className="module-details">
                  <div className="details-grid">
                    <div className="detail-section">
                      <h4>Basic Info</h4>
                      <div className="detail-item">
                        <span>Path:</span>
                        <span className="detail-value">{module.path}</span>
                      </div>
                      <div className="detail-item">
                        <span>Size:</span>
                        <span className="detail-value">
                          {formatSize(module.size)}
                          {module.gzipSize && ` (${formatSize(module.gzipSize)} gzipped)`}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span>Chunk:</span>
                        <span className="detail-value">{module.chunk || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span>Tree-shakeable:</span>
                        <span className="detail-value">
                          {module.isTreeShakeable ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    {module.exports.length > 0 && (
                      <div className="detail-section">
                        <h4>Exports</h4>
                        <div className="exports-list">
                          {module.exports.map((exportName) => (
                            <span
                              key={exportName}
                              className={`export-item ${
                                module.unusedExports?.includes(exportName) ? 'unused' : 'used'
                              }`}
                            >
                              {exportName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {module.imports.length > 0 && (
                      <div className="detail-section">
                        <h4>Imports</h4>
                        <div className="imports-list">
                          {module.imports.map((importName, idx) => (
                            <span key={idx} className="import-item">
                              {importName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {module.reasons && module.reasons.length > 0 && (
                      <div className="detail-section">
                        <h4>Import Reasons</h4>
                        <div className="reasons-list">
                          {module.reasons.map((reason, idx) => (
                            <div key={idx} className="reason-item">
                              <span className="reason-type">{reason.type}</span>
                              <span className="reason-module">{reason.module}</span>
                              {reason.explanation && (
                                <span className="reason-explanation">{reason.explanation}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="detail-actions">
                    <button
                      onClick={() => handleAnalyzeImport(module)}
                      className="detail-action-btn"
                    >
                      <Activity size={14} />
                      Analyze Import Impact
                    </button>
                    <button
                      className="detail-action-btn"
                      onClick={() => navigator.clipboard.writeText(module.path)}
                    >
                      <FileText size={14} />
                      Copy Path
                    </button>
                    <button
                      className="detail-action-btn"
                      onClick={() => window.open(module.path, '_blank')}
                    >
                      <ExternalLink size={14} />
                      View Source
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="empty-state">
          <Package size={48} color="var(--text-secondary)" />
          <h3>No modules found</h3>
          <p>Try adjusting your filters or start a bundle analysis.</p>
        </div>
      )}

      <style>{`
        .modules-tab {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .modules-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
        }

        .modules-stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          color: var(--text-secondary);
          font-size: 11px;
        }

        .sort-select {
          padding: 4px 8px;
          border: 1px solid var(--border-primary);
          border-radius: 4px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 11px;
        }

        .modules-list {
          flex: 1;
          overflow: auto;
          padding: 8px;
        }

        .module-item-container {
          margin-bottom: 8px;
        }

        .module-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .module-item:hover {
          background: var(--bg-hover);
        }

        .module-item.selected {
          border: 1px solid var(--accent-primary);
          background: var(--bg-hover);
        }

        .module-icon {
          color: var(--text-secondary);
        }

        .module-info {
          flex: 1;
          min-width: 0;
        }

        .module-name {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .module-path {
          color: var(--text-secondary);
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dynamic-badge {
          display: flex;
          align-items: center;
          background: var(--accent-secondary);
          color: white;
          border-radius: 3px;
          padding: 2px 4px;
        }

        .module-metrics {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .size-info {
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

        .exports-info {
          text-align: right;
        }

        .exports-count {
          color: var(--text-secondary);
          font-size: 10px;
        }

        .unused-exports {
          color: #ea4335;
          font-size: 10px;
          font-weight: 500;
        }

        .module-indicators {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .analyze-btn {
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

        .analyze-btn:hover {
          background: var(--bg-hover);
          color: var(--accent-primary);
        }

        .module-details {
          background: var(--bg-tertiary);
          border-radius: 6px;
          padding: 16px;
          margin-top: 8px;
          border-left: 3px solid var(--accent-primary);
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .detail-section h4 {
          margin: 0 0 8px 0;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 11px;
        }

        .detail-item span:first-child {
          color: var(--text-secondary);
        }

        .detail-value {
          color: var(--text-primary);
          font-weight: 500;
        }

        .exports-list, .imports-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .export-item, .import-item {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
        }

        .export-item.used {
          background: var(--accent-secondary);
          color: white;
        }

        .export-item.unused {
          background: #ea4335;
          color: white;
        }

        .import-item {
          background: var(--bg-primary);
          color: var(--text-secondary);
          border: 1px solid var(--border-primary);
        }

        .reasons-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .reason-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
        }

        .reason-type {
          background: var(--accent-primary);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 500;
        }

        .reason-module {
          color: var(--text-primary);
          font-weight: 500;
        }

        .reason-explanation {
          color: var(--text-secondary);
          font-style: italic;
        }

        .detail-actions {
          display: flex;
          gap: 8px;
        }

        .detail-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid var(--border-primary);
          background: var(--bg-primary);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 11px;
          cursor: pointer;
        }

        .detail-action-btn:hover {
          background: var(--bg-hover);
          color: var(--accent-primary);
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