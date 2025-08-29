import { describe, it, expect, beforeEach } from 'vitest';
import { useBrowserAutomationStore } from './devtools-store';
import type { RecordedEvent } from '../types';

describe('BrowserAutomationStore', () => {
  let store: ReturnType<typeof useBrowserAutomationStore.getState>;

  beforeEach(() => {
    // Reset store to initial state before each test
    store = useBrowserAutomationStore.getState();
    store.clearRecording();
  });

  describe('Initial State', () => {
    it('should have correct initial recording state', () => {
      const state = store;
      
      expect(state.recording.isRecording).toBe(false);
      expect(state.recording.isPaused).toBe(false);
      expect(state.recording.startTime).toBe(null);
      expect(state.recording.duration).toBe(0);
      expect(state.recording.eventCount).toBe(0);
      expect(state.recording.activeSession).toBe(null);
      expect(state.recording.mode).toBe('standard');
    });

    it('should have correct initial playback state', () => {
      const state = store;
      
      expect(state.playback.isPlaying).toBe(false);
      expect(state.playback.isPaused).toBe(false);
      expect(state.playback.currentEventId).toBe(null);
      expect(state.playback.speed).toBe(1.0);
      expect(state.playback.mode).toBe('normal');
    });

    it('should have empty events array', () => {
      const state = store;
      
      expect(state.events).toEqual([]);
      expect(state.testCases).toEqual([]);
    });

    it('should have correct initial UI state', () => {
      const state = store;
      
      expect(state.ui.activeTab).toBe('recorder');
      expect(state.ui.selectedEventId).toBe(null);
      expect(state.ui.compact).toBe(false);
      expect(state.ui.theme).toBe('auto');
    });
  });

  describe('Recording Actions', () => {
    it('should start recording', () => {
      store.startRecording();
      const state = store;
      
      expect(state.recording.isRecording).toBe(true);
      expect(state.recording.isPaused).toBe(false);
      expect(state.recording.activeSession).toBeDefined();
      expect(state.recording.activeSession?.id).toBeDefined();
    });

    it('should pause recording', () => {
      store.startRecording();
      store.pauseRecording();
      const state = store;
      
      expect(state.recording.isRecording).toBe(true);
      expect(state.recording.isPaused).toBe(true);
    });

    it('should resume recording', () => {
      store.startRecording();
      store.pauseRecording();
      store.resumeRecording();
      const state = store;
      
      expect(state.recording.isRecording).toBe(true);
      expect(state.recording.isPaused).toBe(false);
    });

    it('should stop recording', () => {
      store.startRecording();
      store.stopRecording();
      const state = store;
      
      expect(state.recording.isRecording).toBe(false);
      expect(state.recording.isPaused).toBe(false);
    });

    it('should clear recording', () => {
      store.startRecording();
      const mockEvent: RecordedEvent = {
        id: 'test-event-1',
        type: 'click',
        timestamp: Date.now(),
        sequence: 1,
        target: {
          selector: '#test-button',
          xpath: '',
          textContent: 'Test Button',
          tagName: 'BUTTON',
          boundingRect: { x: 0, y: 0, width: 100, height: 30, top: 0, right: 100, bottom: 30, left: 0, toJSON: () => ({}) },
          path: [],
          alternativeSelectors: [],
        },
        data: {
          type: 'mouse',
          button: 0,
          buttons: 1,
          clientX: 50,
          clientY: 15,
          pageX: 50,
          pageY: 15,
          screenX: 100,
          screenY: 200,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
          detail: 1,
        },
        context: {
          url: 'http://localhost:3000',
          title: 'Test Page',
          viewport: {
            width: 1920,
            height: 1080,
            devicePixelRatio: 1,
            isLandscape: true,
            isMobile: false,
          },
          userAgent: 'test-agent',
        },
        metadata: {
          sessionId: 'test-session',
          recordingMode: 'standard',
          reliability: {
            selectorScore: 1,
            alternativesCount: 0,
            elementStable: true,
            positionStable: true,
            attributesStable: true,
            timingVariability: 0,
            networkDependency: false,
            confidence: 1,
          },
          annotations: [],
          custom: {},
        },
      };
      
      store.addEvent(mockEvent);
      store.clearRecording();
      
      const state = store;
      expect(state.recording.isRecording).toBe(false);
      expect(state.events).toEqual([]);
    });
  });

  describe('Event Management', () => {
    it('should add event to store', () => {
      const mockEvent: RecordedEvent = {
        id: 'test-event-1',
        type: 'click',
        timestamp: Date.now(),
        sequence: 1,
        target: {
          selector: '#test-button',
          xpath: '',
          textContent: 'Test Button',
          tagName: 'BUTTON',
          boundingRect: { x: 0, y: 0, width: 100, height: 30, top: 0, right: 100, bottom: 30, left: 0, toJSON: () => ({}) },
          path: [],
          alternativeSelectors: [],
        },
        data: {
          type: 'mouse',
          button: 0,
          buttons: 1,
          clientX: 50,
          clientY: 15,
          pageX: 50,
          pageY: 15,
          screenX: 100,
          screenY: 200,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
          detail: 1,
        },
        context: {
          url: 'http://localhost:3000',
          title: 'Test Page',
          viewport: {
            width: 1920,
            height: 1080,
            devicePixelRatio: 1,
            isLandscape: true,
            isMobile: false,
          },
          userAgent: 'test-agent',
        },
        metadata: {
          sessionId: 'test-session',
          recordingMode: 'standard',
          reliability: {
            selectorScore: 1,
            alternativesCount: 0,
            elementStable: true,
            positionStable: true,
            attributesStable: true,
            timingVariability: 0,
            networkDependency: false,
            confidence: 1,
          },
          annotations: [],
          custom: {},
        },
      };

      store.addEvent(mockEvent);
      const state = store;
      
      expect(state.events).toHaveLength(1);
      expect(state.events[0]).toEqual(mockEvent);
    });

    it('should remove event from store', () => {
      const mockEvent: RecordedEvent = {
        id: 'test-event-1',
        type: 'click',
        timestamp: Date.now(),
        sequence: 1,
        target: {
          selector: '#test-button',
          xpath: '',
          textContent: 'Test Button',
          tagName: 'BUTTON',
          boundingRect: { x: 0, y: 0, width: 100, height: 30, top: 0, right: 100, bottom: 30, left: 0, toJSON: () => ({}) },
          path: [],
          alternativeSelectors: [],
        },
        data: {
          type: 'mouse',
          button: 0,
          buttons: 1,
          clientX: 50,
          clientY: 15,
          pageX: 50,
          pageY: 15,
          screenX: 100,
          screenY: 200,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
          detail: 1,
        },
        context: {
          url: 'http://localhost:3000',
          title: 'Test Page',
          viewport: {
            width: 1920,
            height: 1080,
            devicePixelRatio: 1,
            isLandscape: true,
            isMobile: false,
          },
          userAgent: 'test-agent',
        },
        metadata: {
          sessionId: 'test-session',
          recordingMode: 'standard',
          reliability: {
            selectorScore: 1,
            alternativesCount: 0,
            elementStable: true,
            positionStable: true,
            attributesStable: true,
            timingVariability: 0,
            networkDependency: false,
            confidence: 1,
          },
          annotations: [],
          custom: {},
        },
      };

      store.addEvent(mockEvent);
      store.removeEvent('test-event-1');
      const state = store;
      
      expect(state.events).toHaveLength(0);
    });
  });

  describe('UI Actions', () => {
    it('should select tab', () => {
      store.selectTab('events');
      const state = store;
      
      expect(state.ui.activeTab).toBe('events');
    });

    it('should select event', () => {
      store.selectEvent('test-event-1');
      const state = store;
      
      expect(state.ui.selectedEventId).toBe('test-event-1');
    });

    it('should set theme', () => {
      store.setTheme('dark');
      const state = store;
      
      expect(state.ui.theme).toBe('dark');
      expect(state.settings.uiOptions.theme).toBe('dark');
    });

    it('should update filters', () => {
      store.updateFilters({ search: 'test query' });
      const state = store;
      
      expect(state.ui.filters.search).toBe('test query');
    });
  });

  describe('Settings', () => {
    it('should update settings', () => {
      store.updateSettings({
        recordingOptions: {
          ...store.settings.recordingOptions,
          captureScreenshots: false,
        },
      });
      
      const state = store;
      expect(state.settings.recordingOptions.captureScreenshots).toBe(false);
    });

    it('should reset settings', () => {
      // First modify settings
      store.updateSettings({
        recordingOptions: {
          ...store.settings.recordingOptions,
          captureScreenshots: false,
        },
      });
      
      // Then reset
      store.resetSettings();
      
      const state = store;
      expect(state.settings.recordingOptions.captureScreenshots).toBe(true); // Back to default
    });
  });

  describe('Utility Methods', () => {
    it('should get filtered events', () => {
      // Add some test events first
      const mockEvents: RecordedEvent[] = [
        {
          id: 'event-1',
          type: 'click',
          timestamp: Date.now(),
          sequence: 1,
          target: {
            selector: '#button1',
            xpath: '',
            textContent: 'Button 1',
            tagName: 'BUTTON',
            boundingRect: { x: 0, y: 0, width: 100, height: 30, top: 0, right: 100, bottom: 30, left: 0, toJSON: () => ({}) },
            path: [],
            alternativeSelectors: [],
          },
          data: {
            type: 'mouse',
            button: 0,
            buttons: 1,
            clientX: 50,
            clientY: 15,
            pageX: 50,
            pageY: 15,
            screenX: 100,
            screenY: 200,
            ctrlKey: false,
            shiftKey: false,
            altKey: false,
            metaKey: false,
            detail: 1,
          },
          context: {
            url: 'http://localhost:3000',
            title: 'Test Page',
            viewport: {
              width: 1920,
              height: 1080,
              devicePixelRatio: 1,
              isLandscape: true,
              isMobile: false,
            },
            userAgent: 'test-agent',
          },
          metadata: {
            sessionId: 'test-session',
            recordingMode: 'standard',
            reliability: {
              selectorScore: 1,
              alternativesCount: 0,
              elementStable: true,
              positionStable: true,
              attributesStable: true,
              timingVariability: 0,
              networkDependency: false,
              confidence: 1,
            },
            annotations: [],
            custom: {},
          },
        },
        {
          id: 'event-2',
          type: 'scroll',
          timestamp: Date.now(),
          sequence: 2,
          target: {
            selector: 'window',
            xpath: '',
            textContent: '',
            tagName: 'WINDOW',
            boundingRect: { x: 0, y: 0, width: 1920, height: 1080, top: 0, right: 1920, bottom: 1080, left: 0, toJSON: () => ({}) },
            path: [],
            alternativeSelectors: [],
          },
          data: {
            type: 'scroll',
            scrollX: 0,
            scrollY: 100,
            scrollTop: 100,
            scrollLeft: 0,
            element: 'window',
          },
          context: {
            url: 'http://localhost:3000',
            title: 'Test Page',
            viewport: {
              width: 1920,
              height: 1080,
              devicePixelRatio: 1,
              isLandscape: true,
              isMobile: false,
            },
            userAgent: 'test-agent',
          },
          metadata: {
            sessionId: 'test-session',
            recordingMode: 'standard',
            reliability: {
              selectorScore: 1,
              alternativesCount: 0,
              elementStable: true,
              positionStable: true,
              attributesStable: true,
              timingVariability: 0,
              networkDependency: false,
              confidence: 1,
            },
            annotations: [],
            custom: {},
          },
        },
      ];

      // Add events to store
      mockEvents.forEach(event => store.addEvent(event));

      const filteredEvents = store.getFilteredEvents();
      
      // Should only include click event as scroll is not in default filter
      expect(filteredEvents).toHaveLength(1);
      expect(filteredEvents[0].type).toBe('click');
    });

    it('should get selected event', () => {
      const mockEvent: RecordedEvent = {
        id: 'test-event-1',
        type: 'click',
        timestamp: Date.now(),
        sequence: 1,
        target: {
          selector: '#test-button',
          xpath: '',
          textContent: 'Test Button',
          tagName: 'BUTTON',
          boundingRect: { x: 0, y: 0, width: 100, height: 30, top: 0, right: 100, bottom: 30, left: 0, toJSON: () => ({}) },
          path: [],
          alternativeSelectors: [],
        },
        data: {
          type: 'mouse',
          button: 0,
          buttons: 1,
          clientX: 50,
          clientY: 15,
          pageX: 50,
          pageY: 15,
          screenX: 100,
          screenY: 200,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
          detail: 1,
        },
        context: {
          url: 'http://localhost:3000',
          title: 'Test Page',
          viewport: {
            width: 1920,
            height: 1080,
            devicePixelRatio: 1,
            isLandscape: true,
            isMobile: false,
          },
          userAgent: 'test-agent',
        },
        metadata: {
          sessionId: 'test-session',
          recordingMode: 'standard',
          reliability: {
            selectorScore: 1,
            alternativesCount: 0,
            elementStable: true,
            positionStable: true,
            attributesStable: true,
            timingVariability: 0,
            networkDependency: false,
            confidence: 1,
          },
          annotations: [],
          custom: {},
        },
      };

      store.addEvent(mockEvent);
      store.selectEvent('test-event-1');

      const selectedEvent = store.getSelectedEvent();
      expect(selectedEvent).toEqual(mockEvent);
    });
  });
});