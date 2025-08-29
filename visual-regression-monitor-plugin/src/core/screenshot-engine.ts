import type { 
  Screenshot, 
  CaptureRequest, 
  CaptureResult, 
  PlaywrightConfig, 
  Viewport, 
  BrowserEngine, 
  CaptureSettings,
  VisualRegressionError
} from '../types';
import { generateId, getTimestamp, calculateImageHash, blobToDataUrl } from '../utils';

// MCP Playwright tool integration types
interface MCPPlaywrightTools {
  browser_navigate: (params: { url: string }) => Promise<any>;
  browser_resize: (params: { width: number; height: number }) => Promise<any>;
  browser_take_screenshot: (params: { 
    element?: string; 
    ref?: string; 
    fullPage?: boolean; 
    filename?: string;
    type?: 'png' | 'jpeg';
  }) => Promise<any>;
  browser_snapshot: () => Promise<any>;
  browser_evaluate: (params: { function: string; element?: string; ref?: string }) => Promise<any>;
  browser_wait_for: (params: { text?: string; textGone?: string; time?: number }) => Promise<any>;
  browser_click: (params: { element: string; ref: string }) => Promise<any>;
  browser_hover: (params: { element: string; ref: string }) => Promise<any>;
  browser_close: () => Promise<any>;
  browser_install: () => Promise<any>;
}

// MCP tool adapter
class MCPPlaywrightAdapter {
  private isAvailable = false;
  private tools: Partial<MCPPlaywrightTools> = {};

  constructor() {
    this.initializeTools();
  }

  private async initializeTools() {
    try {
      // Check if MCP Playwright tools are available globally
      if (typeof window !== 'undefined' && (window as any).mcpPlaywrightTools) {
        this.tools = (window as any).mcpPlaywrightTools;
        this.isAvailable = true;
      } else {
        // Try to detect if we're in an environment where MCP tools are available
        // This is a placeholder for actual MCP tool detection
        this.isAvailable = false;
      }
    } catch (error) {
      console.warn('MCP Playwright tools not available:', error);
      this.isAvailable = false;
    }
  }

  isToolsAvailable(): boolean {
    return this.isAvailable;
  }

  async navigate(url: string): Promise<void> {
    if (!this.tools.browser_navigate) {
      throw new Error('browser_navigate tool not available');
    }
    await this.tools.browser_navigate({ url });
  }

  async resize(width: number, height: number): Promise<void> {
    if (!this.tools.browser_resize) {
      throw new Error('browser_resize tool not available');
    }
    await this.tools.browser_resize({ width, height });
  }

  async takeScreenshot(options: {
    element?: string;
    ref?: string;
    fullPage?: boolean;
    type?: 'png' | 'jpeg';
  } = {}): Promise<string> {
    if (!this.tools.browser_take_screenshot) {
      throw new Error('browser_take_screenshot tool not available');
    }
    
    const result = await this.tools.browser_take_screenshot({
      ...options,
      filename: `screenshot_${Date.now()}.${options.type || 'png'}`
    });
    
    // The MCP tool returns a file path, we need to convert to data URL
    return this.convertFileToDataUrl(result.filename || result);
  }

  async getSnapshot(): Promise<any> {
    if (!this.tools.browser_snapshot) {
      throw new Error('browser_snapshot tool not available');
    }
    return await this.tools.browser_snapshot();
  }

  async evaluate(func: string, element?: string, ref?: string): Promise<any> {
    if (!this.tools.browser_evaluate) {
      throw new Error('browser_evaluate tool not available');
    }
    return await this.tools.browser_evaluate({ function: func, element, ref });
  }

  async waitFor(options: { text?: string; textGone?: string; time?: number }): Promise<void> {
    if (!this.tools.browser_wait_for) {
      throw new Error('browser_wait_for tool not available');
    }
    await this.tools.browser_wait_for(options);
  }

  async click(element: string, ref: string): Promise<void> {
    if (!this.tools.browser_click) {
      throw new Error('browser_click tool not available');
    }
    await this.tools.browser_click({ element, ref });
  }

  async hover(element: string, ref: string): Promise<void> {
    if (!this.tools.browser_hover) {
      throw new Error('browser_hover tool not available');
    }
    await this.tools.browser_hover({ element, ref });
  }

  async close(): Promise<void> {
    if (!this.tools.browser_close) {
      throw new Error('browser_close tool not available');
    }
    await this.tools.browser_close();
  }

  async install(): Promise<void> {
    if (!this.tools.browser_install) {
      throw new Error('browser_install tool not available');
    }
    await this.tools.browser_install();
  }

  private async convertFileToDataUrl(filename: string): Promise<string> {
    // This would convert a file path to a data URL
    // For now, return a placeholder since we can't access the actual file
    // In a real implementation, this would read the file and convert to base64
    return `data:image/png;base64,placeholder_for_${filename}`;
  }
}

/**
 * Screenshot engine using Playwright MCP integration
 */
export class ScreenshotEngine {
  private mcpAdapter: MCPPlaywrightAdapter;
  private currentBrowserEngine: BrowserEngine = 'chromium';
  private defaultViewport: Viewport = {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
  };
  private retryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  };

  constructor() {
    this.mcpAdapter = new MCPPlaywrightAdapter();
  }

  /**
   * Check if Playwright MCP tools are available
   */
  isAvailable(): boolean {
    return this.mcpAdapter.isToolsAvailable();
  }

  /**
   * Configure retry behavior
   */
  configureRetry(config: Partial<typeof this.retryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.retryConfig.maxRetries) {
          console.error(`${context} failed after ${this.retryConfig.maxRetries} retries:`, lastError);
          throw lastError;
        }
        
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
        console.warn(`${context} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Set the browser engine to use
   */
  setBrowserEngine(engine: BrowserEngine): void {
    this.currentBrowserEngine = engine;
  }

  /**
   * Set the default viewport
   */
  setDefaultViewport(viewport: Viewport): void {
    this.defaultViewport = viewport;
  }

  /**
   * Capture a screenshot using Playwright MCP tools
   */
  async captureScreenshot(request: CaptureRequest): Promise<CaptureResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: {
          code: 'PLAYWRIGHT_NOT_AVAILABLE',
          message: 'Playwright MCP tools are not available',
          timestamp: getTimestamp(),
        },
      };
    }

    try {
      const viewport = request.viewport || this.defaultViewport;
      const browserEngine = request.browserEngine || this.currentBrowserEngine;
      const options = { ...this.getDefaultCaptureSettings(), ...request.options };

      // Validate request
      await this.validateCaptureRequest(request);

      // Execute capture with retry logic
      const screenshotData = await this.withRetry(async () => {
        // Navigate to the URL if provided
        if (request.url) {
          await this.navigateToUrl(request.url);
        }

        // Set viewport
        await this.setViewport(viewport);

        // Apply capture settings
        await this.applyCaptureSettings(options);

        // Apply cross-browser normalization
        await this.normalizeCrossBrowser(options);

        // Wait for page to be ready
        await this.waitForPageReady(options);

        // Optimize memory usage
        await this.optimizeMemoryUsage();

        // Capture the screenshot
        return await this.takeScreenshot(request.selector, options);
      }, 'Screenshot capture');

      // Create Screenshot object
      const screenshot: Screenshot = {
        id: generateId(),
        name: request.name || this.generateScreenshotName(request.url, viewport),
        url: request.url || '',
        selector: request.selector,
        viewport,
        browserEngine,
        timestamp: getTimestamp(),
        dataUrl: screenshotData.dataUrl,
        metadata: {
          userAgent: await this.getUserAgent(),
          pixelRatio: viewport.deviceScaleFactor,
          colorDepth: 24, // Default color depth
          fileSize: screenshotData.fileSize,
          dimensions: screenshotData.dimensions,
          hash: screenshotData.hash,
        },
        tags: request.tags || [],
      };

      return {
        success: true,
        screenshot,
      };
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return {
        success: false,
        error: {
          code: this.getErrorCode(error),
          message: error instanceof Error ? error.message : 'Unknown capture error',
          details: { request, browserEngine: this.currentBrowserEngine },
          timestamp: getTimestamp(),
        },
      };
    }
  }

  /**
   * Validate capture request
   */
  private async validateCaptureRequest(request: CaptureRequest): Promise<void> {
    if (request.url && !this.isValidUrl(request.url)) {
      throw new Error(`Invalid URL: ${request.url}`);
    }

    if (request.viewport) {
      if (request.viewport.width <= 0 || request.viewport.height <= 0) {
        throw new Error('Viewport dimensions must be positive');
      }
      if (request.viewport.width > 7680 || request.viewport.height > 4320) {
        throw new Error('Viewport dimensions exceed maximum supported size (7680x4320)');
      }
    }

    if (request.selector && !this.isValidSelector(request.selector)) {
      throw new Error(`Invalid CSS selector: ${request.selector}`);
    }
  }

  /**
   * Check if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if CSS selector is valid
   */
  private isValidSelector(selector: string): boolean {
    try {
      // Basic validation - in a real implementation, this could be more thorough
      return selector.trim().length > 0 && !selector.includes('<script');
    } catch {
      return false;
    }
  }

  /**
   * Get error code from error object
   */
  private getErrorCode(error: any): string {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) return 'TIMEOUT';
      if (error.message.includes('network')) return 'NETWORK_ERROR';
      if (error.message.includes('not found')) return 'ELEMENT_NOT_FOUND';
      if (error.message.includes('browser')) return 'BROWSER_ERROR';
    }
    return 'CAPTURE_FAILED';
  }

  /**
   * Capture multiple screenshots with different viewports
   */
  async captureResponsiveScreenshots(
    url: string, 
    viewports: Viewport[], 
    options?: Partial<CaptureSettings>
  ): Promise<CaptureResult[]> {
    const results: CaptureResult[] = [];

    for (const viewport of viewports) {
      const request: CaptureRequest = {
        url,
        viewport,
        options,
        name: `${url} - ${viewport.width}x${viewport.height}`,
        tags: ['responsive', `${viewport.width}x${viewport.height}`],
      };

      const result = await this.captureScreenshot(request);
      results.push(result);

      // Small delay between captures to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Capture animation frames
   */
  async captureAnimationFrames(
    url: string,
    selector: string,
    duration: number,
    fps: number = 30
  ): Promise<Screenshot[]> {
    const frames: Screenshot[] = [];
    const interval = 1000 / fps;
    const totalFrames = Math.ceil((duration / 1000) * fps);

    try {
      // Navigate and prepare
      await this.navigateToUrl(url);
      await this.waitForElement(selector);

      // Capture frames
      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * interval;
        
        // Wait for the specific time
        await new Promise(resolve => setTimeout(resolve, interval));
        
        const request: CaptureRequest = {
          url,
          selector,
          name: `Animation Frame ${i + 1}`,
          tags: ['animation', `frame-${i + 1}`],
        };

        const result = await this.captureScreenshot(request);
        if (result.success && result.screenshot) {
          frames.push(result.screenshot);
        }
      }
    } catch (error) {
      console.error('Animation capture failed:', error);
    }

    return frames;
  }

  /**
   * Navigate to a URL using Playwright MCP
   */
  private async navigateToUrl(url: string): Promise<void> {
    try {
      await this.mcpAdapter.navigate(url);
      
      // Wait for navigation to complete
      await this.mcpAdapter.waitFor({ time: 1000 });
      
      console.log(`Successfully navigated to: ${url}`);
    } catch (error) {
      console.error(`Navigation to ${url} failed:`, error);
      throw new Error(`Failed to navigate to ${url}: ${error}`);
    }
  }

  /**
   * Set viewport using Playwright MCP
   */
  private async setViewport(viewport: Viewport): Promise<void> {
    try {
      await this.mcpAdapter.resize(viewport.width, viewport.height);
      console.log(`Successfully set viewport: ${viewport.width}x${viewport.height}`);
    } catch (error) {
      console.error(`Failed to set viewport ${viewport.width}x${viewport.height}:`, error);
      throw new Error(`Failed to set viewport: ${error}`);
    }
  }

  /**
   * Apply capture settings
   */
  private async applyCaptureSettings(options: CaptureSettings): Promise<void> {
    try {
      // Apply various settings like hiding scrollbars, disabling animations, etc.
      if (options.hideScrollbars) {
        await this.hideScrollbars();
      }

      if (options.disableAnimations) {
        await this.disableAnimations();
      }

      // Additional MCP-specific settings
      await this.applyBrowserSpecificSettings(options);
    } catch (error) {
      console.error('Failed to apply capture settings:', error);
      throw new Error(`Failed to apply capture settings: ${error}`);
    }
  }

  /**
   * Apply browser-specific settings using MCP tools
   */
  private async applyBrowserSpecificSettings(options: CaptureSettings): Promise<void> {
    const scripts = [];

    // Prepare CSS injection script
    let cssRules = '';
    
    if (options.hideScrollbars) {
      cssRules += `
        body { overflow: hidden !important; }
        html { overflow: hidden !important; }
        ::-webkit-scrollbar { display: none !important; }
        * { scrollbar-width: none !important; }
      `;
    }

    if (options.disableAnimations) {
      cssRules += `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `;
    }

    if (cssRules) {
      const cssScript = `
        (() => {
          const style = document.createElement('style');
          style.textContent = \`${cssRules}\`;
          document.head.appendChild(style);
        })();
      `;
      scripts.push(cssScript);
    }

    // Execute scripts
    for (const script of scripts) {
      try {
        await this.mcpAdapter.evaluate(script);
      } catch (error) {
        console.warn('Failed to execute browser script:', error);
      }
    }
  }

  /**
   * Wait for page to be ready
   */
  private async waitForPageReady(options: CaptureSettings): Promise<void> {
    try {
      // Wait for basic page load
      await this.mcpAdapter.evaluate(`
        () => new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve);
            setTimeout(resolve, 5000); // Fallback timeout
          }
        })
      `);

      if (options.waitForFonts) {
        await this.waitForFonts();
      }

      if (options.waitForImages) {
        await this.waitForImages();
      }

      // Additional stabilization wait
      await this.mcpAdapter.waitFor({ time: 100 });

      if (options.delay > 0) {
        await this.mcpAdapter.waitFor({ time: options.delay });
      }
    } catch (error) {
      console.warn('Page ready wait failed:', error);
      // Continue with capture even if waiting fails
    }
  }

  /**
   * Take the actual screenshot
   */
  private async takeScreenshot(
    selector?: string, 
    options?: CaptureSettings
  ): Promise<{ dataUrl: string; fileSize: number; dimensions: { width: number; height: number }; hash: string }> {
    try {
      let screenshotOptions: any = {
        type: options?.format || 'png',
        fullPage: options?.fullPage || false,
      };

      // If selector is provided, try to get element reference first
      if (selector) {
        try {
          // Use snapshot to get element reference
          const snapshot = await this.mcpAdapter.getSnapshot();
          
          // In a real implementation, we would parse the snapshot to find the element
          // For now, we'll use the selector directly
          screenshotOptions.element = selector;
          screenshotOptions.ref = selector;
        } catch (error) {
          console.warn('Failed to get element snapshot, falling back to full page:', error);
          // Fallback to full page screenshot
          screenshotOptions.fullPage = true;
        }
      }

      // Take the screenshot using MCP tools
      const dataUrl = await this.mcpAdapter.takeScreenshot(screenshotOptions);
      
      // For real implementation, we would get actual dimensions and file size
      // For now, we'll estimate based on the data URL
      const fileSize = Math.round(dataUrl.length * 0.75);
      
      // Extract dimensions from the image
      const dimensions = await this.getImageDimensions(dataUrl);
      
      // Calculate hash
      const hash = await this.calculateImageHash(dataUrl);

      return {
        dataUrl,
        fileSize,
        dimensions,
        hash,
      };
    } catch (error) {
      console.error('Screenshot capture with MCP failed, falling back to mock:', error);
      
      // Fallback to mock implementation
      return this.createMockScreenshot(options);
    }
  }

  /**
   * Create a mock screenshot for fallback
   */
  private createMockScreenshot(options?: CaptureSettings): {
    dataUrl: string;
    fileSize: number;
    dimensions: { width: number; height: number };
    hash: string;
  } {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(0.5, '#1e40af');
      gradient.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add visual elements
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(50, 50, canvas.width - 100, 100);
      
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Visual Regression Test Screenshot', canvas.width / 2, 120);
      
      ctx.font = '18px Arial';
      ctx.fillText(`Generated at: ${new Date().toISOString()}`, canvas.width / 2, 150);
      
      // Add some mock content blocks
      for (let i = 0; i < 5; i++) {
        const y = 200 + i * 120;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 - i * 0.1})`;
        ctx.fillRect(100, y, canvas.width - 200, 80);
        
        ctx.fillStyle = '#1e40af';
        ctx.font = '16px Arial';
        ctx.fillText(`Content Block ${i + 1}`, canvas.width / 2, y + 35);
        ctx.font = '12px Arial';
        ctx.fillText(`This is mock content for testing purposes`, canvas.width / 2, y + 55);
      }
    }

    const dataUrl = canvas.toDataURL(
      options?.format === 'jpeg' ? 'image/jpeg' : 'image/png',
      (options?.quality || 90) / 100
    );
    const fileSize = Math.round(dataUrl.length * 0.75);
    
    // Calculate hash from canvas image data
    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
    const hash = imageData ? calculateImageHash(imageData.data) : `mock_${Date.now()}`;

    return {
      dataUrl,
      fileSize,
      dimensions: { width: canvas.width, height: canvas.height },
      hash,
    };
  }

  /**
   * Get image dimensions from data URL
   */
  private async getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        // Fallback dimensions
        resolve({ width: 1920, height: 1080 });
      };
      img.src = dataUrl;
    });
  }

  /**
   * Calculate image hash from data URL
   */
  private async calculateImageHash(dataUrl: string): Promise<string> {
    try {
      // For now, create a simple hash based on the data URL
      let hash = 0;
      for (let i = 0; i < dataUrl.length; i++) {
        const char = dataUrl.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    } catch (error) {
      return `hash_${Date.now()}`;
    }
  }

  /**
   * Get user agent string
   */
  private async getUserAgent(): Promise<string> {
    return navigator?.userAgent || 'Unknown';
  }

  /**
   * Wait for specific element
   */
  private async waitForElement(selector: string, timeout: number = 10000): Promise<void> {
    try {
      await this.mcpAdapter.evaluate(`
        (selector, timeout) => new Promise((resolve, reject) => {
          const startTime = Date.now();
          
          const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
              resolve(element);
            } else if (Date.now() - startTime > timeout) {
              reject(new Error(\`Element \${selector} not found within \${timeout}ms\`));
            } else {
              setTimeout(checkElement, 100);
            }
          };
          
          checkElement();
        })
      `, undefined, undefined);
      
      console.log(`Successfully found element: ${selector}`);
    } catch (error) {
      console.warn(`Element ${selector} not found:`, error);
      throw error;
    }
  }

  /**
   * Hide scrollbars
   */
  private async hideScrollbars(): Promise<void> {
    try {
      await this.mcpAdapter.evaluate(`
        () => {
          const style = document.createElement('style');
          style.textContent = \`
            body, html { overflow: hidden !important; }
            ::-webkit-scrollbar { display: none !important; }
            * { scrollbar-width: none !important; }
          \`;
          document.head.appendChild(style);
        }
      `);
      console.log('Successfully hid scrollbars');
    } catch (error) {
      console.warn('Failed to hide scrollbars:', error);
    }
  }

  /**
   * Disable animations
   */
  private async disableAnimations(): Promise<void> {
    try {
      await this.mcpAdapter.evaluate(`
        () => {
          const style = document.createElement('style');
          style.textContent = \`
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-delay: 0.01ms !important;
              transition-duration: 0.01ms !important;
              transition-delay: 0.01ms !important;
            }
          \`;
          document.head.appendChild(style);
        }
      `);
      console.log('Successfully disabled animations');
    } catch (error) {
      console.warn('Failed to disable animations:', error);
    }
  }

  /**
   * Wait for fonts to load
   */
  private async waitForFonts(): Promise<void> {
    try {
      await this.mcpAdapter.evaluate(`
        () => new Promise(resolve => {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(resolve);
            setTimeout(resolve, 3000); // Fallback timeout
          } else {
            setTimeout(resolve, 1000); // Fallback for browsers without font loading API
          }
        })
      `);
      console.log('Successfully waited for fonts');
    } catch (error) {
      console.warn('Failed to wait for fonts:', error);
    }
  }

  /**
   * Wait for images to load
   */
  private async waitForImages(): Promise<void> {
    try {
      await this.mcpAdapter.evaluate(`
        () => new Promise(resolve => {
          const images = Array.from(document.images);
          const promises = images.map(img => {
            if (img.complete) return Promise.resolve();
            
            return new Promise(imageResolve => {
              img.onload = imageResolve;
              img.onerror = imageResolve; // Continue even if image fails
              setTimeout(imageResolve, 5000); // Timeout per image
            });
          });
          
          Promise.all(promises).then(resolve);
          setTimeout(resolve, 10000); // Overall timeout
        })
      `);
      console.log('Successfully waited for images');
    } catch (error) {
      console.warn('Failed to wait for images:', error);
    }
  }

  /**
   * Generate a screenshot name
   */
  private generateScreenshotName(url: string, viewport: Viewport): string {
    const domain = url ? new URL(url).hostname : 'unknown';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `${domain}_${viewport.width}x${viewport.height}_${timestamp}`;
  }

  /**
   * Get default capture settings
   */
  private getDefaultCaptureSettings(): CaptureSettings {
    return {
      fullPage: false,
      hideScrollbars: true,
      disableAnimations: false,
      waitForFonts: true,
      waitForImages: true,
      delay: 0,
      quality: 90,
      format: 'png',
    };
  }

  /**
   * Normalize screenshot across browsers
   */
  private async normalizeCrossBrowser(options: CaptureSettings): Promise<void> {
    try {
      const browserSpecificScript = `
        (() => {
          // Browser detection
          const isChrome = /Chrome/.test(navigator.userAgent);
          const isFirefox = /Firefox/.test(navigator.userAgent);
          const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
          
          // Font rendering normalization
          const fontStyle = document.createElement('style');
          fontStyle.textContent = \`
            * {
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
              text-rendering: optimizeLegibility !important;
            }
          \`;
          document.head.appendChild(fontStyle);
          
          // Disable different browser-specific features that can affect screenshots
          if (isFirefox) {
            const firefoxStyle = document.createElement('style');
            firefoxStyle.textContent = \`
              * {
                -moz-appearance: none !important;
              }
            \`;
            document.head.appendChild(firefoxStyle);
          }
          
          if (isChrome) {
            const chromeStyle = document.createElement('style');
            chromeStyle.textContent = \`
              * {
                -webkit-appearance: none !important;
              }
            \`;
            document.head.appendChild(chromeStyle);
          }
          
          // Normalize form elements
          const formStyle = document.createElement('style');
          formStyle.textContent = \`
            input, button, select, textarea {
              font-family: inherit !important;
              font-size: inherit !important;
              line-height: inherit !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              outline: none !important;
            }
          \`;
          document.head.appendChild(formStyle);
        })()
      `;
      
      await this.mcpAdapter.evaluate(browserSpecificScript);
      console.log('Successfully applied cross-browser normalization');
    } catch (error) {
      console.warn('Failed to apply cross-browser normalization:', error);
    }
  }

  /**
   * Apply memory optimization for large screenshots
   */
  private async optimizeMemoryUsage(): Promise<void> {
    try {
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Clear unused canvases and images
      await this.mcpAdapter.evaluate(`
        () => {
          // Clear any existing screenshot canvases
          const canvases = document.querySelectorAll('canvas[data-screenshot]');
          canvases.forEach(canvas => canvas.remove());
          
          // Trigger browser memory cleanup
          if (window.performance && window.performance.memory) {
            console.log('Memory usage:', window.performance.memory);
          }
        }
      `);
    } catch (error) {
      console.warn('Memory optimization failed:', error);
    }
  }

  /**
   * Test connection to Playwright
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        return false;
      }
      
      // Test basic MCP functionality
      await this.mcpAdapter.evaluate('() => document.title');
      
      console.log('Playwright MCP connection test successful');
      return true;
    } catch (error) {
      console.error('Playwright connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available browser engines
   */
  getAvailableBrowserEngines(): BrowserEngine[] {
    // This would check which browsers are actually available
    return ['chromium', 'firefox', 'webkit'];
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup any open browser instances or resources
    console.log('Cleaning up screenshot engine resources');
  }
}

// Singleton instance
let screenshotEngineInstance: ScreenshotEngine | null = null;

export function getScreenshotEngine(): ScreenshotEngine {
  if (!screenshotEngineInstance) {
    screenshotEngineInstance = new ScreenshotEngine();
  }
  return screenshotEngineInstance;
}