import type {
  RenderEvent,
  ComponentInfo,
  OptimizationSuggestion,
  PropChange,
  StateChange,
  SuggestionType,
  RenderMetrics,
} from "../types";

/**
 * Optimization engine for analyzing render waste and generating suggestions
 */
export class OptimizationEngine {
  private componentAnalysis = new Map<string, ComponentAnalysis>();

  /**
   * Analyze render events and generate optimization suggestions
   */
  analyzeSuggestionsFromEvents(
    events: RenderEvent[],
    components: Map<string, ComponentInfo>,
    metrics: Map<string, RenderMetrics>,
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    try {
      // Group events by component
      const eventsByComponent = this.groupEventsByComponent(events);

      // Analyze each component
      eventsByComponent.forEach((componentEvents, componentId) => {
        try {
          const component = components.get(componentId);
          const componentMetrics = metrics.get(componentId);

          if (!component || !componentMetrics) return;

          const analysis = this.analyzeComponent(
            componentEvents,
            component,
            componentMetrics,
          );
          this.componentAnalysis.set(componentId, analysis);

          // Generate suggestions based on analysis
          const componentSuggestions = this.generateSuggestionsForComponent(
            analysis,
            component,
          );
          suggestions.push(...componentSuggestions);
        } catch (error) {
          console.warn(`Failed to analyze component ${componentId}:`, error);
        }
      });
    } catch (error) {
      console.error("Failed to analyze suggestions from events:", error);
    }

    // Sort suggestions by impact
    return suggestions.sort(
      (a, b) => b.impact.performanceGain - a.impact.performanceGain,
    );
  }

  /**
   * Group render events by component ID
   */
  private groupEventsByComponent(
    events: RenderEvent[],
  ): Map<string, RenderEvent[]> {
    const grouped = new Map<string, RenderEvent[]>();

    events.forEach((event) => {
      const existing = grouped.get(event.componentId) || [];
      existing.push(event);
      grouped.set(event.componentId, existing);
    });

    return grouped;
  }

  /**
   * Analyze a component's render patterns
   */
  private analyzeComponent(
    events: RenderEvent[],
    component: ComponentInfo,
    metrics: RenderMetrics,
  ): ComponentAnalysis {
    const analysis: ComponentAnalysis = {
      componentId: component.id,
      componentName: component.name,
      totalRenders: events.length,
      unnecessaryRenders: 0,
      avgRenderTime: metrics.avgRenderTime,
      maxRenderTime: metrics.maxRenderTime,
      propChangePatterns: this.analyzePropChangePatterns(events),
      stateChangePatterns: this.analyzeStateChangePatterns(events),
      renderReasons: this.analyzeRenderReasons(events),
      frequentProps: this.identifyFrequentlyChangingProps(events),
      expensiveOperations: this.identifyExpensiveOperations(events),
      memoizationOpportunities: [],
      callbackOptimizations: [],
      structuralIssues: [],
    };

    // Calculate unnecessary renders
    analysis.unnecessaryRenders = events.filter((event) =>
      this.isUnnecessaryRender(event),
    ).length;

    // Identify optimization opportunities
    analysis.memoizationOpportunities =
      this.identifyMemoizationOpportunities(analysis);
    analysis.callbackOptimizations =
      this.identifyCallbackOptimizations(analysis);
    analysis.structuralIssues = this.identifyStructuralIssues(
      analysis,
      component,
    );

    return analysis;
  }

  /**
   * Analyze prop change patterns
   */
  private analyzePropChangePatterns(
    events: RenderEvent[],
  ): PropChangePattern[] {
    const patterns: Map<string, PropChangePattern> = new Map();

    events.forEach((event) => {
      event.propsChanges.forEach((propChange) => {
        const existing = patterns.get(propChange.key) || {
          propName: propChange.key,
          changeFrequency: 0,
          isShallowEqual: true,
          isDeepEqual: true,
          changeTypes: new Set(),
          valueTypes: new Set(),
        };

        existing.changeFrequency++;
        existing.isShallowEqual =
          existing.isShallowEqual && propChange.isShallowEqual;
        existing.isDeepEqual = existing.isDeepEqual && propChange.isDeepEqual;
        existing.changeTypes.add(propChange.changeType);
        existing.valueTypes.add(typeof propChange.newValue);

        patterns.set(propChange.key, existing);
      });
    });

    return Array.from(patterns.values());
  }

  /**
   * Analyze state change patterns
   */
  private analyzeStateChangePatterns(
    events: RenderEvent[],
  ): StateChangePattern[] {
    const patterns: Map<string, StateChangePattern> = new Map();

    events.forEach((event) => {
      event.stateChanges.forEach((stateChange) => {
        const existing = patterns.get(stateChange.key) || {
          stateKey: stateChange.key,
          changeFrequency: 0,
          setter: stateChange.setter,
          changeTypes: new Set(),
        };

        existing.changeFrequency++;
        existing.changeTypes.add(stateChange.changeType);

        patterns.set(stateChange.key, existing);
      });
    });

    return Array.from(patterns.values());
  }

  /**
   * Analyze render reasons
   */
  private analyzeRenderReasons(events: RenderEvent[]): Map<string, number> {
    const reasons = new Map<string, number>();

    events.forEach((event) => {
      const count = reasons.get(event.reason) || 0;
      reasons.set(event.reason, count + 1);
    });

    return reasons;
  }

  /**
   * Identify frequently changing props
   */
  private identifyFrequentlyChangingProps(events: RenderEvent[]): string[] {
    const propFrequency = new Map<string, number>();

    events.forEach((event) => {
      event.propsChanges.forEach((propChange) => {
        const count = propFrequency.get(propChange.key) || 0;
        propFrequency.set(propChange.key, count + 1);
      });
    });

    return Array.from(propFrequency.entries())
      .filter(([_, count]) => count > events.length * 0.5) // More than 50% of renders
      .map(([propName, _]) => propName);
  }

  /**
   * Identify expensive operations (based on render duration)
   */
  private identifyExpensiveOperations(
    events: RenderEvent[],
  ): ExpensiveOperation[] {
    const slowRenders = events.filter((event) => event.duration > 16); // > 16ms

    return slowRenders.map((event) => ({
      eventId: event.id,
      duration: event.duration,
      reason: event.reason,
      propsInvolved: event.propsChanges.map((pc) => pc.key),
    }));
  }

  /**
   * Check if a render was unnecessary
   */
  private isUnnecessaryRender(event: RenderEvent): boolean {
    return (
      (event.reason === "parent-render" &&
        event.propsChanges.length === 0 &&
        event.stateChanges.length === 0 &&
        event.contextChanges.length === 0) ||
      // Props changed but are shallow/deep equal
      (event.propsChanges.length > 0 &&
        event.propsChanges.every((change) => change.isDeepEqual))
    );
  }

  /**
   * Identify memoization opportunities
   */
  private identifyMemoizationOpportunities(
    analysis: ComponentAnalysis,
  ): MemoizationOpportunity[] {
    const opportunities: MemoizationOpportunity[] = [];

    // Check for expensive renders with stable inputs
    if (analysis.maxRenderTime > 16) {
      opportunities.push({
        type: "expensive-computation",
        confidence: 0.8,
        description:
          "Component has expensive renders that could benefit from memoization",
        relatedProps: analysis.frequentProps,
      });
    }

    // Check for frequent re-renders with same props
    const unnecessaryRenderRate =
      analysis.unnecessaryRenders / analysis.totalRenders;
    if (unnecessaryRenderRate > 0.3) {
      opportunities.push({
        type: "stable-props",
        confidence: 0.9,
        description: "Component re-renders frequently with identical props",
        relatedProps: [],
      });
    }

    // Check for object/array props that change reference but not value
    analysis.propChangePatterns.forEach((pattern) => {
      if (!pattern.isShallowEqual && pattern.isDeepEqual) {
        opportunities.push({
          type: "reference-instability",
          confidence: 0.7,
          description: `Prop '${pattern.propName}' changes reference but not value`,
          relatedProps: [pattern.propName],
        });
      }
    });

    return opportunities;
  }

  /**
   * Identify callback optimization opportunities
   */
  private identifyCallbackOptimizations(
    analysis: ComponentAnalysis,
  ): CallbackOptimization[] {
    const optimizations: CallbackOptimization[] = [];

    // Look for function props that change frequently
    analysis.propChangePatterns.forEach((pattern) => {
      if (pattern.valueTypes.has("function") && pattern.changeFrequency > 5) {
        optimizations.push({
          propName: pattern.propName,
          changeFrequency: pattern.changeFrequency,
          confidence: 0.8,
          description: `Function prop '${pattern.propName}' changes frequently, consider useCallback`,
        });
      }
    });

    return optimizations;
  }

  /**
   * Identify structural issues
   */
  private identifyStructuralIssues(
    analysis: ComponentAnalysis,
    component: ComponentInfo,
  ): StructuralIssue[] {
    const issues: StructuralIssue[] = [];

    // Too many renders suggesting component should be split
    if (analysis.totalRenders > 50) {
      issues.push({
        type: "component-too-complex",
        severity: "medium",
        description:
          "Component renders very frequently, consider splitting into smaller components",
        suggestion: "Extract stable parts into separate memoized components",
      });
    }

    // State updates causing child re-renders
    const parentRenderCount = analysis.renderReasons.get("parent-render") || 0;
    if (parentRenderCount > analysis.totalRenders * 0.6) {
      issues.push({
        type: "state-too-high",
        severity: "high",
        description: "Component re-renders frequently due to parent updates",
        suggestion: "Move state closer to components that actually need it",
      });
    }

    return issues;
  }

  /**
   * Generate optimization suggestions for a component
   */
  private generateSuggestionsForComponent(
    analysis: ComponentAnalysis,
    component: ComponentInfo,
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // React.memo suggestions
    if (analysis.unnecessaryRenders > 5) {
      suggestions.push(this.createReactMemoSuggestion(analysis, component));
    }

    // useMemo suggestions
    analysis.memoizationOpportunities.forEach((opportunity) => {
      if (opportunity.type === "expensive-computation") {
        suggestions.push(
          this.createUseMemoSuggestion(analysis, component, opportunity),
        );
      }
    });

    // useCallback suggestions
    analysis.callbackOptimizations.forEach((optimization) => {
      suggestions.push(
        this.createUseCallbackSuggestion(analysis, component, optimization),
      );
    });

    // Component splitting suggestions
    analysis.structuralIssues.forEach((issue) => {
      if (issue.type === "component-too-complex") {
        suggestions.push(
          this.createComponentSplitSuggestion(analysis, component, issue),
        );
      }

      if (issue.type === "state-too-high") {
        suggestions.push(
          this.createMoveStateDownSuggestion(analysis, component, issue),
        );
      }
    });

    // Object literal suggestions
    analysis.memoizationOpportunities.forEach((opportunity) => {
      if (opportunity.type === "reference-instability") {
        suggestions.push(
          this.createAvoidObjectLiteralSuggestion(
            analysis,
            component,
            opportunity,
          ),
        );
      }
    });

    return suggestions;
  }

  /**
   * Create React.memo suggestion
   */
  private createReactMemoSuggestion(
    analysis: ComponentAnalysis,
    component: ComponentInfo,
  ): OptimizationSuggestion {
    const wastePercentage =
      (analysis.unnecessaryRenders / analysis.totalRenders) * 100;

    return {
      id: `memo_${component.id}_${Date.now()}`,
      componentId: component.id,
      componentName: component.name,
      type: "react-memo",
      severity:
        wastePercentage > 50 ? "high" : wastePercentage > 30 ? "medium" : "low",
      title: `Wrap ${component.name} with React.memo`,
      description: `This component re-renders ${analysis.unnecessaryRenders} times unnecessarily (${wastePercentage.toFixed(1)}% waste). React.memo can prevent re-renders when props haven't changed.`,
      solution:
        "Wrap the component with React.memo to prevent unnecessary re-renders.",
      codeExample: `const ${component.name} = React.memo((props) => {
  // Your component code here
  return <div>...</div>;
});`,
      impact: {
        renderReduction: Math.min(90, wastePercentage),
        performanceGain: Math.min(80, wastePercentage * 0.8),
        complexity: "low",
      },
    };
  }

  /**
   * Create useMemo suggestion
   */
  private createUseMemoSuggestion(
    analysis: ComponentAnalysis,
    component: ComponentInfo,
    opportunity: MemoizationOpportunity,
  ): OptimizationSuggestion {
    return {
      id: `usememo_${component.id}_${Date.now()}`,
      componentId: component.id,
      componentName: component.name,
      type: "use-memo",
      severity: analysis.maxRenderTime > 50 ? "high" : "medium",
      title: `Use useMemo for expensive calculations in ${component.name}`,
      description: `This component has expensive renders (max: ${analysis.maxRenderTime.toFixed(1)}ms). Consider memoizing expensive calculations.`,
      solution: "Wrap expensive calculations in useMemo hook.",
      codeExample: `const expensiveValue = useMemo(() => {
  return computeExpensiveValue(${opportunity.relatedProps.join(", ")});
}, [${opportunity.relatedProps.join(", ")}]);`,
      impact: {
        renderReduction: 0,
        performanceGain: Math.min(70, analysis.maxRenderTime * 2),
        complexity: "low",
      },
      relatedProps: opportunity.relatedProps,
    };
  }

  /**
   * Create useCallback suggestion
   */
  private createUseCallbackSuggestion(
    analysis: ComponentAnalysis,
    component: ComponentInfo,
    optimization: CallbackOptimization,
  ): OptimizationSuggestion {
    return {
      id: `usecallback_${component.id}_${optimization.propName}_${Date.now()}`,
      componentId: component.id,
      componentName: component.name,
      type: "use-callback",
      severity: optimization.changeFrequency > 20 ? "high" : "medium",
      title: `Use useCallback for ${optimization.propName}`,
      description: `The function prop '${optimization.propName}' changes ${optimization.changeFrequency} times, causing child re-renders.`,
      solution:
        "Wrap the function with useCallback to maintain stable reference.",
      codeExample: `const ${optimization.propName} = useCallback((args) => {
  // Your function logic here
}, [/* dependencies */]);`,
      impact: {
        renderReduction: Math.min(60, optimization.changeFrequency * 2),
        performanceGain: Math.min(50, optimization.changeFrequency),
        complexity: "low",
      },
    };
  }

  /**
   * Create component splitting suggestion
   */
  private createComponentSplitSuggestion(
    analysis: ComponentAnalysis,
    component: ComponentInfo,
    issue: StructuralIssue,
  ): OptimizationSuggestion {
    return {
      id: `split_${component.id}_${Date.now()}`,
      componentId: component.id,
      componentName: component.name,
      type: "split-component",
      severity: "medium",
      title: `Consider splitting ${component.name}`,
      description: issue.description,
      solution: issue.suggestion,
      codeExample: `// Split into smaller components:
const ${component.name}Header = React.memo(() => <div>...</div>);
const ${component.name}Content = React.memo(() => <div>...</div>);

const ${component.name} = () => (
  <div>
    <${component.name}Header />
    <${component.name}Content />
  </div>
);`,
      impact: {
        renderReduction: 40,
        performanceGain: 35,
        complexity: "high",
      },
    };
  }

  /**
   * Create move state down suggestion
   */
  private createMoveStateDownSuggestion(
    analysis: ComponentAnalysis,
    component: ComponentInfo,
    issue: StructuralIssue,
  ): OptimizationSuggestion {
    return {
      id: `movestate_${component.id}_${Date.now()}`,
      componentId: component.id,
      componentName: component.name,
      type: "move-state-down",
      severity: "high",
      title: `Move state closer to where it's used`,
      description: issue.description,
      solution: "Move state to the most specific component that needs it.",
      codeExample: `// Instead of state in parent:
const Parent = () => {
  const [localState, setLocalState] = useState();
  return <Child localState={localState} setLocalState={setLocalState} />;
};

// Move state to child:
const Child = () => {
  const [localState, setLocalState] = useState();
  return <div>{localState}</div>;
};`,
      impact: {
        renderReduction: 60,
        performanceGain: 55,
        complexity: "medium",
      },
    };
  }

  /**
   * Create avoid object literal suggestion
   */
  private createAvoidObjectLiteralSuggestion(
    analysis: ComponentAnalysis,
    component: ComponentInfo,
    opportunity: MemoizationOpportunity,
  ): OptimizationSuggestion {
    return {
      id: `avoidobject_${component.id}_${Date.now()}`,
      componentId: component.id,
      componentName: component.name,
      type: "avoid-object-literal",
      severity: "medium",
      title: `Avoid inline object creation for ${opportunity.relatedProps.join(", ")}`,
      description:
        "Props are changing reference but not value, causing unnecessary re-renders.",
      solution: "Move object creation outside render or use useMemo.",
      codeExample: `// Instead of:
<Child style={{margin: 10}} />

// Use:
const style = useMemo(() => ({margin: 10}), []);
<Child style={style} />`,
      impact: {
        renderReduction: 30,
        performanceGain: 25,
        complexity: "low",
      },
      relatedProps: opportunity.relatedProps,
    };
  }
}

// Helper interfaces
interface ComponentAnalysis {
  componentId: string;
  componentName: string;
  totalRenders: number;
  unnecessaryRenders: number;
  avgRenderTime: number;
  maxRenderTime: number;
  propChangePatterns: PropChangePattern[];
  stateChangePatterns: StateChangePattern[];
  renderReasons: Map<string, number>;
  frequentProps: string[];
  expensiveOperations: ExpensiveOperation[];
  memoizationOpportunities: MemoizationOpportunity[];
  callbackOptimizations: CallbackOptimization[];
  structuralIssues: StructuralIssue[];
}

interface PropChangePattern {
  propName: string;
  changeFrequency: number;
  isShallowEqual: boolean;
  isDeepEqual: boolean;
  changeTypes: Set<string>;
  valueTypes: Set<string>;
}

interface StateChangePattern {
  stateKey: string;
  changeFrequency: number;
  setter: string;
  changeTypes: Set<string>;
}

interface ExpensiveOperation {
  eventId: string;
  duration: number;
  reason: string;
  propsInvolved: string[];
}

interface MemoizationOpportunity {
  type: "expensive-computation" | "stable-props" | "reference-instability";
  confidence: number;
  description: string;
  relatedProps: string[];
}

interface CallbackOptimization {
  propName: string;
  changeFrequency: number;
  confidence: number;
  description: string;
}

interface StructuralIssue {
  type: "component-too-complex" | "state-too-high";
  severity: "low" | "medium" | "high";
  description: string;
  suggestion: string;
}
