/**
 * Unit tests for DevTools Store
 * Tests the Zustand store that manages browser automation state
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrowserAutomationStore } from '../../../core/devtools-store';
import { 
  createMockRecordedEvent, 
  createMockRecordingSession,
  createMockTestCase,
  resetCounters 
} from '../../__mocks__/test-data-factory';
import type { BrowserAutomationAction, TestGenerationOptions } from '../../../types';

describe('DevTools Store', () => {
  beforeEach(() => {
    // Reset store to initial state by recreating it
    const { setState } = useBrowserAutomationStore;
    setState((state) => ({
      ...state,
      events: [],
      recording: {
        isRecording: false,
        isPaused: false,
        startTime: null,
        duration: 0,
        eventCount: 0,
        activeSession: null,
      },
      stats: {
        totalSessions: 0,
        totalEvents: 0,
        averageSessionDuration: 0,
        mostUsedEvents: [],
        generatedTests: 0,
        lastActivity: null,
      },
      ui: {
        ...state.ui,
        selectedEventId: null,
        filters: {
          eventTypes: new Set([
            'click',
            'input',
            'navigation',
            'change',
            'submit',
          ]),
          search: '',
          showOnlyErrors: false,
          hideSystem: false,
        },
      },
    }));
    
    resetCounters();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const state = result.current;

      expect(state.recording.isRecording).toBe(false);
      expect(state.recording.isPaused).toBe(false);
      expect(state.recording.eventCount).toBe(0);
      expect(state.playback.isPlaying).toBe(false);
      expect(state.events).toEqual([]);
      expect(state.testCases).toEqual([]);
      expect(state.ui.activeTab).toBe('recorder');
      expect(state.selectorEngine.mode).toBe('auto');
    });

    it('should have correct default settings', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const { settings } = result.current;

      expect(settings.recordingOptions.captureScreenshots).toBe(true);
      expect(settings.recordingOptions.captureConsole).toBe(true);
      expect(settings.recordingOptions.debounceMs).toBe(100);
      expect(settings.selectorOptions.mode).toBe('auto');
      expect(settings.playbackOptions.defaultSpeed).toBe(1.0);
      expect(settings.exportOptions.format).toBe('playwright');
    });
  });

  describe('Recording Actions', () => {
    it('should start recording correctly', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.startRecording();
      });

      const state = result.current;
      expect(state.recording.isRecording).toBe(true);
      expect(state.recording.isPaused).toBe(false);
      expect(state.recording.startTime).toBeDefined();
      expect(state.recording.activeSession).toBeDefined();
      expect(state.stats.totalSessions).toBe(1);
    });

    it('should stop recording correctly', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        result.current.stopRecording();
      });

      const state = result.current;
      expect(state.recording.isRecording).toBe(false);
      expect(state.recording.isPaused).toBe(false);
      expect(state.recording.duration).toBeGreaterThanOrEqual(0);
    });

    it('should pause and resume recording', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        result.current.pauseRecording();
      });

      expect(result.current.recording.isPaused).toBe(true);

      act(() => {
        result.current.resumeRecording();
      });

      expect(result.current.recording.isPaused).toBe(false);
    });

    it('should clear recording', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      // Start recording and add some events
      act(() => {
        result.current.startRecording();
        result.current.addEvent(createMockRecordedEvent('click'));
        result.current.addEvent(createMockRecordedEvent('input'));
      });

      expect(result.current.events).toHaveLength(2);

      act(() => {
        result.current.clearRecording();
      });

      const state = result.current;
      expect(state.recording.isRecording).toBe(false);
      expect(state.events).toEqual([]);
    });
  });

  describe('Event Management', () => {
    it('should add events correctly', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const mockEvent = createMockRecordedEvent('click');

      act(() => {
        result.current.addEvent(mockEvent);
      });

      const state = result.current;
      expect(state.events).toHaveLength(1);
      expect(state.events[0]).toEqual(mockEvent);
      expect(state.recording.eventCount).toBe(1);
      expect(state.stats.totalEvents).toBe(1);
    });

    it('should remove events correctly', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const event1 = createMockRecordedEvent('click');
      const event2 = createMockRecordedEvent('input');

      act(() => {
        result.current.addEvent(event1);
        result.current.addEvent(event2);
      });

      expect(result.current.events).toHaveLength(2);

      act(() => {
        result.current.removeEvent(event1.id);
      });

      const state = result.current;
      expect(state.events).toHaveLength(1);
      expect(state.events[0].id).toBe(event2.id);
    });

    it('should update events correctly', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const mockEvent = createMockRecordedEvent('click');

      act(() => {
        result.current.addEvent(mockEvent);
      });

      const updates = { 
        target: { 
          ...mockEvent.target, 
          selector: '#updated-selector' 
        } 
      };

      act(() => {
        result.current.updateEvent(mockEvent.id, updates);
      });

      const updatedEvent = result.current.events[0];
      expect(updatedEvent.target.selector).toBe('#updated-selector');
    });
  });

  describe('Playback Actions', () => {
    it('should start playback correctly', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      
      // Add some events first
      act(() => {
        result.current.addEvent(createMockRecordedEvent('click'));
        result.current.addEvent(createMockRecordedEvent('input'));
      });

      act(() => {
        result.current.startPlayback();
      });

      const state = result.current;
      expect(state.playback.isPlaying).toBe(true);
      expect(state.playback.isPaused).toBe(false);
      expect(state.playback.status.totalSteps).toBe(2);
      expect(state.playback.status.currentStep).toBe(0);
    });

    it('should stop playback correctly', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.startPlayback();
      });

      act(() => {
        result.current.stopPlayback();
      });

      const state = result.current;
      expect(state.playback.isPlaying).toBe(false);
      expect(state.playback.currentEventId).toBeNull();
    });

    it('should set playback speed', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.setPlaybackSpeed(2.0);
      });

      expect(result.current.playback.speed).toBe(2.0);
    });

    it('should step through playback', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const mockEvent = createMockRecordedEvent('click');

      act(() => {
        result.current.addEvent(mockEvent);
        result.current.stepPlayback(mockEvent.id);
      });

      expect(result.current.playback.currentEventId).toBe(mockEvent.id);
    });
  });

  describe('Selector Engine', () => {
    it('should set selector mode', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.setSelectorMode('manual');
      });

      const state = result.current;
      expect(state.selectorEngine.mode).toBe('manual');
      expect(state.settings.selectorOptions.mode).toBe('manual');
    });

    it('should update selector strategy', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.updateSelectorStrategy({
          priority: ['id', 'data-testid', 'css'],
          optimize: false,
        });
      });

      const strategy = result.current.selectorEngine.strategy;
      expect(strategy.priority).toEqual(['id', 'data-testid', 'css']);
      expect(strategy.optimize).toBe(false);
    });

    it('should highlight element', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const selector = '#test-element';

      act(() => {
        result.current.highlightElement(selector);
      });

      expect(result.current.selectorEngine.highlightedElement).toBe(selector);
    });
  });

  describe('UI State Management', () => {
    it('should select tabs', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.selectTab('playback');
      });

      expect(result.current.ui.activeTab).toBe('playback');
    });

    it('should select events', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const mockEvent = createMockRecordedEvent('click');

      act(() => {
        result.current.addEvent(mockEvent);
        result.current.selectEvent(mockEvent.id);
      });

      expect(result.current.ui.selectedEventId).toBe(mockEvent.id);
    });

    it('should toggle panels', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      expect(result.current.ui.panelsExpanded.events).toBe(true);

      act(() => {
        result.current.togglePanel('events');
      });

      expect(result.current.ui.panelsExpanded.events).toBe(false);
    });

    it('should update filters', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.updateFilters({
          search: 'test query',
          showOnlyErrors: true,
        });
      });

      const filters = result.current.ui.filters;
      expect(filters.search).toBe('test query');
      expect(filters.showOnlyErrors).toBe(true);
    });

    it('should set theme', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.ui.theme).toBe('dark');
      expect(result.current.settings.uiOptions.theme).toBe('dark');
    });
  });

  describe('Settings Management', () => {
    it('should update settings', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.updateSettings({
          recordingOptions: {
            ...result.current.settings.recordingOptions,
            captureScreenshots: false,
            debounceMs: 200,
          },
        });
      });

      const settings = result.current.settings;
      expect(settings.recordingOptions.captureScreenshots).toBe(false);
      expect(settings.recordingOptions.debounceMs).toBe(200);
    });

    it('should reset settings', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      // Modify settings first
      act(() => {
        result.current.updateSettings({
          recordingOptions: {
            ...result.current.settings.recordingOptions,
            captureScreenshots: false,
          },
        });
      });

      expect(result.current.settings.recordingOptions.captureScreenshots).toBe(false);

      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.settings.recordingOptions.captureScreenshots).toBe(true);
    });
  });

  describe('Test Generation', () => {
    it('should generate test correctly', async () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      // Add some events
      act(() => {
        result.current.addEvent(createMockRecordedEvent('click'));
        result.current.addEvent(createMockRecordedEvent('input'));
      });

      const options: TestGenerationOptions = {
        format: 'typescript',
        framework: 'playwright',
        includeComments: true,
        includeAssertions: true,
      };

      let generatedTest;
      await act(async () => {
        generatedTest = await result.current.generateTest(options);
      });

      expect(generatedTest).toBeDefined();
      expect(generatedTest.format).toBe('typescript');
      expect(generatedTest.framework).toBe('playwright');
      expect(generatedTest.code).toContain("import { test, expect } from '@playwright/test'");
      expect(generatedTest.metadata.eventCount).toBe(2);
      expect(result.current.stats.generatedTests).toBe(1);
    });

    it('should import test case', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const testCase = createMockTestCase();

      act(() => {
        result.current.importTestCase(testCase);
      });

      expect(result.current.testCases).toHaveLength(1);
      expect(result.current.testCases[0]).toEqual(testCase);
    });
  });

  describe('Utility Methods', () => {
    it('should filter events correctly', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      const clickEvent = createMockRecordedEvent('click');
      const inputEvent = createMockRecordedEvent('input');
      const scrollEvent = createMockRecordedEvent('scroll');

      act(() => {
        result.current.addEvent(clickEvent);
        result.current.addEvent(inputEvent);
        result.current.addEvent(scrollEvent);
      });

      // Test event type filtering - first clear all filters, then set specific ones
      act(() => {
        result.current.updateFilters({
          eventTypes: new Set([]), // Clear all first
        });
      });
      
      act(() => {
        result.current.updateFilters({
          eventTypes: new Set(['click', 'input']),
        });
      });

      const filteredEvents = result.current.getFilteredEvents();
      expect(filteredEvents).toHaveLength(2);
      expect(filteredEvents.map(e => e.type)).toEqual(['click', 'input']);
    });

    it('should filter events by search query', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      const buttonEvent = createMockRecordedEvent('click', {
        target: { ...createMockRecordedEvent().target, selector: '#submit-button' }
      });
      const inputEvent = createMockRecordedEvent('input', {
        target: { ...createMockRecordedEvent().target, selector: '#username-input' }
      });

      act(() => {
        result.current.addEvent(buttonEvent);
        result.current.addEvent(inputEvent);
        result.current.updateFilters({ search: 'button' });
      });

      const filteredEvents = result.current.getFilteredEvents();
      expect(filteredEvents).toHaveLength(1);
      expect(filteredEvents[0].target.selector).toBe('#submit-button');
    });

    it('should get selected event', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const mockEvent = createMockRecordedEvent('click');

      act(() => {
        result.current.addEvent(mockEvent);
        result.current.selectEvent(mockEvent.id);
      });

      const selectedEvent = result.current.getSelectedEvent();
      expect(selectedEvent).toEqual(mockEvent);
    });

    it('should get active session', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.startRecording();
      });

      const activeSession = result.current.getActiveSession();
      expect(activeSession).toBeDefined();
      expect(activeSession?.name).toContain('Session');
    });

    it('should update stats correctly', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.addEvent(createMockRecordedEvent('click'));
        result.current.addEvent(createMockRecordedEvent('click'));
        result.current.addEvent(createMockRecordedEvent('input'));
        result.current.updateStats();
      });

      const stats = result.current.stats;
      expect(stats.totalEvents).toBe(3);
      expect(stats.mostUsedEvents).toHaveLength(2);
      expect(stats.mostUsedEvents[0]).toEqual({ type: 'click', count: 2 });
      expect(stats.mostUsedEvents[1]).toEqual({ type: 'input', count: 1 });
    });
  });

  describe('Collaboration Features', () => {
    it('should manage collaboration panel', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.setCollaborationPanel('shared-tests');
      });

      expect(result.current.collaboration.collaborationPanel).toBe('shared-tests');
    });

    it('should show and hide share dialog', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const sharePayload = { testId: 'test-123', type: 'share' };

      act(() => {
        result.current.showShareDialog(sharePayload);
      });

      expect(result.current.collaboration.activeShareDialog).toEqual(sharePayload);

      act(() => {
        result.current.hideShareDialog();
      });

      expect(result.current.collaboration.activeShareDialog).toBeNull();
    });

    it('should manage notifications', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());
      const notification = {
        id: 'notif-1',
        message: 'Test shared successfully',
        type: 'success',
        read: false,
      };

      act(() => {
        result.current.addNotification(notification);
      });

      expect(result.current.collaboration.notifications).toHaveLength(1);
      expect(result.current.collaboration.notifications[0]).toEqual(notification);

      act(() => {
        result.current.markNotificationRead('notif-1');
      });

      expect(result.current.collaboration.notifications[0].read).toBe(true);
    });

    it('should manage library search and filters', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      act(() => {
        result.current.updateLibrarySearch('login flow');
      });

      expect(result.current.collaboration.library.searchQuery).toBe('login flow');

      act(() => {
        result.current.updateLibraryFilters({ category: 'authentication' });
      });

      expect(result.current.collaboration.library.filters.category).toBe('authentication');

      act(() => {
        result.current.updateLibrarySort('name', 'asc');
      });

      expect(result.current.collaboration.library.sortBy).toBe('name');
      expect(result.current.collaboration.library.sortOrder).toBe('asc');

      act(() => {
        result.current.updateLibraryView('list');
      });

      expect(result.current.collaboration.library.viewMode).toBe('list');
    });
  });

  describe('Action Dispatching', () => {
    it('should dispatch actions correctly', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      const action: BrowserAutomationAction = {
        type: 'ui/theme/set',
        payload: 'light',
      };

      act(() => {
        result.current.dispatch(action);
      });

      expect(result.current.ui.theme).toBe('light');
    });

    it('should handle unknown actions gracefully', () => {
      const { result } = renderHook(() => useBrowserAutomationStore());

      const unknownAction = {
        type: 'unknown/action' as any,
        payload: 'test',
      };

      expect(() => {
        act(() => {
          result.current.dispatch(unknownAction);
        });
      }).not.toThrow();
    });
  });
});