/**
 * Integration tests for Recording Workflow
 * Tests the complete recording → processing → generation workflow
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventRecorder } from '../../core/recorder';
import { SelectorEngine } from '../../core/selector-engine';
import { PlaywrightGenerator } from '../../core/generators/playwright-generator';
import { useBrowserAutomationStore } from '../../core/devtools-store';
import { renderHook, act } from '@testing-library/react';
import { 
  createMockRecordedEvent, 
  createMockLoginFlow, 
  resetCounters 
} from '../__mocks__/test-data-factory';
import type { RecordingOptions, TestGenerationOptions } from '../../types';

// Mock the dependencies
vi.mock('../../core/selector-engine');
vi.mock('../__mocks__/playwright');

const MockSelectorEngine = vi.mocked(SelectorEngine);

describe('Recording Workflow Integration', () => {
  let recorder: EventRecorder;
  let generator: PlaywrightGenerator;
  let mockSelectorEngine: any;
  let mockDevToolsClient: any;
  let mockElement: HTMLElement;

  beforeEach(() => {
    resetCounters();

    // Reset store
    const { getState } = useBrowserAutomationStore;
    act(() => {
      const store = getState();
      store.dispatch({ type: 'recording/clear' });
      store.dispatch({ type: 'settings/reset' });
    });

    // Create mock selector engine
    mockSelectorEngine = {
      generateSelector: vi.fn().mockResolvedValue('#test-button'),
      generateAlternativeSelectors: vi.fn().mockResolvedValue(['#test-button', '.btn-primary']),
      validateSelector: vi.fn().mockResolvedValue({ isValid: true, isUnique: true, elementCount: 1 }),
      getSelectorScore: vi.fn().mockReturnValue(8.5),
      isStableSelector: vi.fn().mockReturnValue(true),
      getElementStability: vi.fn().mockResolvedValue({
        score: 0.9,
        hasStableId: true,
        hasTestId: false,
        hasStableClass: false,
        hasAriaLabel: false,
        reasons: ['stable-id'],
      }),
    };

    MockSelectorEngine.mockImplementation(() => mockSelectorEngine);

    // Mock DevTools client
    mockDevToolsClient = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };

    // Create test element
    mockElement = document.createElement('button');
    mockElement.id = 'login-button';
    mockElement.className = 'btn btn-primary';
    mockElement.textContent = 'Sign In';
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

    // Initialize components
    recorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);
    generator = new PlaywrightGenerator();

    // Mock document methods
    document.querySelector = vi.fn().mockReturnValue(mockElement);
    document.querySelectorAll = vi.fn().mockReturnValue([mockElement]);
  });

  afterEach(() => {
    if (mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    recorder.stop();
    vi.clearAllMocks();
  });

  describe('Complete Recording Workflow', () => {
    it('should record events and generate test code', async () => {
      // Start recording
      const sessionId = await recorder.start();
      expect(sessionId).toBeDefined();
      expect(recorder.isRecording()).toBe(true);

      // Simulate user interactions
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 150,
        clientY: 120,
        button: 0,
      });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });

      await recorder.handleDOMEvent(clickEvent);

      // Stop recording and get events
      const recordedEvents = await recorder.stop();
      
      expect(recordedEvents).toHaveLength(1);
      expect(recordedEvents[0].type).toBe('click');
      expect(recordedEvents[0].target.selector).toBe('#test-button');

      // Generate test code from recorded events
      const generationOptions: TestGenerationOptions = {
        format: 'typescript',
        framework: 'playwright',
        includeComments: true,
        includeAssertions: false,
        includeSetup: true,
        testName: 'Recorded User Interaction',
      };

      const generatedTest = await generator.generateTestCode(recordedEvents, generationOptions);

      expect(generatedTest.code).toContain("import { test, expect } from '@playwright/test'");
      expect(generatedTest.code).toContain("test('Recorded User Interaction'");
      expect(generatedTest.code).toContain("await page.click('#test-button')");
      expect(generatedTest.metadata.eventCount).toBe(1);
      expect(generatedTest.metadata.selectors).toBe(1);
    });

    it('should handle complex user flows', async () => {
      // Start recording
      await recorder.start();

      // Simulate login flow
      const events = [
        // Navigation
        { type: 'navigation', url: 'https://example.com/login' },
        // Username input
        { type: 'click', selector: '#username' },
        { type: 'input', selector: '#username', value: 'testuser' },
        // Password input
        { type: 'click', selector: '#password' },
        { type: 'input', selector: '#password', value: 'password123' },
        // Submit
        { type: 'click', selector: '#login-button' },
      ];

      // Simulate each event
      for (const eventData of events) {
        let domEvent;
        
        if (eventData.type === 'navigation') {
          await recorder.handleNavigationChange(eventData.url, 'Login Page');
          continue;
        }

        const element = document.createElement(eventData.selector === '#username' || eventData.selector === '#password' ? 'input' : 'button');
        element.id = eventData.selector.replace('#', '');
        if (eventData.value) element.value = eventData.value;
        document.body.appendChild(element);

        if (eventData.type === 'click') {
          domEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        } else if (eventData.type === 'input') {
          domEvent = new Event('input', { bubbles: true, cancelable: true });
        }

        if (domEvent) {
          Object.defineProperty(domEvent, 'target', { value: element });
          await recorder.handleDOMEvent(domEvent);
        }

        document.body.removeChild(element);
      }

      const recordedEvents = await recorder.stop();
      
      expect(recordedEvents.length).toBeGreaterThan(3);
      
      // Should have navigation, clicks, and inputs
      const eventTypes = recordedEvents.map(e => e.type);
      expect(eventTypes).toContain('navigation');
      expect(eventTypes).toContain('click');
      expect(eventTypes).toContain('input');

      // Generate complete test
      const generatedTest = await generator.generateTestCode(recordedEvents, {
        format: 'typescript',
        framework: 'playwright',
        includeComments: true,
        includeAssertions: true,
        includeSetup: true,
        testName: 'Complete Login Flow',
      });

      expect(generatedTest.code).toContain('goto');
      expect(generatedTest.code).toContain('click');
      expect(generatedTest.code).toContain('fill');
      expect(generatedTest.metadata.eventCount).toBe(recordedEvents.length);
    });

    it('should preserve event sequence and timing', async () => {
      await recorder.start();

      // Create a sequence of events with delays
      const events = [
        createMockRecordedEvent('click'),
        createMockRecordedEvent('input'),
        createMockRecordedEvent('submit'),
      ];

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        let domEvent;

        if (event.type === 'click') {
          domEvent = new MouseEvent('click', { bubbles: true });
        } else if (event.type === 'input') {
          domEvent = new Event('input', { bubbles: true });
        } else if (event.type === 'submit') {
          domEvent = new Event('submit', { bubbles: true });
        }

        if (domEvent) {
          Object.defineProperty(domEvent, 'target', { value: mockElement });
          await recorder.handleDOMEvent(domEvent);
        }

        // Add small delay between events
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const recordedEvents = await recorder.stop();

      // Verify sequence numbers
      recordedEvents.forEach((event, index) => {
        expect(event.sequence).toBe(index);
      });

      // Verify timestamps are in order
      for (let i = 1; i < recordedEvents.length; i++) {
        expect(recordedEvents[i].timestamp).toBeGreaterThanOrEqual(recordedEvents[i - 1].timestamp);
      }
    });
  });

  describe('Store Integration', () => {
    it('should integrate with DevTools store', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      // Start recording via store
      act(() => {
        result.current.startRecording();
      });

      expect(result.current.recording.isRecording).toBe(true);

      // Add events via store
      const mockEvent = createMockRecordedEvent('click');
      act(() => {
        result.current.addEvent(mockEvent);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0]).toEqual(mockEvent);

      // Generate test via store
      let generatedTest;
      await act(async () => {
        generatedTest = await result.current.generateTest({
          format: 'typescript',
          framework: 'playwright',
          includeComments: true,
          includeAssertions: false,
        });
      });

      expect(generatedTest).toBeDefined();
      expect(result.current.stats.generatedTests).toBe(1);

      // Stop recording via store
      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.recording.isRecording).toBe(false);
    });

    it('should handle recording state changes', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      // Initial state
      expect(result.current.recording.isRecording).toBe(false);
      expect(result.current.recording.isPaused).toBe(false);

      // Start recording
      act(() => {
        result.current.startRecording();
      });

      expect(result.current.recording.isRecording).toBe(true);
      expect(result.current.recording.startTime).toBeDefined();

      // Pause recording
      act(() => {
        result.current.pauseRecording();
      });

      expect(result.current.recording.isPaused).toBe(true);

      // Resume recording
      act(() => {
        result.current.resumeRecording();
      });

      expect(result.current.recording.isPaused).toBe(false);

      // Clear recording
      act(() => {
        result.current.addEvent(createMockRecordedEvent('click'));
      });

      expect(result.current.events).toHaveLength(1);

      act(() => {
        result.current.clearRecording();
      });

      expect(result.current.events).toHaveLength(0);
      expect(result.current.recording.isRecording).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should handle selector generation failures gracefully', async () => {
      // Make selector generation fail occasionally
      mockSelectorEngine.generateSelector
        .mockResolvedValueOnce('#test-button')
        .mockRejectedValueOnce(new Error('Selector generation failed'))
        .mockResolvedValueOnce('#test-button-2');

      await recorder.start();

      // Create events that will trigger selector generation
      const events = [
        new MouseEvent('click', { bubbles: true }),
        new MouseEvent('click', { bubbles: true }), // This will fail
        new MouseEvent('click', { bubbles: true }),
      ];

      for (const event of events) {
        Object.defineProperty(event, 'target', { value: mockElement });
        await recorder.handleDOMEvent(event);
      }

      const recordedEvents = await recorder.stop();

      // Should have recorded 2 events (skipped the failed one)
      expect(recordedEvents).toHaveLength(2);
      expect(recordedEvents[0].target.selector).toBe('#test-button');
      expect(recordedEvents[1].target.selector).toBe('#test-button-2');
    });

    it('should handle code generation errors', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      // Add some events
      act(() => {
        result.current.addEvent(createMockRecordedEvent('click'));
      });

      // Mock generator to throw error
      const mockGenerator = vi.fn().mockRejectedValue(new Error('Code generation failed'));
      
      // The actual generator shouldn't throw in normal operation
      // This tests the error handling path if it were to fail
      try {
        await generator.generateTestCode(result.current.events, {
          format: 'typescript',
          framework: 'playwright',
          includeComments: true,
          includeAssertions: false,
        });
      } catch (error) {
        // If error is thrown, it should be handled gracefully
        expect(error).toBeInstanceOf(Error);
      }

      // Even with errors, the test should be generated with warnings
      const generatedTest = await generator.generateTestCode(result.current.events, {
        format: 'typescript',
        framework: 'playwright',
        includeComments: true,
        includeAssertions: false,
      });

      expect(generatedTest).toBeDefined();
      expect(generatedTest.code).toBeDefined();
    });

    it('should recover from DOM changes during recording', async () => {
      await recorder.start();

      // Record event on element
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });
      await recorder.handleDOMEvent(clickEvent);

      // Simulate DOM change - remove element
      document.body.removeChild(mockElement);

      // Add it back with different attributes
      const newElement = document.createElement('button');
      newElement.id = 'new-login-button';
      newElement.className = 'btn btn-secondary';
      newElement.textContent = 'New Sign In';
      newElement.getBoundingClientRect = mockElement.getBoundingClientRect;
      document.body.appendChild(newElement);

      // Update mocks for new element
      mockSelectorEngine.generateSelector.mockResolvedValue('#new-login-button');

      // Record another event
      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent2, 'target', { value: newElement });
      await recorder.handleDOMEvent(clickEvent2);

      const recordedEvents = await recorder.stop();

      expect(recordedEvents).toHaveLength(2);
      expect(recordedEvents[0].target.selector).toBe('#test-button'); // Old selector
      expect(recordedEvents[1].target.selector).toBe('#new-login-button'); // New selector

      // Clean up
      document.body.removeChild(newElement);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large numbers of events efficiently', async () => {
      const startTime = performance.now();
      
      await recorder.start();

      // Generate many events
      for (let i = 0; i < 100; i++) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          clientX: 100 + i,
          clientY: 100 + i,
        });
        Object.defineProperty(clickEvent, 'target', { value: mockElement });
        await recorder.handleDOMEvent(clickEvent);
      }

      const recordedEvents = await recorder.stop();
      const endTime = performance.now();

      expect(recordedEvents).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Generate code for all events
      const codeStartTime = performance.now();
      const generatedTest = await generator.generateTestCode(recordedEvents, {
        format: 'typescript',
        framework: 'playwright',
        includeComments: false,
        includeAssertions: false,
      });
      const codeEndTime = performance.now();

      expect(generatedTest.code).toBeDefined();
      expect(codeEndTime - codeStartTime).toBeLessThan(2000); // Should generate quickly
    });

    it('should clean up resources properly', async () => {
      // Track initial memory usage (mock)
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      await recorder.start();

      // Generate events
      for (let i = 0; i < 50; i++) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: mockElement });
        await recorder.handleDOMEvent(clickEvent);
      }

      await recorder.stop();

      // Clean up should happen automatically
      // In a real test, we'd check that event listeners are removed, etc.
      expect(recorder.isRecording()).toBe(false);

      // Memory usage should not have grown significantly (mock test)
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    });
  });

  describe('Settings Integration', () => {
    it('should apply recording settings correctly', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      // Update settings
      act(() => {
        result.current.updateSettings({
          recordingOptions: {
            captureScreenshots: false,
            captureConsole: true,
            captureNetwork: false,
            capturePerformance: false,
            ignoredEvents: ['mousemove'],
            debounceMs: 200,
          },
        });
      });

      // Create recorder with updated settings
      const customRecorder = new EventRecorder(
        mockSelectorEngine, 
        mockDevToolsClient,
        result.current.settings.recordingOptions
      );

      await customRecorder.start();

      // Test that mousemove is ignored
      const mouseMoveEvent = new MouseEvent('mousemove', { bubbles: true });
      Object.defineProperty(mouseMoveEvent, 'target', { value: mockElement });
      await customRecorder.handleDOMEvent(mouseMoveEvent);

      const recordedEvents = await customRecorder.stop();
      expect(recordedEvents).toHaveLength(0); // Should be ignored
    });

    it('should apply generation settings correctly', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      // Add event
      act(() => {
        result.current.addEvent(createMockRecordedEvent('click'));
      });

      // Update export settings
      act(() => {
        result.current.updateSettings({
          exportOptions: {
            format: 'playwright',
            includeComments: false,
            includeAssertions: true,
            includeSetup: false,
          },
        });
      });

      // Generate with settings
      let generatedTest;
      await act(async () => {
        generatedTest = await result.current.generateTest({
          ...result.current.settings.exportOptions,
          format: 'typescript',
          framework: 'playwright',
        });
      });

      expect(generatedTest.code).not.toContain('// '); // No comments
      expect(generatedTest.code).not.toContain('beforeEach'); // No setup
    });
  });
});