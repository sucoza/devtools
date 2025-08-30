/**
 * Browser Automation Playback Engine
 * Executes recorded events with professional-grade features
 */

import type {
  RecordedEvent,
  EventExecutionResult,
  PlaybackOptions,
  PlaybackError,
  PlaybackStatus,
  EventType,
  EventData,
  MouseEventData,
  KeyboardEventData,
  FormEventData,
  NavigationEventData,
  ScrollEventData,
  WaitEventData,
  AssertionEventData,
  ScreenshotInfo,
  ScreenshotOptions,
  CDPRemoteObject,
} from '../types';

import { CDPClient } from './cdp-client';
import { SelectorEngine } from './selector-engine';

/**
 * Playback execution options
 */
export interface PlaybackEngineOptions extends PlaybackOptions {
  // Enhanced options
  stepMode?: boolean;
  breakpoints?: string[]; // Event IDs
  captureScreenshots?: boolean;
  screenshotInterval?: number;
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
  maxRetries?: number;
  retryDelay?: number;
  
  // Element waiting options
  elementTimeout?: number;
  visibilityTimeout?: number;
  stabilityTimeout?: number;
  
  // Auto-healing options
  selectorFallback?: boolean;
  autoHeal?: boolean;
  healingStrategies?: ('retry' | 'alternative' | 'position')[];
  
  // Performance options
  animationDelay?: number;
  networkTimeout?: number;
  pageLoadTimeout?: number;
}

/**
 * Playback execution context
 */
export interface PlaybackContext {
  startTime: number;
  currentEventIndex: number;
  totalEvents: number;
  speed: number;
  errors: PlaybackError[];
  screenshots: ScreenshotInfo[];
  variables: Map<string, any>;
  
  // State flags
  isPaused: boolean;
  isAborted: boolean;
  isStepMode: boolean;
  
  // Performance metrics
  executionTimes: number[];
  waitTimes: number[];
  failureRate: number;
}

/**
 * Event execution handler type
 */
type EventExecutionHandler = (
  event: RecordedEvent,
  context: PlaybackContext,
  options: PlaybackEngineOptions
) => Promise<EventExecutionResult>;

/**
 * Professional browser automation playback engine
 */
export class PlaybackEngine {
  private cdpClient: CDPClient;
  private selectorEngine: SelectorEngine;
  private executionHandlers: Map<EventType, EventExecutionHandler>;
  private context: PlaybackContext | null = null;
  private abortController: AbortController | null = null;
  
  // Event emitters
  private eventListeners: Map<string, Function[]> = new Map();
  
  constructor(cdpClient: CDPClient, selectorEngine: SelectorEngine) {
    this.cdpClient = cdpClient;
    this.selectorEngine = selectorEngine;
    this.executionHandlers = new Map();
    
    this.setupExecutionHandlers();
  }

  /**
   * Execute a sequence of recorded events
   */
  async playEvents(
    events: RecordedEvent[],
    options: Partial<PlaybackEngineOptions> = {}
  ): Promise<PlaybackStatus> {
    const defaultOptions: PlaybackEngineOptions = {
      speed: 1.0,
      timeout: 5000,
      continueOnError: false,
      screenshotOnError: true,
      highlightElements: true,
      waitBetweenEvents: 100,
      stepMode: false,
      captureScreenshots: false,
      screenshotInterval: 1000,
      logLevel: 'info',
      maxRetries: 3,
      retryDelay: 500,
      elementTimeout: 5000,
      visibilityTimeout: 2000,
      stabilityTimeout: 1000,
      selectorFallback: true,
      autoHeal: true,
      healingStrategies: ['retry', 'alternative', 'position'],
      animationDelay: 50,
      networkTimeout: 10000,
      pageLoadTimeout: 30000,
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    // Initialize playback context
    this.context = {
      startTime: Date.now(),
      currentEventIndex: 0,
      totalEvents: events.length,
      speed: finalOptions.speed,
      errors: [],
      screenshots: [],
      variables: new Map(),
      isPaused: false,
      isAborted: false,
      isStepMode: finalOptions.stepMode || false,
      executionTimes: [],
      waitTimes: [],
      failureRate: 0,
    };

    // Setup abort controller
    this.abortController = new AbortController();
    
    this.log('info', `Starting playback of ${events.length} events`);
    this.emit('playback:started', { events: events.length, options: finalOptions });

    try {
      // Execute events sequentially
      for (let i = 0; i < events.length; i++) {
        if (this.context.isAborted) {
          this.log('info', 'Playback aborted');
          break;
        }

        this.context.currentEventIndex = i;
        const event = events[i];
        
        this.log('debug', `Executing event ${i + 1}/${events.length}: ${event.type}`);
        this.emit('playback:event-start', { event, index: i });

        // Handle pause and step mode
        await this.handlePlaybackFlow();

        // Wait between events (adjusted by speed)
        if (i > 0) {
          const delay = finalOptions.waitBetweenEvents / finalOptions.speed;
          await this.sleep(delay);
        }

        // Execute the event
        const startTime = Date.now();
        let result: EventExecutionResult;

        try {
          result = await this.executeEvent(event, finalOptions);
          const executionTime = Date.now() - startTime;
          this.context.executionTimes.push(executionTime);
          
        } catch (error) {
          const executionTime = Date.now() - startTime;
          this.context.executionTimes.push(executionTime);
          
          const playbackError: PlaybackError = {
            id: `error_${Date.now()}`,
            eventId: event.id,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: Date.now(),
          };

          this.context.errors.push(playbackError);
          this.log('error', `Event execution failed: ${playbackError.message}`);

          // Capture error screenshot if enabled
          if (finalOptions.screenshotOnError) {
            try {
              const screenshot = await this.captureScreenshot({
                format: 'png',
                fullPage: false,
              });
              playbackError.screenshot = screenshot.data;
            } catch (screenshotError) {
              this.log('warn', 'Failed to capture error screenshot');
            }
          }

          result = {
            success: false,
            duration: executionTime,
            error: playbackError.message,
            screenshot: playbackError.screenshot,
          };

          // Stop on error if not continuing
          if (!finalOptions.continueOnError) {
            this.log('info', 'Stopping playback due to error');
            break;
          }
        }

        this.emit('playback:event-complete', { event, result, index: i });

        // Capture periodic screenshots
        if (finalOptions.captureScreenshots && 
            (i === 0 || (Date.now() - this.context.startTime) % finalOptions.screenshotInterval < 100)) {
          try {
            const screenshot = await this.captureScreenshot();
            this.context.screenshots.push(screenshot);
          } catch (error) {
            this.log('warn', 'Failed to capture periodic screenshot');
          }
        }

        // Update failure rate
        const totalExecuted = i + 1;
        const failureCount = this.context.errors.length;
        this.context.failureRate = failureCount / totalExecuted;
      }

      // Calculate final status
      const status: PlaybackStatus = {
        currentStep: this.context.currentEventIndex + 1,
        totalSteps: this.context.totalEvents,
        elapsed: Date.now() - this.context.startTime,
        estimated: this.estimateRemainingTime(),
        lastEventResult: undefined, // Would be set from last execution
      };

      this.log('info', `Playback completed. Success rate: ${((1 - this.context.failureRate) * 100).toFixed(1)}%`);
      this.emit('playback:completed', { status, errors: this.context.errors });

      return status;

    } catch (error) {
      this.log('error', `Playback failed: ${error instanceof Error ? error.message : String(error)}`);
      this.emit('playback:failed', { error });
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Execute a single event with retry logic and auto-healing
   */
  async executeEvent(
    event: RecordedEvent,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const handler = this.executionHandlers.get(event.type);
    
    if (!handler) {
      throw new Error(`No execution handler for event type: ${event.type}`);
    }

    let lastError: Error | null = null;
    const maxRetries = options.maxRetries || 3;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.log('debug', `Executing ${event.type} (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        // Add artificial delay for animations
        if (attempt > 0 && options.animationDelay) {
          await this.sleep(options.animationDelay * attempt);
        }

        const result = await handler(event, this.context!, options);
        
        if (result.success) {
          this.log('debug', `Event ${event.type} executed successfully`);
          return result;
        } else {
          throw new Error(result.error || 'Event execution failed');
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log('warn', `Attempt ${attempt + 1} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          // Try auto-healing on selector-related failures
          if (options.autoHeal && this.isSelectorError(lastError)) {
            this.log('info', 'Attempting to heal selector...');
            const healed = await this.attemptSelectorHealing(event, options);
            if (healed) {
              this.log('info', 'Selector healed successfully');
              continue; // Retry with healed selector
            }
          }

          // Wait before retry
          const delay = (options.retryDelay || 500) * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    throw lastError || new Error('Event execution failed after all retries');
  }

  /**
   * Step through a single event (debug mode)
   */
  async stepEvent(event: RecordedEvent, options: Partial<PlaybackEngineOptions> = {}): Promise<EventExecutionResult> {
    this.log('info', `Stepping through event: ${event.type}`);
    
    const stepOptions: PlaybackEngineOptions = {
      speed: 1.0,
      timeout: 5000,
      continueOnError: false,
      screenshotOnError: true,
      highlightElements: true,
      waitBetweenEvents: 100,
      ...options,
      stepMode: true,
    };

    return this.executeEvent(event, stepOptions);
  }

  /**
   * Pause playback execution
   */
  pause(): void {
    if (this.context) {
      this.context.isPaused = true;
      this.log('info', 'Playback paused');
      this.emit('playback:paused', {});
    }
  }

  /**
   * Resume paused playback
   */
  resume(): void {
    if (this.context) {
      this.context.isPaused = false;
      this.log('info', 'Playback resumed');
      this.emit('playback:resumed', {});
    }
  }

  /**
   * Stop/abort current playback
   */
  stop(): void {
    if (this.context) {
      this.context.isAborted = true;
      this.abortController?.abort();
      this.log('info', 'Playback stopped');
      this.emit('playback:stopped', {});
    }
  }

  /**
   * Get current playback status
   */
  getStatus(): PlaybackStatus | null {
    if (!this.context) return null;

    return {
      currentStep: this.context.currentEventIndex + 1,
      totalSteps: this.context.totalEvents,
      elapsed: Date.now() - this.context.startTime,
      estimated: this.estimateRemainingTime(),
    };
  }

  /**
   * Setup execution handlers for different event types
   */
  private setupExecutionHandlers(): void {
    // Mouse events
    this.executionHandlers.set('click', this.executeClickEvent.bind(this));
    this.executionHandlers.set('dblclick', this.executeClickEvent.bind(this));
    this.executionHandlers.set('mousedown', this.executeMouseEvent.bind(this));
    this.executionHandlers.set('mouseup', this.executeMouseEvent.bind(this));
    this.executionHandlers.set('mouseover', this.executeMouseEvent.bind(this));
    this.executionHandlers.set('contextmenu', this.executeClickEvent.bind(this));

    // Keyboard events
    this.executionHandlers.set('input', this.executeInputEvent.bind(this));
    this.executionHandlers.set('keydown', this.executeKeyboardEvent.bind(this));
    this.executionHandlers.set('keyup', this.executeKeyboardEvent.bind(this));
    this.executionHandlers.set('keypress', this.executeKeyboardEvent.bind(this));

    // Form events
    this.executionHandlers.set('change', this.executeFormEvent.bind(this));
    this.executionHandlers.set('submit', this.executeFormEvent.bind(this));
    this.executionHandlers.set('focus', this.executeFocusEvent.bind(this));
    this.executionHandlers.set('blur', this.executeFocusEvent.bind(this));

    // Navigation events
    this.executionHandlers.set('navigation', this.executeNavigationEvent.bind(this));
    this.executionHandlers.set('reload', this.executeNavigationEvent.bind(this));
    this.executionHandlers.set('back', this.executeNavigationEvent.bind(this));
    this.executionHandlers.set('forward', this.executeNavigationEvent.bind(this));

    // Scroll events
    this.executionHandlers.set('scroll', this.executeScrollEvent.bind(this));

    // Special events
    this.executionHandlers.set('wait', this.executeWaitEvent.bind(this));
    this.executionHandlers.set('assertion', this.executeAssertionEvent.bind(this));
    this.executionHandlers.set('screenshot', this.executeScreenshotEvent.bind(this));
  }

  /**
   * Execute click events
   */
  private async executeClickEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();
    const mouseData = event.data as MouseEventData;

    try {
      // Find and wait for element
      const element = await this.findAndWaitForElement(event.target.selector, options);
      
      if (!element) {
        throw new Error(`Element not found: ${event.target.selector}`);
      }

      // Highlight element if enabled
      if (options.highlightElements) {
        await this.cdpClient.highlightElement(event.target.selector);
        await this.sleep(200); // Brief highlight
      }

      // Execute click via CDP
      const clickScript = `
        (function() {
          const element = document.querySelector('${event.target.selector.replace(/'/g, "\\'")}');
          if (!element) throw new Error('Element not found during click execution');
          
          const rect = element.getBoundingClientRect();
          const x = rect.left + (rect.width / 2);
          const y = rect.top + (rect.height / 2);
          
          const eventInit = {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            button: ${mouseData.button || 0},
            buttons: ${mouseData.buttons || 1},
            ctrlKey: ${mouseData.ctrlKey || false},
            shiftKey: ${mouseData.shiftKey || false},
            altKey: ${mouseData.altKey || false},
            metaKey: ${mouseData.metaKey || false}
          };
          
          const clickEvent = new MouseEvent('${event.type}', eventInit);
          element.dispatchEvent(clickEvent);
          
          // Trigger click() for form elements
          if (element.click && (element.tagName === 'BUTTON' || element.tagName === 'INPUT' || element.tagName === 'A')) {
            element.click();
          }
          
          return { success: true, x: x, y: y };
        })()
      `;

      const result = await this.cdpClient.executeScript(clickScript);
      
      // Wait for any resulting navigation or animations
      await this.sleep(options.animationDelay || 50);

      return {
        success: true,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute mouse events (hover, mousedown, etc.)
   */
  private async executeMouseEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();
    const mouseData = event.data as MouseEventData;

    try {
      const element = await this.findAndWaitForElement(event.target.selector, options);
      
      if (!element) {
        throw new Error(`Element not found: ${event.target.selector}`);
      }

      // Execute mouse event
      const mouseScript = `
        (function() {
          const element = document.querySelector('${event.target.selector.replace(/'/g, "\\'")}');
          if (!element) throw new Error('Element not found');
          
          const rect = element.getBoundingClientRect();
          const eventInit = {
            bubbles: true,
            cancelable: true,
            clientX: ${mouseData.clientX || 0},
            clientY: ${mouseData.clientY || 0},
            button: ${mouseData.button || 0},
            buttons: ${mouseData.buttons || 0},
            ctrlKey: ${mouseData.ctrlKey || false},
            shiftKey: ${mouseData.shiftKey || false},
            altKey: ${mouseData.altKey || false},
            metaKey: ${mouseData.metaKey || false}
          };
          
          const mouseEvent = new MouseEvent('${event.type}', eventInit);
          element.dispatchEvent(mouseEvent);
          
          return { success: true };
        })()
      `;

      await this.cdpClient.executeScript(mouseScript);

      return {
        success: true,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute input/typing events
   */
  private async executeInputEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();
    const keyboardData = event.data as KeyboardEventData;

    try {
      const element = await this.findAndWaitForElement(event.target.selector, options);
      
      if (!element) {
        throw new Error(`Element not found: ${event.target.selector}`);
      }

      if (options.highlightElements) {
        await this.cdpClient.highlightElement(event.target.selector);
      }

      const inputValue = keyboardData.inputValue || '';
      
      // Clear existing value and type new one
      const typeScript = `
        (function() {
          const element = document.querySelector('${event.target.selector.replace(/'/g, "\\'")}');
          if (!element) throw new Error('Element not found');
          
          // Focus the element
          element.focus();
          
          // Clear existing value
          if (element.value !== undefined) {
            element.value = '';
          }
          
          // Trigger input events for each character
          const value = '${inputValue.replace(/'/g, "\\'")}';
          let currentValue = '';
          
          for (let i = 0; i < value.length; i++) {
            currentValue += value[i];
            element.value = currentValue;
            
            // Dispatch input event
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
          
          // Final change event
          element.dispatchEvent(new Event('change', { bubbles: true }));
          
          return { success: true, value: element.value };
        })()
      `;

      await this.cdpClient.executeScript(typeScript);

      // Simulate typing delay
      const typingDelay = Math.min(inputValue.length * 10, 500);
      await this.sleep(typingDelay / options.speed);

      return {
        success: true,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute keyboard events
   */
  private async executeKeyboardEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();
    const keyboardData = event.data as KeyboardEventData;

    try {
      const element = await this.findAndWaitForElement(event.target.selector, options);
      
      const keyScript = `
        (function() {
          const element = document.querySelector('${event.target.selector.replace(/'/g, "\\'")}');
          if (!element) throw new Error('Element not found');
          
          element.focus();
          
          const eventInit = {
            bubbles: true,
            cancelable: true,
            key: '${keyboardData.key}',
            code: '${keyboardData.code}',
            keyCode: ${keyboardData.keyCode || 0},
            ctrlKey: ${keyboardData.ctrlKey || false},
            shiftKey: ${keyboardData.shiftKey || false},
            altKey: ${keyboardData.altKey || false},
            metaKey: ${keyboardData.metaKey || false},
            repeat: ${keyboardData.repeat || false}
          };
          
          const keyEvent = new KeyboardEvent('${event.type}', eventInit);
          element.dispatchEvent(keyEvent);
          
          return { success: true };
        })()
      `;

      await this.cdpClient.executeScript(keyScript);

      return {
        success: true,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute form events
   */
  private async executeFormEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();
    const formData = event.data as FormEventData;

    try {
      const element = await this.findAndWaitForElement(event.target.selector, options);
      
      const formScript = `
        (function() {
          const element = document.querySelector('${event.target.selector.replace(/'/g, "\\'")}');
          if (!element) throw new Error('Element not found');
          
          // Handle different form event types
          if ('${formData.eventType}' === 'submit') {
            if (element.submit) {
              element.submit();
            } else {
              element.dispatchEvent(new Event('submit', { bubbles: true }));
            }
          } else if ('${formData.eventType}' === 'change') {
            ${formData.value ? `element.value = '${formData.value.replace(/'/g, "\\'")}';` : ''}
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          return { success: true };
        })()
      `;

      await this.cdpClient.executeScript(formScript);

      return {
        success: true,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute focus/blur events
   */
  private async executeFocusEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();

    try {
      const element = await this.findAndWaitForElement(event.target.selector, options);
      
      const focusScript = `
        (function() {
          const element = document.querySelector('${event.target.selector.replace(/'/g, "\\'")}');
          if (!element) throw new Error('Element not found');
          
          if ('${event.type}' === 'focus') {
            element.focus();
          } else if ('${event.type}' === 'blur') {
            element.blur();
          }
          
          return { success: true };
        })()
      `;

      await this.cdpClient.executeScript(focusScript);

      return {
        success: true,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute navigation events
   */
  private async executeNavigationEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();
    const navData = event.data as NavigationEventData;

    try {
      switch (event.type) {
        case 'navigation':
          await this.cdpClient.navigate(navData.url);
          break;
          
        case 'reload':
          await this.cdpClient.executeScript('window.location.reload()');
          break;
          
        case 'back':
          await this.cdpClient.executeScript('window.history.back()');
          break;
          
        case 'forward':
          await this.cdpClient.executeScript('window.history.forward()');
          break;
      }

      // Wait for navigation to complete
      await this.sleep(1000);

      return {
        success: true,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute scroll events
   */
  private async executeScrollEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();
    const scrollData = event.data as ScrollEventData;

    try {
      const scrollScript = `
        (function() {
          if ('${scrollData.element}' === 'window') {
            window.scrollTo(${scrollData.scrollX || 0}, ${scrollData.scrollY || 0});
          } else {
            const element = document.querySelector('${event.target.selector.replace(/'/g, "\\'")}');
            if (element) {
              element.scrollTop = ${scrollData.scrollTop || 0};
              element.scrollLeft = ${scrollData.scrollLeft || 0};
            }
          }
          return { success: true };
        })()
      `;

      await this.cdpClient.executeScript(scrollScript);

      // Wait for scroll animation
      await this.sleep(200);

      return {
        success: true,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute wait events
   */
  private async executeWaitEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();
    const waitData = event.data as WaitEventData;

    try {
      const waitDuration = waitData.duration / options.speed;
      
      this.log('debug', `Waiting for ${waitDuration}ms (reason: ${waitData.reason})`);
      await this.sleep(waitDuration);

      return {
        success: true,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute assertion events
   */
  private async executeAssertionEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();
    const assertionData = event.data as AssertionEventData;

    try {
      // This would implement actual assertions
      // For now, just log the assertion
      this.log('info', `Assertion: ${assertionData.message}`);
      
      return {
        success: true,
        duration: Date.now() - startTime,
        assertions: [{
          type: assertionData.assertionType,
          expected: assertionData.expected,
          actual: assertionData.actual,
          passed: assertionData.passed || true,
          message: assertionData.message,
        }],
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute screenshot events
   */
  private async executeScreenshotEvent(
    event: RecordedEvent,
    context: PlaybackContext,
    options: PlaybackEngineOptions
  ): Promise<EventExecutionResult> {
    const startTime = Date.now();

    try {
      const screenshot = await this.captureScreenshot({
        format: 'png',
        fullPage: true,
      });

      context.screenshots.push(screenshot);

      return {
        success: true,
        duration: Date.now() - startTime,
        screenshot: screenshot.data,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Find element with waiting and retries
   */
  private async findAndWaitForElement(
    selector: string,
    options: PlaybackEngineOptions
  ): Promise<CDPRemoteObject | null> {
    const timeout = options.elementTimeout || 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = await this.cdpClient.findElement(selector);
      
      if (element) {
        // Additional visibility check
        const isVisible = await this.cdpClient.executeScript(`
          (function() {
            const el = document.querySelector('${selector.replace(/'/g, "\\'")}');
            if (!el) return false;
            
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && 
                   window.getComputedStyle(el).display !== 'none' &&
                   window.getComputedStyle(el).visibility !== 'hidden';
          })()
        `);

        if (isVisible) {
          return element;
        }
      }

      await this.sleep(100);
    }

    return null;
  }

  /**
   * Capture screenshot with error handling
   */
  private async captureScreenshot(options: ScreenshotOptions = {}): Promise<ScreenshotInfo> {
    try {
      return await this.cdpClient.takeScreenshot(options);
    } catch (error) {
      this.log('warn', 'Screenshot capture failed');
      throw error;
    }
  }

  /**
   * Handle playback flow (pause, step mode, etc.)
   */
  private async handlePlaybackFlow(): Promise<void> {
    // Handle pause
    while (this.context?.isPaused && !this.context?.isAborted) {
      await this.sleep(100);
    }

    // Handle step mode
    if (this.context?.isStepMode) {
      this.log('info', 'Step mode: waiting for next step command');
      // In a real implementation, this would wait for user input
      // For now, we'll just add a small delay
      await this.sleep(500);
    }
  }

  /**
   * Check if error is related to selector issues
   */
  private isSelectorError(error: Error): boolean {
    const selectorErrorPatterns = [
      'Element not found',
      'No element matches',
      'Invalid selector',
      'Selector not found',
    ];

    return selectorErrorPatterns.some(pattern => 
      error.message.includes(pattern)
    );
  }

  /**
   * Attempt to heal broken selectors
   */
  private async attemptSelectorHealing(
    event: RecordedEvent,
    options: PlaybackEngineOptions
  ): Promise<boolean> {
    if (!options.selectorFallback) return false;

    const strategies = options.healingStrategies || ['alternative', 'retry'];
    
    for (const strategy of strategies) {
      switch (strategy) {
        case 'alternative':
          // Try alternative selectors
          for (const altSelector of event.target.alternativeSelectors || []) {
            const element = await this.cdpClient.findElement(altSelector);
            if (element) {
              event.target.selector = altSelector;
              this.log('info', `Healed selector to: ${altSelector}`);
              return true;
            }
          }
          break;
          
        case 'retry':
          // Wait and retry original selector
          await this.sleep(1000);
          const element = await this.cdpClient.findElement(event.target.selector);
          if (element) {
            return true;
          }
          break;
          
        case 'position':
          // Try to find element by position (advanced healing)
          // This would use more sophisticated matching
          break;
      }
    }

    return false;
  }

  /**
   * Estimate remaining execution time
   */
  private estimateRemainingTime(): number {
    if (!this.context || this.context.executionTimes.length === 0) return 0;

    const avgExecutionTime = this.context.executionTimes.reduce((a, b) => a + b, 0) / this.context.executionTimes.length;
    const remainingEvents = this.context.totalEvents - this.context.currentEventIndex - 1;
    
    return Math.round(remainingEvents * avgExecutionTime / this.context.speed);
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.context = null;
    this.abortController = null;
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: Function): void {
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
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.log('error', `Event listener error: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    }
  }

  /**
   * Logging utility
   */
  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] PlaybackEngine: ${message}`;
    
    switch (level) {
      case 'error':
        // console.error(logMessage);
        break;
      case 'warn':
        // console.warn(logMessage);
        break;
      case 'info':
        // console.info(logMessage);
        break;
      case 'debug':
        // console.debug(logMessage);
        break;
      default:
        // console.log(logMessage);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}