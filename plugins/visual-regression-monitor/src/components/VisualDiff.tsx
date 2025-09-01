import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  GitCompare, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  Target
} from 'lucide-react';
import { useVisualDiff } from '../hooks/useVisualDiff';
import { useScreenshots } from '../hooks/useScreenshots';
import { formatTimestamp } from '../utils';

/**
 * Visual diff comparison interface
 */
export function VisualDiff() {
  const { visualDiffs, selectedDiff, isAnalyzing, actions: diffActions } = useVisualDiff();
  const { screenshots } = useScreenshots();
  
  const [selectedBaseline, setSelectedBaseline] = useState('');
  const [selectedComparison, setSelectedComparison] = useState('');
  const [threshold, setThreshold] = useState(0.2);
  const [showDiffOverlay, setShowDiffOverlay] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleCompare = async () => {
    if (!selectedBaseline || !selectedComparison) return;

    try {
      await diffActions.compareScreenshots(selectedBaseline, selectedComparison);
    } catch (error) {
      console.error('Comparison failed:', error);
    }
  };

  const handleBulkCompare = async () => {
    if (!selectedBaseline) return;

    const comparisonIds = screenshots
      .filter(s => (s as any).id !== selectedBaseline)
      .map(s => (s as any).id)
      .slice(0, 5); // Limit to 5 for demo

    try {
      await diffActions.batchCompareScreenshots(selectedBaseline, comparisonIds);
    } catch (error) {
      console.error('Bulk comparison failed:', error);
    }
  };


  return (
    <div className="flex flex-col h-full">
      {/* Comparison Controls */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          {/* Screenshot Selection */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Baseline Screenshot
              </label>
              <select
                value={selectedBaseline}
                onChange={(e) => setSelectedBaseline(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isAnalyzing}
              >
                <option value="">Select baseline...</option>
                {screenshots.map(screenshot => (
                  <option key={screenshot.id} value={screenshot.id}>
                    {screenshot.name} ({screenshot.viewport.width}×{screenshot.viewport.height})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comparison Screenshot
              </label>
              <select
                value={selectedComparison}
                onChange={(e) => setSelectedComparison(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isAnalyzing}
              >
                <option value="">Select comparison...</option>
                {screenshots.map(screenshot => (
                  <option key={screenshot.id} value={screenshot.id}>
                    {screenshot.name} ({screenshot.viewport.width}×{screenshot.viewport.height})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Options */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Threshold
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                min="0"
                max="1"
                step="0.1"
                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isAnalyzing}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCompare}
                disabled={!selectedBaseline || !selectedComparison || isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <GitCompare className="w-4 h-4" />
                {isAnalyzing ? 'Comparing...' : 'Compare'}
              </button>

              <button
                onClick={handleBulkCompare}
                disabled={!selectedBaseline || isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Layers className="w-4 h-4" />
                Bulk Compare
              </button>

              <button
                onClick={diffActions.clearVisualDiffs}
                disabled={visualDiffs.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Diff List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-auto">
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Comparisons ({visualDiffs.length})
            </h3>
            
            {visualDiffs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <GitCompare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No comparisons yet</p>
                <p className="text-xs">Select screenshots above to start</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visualDiffs.map(diff => (
                  <DiffListItem 
                    key={(diff as any).id} 
                    diff={diff} 
                    screenshots={screenshots}
                    isSelected={selectedDiff?.id === (diff as any).id}
                    onSelect={() => diffActions.selectDiff((diff as any).id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Diff Viewer */}
        <div className="flex-1 flex flex-col">
          {selectedDiff ? (
            <DiffViewer 
              diff={selectedDiff}
              screenshots={screenshots}
              showOverlay={showDiffOverlay}
              zoomLevel={zoomLevel}
              onToggleOverlay={() => setShowDiffOverlay(!showDiffOverlay)}
              onZoomIn={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
              onZoomOut={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
              onZoomReset={() => setZoomLevel(100)}
              onAccept={() => diffActions.acceptDifferences(selectedDiff.id)}
              onReject={() => diffActions.rejectDifferences(selectedDiff.id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No comparison selected</p>
                <p className="text-sm">Select a comparison from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DiffListItem({ 
  diff, 
  screenshots, 
  isSelected, 
  onSelect 
}: { 
  diff: unknown; 
  screenshots: unknown[]; 
  isSelected: boolean; 
  onSelect: () => void; 
}) {
  const baseline = screenshots.find(s => (s as any).id === (diff as any).baselineId);
  const comparison = screenshots.find(s => (s as any).id === (diff as any).comparisonId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div
      className={clsx(
        'p-3 rounded-lg border cursor-pointer transition-colors',
        isSelected
          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
          : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        {getStatusIcon((diff as any).status)}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatTimestamp((diff as any).timestamp)}
        </div>
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="text-gray-900 dark:text-white font-medium">
          {((baseline as any)?.name || 'Unknown') + ' vs ' + ((comparison as any)?.name || 'Unknown')}
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          {(diff as any).metrics.percentageChanged.toFixed(2)}% changed
        </div>
        <div className="text-gray-400 dark:text-gray-500">
          {(diff as any).differences.length} regions
        </div>
      </div>
    </div>
  );
}

function DiffViewer({ 
  diff, 
  screenshots, 
  showOverlay, 
  zoomLevel, 
  onToggleOverlay, 
  onZoomIn, 
  onZoomOut, 
  onZoomReset,
  onAccept,
  onReject
}: { 
  diff: unknown; 
  screenshots: unknown[]; 
  showOverlay: boolean; 
  zoomLevel: number; 
  onToggleOverlay: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const baseline = screenshots.find(s => (s as any).id === (diff as any).baselineId);
  const comparison = screenshots.find(s => (s as any).id === (diff as any).comparisonId);

  if (!baseline || !comparison) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <p>Screenshots not found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Viewer Controls */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={clsx(
              'px-2 py-1 text-xs font-medium rounded border capitalize',
              getStatusColor((diff as any).status)
            )}>
              {(diff as any).status}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {(diff as any).metrics.percentageChanged.toFixed(2)}% changed
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {(diff as any).differences.length} regions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleOverlay}
              className={clsx(
                'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                showOverlay
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
              )}
            >
              {showOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Overlay
            </button>

            <div className="flex items-center gap-1">
              <button onClick={onZoomOut} className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 min-w-12 text-center">
                {zoomLevel}%
              </span>
              <button onClick={onZoomIn} className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={onZoomReset} className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-1">
              {(diff as any).status !== 'passed' && (
                <button
                  onClick={onAccept}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Accept
                </button>
              )}
              {(diff as any).status !== 'failed' && (
                <button
                  onClick={onReject}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Images */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
        <div className="grid grid-cols-2 h-full">
          {/* Baseline */}
          <div className="border-r border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Baseline: {(baseline as any).name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(baseline as any).viewport.width}×{(baseline as any).viewport.height} • {formatTimestamp((baseline as any).timestamp)}
              </p>
            </div>
            <div className="p-4 overflow-auto">
              <img
                src={(baseline as any).dataUrl}
                alt="Baseline"
                className="border border-gray-300 dark:border-gray-600 rounded"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
              />
            </div>
          </div>

          {/* Comparison */}
          <div>
            <div className="p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Comparison: {(comparison as any).name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(comparison as any).viewport.width}×{(comparison as any).viewport.height} • {formatTimestamp((comparison as any).timestamp)}
              </p>
            </div>
            <div className="p-4 overflow-auto">
              <img
                src={(comparison as any).dataUrl}
                alt="Comparison"
                className="border border-gray-300 dark:border-gray-600 rounded"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Diff Details */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Pixels:</span>
            <p className="text-gray-900 dark:text-white">{(diff as any).metrics.totalPixels.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Changed Pixels:</span>
            <p className="text-gray-900 dark:text-white">{(diff as any).metrics.changedPixels.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Mean Color Delta:</span>
            <p className="text-gray-900 dark:text-white">{(diff as any).metrics.meanColorDelta.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Threshold:</span>
            <p className="text-gray-900 dark:text-white">{((diff as any).threshold * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}