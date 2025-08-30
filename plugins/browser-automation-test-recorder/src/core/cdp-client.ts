/**
 * Chrome DevTools Protocol (CDP) Client
 * Provides low-level browser automation capabilities
 */

import type {
  CDPDOMNode,
  CDPRemoteObject,
  ScreenshotOptions,
  ScreenshotInfo,
  NetworkRequest,
  ConsoleMessage,
  ConnectionOptions,
} from '../types';

/**
 * CDP message structure
 */
interface CDPMessage {
  id: number;
  method: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * CDP event structure
 */
interface CDPEvent {
  method: string;
  params: any;
}

/**
 * Chrome DevTools Protocol client for advanced browser automation
 */
export class CDPClient {
  private websocket: WebSocket | null = null;
  private messageId = 1;
  private pendingMessages = new Map<number, { resolve: (value?: any) => void; reject: (reason?: any) => void; method: string }>();
  private eventListeners = new Map<string, ((data: unknown) => void)[]>();
  private isConnected = false;
  private connectionOptions: ConnectionOptions = {};
  
  // Session state
  private sessionId: string | null = null;
  private targetId: string | null = null;
  
  // Feature flags
  private enabledDomains = new Set<string>();
  
  constructor() {
    this.setupEventListeners();
  }

  /**
   * Connect to Chrome DevTools Protocol endpoint
   */
  async connect(options: ConnectionOptions = {}): Promise<void> {
    this.connectionOptions = {
      host: 'localhost',
      port: 9222,
      secure: false,
      timeout: 30000,
      ...options,
    };

    // Get available targets
    const targets = await this.getTargets();
    const pageTarget = targets.find(target => target.type === 'page') || targets[0];
    
    if (!pageTarget) {
      throw new Error('No suitable target found');
    }

    this.targetId = pageTarget.id;
    
    // Connect to WebSocket
    const wsUrl = `${protocol}://${this.connectionOptions.host}:${this.connectionOptions.port}/devtools/page/${pageTarget.id}`;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('CDP connection timeout'));
      }, this.connectionOptions.timeout);

      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        clearTimeout(timeout);
        this.isConnected = true;
        // // console.log('CDPClient: Connected to DevTools Protocol');
        resolve();
      };

      this.websocket.onerror = (_error) => {
        clearTimeout(timeout);
        // // // console.error('CDPClient: WebSocket error:', error);
        reject(new Error('Failed to connect to CDP'));
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.websocket.onclose = () => {
        this.isConnected = false;
        this.cleanup();
        // // // console.log('CDPClient: Connection closed');
      };
    });
  }

  /**
   * Disconnect from CDP
   */
  async disconnect(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
    }
    this.cleanup();
  }

  /**
   * Check if connected to CDP
   */
  isConnectedToCDP(): boolean {
    return this.isConnected && this.websocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Enable DOM domain for element interaction
   */
  async enableDOM(): Promise<void> {
    if (!this.enabledDomains.has('DOM')) {
      await this.sendCommand('DOM.enable');
      await this.sendCommand('DOM.getDocument');
      this.enabledDomains.add('DOM');
    }
  }

  /**
   * Enable Runtime domain for JavaScript execution
   */
  async enableRuntime(): Promise<void> {
    if (!this.enabledDomains.has('Runtime')) {
      await this.sendCommand('Runtime.enable');
      this.enabledDomains.add('Runtime');
    }
  }

  /**
   * Enable Network domain for request monitoring
   */
  async enableNetwork(): Promise<void> {
    if (!this.enabledDomains.has('Network')) {
      await this.sendCommand('Network.enable');
      this.enabledDomains.add('Network');
    }
  }

  /**
   * Enable Page domain for navigation and screenshots
   */
  async enablePage(): Promise<void> {
    if (!this.enabledDomains.has('Page')) {
      await this.sendCommand('Page.enable');
      this.enabledDomains.add('Page');
    }
  }

  /**
   * Take screenshot of current page
   */
  async takeScreenshot(options: ScreenshotOptions = {}): Promise<ScreenshotInfo> {
    await this.enablePage();

    const params: any = {
      format: options.format || 'png',
      quality: options.quality || 80,
      optimizeForSpeed: true,
    };

    if (options.fullPage) {
      // Get page metrics for full page screenshot
      const metrics = await this.sendCommand('Page.getLayoutMetrics');
      params.clip = {
        x: 0,
        y: 0,
        width: metrics.contentSize.width,
        height: metrics.contentSize.height,
        scale: 1,
      };
    } else if (options.clip) {
      params.clip = options.clip;
    }

    if (options.omitBackground) {
      params.omitBackground = true;
    }

    const result = await this.sendCommand('Page.captureScreenshot', params);
    
    const screenshot: ScreenshotInfo = {
      id: `screenshot_${Date.now()}`,
      format: options.format || 'png',
      quality: options.quality,
      fullPage: !!options.fullPage,
      element: options.element,
      data: result.data,
      size: result.data.length,
      dimensions: {
        width: params.clip?.width || window.innerWidth,
        height: params.clip?.height || window.innerHeight,
      },
    };

    return screenshot;
  }

  /**
   * Find element by selector
   */
  async findElement(selector: string): Promise<CDPRemoteObject | null> {
    await this.enableDOM();
    await this.enableRuntime();

    try {
      // Use querySelector to find element
      const result = await this.sendCommand('Runtime.evaluate', {
        expression: `document.querySelector('${selector.replace(/'/g, "\\'")}')`,
        returnByValue: false,
        awaitPromise: false,
      });

      if (result.result.type === 'object' && result.result.subtype === 'node') {
        return result.result;
      }

      return null;
    } catch {
      // // console.error('CDPClient: Error finding element');
      return null;
    }
  }

  /**
   * Get DOM node information
   */
  async getNodeInfo(nodeId: number): Promise<CDPDOMNode | null> {
    await this.enableDOM();

    try {
      const result = await this.sendCommand('DOM.describeNode', {
        nodeId,
        depth: 1,
        pierce: true,
      });

      return result.node;
    } catch {
      // // console.error('CDPClient: Error getting node info');
      return null;
    }
  }

  /**
   * Highlight element on page
   */
  async highlightElement(selector: string): Promise<void> {
    await this.enableDOM();

    try {
      // Find element
      const element = await this.findElement(selector);
      if (!element || !element.objectId) {
        // // console.warn('CDPClient: Element not found for highlighting:', selector);
        return;
      }

      // Get node ID
      const nodeResult = await this.sendCommand('DOM.requestNode', {
        objectId: element.objectId,
      });

      // Highlight the node
      await this.sendCommand('DOM.highlightNode', {
        nodeId: nodeResult.nodeId,
        highlightConfig: {
          showInfo: true,
          showRulers: false,
          showExtensionLines: false,
          contentColor: { r: 135, g: 206, b: 235, a: 0.3 },
          borderColor: { r: 0, g: 123, b: 255, a: 1 },
        },
      });

      // Auto-hide highlight after 3 seconds
      setTimeout(async () => {
        try {
          await this.sendCommand('DOM.hideHighlight');
        } catch {
          // Ignore errors when hiding highlight
        }
      }, 3000);

    } catch {
      // // console.error('CDPClient: Error highlighting element');
    }
  }

  /**
   * Execute JavaScript in page context
   */
  async executeScript(script: string, returnByValue: boolean = true): Promise<any> {
    await this.enableRuntime();

    const result = await this.sendCommand('Runtime.evaluate', {
      expression: script,
      returnByValue,
      awaitPromise: true,
      userGesture: true,
    });

    if (result.exceptionDetails) {
      throw new Error(`Script execution failed: ${result.exceptionDetails.text}`);
    }

    return returnByValue ? result.result.value : result.result;
  }

  /**
   * Navigate to URL
   */
  async navigate(url: string): Promise<void> {
    await this.enablePage();

    await this.sendCommand('Page.navigate', { url });

    // Wait for navigation to complete
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Navigation timeout'));
      }, 30000);

      const onLoadEventFired = () => {
        clearTimeout(timeout);
        this.removeEventListener('Page.loadEventFired', onLoadEventFired);
        resolve();
      };

      this.addEventListener('Page.loadEventFired', onLoadEventFired);
    });
  }

  /**
   * Wait for element to appear
   */
  async waitForElement(selector: string, timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = await this.findElement(selector);
      if (element) {
        return true;
      }
      await this.sleep(100);
    }

    return false;
  }

  /**
   * Get network requests
   */
  async getNetworkRequests(): Promise<NetworkRequest[]> {
    // This would be implemented with Network domain events
    // For now, return empty array
    return [];
  }

  /**
   * Get console messages
   */
  async getConsoleMessages(): Promise<ConsoleMessage[]> {
    // This would be implemented with Runtime.consoleAPICalled events
    // For now, return empty array
    return [];
  }

  /**
   * Add event listener for CDP events
   */
  addEventListener(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Send CDP command
   */
  private async sendCommand(method: string, params?: any): Promise<any> {
    if (!this.isConnectedToCDP()) {
      throw new Error('Not connected to CDP');
    }

    const id = this.messageId++;
    const message: CDPMessage = { id, method };
    
    if (params) {
      message.params = params;
    }

    return new Promise((resolve, reject) => {
      // Store pending message
      this.pendingMessages.set(id, { resolve, reject, method });

      // Set timeout
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(id);
        reject(new Error(`CDP command timeout: ${method}`));
      }, 10000);

      // Send message
      this.websocket!.send(JSON.stringify(message));

      // Clear timeout when resolved
      const originalResolve = resolve;
      const originalReject = reject;
      
      this.pendingMessages.set(id, {
        resolve: (result: any) => {
          clearTimeout(timeout);
          originalResolve(result);
        },
        reject: (error: any) => {
          clearTimeout(timeout);
          originalReject(error);
        },
        method,
      });
    });
  }

  /**
   * Handle incoming CDP message
   */
  private handleMessage(message: CDPMessage | CDPEvent): void {
    if ('id' in message) {
      // Response to command
      const pending = this.pendingMessages.get(message.id);
      if (pending) {
        this.pendingMessages.delete(message.id);
        
        if (message.error) {
          pending.reject(new Error(`CDP Error: ${message.error.message}`));
        } else {
          pending.resolve(message.result);
        }
      }
    } else {
      // Event notification
      const listeners = this.eventListeners.get(message.method);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(message.params);
          } catch {
            // // console.error('CDPClient: Error in event listener:', error);
          }
        });
      }
    }
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners(): void {
    // Handle console messages
    this.addEventListener('Runtime.consoleAPICalled', (_params: any) => {
      // // console.log('CDP Console:', params);
    });

    // Handle JavaScript exceptions
    this.addEventListener('Runtime.exceptionThrown', (_params: any) => {
      // // console.error('CDP Exception:', params.exceptionDetails);
    });

    // Handle network events
    this.addEventListener('Network.requestWillBeSent', (_params: any) => {
      // // console.log('CDP Network Request:', params.request.url);
    });
  }

  /**
   * Get available targets
   */
  private async getTargets(): Promise<Array<{ id: string; type: string; url: string; title: string }>> {
    const response = await fetch(`http://${this.connectionOptions.host}:${this.connectionOptions.port}/json`);
    
    if (!response.ok) {
      throw new Error('Failed to get CDP targets');
    }
    
    return response.json();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Reject all pending messages
    for (const [_id, pending] of this.pendingMessages) {
      pending.reject(new Error('CDP connection closed'));
    }
    this.pendingMessages.clear();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Reset state
    this.isConnected = false;
    this.sessionId = null;
    this.targetId = null;
    this.enabledDomains.clear();
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}