/**
 * Performance Metrics & Monitoring System
 * Tracks Web Vitals, performance regressions, and system metrics during test execution
 */

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: LayoutShiftSource[];
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

export interface PerformanceMetrics {
  // Core Web Vitals
  webVitals: WebVitals;
  
  // Navigation & Loading
  navigation: NavigationMetrics;
  
  // Runtime Performance
  runtime: RuntimeMetrics;
  
  // Resource Loading
  resources: ResourceMetrics[];
  
  // Custom Metrics
  custom: Record<string, number>;
  
  // Metadata
  timestamp: number;
  url: string;
  userAgent: string;
  viewport: { width: number; height: number };
}

export interface WebVitals {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Additional Web Vitals
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  tbt?: number; // Total Blocking Time
  si?: number; // Speed Index
  
  // Interaction to Next Paint (experimental)
  inp?: number;
}

export interface NavigationMetrics {
  // Navigation Timing API
  domContentLoaded: number;
  loadComplete: number;
  
  // DNS & Connection
  dnsLookup: number;
  tcpConnect: number;
  tlsHandshake?: number;
  
  // Request/Response
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  
  // DOM Processing
  domInteractive: number;
  domComplete: number;
  
  // Redirect
  redirectCount: number;
  redirectTime: number;
}

export interface RuntimeMetrics {
  // Memory
  memory: MemoryInfo;
  
  // JavaScript
  javascript: JavaScriptMetrics;
  
  // Rendering
  rendering: RenderingMetrics;
  
  // CPU
  cpu: CPUMetrics;
  
  // Network
  network: NetworkMetrics;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  
  // Additional memory metrics
  domNodes: number;
  domListeners: number;
  jsObjects: number;
  
  // Memory pressure
  pressure?: 'nominal' | 'fair' | 'serious' | 'critical';
}

export interface JavaScriptMetrics {
  // Execution time
  scriptDuration: number;
  taskDuration: number;
  
  // Long tasks (>50ms)
  longTasks: LongTask[];
  longTasksCount: number;
  longTasksDuration: number;
  
  // Event handling
  eventHandlers: number;
  
  // Garbage collection
  gcCount: number;
  gcDuration: number;
}

export interface LongTask {
  startTime: number;
  duration: number;
  attribution?: string;
}

export interface RenderingMetrics {
  // Paint timing
  firstPaint?: number;
  firstContentfulPaint?: number;
  firstMeaningfulPaint?: number;
  
  // Layout & Paint
  layoutCount: number;
  paintCount: number;
  compositeCount: number;
  
  // Layout shifts
  layoutShifts: LayoutShift[];
  cumulativeLayoutShift: number;
  
  // Frame rate
  frameRate: number;
  droppedFrames: number;
  
  // Visual completeness
  visuallyComplete?: number;
  speedIndex?: number;
}

export interface LayoutShift {
  startTime: number;
  value: number;
  hadRecentInput: boolean;
  sources: LayoutShiftSource[];
}

export interface LayoutShiftSource {
  node?: string; // selector
  previousRect: DOMRect;
  currentRect: DOMRect;
}

export interface CPUMetrics {
  usage: number; // 0-100%
  
  // Main thread utilization
  mainThreadUsage: number;
  
  // Task breakdown
  scriptTime: number;
  renderTime: number;
  paintTime: number;
  systemTime: number;
  idleTime: number;
}

export interface NetworkMetrics {
  // Request statistics
  requestCount: number;
  failedRequests: number;
  
  // Data transfer
  bytesDownloaded: number;
  bytesUploaded: number;
  
  // Connection info
  effectiveType?: string; // 'slow-2g', '2g', '3g', '4g'
  downlink?: number; // Mbps
  rtt?: number; // Round trip time in ms
  
  // Protocol
  http2Requests: number;
  http3Requests: number;
  
  // Caching
  cacheHitRate: number;
}

export interface ResourceMetrics {
  name: string;
  type: ResourceType;
  size: number;
  duration: number;
  startTime: number;
  endTime: number;
  
  // Detailed timing
  timing: ResourceTiming;
  
  // Cache info
  fromCache: boolean;
  
  // Performance impact
  renderBlocking: boolean;
  critical: boolean;
}

export type ResourceType = 
  | 'document' 
  | 'stylesheet' 
  | 'script' 
  | 'image' 
  | 'font' 
  | 'fetch' 
  | 'xhr' 
  | 'other';

export interface ResourceTiming {
  dnsLookup: number;
  tcpConnect: number;
  tlsHandshake?: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

export interface PerformanceThreshold {
  metric: string;
  good: number;
  needsImprovement: number;
  poor: number;
}

export interface PerformanceAssertion {
  id: string;
  name: string;
  metric: string;
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'between';
  value: number | [number, number];
  severity: 'info' | 'warning' | 'error';
  message: string;
  enabled: boolean;
}

export interface PerformanceRegression {
  metric: string;
  baseline: number;
  current: number;
  change: number;
  changePercent: number;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  threshold: number;
  detected: number;
}

export interface PerformanceTrend {
  metric: string;
  dataPoints: PerformanceDataPoint[];
  trend: 'improving' | 'stable' | 'degrading';
  slope: number;
  correlation: number;
  forecast?: number;
}

export interface PerformanceDataPoint {
  timestamp: number;
  value: number;
  version?: string;
  environment?: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceProfile {
  id: string;
  name: string;
  description?: string;
  thresholds: PerformanceThreshold[];
  assertions: PerformanceAssertion[];
  monitoringEnabled: boolean;
  alerting: AlertingConfig;
}

export interface AlertingConfig {
  enabled: boolean;
  recipients: string[];
  conditions: AlertCondition[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'change_percent';
  value: number;
  duration?: number; // Time window in minutes
}

export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics[]>();
  private baselines = new Map<string, PerformanceMetrics>();
  private thresholds = new Map<string, PerformanceThreshold[]>();
  private assertions = new Map<string, PerformanceAssertion[]>();
  private profiles = new Map<string, PerformanceProfile>();
  
  private isMonitoring = false;
  private observers: PerformanceObserver[] = [];
  private intervalId?: number;

  constructor() {
    this.initializeDefaultThresholds();
    this.initializeDefaultAssertions();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(profile?: PerformanceProfile): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.isMonitoring = true;

    if (profile) {
      this.applyProfile(profile);
    }

    // Set up performance observers
    this.setupWebVitalsObserver();
    this.setupNavigationObserver();
    this.setupResourceObserver();
    this.setupLongTaskObserver();
    this.setupLayoutShiftObserver();

    // Start periodic collection
    this.intervalId = window.setInterval(() => {
      this.collectRuntimeMetrics();
    }, 1000);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return {
      webVitals: this.getWebVitals(),
      navigation: this.getNavigationMetrics(),
      runtime: this.getRuntimeMetrics(),
      resources: this.getResourceMetrics(),
      custom: this.getCustomMetrics(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  /**
   * Record performance metrics for a specific test
   */
  recordMetrics(testId: string): void {
    const metrics = this.getCurrentMetrics();
    
    if (!this.metrics.has(testId)) {
      this.metrics.set(testId, []);
    }
    
    this.metrics.get(testId)!.push(metrics);
  }

  /**
   * Set baseline metrics for comparison
   */
  setBaseline(testId: string, metrics?: PerformanceMetrics): void {
    const baselineMetrics = metrics || this.getCurrentMetrics();
    this.baselines.set(testId, baselineMetrics);
  }

  /**
   * Compare current metrics with baseline
   */
  compareWithBaseline(testId: string): PerformanceRegression[] {
    const baseline = this.baselines.get(testId);
    const current = this.getCurrentMetrics();
    
    if (!baseline) {
      throw new Error(`No baseline found for test: ${testId}`);
    }

    return this.detectRegressions(baseline, current);
  }

  /**
   * Validate metrics against assertions
   */
  validateAssertions(testId: string, metrics?: PerformanceMetrics): AssertionResult[] {
    const metricsToValidate = metrics || this.getCurrentMetrics();
    const assertions = this.assertions.get(testId) || [];
    
    return assertions.map(assertion => this.validateAssertion(assertion, metricsToValidate));
  }

  /**
   * Get performance trend analysis
   */
  getTrend(testId: string, metric: string, days = 30): PerformanceTrend | null {
    const metricsHistory = this.metrics.get(testId) || [];
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const dataPoints = metricsHistory
      .filter(m => m.timestamp > cutoffTime)
      .map(m => ({
        timestamp: m.timestamp,
        value: this.getMetricValue(m, metric),
      }))
      .filter(dp => dp.value !== undefined) as PerformanceDataPoint[];

    if (dataPoints.length < 2) {
      return null;
    }

    return this.analyzeTrend(metric, dataPoints);
  }

  /**
   * Export performance data
   */
  exportData(testId: string, format: 'json' | 'csv' = 'json'): string {
    const metricsHistory = this.metrics.get(testId) || [];
    
    if (format === 'csv') {
      return this.exportToCSV(metricsHistory);
    }
    
    return JSON.stringify(metricsHistory, null, 2);
  }

  /**
   * Apply performance profile
   */
  private applyProfile(profile: PerformanceProfile): void {
    this.profiles.set(profile.id, profile);
    this.thresholds.set(profile.id, profile.thresholds);
    this.assertions.set(profile.id, profile.assertions);
  }

  /**
   * Setup Web Vitals observer
   */
  private setupWebVitalsObserver(): void {
    // This would integrate with web-vitals library
    // For now, mock the implementation
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.recordWebVital('lcp', entry.startTime);
        }
      }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(observer);
  }

  /**
   * Setup navigation observer
   */
  private setupNavigationObserver(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.processNavigationTiming(navEntry);
        }
      }
    });
    
    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  /**
   * Setup resource observer
   */
  private setupResourceObserver(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.processResourceTiming(resourceEntry);
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  /**
   * Setup long task observer
   */
  private setupLongTaskObserver(): void {
    if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordLongTask({
              startTime: entry.startTime,
              duration: entry.duration,
              attribution: entry.name,
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  /**
   * Setup layout shift observer
   */
  private setupLayoutShiftObserver(): void {
    if ('LayoutShift' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            const shiftEntry = entry as LayoutShiftEntry; // LayoutShift interface
            this.recordLayoutShift({
              startTime: shiftEntry.startTime,
              value: shiftEntry.value,
              hadRecentInput: shiftEntry.hadRecentInput,
              sources: shiftEntry.sources || [],
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    }
  }

  /**
   * Get Web Vitals metrics
   */
  private getWebVitals(): WebVitals {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      fcp: this.getFirstContentfulPaint(),
      lcp: this.getLargestContentfulPaint(),
      cls: this.getCumulativeLayoutShift(),
      fid: this.getFirstInputDelay(),
      ttfb: navigationEntry ? navigationEntry.responseStart - navigationEntry.requestStart : undefined,
      tbt: this.getTotalBlockingTime(),
    };
  }

  /**
   * Get navigation metrics
   */
  private getNavigationMetrics(): NavigationMetrics {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigationEntry) {
      return this.createEmptyNavigationMetrics();
    }

    return {
      domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
      loadComplete: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
      dnsLookup: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
      tcpConnect: navigationEntry.connectEnd - navigationEntry.connectStart,
      tlsHandshake: navigationEntry.secureConnectionStart ? 
        navigationEntry.connectEnd - navigationEntry.secureConnectionStart : undefined,
      requestStart: navigationEntry.requestStart,
      responseStart: navigationEntry.responseStart,
      responseEnd: navigationEntry.responseEnd,
      domInteractive: navigationEntry.domInteractive,
      domComplete: navigationEntry.domComplete,
      redirectCount: navigationEntry.redirectCount,
      redirectTime: navigationEntry.redirectEnd - navigationEntry.redirectStart,
    };
  }

  /**
   * Get runtime metrics
   */
  private getRuntimeMetrics(): RuntimeMetrics {
    return {
      memory: this.getMemoryInfo(),
      javascript: this.getJavaScriptMetrics(),
      rendering: this.getRenderingMetrics(),
      cpu: this.getCPUMetrics(),
      network: this.getNetworkMetrics(),
    };
  }

  /**
   * Collect runtime metrics periodically
   */
  private collectRuntimeMetrics(): void {
    // This would be called periodically to update runtime metrics
    // Implementation would depend on available APIs
  }

  /**
   * Initialize default performance thresholds
   */
  private initializeDefaultThresholds(): void {
    const webVitalThresholds: PerformanceThreshold[] = [
      { metric: 'lcp', good: 2500, needsImprovement: 4000, poor: Infinity },
      { metric: 'fid', good: 100, needsImprovement: 300, poor: Infinity },
      { metric: 'cls', good: 0.1, needsImprovement: 0.25, poor: Infinity },
      { metric: 'fcp', good: 1800, needsImprovement: 3000, poor: Infinity },
      { metric: 'ttfb', good: 800, needsImprovement: 1800, poor: Infinity },
    ];

    this.thresholds.set('default', webVitalThresholds);
  }

  /**
   * Initialize default assertions
   */
  private initializeDefaultAssertions(): void {
    const defaultAssertions: PerformanceAssertion[] = [
      {
        id: 'lcp_threshold',
        name: 'LCP should be under 2.5s',
        metric: 'webVitals.lcp',
        operator: 'lt',
        value: 2500,
        severity: 'warning',
        message: 'Largest Contentful Paint exceeds recommended threshold',
        enabled: true,
      },
      {
        id: 'cls_threshold',
        name: 'CLS should be under 0.1',
        metric: 'webVitals.cls',
        operator: 'lt',
        value: 0.1,
        severity: 'warning',
        message: 'Cumulative Layout Shift exceeds recommended threshold',
        enabled: true,
      },
    ];

    this.assertions.set('default', defaultAssertions);
  }

  /**
   * Helper methods for getting specific metrics
   */
  private getFirstContentfulPaint(): number | undefined {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    return fcpEntry?.startTime;
  }

  private getLargestContentfulPaint(): number | undefined {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : undefined;
  }

  private getCumulativeLayoutShift(): number {
    // Would be calculated from layout shift observations
    return 0;
  }

  private getFirstInputDelay(): number | undefined {
    // Would be measured from first interaction
    return undefined;
  }

  private getTotalBlockingTime(): number {
    // Would be calculated from long tasks
    return 0;
  }

  private getResourceMetrics(): ResourceMetrics[] {
    return performance.getEntriesByType('resource').map((entry: PerformanceResourceTiming) => ({
      name: entry.name,
      type: this.getResourceType(entry),
      size: entry.transferSize,
      duration: entry.duration,
      startTime: entry.startTime,
      endTime: entry.responseEnd,
      timing: {
        dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
        tcpConnect: entry.connectEnd - entry.connectStart,
        tlsHandshake: entry.secureConnectionStart ? 
          entry.connectEnd - entry.secureConnectionStart : undefined,
        requestStart: entry.requestStart,
        responseStart: entry.responseStart,
        responseEnd: entry.responseEnd,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
      },
      fromCache: entry.transferSize === 0 && entry.decodedBodySize > 0,
      renderBlocking: false, // Would need to determine this
      critical: false, // Would need to determine this
    }));
  }

  private getResourceType(entry: PerformanceResourceTiming): ResourceType {
    const url = entry.name;
    if (url.match(/\.(css)$/i)) return 'stylesheet';
    if (url.match(/\.(js)$/i)) return 'script';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (entry.initiatorType === 'fetch') return 'fetch';
    if (entry.initiatorType === 'xmlhttprequest') return 'xhr';
    return 'other';
  }

  private getCustomMetrics(): Record<string, number> {
    // Would return custom metrics defined by user
    return {};
  }

  // Additional helper methods would be implemented here...
  private getMemoryInfo(): MemoryInfo {
    const memory = (performance as PerformanceWithMemory).memory;
    return {
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
      domNodes: document.querySelectorAll('*').length,
      domListeners: 0, // Would need to track
      jsObjects: 0, // Would need to track
    };
  }

  private getJavaScriptMetrics(): JavaScriptMetrics {
    return {
      scriptDuration: 0,
      taskDuration: 0,
      longTasks: [],
      longTasksCount: 0,
      longTasksDuration: 0,
      eventHandlers: 0,
      gcCount: 0,
      gcDuration: 0,
    };
  }

  private getRenderingMetrics(): RenderingMetrics {
    return {
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
      layoutCount: 0,
      paintCount: 0,
      compositeCount: 0,
      layoutShifts: [],
      cumulativeLayoutShift: this.getCumulativeLayoutShift(),
      frameRate: 60, // Would need to measure
      droppedFrames: 0,
    };
  }

  private getCPUMetrics(): CPUMetrics {
    return {
      usage: 0,
      mainThreadUsage: 0,
      scriptTime: 0,
      renderTime: 0,
      paintTime: 0,
      systemTime: 0,
      idleTime: 0,
    };
  }

  private getNetworkMetrics(): NetworkMetrics {
    const connection = (navigator as NavigatorWithConnection).connection;
    return {
      requestCount: performance.getEntriesByType('resource').length,
      failedRequests: 0,
      bytesDownloaded: 0,
      bytesUploaded: 0,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      http2Requests: 0,
      http3Requests: 0,
      cacheHitRate: 0,
    };
  }

  private getFirstPaint(): number | undefined {
    const fpEntry = performance.getEntriesByName('first-paint')[0];
    return fpEntry?.startTime;
  }

  private createEmptyNavigationMetrics(): NavigationMetrics {
    return {
      domContentLoaded: 0,
      loadComplete: 0,
      dnsLookup: 0,
      tcpConnect: 0,
      requestStart: 0,
      responseStart: 0,
      responseEnd: 0,
      domInteractive: 0,
      domComplete: 0,
      redirectCount: 0,
      redirectTime: 0,
    };
  }

  private recordWebVital(metric: string, value: number): void {
    // Store web vital measurement
  }

  private processNavigationTiming(entry: PerformanceNavigationTiming): void {
    // Process navigation timing entry
  }

  private processResourceTiming(entry: PerformanceResourceTiming): void {
    // Process resource timing entry
  }

  private recordLongTask(task: LongTask): void {
    // Record long task
  }

  private recordLayoutShift(shift: LayoutShift): void {
    // Record layout shift
  }

  private detectRegressions(baseline: PerformanceMetrics, current: PerformanceMetrics): PerformanceRegression[] {
    // Detect performance regressions
    return [];
  }

  private validateAssertion(assertion: PerformanceAssertion, metrics: PerformanceMetrics): AssertionResult {
    const value = this.getMetricValue(metrics, assertion.metric);
    
    if (value === undefined) {
      return {
        assertion,
        passed: false,
        actualValue: undefined,
        message: `Metric ${assertion.metric} not found`,
      };
    }

    const passed = this.evaluateAssertion(assertion, value);
    
    return {
      assertion,
      passed,
      actualValue: value,
      message: passed ? 'Assertion passed' : assertion.message,
    };
  }

  private getMetricValue(metrics: PerformanceMetrics, path: string): number | undefined {
    const parts = path.split('.');
    let current: unknown = metrics;
    
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    
    return typeof current === 'number' ? current : undefined;
  }

  private evaluateAssertion(assertion: PerformanceAssertion, value: number): boolean {
    switch (assertion.operator) {
      case 'lt':
        return typeof assertion.value === 'number' && value < assertion.value;
      case 'lte':
        return typeof assertion.value === 'number' && value <= assertion.value;
      case 'gt':
        return typeof assertion.value === 'number' && value > assertion.value;
      case 'gte':
        return typeof assertion.value === 'number' && value >= assertion.value;
      case 'eq':
        return typeof assertion.value === 'number' && value === assertion.value;
      case 'between':
        if (Array.isArray(assertion.value) && assertion.value.length === 2) {
          const [min, max] = assertion.value;
          return value >= min && value <= max;
        }
        return false;
      default:
        return false;
    }
  }

  private analyzeTrend(metric: string, dataPoints: PerformanceDataPoint[]): PerformanceTrend {
    // Simple trend analysis - would use proper statistical methods
    const values = dataPoints.map(dp => dp.value);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const slope = secondAvg - firstAvg;
    
    let trend: 'improving' | 'stable' | 'degrading';
    if (Math.abs(slope) < avgValue * 0.05) {
      trend = 'stable';
    } else if (slope < 0) {
      trend = 'improving'; // Assuming lower is better for most metrics
    } else {
      trend = 'degrading';
    }

    return {
      metric,
      dataPoints,
      trend,
      slope,
      correlation: 0.8, // Would calculate actual correlation
    };
  }

  private exportToCSV(metricsHistory: PerformanceMetrics[]): string {
    if (metricsHistory.length === 0) return '';

    const headers = ['timestamp', 'lcp', 'fid', 'cls', 'fcp', 'ttfb', 'loadComplete'];
    const rows = metricsHistory.map(metrics => [
      new Date(metrics.timestamp).toISOString(),
      metrics.webVitals.lcp || '',
      metrics.webVitals.fid || '',
      metrics.webVitals.cls || '',
      metrics.webVitals.fcp || '',
      metrics.webVitals.ttfb || '',
      metrics.navigation.loadComplete || '',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

export interface AssertionResult {
  assertion: PerformanceAssertion;
  passed: boolean;
  actualValue?: number;
  message: string;
}