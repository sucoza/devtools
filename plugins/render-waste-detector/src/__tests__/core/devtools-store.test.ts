import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRenderWasteDetectorStore, getRenderWasteDetectorStore } from '../../core/devtools-store';
import type { RenderEvent } from '../../types';

describe('RenderWasteDetector Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useRenderWasteDetectorStore.getState();
    store.clearRecording();
    vi.clearAllMocks();
  });

  describe('Store initialization', () => {
    it('should initialize with default state', () => {
      const state = useRenderWasteDetectorStore.getState();
      
      expect(state.recording.isRecording).toBe(false);
      expect(state.renderEvents).toEqual([]);
      expect(state.renderTree).toBeNull();
      expect(state.suggestions).toEqual([]);
      expect(state.heatMapData).toEqual([]);
      expect(state.components).toBeInstanceOf(Map);
      expect(state.metrics).toBeInstanceOf(Map);
    });

    it('should export getRenderWasteDetectorStore function', () => {
      expect(getRenderWasteDetectorStore).toBeDefined();
      expect(typeof getRenderWasteDetectorStore).toBe('function');
    });

    it('should export useRenderWasteDetectorStore hook', () => {
      expect(useRenderWasteDetectorStore).toBeDefined();
      expect(typeof useRenderWasteDetectorStore).toBe('function');
    });
  });

  describe('Recording functionality', () => {
    it('should start recording', () => {
      const store = useRenderWasteDetectorStore.getState();
      
      store.startRecording();
      
      const newState = useRenderWasteDetectorStore.getState();
      expect(newState.recording.isRecording).toBe(true);
    });

    it('should stop recording', () => {
      const store = useRenderWasteDetectorStore.getState();
      
      store.startRecording();
      store.stopRecording();
      
      const newState = useRenderWasteDetectorStore.getState();
      expect(newState.recording.isRecording).toBe(false);
    });
  });

  describe('Data management', () => {
    it('should add render event', () => {
      const store = useRenderWasteDetectorStore.getState();
      
      const mockEvent: RenderEvent = {
        id: 'event-1',
        componentId: 'comp-1',
        componentName: 'TestComponent',
        timestamp: Date.now(),
        duration: 10,
        phase: 'mount',
        isWasted: false,
        reason: 'initial render',
        actualDuration: 10,
        baseDuration: 8,
        startTime: Date.now() - 10,
        commitTime: Date.now(),
        interactions: new Set()
      };
      
      store.addRenderEvent(mockEvent);
      
      const newState = useRenderWasteDetectorStore.getState();
      expect(newState.renderEvents).toHaveLength(1);
      expect(newState.renderEvents[0]).toEqual(mockEvent);
    });

    it('should clear all data', () => {
      const store = useRenderWasteDetectorStore.getState();
      
      // Add some data
      store.addRenderEvent({
        id: 'event-1',
        componentId: 'comp-1',
        componentName: 'TestComponent',
        timestamp: Date.now(),
        duration: 10,
        phase: 'mount',
        isWasted: false,
        reason: 'initial render',
        actualDuration: 10,
        baseDuration: 8,
        startTime: Date.now() - 10,
        commitTime: Date.now(),
        interactions: new Set()
      });
      
      // Clear data
      store.clearRecording();
      
      const newState = useRenderWasteDetectorStore.getState();
      expect(newState.renderEvents).toEqual([]);
      expect(newState.suggestions).toEqual([]);
      expect(newState.renderTree).toBeNull();
      expect(newState.heatMapData).toEqual([]);
    });
  });

  describe('Filters', () => {
    it('should update filters', () => {
      const store = useRenderWasteDetectorStore.getState();
      
      store.setFilters({
        minRenderTime: 5,
        showOnlyWasted: true,
        componentName: 'TestComponent',
        severityFilter: 'high'
      });
      
      const newState = useRenderWasteDetectorStore.getState();
      expect(newState.filters.minRenderTime).toBe(5);
      expect(newState.filters.showOnlyWasted).toBe(true);
      expect(newState.filters.componentName).toBe('TestComponent');
    });
  });

  describe('View Options', () => {
    it('should update view options', () => {
      const store = useRenderWasteDetectorStore.getState();
      
      store.setViewOptions({
        showTree: false,
        showTimeline: true,
        showHeatMap: true,
        showStats: false
      });
      
      const newState = useRenderWasteDetectorStore.getState();
      expect(newState.viewOptions.showTree).toBe(false);
      expect(newState.viewOptions.showTimeline).toBe(true);
    });
  });
});