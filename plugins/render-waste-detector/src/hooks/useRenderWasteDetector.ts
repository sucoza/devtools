import * as React from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type {
  UseRenderWasteDetectorOptions,
  UseRenderWasteDetectorResult,
  RecordingSettings,
  RenderWasteDetectorState,
  RenderWasteDetectorEvents,
} from "../types";
import {
  createRenderWasteDetectorDevToolsClient,
  getRenderWasteDetectorDevToolsClient,
} from "../core";

/**
 * Hook for using the render waste detector functionality
 */
export function useRenderWasteDetector(
  options: UseRenderWasteDetectorOptions = {},
): UseRenderWasteDetectorResult {
  const { autoStart = false, settings, onRenderEvent, onSuggestion } = options;

  // Create or get event client
  const eventClient = (React as any).useMemo(() => {
    const client =
      getRenderWasteDetectorDevToolsClient() ||
      createRenderWasteDetectorDevToolsClient();

    // Apply settings if provided
    if (settings) {
      client.updateSettings(settings);
    }

    return client;
  }, [settings]);

  // Subscribe to state changes
  const state = useSyncExternalStore<RenderWasteDetectorState>(
    eventClient.subscribe,
    eventClient.getState,
    eventClient.getState,
  );

  // Auto-start recording if requested
  (React as any).useMemo(() => {
    if (autoStart && !state.recording.isRecording) {
      eventClient.startRecording(settings);
    }
  }, [autoStart, eventClient, settings, state.recording.isRecording]);

  // Set up event listeners
  (React as any).useMemo(() => {
    if (onRenderEvent || onSuggestion) {
      const unsubscribe = eventClient.subscribe((event: RenderWasteDetectorEvents[keyof RenderWasteDetectorEvents], type: keyof RenderWasteDetectorEvents) => {
        if (type === "render-waste:render-event" && onRenderEvent) {
          onRenderEvent(event as any);
        } else if (type === "render-waste:analysis-complete" && onSuggestion) {
          const data = event as any;
          data.suggestions.forEach((suggestion: any) =>
            onSuggestion(suggestion),
          );
        }
      });

      return unsubscribe;
    }
  }, [eventClient, onRenderEvent, onSuggestion]);

  // Create action methods
  const actions = (React as any).useMemo(
    () => ({
      startRecording: (recordingSettings?: Partial<RecordingSettings>) => {
        eventClient.startRecording(recordingSettings);
      },

      stopRecording: () => {
        eventClient.stopRecording();
      },

      pauseRecording: () => {
        eventClient.pauseRecording();
      },

      resumeRecording: () => {
        eventClient.resumeRecording();
      },

      clearRecording: () => {
        eventClient.clearRecording();
      },

      selectComponent: (componentId: string | null) => {
        eventClient.selectComponent(componentId);
      },

      selectRenderEvent: (eventId: string | null) => {
        eventClient.selectRenderEvent(eventId);
      },

      updateFilters: (filters: any) => {
        eventClient.updateFilters(filters);
      },

      updateViewOptions: (options: any) => {
        eventClient.updateViewOptions(options);
      },

      dismissSuggestion: (suggestionId: string) => {
        eventClient.dismissSuggestion(suggestionId);
      },

      applySuggestion: (suggestionId: string) => {
        eventClient.applySuggestion(suggestionId);
      },

      exportSession: () => {
        return eventClient.exportSession();
      },

      importSession: (session: any) => {
        eventClient.importSession(session);
      },
    }),
    [eventClient],
  );

  // Calculate derived state
  const isRecording = state.recording.isRecording;
  const isAnalyzing = state.performance.isAnalyzing;
  const componentCount = state.components.size;
  const renderEventCount = state.renderEvents.length;
  const suggestionCount = state.suggestions.length;

  return {
    state,
    actions,
    isRecording,
    isAnalyzing,
    componentCount,
    renderEventCount,
    suggestionCount,
  };
}
