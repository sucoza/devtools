import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useDesignSystemInspector } from '../../hooks';

export function SpacingTab() {
  const { state } = useDesignSystemInspector();
  const { spacingAnalysis } = state;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Spacing Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Analyze spacing consistency and adherence to your design scale.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {spacingAnalysis.scale.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Spacing Tokens</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Math.round(spacingAnalysis.consistency)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Consistency</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {spacingAnalysis.violations.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Violations</div>
        </div>
      </div>

      {/* Spacing Scale */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Spacing Scale
        </h3>
        <div className="space-y-3">
          {spacingAnalysis.scale.map((token: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div 
                  className="bg-blue-200 dark:bg-blue-800 border-2 border-dashed border-blue-400"
                  style={{ width: `${Math.min(token.pixels, 100)}px`, height: '16px' }}
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {token.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {token.pixels}px ({token.rem.toFixed(2)}rem)
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                  {token.usageCount}x
                </span>
                {token.isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations */}
      {spacingAnalysis.violations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Spacing Issues ({spacingAnalysis.violations.length})
          </h3>
          <div className="space-y-3">
            {spacingAnalysis.violations.slice(0, 10).map((violation: any, index: number) => (
              <div key={index} className="flex items-start p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-none" />
                <div className="flex-1">
                  <div className="text-red-800 dark:text-red-200 text-sm font-medium">
                    Inconsistent {violation.property} spacing
                  </div>
                  <div className="text-red-600 dark:text-red-300 text-xs mt-1">
                    Current: {violation.actual} | Suggested: {violation.suggestion}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}