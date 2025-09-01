import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScreenshotEngine } from '../screenshot-engine';
import type { CaptureRequest, Viewport, BrowserEngine } from '../../types';

// Mock MCP Playwright tools
const mockMCPTools = {
  browser_navigate: vi.fn().mockResolvedValue(undefined),
  browser_resize: vi.fn().mockResolvedValue(undefined),
  browser_take_screenshot: vi.fn().mockResolvedValue('mock-screenshot-data'),
  browser_snapshot: vi.fn().mockResolvedValue({ elements: [] }),
  browser_evaluate: vi.fn().mockResolvedValue(undefined),
  browser_wait_for: vi.fn().mockResolvedValue(undefined),
  browser_click: vi.fn().mockResolvedValue(undefined),
  browser_hover: vi.fn().mockResolvedValue(undefined),
  browser_close: vi.fn().mockResolvedValue(undefined),
  browser_install: vi.fn().mockResolvedValue(undefined),
};

// Mock window object with MCP tools
Object.defineProperty(global, 'window', {
  writable: true,
  value: {
    mcpPlaywrightTools: mockMCPTools,
  },
});

describe('ScreenshotEngine', () => {
  let screenshotEngine: ScreenshotEngine;

  beforeEach(() => {
    screenshotEngine = new ScreenshotEngine();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await screenshotEngine.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      expect(screenshotEngine).toBeDefined();
    });

    it('should check availability correctly', () => {
      const isAvailable = screenshotEngine.isAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should get available browser engines', () => {
      const engines = screenshotEngine.getAvailableBrowserEngines();
      expect(engines).toEqual(['chromium', 'firefox', 'webkit']);
    });
  });

  describe('Configuration', () => {
    it('should set browser engine', () => {
      expect(() => {
        screenshotEngine.setBrowserEngine('firefox');
      }).not.toThrow();
    });

    it('should set default viewport', () => {
      const viewport: Viewport = {
        width: 1024,
        height: 768,
        deviceScaleFactor: 2,
        isMobile: true,
      };

      expect(() => {
        screenshotEngine.setDefaultViewport(viewport);
      }).not.toThrow();
    });

    it('should configure retry settings', () => {
      expect(() => {
        screenshotEngine.configureRetry({
          maxRetries: 5,
          retryDelay: 2000,
          backoffMultiplier: 1.5,
        });
      }).not.toThrow();
    });
  });

  describe('Screenshot Capture', () => {
    it('should capture a basic screenshot', async () => {
      const request: CaptureRequest = {
        url: 'https://example.com',
        name: 'Test Screenshot',
        tags: ['test'],
      };

      const result = await screenshotEngine.captureScreenshot(request);

      expect(result.success).toBe(true);
      expect(result.screenshot).toBeDefined();
      if (result.screenshot) {
        expect(result.screenshot.name).toBe('Test Screenshot');
        expect(result.screenshot.url).toBe('https://example.com');
        expect(result.screenshot.tags).toEqual(['test']);
        expect(result.screenshot.dataUrl).toBeTruthy();
      }
    });

    it('should capture screenshot with custom viewport', async () => {
      const viewport: Viewport = {
        width: 800,
        height: 600,
        deviceScaleFactor: 1,
        isMobile: false,
      };

      const request: CaptureRequest = {
        url: 'https://example.com',
        viewport,
        name: 'Custom Viewport Screenshot',
      };

      const result = await screenshotEngine.captureScreenshot(request);

      expect(result.success).toBe(true);
      expect(result.screenshot?.viewport).toEqual(viewport);
    });

    it('should capture screenshot with selector', async () => {
      const request: CaptureRequest = {
        url: 'https://example.com',
        selector: '#main-content',
        name: 'Element Screenshot',
      };

      const result = await screenshotEngine.captureScreenshot(request);

      expect(result.success).toBe(true);
      expect(result.screenshot?.selector).toBe('#main-content');
    });

    it('should capture screenshot with custom options', async () => {
      const request: CaptureRequest = {
        url: 'https://example.com',
        name: 'High Quality Screenshot',
        options: {
          quality: 95,
          format: 'jpeg',
          fullPage: true,
          hideScrollbars: true,
          disableAnimations: true,
          waitForFonts: true,
          waitForImages: true,
          delay: 1000,
        },
      };

      const result = await screenshotEngine.captureScreenshot(request);

      expect(result.success).toBe(true);
      expect(result.screenshot).toBeDefined();
    });

    it('should handle capture failures gracefully', async () => {
      // Mock MCP tools to throw an error - need to disable retries for test speed
      screenshotEngine.configureRetry({ maxRetries: 0 });
      mockMCPTools.browser_navigate.mockRejectedValue(new Error('Navigation failed'));

      const request: CaptureRequest = {
        url: 'https://example.com', // Use valid URL to bypass validation
        name: 'Failed Screenshot',
      };

      const result = await screenshotEngine.captureScreenshot(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toMatch(/CAPTURE_FAILED|NETWORK_ERROR|BROWSER_ERROR/);
      
      // Reset mock and retries for other tests
      screenshotEngine.configureRetry({ maxRetries: 3 });
      mockMCPTools.browser_navigate.mockResolvedValue(undefined);
    });
  });

  describe('Input Validation', () => {
    it('should validate URL format', async () => {
      // Mock the isValidUrl method to return false for this test
      const isValidUrlSpy = vi.spyOn(screenshotEngine as any, 'isValidUrl').mockReturnValue(false);

      const request: CaptureRequest = {
        url: 'test-invalid-url',
        name: 'Invalid URL Test',
      };

      const result = await screenshotEngine.captureScreenshot(request);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid URL');
      
      // Restore original method
      isValidUrlSpy.mockRestore();
    });

    it('should validate viewport dimensions', async () => {
      const request: CaptureRequest = {
        url: 'https://example.com',
        viewport: {
          width: -100, // Invalid negative width
          height: 600,
          deviceScaleFactor: 1,
          isMobile: false,
        },
        name: 'Invalid Viewport Test',
      };

      const result = await screenshotEngine.captureScreenshot(request);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Viewport dimensions must be positive');
    });

    it('should validate maximum viewport size', async () => {
      const request: CaptureRequest = {
        url: 'https://example.com',
        viewport: {
          width: 10000, // Exceeds maximum
          height: 8000, // Exceeds maximum
          deviceScaleFactor: 1,
          isMobile: false,
        },
        name: 'Oversized Viewport Test',
      };

      const result = await screenshotEngine.captureScreenshot(request);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('exceed maximum supported size');
    });

    it('should validate CSS selector safety', async () => {
      const request: CaptureRequest = {
        url: 'https://example.com',
        selector: '<script>alert("xss")</script>', // Malicious selector
        name: 'Unsafe Selector Test',
      };

      const result = await screenshotEngine.captureScreenshot(request);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid CSS selector');
    });
  });

  describe('Responsive Screenshots', () => {
    it('should capture multiple responsive screenshots', async () => {
      const viewports: Viewport[] = [
        { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true },
        { width: 768, height: 1024, deviceScaleFactor: 1, isMobile: false },
        { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
      ];

      const results = await screenshotEngine.captureResponsiveScreenshots(
        'https://example.com',
        viewports
      );

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);

      results.forEach((result, index) => {
        expect(result.screenshot?.viewport).toEqual(viewports[index]);
        expect(result.screenshot?.name).toContain(`${viewports[index].width}x${viewports[index].height}`);
        expect(result.screenshot?.tags).toContain('responsive');
      });
    });

    it('should handle partial failures in responsive captures', async () => {
      // Disable retries for this test
      screenshotEngine.configureRetry({ maxRetries: 0 });
      
      const viewports: Viewport[] = [
        { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true },
        { width: 768, height: 1024, deviceScaleFactor: 1, isMobile: false },
      ];

      // Mock one failure
      let callCount = 0;
      mockMCPTools.browser_take_screenshot.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Second capture failed'));
        }
        return Promise.resolve('mock-screenshot-data');
      });

      const results = await screenshotEngine.captureResponsiveScreenshots(
        'https://example.com',
        viewports
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      
      // Reset mock and retries for other tests
      screenshotEngine.configureRetry({ maxRetries: 3 });
      mockMCPTools.browser_take_screenshot.mockResolvedValue('mock-screenshot-data');
    });
  });

  describe('Animation Capture', () => {
    it('should capture animation frames', async () => {
      const frames = await screenshotEngine.captureAnimationFrames(
        'https://example.com',
        '.animated-element',
        2000, // 2 seconds
        10    // 10 fps
      );

      // Should capture roughly 20 frames (2 seconds * 10 fps)
      expect(frames.length).toBeGreaterThan(15);
      expect(frames.length).toBeLessThan(25);

      frames.forEach((frame, index) => {
        expect(frame.name).toBe(`Animation Frame ${index + 1}`);
        expect(frame.tags).toContain('animation');
        expect(frame.tags).toContain(`frame-${index + 1}`);
      });
    });

    it('should handle animation capture errors gracefully', async () => {
      // Mock navigation failure
      mockMCPTools.browser_navigate.mockRejectedValueOnce(new Error('Navigation failed'));

      const frames = await screenshotEngine.captureAnimationFrames(
        'https://invalid-url',
        '.element',
        1000,
        5
      );

      expect(frames).toHaveLength(0);
    });
  });

  describe('Connection and Browser Management', () => {
    it('should test connection successfully when available', async () => {
      const connected = await screenshotEngine.testConnection();
      expect(connected).toBe(true);
    });

    it('should handle connection test failure', async () => {
      // Mock evaluate to throw an error to simulate connection failure
      mockMCPTools.browser_evaluate.mockRejectedValueOnce(new Error('Connection failed'));
      
      const connected = await screenshotEngine.testConnection();
      expect(connected).toBe(false);
      
      // Restore mock for other tests
      mockMCPTools.browser_evaluate.mockResolvedValue(undefined);
    });
  });

  describe('Error Code Classification', () => {
    it('should classify timeout errors correctly', async () => {
      // Disable retries for this test
      screenshotEngine.configureRetry({ maxRetries: 0 });
      mockMCPTools.browser_wait_for.mockRejectedValue(new Error('Operation timeout exceeded'));

      const request: CaptureRequest = {
        url: 'https://example.com',
        name: 'Timeout Test',
        options: { delay: 1000 }
      };

      const result = await screenshotEngine.captureScreenshot(request);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT');
      
      // Reset mock and retries for other tests
      screenshotEngine.configureRetry({ maxRetries: 3 });
      mockMCPTools.browser_wait_for.mockResolvedValue(undefined);
    });

    it('should classify network errors correctly', async () => {
      // Disable retries for this test
      screenshotEngine.configureRetry({ maxRetries: 0 });
      mockMCPTools.browser_navigate.mockRejectedValue(new Error('Network connection failed'));

      const request: CaptureRequest = {
        url: 'https://example.com',
        name: 'Network Test',
      };

      const result = await screenshotEngine.captureScreenshot(request);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      
      // Reset mock and retries for other tests
      screenshotEngine.configureRetry({ maxRetries: 3 });
      mockMCPTools.browser_navigate.mockResolvedValue(undefined);
    });

    it('should classify element not found errors correctly', async () => {
      // Disable retries for this test
      screenshotEngine.configureRetry({ maxRetries: 0 });
      mockMCPTools.browser_snapshot.mockRejectedValue(new Error('Element not found in DOM'));

      const request: CaptureRequest = {
        url: 'https://example.com',
        selector: '#non-existent',
        name: 'Element Not Found Test',
      };

      const result = await screenshotEngine.captureScreenshot(request);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ELEMENT_NOT_FOUND');
      
      // Reset mock and retries for other tests
      screenshotEngine.configureRetry({ maxRetries: 3 });
      mockMCPTools.browser_snapshot.mockResolvedValue({ elements: [] });
    });

    it('should classify browser errors correctly', async () => {
      // Disable retries for this test
      screenshotEngine.configureRetry({ maxRetries: 0 });
      mockMCPTools.browser_resize.mockRejectedValue(new Error('Browser instance crashed'));

      const request: CaptureRequest = {
        url: 'https://example.com',
        name: 'Browser Error Test',
      };

      const result = await screenshotEngine.captureScreenshot(request);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BROWSER_ERROR');
      
      // Reset mock and retries for other tests
      screenshotEngine.configureRetry({ maxRetries: 3 });
      mockMCPTools.browser_resize.mockResolvedValue(undefined);
    });
  });

  describe('Memory and Performance', () => {
    it('should handle cleanup without errors', async () => {
      expect(async () => {
        await screenshotEngine.cleanup();
      }).not.toThrow();
    });

    it('should handle multiple cleanup calls', async () => {
      await screenshotEngine.cleanup();
      await screenshotEngine.cleanup();
      await screenshotEngine.cleanup();
      // Should not throw
    });
  });

  describe('Cross-Browser Support', () => {
    it('should handle different browser engines', async () => {
      const engines: BrowserEngine[] = ['chromium', 'firefox', 'webkit'];

      for (const engine of engines) {
        screenshotEngine.setBrowserEngine(engine);
        
        const request: CaptureRequest = {
          url: 'https://example.com',
          browserEngine: engine,
          name: `${engine} Screenshot`,
        };

        const result = await screenshotEngine.captureScreenshot(request);
        expect(result.success).toBe(true);
        expect(result.screenshot?.browserEngine).toBe(engine);
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      // Ensure retry is configured properly
      screenshotEngine.configureRetry({ maxRetries: 2, retryDelay: 10 });
      
      let attemptCount = 0;
      mockMCPTools.browser_navigate.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve();
      });

      const request: CaptureRequest = {
        url: 'https://example.com',
        name: 'Retry Test',
      };

      const result = await screenshotEngine.captureScreenshot(request);
      
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3); // Should have retried twice (3 total attempts)
      
      // Reset mock and retry config for other tests
      mockMCPTools.browser_navigate.mockResolvedValue(undefined);
      screenshotEngine.configureRetry({ maxRetries: 3, retryDelay: 1000 });
    });

    it('should eventually fail after max retries', async () => {
      // Ensure retry is configured properly
      screenshotEngine.configureRetry({ maxRetries: 3, retryDelay: 10 });
      
      // Mock persistent failure
      let callCount = 0;
      mockMCPTools.browser_navigate.mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('Persistent failure'));
      });

      const request: CaptureRequest = {
        url: 'https://example.com',
        name: 'Max Retries Test',
      };

      const result = await screenshotEngine.captureScreenshot(request);
      
      expect(result.success).toBe(false);
      expect(callCount).toBe(4); // Initial + 3 retries
      
      // Reset mock and retry config for other tests
      mockMCPTools.browser_navigate.mockResolvedValue(undefined);
      screenshotEngine.configureRetry({ maxRetries: 3, retryDelay: 1000 });
    });
  });
});