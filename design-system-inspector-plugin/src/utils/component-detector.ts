import type { ReactComponentInfo } from '../types';

/**
 * Detect React component information from DOM elements
 */
export function getComponentInfo(element: Element): ReactComponentInfo | null {
  try {
    // Try to get React Fiber node
    const fiber = getReactFiber(element);
    if (!fiber) return null;

    const componentInfo = extractComponentInfo(fiber);
    return componentInfo;
  } catch (error) {
    console.warn('Failed to get component info:', error);
    return null;
  }
}

/**
 * Get React Fiber node from DOM element
 */
function getReactFiber(element: Element): any {
  // React attaches fiber to DOM elements with these keys
  const fiberKeys = Object.keys(element).filter(key => 
    key.startsWith('__reactFiber') || 
    key.startsWith('__reactInternalInstance')
  );

  if (fiberKeys.length === 0) {
    // Try looking up the tree for React components
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const parentKeys = Object.keys(parent).filter(key => 
        key.startsWith('__reactFiber') || 
        key.startsWith('__reactInternalInstance')
      );
      if (parentKeys.length > 0) {
        return (parent as any)[parentKeys[0]];
      }
      parent = parent.parentElement;
    }
    return null;
  }

  return (element as any)[fiberKeys[0]];
}

/**
 * Extract component information from React Fiber node
 */
function extractComponentInfo(fiber: any): ReactComponentInfo | null {
  let current = fiber;

  // Walk up the fiber tree to find a component
  while (current) {
    if (current.type && typeof current.type === 'function') {
      const componentName = getComponentName(current.type);
      if (componentName && !isBuiltInComponent(componentName)) {
        return {
          name: componentName,
          displayName: current.type.displayName || componentName,
          props: current.memoizedProps || {},
          fiber: current,
          source: getComponentSource(current.type),
        };
      }
    }

    // Check for class components
    if (current.stateNode && current.stateNode.constructor) {
      const componentName = getComponentName(current.stateNode.constructor);
      if (componentName && !isBuiltInComponent(componentName)) {
        return {
          name: componentName,
          displayName: current.stateNode.constructor.displayName || componentName,
          props: current.memoizedProps || {},
          fiber: current,
          source: getComponentSource(current.stateNode.constructor),
        };
      }
    }

    current = current.return;
  }

  return null;
}

/**
 * Get component name from function or class
 */
function getComponentName(component: any): string {
  if (!component) return '';

  // Check displayName first
  if (component.displayName) {
    return component.displayName;
  }

  // Check name property
  if (component.name) {
    return component.name;
  }

  // Try to extract from function string
  const functionString = component.toString();
  const match = functionString.match(/^function\s+([A-Z][A-Za-z0-9_]*)/);
  if (match) {
    return match[1];
  }

  // Try to extract from arrow function
  const arrowMatch = functionString.match(/^(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=/);
  if (arrowMatch) {
    return arrowMatch[1];
  }

  return 'Anonymous';
}

/**
 * Check if component is a built-in HTML element
 */
function isBuiltInComponent(componentName: string): boolean {
  // Common built-in components to filter out
  const builtInComponents = new Set([
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'button', 'input', 'form', 'label', 'select',
    'option', 'textarea', 'ul', 'ol', 'li', 'table', 'tr', 'td',
    'th', 'thead', 'tbody', 'nav', 'header', 'footer', 'main',
    'section', 'article', 'aside', 'svg', 'path', 'g', 'circle',
    'rect', 'line', 'polygon', 'text', 'Fragment', 'React.Fragment',
  ]);

  return builtInComponents.has(componentName) || 
         componentName.toLowerCase() === componentName; // Built-in components are lowercase
}

/**
 * Get component source information
 */
function getComponentSource(component: any): { fileName?: string; lineNumber?: number; columnNumber?: number } | undefined {
  try {
    // Try to get source from React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.renderers && hook.renderers.size > 0) {
        // This is a simplified approach - real implementation would need
        // to work with React DevTools backend
        return extractSourceFromStack(component);
      }
    }

    return extractSourceFromStack(component);
  } catch (error) {
    return undefined;
  }
}

/**
 * Extract source information from stack trace
 */
function extractSourceFromStack(component: any): { fileName?: string; lineNumber?: number; columnNumber?: number } | undefined {
  try {
    // Create an error to get stack trace
    const error = new Error();
    const stack = error.stack;
    
    if (!stack) return undefined;

    // Parse stack trace to find component definition
    const lines = stack.split('\n');
    for (const line of lines) {
      // Look for webpack or source file references
      const match = line.match(/at\s+.*?\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        const [, fileName, lineNumber, columnNumber] = match;
        
        // Filter out framework files
        if (!fileName.includes('node_modules') && 
            !fileName.includes('react-dom') &&
            !fileName.includes('react.')) {
          return {
            fileName: fileName.split('/').pop(), // Just the filename
            lineNumber: parseInt(lineNumber, 10),
            columnNumber: parseInt(columnNumber, 10),
          };
        }
      }
    }
    
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Track component usage across renders
 */
export function trackComponentUsage(element: Element): void {
  const componentInfo = getComponentInfo(element);
  if (!componentInfo) return;

  // Send to design system client for tracking
  const event = new CustomEvent('design-system:component-usage', {
    detail: {
      component: componentInfo,
      element,
      timestamp: Date.now(),
    },
  });
  
  window.dispatchEvent(event);
}

/**
 * Set up observers for component tracking
 */
export function setupComponentObserver(): { disconnect: () => void } {
  let isObserving = false;
  let observer: MutationObserver;

  const startObserving = () => {
    if (isObserving) return;
    isObserving = true;

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Track newly added components
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              trackComponentUsage(element);
              
              // Check child elements too
              const childComponents = element.querySelectorAll('*');
              for (const child of Array.from(childComponents)) {
                trackComponentUsage(child);
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also track existing components on first run
    setTimeout(() => {
      const allElements = document.querySelectorAll('*');
      for (const element of Array.from(allElements)) {
        trackComponentUsage(element);
      }
    }, 100);
  };

  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
  } else {
    startObserving();
  }

  return {
    disconnect: () => {
      if (observer) {
        observer.disconnect();
        isObserving = false;
      }
    },
  };
}

/**
 * Get all React components currently in the DOM
 */
export function getAllComponents(): ReactComponentInfo[] {
  const components: ReactComponentInfo[] = [];
  const seen = new Set<string>();
  
  const elements = document.querySelectorAll('*');
  for (const element of Array.from(elements)) {
    const componentInfo = getComponentInfo(element);
    if (componentInfo) {
      const key = `${componentInfo.name}-${componentInfo.displayName}`;
      if (!seen.has(key)) {
        seen.add(key);
        components.push(componentInfo);
      }
    }
  }
  
  return components;
}

/**
 * Get component props usage statistics
 */
export function getComponentPropsStats(componentName: string): {
  prop: string;
  values: { value: string; count: number; percentage: number }[];
  totalUsage: number;
}[] {
  const elements = document.querySelectorAll('*');
  const propUsage = new Map<string, Map<string, number>>();
  let totalComponents = 0;
  
  for (const element of Array.from(elements)) {
    const componentInfo = getComponentInfo(element);
    if (componentInfo && componentInfo.name === componentName) {
      totalComponents++;
      
      for (const [propName, propValue] of Object.entries(componentInfo.props)) {
        if (!propUsage.has(propName)) {
          propUsage.set(propName, new Map());
        }
        
        const valueString = JSON.stringify(propValue);
        const valueMap = propUsage.get(propName)!;
        valueMap.set(valueString, (valueMap.get(valueString) || 0) + 1);
      }
    }
  }
  
  const stats = Array.from(propUsage.entries()).map(([prop, valueMap]) => {
    const values = Array.from(valueMap.entries())
      .map(([value, count]) => ({
        value,
        count,
        percentage: (count / totalComponents) * 100,
      }))
      .sort((a, b) => b.count - a.count);
    
    const totalUsage = values.reduce((sum, v) => sum + v.count, 0);
    
    return {
      prop,
      values,
      totalUsage,
    };
  });
  
  return stats.sort((a, b) => b.totalUsage - a.totalUsage);
}

// Extend window type for React DevTools
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
  }
}