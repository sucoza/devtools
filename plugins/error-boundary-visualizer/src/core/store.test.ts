import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useErrorBoundaryDevTools } from './store';
import type { ComponentTreeNode } from '../types';

// Mock Zustand devtools middleware
vi.mock('zustand/middleware', () => ({
  devtools: (fn: any) => fn,
  subscribeWithSelector: (fn: any) => fn,
}));

/**
 * Tests for calculateCoverage in the Error Boundary DevTools Store.
 *
 * Focuses on edge cases around tree traversal and the guard for
 * Array.isArray(node.children) that was added to handle malformed nodes.
 */
describe('Error Boundary DevTools Store - calculateCoverage edge cases', () => {
  beforeEach(() => {
    useErrorBoundaryDevTools.getState().clearErrors();
    useErrorBoundaryDevTools.getState().updateComponentTree(null as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 0 when no component tree is set', () => {
    useErrorBoundaryDevTools.getState().updateComponentTree(null as any);
    const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
    expect(coverage).toBe(0);
  });

  it('should return 100 when all components have error boundaries', () => {
    const tree: ComponentTreeNode = {
      id: 'root',
      name: 'App',
      type: 'component',
      hasErrorBoundary: true,
      children: [
        {
          id: 'child1',
          name: 'Child1',
          type: 'component',
          hasErrorBoundary: true,
          children: [],
          props: {},
          errors: [],
          depth: 1,
          path: 'App > Child1',
        },
        {
          id: 'child2',
          name: 'Child2',
          type: 'component',
          hasErrorBoundary: true,
          children: [],
          props: {},
          errors: [],
          depth: 1,
          path: 'App > Child2',
        },
      ],
      props: {},
      errors: [],
      depth: 0,
      path: 'App',
    };

    useErrorBoundaryDevTools.getState().updateComponentTree(tree);
    const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
    expect(coverage).toBe(100);
  });

  it('should return correct percentage for mixed coverage', () => {
    const tree: ComponentTreeNode = {
      id: 'root',
      name: 'App',
      type: 'component',
      hasErrorBoundary: true,
      children: [
        {
          id: 'child1',
          name: 'Child1',
          type: 'component',
          hasErrorBoundary: false,
          children: [],
          props: {},
          errors: [],
          depth: 1,
          path: 'App > Child1',
        },
        {
          id: 'child2',
          name: 'Child2',
          type: 'component',
          hasErrorBoundary: true,
          children: [],
          props: {},
          errors: [],
          depth: 1,
          path: 'App > Child2',
        },
      ],
      props: {},
      errors: [],
      depth: 0,
      path: 'App',
    };

    useErrorBoundaryDevTools.getState().updateComponentTree(tree);
    const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
    // 2 out of 3 components have error boundaries
    expect(coverage).toBeCloseTo(66.67, 1);
  });

  it('should return 0 when no components have error boundaries', () => {
    const tree: ComponentTreeNode = {
      id: 'root',
      name: 'App',
      type: 'component',
      hasErrorBoundary: false,
      children: [
        {
          id: 'child1',
          name: 'Child1',
          type: 'component',
          hasErrorBoundary: false,
          children: [],
          props: {},
          errors: [],
          depth: 1,
          path: 'App > Child1',
        },
      ],
      props: {},
      errors: [],
      depth: 0,
      path: 'App',
    };

    useErrorBoundaryDevTools.getState().updateComponentTree(tree);
    const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
    expect(coverage).toBe(0);
  });

  it('should handle nodes with empty children arrays', () => {
    const tree: ComponentTreeNode = {
      id: 'root',
      name: 'App',
      type: 'component',
      hasErrorBoundary: true,
      children: [],
      props: {},
      errors: [],
      depth: 0,
      path: 'App',
    };

    useErrorBoundaryDevTools.getState().updateComponentTree(tree);
    const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
    // 1 out of 1 = 100%
    expect(coverage).toBe(100);
  });

  it('should handle deeply nested trees', () => {
    const tree: ComponentTreeNode = {
      id: 'root',
      name: 'App',
      type: 'component',
      hasErrorBoundary: true,
      children: [
        {
          id: 'level1',
          name: 'Level1',
          type: 'component',
          hasErrorBoundary: false,
          children: [
            {
              id: 'level2',
              name: 'Level2',
              type: 'component',
              hasErrorBoundary: true,
              children: [
                {
                  id: 'level3',
                  name: 'Level3',
                  type: 'component',
                  hasErrorBoundary: false,
                  children: [],
                  props: {},
                  errors: [],
                  depth: 3,
                  path: 'App > Level1 > Level2 > Level3',
                },
              ],
              props: {},
              errors: [],
              depth: 2,
              path: 'App > Level1 > Level2',
            },
          ],
          props: {},
          errors: [],
          depth: 1,
          path: 'App > Level1',
        },
      ],
      props: {},
      errors: [],
      depth: 0,
      path: 'App',
    };

    useErrorBoundaryDevTools.getState().updateComponentTree(tree);
    const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
    // 2 out of 4 components have error boundaries (App, Level2)
    expect(coverage).toBe(50);
  });

  it('should handle nodes with missing children gracefully (the Array.isArray guard)', () => {
    // Simulate a malformed node where children is not an array.
    // The fix added an Array.isArray() check to prevent crashing.
    const tree = {
      id: 'root',
      name: 'App',
      type: 'component' as const,
      hasErrorBoundary: true,
      children: undefined as any, // Malformed: missing children
      props: {},
      errors: [],
      depth: 0,
      path: 'App',
    } as ComponentTreeNode;

    useErrorBoundaryDevTools.getState().updateComponentTree(tree);

    // Should not throw and should count only the root node
    const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
    expect(coverage).toBe(100);
  });

  it('should handle nodes with null children gracefully', () => {
    const tree = {
      id: 'root',
      name: 'App',
      type: 'component' as const,
      hasErrorBoundary: false,
      children: null as any, // Malformed: null children
      props: {},
      errors: [],
      depth: 0,
      path: 'App',
    } as ComponentTreeNode;

    useErrorBoundaryDevTools.getState().updateComponentTree(tree);
    const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
    // Only root, no error boundary
    expect(coverage).toBe(0);
  });

  it('should handle nodes with non-array children gracefully', () => {
    const tree = {
      id: 'root',
      name: 'App',
      type: 'component' as const,
      hasErrorBoundary: true,
      children: 'not-an-array' as any, // Malformed: string instead of array
      props: {},
      errors: [],
      depth: 0,
      path: 'App',
    } as ComponentTreeNode;

    useErrorBoundaryDevTools.getState().updateComponentTree(tree);

    // Should not throw - the Array.isArray guard skips non-array children
    const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
    expect(coverage).toBe(100);
  });

  it('should handle mixed valid and malformed children in the same tree', () => {
    const tree: ComponentTreeNode = {
      id: 'root',
      name: 'App',
      type: 'component',
      hasErrorBoundary: true,
      children: [
        {
          id: 'valid-child',
          name: 'ValidChild',
          type: 'component',
          hasErrorBoundary: false,
          children: [],
          props: {},
          errors: [],
          depth: 1,
          path: 'App > ValidChild',
        },
        {
          id: 'malformed-child',
          name: 'MalformedChild',
          type: 'component',
          hasErrorBoundary: true,
          children: undefined as any, // Malformed
          props: {},
          errors: [],
          depth: 1,
          path: 'App > MalformedChild',
        } as ComponentTreeNode,
      ],
      props: {},
      errors: [],
      depth: 0,
      path: 'App',
    };

    useErrorBoundaryDevTools.getState().updateComponentTree(tree);
    const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
    // 2 out of 3 have error boundaries (App, MalformedChild)
    expect(coverage).toBeCloseTo(66.67, 1);
  });
});
