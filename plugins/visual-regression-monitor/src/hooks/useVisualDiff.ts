import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { VisualDiff, DiffRequest, Screenshot } from '../types';
import { createVisualRegressionDevToolsClient } from '../core/devtools-client';
import { getDiffAlgorithm } from '../core/diff-algorithm';

/**
 * Hook for managing visual diffs and comparisons
 */
export function useVisualDiff() {
  const client = createVisualRegressionDevToolsClient();
  const diffAlgorithm = getDiffAlgorithm();

  // Subscribe to store state
  const state = useSyncExternalStore(
    client.subscribe,
    client.getState,
    client.getState
  );

  const visualDiffs = Object.values(state.visualDiffs);
  const screenshots = Object.values(state.screenshots);
  const selectedDiff = state.ui.selectedDiffId 
    ? state.visualDiffs[state.ui.selectedDiffId] 
    : undefined;

  // Actions
  const actions = {
    /**
     * Compare two screenshots
     */
    compareScreenshots: async (baselineId: string, comparisonId: string, options?: DiffRequest) => {
      const baseline = state.screenshots[baselineId];
      const comparison = state.screenshots[comparisonId];

      if (!baseline || !comparison) {
        throw new Error('Both baseline and comparison screenshots must exist');
      }

      client.startAnalysis();

      try {
        const result = await diffAlgorithm.compareScreenshots(baseline, comparison, options);

        if (result.success && result.diff) {
          client.addVisualDiff(result.diff);
          return result.diff;
        }

        throw new Error(result.error?.message || 'Comparison failed');
      } finally {
        client.stopAnalysis();
      }
    },

    /**
     * Compare one screenshot against multiple others
     */
    batchCompareScreenshots: async (baselineId: string, comparisonIds: string[]) => {
      const baseline = state.screenshots[baselineId];
      if (!baseline) {
        throw new Error('Baseline screenshot not found');
      }

      const comparisons = comparisonIds
        .map(id => state.screenshots[id])
        .filter(Boolean);

      if (comparisons.length === 0) {
        throw new Error('No valid comparison screenshots found');
      }

      client.startAnalysis();

      try {
        const results = await diffAlgorithm.batchCompareScreenshots(baseline, comparisons);
        
        // Add successful diffs to store
        results.forEach(result => {
          if (result.success && result.diff) {
            client.addVisualDiff(result.diff);
          }
        });

        return results;
      } finally {
        client.stopAnalysis();
      }
    },

    /**
     * Compare screenshots across responsive breakpoints
     */
    compareResponsiveScreenshots: async (url: string, baselineViewport?: string) => {
      // Find screenshots for the same URL
      const urlScreenshots = screenshots.filter(s => s.url === url);
      
      if (urlScreenshots.length < 2) {
        throw new Error('Need at least 2 screenshots of the same URL to compare');
      }

      // Group by viewport
      const viewportGroups = urlScreenshots.reduce((groups, screenshot) => {
        const key = `${screenshot.viewport.width}x${screenshot.viewport.height}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(screenshot);
        return groups;
      }, {} as Record<string, Screenshot[]>);

      // Find baseline (either specified or largest viewport)
      let baseline: Screenshot;
      if (baselineViewport && viewportGroups[baselineViewport]) {
        baseline = viewportGroups[baselineViewport][0];
      } else {
        // Use largest viewport as baseline
        const viewports = Object.keys(viewportGroups).sort((a, b) => {
          const [w1, h1] = a.split('x').map(Number);
          const [w2, h2] = b.split('x').map(Number);
          return (w2 * h2) - (w1 * h1);
        });
        baseline = viewportGroups[viewports[0]][0];
      }

      // Compare against other viewports
      const comparisons: Screenshot[] = [];
      Object.entries(viewportGroups).forEach(([viewport, screenshots]) => {
        if (viewport !== `${baseline.viewport.width}x${baseline.viewport.height}`) {
          comparisons.push(screenshots[0]); // Take first screenshot from each viewport
        }
      });

      return this.batchCompareScreenshots(baseline.id, comparisons.map(s => s.id));
    },

    /**
     * Update a visual diff
     */
    updateVisualDiff: (id: string, updates: Partial<VisualDiff>) => {
      client.updateVisualDiff(id, updates);
    },

    /**
     * Remove a visual diff
     */
    removeVisualDiff: (id: string) => {
      client.removeVisualDiff(id);
    },

    /**
     * Clear all visual diffs
     */
    clearVisualDiffs: () => {
      client.clearVisualDiffs();
    },

    /**
     * Select a visual diff
     */
    selectDiff: (id: string | undefined) => {
      client.selectDiff(id);
    },

    /**
     * Accept differences (mark as passed)
     */
    acceptDifferences: (diffId: string) => {
      const diff = state.visualDiffs[diffId];
      if (diff && diff.status === 'failed') {
        client.updateVisualDiff(diffId, { status: 'passed' });
      }
    },

    /**
     * Reject differences (mark as failed)
     */
    rejectDifferences: (diffId: string) => {
      const diff = state.visualDiffs[diffId];
      if (diff && diff.status === 'passed') {
        client.updateVisualDiff(diffId, { status: 'failed' });
      }
    },

    /**
     * Filter visual diffs
     */
    filterVisualDiffs: (
      status?: 'passed' | 'failed' | 'pending',
      dateRange?: { start: number; end: number },
      thresholdRange?: { min: number; max: number }
    ) => {
      return visualDiffs.filter(diff => {
        // Status filter
        if (status && diff.status !== status) {
          return false;
        }

        // Date range filter
        if (dateRange) {
          if (diff.timestamp < dateRange.start || diff.timestamp > dateRange.end) {
            return false;
          }
        }

        // Threshold range filter
        if (thresholdRange) {
          const percentage = diff.metrics.percentageChanged;
          if (percentage < thresholdRange.min || percentage > thresholdRange.max) {
            return false;
          }
        }

        return true;
      });
    },

    /**
     * Group visual diffs by criteria
     */
    groupVisualDiffs: (groupBy: 'status' | 'date' | 'severity') => {
      const groups: Record<string, VisualDiff[]> = {};

      visualDiffs.forEach(diff => {
        let key: string;

        switch (groupBy) {
          case 'status':
            key = diff.status;
            break;
          case 'date':
            key = new Date(diff.timestamp).toDateString();
            break;
          case 'severity':
            const percentage = diff.metrics.percentageChanged;
            if (percentage < 1) key = 'Low';
            else if (percentage < 5) key = 'Medium';
            else key = 'High';
            break;
          default:
            key = 'Unknown';
        }

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(diff);
      });

      return groups;
    },

    /**
     * Get diff statistics
     */
    getStatistics: () => {
      const total = visualDiffs.length;
      const passed = visualDiffs.filter(d => d.status === 'passed').length;
      const failed = visualDiffs.filter(d => d.status === 'failed').length;
      const pending = visualDiffs.filter(d => d.status === 'pending').length;

      const averagePercentageChanged = total > 0 
        ? visualDiffs.reduce((sum, diff) => sum + diff.metrics.percentageChanged, 0) / total
        : 0;

      const maxPercentageChanged = total > 0
        ? Math.max(...visualDiffs.map(d => d.metrics.percentageChanged))
        : 0;

      const minPercentageChanged = total > 0
        ? Math.min(...visualDiffs.map(d => d.metrics.percentageChanged))
        : 0;

      const totalRegions = visualDiffs.reduce((sum, diff) => sum + diff.differences.length, 0);
      const averageRegions = total > 0 ? totalRegions / total : 0;

      return {
        total,
        passed,
        failed,
        pending,
        passRate: total > 0 ? (passed / total) * 100 : 0,
        averagePercentageChanged,
        maxPercentageChanged,
        minPercentageChanged,
        totalRegions,
        averageRegions,
      };
    },

    /**
     * Export diff results
     */
    exportDiffResults: (format: 'json' | 'csv' = 'json') => {
      const results = visualDiffs.map(diff => ({
        id: diff.id,
        baselineId: diff.baselineId,
        comparisonId: diff.comparisonId,
        timestamp: new Date(diff.timestamp).toISOString(),
        status: diff.status,
        percentageChanged: diff.metrics.percentageChanged,
        changedPixels: diff.metrics.changedPixels,
        totalPixels: diff.metrics.totalPixels,
        regions: diff.differences.length,
        threshold: diff.threshold,
      }));

      if (format === 'csv') {
        const headers = Object.keys(results[0] || {});
        const csvContent = [
          headers.join(','),
          ...results.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visual-diff-results-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visual-diff-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },

    /**
     * Calculate similarity between screenshots
     */
    calculateSimilarity: async (screenshot1Id: string, screenshot2Id: string) => {
      const screenshot1 = state.screenshots[screenshot1Id];
      const screenshot2 = state.screenshots[screenshot2Id];

      if (!screenshot1 || !screenshot2) {
        throw new Error('Both screenshots must exist');
      }

      // This would load the images and calculate similarity using the diff algorithm
      // For now, return a mock similarity score based on metadata comparison
      const isSameUrl = screenshot1.url === screenshot2.url;
      const isSameViewport = screenshot1.viewport.width === screenshot2.viewport.width &&
                           screenshot1.viewport.height === screenshot2.viewport.height;
      const isSameBrowser = screenshot1.browserEngine === screenshot2.browserEngine;

      let similarity = 0;
      if (isSameUrl) similarity += 0.4;
      if (isSameViewport) similarity += 0.3;
      if (isSameBrowser) similarity += 0.1;
      
      // Add some randomness for demonstration
      similarity += Math.random() * 0.2;

      return Math.min(1, similarity);
    },
  };

  return {
    visualDiffs,
    selectedDiff,
    isAnalyzing: state.isAnalyzing,
    actions,
  };
}