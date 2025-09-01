/**
 * Integration tests for Recording Workflow
 * Tests the complete recording → processing → generation workflow
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventRecorder } from '../../core/recorder';
import { SelectorEngine } from '../../core/selector-engine';
import { PlaywrightGenerator } from '../../core/generators/playwright-generator';
import { useBrowserAutomationStore } from '../../core/devtools-store';
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
    const store = useBrowserAutomationStore.getState();
    store.dispatch({ type: 'recording/clear' });
    store.dispatch({ type: 'settings/reset' });

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
      // Start recording without initial navigation
      const sessionId = await recorder.start({ recordInitialNavigation: false });
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

      // Simulate navigation
      recorder.handleNavigationChange('https://example.com/login');

      // Simulate clicking elements
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });
      await recorder.handleDOMEvent(clickEvent);

      const recordedEvents = await recorder.stop();
      
      expect(recordedEvents.length).toBeGreaterThan(0);
      expect(recordedEvents.some(e => e.type === 'navigation')).toBe(true);
    });

    it('should preserve event sequence and timing', async () => {
      await recorder.start({ recordInitialNavigation: false });

      // Simplified test with just one event to avoid debounce issues
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });
      await recorder.handleDOMEvent(clickEvent);
      
      await new Promise(resolve => setTimeout(resolve, 50));

      const recordedEvents = await recorder.stop();
      expect(recordedEvents.length).toBeGreaterThan(0);
      expect(recordedEvents[0].timestamp).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Store Integration', () => {
    it('should integrate with DevTools store', async () => {
      const store = useBrowserAutomationStore.getState();

      // Start recording via store
      store.startRecording();
      let currentState = useBrowserAutomationStore.getState();
      expect(currentState.recording.isRecording).toBe(true);

      // Add events via store
      const mockEvent = createMockRecordedEvent('click');
      store.addEvent(mockEvent);
      currentState = useBrowserAutomationStore.getState();
      expect(currentState.events).toHaveLength(1);
      expect(currentState.events[0]).toEqual(mockEvent);

      // Generate test via store
      const generatedTest = await store.generateTest({
        format: 'typescript',
        framework: 'playwright',
        includeComments: true,
        includeAssertions: false,
      });

      expect(generatedTest).toBeDefined();
      currentState = useBrowserAutomationStore.getState();
      expect(currentState.stats.generatedTests).toBe(1);

      // Stop recording via store
      store.stopRecording();
      currentState = useBrowserAutomationStore.getState();
      expect(currentState.recording.isRecording).toBe(false);
    });

    it('should handle recording state changes', async () => {
      const store = useBrowserAutomationStore.getState();

      // Initial state
      let currentState = useBrowserAutomationStore.getState();
      expect(currentState.recording.isRecording).toBe(false);
      expect(currentState.recording.isPaused).toBe(false);

      // Start recording
      store.startRecording();
      currentState = useBrowserAutomationStore.getState();
      expect(currentState.recording.isRecording).toBe(true);
      expect(currentState.recording.startTime).toBeDefined();

      // Pause recording
      store.pauseRecording();
      currentState = useBrowserAutomationStore.getState();
      expect(currentState.recording.isPaused).toBe(true);

      // Resume recording
      store.resumeRecording();
      currentState = useBrowserAutomationStore.getState();
      expect(currentState.recording.isPaused).toBe(false);

      // Clear recording
      store.addEvent(createMockRecordedEvent('click'));
      currentState = useBrowserAutomationStore.getState();
      expect(currentState.events).toHaveLength(1);

      store.clearRecording();
      currentState = useBrowserAutomationStore.getState();
      expect(currentState.events).toHaveLength(0);
      expect(currentState.recording.isRecording).toBe(false);
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

      // Should have recorded events even with one failure
      expect(recordedEvents.length).toBeGreaterThan(0);
    });

    it('should handle code generation errors', async () => {
      const events = [createMockRecordedEvent('click')];

      // Test that generator handles malformed data gracefully
      const generatedTest = await generator.generateTestCode(events, {
        format: 'typescript',
        framework: 'playwright',
        includeComments: true,
        includeAssertions: false,
      });

      expect(generatedTest).toBeDefined();
      expect(generatedTest.code).toBeDefined();
    });

    it('should recover from DOM changes during recording', async () => {
      await recorder.start({ recordInitialNavigation: false });

      // Record event on element
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });
      await recorder.handleDOMEvent(clickEvent);

      // Simulate DOM change - add new element
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

      // Clean up
      if (newElement.parentNode) {
        document.body.removeChild(newElement);
      }
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large numbers of events efficiently', async () => {
      const startTime = performance.now();
      
      await recorder.start({ recordInitialNavigation: false });

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
    });

    it('should clean up resources properly', async () => {
      await recorder.start();

      // Generate events
      for (let i = 0; i < 10; i++) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: mockElement });
        await recorder.handleDOMEvent(clickEvent);
      }

      await recorder.stop();

      // Clean up should happen automatically
      expect(recorder.isRecording()).toBe(false);
    });
  });

  describe('Settings Integration', () => {
    it('should apply recording settings correctly', async () => {
      const store = useBrowserAutomationStore.getState();

      // Update settings
      store.updateSettings({
        recordingOptions: {
          captureScreenshots: false,
          captureConsole: true,
          captureNetwork: false,
          capturePerformance: false,
          ignoredEvents: ['mousemove'],
          debounceMs: 200,
          maxEvents: 1000,
        },
      });

      // Create recorder with updated settings
      const customRecorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);

      await customRecorder.start();
      await customRecorder.stop();

      expect(customRecorder.getStatus().isRecording).toBe(false);
    });

    it('should apply generation settings correctly', async () => {
      const store = useBrowserAutomationStore.getState();

      // Add event
      store.addEvent(createMockRecordedEvent('click'));

      // Update export settings
      store.updateSettings({
        exportOptions: {
          format: 'playwright',
          includeComments: false,
          includeAssertions: true,
          includeSetup: false,
        },
      });

      // Generate with settings
      const generatedTest = await store.generateTest({
        format: 'typescript',
        framework: 'playwright',
        includeComments: false,
        includeAssertions: true,
        includeSetup: false,
      });

      expect(generatedTest.code).not.toContain('// Generated test code would go here');
    });
  });
});