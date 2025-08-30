import React from 'react';
import { Play, Film } from 'lucide-react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { createVisualRegressionDevToolsClient } from '../core/devtools-client';

/**
 * Animation and advanced comparison view
 */
export function ComparisonView() {
  const client = createVisualRegressionDevToolsClient();
  
  // Subscribe to store state
  const state = useSyncExternalStore(
    client.subscribe,
    client.getState,
    client.getState
  );

  const animations = Object.values(state.animationSequences);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Animation Analysis
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              <Play className="w-4 h-4" />
              Record Animation
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Capture and analyze UI animations and transitions
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        {animations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Film className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No animations recorded</p>
            <p className="text-sm text-center max-w-md">
              Record UI animations to analyze transitions and detect visual regressions in motion
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-gray-600 dark:text-gray-400">
              Animation sequences will be displayed here once recorded.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}