/**
 * Event Processing & Storage System
 * Handles event deduplication, optimization, filtering, and storage
 */

import type {
  RecordedEvent,
  EventType as _EventType,
  EventGroup,
  EventAnnotation,
  RecordingSession as _RecordingSession,
  EventFilters,
  EventData as _EventData,
  MouseEventData as _MouseEventData,
  KeyboardEventData as _KeyboardEventData,
} from '../types';

/**
 * Event processing options
 */
export interface ProcessingOptions {
  deduplicateEvents: boolean;
  mergeConsecutiveEvents: boolean;
  filterNoiseEvents: boolean;
  groupRelatedEvents: boolean;
  optimizeSelectors: boolean;
  addSmartWaits: boolean;
  maxEventBufferSize: number;
  processingBatchSize: number;
}

/**
 * Event processing result
 */
export interface ProcessingResult {
  originalCount: number;
  processedCount: number;
  removedCount: number;
  groupsCreated: number;
  optimizations: string[];
}

/**
 * Event timeline marker
 */
export interface TimelineMarker {
  id: string;
  timestamp: number;
  type: 'start' | 'end' | 'milestone' | 'error';
  label: string;
  description?: string;
  color?: string;
}

/**
 * Advanced event processor with intelligent optimization
 */
export class EventProcessor {
  private processingOptions: ProcessingOptions = {
    deduplicateEvents: true,
    mergeConsecutiveEvents: true,
    filterNoiseEvents: true,
    groupRelatedEvents: true,
    optimizeSelectors: false,
    addSmartWaits: true,
    maxEventBufferSize: 10000,
    processingBatchSize: 100,
  };

  // Event buffers
  private rawEventBuffer: RecordedEvent[] = [];
  private processedEvents: RecordedEvent[] = [];
  private eventGroups: Map<string, EventGroup> = new Map();
  private timelineMarkers: TimelineMarker[] = [];

  // Processing state
  private lastProcessedIndex = 0;
  private processingInProgress = false;
  
  // Event statistics
  private eventStats = {
    totalProcessed: 0,
    duplicatesRemoved: 0,
    noisyEventsFiltered: 0,
    eventsGrouped: 0,
    waitEventsAdded: 0,
  };

  constructor(options?: Partial<ProcessingOptions>) {
    if (options) {
      this.processingOptions = { ...this.processingOptions, ...options };
    }
  }

  /**
   * Add raw event to processing buffer
   */
  addEvent(event: RecordedEvent): void {
    // Check buffer size limit
    if (this.rawEventBuffer.length >= this.processingOptions.maxEventBufferSize) {
      // console.warn('EventProcessor: Buffer size limit reached, discarding oldest events');
      this.rawEventBuffer.shift();
    }

    this.rawEventBuffer.push(event);

    // Trigger batch processing if buffer is full enough
    if (this.rawEventBuffer.length - this.lastProcessedIndex >= this.processingOptions.processingBatchSize) {
      this.processBatch();
    }
  }

  /**
   * Process all pending events
   */
  async processAllEvents(): Promise<ProcessingResult> {
    if (this.processingInProgress) {
      // console.warn('EventProcessor: Processing already in progress');
      return this.getEmptyResult();
    }

    this.processingInProgress = true;
    const originalCount = this.rawEventBuffer.length;

    try {
      // Process all remaining events
      await this.processBatch(true);

      const result: ProcessingResult = {
        originalCount,
        processedCount: this.processedEvents.length,
        removedCount: originalCount - this.processedEvents.length,
        groupsCreated: this.eventGroups.size,
        optimizations: this.getOptimizationSummary(),
      };

      return result;

    } finally {
      this.processingInProgress = false;
    }
  }

  /**
   * Get processed events with optional filtering
   */
  getProcessedEvents(filters?: EventFilters): RecordedEvent[] {
    let events = [...this.processedEvents];

    if (!filters) {
      return events;
    }

    // Apply filters
    if (filters.eventTypes.size > 0) {
      events = events.filter(event => filters.eventTypes.has(event.type));
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      events = events.filter(event => 
        event.type.toLowerCase().includes(query) ||
        event.target.selector.toLowerCase().includes(query) ||
        event.target.textContent?.toLowerCase().includes(query) ||
        event.metadata.annotations.some(ann => 
          ann.content.toLowerCase().includes(query)
        )
      );
    }

    if (filters.showOnlyErrors) {
      // Filter to only events with errors (would need error tracking)
      events = events.filter(event => 
        event.metadata.custom.hasError || 
        event.metadata.reliability.confidence < 0.5
      );
    }

    if (filters.hideSystem) {
      const systemEvents: EventType as _EventType[] = ['scroll', 'mousemove', 'resize', 'load'];
      events = events.filter(event => !systemEvents.includes(event.type));
    }

    // Apply grouping
    if (filters.groupBy === 'type') {
      events.sort((a, b) => a.type.localeCompare(b.type));
    } else if (filters.groupBy === 'element') {
      events.sort((a, b) => a.target.selector.localeCompare(b.target.selector));
    } else if (filters.groupBy === 'page') {
      events.sort((a, b) => a.context.url.localeCompare(b.context.url));
    }

    return events;
  }

  /**
   * Get event groups
   */
  getEventGroups(): EventGroup[] {
    return Array.from(this.eventGroups.values());
  }

  /**
   * Get timeline markers
   */
  getTimelineMarkers(): TimelineMarker[] {
    return [...this.timelineMarkers];
  }

  /**
   * Get processing statistics
   */
  getStatistics(): typeof this.eventStats {
    return { ...this.eventStats };
  }

  /**
   * Add event annotation
   */
  addEventAnnotation(eventId: string, annotation: Omit<EventAnnotation, 'id'>): void {
    const event = this.processedEvents.find(e => e.id === eventId);
    if (event) {
      const newAnnotation: EventAnnotation = {
        id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...annotation,
      };
      event.metadata.annotations.push(newAnnotation);
    }
  }

  /**
   * Create event group
   */
  createEventGroup(eventIds: string[], groupName: string, description?: string): string {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const group: EventGroup = {
      id: groupId,
      name: groupName,
      description,
      color: this.generateGroupColor(),
      collapsed: false,
      events: eventIds,
    };

    this.eventGroups.set(groupId, group);

    // Update events with group reference
    eventIds.forEach(eventId => {
      const event = this.processedEvents.find(e => e.id === eventId);
      if (event) {
        event.metadata.group = group;
      }
    });

    return groupId;
  }

  /**
   * Add timeline marker
   */
  addTimelineMarker(marker: Omit<TimelineMarker, 'id'>): string {
    const markerId = `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const timelineMarker: TimelineMarker = {
      id: markerId,
      ...marker,
    };

    this.timelineMarkers.push(timelineMarker);
    this.timelineMarkers.sort((a, b) => a.timestamp - b.timestamp);

    return markerId;
  }

  /**
   * Clear all processed data
   */
  clear(): void {
    this.rawEventBuffer = [];
    this.processedEvents = [];
    this.eventGroups.clear();
    this.timelineMarkers = [];
    this.lastProcessedIndex = 0;
    this.processingInProgress = false;
    
    // Reset stats
    this.eventStats = {
      totalProcessed: 0,
      duplicatesRemoved: 0,
      noisyEventsFiltered: 0,
      eventsGrouped: 0,
      waitEventsAdded: 0,
    };
  }

  /**
   * Export processed events for test generation
   */
  exportForTestGeneration(): {
    events: RecordedEvent[];
    groups: EventGroup[];
    timeline: TimelineMarker[];
    metadata: any;
  } {
    return {
      events: this.getProcessedEvents(),
      groups: this.getEventGroups(),
      timeline: this.getTimelineMarkers(),
      metadata: {
        stats: this.getStatistics(),
        processingOptions: this.processingOptions,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Process batch of events
   */
  private async processBatch(processAll: boolean = false): Promise<void> {
    const endIndex = processAll ? 
      this.rawEventBuffer.length : 
      Math.min(this.lastProcessedIndex + this.processingOptions.processingBatchSize, this.rawEventBuffer.length);

    const eventsToProcess = this.rawEventBuffer.slice(this.lastProcessedIndex, endIndex);
    
    if (eventsToProcess.length === 0) {
      return;
    }

    // Step 1: Deduplicate events
    const deduplicated = this.processingOptions.deduplicateEvents ? 
      this.deduplicateEvents(eventsToProcess) : 
      eventsToProcess;

    // Step 2: Filter noise events
    const filtered = this.processingOptions.filterNoiseEvents ? 
      this.filterNoiseEvents(deduplicated) : 
      deduplicated;

    // Step 3: Merge consecutive events
    const merged = this.processingOptions.mergeConsecutiveEvents ? 
      this.mergeConsecutiveEvents(filtered) : 
      filtered;

    // Step 4: Add smart waits
    const withWaits = this.processingOptions.addSmartWaits ? 
      this.addSmartWaits(merged) : 
      merged;

    // Step 5: Group related events
    if (this.processingOptions.groupRelatedEvents) {
      this.groupRelatedEvents(withWaits);
    }

    // Add processed events to final buffer
    this.processedEvents.push(...withWaits);
    this.eventStats.totalProcessed += withWaits.length;
    
    this.lastProcessedIndex = endIndex;
  }

  /**
   * Remove duplicate events based on content and timing
   */
  private deduplicateEvents(events: RecordedEvent[]): RecordedEvent[] {
    const deduplicated: RecordedEvent[] = [];
    const seenEvents = new Set<string>();

    for (const event of events) {
      const eventKey = this.generateEventKey(event);
      
      if (!seenEvents.has(eventKey)) {
        deduplicated.push(event);
        seenEvents.add(eventKey);
      } else {
        this.eventStats.duplicatesRemoved++;
      }
    }

    return deduplicated;
  }

  /**
   * Filter out noisy/irrelevant events
   */
  private filterNoiseEvents(events: RecordedEvent[]): RecordedEvent[] {
    const filtered = events.filter(event => {
      // Filter rapid mousemove events
      if (event.type === 'mousemove') {
        return false; // Usually noise
      }

      // Filter meaningless scroll events
      if (event.type === 'scroll') {
        const scrollData = event.data as any;
        if (scrollData.scrollX === 0 && scrollData.scrollY === 0) {
          return false;
        }
      }

      // Filter empty input events
      if (event.type === 'input') {
        const keyboardData = event.data as KeyboardEventData as _KeyboardEventData;
        if (!keyboardData.inputValue || keyboardData.inputValue.trim() === '') {
          return false;
        }
      }

      // Filter window resize events during recording
      if (event.type === 'resize') {
        return false; // Usually not relevant for automation
      }

      return true;
    });

    this.eventStats.noisyEventsFiltered += events.length - filtered.length;
    return filtered;
  }

  /**
   * Merge consecutive similar events
   */
  private mergeConsecutiveEvents(events: RecordedEvent[]): RecordedEvent[] {
    if (events.length < 2) return events;

    const merged: RecordedEvent[] = [];
    let current = events[0];

    for (let i = 1; i < events.length; i++) {
      const next = events[i];
      const mergedEvent = this.tryMergeEvents(current, next);
      
      if (mergedEvent) {
        current = mergedEvent;
      } else {
        merged.push(current);
        current = next;
      }
    }
    
    merged.push(current);
    return merged;
  }

  /**
   * Try to merge two consecutive events
   */
  private tryMergeEvents(event1: RecordedEvent, event2: RecordedEvent): RecordedEvent | null {
    // Can only merge events on same element
    if (event1.target.selector !== event2.target.selector) {
      return null;
    }

    // Merge consecutive keystrokes into input
    if (event1.type === 'keydown' && event2.type === 'input') {
      return {
        ...event2,
        type: 'input',
        metadata: {
          ...event2.metadata,
          custom: {
            ...event2.metadata.custom,
            mergedFrom: [event1.id, event2.id],
          },
        },
      };
    }

    // Merge rapid clicks (double-click detection)
    if (event1.type === 'click' && event2.type === 'click') {
      const timeDiff = event2.timestamp - event1.timestamp;
      if (timeDiff < 500) { // Within 500ms
        return {
          ...event2,
          type: 'dblclick',
          metadata: {
            ...event2.metadata,
            custom: {
              ...event2.metadata.custom,
              mergedFrom: [event1.id, event2.id],
            },
          },
        };
      }
    }

    return null;
  }

  /**
   * Add smart wait events based on timing analysis
   */
  private addSmartWaits(events: RecordedEvent[]): RecordedEvent[] {
    const eventsWithWaits: RecordedEvent[] = [];
    
    for (let i = 0; i < events.length; i++) {
      const current = events[i];
      const next = events[i + 1];
      
      eventsWithWaits.push(current);
      
      if (next) {
        const timeDiff = next.timestamp - current.timestamp;
        
        // Add wait if significant delay between events
        if (timeDiff > 1000) { // More than 1 second
          const waitEvent = this.createWaitEvent(timeDiff, 'Auto-detected delay', current.timestamp + 1);
          eventsWithWaits.push(waitEvent);
          this.eventStats.waitEventsAdded++;
        }
      }
    }
    
    return eventsWithWaits;
  }

  /**
   * Group related events together
   */
  private groupRelatedEvents(events: RecordedEvent[]): void {
    const groups: Array<{ events: RecordedEvent[]; pattern: string }> = [];

    // Group form interactions
    const formEvents = events.filter(event => 
      ['input', 'change', 'focus', 'blur', 'submit'].includes(event.type)
    );
    
    if (formEvents.length > 1) {
      // Group by form element
      const formGroups = new Map<string, RecordedEvent[]>();
      
      formEvents.forEach(event => {
        // Find parent form
        const formSelector = this.findParentForm(event.target.selector);
        if (formSelector) {
          if (!formGroups.has(formSelector)) {
            formGroups.set(formSelector, []);
          }
          formGroups.get(formSelector)!.push(event);
        }
      });

      // Create groups for forms with multiple events
      formGroups.forEach((formEvents, formSelector) => {
        if (formEvents.length > 1) {
          groups.push({
            events: formEvents,
            pattern: `Form interaction: ${formSelector}`,
          });
        }
      });
    }

    // Group navigation sequences
    const _navEvents = events.filter(event => 
      event.type === 'navigation' || event.type === 'click'
    );
    
    // Create groups
    groups.forEach((group, index) => {
      const _groupId = this.createEventGroup(
        group.events.map(e => e.id),
        `Auto Group ${index + 1}`,
        group.pattern
      );
      this.eventStats.eventsGrouped += group.events.length;
    });
  }

  /**
   * Generate unique key for event deduplication
   */
  private generateEventKey(event: RecordedEvent): string {
    const keyParts = [
      event.type,
      event.target.selector,
      event.target.textContent || '',
      Math.floor(event.timestamp / 100) * 100, // Round to 100ms for timing tolerance
    ];

    // Add event-specific data
    if (event.data.type === 'keyboard') {
      const kbData = event.data as KeyboardEventData as _KeyboardEventData;
      keyParts.push(kbData.key, kbData.inputValue || '');
    } else if (event.data.type === 'mouse') {
      const mouseData = event.data as MouseEventData as _MouseEventData;
      keyParts.push(mouseData.button.toString());
    }

    return keyParts.join('|');
  }

  /**
   * Create wait event
   */
  private createWaitEvent(duration: number, reason: string, timestamp: number): RecordedEvent {
    return {
      id: `wait_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'wait',
      timestamp,
      sequence: 0, // Will be set properly during processing
      target: {
        selector: 'window',
        tagName: 'window',
        boundingRect: {
          x: 0, y: 0, width: 0, height: 0,
          top: 0, right: 0, bottom: 0, left: 0,
          toJSON: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }),
        },
        path: [],
        alternativeSelectors: [],
      },
      data: {
        type: 'wait',
        duration,
        reason: 'timeout',
        condition: reason,
      },
      context: {
        url: location.href,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
          isLandscape: window.innerWidth > window.innerHeight,
          isMobile: false,
        },
        userAgent: navigator.userAgent,
      },
      metadata: {
        sessionId: 'auto-generated',
        recordingMode: 'standard',
        reliability: {
          selectorScore: 1.0,
          alternativesCount: 0,
          elementStable: true,
          positionStable: true,
          attributesStable: true,
          timingVariability: 0,
          networkDependency: false,
          confidence: 1.0,
        },
        annotations: [],
        custom: {
          autoGenerated: true,
          reason,
        },
      },
    };
  }

  /**
   * Find parent form selector for an element
   */
  private findParentForm(selector: string): string | null {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const form = element.closest('form');
        if (form) {
          return form.id ? `#${form.id}` : 'form';
        }
      }
    } catch {
      // Ignore selector errors
    }
    return null;
  }

  /**
   * Generate random color for event group
   */
  private generateGroupColor(): string {
    const colors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107',
      '#6f42c1', '#e83e8c', '#fd7e14', '#20c997',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Get optimization summary
   */
  private getOptimizationSummary(): string[] {
    const optimizations: string[] = [];
    
    if (this.eventStats.duplicatesRemoved > 0) {
      optimizations.push(`Removed ${this.eventStats.duplicatesRemoved} duplicate events`);
    }
    
    if (this.eventStats.noisyEventsFiltered > 0) {
      optimizations.push(`Filtered ${this.eventStats.noisyEventsFiltered} noisy events`);
    }
    
    if (this.eventStats.waitEventsAdded > 0) {
      optimizations.push(`Added ${this.eventStats.waitEventsAdded} smart wait events`);
    }
    
    if (this.eventStats.eventsGrouped > 0) {
      optimizations.push(`Grouped ${this.eventStats.eventsGrouped} related events`);
    }
    
    return optimizations;
  }

  /**
   * Get empty processing result
   */
  private getEmptyResult(): ProcessingResult {
    return {
      originalCount: 0,
      processedCount: 0,
      removedCount: 0,
      groupsCreated: 0,
      optimizations: [],
    };
  }
}