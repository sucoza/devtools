/**
 * Performance and Load Tests for Browser Automation Plugin
 * Tests plugin scalability, memory usage, and performance under load
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventRecorder } from '../../core/recorder';
import { SelectorEngine } from '../../core/selector-engine';
import { PlaywrightGenerator } from '../../core/generators/playwright-generator';
import { useBrowserAutomationStore } from '../../core/devtools-store';
import { renderHook, act } from '@testing-library/react';
import { 
  createMockRecordedEvent, 
  createMockUserFlow, 
  resetCounters 
} from '../__mocks__/test-data-factory';

// Mock heavy operations for consistent performance testing
vi.mock('../../core/selector-engine');
vi.mock('../__mocks__/playwright');

const MockSelectorEngine = vi.mocked(SelectorEngine);

describe('Plugin Performance Tests', () => {
  let recorder: EventRecorder;
  let generator: PlaywrightGenerator;
  let mockSelectorEngine: any;
  let mockDevToolsClient: any;

  beforeEach(() => {
    resetCounters();

    // Reset store state to prevent test pollution
    const store = useBrowserAutomationStore.getState();
    store.clearRecording();

    // Create optimized mock selector engine for performance testing
    mockSelectorEngine = {
      generateSelector: vi.fn().mockImplementation(async () => {
        // Simulate selector generation time
        await new Promise(resolve => setTimeout(resolve, 1));
        return '#test-element-' + Math.random().toString(36).substr(2, 9);
      }),
      generateAlternativeSelectors: vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 0.5));
        return ['#primary', '.secondary', '[data-testid="tertiary"]'];
      }),
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

    mockDevToolsClient = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      addEvent: vi.fn(),
    };

    recorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);
    generator = new PlaywrightGenerator();
  });

  afterEach(() => {
    recorder.stop();
    vi.clearAllMocks();
  });

  describe('Event Recording Performance', () => {
    it('should handle rapid event recording efficiently', async () => {
      const eventCount = 1000;
      const startTime = performance.now();

      await recorder.start({ recordInitialNavigation: false });
      
      // Create mock element
      const mockElement = document.createElement('button');
      mockElement.id = 'perf-test-button';
      mockElement.getBoundingClientRect = vi.fn(() => ({
        x: 100, y: 100, width: 120, height: 40,
        top: 100, left: 100, right: 220, bottom: 140,
        toJSON: vi.fn(),
      }));
      document.body.appendChild(mockElement);

      // Generate many rapid events
      const eventPromises = [];
      for (let i = 0; i < eventCount; i++) {
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: 100 + (i % 10),
          clientY: 100 + Math.floor(i / 10),
        });
        Object.defineProperty(event, 'target', { value: mockElement });
        
        eventPromises.push(recorder.handleDOMEvent(event));
      }

      await Promise.all(eventPromises);
      const recordedEvents = await recorder.stop();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(recordedEvents).toHaveLength(eventCount);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(duration / eventCount).toBeLessThan(5); // Less than 5ms per event
      
      console.log(`Recorded ${eventCount} events in ${duration.toFixed(2)}ms (${(duration / eventCount).toFixed(2)}ms per event)`);
      
      document.body.removeChild(mockElement);
    });

    it('should maintain performance with complex selectors', async () => {
      const eventCount = 100;

      // Mock complex selector generation
      mockSelectorEngine.generateSelector.mockImplementation(async () => {
        // Simulate more complex selector generation
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'html > body > div.container > div.row > div.col-md-6 > form#contact-form > div.form-group > input.form-control';
      });

      const startTime = performance.now();
      await recorder.start({ recordInitialNavigation: false });

      const mockElement = document.createElement('input');
      mockElement.className = 'form-control complex-selector-test';
      mockElement.getBoundingClientRect = vi.fn(() => ({
        x: 100, y: 100, width: 200, height: 30,
        top: 100, left: 100, right: 300, bottom: 130,
        toJSON: vi.fn(),
      }));
      document.body.appendChild(mockElement);

      // Use 'click' events instead of 'input' to avoid debouncing
      for (let i = 0; i < eventCount; i++) {
        const event = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(event, 'target', { value: mockElement });
        await recorder.handleDOMEvent(event);
      }

      const recordedEvents = await recorder.stop();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(recordedEvents).toHaveLength(eventCount);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds even with complex selectors (10ms mock delay per event)

      console.log(`Complex selector generation: ${eventCount} events in ${duration.toFixed(2)}ms`);

      document.body.removeChild(mockElement);
    });

    it('should handle memory efficiently during long sessions', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const eventCount = 500;

      await recorder.start({ recordInitialNavigation: false });

      const mockElement = document.createElement('div');
      mockElement.id = 'memory-test-element';
      mockElement.getBoundingClientRect = vi.fn(() => ({
        x: 100, y: 100, width: 100, height: 100,
        top: 100, left: 100, right: 200, bottom: 200,
        toJSON: vi.fn(),
      }));
      document.body.appendChild(mockElement);

      // Record many events in batches to simulate long session
      const batchSize = 100;
      for (let batch = 0; batch < eventCount / batchSize; batch++) {
        for (let i = 0; i < batchSize; i++) {
          const event = new MouseEvent('click', { bubbles: true });
          Object.defineProperty(event, 'target', { value: mockElement });
          await recorder.handleDOMEvent(event);
        }
      }

      const recordedEvents = await recorder.stop();
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;

      expect(recordedEvents).toHaveLength(eventCount);
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth

      console.log(`Memory growth for ${eventCount} events: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);

      document.body.removeChild(mockElement);
    }, 60000);
  });

  describe('Code Generation Performance', () => {
    it('should generate code quickly for large event sets', async () => {
      const eventCount = 500;
      
      // Create large set of events
      const events = Array.from({ length: eventCount }, (_, i) => 
        createMockRecordedEvent(i % 2 === 0 ? 'click' : 'input', {
          sequence: i,
          target: {
            ...createMockRecordedEvent().target,
            selector: `#element-${i}`,
          },
        })
      );

      const startTime = performance.now();
      
      const generatedTest = await generator.generateTestCode(events, {
        format: 'typescript',
        framework: 'playwright',
        includeComments: false,
        includeAssertions: false,
        includeSetup: false,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(generatedTest.code).toBeDefined();
      expect(generatedTest.code.length).toBeGreaterThan(1000);
      expect(duration).toBeLessThan(2000); // Should generate within 2 seconds
      expect(duration / eventCount).toBeLessThan(4); // Less than 4ms per event

      console.log(`Generated test code for ${eventCount} events in ${duration.toFixed(2)}ms`);
    });

    it('should handle complex event patterns efficiently', async () => {
      // Create complex user flow
      const complexFlow = [
        ...createMockUserFlow(['navigation', 'click', 'input', 'click']),
        ...createMockUserFlow(['navigation', 'click', 'change', 'submit']),
        ...createMockUserFlow(['click', 'input', 'keydown', 'click']),
        ...createMockUserFlow(['scroll', 'click', 'input', 'blur']),
        ...createMockUserFlow(['focus', 'input', 'change', 'submit']),
      ];

      const startTime = performance.now();

      const generatedTest = await generator.generateTestCode(complexFlow, {
        format: 'typescript',
        framework: 'playwright',
        includeComments: true,
        includeAssertions: true,
        includeSetup: true,
        optimization: {
          combineSelectors: true,
          removeRedundantWaits: true,
          optimizeAssertions: true,
        },
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(generatedTest.code).toBeDefined();
      expect(duration).toBeLessThan(1000); // Complex optimization should complete within 1 second
      
      console.log(`Complex flow generation: ${complexFlow.length} events in ${duration.toFixed(2)}ms`);
    });

    it('should scale code generation linearly', async () => {
      const testSizes = [10, 50, 100, 200];
      const timings: number[] = [];

      for (const size of testSizes) {
        const events = Array.from({ length: size }, (_, i) => 
          createMockRecordedEvent('click', { sequence: i })
        );

        const startTime = performance.now();
        
        await generator.generateTestCode(events, {
          format: 'typescript',
          framework: 'playwright',
          includeComments: false,
          includeAssertions: false,
        });

        const duration = performance.now() - startTime;
        timings.push(duration);
      }

      // Check that timing scales roughly linearly (not exponentially)
      const ratios = [];
      for (let i = 1; i < timings.length; i++) {
        const sizeRatio = testSizes[i] / testSizes[i - 1];
        const timeRatio = timings[i] / timings[i - 1];
        // Guard against division by zero when timings are very small
        if (timings[i - 1] > 0 && isFinite(timeRatio)) {
          ratios.push(timeRatio / sizeRatio);
        }
      }

      // Ratio should be close to 1 for linear scaling
      ratios.forEach(ratio => {
        expect(ratio).toBeLessThan(3); // Allow some overhead but should be roughly linear
      });

      console.log('Scaling test timings:', timings.map((t, i) => `${testSizes[i]} events: ${t.toFixed(2)}ms`).join(', '));
    });
  });

  describe('Store Performance', () => {
    it('should handle rapid state updates efficiently', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const updateCount = 1000;
      
      const startTime = performance.now();

      for (let i = 0; i < updateCount; i++) {
        act(() => {
          result.current.addEvent(createMockRecordedEvent('click', { sequence: i }));
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.events).toHaveLength(updateCount);
      expect(duration).toBeLessThan(2000); // Should handle 1000 updates in under 2 seconds
      expect(duration / updateCount).toBeLessThan(2); // Less than 2ms per update

      console.log(`Store updates: ${updateCount} events in ${duration.toFixed(2)}ms`);
    });

    it('should maintain performance with complex state', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      // Create complex initial state
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addEvent(createMockRecordedEvent('click', { sequence: i }));
        }
        
        result.current.updateSettings({
          recordingOptions: {
            captureScreenshots: true,
            captureConsole: true,
            captureNetwork: true,
            capturePerformance: true,
            ignoredEvents: ['mousemove', 'scroll'],
            debounceMs: 50,
            maxEvents: 2000,
          },
        });
      });

      // Measure performance of operations on complex state
      const operations = [
        () => result.current.getFilteredEvents(),
        () => result.current.updateFilters({ search: 'test' }),
        () => result.current.selectEvent(result.current.events[50]?.id),
        () => result.current.updateStats(),
      ];

      for (const operation of operations) {
        const startTime = performance.now();
        
        act(() => {
          operation();
        });

        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(50); // Each operation should complete quickly
      }
    });

    it('should handle large filter operations efficiently', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      
      // Create large dataset
      const eventTypes = ['click', 'input', 'change', 'submit', 'navigation', 'scroll'];
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.addEvent(createMockRecordedEvent(
            eventTypes[i % eventTypes.length] as any,
            {
              sequence: i,
              target: {
                ...createMockRecordedEvent().target,
                selector: `#element-${i}`,
                textContent: `Element ${i} content`,
              },
            }
          ));
        }
      });

      // Test filtering performance
      const filterTests = [
        () => result.current.updateFilters({ eventTypes: new Set(['click', 'input']) }),
        () => result.current.updateFilters({ search: 'element' }),
        () => result.current.updateFilters({ showOnlyErrors: true }),
        () => result.current.updateFilters({ hideSystem: true }),
      ];

      for (const filterTest of filterTests) {
        const startTime = performance.now();
        
        act(() => {
          filterTest();
        });

        const filteredEvents = result.current.getFilteredEvents();
        const duration = performance.now() - startTime;

        expect(duration).toBeLessThan(100); // Filtering should be fast
        expect(filteredEvents).toBeDefined();
        
        console.log(`Filter operation completed in ${duration.toFixed(2)}ms, ${filteredEvents.length} results`);
      }
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners and references', async () => {
      const initialListeners = document.eventListeners?.size || 0;
      
      // Create and destroy multiple recorder instances
      for (let i = 0; i < 10; i++) {
        const testRecorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);
        await testRecorder.start();
        
        // Record some events
        const mockElement = document.createElement('div');
        document.body.appendChild(mockElement);
        
        const event = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(event, 'target', { value: mockElement });
        await testRecorder.handleDOMEvent(event);
        
        await testRecorder.stop();
        document.body.removeChild(mockElement);
      }

      // Check that listeners are cleaned up
      const finalListeners = document.eventListeners?.size || 0;
      expect(finalListeners - initialListeners).toBeLessThan(5); // Some variance allowed
    });

    it('should handle garbage collection of large datasets', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      
      // Create large dataset
      act(() => {
        for (let i = 0; i < 5000; i++) {
          result.current.addEvent(createMockRecordedEvent('click', {
            sequence: i,
            metadata: {
              ...createMockRecordedEvent().metadata,
              screenshot: {
                id: `screenshot-${i}`,
                format: 'png',
                quality: 90,
                fullPage: false,
                data: 'data:image/png;base64,' + 'x'.repeat(1000), // Large screenshot data
                size: 1000,
                dimensions: { width: 1024, height: 768 },
              },
            },
          }));
        }
      });

      expect(result.current.events).toHaveLength(5000);

      // Clear data
      act(() => {
        result.current.clearRecording();
      });

      expect(result.current.events).toHaveLength(0);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Memory should be released (this is more of a smoke test)
      expect(result.current.events).toHaveLength(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent recording and playback', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      
      // Start recording
      act(() => {
        result.current.startRecording();
      });

      // Add events concurrently
      const concurrentOperations = [];
      for (let i = 0; i < 50; i++) {
        concurrentOperations.push(
          new Promise<void>(resolve => {
            act(() => {
              result.current.addEvent(createMockRecordedEvent('click', { sequence: i }));
            });
            resolve();
          })
        );
      }

      await Promise.all(concurrentOperations);

      expect(result.current.events).toHaveLength(50);
      expect(result.current.recording.isRecording).toBe(true);

      // Stop recording
      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.recording.isRecording).toBe(false);
    });

    it('should handle concurrent code generation requests', async () => {
      const events = Array.from({ length: 100 }, (_, i) => 
        createMockRecordedEvent('click', { sequence: i })
      );

      // Start multiple generation requests concurrently
      const generationPromises = Array.from({ length: 5 }, () =>
        generator.generateTestCode(events, {
          format: 'typescript',
          framework: 'playwright',
          includeComments: false,
          includeAssertions: false,
        })
      );

      const startTime = performance.now();
      const results = await Promise.all(generationPromises);
      const duration = performance.now() - startTime;

      // All should succeed
      results.forEach(result => {
        expect(result.code).toBeDefined();
        expect(result.metadata.eventCount).toBe(100);
      });

      // Concurrent generation shouldn't take much longer than single generation
      expect(duration).toBeLessThan(5000);

      console.log(`Concurrent generation of 5 tests completed in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Stress Testing', () => {
    it('should survive stress test with mixed operations', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const operations = 200;
      
      const startTime = performance.now();

      // Mix of different operations
      for (let i = 0; i < operations; i++) {
        const operationType = i % 6;
        
        act(() => {
          switch (operationType) {
            case 0:
              result.current.addEvent(createMockRecordedEvent('click', { sequence: i }));
              break;
            case 1:
              result.current.updateFilters({ search: `test-${i}` });
              break;
            case 2:
              result.current.selectTab(i % 2 === 0 ? 'events' : 'recorder');
              break;
            case 3:
              result.current.updateSelectorStrategy({ optimize: i % 2 === 0 });
              break;
            case 4:
              result.current.getFilteredEvents();
              break;
            case 5:
              result.current.updateStats();
              break;
          }
        });
      }

      const duration = performance.now() - startTime;

      // Should complete without crashing
      expect(result.current.events.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // Should complete within reasonable time
      expect(result.current.ui.activeTab).toBeDefined();

      console.log(`Stress test with ${operations} mixed operations completed in ${duration.toFixed(2)}ms`);
    });

    it('should handle edge cases in rapid succession', async () => {
      const edgeCases = [
        () => recorder.start(),
        () => recorder.stop(),
        () => recorder.start(),
        () => recorder.pause(),
        () => recorder.resume(),
        () => recorder.clear(),
        () => recorder.stop(),
      ];

      // Execute edge cases rapidly
      for (const edgeCase of edgeCases) {
        await edgeCase();
        await new Promise(resolve => setTimeout(resolve, 1)); // Minimal delay
      }

      // Should not crash or leave inconsistent state
      expect(recorder.isRecording()).toBe(false);
      expect(recorder.isPaused()).toBe(false);
    });
  });
});