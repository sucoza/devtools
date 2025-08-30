import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { ResponsiveBreakpoint, Screenshot } from '../types';
import { createVisualRegressionDevToolsClient } from '../core/devtools-client';
import { useScreenshots } from './useScreenshots';
import { useVisualDiff } from './useVisualDiff';

/**
 * Hook for responsive testing functionality
 */
export function useResponsiveTesting() {
  const client = createVisualRegressionDevToolsClient();
  const { actions: screenshotActions } = useScreenshots();
  const { actions: diffActions } = useVisualDiff();

  // Subscribe to store state
  const state = useSyncExternalStore(
    client.subscribe,
    client.getState,
    client.getState
  );

  const breakpoints = state.settings.responsiveBreakpoints;
  const screenshots = Object.values(state.screenshots);

  // Actions
  const actions = {
    /**
     * Add a custom responsive breakpoint
     */
    addBreakpoint: (breakpoint: ResponsiveBreakpoint) => {
      const currentBreakpoints = [...state.settings.responsiveBreakpoints];
      
      // Check if breakpoint already exists
      const exists = currentBreakpoints.some(bp => 
        bp.name === breakpoint.name || 
        (bp.width === breakpoint.width && bp.height === breakpoint.height)
      );

      if (exists) {
        throw new Error('Breakpoint already exists');
      }

      currentBreakpoints.push(breakpoint);
      client.updateSettings({
        responsiveBreakpoints: currentBreakpoints
      });
    },

    /**
     * Update an existing breakpoint
     */
    updateBreakpoint: (index: number, breakpoint: Partial<ResponsiveBreakpoint>) => {
      const currentBreakpoints = [...state.settings.responsiveBreakpoints];
      
      if (index < 0 || index >= currentBreakpoints.length) {
        throw new Error('Invalid breakpoint index');
      }

      currentBreakpoints[index] = { ...currentBreakpoints[index], ...breakpoint };
      client.updateSettings({
        responsiveBreakpoints: currentBreakpoints
      });
    },

    /**
     * Remove a breakpoint
     */
    removeBreakpoint: (index: number) => {
      const currentBreakpoints = [...state.settings.responsiveBreakpoints];
      
      if (index < 0 || index >= currentBreakpoints.length) {
        throw new Error('Invalid breakpoint index');
      }

      currentBreakpoints.splice(index, 1);
      client.updateSettings({
        responsiveBreakpoints: currentBreakpoints
      });
    },

    /**
     * Test a URL across all responsive breakpoints
     */
    testUrlAcrossBreakpoints: async (url: string, options?: {
      customBreakpoints?: ResponsiveBreakpoint[];
      captureSettings?: unknown;
    }) => {
      const testBreakpoints = options?.customBreakpoints || breakpoints;
      
      if (testBreakpoints.length === 0) {
        throw new Error('No breakpoints defined for testing');
      }

      // Capture screenshots for each breakpoint
      const captureResults = await screenshotActions.captureResponsiveScreenshots(
        url, 
        testBreakpoints
      );

      // Return results with breakpoint mapping
      return captureResults.map((result, index) => ({
        breakpoint: testBreakpoints[index],
        result
      }));
    },

    /**
     * Compare responsive layouts (current vs baseline)
     */
    compareResponsiveLayouts: async (url: string, baselineTimestamp?: number) => {
      // Find screenshots for this URL
      const urlScreenshots = screenshots.filter(s => s.url === url);
      
      if (urlScreenshots.length === 0) {
        throw new Error('No screenshots found for this URL');
      }

      // Group by viewport size
      const viewportGroups = urlScreenshots.reduce((groups, screenshot) => {
        const key = `${screenshot.viewport.width}x${screenshot.viewport.height}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(screenshot);
        return groups;
      }, {} as Record<string, Screenshot[]>);

      const results = [];

      // For each viewport, compare latest with baseline
      for (const [viewport, screenshots] of Object.entries(viewportGroups)) {
        if (screenshots.length < 2) continue;

        // Sort by timestamp
        screenshots.sort((a, b) => b.timestamp - a.timestamp);

        let baseline: Screenshot;
        let current: Screenshot;

        if (baselineTimestamp) {
          // Find screenshot closest to baseline timestamp
          baseline = screenshots.reduce((closest, screenshot) => {
            return Math.abs(screenshot.timestamp - baselineTimestamp) < 
                   Math.abs(closest.timestamp - baselineTimestamp) ? screenshot : closest;
          });
          current = screenshots[0]; // Latest screenshot
        } else {
          // Compare latest two
          current = screenshots[0];
          baseline = screenshots[1];
        }

        if (current.id !== baseline.id) {
          try {
            const diff = await diffActions.compareScreenshots(baseline.id, current.id);
            results.push({
              viewport,
              baseline: baseline.id,
              current: current.id,
              diff: diff.id,
              status: diff.status,
              percentageChanged: diff.metrics.percentageChanged
            });
          } catch (error) {
            console.error(`Failed to compare ${viewport}:`, error);
          }
        }
      }

      return results;
    },

    /**
     * Analyze layout shifts across breakpoints
     */
    analyzeLayoutShifts: (url: string) => {
      const urlScreenshots = screenshots
        .filter(s => s.url === url)
        .sort((a, b) => a.viewport.width - b.viewport.width);

      if (urlScreenshots.length < 2) {
        return {
          hasShifts: false,
          shifts: [],
          recommendation: 'Need at least 2 breakpoints to analyze layout shifts'
        };
      }

      // Simple analysis based on viewport jumps
      const shifts = [];
      const viewportSizes = urlScreenshots.map(s => s.viewport.width);
      
      // Look for significant viewport gaps
      for (let i = 1; i < viewportSizes.length; i++) {
        const gap = viewportSizes[i] - viewportSizes[i - 1];
        if (gap > 200) { // Arbitrary threshold for significant gap
          shifts.push({
            from: viewportSizes[i - 1],
            to: viewportSizes[i],
            gap,
            severity: gap > 400 ? 'high' : gap > 300 ? 'medium' : 'low'
          });
        }
      }

      return {
        hasShifts: shifts.length > 0,
        shifts,
        recommendation: shifts.length > 0 
          ? 'Consider adding intermediate breakpoints to smooth layout transitions'
          : 'Layout transitions appear smooth across breakpoints'
      };
    },

    /**
     * Generate responsive test report
     */
    generateResponsiveReport: (url: string) => {
      const urlScreenshots = screenshots
        .filter(s => s.url === url)
        .sort((a, b) => a.viewport.width - b.viewport.width);

      if (urlScreenshots.length === 0) {
        return null;
      }

      // Group by browser engine
      const browserResults = urlScreenshots.reduce((groups, screenshot) => {
        if (!groups[screenshot.browserEngine]) {
          groups[screenshot.browserEngine] = [];
        }
        groups[screenshot.browserEngine].push(screenshot);
        return groups;
      }, {} as Record<string, Screenshot[]>);

      // Analyze coverage
      const testedBreakpoints = urlScreenshots.map(s => s.viewport.width);
      const standardBreakpoints = [320, 768, 1024, 1440, 1920]; // Common breakpoints
      const coverage = standardBreakpoints.filter(bp => 
        testedBreakpoints.some(tested => Math.abs(tested - bp) <= 50)
      ).length / standardBreakpoints.length * 100;

      return {
        url,
        totalScreenshots: urlScreenshots.length,
        browserEngines: Object.keys(browserResults),
        viewportRange: {
          min: Math.min(...testedBreakpoints),
          max: Math.max(...testedBreakpoints)
        },
        coverage: Math.round(coverage),
        breakpointsCovered: testedBreakpoints.length,
        recommendations: [
          coverage < 80 ? 'Consider testing more standard breakpoints' : null,
          urlScreenshots.length < 3 ? 'Add more breakpoints for comprehensive testing' : null,
          Object.keys(browserResults).length < 2 ? 'Test on multiple browser engines' : null,
        ].filter(Boolean),
        screenshots: urlScreenshots.map(s => ({
          id: s.id,
          viewport: `${s.viewport.width}x${s.viewport.height}`,
          browser: s.browserEngine,
          timestamp: s.timestamp,
          fileSize: s.metadata.fileSize
        }))
      };
    },

    /**
     * Get common responsive breakpoints presets
     */
    getBreakpointPresets: () => ({
      mobile: [
        { name: 'Mobile Portrait', width: 320, height: 568, deviceScaleFactor: 2, isMobile: true },
        { name: 'Mobile Landscape', width: 568, height: 320, deviceScaleFactor: 2, isMobile: true },
      ],
      tablet: [
        { name: 'Tablet Portrait', width: 768, height: 1024, deviceScaleFactor: 2, isMobile: false },
        { name: 'Tablet Landscape', width: 1024, height: 768, deviceScaleFactor: 2, isMobile: false },
      ],
      desktop: [
        { name: 'Desktop Small', width: 1024, height: 768, deviceScaleFactor: 1, isMobile: false },
        { name: 'Desktop Medium', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
        { name: 'Desktop Large', width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
      ],
      all: [
        { name: 'Mobile Portrait', width: 320, height: 568, deviceScaleFactor: 2, isMobile: true },
        { name: 'Mobile Landscape', width: 568, height: 320, deviceScaleFactor: 2, isMobile: true },
        { name: 'Tablet Portrait', width: 768, height: 1024, deviceScaleFactor: 2, isMobile: false },
        { name: 'Tablet Landscape', width: 1024, height: 768, deviceScaleFactor: 2, isMobile: false },
        { name: 'Desktop Small', width: 1280, height: 720, deviceScaleFactor: 1, isMobile: false },
        { name: 'Desktop Medium', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
        { name: 'Desktop Large', width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
      ]
    }),

    /**
     * Apply breakpoint preset
     */
    applyBreakpointPreset: (preset: 'mobile' | 'tablet' | 'desktop' | 'all') => {
      const presets = actions.getBreakpointPresets();
      client.updateSettings({
        responsiveBreakpoints: presets[preset]
      });
    },

    /**
     * Get viewport statistics
     */
    getViewportStatistics: () => {
      const viewportCounts = screenshots.reduce((counts, screenshot) => {
        const key = `${screenshot.viewport.width}x${screenshot.viewport.height}`;
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      const mostTestedViewport = Object.entries(viewportCounts)
        .sort(([,a], [,b]) => b - a)[0];

      const deviceTypes = screenshots.reduce((counts, screenshot) => {
        const type = screenshot.viewport.isMobile ? 'mobile' : 'desktop';
        counts[type] = (counts[type] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      return {
        viewportCounts,
        mostTestedViewport: mostTestedViewport ? {
          viewport: mostTestedViewport[0],
          count: mostTestedViewport[1]
        } : null,
        deviceTypes,
        uniqueViewports: Object.keys(viewportCounts).length,
        totalScreenshots: screenshots.length
      };
    },
  };

  return {
    breakpoints,
    actions,
  };
}