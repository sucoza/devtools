import React, { useState, useMemo } from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient, FeatureFlag, FilterOptions, SortOptions } from '../types';
import { FlagListItem } from './FlagListItem';
import { FlagDetailsPanel } from './FlagDetailsPanel';
import { filterFlags, sortFlags, getUniqueTagsFromFlags, getUniqueEnvironmentsFromFlags } from '../utils';

interface FlagsTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
  onToggleFlag: (flagId: string, enabled: boolean) => void;
}

export const FlagsTab: React.FC<FlagsTabProps> = ({
  state,
  client,
  onToggleFlag
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    text: '',
    environment: 'all',
    status: 'all',
    tags: [],
    flagType: 'all'
  });
  
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'name',
    direction: 'asc'
  });

  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const flags = Array.from(state.flags.values());
  const uniqueTags = getUniqueTagsFromFlags(flags);
  const uniqueEnvironments = getUniqueEnvironmentsFromFlags(flags);

  const filteredAndSortedFlags = useMemo(() => {
    const filtered = filterFlags(flags, filters);
    return sortFlags(filtered, sortOptions);
  }, [flags, filters, sortOptions]);

  const selectedFlag = selectedFlagId ? state.flags.get(selectedFlagId) : null;

  const handleOverride = async (flagId: string, value: any, variant?: string) => {
    try {
      await client.setOverride({
        flagId,
        value,
        variant,
        reason: 'Manual override from DevTools',
        userId: state.currentContext.userId
      });
    } catch (error) {
      console.error('Failed to set override:', error);
    }
  };

  const handleRemoveOverride = async (flagId: string) => {
    try {
      await client.removeOverride(flagId);
    } catch (error) {
      console.error('Failed to remove override:', error);
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (field: keyof FeatureFlag) => {
    setSortOptions(prev => ({
      field: field as SortOptions['field'],
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      text: '',
      environment: 'all',
      status: 'all',
      tags: [],
      flagType: 'all'
    });
  };

  return (
    <div className="flags-tab">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search flags..."
            value={filters.text}
            onChange={(e) => handleFilterChange({ text: e.target.value })}
            className="search-input"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-button ${showFilters ? 'active' : ''}`}
          >
            Filters
          </button>
        </div>

        <div className="actions-section">
          <div className="results-count">
            {filteredAndSortedFlags.length} of {flags.length} flags
          </div>
          
          <select
            value={`${sortOptions.field}-${sortOptions.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortOptions({ field: field as SortOptions['field'], direction: direction as 'asc' | 'desc' });
            }}
            className="sort-select"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="updatedAt-desc">Recently Updated</option>
            <option value="updatedAt-asc">Oldest Updated</option>
            <option value="type-asc">Type A-Z</option>
            <option value="environment-asc">Environment A-Z</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Environment:</label>
              <select
                value={filters.environment}
                onChange={(e) => handleFilterChange({ environment: e.target.value })}
              >
                <option value="all">All Environments</option>
                {uniqueEnvironments.map(env => (
                  <option key={env} value={env}>{env}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Status:</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange({ status: e.target.value as any })}
              >
                <option value="all">All Status</option>
                <option value="enabled">Enabled Only</option>
                <option value="disabled">Disabled Only</option>
                <option value="overridden">Overridden Only</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Type:</label>
              <select
                value={filters.flagType}
                onChange={(e) => handleFilterChange({ flagType: e.target.value as any })}
              >
                <option value="all">All Types</option>
                <option value="boolean">Boolean</option>
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="json">JSON</option>
                <option value="multivariate">Multivariate</option>
              </select>
            </div>

            <div className="filter-actions">
              <button onClick={clearFilters} className="clear-filters">
                Clear All
              </button>
            </div>
          </div>

          {/* Tags Filter */}
          {uniqueTags.length > 0 && (
            <div className="filter-row">
              <label>Tags:</label>
              <div className="tags-filter">
                {uniqueTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newTags = filters.tags.includes(tag)
                        ? filters.tags.filter(t => t !== tag)
                        : [...filters.tags, tag];
                      handleFilterChange({ tags: newTags });
                    }}
                    className={`tag-filter ${filters.tags.includes(tag) ? 'active' : ''}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flags-content">
        {/* Flags List */}
        <div className="flags-list">
          {filteredAndSortedFlags.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏁</div>
              <h3>No flags found</h3>
              <p>
                {flags.length === 0
                  ? "No feature flags are currently loaded."
                  : "No flags match your current filters."
                }
              </p>
              {filters.text || filters.environment !== 'all' || filters.status !== 'all' || filters.tags.length > 0 ? (
                <button onClick={clearFilters} className="clear-filters-button">
                  Clear Filters
                </button>
              ) : null}
            </div>
          ) : (
            filteredAndSortedFlags.map(flag => (
              <FlagListItem
                key={flag.id}
                flag={flag}
                override={state.overrides.get(flag.id)}
                evaluation={state.evaluationHistory.find(e => e.flagId === flag.id)}
                onToggle={onToggleFlag}
                onOverride={handleOverride}
                onRemoveOverride={handleRemoveOverride}
                onSelect={setSelectedFlagId}
                isSelected={selectedFlagId === flag.id}
              />
            ))
          )}
        </div>

        {/* Flag Details Panel */}
        {selectedFlag && (
          <div className="flag-details">
            <FlagDetailsPanel
              flag={selectedFlag}
              override={state.overrides.get(selectedFlag.id)}
              evaluation={state.evaluationHistory.find(e => e.flagId === selectedFlag.id)}
              context={state.currentContext}
              client={client}
              onClose={() => setSelectedFlagId(null)}
              onOverride={handleOverride}
              onRemoveOverride={handleRemoveOverride}
            />
          </div>
        )}
      </div>

      <style>{`
        .flags-tab {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: #fafafa;
        }
        
        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background-color: white;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .search-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .search-input {
          width: 300px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .filter-button {
          padding: 8px 16px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .filter-button:hover {
          background-color: #e5e7eb;
        }
        
        .filter-button.active {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .actions-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .results-count {
          font-size: 14px;
          color: #6b7280;
        }
        
        .sort-select {
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          background-color: white;
        }
        
        .filters-panel {
          padding: 16px;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .filter-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }
        
        .filter-row:last-child {
          margin-bottom: 0;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .filter-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          white-space: nowrap;
        }
        
        .filter-group select {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          background-color: white;
        }
        
        .filter-actions {
          margin-left: auto;
        }
        
        .clear-filters {
          padding: 6px 12px;
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .tags-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .tag-filter {
          padding: 4px 8px;
          background-color: white;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .tag-filter:hover {
          background-color: #f3f4f6;
        }
        
        .tag-filter.active {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .flags-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .flags-list {
          flex: ${selectedFlag ? '0 0 400px' : '1'};
          overflow-y: auto;
          background-color: white;
          border-right: ${selectedFlag ? '1px solid #e5e7eb' : 'none'};
        }
        
        .flag-details {
          flex: 1;
          overflow-y: auto;
          background-color: white;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          text-align: center;
          color: #6b7280;
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #374151;
        }
        
        .empty-state p {
          margin: 0 0 16px 0;
          max-width: 400px;
        }
        
        .clear-filters-button {
          padding: 8px 16px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        
        /* Dark theme */
        :global(.dark) .flags-tab {
          background-color: #1f2937;
        }
        
        :global(.dark) .toolbar {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .search-input {
          background-color: #4b5563;
          border-color: #6b7280;
          color: #f9fafb;
        }
        
        :global(.dark) .filter-button {
          background-color: #4b5563;
          border-color: #6b7280;
          color: #f9fafb;
        }
        
        :global(.dark) .filters-panel {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .flags-list {
          background-color: #1f2937;
          border-color: #374151;
        }
        
        :global(.dark) .empty-state h3 {
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};