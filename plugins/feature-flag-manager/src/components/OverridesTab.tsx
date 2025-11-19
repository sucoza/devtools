import React, { useMemo } from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient } from '../types';
import { getDisplayValue, formatDate } from '../utils';

interface OverridesTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
}

export const OverridesTab: React.FC<OverridesTabProps> = ({
  state,
  client
}) => {
  const overrides = useMemo(() => {
    return Array.from(state.overrides.values()).map(override => {
      const flag = state.flags.get(override.flagId);
      return {
        override,
        flag
      };
    });
  }, [state.overrides, state.flags]);

  const handleRemoveOverride = async (flagId: string) => {
    try {
      await client.removeOverride(flagId);
    } catch (error) {
      console.error('Failed to remove override:', error);
    }
  };

  const handleClearAllOverrides = async () => {
    if (confirm('Are you sure you want to clear all overrides?')) {
      try {
        await client.clearAllOverrides();
      } catch (error) {
        console.error('Failed to clear all overrides:', error);
      }
    }
  };

  if (overrides.length === 0) {
    return (
      <div className="overrides-tab">
        <div className="empty-state">
          <div className="empty-icon">⚙️</div>
          <h3>No Active Overrides</h3>
          <p>
            Override values will appear here when you modify flag values during development.
            Overrides help you test different flag states without affecting the actual configuration.
          </p>
        </div>

        <style>{`
          .overrides-tab {
            padding: 32px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .empty-state {
            text-align: center;
            max-width: 400px;
            color: var(--dt-text-secondary);
          }
          
          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          
          .empty-state h3 {
            margin: 0 0 12px 0;
            font-size: 20px;
            color: var(--dt-text-primary);
          }
          
          .empty-state p {
            line-height: 1.5;
          }

      `}</style>
    </div>
  );
};