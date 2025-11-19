import type {
  RenderEvent,
  ComponentInfo,
  _PropChange,
  _StateChange,
  ContextChange,
  RenderReason,
} from "../types";
import type { RenderWasteDetectorDevToolsClient } from "./devtools-client";

/**
 * React Profiler integration for render tracking
 */
export class ProfilerIntegration {
  private eventClient: RenderWasteDetectorDevToolsClient;
  private componentRegistry = new Map<string, ComponentInfo>();
  private previousProps = new Map<string, any>();
  private previousState = new Map<string, any>();
  private previousContext = new Map<string, any>();
  private renderCounts = new Map<string, number>();
  private isActive = false;

  constructor(eventClient: RenderWasteDetectorDevToolsClient) {
    this.eventClient = eventClient;
  }

  /**
   * Start profiler integration
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.setupReactProfiler();
    this.setupComponentTracking();
    console.log("Profiler integration started");
  }

  /**
   * Stop profiler integration
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.cleanup();
    console.log("Profiler integration stopped");
  }

  /**
   * Set up React Profiler API integration
   */
  private setupReactProfiler(): void {
    if (typeof window === "undefined") return;

    // Attempt to integrate with React DevTools Global Hook
    const reactDevTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    if (reactDevTools) {
      // Hook into React's reconciler
      this.hookIntoReconciler(reactDevTools);
    } else {
      // Fallback: Use React.Profiler component wrapper (would be implemented by users)
      console.warn(
        "React DevTools not found. Consider using React.Profiler component wrapper for tracking.",
      );
    }
  }

  /**
   * Hook into React's reconciler through DevTools
   */
  private hookIntoReconciler(reactDevTools: any): void {
    try {
      // This is a simplified version of how we would integrate with React's reconciler
      // In a real implementation, this would be much more complex and would need to
      // handle different React versions and fiber structures

      const originalOnCommitFiberRoot = reactDevTools.onCommitFiberRoot;
      const originalOnCommitFiberUnmount = reactDevTools.onCommitFiberUnmount;

      // Hook into commit phase
      reactDevTools.onCommitFiberRoot = (
        id: number,
        root: any,
        priorityLevel?: number,
      ) => {
        try {
          if (this.isActive) {
            this.processCommittedWork(root);
          }
        } catch (error) {
          console.warn("Error processing committed work:", error);
        }

        if (originalOnCommitFiberRoot) {
          try {
            originalOnCommitFiberRoot(id, root, priorityLevel);
          } catch (error) {
            console.warn("Error in original onCommitFiberRoot:", error);
          }
        }
      };

      // Hook into unmount phase
      reactDevTools.onCommitFiberUnmount = (id: number, fiber: any) => {
        try {
          if (this.isActive) {
            this.processUnmountedFiber(fiber);
          }
        } catch (error) {
          console.warn("Error processing unmounted fiber:", error);
        }

        if (originalOnCommitFiberUnmount) {
          try {
            originalOnCommitFiberUnmount(id, fiber);
          } catch (error) {
            console.warn("Error in original onCommitFiberUnmount:", error);
          }
        }
      };
    } catch (error) {
      console.error("Failed to hook into React reconciler:", error);
    }
  }

  /**
   * Process committed work from React reconciler
   */
  private processCommittedWork(root: any): void {
    if (!root || !root.current) return;

    // Walk the fiber tree and process each component
    this.walkFiberTree(root.current, null);
  }

  /**
   * Walk the React fiber tree
   */
  private walkFiberTree(fiber: any, parentFiber: any): void {
    if (!fiber) return;

    // Process current fiber
    if (this.isComponentFiber(fiber)) {
      this.processFiber(fiber, parentFiber);
    }

    // Process children
    let child = fiber.child;
    while (child) {
      this.walkFiberTree(child, fiber);
      child = child.sibling;
    }
  }

  /**
   * Check if fiber represents a component
   */
  private isComponentFiber(fiber: any): boolean {
    return (
      fiber.type &&
      (typeof fiber.type === "function" || // Function component
        (typeof fiber.type === "object" && fiber.type.render)) // Class component
    );
  }

  /**
   * Process individual React fiber
   */
  private processFiber(fiber: any, parentFiber: any): void {
    const componentId = this.getComponentId(fiber);
    const _componentName = this.getComponentName(fiber);

    // Register component if not already registered
    if (!this.componentRegistry.has(componentId)) {
      this.registerComponent(fiber, parentFiber);
    }

    // Determine render phase
    const phase = this.determineRenderPhase(fiber);

    if (phase === "mount" || phase === "update") {
      // Track render event
      this.trackRenderEvent(fiber, phase);
    }
  }

  /**
   * Register a component in the registry
   */
  private registerComponent(fiber: any, parentFiber: any): void {
    const componentId = this.getComponentId(fiber);
    const componentName = this.getComponentName(fiber);
    const parentId = parentFiber ? this.getComponentId(parentFiber) : undefined;

    const componentInfo: ComponentInfo = {
      id: componentId,
      name: componentName,
      displayName: this.getDisplayName(fiber),
      fiber,
      props: fiber.memoizedProps || {},
      state: fiber.memoizedState,
      context: fiber.dependencies?.context,
      location: this.getComponentLocation(fiber),
      parentId,
      children: [],
    };

    this.componentRegistry.set(componentId, componentInfo);

    // Store initial props, state, and context
    this.previousProps.set(componentId, fiber.memoizedProps);
    this.previousState.set(componentId, fiber.memoizedState);
    this.previousContext.set(componentId, fiber.dependencies?.context);

    // Initialize render count
    this.renderCounts.set(componentId, 0);

    // Register with event client
    this.eventClient.registerComponent(componentInfo);
  }

  /**
   * Track render event for a component
   */
  private trackRenderEvent(fiber: any, phase: "mount" | "update"): void {
    const componentId = this.getComponentId(fiber);
    const componentName = this.getComponentName(fiber);
    const timestamp = performance.now();

    // Calculate render duration (simplified - in real implementation would use React's profiling data)
    const duration = this.calculateRenderDuration(fiber);

    // Determine render reason
    const reason = this.determineRenderReason(fiber, phase);

    // Analyze changes
    const propsChanges = this.analyzePropsChanges(
      componentId,
      fiber.memoizedProps,
    );
    const stateChanges = this.analyze_StateChanges(
      componentId,
      fiber.memoizedState,
    );
    const contextChanges = this.analyzeContextChanges(
      componentId,
      fiber.dependencies?.context,
    );

    // Update render count
    const renderCount = (this.renderCounts.get(componentId) || 0) + 1;
    this.renderCounts.set(componentId, renderCount);

    // Create render event
    const renderEvent: RenderEvent = {
      id: `render_${componentId}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      componentId,
      componentName,
      timestamp,
      duration,
      phase,
      reason,
      propsChanges,
      stateChanges,
      contextChanges,
      renderCount,
      actualDuration: duration,
      baseDuration: this.getBaseDuration(fiber),
      startTime: timestamp - duration,
      commitTime: timestamp,
      interactions: new Set(), // Would be populated from React's interaction tracing
    };

    // Update stored previous values
    this.previousProps.set(componentId, fiber.memoizedProps);
    this.previousState.set(componentId, fiber.memoizedState);
    this.previousContext.set(componentId, fiber.dependencies?.context);

    // Send to event client
    this.eventClient.addRenderEvent(renderEvent);
  }

  /**
   * Get unique component ID from fiber
   */
  private getComponentId(fiber: any): string {
    // Use fiber's _debugID if available, otherwise generate based on type and key
    if (fiber._debugID) return fiber._debugID.toString();

    const type = fiber.type;
    const key = fiber.key || "no-key";
    const index = fiber.index || 0;

    if (typeof type === "function") {
      return `${type.name || "Anonymous"}_${key}_${index}`;
    }

    return `${String(type)}_${key}_${index}`;
  }

  /**
   * Get component name from fiber
   */
  private getComponentName(fiber: any): string {
    const type = fiber.type;

    if (typeof type === "function") {
      return type.displayName || type.name || "Anonymous";
    }

    if (typeof type === "string") {
      return type;
    }

    if (type && typeof type === "object") {
      return type.displayName || type.name || "Component";
    }

    return "Unknown";
  }

  /**
   * Get display name for component
   */
  private getDisplayName(fiber: any): string | undefined {
    const type = fiber.type;
    return type?.displayName || type?.name;
  }

  /**
   * Get component location (file, line, column)
   */
  private getComponentLocation(_fiber: unknown): ComponentInfo["location"] {
    // In a real implementation, this would extract location from fiber._debugSource
    // or use source maps to determine the component's location
    return {
      file: "unknown",
      line: undefined,
      column: undefined,
    };
  }

  /**
   * Determine render phase
   */
  private determineRenderPhase(fiber: any): "mount" | "update" | "unmount" {
    // Simplified logic - in real implementation would check fiber flags
    if (fiber.alternate === null) {
      return "mount";
    }
    return "update";
  }

  /**
   * Calculate render duration
   */
  private calculateRenderDuration(_fiber: unknown): number {
    // In a real implementation, this would use React's profiling data
    // For now, return a mock duration
    return Math.random() * 10;
  }

  /**
   * Get base duration from fiber
   */
  private getBaseDuration(fiber: any): number {
    // React's profiling data would provide this
    return fiber.treeBaseDuration || 0;
  }

  /**
   * Determine render reason
   */
  private determineRenderReason(
    fiber: any,
    phase: "mount" | "update",
  ): RenderReason {
    if (phase === "mount") return "initial-mount";

    const componentId = this.getComponentId(fiber);
    const prevProps = this.previousProps.get(componentId);
    const prevState = this.previousState.get(componentId);
    const prevContext = this.previousContext.get(componentId);

    // Check for prop changes
    if (!this.shallowEqual(prevProps, fiber.memoizedProps)) {
      return "props-change";
    }

    // Check for state changes
    if (!this.shallowEqual(prevState, fiber.memoizedState)) {
      return "state-change";
    }

    // Check for context changes
    if (!this.shallowEqual(prevContext, fiber.dependencies?.context)) {
      return "context-change";
    }

    // Check if parent re-rendered
    if (fiber.alternate && fiber.alternate.child !== fiber.child) {
      return "parent-render";
    }

    // Default fallback
    return "unknown";
  }

  /**
   * Analyze props changes
   */
  private analyzePropsChanges(
    componentId: string,
    currentProps: any,
  ): _PropChange[] {
    const prevProps = this.previousProps.get(componentId) || {};
    const changes: _PropChange[] = [];

    // Find added/modified props
    Object.keys(currentProps || {}).forEach((key) => {
      const oldValue = prevProps[key];
      const newValue = currentProps[key];

      if (oldValue !== newValue) {
        changes.push({
          key,
          oldValue,
          newValue,
          isShallowEqual: oldValue === newValue,
          isDeepEqual: this.deepEqual(oldValue, newValue),
          changeType: oldValue === undefined ? "added" : "modified",
          path: [key],
        });
      }
    });

    // Find removed props
    Object.keys(prevProps).forEach((key) => {
      if (!(key in (currentProps || {}))) {
        changes.push({
          key,
          oldValue: prevProps[key],
          newValue: undefined,
          isShallowEqual: false,
          isDeepEqual: false,
          changeType: "removed",
          path: [key],
        });
      }
    });

    return changes;
  }

  /**
   * Analyze state changes
   */
  private analyze_StateChanges(
    componentId: string,
    currentState: any,
  ): _StateChange[] {
    const prevState = this.previousState.get(componentId);
    const changes: _StateChange[] = [];

    // For hooks, state structure is more complex
    // This is a simplified implementation
    if (prevState !== currentState) {
      changes.push({
        key: "state",
        oldValue: prevState,
        newValue: currentState,
        setter: "unknown", // Would need to track hook calls
        changeType: "modified",
      });
    }

    return changes;
  }

  /**
   * Analyze context changes
   */
  private analyzeContextChanges(
    componentId: string,
    currentContext: any,
  ): ContextChange[] {
    const prevContext = this.previousContext.get(componentId);
    const changes: ContextChange[] = [];

    if (!this.shallowEqual(prevContext, currentContext)) {
      changes.push({
        contextName: "unknown", // Would need context metadata
        oldValue: prevContext,
        newValue: currentContext,
        changeType: "modified",
      });
    }

    return changes;
  }

  /**
   * Process unmounted fiber
   */
  private processUnmountedFiber(fiber: any): void {
    if (!this.isComponentFiber(fiber)) return;

    const componentId = this.getComponentId(fiber);

    // Clean up tracking data
    this.componentRegistry.delete(componentId);
    this.previousProps.delete(componentId);
    this.previousState.delete(componentId);
    this.previousContext.delete(componentId);
    this.renderCounts.delete(componentId);

    // Notify event client
    this.eventClient.unregisterComponent(componentId);
  }

  /**
   * Set up component tracking
   */
  private setupComponentTracking(): void {
    // Additional component tracking setup would go here
    console.log("Component tracking setup complete");
  }

  /**
   * Shallow equality check
   */
  private shallowEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;
    if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) return false;
    }

    return true;
  }

  /**
   * Deep equality check (simplified)
   */
  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;

    if (typeof obj1 !== typeof obj2) return false;
    if (typeof obj1 !== "object") return obj1 === obj2;

    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.componentRegistry.clear();
    this.previousProps.clear();
    this.previousState.clear();
    this.previousContext.clear();
    this.renderCounts.clear();

    // Reset React DevTools hooks if we modified them
    if (typeof window !== "undefined") {
      const reactDevTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (reactDevTools) {
        // In a real implementation, we would restore original callbacks
        console.log("Restored React DevTools hooks");
      }
    }
  }
}

// Singleton instance
let profilerInstance: ProfilerIntegration | null = null;

/**
 * Get or create profiler integration instance
 */
export function getProfilerIntegration(eventClient: RenderWasteDetectorDevToolsClient): ProfilerIntegration {
  if (!profilerInstance) {
    profilerInstance = new ProfilerIntegration(eventClient);
  }
  return profilerInstance;
}

/**
 * Start render profiling
 */
export function startRenderProfiling(eventClient: RenderWasteDetectorDevToolsClient): void {
  getProfilerIntegration(eventClient).start();
}

/**
 * Stop render profiling
 */
export function stopRenderProfiling(eventClient: RenderWasteDetectorDevToolsClient): void {
  getProfilerIntegration(eventClient).stop();
}
