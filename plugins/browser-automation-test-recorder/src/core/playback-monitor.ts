/**
 * Playback Monitoring and Error Handling System
 * Provides real-time monitoring, error recovery, and performance metrics
 */

import type {
  RecordedEvent,
  EventExecutionResult,
  PlaybackError,
  PlaybackStatus as _PlaybackStatus,
  ScreenshotInfo,
  NetworkRequest,
  ConsoleMessage,
  PerformanceInfo,
} from '../types';

/**
 * Performance metrics for playback monitoring
 */
export interface PlaybackMetrics {
  // Execution metrics
  totalEvents: number;
  completedEvents: number;
  failedEvents: number;
  skippedEvents: number;
  
  // Timing metrics
  totalExecutionTime: number;
  averageEventTime: number;
  minEventTime: number;
  maxEventTime: number;
  
  // Error metrics
  errorRate: number;
  recoveryRate: number;
  criticalErrors: number;
  
  // Performance metrics
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  
  // Reliability metrics
  selectorSuccessRate: number;
  healingSuccessRate: number;
  retryCount: number;
}

/**
 * Real-time monitoring event
 */
export interface MonitoringEvent {
  type: 'event-start' | 'event-complete' | 'event-error' | 'performance' | 'screenshot' | 'recovery';
  timestamp: number;
  data: any;
  eventId?: string;
  duration?: number;
  error?: PlaybackError;
}

/**
 * Error recovery strategy
 */
export interface RecoveryStrategy {
  name: string;
  condition: (error: PlaybackError, context: any) => boolean;
  action: (error: PlaybackError, context: any) => Promise<boolean>;
  maxAttempts: number;
  priority: number;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  // Metrics collection
  collectPerformance: boolean;
  collectNetwork: boolean;
  collectConsole: boolean;
  collectScreenshots: boolean;
  
  // Screenshot settings
  screenshotInterval: number;
  screenshotOnError: boolean;
  screenshotOnRecovery: boolean;
  
  // Performance monitoring
  performanceInterval: number;
  memoryThreshold: number;
  cpuThreshold: number;
  
  // Error handling
  enableRecovery: boolean;
  maxRecoveryAttempts: number;
  recoveryDelay: number;
  
  // Logging
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  logToConsole: boolean;
  logToFile: boolean;
}

/**
 * Comprehensive playback monitoring system
 */
export class PlaybackMonitor {
  private config: MonitoringConfig;
  private metrics: PlaybackMetrics;
  private monitoringEvents: MonitoringEvent[] = [];
  private errors: PlaybackError[] = [];
  private screenshots: ScreenshotInfo[] = [];
  private networkRequests: NetworkRequest[] = [];
  private consoleMessages: ConsoleMessage[] = [];
  private performanceData: PerformanceInfo[] = [];
  
  // Recovery strategies
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  
  // Real-time monitoring
  private monitoringInterval: NodeJS.Timeout | null = null;
  private performanceInterval: NodeJS.Timeout | null = null;
  
  // Event listeners
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  
  // State tracking
  private startTime: number = 0;
  private isMonitoring: boolean = false;
  private currentEventId: string | null = null;
  
  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      collectPerformance: true,
      collectNetwork: true,
      collectConsole: true,
      collectScreenshots: false,
      screenshotInterval: 5000,
      screenshotOnError: true,
      screenshotOnRecovery: true,
      performanceInterval: 1000,
      memoryThreshold: 100 * 1024 * 1024, // 100MB
      cpuThreshold: 80, // 80%
      enableRecovery: true,
      maxRecoveryAttempts: 3,
      recoveryDelay: 1000,
      logLevel: 'info',
      logToConsole: true,
      logToFile: false,
      ...config,
    };
    
    this.metrics = this.initializeMetrics();
    this.setupRecoveryStrategies();
  }

  /**
   * Start monitoring playback session
   */
  startMonitoring(totalEvents: number): void {
    this.startTime = Date.now();
    this.isMonitoring = true;
    this.metrics = this.initializeMetrics();
    this.metrics.totalEvents = totalEvents;
    
    this.log('info', `Starting playback monitoring for ${totalEvents} events`);
    this.emitEvent('monitoring-started', { totalEvents });
    
    // Start performance monitoring
    if (this.config.collectPerformance) {
      this.startPerformanceMonitoring();
    }
    
    // Start screenshot monitoring
    if (this.config.collectScreenshots) {
      this.startScreenshotMonitoring();
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }
    
    this.calculateFinalMetrics();
    this.log('info', 'Playback monitoring stopped');
    this.emitEvent('monitoring-stopped', { metrics: this.metrics });
  }

  /**
   * Record event execution start
   */
  recordEventStart(event: RecordedEvent): void {
    this.currentEventId = event.id;
    
    const monitoringEvent: MonitoringEvent = {
      type: 'event-start',
      timestamp: Date.now(),
      eventId: event.id,
      data: {
        type: event.type,
        selector: event.target.selector,
        sequence: event.sequence,
      },
    };
    
    this.monitoringEvents.push(monitoringEvent);
    this.log('debug', `Event started: ${event.type} (${event.id})`);
    this.emitEvent('event-started', monitoringEvent);
  }

  /**
   * Record event execution completion
   */
  recordEventComplete(
    event: RecordedEvent,
    result: EventExecutionResult
  ): void {
    const monitoringEvent: MonitoringEvent = {
      type: 'event-complete',
      timestamp: Date.now(),
      eventId: event.id,
      duration: result.duration,
      data: {
        success: result.success,
        error: result.error,
        assertions: result.assertions,
      },
    };
    
    this.monitoringEvents.push(monitoringEvent);
    
    // Update metrics
    if (result.success) {
      this.metrics.completedEvents++;
    } else {
      this.metrics.failedEvents++;
    }
    
    this.updateTimingMetrics(result.duration);
    
    this.log('debug', `Event completed: ${event.type} (${result.success ? 'success' : 'failed'})`);
    this.emitEvent('event-completed', monitoringEvent);
  }

  /**
   * Record event execution error
   */
  recordEventError(
    event: RecordedEvent,
    error: PlaybackError,
    screenshot?: ScreenshotInfo
  ): void {
    this.errors.push(error);
    
    if (screenshot) {
      this.screenshots.push(screenshot);
    }
    
    const monitoringEvent: MonitoringEvent = {
      type: 'event-error',
      timestamp: Date.now(),
      eventId: event.id,
      error,
      data: {
        type: event.type,
        selector: event.target.selector,
        errorMessage: error.message,
        screenshot: screenshot?.id,
      },
    };
    
    this.monitoringEvents.push(monitoringEvent);
    
    this.log('error', `Event error: ${event.type} - ${error.message}`);
    this.emitEvent('event-error', monitoringEvent);
    
    // Attempt recovery if enabled
    if (this.config.enableRecovery) {
      this.attemptRecovery(error, event);
    }
  }

  /**
   * Record performance data
   */
  recordPerformance(performance: PerformanceInfo): void {
    this.performanceData.push(performance);
    
    // Update metrics
    if (performance.usedJSHeapSize) {
      this.metrics.memoryUsage = performance.usedJSHeapSize;
    }
    
    const monitoringEvent: MonitoringEvent = {
      type: 'performance',
      timestamp: Date.now(),
      data: performance,
    };
    
    this.monitoringEvents.push(monitoringEvent);
    
    // Check thresholds
    if (performance.usedJSHeapSize && performance.usedJSHeapSize > this.config.memoryThreshold) {
      this.log('warn', `Memory usage high: ${(performance.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`);
    }
    
    this.emitEvent('performance-update', monitoringEvent);
  }

  /**
   * Record screenshot
   */
  recordScreenshot(screenshot: ScreenshotInfo, eventId?: string): void {
    this.screenshots.push(screenshot);
    
    const monitoringEvent: MonitoringEvent = {
      type: 'screenshot',
      timestamp: Date.now(),
      eventId,
      data: {
        screenshotId: screenshot.id,
        fullPage: screenshot.fullPage,
        size: screenshot.size,
      },
    };
    
    this.monitoringEvents.push(monitoringEvent);
    this.emitEvent('screenshot-captured', monitoringEvent);
  }

  /**
   * Record network request
   */
  recordNetworkRequest(request: NetworkRequest): void {
    this.networkRequests.push(request);
    
    // Update network latency metric
    const latency = request.endTime - request.startTime;
    this.metrics.networkLatency = (this.metrics.networkLatency + latency) / 2;
    
    this.log('debug', `Network request: ${request.method} ${request.url} (${request.status})`);
  }

  /**
   * Record console message
   */
  recordConsoleMessage(message: ConsoleMessage): void {
    this.consoleMessages.push(message);
    
    if (message.level === 'error') {
      this.log('warn', `Console error: ${message.text}`);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PlaybackMetrics {
    this.updateDynamicMetrics();
    return { ...this.metrics };
  }

  /**
   * Get monitoring events
   */
  getMonitoringEvents(eventType?: string): MonitoringEvent[] {
    if (eventType) {
      return this.monitoringEvents.filter(event => event.type === eventType);
    }
    return [...this.monitoringEvents];
  }

  /**
   * Get error history
   */
  getErrors(): PlaybackError[] {
    return [...this.errors];
  }

  /**
   * Get screenshots
   */
  getScreenshots(): ScreenshotInfo[] {
    return [...this.screenshots];
  }

  /**
   * Get network requests
   */
  getNetworkRequests(): NetworkRequest[] {
    return [...this.networkRequests];
  }

  /**
   * Get console messages
   */
  getConsoleMessages(): ConsoleMessage[] {
    return [...this.consoleMessages];
  }

  /**
   * Get performance data
   */
  getPerformanceData(): PerformanceInfo[] {
    return [...this.performanceData];
  }

  /**
   * Export monitoring report
   */
  exportReport(): any {
    return {
      summary: {
        startTime: this.startTime,
        endTime: Date.now(),
        duration: Date.now() - this.startTime,
        totalEvents: this.metrics.totalEvents,
        completedEvents: this.metrics.completedEvents,
        failedEvents: this.metrics.failedEvents,
        errorRate: this.metrics.errorRate,
      },
      metrics: this.getMetrics(),
      events: this.monitoringEvents,
      errors: this.errors,
      screenshots: this.screenshots.map(s => ({ id: s.id, timestamp: Date.now(), size: s.size })),
      network: this.networkRequests,
      console: this.consoleMessages,
      performance: this.performanceData,
    };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): PlaybackMetrics {
    return {
      totalEvents: 0,
      completedEvents: 0,
      failedEvents: 0,
      skippedEvents: 0,
      totalExecutionTime: 0,
      averageEventTime: 0,
      minEventTime: Number.MAX_VALUE,
      maxEventTime: 0,
      errorRate: 0,
      recoveryRate: 0,
      criticalErrors: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      selectorSuccessRate: 0,
      healingSuccessRate: 0,
      retryCount: 0,
    };
  }

  /**
   * Setup recovery strategies
   */
  private setupRecoveryStrategies(): void {
    // Element not found recovery
    this.recoveryStrategies.set('element-not-found', {
      name: 'element-not-found',
      condition: (error) => error.message.includes('Element not found'),
      action: async (_error, _context) => {
        this.log('info', 'Attempting element recovery...');
        // Wait for element to appear
        await this.sleep(2000);
        return true; // Indicate retry should be attempted
      },
      maxAttempts: 3,
      priority: 90,
    });

    // Selector healing recovery
    this.recoveryStrategies.set('selector-healing', {
      name: 'selector-healing',
      condition: (error) => error.message.includes('selector') || error.message.includes('not found'),
      action: async (_error, _context) => {
        this.log('info', 'Attempting selector healing...');
        // This would integrate with the SelectorResolver
        await this.sleep(1000);
        return true;
      },
      maxAttempts: 2,
      priority: 80,
    });

    // Network timeout recovery
    this.recoveryStrategies.set('network-timeout', {
      name: 'network-timeout',
      condition: (error) => error.message.includes('timeout') || error.message.includes('network'),
      action: async (_error, _context) => {
        this.log('info', 'Attempting network recovery...');
        await this.sleep(3000);
        return true;
      },
      maxAttempts: 2,
      priority: 70,
    });

    // Page load recovery
    this.recoveryStrategies.set('page-load', {
      name: 'page-load',
      condition: (error) => error.message.includes('navigation') || error.message.includes('load'),
      action: async (_error, _context) => {
        this.log('info', 'Attempting page load recovery...');
        // Refresh page or wait for load
        await this.sleep(5000);
        return true;
      },
      maxAttempts: 1,
      priority: 60,
    });
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(error: PlaybackError, event: RecordedEvent): Promise<boolean> {
    const strategies = Array.from(this.recoveryStrategies.values())
      .filter(strategy => strategy.condition(error, { event }))
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of strategies) {
      try {
        this.log('info', `Trying recovery strategy: ${strategy.name}`);
        
        const recovered = await strategy.action(error, { event });
        
        if (recovered) {
          const monitoringEvent: MonitoringEvent = {
            type: 'recovery',
            timestamp: Date.now(),
            eventId: event.id,
            data: {
              strategy: strategy.name,
              success: true,
            },
          };
          
          this.monitoringEvents.push(monitoringEvent);
          this.log('info', `Recovery successful with strategy: ${strategy.name}`);
          this.emitEvent('recovery-success', monitoringEvent);
          
          return true;
        }
      } catch (recoveryError) {
        this.log('warn', `Recovery strategy ${strategy.name} failed: ${recoveryError}`);
      }
    }

    this.log('error', 'All recovery strategies failed');
    return false;
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.performanceInterval = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        // Collect performance metrics (would integrate with actual performance APIs)
        const performance: PerformanceInfo = {
          usedJSHeapSize: (window.performance as any).memory?.usedJSHeapSize,
          totalJSHeapSize: (window.performance as any).memory?.totalJSHeapSize,
          jsHeapSizeLimit: (window.performance as any).memory?.jsHeapSizeLimit,
          // Additional metrics would be collected here
        };

        this.recordPerformance(performance);
      } catch {
        this.log('warn', 'Failed to collect performance metrics');
      }
    }, this.config.performanceInterval);
  }

  /**
   * Start screenshot monitoring
   */
  private startScreenshotMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      if (!this.isMonitoring) return;

      // This would integrate with the CDPClient to capture periodic screenshots
      this.log('debug', 'Periodic screenshot capture would occur here');
    }, this.config.screenshotInterval);
  }

  /**
   * Update timing metrics
   */
  private updateTimingMetrics(duration: number): void {
    this.metrics.totalExecutionTime += duration;
    this.metrics.minEventTime = Math.min(this.metrics.minEventTime, duration);
    this.metrics.maxEventTime = Math.max(this.metrics.maxEventTime, duration);
    
    const completedEvents = this.metrics.completedEvents + this.metrics.failedEvents;
    if (completedEvents > 0) {
      this.metrics.averageEventTime = this.metrics.totalExecutionTime / completedEvents;
    }
  }

  /**
   * Update dynamic metrics
   */
  private updateDynamicMetrics(): void {
    const totalExecuted = this.metrics.completedEvents + this.metrics.failedEvents;
    
    if (totalExecuted > 0) {
      this.metrics.errorRate = this.metrics.failedEvents / totalExecuted;
      this.metrics.selectorSuccessRate = this.metrics.completedEvents / totalExecuted;
    }
    
    // Recovery rate would be calculated based on actual recovery attempts
    this.metrics.recoveryRate = 0; // Placeholder
  }

  /**
   * Calculate final metrics
   */
  private calculateFinalMetrics(): void {
    this.updateDynamicMetrics();
    
    // Additional final calculations
    const totalTime = Date.now() - this.startTime;
    this.log('info', `Playback completed in ${totalTime}ms`);
    this.log('info', `Success rate: ${((1 - this.metrics.errorRate) * 100).toFixed(1)}%`);
    this.log('info', `Average event time: ${this.metrics.averageEventTime.toFixed(1)}ms`);
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch {
          this.log('error', `Event listener error: ${error}`);
        }
      });
    }
  }

  /**
   * Logging utility
   */
  private log(level: string, message: string): void {
    if (this.config.logLevel === 'none') return;
    
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    if (messageLevelIndex <= currentLevelIndex) {
      const timestamp = new Date().toISOString();
      const _logMessage = `[${timestamp}] PlaybackMonitor: ${message}`;
      
      if (this.config.logToConsole) {
        switch (level) {
          case 'error':
            // console.error(_logMessage);
            break;
          case 'warn':
            // console.warn(_logMessage);
            break;
          case 'info':
            // console.info(_logMessage);
            break;
          case 'debug':
            // console.debug(_logMessage);
            break;
          default:
            // console.log(_logMessage);
        }
      }
      
      // File logging would be implemented here if needed
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset monitoring state
   */
  reset(): void {
    this.stopMonitoring();
    this.monitoringEvents = [];
    this.errors = [];
    this.screenshots = [];
    this.networkRequests = [];
    this.consoleMessages = [];
    this.performanceData = [];
    this.metrics = this.initializeMetrics();
  }
}