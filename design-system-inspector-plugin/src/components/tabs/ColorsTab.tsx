import React from 'react';
import { clsx } from 'clsx';
import { Palette, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { useDesignSystemInspector } from '../../hooks';
import type { ColorToken } from '../../types';

export function ColorsTab() {
  const { state } = useDesignSystemInspector();
  const { colorPalette, colorUsage } = state;

  const allColors = [
    ...colorPalette.primary,
    ...colorPalette.secondary, 
    ...colorPalette.neutral,
    ...colorPalette.semantic,
    ...colorPalette.custom,
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Color Palette
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Analyze color usage, accessibility, and consistency across your design system.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {colorUsage.totalColors}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Colors</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {colorUsage.tokenizedColors}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Tokenized</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {colorUsage.customColors}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Custom</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {colorUsage.accessibilityIssues}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">A11Y Issues</div>
        </div>
      </div>

      {/* Color Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(colorPalette).map(([category, colors]) => (
          <ColorCategory key={category} title={category} colors={colors} />
        ))}
      </div>

      {/* Most Used Colors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Most Used Colors
        </h3>
        <div className="space-y-3">
          {colorUsage.mostUsedColors.slice(0, 10).map((colorItem: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: colorItem.color }}
                />
                <div>
                  <div className="font-mono text-sm text-gray-900 dark:text-white">
                    {colorItem.color}
                  </div>
                  {colorItem.isToken && colorItem.tokenName && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {colorItem.tokenName}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {colorItem.count} uses
                </span>
                {colorItem.isToken ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColorCategory({ 
  title, 
  colors 
}: { 
  title: string; 
  colors: ColorToken[] 
}) {
  if (colors.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
        {title} Colors ({colors.length})
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {colors.slice(0, 8).map((color, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color.value }}
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {color.name}
                </div>
                <div className="font-mono text-sm text-gray-500 dark:text-gray-400">
                  {color.hex}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                {color.usageCount}x
              </span>
              {color.isAccessible ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
        ))}
        {colors.length > 8 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            +{colors.length - 8} more colors
          </div>
        )}
      </div>
    </div>
  );
}