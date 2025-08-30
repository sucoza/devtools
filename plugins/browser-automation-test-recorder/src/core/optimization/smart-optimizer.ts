/**
 * Smart Test Optimization Engine
 * Analyzes recorded events and applies intelligent optimizations for better test code
 */

import type { RecordedEvent, NavigationEventData, FormEventData, MouseEventData, KeyboardEventData } from '../../types';
import type { EventGroup } from '../code-generator';

export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  priority: number; // Higher = more important
  condition: (events: RecordedEvent[]) => boolean;
  apply: (events: RecordedEvent[]) => RecordedEvent[];
  category: 'performance' | 'reliability' | 'readability' | 'maintainability';
}

export interface OptimizationResult {
  originalCount: number;
  optimizedCount: number;
  appliedRules: string[];
  improvements: OptimizationImprovement[];
  warnings: string[];
}

export interface OptimizationImprovement {
  type: 'removed_duplicate' | 'merged_events' | 'added_wait' | 'improved_selector' | 'grouped_actions';
  description: string;
  impact: 'low' | 'medium' | 'high';
  eventIds: string[];
}

export interface SmartNaming {
  testName: string;
  groupNames: Map<string, string>;
  methodNames: Map<string, string>;
  variableNames: Map<string, string>;
}

/**
 * Smart optimization engine for test code generation
 */
export class SmartOptimizer {
  private rules: OptimizationRule[] = [];

  constructor() {
    this.initializeOptimizationRules();
  }

  /**
   * Optimize events with smart analysis
   */
  optimizeEvents(events: RecordedEvent[]): OptimizationResult {
    let optimizedEvents = [...events];
    const appliedRules: string[] = [];
    const improvements: OptimizationImprovement[] = [];
    const warnings: string[] = [];

    // Sort rules by priority (highest first)
    const sortedRules = this.rules.sort((a, b) => b.priority - a.priority);

    // Apply optimization rules
    for (const rule of sortedRules) {
      if (rule.condition(optimizedEvents)) {
        const beforeCount = optimizedEvents.length;
        optimizedEvents = rule.apply(optimizedEvents);
        const afterCount = optimizedEvents.length;

        appliedRules.push(rule.id);

        if (beforeCount !== afterCount) {
          improvements.push({
            type: this.getImprovementType(rule.id),
            description: `${rule.name}: ${rule.description}`,
            impact: this.getImprovementImpact(rule.id),
            eventIds: optimizedEvents.map(e => e.id)
          });
        }
      }
    }

    // Analyze for potential issues
    warnings.push(...this.analyzeForWarnings(optimizedEvents));

    return {
      originalCount: events.length,
      optimizedCount: optimizedEvents.length,
      appliedRules,
      improvements,
      warnings
    };
  }

  /**
   * Generate smart event grouping
   */
  generateSmartGroups(events: RecordedEvent[]): EventGroup[] {
    const groups: EventGroup[] = [];
    let currentGroup: EventGroup | null = null;
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const nextEvent = events[i + 1];
      
      const groupType = this.determineGroupType(event, nextEvent);
      
      // Start new group if context changes
      if (!currentGroup || this.shouldStartNewGroup(currentGroup, event, groupType)) {
        if (currentGroup && currentGroup.events.length > 0) {
          groups.push(currentGroup);
        }
        
        currentGroup = {
          id: this.generateId(),
          name: this.generateSmartGroupName(groupType, event),
          description: this.generateGroupDescription(groupType, event, events.slice(i)),
          actionType: groupType,
          events: []
        };
      }
      
      currentGroup.events.push(event);
    }

    if (currentGroup && currentGroup.events.length > 0) {
      groups.push(currentGroup);
    }

    return this.optimizeGroups(groups);
  }

  /**
   * Generate smart names for test components
   */
  generateSmartNames(events: RecordedEvent[], groups: EventGroup[]): SmartNaming {
    const testName = this.generateTestName(events);
    const groupNames = new Map<string, string>();
    const methodNames = new Map<string, string>();
    const variableNames = new Map<string, string>();

    // Generate group names
    groups.forEach(group => {
      const smartName = this.generateSmartGroupName(group.actionType, group.events[0]);
      groupNames.set(group.id, smartName);
      
      // Generate method names for page objects
      const methodName = this.generateMethodName(group.events);
      methodNames.set(group.id, methodName);
    });

    // Generate variable names from selectors
    const uniqueSelectors = new Set(events.map(e => e.target.selector));
    uniqueSelectors.forEach(selector => {
      const varName = this.generateVariableName(selector);
      variableNames.set(selector, varName);
    });

    return {
      testName,
      groupNames,
      methodNames,
      variableNames
    };
  }

  /**
   * Insert smart waits based on timing analysis
   */
  insertSmartWaits(events: RecordedEvent[]): RecordedEvent[] {
    const result: RecordedEvent[] = [];
    
    for (let i = 0; i < events.length; i++) {
      const current = events[i];
      const next = events[i + 1];
      
      result.push(current);
      
      if (next) {
        const waitEvent = this.analyzeWaitNeed(current, next, events.slice(0, i));
        if (waitEvent) {
          result.push(waitEvent);
        }
      }
    }
    
    return result;
  }

  /**
   * Optimize selectors for better reliability
   */
  optimizeSelectors(events: RecordedEvent[]): RecordedEvent[] {
    return events.map(event => ({
      ...event,
      target: {
        ...event.target,
        selector: this.optimizeSelector(event.target.selector, event.target)
      }
    }));
  }

  /**
   * Initialize optimization rules
   */
  private initializeOptimizationRules(): void {
    this.rules = [
      // Remove duplicate consecutive clicks
      {
        id: 'remove-duplicate-clicks',
        name: 'Remove Duplicate Clicks',
        description: 'Removes consecutive clicks on the same element within 500ms',
        priority: 10,
        category: 'performance',
        condition: (events) => this.hasConsecutiveDuplicateClicks(events),
        apply: (events) => this.removeConsecutiveDuplicateClicks(events)
      },

      // Merge rapid input events
      {
        id: 'merge-input-events',
        name: 'Merge Input Events',
        description: 'Combines rapid sequential input events into single actions',
        priority: 9,
        category: 'readability',
        condition: (events) => this.hasRapidInputEvents(events),
        apply: (events) => this.mergeRapidInputEvents(events)
      },

      // Remove unnecessary mouse movements
      {
        id: 'remove-mouse-movements',
        name: 'Remove Mouse Movements',
        description: 'Removes unnecessary mouse movement events',
        priority: 8,
        category: 'performance',
        condition: (events) => events.some(e => e.type === 'mousemove'),
        apply: (events) => events.filter(e => e.type !== 'mousemove')
      },

      // Group form interactions
      {
        id: 'group-form-interactions',
        name: 'Group Form Interactions',
        description: 'Groups related form field interactions',
        priority: 7,
        category: 'readability',
        condition: (events) => this.hasFormInteractions(events),
        apply: (events) => this.groupFormInteractions(events)
      },

      // Remove redundant navigation events
      {
        id: 'remove-redundant-navigation',
        name: 'Remove Redundant Navigation',
        description: 'Removes duplicate navigation to the same URL',
        priority: 6,
        category: 'performance',
        condition: (events) => this.hasRedundantNavigation(events),
        apply: (events) => this.removeRedundantNavigation(events)
      },

      // Optimize selector chains
      {
        id: 'optimize-selectors',
        name: 'Optimize Selectors',
        description: 'Improves selector reliability and readability',
        priority: 5,
        category: 'reliability',
        condition: () => true, // Always apply
        apply: (events) => this.optimizeAllSelectors(events)
      },

      // Add stability waits
      {
        id: 'add-stability-waits',
        name: 'Add Stability Waits',
        description: 'Adds waits for better test stability',
        priority: 4,
        category: 'reliability',
        condition: (events) => this.needsStabilityWaits(events),
        apply: (events) => this.addStabilityWaits(events)
      }
    ];
  }

  /**
   * Determine group type based on event patterns
   */
  private determineGroupType(event: RecordedEvent, nextEvent?: RecordedEvent): EventGroup['actionType'] {
    switch (event.type) {
      case 'navigation':
        return 'navigation';
      case 'input':
      case 'change':
      case 'submit':
      case 'focus':
      case 'blur':
        return 'form_interaction';
      case 'assertion':
        return 'assertion';
      case 'wait':
        return 'wait';
      default:
        // Analyze context for smart grouping
        if (this.isFormContext(event, nextEvent)) {
          return 'form_interaction';
        }
        return 'custom';
    }
  }

  /**
   * Check if should start new group
   */
  private shouldStartNewGroup(currentGroup: EventGroup, event: RecordedEvent, groupType: EventGroup['actionType']): boolean {
    // Always start new group for navigation
    if (event.type === 'navigation') return true;
    
    // Start new group if action type changes
    if (currentGroup.actionType !== groupType) return true;
    
    // Start new group if there's a significant time gap
    const lastEvent = currentGroup.events[currentGroup.events.length - 1];
    if (event.timestamp - lastEvent.timestamp > 5000) return true; // 5 second gap
    
    return false;
  }

  /**
   * Generate smart group name
   */
  private generateSmartGroupName(actionType: EventGroup['actionType'], firstEvent: RecordedEvent): string {
    switch (actionType) {
      case 'navigation':
        const navData = firstEvent.data as NavigationEventData;
        const url = new URL(navData.url);
        return `Navigate to ${url.pathname.split('/').filter(Boolean)[0] || url.hostname}`;
      
      case 'form_interaction':
        if (firstEvent.target.name) {
          return `Fill ${this.humanize(firstEvent.target.name)}`;
        }
        if (firstEvent.target.id) {
          return `Fill ${this.humanize(firstEvent.target.id)}`;
        }
        return 'Fill form fields';
      
      case 'assertion':
        return 'Verify results';
      
      case 'wait':
        return 'Wait for condition';
      
      default:
        return `Perform ${firstEvent.type} actions`;
    }
  }

  /**
   * Generate group description
   */
  private generateGroupDescription(actionType: EventGroup['actionType'], firstEvent: RecordedEvent, followingEvents: RecordedEvent[]): string {
    const eventCount = followingEvents.filter(e => this.determineGroupType(e) === actionType).length + 1;
    
    switch (actionType) {
      case 'navigation':
        return `Navigate to page and wait for load`;
      
      case 'form_interaction':
        return `Fill ${eventCount} form field${eventCount > 1 ? 's' : ''}`;
      
      case 'assertion':
        return `Verify ${eventCount} condition${eventCount > 1 ? 's' : ''}`;
      
      default:
        return `Perform ${eventCount} ${actionType} action${eventCount > 1 ? 's' : ''}`;
    }
  }

  /**
   * Generate test name from events
   */
  private generateTestName(events: RecordedEvent[]): string {
    const navEvent = events.find(e => e.type === 'navigation');
    const formEvents = events.filter(e => ['input', 'change', 'submit'].includes(e.type));
    const assertionEvents = events.filter(e => e.type === 'assertion');

    if (navEvent && formEvents.length > 0 && assertionEvents.length > 0) {
      const url = new URL((navEvent.data as NavigationEventData).url);
      const pageName = url.pathname.split('/').filter(Boolean)[0] || url.hostname;
      return `should complete ${pageName} form submission workflow`;
    }

    if (navEvent && formEvents.length > 0) {
      const url = new URL((navEvent.data as NavigationEventData).url);
      const pageName = url.pathname.split('/').filter(Boolean)[0] || url.hostname;
      return `should fill form on ${pageName}`;
    }

    if (navEvent) {
      const url = new URL((navEvent.data as NavigationEventData).url);
      const pageName = url.pathname.split('/').filter(Boolean)[0] || url.hostname;
      return `should navigate to ${pageName}`;
    }

    return 'should complete recorded workflow';
  }

  /**
   * Generate method name from events
   */
  private generateMethodName(events: RecordedEvent[]): string {
    if (events.length === 1) {
      const event = events[0];
      const action = event.type;
      const target = this.getTargetName(event);
      return `${action}${this.capitalize(target)}`;
    }

    const actionTypes = events.map(e => e.type);
    const dominantAction = this.getMostFrequent(actionTypes);
    
    if (dominantAction === 'input') {
      return 'fillForm';
    } else if (dominantAction === 'click') {
      return 'performClicks';
    } else if (dominantAction === 'navigation') {
      return 'navigateToPage';
    }
    
    return `perform${this.capitalize(dominantAction)}Actions`;
  }

  /**
   * Generate variable name from selector
   */
  private generateVariableName(selector: string): string {
    // Extract meaningful parts from selector
    if (selector.includes('#')) {
      const id = selector.match(/#([a-zA-Z0-9_-]+)/)?.[1];
      if (id) return this.toCamelCase(id);
    }
    
    if (selector.includes('[name=')) {
      const name = selector.match(/\[name=['"]([^'"]+)['"]\]/)?.[1];
      if (name) return this.toCamelCase(name);
    }
    
    if (selector.includes('[data-testid=')) {
      const testId = selector.match(/\[data-testid=['"]([^'"]+)['"]\]/)?.[1];
      if (testId) return this.toCamelCase(testId);
    }
    
    // Generate from CSS selector
    const cleanSelector = selector.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
    if (cleanSelector) {
      return this.toCamelCase(cleanSelector.substring(0, 20));
    }
    
    return 'element';
  }

  /**
   * Analyze wait requirements between events
   */
  private analyzeWaitNeed(current: RecordedEvent, next: RecordedEvent, history: RecordedEvent[]): RecordedEvent | null {
    const timeDiff = next.timestamp - current.timestamp;
    
    // Add wait after navigation
    if (current.type === 'navigation' && timeDiff > 1000) {
      return this.createWaitEvent('navigation', Math.min(timeDiff, 5000));
    }
    
    // Add wait after form submission
    if (current.type === 'submit' && timeDiff > 2000) {
      return this.createWaitEvent('network', Math.min(timeDiff, 10000));
    }
    
    // Add wait for dynamic content
    if (this.isDynamicContent(current, next) && timeDiff > 1000) {
      return this.createWaitEvent('element', Math.min(timeDiff, 3000));
    }
    
    return null;
  }

  /**
   * Optimize individual selector
   */
  private optimizeSelector(selector: string, target?: any): string {
    // Prefer data attributes
    if (target?.getAttribute?.('data-testid')) {
      return `[data-testid="${target.getAttribute('data-testid')}"]`;
    }
    
    if (target?.getAttribute?.('data-cy')) {
      return `[data-cy="${target.getAttribute('data-cy')}"]`;
    }
    
    // Prefer ID if stable
    if (target?.id && !target.id.match(/^[0-9]|random|temp|auto/)) {
      return `#${target.id}`;
    }
    
    // Simplify complex selectors
    if (selector.split(' ').length > 3) {
      // Try to find a simpler alternative
      const parts = selector.split(' ');
      const simplified = parts[parts.length - 1];
      if (simplified.includes('#') || simplified.includes('[')) {
        return simplified;
      }
    }
    
    return selector;
  }

  // Helper methods for optimization rules
  private hasConsecutiveDuplicateClicks(events: RecordedEvent[]): boolean {
    for (let i = 1; i < events.length; i++) {
      const current = events[i];
      const previous = events[i - 1];
      
      if (current.type === 'click' && previous.type === 'click' &&
          current.target.selector === previous.target.selector &&
          (current.timestamp - previous.timestamp) < 500) {
        return true;
      }
    }
    return false;
  }

  private removeConsecutiveDuplicateClicks(events: RecordedEvent[]): RecordedEvent[] {
    const result: RecordedEvent[] = [];
    let lastClick: RecordedEvent | null = null;
    
    for (const event of events) {
      if (event.type === 'click') {
        if (!lastClick || 
            event.target.selector !== lastClick.target.selector ||
            (event.timestamp - lastClick.timestamp) >= 500) {
          result.push(event);
          lastClick = event;
        }
      } else {
        result.push(event);
        lastClick = null;
      }
    }
    
    return result;
  }

  private hasRapidInputEvents(events: RecordedEvent[]): boolean {
    const inputEvents = events.filter(e => e.type === 'input');
    for (let i = 1; i < inputEvents.length; i++) {
      if (inputEvents[i].timestamp - inputEvents[i-1].timestamp < 200) {
        return true;
      }
    }
    return false;
  }

  private mergeRapidInputEvents(events: RecordedEvent[]): RecordedEvent[] {
    const result: RecordedEvent[] = [];
    let currentInputGroup: RecordedEvent[] = [];
    
    for (const event of events) {
      if (event.type === 'input') {
        if (currentInputGroup.length === 0 || 
            (event.target.selector === currentInputGroup[0].target.selector &&
             event.timestamp - currentInputGroup[currentInputGroup.length - 1].timestamp < 200)) {
          currentInputGroup.push(event);
        } else {
          if (currentInputGroup.length > 0) {
            result.push(this.createMergedInputEvent(currentInputGroup));
          }
          currentInputGroup = [event];
        }
      } else {
        if (currentInputGroup.length > 0) {
          result.push(this.createMergedInputEvent(currentInputGroup));
          currentInputGroup = [];
        }
        result.push(event);
      }
    }
    
    if (currentInputGroup.length > 0) {
      result.push(this.createMergedInputEvent(currentInputGroup));
    }
    
    return result;
  }

  private createMergedInputEvent(inputEvents: RecordedEvent[]): RecordedEvent {
    const lastEvent = inputEvents[inputEvents.length - 1];
    const allText = inputEvents
      .map(e => (e.data as FormEventData).value)
      .filter(Boolean)
      .join('');
    
    const lastEventData = lastEvent.data as KeyboardEventData;
    return {
      ...lastEvent,
      data: {
        ...lastEventData,
        inputValue: allText
      } as KeyboardEventData
    };
  }

  // Additional helper methods...
  private hasFormInteractions(events: RecordedEvent[]): boolean {
    return events.some(e => ['input', 'change', 'submit'].includes(e.type));
  }

  private groupFormInteractions(events: RecordedEvent[]): RecordedEvent[] {
    // Implementation for grouping form interactions
    return events;
  }

  private hasRedundantNavigation(events: RecordedEvent[]): boolean {
    const navEvents = events.filter(e => e.type === 'navigation');
    for (let i = 1; i < navEvents.length; i++) {
      const current = navEvents[i].data as NavigationEventData;
      const previous = navEvents[i-1].data as NavigationEventData;
      if (current.url === previous.url) return true;
    }
    return false;
  }

  private removeRedundantNavigation(events: RecordedEvent[]): RecordedEvent[] {
    const result: RecordedEvent[] = [];
    let lastUrl: string | null = null;
    
    for (const event of events) {
      if (event.type === 'navigation') {
        const navData = event.data as NavigationEventData;
        if (navData.url !== lastUrl) {
          result.push(event);
          lastUrl = navData.url;
        }
      } else {
        result.push(event);
      }
    }
    
    return result;
  }

  private optimizeAllSelectors(events: RecordedEvent[]): RecordedEvent[] {
    return events.map(event => ({
      ...event,
      target: {
        ...event.target,
        selector: this.optimizeSelector(event.target.selector, event.target)
      }
    }));
  }

  private needsStabilityWaits(events: RecordedEvent[]): boolean {
    return events.some(e => e.type === 'navigation') || 
           events.some(e => e.type === 'submit');
  }

  private addStabilityWaits(events: RecordedEvent[]): RecordedEvent[] {
    return this.insertSmartWaits(events);
  }

  private optimizeGroups(groups: EventGroup[]): EventGroup[] {
    // Merge small adjacent groups of the same type
    const result: EventGroup[] = [];
    
    for (let i = 0; i < groups.length; i++) {
      const current = groups[i];
      const next = groups[i + 1];
      
      if (next && 
          current.actionType === next.actionType && 
          current.events.length < 3 && 
          next.events.length < 3) {
        // Merge groups
        const merged: EventGroup = {
          id: current.id,
          name: current.name,
          description: `${current.description} and ${next.description.toLowerCase()}`,
          actionType: current.actionType,
          events: [...current.events, ...next.events]
        };
        result.push(merged);
        i++; // Skip next group
      } else {
        result.push(current);
      }
    }
    
    return result;
  }

  private analyzeForWarnings(events: RecordedEvent[]): string[] {
    const warnings: string[] = [];
    
    // Check for potential flaky selectors
    const selectors = events.map(e => e.target.selector);
    const fragileSelectors = selectors.filter(s => 
      s.includes(':nth-child') || 
      s.split(' ').length > 4 ||
      /\[class.*\s.*\]/.test(s)
    );
    
    if (fragileSelectors.length > 0) {
      warnings.push(`Found ${fragileSelectors.length} potentially fragile selector(s). Consider using data-testid attributes.`);
    }
    
    // Check for missing waits after navigation
    for (let i = 0; i < events.length - 1; i++) {
      if (events[i].type === 'navigation' && 
          events[i + 1].type !== 'wait' &&
          events[i + 1].timestamp - events[i].timestamp < 1000) {
        warnings.push('Consider adding waits after navigation events for better stability.');
        break;
      }
    }
    
    return warnings;
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private humanize(text: string): string {
    return text
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }

  private toCamelCase(text: string): string {
    return text
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^./, char => char.toLowerCase());
  }

  private capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private getMostFrequent<T>(array: T[]): T {
    const frequency = array.reduce((acc, item) => {
      acc[String(item)] = (acc[String(item)] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Find the most frequent string key and map back to original value
    const mostFrequentKey = Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
    
    // Find the original array element that matches this key
    return array.find(item => String(item) === mostFrequentKey) as T;
  }

  private getTargetName(event: RecordedEvent): string {
    const target = event.target;
    return target.name || target.id || target.tagName.toLowerCase();
  }

  private isFormContext(event: RecordedEvent, nextEvent?: RecordedEvent): boolean {
    return event.target.tagName?.toLowerCase() === 'input' ||
           event.target.tagName?.toLowerCase() === 'select' ||
           event.target.tagName?.toLowerCase() === 'textarea' ||
           (nextEvent && ['input', 'change'].includes(nextEvent.type));
  }

  private isDynamicContent(current: RecordedEvent, next: RecordedEvent): boolean {
    // Simple heuristic for dynamic content detection
    return current.type === 'click' && 
           ['input', 'change'].includes(next.type) &&
           next.timestamp - current.timestamp > 500;
  }

  private createWaitEvent(reason: string, duration: number): RecordedEvent {
    return {
      id: this.generateId(),
      type: 'wait',
      timestamp: Date.now(),
      sequence: 0,
      target: {
        selector: '',
        tagName: '',
        boundingRect: {} as DOMRect,
        path: [],
        alternativeSelectors: []
      },
      data: {
        type: 'wait',
        duration,
        reason: reason as 'manual' | 'network' | 'timeout' | 'element' | 'navigation'
      },
      context: {} as any,
      metadata: {} as any
    };
  }

  private getImprovementType(ruleId: string): OptimizationImprovement['type'] {
    const typeMap: Record<string, OptimizationImprovement['type']> = {
      'remove-duplicate-clicks': 'removed_duplicate',
      'merge-input-events': 'merged_events',
      'add-stability-waits': 'added_wait',
      'optimize-selectors': 'improved_selector',
      'group-form-interactions': 'grouped_actions'
    };
    return typeMap[ruleId] || 'grouped_actions';
  }

  private getImprovementImpact(ruleId: string): OptimizationImprovement['impact'] {
    const impactMap: Record<string, OptimizationImprovement['impact']> = {
      'remove-duplicate-clicks': 'high',
      'merge-input-events': 'medium',
      'add-stability-waits': 'high',
      'optimize-selectors': 'medium',
      'group-form-interactions': 'low'
    };
    return impactMap[ruleId] || 'medium';
  }
}

export default SmartOptimizer;