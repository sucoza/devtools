import React from 'react';
import { clsx } from 'clsx';
import { Calendar, Clock, Camera, GitCompare, Activity } from 'lucide-react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { createVisualRegressionDevToolsClient } from '../core/devtools-client';
import { formatTimestamp } from '../utils';

/**
 * Timeline view of visual regression activity
 */
export function Timeline() {
  const client = createVisualRegressionDevToolsClient();
  
  // Subscribe to store state
  const state = useSyncExternalStore(
    client.subscribe,
    client.getState,
    client.getState
  );

  const activities = state.stats.recentActivity;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'screenshot':
        return <Camera className="w-4 h-4 text-blue-500" />;
      case 'diff':
        return <GitCompare className="w-4 h-4 text-green-500" />;
      case 'suite_created':
        return <Activity className="w-4 h-4 text-purple-500" />;
      case 'baseline_updated':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activity Timeline
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Recent visual regression testing activity
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No activity yet</p>
            <p className="text-sm text-center max-w-md">
              Start capturing screenshots or running comparisons to see activity timeline
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-full">
                      {getActivityIcon(activity.type)}
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-600 mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </h3>
                          {activity.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {activity.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      
                      {activity.metadata && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {activity.metadata.url && (
                            <div>URL: {activity.metadata.url}</div>
                          )}
                          {activity.metadata.status && (
                            <div className={clsx(
                              'inline-block px-2 py-1 rounded mt-1',
                              activity.metadata.status === 'passed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : activity.metadata.status === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            )}>
                              {activity.metadata.status}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}