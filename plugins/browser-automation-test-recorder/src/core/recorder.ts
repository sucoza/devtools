/**
 * DOM Event Recording System
 * Captures and processes browser events for automation test generation
 */

import type {
  RecordedEvent,
  EventType as _EventType,
  EventData as _EventData,
  EventContext,
  RecordedEventTarget as _RecordedEventTarget,
  RecordingOptions,
  MouseEventData as _MouseEventData,
  KeyboardEventData as _KeyboardEventData,
  FormEventData,
  NavigationEventData,
  ScrollEventData as _ScrollEventData,
  ViewportInfo,
  PerformanceInfo,
  ConsoleInfo,
  ReliabilityMetrics,
  ElementPathNode,
} from '../types';
import { SelectorEngine } from './selector-engine';
import type { BrowserAutomationEventClient } from './devtools-client';

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Event recording manager with intelligent event capture and processing
 */
export class EventRecorder {
  private _isRecording = false;
  private _isPaused = false;
  private sessionId = '';
  private sequenceNumber = 0;
  private eventBuffer: RecordedEvent[] = [];
  private lastEventTime = 0;
  
  // Core components
  private selectorEngine: SelectorEngine;
  private devToolsClient: BrowserAutomationEventClient;
  
  // Recording options
  private options: RecordingOptions = {
    captureScreenshots: true,
    captureSelectors: true,
    captureTimings: true,
    captureConsole: true,
    captureNetwork: false,
    capturePerformance: false,
    ignoredEvents: ['mousemove', 'scroll', 'resize'],
    selectorOptions: {
      includeId: true,
      includeClass: true,
      includeAttributes: true,
      includeText: true,
      includePosition: false,
      optimize: true,
      unique: true,
      stable: true,
      generateAlternatives: true,
      maxAlternatives: 3,
      customAttributes: ['data-testid', 'data-test'],
      ignoreAttributes: ['style', 'class'],
      testIdAttribute: 'data-testid',
      ariaLabelFallback: true,
    },
    debounceMs: 100,
    maxEvents: 1000,
    recordInitialNavigation: true,
  };

  // Event listeners map for cleanup
  private eventListeners = new Map<string, EventListenerOrEventListenerObject>();
  
  // Debounce timers
  private debounceTimers = new Map<string, number>();
  
  // Performance monitoring
  private performanceObserver?: PerformanceObserver;
  private mutationObserver?: MutationObserver;
  
  constructor(
    selectorEngine: SelectorEngine,
    devToolsClient: BrowserAutomationEventClient
  ) {
    this.selectorEngine = selectorEngine;
    this.devToolsClient = devToolsClient;
  }

  /**
   * Start recording DOM events
   */
  async startRecording(options?: Partial<RecordingOptions>): Promise<void> {
    if (this._isRecording) {
      throw new Error('Recording is already in progress');
    }

    // Merge options
    this.options = { ...this.options, ...options };
    
    // Initialize recording state
    this._isRecording = true;
    this._isPaused = false;
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sequenceNumber = 0;
    this.eventBuffer = [];
    this.lastEventTime = Date.now();

    // Setup event listeners
    await this.setupEventListeners();
    
    // Initialize performance monitoring
    if (this.options.capturePerformance) {
      this.initializePerformanceMonitoring();
    }
    
    // Initialize mutation observer for DOM changes
    this.initializeMutationObserver();
    
    // Record initial page state
    await this.recordPageState();
    
    // // console.log(`EventRecorder: Started recording session ${this.sessionId}`);
  }

  /**
   * Stop recording and return captured events
   */
  async stopRecording(): Promise<RecordedEvent[]> {
    if (!this._isRecording) {
      return [];
    }

    this._isRecording = false;
    this._isPaused = false;

    // Cleanup event listeners
    this.cleanupEventListeners();
    
    // Cleanup observers
    this.cleanupObservers();
    
    // Return recorded events
    const events = [...this.eventBuffer];
    this.eventBuffer = [];
    
    // // console.log(`EventRecorder: Stopped recording, captured ${events.length} events`);
    return events;
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (!this._isRecording) return;
    this._isPaused = true;
    // // console.log('EventRecorder: Recording paused');
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (!this._isRecording) return;
    this._isPaused = false;
    // // console.log('EventRecorder: Recording resumed');
  }

  /**
   * Get current recording status
   */
  getStatus(): { isRecording: boolean; isPaused: boolean; eventCount: number; sessionId: string } {
    return {
      isRecording: this._isRecording,
      isPaused: this._isPaused,
      eventCount: this.eventBuffer.length,
      sessionId: this.sessionId,
    };
  }

  /**
   * Setup comprehensive event listeners for all supported event types
   */
  private async setupEventListeners(): Promise<void> {
    const eventTypes: Array<{ type: string; useCapture?: boolean; element?: EventTarget }> = [
      // Mouse events
      { type: 'click' },
      { type: 'dblclick' },
      { type: 'mousedown' },
      { type: 'mouseup' },
      { type: 'mouseover' },
      { type: 'mouseout' },
      { type: 'contextmenu' },
      { type: 'wheel' },
      
      // Keyboard events
      { type: 'keydown' },
      { type: 'keyup' },
      { type: 'keypress' },
      { type: 'input' },
      
      // Form events
      { type: 'change' },
      { type: 'submit' },
      { type: 'focus', useCapture: true },
      { type: 'blur', useCapture: true },
      { type: 'select' },
      
      // Navigation events (on window)
      { type: 'beforeunload', element: window },
      { type: 'unload', element: window },
      { type: 'load', element: window },
      { type: 'resize', element: window },
      { type: 'scroll', element: window },
      
      // Touch events for mobile
      { type: 'touchstart' },
      { type: 'touchend' },
      { type: 'touchmove' },
      { type: 'touchcancel' },
      
      // Drag and drop events
      { type: 'dragstart' },
      { type: 'drag' },
      { type: 'dragend' },
      { type: 'dragover' },
      { type: 'dragenter' },
      { type: 'dragleave' },
      { type: 'drop' },
    ];

    // Add event listeners
    for (const { type, useCapture = false, element = document } of eventTypes) {
      // Skip ignored events
      if (this.options.ignoredEvents.includes(type as EventType as _EventType)) {
        continue;
      }

      const listener = this.createEventListener(type as EventType as _EventType);
      element.addEventListener(type, listener, useCapture);
      
      // Store for cleanup
      this.eventListeners.set(`${type}_${useCapture}`, listener);
    }

    // Add special navigation listener for SPA routing
    this.setupNavigationListener();
  }

  /**
   * Setup navigation listener for SPA route changes
   */
  private setupNavigationListener(): void {
    // Override history methods to capture navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const navigationListener = (type: 'pushstate' | 'replacestate', url: string) => {
      this.recordNavigationEvent({
        url,
        title: document.title,
        referrer: document.referrer,
        timestamp: Date.now(),
      });
    };

    history.pushState = function(state, title, url) {
      const result = originalPushState.apply(this, [state, title, url]);
      navigationListener('pushstate', url?.toString() || location.href);
      return result;
    };

    history.replaceState = function(state, title, url) {
      const result = originalReplaceState.apply(this, [state, title, url]);
      navigationListener('replacestate', url?.toString() || location.href);
      return result;
    };

    // Listen for popstate (back/forward navigation)
    const popstateListener = () => {
      navigationListener('pushstate', location.href);
    };
    
    window.addEventListener('popstate', popstateListener);
    this.eventListeners.set('popstate', popstateListener);
  }

  /**
   * Create event listener for specific event type
   */
  private createEventListener(eventType: EventType): EventListenerOrEventListenerObject {
    return (event: Event) => {
      if (!this._isRecording || this._isPaused) return;

      // Debounce rapid events
      if (this.shouldDebounceEvent(eventType, event)) {
        this.debounceEvent(eventType, event);
        return;
      }

      this.processEvent(eventType, event);
    };
  }

  /**
   * Check if event should be debounced
   */
  private shouldDebounceEvent(eventType: EventType, _event: Event): boolean {
    const debounceTypes: EventType[] = ['mousemove', 'scroll', 'resize', 'input'];
    return debounceTypes.includes(eventType);
  }

  /**
   * Debounce rapid events to avoid overwhelming the system
   */
  private debounceEvent(eventType: EventType, event: Event): void {
    const key = `${eventType}_${(event.target as Element)?.tagName || 'window'}`;
    
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = window.setTimeout(async () => {
      // Use createEventData for manual events, processEvent for automatic events
      if (event.isTrusted === false) {
        // This is likely a manual/test event, use createEventData
        const recordedEvent = await this.createEventData(event);
        if (recordedEvent) {
          this.eventBuffer.push(recordedEvent);
          this.sequenceNumber++;
        }
      } else {
        // This is a browser event, use the full processEvent flow
        await this.processEvent(eventType, event);
      }
      this.debounceTimers.delete(key);
    }, this.options.debounceMs);
    
    this.debounceTimers.set(key, timer);
  }

  /**
   * Process and record DOM event
   */
  private async processEvent(eventType: EventType, event: Event): Promise<void> {
    try {
      // Generate unique event ID
      const eventId = `evt_${Date.now()}_${this.sequenceNumber++}`;
      
      // Extract event target information
      const target = await this.extractEventTarget(event);
      
      // Extract event-specific data
      const eventData = this.extractEventData(eventType, event);
      
      // Gather context information
      const context = await this.gatherEventContext();
      
      // Calculate reliability metrics
      const reliability = await this.calculateReliabilityMetrics(target, event);
      
      // Create recorded event
      const recordedEvent: RecordedEvent = {
        id: eventId,
        type: eventType,
        timestamp: event.timeStamp || Date.now(),
        sequence: this.sequenceNumber - 1,
        target,
        data: eventData,
        context,
        metadata: {
          sessionId: this.sessionId,
          recordingMode: 'standard',
          reliability,
          annotations: [],
          custom: {},
        },
      };

      // Add screenshot if enabled
      if (this.options.captureScreenshots) {
        recordedEvent.metadata.screenshot = await this.captureScreenshot(target);
      }

      // Buffer the event
      this.eventBuffer.push(recordedEvent);
      
      // Emit event to DevTools
      this.devToolsClient.emit('recorder:event-added', recordedEvent);
      
      // Update last event time
      this.lastEventTime = Date.now();
      
    } catch {
      // console.error('EventRecorder: Error processing event');
    }
  }

  /**
   * Extract comprehensive target information from event
   */
  private async extractEventTarget(event: Event): Promise<RecordedEventTarget> {
    const element = event.target as Element;
    if (!element || !element.tagName) {
      throw new Error('Invalid event target');
    }

    // Generate primary selector
    const selector = await this.selectorEngine.generateSelector(element, this.options.selectorOptions);
    
    // Generate alternative selectors
    const alternativeSelectors = await this.selectorEngine.generateAlternativeSelectors(
      element,
      this.options.selectorOptions.maxAlternatives
    );

    // Get element path
    const path = this.buildElementPath(element);

    // Get bounding rectangle
    const boundingRect = element.getBoundingClientRect();

    return {
      selector,
      xpath: this.selectorEngine.generateXPath(element),
      textContent: element.textContent?.trim().substring(0, 200) || undefined,
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className || undefined,
      name: (element as HTMLInputElement).name || undefined,
      type: (element as HTMLInputElement).type || undefined,
      value: (element as HTMLInputElement).value || undefined,
      boundingRect: {
        x: boundingRect.x,
        y: boundingRect.y,
        width: boundingRect.width,
        height: boundingRect.height,
        top: boundingRect.top,
        right: boundingRect.right,
        bottom: boundingRect.bottom,
        left: boundingRect.left,
        toJSON: () => ({
          x: boundingRect.x,
          y: boundingRect.y,
          width: boundingRect.width,
          height: boundingRect.height,
          top: boundingRect.top,
          right: boundingRect.right,
          bottom: boundingRect.bottom,
          left: boundingRect.left,
        }),
      },
      path,
      alternativeSelectors,
    };
  }

  /**
   * Build element path for selector generation
   */
  private buildElementPath(element: Element): ElementPathNode[] {
    const path: ElementPathNode[] = [];
    let current: Element | null = element;

    while (current && current !== document.documentElement) {
      const index = Array.from(current.parentElement?.children || []).indexOf(current);
      const attributes: Record<string, string> = {};
      
      // Collect relevant attributes
      for (const attr of current.attributes) {
        if (!this.options.selectorOptions.ignoreAttributes.includes(attr.name)) {
          attributes[attr.name] = attr.value;
        }
      }

      path.unshift({
        tagName: current.tagName.toLowerCase(),
        id: current.id || undefined,
        className: current.className || undefined,
        attributes,
        index,
        selector: this.selectorEngine.generateSelectorForElement(current),
      });

      current = current.parentElement;
    }

    return path;
  }

  /**
   * Extract event-specific data based on event type
   */
  private extractEventData(eventType: EventType, event: Event): EventData {
    switch (eventType) {
      case 'click':
      case 'dblclick':
      case 'mousedown':
      case 'mouseup':
      case 'mouseover':
      case 'mouseout':
      case 'contextmenu':
        return this.extractMouseEventData(event as MouseEvent);

      case 'keydown':
      case 'keyup':
      case 'keypress':
      case 'input':
        return this.extractKeyboardEventData(event as KeyboardEvent);

      case 'change':
      case 'submit':
      case 'focus':
      case 'blur':
      case 'select':
        return this.extractFormEventData(event as Event);

      case 'scroll':
        return this.extractScrollEventData(event as Event);

      default:
        return {
          type: 'custom',
          eventType: eventType,
          payload: {
            originalEvent: event.type,
            timestamp: event.timeStamp,
          },
        };
    }
  }

  /**
   * Extract mouse event data
   */
  private extractMouseEventData(event: MouseEvent): MouseEventData {
    return {
      type: 'mouse',
      button: event.button,
      buttons: event.buttons,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      screenX: event.screenX,
      screenY: event.screenY,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      detail: event.detail,
    };
  }

  /**
   * Extract keyboard event data
   */
  private extractKeyboardEventData(event: KeyboardEvent): KeyboardEventData {
    const target = event.target as HTMLInputElement;
    
    return {
      type: 'keyboard',
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      charCode: event.charCode || 0,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
      inputValue: target?.value || undefined,
    };
  }

  /**
   * Extract form event data
   */
  private extractFormEventData(event: Event): FormEventData {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLFormElement;
    const eventType = event.type as 'change' | 'submit' | 'focus' | 'blur' | 'select';
    
    const formData: FormEventData = {
      type: 'form',
      eventType,
    };

    // Add event-specific data
    if (target.tagName === 'INPUT') {
      const input = target as HTMLInputElement;
      formData.value = input.value;
      
      if (input.type === 'file' && input.files) {
        formData.files = Array.from(input.files).map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        }));
      }
    } else if (target.tagName === 'SELECT') {
      const select = target as HTMLSelectElement;
      formData.value = select.value;
      formData.selectedOptions = Array.from(select.selectedOptions).map(opt => opt.value);
    } else if (target.tagName === 'FORM') {
      const form = target as HTMLFormElement;
      const data = new FormData(form);
      formData.formData = Object.fromEntries(data.entries());
    }

    return formData;
  }

  /**
   * Extract scroll event data
   */
  private extractScrollEventData(event: Event): ScrollEventData {
    const target = event.target;
    const isWindow = target === window || target === document;
    
    return {
      type: 'scroll',
      scrollX: isWindow ? window.scrollX : (target as Element).scrollLeft,
      scrollY: isWindow ? window.scrollY : (target as Element).scrollTop,
      scrollTop: isWindow ? document.documentElement.scrollTop : (target as Element).scrollTop,
      scrollLeft: isWindow ? document.documentElement.scrollLeft : (target as Element).scrollLeft,
      element: isWindow ? 'window' : 'element',
    };
  }

  /**
   * Record special navigation event
   */
  private recordNavigationEvent(navData: Omit<NavigationEventData, 'type'>): void {
    if (!this._isRecording || this._isPaused) return;

    const eventId = `nav_${Date.now()}_${this.sequenceNumber++}`;
    
    const recordedEvent: RecordedEvent = {
      id: eventId,
      type: 'navigation',
      timestamp: Date.now(),
      sequence: this.sequenceNumber - 1,
      target: {
        selector: 'window',
        tagName: 'window',
        boundingRect: {
          x: 0, y: 0, width: window.innerWidth, height: window.innerHeight,
          top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0,
          toJSON: () => ({
            x: 0, y: 0, width: window.innerWidth, height: window.innerHeight,
            top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0,
          }),
        },
        path: [],
        alternativeSelectors: [],
      },
      data: {
        type: 'navigation',
        ...navData,
      },
      context: {
        url: navData.url,
        title: navData.title,
        viewport: this.getViewportInfo(),
        userAgent: navigator.userAgent,
      },
      metadata: {
        sessionId: this.sessionId,
        recordingMode: 'standard',
        reliability: {
          selectorScore: 1.0,
          alternativesCount: 0,
          elementStable: true,
          positionStable: true,
          attributesStable: true,
          timingVariability: 0,
          networkDependency: false,
          confidence: 1.0,
        },
        annotations: [],
        custom: {},
      },
    };

    this.eventBuffer.push(recordedEvent);
    this.devToolsClient.emit('recorder:event-added', recordedEvent);
  }

  /**
   * Gather comprehensive context information
   */
  private async gatherEventContext(): Promise<EventContext> {
    const context: EventContext = {
      url: location.href,
      title: document.title,
      viewport: this.getViewportInfo(),
      userAgent: navigator.userAgent,
    };

    // Add performance information if enabled
    if (this.options.capturePerformance) {
      context.performance = this.getPerformanceInfo();
    }

    // Add console information if enabled
    if (this.options.captureConsole) {
      context.console = this.getConsoleInfo();
    }

    return context;
  }

  /**
   * Get viewport information
   */
  private getViewportInfo(): ViewportInfo {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      isLandscape: window.innerWidth > window.innerHeight,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    };
  }

  /**
   * Get performance information
   */
  private getPerformanceInfo(): PerformanceInfo {
    const perf = performance;
    const timing = perf.timing;
    const memory = (perf as PerformanceWithMemory).memory;

    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      firstPaint: this.getFirstPaintTime(),
      firstContentfulPaint: this.getFirstContentfulPaintTime(),
      usedJSHeapSize: memory?.usedJSHeapSize,
      totalJSHeapSize: memory?.totalJSHeapSize,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit,
      responseStart: timing.responseStart - timing.navigationStart,
      responseEnd: timing.responseEnd - timing.navigationStart,
      domainLookupStart: timing.domainLookupStart - timing.navigationStart,
      domainLookupEnd: timing.domainLookupEnd - timing.navigationStart,
      connectStart: timing.connectStart - timing.navigationStart,
      connectEnd: timing.connectEnd - timing.navigationStart,
    };
  }

  /**
   * Get First Paint time
   */
  private getFirstPaintTime(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const fpEntry = paintEntries.find(entry => entry.name === 'first-paint');
    return fpEntry?.startTime;
  }

  /**
   * Get First Contentful Paint time
   */
  private getFirstContentfulPaintTime(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry?.startTime;
  }

  /**
   * Get console information
   */
  private getConsoleInfo(): ConsoleInfo {
    // This would be implemented with console intercepting
    return {
      messages: [],
      errorCount: 0,
      warningCount: 0,
    };
  }

  /**
   * Calculate reliability metrics for recorded event
   */
  private async calculateReliabilityMetrics(target: RecordedEventTarget, event: Event): Promise<ReliabilityMetrics> {
    const element = event.target as Element;
    
    // Calculate selector reliability score
    const selectorScore = await this.selectorEngine.evaluateSelectorStability(target.selector, element);
    
    // Check element stability
    const elementStable = this.checkElementStability(element);
    const positionStable = this.checkPositionStability(element);
    const attributesStable = this.checkAttributeStability(element);
    
    // Calculate timing variability (simplified)
    const timingVariability = Math.abs(event.timeStamp - this.lastEventTime) / 1000;
    
    // Check network dependency (simplified)
    const networkDependency = element.tagName.toLowerCase() === 'img' || 
                             element.tagName.toLowerCase() === 'iframe' ||
                             element.hasAttribute('data-src');
    
    // Overall confidence score
    const confidence = (
      selectorScore * 0.4 +
      (elementStable ? 1 : 0) * 0.2 +
      (positionStable ? 1 : 0) * 0.2 +
      (attributesStable ? 1 : 0) * 0.1 +
      (networkDependency ? 0.5 : 1) * 0.1
    );

    return {
      selectorScore,
      alternativesCount: target.alternativeSelectors.length,
      elementStable,
      positionStable,
      attributesStable,
      timingVariability,
      networkDependency,
      confidence,
    };
  }

  /**
   * Check element stability (simplified implementation)
   */
  private checkElementStability(element: Element): boolean {
    // Check if element has stable identifying attributes
    return !!(element.id || element.getAttribute('data-testid') || element.getAttribute('name'));
  }

  /**
   * Check position stability (simplified implementation)
   */
  private checkPositionStability(element: Element): boolean {
    // Check if element is in stable layout context
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Check attribute stability (simplified implementation)
   */
  private checkAttributeStability(element: Element): boolean {
    // Check if element has dynamic attributes that might change
    const dynamicAttrs = ['style', 'class'];
    return !dynamicAttrs.some(attr => 
      element.getAttribute(attr)?.includes('animate') ||
      element.getAttribute(attr)?.includes('transition')
    );
  }

  /**
   * Capture screenshot of current page or element
   */
  private async captureScreenshot(target: RecordedEventTarget): Promise<unknown> {
    try {
      // This would integrate with Chrome DevTools Protocol
      // For now, return placeholder
      return {
        id: `screenshot_${Date.now()}`,
        format: 'png' as const,
        fullPage: false,
        element: target.selector,
        size: 0,
        dimensions: { width: 0, height: 0 },
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // Minimal PNG
      };
    } catch {
      // console.error('EventRecorder: Failed to capture screenshot');
      return undefined;
    }
  }

  /**
   * Record initial page state when recording starts
   */
  private async recordPageState(): Promise<void> {
    // Record initial navigation event only if enabled
    if (this.options.recordInitialNavigation !== false) {
      this.recordNavigationEvent({
        url: location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (!window.PerformanceObserver) return;

    this.performanceObserver = new PerformanceObserver((_list) => {
      // Process performance entries if needed
    });

    this.performanceObserver.observe({ 
      entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'] 
    });
  }

  /**
   * Initialize mutation observer for DOM changes
   */
  private initializeMutationObserver(): void {
    this.mutationObserver = new MutationObserver((_mutations) => {
      // Process DOM mutations if needed for element stability tracking
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
    });
  }

  /**
   * Cleanup event listeners
   */
  private cleanupEventListeners(): void {
    // Remove all registered event listeners
    for (const [key, listener] of this.eventListeners) {
      const [eventType, useCapture] = key.split('_');
      const capture = useCapture === 'true';
      
      if (eventType === 'popstate') {
        window.removeEventListener(eventType, listener as EventListener);
      } else if (['beforeunload', 'unload', 'load', 'resize', 'scroll'].includes(eventType)) {
        window.removeEventListener(eventType, listener as EventListener, capture);
      } else {
        document.removeEventListener(eventType, listener as EventListener, capture);
      }
    }
    
    this.eventListeners.clear();
    
    // Clear debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Cleanup observers
   */
  private cleanupObservers(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = undefined;
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = undefined;
    }
  }

  /**
   * Alias methods for backward compatibility with tests
   */
  async start(options?: Partial<RecordingOptions>): Promise<string> {
    await this.startRecording(options);
    return this.sessionId;
  }

  async stop(): Promise<RecordedEvent[]> {
    return await this.stopRecording();
  }

  pause(): void {
    this.pauseRecording();
  }

  resume(): void {
    this.resumeRecording();
  }

  isCurrentlyRecording(): boolean {
    return this.getStatus().isRecording;
  }

  /**
   * Check if currently recording (alias for test compatibility)
   */
  isRecording(): boolean {
    return this.getStatus().isRecording;
  }

  /**
   * Update recording options
   */
  updateOptions(newOptions: Partial<RecordingOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current recording options
   */
  getOptions(): RecordingOptions {
    return { ...this.options };
  }

  /**
   * Check if recording is currently paused
   */
  isPaused(): boolean {
    return this.getStatus().isPaused;
  }

  /**
   * Clear all recorded events
   */
  clear(): void {
    this.eventBuffer = [];
    this.sequenceNumber = 0;
  }


  async handleDOMEvent(event: Event): Promise<void> {
    if (!this._isRecording || this._isPaused) return;
    
    // Check if event type should be ignored
    if (this.options.ignoredEvents.includes(event.type as EventType)) {
      return;
    }
    
    // Apply debouncing for rapid events
    const eventType = event.type as EventType;
    if (this.shouldDebounceEvent(eventType, event)) {
      this.debounceEvent(eventType, event);
      return;
    }
    
    // Use existing event handling logic
    const recordedEvent = await this.createEventData(event);
    if (recordedEvent) {
      this.eventBuffer.push(recordedEvent);
      this.sequenceNumber++;
    }
  }

  /**
   * Extract event data from Event (overload for Event parameter)
   */
  private extractEventDataFromEvent(event: Event): EventData {
    return this.extractEventData(event.type as EventType, event);
  }

  // Method to create event data from DOM event
  private async createEventData(event: Event): Promise<RecordedEvent | null> {
    try {
      const target = event.target as Element;
      if (!target) return null;

      const selector = await this.selectorEngine.generateSelector(target, this.options.selectorOptions);
      
      // Generate alternative selectors
      const alternativeSelectors = await this.selectorEngine.generateAlternativeSelectors(
        target,
        this.options.selectorOptions.maxAlternatives
      );
      
      const boundingRect = target.getBoundingClientRect();

      return {
        id: `${event.type}_${Date.now()}_${this.sequenceNumber}`,
        type: event.type as any,
        timestamp: Date.now(),
        sequence: this.sequenceNumber,
        target: {
          selector,
          xpath: '',
          textContent: target.textContent || '',
          tagName: target.tagName,
          boundingRect: {
            x: boundingRect.x,
            y: boundingRect.y,
            width: boundingRect.width,
            height: boundingRect.height,
            top: boundingRect.top,
            right: boundingRect.right,
            bottom: boundingRect.bottom,
            left: boundingRect.left,
            toJSON: () => ({}),
          },
          path: [],
          alternativeSelectors,
        },
        data: this.extractEventDataFromEvent(event),
        context: this.createEventContext(),
        metadata: await this.createEventMetadata({ selector: selector }),
      };
    } catch (error) {
      console.warn('Failed to create event data:', error);
      return null;
    }
  }


  async handleNavigationChange(url: string, title?: string): Promise<void> {
    if (!this._isRecording || this._isPaused) return;
    
    // Create a navigation event
    const navigationEvent: RecordedEvent = {
      id: `nav_${Date.now()}_${this.sequenceNumber}`,
      type: 'navigation',
      timestamp: Date.now(),
      sequence: this.sequenceNumber++,
      target: {
        selector: 'window',
        xpath: '',
        textContent: '',
        tagName: 'WINDOW',
        boundingRect: { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON: () => ({}) },
        path: [],
        alternativeSelectors: [],
      },
      data: {
        type: 'navigation',
        url,
        title: document.title,
        referrer: document.referrer,
        timestamp: Date.now(),
      },
      context: this.createEventContext(),
      metadata: await this.createEventMetadata(),
    };
    
    this.eventBuffer.push(navigationEvent);
  }

  private createEventContext(): EventContext {
    const context: EventContext = {
      url: location.href,
      title: document.title,
      viewport: this.getViewportInfo(),
      userAgent: navigator.userAgent,
    };

    // Add performance information if enabled
    if (this.options.capturePerformance) {
      context.performance = this.getPerformanceInfo();
    }

    // Add console information if enabled
    if (this.options.captureConsole) {
      context.console = this.getConsoleInfo();
    }

    return context;
  }

  private async createEventMetadata(target?: any): Promise<any> {
    const metadata = {
      sessionId: this.sessionId,
      recordingMode: 'standard',
      reliability: {
        selectorScore: 1.0,
        alternativesCount: 0,
        elementStable: true,
        positionStable: true,
        attributesStable: true,
        timingVariability: 0,
        networkDependency: false,
        confidence: 1.0,
      },
      annotations: [],
      custom: {},
    };

    // Add screenshot if enabled and target provided
    if (this.options.captureScreenshots && target) {
      metadata.screenshot = await this.captureScreenshot(target);
    }

    return metadata;
  }
}