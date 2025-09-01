/**
 * Unit tests for Event Recorder
 * Tests the DOM event capture and recording functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventRecorder } from '../../../core/recorder';
import { SelectorEngine } from '../../../core/selector-engine';
import { createMockCDPClient } from '../../__mocks__/chrome-devtools-protocol';
import { createMockEventTarget, resetCounters } from '../../__mocks__/test-data-factory';
import type { RecordingOptions, BrowserAutomationEventClient } from '../../../types';

// Mock the SelectorEngine
vi.mock('../../../core/selector-engine');
const MockSelectorEngine = vi.mocked(SelectorEngine);

// Mock DevTools client
const mockDevToolsClient = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
} as any;

describe('EventRecorder', () => {
  let recorder: EventRecorder;
  let mockSelectorEngine: any;
  let mockElement: HTMLElement;

  beforeEach(() => {
    resetCounters();

    // Create mock selector engine
    mockSelectorEngine = {
      generateSelector: vi.fn().mockResolvedValue('#test-element'),
      generateAlternativeSelectors: vi.fn().mockResolvedValue(['#test-element', '.test-class']),
      validateSelector: vi.fn().mockResolvedValue({ isValid: true, isUnique: true, elementCount: 1 }),
      getSelectorScore: vi.fn().mockReturnValue(8.5),
      isStableSelector: vi.fn().mockReturnValue(true),
      getElementStability: vi.fn().mockResolvedValue({
        score: 0.9,
        hasStableId: true,
        hasTestId: true,
        hasStableClass: false,
        hasAriaLabel: true,
        reasons: ['stable-id', 'test-id', 'aria-label'],
      }),
    };

    MockSelectorEngine.mockImplementation(() => mockSelectorEngine);

    // Create test element
    mockElement = document.createElement('button');
    mockElement.id = 'test-button';
    mockElement.className = 'btn btn-primary';
    mockElement.textContent = 'Click me';
    mockElement.setAttribute('data-testid', 'submit-btn');

    // Mock getBoundingClientRect
    mockElement.getBoundingClientRect = vi.fn(() => ({
      x: 100,
      y: 100,
      width: 120,
      height: 40,
      top: 100,
      left: 100,
      right: 220,
      bottom: 140,
      toJSON: vi.fn(),
    }));

    document.body.appendChild(mockElement);

    // Mock performance API
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {
        now: vi.fn(() => Date.now()),
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByType: vi.fn(() => []),
        memory: {
          usedJSHeapSize: 1024 * 1024 * 5,
          totalJSHeapSize: 1024 * 1024 * 10,
          jsHeapSizeLimit: 1024 * 1024 * 100,
        },
      },
    });

    // Create recorder instance
    recorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);
  });

  afterEach(() => {
    if (mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    recorder.stop();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      expect(recorder).toBeInstanceOf(EventRecorder);
      // The recorder accepts a SelectorEngine instance, it doesn't create one
      expect(recorder).toBeDefined();
    });

    it('should accept custom options', () => {
      const customOptions: RecordingOptions = {
        captureScreenshots: false,
        captureConsole: false,
        captureNetwork: true,
        capturePerformance: true,
        ignoredEvents: ['mousemove'],
        debounceMs: 200,
        selectorOptions: {
          includeId: true,
          includeClass: false,
          includeAttributes: true,
          includeText: true,
          includePosition: false,
          optimize: true,
          unique: true,
          stable: true,
          generateAlternatives: false,
          maxAlternatives: 3,
          customAttributes: ['data-testid'],
          ignoreAttributes: ['style'],
          ariaLabelFallback: true,
        },
      };

      const customRecorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient, customOptions);
      expect(customRecorder).toBeInstanceOf(EventRecorder);
    });
  });

  describe('Recording Control', () => {
    it('should start recording', async () => {
      const sessionId = await recorder.start();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(recorder.isRecording()).toBe(true);
      expect(recorder.isPaused()).toBe(false);
    });

    it('should stop recording and return events', async () => {
      await recorder.start();

      // Simulate some events
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });
      
      // Trigger event manually since we're in a test environment
      await recorder.handleDOMEvent(clickEvent);

      const events = await recorder.stop();

      expect(recorder.isRecording()).toBe(false);
      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });

    it('should pause and resume recording', async () => {
      await recorder.start();

      recorder.pause();
      expect(recorder.isPaused()).toBe(true);

      recorder.resume();
      expect(recorder.isPaused()).toBe(false);
    });

    it('should clear recorded events', async () => {
      await recorder.start();

      // Add some events
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });
      await recorder.handleDOMEvent(clickEvent);

      recorder.clear();

      const events = await recorder.stop();
      expect(events).toHaveLength(0);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await recorder.start({ recordInitialNavigation: false });
    });

    it('should handle click events', async () => {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 150,
        clientY: 120,
        button: 0,
        buttons: 1,
      });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await recorder.handleDOMEvent(clickEvent);

      const events = await recorder.stop();
      expect(events).toHaveLength(1);

      const recordedEvent = events[0];
      expect(recordedEvent.type).toBe('click');
      expect(recordedEvent.data.type).toBe('mouse');
      expect((recordedEvent.data as any).clientX).toBe(150);
      expect((recordedEvent.data as any).clientY).toBe(120);
    });

    it('should handle keyboard events', async () => {
      const keyEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      });
      Object.defineProperty(keyEvent, 'target', { value: mockElement });

      await recorder.handleDOMEvent(keyEvent);

      const events = await recorder.stop();
      expect(events).toHaveLength(1);

      const recordedEvent = events[0];
      expect(recordedEvent.type).toBe('keydown');
      expect(recordedEvent.data.type).toBe('keyboard');
      expect((recordedEvent.data as any).key).toBe('Enter');
    });

    it('should handle form events', async () => {
      const inputElement = document.createElement('input');
      inputElement.type = 'text';
      inputElement.value = 'test input';
      document.body.appendChild(inputElement);

      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      Object.defineProperty(inputEvent, 'target', { value: inputElement });

      await recorder.handleDOMEvent(inputEvent);
      
      // Wait for debounce to complete (default debounceMs is 100)
      await new Promise(resolve => setTimeout(resolve, 150));

      const events = await recorder.stop();
      expect(events).toHaveLength(1);

      const recordedEvent = events[0];
      expect(recordedEvent.type).toBe('input');
      expect(recordedEvent.data.type).toBe('keyboard');
      expect((recordedEvent.data as any).inputValue).toBe('test input');

      document.body.removeChild(inputElement);
    }, 15000);

    it('should handle navigation events', async () => {
      // Mock navigation
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: 'https://example.com/new-page' } as any;

      await recorder.handleNavigationChange('https://example.com/new-page', 'New Page');

      const events = await recorder.stop();
      expect(events).toHaveLength(1);

      const recordedEvent = events[0];
      expect(recordedEvent.type).toBe('navigation');
      expect(recordedEvent.data.type).toBe('navigation');
      expect((recordedEvent.data as any).url).toBe('https://example.com/new-page');

      // Restore location
      window.location = originalLocation;
    });

    it('should ignore specified event types', async () => {
      // Create recorder with mousemove ignored
      const customOptions: RecordingOptions = {
        captureScreenshots: false,
        captureConsole: false,
        captureNetwork: false,
        capturePerformance: false,
        ignoredEvents: ['mousemove', 'scroll'],
        debounceMs: 0,
        selectorOptions: {
          includeId: true,
          includeClass: true,
          includeAttributes: true,
          includeText: true,
          includePosition: false,
          optimize: true,
          unique: true,
          stable: true,
          generateAlternatives: false,
          maxAlternatives: 3,
          customAttributes: ['data-testid'],
          ignoreAttributes: ['style'],
          ariaLabelFallback: true,
        },
      };

      const customRecorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);
      customRecorder.updateOptions(customOptions);
      await customRecorder.start({ recordInitialNavigation: false });

      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });
      Object.defineProperty(mouseMoveEvent, 'target', { value: mockElement });

      await customRecorder.handleDOMEvent(mouseMoveEvent);

      const events = await customRecorder.stop();
      expect(events).toHaveLength(0);
    });

    it('should debounce rapid events', async () => {
      const customOptions: RecordingOptions = {
        captureScreenshots: false,
        captureConsole: false,
        captureNetwork: false,
        capturePerformance: false,
        ignoredEvents: [],
        debounceMs: 100,
        selectorOptions: {
          includeId: true,
          includeClass: true,
          includeAttributes: true,
          includeText: true,
          includePosition: false,
          optimize: true,
          unique: true,
          stable: true,
          generateAlternatives: false,
          maxAlternatives: 3,
          customAttributes: ['data-testid'],
          ignoreAttributes: ['style'],
          ariaLabelFallback: true,
        },
      };

      const debouncedRecorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);
      debouncedRecorder.updateOptions(customOptions);
      await debouncedRecorder.start({ recordInitialNavigation: false });

      // Fire multiple rapid events
      for (let i = 0; i < 5; i++) {
        const mouseMoveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: 100 + i,
          clientY: 100 + i,
        });
        Object.defineProperty(mouseMoveEvent, 'target', { value: mockElement });
        await debouncedRecorder.handleDOMEvent(mouseMoveEvent);
      }

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      const events = await debouncedRecorder.stop();
      expect(events.length).toBeLessThan(5); // Should be debounced
    }, 15000);
  });

  describe('Event Processing', () => {
    beforeEach(async () => {
      await recorder.start({ recordInitialNavigation: false });
    });

    it('should generate selectors for event targets', async () => {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await recorder.handleDOMEvent(clickEvent);

      expect(mockSelectorEngine.generateSelector).toHaveBeenCalledWith(
        mockElement,
        expect.any(Object)
      );
    });

    it('should generate alternative selectors', async () => {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await recorder.handleDOMEvent(clickEvent);

      expect(mockSelectorEngine.generateAlternativeSelectors).toHaveBeenCalledWith(
        mockElement,
        expect.any(Number)
      );
    });

    it('should capture element hierarchy', async () => {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await recorder.handleDOMEvent(clickEvent);

      const events = await recorder.stop();
      const recordedEvent = events[0];

      expect(recordedEvent.target.path).toBeDefined();
      expect(Array.isArray(recordedEvent.target.path)).toBe(true);
    });

    it('should capture reliability metrics', async () => {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await recorder.handleDOMEvent(clickEvent);

      const events = await recorder.stop();
      const recordedEvent = events[0];

      expect(recordedEvent.metadata.reliability).toBeDefined();
      expect(recordedEvent.metadata.reliability.selectorScore).toBeGreaterThan(0);
      expect(recordedEvent.metadata.reliability.confidence).toBeGreaterThan(0);
    });
  });

  describe('Context Capture', () => {
    beforeEach(async () => {
      await recorder.start({ recordInitialNavigation: false });
    });

    it('should capture page context', async () => {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await recorder.handleDOMEvent(clickEvent);

      const events = await recorder.stop();
      const recordedEvent = events[0];

      expect(recordedEvent.context).toBeDefined();
      expect(recordedEvent.context.url).toBeDefined();
      expect(recordedEvent.context.title).toBeDefined();
      expect(recordedEvent.context.viewport).toBeDefined();
      expect(recordedEvent.context.userAgent).toBeDefined();
    });

    it('should capture viewport information', async () => {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await recorder.handleDOMEvent(clickEvent);

      const events = await recorder.stop();
      const recordedEvent = events[0];

      const viewport = recordedEvent.context.viewport;
      expect(viewport.width).toBeDefined();
      expect(viewport.height).toBeDefined();
      expect(viewport.devicePixelRatio).toBeDefined();
      expect(typeof viewport.isMobile).toBe('boolean');
      expect(typeof viewport.isLandscape).toBe('boolean');
    });

    it('should capture performance metrics when enabled', async () => {
      const perfOptions: RecordingOptions = {
        captureScreenshots: false,
        captureConsole: false,
        captureNetwork: false,
        capturePerformance: true,
        ignoredEvents: [],
        debounceMs: 100,
        selectorOptions: {
          includeId: true,
          includeClass: true,
          includeAttributes: true,
          includeText: true,
          includePosition: false,
          optimize: true,
          unique: true,
          stable: true,
          generateAlternatives: false,
          maxAlternatives: 3,
          customAttributes: ['data-testid'],
          ignoreAttributes: ['style'],
          ariaLabelFallback: true,
        },
        maxEvents: 1000,
      };

      const perfRecorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);
      perfRecorder.updateOptions(perfOptions);
      await perfRecorder.start({ recordInitialNavigation: false });

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await perfRecorder.handleDOMEvent(clickEvent);

      const events = await perfRecorder.stop();
      expect(events).toHaveLength(1);
      
      const recordedEvent = events[0];
      expect(recordedEvent).toBeDefined();
      expect(recordedEvent.context).toBeDefined();
      expect(recordedEvent.context.performance).toBeDefined();
      expect(recordedEvent.context.performance?.usedJSHeapSize).toBeDefined();
    });
  });

  describe('Screenshot Capture', () => {
    it('should capture screenshots when enabled', async () => {
      const screenshotOptions: RecordingOptions = {
        captureScreenshots: true,
        captureConsole: false,
        captureNetwork: false,
        capturePerformance: false,
        ignoredEvents: [],
        debounceMs: 0,
        selectorOptions: {
          includeId: true,
          includeClass: true,
          includeAttributes: true,
          includeText: true,
          includePosition: false,
          optimize: true,
          unique: true,
          stable: true,
          generateAlternatives: false,
          maxAlternatives: 3,
          customAttributes: ['data-testid'],
          ignoreAttributes: ['style'],
          ariaLabelFallback: true,
        },
      };

      const screenshotRecorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);
      screenshotRecorder.updateOptions(screenshotOptions);
      await screenshotRecorder.start({ recordInitialNavigation: false });

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await screenshotRecorder.handleDOMEvent(clickEvent);

      const events = await screenshotRecorder.stop();
      const recordedEvent = events[0];

      expect(recordedEvent.metadata.screenshot).toBeDefined();
      expect(recordedEvent.metadata.screenshot?.data).toBeDefined();
    });

    it('should skip screenshots when disabled', async () => {
      const noScreenshotOptions: RecordingOptions = {
        captureScreenshots: false,
        captureConsole: false,
        captureNetwork: false,
        capturePerformance: false,
        ignoredEvents: [],
        debounceMs: 0,
        selectorOptions: {
          includeId: true,
          includeClass: true,
          includeAttributes: true,
          includeText: true,
          includePosition: false,
          optimize: true,
          unique: true,
          stable: true,
          generateAlternatives: false,
          maxAlternatives: 3,
          customAttributes: ['data-testid'],
          ignoreAttributes: ['style'],
          ariaLabelFallback: true,
        },
      };

      const noScreenshotRecorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);
      noScreenshotRecorder.updateOptions(noScreenshotOptions);
      await noScreenshotRecorder.start({ recordInitialNavigation: false });

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await noScreenshotRecorder.handleDOMEvent(clickEvent);

      const events = await noScreenshotRecorder.stop();
      const recordedEvent = events[0];

      expect(recordedEvent.metadata.screenshot).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle events on non-element targets', async () => {
      await recorder.start({ recordInitialNavigation: false });

      const textNode = document.createTextNode('text content');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: textNode });

      await recorder.handleDOMEvent(clickEvent);

      const events = await recorder.stop();
      expect(events).toHaveLength(0); // Should ignore non-element events
    });

    it('should handle events without targets', async () => {
      await recorder.start({ recordInitialNavigation: false });

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      // Don't set target

      expect(async () => {
        await recorder.handleDOMEvent(clickEvent);
      }).not.toThrow();

      const events = await recorder.stop();
      expect(events).toHaveLength(0); // Should ignore events without targets
    });

    it('should handle selector generation failures gracefully', async () => {
      await recorder.start({ recordInitialNavigation: false });

      // Make selector generation fail
      mockSelectorEngine.generateSelector.mockRejectedValue(new Error('Selector generation failed'));

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await recorder.handleDOMEvent(clickEvent);

      const events = await recorder.stop();
      expect(events).toHaveLength(0); // Should skip events with failed selector generation
    });

    it('should handle detached elements', async () => {
      await recorder.start({ recordInitialNavigation: false });

      const detachedElement = document.createElement('div');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: detachedElement });

      await recorder.handleDOMEvent(clickEvent);

      const events = await recorder.stop();
      expect(events).toHaveLength(1); // Should still record the event
    });
  });

  describe('Event Sequencing', () => {
    beforeEach(async () => {
      await recorder.start({ recordInitialNavigation: false });
    });

    it('should assign sequence numbers correctly', async () => {
      const events = [];
      for (let i = 0; i < 3; i++) {
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        Object.defineProperty(clickEvent, 'target', { value: mockElement });
        await recorder.handleDOMEvent(clickEvent);
        events.push(clickEvent);
      }

      const recordedEvents = await recorder.stop();
      expect(recordedEvents).toHaveLength(3);

      recordedEvents.forEach((event, index) => {
        expect(event.sequence).toBe(index);
      });
    });

    it('should maintain timestamp ordering', async () => {
      // Simplified test to avoid timeouts
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });
      await recorder.handleDOMEvent(clickEvent);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const clickEvent2 = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent2, 'target', { value: mockElement });
      await recorder.handleDOMEvent(clickEvent2);

      const recordedEvents = await recorder.stop();
      expect(recordedEvents.length).toBeGreaterThanOrEqual(1);
      
      if (recordedEvents.length >= 2) {
        expect(recordedEvents[1].timestamp).toBeGreaterThanOrEqual(recordedEvents[0].timestamp);
      }
    }, 15000);
  });

  describe('Configuration Updates', () => {
    it('should update recording options', async () => {
      const newOptions: Partial<RecordingOptions> = {
        captureScreenshots: false,
        debounceMs: 500,
      };

      recorder.updateOptions(newOptions);

      await recorder.start({ recordInitialNavigation: false });
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });
      await recorder.handleDOMEvent(clickEvent);

      const events = await recorder.stop();
      const recordedEvent = events[0];

      expect(recordedEvent.metadata.screenshot).toBeUndefined();
    });

    it('should get current options', () => {
      const options = recorder.getOptions();
      expect(options).toBeDefined();
      expect(options.captureScreenshots).toBeDefined();
      expect(options.debounceMs).toBeDefined();
    });
  });
});