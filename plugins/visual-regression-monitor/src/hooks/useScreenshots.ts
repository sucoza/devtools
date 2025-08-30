import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { Screenshot, CaptureRequest } from '../types';
import { createVisualRegressionDevToolsClient } from '../core/devtools-client';
import { getScreenshotEngine } from '../core/screenshot-engine';

/**
 * Hook for managing screenshots
 */
export function useScreenshots() {
  const client = createVisualRegressionDevToolsClient();
  const screenshotEngine = getScreenshotEngine();

  // Subscribe to store state
  const state = useSyncExternalStore(
    client.subscribe,
    client.getState,
    client.getState
  );

  const screenshots = Object.values(state.screenshots);
  const selectedScreenshot = state.ui.selectedScreenshotId 
    ? state.screenshots[state.ui.selectedScreenshotId] 
    : undefined;

  // Actions
  const actions = {
    /**
     * Capture a new screenshot
     */
    captureScreenshot: async (request: CaptureRequest) => {
      client.startCapture();
      
      try {
        const result = await screenshotEngine.captureScreenshot(request);
        
        if (result.success && result.screenshot) {
          client.addScreenshot(result.screenshot);
        }
        
        return result;
      } finally {
        client.stopCapture();
      }
    },

    /**
     * Capture responsive screenshots across multiple breakpoints
     */
    captureResponsiveScreenshots: async (url: string, viewports = state.settings.responsiveBreakpoints) => {
      client.startCapture();
      
      try {
        const results = await screenshotEngine.captureResponsiveScreenshots(
          url, 
          viewports.map(bp => ({
            width: bp.width,
            height: bp.height,
            deviceScaleFactor: bp.deviceScaleFactor,
            isMobile: bp.isMobile,
          }))
        );
        
        // Add successful screenshots
        results.forEach(result => {
          if (result.success && result.screenshot) {
            client.addScreenshot(result.screenshot);
          }
        });
        
        return results;
      } finally {
        client.stopCapture();
      }
    },

    /**
     * Update an existing screenshot
     */
    updateScreenshot: (id: string, updates: Partial<Screenshot>) => {
      client.updateScreenshot(id, updates);
    },

    /**
     * Remove a screenshot
     */
    removeScreenshot: (id: string) => {
      client.removeScreenshot(id);
    },

    /**
     * Clear all screenshots
     */
    clearScreenshots: () => {
      client.clearScreenshots();
    },

    /**
     * Select a screenshot
     */
    selectScreenshot: (id: string | undefined) => {
      client.selectScreenshot(id);
    },

    /**
     * Set screenshot as baseline
     */
    setAsBaseline: (screenshotId: string, suiteId: string) => {
      client.setBaseline(screenshotId, suiteId);
    },

    /**
     * Download screenshot
     */
    downloadScreenshot: (screenshot: Screenshot) => {
      const link = document.createElement('a');
      link.download = `${screenshot.name}.${screenshot.metadata.dimensions.width}x${screenshot.metadata.dimensions.height}.png`;
      link.href = screenshot.dataUrl;
      link.click();
    },

    /**
     * Copy screenshot to clipboard
     */
    copyToClipboard: async (screenshot: Screenshot) => {
      try {
        // Convert data URL to blob
        const response = await fetch(screenshot.dataUrl);
        const blob = await response.blob();
        
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        
        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
      }
    },

    /**
     * Filter screenshots
     */
    filterScreenshots: (
      searchQuery?: string,
      browserEngine?: string,
      tags?: string[],
      dateRange?: { start: number; end: number }
    ) => {
      return screenshots.filter(screenshot => {
        // Search query filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = screenshot.name.toLowerCase().includes(query);
          const matchesUrl = screenshot.url.toLowerCase().includes(query);
          const matchesTags = screenshot.tags?.some(tag => 
            tag.toLowerCase().includes(query)
          );
          
          if (!matchesName && !matchesUrl && !matchesTags) {
            return false;
          }
        }

        // Browser engine filter
        if (browserEngine && screenshot.browserEngine !== browserEngine) {
          return false;
        }

        // Tags filter
        if (tags && tags.length > 0) {
          const hasMatchingTag = tags.some(tag => 
            screenshot.tags?.includes(tag)
          );
          if (!hasMatchingTag) {
            return false;
          }
        }

        // Date range filter
        if (dateRange) {
          if (screenshot.timestamp < dateRange.start || screenshot.timestamp > dateRange.end) {
            return false;
          }
        }

        return true;
      });
    },

    /**
     * Group screenshots by criteria
     */
    groupScreenshots: (groupBy: 'url' | 'viewport' | 'browser' | 'date') => {
      const groups: Record<string, Screenshot[]> = {};

      screenshots.forEach(screenshot => {
        let key: string;

        switch (groupBy) {
          case 'url':
            key = screenshot.url || 'Unknown';
            break;
          case 'viewport':
            key = `${screenshot.viewport.width}x${screenshot.viewport.height}`;
            break;
          case 'browser':
            key = screenshot.browserEngine;
            break;
          case 'date':
            key = new Date(screenshot.timestamp).toDateString();
            break;
          default:
            key = 'Unknown';
        }

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(screenshot);
      });

      return groups;
    },

    /**
     * Get screenshot statistics
     */
    getStatistics: () => {
      const total = screenshots.length;
      const byBrowser = screenshots.reduce((acc, screenshot) => {
        acc[screenshot.browserEngine] = (acc[screenshot.browserEngine] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byViewport = screenshots.reduce((acc, screenshot) => {
        const key = `${screenshot.viewport.width}x${screenshot.viewport.height}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalSize = screenshots.reduce((acc, screenshot) => 
        acc + screenshot.metadata.fileSize, 0
      );

      const averageSize = total > 0 ? totalSize / total : 0;

      return {
        total,
        byBrowser,
        byViewport,
        totalSize,
        averageSize,
        oldestTimestamp: screenshots.length > 0 
          ? Math.min(...screenshots.map(s => s.timestamp))
          : null,
        newestTimestamp: screenshots.length > 0 
          ? Math.max(...screenshots.map(s => s.timestamp))
          : null,
      };
    },
  };

  return {
    screenshots,
    selectedScreenshot,
    isCapturing: state.isCapturing,
    isPlaywrightConnected: state.isPlaywrightConnected,
    actions,
  };
}