import React from 'react';
import { Type, AlertTriangle, CheckCircle } from 'lucide-react';
import { useDesignSystemInspector } from '../../hooks';

export function TypographyTab() {
  const { state } = useDesignSystemInspector();
  const { typographyScale } = state;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Typography Scale
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Analyze font sizes, weights, and consistency across your design system.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {typographyScale.scales.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Typography Tokens</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Math.round(typographyScale.coverage)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Coverage</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {typographyScale.violations.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Violations</div>
        </div>
      </div>

      {/* Typography Scale */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Font Scale
        </h3>
        <div className="space-y-4">
          {typographyScale.scales.map((token: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div 
                  className="text-gray-900 dark:text-white"
                  style={{ 
                    fontSize: token.fontSize,
                    fontWeight: token.fontWeight,
                    fontFamily: token.fontFamily,
                    lineHeight: token.lineHeight
                  }}
                >
                  The quick brown fox
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-mono">{token.fontSize}</span>
                <span>•</span>
                <span>{token.fontWeight}</span>
                <span>•</span>
                <span>{token.usageCount}x</span>
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
      {typographyScale.violations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Typography Issues ({typographyScale.violations.length})
          </h3>
          <div className="space-y-3">
            {typographyScale.violations.slice(0, 10).map((violation: any, index: number) => (
              <div key={index} className="flex items-start p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-none" />
                <div className="flex-1">
                  <div className="text-red-800 dark:text-red-200 text-sm font-medium">
                    {violation.issue}
                  </div>
                  <div className="text-red-600 dark:text-red-300 text-xs mt-1">
                    Expected: {violation.expected} | Actual: {violation.actual}
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