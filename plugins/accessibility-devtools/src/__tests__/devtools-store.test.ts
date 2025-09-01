import { describe, test, expect, beforeEach } from 'vitest';
import { useAccessibilityDevToolsStore } from '../core/devtools-store';

describe('Accessibility DevTools Store', () => {
  beforeEach(() => {
    // Reset store to initial state by dispatching a reset action
    const store = useAccessibilityDevToolsStore.getState();
    // We can't easily reset to initial state, so we'll test current state
  });

  test('should have correct initial state', () => {
    const state = useAccessibilityDevToolsStore.getState();
    
    expect(state.scanState.isScanning).toBe(false);
    expect(state.currentAudit).toBeNull();
    expect(state.scanOptions.config.wcagLevel).toBe('AA');
  });

  test('should have dispatch method', () => {
    const state = useAccessibilityDevToolsStore.getState();
    
    expect(typeof state.dispatch).toBe('function');
  });

  test('should allow dispatching scan start action', () => {
    const state = useAccessibilityDevToolsStore.getState();
    
    // Test that dispatch method exists and can be called
    expect(() => {
      state.dispatch({ type: 'scan/start' });
    }).not.toThrow();
  });

  test('should have helper methods', () => {
    const state = useAccessibilityDevToolsStore.getState();
    
    // Test that helper methods exist
    expect(typeof state.getFilteredIssues).toBe('function');
    expect(typeof state.startScanning).toBe('function');
    expect(typeof state.stopScanning).toBe('function');
  });

  test('should return empty filtered issues when no audit', () => {
    const state = useAccessibilityDevToolsStore.getState();
    const filteredIssues = state.getFilteredIssues();
    
    expect(Array.isArray(filteredIssues)).toBe(true);
    expect(filteredIssues).toHaveLength(0);
  });
});