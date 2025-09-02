import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, COMPONENT_STYLES, mergeStyles } from '@sucoza/shared-components';

// Simple clsx replacement
const clsx = (...classes: (string | undefined | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};
import { 
  Palette, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RotateCw,
  Download
} from 'lucide-react';
import { useAccessibilityDevToolsStore } from '../core/devtools-store';
import { 
  analyzeColorContrast, 
  formatContrastRatio,
  getContrastLevelDescription
} from '../utils/color-utils';
import type { ColorContrastResult } from '../types';

export interface ColorContrastAnalyzerProps {
  className?: string;
}

/**
 * Component for analyzing color contrast compliance
 */
export function ColorContrastAnalyzer({ className }: ColorContrastAnalyzerProps) {
  const store = useAccessibilityDevToolsStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sortBy, setSortBy] = useState<'ratio' | 'compliance'>('ratio');
  const [filterBy, setFilterBy] = useState<'all' | 'fail' | 'pass'>('all');

  const colorContrastResults = store.colorContrastResults;

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // Run color contrast analysis
      const results = analyzeColorContrast();
      store.dispatch({ type: 'color-contrast/update', payload: results });
    } catch (error) {
      console.error('Color contrast analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [store]);

  // Run analysis on mount
  useEffect(() => {
    if (colorContrastResults.length === 0) {
      runAnalysis();
    }
  }, [colorContrastResults.length, runAnalysis]);

  const filteredResults = colorContrastResults.filter(result => {
    switch (filterBy) {
      case 'fail':
        return !result.wcagAA;
      case 'pass':
        return result.wcagAA;
      default:
        return true;
    }
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'ratio') {
      return a.contrastRatio - b.contrastRatio;
    } else {
      // Sort by compliance (fails first)
      const aScore = (a.wcagAAA ? 3 : a.wcagAA ? 2 : a.largeTextAA ? 1 : 0);
      const bScore = (b.wcagAAA ? 3 : b.wcagAA ? 2 : b.largeTextAA ? 1 : 0);
      return aScore - bScore;
    }
  });

  const stats = {
    total: colorContrastResults.length,
    passing: colorContrastResults.filter(r => r.wcagAA).length,
    failing: colorContrastResults.filter(r => !r.wcagAA).length,
    aaa: colorContrastResults.filter(r => r.wcagAAA).length,
  };

  const exportResults = () => {
    const data = colorContrastResults.map(result => ({
      selector: result.selector,
      foregroundColor: result.foregroundColor,
      backgroundColor: result.backgroundColor,
      contrastRatio: result.contrastRatio,
      wcagAA: result.wcagAA,
      wcagAAA: result.wcagAAA,
      largeTextAA: result.largeTextAA,
      largeTextAAA: result.largeTextAAA,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-contrast-analysis.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={mergeStyles({ display: 'flex', flexDirection: 'column', height: '100%' }, className ? {} : {})}>
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Color Contrast Analysis
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCw className={clsx('w-4 h-4', isAnalyzing && 'animate-spin')} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
            
            {colorContrastResults.length > 0 && (
              <button
                onClick={exportResults}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.passing}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Passing AA</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.failing}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Failing AA</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.aaa}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">AAA Level</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter:
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Results</option>
                <option value="fail">Failing Only</option>
                <option value="pass">Passing Only</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="ratio">Contrast Ratio</option>
                <option value="compliance">Compliance Level</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredResults.length} of {colorContrastResults.length} results
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RotateCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">Analyzing color contrast...</p>
            </div>
          </div>
        ) : sortedResults.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Palette className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium mb-2">
                {colorContrastResults.length === 0 ? 'No Analysis Results' : 'No Results Match Filter'}
              </p>
              <p className="text-sm">
                {colorContrastResults.length === 0 
                  ? 'Click "Analyze" to check color contrast compliance'
                  : 'Try adjusting your filter settings'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedResults.map((result, index) => (
              <ContrastResultItem
                key={`${result.selector}-${index}`}
                result={result}
                onHighlight={() => {
                  // Would implement element highlighting
                  // TODO: Implement element highlighting
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ContrastResultItemProps {
  result: ColorContrastResult;
  onHighlight: () => void;
}

function ContrastResultItem({ result, onHighlight }: ContrastResultItemProps) {
  const getComplianceIcon = () => {
    if (result.wcagAAA) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (result.wcagAA) {
      return <CheckCircle className="w-5 h-5 text-yellow-500" />;
    } else if (result.largeTextAA) {
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getComplianceText = () => {
    if (result.wcagAAA) return 'AAA';
    if (result.wcagAA) return 'AA';
    if (result.largeTextAA) return 'Large Text AA';
    return 'Fail';
  };

  const getComplianceColor = () => {
    if (result.wcagAAA) return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    if (result.wcagAA) return 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    if (result.largeTextAA) return 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
    return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {getComplianceIcon()}
            <span className={clsx(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              getComplianceColor()
            )}>
              {getComplianceText()}
            </span>
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
              {formatContrastRatio(result.contrastRatio)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getContrastLevelDescription(result.contrastRatio)}
            </span>
          </div>
          
          <code className="text-sm text-gray-800 dark:text-gray-200 break-all">
            {result.selector}
          </code>
        </div>

        <div className="flex items-center gap-3">
          {/* Color Swatches */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">Colors:</div>
            <div 
              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: result.foregroundColor }}
              title={`Foreground: ${result.foregroundColor}`}
            />
            <div className="text-xs text-gray-400">on</div>
            <div 
              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: result.backgroundColor }}
              title={`Background: ${result.backgroundColor}`}
            />
          </div>

          <button
            onClick={onHighlight}
            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            title="Highlight element"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Compliance Details */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className={clsx(
          'flex items-center gap-1',
          result.wcagAA ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {result.wcagAA ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          WCAG AA
        </div>
        <div className={clsx(
          'flex items-center gap-1',
          result.wcagAAA ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {result.wcagAAA ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          WCAG AAA
        </div>
        <div className={clsx(
          'flex items-center gap-1',
          result.largeTextAA ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {result.largeTextAA ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          Large AA
        </div>
        <div className={clsx(
          'flex items-center gap-1',
          result.largeTextAAA ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {result.largeTextAAA ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          Large AAA
        </div>
      </div>
    </div>
  );
}