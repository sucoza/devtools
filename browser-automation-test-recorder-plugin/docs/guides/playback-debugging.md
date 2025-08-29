# Playback & Debugging Guide

Master test playback, debugging techniques, and troubleshooting strategies to ensure your recorded tests run reliably across different environments and scenarios.

## Table of Contents

1. [Playback Engine Overview](#playback-engine-overview)
2. [Basic Playback Operations](#basic-playback-operations)
3. [Advanced Playback Features](#advanced-playback-features)
4. [Debugging Techniques](#debugging-techniques)
5. [Error Handling & Recovery](#error-handling--recovery)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Playback Engine Overview

The Browser Automation Test Recorder includes a sophisticated playback engine that can execute recorded events with various configuration options and debugging capabilities.

### Playback Engine Architecture

```typescript
interface PlaybackEngine {
  // Core execution methods
  play(events: RecordedEvent[], options?: PlaybackOptions): Promise<PlaybackResult>;
  pause(): void;
  resume(): void;
  stop(): void;
  stepForward(): Promise<void>;
  stepBackward(): Promise<void>;
  
  // State management
  getCurrentStep(): number;
  getTotalSteps(): number;
  isPlaying(): boolean;
  isPaused(): boolean;
  
  // Configuration
  setSpeed(speed: number): void;
  setBreakpoints(steps: number[]): void;
  enableStepMode(): void;
  disableStepMode(): void;
}
```

### Playback Options

Configure playback behavior with comprehensive options:

```typescript
interface PlaybackOptions {
  // Speed control
  speed: number;                    // Playback speed (0.1x to 10x)
  stepDelay: number;               // Minimum delay between steps (ms)
  
  // Error handling
  continueOnError: boolean;        // Continue playback after errors
  retryAttempts: number;           // Number of retry attempts per step
  retryDelay: number;              // Delay between retry attempts
  
  // Screenshots
  screenshotOnError: boolean;      // Capture screenshot on failure
  screenshotOnStep: boolean;       // Capture screenshot at each step
  
  // Selector handling
  enableSelectorHealing: boolean;  // Auto-heal broken selectors
  selectorTimeout: number;         // Timeout for selector resolution
  
  // Debugging
  enableStepMode: boolean;         // Pause after each step
  breakpoints: number[];           // Step numbers to pause at
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  
  // Environment
  baseUrl?: string;               // Override recorded URLs
  viewport?: { width: number; height: number };
  userAgent?: string;
}
```

## Basic Playback Operations

### Starting Playback

Execute recorded events with the playback engine:

```typescript
import { PlaybackEngine, RecordedEvent } from '@tanstack/browser-automation-test-recorder';

// Initialize playback engine
const playbackEngine = new PlaybackEngine({
  selectorResolver: selectorEngine,
  cdpClient: chromeDevToolsClient
});

// Load recorded events
const events: RecordedEvent[] = JSON.parse(recordingData);

// Start playback with options
const result = await playbackEngine.play(events, {
  speed: 1.0,                     // Normal speed
  continueOnError: false,         // Stop on first error
  screenshotOnError: true,        // Capture failure screenshots
  enableSelectorHealing: true,    // Auto-heal selectors
  retryAttempts: 3               // Retry failed steps
});

console.log('Playback completed:', result);
```

### Playback Controls

Control playback execution in real-time:

```typescript
// Start playback in step mode
await playbackEngine.play(events, {
  enableStepMode: true,
  speed: 0.5
});

// Control playback programmatically
playbackEngine.pause();
console.log(`Paused at step ${playbackEngine.getCurrentStep()}`);

// Step through events one by one
await playbackEngine.stepForward();
console.log('Executed next step');

// Resume normal playback
playbackEngine.resume();

// Stop playback completely
playbackEngine.stop();
```

### Playback Results

Analyze playback results for insights:

```typescript
interface PlaybackResult {
  success: boolean;               // Overall success status
  completedSteps: number;         // Number of steps completed
  totalSteps: number;            // Total number of steps
  duration: number;              // Total execution time (ms)
  errors: PlaybackError[];       // Any errors encountered
  screenshots: Screenshot[];      // Captured screenshots
  performance: PerformanceData;   // Performance metrics
  healedSelectors: number;        // Number of selectors healed
}

// Process results
if (result.success) {
  console.log(`✅ Playback completed successfully in ${result.duration}ms`);
  console.log(`🔧 Healed ${result.healedSelectors} selectors automatically`);
} else {
  console.log(`❌ Playback failed at step ${result.completedSteps}`);
  result.errors.forEach(error => {
    console.error(`Error: ${error.message} at step ${error.step}`);
  });
}
```

## Advanced Playback Features

### Breakpoint Management

Set strategic breakpoints for debugging:

```typescript
class BreakpointManager {
  private breakpoints = new Set<number>();
  private conditionalBreakpoints = new Map<number, () => boolean>();
  
  // Add simple breakpoint
  addBreakpoint(step: number): void {
    this.breakpoints.add(step);
    playbackEngine.setBreakpoints(Array.from(this.breakpoints));
  }
  
  // Add conditional breakpoint
  addConditionalBreakpoint(step: number, condition: () => boolean): void {
    this.conditionalBreakpoints.set(step, condition);
  }
  
  // Check if should break at current step
  shouldBreak(step: number): boolean {
    if (this.breakpoints.has(step)) return true;
    
    const condition = this.conditionalBreakpoints.get(step);
    return condition ? condition() : false;
  }
}

// Usage
const breakpointManager = new BreakpointManager();

// Break at specific steps
breakpointManager.addBreakpoint(5);  // Break at step 5
breakpointManager.addBreakpoint(15); // Break at step 15

// Break when element appears
breakpointManager.addConditionalBreakpoint(10, () => {
  return document.querySelector('.error-message') !== null;
});

// Break on console errors
breakpointManager.addConditionalBreakpoint(0, () => {
  return console.error.length > 0; // If using console error tracking
});
```

### Variable Speed Playback

Control playback speed dynamically:

```typescript
class SpeedController {
  private currentSpeed = 1.0;
  
  // Speed presets
  static readonly SPEEDS = {
    VERY_SLOW: 0.1,
    SLOW: 0.25,
    NORMAL: 1.0,
    FAST: 2.0,
    VERY_FAST: 5.0
  };
  
  setSpeed(speed: number): void {
    this.currentSpeed = Math.max(0.1, Math.min(10.0, speed));
    playbackEngine.setSpeed(this.currentSpeed);
  }
  
  // Adjust speed based on event type
  adjustSpeedForEvent(event: RecordedEvent): void {
    switch (event.type) {
      case 'input':
        // Slow down for input to simulate realistic typing
        this.setSpeed(0.5);
        break;
        
      case 'navigation':
        // Speed up navigation events
        this.setSpeed(2.0);
        break;
        
      case 'click':
        // Normal speed for clicks
        this.setSpeed(1.0);
        break;
        
      default:
        this.setSpeed(1.0);
    }
  }
  
  // Slow down when errors occur
  onError(): void {
    this.setSpeed(0.1); // Very slow for debugging
  }
}

// Usage
const speedController = new SpeedController();

playbackEngine.on('step-starting', (event) => {
  speedController.adjustSpeedForEvent(event);
});

playbackEngine.on('error', () => {
  speedController.onError();
});
```

### Screenshot Comparison

Compare screenshots during playback:

```typescript
class VisualComparison {
  private baselineImages = new Map<number, string>();
  
  async setBaseline(step: number, screenshotData: string): Promise<void> {
    this.baselineImages.set(step, screenshotData);
  }
  
  async compareAtStep(step: number, currentScreenshot: string): Promise<ComparisonResult> {
    const baseline = this.baselineImages.get(step);
    if (!baseline) {
      return { hasBaseline: false, match: null };
    }
    
    // Use image comparison library (like pixelmatch)
    const comparison = await this.compareImages(baseline, currentScreenshot);
    
    return {
      hasBaseline: true,
      match: comparison.pixelDifference < 0.01, // 1% threshold
      pixelDifference: comparison.pixelDifference,
      differenceImage: comparison.diffImage
    };
  }
  
  private async compareImages(baseline: string, current: string): Promise<ImageComparison> {
    // Implementation using pixelmatch or similar library
    const img1 = await this.loadImage(baseline);
    const img2 = await this.loadImage(current);
    
    const diff = new ImageData(img1.width, img1.height);
    const pixelDifference = pixelmatch(
      img1.data, img2.data, diff.data,
      img1.width, img1.height,
      { threshold: 0.1 }
    );
    
    return {
      pixelDifference: pixelDifference / (img1.width * img1.height),
      diffImage: diff
    };
  }
}

// Usage during playback
const visualComparison = new VisualComparison();

playbackEngine.on('step-completed', async (step, screenshot) => {
  if (screenshot) {
    const comparison = await visualComparison.compareAtStep(step, screenshot);
    
    if (comparison.hasBaseline && !comparison.match) {
      console.warn(`Visual difference detected at step ${step}: ${comparison.pixelDifference * 100}%`);
      
      // Optionally pause playback for manual review
      if (comparison.pixelDifference > 0.05) { // 5% difference
        playbackEngine.pause();
        console.log('Playback paused for visual review');
      }
    }
  }
});
```

## Debugging Techniques

### Step-by-Step Debugging

Execute events one at a time for detailed analysis:

```typescript
class StepDebugger {
  private currentStep = 0;
  private events: RecordedEvent[] = [];
  
  async loadEvents(events: RecordedEvent[]): Promise<void> {
    this.events = events;
    this.currentStep = 0;
  }
  
  async executeNextStep(): Promise<StepResult> {
    if (this.currentStep >= this.events.length) {
      throw new Error('No more steps to execute');
    }
    
    const event = this.events[this.currentStep];
    console.log(`🔍 Executing step ${this.currentStep}: ${event.type}`);
    console.log(`   Target: ${event.target.selector}`);
    console.log(`   Data:`, event.data);
    
    try {
      // Take screenshot before execution
      const beforeScreenshot = await this.takeScreenshot();
      
      // Execute the event
      const result = await playbackEngine.executeStep(event);
      
      // Take screenshot after execution
      const afterScreenshot = await this.takeScreenshot();
      
      // Log results
      console.log(`✅ Step ${this.currentStep} completed successfully`);
      
      this.currentStep++;
      
      return {
        step: this.currentStep - 1,
        event,
        success: true,
        beforeScreenshot,
        afterScreenshot,
        error: null
      };
      
    } catch (error) {
      console.error(`❌ Step ${this.currentStep} failed:`, error.message);
      
      return {
        step: this.currentStep,
        event,
        success: false,
        beforeScreenshot: await this.takeScreenshot(),
        afterScreenshot: null,
        error
      };
    }
  }
  
  async executeStepsUntil(targetStep: number): Promise<StepResult[]> {
    const results: StepResult[] = [];
    
    while (this.currentStep < targetStep && this.currentStep < this.events.length) {
      const result = await this.executeNextStep();
      results.push(result);
      
      if (!result.success) {
        console.log(`Stopped at step ${this.currentStep} due to error`);
        break;
      }
    }
    
    return results;
  }
  
  private async takeScreenshot(): Promise<string> {
    // Implementation depends on your screenshot library
    return await captureScreenshot();
  }
}

// Usage
const debugger = new StepDebugger();
await debugger.loadEvents(recordedEvents);

// Execute one step at a time
const step1 = await debugger.executeNextStep();
if (step1.success) {
  const step2 = await debugger.executeNextStep();
  // Continue debugging...
}

// Or execute multiple steps
const results = await debugger.executeStepsUntil(10);
console.log(`Executed ${results.length} steps`);
```

### Element Inspection

Inspect elements during playback:

```typescript
class ElementInspector {
  async inspectElement(selector: string): Promise<ElementInfo> {
    const elements = document.querySelectorAll(selector);
    
    if (elements.length === 0) {
      return {
        found: false,
        count: 0,
        selector,
        suggestions: await this.suggestAlternatives(selector)
      };
    }
    
    const element = elements[0] as HTMLElement;
    const info: ElementInfo = {
      found: true,
      count: elements.length,
      selector,
      element: {
        tagName: element.tagName.toLowerCase(),
        id: element.id,
        className: element.className,
        textContent: element.textContent?.trim(),
        attributes: this.getElementAttributes(element),
        computedStyle: window.getComputedStyle(element),
        boundingRect: element.getBoundingClientRect(),
        isVisible: this.isElementVisible(element),
        isInteractable: this.isElementInteractable(element)
      }
    };
    
    return info;
  }
  
  private getElementAttributes(element: HTMLElement): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }
    
    return attributes;
  }
  
  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           rect.width > 0 &&
           rect.height > 0;
  }
  
  private isElementInteractable(element: HTMLElement): boolean {
    if (!this.isElementVisible(element)) return false;
    
    const style = window.getComputedStyle(element);
    return style.pointerEvents !== 'none' && 
           !element.hasAttribute('disabled');
  }
  
  private async suggestAlternatives(selector: string): Promise<string[]> {
    // Try to find similar elements and suggest alternative selectors
    const suggestions: string[] = [];
    
    // Try variations of the selector
    const variations = [
      selector.replace(/\[.*?\]/g, ''),  // Remove attribute selectors
      selector.split(' ').pop() || '',   // Take only the last part
      selector.replace(/:nth-child\(\d+\)/g, '') // Remove nth-child selectors
    ];
    
    for (const variation of variations) {
      if (variation && document.querySelector(variation)) {
        suggestions.push(variation);
      }
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  }
}

// Usage during debugging
const inspector = new ElementInspector();

playbackEngine.on('step-failed', async (step, error) => {
  const event = events[step];
  const elementInfo = await inspector.inspectElement(event.target.selector);
  
  console.log('🔍 Element inspection results:');
  console.log(`   Selector: ${event.target.selector}`);
  console.log(`   Found: ${elementInfo.found}`);
  console.log(`   Count: ${elementInfo.count}`);
  
  if (!elementInfo.found && elementInfo.suggestions.length > 0) {
    console.log('💡 Suggested alternatives:');
    elementInfo.suggestions.forEach(suggestion => {
      console.log(`   - ${suggestion}`);
    });
  }
  
  if (elementInfo.found && elementInfo.element) {
    console.log(`   Visible: ${elementInfo.element.isVisible}`);
    console.log(`   Interactable: ${elementInfo.element.isInteractable}`);
    console.log(`   Text: "${elementInfo.element.textContent}"`);
  }
});
```

### Network Request Monitoring

Monitor network activity during playback:

```typescript
class NetworkMonitor {
  private pendingRequests = new Map<string, NetworkRequest>();
  private completedRequests: NetworkRequest[] = [];
  
  startMonitoring(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const request = this.createRequestFromArgs(args);
      this.pendingRequests.set(request.id, request);
      
      try {
        const response = await originalFetch(...args);
        this.handleRequestComplete(request.id, response);
        return response;
      } catch (error) {
        this.handleRequestError(request.id, error);
        throw error;
      }
    };
    
    // Intercept XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = class extends originalXHR {
      constructor() {
        super();
        this.addEventListener('loadend', () => {
          // Handle XHR completion
        });
      }
    };
  }
  
  getActiveRequests(): NetworkRequest[] {
    return Array.from(this.pendingRequests.values());
  }
  
  getCompletedRequests(): NetworkRequest[] {
    return this.completedRequests;
  }
  
  waitForAllRequests(timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkRequests = () => {
        if (this.pendingRequests.size === 0) {
          resolve();
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for ${this.pendingRequests.size} requests`));
          return;
        }
        
        setTimeout(checkRequests, 100);
      };
      
      checkRequests();
    });
  }
  
  private createRequestFromArgs(args: any[]): NetworkRequest {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const options = args[1] || {};
    
    return {
      id: `${Date.now()}-${Math.random()}`,
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      startTime: Date.now(),
      status: 'pending'
    };
  }
  
  private handleRequestComplete(id: string, response: Response): void {
    const request = this.pendingRequests.get(id);
    if (request) {
      request.status = 'completed';
      request.response = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      };
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      
      this.completedRequests.push(request);
      this.pendingRequests.delete(id);
    }
  }
  
  private handleRequestError(id: string, error: Error): void {
    const request = this.pendingRequests.get(id);
    if (request) {
      request.status = 'failed';
      request.error = error.message;
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      
      this.completedRequests.push(request);
      this.pendingRequests.delete(id);
    }
  }
}

// Usage during playback
const networkMonitor = new NetworkMonitor();
networkMonitor.startMonitoring();

playbackEngine.on('step-starting', async (step) => {
  console.log(`📊 Active requests: ${networkMonitor.getActiveRequests().length}`);
});

playbackEngine.on('step-completed', async (step) => {
  // Wait for any pending requests to complete
  try {
    await networkMonitor.waitForAllRequests(5000);
    console.log('✅ All network requests completed');
  } catch (error) {
    console.warn('⚠️ Some requests still pending:', error.message);
  }
});
```

## Error Handling & Recovery

### Automatic Error Recovery

Implement intelligent error recovery strategies:

```typescript
class ErrorRecoveryManager {
  private recoveryStrategies: RecoveryStrategy[] = [];
  
  constructor() {
    this.initializeDefaultStrategies();
  }
  
  private initializeDefaultStrategies(): void {
    // Strategy 1: Selector healing
    this.addStrategy({
      name: 'selector-healing',
      canRecover: (error) => error.type === 'element-not-found',
      recover: async (error, event) => {
        console.log('🔧 Attempting selector healing...');
        
        const healingResult = await selectorEngine.healSelector(
          event.target.selector,
          document.body
        );
        
        if (healingResult.success) {
          console.log(`✅ Healed selector: ${healingResult.healedSelector}`);
          event.target.selector = healingResult.healedSelector;
          return { success: true, retryEvent: event };
        }
        
        return { success: false };
      }
    });
    
    // Strategy 2: Wait and retry
    this.addStrategy({
      name: 'wait-and-retry',
      canRecover: (error) => error.type === 'element-not-found' || error.type === 'timeout',
      recover: async (error, event) => {
        console.log('⏳ Waiting before retry...');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if element exists now
        const element = document.querySelector(event.target.selector);
        if (element) {
          console.log('✅ Element found after wait');
          return { success: true, retryEvent: event };
        }
        
        return { success: false };
      }
    });
    
    // Strategy 3: Skip non-critical steps
    this.addStrategy({
      name: 'skip-non-critical',
      canRecover: (error) => true,
      recover: async (error, event) => {
        // Determine if step is critical based on event type
        const nonCriticalEvents = ['scroll', 'mouseover', 'focus'];
        
        if (nonCriticalEvents.includes(event.type)) {
          console.log(`⏭️ Skipping non-critical event: ${event.type}`);
          return { success: true, skip: true };
        }
        
        return { success: false };
      }
    });
  }
  
  addStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }
  
  async attemptRecovery(error: PlaybackError, event: RecordedEvent): Promise<RecoveryResult> {
    console.log(`🚨 Error occurred: ${error.message}`);
    console.log(`   Event: ${event.type} on ${event.target.selector}`);
    
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        console.log(`🔄 Trying recovery strategy: ${strategy.name}`);
        
        try {
          const result = await strategy.recover(error, event);
          
          if (result.success) {
            console.log(`✅ Recovery successful with strategy: ${strategy.name}`);
            return result;
          }
        } catch (recoveryError) {
          console.warn(`⚠️ Recovery strategy failed: ${recoveryError.message}`);
        }
      }
    }
    
    console.log('❌ All recovery strategies failed');
    return { success: false };
  }
}

// Usage with playback engine
const recoveryManager = new ErrorRecoveryManager();

playbackEngine.on('step-error', async (step, error, event) => {
  const recovery = await recoveryManager.attemptRecovery(error, event);
  
  if (recovery.success) {
    if (recovery.skip) {
      // Skip this step and continue
      playbackEngine.skipCurrentStep();
    } else if (recovery.retryEvent) {
      // Retry with modified event
      await playbackEngine.retryCurrentStep(recovery.retryEvent);
    }
  } else {
    // All recovery attempts failed
    console.log('🛑 Playback stopped due to unrecoverable error');
    playbackEngine.stop();
  }
});
```

### Error Reporting

Generate comprehensive error reports:

```typescript
class ErrorReporter {
  private errors: DetailedError[] = [];
  
  async reportError(
    step: number,
    event: RecordedEvent,
    error: Error,
    context: ErrorContext
  ): Promise<void> {
    const detailedError: DetailedError = {
      step,
      event,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      },
      screenshot: await this.captureScreenshot(),
      domSnapshot: this.captureDOMSnapshot(event.target.selector),
      elementInfo: await this.analyzeElement(event.target.selector)
    };
    
    this.errors.push(detailedError);
    
    // Send to error tracking service
    this.sendToErrorTracking(detailedError);
  }
  
  private async captureScreenshot(): Promise<string> {
    // Capture screenshot of current state
    return await takeScreenshot();
  }
  
  private captureDOMSnapshot(selector: string): string {
    // Capture relevant DOM around the target element
    const element = document.querySelector(selector);
    if (element) {
      const parent = element.parentElement || document.body;
      return parent.outerHTML;
    }
    
    return document.body.innerHTML;
  }
  
  private async analyzeElement(selector: string): Promise<ElementAnalysis> {
    const elements = document.querySelectorAll(selector);
    
    return {
      selectorExists: elements.length > 0,
      matchCount: elements.length,
      isVisible: elements.length > 0 ? this.isVisible(elements[0] as HTMLElement) : false,
      isInteractable: elements.length > 0 ? this.isInteractable(elements[0] as HTMLElement) : false,
      computedStyles: elements.length > 0 ? window.getComputedStyle(elements[0]).cssText : null
    };
  }
  
  generateErrorReport(): ErrorReport {
    return {
      summary: {
        totalErrors: this.errors.length,
        errorTypes: this.getErrorTypeDistribution(),
        mostCommonErrors: this.getMostCommonErrors(),
        criticalErrors: this.errors.filter(e => e.context.severity === 'critical').length
      },
      errors: this.errors,
      recommendations: this.generateRecommendations()
    };
  }
  
  private generateRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Analyze error patterns
    const selectorErrors = this.errors.filter(e => 
      e.error.message.includes('element not found')
    ).length;
    
    if (selectorErrors > this.errors.length * 0.5) {
      recommendations.push({
        type: 'selector-improvement',
        priority: 'high',
        message: 'Many selector-related errors detected. Consider improving selector strategy.',
        actions: [
          'Add data-testid attributes to elements',
          'Enable selector healing',
          'Review selector preferences configuration'
        ]
      });
    }
    
    const timeoutErrors = this.errors.filter(e =>
      e.error.message.includes('timeout')
    ).length;
    
    if (timeoutErrors > 2) {
      recommendations.push({
        type: 'performance-optimization',
        priority: 'medium',
        message: 'Multiple timeout errors suggest performance issues.',
        actions: [
          'Increase timeout values',
          'Add explicit waits before interactions',
          'Optimize page loading performance'
        ]
      });
    }
    
    return recommendations;
  }
}

// Usage
const errorReporter = new ErrorReporter();

playbackEngine.on('step-error', async (step, error, event) => {
  await errorReporter.reportError(step, event, error, {
    severity: 'error',
    recoverable: false,
    retryCount: 0
  });
});

// Generate report at end of playback
playbackEngine.on('playback-complete', () => {
  const report = errorReporter.generateErrorReport();
  console.log('📋 Error Report:', report);
  
  // Save report or send to analytics
  saveErrorReport(report);
});
```

## Performance Optimization

### Playback Performance Tuning

Optimize playback performance for different scenarios:

```typescript
class PlaybackOptimizer {
  static getOptimizedConfig(scenario: PlaybackScenario): PlaybackOptions {
    switch (scenario) {
      case 'development':
        return {
          speed: 0.5,                    // Slower for debugging
          stepDelay: 500,                // Visible delays
          screenshotOnStep: true,        // Capture all steps
          screenshotOnError: true,       // Error screenshots
          enableSelectorHealing: true,   // Auto-fix issues
          retryAttempts: 3,             // Multiple retries
          logLevel: 'debug'             // Verbose logging
        };
        
      case 'ci-testing':
        return {
          speed: 2.0,                   // Faster execution
          stepDelay: 100,               // Minimal delays
          screenshotOnStep: false,      // No step screenshots
          screenshotOnError: true,      // Only error screenshots
          enableSelectorHealing: true,  // Auto-healing
          retryAttempts: 2,            // Limited retries
          logLevel: 'error'            // Only errors
        };
        
      case 'load-testing':
        return {
          speed: 5.0,                   // Maximum speed
          stepDelay: 0,                 // No delays
          screenshotOnStep: false,      // No screenshots
          screenshotOnError: false,     // No error screenshots
          enableSelectorHealing: false, // No healing overhead
          retryAttempts: 1,            // Single attempt
          logLevel: 'none'             // No logging
        };
        
      case 'visual-testing':
        return {
          speed: 1.0,                   // Normal speed
          stepDelay: 1000,              // Allow rendering
          screenshotOnStep: true,       // Capture all steps
          screenshotOnError: true,      // Error screenshots
          enableSelectorHealing: true,  // Maintain accuracy
          retryAttempts: 2,            // Limited retries
          logLevel: 'info'             // Moderate logging
        };
        
      default:
        return {
          speed: 1.0,
          stepDelay: 200,
          screenshotOnStep: false,
          screenshotOnError: true,
          enableSelectorHealing: true,
          retryAttempts: 2,
          logLevel: 'warn'
        };
    }
  }
  
  static optimizeEvents(events: RecordedEvent[]): RecordedEvent[] {
    return events
      // Remove redundant scroll events
      .filter((event, index, array) => {
        if (event.type !== 'scroll') return true;
        
        const nextEvent = array[index + 1];
        return !nextEvent || 
               nextEvent.type !== 'scroll' ||
               event.target.selector !== nextEvent.target.selector;
      })
      
      // Merge rapid input events
      .reduce((acc, event) => {
        if (event.type === 'input') {
          const lastEvent = acc[acc.length - 1];
          if (lastEvent?.type === 'input' && 
              lastEvent.target.selector === event.target.selector &&
              event.timestamp - lastEvent.timestamp < 200) {
            // Update the last event with new value
            lastEvent.data.value = event.data.value;
            lastEvent.timestamp = event.timestamp;
            return acc;
          }
        }
        
        acc.push(event);
        return acc;
      }, [] as RecordedEvent[])
      
      // Add intelligent waits
      .map((event, index, array) => {
        const nextEvent = array[index + 1];
        
        // Add wait after navigation
        if (event.type === 'navigation' && nextEvent) {
          return [
            event,
            {
              ...event,
              id: `wait-${event.id}`,
              type: 'wait',
              timestamp: event.timestamp + 100,
              sequence: event.sequence + 0.5,
              data: {
                condition: 'networkIdle',
                timeout: 5000,
                description: 'Wait for page to load after navigation'
              }
            }
          ];
        }
        
        // Add wait after form submission
        if (event.type === 'submit' && nextEvent?.type === 'navigation') {
          return [
            event,
            {
              ...event,
              id: `wait-${event.id}`,
              type: 'wait',
              timestamp: event.timestamp + 100,
              sequence: event.sequence + 0.5,
              data: {
                duration: Math.min(nextEvent.timestamp - event.timestamp, 3000),
                description: 'Wait for form submission to complete'
              }
            }
          ];
        }
        
        return [event];
      })
      .flat();
  }
}

// Usage
const scenario = process.env.NODE_ENV === 'production' ? 'ci-testing' : 'development';
const optimizedConfig = PlaybackOptimizer.getOptimizedConfig(scenario);
const optimizedEvents = PlaybackOptimizer.optimizeEvents(recordedEvents);

await playbackEngine.play(optimizedEvents, optimizedConfig);
```

## Troubleshooting Common Issues

### Issue: Playback Fails at Specific Steps

**Problem**: Playback consistently fails at the same step

**Debugging Steps:**
```typescript
// 1. Enable step-by-step mode
const result = await playbackEngine.play(events, {
  enableStepMode: true,
  logLevel: 'debug'
});

// 2. Inspect the failing step
const failingEvent = events[failedStep];
console.log('Failing event:', failingEvent);

// 3. Check element availability
const elementInfo = await inspector.inspectElement(failingEvent.target.selector);
console.log('Element info:', elementInfo);

// 4. Try alternative selectors
if (!elementInfo.found && failingEvent.target.fallbackSelectors) {
  for (const fallback of failingEvent.target.fallbackSelectors) {
    const fallbackInfo = await inspector.inspectElement(fallback);
    if (fallbackInfo.found) {
      console.log(`Alternative selector works: ${fallback}`);
      break;
    }
  }
}
```

### Issue: Selectors Not Working After DOM Changes

**Problem**: Recorded selectors fail when DOM structure changes

**Solutions:**
```typescript
// 1. Enable selector healing
const playbackConfig = {
  enableSelectorHealing: true,
  selectorTimeout: 10000
};

// 2. Use more robust selectors
const improvedSelectorEngine = new SelectorEngine({
  preferredAttributes: ['data-testid', 'aria-label', 'id'],
  enableHealing: true,
  healingStrategies: ['text', 'attributes', 'hierarchy'],
  confidenceThreshold: 0.9
});

// 3. Manual selector fixing
async function fixSelectors(events: RecordedEvent[]): Promise<RecordedEvent[]> {
  for (const event of events) {
    const element = document.querySelector(event.target.selector);
    if (!element) {
      // Try to find element by other means
      const byText = document.evaluate(
        `.//*[contains(text(), "${event.target.textContent}")]`,
        document.body,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue as Element;
      
      if (byText) {
        const newSelector = await selectorEngine.generateSelector(byText);
        event.target.selector = newSelector.primary;
        console.log(`Fixed selector: ${newSelector.primary}`);
      }
    }
  }
  
  return events;
}
```

### Issue: Performance Problems During Playback

**Problem**: Playback is slow or causes browser issues

**Solutions:**
```typescript
// 1. Optimize playback settings
const performanceConfig = {
  speed: 2.0,                    // Faster playback
  screenshotOnStep: false,       // Disable step screenshots
  screenshotOnError: true,       // Keep error screenshots
  stepDelay: 50,                 // Reduce delays
  logLevel: 'error'              // Minimal logging
};

// 2. Batch similar operations
function batchEvents(events: RecordedEvent[]): RecordedEvent[] {
  // Group consecutive input events
  const batched: RecordedEvent[] = [];
  let currentBatch: RecordedEvent[] = [];
  
  events.forEach(event => {
    if (event.type === 'input' && 
        currentBatch.length > 0 && 
        currentBatch[0].target.selector === event.target.selector) {
      currentBatch.push(event);
    } else {
      if (currentBatch.length > 0) {
        // Create a single input event from batch
        const finalValue = currentBatch[currentBatch.length - 1].data.value;
        batched.push({
          ...currentBatch[0],
          data: { ...currentBatch[0].data, value: finalValue }
        });
        currentBatch = [];
      }
      
      if (event.type === 'input') {
        currentBatch.push(event);
      } else {
        batched.push(event);
      }
    }
  });
  
  return batched;
}

// 3. Monitor memory usage
function monitorMemory() {
  if (performance.memory) {
    const memInfo = performance.memory;
    console.log(`Memory usage: ${memInfo.usedJSHeapSize / 1024 / 1024}MB`);
    
    if (memInfo.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
      console.warn('High memory usage detected during playback');
      // Consider reducing screenshot capture or other memory-intensive features
    }
  }
}

setInterval(monitorMemory, 5000);
```

## Summary

Effective playback and debugging involves:

1. **Proper Configuration** - Choose appropriate playback settings for your scenario
2. **Step-by-Step Analysis** - Use debugging tools to understand failures
3. **Error Recovery** - Implement automatic recovery strategies
4. **Performance Optimization** - Optimize for speed and resource usage
5. **Comprehensive Monitoring** - Track network, memory, and visual changes
6. **Systematic Troubleshooting** - Use structured approaches to resolve issues

With these techniques, you can ensure reliable test playback across different environments and scenarios.

---

*Continue to [Code Generation Guide](./code-generation.md) to learn about converting recordings into framework-specific test code.*